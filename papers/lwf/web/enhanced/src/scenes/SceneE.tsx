import React, { useEffect, useMemo, useState } from 'react';
import { useReferenceHub } from '../components/ReferencePrimitives';
import type { LearningAction, LearningSession } from '../data/session';
import type { Reduction } from '../simulation/distillation';
import {
  evaluateTradeoff,
  norm,
  newTaskGradientAtOrigin,
  oldParameterOptimum,
  reductionScale,
  responseObjective,
  type GradientGeometry,
  type Vector2,
} from '../simulation/gradientTradeoff';

const geometryOptions: { id: GradientGeometry; label: string; note: string }[] = [
  { id: 'aligned', label: 'Aligned', note: '局部方向相同' },
  { id: 'orthogonal', label: 'Weak relation', note: '局部近似正交' },
  { id: 'conflicting', label: 'Conflicting', note: '局部方向相反' },
];
const parameterNames = {
  fc7: { shared: ['features', 'fc6', 'fc7'], old: ['old classifier'], fresh: ['new classifier'] },
  features: { shared: ['features'], old: ['old fc6', 'old fc7', 'old classifier'], fresh: ['new fc6', 'new fc7', 'new classifier'] },
} as const;

export function SceneE({ session, dispatch }: { session: LearningSession; dispatch: React.Dispatch<LearningAction> }) {
  const { openHub } = useReferenceHub();
  const [geometry, setGeometry] = useState<GradientGeometry>('orthogonal');
  const [lambdaOld, setLambdaOld] = useState(1);
  const [learningRate, setLearningRate] = useState(.12);
  const [temperature, setTemperature] = useState(2);
  const [oldReduction, setOldReduction] = useState<Reduction>('sum');
  const [newReduction, setNewReduction] = useState<Reduction>('sum');
  const [regularization, setRegularization] = useState(false);
  const [parameterGroup, setParameterGroup] = useState<'theta_s' | 'theta_o' | 'theta_n'>('theta_s');
  const [showPaperEvidence, setShowPaperEvidence] = useState(false);
  const [paperTaskPair, setPaperTaskPair] = useState<'places-voc' | 'imagenet-scenes'>('places-voc');
  const [theta, setTheta] = useState<Vector2>([0, 0]);
  const [trajectory, setTrajectory] = useState<Vector2[]>([[0, 0]]);

  const originOldGradient = useMemo(
    () => responseObjective([0, 0], temperature, oldReduction).gradient,
    [temperature, oldReduction],
  );
  const rawNewGradient = newTaskGradientAtOrigin(originOldGradient, geometry);
  const nextTaskScale = reductionScale(newReduction);
  const newOptimum: Vector2 = [-rawNewGradient[0] / nextTaskScale, -rawNewGradient[1] / nextTaskScale];
  const current = evaluateTradeoff({ theta, newOptimum, temperature, oldReduction, newReduction, lambdaOld, regularization });

  useEffect(() => {
    setTheta([0, 0]);
    setTrajectory([[0, 0]]);
  }, [geometry, lambdaOld, temperature, oldReduction, newReduction, regularization]);

  const runSteps = (count: number) => {
    let point = theta;
    const nextPoints: Vector2[] = [];
    for (let step = 0; step < count; step += 1) {
      const state = evaluateTradeoff({ theta: point, newOptimum, temperature, oldReduction, newReduction, lambdaOld, regularization });
      point = [point[0] - learningRate * state.totalGradient[0], point[1] - learningRate * state.totalGradient[1]];
      nextPoints.push(point);
    }
    setTheta(point);
    setTrajectory((points) => [...points, ...nextPoints]);
  };
  const reset = () => { setTheta([0, 0]); setTrajectory([[0, 0]]); };
  const scaledOld = current.oldScaledGradient;
  const selectedGradient = parameterGroup === 'theta_s' ? current.totalGradient : undefined;
  const selectedAngleLabel = current.alignment > .7 ? 'positive · locally aligned' : current.alignment < -.7 ? 'negative · local conflict' : Math.abs(current.alignment) < .15 ? 'near zero · weak relation' : 'partial alignment / conflict';

  return (
    <div className="v2-scene-content v2-scene-e">
      <section className="v2-e-intro v2-state-card">
        <div className="v2-section-title-row"><div><p className="v2-eyebrow">SHARED PARAMETER UPDATE · PAPER + TEACHING TOY</p><h2>旧、新目标同时作用时，优化器往哪里走？</h2></div><button className="v2-intro-evidence" type="button" onClick={() => openHub({ evidenceId: 'F04' })}>总目标 F04 ↗</button></div>
        <div className="v2-e-objective"><strong>L = λ<sub>o</sub>L<sub>old</sub> + L<sub>new</sub> + R</strong><span>∇<sub>θs</sub>L = λ<sub>o</sub>g<sub>old</sub> + g<sub>new</sub> + g<sub>R</sub></span></div>
        <p>关注共享参数上的梯度向量，而不是把 λ<sub>o</sub> 读成任务占比。页面中的二维参数、线性旧响应映射与新任务二次目标均为可计算 Teaching Toy。</p>
      </section>

      <section className="v2-e-controls-panel">
        <header className="v2-section-title-row"><div><p className="v2-eyebrow">GRADIENT VECTOR COMPOSER · TEACHING TOY</p><h2>合成当前的共享梯度</h2></div><span className="v2-source-badge is-toy">θ = (θ₁, θ₂)</span></header>
        <div className="v2-e-controls-grid">
          <label>λ<sub>o</sub><strong>{lambdaOld.toFixed(1)}</strong><input aria-label="旧任务损失系数 lambda o" type="range" min="0" max="4" step="0.1" value={lambdaOld} onChange={(event) => setLambdaOld(Number(event.target.value))} /></label>
          <label>共享学习率 η<sub>s</sub><strong>{learningRate.toFixed(2)}</strong><input aria-label="共享参数学习率" type="range" min="0.01" max="0.3" step="0.01" value={learningRate} onChange={(event) => setLearningRate(Number(event.target.value))} /></label>
          <label>温度 T<sub>old</sub><strong>{temperature.toFixed(1)}</strong><input aria-label="旧响应温度" type="range" min="1" max="5" step="0.1" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} /></label>
        </div>
        <div className="v2-e-geometry-controls" role="group" aria-label="选择教学用梯度几何">
          {geometryOptions.map((option) => <button key={option.id} type="button" aria-pressed={geometry === option.id} className={geometry === option.id ? 'is-active' : ''} onClick={() => setGeometry(option.id)}><strong>{option.label}</strong><span>{option.note}</span></button>)}
        </div>
        <GradientVectorPlot old={current.oldGradient} oldScaled={current.oldScaledGradient} fresh={current.newGradient} total={current.totalGradient} />
        <div className="v2-e-gradient-readouts">
          <Metric label="λₒ · loss coefficient" value={lambdaOld.toFixed(1)} />
          <Metric label="‖g_old‖" value={fmt(current.oldNorm)} />
          <Metric label="‖g_new‖" value={fmt(current.newNorm)} />
          <Metric label="‖λₒ g_old‖" value={fmt(current.oldScaledNorm)} />
          <Metric label="‖g_total‖" value={fmt(current.totalNorm)} />
          <Metric label="‖Δθ_s‖ at current η" value={fmt(learningRate * current.totalNorm)} />
        </div>
        <div className="v2-e-lambda-reminder"><strong>λ<sub>o</sub> = {lambdaOld.toFixed(1)} ≠ “旧任务占 {lambdaOld === 1 ? '50%' : '该比例'}”</strong><span>loss coefficient ≠ optimization percentage；梯度范数、方向、损失定义、reduction、温度与学习率共同影响实际更新。</span></div>
      </section>

      <section className="v2-e-diagnostic-grid">
        <article className="v2-e-card">
          <p className="v2-eyebrow">GRADIENT ALIGNMENT INSPECTOR · DIAGNOSTIC</p><h2>方向也会改变合力</h2>
          <div className="v2-e-cosine"><strong>cos(g_old, g_new) = {fmt(current.alignment)}</strong><span>{selectedAngleLabel}</span></div>
          <p>这是当前 Teaching Toy 的局部诊断量，不是论文报告的实验指标。stability–plasticity 同时受梯度幅度和方向影响。</p>
          <div className="v2-e-group-selector" role="group" aria-label="查看参数组梯度来源">{([['theta_s', 'θ_s Shared'], ['theta_o', 'θ_o Old-specific'], ['theta_n', 'θ_n New-specific']] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={parameterGroup === id} onClick={() => setParameterGroup(id)}>{label}</button>)}</div>
          <div className="v2-e-group-formula"><strong>{parameterGroup === 'theta_s' ? '∇θ_s L = λₒ ∇θ_s L_old + ∇θ_s L_new + ∇θ_s R' : parameterGroup === 'theta_o' ? '∇θ_o L = λₒ ∇θ_o L_old + ∇θ_o R' : '∇θ_n L = ∇θ_n L_new + ∇θ_n R'}</strong><span>{selectedGradient ? `当前共享参数 toy 梯度：(${fmt(selectedGradient[0])}, ${fmt(selectedGradient[1])})` : '此 Teaching Toy 向量合成器只计算 θ_s；这里显示参数组可接收的梯度来源。'}</span></div>
          <p className="v2-e-group-note">直接 old/new 梯度冲突主要发生在共享参数。θ<sub>o</sub> 不接收 L<sub>new</sub> 的直接梯度；θ<sub>n</sub> 不接收 L<sub>old</sub> 的直接梯度。</p>
        </article>
        <article className="v2-e-card v2-e-partition-card">
          <p className="v2-eyebrow">PARTITION EXPLORER · LINKED WITH SCENE B</p><h2>移动边界，查看冲突可能作用的区域</h2>
          <div className="v2-e-boundary-controls" role="group" aria-label="共享表示边界"> <button type="button" aria-pressed={session.boundary === 'fc7'} onClick={() => dispatch({ type: 'SET_BOUNDARY', boundary: 'fc7' })}>θ_s 延伸到 fc7</button><button type="button" aria-pressed={session.boundary === 'features'} onClick={() => dispatch({ type: 'SET_BOUNDARY', boundary: 'features' })}>θ_s 仅含 features</button></div>
          <div className="v2-e-boundary-map"><ModuleList title="Shared · 同时接收 old / new" values={parameterNames[session.boundary].shared} tone="shared" /><ModuleList title="Task-specific · 各自目标" values={[...parameterNames[session.boundary].old, ...parameterNames[session.boundary].fresh]} tone="private" /></div>
          <p>这里展示实施映射中的模块边界，不虚构真实参数量。共享模块才是两类目标直接相遇的区域；调整边界会同步更新 Scene B。</p>
        </article>
      </section>

      <section className="v2-e-step-panel">
        <div className="v2-section-title-row"><div><p className="v2-eyebrow">ONE OPTIMIZER STEP · PLAIN SGD TEACHING TOY</p><h2>从梯度合成到参数更新</h2></div><span className="v2-source-badge is-toy">当前 θ = ({fmt(theta[0])}, {fmt(theta[1])})</span></div>
        <div className="v2-e-step-controls"><button type="button" onClick={() => runSteps(1)}>Take One Step</button><button type="button" onClick={() => runSteps(10)}>Run 10 steps</button><button type="button" onClick={reset}>Reset trajectory</button><label><input type="checkbox" checked={regularization} onChange={(event) => setRegularization(event.target.checked)} /> 显示参数正则梯度 g<sub>R</sub></label></div>
        <div className="v2-e-sgd-equation"><span>θ′ = θ − η<sub>s</sub>(λ<sub>o</sub>g<sub>old</sub> + g<sub>new</sub>{regularization ? ' + g_R' : ''})</span><strong>Δθ = ({fmt(-learningRate * current.totalGradient[0])}, {fmt(-learningRate * current.totalGradient[1])})</strong></div>
        <div className="v2-e-loss-readouts"><Metric label="L_old" value={fmt(current.oldLoss)} /><Metric label="L_new" value={fmt(current.newLoss)} /><Metric label="R" value={fmt(current.regularizationLoss)} /><Metric label="Total loss" value={fmt(current.totalLoss)} /><Metric label="distance to old optimum" value={fmt(norm([theta[0] - oldParameterOptimum[0], theta[1] - oldParameterOptimum[1]]))} /><Metric label="distance to new optimum" value={fmt(norm([theta[0] - newOptimum[0], theta[1] - newOptimum[1]]))} /></div>
        <LandscapeGrid theta={theta} trajectory={trajectory} oldOptimum={oldParameterOptimum} newOptimum={newOptimum} temperature={temperature} oldReduction={oldReduction} newReduction={newReduction} lambdaOld={lambdaOld} regularization={regularization} />
      </section>

      <details className="v2-e-advanced"><summary>Implementation detail：Loss scale、temperature、reduction 与 optimizer</summary>
        <div className="v2-e-advanced-grid">
          <section><h3>Loss Scale Audit</h3><label>旧响应 reduction <select value={oldReduction} onChange={(event) => setOldReduction(event.target.value as Reduction)}><option value="sum">sum</option><option value="mean">mean（按类别）</option><option value="batchmean">batchmean（toy B=1）</option></select></label><label>新任务 toy reduction <select value={newReduction} onChange={(event) => setNewReduction(event.target.value as Reduction)}><option value="sum">sum</option><option value="mean">mean（二维参数）</option><option value="batchmean">batchmean（toy B=1）</option></select></label><p>reduction、类别数、batch size 与 loss 定义都会改变梯度尺度。λ<sub>o</sub> 要结合这些设置解释；温度 T 也会改变 L<sub>old</sub> 产生的梯度。</p></section>
          <section><h3>Temperature × λ<sub>o</sub></h3><strong>effective old-task pressure = λ<sub>o</sub> × ‖∇L<sub>old</sub>‖</strong><span>当前 λ<sub>o</sub> × ‖g_old‖ = {fmt(lambdaOld * current.oldNorm)}</span><p>切换 T、response distribution 或 reduction 后，旧梯度会变，即使 λ<sub>o</sub> 不变。λ<sub>o</sub> 不是固定物理意义的“保护百分比”。</p></section>
          <section><h3>Regularization Gradient</h3><p>当前 R = {fmt(current.regularizationLoss)}；g<sub>R</sub> = ({fmt(current.regularizationGradient[0])}, {fmt(current.regularizationGradient[1])})。</p><p>R 是普通参数正则项，不是第三个任务。本 Teaching Toy 使用 R = ½‖θ‖²。</p></section>
          <section><h3>Optimizer Note</h3><p>此处以 plain SGD 展示 Δθ = −ηg。Adam、AdamW 与 Momentum SGD 会变换原始梯度形成参数更新；梯度合成和 optimizer-transformed update 是两个层次。</p><p>λ<sub>o</sub> 缩放旧损失的梯度贡献；η 控制本次参数步长。</p></section>
        </div>
      </details>

      <section className="v2-e-paper-evidence">
        <div className="v2-section-title-row"><div><p className="v2-eyebrow">PAPER EVIDENCE · FIGURE 7</p><h2>论文展示的是不同 λ 设置下的 old/new operating points</h2></div><button type="button" className="v2-intro-evidence" onClick={() => setShowPaperEvidence((value) => !value)} aria-expanded={showPaperEvidence}>{showPaperEvidence ? '收起 Figure 7 证据说明' : '查看论文实际观察'}</button></div>
        {showPaperEvidence ? <div className="v2-e-paper-panel"><div className="v2-e-dataset-switch" role="group" aria-label="选择论文 Figure 7 任务设置"><button type="button" aria-pressed={paperTaskPair === 'places-voc'} onClick={() => setPaperTaskPair('places-voc')}>Places365 → VOC</button><button type="button" aria-pressed={paperTaskPair === 'imagenet-scenes'} onClick={() => setPaperTaskPair('imagenet-scenes')}>ImageNet → MIT Indoor Scenes</button></div><div className="v2-e-paper-reading"><div><span>Figure 7 · qualitative evidence · {paperTaskPair === 'places-voc' ? 'Places365 → VOC' : 'ImageNet → MIT Indoor Scenes'}</span><strong>λ<sub>o</sub> 改变时，旧任务和新任务表现形成不同 operating points。</strong><span>x 轴：old-task performance · y 轴：new-task performance · marker size：λ<sub>o</sub></span></div><p>下方是原图结构索引（不重绘数据点）：(a)(b) 比较方法，(c)(d) 比较 response losses；各列分别是两个任务对。作者在所测设置下报告 LwF 优于 parameter-L2 baseline，KD 相比其他 response losses 仅略优。不要将其称为严格 Pareto frontier，也不要推广为所有任务都必然成立。</p></div><div className="v2-e-paper-panels" aria-label="Figure 7 四个面板的原图索引"><div className={paperTaskPair === 'places-voc' ? 'is-focused' : ''}><strong>(a) Places365 → VOC</strong><span>方法比较 · old × new performance</span></div><div className={paperTaskPair === 'imagenet-scenes' ? 'is-focused' : ''}><strong>(b) ImageNet → Scene</strong><span>方法比较 · old × new performance</span></div><div className={paperTaskPair === 'places-voc' ? 'is-focused' : ''}><strong>(c) Places365 → VOC</strong><span>损失比较 · marker size 表示 λ<sub>o</sub></span></div><div className={paperTaskPair === 'imagenet-scenes' ? 'is-focused' : ''}><strong>(d) ImageNet → Scene</strong><span>损失比较 · marker size 表示 λ<sub>o</sub></span></div></div><p className="v2-e-paper-source-note">为保证图形准确，这里不根据像素重画点位；原始坐标图请从论文 PDF 查看。</p><a className="v2-e-paper-link" href="https://arxiv.org/pdf/1606.09282#page=10" target="_blank" rel="noreferrer">在新标签页打开原论文 PDF · Figure 7 ↗</a><button type="button" className="v2-intro-evidence" onClick={() => openHub({ evidenceId: 'C11' })}>打开来源审计 C11 ↗</button></div> : <p>不从论文图上估读未登记的数值；打开查看任务设置和原始 Figure 7。术语用 trade-off / operating points，不默认称为 Pareto frontier。</p>}
      </section>

      <footer className="v2-e-footer"><span>Scene B boundary ↔ E gradient region · D temperature and reduction ↔ E old-gradient scale</span><button type="button" onClick={() => openHub({ evidenceId: 'F05' })}>λ<sub>o</sub> 论文说明 F05 ↗</button></footer>
    </div>
  );
}

function GradientVectorPlot({ old, oldScaled, fresh, total }: { old: Vector2; oldScaled: Vector2; fresh: Vector2; total: Vector2 }) {
  const maxLength = Math.max(norm(oldScaled), norm(fresh), norm(total), .08);
  const factor = 72 / maxLength;
  const line = (v: Vector2, color: string, key: string, label: string, width: number, dash?: string) => <g key={key}><line x1="140" y1="112" x2={140 + v[0] * factor} y2={112 - v[1] * factor} stroke={color} strokeWidth={width} strokeDasharray={dash} markerEnd={`url(#arr-${key})`} /><text x={140 + v[0] * factor * 1.08} y={112 - v[1] * factor * 1.08} fill={color}>{label}</text></g>;
  return <div className="v2-e-vector-figure"><svg viewBox="0 0 280 225" role="img" aria-label="基于当前计算向量绘制的 old、new 与总梯度方向"><defs>{[['old', '#b3676c'], ['oldscaled', '#ad3f53'], ['new', '#536fc4'], ['total', '#292e43']].map(([id, color]) => <marker key={id} id={`arr-${id}`} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill={color} /></marker>)}</defs><path d="M25 112 H255 M140 20 V205" stroke="#d9d6cf" strokeWidth="1" /><circle cx="140" cy="112" r="4" fill="#2f3140" />{line(old, '#b3676c', 'old', 'g old', 1.5, '4 3')}{line(oldScaled, '#ad3f53', 'oldscaled', 'lambda g old', 3)}{line(fresh, '#536fc4', 'new', 'g new', 3)}{line(total, '#292e43', 'total', 'g total', 4)}</svg><p>方向图按当前向量实时计算；线长按同一比例绘制。虚线显示未乘 λ<sub>o</sub> 的 g<sub>old</sub>。</p></div>;
}

function LandscapeGrid({ theta, trajectory, oldOptimum, newOptimum, temperature, oldReduction, newReduction, lambdaOld, regularization }: { theta: Vector2; trajectory: Vector2[]; oldOptimum: Vector2; newOptimum: Vector2; temperature: number; oldReduction: Reduction; newReduction: Reduction; lambdaOld: number; regularization: boolean }) {
  const count = 13;
  const range = 2.4;
  const samples = Array.from({ length: count * count }, (_, index) => {
    const x = ((index % count) / (count - 1) * 2 - 1) * range;
    const y = (1 - Math.floor(index / count) / (count - 1) * 2) * range;
    const p: Vector2 = [x, y];
    const oldLoss = evaluateTradeoff({ theta: p, newOptimum, temperature, oldReduction, newReduction: 'sum', lambdaOld: 0, regularization: false }).oldLoss;
    const delta = [x - newOptimum[0], y - newOptimum[1]] as Vector2;
    const newLoss = .5 * (delta[0] ** 2 + delta[1] ** 2) * reductionScale(newReduction);
    return { p, oldLoss, newLoss, totalLoss: lambdaOld * oldLoss + newLoss + (regularization ? .5 * (x * x + y * y) : 0) };
  });
  const mapPoint = ([x, y]: Vector2): [number, number] => [12 + (x + range) / (range * 2) * 196, 12 + (range - y) / (range * 2) * 124];
  const cells = (key: 'oldLoss' | 'newLoss' | 'totalLoss', hue: number, label: string, optimum: Vector2) => {
    const values = samples.map((sample) => sample[key]);
    const min = Math.min(...values); const max = Math.max(...values); const span = Math.max(1e-9, max - min);
    return <svg viewBox="0 0 220 150" role="img" aria-label={`${label} 教学目标等高示意图，颜色来自逐点计算`} key={key}><rect width="220" height="150" rx="10" fill="#fbfaf7" />{samples.map((sample, index) => { const opacity = .08 + (1 - (sample[key] - min) / span) * .68; const cell = 196 / (count - 1); return <rect key={index} x={12 + index % count * cell} y={12 + Math.floor(index / count) * (124 / (count - 1))} width={cell + .2} height={124 / (count - 1) + .2} fill={`hsla(${hue}, 47%, 61%, ${opacity})`} />; })}<polyline points={trajectory.map((point) => mapPoint(point).join(',')).join(' ')} fill="none" stroke="#282d42" strokeWidth="2" />{trajectory.map((point, index) => <circle key={index} cx={mapPoint(point)[0]} cy={mapPoint(point)[1]} r={index === trajectory.length - 1 ? 4 : 2.5} fill={index === trajectory.length - 1 ? '#292e43' : '#f8f7f2'} stroke="#292d42" strokeWidth="1.5" />)}<circle cx={mapPoint(optimum)[0]} cy={mapPoint(optimum)[1]} r="5" fill="none" stroke="#31364e" strokeWidth="1.7" strokeDasharray="2 2" /></svg>;
  };
  return <div className="v2-e-landscapes"><div className="v2-e-landscape-grid">{cells('oldLoss', 354, 'L_old', oldOptimum)}{cells('newLoss', 224, 'L_new', newOptimum)}{cells('totalLoss', 250, 'L_total', [0, 0])}</div><div><span>● current θ · ○ objective optimum / origin · 颜色由当前 Teaching Toy objective 逐点计算</span><small>二维示意范围 [-2.4, 2.4]；不是论文数据。</small></div><div className="v2-e-landscape-labels"><span>Old response loss</span><span>New task toy loss</span><span>λₒL_old + L_new + R</span></div></div>;
}

function ModuleList({ title, values, tone }: { title: string; values: readonly string[]; tone: 'shared' | 'private' }) { return <div className={`v2-e-module-list is-${tone}`}><strong>{title}</strong>{values.map((value, index) => <span key={`${value}-${index}`}>{value}</span>)}</div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function fmt(value: number) { return Number.isFinite(value) ? value.toFixed(4) : '0.0000'; }
