import React, { useMemo, useState } from 'react';
import { MathFormula } from '../components/MathFormula';
import { datasets } from '../data/knowledge';
import { coverageCopy, constraintPoints, oldSupportDrift, oldSupportPoints, responseLossOnConstraints, summarizeTeacherResponse, teacherOutput, studentOutput, type CoverageMode } from '../simulation/domainCoverage';
import { useReferenceHub } from '../components/ReferencePrimitives';

type PairId = 'imagenet-voc' | 'imagenet-cub' | 'imagenet-scenes' | 'places-voc' | 'places-cub' | 'places-scenes' | 'imagenet-mnist';
const pairs: { id: PairId; old: string; next: string; relation: string; result: string; evidence: string; sourceIds: [string, string] }[] = [
  { id: 'imagenet-voc', old: 'ImageNet', next: 'PASCAL VOC 2012', relation: '论文描述为相对相似的任务对。', result: 'Table 1 报告 ImageNet 旧任务与 VOC 新任务表现；VOC 使用 mAP。', evidence: 'Table 1 · task pair comparison', sourceIds: ['dataset:imagenet', 'dataset:voc'] },
  { id: 'imagenet-cub', old: 'ImageNet', next: 'CUB-200-2011', relation: '论文描述 CUB 与 ImageNet 相对不相似。', result: 'Table 1 报告该任务对；旧任务退化需绑定表内具体方法与架构解读。', evidence: 'Table 1(a)', sourceIds: ['dataset:imagenet', 'dataset:cub'] },
  { id: 'imagenet-scenes', old: 'ImageNet', next: 'MIT Indoor Scenes', relation: '论文未为此 pair 给出一个可普遍量化的相似度等级。', result: '单次新任务实验与 Figure 4 顺序实验使用相关任务设置。', evidence: 'Table 1(b) · Figure 4', sourceIds: ['dataset:imagenet', 'dataset:scenes'] },
  { id: 'places-voc', old: 'Places365', next: 'PASCAL VOC 2012', relation: '论文未把此 pair 的相似性写成数值；两者任务语义不同。', result: 'Table 1 和 Figure 4 包含相关设置；Figure 4 将 VOC 标签分阶段加入。', evidence: 'Table 1 · Figure 4', sourceIds: ['dataset:places365', 'dataset:voc'] },
  { id: 'places-cub', old: 'Places365', next: 'CUB-200-2011', relation: '论文描述 CUB 与 Places365 相对不相似。', result: '论文报告该设置下 LwF 的旧任务退化高于若干更易的任务对；此为定性概括。', evidence: 'Table 1 · author discussion', sourceIds: ['dataset:places365', 'dataset:cub'] },
  { id: 'places-scenes', old: 'Places365', next: 'MIT Indoor Scenes', relation: '论文描述 Places365 与 MIT Indoor Scenes 相对相似。', result: '任务类别均涉及场景；页面不据此生成数值域距离。', evidence: 'Table 1 · author discussion', sourceIds: ['dataset:places365', 'dataset:scenes'] },
  { id: 'imagenet-mnist', old: 'ImageNet', next: 'MNIST', relation: '论文刻意选择的高度不相似任务案例。', result: '用于观察极端任务差异下的新输入响应约束与旧任务保持边界。', evidence: 'Table 1 · author discussion', sourceIds: ['dataset:imagenet', 'dataset:mnist'] },
];

const datasetById = new Map(datasets.map((item) => [item.id, item]));

export function SceneG() {
  const { openHub } = useReferenceHub();
  const [coverage, setCoverage] = useState<CoverageMode>('partial');
  const [sampleCount, setSampleCount] = useState(4);
  const [pairId, setPairId] = useState<PairId>('places-cub');
  const [leaked, setLeaked] = useState(false);
  const probes = useMemo(() => constraintPoints(coverage, sampleCount), [coverage, sampleCount]);
  const pair = pairs.find((item) => item.id === pairId)!;
  const oldDataset = datasetById.get(pair.sourceIds[0])!;
  const newDataset = datasetById.get(pair.sourceIds[1])!;
  const responseA = responseLossOnConstraints('A', probes);
  const responseB = responseLossOnConstraints('B', probes);
  const driftA = oldSupportDrift('A', probes);
  const driftB = oldSupportDrift('B', probes);
  const diagnostic = summarizeTeacherResponse(probes);

  return <div className="v2-scene-content v2-scene-g">
    <section className="v2-g-intro v2-state-card">
      <div className="v2-section-title-row"><div><p className="v2-eyebrow">DOMAIN COVERAGE · PAPER EVIDENCE + SCHEMATIC</p><h2>新任务输入上的响应约束，覆盖了多少旧任务相关区域？</h2></div><button className="v2-intro-evidence" type="button" onClick={() => openHub({ evidenceId: 'C07' })}>论文边界 C07 ↗</button></div>
      <div className="v2-g-question-pair"><div><span>Response preservation sees</span><strong>p<sub>n</sub>(x) · X<sub>n</sub></strong><small>Teacher 在新任务输入上产生响应目标</small></div><i aria-hidden="true">↔</i><div><span>Old-task performance is evaluated over</span><strong>p<sub>o</sub>(x) · X<sub>o</sub></strong><small>旧任务表现关心旧域相关输入与标签</small></div></div>
      <p>下面的二维分布与一维函数都是 <b>Teaching Schematic</b>，用于区分覆盖与未观测区域；它们不是 ImageNet、Places365 或其他数据集的真实特征分布，也不计算“域距离分数”。</p>
      <div className="v2-g-risk-grid"><div><span>机制解读 · 训练时响应约束</span><strong><MathFormula id="formula:training_response" /></strong></div><div><span>旧任务评估关心的风险</span><strong><MathFormula id="formula:old_task_risk" /></strong></div></div>
    </section>

    <section className="v2-g-explorer v2-state-card">
      <div className="v2-section-title-row"><div><p className="v2-eyebrow">COVERAGE EXPLORER · QUALITATIVE STATES</p><h2>切换新旧样本覆盖示意</h2></div><span className="v2-source-badge is-toy">SCHEMATIC ONLY</span></div>
      <div className="v2-g-controls" role="group" aria-label="选择覆盖示意"><button aria-pressed={coverage === 'high'} onClick={() => setCoverage('high')}>较广覆盖</button><button aria-pressed={coverage === 'partial'} onClick={() => setCoverage('partial')}>部分重叠</button><button aria-pressed={coverage === 'low'} onClick={() => setCoverage('low')}>低重叠</button></div>
      <div className="v2-g-map-and-explainer"><CoverageMap mode={coverage} probes={probes} /><div className="v2-g-legend"><strong>{coverageCopy[coverage].title}</strong><p>{coverageCopy[coverage].description}</p><span><b className="v2-g-old-dot">○</b> 旧域参考样本 Xₒ / pₒ 支持区域</span><span><b className="v2-g-new-dot">●</b> 新域输入与 response-constraint 点 Xₙ</span><span className="v2-g-hatched-key">▧</span><span>未被直接 response matching 约束的示意区域</span><small>Coverage states are conceptual. No real distribution estimate or numeric similarity score is implied.</small></div></div>
      <div className="v2-g-support-view"><div><span>supp(p<sub>o</sub>)</span><i className={`is-${coverage}`} /></div><div><span>supp(p<sub>n</sub>)</span><i className={`is-${coverage}`} /></div><p>support 指分布主要产生样本的输入区域。交互比较的是响应约束样本落在哪些区域，不把“两个点的几何距离”当作 domain gap。</p></div>
    </section>

    <section className="v2-g-toy v2-state-card">
      <div className="v2-section-title-row"><div><p className="v2-eyebrow">SAME L<sub>old</sub> · DIFFERENT OLD-DOMAIN BEHAVIOR</p><h2>在 Xₙ 上同样匹配，旧域响应仍可能不同</h2></div><span className="v2-source-badge is-toy">TEACHING TOY · COMPUTED</span></div>
      <label className="v2-g-sample-control">response constraint sample count N <strong>{sampleCount}</strong><input type="range" min="3" max="6" step="1" value={sampleCount} onChange={(event) => setSampleCount(Number(event.target.value))} /></label>
      <FunctionCoveragePlot mode={coverage} probes={probes} />
      <div className="v2-g-toy-results"><div><span>Student A · L_old on Xₙ</span><strong>{fmt(responseA)}</strong><small>old-support response drift: {fmt(driftA)}</small></div><div><span>Student B · L_old on Xₙ</span><strong>{fmt(responseB)}</strong><small>old-support response drift: {fmt(driftB)}</small></div><aside>Student B 与 Teacher 在当前采样点上使用一个有根 toy 曲线相交；点间曲线可以偏离。两个 L<sub>old</sub> 均在 toy 的 Xₙ 上计算，旧域漂移另行计算，二者都不是 accuracy。</aside></div>
      <p className="v2-g-takeaway"><strong>small response loss on Xₙ ⇏ small old-task error over pₒ</strong><span>增加 N 会让当前示意区间采样更密，但不会自动改变区间本身；sample sparsity 与 distribution mismatch 是不同问题。</span></p>
    </section>

    <section className="v2-g-access v2-state-card">
      <div className="v2-section-title-row"><div><p className="v2-eyebrow">EXPERIMENT ACCESS INSPECTOR</p><h2>评估权限不等于训练权限</h2></div></div>
      <div className="v2-g-access-columns"><AccessList title="During adaptation" rows={[[false,'旧训练输入 Xₒ'],[false,'旧训练标签 Yₒ⁽gt⁾'],[true,'新任务输入 Xₙ'],[true,'新任务标签 Yₙ'],[true,'冻结 Teacher'],[true,'Teacher(Xₙ)']]} /><AccessList title="Research evaluation" rows={[[true,'旧 validation / test · 仅 evaluator'],[false,'用于梯度或 optimizer 更新'],[true,'新 validation / test · 评估']]} /></div>
      <label className="v2-g-leak-toggle"><input type="checkbox" checked={leaked} onChange={(event) => setLeaked(event.target.checked)} />演示：把旧 validation 样本用于 response matching</label>
      {leaked ? <div className="v2-g-protocol-error" role="alert"><strong>覆盖示意会变得更广，但实验协议违规</strong><span>旧 evaluation data 已泄漏进 adaptation。此开关只作协议审查示例，不执行训练，也不推荐这种做法。</span></div> : null}
    </section>

    <section className="v2-g-pairs v2-state-card">
      <div className="v2-section-title-row"><div><p className="v2-eyebrow">PAPER TASK-PAIR EXPLORER</p><h2>任务对信息与论文描述分开看</h2></div><button type="button" className="v2-intro-evidence" onClick={() => openHub({ evidenceId: 'E05' })}>实验注册 E05 ↗</button></div>
      <label className="v2-g-pair-select">选择任务对<select value={pairId} onChange={(event) => setPairId(event.target.value as PairId)}>{pairs.map((item) => <option key={item.id} value={item.id}>{item.old} → {item.next}</option>)}</select></label>
      <div className="v2-g-dataset-cards"><DatasetMiniCard card={oldDataset} onOpen={()=>openHub({cardId:oldDataset.id})} /><DatasetMiniCard card={newDataset} onOpen={()=>openHub({cardId:newDataset.id})} /></div>
      <div className="v2-g-evidence-interpretation"><div><span>Paper-described relation</span><strong>{pair.relation}</strong><small>{pair.evidence} · {pair.result}</small></div><div><span>Mechanism interpretation</span><strong>如果 Xₙ 不能覆盖旧任务相关区域，响应约束对这些未观测输入就没有直接监督。</strong><small>这提供一种可解释机制；不把测得的表现差异归因成唯一因果。</small></div></div>
      <div className="v2-g-diagnostic"><div><span>Teacher response diagnostic · Teaching Toy</span><strong>entropy {fmt(diagnostic.avgEntropy)} bits · top probability {fmt(diagnostic.avgTop)}</strong></div><p>Entropy 与 top probability 仅描述当前 Teacher toy response。它们单独不能证明旧域覆盖充分或不足。</p></div>
      <div className="v2-g-mismatch"><strong>Domain/task mismatch 可来自多处</strong><span>输入外观</span><span>标签语义</span><span>所需表示</span><span>判别特征</span><p>CUB 与 ImageNet 都是自然图像，但鸟类分类更依赖鸟种之间的细粒度判别特征。图像“看起来相似”不等于旧任务所需表示完全兼容。</p></div>
    </section>

    <section className="v2-g-loop v2-state-card"><div><p className="v2-eyebrow">CLOSE THE LOOP · SCENE A</p><h2>旧数据直接提供什么？</h2><p>Joint Training 使用 Xₒ,Yₒ 与 Xₙ,Yₙ；LwF adaptation 使用 Xₙ,Yₙ、Teacher 与 Teacher(Xₙ)。旧训练数据若可用，会提供针对 pₒ 的直接监督。LwF 不拥有这条训练路径。</p></div><div className="v2-g-loop-cards"><div><span>Joint Training</span><strong>Xₒ,Yₒ + Xₙ,Yₙ</strong><small>旧、新任务真实监督</small></div><i>↔</i><div><span>LwF</span><strong>Xₙ,Yₙ + Teacher(Xₙ)</strong><small>旧响应约束受 Xₙ 覆盖限制</small></div></div><footer><span>下一问：今天的 Student 成为明天的 Teacher 后，旧响应目标如何变化？</span><b>进入 Scene H →</b></footer></section>
  </div>;
}

function CoverageMap({ mode, probes }: { mode: CoverageMode; probes: number[] }) {
  const start = probes[0];
  const end = probes[probes.length - 1];
  const newPoints = probes.map((x, index) => [48 + (x - start) / Math.max(end - start, .01) * 300, 83 + Math.sin(index * 2.2 + 1) * 30]);
  const oldPoints = [[63,83],[84,116],[116,132],[148,143],[255,135],[284,147],[324,140],[348,127],[76,58],[327,57]];
  return <div className="v2-g-map-wrap"><svg viewBox="0 0 390 205" role="img" aria-label="标注为示意的旧域与新域输入支持区域，不代表真实数据分布"><defs><pattern id="unobserved-hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="8" stroke="#dad7cf" strokeWidth="2" /></pattern></defs><rect x="20" y="24" width="350" height="150" rx="16" fill="url(#unobserved-hatch)" stroke="#d4d1ca" /><text x="30" y="42" className="map-label">schematic input space · not a measured embedding</text><path d={mode==='high'?'M48 95 Q100 48 151 90 T252 91 Q309 72 352 113':mode==='partial'?'M46 110 Q118 130 157 93 T259 100 Q312 76 352 119':'M48 92 Q104 75 157 114 T254 124 Q312 77 352 94'} fill="none" stroke="#7c879f" strokeWidth="2" strokeDasharray="5 5" opacity=".7" />{oldPoints.map(([x,y],i)=><g key={`o${i}`}><circle cx={x} cy={y} r="5" fill="#fff" stroke="#667083" strokeWidth="2"/><text x={x+7} y={y-6} className="point-label">○</text></g>)}{newPoints.map(([x,y],i)=><g key={`n${i}`}><circle cx={x} cy={y} r="5.5" fill="#b0606a" stroke="#fff" strokeWidth="1.5"/><text x={x+7} y={y-6} className="point-label">●</text></g>)}<text x="28" y="190" className="axis-label">old-domain support ○</text><text x="231" y="190" className="axis-label">new constraints ●</text></svg><small>2D teaching schematic · {probes.length} new samples shown; x-positions follow the companion 1D toy setup</small></div>;
}

function FunctionCoveragePlot({ mode, probes }: { mode: CoverageMode; probes: number[] }) {
  const points = Array.from({ length: 101 }, (_, i) => -2 + 4 * i / 100);
  const xMap = (x: number) => 24 + (x + 2) / 4 * 540;
  const yMap = (y: number) => 110 - (y + 1.55) / 3.1 * 80;
  const pathFor = (which: 'teacher'|'a'|'b') => points.map((x, i) => `${i?'L':'M'} ${xMap(x)} ${yMap(which==='teacher'?teacherOutput(x):studentOutput(x,which==='a'?'A':'B',probes))}`).join(' ');
  return <div className="v2-g-function-plot"><svg viewBox="0 0 590 145" role="img" aria-label="Teaching Toy 函数：Teacher 与 Student A 在全图相同，Student B 在 X_n 约束点与 Teacher 相交，在点间偏移"><path d="M24 110 H564 M294 20 V112" stroke="#dedbd4" /><path d={pathFor('teacher')} fill="none" stroke="#576b9d" strokeWidth="2.5"/><path d={pathFor('a')} fill="none" stroke="#398274" strokeWidth="1.6" strokeDasharray="5 4"/><path d={pathFor('b')} fill="none" stroke="#bd6962" strokeWidth="2.5"/>{oldSupportPoints.map((x)=><circle key={`old-${x}`} cx={xMap(x)} cy="119" r="4.2" fill="#fff" stroke="#626d80" strokeWidth="1.8"/>)}{probes.map((x)=><circle key={`new-${x}`} cx={xMap(x)} cy={yMap(teacherOutput(x))} r="4.5" fill="#b0606a" stroke="#fff" strokeWidth="1.2"/>)}<text x="28" y="19" className="plot-title">output · computed toy</text><text x="28" y="139" className="plot-legend">━━ Teacher   - - Student A   ━━ Student B   ● Xₙ constraint   ○ Xₒ reference</text></svg><div><span>pₙ mode: {mode}</span><span>old-support markers are reference points for toy drift only</span></div></div>;
}

function AccessList({ title, rows }: { title:string; rows:[boolean,string][] }) { return <div className="v2-g-access-list"><strong>{title}</strong>{rows.map(([allowed,label])=><div key={label} className={allowed?'is-allowed':'is-blocked'}><b aria-label={allowed?'allowed':'blocked'}>{allowed?'✓':'×'}</b><span>{label}</span></div>)}</div>; }
function DatasetMiniCard({ card,onOpen }: { card: (typeof datasets)[number];onOpen:()=>void }) { return <article className="v2-g-dataset-mini"><span>Dataset Card · {card.category}</span><h3>{card.title}</h3><p>{card.taskType} · {card.inputType} · {card.classes}</p><dl><div><dt>Paper role</dt><dd>{card.paperRole}</dd></div><div><dt>Paper relation</dt><dd>{card.paperRelation}</dd></div><div><dt>Background</dt><dd>{card.whyItMatters}</dd></div></dl><button type="button" onClick={onOpen}>在 Reference Hub 打开完整数据卡 →</button></article>; }
function fmt(value: number) { return Number.isFinite(value) ? value.toFixed(4) : '—'; }
