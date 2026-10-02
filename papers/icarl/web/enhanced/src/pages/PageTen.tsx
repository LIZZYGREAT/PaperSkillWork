import { useMemo, useState, type ReactNode } from "react";
import { FlowStepper, type FlowStep } from "../shared/core/flow-stepper";
import { FeatureSpaceWorkbench, type FeaturePoint, type FeatureSpaceMode } from "../components/FeatureSpaceWorkbench";
import { SampleToken } from "../components/SampleToken";
import {
  CLASS_VISUALS,
  COMMITTED_MEMORY_SIZE,
  CURRENT_EXEMPLARS,
  INCOMING_CLASS_ID,
  INCOMING_SAMPLES,
  MEMORY_BUDGET,
  NEW_CLASS_HERDING,
  NEXT_CLASS_COUNT,
  NEXT_QUOTA,
  OLD_CLASS_IDS,
  OLD_MEMORY_SIZE,
  OLD_NODE_COUNT,
  OLD_QUOTA,
  P_BEFORE_REMOVED,
  P_AFTER,
  P_BEFORE,
  PROTOTYPES,
  projectSampleFeatures,
  REDUCED_MEMORY_SIZE,
  QUERY_DISTANCES,
  QUERY_FEATURE,
  QUERY_PREDICTION,
  TRAINING_SET_SIZE,
  type ClassId,
} from "../data/icarl-runtime";

const steps: FlowStep[] = [
  { id: "p10-current", title: "Current state", description: "Start from a persistent model Θ_before and ordered exemplar memory P_before.", statusText: "No class update has begun." },
  { id: "p10-arrive", title: "New classes arrive", description: "The full new-class batch X_new enters and new output nodes are appended.", statusText: "The old model and memory still exist." },
  { id: "p10-prepare", title: "Build D and snapshot Q", description: "Combine all new images with old exemplars; record old-node responses before changing the model.", statusText: "Q is update-local, not persistent state." },
  { id: "p10-train", title: "Update representation", description: "Use old soft targets and new hard targets to update Θ; P remains unchanged during training.", statusText: "Θ changes first; P is still P_before." },
  { id: "p10-quota", title: "Reduce old memory", description: "Recompute the per-class quota, then retain the ordered prefix of every old exemplar list.", statusText: "Memory changes only after the representation update." },
  { id: "p10-herding", title: "Herd the new class", description: "Run Herding on the full incoming data with the updated feature map; X_new stays available through selection.", statusText: "The visible order is computed from the fixed synthetic data." },
  { id: "p10-commit", title: "Commit updated state", description: "Finish the new exemplar bucket and store Θ_after together with P_after.", statusText: "Update-local objects can now be released." },
  { id: "p10-prototypes", title: "Build current prototypes", description: "Re-encode stored images with φ_after and normalize each exemplar mean.", statusText: "Prototypes are derived from Θ_after + P_after." },
  { id: "p10-predict", title: "Predict by nearest prototype", description: "Encode a query with φ_after and choose the closest current class prototype.", statusText: "The sigmoid-head argmax is not the final decision." },
  { id: "p10-repeat", title: "Continue the stream", description: "Θ_after and P_after become the next ready state; the next batch will start a later update.", statusText: "No second training trajectory is simulated here." },
];

const runtimePhases = ["ARRIVE", "PREPARE", "SNAPSHOT", "TRAIN", "MEMORY", "READY", "PREDICT"];

function phaseAt(stepIndex: number) {
  if (stepIndex === 0) return "READY";
  if (stepIndex === 1) return "ARRIVE";
  if (stepIndex === 2) return "SNAPSHOT";
  if (stepIndex === 3) return "TRAIN";
  if (stepIndex === 4 || stepIndex === 5) return "MEMORY";
  if (stepIndex === 6) return "READY";
  return "PREDICT";
}

function RuntimeTimeline({ stepIndex }: { stepIndex: number }) {
  const phase = phaseAt(stepIndex);
  return (
    <div className="runtime-timeline" aria-label={`Current runtime phase: ${phase}`}>
      {runtimePhases.map((item, index) => <div key={item} className={`runtime-timeline__item ${item === phase ? "is-active" : ""} ${index < runtimePhases.indexOf(phase) ? "is-past" : ""}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></div>)}
    </div>
  );
}

function MemoryBucket({ classId, stepIndex }: { classId: ClassId; stepIndex: number }) {
  const before = P_BEFORE[classId];
  const reduced = stepIndex >= 4;
  const newClassReady = stepIndex >= 5;
  const current = classId === INCOMING_CLASS_ID ? (newClassReady ? P_AFTER[classId] : []) : reduced ? P_AFTER[classId] : before;
  const removed = reduced ? P_BEFORE_REMOVED[classId] : [];
  const visual = CLASS_VISUALS[classId];
  return (
    <section className={`memory-bucket ${classId === INCOMING_CLASS_ID && current.length ? "memory-bucket--new" : ""}`} data-class-id={classId}>
      <div className="memory-bucket__heading"><span className="class-glyph" style={{ color: visual.color }}>{visual.glyph}</span><strong>{visual.label}</strong><small>{classId === INCOMING_CLASS_ID ? "new" : "old"}</small></div>
      <div className="memory-bucket__tokens">
        {current.length ? current.map((sample, index) => <SampleToken key={sample.id} sample={sample} role="exemplar" order={index + 1} compact />) : <span className="bucket-empty">{classId === INCOMING_CLASS_ID ? "constructed after training" : ""}</span>}
        {removed.map((sample) => <SampleToken key={`removed-${sample.id}`} sample={sample} role="removed" compact />)}
      </div>
      <small className="memory-bucket__count">{current.length} kept{removed.length ? ` · ${removed.length} removed from tail` : ""}</small>
    </section>
  );
}

function WorkspaceObject({ id, title, status, content, canonicalId }: { id: string; title: string; status: string; content: ReactNode; canonicalId?: string }) {
  const isLive = status === "live" || status === "training" || status === "captured";
  return (
    <section className={`workspace-object ${isLive ? "is-live" : ""} ${status === "released" ? "is-released" : ""}`} id={canonicalId} data-canonical-id={canonicalId}>
      <div className="workspace-object__heading"><h4>{title}</h4><span className={`object-status object-status--${status.replace(/\s/g, "-")}`}>{status}</span></div>
      <div className="workspace-object__content">{content}</div>
      <span className="workspace-object__id">{id}</span>
    </section>
  );
}

function ObjectLifetimeRail({ stepIndex }: { stepIndex: number }) {
  const rows = [
    { id: "persistent_model_state", label: "Θ · model", start: 0, end: 9, note: "persistent" },
    { id: "persistent_memory_state", label: "P · exemplars", start: 0, end: 9, note: stepIndex < 4 ? "P_before" : stepIndex < 6 ? "memory update" : "P_after" },
    { id: "incoming_class_batch", label: "X_new · full batch", start: 1, end: 6, note: stepIndex < 1 ? "not arrived" : stepIndex < 6 ? "available through Herding" : "released" },
    { id: "training_set_D", label: "D · update set", start: 2, end: 3, note: stepIndex < 2 ? "not built" : stepIndex < 4 ? "update-local" : "released" },
    { id: "response_snapshot_Q", label: "Q · old responses", start: 2, end: 3, note: stepIndex < 2 ? "not captured" : stepIndex < 4 ? "update-local" : "released" },
    { id: "derived_inference_state", label: "μ, query, distances", start: 7, end: 8, note: stepIndex < 7 ? "not derived" : "prediction-local" },
  ];
  return (
    <section className="panel lifetime-panel" id="object_lifetime" data-canonical-id="object_lifetime">
      <div className="panel-heading"><div><span className="eyebrow">OBJECT LIFETIME</span><h2>持久状态、批次输入与临时对象各自有生命周期</h2></div><small>guided step →</small></div>
      <div className="lifetime-scale" aria-hidden="true">{steps.map((_step, index) => <span key={index}>{index + 1}</span>)}</div>
      <div className="lifetime-rows">
        {rows.map((row) => {
          const active = stepIndex >= row.start && stepIndex <= row.end;
          const left = `${(row.start / (steps.length - 1)) * 100}%`;
          const width = `${((row.end - row.start) / (steps.length - 1)) * 100}%`;
          return <div className={`lifetime-row ${active ? "is-active" : ""}`} key={row.id}>
            <strong>{row.label}</strong><div className="lifetime-track"><span className={active ? "is-active" : ""} style={{ left, width }} /></div><small>{row.note}</small>
          </div>;
        })}
      </div>
    </section>
  );
}

export function PageTen() {
  const [stepIndex, setStepIndex] = useState(0);
  const trainingStarted = stepIndex >= 3;
  const quotaReduced = stepIndex >= 4;
  const herdingComplete = stepIndex >= 5;
  const predictionReady = stepIndex >= 8;

  const currentMemoryCount = !quotaReduced ? OLD_MEMORY_SIZE : herdingComplete ? COMMITTED_MEMORY_SIZE : REDUCED_MEMORY_SIZE;
  const quotaLabel = quotaReduced ? `${OLD_QUOTA} → ${NEXT_QUOTA} each` : `${OLD_QUOTA} each before next batch`;

  const herdingOrders = useMemo(() => new Map(NEW_CLASS_HERDING.ordered.map((sample, index) => [sample.id, index + 1])), []);
  const incomingFeaturePoints = useMemo(() => projectSampleFeatures(INCOMING_SAMPLES, "after", true, herdingOrders), [herdingOrders]);
  const exemplarFeaturePoints = useMemo(() => projectSampleFeatures(CURRENT_EXEMPLARS, "after", true), []);
  const herdingLastStep = NEW_CLASS_HERDING.steps[NEW_CLASS_HERDING.steps.length - 1];

  let featureMode: FeatureSpaceMode = "herding";
  let featurePoints: FeaturePoint[] = [];
  let featureTitle = "Feature space is ready";
  let featureDescription = "The same workbench changes mode only when the update reaches Herding, prototype construction, and inference.";
  const showUnitCircle = true;
  let rawMean: readonly [number, number] | undefined;
  let target: readonly [number, number] | undefined;
  let prefixMean: readonly [number, number] | undefined;
  let prototypes = [] as typeof PROTOTYPES;
  let query: readonly [number, number] | undefined;

  if (stepIndex >= 5 && stepIndex <= 6) {
    featureMode = "herding";
    featurePoints = incomingFeaturePoints;
    featureTitle = "Herding · new class D";
    featureDescription = "Normalized synthetic sample features, the computed class target, and the selected prefix all come from the same fixed data.";
    rawMean = NEW_CLASS_HERDING.rawTargetMean;
    target = NEW_CLASS_HERDING.target;
    prefixMean = herdingLastStep?.prefixMean;
  } else if (stepIndex === 7) {
    featureMode = "prototypes";
    featurePoints = exemplarFeaturePoints;
    featureTitle = "Current exemplar prototypes";
    featureDescription = "Stored images are re-encoded by the current feature map; each square is the normalized mean of that class's selected exemplars.";
    prototypes = PROTOTYPES;
  } else if (stepIndex >= 8) {
    featureMode = "inference";
    featurePoints = exemplarFeaturePoints;
    featureTitle = "Query → nearest prototype";
    featureDescription = "The query is normalized and compared with the current prototype for every seen class. The nearest distance determines the prediction.";
    prototypes = PROTOTYPES;
    query = QUERY_FEATURE;
  }

  const dStatus = stepIndex < 2 ? "not built" : stepIndex === 2 ? "live" : stepIndex === 3 ? "training" : "released";
  const qStatus = stepIndex < 2 ? "not captured" : stepIndex < 4 ? "captured" : "released";
  const targetStatus = stepIndex < 3 ? "not built" : stepIndex === 3 ? "training" : "released";
  const modelState = stepIndex < 3 ? "Θ_before" : "Θ_after";
  const systemExpression = stepIndex < 3 ? "Θ_before + P_before" : stepIndex === 3 ? "Θ_after + P_before" : stepIndex < 6 ? "Θ_after + memory update in progress" : "Θ_after + P_after";
  const activePhase = phaseAt(stepIndex);

  return (
    <article className="tutorial-page page-ten" id="runtime_workbench" data-canonical-id="runtime_workbench" aria-labelledby="page-ten-title">
      <div className="page-kicker"><span>PAGE 10</span><span>End-to-end runtime</span><span className="synthetic-tag">Synthetic teaching example</span></div>
      <header className="page-heading page-heading--runtime">
        <h1 id="page-ten-title">一个新类别批次，怎样变成下一轮可用状态？</h1>
        <p>把已经学过的对象放回同一运行时，跟踪 Θ、P、X<sub>new</sub>、D、Q 与预测阶段的派生对象。</p>
      </header>
      <div className="synthetic-boundary" role="note"><strong>示例边界</strong><span>下方固定合成坐标用于真实计算 quota、Herding、归一化均值与最近 prototype；Θ 的梯度更新只显示符号状态，不伪造训练轨迹或论文 checkpoint。</span></div>

      <section className="panel runtime-step-panel" aria-label="Runtime guided steps">
        <div className="panel-heading"><div><span className="eyebrow">RUNTIME CYCLE</span><h2>按论文顺序推进一次更新</h2></div><span className="runtime-step-count">S08 · L23</span></div>
        <FlowStepper steps={steps} step={stepIndex} onStepChange={(_step, index) => setStepIndex(index)} label="Page 10 runtime steps" />
        <RuntimeTimeline stepIndex={stepIndex} />
      </section>

      <section className="runtime-top-grid" aria-label="Persistent model, incoming data, and exemplar memory">
        <section className={`panel runtime-panel incoming-panel ${stepIndex >= 1 && stepIndex < 6 ? "is-current" : ""}`} id="incoming_class_batch" data-canonical-id="incoming_class_batch">
          <div className="panel-heading"><div><span className="eyebrow">STAGE INPUT · X<sub>new</sub></span><h2>Incoming batch</h2></div><span className="panel-index">01</span></div>
          {stepIndex === 0 ? <div className="empty-state">Next class batch has not arrived yet.</div> : stepIndex < 6 ? <>
            <p>Class D · all {INCOMING_SAMPLES.length} synthetic samples stay available through new-class Herding.</p>
            <div className="sample-token-grid">{INCOMING_SAMPLES.map((sample) => <SampleToken key={sample.id} sample={sample} role={herdingComplete && herdingOrders.has(sample.id) ? "selected" : "incoming"} order={herdingOrders.get(sample.id)} compact />)}</div>
            <small className="object-lifetime-note">X<sub>new</sub> is not consumed when D is built or when Θ changes.</small>
          </> : <div className="released-state"><strong>X<sub>new</sub> released</strong><span>All incoming images were available until the new exemplar list was constructed.</span></div>}
        </section>

        <section className={`panel runtime-panel model-panel ${trainingStarted ? "is-updated" : ""}`} id="persistent_model_state" data-canonical-id="persistent_model_state">
          <div className="panel-heading"><div><span className="eyebrow">PERSISTENT MODEL</span><h2>Current model</h2></div><span className={`theta-chip ${trainingStarted ? "is-after" : ""}`}>{modelState}</span></div>
          <div className="model-path">
            <div className="model-block" id="feature_extractor" data-canonical-id="feature_extractor"><span className="eyebrow">SHARED FEATURE EXTRACTOR</span><strong>φ<sub>Θ</sub></strong><small>same learner component</small></div>
            <span className="flow-arrow" aria-hidden="true">→</span>
            <div className="head-block" id="training_head" data-canonical-id="training_head"><span className="eyebrow">TRAINING HEAD · RETAINED</span><div className="head-class-nodes">{OLD_CLASS_IDS.map((classId) => <span key={classId} style={{ borderColor: CLASS_VISUALS[classId].color }}>{CLASS_VISUALS[classId].glyph} {classId}</span>)}{stepIndex >= 1 ? <span className="new-head-node">◇ D</span> : null}</div><small>one sigmoid node per seen class</small></div>
          </div>
          <p className="model-status-note">{trainingStarted ? "Θ has changed; P has not yet changed during the training phase." : "Before the update, old output nodes and P_before form the saved state."}</p>
          {predictionReady ? <p className="head-bypass-note">Prediction dims the head: the final decision uses nearest exemplar prototypes.</p> : null}
        </section>

        <section className="panel runtime-panel memory-panel" id="persistent_memory_state" data-canonical-id="persistent_memory_state">
          <div className="panel-heading"><div><span className="eyebrow">PERSISTENT MEMORY · P</span><h2>Ordered exemplar buckets</h2></div><span className="budget-chip">K = {MEMORY_BUDGET}</span></div>
          <div className="memory-summary"><span>{quotaReduced ? `m = floor(${MEMORY_BUDGET}/${NEXT_CLASS_COUNT}) = ${NEXT_QUOTA}` : `old quota = ${OLD_QUOTA} per class`}</span><strong>{currentMemoryCount}/{MEMORY_BUDGET} images</strong></div>
          <div className="memory-budget-rail" aria-label={`${currentMemoryCount} of ${MEMORY_BUDGET} exemplar slots occupied`}>{Array.from({ length: MEMORY_BUDGET }, (_, index) => <i key={index} className={index < currentMemoryCount ? "is-filled" : ""} />)}</div>
          <div className="memory-buckets">
            {(["A", "B", "C", "D"] as ClassId[]).map((classId) => <MemoryBucket key={classId} classId={classId} stepIndex={stepIndex} />)}
          </div>
          <small className="memory-order-note">Order reads left → right: lower p index has higher priority; a reduced list drops its tail.</small>
        </section>
      </section>

      <section className="runtime-bottom-grid" aria-label="Update-local workspace and feature-space computation">
        <section className="panel workspace-panel" aria-labelledby="workspace-title">
          <div className="panel-heading"><div><span className="eyebrow">TEMPORARY WORKSPACE</span><h2 id="workspace-title">Objects created for this update</h2></div><span className="panel-index">02</span></div>
          <div className="workspace-grid">
          <WorkspaceObject id="training_set_D" title="D · training set" status={dStatus} canonicalId="training_set_D" content={<><strong>{TRAINING_SET_SIZE} samples</strong><p>{OLD_MEMORY_SIZE} old exemplars + {INCOMING_SAMPLES.length} new full-data samples</p></>} />
            <WorkspaceObject id="response_snapshot_Q" title="Q · old responses" status={qStatus} canonicalId="response_snapshot_Q" content={<><strong>{TRAINING_SET_SIZE} × {OLD_NODE_COUNT}</strong><p>Pre-update responses on every item in D</p><code>qᵢᴬ · qᵢᴮ · qᵢᶜ</code></>} />
            <WorkspaceObject id="targets" title="Targets · by node age" status={targetStatus} content={<><p><b>Old nodes</b> ← soft q responses</p><p><b>New D node</b> ← hard class indicator</p></>} />
            <WorkspaceObject id="loss" title="Loss + backprop" status={targetStatus} content={<><strong>independent sigmoid BCE</strong><p>signals update φ<sub>Θ</sub> and the head</p></>} />
          </div>
          <p className="workspace-boundary">D, Q, targets and loss are update-local. Q is captured before Θ changes and released after training; it never enters persistent state.</p>
        </section>

        <section className="panel feature-workspace" id="unit_circle" data-canonical-id="unit_circle" aria-label="Shared feature-space workbench">
          <div className="panel-heading"><div><span className="eyebrow">ONE SHARED FEATURE SPACE</span><h2>{featureTitle}</h2></div><span className="mode-chip" data-canonical-id={stepIndex >= 8 ? "inference_mode" : stepIndex >= 7 ? "prototype_mode" : "herding_mode"}>{stepIndex >= 8 ? "INFERENCE" : stepIndex >= 7 ? "PROTOTYPES" : "HERDING"}</span></div>
          <FeatureSpaceWorkbench mode={featureMode} title={featureTitle} description={featureDescription} points={featurePoints} unitCircle={showUnitCircle} rawMean={rawMean} target={target} prefixMean={prefixMean} prototypes={prototypes} query={query} showSampleLabels={featureMode === "herding"} />
          {predictionReady ? <div className="prediction-result" aria-live="polite"><span>nearest prototype</span><strong>{CLASS_VISUALS[QUERY_PREDICTION].glyph} {CLASS_VISUALS[QUERY_PREDICTION].label}</strong><small>argmin over the computed distances</small></div> : null}
        </section>
      </section>

      <details className="panel inspect-panel">
        <summary>Inspect calculations · use the same inputs shown above</summary>
        <div className="inspect-grid">
          <section><h3>Quota and old-list reduction</h3><p>t = {NEXT_CLASS_COUNT}; m = floor(K/t) = floor({MEMORY_BUDGET}/{NEXT_CLASS_COUNT}) = {NEXT_QUOTA}. Each old list keeps `P_before[0..m−1]`; no old full dataset is used in this step.</p><p>Old memory before update: {OLD_CLASS_IDS.map((classId) => `${classId}: ${P_BEFORE[classId].map((sample) => sample.id).join(" → ")}`).join(" · ")}</p></section>
          <section><h3>New-class Herding output</h3><p>Full-class raw mean is computed first, then L2-normalized. Each candidate is scored by the distance from its normalized new-prefix mean to that normalized target.</p>
            <ol className="herding-order">{NEW_CLASS_HERDING.steps.map((step, index) => <li key={step.chosen.id}><strong>p{index + 1} = {step.chosen.id}</strong><span>selected prefix distance = {step.distanceToTarget.toFixed(3)}</span><details><summary>Candidate distances</summary><ul>{step.candidateScores.map((row) => <li key={row.sample.id}>{row.sample.id}: {row.distanceToTarget.toFixed(3)}</li>)}</ul></details></li>)}</ol>
          </section>
          <section><h3>Prototype and prediction distances</h3><p>For each class, normalized exemplar features are averaged and the mean is normalized again; every displayed distance is calculated from these same vectors.</p><ul className="distance-list">{QUERY_DISTANCES.map((row) => <li key={row.classId}><span>{CLASS_VISUALS[row.classId].glyph} {CLASS_VISUALS[row.classId].label}</span><code>{row.distance.toFixed(3)}</code></li>)}</ul></section>
        </div>
      </details>

      <ObjectLifetimeRail stepIndex={stepIndex} />

      <section className="system-state panel" id="state_commit" data-canonical-id="state_commit" aria-live="polite">
        <div><span className="eyebrow">CURRENT SYSTEM STATE</span><h2>{systemExpression}</h2></div>
        <div className="state-arrow" aria-hidden="true">→</div>
        <p>{stepIndex < 3 ? "The saved model and ordered memory persist while the new batch is prepared." : stepIndex === 3 ? "Training has updated Θ only; P is still the old memory." : stepIndex < 6 ? "The memory phase is changing P after training; the new persistent state is not ready yet." : stepIndex < 9 ? "P_after is committed. Prototypes and the query result are derived from this state." : "Θ_after + P_after becomes the starting state for a later class batch."}</p>
      </section>

      <div className="runtime-acceptance-prompt"><strong>Can you retell the lifecycle?</strong><span>When does Θ change? When does P change? When are Q and X<sub>new</sub> released? Which rule makes the final prediction?</span><span className="active-phase">Phase: {activePhase}</span></div>
    </article>
  );
}
