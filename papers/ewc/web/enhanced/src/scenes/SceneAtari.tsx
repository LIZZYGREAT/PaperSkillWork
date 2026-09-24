import { useState } from 'react';
import type { SceneProps } from './types';

const components = [
  { id: 'shared', label: '共享 DQN 参数', owner: 'EWC 约束作用的对象', detail: '共享网络参数为多款游戏提供共同表示；EWC 在合适的任务边界加入旧任务参数约束。' },
  { id: 'recognition', label: '任务识别', owner: '更大系统的组件', detail: '根据观察推断当前任务上下文；它不是由 EWC penalty 完成的。' },
  { id: 'replay', label: '按任务 replay', owner: '更大系统的组件', detail: '不同推断任务有短期经验缓冲区，样本继续参与 DQN 的 off-policy 更新。' },
  { id: 'specific', label: '游戏专属 gain / bias', owner: '更大系统的组件', detail: '每层允许少量任务专属偏置与乘性 gain；不是 EWC 对旧任务的保存状态。' },
  { id: 'evaluation', label: '周期性评估', owner: '实验测量', detail: '定期在所有游戏上测试，不让评估步骤训练网络。' },
];

export function SceneAtari(_props: SceneProps) {
  const [component, setComponent] = useState(0);
  const [claim, setClaim] = useState<'supported' | 'overreach' | 'untested'>('supported');
  const active = components[component];
  const claimCopy = {
    supported: { label: '原文支持', text: '该系统在所测 Atari 序列中学会多款游戏；Plain gradient descent 总人类归一化分数低于 1。', tone: 'is-supported' },
    overreach: { label: '说法过强', text: '“EWC 保证完全不遗忘。”论文报告的是有限协议下的缓解效果，且分数仍低于十个独立 DQN。', tone: 'is-warning' },
    untested: { label: '本文未测试', text: '“这些实验验证了 EWC 对 LLM 的效果。”原文测试是 Permuted MNIST 与 Atari 系统，没有大语言模型实验。', tone: 'is-neutral' },
  }[claim];
  return (
    <div className="scene-stack">
      <section className="learning-card">
        <div className="section-kicker">交互 · 选择 Atari agent 组件</div>
        <div className="component-picker" role="group" aria-label="Atari 系统组成">
          {components.map((item, index) => <button key={item.id} aria-pressed={component === index} className={component === index ? 'component-button is-active' : 'component-button'} onClick={() => setComponent(index)}>{item.label}</button>)}
        </div>
        <article className="component-detail" aria-live="polite">
          <span className="mini-label">{active.owner}</span><h3>{active.label}</h3><p>{active.detail}</p>
        </article>
        <div className="system-flow" aria-label="Atari 系统数据路径">
          <span>观察</span><i aria-hidden="true">→</i><span>识别任务</span><i aria-hidden="true">→</i><span>选用任务状态</span><i aria-hidden="true">→</i><span className="flow-highlight">DQN 更新 + EWC 约束</span>
        </div>
        <div className="protocol-strip">
          <div><small>游戏数</small><strong>每组 10 款</strong></div>
          <div><small>指标</small><strong>人类归一化分数求和</strong></div>
          <div><small>单款上限</small><strong>裁剪到 1，总上限 10</strong></div>
          <div><small>EWC 启用</small><strong>每款至少 20M frames 后</strong></div>
        </div>
        <p className="source-note">结果以十组游戏选择、每组四个随机种子平均。EWC 系统能学习多款游戏，但仍低于十个独立 DQN；属于组合 agent 的系统级证据。</p>
      </section>
      <section className="learning-card claim-checker">
        <div className="section-kicker">交互 · 校验结论强度</div>
        <div className="claim-options" role="group" aria-label="选择一个关于 EWC 的主张">
          <button aria-pressed={claim === 'supported'} className={claim === 'supported' ? 'claim-option is-active' : 'claim-option'} onClick={() => setClaim('supported')}>实验支持</button>
          <button aria-pressed={claim === 'overreach'} className={claim === 'overreach' ? 'claim-option is-active' : 'claim-option'} onClick={() => setClaim('overreach')}>说法过强</button>
          <button aria-pressed={claim === 'untested'} className={claim === 'untested' ? 'claim-option is-active' : 'claim-option'} onClick={() => setClaim('untested')}>论文未测试</button>
        </div>
        <div className={`claim-verdict ${claimCopy.tone}`} aria-live="polite"><span>{claimCopy.label}</span><p>{claimCopy.text}</p></div>
        <div className="limits-grid">
          <article><span>作者指出</span><p>因式分解 Gaussian 与 diagonal Fisher 点估计是显著近似；扰动结果提示某些不重要参数可能被过度确信。</p></article>
          <article><span>方法边界</span><p>任务冲突、容量有限、λ 取舍和 Fisher 估计偏差仍在。EWC 缓解干扰，不创造无限参数空间。</p></article>
        </div>
      </section>
      <details className="cross-paper-card">
        <summary>补充参照：EWC 与 LwF 约束对象不同</summary>
        <div className="cross-paper-grid"><p><strong>EWC · 参数空间</strong><br />惩罚重要参数偏离旧解：θ 接近 θ*。</p><p><strong>LwF · 函数 / 输出空间</strong><br />约束新旧模型在输入上的输出行为接近。</p></div>
        <p>这是跨论文背景对照。LwF 不是 EWC 原论文里的实验基线。</p>
      </details>
    </div>
  );
}
