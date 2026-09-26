import { useEffect, useRef, useState } from 'react';
import type { SceneProps } from './types';

const rows = [
  ['Permuted MNIST', 'EWC 对比 SGD、均匀约束与 dropout', '旧任务保持与新任务学习的定性权衡', '固定置换与指定网络的分类基准'],
  ['Atari', 'EWC 所在的完整 DQN 系统对比独立 DQN 等设置', '能学习多款游戏，低于十个独立 DQN 的分数', '任务识别、按任务回放和专属 gain/bias 同时参与'],
];

const flowStages = [
  {
    title: '收到 A 批次',
    input: '任务 A 的当前批次 D_A',
    reads: '当前可训练参数 θ',
    writes: '任务目标 L_A(θ)',
    retained: '还没有可供后续任务读取的 A 参考对',
    explanation: '先明确训练上下文：这批数据属于哪个任务，以及当前共享网络正在用哪组参数。',
  },
  {
    title: '优化 A',
    input: 'D_A 与损失 L_A',
    reads: 'θ 和当前优化器状态',
    writes: '优化器逐步改变 θ；训练结束得到 θ*_A',
    retained: 'θ*_A 将成为旧任务参数锚点',
    explanation: '反向传播给出更新方向，优化器按其更新规则改写当前参数。训练步骤本身不等同于保存锚点。',
  },
  {
    title: '估计 F_A',
    input: '任务 A 信息与解 θ*_A',
    reads: '旧解附近的模型响应/导数',
    writes: '参数逐项对齐的对角 Fisher F_A',
    retained: 'F_A 与 θ*_A 必须一一对应',
    explanation: 'Fisher 近似旧任务在局部对参数的敏感度；对角版本只存每个参数的权重，忽略参数间耦合。',
  },
  {
    title: '保存 A 参考',
    input: 'θ*_A 与 F_A',
    reads: '任务 A 的最终解和重要性估计',
    writes: '固定参考项 (θ*_A, F_A)',
    retained: '两者在训练 B 时作为只读参考',
    explanation: '参考参数提供中心，Fisher 提供逐参数的偏移代价。它们不会随着 B 的当前参数一起漂移。',
  },
  {
    title: '收到 B 批次',
    input: '任务 B 的当前批次 D_B',
    reads: '当前 θ 与历史参考对',
    writes: '新任务损失 L_B(θ)',
    retained: 'A 的锚点与 Fisher 保持不变',
    explanation: '新任务数据产生学习信号；在 MNIST 的不重放协议里，旧样本不进入这个 EWC 惩罚计算。',
  },
  {
    title: '合并目标与梯度',
    input: 'L_B(θ) 与所有旧任务参考项',
    reads: 'θ、每个 θ*_k、对应 F_k 与系数 λ',
    writes: '总目标及 g_total = g_B + λΣₖF_k ⊙ (θ − θ*_k)',
    retained: '此时 θ、θ*_k、F_k 都尚未被这次求导改写',
    explanation: '新任务梯度推动任务 B 学习；EWC 梯度抵抗重要参数偏离旧解。求导只生成信号，还没有执行参数更新。',
  },
  {
    title: '优化器更新 θ',
    input: '合并梯度 g_total',
    reads: '当前 θ、梯度与优化器自己的状态',
    writes: '新的当前参数 θ',
    retained: '历史锚点 θ*_k 与 Fisher F_k 不变',
    explanation: '当前可训练参数在这里真正改变。具体变化量由优化器、步长及其状态共同决定。',
  },
  {
    title: '评估 A 与 B',
    input: '更新后的 θ 与各自测试数据',
    reads: 'A、B 的评估样本及模型预测',
    writes: '各任务的测试表现记录',
    retained: '评估不反向传播，也不更新 θ',
    explanation: '把旧任务保持与新任务学习分开观察；评估证据的含义由具体实验协议决定。',
  },
  {
    title: '保存 B 并继续',
    input: 'B 训练结束后的 θ*_B 与 F_B',
    reads: '已有的 A 参考项与 B 的任务状态',
    writes: '加入新的 (θ*_B, F_B) 参考项',
    retained: '原始 EWC 后续读取各任务参考项',
    explanation: '下一个任务会读取 A、B 的历史约束。这里展示原论文按任务保留惩罚项的形式，不把它替换成 online EWC 合并状态。',
  },
];

export function SceneSynthesis(_props: SceneProps) {
  const [activeStage, setActiveStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const flowScrollRef = useRef<HTMLDivElement>(null);
  const flowButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const stage = flowStages[activeStage];
  const lastStage = flowStages.length - 1;

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => {
      setPrefersReducedMotion(preference.matches);
      if (preference.matches) setIsPlaying(false);
    };
    syncPreference();
    preference.addEventListener('change', syncPreference);
    return () => preference.removeEventListener('change', syncPreference);
  }, []);

  useEffect(() => {
    if (!isPlaying || prefersReducedMotion) return;
    if (activeStage === lastStage) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setActiveStage((current) => Math.min(lastStage, current + 1)), 1900);
    return () => window.clearTimeout(timer);
  }, [activeStage, isPlaying, lastStage, prefersReducedMotion]);

  useEffect(() => {
    const container = flowScrollRef.current;
    const button = flowButtonRefs.current[activeStage];
    if (!container || !button) return;
    const containerRect = container.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const centeredLeft = container.scrollLeft + buttonRect.left - containerRect.left - (containerRect.width - buttonRect.width) / 2;
    const maxLeft = container.scrollWidth - container.clientWidth;
    container.scrollTo({ left: Math.max(0, Math.min(maxLeft, centeredLeft)), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [activeStage, prefersReducedMotion]);

  const chooseStage = (index: number) => {
    setIsPlaying(false);
    setActiveStage(index);
  };
  const stepStage = (offset: -1 | 1) => chooseStage(Math.max(0, Math.min(lastStage, activeStage + offset)));
  const togglePlayback = () => {
    if (prefersReducedMotion) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (activeStage === lastStage) setActiveStage(0);
    setIsPlaying(true);
  };

  return (
    <div className="scene-stack">
      <section className="learning-card">
        <div className="section-kicker">跨实验对照 · 同一机制，不同问题</div>
        <div className="synthesis-table-wrap"><table className="synthesis-table"><thead><tr><th>实验</th><th>比较对象</th><th>结果支持</th><th>解释边界</th></tr></thead><tbody>{rows.map(([experiment, comparison, result, boundary]) => <tr key={experiment}><th scope="row">{experiment}</th><td>{comparison}</td><td>{result}</td><td>{boundary}</td></tr>)}</tbody></table></div>
        <div className="result-conclusion"><strong>论文结论如何准确表达</strong><p>EWC 用任务重要性加权的参数约束缓解了特定连续学习实验中的干扰。它依赖局部 Gaussian 与对角 Fisher 近似；论文指出近似不确定性可能失准，因此不能概括为完全消除遗忘或保证无限任务扩展。</p></div>
        <div className="synthesis-principle"><span>读到 EWC 时记住这条链</span><strong>旧任务解 + 重要性估计 → 加权惩罚 → 新任务梯度与惩罚梯度共同更新当前参数</strong></div>
        <p className="source-note">MNIST 与 Atari 的量纲和实验组成不同，不将两组结果合并为单一分数。</p>
      </section>

      <section className="learning-card ewc-flow-demo" aria-labelledby="ewc-flow-title">
        <div className="section-kicker">交互 · 回放完整状态流</div>
        <h3 id="ewc-flow-title">从任务 A 的数据，到任务 B 的更新，再到下一次交接</h3>
        <p className="walkthrough-intro">选择任一节点查看它的输入、读取、写入和保留状态。自动播放只标记因果顺序，不运行神经网络或模拟论文成绩。</p>

        <div className="flow-track-scroll" ref={flowScrollRef} aria-label="可横向滚动的 EWC 状态流程">
          <div className="flow-track-inner">
            <span className="flow-track-rail" aria-hidden="true"><span style={{ width: `${(activeStage / lastStage) * 100}%` }} /></span>
            <ol className="flow-track" aria-label="EWC 九步状态流程">
            {flowStages.map((item, index) => <li key={item.title}>
              <button
                type="button"
                ref={(button) => { flowButtonRefs.current[index] = button; }}
                className={`flow-track-step ${activeStage === index ? 'is-active' : ''} ${index < activeStage ? 'is-complete' : ''}`}
                aria-label={`第 ${index + 1} 步：${item.title}`}
                aria-current={activeStage === index ? 'step' : undefined}
                aria-pressed={activeStage === index}
                onClick={() => chooseStage(index)}
              >
                <span className="flow-track-dot">{String(index + 1).padStart(2, '0')}</span>
                <span className="flow-track-label">{item.title}</span>
              </button>
            </li>)}
            </ol>
          </div>
        </div>

        <div className="flow-playback-controls" aria-label="流程播放控制">
          <button type="button" className="text-button" onClick={() => stepStage(-1)} disabled={activeStage === 0}>← 上一步</button>
          <button type="button" className="pager-button pager-next flow-play-toggle" onClick={togglePlayback} disabled={prefersReducedMotion} aria-pressed={isPlaying}>
            {prefersReducedMotion ? '自动播放已关闭' : isPlaying ? '暂停流程' : activeStage === lastStage ? '从头播放' : '▶ 自动播放'}
          </button>
          <button type="button" className="text-button" onClick={() => stepStage(1)} disabled={activeStage === lastStage}>下一步 →</button>
          <button type="button" className="text-button" onClick={() => chooseStage(0)}>重置</button>
        </div>
        <p className="flow-motion-note" aria-live="polite">{prefersReducedMotion ? '系统已开启减少动态效果：自动播放关闭，仍可用节点、上一步和下一步逐步查看。' : '播放约每 1.9 秒前进一步；可随时暂停、跳到任一节点或手动步进。'}</p>

        <div className="flow-stage-detail" aria-live="polite" aria-atomic="true">
          <div className="flow-stage-heading"><span>当前阶段 {String(activeStage + 1).padStart(2, '0')} / {String(flowStages.length).padStart(2, '0')}</span><strong>{stage.title}</strong></div>
          <dl className="flow-state-grid">
            <div><dt>输入</dt><dd>{stage.input}</dd></div>
            <div><dt>读取</dt><dd>{stage.reads}</dd></div>
            <div className="flow-state-write"><dt>写入 / 改变</dt><dd>{stage.writes}</dd></div>
            <div className="flow-state-retained"><dt>仍然保留</dt><dd>{stage.retained}</dd></div>
          </dl>
          <p className="flow-stage-explanation"><strong>实现理解：</strong>{stage.explanation}</p>
        </div>
        <div className="flow-formulas">
          <div><span className="mini-label">新任务目标</span><code>L_B(θ) + (λ/2) ΣₖΣᵢ Fₖ,ᵢ(θᵢ − θ*ₖ,ᵢ)²</code></div>
          <div><span className="mini-label">合并梯度</span><code>g_B + λΣₖFₖ ⊙ (θ − θ*ₖ)</code></div>
        </div>
        <p className="toy-label">这是按论文机制编排的教学流程，不会修改共享教学玩具状态、执行模型训练或生成实验数值。</p>
      </section>
    </div>
  );
}
