import SceneTransport, { useSceneTimeline } from './review/SceneTransport';
import { LIFECYCLE_FIXTURE as F } from './review/lifecycle-model';
import { Vector } from './DerPrimitives';
const CLIPS = [{ id: '更新前取得输出', durationMs: 1200, holdMs: 700 }, { id: '复制并冻结数值', durationMs: 2200, holdMs: 1000 }, { id: '参数改变，副本不变', durationMs: 1400, holdMs: 1000 }] as const;
export function SnapshotOrigin() {
    const t = useSceneTimeline(CLIPS), { clipIndex: step, progress: p } = t.state;
    const copy = step > 1 ? 1 : step === 1 ? p : 0, updated = step === 2 && p === 1;
    const x = 380 + 330 * copy, y = 90 + 119 * copy;
    return <figure className="der-origin" data-front-scene="snapshot-origin" data-step={step} data-progress={p} data-theta={updated ? 1 : 0} data-frozen={copy === 1} data-target={F.z.join(',')}>
 <div className="der-diagram-scroll"><svg viewBox="0 0 1060 310" role="img" aria-label="θ₀先产生输出，复制数值成为冻结候选，再更新参数为θ₁；候选尚未入池">
 <path className="der-time-line" d="M72 42H972m-10 -6 10 6-10 6"/><text x="72" y="25">更新前 · θ₀</text><text x="972" y="25" textAnchor="end">更新后 · θ₁</text>
 <rect className="der-parameter" x="72" y="85" width="170" height="66" rx="10"/><text x="157" y="126" textAnchor="middle" className="der-svg-math">{updated ? 'θ₁' : 'θ₀'}</text><text x="157" y="180" textAnchor="middle" className="der-svg-muted">唯一当前模型</text><path className="der-route" d="M253 118H359m-10 -6 10 6-10 6"/><text x="477" y="76" textAnchor="middle" className="der-svg-title">θ₀ 的更新前输出</text><Vector x={380} y={90} values={F.z}/>
 <text x="477" y="174" textAnchor="middle" className="der-svg-muted">保留来源，复制数值</text><path className="der-copy-path" d="M480 147C480 230 600 230 700 230"/>
 <rect className="der-candidate" x="700" y="192" width="232" height="78" rx="10"/><text x="816" y="179" textAnchor="middle" className="der-svg-title">更新前冻结 · 尚未入池</text>
 {copy > 0 && <g data-vector-id="snapshot:frozen-copy" data-values={F.z.join(',')}><Vector x={x} y={y} values={F.z}/></g>}{copy === 1 && <text x="816" y="298" textAnchor="middle" className="der-svg-emphasis">z₁ 固定，不随参数重算</text>}
 </svg></div><figcaption aria-live="polite">{['用本步更新前的模型产生输出。历史目标来自真实的前向时刻。', '从输出复制一份独立数值，冻结成 z₁。复制发生在参数更新之前。', '当前模型继续更新到 θ₁；已冻结的 z₁ 仍为 (2,1,0)。更新后，候选才有机会入池。'][step]}</figcaption><SceneTransport timeline={t} clips={CLIPS} label="历史目标的来源" showTiming={false}/></figure>;
}
