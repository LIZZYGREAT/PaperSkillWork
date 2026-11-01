import { useId, useMemo, useState } from 'react';
import SceneTransport, { useSceneTimeline } from './review/SceneTransport';
import ModelPixel from './review/ModelPixel';
import { MODEL_CLASSES } from '../data/model-classes';
import { curve, mix, windowAt } from './review/lifecycle-model';
import { RESERVOIR_CLIPS, RESERVOIR_INPUTS, reservoirInsert, type MemoryRecord, type MemoryState } from './reservoir-model';
import { ReferenceButton } from './Reference';
import './der-redesign.css';
import './later-chapters.css';

const MAIN_CLIPS = RESERVOIR_CLIPS.slice(2);
function RecordTile({ record, x, y, width = 258, opacity = 1 }: { record: MemoryRecord; x: number; y: number; width?: number; opacity?: number }) {
  return <g transform={`translate(${x} ${y})`} opacity={opacity} data-record={record.id} data-frozen={record.z.join(',')} data-origin={record.origin}>
    <rect width={width} height="94" rx="12" className="rv2-record" />
    <ModelPixel model={record.model} x={15} y={24} size={43} />
    <text x="73" y="29" className="rv2-record-title">{record.id} <tspan className="rv2-category">{MODEL_CLASSES[record.model]}</tspan></text>
    <text x="73" y="53" className="rv2-note">更新前 {record.origin} 的冻结输出</text>
    <text x="73" y="79" className="rv2-vector">z = ({record.z.join(', ')})</text>
  </g>;
}
export default function Reservoir({ focused = false }: { focused?: boolean; chapterId?: string; moduleId?: string }) {
  const clips = focused ? RESERVOIR_CLIPS : MAIN_CLIPS;
  const timeline = useSceneTimeline(clips), localClip = timeline.state.clipIndex;
  const clip = localClip + (focused ? 0 : 2), p = timeline.state.progress;
  const [draws, setDraws] = useState([0, 3]);
  const steps = useMemo(() => {
    let state: MemoryState = { K: 2, N: 0, M: [] };
    return RESERVOIR_INPUTS.map((candidate, i) => { const step = reservoirInsert(state, candidate, i >= 2 ? draws[i - 2] : undefined); state = step.after; return step; });
  }, [draws]);
  const step = steps[clip], committed = p >= .9, state = committed ? step.after : step.before;
  const accepted = step.slot !== null, empty = step.before.N < state.K;
  const moving = windowAt(p, .42, .88), leaving = windowAt(p, .28, .53), rejecting = windowAt(p, .3, .84);
  const slotY = (slot: number) => 112 + slot * 130;
  const candidateAt = accepted ? curve(moving, { x: 40, y: 130 }, { x: 340, y: 130 }, { x: 510, y: slotY(step.slot!) }, { x: 700, y: slotY(step.slot!) }) : { x: 40 + rejecting * 28, y: 130 + rejecting * 105 };
  const id = useId().replace(/:/g, '');
  const outcome = step.decision === 'append' ? `空槽 ${step.slot} 可用，直接追加` : accepted ? `j=${step.j} < K，替换 slot ${step.slot}` : `j=${step.j} ≥ K，拒收候选，旧池保留`;
  const choose = (j: number) => { setDraws(values => values.map((value, i) => i === clip - 2 ? j : value)); timeline.start(localClip); };

  return <section className="der-redesign later-lesson reservoir-lesson" data-scene="reservoir" data-clip={clip} data-progress={p} data-status={timeline.state.status} data-seen={state.N} data-memory={state.M.map(r => r.id).join(',')} data-committed={committed}>
    <header className="later-scene-heading"><div><h3>记忆已满，下一条该留给谁？</h3><p>两个槽位已经装下旧记录，新的冻结候选仍会到来。蓄水池抽样让每个流项获得公平的留存机会，不必预先知道数据流有多长。</p></div><dl className="later-state-strip"><div><dt>固定容量 K</dt><dd>{state.K}</dd></div><div><dt>已处理 N</dt><dd>{state.N}</dd></div><div><dt>池中记录</dt><dd>{state.M.length}</dd></div></dl></header>
    <div className="rv2-stage"><svg className="rv-canvas" viewBox="0 0 1120 500" role="img" aria-label="冻结候选通过公平抽签，替换固定双槽中的记录或被拒收；拒收也递增已处理计数">
      <defs><marker id={`${id}-arrow`} viewBox="0 0 8 8" markerWidth="6" markerHeight="6" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" className="later-arrowhead" /></marker></defs>
      <text x="40" y="77" className="later-svg-title">本轮候选 (x,z)</text><text x="40" y="105" className="later-svg-note">已经完成当前训练 · 等待选留</text>

      <text x="388" y="380" className="later-svg-title">{empty ? '空槽直接写入' : '在 [0,N] 等概率抽取 j'}</text>
      {!empty && Array.from({ length: step.before.N + 1 }, (_, j) => <g key={j} transform={`translate(${388 + j * 54} 400)`}><rect width="42" height="42" rx="8" className={j === step.j && p > .12 ? 'rv2-draw is-selected' : 'rv2-draw'} /><text x="21" y="28" textAnchor="middle" className="rv2-number">{j}</text></g>)}
      <text x="388" y="465" className="later-svg-note">{p > .12 ? outcome : empty ? '槽位未满，无须抽签' : `${step.before.N + 1} 个号码，机会相同`}</text>
      <path d="M607 421H652V350H672" className="later-connector" markerEnd={`url(#${id}-arrow)`} />
      <rect x="674" y="43" width="402" height="334" rx="20" className="rv2-memory" /><text x="700" y="81" className="later-svg-title">记忆 M</text><text x="1048" y="81" textAnchor="end" className="later-svg-note">始终只有 K 个槽位</text>
      {[0, 1].map(slot => <g key={slot}><text x="700" y={slotY(slot) - 10} className="rv2-slot-label">slot {slot}</text><rect x="700" y={slotY(slot)} width="348" height="94" rx="12" className="rv2-slot" />{!state.M[slot] && <text x="874" y={slotY(slot) + 54} textAnchor="middle" className="later-svg-note">空位</text>}</g>)}
      {state.M.map((record, slot) => {
        const retiring = !committed && step.decision === 'replace' && step.evicted?.id === record.id;
        return <RecordTile key={record.id} record={record} x={700 + (retiring ? leaving * 24 : 0)} y={slotY(slot)} width={348} opacity={retiring ? 1 - leaving : 1} />;
      })}
      {!committed && <RecordTile record={step.candidate} x={candidateAt.x} y={candidateAt.y} width={accepted ? mix(258,348,moving) : 258} opacity={accepted ? 1 : 1 - rejecting} />}

      <text x="40" y="493" className="later-svg-note">独立插入示例 · z 为给定冻结值；本场景不重新执行优化器。</text>
    </svg></div>
    {!empty && <div className="rv2-manual"><span>手动选择演示号码</span>{Array.from({ length: step.before.N + 1 }, (_, j) => <button key={j} aria-pressed={step.j === j} onClick={() => choose(j)}>j = {j}</button>)}<small>这是可复现的抽样结果演示。</small></div>}
    <p className="later-event" aria-live="polite">{committed ? `${outcome}。无论是否入池，N 都增加 1；参数更新已经完成，不会被撤销。` : `进入本步：N=${step.before.N}，M=[${step.before.M.map(r => r.id).join(', ')}]。${outcome}。`}</p>
    <SceneTransport timeline={timeline} clips={clips} label="在线记忆选留" showTiming={false} teachingProgress />
    <div className="later-reading-pair"><div><h4>公平针对流项，不保证类别均衡。</h4><p>满池时从 N+1 个整数中等概率抽签，当前候选入池概率为 K/(N+1)。处理完 n≥K 条数据后，每个流项的边际留存概率都是 K/n。</p><p className="rv-inline-rule">j ∼ Uniform&#123;0,…,N&#125;；j &lt; K 时替换 slot j；无论结果如何，N ← N + 1。</p></div><div><h4>本条没留下，也已经学过。</h4><p>拒收决定的是未来能否被回放。它不撤销当前样本已经参与的训练，也不清空两个旧槽位。空槽的追加规则则与前一章相同。</p><ReferenceButton term="reservoir">展开 K/n 的归纳解释</ReferenceButton></div></div>
  </section>;
}

