import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

const toyNote = '教学玩具：数值用于复算公式，不是论文实验数据。';

export const MethodCompare: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'sgd' | 'uniform' | 'ewc'>('sgd');
  const copy = {
    sgd: ['只计算新任务梯度', '旧任务没有约束信号；参数可能离开 A 的好解区域。'],
    uniform: ['每个参数受到相同约束', '旧任务较受保护，但所有参数都难以适应 B。'],
    ewc: ['约束强度按 Fᵢ 区分', '旧任务更重要的参数偏移代价更高；参数仍可移动。'],
  } as const;
  return <div className="ewc-widget">
    <div className="ewc-choice-row" aria-label="训练目标比较">
      {(['sgd', 'uniform', 'ewc'] as const).map((key) => <button key={key} className={mode === key ? 'ewc-choice is-selected' : 'ewc-choice'} aria-pressed={mode === key} onClick={() => setMode(key)}>{key === 'sgd' ? 'B-only' : key === 'uniform' ? '统一约束' : 'EWC'}</button>)}
    </div>
    <div className="ewc-method-visual" role="img" aria-label={`当前展示：${copy[mode][0]}`}>
      <span className="ewc-node">任务 A</span><span className="ewc-line" aria-hidden="true" /><span className="ewc-node is-current">参数 θ</span><span className="ewc-line" aria-hidden="true" /><span className="ewc-node">任务 B</span>
      <div className={`ewc-signal ewc-signal-${mode}`}>{mode === 'sgd' ? '∇Lᴮ' : mode === 'uniform' ? '∇Lᴮ + κ(θ−θ*)' : '∇Lᴮ + λF⊙(θ−θ*)'}</div>
    </div>
    <strong>{copy[mode][0]}</strong><p className="ewc-feedback" aria-live="polite">{copy[mode][1]}</p>
  </div>;
};

export const HandoffStage: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const steps = [
    { title: '学习 A', data: 'D_A 可用', state: '更新 θ，形成 p(θ | D_A)。' },
    { title: '结束 A', data: 'D_A 不再输入 B', state: '旧后验信息被保留为下一步的先验因子。' },
    { title: '学习 B', data: 'D_B 可用', state: 'p(θ | D_A, D_B) ∝ p(D_B | θ) p(θ | D_A)。' },
  ];
  return <div className="ewc-widget">
    <div className="ewc-choice-row" aria-label="顺序学习阶段">{steps.map((item, i) => <button key={item.title} className={stage === i ? 'ewc-choice is-selected' : 'ewc-choice'} aria-pressed={stage === i} onClick={() => setStage(i)}>{item.title}</button>)}</div>
    <div className="ewc-handoff">
      <div><small>当前数据</small><strong>{steps[stage].data}</strong></div><span aria-hidden="true">→</span><div><small>保留状态</small><strong>{steps[stage].state}</strong></div>
    </div>
    <p className="ewc-feedback" aria-live="polite">理论上保留的是旧任务后验；EWC 不会精确保留完整后验，而会用局部近似表示。</p>
  </div>;
};

export const ImportanceExplorer: React.FC<WidgetProps> = () => {
  const [index, setIndex] = useState(0);
  const [delta, setDelta] = useState(0.4);
  const values = [1, 4, 9];
  const lambda = 2;
  const penalty = lambda / 2 * values[index] * delta * delta;
  const gradient = lambda * values[index] * delta;
  return <div className="ewc-widget">
    <label className="ewc-control">选择参数
      <select value={index} onChange={(event) => setIndex(Number(event.target.value))}>
        <option value={0}>θ₁ · F₁ = 1</option><option value={1}>θ₂ · F₂ = 4</option><option value={2}>θ₃ · F₃ = 9</option>
      </select>
    </label>
    <label className="ewc-control">当前偏移 Δᵢ <output>{delta.toFixed(2)}</output>
      <input type="range" min="-1" max="1" step="0.01" value={delta} onChange={(event) => setDelta(Number(event.target.value))} />
    </label>
    <div className="ewc-metrics"><div><small>二次惩罚</small><strong>{penalty.toFixed(3)}</strong></div><div><small>回拉梯度</small><strong>{gradient.toFixed(3)}</strong></div></div>
    <p className="ewc-feedback" aria-live="polite">在相同偏移 {delta.toFixed(2)} 下，Fᵢ={values[index]} 带来 {penalty.toFixed(3)} 的惩罚；梯度符号指向锚点。</p>
    <small className="ewc-toy-note">{toyNote} λ 固定为 2。</small>
  </div>;
};

export const UpdateCalculator: React.FC<WidgetProps> = () => {
  const [lambda, setLambda] = useState(2);
  const anchor = [0.2, -0.1, 0.4];
  const theta = [0.5, 0.2, 0.1];
  const fisher = [1, 4, 9];
  const newGradient = [-0.3, 0.2, -0.1];
  const eta = 0.1;
  const values = useMemo(() => {
    const diff = theta.map((v, i) => v - anchor[i]);
    const ewcGradient = diff.map((v, i) => lambda * fisher[i] * v);
    const totalGradient = ewcGradient.map((v, i) => v + newGradient[i]);
    const penalty = lambda / 2 * diff.reduce((sum, v, i) => sum + fisher[i] * v * v, 0);
    const next = theta.map((v, i) => v - eta * totalGradient[i]);
    return { ewcGradient, totalGradient, penalty, next };
  }, [lambda]);
  const vec = (items: number[]) => `[${items.map((v) => (Object.is(v, -0) ? 0 : v).toFixed(2)).join(', ')}]`;
  return <div className="ewc-widget">
    <label className="ewc-control">旧任务约束 λ <output>{lambda.toFixed(1)}</output>
      <input type="range" min="0" max="4" step="0.1" value={lambda} onChange={(event) => setLambda(Number(event.target.value))} />
    </label>
    <div className="ewc-update-grid">
      <div><small>当前 θ</small><strong>{vec(theta)}</strong></div><div><small>保存锚点 θ*</small><strong>{vec(anchor)}</strong></div>
      <div><small>新任务梯度 gᴮ</small><strong>{vec(newGradient)}</strong></div><div><small>EWC 梯度</small><strong>{vec(values.ewcGradient)}</strong></div>
      <div><small>合并梯度</small><strong>{vec(values.totalGradient)}</strong></div><div><small>一次 SGD 后 θ</small><strong>{vec(values.next)}</strong></div>
    </div>
    <div className="ewc-metrics"><div><small>Penalty</small><strong>{values.penalty.toFixed(3)}</strong></div><div><small>步长 η</small><strong>{eta.toFixed(2)}</strong></div></div>
    <p className="ewc-feedback" aria-live="polite">改变 λ 只缩放 EWC 项；新任务梯度和保存的锚点保持不变。这个视图演示“损失求导 → 梯度合并 → 优化器更新 θ”。</p>
    <small className="ewc-toy-note">{toyNote} 使用固定三参数向量与 plain SGD，不是论文训练轨迹。</small>
  </div>;
};

export const MnistEvidence: React.FC<WidgetProps> = () => {
  const [view, setView] = useState<'protocol' | 'methods' | 'overlap'>('protocol');
  const cards = {
    protocol: ['任务构造', 'MNIST 图像在每个任务内使用固定随机像素置换；每个新置换要求不同输入映射。', '模型：全连接 ReLU 网络。训练固定时长后，旧任务数据不再用于后续训练。'],
    methods: ['方法对照', 'Figure 2A 对比 SGD、统一二次约束与 EWC；Figure 2B 对比 EWC 与 SGD + dropout。', '论文报告 EWC 在该设置中兼顾旧任务保持与新任务学习。此处不读取或估计曲线的精确数值。'],
    overlap: ['参数使用分析', 'Figure 2C 比较 Fisher overlap；输入像素置换区域为中央 8×8 或 26×26。', '任务差异较大时，较早层 overlap 降低；输出邻近层仍可能共享，因为标签空间相同。'],
  } as const;
  return <div className="ewc-widget">
    <div className="ewc-choice-row" aria-label="MNIST 证据卡">{(['protocol', 'methods', 'overlap'] as const).map((key) => <button key={key} className={view === key ? 'ewc-choice is-selected' : 'ewc-choice'} aria-pressed={view === key} onClick={() => setView(key)}>{key === 'protocol' ? '协议' : key === 'methods' ? '方法对照' : 'Fisher overlap'}</button>)}</div>
    <article className="ewc-evidence-card"><small>论文证据 · Figure 2</small><h4>{cards[view][0]}</h4><p>{cards[view][1]}</p><p>{cards[view][2]}</p></article>
    <small className="ewc-toy-note">结果以原文曲线的定性描述呈现；没有添加推测的数值。</small>
  </div>;
};

export const AtariSystem: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState(0);
  const components = [
    ['共享 DQN 参数', '多游戏共同使用的网络参数；EWC 对它们加入旧任务约束。', 'EWC 机制边界'],
    ['任务识别', '根据观察推断当前 task context，决定使用哪个任务上下文。', '更大系统的组件'],
    ['每任务 replay', '不同推断任务各有短期经验缓冲区，供 DQN off-policy 更新。', '更大系统的组件'],
    ['专属 gain / bias', '各层保留少量游戏专属参数，帮助任务适配。', '更大系统的组件'],
  ];
  return <div className="ewc-widget">
    <div className="ewc-choice-row ewc-choice-wrap" aria-label="Atari 系统组件">{components.map((item, i) => <button key={item[0]} className={selected === i ? 'ewc-choice is-selected' : 'ewc-choice'} aria-pressed={selected === i} onClick={() => setSelected(i)}>{item[0]}</button>)}</div>
    <article className="ewc-evidence-card"><small>{components[selected][2]}</small><h4>{components[selected][0]}</h4><p>{components[selected][1]}</p></article>
    <p className="ewc-feedback">Atari 是组合系统：EWC 不是任务识别器，也不是 replay 的替代品。</p>
  </div>;
};

export const ClaimBoundary: React.FC<WidgetProps> = () => {
  const [claim, setClaim] = useState(0);
  const claims = [
    ['论文支持', '该 Atari agent 在所测序列中学习多款游戏。', '十个随机选取的游戏；总 human-normalized score，各游戏裁剪至 1，最高 10。'],
    ['说法过强', '“EWC 保证完全不会遗忘。”', '原文展示的是特定任务下的缓解效果，没有零遗忘保证。'],
    ['论文未测试', '“该结果证明 EWC 能保护 LLM。”', '论文实验是 Permuted MNIST 和 Atari 系统；没有大语言模型实验。'],
  ];
  return <div className="ewc-widget">
    <label className="ewc-control">检查一个主张
      <select value={claim} onChange={(event) => setClaim(Number(event.target.value))}><option value={0}>Atari 结果</option><option value={1}>零遗忘保证</option><option value={2}>LLM 能力</option></select>
    </label>
    <article className="ewc-evidence-card"><small>{claims[claim][0]}</small><h4>{claims[claim][1]}</h4><p>{claims[claim][2]}</p></article>
    <p className="ewc-feedback">作者指出 factorized Gaussian 与 diagonal Fisher 是显著近似；Atari 扰动分析提示重要性估计可能低估某些参数的不确定性。</p>
  </div>;
};

export const StateLifecycle: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  const stages = [
    ['学习 A', 'D_A 批次', 'θ 当前参数', '优化器更新 θ', '当前任务目标继续训练'],
    ['估计重要性', 'A 的数据 / 目标', 'θ_A*', '估计对角 F_A', 'θ_A* 与 F_A 成对保存'],
    ['任务边界', '任务 A 完成', 'θ_A*、F_A', '追加参考状态', '为后续任务提供锚点和权重'],
    ['学习 B', 'D_B 当前批次', 'θ、θ_A*、F_A', '优化器只更新 θ', '参考状态在此步保持固定'],
  ];
  const stage = stages[active];
  return <div className="ewc-widget">
    <div className="ewc-choice-row ewc-choice-wrap" role="group" aria-label="EWC 状态生命周期">{stages.map((item, index) => <button key={item[0]} type="button" className={index === active ? 'ewc-choice is-selected' : 'ewc-choice'} aria-pressed={index === active} onClick={() => setActive(index)}>{item[0]}</button>)}</div>
    <article className="ewc-evidence-card" aria-live="polite"><small>阶段 {active + 1} · {stage[0]}</small><h4>{stage[1]}</h4><p><b>读取：</b>{stage[2]}</p><p><b>写入：</b>{stage[3]}</p><p><b>边界后保留：</b>{stage[4]}</p></article>
    <p className="ewc-feedback">实现映射：优化器每一步读取参考状态，但只更新当前可训练参数。原文给出方法与公式，不规定这些具体变量名或代码 API。</p>
  </div>;
};

export const MnistProtocol: React.FC<WidgetProps> = () => {
  const items = [
    ['任务输入', '每个任务使用一组固定随机像素排列，同一任务中的图像共享此排列。'],
    ['连续训练', '任务按顺序到达；完成当前任务后，旧任务样本不再用于后续训练。'],
    ['Figure 2A', '两层、每层 400 单元的全连接 ReLU 网络；每个数据集训练 20 个 epoch。'],
    ['基线', 'Figure 2A 比较 SGD、统一二次约束和 EWC；Figure 2B 比较 EWC 与 SGD + dropout。'],
  ];
  return <div className="ewc-widget"><div className="ewc-protocol-grid">{items.map(([title, body], index) => <article className="ewc-evidence-card" key={title}><small>协议 {String(index + 1).padStart(2, '0')}</small><h4>{title}</h4><p>{body}</p></article>)}</div><p className="ewc-toy-note">依据论文 §2.1、Figure 2 与 Appendix 4.1。只列明原文明确给出的设置。</p></div>;
};

export const MnistResults: React.FC<WidgetProps> = () => {
  const results = [
    ['Figure 2A · 性能', '论文报告 EWC 在后续任务训练时保留较早任务表现；均匀二次约束妨碍新任务学习。'],
    ['Figure 2B · 任务数增加', 'SGD + dropout 对照随任务增加出现退化；EWC 在该设置中保留早期任务表现。'],
    ['Figure 2C · 结构分析', '输入置换差异增大时早期层 Fisher overlap 降低；该指标不是准确率。'],
  ];
  return <div className="ewc-widget"><div className="ewc-results-grid">{results.map(([title, body]) => <article className="ewc-evidence-card" key={title}><small>论文 Figure 2</small><h4>{title}</h4><p>{body}</p></article>)}</div><div className="ewc-feedback"><b>结论范围</b><p>支持的是论文指定的置换 MNIST 设置。没有从曲线估算数值点，也不外推为零遗忘或任意任务保证。</p></div></div>;
};

export const SynthesisReview: React.FC<WidgetProps> = () => {
  return <div className="ewc-widget"><div className="ewc-synthesis-table"><div><b>Permuted MNIST</b><span>分类任务；EWC、SGD、统一约束和 dropout 对照。</span><strong>支持：指定协议下保留较早任务表现。</strong><small>边界：固定像素置换与指定网络。</small></div><div><b>Atari</b><span>包含任务识别、按任务 replay 和专属 gain/bias 的 DQN 系统。</span><strong>支持：该系统能学习多款游戏。</strong><small>边界：低于十个独立 DQN；不是 EWC 单项效果。</small></div></div><div className="ewc-feedback"><b>综合结论</b><p>EWC 用旧任务局部重要性约束新任务更新，缓解特定实验中的参数干扰。对角 Fisher 与因子化 Gaussian 近似存在局限，论文没有证明零遗忘或无限任务扩展。</p></div></div>;
};
