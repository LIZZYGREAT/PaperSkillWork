import type { SceneProps } from './types';

const rows = [
  ['Permuted MNIST', 'EWC 对比 SGD、均匀约束与 dropout', '旧任务保持与新任务学习的定性权衡', '固定置换与指定网络的分类基准'],
  ['Atari', 'EWC 所在的完整 DQN 系统对比独立 DQN 等设置', '能学习多款游戏，低于十个独立 DQN 的分数', '任务识别、按任务回放和专属 gain/bias 同时参与'],
];

export function SceneSynthesis(_props: SceneProps) {
  return (
    <div className="scene-stack">
      <section className="learning-card">
        <div className="section-kicker">跨实验对照 · 同一机制，不同问题</div>
        <div className="synthesis-table-wrap"><table className="synthesis-table"><thead><tr><th>实验</th><th>比较对象</th><th>结果支持</th><th>解释边界</th></tr></thead><tbody>{rows.map(([experiment, comparison, result, boundary]) => <tr key={experiment}><th scope="row">{experiment}</th><td>{comparison}</td><td>{result}</td><td>{boundary}</td></tr>)}</tbody></table></div>
        <div className="result-conclusion"><strong>论文结论如何准确表达</strong><p>EWC 用任务重要性加权的参数约束缓解了特定连续学习实验中的干扰。它依赖局部 Gaussian 与对角 Fisher 近似；论文指出近似不确定性可能失准，因此不能概括为完全消除遗忘或保证无限任务扩展。</p></div>
        <div className="synthesis-principle"><span>读到 EWC 时记住这条链</span><strong>旧任务解 + 重要性估计 → 加权惩罚 → 新任务梯度与惩罚梯度共同更新当前参数</strong></div>
        <p className="source-note">全流程交互图会在本页下方展示。MNIST 与 Atari 的量纲和实验组成不同，不将两组结果合并为单一分数。</p>
      </section>
    </div>
  );
}
