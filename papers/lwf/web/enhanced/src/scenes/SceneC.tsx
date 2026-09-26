import React from 'react';
import type { GradientSource, LearningAction, LearningSession, ParamGroupId, TrainingPhase, TrainingStage } from '../data/session';
import { useReferenceHub } from '../components/ReferencePrimitives';
import { openWorkspaceFor } from '../components/workspaceActions';
import { MathFormula } from '../components/MathFormula';
import { InlineNotation } from '../components/InlineNotation';
import {
  computeToyGradients,
  getTeacherResponse,
  getToyForward,
  initialToyState,
  selectGradientSource,
  stageRank,
  teachingToyReducer,
  toySamples,
  TOY_LAMBDA_OLD,
  TOY_LEARNING_RATE,
  TOY_TEMPERATURE,
  type TeachingToyState,
} from '../simulation/lwfTeachingToy';

const parameterGroups: { id: ParamGroupId; symbol: string; label: string }[] = [
  { id: 'theta_s', symbol: 'θ_s', label: '共享参数' },
  { id: 'theta_o', symbol: 'θ_o', label: '旧任务分支' },
  { id: 'theta_n', symbol: 'θ_n', label: '新任务分支' },
];

const gradientSources: { id: GradientSource; label: string }[] = [
  { id: 'new', label: 'L_new' },
  { id: 'old', label: 'λ_o L_old' },
  { id: 'regularization', label: 'R' },
  { id: 'total', label: 'Total' },
];

const steps: { stage: TrainingStage; label: string; title: string }[] = [
  { stage: 'batch', label: '01', title: 'Load Batch' },
  { stage: 'forward', label: '02', title: 'Forward' },
  { stage: 'loss', label: '03', title: 'Compute Loss' },
  { stage: 'backward', label: '04', title: 'Backward' },
  { stage: 'updated', label: '05', title: 'Optimizer Step' },
];

export function SceneC({ session, dispatch, toyState, dispatchToy, onPrevious, onReset }: {
  session: LearningSession;
  dispatch: React.Dispatch<LearningAction>;
  toyState: TeachingToyState;
  dispatchToy: React.Dispatch<React.ReducerAction<typeof teachingToyReducer>>;
  onPrevious: () => void;
  onReset: () => void;
}) {
  const [selectedStep, setSelectedStep] = React.useState(0);
  const { openHub } = useReferenceHub();
  const sample = toySamples.find((item) => item.id === session.selectedSampleId) || toySamples[0];
  const stage = session.trainingStage;
  const rank = stageRank(stage);
  const lastUpdate = toyState.lastUpdate;
  const calculationParameters = stage === 'updated' && lastUpdate ? lastUpdate.beforeParameters : toyState.student;
  const forward = getToyForward(calculationParameters, sample);
  const teacherResponse = getTeacherResponse(sample);
  const result = computeToyGradients(calculationParameters, session.phase);
  const inputReady = session.studentCreated && session.responseCacheReady && !session.teacherStudentShared
    && (session.responseMode === 'online' || session.cacheBySampleId);
  const trainableGroups: ParamGroupId[] = session.phase === 'warmup' ? ['theta_n'] : ['theta_s', 'theta_o', 'theta_n'];
  const canLoad = inputReady && (stage === 'idle' || stage === 'updated');
  const traceBefore = lastUpdate?.beforeParameters.theta_n.w[0][0] ?? initialToyState.student.theta_n.w[0][0];
  const traceAfter = lastUpdate?.afterParameters.theta_n.w[0][0] ?? toyState.student.theta_n.w[0][0];

  const setPhase = (phase: TrainingPhase) => {
    dispatch({ type: 'SET_PHASE', phase });
    dispatchToy({ type: 'ZERO_GRAD' });
  };
  const loadBatch = () => {
    dispatchToy({ type: 'ZERO_GRAD' });
    dispatch({ type: 'SET_TRAINING_STAGE', stage: 'batch' });
    setSelectedStep(0);
  };
  const runForward = () => {
    dispatch({ type: 'SET_TRAINING_STAGE', stage: 'forward' });
    setSelectedStep(1);
  };
  const computeLoss = () => {
    dispatch({ type: 'SET_TRAINING_STAGE', stage: 'loss' });
    setSelectedStep(2);
  };
  const runBackward = () => {
    dispatchToy({ type: 'BACKWARD', phase: session.phase });
    dispatch({ type: 'SET_TRAINING_STAGE', stage: 'backward' });
    setSelectedStep(3);
  };
  const optimizerStep = () => {
    dispatchToy({ type: 'OPTIMIZER_STEP', phase: session.phase, optimizerGroups: session.optimizerGroups });
    dispatch({ type: 'SET_TRAINING_STAGE', stage: 'updated' });
    setSelectedStep(4);
  };
  const resetTeachingModel = () => {
    onReset();
    setSelectedStep(0);
  };

  return (
    <div className="v2-scene-content v2-scene-c">
      <section className="v2-c-toy-banner">
        <div><span className="v2-source-badge is-toy">TEACHING TOY</span><strong>可计算的小型线性模型</strong><span>合成二维输入 · 3 个旧类 · 2 个新类 · 固定初始权重 · 抽象三组参数</span></div>
        <button type="button" className="v2-secondary-action" onClick={resetTeachingModel}>重置教学模型</button>
      </section>

      {!inputReady ? (
        <section className="v2-state-card v2-c-prerequisite">
          <span className="v2-eyebrow">WORKSPACE CHECK</span><h2>先完成 Scene B 的系统构造</h2>
          <p>训练步需要独立 Student、Teacher 响应和正确对齐的监督对象。返回 B 创建 Student 并生成响应；若切换到 batch-position 错配演示，请先恢复按样本 ID 对齐。</p>
          <button type="button" className="v2-primary-action" onClick={onPrevious}>返回 Scene B →</button>
        </section>
      ) : (
        <>
          <section className="v2-state-card v2-c-phase-card" aria-labelledby="c-phase-title">
            <div className="v2-section-title-row"><div><p className="v2-eyebrow">ONE EXPERIMENT TABLE · TWO TRAINING PHASES</p><h2 id="c-phase-title">同一模型，同一条执行链</h2></div><span className="v2-c-step-count">已完成 {stage === 'updated' ? toyState.stepCount : Math.max(toyState.stepCount, 0)} 个 toy step</span></div>
            <div className="v2-phase-switch" role="group" aria-label="Training phase">
              <button type="button" aria-pressed={session.phase === 'warmup'} className={session.phase === 'warmup' ? 'is-active' : ''} onClick={() => setPhase('warmup')}><strong>Warm-up</strong><small>requires_grad: θ_n；θ_s / θ_o 冻结</small></button>
              <button type="button" aria-pressed={session.phase === 'joint'} className={session.phase === 'joint' ? 'is-active' : ''} onClick={() => setPhase('joint')}><strong>Joint optimization</strong><small>requires_grad: θ_s / θ_o / θ_n</small></button>
            </div>
            <p className="v2-c-phase-note">当前 optimizer membership 来自 Scene B；冻结状态和 optimizer 是否包含某组参数分别显示。</p>
          </section>

          <section className="v2-state-card v2-c-stepper-card" aria-labelledby="c-stepper-title">
            <div className="v2-section-title-row"><div><p className="v2-eyebrow">USER-CONTROLLED EXECUTION</p><h2 id="c-stepper-title">逐步运行一个 batch</h2></div><span className="v2-c-current-step">{stage === 'idle' ? '等待开始' : stage === 'updated' ? 'Optimizer step 完成' : `当前：${steps[rank - 1]?.title}`}</span></div>
            <p className="v2-c-step-view-label">选择步骤查看对应细节</p>
            <ol className="v2-c-stepper" aria-label="选择要查看的训练步骤">
              {steps.map((step, index) => <li key={step.stage}>
                <button type="button" className={`v2-c-step-tab ${selectedStep === index ? 'is-selected' : ''} ${rank > index ? 'is-done' : ''} ${rank === index + 1 ? 'is-current' : ''}`} aria-pressed={selectedStep === index} aria-label={`查看步骤 ${step.label}: ${step.title}`} onClick={() => setSelectedStep(index)}>
                  <span>{rank > index ? '✓' : step.label}</span><strong>{step.title}</strong>
                </button>
              </li>)}
            </ol>
            <div className="v2-c-step-actions">
              <StepAction number="01" title={stage === 'updated' ? 'Load Next Batch' : 'Load Batch'} hint="本轮开始时先执行 zero_grad()，清除上轮 .grad。" disabled={!canLoad} complete={rank >= 1} onClick={loadBatch} />
              <StepAction number="02" title="Forward" hint="Student 计算共享特征，再分叉到两个任务头。" disabled={stage !== 'batch'} complete={rank >= 2} onClick={runForward} />
              <StepAction number="03" title="Compute Loss" hint="分别由旧响应和新标签构造两条监督损失。" disabled={stage !== 'forward'} complete={rank >= 3} onClick={computeLoss} />
              <StepAction number="04" title="Backward" hint="loss.backward() 计算并累积可训练参数的 .grad。" disabled={stage !== 'loss'} complete={rank >= 4} onClick={runBackward} />
              <StepAction number="05" title="Optimizer Step" hint="只有这一步才按 optimizer membership 改变参数值。" disabled={stage !== 'backward'} complete={stage === 'updated'} onClick={optimizerStep} primary />
            </div>
            <p className="v2-c-toy-disclaimer">这是 shared affine + 两个并行 affine head 的 Teaching Toy 计算，不是论文模型运行结果，也不模拟 B 中 backbone 的内部层数；每个操作只执行当前一步，不自动播放。</p>
          </section>

          {selectedStep === 0 ? <BatchInspector session={session} dispatch={dispatch} sample={sample} forward={forward} teacherResponse={teacherResponse} /> : null}
          {selectedStep === 1 ? <ForwardInspector session={session} sample={sample} forward={forward} teacherResponse={teacherResponse} /> : null}
          {selectedStep === 2 ? <LossInspector result={result} onEvidence={() => openHub({ evidenceId: 'F01' })} /> : null}
          {selectedStep === 3 ? <GradientInspector session={session} dispatch={dispatch} result={result} phase={session.phase} toyState={toyState} /> : null}
          {selectedStep === 4 ? <>
            <UpdateInspector toyState={toyState} />
            <section className="v2-state-card v2-c-optimizer-card" aria-labelledby="optimizer-c-title">
            <div className="v2-section-title-row"><div><p className="v2-eyebrow">COMPUTATION GRAPH ≠ OPTIMIZER</p><h2 id="optimizer-c-title">梯度存在，不代表参数一定更新</h2></div></div>
            <div className="v2-c-membership-table">
              <div className="v2-c-membership-head"><span>Parameter group</span><span>requires_grad</span><span>.grad</span><span>Optimizer</span><span>本步变化</span></div>
              {parameterGroups.map((group) => {
                const trainable = trainableGroups.includes(group.id);
                const hasGrad = Boolean(toyState.lastGradients?.[group.id]);
                const member = session.optimizerGroups.includes(group.id);
                const updated = lastUpdate?.updated[group.id] ?? false;
                const activeGradNorm = stage === 'updated' && lastUpdate ? lastUpdate.gradients[group.id] : affineNorm(toyState.lastGradients?.[group.id]);
                return <div className="v2-c-membership-row" key={group.id}><strong>{group.symbol}<small>{group.label}</small></strong><span>{trainable ? 'True' : 'False'}</span><span>{rank < 4 ? 'None' : hasGrad ? `Tensor · ${fmt(activeGradNorm)}` : 'None'}</span><span>{member ? 'IN' : 'OUT'}</span><b className={updated ? 'has-updated' : ''}>{stage === 'updated' ? updated ? 'YES' : 'NO' : '待 step'}</b></div>;
              })}
            </div>
            <p className="v2-c-membership-note">requires_grad 控制是否为该参数保留梯度；optimizer membership 控制 step 是否持有它。Warm-up 中冻结组即使被误加进 optimizer，也没有 .grad 可供本 toy 更新。</p>
            </section>
          </> : null}

          <details className="v2-implementation-details v2-c-advanced">
            <summary>Implementation notes：冻结、zero_grad 与计算图</summary>
            <div>
              <p><strong>Freeze ≠ detach：</strong>固定某层权重只表示不为该参数累积梯度；若后面仍有可训练层，反向信号仍可穿过这次运算传播到更早的可训练参数。detach 则会切断图。</p>
              <p><strong>Gradient accumulation：</strong>PyTorch 风格的 <code>.grad</code> 默认累加。此工作台在每次 Load Batch 时调用 <code>zero_grad()</code>，避免把上轮梯度加进来。</p>
              <p><strong>教学正则项：</strong>R 使用本 toy 明示的 ½ × 0.0005 × ΣW²（仅权重，不含 bias）；论文写为 weight decay，具体框架约定不在此冒充为论文源码。</p>
            </div>
          </details>

          <div className="v2-c-ending">
            <div><span className="v2-source-badge is-paper">论文目标</span><strong><MathFormula id="formula:total_loss" compact /> → backward → optimizer.step()</strong><small>下一专题将单独拆解温度与旧任务蒸馏损失。</small></div>
            <button type="button" onClick={() => openHub({ evidenceId: 'F02' })}>查看温度依据 F02 ↗</button>
          </div>
        </>
      )}

      <footer className="v2-scene-evidence-line"><span>Forward、loss、gradient 和 SGD 更新由独立的 Teaching Toy 纯函数实时计算。</span><span>Paper facts · A05 / F01–F06</span></footer>
    </div>
  );
}

function BatchInspector({ session, dispatch, sample, forward, teacherResponse }: { session: LearningSession; dispatch: React.Dispatch<LearningAction>; sample: (typeof toySamples)[number]; forward: ReturnType<typeof getToyForward>; teacherResponse: ReturnType<typeof getTeacherResponse> }) {
  return <section className="v2-c-panel" aria-labelledby="batch-inspector-title">
    <PanelHeading step="A" eyebrow="STEP 1 · DATALOADER" title="一个 batch 包含三个对齐对象" />
    <div className="v2-c-tensor-cards">
      <TensorCard name="X_n" shape="[B, 2]" description="合成二维输入；不是图像张量。" value="x₁ … x_B" />
      <TensorCard name="Y_n" shape="[B]" description="新任务类别索引。" value="y₁ … y_B" tone="new" />
      <TensorCard name="Y_o" shape="[B, 3]" description="Teacher 对相同 X_n 的旧任务概率响应。" value="y₁ᵒ … y_Bᵒ" tone="old" />
    </div>
    <div className="v2-c-sample-selector" role="group" aria-label="检查 batch 中的 toy 样本">
      <strong>检查单样本 <span>（仅用于查看；训练 loss 使用整个 batch）</span></strong>
      {toySamples.map((entry) => <button key={entry.id} type="button" aria-pressed={session.selectedSampleId === entry.id} className={session.selectedSampleId === entry.id ? 'is-active' : ''} disabled={stageRank(session.trainingStage) >= 2} onClick={() => dispatch({ type: 'SET_SAMPLE', id: entry.id })}>sample_id {entry.id}</button>)}
    </div>
    <div className="v2-c-sample-detail"><div><span>sample_id</span><strong>{sample.id}</strong></div><div><span><InlineNotation text="x_n" /></span><code>{vector(sample.x)}</code></div><div><span><InlineNotation text="Y_n label" /></span><code>class {sample.y}</code></div><div><span><InlineNotation text="Y_o = f_old(x_n)" /></span><code>{vector(teacherResponse.probabilities)}</code></div><div><span><InlineNotation text="Y_o ≠ Y_o^GT" /></span><strong>Teacher response，不是旧真值</strong></div><div><span><InlineNotation text="Student Ŷ_n (Forward)" /></span><code>{vector(forward.newProbabilities)}</code></div></div>
    <p className="v2-c-shape-note"><InlineNotation text="batch 内 sample_id、X_n、Y_n、Y_o 保持一一对应。本 toy 的输入形状为 [B,2]；B 场景的图像形状说明仍是 [B,C,H,W]。" /></p>
  </section>;
}

function ForwardInspector({ session, sample, forward, teacherResponse }: { session: LearningSession; sample: (typeof toySamples)[number]; forward: ReturnType<typeof getToyForward>; teacherResponse: ReturnType<typeof getTeacherResponse> }) {
  return <section className="v2-c-panel" aria-labelledby="forward-inspector-title">
    <PanelHeading step="B" eyebrow="STEP 2 · STUDENT FORWARD" title="一个 shared feature，分成两条输出路径" />
    <div className="v2-c-forward-diagram">
      <div className="v2-c-flow-node is-data"><code><InlineNotation text={`x_${sample.id}`} /></code><small>[2]</small></div><span>→</span>
      <button type="button" className={`v2-c-flow-node is-shared ${session.phase === 'warmup' ? 'is-frozen' : ''}`}><code><InlineNotation text="θ_s" /></code><small>{session.phase === 'warmup' ? 'frozen' : 'trainable'}</small></button><span>→</span>
      <div className="v2-c-flow-node is-feature"><code>h</code><small>{vector(forward.h)}</small></div>
      <div className="v2-c-branch-lines"><div className="is-old"><b>old path</b><span>↓</span><code><InlineNotation text="θ_o" /></code><span>↓</span><code><InlineNotation text="ẑ_o" /></code><small>{vector(forward.oldLogits)}</small><span>softmax</span><strong>{vector(forward.oldProbabilities)}</strong></div><div className="is-new"><b>new path</b><span>↓</span><code><InlineNotation text="θ_n" /></code><span>↓</span><code><InlineNotation text="ẑ_n" /></code><small>{vector(forward.newLogits)}</small><span>softmax</span><strong>{vector(forward.newProbabilities)}</strong></div></div>
    </div>
    <div className="v2-c-logit-note"><div><strong>Logits</strong><code><InlineNotation text="ẑ_o =" /> {vector(forward.oldLogits)}</code><small>未归一化分数；可为任意实数</small></div><div><strong>Probability</strong><code><InlineNotation text="softmax(ẑ_o) =" /> {vector(forward.oldProbabilities)}</code><small>归一化后和为 1；Teaching Toy 的显示精度为 4 位</small></div><div className="is-temperature"><strong>Temperature node · T={TOY_TEMPERATURE}</strong><code><InlineNotation text="softmax(z_o / T)" /></code><small>旧损失分支使用温度响应；后续专题详解</small><span><InlineNotation text="Teacher raw Y_o:" /> {vector(teacherResponse.probabilities)}</span></div></div>
  </section>;
}

function LossInspector({ result, onEvidence }: { result: ReturnType<typeof computeToyGradients>; onEvidence: () => void }) {
  return <section className="v2-c-panel" aria-labelledby="loss-inspector-title">
    <PanelHeading step="C" eyebrow="STEP 3 · COMPUTE LOSS" title="旧响应与新标签走不同分支，再汇合成标量" />
    <div className="v2-c-loss-formula"><span>论文目标</span><strong><MathFormula id="formula:total_loss" compact /></strong><code>λₒ = {TOY_LAMBDA_OLD} · T = {TOY_TEMPERATURE}</code></div>
    <div className="v2-c-loss-paths"><div className="is-old"><span><InlineNotation text="Teacher target Y_o" /></span><i>→</i><span><InlineNotation text="student old soft response Ŷ_o" /></span><i>→</i><strong><InlineNotation text="L_old =" /> {fmt(result.oldLoss)}</strong></div><div className="is-new"><span><InlineNotation text="new label Y_n" /></span><i>→</i><span><InlineNotation text="student new output Ŷ_n" /></span><i>→</i><strong><InlineNotation text="L_new =" /> {fmt(result.newLoss)}</strong></div><div className="is-reg"><span>Student weights</span><i>→</i><strong>R = {fmt(result.regularizationLoss)}</strong></div></div>
    <div className="v2-c-total-loss"><span>Teaching Toy computed total</span><strong>{fmt(result.totalLoss)}</strong><small><InlineNotation text="本 toy 明确使用 ½ × 0.0005 × ΣW²；论文目标为 λ_o L_old + L_new + R。" /></small></div>
    <div className="v2-c-dependency-grid"><div><strong><InlineNotation text="L_new dependency" /></strong><span><InlineNotation text="Y_n → L_new ← Ŷ_n ← θ_n ← h ← θ_s" /></span><b><InlineNotation text="∂L_new / ∂θ_o = 0" /></b><small><InlineNotation text="θ_o 不在 L_new 的计算路径上。" /></small></div><div><strong><InlineNotation text="L_old dependency" /></strong><span><InlineNotation text="Y_o → L_old ← Ŷ_o ← θ_o ← h ← θ_s" /></span><b><InlineNotation text="∂L_old / ∂θ_n = 0" /></b><small><InlineNotation text="θ_n 不在 L_old 的计算路径上。" /></small></div></div>
    <button type="button" className="v2-c-evidence-link" onClick={onEvidence}>查看论文损失与温度依据 F01 ↗</button>
  </section>;
}

function GradientInspector({ session, dispatch, result, phase, toyState }: { session: LearningSession; dispatch: React.Dispatch<LearningAction>; result: ReturnType<typeof computeToyGradients>; phase: TrainingPhase; toyState: TeachingToyState }) {
  const source = session.selectedGradientSource;
  const sourceLabel = gradientSources.find((item) => item.id === source)?.label || 'Total';
  const rank = stageRank(session.trainingStage);
  return <section className="v2-c-panel" aria-labelledby="gradient-inspector-title">
    <PanelHeading step="D" eyebrow={rank >= 5 ? 'AFTER OPTIMIZER STEP' : 'STEP 4 · BACKWARD'} title={rank >= 5 ? 'Step 后 .grad 保留；参数已按成员关系变化' : 'Backward 产生 .grad；此刻参数还没改变'} />
    <div className="v2-c-gradient-source" role="group" aria-label="选择梯度来源">
      <strong>梯度来源</strong>{gradientSources.map((item) => <button key={item.id} type="button" aria-pressed={source === item.id} className={source === item.id ? 'is-active' : ''} onClick={() => dispatch({ type: 'SET_GRADIENT_SOURCE', source: item.id })}>{item.label}</button>)}
    </div>
    <div className={`v2-c-gradient-graph source-${source}`}>
      <div className="v2-c-loss-source">{sourceLabel}<small>{rank >= 4 ? 'backward 已执行' : 'backward 前：尚无 .grad'}</small></div>
      <div className="v2-c-gradient-branches"><GradientBranch group="theta_o" source={source} trainable={phase === 'joint'} active={source === 'old' || source === 'total' || source === 'regularization'} />
        <div className="v2-c-grad-shared"><span>h</span><i>shared trunk gradient</i><button type="button" onClick={() => openWorkspaceFor('theta_s')} className={phase === 'joint' ? 'is-trainable' : 'is-frozen'}>θ_s <small>{phase === 'warmup' ? 'frozen' : 'trainable'}</small></button></div>
        <GradientBranch group="theta_n" source={source} trainable={true} active={source === 'new' || source === 'total' || source === 'regularization'} />
      </div>
    </div>
    <div className="v2-c-gradient-table">
      <div className="v2-c-gradient-table-head"><span>Group</span><span>{sourceLabel} contribution</span><span>.grad state</span><span>Optimizer</span></div>
      {parameterGroups.map((group) => {
        const trainable = (phase === 'joint' || group.id === 'theta_n');
        const component = selectGradientSource(result, source, group.id);
        const selectedNorm = affineNorm(component);
        const hasGrad = Boolean(toyState.lastGradients?.[group.id]);
        const activeGradNorm = session.trainingStage === 'updated' && toyState.lastUpdate ? toyState.lastUpdate.gradients[group.id] : affineNorm(toyState.lastGradients?.[group.id]);
        const gradText = rank < 4 ? 'None · backward 前' : hasGrad ? `Tensor · ‖g‖ ${fmt(activeGradNorm)}` : 'None · frozen';
        const displayedContribution = rank < 4 ? 'backward 前未写入 .grad' : !trainable ? '无 .grad（冻结）' : fmt(selectedNorm);
        return <div key={group.id} className="v2-c-gradient-row"><strong>{group.symbol}<small>{group.label}</small></strong><span>{displayedContribution}</span><span>{gradText}</span><span>{session.optimizerGroups.includes(group.id) ? 'IN' : 'OUT'}</span></div>;
      })}
    </div>
    {rank === 4 ? <div className="v2-c-backward-result" role="status"><strong>Gradients computed · Parameters changed? NO</strong><span>反向传播结束后，参数仍与 Forward 时一致；Optimizer Step 尚未执行。</span></div> : rank >= 5 ? <div className="v2-c-backward-result is-stepped" role="status"><strong>optimizer.step() 已执行 · .grad 仍保留</strong><span>参数是否改变取决于 requires_grad、是否有 .grad 以及 optimizer membership；具体变化见下方摘要。</span></div> : <p className="v2-c-grad-pending">执行 Backward 后才会出现可训练参数的 .grad；冻结参数显示 None。</p>}
    <p className="v2-c-shared-conflict">联合阶段 θ_s 同时接收 λ_o L_old 与 L_new 梯度；训练目标对共享表示的不同要求在这里相遇。</p>
  </section>;
}

function UpdateInspector({ toyState }: { toyState: TeachingToyState }) {
  const update = toyState.lastUpdate;
  if (!update) return <section className="v2-c-panel v2-c-step-pending" aria-labelledby="update-inspector-title">
    <PanelHeading step="E" eyebrow="STEP 5 · OPTIMIZER.STEP" title="只有 optimizer.step() 才尝试改变成员参数" />
    <p>尚未执行参数更新。完成前向计算、损失计算和反向传播后，执行 Optimizer Step 即可在此查看各参数组的更新量。</p>
  </section>;
  return <section className="v2-c-panel v2-c-update-panel" aria-labelledby="update-inspector-title">
    <PanelHeading step="E" eyebrow="STEP 5 · OPTIMIZER.STEP" title="只有 optimizer.step() 才尝试改变成员参数" />
    <div className="v2-c-update-table"><div className="v2-c-update-head"><span>Group</span><span>‖θ‖ before</span><span>‖grad‖</span><span>‖Δθ‖</span><span>‖θ‖ after</span><span>Changed</span></div>
      {parameterGroups.map((group) => <div key={group.id} className="v2-c-update-row"><strong>{group.symbol}</strong><span>{fmt(update.before[group.id])}</span><span>{fmt(update.gradients[group.id])}</span><span>{fmt(update.updateNorms[group.id])}</span><span>{fmt(update.after[group.id])}</span><b className={update.updated[group.id] ? 'is-changed' : ''}>{update.updated[group.id] ? 'YES' : 'NO'}</b></div>)}
    </div>
    <p className="v2-c-update-formula">Toy SGD: θ ← θ − ηg · η={TOY_LEARNING_RATE}。只有存在 .grad 且位于 optimizer.param_groups 中的组，本步才会变化。</p>
    <div className="v2-c-parameter-trace"><div><span>TRACE · new_head.weight[0,0]</span><code>before forward → loss → backward: {fmt(update.beforeParameters.theta_n.w[0][0])}</code><code>after optimizer.step: {fmt(update.afterParameters.theta_n.w[0][0])}</code></div><strong className={update.afterParameters.theta_n.w[0][0] !== update.beforeParameters.theta_n.w[0][0] ? 'is-changed' : ''}>{update.afterParameters.theta_n.w[0][0] !== update.beforeParameters.theta_n.w[0][0] ? 'UPDATED' : 'UNCHANGED'}</strong></div>
  </section>;
}

function GradientBranch({ group, source, trainable, active }: { group: 'theta_o' | 'theta_n'; source: GradientSource; trainable: boolean; active: boolean }) {
  const old = group === 'theta_o';
  return <div className={`v2-c-grad-branch ${old ? 'is-old' : 'is-new'} ${active ? 'is-active' : 'is-muted'}`}><b>{old ? 'old output' : 'new output'}</b><button type="button" className={trainable ? '' : 'is-frozen'}>{old ? 'θ_o' : 'θ_n'}<small>{trainable ? 'trainable' : 'frozen'}</small></button><span>{!active ? '0 from this source' : trainable ? source === 'total' ? 'gradient contributes' : 'gradient from source' : 'loss path · parameter frozen'}</span></div>;
}

function StepAction({ number, title, hint, disabled, complete, onClick, primary }: { number: string; title: string; hint: string; disabled: boolean; complete: boolean; onClick: () => void; primary?: boolean }) {
  return <div className={`v2-c-step-action ${disabled ? 'is-disabled' : 'is-enabled'} ${complete ? 'is-complete' : ''}`}><span className="v2-c-step-action-num">{complete ? '✓' : number}</span><button type="button" className={primary ? 'is-primary' : ''} disabled={disabled} onClick={onClick}>{title}</button><small>{hint}</small></div>;
}

function PanelHeading({ step, eyebrow, title }: { step: string; eyebrow: string; title: string }) {
  return <div className="v2-c-panel-heading"><span>{step}</span><div><p className="v2-eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>;
}

function TensorCard({ name, shape, description, value, tone }: { name: string; shape: string; description: string; value: string; tone?: 'new' | 'old' }) {
  return <div className={`v2-c-tensor-card ${tone ? `is-${tone}` : ''}`}><div><code><InlineNotation text={name} /></code><strong><InlineNotation text={shape} /></strong></div><p><InlineNotation text={description} /></p><small><InlineNotation text={value} /></small></div>;
}

function fmt(value: number) { return Number.isFinite(value) ? value.toFixed(4) : '0.0000'; }
function vector(values: number[]) { return `[${values.map((value) => fmt(value)).join(', ')}]`; }
function affineNorm(value: { w: number[][]; b: number[] } | undefined) {
  if (!value) return 0;
  return Math.sqrt([...value.w.flat(), ...value.b].reduce((sum, item) => sum + item * item, 0));
}
