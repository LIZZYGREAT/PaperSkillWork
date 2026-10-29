import { useId } from "react";
import SceneTransport, { useSceneTimeline } from "./review/SceneTransport";
import ModelPixel from "./review/ModelPixel";
import { curve, mix, windowAt } from "./review/lifecycle-model";
import { GradientRoute, MotionTrail } from "./review/MotionTrail";
import { RESERVOIR_CLIPS, RESERVOIR_INPUTS, reservoirSceneAt, type MemoryRecord } from "./reservoir-model";
import { ReferenceButton } from "./Reference";
import "./reservoir.css";
import "./flow-refinements.css";

function RecordTile({ record, x, y, opacity = 1 }: { record: MemoryRecord; x: number; y: number; opacity?: number }) {
  return <g transform={`translate(${x} ${y})`} opacity={opacity} data-record={record.id} data-frozen={record.z.join(",")} data-origin={record.origin}>
    <rect width="278" height="88" rx="11" className="rv-record-card" />
    <rect x="8" y="11" width="42" height="42" rx="8" className="rv-image" />
    <ModelPixel model={record.model} x={13} y={16} size={32} />
    <text x="58" y="24" className="rv-record-label">{record.id} · 原图随记录保留</text>
    <text x="58" y="45" className="rv-record-title">冻结响应 z</text>
    {record.z.map((value, index) => <g key={index}>
      <rect x={58 + index * 67} y="56" width="59" height="24" rx="5" className={`rv-tone rv-tone-${index}`} />
      <text x={87 + index * 67} y="73" textAnchor="middle" className="rv-value">{value}</text>
    </g>)}
  </g>;
}

function ReservoirToken({ record, x, y, label, detail, rejected = false }: {
  record: MemoryRecord;
  x: number;
  y: number;
  label: string;
  detail: string;
  rejected?: boolean;
}) {
  return <g transform={`translate(${x} ${y})`} className={`rv-token${rejected ? " is-rejected" : ""}`} data-record={record.id}>
    <rect width="154" height="52" rx="10" />
    <ModelPixel model={record.model} x={8} y={10} size={32} />
    <text x="47" y="22" className="rv-token-title">{label}</text>
    <text x="47" y="39" className="rv-token-detail">{detail}</text>
  </g>;
}

export default function Reservoir({ focused = false }: { focused?: boolean; chapterId?: string; moduleId?: string }) {
  const timeline = useSceneTimeline(RESERVOIR_CLIPS);
  const { clipIndex: clip, progress: p } = timeline.state;
  const s = reservoirSceneAt(clip, p);
  const defsId = useId().replace(/:/g, "");
  const slotX = [230, 590] as const;
  const slotY = 324;
  const slotWidth = 300;
  const slotCenter = [380, 740] as const;
  const streamX = [140, 420, 700, 980] as const;
  const gate = { x: 410, y: 157, width: 300, height: 102 };
  const exitBay = { x: 24, y: 340, width: 180, height: 108 };
  const rejectBay = { x: 916, y: 340, width: 180, height: 108 };
  const gateCenter = gate.x + gate.width / 2;
  const accepted = s.slot !== null;
  const destinationCenter = s.slot === null ? null : slotCenter[s.slot];
  const committed = s.committed;
  const visibleMemory = s.state.M;
  const seen = s.state.N;
  const drawn = s.j !== undefined && p > .1;
  const replacementExit = windowAt(p, .3, .54);
  const candidateFlight = windowAt(p, .42, .88);
  const sourceX = streamX[clip];
  const feedTarget = sourceX < gate.x
    ? { x: gate.x, y: gate.y + 20 }
    : sourceX > gate.x + gate.width
      ? { x: gate.x + gate.width, y: gate.y + 20 }
      : { x: sourceX, y: gate.y };
  const feedDx = feedTarget.x - sourceX;
  const feedDy = feedTarget.y - 94;
  const feedLength = Math.hypot(feedDx, feedDy) || 1;
  const feedStart = { x: sourceX + feedDx / feedLength * 28, y: 94 + feedDy / feedLength * 28 };
  const feedPath = `M${feedStart.x} ${feedStart.y} C${feedStart.x + feedDx * .34} ${feedStart.y + feedDy * .34} ${feedTarget.x - feedDx * .18} ${feedTarget.y - feedDy * .22} ${feedTarget.x} ${feedTarget.y}`;
  const acceptedPoints = destinationCenter === null ? null : [
    { x: gateCenter, y: gate.y + gate.height + 18 },
    { x: gateCenter + (destinationCenter < gateCenter ? -160 : 160), y: gate.y + gate.height + 18 },
    { x: destinationCenter, y: slotY + 24 },
    { x: destinationCenter, y: slotY + 86 },
  ] as const;
  const outputPath = acceptedPoints
    ? `M${acceptedPoints[0].x} ${acceptedPoints[0].y} C${acceptedPoints[1].x} ${acceptedPoints[1].y} ${acceptedPoints[2].x} ${acceptedPoints[2].y} ${acceptedPoints[3].x} ${acceptedPoints[3].y}`
    : null;
  const rejectedPoints = [
    { x: gate.x + gate.width - 3, y: gate.y + 72 },
    { x: 837, y: gate.y + 89 },
    { x: 1027, y: gate.y + 79 },
    { x: rejectBay.x + 90, y: rejectBay.y + 68 },
  ] as const;
  const rejectedPath = `M${rejectedPoints[0].x} ${rejectedPoints[0].y} C${rejectedPoints[1].x} ${rejectedPoints[1].y} ${rejectedPoints[2].x} ${rejectedPoints[2].y} ${rejectedPoints[3].x} ${rejectedPoints[3].y}`;
  const evictedPoints = [
    { x: slotCenter[0], y: slotY + 73 },
    { x: 342, y: 349 },
    { x: 245, y: 408 },
    { x: exitBay.x + exitBay.width / 2, y: exitBay.y + 66 },
  ] as const;
  const evictedPath = `M${evictedPoints[0].x} ${evictedPoints[0].y} C${evictedPoints[1].x} ${evictedPoints[1].y} ${evictedPoints[2].x} ${evictedPoints[2].y} ${evictedPoints[3].x} ${evictedPoints[3].y}`;
  const exitScale = mix(1, .57, replacementExit);
  const exitCenter = curve(replacementExit,
    { x: slotCenter[0], y: slotY + 73 },
    { x: 342, y: 349 },
    { x: 245, y: 408 },
    { x: exitBay.x + exitBay.width / 2, y: exitBay.y + 66 });
  const exitX = exitCenter.x - 139 * exitScale;
  const exitY = exitCenter.y - 44 * exitScale;
  const acceptedOrigin = acceptedPoints ? curve(candidateFlight,
    { x: acceptedPoints[0].x - 77, y: acceptedPoints[0].y - 26 },
    { x: acceptedPoints[1].x - 77, y: acceptedPoints[1].y - 26 },
    { x: acceptedPoints[2].x - 77, y: acceptedPoints[2].y - 26 },
    { x: acceptedPoints[3].x - 77, y: acceptedPoints[3].y - 26 }) : null;
  const rejectedOrigin = curve(candidateFlight,
    { x: rejectedPoints[0].x - 77, y: rejectedPoints[0].y - 26 },
    { x: rejectedPoints[1].x - 77, y: rejectedPoints[1].y - 26 },
    { x: rejectedPoints[2].x - 77, y: rejectedPoints[2].y - 26 },
    { x: rejectedPoints[3].x - 77, y: rejectedPoints[3].y - 26 });
  const titles = ["空槽先接收；从第二项起再抽签。", "第二项进入另一槽；容量保持不变。", "抽到槽 0：旧记录离开，新记录占同一槽。", "抽到 3：候选离池，记忆内容保持不变。"];
  const notes = [
    "x₁ 已完成当前训练，连同更新前冻结的 z₁ 写入 slot 0；写入后 N 从 0 变为 1。",
    "x₂ 写入 slot 1。x₁ 的图像、冻结响应与生成时刻一起保留；N 从 1 变为 2。",
    "插入前 N=2，预设 j=0<K；x₁ 离开 slot 0，x₃ 接替，slot 1 不动；N 变为 3。",
    "插入前 N=3，预设 j=3≥K；x₄ 不入池，但它此前已参与当前训练；N 仍增加到 4。",
  ];

  return <section id="reservoir-player" className={`reservoir-scene${focused ? " is-focused" : ""}`} data-scene="reservoir" data-clip={clip} data-progress={p} data-status={timeline.state.status} data-seen={s.state.N} data-memory={s.state.M.map(record => record.id).join(",")} data-decision={s.decision} data-committed={committed}>
    <div className="rv-heading">
      <div><p className="eyebrow">S4 / RESERVOIR · 在线选留</p><h3>流继续来，有限记忆只保留两个槽。</h3><p>每个候选先完成本步训练，再决定是否进入同一份记忆。</p></div>
      <div className="rv-state" aria-label="记忆状态">
        <span><small>固定容量</small><b>K <i>2</i></b></span>
        <span><small>处理流项</small><b>N <i data-count>{seen}</i></b></span>
        <span><small>已存记录</small><b>|M| <i>{visibleMemory.length}</i></b></span>
      </div>
    </div>
    <SceneTransport timeline={timeline} clips={RESERVOIR_CLIPS} label="有限记忆 Reservoir" showTiming={false} caption="沿同一条流前进；选择阶段可回到该项处理前。抽签使用教学预设结果。" />
    <div className="rv-stage">
      <svg className="rv-canvas" viewBox="0 0 1120 500" role="img" aria-label="候选经过选留决策后写入固定记忆槽；被替换的记录与拒收候选分别离池">
        <defs>
          <linearGradient id={`${defsId}-stream`} x1="0" x2="1"><stop offset="0" stopColor="#d5dfd6"/><stop offset=".52" stopColor="#8ba58e"/><stop offset="1" stopColor="#d5dfd6"/></linearGradient>
          <marker id={`${defsId}-stream-arrow`} viewBox="0 0 8 8" markerWidth="5" markerHeight="5" refX="7" refY="4" orient="auto"><path d="M1 1 7 4 1 7" className="rv-arrow-stream"/></marker>
          <marker id={`${defsId}-feed-arrow`} viewBox="0 0 8 8" markerWidth="5" markerHeight="5" refX="7" refY="4" orient="auto"><path d="M1 1 7 4 1 7" className="rv-arrow-feed"/></marker>
          <marker id={`${defsId}-store-arrow`} viewBox="0 0 8 8" markerWidth="5" markerHeight="5" refX="7" refY="4" orient="auto"><path d="M1 1 7 4 1 7" className="rv-arrow-store"/></marker>
          <marker id={`${defsId}-away-arrow`} viewBox="0 0 8 8" markerWidth="5" markerHeight="5" refX="7" refY="4" orient="auto"><path d="M1 1 7 4 1 7" className="rv-arrow-away"/></marker>
        </defs>
        <text x="54" y="34" className="rv-flow-heading">持续输入流</text>
        <g transform="translate(850 6)" className="rv-flow-legend">
          <path d="M0 8H36" className="rv-legend-store" markerEnd={`url(#${defsId}-store-arrow)`}/><text x="45" y="12">写入</text>
          <path d="M94 8H130" className="rv-legend-away" markerEnd={`url(#${defsId}-away-arrow)`}/><text x="139" y="12">离池 / 替换</text>
        </g>
        <path d="M74 94H1040" className="rv-stream-track" markerEnd={`url(#${defsId}-stream-arrow)`} />
        {RESERVOIR_INPUTS.map((record, index) => <g key={record.id} className={`rv-stream-item${index === clip ? " is-current" : index < clip ? " is-past" : ""}`} transform={`translate(${streamX[index]} 94)`}>
          <text y="-42" textAnchor="middle" className="rv-stream-id">{record.id}</text>
          <circle r="28" className="rv-stream-orbit" />
          <ModelPixel model={record.model} x={-18} y={-18} size={36} />
          {index === clip ? <text x="34" y="4" className="rv-stream-status is-current">本次</text> : <text y="48" textAnchor="middle" className="rv-stream-status">{index < clip ? "已处理" : "待到达"}</text>}
        </g>)}
        <path d={feedPath} className="rv-candidate-feed" markerEnd={`url(#${defsId}-feed-arrow)`} />
        {outputPath && <GradientRoute d={outputPath} progress={committed ? 0 : candidateFlight} className="rv-route-accepted" markerEnd={`url(#${defsId}-store-arrow)`} width={1120} height={500} />}
        {s.slot === null && <GradientRoute d={rejectedPath} progress={committed ? 0 : candidateFlight} className="rv-route-away" markerEnd={`url(#${defsId}-away-arrow)`} width={1120} height={500} />}
        {s.evicted && <GradientRoute d={evictedPath} progress={committed ? 0 : replacementExit} className="rv-route-away rv-route-exit" markerEnd={`url(#${defsId}-away-arrow)`} width={1120} height={500} />}
        {outputPath && !committed && accepted && <MotionTrail points={acceptedPoints!} progress={candidateFlight} className="rv-motion-trail is-store" />}
        {s.slot === null && !committed && <MotionTrail points={rejectedPoints} progress={candidateFlight} className="rv-motion-trail is-away" />}
        {s.evicted && !committed && <MotionTrail points={evictedPoints} progress={replacementExit} className="rv-motion-trail is-exit" />}

        <g transform={`translate(${gate.x} ${gate.y})`} className="rv-decision-card">
          <rect width={gate.width} height={gate.height} rx="13" />
          <path d={`M0 34H${gate.width}`} className="rv-decision-divider" />
          <text x="18" y="23" className="rv-decision-kicker">{s.j === undefined ? "空槽优先" : "满池后抽签"}</text>
          <text x="18" y="65" className="rv-decision-result">{s.j === undefined ? `直接写入 slot ${s.slot}` : `j = ${drawn ? s.j : "…"}`}</text>
          <text x="18" y="86" className="rv-decision-note">{s.j === undefined ? "当前有空槽" : `等概率选择 0—${s.before.N}`}</text>
          {s.j !== undefined && Array.from({ length: s.before.N + 1 }, (_, choice) => <g key={choice} transform={`translate(${158 + choice * 31} 49)`}>
            <rect width="25" height="26" rx="7" className={`rv-draw-choice${drawn && choice === s.j ? s.slot === null ? " is-away" : " is-selected" : ""}`} />
            <text x="12.5" y="17" textAnchor="middle" className="rv-draw-number">{choice}</text>
          </g>)}
        </g>

        <text x="560" y="300" textAnchor="middle" className="rv-memory-heading">M · 固定容量 K = 2</text>
        {[0, 1].map(slot => {
          const record = visibleMemory[slot];
          const isTarget = accepted && s.slot === slot;
          const isLeaving = !committed && Boolean(s.evicted && record?.id === s.evicted.id && replacementExit > .04);
          const status = record ? isLeaving ? "移出中" : isTarget && committed ? "刚写入" : "保留" : isTarget ? "等待写入" : "空槽";
          return <g key={slot} transform={`translate(${slotX[slot]} ${slotY})`}>
            <rect width={slotWidth} height="122" rx="14" className={`rv-memory-slot${record ? " is-occupied" : ""}${isTarget ? " is-target" : ""}`} />
            <text x="15" y="21" className="rv-slot-label">MEMORY · SLOT {slot}</text>
            <text x={slotWidth - 14} y="21" textAnchor="end" className={`rv-slot-status${isTarget ? " is-target" : ""}`}>{status}</text>
            {!record && <g transform={`translate(${slotWidth / 2} 74)`} className="rv-empty-slot"><circle r="12"/><path d="M-5 0H5M0 -5V5"/><text x="20" y="4">候选到达后写入</text></g>}
          </g>;
        })}
        <g transform={`translate(${exitBay.x} ${exitBay.y})`} className="rv-sink rv-sink-evicted">
          <rect width={exitBay.width} height={exitBay.height} rx="12" />
          <text x="13" y="20" className="rv-sink-title">移出记忆池</text><text x={exitBay.width - 13} y="20" textAnchor="end" className="rv-sink-mark">M OUT</text>
          {!s.evicted && <text x="13" y="68" className="rv-sink-empty">本步没有旧记录离开</text>}
          {s.evicted && committed && <ReservoirToken record={s.evicted} x={13} y={42} label={`${s.evicted.id} 离池`} detail={`原 slot ${s.slot}`} />}
        </g>
        <g transform={`translate(${rejectBay.x} ${rejectBay.y})`} className="rv-sink rv-sink-rejected">
          <rect width={rejectBay.width} height={rejectBay.height} rx="12" />
          <text x="13" y="20" className="rv-sink-title">未写入记忆</text><text x={rejectBay.width - 13} y="20" textAnchor="end" className="rv-sink-mark">POOL OUT</text>
          {accepted && <text x="13" y="68" className="rv-sink-empty">没有拒收候选</text>}
          {s.slot === null && committed && <ReservoirToken record={s.candidate} x={13} y={42} label={`${s.candidate.id} 拒收`} detail={`j = ${s.j} ≥ K`} rejected />}
        </g>

        {visibleMemory.map((record, slot) => {
          if (s.evicted?.id === record.id && !committed) return <g key={`leaving-${record.id}`} transform={`translate(${exitX} ${exitY}) scale(${exitScale})`} className="rv-moving-evicted"><RecordTile record={record} x={0} y={0} /></g>;
          return <RecordTile key={`${record.id}-${slot}`} record={record} x={slotX[slot] + 11} y={slotY + 29} />;
        })}
        {accepted && !committed && candidateFlight > 0 && acceptedOrigin && <g transform={`translate(${acceptedOrigin.x} ${acceptedOrigin.y})`}><ReservoirToken record={s.candidate} x={0} y={0} label={`${s.candidate.id} 新记录`} detail="准备写入同一槽" /></g>}
        {s.slot === null && !committed && candidateFlight > 0 && <g transform={`translate(${rejectedOrigin.x} ${rejectedOrigin.y})`}><ReservoirToken record={s.candidate} x={0} y={0} label={`${s.candidate.id} 候选`} detail="离开记忆流" rejected /></g>}
      </svg>
    </div>
    <div className="rv-caption" aria-live="polite"><strong>{titles[clip]}</strong><span>{notes[clip]}</span></div>
    <div className="rv-inline-rule"><strong>满池时</strong><code>j ∼ Uniform&#123;0, …, N&#125;</code><span><code>j &lt; K</code> → 替换 <code>slot j</code>；否则拒收。</span><b>每项处理后 N ← N + 1</b></div>
    <ReferenceButton term="reservoir">查看留存概率与 iCaRL 对照</ReferenceButton>
    <p className="quiet-note">本例抽签值是教学预设；类别不会因此获得固定配额。</p>
    <div className="scene-handoff"><span>下一问</span><p>候选已经完成当前训练；选留只决定未来能回放谁。下面把旧池接回训练：先读旧记录，再形成一次联合更新，最后才交回 Reservoir。</p></div>
  </section>;
}
