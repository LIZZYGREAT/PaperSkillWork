import { useState } from 'react';
import type { SceneProps } from './types';

const stages = [
  { title: 'A 中学习', data: 'D_A 可用', explanation: 'A 的样本与任务目标形成参数后验 p(θ | D_A)。' },
  { title: 'A 结束', data: 'D_A 不进入 B 的损失', explanation: '顺序学习把旧后验作为下一任务的先验因子。' },
  { title: 'B 中学习', data: 'D_B 可用', explanation: '新任务似然与旧后验共同决定 p(θ | D_A,D_B)。' },
];

export function SceneHandoff(_props: SceneProps) {
  const [stage, setStage] = useState(0);
  return (
    <div className="scene-stack">
      <section className="learning-card">
        <div className="section-kicker">交互 · 追踪任务边界</div>
        <div className="stage-selector" role="group" aria-label="顺序学习的阶段">
          {stages.map((item, index) => <button key={item.title} aria-pressed={stage === index} className={stage === index ? 'stage-button is-active' : 'stage-button'} onClick={() => setStage(index)}><span>{String(index + 1).padStart(2, '0')}</span>{item.title}</button>)}
        </div>
        <div className="handoff-view" aria-live="polite">
          <div className="handoff-cell"><small>当前任务数据</small><strong>{stages[stage].data}</strong></div>
          <span className="handoff-arrow" aria-hidden="true">→</span>
          <div className="handoff-cell is-emphasis"><small>保留 / 产生的对象</small><strong>{stages[stage].explanation}</strong></div>
        </div>
        <div className="formula-panel">
          <span className="mini-label">顺序 Bayes · 原文 Equation (2)</span>
          <div className="formula-large">p(θ | D<sub>A</sub>, D<sub>B</sub>) ∝ p(D<sub>B</sub> | θ) · p(θ | D<sub>A</sub>)</div>
          <p>旧任务后验承载 A 的信息；它成为学习 B 时的先验因子。完整 posterior 对深度网络来说不可直接保存，EWC 接下来用局部近似简化它。</p>
        </div>
        <div className="handoff-bridge" aria-label="从概率表达到训练损失的转换">
          <article><span className="mini-label">基础知识 · 似然</span><p><code>p(D_B | θ)</code> 表示参数 θ 对 B 数据的解释程度；对数似然越大，数据越符合模型。</p></article>
          <div className="handoff-bridge-arrow" aria-hidden="true">↓</div>
          <article className="handoff-bridge-result"><span className="mini-label">训练时通常最小化损失</span><strong>−log p(D_B | θ) = L_B(θ) + 常数</strong><p>取负对数后，“最大化后验”变成“最小化 B 的损失 + 旧后验带来的代价”。</p></article>
        </div>
        <div className="handoff-bridge-note"><strong>接到下一页：</strong>把旧后验近似成以 θ*_A 为中心、精度由对角 Fisher 给出的 Gaussian，负对数先验就成为 Fisher 加权的二次惩罚。</div>
        <p className="source-note">这里是 Bayesian 推导，不是网页实际存储或训练的概率模型。</p>
      </section>
      <section className="explain-grid">
        <article><span className="mini-label">等式右侧的两块</span><p><code>p(D_B | θ)</code> 对应新任务学习；<code>p(θ | D_A)</code> 汇集较早任务的信息。</p></article>
        <article><span className="mini-label">EWC 要近似什么</span><p>旧 posterior 太复杂，EWC 只保留旧解附近的局部 Gaussian 形状，不保留精确分布。这里的“先验”是概率推导中的信息，不是原任务训练样本。</p></article>
      </section>
    </div>
  );
}
