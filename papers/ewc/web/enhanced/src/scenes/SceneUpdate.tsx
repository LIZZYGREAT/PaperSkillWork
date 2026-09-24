import { useState } from 'react';
import { calculateTrainingStep, formatVector, TOY_STATE } from '../data/session';
import type { SceneProps } from './types';

type View = 'paper' | 'runtime' | 'toy';

const viewCopy: Record<View, { label: string; text: string }> = {
  paper: { label: 'Paper', text: 'Equation (3) 定义新任务损失与旧任务二次项的总目标。' },
  runtime: { label: 'Runtime mapping', text: '当前参数参与损失计算；锚点和 Fisher 是被读取的参考状态。' },
  toy: { label: 'Teaching Toy', text: '下面固定三个参数、梯度和步长，只改变 λ 并复算一次 plain-SGD 更新。' },
};

export function SceneUpdate({ session, onSessionChange }: SceneProps) {
  const [view, setView] = useState<View>('paper');
  const result = calculateTrainingStep(session.lambda);
  return (
    <div className="scene-stack">
      <section className="learning-card">
        <div className="section-kicker">交互 · 缩放旧任务约束</div>
        <div className="view-switch" role="group" aria-label="显示视角">
          {(Object.keys(viewCopy) as View[]).map((key) => <button key={key} className={view === key ? 'view-button is-active' : 'view-button'} aria-pressed={view === key} onClick={() => setView(key)}>{viewCopy[key].label}</button>)}
        </div>
        <p className="view-explanation" aria-live="polite">{viewCopy[view].text}</p>
        <label className="field-label lambda-control">约束系数 λ <output>{session.lambda.toFixed(1)}</output>
          <input type="range" min="0" max="4" step="0.1" value={session.lambda} onChange={(event) => onSessionChange({ lambda: Number(event.target.value) })} />
        </label>
        <div className="formula-panel">
          <span className="mini-label">总梯度 = 新任务梯度 + EWC 梯度</span>
          <div className="formula-large formula-wrap">g<sub>total</sub> = g<sub>B</sub> + λ F ⊙ (θ − θ*)</div>
        </div>
        <div className="vector-board" aria-live="polite">
          <div><span>当前 θ</span><code>{formatVector([...TOY_STATE.theta])}</code></div>
          <div><span>锚点 θ*</span><code>{formatVector([...TOY_STATE.anchor])}</code></div>
          <div><span>新任务梯度 gᴮ</span><code>{formatVector([...TOY_STATE.newTaskGradient])}</code></div>
          <div className="vector-emphasis"><span>EWC 梯度</span><code>{formatVector(result.ewcGradient)}</code></div>
          <div className="vector-emphasis"><span>合并梯度</span><code>{formatVector(result.totalGradient)}</code></div>
          <div className="vector-output"><span>一步 plain SGD 后 θ</span><code>{formatVector(result.nextTheta)}</code></div>
        </div>
        <div className="formula-values compact-values">
          <div><small>总 EWC penalty</small><strong>{result.penalty.toFixed(3)}</strong></div>
          <div><small>教学步长 η</small><strong>{TOY_STATE.learningRate.toFixed(2)}</strong></div>
          <div><small>锚点 / F 是否变化</small><strong>否</strong></div>
        </div>
        <p className="source-note">过程顺序：求总损失 → 反向传播得到合并梯度 → 优化器改变当前 θ。真实优化器还可能带有自己的状态，本例只计算一次 plain SGD。</p>
        <div className="toy-label">Teaching Toy · 所有向量和更新值都是示例算术，不是原文训练轨迹或 Fisher 估计。</div>
      </section>
    </div>
  );
}
