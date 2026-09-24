import { TOY_STATE, type Session, formatVector } from '../data/session';

export function PersistentWorkspace({
  session,
  currentScene,
  onReset,
}: {
  session: Session;
  currentScene: string;
  onReset: () => void;
}) {
  return (
    <aside className="workspace" aria-labelledby="workspace-title">
      <div className="workspace-head">
        <div>
          <span className="section-kicker">跨场景共享</span>
          <h2 id="workspace-title">EWC 状态台</h2>
        </div>
        <button className="text-button" onClick={onReset}>重置玩具状态</button>
      </div>
      <p className="workspace-scene">当前阅读：{currentScene}</p>
      <div className="workspace-status"><span className="status-dot" />Teaching Toy 状态，不是论文训练运行</div>
      <dl className="state-list">
        <div><dt>当前任务</dt><dd>Task B</dd></div>
        <div><dt>当前参数 θ</dt><dd>{formatVector([...TOY_STATE.theta])}</dd></div>
        <div><dt>旧任务锚点 θ*</dt><dd>{formatVector([...TOY_STATE.anchor])}</dd></div>
        <div><dt>对角 Fisher F</dt><dd>{formatVector([...TOY_STATE.fisher])}</dd></div>
        <div><dt>参数偏移 Δ</dt><dd>{session.delta.toFixed(2)}</dd></div>
        <div><dt>约束系数 λ</dt><dd>{session.lambda.toFixed(1)}</dd></div>
      </dl>
      <div className="workspace-rule">
        <strong>谁会被更新？</strong>
        <p>新任务批次生成梯度；旧锚点与 Fisher 提供参考。优化器根据合并梯度改变当前 θ。</p>
      </div>
      <div className="workspace-legend" aria-label="对象类别">
        <span><i className="legend-current" />当前可变</span>
        <span><i className="legend-reference" />保存参考</span>
        <span><i className="legend-control" />控制量</span>
      </div>
    </aside>
  );
}
