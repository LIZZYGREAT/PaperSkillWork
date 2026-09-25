import type { SceneProps } from './types';

export function SceneOverview(_props: SceneProps) {
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
      <section className="overview-route" aria-label="十页学习路径">
        <article><span>01–05</span><strong>问题到更新</strong><p>矛盾、Bayes、Fisher、目标函数</p></article>
        <article><span>06</span><strong>状态生命周期</strong><p>区分参数、锚点、Fisher 与数据</p></article>
        <article><span>07–10</span><strong>实验与结论</strong><p>MNIST、Atari、比较与全流程</p></article>
      </section>
    </div>
  );
}
