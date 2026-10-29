import { ReservoirFormulaLesson } from "./FormulaLessons";
import SceneTransport, { useSceneTimeline } from "./review/SceneTransport";
import ModelPixel from "./review/ModelPixel";
import { windowAt, curve } from "./review/lifecycle-model";
import { RESERVOIR_CLIPS, RESERVOIR_INPUTS, reservoirSceneAt, type MemoryRecord } from "./reservoir-model";
import { Term } from "./Reference";
import "./reservoir.css";

function Record({ record, x, y, opacity = 1 }: { record: MemoryRecord; x: number; y: number; opacity?: number }) {
  return <g transform={`translate(${x} ${y})`} opacity={opacity} data-record={record.id} data-frozen={record.z.join(",")} data-origin={record.origin}>
    <rect width="264" height="106" rx="12" className="rv-record"/><rect x="12" y="14" width="64" height="64" rx="9" className="rv-image"/>
    <ModelPixel model={record.model} x={23} y={25} size={42}/><text x="44" y="96" textAnchor="middle" className="rv-id">{record.id}</text>
    <text x="92" y="25" className="rv-caption">□ 冻结 z · {record.origin}</text>
    {record.z.map((v,k) => <g key={k}><rect x={92+k*50} y="37" width="43" height="38" rx="4" className={`rv-tile rv-tone-${k}`}/><text x={113+k*50} y="64" textAnchor="middle" className="rv-value">{v}</text></g>)}
    <text x="92" y="94" className="rv-caption">原图与数值一起存取</text>
  </g>;
}
export default function Reservoir({focused=false}: {focused?:boolean;chapterId?:string;moduleId?:string}) {
  const timeline = useSceneTimeline(RESERVOIR_CLIPS);
  const { clipIndex: clip, progress: p } = timeline.state, s = reservoirSceneAt(clip,p);
  const arrive = windowAt(p,.02,.28), travel = windowAt(p,.52,.9), draw = windowAt(p,.3,.47);
  const start = {x:60+clip*126,y:24}, candidate = {x:180,y:180};
  const dest = s.slot === null ? {x:822,y:175} : {x:174+s.slot*510,y:402};
  const a = curve(arrive,start,{x:start.x,y:130},{x:150,y:180},candidate);
  const b = curve(travel,candidate,{x:440,y:180},{x:dest.x,y:330},dest);
  const pos = p < .52 ? a : b;
  const titles = ["有空位，直接留下。","第二条记录，进入另一个空槽。","抽到槽 0，旧记录离开，新记录进入。","抽到容量以外的位置，候选离开，记忆保留。"];
  const notes = [
    "x₁ 已完成当前训练。把原图与更新前冻结的 z₁ 作为一个候选，直接放进 slot 0；写入完成后 N 从 0 变成 1。",
    "K 始终为 2。x₂ 写入 slot 1，x₁ 的原图、冻结值和生成时刻继续保留；N 从 1 变成 2。",
    "插入前 N=2，从 0、1、2 等概率抽取。本例预设 j=0<K，x₁ 离开 slot 0，x₃ 接替；N 变为 3。",
    "插入前 N=3，从 0、1、2、3 等概率抽取。本例预设 j=3≥K，x₄ 不入池，已有 x₃/x₂ 不变；N 仍变为 4。x₄ 此前已参与当前训练。",
  ];
  return <section id="reservoir-player" className="reservoir-scene" data-scene="reservoir" data-clip={clip} data-progress={p} data-status={timeline.state.status} data-seen={s.state.N} data-memory={s.state.M.map(r=>r.id).join(",")} data-decision={s.decision} data-committed={s.committed}>
    {!focused && <p className="lesson-intro">已经知道一条记录要保存原图与 <Term id="z">冻结响应</Term>。但流不会停止，空间只有 K 条。Reservoir 逐项决定谁留下；下面从空池开始，看四项候选如何改变同一份记忆。</p>}
    <div className="rv-heading"><div><p className="eyebrow">RESERVOIR / 在线选留</p><h3>流继续来，记忆保持两格。</h3></div><div className="rv-state" aria-label="记忆状态"><span>K <b>2</b><small>固定容量</small></span><span>N <b data-count>{s.state.N}</b><small>已处理流项</small></span><span>|M| <b>{s.state.M.length}</b><small>当前记录数</small></span></div></div>
    <ReservoirFormulaLesson/>
    <SceneTransport timeline={timeline} clips={RESERVOIR_CLIPS} label="Reservoir" showTiming={false} caption="四次输入连续播放；选择阶段可回到该次输入前。抽签使用教学预设随机结果。" />
    <div className="rv-stage"><svg viewBox="0 0 1120 556" role="img" aria-label="四项流输入、候选判断与两个固定记忆槽" className="rv-canvas">
      <path d="M60 78H600" className="rv-stream-line"/><text x="642" y="65" className="rv-title">每次：当前训练已完成 → 再选留候选</text><text x="642" y="91" className="rv-caption">冻结 z 来自对应更新前网络，选留时不重新计算。</text>
      {RESERVOIR_INPUTS.map((r,i)=><g key={r.id} transform={`translate(${60+i*126} 24)`} opacity={i<clip?.35:i===clip?1:.65}>
        <rect width="60" height="62" rx="9" className="rv-image"/><ModelPixel model={r.model} x={13} y={8} size={34}/><text x="30" y="55" textAnchor="middle" className="rv-id">{r.id}</text>
        <text x="30" y="86" textAnchor="middle" className="rv-caption">{i<clip?"已处理":i===clip?"本次输入":"稍后到达"}</text>
      </g>)}
      <rect x="152" y="155" width="320" height="158" rx="15" className="rv-candidate-place"/><text x="180" y="148" className="rv-caption">本次候选 · (x,z) 的身份始终一起移动</text>
      <g className="rv-decision"><rect x="630" y="146" width="430" height="178" rx="14" className="rv-decision-bg"/>
        <text x="654" y="178" className="rv-title">{s.j===undefined?"N < K：无需抽签":`N = ${s.before.N}：从 [0,N] 等概率抽整数`}</text>
        {s.j===undefined?<><text x="654" y="224" className="rv-decision-large">直接追加到 slot {s.slot}</text><text x="654" y="294" className="rv-caption">有空位，记录无需竞争。</text></>:
        <>{Array.from({length:s.before.N+1},(_,j)=><g key={j}><rect x={654+j*78} y="196" width="56" height="48" rx="8" className={j===s.j&&draw>.8?"rv-draw-chosen":"rv-draw"}/><text x={682+j*78} y="228" textAnchor="middle" className="rv-number">{j}</text><text x={682+j*78} y="267" textAnchor="middle" className="rv-caption">{j<2?`槽 ${j}`:"不入池"}</text></g>)}<text x="654" y="298" className="rv-caption" opacity={draw}>教学预设随机结果 j={s.j} · {s.slot===null?"拒收当前候选":`替换 slot ${s.slot}`}</text></>}
      </g>
      {[0,1].map(slot=><g key={slot}><rect x={100+slot*510} y="366" width="410" height="166" rx="15" className="rv-slot"/><text x={122+slot*510} y="391" className="rv-slot-label">M / slot {slot}</text><text x={305+slot*510} y="391" className="rv-caption">{s.state.M[slot]?"记录保留至下一次替换":"等待记录"}</text>{!s.before.M[slot]&&!s.committed&&<text x={305+slot*510} y="468" textAnchor="middle" className="rv-empty">空槽</text>}</g>)}
      {s.before.M.map((r,slot)=>{
        const leaving=s.evicted?.id===r.id;
        return <Record key={r.id} record={r} x={174+slot*510-(leaving?travel*150:0)} y={402} opacity={leaving?1-travel:1}/>;
      })}
      <Record record={s.candidate} x={pos.x} y={pos.y} opacity={s.slot===null?1-travel:Math.min(1,arrive*3)}/>
      {s.evicted&&<text x="68" y="351" className="rv-caption" opacity={Math.sin(travel*Math.PI)}>{s.evicted.id} 离开记忆 · 原冻结值未改写</text>}
    </svg></div>
    <div className="rv-narration" aria-live="polite"><strong>{titles[clip]}</strong><p>{notes[clip]}</p></div>
    <p className="quiet-note">与 iCaRL 的局部区别：iCaRL 在任务结束时按类别分配配额，用 Herding 选择代表图；这里逐流项在线选留，不需要稳定任务边界，也不保证类别均衡。</p><p className="quiet-note">本场景是独立的合成入池序列，z 为给定的更新前输出；没有模拟网络优化。它只放大训练结束后的选留动作。未入池 ≠ 未参与当前训练。</p>
  </section>;
}
