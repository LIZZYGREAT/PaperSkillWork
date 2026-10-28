import { LIFECYCLE_GEOMETRY, LIFECYCLE_CLIPS, lifecycleSceneAt, mix, windowAt } from "./lifecycle-model";
import SceneTransport, { useSceneTimeline } from "./SceneTransport";
import "./animation.css";
import "./lifecycle.css";

const G = LIFECYCLE_GEOMETRY;
const PIXELS = ["01100110", "11111111", "10111101", "11111111", "01111110", "00111100", "00011000", "00000000"];
const NEW_PIXELS = ["00111100", "01111110", "11011011", "11111111", "01111110", "00111100", "00100100", "00000000"];

const NARRATION = [
  "原图 x₁ 留在数据来源处，本次增强视图沿预留通道进入唯一当前网络。标签 y₁ 另行提供分类监督。",
  "信号按层传递，三类 logit 逐类形成：猫 2、狗 1、狐狸 0。这发生在任何参数更新之前。",
  "在源响应的同一坐标复制出空心方块，再交给独立的冻结块。源圆点仍在原处；θ 没有变化。",
  "用当前 CE 反传一次：一条梯度虚线进入参数端口，θᵢ 变为 θᵢ₊₁。冻结块全程保持 (2,1,0)。",
  "更新完成后，原图缩略与冻结块装配成候选记录，落入空槽 slot 0，N 从 0 变为 1。",
  "下一步先从已有记忆读取 x₁@i：槽内记录不动，读出的视图重新增强，进入第二个输入端口。",
  "历史方块与当前圆点在同一类别、同一尺度上对齐；差值折成平方贡献 1、1、0，总和为 2。",
  "当前 CE 与 α 倍历史匹配损失合并为一次联合更新。历史记录保持原样；这里停在 x₂ 候选写入之前。",
];

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
const LAYER_COUNTS = [3, 5, 3];
const NODE_OFFSETS: Record<number, number[]> = { 3: [0, -9, 0], 5: [0, 7, -4, 8, 0] };

function glyphGeometry(x: number, y: number, w: number, h: number) {
  const gap = 26;
  const lw = (w - gap * (LAYER_COUNTS.length - 1)) / LAYER_COUNTS.length;
  const centers = LAYER_COUNTS.map((_, i) => x + i * (lw + gap) + lw / 2);
  const offScale = Math.min(1, Math.max(0.34, h / 220));
  const ys = LAYER_COUNTS.map(count => {
    const span = h * (0.84 + 0.032 * count);
    const top = y + (h - span) / 2;
    const step = count > 1 ? span / (count - 1) : 0;
    const offs = NODE_OFFSETS[count] || NODE_OFFSETS[3];
    return Array.from({ length: count }, (_, k) => top + k * step + (offs[k] || 0) * offScale);
  });
  return { centers, ys };
}

function Network({ theta, updated, active, lens, showPort }: {
  theta: string; updated: boolean; active: number; lens: number; showPort: boolean;
}) {
  const { x, y, w, h } = G.model;
  const { centers, ys } = glyphGeometry(x + 32, y + 72, w - 64, h - 122);
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
  return <g data-current-model>
    {updated && <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx="22" className="lc-update-ring" />}
    <rect x={x} y={y} width={w} height={h} rx="16" className={updated ? "lc-model-card is-updated" : "lc-model-card"} />
    <g opacity={Math.max(0, 1 - lens * 1.3)}>
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

// ---------------------------------------------------------------- response plot
function ResponsePlot({ plot, data, header, subline, step, reveal, dim, values, lens }: {
  plot: { x0: number; unit: number; rows: number[] }; data: { name: string; v: number }[]; header: string; subline: string;
  step: string; reveal: number[]; dim: number; values: boolean; lens: number;
}) {
  const { x0, unit, rows } = plot;
  const axisEnd = x0 + unit * 2.9;
  const headOpacity = Math.max(0, 1 - lens * 1.4);
  return <g opacity={1 - dim} data-response-plot>
    <g opacity={headOpacity}>
      <text x={x0} y={rows[0] - 68} className="lc-plot-title">{header}</text>
      <rect x={x0 + header.length * 16 + 6} y={rows[0] - 82} width="26" height="20" rx="5" className="lc-step-chip" />
      <text x={x0 + header.length * 16 + 19} y={rows[0] - 68} textAnchor="middle" className="lc-step-label">{step}</text>
      <text x={x0} y={rows[0] - 47} className="lc-small">{subline}</text>
      <path d={`M${x0} ${rows[0] - 26}H${axisEnd}`} className="lc-ruler" />
    </g>
    <g opacity={headOpacity}>
      {[0, 1, 2].map(v => <g key={`t-${v}`}>
        <path d={`M${x0 + v * unit} ${rows[0] - 26}v5`} className="lc-tick" />
        <text x={x0 + v * unit} y={rows[0] - 34} textAnchor="middle" className="lc-tick-label">{v}</text>
        {v > 0 && <path d={`M${x0 + v * unit} ${rows[0] - 20}V${rows[2] + 12}`} className="lc-gridline" />}
      </g>)}
      <path d={`M${x0} ${rows[0] - 20}V${rows[2] + 12}`} className="lc-zero-line" />
    </g>
    {rows.map((ry, k) => <g key={`row-${k}`}>
      <text x={x0 - 16} y={ry + 6} textAnchor="end" className="lc-row-label">{data[k].name}</text>
      <path d={`M${x0} ${ry}H${axisEnd}`} className="lc-track" />
      {reveal[k] > 0.01 && <g opacity={reveal[k]}>
        <path d={`M${x0} ${ry}H${x0 + data[k].v * unit}`} className="lc-track-fill" />
        <circle cx={x0 + data[k].v * unit} cy={ry} r={15} className="lc-bead-halo" />
        <circle cx={x0 + data[k].v * unit} cy={ry} r="6.5" className="lc-bead" data-current-point={k} data-a={data[k].v} />
        {values && <text x={x0 + data[k].v * unit + 22} y={ry + 7} className="lc-value" data-layout-label>{data[k].v}</text>}
      </g>}
    </g>)}
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
      <rect x="12" y="36" width="48" height="48" rx="6" className="lc-thumb" />
      {pixelRects(PIXELS, 12, 36, 48, 6, "thumb")}
      <text x="12" y="20" className="lc-record-id">x₁ @ i</text>
      <text x={G.record.w - 12} y="20" textAnchor="end" className="lc-record-note">{recordNote}</text>
      <g transform={`translate(${block.x - record.x} ${block.y - record.y})`}>
        <FrozenBlock rect={{ x: 0, y: 0, w: block.w, h: block.h }} z={z} note="x₁ @ i" label="z₁ 冻结" inRecord />
      </g>
    </g>}
  </g>;
}

// ---------------------------------------------------------------- comparison extras
function Comparison({ s }: { s: ReturnType<typeof lifecycleSceneAt> }) {
  const { plot, squares, sum, difference, match, joint } = s;
  const { x0, unit, rows } = plot;
  const sqX = x0 + 2.9 * unit + 34;
  return <g opacity={s.lens} data-comparison>
    <g opacity={s.lens}>
      <text x={300} y={82} className="lc-compare-title">同类、同尺度比较</text>
      <text x={300} y={102} className="lc-small">冻结值保持原值；可反传的是当前输出</text>
      <circle cx={880} cy={78} r="6.5" className="lc-bead" />
      <text x={894} y={83} className="lc-legend-label">本次 aⱼ</text>
      <rect x={962} y={71.5} width="13" height="13" rx="1.5" className="lc-history-mark" />
      <text x={982} y={83} className="lc-legend-label">历史 z₁ 冻结</text>
    </g>
    {rows.map((ry, k) => {
      const ax = s.currentPoints[k].x, zx = s.referencePoints[k].x;
      const lo = Math.min(ax, zx), hi = Math.max(ax, zx);
      const d = match.differences[k];
      const side = Math.abs(d);
      return <g key={`cmp-${k}`}>
        <rect x={zx - 7} y={ry - 7} width="14" height="14" rx="1.5" className="lc-history-mark" />
        {side !== 0 && <g opacity={difference}>
          <path d={`M${lo} ${ry - 17}V${ry - 11}H${hi}V${ry - 17}`} className="lc-diff-bracket" />
          <text x={(lo + hi) / 2} y={ry - 24} textAnchor="middle" className="lc-diff-value">{d > 0 ? `+${d}` : `−${Math.abs(d)}`}</text>
        </g>}
        {side === 0 && <text x={lo + 12} y={ry - 22} className="lc-small">重合</text>}
        {squares > 0.01 && (side !== 0
          ? <g opacity={squares}>
            <rect x={sqX} y={ry - (22 * side) / 2} width={22 * side} height={22 * side} rx="2" className="lc-square" data-square-contribution={match.squares[k]} />
            <text x={sqX + 22 * side + 12} y={ry + 6} className="lc-square-value">{`(${d > 0 ? d : `−${Math.abs(d)}`})² = ${match.squares[k]}`}</text>
          </g>
          : <g opacity={squares}>
            <path d={`M${sqX} ${ry}H${sqX + 22}`} className="lc-zero-square" />
            <text x={sqX + 34} y={ry + 6} className="lc-square-value is-muted">0² = 0</text>
          </g>)}
      </g>;
    })}
    <g opacity={sum}>
      <text x={1040} y={350} textAnchor="end" className="lc-sum">1 + 1 + 0 = 2</text>
      <text x={1040} y={390} textAnchor="end" className="lc-ldark" data-loss={match.squaredDistance}>L<tspan baselineShift="sub" fontSize="0.62em">dark</tspan> = 2</text>
      <text x={1040} y={408} textAnchor="end" className="lc-small">冻结值与当前输出之差</text>
    </g>
    <g opacity={windowAt(joint, 0.05, 0.5)}>
      <rect x={300} y={344} width={148} height={42} rx="9" className="lc-ce-chip" />
      <text x={374} y={362} textAnchor="middle" className="lc-ce-chip-title">CE(x₂, y₂)</text>
      <text x={374} y={377} textAnchor="middle" className="lc-small">当前监督</text>
      <rect x={300} y={396} width={400} height={46} rx="10" className="lc-join-chip" />
      <text x={500} y={424} textAnchor="middle" className="lc-join-title">L<tspan baselineShift="sub" fontSize="0.62em">j</tspan> = CE(x₂, y₂) + α · L<tspan baselineShift="sub" fontSize="0.62em">dark</tspan></text>
      <path d="M300 419H250V346H196" className="lc-gradient" />
      <text x={258} y={409} className="lc-gradient-label">一次更新</text>
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
  const theta = s.parameter;
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

        {/* data column */}
        <g opacity={1 - s.lens} data-data-column>
          {!s.later && <>
            <g transform={`translate(${G.sample.x} ${G.sample.y})`}>
              <SampleCard size={96} id={s.sampleId} />
            </g>
            <text x={G.sample.x + 48} y={G.sample.y + 122} textAnchor="middle" className="lc-object-title">原图 x₁</text>
            <text x={G.sample.x + 48} y={G.sample.y + 141} textAnchor="middle" className="lc-small">留存 · 不参与更新</text>
            <path d="M130 198C176 198 196 300 244 300" className="lc-data-guide" opacity={s.enter} />
            {s.enter > 0.02 && s.enter < 0.999 && <g transform={`translate(${s.input.x - 32} ${s.input.y - 32})`}>
              <SampleCard size={64} crop id="view:x1:i" />
            </g>}
            <text x={182} y={296} textAnchor="middle" className="lc-small">本次增强视图</text>
          </>}
          {s.later && <>
            <g transform="translate(34 120)">
              <SampleCard size={96} pattern={NEW_PIXELS} id="sample:x2" />
            </g>
            <text x={82} y={242} textAnchor="middle" className="lc-object-title">当前 x₂</text>
            <text x={82} y={261} textAnchor="middle" className="lc-small">本步的新数据</text>
            <path d="M130 168C176 168 196 300 244 300" className="lc-data-guide" />
            <g transform={`translate(${s.currentInput.x - 29} ${s.currentInput.y - 29})`}>
              <SampleCard size={58} pattern={NEW_PIXELS} crop id="view:x2:j" />
            </g>
            <path d="M206 530H178V366H244" className="lc-data-guide" />
            {s.replay > 0.34 && s.replay < 0.87 && <g transform={`translate(${s.replayInput.x - 27} ${s.replayInput.y - 27})`}>
              <SampleCard size={54} crop id="replay:x1:j" />
            </g>}
            <text x={142} y={438} textAnchor="end" className="lc-small">回放 x₁@i</text>
          </>}
        </g>

        {/* model */}
        <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
          <Network theta={theta} updated={updateRing} lens={s.lens}
            active={clip === 1 ? Math.min(2, Math.floor(s.forward * 3)) : -1} showPort={clip === 3} />
        </g>
        {s.lens > 0.01 && <g opacity={s.lens}>
          <rect x={G.anchor.x} y={G.anchor.y} width={G.anchor.w} height={G.anchor.h} rx="14" className="lc-anchor-ring" />
          <text x={G.anchor.x + 14} y={G.anchor.y + 22} className="lc-anchor-title">同一模型</text>
          <text x={G.anchor.x + 14} y={G.anchor.y + 48} className="lc-anchor-theta">{theta}</text>
          <text x={G.anchor.x + 14} y={G.anchor.y + 66} className="lc-small">唯一可训练参数</text>
        </g>}

        {/* response plot */}
        <ResponsePlot plot={s.plot} data={plotData} header={s.later ? "本次回放输出 aⱼ" : "本步输出 aᵢ"}
          subline={s.later ? "由更新后的 θ 计算；与 z₁ 同尺度" : "3 类 logit · 在更新前计算"}
          step={s.later ? "j" : "i"} reveal={s.outputReveal}
          dim={clip === 3 ? 1 - windowAt(s.update, 0.2, 0.9) : s.lens * 0.85} values={s.lens < 0.4} lens={s.lens} />

        {/* frozen block: first on its own, then travelling into the record */}
        {s.hasTarget && s.lens < 0.99 && s.recordVisible < 0.6 && <g opacity={1 - s.lens}>
          {s.copy > 0.02 && <text x={s.blockNow.x} y={s.blockNow.y - 12} className="lc-small" opacity={1 - s.assembly}>复制此刻数值，成为独立副本</text>}
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
