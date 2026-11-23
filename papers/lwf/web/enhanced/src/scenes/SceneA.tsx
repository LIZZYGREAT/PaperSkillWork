import React from 'react';
import { TermRef } from '../components/ReferencePrimitives';
import { InlineNotation } from '../components/InlineNotation';
import { openWorkspaceFor } from '../components/workspaceActions';
import { methodOrder, type LearningAction, type LearningSession, type MethodId } from '../data/session';

const methods: Record<MethodId, { title: string; short: string; shared: string; oldData: string; supervision: string; fit: string; explanation: string }> = {
  feature: {
    title: 'Feature extraction', short: '冻结共享表示', shared: '冻结 θ_s；只训练新任务输出头 θ_n。',
    oldData: '不使用旧图像与旧标签。', supervision: 'Y_n 监督新任务输出。旧任务分支保持不变。',
    fit: '满足数据约束', explanation: '旧表示不会因为本次更新而改变，但新任务无法重塑共享特征。稳定性较高，表示层面的适应受到限制。',
  },
  finetune: {
    title: 'Fine-tuning', short: '更新共享表示', shared: '新任务梯度可更新 θ_s 与 θ_n。',
    oldData: '不使用旧图像与旧标签。', supervision: '只有 Y_n 监督；旧任务没有目标来限制共享表示的变化。',
    fit: '满足数据约束', explanation: '微调不是主动删除旧知识。新任务梯度改变共享表示，旧任务又没有监督约束这种变化，因此旧输出可能漂移。',
  },
  joint: {
    title: 'Joint training', short: '加入旧任务监督', shared: '旧、新任务共同更新 θ_s；各自分支接收对应监督。',
    oldData: '需要 X_o 与 Y_o^GT；当前问题中不可用。', supervision: '旧任务与新任务真实标签共同监督。',
    fit: '超出当前数据约束', explanation: '联合训练是有效的训练路线，但需要旧任务训练样本。当前限制下它无法执行；这不是对该方法质量的判断。',
  },
};

export function SceneA({ session, dispatch, onNext }: {
  session: LearningSession;
  dispatch: React.Dispatch<LearningAction>;
  onNext: () => void;
}) {
  const selected = methods[session.selectedMethod];
  const allMethodsExplored = methodOrder.every((method) => session.exploredMethods.includes(method));

  return (
    <div className="v2-scene-content v2-scene-a">
      {!session.newTaskArrived ? (
        <section className="v2-state-card v2-old-checkpoint" aria-labelledby="old-checkpoint-title">
          <div className="v2-state-card-heading">
            <span className="v2-step-number">01</span>
            <div><p className="v2-eyebrow">BEFORE THE NEW TASK</p><h2 id="old-checkpoint-title">先从已训练完成的旧模型开始</h2></div>
          </div>
          <p className="v2-scene-copy">旧任务训练已经结束。此时，旧图像 <code><InlineNotation text="X_o" /></code>、旧真值 <code><InlineNotation text="Y_o^GT" /></code> 和已训练模型都还在。</p>
          <div className="v2-resource-row">
            <div><span>旧图像</span><code><InlineNotation text="X_o" /></code><strong>当前可用</strong></div>
            <div><span>旧真值</span><code><InlineNotation text="Y_o^GT" /></code><strong>当前可用</strong></div>
            <div><span>已训练模型</span><code><InlineNotation text="(θ_s, θ_o)" /></code><strong>checkpoint 已完成</strong></div>
          </div>
          <div className="v2-old-model-summary">
            <div className="v2-model-summary-icon" aria-hidden="true">M</div>
            <div><strong>Existing CNN · Old Task</strong><span><InlineNotation text="共享表示 θ_s → 旧任务输出头 θ_o" /></span></div>
            <button type="button" className="v2-inline-inspect" onClick={() => openWorkspaceFor('teacher')}>检查模型对象 ↗</button>
          </div>
          <div className="v2-transition-row">
            <div><span className="v2-transition-kicker">下一状态</span><strong>New Task Arrives</strong><small>数据条件将发生变化，旧模型仍会保留。</small></div>
            <button type="button" className="v2-primary-action" onClick={() => dispatch({ type: 'NEW_TASK_ARRIVES' })}>新任务到来 →</button>
          </div>
        </section>
      ) : (
        <>
          <section className="v2-state-card v2-constraint-card" aria-labelledby="constraint-title">
            <div className="v2-state-card-heading">
              <span className="v2-step-number">02</span>
              <div><p className="v2-eyebrow">PROBLEM CONSTRAINTS</p><h2 id="constraint-title">数据变了，旧模型没有消失</h2></div>
            </div>
            <p className="v2-scene-copy">新任务到来后，旧训练数据不能再用于训练；新图像和新标签可用。旧模型仍然可以接收输入并产生输出。多个任务共同使用的 <TermRef id="shared_parameters">共享参数 θ_s</TermRef> 发生变化时，旧任务输出可能漂移，这种性能退化称为 <TermRef id="catastrophic_forgetting">灾难性遗忘</TermRef>。</p>
            <div className="v2-constraint-grid" role="list" aria-label="当前问题可用信息">
              <ConstraintItem label="旧任务图像" symbol="X_o" available={false} />
              <ConstraintItem label="旧任务真值" symbol="Y_o^GT" available={false} />
              <ConstraintItem label="已训练旧模型" symbol="f_old" available />
              <ConstraintItem label="新任务图像" symbol="X_n" available />
              <ConstraintItem label="新任务标签" symbol="Y_n" available />
            </div>
          </section>

          <section className="v2-strategy-section" aria-labelledby="strategy-title">
            <div className="v2-section-title-row">
              <div><p className="v2-eyebrow">SAME MODEL BOUNDARY · DIFFERENT DATA AND UPDATE RULES</p><h2 id="strategy-title">先尝试三种路线</h2></div>
              <span className="v2-exploration-count">已检查 {session.exploredMethods.length} / 3</span>
            </div>
            <div className="v2-strategy-selector" role="group" aria-label="选择训练路线">
              {methodOrder.map((method, index) => (
                <button key={method} type="button" aria-pressed={session.selectedMethod === method} className={session.selectedMethod === method ? 'is-active' : ''} onClick={() => dispatch({ type: 'SELECT_METHOD', method })}>
                  <span className="v2-strategy-index">0{index + 1}</span>
                  <span><strong>{methods[method].title}</strong><small><InlineNotation text={methods[method].short} /></small></span>
                  <span className="v2-strategy-visited" aria-label={session.exploredMethods.includes(method) ? '已检查' : '未检查'}>{session.exploredMethods.includes(method) ? '✓' : '○'}</span>
                </button>
              ))}
            </div>

            <article className={`v2-strategy-detail ${session.selectedMethod === 'joint' ? 'is-constraint-conflict' : ''}`} aria-live="polite">
              <header><div><span className="v2-strategy-current">当前路线</span><h3>{selected.title}</h3></div><span className={`v2-fit-badge ${session.selectedMethod === 'joint' ? 'is-conflict' : 'is-fit'}`}>{selected.fit}</span></header>
              <dl>
                <div><dt>旧训练数据</dt><dd><InlineNotation text={selected.oldData} /></dd></div>
                <div><dt>共享表示 θ_s</dt><dd><InlineNotation text={selected.shared} /></dd></div>
                <div><dt>监督来源</dt><dd><InlineNotation text={selected.supervision} /></dd></div>
              </dl>
              <p className="v2-mechanism-explanation">{selected.explanation}</p>
              {session.selectedMethod === 'joint' ? <p className="v2-paper-boundary-note"><strong>约束检查：</strong>Joint training 本身并非错误；它需要当前不可用的旧训练图像与标签。</p> : null}
            </article>
          </section>

          {allMethodsExplored ? (
            <section className="v2-reasoning-step" aria-labelledby="reasoning-title">
              <p className="v2-eyebrow">WHAT IS STILL MISSING?</p>
              <h2 id="reasoning-title">我们需要同时保留什么条件？</h2>
              <div className="v2-requirement-list">
                <div><span className="v2-requirement-symbol">θ_s</span><span>共享表示仍可适应新任务</span><strong>需要</strong></div>
                <div><span className="v2-requirement-symbol">Y_n</span><span>新任务真实监督保持可用</span><strong>需要</strong></div>
                <div className={session.oldResponseRevealed ? 'is-satisfied' : ''}><span className="v2-requirement-symbol">旧任务</span><span>在没有旧样本时为旧行为保留参照</span><strong>{session.oldResponseRevealed ? '发现候选信号' : '还缺少'}</strong></div>
                <div className="is-unavailable"><span className="v2-requirement-symbol">X_o</span><span>旧任务训练数据</span><strong>不可用</strong></div>
              </div>
              {!session.oldResponseRevealed ? (
                <div className="v2-discovery-prompt">
                  <p>旧模型仍可处理当前新图像。它能否为旧任务输出提供一个参照？</p>
                  <button type="button" className="v2-primary-action" onClick={() => dispatch({ type: 'REVEAL_OLD_RESPONSE' })}>让旧模型处理 X_n →</button>
                </div>
              ) : (
                <div className="v2-lwf-discovery">
                  <div><span className="v2-paper-layer-tag">PAPER MECHANISM</span><strong><code>Y_o = f_old(X_n)</code></strong><span>旧模型在新任务图像上的旧任务响应；不是旧图像、旧真值或回放样本。</span></div>
                  <div><span className="v2-next-question-label">由此引出</span><p>如何把这个响应与新任务输出放进同一个可训练系统？</p><button type="button" className="v2-primary-action" onClick={onNext}>进入 Scene 02 · 构造 LwF 系统 →</button></div>
                </div>
              )}
            </section>
          ) : (
            <p className="v2-guided-hint" role="status">先逐一检查 Feature extraction、Fine-tuning 和 Joint training，再推导仍缺少的监督来源。</p>
          )}
        </>
      )}

      <footer className="v2-scene-evidence-line">
        <span>本场景关注问题条件与参数路径，不展示未经论文支持的准确率变化。</span>
        <span>Paper facts · C01 / A01 / A07</span>
      </footer>
    </div>
  );
}

function ConstraintItem({ label, symbol, available }: { label: string; symbol: string; available: boolean }) {
  return (
    <div className={`v2-constraint-item ${available ? 'is-available' : 'is-unavailable'}`} role="listitem">
      <span className="v2-constraint-mark" aria-hidden="true">{available ? '✓' : '×'}</span>
      <span><strong>{label}</strong><code><InlineNotation text={symbol} /></code></span>
      <small>{available ? '可用' : '不可用'}</small>
    </div>
  );
}
