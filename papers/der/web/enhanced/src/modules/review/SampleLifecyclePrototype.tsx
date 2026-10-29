import { useEffect, useId, useRef, useState } from "react";
import { LIFECYCLE_GEOMETRY, LIFECYCLE_CLIPS, lifecycleSceneAt, mix, windowAt, curve, type Point } from "./lifecycle-model";
import SceneTransport, { useSceneTimeline } from "./SceneTransport";
import ModelPixel, { MODEL_CLASSES, type ModelClass } from "./ModelPixel";
import "./animation.css";
import "./lifecycle.css";

const G = LIFECYCLE_GEOMETRY;
const NARRATION = [
  "原图 x₁ 保留。矩形边框内的像素旋转并重新取景，得到增强视图后进入输入位；标签 y₁ 独立提供监督。",
  "信号按层传递，得到 Claude 2、GPT 1、DeepSeek 0。这组响应在参数更新之前计算。",
  "当前输出保留，三个数值的副本移入下方，组成独立的冻结响应 z₁。此时 θ 尚未更新。",
  "当前 CE 通过顶部参数端口反传一次，θᵢ 变为 θᵢ₊₁；已经复制的 z₁ 始终保持 (2,1,0)。",
  "更新完成后，原图缩略与冻结响应组成记录，写入空槽 slot 0；记忆中的记录数从 0 变为 1。",
  "x₂ 先增强并前向，得到 bⱼ 用于 L_current；随后读出 x₁，重新增强并再次前向，得到 aⱼ，与旧 z₁ 比较形成 L_dark。两条路径共享同一个网络。",
  "按类别对齐历史 z₁ 与当前 aⱼ，逐项相减并平方：1、1、0，求和得到历史匹配损失 2。",
  "当前 CE 与 α 倍历史匹配损失合成一次联合更新。旧记录保持不变，x₂ 的更新前输出 z₂ 已独立冻结。",
  "联合更新完成后，将 (x₂,z₂) 写入第二个空槽 slot 1；K=2 的记忆现有两条记录，旧 z₁ 保持不变。",
];

type Scene = ReturnType<typeof lifecycleSceneAt>;
function SampleCard({ size, model = 0, crop = false, id, augmentation = 0, cropProgress = augmentation, rotateSign = -1 }: { size: number; model?: ModelClass; crop?: boolean; id: string; augmentation?: number; cropProgress?: number; rotateSign?: number }) {
  const clipId = useId();
  const inset = size * .18;
  return <g data-sample-object={id}>
    <rect width={size} height={size} rx={size > 70 ? 14 : 9} className="lc-card-surface" />
    <defs><clipPath id={clipId}><rect x={6 + size * .04 * cropProgress} y={6 + size * .04 * cropProgress} width={size - 12 - size * .08 * cropProgress} height={size - 12 - size * .08 * cropProgress} rx="2" /></clipPath></defs>
    <g clipPath={`url(#${clipId})`} data-augmentation={augmentation} data-crop-progress={cropProgress}>
      <g transform={`translate(${size / 2} ${size / 2}) rotate(${rotateSign * 24 * augmentation}) scale(${1 + .35 * cropProgress}) translate(${-size / 2} ${-size / 2})`} data-pixel-transform>
        <ModelPixel model={model} x={inset} y={inset} size={size - inset * 2} />
      </g>
    </g>
    {crop && cropProgress > 0 && cropProgress < 1 && <rect x={6 + size * .04 * cropProgress} y={6 + size * .04 * cropProgress} width={size - 12 - size * .08 * cropProgress} height={size - 12 - size * .08 * cropProgress} fill="none" stroke="#b18a53" strokeWidth="1.2" strokeDasharray="3 3" />}
    {crop && [[6, 6, 1, 1], [size - 6, 6, -1, 1], [6, size - 6, 1, -1], [size - 6, size - 6, -1, -1]].map(([x, y, a, b], i) =>
      <path key={i} d={`M${x} ${y + 6 * b}V${y}H${x + 6 * a}`} className="lc-crop" />)}
  </g>;
}

/** A short, already-travelled section behind the object; never the route ahead. */
function MotionTrail({ points, progress }: { points: readonly Point[]; progress: number }) {
  if (progress <= .06 || progress >= .99) return null;
  const start = Math.max(0, progress - .32), end = Math.max(0, progress - .07);
  const path = Array.from({ length: 16 }, (_, i) => {
    const p = curve(mix(start, end, i / 15), points[0], points[1], points[2], points[3]);
    return `${i ? "L" : "M"}${p.x} ${p.y}`;
  }).join(" ");
  return <path d={path} className="lc-trail" data-trail-progress={progress} opacity={Math.min(1, progress * 6, (1 - progress) * 8)} />;
}

function AugmentationStation({ y, replay, rotation, crop }: { y: number; replay: boolean; rotation: number; crop: number }) {
  const h = replay ? 144 : 168;
  const caption = rotation === 0 ? "复制原图视图" : rotation < 1 ? `旋转像素 · ${Math.round(rotation * 100)}%` : crop < 1 ? `裁切取景 · ${Math.round(crop * 100)}%` : "增强视图已生成";
  return <g data-augmentation-station={replay ? "replay" : "current"}>
    <rect x={184} y={y} width="152" height={h} rx="13" className="lc-augmentation-panel" />
    <text x={198} y={y + 17} className="lc-augmentation-title">{replay ? "回放重新增强" : "增强 Augmentation"}</text>
    <rect x={212} y={replay ? 340 : 164} width="96" height="96" rx="12" className="lc-augmentation-placeholder" />
    <text x={260} y={y + h - 13} textAnchor="middle" className="lc-augmentation-caption" opacity={replay && rotation === 0 ? 0 : 1}>{caption}</text>
  </g>;
}

function GradientPath({ d, progress }: { d: string; progress: number }) {
  const id = useId();
  return <g data-gradient-progress={progress}>
    <defs><mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="1120" height="640"><path d={d} pathLength="1" fill="none" stroke="white" strokeWidth="8" strokeDasharray="1" strokeDashoffset={1 - progress} /></mask></defs>
    <path d={d} className="lc-gradient" mask={`url(#${id})`} markerEnd={progress > .99 ? "url(#lc-arrow)" : undefined} />
  </g>;
}

function Network({ s }: { s: Scene }) {
  const t = s.lens;
  const x = mix(G.model.x, G.anchor.x, t), y = mix(G.model.y, G.anchor.y, t);
  const w = mix(G.model.w, G.anchor.w, t), h = mix(G.model.h, G.anchor.h, t);
  const centers = [0, 1, 2].map(i => x + mix(64, 33, t) + i * mix((G.model.w - 128) / 2, (G.anchor.w - 66) / 2, t));
  const middle = mix(G.model.y + 169, G.anchor.y + 145, t);
  const counts = [3, 5, 3], spacing = [84, 45, 84].map(v => mix(v, v * .44, t));
  const ys = counts.map((n, i) => Array.from({ length: n }, (_, k) => middle + (k - (n - 1) / 2) * spacing[i]));
  const active = s.clip === 1 ? Math.min(2, Math.floor(s.forward * 3)) : -1;
  const updateProgress = s.clip === 3 ? windowAt(s.update, .06, .82) : s.clip >= 7 ? windowAt(s.joint, .06, .82) : 0;
  const updated = s.clip === 3 || s.clip >= 7;
  const forwardTime = s.clip === 1 ? s.forward : s.clip === 5 ? (s.replay < .58 ? s.currentForward : s.replayForward) : 0;
  const backward = updated && updateProgress < 1;
  const bodyNote = s.clip === 5 ? `${s.replay < .58 ? "x₂ 前向" : "回放 x₁ 前向"} · ${Math.round(forwardTime * 100)}%` : s.clip === 1 ? `前向传播 · ${Math.round(s.forward * 100)}%` : updated ? (updateProgress >= 1 ? "参数更新完成" : `梯度回传 · ${Math.round(updateProgress * 100)}%`) : t > .5 ? "唯一可训练参数" : "结构示意 · 共享参数";
  return <g data-current-model data-forward-progress={forwardTime} data-update-progress={updateProgress}>
    {updated && <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx="20" className="lc-update-ring" />}
    <rect x={x} y={y} width={w} height={h} rx="16" className={`lc-model-card${updated ? " is-updated" : ""}`} />
    <text x={x + 20} y={y + 32} className="lc-model-title">{t > .5 ? "同一模型" : "当前模型"}</text>
    <rect x={x + w - 86} y={y + 16} width="66" height="25" rx="8" className={`lc-theta${updated ? " is-updated" : ""}`} />
    <text x={x + w - 53} y={y + 33} textAnchor="middle" className="lc-theta-label" data-parameter>{s.parameter}</text>
    <text x={x + 20} y={y + 56} className="lc-small">{bodyNote}</text>
    <path d={`M${x + 20} ${y + 70}H${x + w - 20}`} className="lc-rule" />
    {updated && <path d={`M${x + 20} ${y + 70}h${(w - 40) * updateProgress}`} className="lc-update-progress" />}
    {ys.slice(0, -1).flatMap((col, i) => col.flatMap((yl, k) => {
      return ys[i + 1].map((yr, j) => {
        const flow = backward ? windowAt(updateProgress, i === 1 ? .03 : .4, i === 1 ? .6 : .95) : windowAt(forwardTime, i === 0 ? .04 : .38, i === 0 ? .52 : .84);
        const len = Math.hypot(centers[i + 1] - centers[i], yr - yl);
        return <g key={`${i}-${k}-${j}`}>
          <line data-network-edge={`${i}:${k}:${j}`} x1={centers[i]} y1={yl} x2={centers[i + 1]} y2={yr} className="lc-edge" />
          {flow > 0 && flow < 1 && <>
            <line x1={backward ? centers[i + 1] : centers[i]} y1={backward ? yr : yl} x2={backward ? centers[i] : centers[i + 1]} y2={backward ? yl : yr} className={backward ? "lc-signal is-backward" : "lc-signal"} strokeDasharray={len} strokeDashoffset={len * (1 - flow)} opacity={Math.sin(flow * Math.PI) * .7} />
            <circle cx={mix(centers[i], centers[i + 1], backward ? 1 - flow : flow)} cy={mix(yl, yr, backward ? 1 - flow : flow)} r={mix(2.1, 1.4, t)} className={backward ? "lc-signal-dot is-backward" : "lc-signal-dot"} opacity={Math.sin(flow * Math.PI)} />
          </>}
        </g>;
      });
    }))}
    {ys.map((col, i) => <g key={i} data-network-column={i}>{col.map((cy, k) => <circle key={k} cx={centers[i]} cy={cy} r={mix(5.2, 3.4, t)} className={`lc-node${i === active ? " is-lit" : ""}`} style={{fill: `rgb(${mix(255, 226, windowAt(forwardTime, .04 + i * .25, .2 + i * .25))},${mix(255, 238, windowAt(forwardTime, .04 + i * .25, .2 + i * .25))},${mix(255, 228, windowAt(forwardTime, .04 + i * .25, .2 + i * .25))})`}} />)}</g>)}
    {t < .12 && ["特征层", "特征层", "分类头"].map((label, i) => <text key={label + i} x={centers[i]} y={y + h - 20} textAnchor="middle" className="lc-col-label" opacity={Math.max(0, 1 - t * 8)}>{label}</text>)}
    {(s.clip === 3 || s.clip === 7) && <circle cx={s.clip === 3 ? x + w - 53 : x + w} cy={s.clip === 3 ? y : y + 28} r="4" className="lc-update-port" />}
  </g>;
}

function Sockets({ s }: { s: Scene }) {
  return <g data-input-sockets opacity={1 - windowAt(s.compare, 0, .06)}>{[G.ports.current, G.ports.replay].map((y, i) =>
    <g key={y} data-input-socket={i}>
      <rect x={G.model.x - 80} y={y - 32} width="64" height="64" rx="12" className="lc-socket" />
      <path d={`M${G.model.x - 10} ${y}H${G.model.x}`} className="lc-socket-connector" />
      <circle cx={G.model.x} cy={y} r="3.5" className={`lc-port${(i === 0 ? s.enterDocked : s.replayDocked) > .5 ? " is-docked" : ""}`} />
      <path d={`M${G.model.x - 59} ${y - 5}h11m-5 -5 5 5-5 5`} className="lc-socket-arrow" />
    </g>)}</g>;
}

function TileHeader({ x, y, k }: { x: number; y: number; k: number }) {
  return <g><ModelPixel model={k as ModelClass} x={x + 13} y={y + 17} size={22} />
    <text x={x + 43} y={y + 33} className="lc-tile-class">{MODEL_CLASSES[k]}</text></g>;
}

function ScoreTiles({ s }: { s: Scene }) {
  const values = s.later ? s.match.a : s.z;
  const { tiles, tileX } = s;
  const normalOpacity = 1 - windowAt(s.compare, 0, .07);
  const short = tiles.h < 120;
  return <g data-response-plot>
    <g opacity={normalOpacity}>
      {s.later ? <>
        <text x={760} y={140} className="lc-plot-title">当前 x₂ · bⱼ</text>
        <text x={1080} y={140} textAnchor="end" className="lc-output-purpose">用于 L_current</text>
        {s.currentTarget.map((v, k) => <g key={k} data-current-output-tile={k}>
          <rect x={760 + k * 110} y={164} width={k === 2 ? 112 : 100} height="104" rx="14" className="lc-score-tile" />
          <TileHeader x={760 + k * 110} y={164} k={k} />
          <text x={760 + k * 110 + 16} y={238} className="lc-logit-label">logit</text>
          <text x={760 + k * 110 + 82} y={240} textAnchor="end" className="lc-symbol-value" opacity={s.currentOutputReveal[k]} data-current-x2-value={v}>{v}</text>
        </g>)}
        <text x={760} y={294} className="lc-plot-title">回放 x₁ · aⱼ</text>
        <text x={1080} y={294} textAnchor="end" className="lc-output-purpose">与 z₁ 比较 → L_dark</text>
      </> : <>
        <text x={760} y={140} className="lc-plot-title">更新前的整组响应<tspan className="lc-symbol">　aᵢ</tspan></text>
        <text x={760} y={163} className="lc-small">3 个类别 · 原始分数 logit</text>
      </>}
    </g>
    {values.map((v, k) => <g key={k} data-score-tile={k}>
      <rect x={tileX(k)} y={tiles.y} width={tiles.w + (k === 2 ? 12 * (1 - s.lens) : 0)} height={tiles.h} rx="14" className="lc-score-tile" />
      <TileHeader x={tileX(k)} y={tiles.y} k={k} />
      <g opacity={s.outputReveal[k] * Math.max(0, 1 - s.lens * 3)}>
        <text x={tileX(k) + 16} y={tiles.y + (short ? 73 : 84)} className="lc-logit-label">logit</text>
        <text x={tileX(k) + tiles.w - 18} y={tiles.y + (short ? 75 : 86)} textAnchor="end" className="lc-tile-value" data-current-point={k} data-a={v}>{v}</text>
        {[0, 1].map(n => <rect key={n} x={tileX(k) + 16 + n * 36} y={tiles.y + tiles.h - 18} width={32 * s.outputReveal[k]} height="5" rx="2.5" className={`lc-level${n < v ? " is-on" : ""}`} />)}
      </g>
    </g>)}
  </g>;
}

function FrozenBlock({ rect, z, note, inRecord = false, markersOpacity = 1, label = "z₁ · 冻结响应" }: {
  rect: { x: number; y: number; w: number; h: number }; z: readonly (number | string)[]; note: string; inRecord?: boolean; markersOpacity?: number; label?: string;
}) {
  const { x, y, w, h } = rect, cw = (w - 26) / 3;
  return <g transform={`translate(${x} ${y})`} data-history-z={inRecord ? undefined : "2,1,0"} data-target-id={inRecord ? undefined : "target:x1:i"}>
    <rect width={w} height={h} rx="10" className="lc-frozen-block" />
    <text x={13} y={16} className="lc-frozen-title">{label}</text>
    <text x={w - 13} y={16} textAnchor="end" className="lc-frozen-note">{note}</text>
    {[0, 1, 2].map(k => <g key={k}>
      {k > 0 && <path d={`M${13 + cw * k} 27V${h - 10}`} className="lc-frozen-divider" />}
      <text x={13 + cw * k + cw / 2} y={h - 30} textAnchor="middle" className="lc-frozen-class">{MODEL_CLASSES[k]}</text>
      <rect x={13 + cw * k + cw / 2 - 25.5} y={h - 26.5} width="11" height="11" rx="2" className="lc-history-mark" opacity={markersOpacity} data-frozen-point={k} />
      <text x={13 + cw * k + cw / 2 - 7} y={h - 15} className="lc-frozen-value">{z[k]}</text>
    </g>)}
  </g>;
}

function MemoryBand({ s }: { s: Scene }) {
  const hasRecord = s.recordVisible > .6;
  return <g data-memory-band>
    <rect {...{ x: G.band.x, y: G.band.y, width: G.band.w, height: G.band.h }} rx="16" className="lc-band" />
    <text x={58} y={506} className="lc-band-title">记忆 M</text>
    <text x={58} y={529} className="lc-small">保存原图与响应</text>
    <text x={58} y={548} className="lc-small">记录 = (x, z)</text>
    {[0, 1].map(i => <g key={i}>
      <rect x={G.slot0.x + i * 362} y={G.slot0.y} width={G.slot0.w} height={G.slot0.h} rx="12" className={`lc-slot${((i === 0 && hasRecord) || (i === 1 && s.secondStored)) ? " is-filled" : ""}`} />
      <text x={G.slot0.x + i * 362 + 3} y={G.slot0.y - 9} className="lc-slot-label">slot {i}</text>
      {i === 1 && s.secondStored && <text x={G.slot0.x + 362 + 56} y={G.slot0.y - 9} className="lc-slot-note">已写入 x₂</text>}
      {i === 0 && s.stored && <text x={G.slot0.x + 56} y={G.slot0.y - 9} className="lc-slot-note">{s.later ? "读取中 · 原记录保留" : "已写入"}</text>}
    </g>)}
    <text x={1046} y={504} textAnchor="end" className="lc-counter-label">已存</text>
    <text x={1046} y={548} textAnchor="end" className="lc-counter" data-memory-count-value>{s.memoryCount}</text>
    <text x={1046} y={574} textAnchor="end" className="lc-counter-unit">K = 2</text>
    {hasRecord && <g data-in-memory={s.stored ? "true" : undefined} data-record-id="record:x1:i" data-history-z="2,1,0">
      <rect x={s.recordPos.x} y={s.recordPos.y} width={G.record.w} height={G.record.h} rx="9" className="lc-record-card" />
      <text opacity={windowAt(s.assembly, .96, 1)} x={s.recordPos.x + 12} y={s.recordPos.y + 17} className="lc-record-id">x₁ @ i</text>
      <text opacity={windowAt(s.assembly, .96, 1)} x={s.recordPos.x + G.record.w - 12} y={s.recordPos.y + 17} textAnchor="end" className="lc-record-note">{s.later ? "读取后不变" : "写入后不变"}</text>
      <g opacity={windowAt(s.assembly, .96, 1)} transform={`translate(${s.recordPos.x + 12} ${s.recordPos.y + 31})`}><SampleCard size={44} id="memory:x1" /></g>
      <FrozenBlock rect={s.blockNow} z={s.z} note="x₁ @ i" inRecord />
    </g>}
  </g>;
}

function Comparison({ s }: { s: Scene }) {
  const { tiles, tileX, match } = s;
  return <g opacity={s.lens} data-comparison>
    <text x={334} y={68} className="lc-compare-title">同一类别，逐项比较。</text>
    <text x={334} y={91} className="lc-small">历史 z₁ 保持冻结；当前 aⱼ 参与反向传播。</text>
    {[0, 1, 2].map(k => {
      const x = tileX(k), y = tiles.y, w = tiles.w, d = match.differences[k];
      return <g key={k} data-compare-tile={k} opacity={windowAt(s.lens, .5, 1)}>

        <path d={`M${x + 16} ${y + 58}H${x + w - 16}`} className="lc-rule" />
        <text x={x + 18} y={y + 89} className="lc-row-label">历史 z₁</text>

        <text x={x + w - 22} y={y + 91} textAnchor="end" className="lc-tile-row">{match.z[k]}</text>
        <text x={x + 18} y={y + 124} className="lc-row-label">当前 aⱼ</text>
        <circle cx={x + w - 55} cy={y + 119} r="5.5" className="lc-bead" />
        <text x={x + w - 22} y={y + 126} textAnchor="end" className="lc-tile-row is-current">{match.a[k]}</text>
        <g opacity={s.difference}>
          <rect x={x + 14} y={y + 146} width={w - 28} height="54" rx="8" className="lc-delta-band" />
          <text x={x + 25} y={y + 165} className="lc-delta-label">aⱼ − z₁</text>
          <text x={x + w - 25} y={y + 166} textAnchor="end" className="lc-tile-delta">{d === 0 ? "0" : d > 0 ? `+${d}` : `−${Math.abs(d)}`}</text>
          <g opacity={s.squares}>
            <text x={x + 25} y={y + 188} className="lc-contrib">{d === 0 ? "0² =" : `(${d > 0 ? d : `−${Math.abs(d)}`})² =`}</text>
            <text x={x + 92} y={y + 188} textAnchor="middle" className="lc-contrib-result" data-square-result={k} data-square-contribution={d === 0 ? undefined : match.squares[k]}>{match.squares[k]}</text>
            <text x={x + w - 25} y={y + 188} textAnchor="end" className="lc-contrib-note">平方贡献</text>
          </g>
        </g>
      </g>;
    })}
    <g opacity={s.sum} data-loss={match.squaredDistance}>
      <rect x={334} y={358} width={728} height="52" rx="11" className="lc-total-band" />
      <text x={354} y={390} className="lc-total-label">历史匹配损失</text>
      <g className="lc-sum-equation" data-centered-loss>
        <text x={642} y={391} textAnchor="end" className="lc-ldark">L<tspan baselineShift="sub" fontSize=".65em">dark</tspan> =</text>
        {[0,1,2].map(k => {
          const p = s.sumTransfers[k], source = { x: tileX(k) + 92, y: tiles.y + 188 }, target = { x: 668 + k * 48, y: 391 };
          const point = curve(p, source, { x: source.x, y: source.y + 42 }, { x: target.x, y: target.y - 38 }, target);
          return <text key={k} x={point.x} y={point.y} textAnchor="middle" className="lc-sum-term" style={{ fontSize: `${mix(12,20,p)}px` }} opacity={s.sumCopyOpacity[k]} data-numeric-copy={k} data-copy-transfer={p} data-loss-term={k}>{match.squares[k]}</text>;
        })}
        {[692,740].map(x => <text key={x} x={x} y={391} textAnchor="middle" className="lc-ldark">+</text>)}
        <text x={788} y={391} textAnchor="middle" className="lc-ldark" opacity={s.totalReveal}>=</text>
        <text x={812} y={391} textAnchor="middle" className="lc-sum-term is-total" opacity={s.totalReveal}>{match.squaredDistance}</text>
      </g>
    </g>
    <g opacity={windowAt(s.joint, .05, .5) * (1 - windowAt(s.secondStore, 0, .2))}>
      <rect x={334} y={426} width={728} height="34" rx="9" className="lc-join-chip" />
      <text x={354} y={448} className="lc-join-title">Lⱼ = CE(x₂, y₂) + α · L<tspan baselineShift="sub" fontSize=".65em">dark</tspan></text>
      <text x={1042} y={448} textAnchor="end" className="lc-join-note">{s.joint < 1 ? `联合更新 · ${Math.round(s.joint * 100)}%` : "合并损失 · 已更新一次"}</text>
      <GradientPath d="M334 443H264Q256 443 256 435V196Q256 188 248 188H224" progress={windowAt(s.joint, .05, .62)} />
      <text x={270} y={428} className="lc-gradient-label">∇θ</text>
    </g>
  </g>;
}

function CurrentCandidate({ s }: { s: Scene }) {
  if (!s.later || s.currentCandidateVisible === 0) return null;
  const { x, y, w, h } = s.candidateRect;
  const layout = windowAt(s.secondStore, .55, .9), accepted = windowAt(s.secondStore, .78, 1);
  const thumbSize = mix(30,44,layout), inset = mix(0,7.92,layout), thumbY = mix(15,31,layout);
  const compactOpacity = windowAt(s.lens, .35, .65);
  return <g opacity={s.currentCandidateVisible} data-current-candidate data-record-id="record:x2:j" data-history-z="u1,u2,u3" data-in-memory={s.secondStored ? "true" : undefined} data-target-id="target:x2:j" data-candidate-source="current:x2:before-update" data-record-morph={layout}>
    <rect x={x} y={y} width={w} height={h} rx="10" fill={`rgb(${mix(252,255,accepted)},${mix(253,255,accepted)},${mix(249,255,accepted)})`} />
    <rect x={x} y={y} width={w} height={h} rx="10" fill="none" stroke="#a8bdab" strokeWidth="1" strokeDasharray="4 3" opacity={1 - accepted} />
    <rect x={x} y={y} width={w} height={h} rx="10" fill="none" stroke="#d7dfd2" strokeWidth=".8" opacity={accepted} />
    <g opacity={1 - windowAt(s.lens, 0, .3)}>
      <text x={x + 12} y={y + 18} className="lc-candidate-title">x₂ @ j · z₂ = (u₁, u₂, u₃)</text>
      <text x={x + w - 12} y={y + 18} textAnchor="end" className="lc-record-note">更新前冻结</text>
    </g>
    <g opacity={compactOpacity}>
      <rect x={x + 12} y={y + thumbY} width={thumbSize} height={thumbSize} rx="8" className="lc-thumb-morph" opacity={layout} />
      <ModelPixel model={1} x={x + 12 + inset} y={y + thumbY + inset} size={thumbSize - inset * 2} />
      <text x={x + mix(54,12,layout)} y={y + mix(23,17,layout)} className="lc-candidate-title">x₂ @ j · z₂ 冻结</text>
      <text x={x + 54} y={y + 44} className="lc-candidate-vector" opacity={1 - windowAt(s.secondStore, .64, .8)}>(u₁, u₂, u₃)</text>
    </g>
    <g opacity={windowAt(s.secondStore, .82, .94)}>
      <text x={x + w - 12} y={y + 17} textAnchor="end" className="lc-record-note">更新前冻结 · {s.secondStored ? "已写入" : "待写入"}</text>
      <FrozenBlock rect={{ x: x + 74, y: y + h - 62, w: w - 86, h: 60 }} z={s.currentTarget} note="x₂ @ j" label="z₂ · 冻结响应" inRecord />
    </g>
  </g>;
}

function InlineMath({ symbol, sub }: { symbol: string; sub?: string }) {
  return <span className="lc-inline-math"><i>{symbol}</i>{sub && <sub>{sub}</sub>}</span>;
}

function FocusedNarration({ clip }: { clip: number }) {
  const steps: { title: React.ReactNode; body: React.ReactNode }[][] = [
    [
      { title: "复制原图", body: <>保留 x₁，取一份视图用于训练。</> },
      { title: "生成增强视图", body: <>依次旋转像素、裁切取景；矩形外框保持不变。</> },
      { title: "送入网络", body: <>增强完成后，视图进入上方输入位。</> },
    ],
    [
      { title: "逐层前向", body: <>信号通过同一个网络，得到输出 <InlineMath symbol="a" sub="i" />。</> },
      { title: "得到整组分数", body: <>Claude 2、GPT 1、DeepSeek 0；此时尚未更新参数。</> },
    ],
    [
      { title: "保留当前输出", body: <>原来的三个分数留在输出端。</> },
      { title: "复制并冻结", body: <>副本组成 z₁ = (2, 1, 0)，作为独立的历史目标。</> },
    ],
    [
      { title: "计算当前损失", body: <>用本次输出与标签 y₁ 计算分类损失。</> },
      { title: "只更新一次", body: <>梯度回传，θᵢ 变为 θᵢ₊₁；已经冻结的 z₁ 保持原值。</> },
    ],
    [
      { title: "组成记录", body: <>把原图 x₁ 与冻结响应 z₁ 配对。</> },
      { title: "更新后写入", body: <>记录进入 slot 0，已存数量从 0 变为 1。</> },
    ],
    [
      { title: <>当前样本 x₂</>, body: <>先增强并前向，得到 <InlineMath symbol="b" sub="j" />。<br />计算当前分类损失 <InlineMath symbol="L" sub="current" />。</> },
      { title: <>回放样本 x₁</>, body: <>读出并重新增强，再前向得到 <InlineMath symbol="a" sub="j" />。<br />与固定 z₁ 比较，计算 <InlineMath symbol="L" sub="dark" />。</> },
    ],
    [
      { title: "按类别对齐", body: <>比较当前 <InlineMath symbol="a" sub="j" /> 与历史 z₁。</> },
      { title: "相减后平方", body: <>三个类别分别贡献 1、1、0。</> },
      { title: "复制数字，组成总和", body: <>副本依次进入公式，得到 <InlineMath symbol="L" sub="dark" /> = 2。</> },
    ],
    [
      { title: "合并两项损失", body: <>当前分类损失，加上 α 倍历史匹配损失。</> },
      { title: "一次联合更新", body: <>只反传一次，得到 θⱼ₊₁；z₁ 与本步快照 z₂ 均不重算。</> },
    ],
    [
      { title: "保留更新前快照", body: <>原图 x₂ 与本步冻结响应 z₂ 组成记录。</> },
      { title: "写入第二个空槽", body: <>记录进入 slot 1，已存数量变为 2；旧 z₁ 保持不变。</> },
    ],
  ];
  return <>
    <ol className="lc-reading-steps">{steps[clip].map((step, k) => <li key={k}><strong>{step.title}</strong><p>{step.body}</p></li>)}</ol>
    {clip === 5 && <p className="lc-reading-note">两次前向共享同一组参数 θⱼ。</p>}
  </>;
}

export default function SampleLifecyclePrototype() {
  const timeline = useSceneTimeline(LIFECYCLE_CLIPS, true);
  const [focused, setFocused] = useState(() => new URLSearchParams(window.location.search).get("focus") === "lifecycle");
  const sectionRef = useRef<HTMLElement>(null);
  const changeFocus = (next: boolean) => {
    setFocused(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("focus", "lifecycle"); else url.searchParams.delete("focus");
    window.history.replaceState({}, "", url);
  };
  useEffect(() => {
    if (!focused) return;
    const previousOverflow = document.body.style.overflow, previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    sectionRef.current?.querySelector<HTMLButtonElement>(".lifecycle-exit-focus")?.focus({ preventScroll: true });
    const keys = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") { event.preventDefault(); changeFocus(false); }
      if (event.key === "Tab") {
        const controls = [...(sectionRef.current?.querySelectorAll<HTMLElement>('button,select,summary,a[href],[tabindex]') ?? [])].filter(el => el.tabIndex >= 0 && !el.hasAttribute("disabled") && el.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", keys);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", keys); previousFocus?.focus({ preventScroll: true }); };
  }, [focused]);
  const { clipIndex: clip, progress } = timeline.state, s = lifecycleSceneAt(clip, progress);
  return <section ref={sectionRef} id="review-lifecycle" className={`review-scene motion-scene lifecycle-scene has-sidebar${focused ? " is-focused" : ""}`} data-scene="lifecycle" role={focused ? "dialog" : undefined} aria-modal={focused ? true : undefined} aria-label={focused ? "样本生命周期专注播放" : undefined}
    data-clip={clip} data-progress={progress} data-status={timeline.state.status} data-memory-count={s.memoryCount}
    data-seen={s.seen} data-update-count={s.updateCount} data-replay-source={s.replaySource ?? "none"}
    data-loss-sources={s.lossSources.join(",")} data-compare={s.lens > .5 ? "on" : "off"}>
    <header><p className="eyebrow">D1 · 单样本生命周期</p><h1>留下的是过去的响应，约束的是现在的网络。</h1><p>跟踪同一份 x₁：更新前生成 → 复制冻结 → 更新后入池 → 未来回放 → 匹配与联合更新。</p></header>
    <div className="lifecycle-shell"><aside className="lifecycle-sidebar" aria-label="播放控制与阶段说明">
      <div className="lifecycle-focus-heading"><div><span>DER</span><h2>样本生命周期</h2></div><button className={focused ? "lifecycle-exit-focus" : "lifecycle-focus-button"} onClick={() => changeFocus(!focused)}>{focused ? "返回阅读" : "专注播放 ↗"}</button></div>
    <div id="lifecycle-player" className="lifecycle-player"><SceneTransport timeline={timeline} clips={LIFECYCLE_CLIPS} label="样本生命周期" caption="自动完整播放一次。选择阶段停在起点；上一步先回本阶段起点，再回上一阶段起点。" /></div>
    <div className="lifecycle-context">
    <div className="lifecycle-reading" aria-live="polite"><strong>{LIFECYCLE_CLIPS[clip].id}</strong><FocusedNarration clip={clip} /></div>
    <div className="lifecycle-equation" data-vqa-check-clipping>{clip >= 6
      ? <><math display="block" aria-label="历史匹配损失等于各类当前分数与冻结历史分数之差的平方和"><msub><mi>L</mi><mtext>dark</mtext></msub><mo>=</mo><munderover><mo>∑</mo><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>C</mi></munderover><msup><mrow><mo>(</mo><msub><mi>a</mi><mrow><mi>j</mi><mo>,</mo><mi>k</mi></mrow></msub><mo>−</mo><msub><mi>z</mi><mrow><mn>1</mn><mo>,</mo><mi>k</mi></mrow></msub><mo>)</mo></mrow><mn>2</mn></msup><mo>=</mo><mn>2</mn></math><span>□ 历史 z₁ 冻结　● 本次 aⱼ 可反传</span></>
      : <p>原图 x₁ 与数值 z₁ 保持同源身份。DER 记录为 (x₁,z₁)，其中不保存标签。</p>}</div>
    <details className="lifecycle-example-note"><summary>合成例 · 示例与数值说明</summary><p className="lifecycle-provenance">Claude、GPT、DeepSeek 像素标识作为本例的三个图像类别。两次给定教学输出为 z₁=(2,1,0)、aⱼ=(1,2,0)，不表示三个模型的性能。x₂ 的更新前输出 z₂=(u₁,u₂,u₃) 仅作符号表示，与旧图的回放输出 aⱼ 区分。网络为结构示意，不执行数值训练。</p></details>
    </div>
    </aside><div className="lifecycle-viewport"><svg className="lifecycle-canvas" viewBox="0 0 1120 640" role="img" aria-labelledby="lc-title lc-description">
      <defs><marker id="lc-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1 7 4 1 7" fill="none" stroke="#a67840" strokeWidth="1.4" /></marker></defs>
      <title id="lc-title">一份样本的历史响应怎样产生、保存并约束未来训练</title><desc id="lc-description">{NARRATION[clip]} 网络为结构抽象，两次输出为给定教学数据。</desc>
      <g opacity={Math.max(0, 1 - s.lens * 3)} data-loss-lane>
        <rect x={G.loss.y.x} y={G.loss.y.y} width={G.loss.y.w} height={G.loss.y.h} rx="10" className="lc-label-chip" />
        <text x={G.loss.y.x + 12} y={G.loss.y.y + 19} className="lc-label-chip-title">标签 y{s.later ? "₂ = GPT" : "₁ = Claude"}</text>
        <text x={G.loss.y.x + 12} y={G.loss.y.y + 35} className="lc-label-chip-note">独立监督</text>
        <rect x={G.loss.ce.x} y={G.loss.ce.y} width={G.loss.ce.w} height={G.loss.ce.h} rx="11" className="lc-ce-node" />
        <text x={780} y={78} className="lc-ce-node-title">{s.later ? "CE(bⱼ, y₂)" : "CE(aᵢ, y₁)"}</text>
        <path d="M926 59V85" className="lc-rule" />
        <circle cx={944} cy={72} r="3" className={s.ceState === "updated" ? "lc-status-dot is-updated" : "lc-status-dot"} />
        <text x={958} y={77} className="lc-state">{clip === 3 && s.update < .82 ? `正在反传 · ${Math.round(s.update * 100)}%` : s.ceState === "updated" ? "已反传一次" : s.later && s.replay < .54 ? "等待 x₂ 前向" : s.later ? "等待联合更新" : "等待参数更新"}</text>
        {clip === 3 && <g><GradientPath d="M760 72H675Q667 72 667 80V124" progress={windowAt(s.update, .04, .6)} /><text x={679} y={60} className="lc-gradient-label">∇θ · 一次更新</text></g>}
      </g>
      <Network s={s} /><Sockets s={s} />
      <g opacity={1 - windowAt(s.compare, 0, .06)} data-data-column>
        <g transform={`translate(${G.sample.x} ${G.sample.y})`}><SampleCard size={96} model={s.later ? 1 : 0} id={s.later ? "sample:x2" : s.sampleId} /></g>
        <text x={82} y={272} textAnchor="middle" className="lc-object-title">{s.later ? "当前 x₂" : "原图 x₁"}</text>
        <text x={82} y={293} textAnchor="middle" className="lc-small">{s.later ? "本步的新数据" : "留存 · 不参与更新"}</text>
        <AugmentationStation y={130} replay={false} rotation={s.later ? s.currentAugment : s.firstAugment} crop={s.later ? s.currentCrop : s.firstCrop} />
        {s.later && <AugmentationStation y={316} replay rotation={s.replayAugment} crop={s.replayCrop} />}
        <MotionTrail points={G.path.intake} progress={s.later ? s.currentApproach : s.firstApproach} />
        <MotionTrail points={G.path.enter} progress={s.later ? s.currentMotion : s.inputMotion} />
        <MotionTrail points={G.path.replay} progress={s.later ? s.replayMotion : 0} />
        <MotionTrail points={G.path.replayDock} progress={s.later ? s.replayTransfer : 0} />
        <g transform={`translate(${(s.later ? s.currentInput : s.input).x - (s.later ? s.currentInputSize : s.inputSize) / 2} ${(s.later ? s.currentInput : s.input).y - (s.later ? s.currentInputSize : s.inputSize) / 2})`}>
          <SampleCard size={s.later ? s.currentInputSize : s.inputSize} model={s.later ? 1 : 0} crop id={s.later ? "view:x2:j" : "view:x1:i"} augmentation={s.later ? s.currentAugment : s.firstAugment} cropProgress={s.later ? s.currentCrop : s.firstCrop} />
        </g>
        {s.later && s.replay > .58 && <g transform={`translate(${s.replayInput.x - s.replayInputSize / 2} ${s.replayInput.y - s.replayInputSize / 2})`}>
          <SampleCard size={s.replayInputSize} crop id="replay:x1:j" augmentation={s.replayAugment} cropProgress={s.replayCrop} rotateSign={1} />
        </g>}
      </g>
      <ScoreTiles s={s} />
      {s.hasTarget && s.lens < .99 && s.recordVisible < .6 && <g opacity={1 - s.lens}>
        <FrozenBlock rect={s.blockNow} z={s.z} note="x₁ @ i · 独立副本" markersOpacity={windowAt(s.copy, .86, 1)} />
        {s.copy > .02 && s.copyPoints.map((p, k) => <rect key={k} x={p.x - 5.5} y={p.y - 5.5} width="11" height="11" rx="2" className="lc-copy-mark" opacity={1 - windowAt(s.copy, .8, 1)} data-copy-point={k} />)}
      </g>}
      {s.lens > .01 && <Comparison s={s} />}
      <MemoryBand s={s} /><CurrentCandidate s={s} />
      {s.lens > .01 && <g opacity={windowAt(s.compare, .32, .39)} data-carried-target>
        {s.targetPoints.map((p, k) => <rect key={k} x={p.x - 5.5} y={p.y - 5.5} width="11" height="11" rx="2" className="lc-history-mark" data-comparison-history={k} />)}
      </g>}
    </svg></div></div>

  </section>;
}
