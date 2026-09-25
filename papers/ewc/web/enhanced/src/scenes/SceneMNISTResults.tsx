import type { SceneProps } from './types';

const comparisons = [
  { panel: 'Figure 2A · 旧任务保持', title: 'EWC 与统一保护的取舍不同', detail: '论文报告 EWC 在继续学习时保留较早任务表现；对所有参数施加相同二次约束会妨碍新任务学习。', label: '性能趋势' },
  { panel: 'Figure 2B · 随任务数增加', title: '对照 SGD + dropout', detail: '在论文展示的连续任务设置中，dropout 对照随任务增加出现退化；EWC 保留较早任务表现。', label: '性能趋势' },
  { panel: 'Figure 2C · 参数使用', title: 'Fisher overlap 随输入差异变化', detail: '置换差异变大时，较早层 overlap 降低；相同标签空间下靠近输出的层仍可能共享。', label: '参数相似度' },
];

export function SceneMNISTResults(_props: SceneProps) {
  return (
    <div className="scene-stack">
      <section className="learning-card">
        <div className="section-kicker">结果分析 · 先区分问题，再比较图</div>
        <div className="result-comparison">
          {comparisons.map((item) => <article key={item.panel}><span className="figure-chip">{item.panel}</span><span className="result-type">{item.label}</span><h3>{item.title}</h3><p>{item.detail}</p></article>)}
        </div>
        <div className="result-conclusion"><strong>可以得出的结论</strong><p>在论文的 Permuted MNIST 协议中，Fisher 加权约束比统一约束更能兼顾旧任务保持与新任务学习。Figure 2C 为参数复用提供结构性分析，但它不是准确率证据。</p></div>
        <p className="source-note">以上为论文曲线与图注的定性归纳，没有从像素位置推算未报告的数据点。</p>
      </section>
      <section className="explain-grid">
        <article><span className="mini-label">支持范围</span><p>支持的是指定网络、训练轮数和置换任务下的比较结果。</p></article>
        <article><span className="mini-label">不能推出</span><p>不代表零遗忘，也不证明每个旧任务、新任务都能同时达到独立训练水平。</p></article>
      </section>
    </div>
  );
}
