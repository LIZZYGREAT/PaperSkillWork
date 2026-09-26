import { useState } from 'react';
import type { SceneProps } from './types';

const implementationSteps = [
  {
    title: '整理训练对象',
    input: '任务 A 的当前批次 D_A',
    operation: '网络用当前参数 θ 计算预测，再由标签得到任务损失 L_A(θ)。',
    output: '可训练参数 θ 与可求导的损失 L_A',
    reason: 'EWC 保护的是参数空间中的旧解；先明确什么是当前参数、当前任务目标。',
  },
  {
    title: '先学好任务 A',
    input: 'D_A、L_A(θ)',
    operation: '反向传播得到 ∇L_A；优化器反复更新 θ，直到得到任务 A 的解。',
    output: '旧任务解 θ*_A',
    reason: 'θ*_A 是后续惩罚项的中心。它是已学到的参考值，不是训练 B 时仍在变化的 θ。',
  },
  {
    title: '估计参数重要性',
    input: 'θ*_A 附近的模型与任务 A 信息',
    operation: '计算 Fisher 信息，并按 EWC 的因子化近似只保留对角元素。',
    output: '与参数逐项对齐的 F_A',
    reason: 'F_A,i 表示旧任务对参数偏移的局部敏感度/精度估计；它不是参数绝对值。',
  },
  {
    title: '保存旧任务参考',
    input: 'θ*_A 与 F_A',
    operation: '将解和重要性估计作为一对参考状态保存，供后续任务读取。',
    output: '参考对 (θ*_A, F_A)',
    reason: '在 MNIST 这类不重放旧样本的设置里，B 的 EWC 惩罚直接读取这对状态。',
  },
  {
    title: '为任务 B 组装目标',
    input: 'D_B 当前批次、当前 θ、历史参考对',
    operation: '构造 L_B(θ) + Σₖ λₖ/2 · Σᵢ Fₖ,ᵢ(θᵢ − θ*ₖ,ᵢ)²。',
    output: '任务 B 损失 + 旧任务加权惩罚',
    reason: '新数据推动学习；旧任务重要性让不同参数承担不同偏移代价。',
  },
  {
    title: '合成梯度',
    input: '总目标与当前参数 θ',
    operation: '对总目标求导：g_total = g_B + Σₖ λₖFₖ ⊙ (θ − θ*ₖ)。',
    output: '新任务梯度与恢复梯度之和',
    reason: '到这一步仍只算出了更新信号；梯度计算本身不会改写参数或旧参考。',
  },
  {
    title: '更新当前参数',
    input: 'g_total 与优化器状态',
    operation: '优化器应用更新规则，例如 SGD：θ ← θ − ηg_total。',
    output: '新的当前参数 θ',
    reason: '真正被优化器改变的是当前 θ；θ*_A 与 F_A 仍作为固定参考被读取。',
  },
  {
    title: '评估并交接下一任务',
    input: '更新后的 θ 与各任务测试数据',
    operation: '评估旧/新任务；B 结束后再保存 θ*_B、F_B，供下一任务使用。',
    output: '性能证据与扩展后的历史参考集合',
    reason: '结果要按各自实验协议解释；原始 EWC 为先前任务保留各自的参考项。',
  },
];

const prerequisites = [
  { symbol: 'θ', label: '参数', text: '网络中可训练的权重与偏置，合起来看作一个向量。' },
  { symbol: 'L(θ)', label: '损失', text: '当前任务用来衡量预测表现的目标；训练通常尝试把它降下来。' },
  { symbol: '∇L', label: '梯度', text: '损失对各参数的导数，告诉我们沿哪个方向调整会让损失下降。' },
  { symbol: '优化器', label: '更新规则', text: '读取梯度和步长后改写当前参数，例如 SGD：θ ← θ − η∇L。' },
];

export function SceneOverview(_props: SceneProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const activeStep = implementationSteps[stepIndex];

  return (
    <div className="scene-stack">
      <section className="overview-conflict" aria-label="持续学习的基本矛盾">
        <div className="overview-conflict-side">
          <span className="mini-label">稳定 · 留住旧任务</span>
          <strong>任务 B 更新参数，可能损害任务 A</strong>
          <p>旧样本未必能持续访问，单靠新任务目标无法提醒模型保留旧能力。</p>
        </div>
        <div className="overview-conflict-mark" aria-hidden="true">↔</div>
        <div className="overview-conflict-side is-plastic">
          <span className="mini-label">可塑 · 学会新任务</span>
          <strong>把参数全部冻结，又会妨碍适应</strong>
          <p>模型需要继续改变共享参数，关键是让不同参数承担不同的偏移代价。</p>
        </div>
      </section>
      <section className="learning-card overview-answer">
        <div className="section-kicker">论文研究的问题</div>
        <h3>Elastic Weight Consolidation · 弹性权重固化</h3>
        <p>Kirkpatrick 等人以旧任务解为中心，用对角 Fisher 近似衡量参数的重要性；后续任务仍能更新参数，但重要参数偏离旧解时会承担更高的二次代价。</p>
        <div className="overview-equation">L<sub>new</sub> + <span>λ</span>/2 · Σ<sub>i</sub> F<sub>i</sub>(θ<sub>i</sub> − θ*<sub>i</sub>)²</div>
        <p className="source-note">本教程先拆解概率近似与一次更新，再按 Permuted MNIST 和 Atari 的原始实验协议检查证据范围。</p>
      </section>

      <section className="learning-card overview-prerequisites" aria-labelledby="overview-prerequisites-title">
        <div className="section-kicker">实现前的最小知识 · 这四个概念会贯穿后续页面</div>
        <h3 id="overview-prerequisites-title">先分清“算什么”和“改什么”</h3>
        <div className="prerequisite-grid">
          {prerequisites.map((item) => <article key={item.symbol}>
            <code>{item.symbol}</code><strong>{item.label}</strong><p>{item.text}</p>
          </article>)}
        </div>
      </section>

      <section className="learning-card implementation-walkthrough" aria-labelledby="implementation-walkthrough-title">
        <div className="section-kicker">交互 · 按实现顺序拆解 EWC</div>
        <h3 id="implementation-walkthrough-title">每一步要读什么、算什么、留下什么？</h3>
        <p className="walkthrough-intro">逐步选择，沿着任务 A → 任务 B 走一遍。后续页面会分别展开 Bayes、Fisher、梯度更新与状态生命周期。</p>
        <div className="implementation-step-list" role="group" aria-label="EWC 实现步骤">
          {implementationSteps.map((step, index) => <button
            key={step.title}
            type="button"
            aria-pressed={stepIndex === index}
            className={stepIndex === index ? 'implementation-step is-active' : 'implementation-step'}
            onClick={() => setStepIndex(index)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>{step.title}
          </button>)}
        </div>
        <article className="implementation-step-detail" aria-live="polite">
          <div className="walkthrough-detail-heading"><span>当前步骤 {String(stepIndex + 1).padStart(2, '0')} / {String(implementationSteps.length).padStart(2, '0')}</span><strong>{activeStep.title}</strong></div>
          <dl>
            <div><dt>输入 / 读取</dt><dd>{activeStep.input}</dd></div>
            <div><dt>操作</dt><dd>{activeStep.operation}</dd></div>
            <div><dt>输出 / 状态变化</dt><dd>{activeStep.output}</dd></div>
          </dl>
          <p className="walkthrough-reason"><strong>为什么要这一步：</strong>{activeStep.reason}</p>
        </article>
        <div className="walkthrough-controls">
          <button type="button" className="text-button" onClick={() => setStepIndex((index) => Math.max(0, index - 1))} disabled={stepIndex === 0}>← 上一步</button>
          <span aria-live="polite">{stepIndex + 1} / {implementationSteps.length}</span>
          <button type="button" className="pager-button pager-next" onClick={() => setStepIndex((index) => Math.min(implementationSteps.length - 1, index + 1))} disabled={stepIndex === implementationSteps.length - 1}>下一步 →</button>
        </div>
      </section>

      <section className="overview-route" aria-label="十页学习路径">
        <article><span>01–05</span><strong>问题到更新</strong><p>矛盾、Bayes、Fisher、目标函数</p></article>
        <article><span>06</span><strong>状态生命周期</strong><p>区分参数、锚点、Fisher 与数据</p></article>
        <article><span>07–10</span><strong>实验与结论</strong><p>MNIST、Atari、比较与全流程</p></article>
      </section>
    </div>
  );
}
