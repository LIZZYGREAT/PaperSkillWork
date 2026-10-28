import { LIFECYCLE_GEOMETRY, LIFECYCLE_CLIPS, lifecycleSceneAt, mix, windowAt } from "./lifecycle-model";
import SceneTransport, { useSceneTimeline } from "./SceneTransport";
import "./animation.css";
import "./lifecycle.css";

const G = LIFECYCLE_GEOMETRY;
const PIXELS = ["01100110", "11111111", "10111101", "11111111", "01111110", "00111100", "00011000", "00000000"];
const NEW_PIXELS = ["00111100", "01111110", "11011011", "11111111", "01111110", "00111100", "00100100", "00000000"];

const NARRATION = [
  "原图 x₁ 留在数据来源处，本次增强视图沿虚线通道滑入网络左侧的输入插槽。标签 y₁ 另行提供分类监督。",
  "信号按层传递，三根分数柱依次升起：猫 2、狗 1、狐狸 0。这发生在任何参数更新之前。",
  "在每个柱顶复制出空心方块，方块下落到独立的冻结块；柱顶的圆点仍在原处，θ 没有变化。",
  "用当前 CE 反传一次：一条梯度虚线进入顶部参数端口，θᵢ 变为 θᵢ₊₁。冻结块全程保持 (2,1,0)。",
  "更新完成后，原图缩略与冻结块装配成候选记录，落入空槽 slot 0，N 从 0 变为 1。",
  "下一步先从已有记忆读取 x₁@i：槽内记录不动，读出的视图重新增强，滑入第二个输入插槽。",
  "历史方块落到各自柱顶，与当前圆点在同一刻度上对齐；差值折成平方贡献 1、1、0，总和为 2。",
  "当前 CE 与 α 倍历史匹配损失合并为一次联合更新。历史记录保持原样；这里停在 x₂ 候选写入之前。",
];

const pathD = (points: readonly { x: number; y: number }[]) =>
  `M${points[0].x} ${points[0].y}C${points[1].x} ${points[1].y} ${points[2].x} ${points[2].y} ${points[3].x} ${points[3].y}`;

function pixelRects(pattern: string[], x: number, y: number, size: number, pad: number, key: string) {
  const cell = (size - pad * 2) / 8;
  const out: React.ReactNode[] = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (pattern[r][c] === "1")
    out.push(<rect key={`${key}-${r}-${c}`} x={x + pad + c * cell} y={y + pad + r * cell} width={cell - 1.1} height={cell - 1.1} rx="0.7" className="lc-pixel" />);
  return out;
}

function SampleCard({ size, pattern = PIXELS, crop = false, opacity = 1, id }: {
  size: number; pattern?: string[]; crop?: boolean; opacity?: number; id?: string;
}) {
  const corners = [[7, 7, 1, 1], [size - 7, 7, -1, 1], [7, size - 7, 1, -1], [size - 7, size - 7, -1, -1]];
  return <g opacity={opacity} data-sample-object={id}>
    <rect width={size} height={size} rx={size > 70 ? 10 : 8} className="lc-card-surface" />
    {pixelRects(pattern, 0, 0, size, 12, id || "s")}
    {crop && corners.map(([cx, cy, sx, sy], i) => <path key={i} d={`M${cx} ${cy + 8 * sy}V${cy}H${cx + 8 * sx}`} className="lc-crop" />)}
  </g>;
}

// ---------------------------------------------------------------- network
const COLUMN_COUNTS = [3, 5, 3];
const COLUMN_SPACING = [84, 45, 68];

function Network({ theta, updated, active, lens, showPort }: {
  theta: string; updated: boolean; active: number; lens: number; showPort: boolean;
}) {
  const { x, y, w, h } = G.model;
  const gap = 26;
  const lw = (w - 64 - gap * 2) / 3;
  const centers = [0, 1, 2].map(i => x + 32 + i * (lw + gap) + lw / 2);
  const middle = y + 72 + (h - 122) / 2;
  const ys = COLUMN_COUNTS.map((count, i) => {
    const step = COLUMN_SPACING[i];
    return Array.from({ length: count }, (_, k) => middle + (k - (count - 1) / 2) * step);
  });
  const edges: React.ReactNode[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < ys.length - 1; i++) {
    const take = i === 0 ? 3 : 2;
    ys[i].forEach((yl, k) => {
      const nearest = ys[i + 1].map((yr, j) => [Math.abs(yr - yl), j] as const)
        .sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, take).map(([, j]) => j);
      for (const j of nearest) {
        const key = `${i}:${k}:${j}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push(<line key={key} x1={centers[i]} y1={yl} x2={centers[i + 1]} y2={ys[i + 1][j]} className={i === active ? "lc-edge is-hot" : "lc-edge"} />);
      }
    });
  }
  const headOpacity = Math.max(0, 1 - lens * 1.3);
  return <g data-current-model>
    {updated && <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx="22" className="lc-update-ring" />}
    <rect x={x} y={y} width={w} height={h} rx="16" className={updated ? "lc-model-card is-updated" : "lc-model-card"} />
    <g opacity={headOpacity}>
      <text x={x + 22} y={y + 32} className="lc-model-title">当前模型</text>
      <text x={x + 96} y={y + 32} className="lc-small">结构示意</text>
      <rect x={x + w - 88} y={y + 15} width="66" height="26" rx="8" className={updated ? "lc-theta is-updated" : "lc-theta"} />
      <text x={x + w - 55} y={y + 32} textAnchor="middle" className="lc-theta-label" data-parameter>{theta}</text>
      <path d={`M${x + 22} ${y + 50}H${x + w - 22}`} className="lc-rule" />
    </g>
    {edges}
    {ys.map((column, i) => column.map((cy, k) => (
      <circle key={`n-${i}-${k}`} cx={centers[i]} cy={cy} r="5.2" className={i === active ? "lc-node is-lit" : "lc-node"} />
    )))}
    {[0, 1, 2].map(i => <text key={`l-${i}`} x={centers[i]} y={y + h - 24} textAnchor="middle" className="lc-col-label" opacity={Math.max(0, 1 - lens)}>{["特征层", "特征层", "分类头"][i]}</text>)}
    {showPort && <rect x={556} y={100} width="9" height="9" rx="2" className="lc-port is-update" />}
  </g>;
}

function Sockets({ current, replay, lens }: { current: number; replay: number; lens: number }) {
  const socket = (y: number, docked: number) => <g key={y} opacity={1 - lens}>
    <rect x={G.model.x - 8} y={y - 11} width="16" height="22" rx="6" className={docked > 0.5 ? "lc-socket is-docked" : "lc-socket"} />
    <path d={`M${G.model.x - 2} ${y - 6}v12`} className="lc-socket-slit" opacity={0.35 + docked * 0.5} />
  </g>;
  return <g data-input-sockets>{socket(G.ports.current, current)}{socket(G.ports.replay, replay)}</g>;
}

// ---------------------------------------------------------------- score tiles
function ScoreTiles({ s, data, header, subline, step, reveal }: {
  s: ReturnType<typeof lifecycleSceneAt>; data: { name: string; v: number }[]; header: string; subline: string;
  step: string; reveal: number[];
}) {
  const { tiles, tileX, lens } = s;
  const headOpacity = Math.max(0, 1 - lens * 1.4);
  return <g data-response-plot>
    <g opacity={headOpacity}>
      <text x={G.tiles.x} y={132} className="lc-plot-title">{header}</text>
      <rect x={G.tiles.x + header.length * 16 + 6} y={118} width="26" height="20" rx="5" className="lc-step-chip" />
      <text x={G.tiles.x + header.length * 16 + 19} y={132} textAnchor="middle" className="lc-step-label">{step}</text>
      <text x={G.tiles.x} y={152} className="lc-small">{subline}</text>
    </g>
    {data.map((row, k) => {
      const x = tileX(k), y = tiles.y, w = tiles.w, h = tiles.h;
      return <g key={`tile-${k}`}>
        <rect x={x} y={y} width={w} height={h} rx="12" className="lc-score-tile" opacity={0.35 + reveal[k] * 0.65} />
        <text x={x + w / 2} y={y + 22} textAnchor="middle" className="lc-tile-class">{row.name}</text>
        <text x={x + w / 2} y={y + 62} textAnchor="middle" className="lc-tile-value" data-current-point={k} data-a={row.v} opacity={reveal[k]}>{row.v}</text>
        {[0, 1].map(i => <circle key={i} cx={x + w / 2 - 9 + i * 18} cy={y + h - 18} r="4"
          className={i < row.v ? "lc-level is-on" : "lc-level"} opacity={0.4 + reveal[k] * 0.6} />)}
      </g>;
    })}
  </g>;
}

// ---------------------------------------------------------------- frozen block
function FrozenBlock({ rect, z, opacity = 1, note, label, values = true, inRecord = false, markersOpacity = 1 }: {
  rect: { x: number; y: number; w: number; h: number }; z: readonly number[]; opacity?: number;
  note: string; label: string; values?: boolean; inRecord?: boolean; markersOpacity?: number;
}) {
  const { x, y, w, h } = rect;
  const cw = (w - 26) / 3;
  return <g opacity={opacity} transform={`translate(${x} ${y})`}
    data-history-z={inRecord ? undefined : "2,1,0"} data-target-id={inRecord ? undefined : "target:x1:i"}>
    <rect width={w} height={h} rx="11" className="lc-frozen-block" />
    <rect x={7} y={24} width={w - 14} height={Math.max(10, h - 31)} rx="7" className="lc-frozen-hatch" />
    <text x={13} y={18} className="lc-frozen-title">{label}</text>
    <text x={w - 13} y={18} textAnchor="end" className="lc-frozen-note">{note}</text>
    {[0, 1, 2].map(k => <g key={`fv-${k}`}>
      <text x={13 + cw * k + cw / 2} y={h - 32} textAnchor="middle" className="lc-frozen-class">{["猫", "狗", "狐狸"][k]}</text>
      <rect x={13 + cw * k + cw / 2 - 26} y={h - 26} width="11" height="11" rx="1.2" className="lc-history-mark" opacity={markersOpacity} data-frozen-point={k} />
      {values && <text x={13 + cw * k + cw / 2 - 9} y={h - 15} className="lc-frozen-value">{z[k]}</text>}
    </g>)}
  </g>;
}

// ---------------------------------------------------------------- memory
function MemoryBand({ count, hasRecord, record, block, recordNote, dim, slotNote, z }: {
  count: number; hasRecord: boolean; record: { x: number; y: number }; block: { x: number; y: number; w: number; h: number };
  recordNote: string; dim: number; slotNote: string | null; z: readonly number[];
}) {
  return <g opacity={1 - dim * 0.4}>
    <rect x={G.band.x} y={G.band.y} width={G.band.w} height={G.band.h} rx="16" className="lc-band" />
    <text x={G.band.x + 24} y={G.band.y + 36} className="lc-band-title">记忆 M</text>
    <text x={G.band.x + 24} y={G.band.y + 57} className="lc-small">只保存响应</text>
    <text x={G.band.x + 24} y={G.band.y + 74} className="lc-small">记录 = 原图 + z</text>
    {[0, 1].map(i => {
      const sx = G.slot0.x + i * 360;
      const on = i === 0 && hasRecord;
      return <g key={`slot-${i}`}>
        <rect x={sx} y={G.slot0.y} width={G.slot0.w} height={G.slot0.h} rx="12" className={on ? "lc-slot is-filled" : "lc-slot"} />
        <text x={sx + 2} y={G.slot0.y - 9} className="lc-slot-label">slot {i}</text>
        {i === 0 && slotNote && <text x={sx + 44} y={G.slot0.y - 9} className="lc-slot-note is-accent">{slotNote}</text>}
      </g>;
    })}
    <text x={1046} y={G.band.y + 34} textAnchor="end" className="lc-counter-label">已存</text>
    <text x={1046} y={G.band.y + 78} textAnchor="end" className="lc-counter" data-memory-count-value>{count}</text>
    <text x={1046} y={G.band.y + 98} textAnchor="end" className="lc-counter-unit">K = 2</text>
    {hasRecord && <g transform={`translate(${record.x} ${record.y})`} data-in-memory="true" data-record-id="record:x1:i" data-history-z="2,1,0">
      <rect width={G.record.w} height={G.record.h} rx="10" className="lc-record-card" />
      <text x="12" y="20" className="lc-record-id">x₁ @ i</text>
      <text x={G.record.w - 12} y="20" textAnchor="end" className="lc-record-note">{recordNote}</text>
      <rect x="12" y="36" width="44" height="44" rx="6" className="lc-thumb" />
      {pixelRects(PIXELS, 12, 36, 44, 5, "thumb")}
      <g transform={`translate(${block.x - record.x} ${block.y - record.y})`}>
        <FrozenBlock rect={{ x: 0, y: 0, w: block.w, h: block.h }} z={z} note="x₁ @ i" label="z₁ 冻结" inRecord />
      </g>
    </g>}
  </g>;
}

// ---------------------------------------------------------------- comparison extras
function Comparison({ s }: { s: ReturnType<typeof lifecycleSceneAt> }) {
  const { tiles, tileX } = s;
  const { squares, sum, difference, match, joint } = s;
  return <g opacity={s.lens} data-comparison>
    <g opacity={s.lens}>
      <text x={300} y={82} className="lc-compare-title">同类、同尺度比较</text>
      <text x={300} y={102} className="lc-small">冻结值保持原值；可反传的是当前输出</text>
      <circle cx={880} cy={78} r="6.5" className="lc-bead" />
      <text x={894} y={83} className="lc-legend-label">本次 aⱼ</text>
      <rect x={962} y="71.5" width="13" height="13" rx="1.5" className="lc-history-mark" />
      <text x={982} y={83} className="lc-legend-label">历史 z₁ 冻结</text>
    </g>
    {[0, 1, 2].map(k => {
      const x = tileX(k), y = tiles.y, w = tiles.w, h = tiles.h;
      const d = match.differences[k];
      return <g key={`cmp-${k}`}>
        <rect x={x} y={y} width={w} height={h} rx="14" className="lc-score-tile is-compare" />
        <text x={x + w / 2} y={y + 24} textAnchor="middle" className="lc-tile-class">{["猫", "狗", "狐狸"][k]}</text>
        <rect x={x + 16} y={y + 46} width="16" height="16" rx="1.5" className="lc-history-mark" />
        <text x={x + 42} y={y + 62} className="lc-tile-row">{match.z[k]}</text>
        <circle cx={x + 24} cy={y + 94} r="6.5" className="lc-bead" />
        <text x={x + 42} y={y + 102} className="lc-tile-row is-current">{match.a[k]}</text>
        {d !== 0
          ? <g opacity={difference}><text x={x + w - 16} y={y + 86} textAnchor="end" className="lc-tile-delta">{d > 0 ? `+${d}` : `−${Math.abs(d)}`}</text></g>
          : <text x={x + w - 16} y={y + 86} textAnchor="end" className="lc-tile-delta is-zero">重合</text>}
        {squares > 0.01 && <text x={x + w / 2} y={y + h + 26} textAnchor="middle" className="lc-contrib" opacity={squares}>
          {d === 0 ? "0² = 0" : `(${d > 0 ? d : `−${Math.abs(d)}`})² = ${match.squares[k]}`}
        </text>}
      </g>;
    })}
    <g opacity={sum}>
      <text x={1000} y={306} textAnchor="end" className="lc-ldark" data-loss={match.squaredDistance}>L<tspan baselineShift="sub" fontSize="0.62em">dark</tspan> = 1 + 1 + 0 = 2</text>
    </g>
    <g opacity={windowAt(joint, 0.05, 0.5)}>
      <rect x={300} y={396} width={400} height="44" rx="10" className="lc-join-chip" />
      <text x={500} y={419} textAnchor="middle" className="lc-join-title">L<tspan baselineShift="sub" fontSize="0.62em">j</tspan> = CE(x₂, y₂) + α · L<tspan baselineShift="sub" fontSize="0.62em">dark</tspan></text>
      <text x={500} y={434} textAnchor="middle" className="lc-join-note">两条损失只反传一次</text>
      <path d="M300 419C272 419 232 384 190 330" className="lc-gradient" />
      <text x={248} y={404} className="lc-gradient-label">∇θ</text>
    </g>
  </g>;
}

export default function SampleLifecyclePrototype() {
  const timeline = useSceneTimeline(LIFECYCLE_CLIPS, true);
  const { clipIndex: clip, progress } = timeline.state;
  const s = lifecycleSceneAt(clip, progress);
  const scale = mix(1, G.anchor.w / G.model.w, s.lens);
  const tx = mix(0, G.anchor.x - G.model.x * scale, s.lens);
  const ty = mix(0, G.anchor.y - G.model.y * scale, s.lens);
  const updateRing = clip === 3 || (clip === 7 && s.updated > 0.5);
  const plotData = s.later
    ? [{ name: "猫", v: 1 }, { name: "狗", v: 2 }, { name: "狐狸", v: 0 }]
    : [{ name: "猫", v: 2 }, { name: "狗", v: 1 }, { name: "狐狸", v: 0 }];
  const slotNote = s.stored ? (s.later ? "读取中" : "刚写入") : null;

  return <section id="review-lifecycle" className="review-scene motion-scene lifecycle-scene" data-scene="lifecycle"
    data-clip={clip} data-progress={progress} data-status={timeline.state.status} data-memory-count={s.memoryCount}
    data-seen={s.seen} data-update-count={s.updateCount} data-replay-source={s.replaySource ?? "none"}
    data-loss-sources={s.lossSources.join(",")} data-compare={s.lens > 0.5 ? "on" : "off"}>
    <header><p className="eyebrow">D1 · 单样本生命周期</p><h1>留下的是过去的响应，约束的是现在的网络。</h1>
      <p>跟踪同一份 x₁：更新前生成 → 复制冻结 → 更新后入池 → 未来回放 → 匹配与联合更新。</p></header>
    <div id="lifecycle-player" className="lifecycle-player"><SceneTransport timeline={timeline} clips={LIFECYCLE_CLIPS} label="样本生命周期" caption="自动完整播放一次。可随时暂停；选择阶段或前后单步，会停在该阶段的完整结果。" /></div>
    <div className="lifecycle-viewport">
      <svg className="lifecycle-canvas" viewBox="0 0 1120 640" role="img" aria-labelledby="lc-title lc-description">
        <defs>
          <pattern id="lc-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
            <rect width="9" height="9" fill="#ffffff" />
            <rect width="1" height="9" fill="#55665f" opacity="0.06" />
          </pattern>
        </defs>
        <title id="lc-title">一份样本的历史响应怎样产生、保存并约束未来训练</title>
        <desc id="lc-description">{NARRATION[clip]} 网络为结构抽象，两次输出为给定教学数据。</desc>

        {/* loss lane */}
        <g opacity={1 - s.lens} data-loss-lane>
          <rect x={G.loss.y.x} y={G.loss.y.y} width={G.loss.y.w} height={G.loss.y.h} rx="9" className="lc-label-chip" />
          <text x={G.loss.y.x + 48} y={G.loss.y.y + 22} textAnchor="middle" className="lc-label-chip-title">{s.later ? "标签 y₂ = 狗" : "标签 y₁ = 猫"}</text>
          <text x={G.loss.y.x + 48} y={G.loss.y.y + 38} textAnchor="middle" className="lc-label-chip-note">独立监督</text>
          <rect x={G.loss.ce.x} y={G.loss.ce.y} width={G.loss.ce.w} height={G.loss.ce.h} rx="10" className="lc-ce-node" />
          <text x={G.loss.ce.x + 71} y={G.loss.ce.y + 29} textAnchor="middle" className="lc-ce-node-title">{s.later ? "CE(x₂, y₂)" : "CE(aᵢ, y₁)"}</text>
          <rect x={G.loss.pill.x} y={G.loss.pill.y} width={G.loss.pill.w} height={G.loss.pill.h} rx="15" className={s.ceState === "updated" ? "lc-state-pill is-updated" : "lc-state-pill"} />
          <text x={G.loss.pill.x + 95} y={G.loss.pill.y + 20} textAnchor="middle" className={s.ceState === "updated" ? "lc-state is-updated" : "lc-state"}>{s.ceState === "updated" ? "已反传一次" : "未反传"}</text>
          {clip === 3 && <g>
            <path d="M740 74H560V100" className="lc-gradient" />
            <text x={602} y={62} className="lc-gradient-label">∇θ · 一次更新</text>
          </g>}
        </g>

        {/* data column: trails only appear while the view is travelling */}
        <g opacity={1 - s.lens} data-data-column>
          {!s.later && <>
            <g transform={`translate(${G.sample.x} ${G.sample.y})`}>
              <SampleCard size={96} id={s.sampleId} />
            </g>
            <text x={G.sample.x + 48} y={G.sample.y + 122} textAnchor="middle" className="lc-object-title">原图 x₁</text>
            <text x={G.sample.x + 48} y={G.sample.y + 141} textAnchor="middle" className="lc-small">留存 · 不参与更新</text>
            {s.trailEnter > 0.01 && <path d={pathD(G.path.enter)} className="lc-trail" opacity={s.trailEnter} />}
            {s.enter < 0.999 && <g transform={`translate(${s.input.x - 32} ${s.input.y - 32})`}>
              <SampleCard size={64} crop id="view:x1:i" />
            </g>}
          </>}
          {s.later && <>
            <g transform="translate(34 120)">
              <SampleCard size={96} pattern={NEW_PIXELS} id="sample:x2" />
            </g>
            <text x={82} y={242} textAnchor="middle" className="lc-object-title">当前 x₂</text>
            <text x={82} y={261} textAnchor="middle" className="lc-small">本步的新数据</text>
            {s.replay < 0.34 && <path d={pathD([{ x: 130, y: 168 }, { x: 186, y: 170 }, { x: 150, y: 296 }, { x: 218, y: 300 }])} className="lc-trail" opacity={windowAt(s.replay, 0.02, 0.14)} />}
            <g transform={`translate(${s.currentInput.x - 29} ${s.currentInput.y - 29})`}>
              <SampleCard size={58} pattern={NEW_PIXELS} crop id="view:x2:j" />
            </g>
            {s.trailReplay > 0.01 && <path d={pathD(G.path.replay)} className="lc-trail" opacity={s.trailReplay} />}
            {s.replay > 0.28 && s.replay < 0.8 && <g transform={`translate(${s.replayInput.x - 27} ${s.replayInput.y - 27})`}>
              <SampleCard size={54} crop id="replay:x1:j" />
            </g>}
          </>}
        </g>

        {/* model + input sockets */}
        <Sockets current={s.enterDocked} replay={s.replayDocked} lens={s.lens} />
        <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
          <Network theta={s.parameter} updated={updateRing} lens={s.lens}
            active={clip === 1 ? Math.min(2, Math.floor(s.forward * 3)) : -1} showPort={clip === 3} />
        </g>
        {s.lens > 0.01 && <g opacity={s.lens}>
          <rect x={G.anchor.x} y={G.anchor.y} width={G.anchor.w} height={G.anchor.h} rx="14" className="lc-anchor-ring" />
          <text x={G.anchor.x + 14} y={G.anchor.y + 22} className="lc-anchor-title">同一模型</text>
          <text x={G.anchor.x + 14} y={G.anchor.y + 48} className="lc-anchor-theta">{s.parameter}</text>
          <text x={G.anchor.x + 14} y={G.anchor.y + 66} className="lc-small">唯一可训练参数</text>
        </g>}

        {/* response chart */}
        <ScoreTiles s={s} data={plotData} header={s.later ? "本次回放输出 aⱼ" : "本步输出 aᵢ"}
          subline={s.later ? "由更新后的 θ 计算；与 z₁ 同尺度" : "3 类 logit · 在更新前计算"}
          step={s.later ? "j" : "i"} reveal={s.outputReveal} />

        {/* frozen block + the squares travelling into it */}
        {s.hasTarget && s.lens < 0.99 && s.recordVisible < 0.6 && <g opacity={1 - s.lens}>
          {s.copy > 0.02 && <text x={s.blockNow.x} y={s.blockNow.y + s.blockNow.h + 18} className="lc-small" opacity={(1 - s.assembly) * (1 - s.lens)}>柱顶复制 → 独立冻结块</text>}
          <FrozenBlock rect={s.blockNow} z={s.z} note="x₁ @ i" label="z₁ 冻结"
            opacity={1 - s.lens} markersOpacity={windowAt(s.copy, 0.86, 1)} />
          {s.copy > 0.02 && s.copyPoints.map((p, k) => (
            <rect key={`copy-${k}`} x={p.x - 5.5} y={p.y - 5.5} width="11" height="11" rx="1.2" className="lc-copy-mark" data-copy-point={k} />
          ))}
        </g>}

        {/* comparison */}
        {s.lens > 0.01 && <Comparison s={s} />}

        {/* memory band */}
        <MemoryBand count={s.memoryCount} hasRecord={s.recordVisible > 0.6} record={s.recordPos} block={s.blockNow}
          recordNote={s.later ? "读取后不变" : "写入后不变"} dim={s.lens} slotNote={slotNote} z={s.z} />
      </svg>
    </div>
    <div className="lifecycle-reading" aria-live="polite"><strong>{LIFECYCLE_CLIPS[clip].id}</strong><p>{NARRATION[clip]}</p></div>
    <div className="lifecycle-equation" data-vqa-check-clipping>
      {clip >= 6
        ? <><math display="block" aria-label="历史匹配损失等于各类当前分数与冻结历史分数之差的平方和"><msub><mi>L</mi><mtext>dark</mtext></msub><mo>=</mo><munderover><mo>∑</mo><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>C</mi></munderover><msup><mrow><mo>(</mo><msub><mi>a</mi><mrow><mi>j</mi><mo>,</mo><mi>k</mi></mrow></msub><mo>−</mo><msub><mi>z</mi><mrow><mn>1</mn><mo>,</mo><mi>k</mi></mrow></msub><mo>)</mo></mrow><mn>2</mn></msup><mo>=</mo><mn>2</mn></math><span>□ 历史 z₁ 冻结　● 本次 aⱼ 可反传</span></>
        : <p>原图 x₁ 与数值 z₁ 保持同源身份。DER 记录为 (x₁,z₁)，其中不保存标签。</p>}
    </div>
    <p className="lifecycle-provenance">演示用的两次给定输出：z₁=(2,1,0)，aⱼ=(1,2,0)。网络为结构示意，未执行数值训练；入池与联合更新为后续单元的生命周期预览。</p>
  </section>;
}
