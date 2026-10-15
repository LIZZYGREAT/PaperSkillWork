import { useEffect, useRef, type CSSProperties } from "react";
import { FeatureSpaceWorkbench } from "../components/FeatureSpaceWorkbench";
import { SampleToken } from "../components/SampleToken";
import {
  ALL_CLASS_IDS,
  CLASS_VISUALS,
  CURRENT_EXEMPLARS,
  INCOMING_CLASS_IDS,
  INCOMING_SAMPLES,
  MEMORY_BUDGET,
  NEW_CLASS_HERDING,
  NEXT_QUOTA,
  OLD_CLASS_IDS,
  P_AFTER,
  P_BEFORE,
  PROTOTYPES,
  QUERY_DISTANCES,
  QUERY_FEATURE,
  QUERY_PREDICTION,
  TRAINING_SET_SIZE,
  projectSampleFeatures,
  samplesForClass,
  type ClassId,
  type IncomingClassId,
  type Sample,
} from "../data/icarl-runtime";
import { INCREMENTAL_STAGE_DATA, binaryCrossEntropy, buildTargets, sixNodeBceLoss, studentOutputFor, teacherSnapshotFor } from "../data/incremental-training";
import { useAnimationTimeline } from "../shared/animation/useAnimationTimeline";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";
import {
  RUNTIME_CHAPTERS,
  RUNTIME_CHAPTER_FIRST_CLIP,
  RUNTIME_CLIPS,
  RUNTIME_CLIP_INDEX,
  runtimeSceneAt,
  type RuntimeChapterId,
  type RuntimeObjectId,
  type RuntimeScene,
} from "./page-nine-scene";

const P9_COMPARISON_PROTOTYPES = QUERY_DISTANCES.map(({ classId }) => PROTOTYPES.find((prototype) => prototype.classId === classId)!);
const oldDemoSample = P_BEFORE.A[0];
const newDemoSample = INCOMING_SAMPLES.find((sample) => sample.classId === "D")!;
const demoQSamples = [oldDemoSample, newDemoSample] as const;
const trainingDemoSample = INCOMING_SAMPLES.find((sample) => sample.classId === "D")!;
const trainingDemoTargets = buildTargets(trainingDemoSample);
const trainingDemoOutputs = studentOutputFor(trainingDemoSample);
const trainingDemoLoss = sixNodeBceLoss(trainingDemoTargets, trainingDemoOutputs);
const p9CurrentPoints = projectSampleFeatures(CURRENT_EXEMPLARS, "after", true);
const p9TrackedOldSamples = OLD_CLASS_IDS.flatMap((classId) => P_AFTER[classId]);
const p9TrackedBeforePoints = projectSampleFeatures(p9TrackedOldSamples, "before", true);
const p9PrototypeData = PROTOTYPES.map((prototype) => ({
  classId: prototype.classId,
  point: prototype.point,
  sampleIds: P_AFTER[prototype.classId].map((sample) => sample.id),
}));

function classAccent(classId: ClassId): CSSProperties {
  return { "--class-accent": CLASS_VISUALS[classId].color } as CSSProperties;
}

function PersistentState({ scene }: { scene: RuntimeScene }) {
  const isAfter = scene.memory === "after";
  const isBuilding = scene.memory === "building" || scene.memory === "truncating";
  const removedOldSamples = Math.max(0, P_BEFORE.A.length * OLD_CLASS_IDS.length - scene.oldMemoryRetained);
  const memoryGroups = ALL_CLASS_IDS.map((classId) => {
    const oldClass = OLD_CLASS_IDS.includes(classId as (typeof OLD_CLASS_IDS)[number]);
    const oldClassIndex = oldClass ? OLD_CLASS_IDS.indexOf(classId as (typeof OLD_CLASS_IDS)[number]) : -1;
    const removedFromThisClass = oldClass
      ? Math.min(P_BEFORE[classId].length - NEXT_QUOTA, Math.max(0, removedOldSamples - oldClassIndex * (P_BEFORE[classId].length - NEXT_QUOTA)))
      : 0;
    const oldRetainedForClass = P_BEFORE[classId].length - removedFromThisClass;
    const selectedCount = classId === "D" ? Math.min(NEXT_QUOTA, scene.newExemplarsSelected)
      : classId === "E" ? Math.min(NEXT_QUOTA, Math.max(0, scene.newExemplarsSelected - NEXT_QUOTA))
        : classId === "F" ? Math.min(NEXT_QUOTA, Math.max(0, scene.newExemplarsSelected - NEXT_QUOTA * 2)) : 0;
    const retainedSamples = oldClass
      ? (isAfter || isBuilding ? P_BEFORE[classId].slice(0, oldRetainedForClass) : P_BEFORE[classId])
      : (isAfter ? P_AFTER[classId] : NEW_CLASS_HERDING[classId as IncomingClassId].ordered.slice(0, selectedCount));
    const samples = oldClass && scene.clip.id === "truncate-old-prefix" ? P_BEFORE[classId] : retainedSamples;
    return { classId, samples, retainedSamples, oldClass, oldRetainedForClass };
  }).filter(({ oldClass, retainedSamples }) => oldClass || retainedSamples.length > 0 || isAfter);
  const memoryIds = memoryGroups.flatMap(({ retainedSamples }) => retainedSamples.map((sample) => sample.id));
  return (
    <aside className="p9-persistent" aria-label="固定持久状态">
      <section className="p9-card p9-model-card" id="persistent_model_state" data-canonical-id="persistent_model_state">
        <header className="p9-card-heading">
          <div><span className="p9-eyebrow">持久模型</span><h2>当前学习器</h2></div>
          <b className="p9-theta-badge" data-theta-state={scene.theta}>Θ_{scene.theta}</b>
        </header>
        <div className="p9-model-diagram">
          <div className="p9-extractor" id="feature_extractor" data-canonical-id="feature_extractor">
            <span className="p9-layer-stack" aria-hidden="true"><i /><i /><i /><i /></span>
            <strong>φ<sub>Θ</sub></strong>
            <small>共享特征提取器</small>
          </div>
          <span className="p9-flow-arrow" aria-hidden="true">→</span>
          <div className="p9-head-preview" id="training_head" data-canonical-id="training_head" aria-label="更新前的三个旧类别训练节点">
            {OLD_CLASS_IDS.map((classId) => <span key={classId} style={classAccent(classId)}>{CLASS_VISUALS[classId].glyph}<small>g{CLASS_VISUALS[classId].index}</small></span>)}
          </div>
        </div>
        <p className="p9-card-note">{scene.theta === "before" ? "更新前的旧模型；Q 由这三个旧节点产生。" : "符号化参数状态；不展示虚构的优化器轨迹。"}</p>
      </section>

      <section className="p9-card p9-memory-card" id="persistent_memory_state" data-canonical-id="persistent_memory_state">
        <header className="p9-card-heading">
          <div><span className="p9-eyebrow">{isAfter ? "已提交持久记忆" : isBuilding ? "记忆构建工作区" : "持久图片记忆"}</span><h2>{isAfter ? "P_after 原始 exemplars" : isBuilding ? "待提交 P_after 候选" : "P_before 有序 exemplars"}</h2></div>
          <b className="p9-budget-badge">K={MEMORY_BUDGET}</b>
        </header>
        <p className="p9-memory-caption">{isAfter ? "P_after · 12/12 张。六类各保留当前表示下的两张原始图片。" : isBuilding ? `待提交 P_after · ${scene.committedMemoryCount}/${MEMORY_BUDGET} 个槽位；旧图保留原 ID，新图按 Herding 顺序加入。` : "P_before · 12/12 张。旧图片一直留在原位；送入 D 的是训练副本。"}</p>
        <div className={"p9-memory-groups" + (isBuilding || isAfter ? " is-compact" : "")} data-memory-count={isAfter ? MEMORY_BUDGET : isBuilding ? scene.committedMemoryCount : 12}>
          {memoryGroups.map(({ classId, samples, oldClass, oldRetainedForClass }) => (
            <section className="p9-memory-group" key={classId} style={classAccent(classId)} aria-label={CLASS_VISUALS[classId].displayLabel + " 的持久记忆"}>
              <header><b>{CLASS_VISUALS[classId].glyph} {CLASS_VISUALS[classId].displayLabel}</b><small>{oldClass ? isAfter ? "P_after" : isBuilding ? "待提交前缀" : "P_before" : isAfter ? "P_after" : "待提交"}</small></header>
              <div className="p9-memory-tokens">
                {samples.map((sample, index) => {
                  const isLeaving = oldClass && scene.clip.id === "truncate-old-prefix" && index >= oldRetainedForClass;
                  const order = oldClass ? index + 1 : index + 1;
                  return <span className="p9-memory-token" key={sample.id} style={{ "--p9-token-opacity": isLeaving ? 0 : 1 } as CSSProperties} data-retained-id={isLeaving ? undefined : sample.id} data-memory-role={isLeaving ? "truncating-tail" : oldClass ? "old-prefix" : "herding-selection"} aria-hidden={isLeaving ? true : undefined}>
                    <SampleToken sample={sample} role={isLeaving ? "removed" : oldClass ? "exemplar" : "selected"} order={order} compact />
                  </span>;
                })}
              </div>
            </section>
          ))}
        </div>
        <div className="p9-memory-integrity" data-memory-source-ids={memoryIds.join(" ")}>
          <span aria-hidden="true">●</span> {isAfter ? "P_after 已提交 · 原始 exemplar" : isBuilding ? `预算占用 ${scene.committedMemoryCount}/${MEMORY_BUDGET} · 原始图片 ID 可追踪` : "持久原件不移动"}
        </div>
      </section>
    </aside>
  );
}

function TrainingBridgeScene({ scene }: { scene: RuntimeScene }) {
  const updating = scene.clip.id === "update-theta";
  const isComplete = scene.theta === "after";
  return (
    <div className="p9-training-scene" data-clip={scene.clip.id} data-progress={scene.progress.toFixed(2)} data-training-sample-id={trainingDemoSample.id}>
      <section className="p9-training-sample-card">
        <span className="p9-eyebrow">D 中的一张真实教学样本</span>
        <SampleToken sample={trainingDemoSample} role="incoming" compact />
        <small>Q 行 {trainingDemoSample.id} 与该图像 ID 对齐</small>
      </section>
      <div className="p9-training-objective">
        <div className="p9-training-equation" data-six-node-loss={trainingDemoLoss.toFixed(6)}><span>Q 的 3 个软目标</span><i>+</i><span>真实新类 3 个硬标签</span><i>→</i><b>6 节点 BCE · Σ {trainingDemoLoss.toFixed(3)}</b></div>
        <div className="p9-training-nodes" role="table" aria-label={`${trainingDemoSample.id} 的六节点教学 BCE 示例`}>
          <div className="p9-training-row p9-training-row--head" role="row"><b>节点</b><span>目标值</span><span>当前输出</span><span>BCE</span></div>
          {ALL_CLASS_IDS.map((classId, index) => {
            const target = trainingDemoTargets[index];
            const output = trainingDemoOutputs[index];
            const source = index < OLD_CLASS_IDS.length ? "Q 软目标" : "类别硬标签";
            return <div className="p9-training-row" role="row" key={classId} style={classAccent(classId)} data-target-source={source} data-node={classId}>
              <b><i>{CLASS_VISUALS[classId].glyph}</i>{CLASS_VISUALS[classId].outputNodeLabel}</b>
              <span>{target.toFixed(3)}<small>{source}</small></span>
              <span>{output.toFixed(3)}</span>
              <span>{binaryCrossEntropy(target, output).toFixed(3)}</span>
            </div>;
          })}
        </div>
        <small className="p9-training-fixture-note">固定教学数据用于说明目标与 BCE 对齐，不代表真实训练日志或优化器轨迹。</small>
      </div>
      <section className="p9-theta-transition" data-theta-state={scene.theta}>
        <div><span>Θ_before</span><i aria-hidden="true">→</i><b>{isComplete ? "Θ_after 已提交" : updating ? "共享参数更新中" : "等待更新"}</b></div>
        <div className="p9-symbolic-progress" role="progressbar" aria-label="符号化参数更新步骤，非损失曲线" aria-valuemin={0} aria-valuemax={100} aria-valuenow={updating ? Math.round(scene.progress * 100) : isComplete ? 100 : 0}>
          <i style={{ width: (updating ? scene.progress : isComplete ? 1 : 0) * 100 + "%" }} />
        </div>
        <small>Θ_after 只在本片段结束时提交 · P_before 在训练期间不变</small>
      </section>
    </div>
  );
}

function MemoryConstructionScene({ scene }: { scene: RuntimeScene }) {
  const selectedFor = (classId: IncomingClassId) => {
    const count = classId === "D" ? Math.min(NEXT_QUOTA, scene.newExemplarsSelected)
      : classId === "E" ? Math.min(NEXT_QUOTA, Math.max(0, scene.newExemplarsSelected - NEXT_QUOTA))
        : Math.min(NEXT_QUOTA, Math.max(0, scene.newExemplarsSelected - NEXT_QUOTA * 2));
    return NEW_CLASS_HERDING[classId].ordered.slice(0, count);
  };
  const selectedIds = INCOMING_CLASS_IDS.flatMap((classId) => selectedFor(classId).map((sample) => sample.id));
  return (
    <div className="p9-memory-scene" data-clip={scene.clip.id} data-progress={scene.progress.toFixed(2)} data-memory-count={scene.committedMemoryCount} data-selected-ids={selectedIds.join(" ")}>
      <div className="p9-memory-scene-summary">
        <div><span className="p9-eyebrow">固定图片预算</span><strong>K = {MEMORY_BUDGET}</strong><small>旧类前缀 {scene.oldMemoryRetained} + 新类入选 {scene.newExemplarsSelected}</small></div>
        <div className="p9-memory-meter" role="progressbar" aria-label="P9 持久记忆槽位占用" aria-valuemin={0} aria-valuemax={MEMORY_BUDGET} aria-valuenow={scene.committedMemoryCount}><span style={{ width: `${(scene.committedMemoryCount / MEMORY_BUDGET) * 100}%` }} /></div>
        <b>{scene.committedMemoryCount} / {MEMORY_BUDGET}</b>
      </div>
      <section className="p9-memory-candidates">
        <header><span className="p9-eyebrow">新类完整候选集 · 当前 φ_after 的 Herding 顺序</span><b>只显示本类六张真实样本</b></header>
        {INCOMING_CLASS_IDS.map((classId) => {
          const ordered = NEW_CLASS_HERDING[classId].ordered;
          const selected = selectedFor(classId);
          return <div className="p9-herding-class" key={classId} style={classAccent(classId)} data-class-id={classId} data-selected-ids={selected.map((sample) => sample.id).join(" ")}>
            <div className="p9-herding-heading"><b>{CLASS_VISUALS[classId].glyph} {CLASS_VISUALS[classId].displayLabel}</b><span>{selected.length}/{NEXT_QUOTA} 已入槽</span></div>
            <div className="p9-herding-candidates">{ordered.map((sample, index) => {
              const rank = selected.findIndex((entry) => entry.id === sample.id);
              return <span key={sample.id} className={"p9-herding-candidate" + (rank >= 0 ? " is-selected" : "")} data-sample-id={sample.id} data-herding-rank={rank >= 0 ? rank + 1 : ""}>
                <SampleToken sample={sample} role={rank >= 0 ? "selected" : "incoming"} order={rank >= 0 ? rank + 1 : undefined} compact />
                <small>{rank >= 0 ? `p${rank + 1} · 入选` : "候选"}</small>
              </span>;
            })}</div>
          </div>;
        })}
      </section>
      <footer className="p9-memory-rule"><b>旧类</b><span>按 P_before 原顺序只保留前缀；不重跑旧类 Herding。</span><i aria-hidden="true">·</i><b>新类</b><span>按各自运行时 Herding 顺序取 p₁、p₂。</span></footer>
      <p className="p9-memory-submit">{scene.memory === "after" ? "P_after 已提交：六类各两张，持久图片总数仍为 12。" : "名单确定后只提交一次 P_after；图片保持原始样本身份。"}</p>
    </div>
  );
}

function PrototypeRebuildScene({ scene }: { scene: RuntimeScene }) {
  const rebuilding = scene.clip.id === "form-prototypes";
  const isComplete = scene.clip.id === "form-prototypes" && scene.progress >= 1;
  const prototypeOpacity = rebuilding ? Math.max(0, Math.min(1, (scene.progress - 0.3) / 0.62)) : 0;
  return (
    <div className="p9-prototype-scene" data-clip={scene.clip.id} data-progress={scene.progress.toFixed(2)} data-prototype-ids={ALL_CLASS_IDS.map((classId) => P_AFTER[classId].map((sample) => sample.id).join(",")).join(" ")}>
      <div className="p9-prototype-inputs">
        <div><span className="p9-eyebrow">已提交的原始记忆</span><b>P_after · 12 张</b><small>样本图像 ID 保留；旧图与新图一并读取</small></div>
        <div className="p9-prototype-id-list">{CURRENT_EXEMPLARS.map((sample) => <span key={sample.id} style={classAccent(sample.classId)} data-exemplar-id={sample.id}>{CLASS_VISUALS[sample.classId].glyph} {sample.id}</span>)}</div>
        <span className="p9-reencode-arrow" aria-hidden="true">↓</span>
        <div className="p9-prototype-model"><b>φ<sub>Θ_after</sub></b><span>{scene.clip.id === "reencode-p-after" ? `重新编码中 · ${Math.round(scene.progress * 100)}%` : "归一化特征与类别均值"}</span></div>
      </div>
      <div className="p9-prototype-chart" style={{ "--p9-prototypes-opacity": prototypeOpacity } as CSSProperties} data-prototypes-visible={prototypeOpacity > 0 ? "true" : "false"}>
        <FeatureSpaceWorkbench
          mode="prototypes"
          title={isComplete ? "六个 P_after 原型已重建" : "以当前表示重编码 exemplar"}
          description="圆点表示归一化后的原始 exemplar 特征；方块位置来自 P9 共享 PROTOTYPES 运行时数据。固定端点用于表示状态对照，不是训练轨迹。"
          points={p9CurrentPoints}
          previousPoints={p9TrackedBeforePoints}
          motionProgress={scene.clip.id === "reencode-p-after" ? scene.progress : 1}
          unitCircle
          prototypes={rebuilding ? PROTOTYPES : []}
          showSampleLabels={false}
          focusableSamples={false}
        />
      </div>
      <div className="p9-prototype-identity" data-shared-prototype-ids={p9PrototypeData.map(({ classId }) => classId).join(" ")}>
        {p9PrototypeData.map(({ classId, point, sampleIds }) => <span key={classId} style={classAccent(classId)} data-prototype-class={classId} data-prototype-point={point.join(",")} data-exemplar-ids={sampleIds.join(" ")}>
          <b>{CLASS_VISUALS[classId].glyph} μ{CLASS_VISUALS[classId].index}</b><small>{sampleIds.join(" + ")}</small>
        </span>)}
      </div>
      <p className="p9-prototype-note">{isComplete ? "六类原型均由各自两张 P_after exemplar 的 φ_Θ_after 单位化特征均值构成。" : "同一 exemplar ID 重新编码；prototype 坐标只在 P_after 就绪后出现。"}</p>
    </div>
  );
}

function PredictionScene({ scene }: { scene: RuntimeScene }) {
  const comparisonCount = scene.comparisonProgress * QUERY_DISTANCES.length;
  const resultVisible = scene.nearestHighlightProgress > 0;
  return (
    <div className="p9-prediction-scene" data-clip={scene.clip.id} data-progress={scene.progress.toFixed(2)} data-query-progress={scene.queryProgress.toFixed(3)} data-comparison-progress={scene.comparisonProgress.toFixed(3)} data-prediction-class={resultVisible ? QUERY_PREDICTION : ""}>
      <div className="p9-prediction-route"><span>φ<sub>Θ_after</sub></span><i aria-hidden="true">→</i><b>P_after 原型</b><i aria-hidden="true">←</i><span>最近距离决定类别</span></div>
      <div className="p9-prediction-chart">
        <FeatureSpaceWorkbench
          mode="inference"
          title="Query 与六类当前 Prototype"
          description="同一 Query 到达固定教学坐标后，按共享运行时的真实距离顺序逐条连到六类 P_after 原型；连线仅表示特征空间欧氏距离。"
          points={p9CurrentPoints}
          prototypes={P9_COMPARISON_PROTOTYPES}
          query={QUERY_FEATURE}
          queryLabelOffset={{ dx: -14, dy: 28, anchor: "end" }}
          queryRevealProgress={scene.queryProgress}
          comparisonProgress={scene.comparisonProgress}
          completedComparisonOpacity={0.68}
          nearestHighlightProgress={scene.nearestHighlightProgress}
          unitCircle
          markerScale={0.82}
          showSampleLabels={false}
          focusableSamples={false}
          asideContent={<>
            <div className="p9-distance-list" aria-label="Query 到六类原型的共享运行时距离">
              {QUERY_DISTANCES.map((entry, index) => {
                const amount = Math.max(0, Math.min(1, comparisonCount - index));
                const state = amount >= 1 ? "complete" : amount > 0 ? "active" : "pending";
                return <div className={`p9-distance-row p9-distance-row--${state}${resultVisible && entry.classId === QUERY_PREDICTION ? " is-nearest" : ""}`} key={entry.classId} data-comparison-rank={index + 1} data-prototype-class-id={entry.classId} data-distance={entry.distance.toFixed(6)} data-reveal-progress={amount.toFixed(3)} style={classAccent(entry.classId)}>
                  <span>{index + 1}</span><b><i>{CLASS_VISUALS[entry.classId].glyph}</i>{CLASS_VISUALS[entry.classId].displayLabel}</b><strong>{state === "pending" ? "—" : entry.distance.toFixed(3)}</strong><small>{state === "complete" ? "已比较" : state === "active" ? "正在比较" : "等待"}</small>
                </div>;
              })}
            </div>
            {resultVisible ? <div className="p9-prediction-result" data-result-class={QUERY_PREDICTION} style={{ opacity: scene.nearestHighlightProgress }}><span>最近原型</span><b style={classAccent(QUERY_PREDICTION)}><i>{CLASS_VISUALS[QUERY_PREDICTION].glyph}</i>{CLASS_VISUALS[QUERY_PREDICTION].displayLabel}</b><small>真实最小距离 · {QUERY_DISTANCES[0].distance.toFixed(3)}</small></div> : <p className="p9-prediction-pending">{scene.clip.id === "query-arrives" ? "Query 正在进入当前特征空间；尚未开始比较。" : `${Math.min(QUERY_DISTANCES.length, Math.floor(comparisonCount))} / ${QUERY_DISTANCES.length} 个距离已完成。`}</p>}
            <p className="p9-prediction-note">训练 head 保留在模型中，但本次分类不读取它的 argmax。</p>
          </>}
        />
      </div>
    </div>
  );
}

function HandoffScene({ scene }: { scene: RuntimeScene }) {
  const predictionOpacity = Math.max(0, 1 - scene.progress);
  const nextBatchOpacity = Math.max(0, Math.min(1, (scene.progress - 0.35) / 0.45));
  const releasedItems = ["D", "Q", "targets", "loss"] as const;
  return (
    <div className="p9-handoff-scene" data-clip={scene.clip.id} data-progress={scene.progress.toFixed(2)} data-next-state="S_r+1">
      <div className="p9-handoff-equation"><span>Sᵣ</span><i aria-hidden="true">→</i><strong>Sᵣ₊₁ = Θ_after + P_after</strong></div>
      <div className="p9-handoff-persistent">
        <section><span className="p9-eyebrow">持续保留 · 模型参数与训练 head</span><b>Θ_after</b><small>共享特征提取器和训练 head 都在模型中</small></section>
        <section><span className="p9-eyebrow">持续保留 · 原始图片记忆</span><b>P_after · 12 / 12</b><small>六类各两张，可在下一轮重新编码</small></section>
      </div>
      <div className="p9-handoff-released" aria-label="本轮临时对象已释放">
        <span className="p9-eyebrow">本轮计算对象已退出</span>
        {releasedItems.map((id) => <span key={id} className="p9-handoff-object" data-released-object={id}>{id} · 已释放</span>)}
        <span className="p9-handoff-object" data-released-object="X_new">X_new · 选样完成后已释放</span>
      </div>
      <div className="p9-handoff-prediction" style={{ opacity: predictionOpacity }} data-prediction-class={QUERY_PREDICTION}>
        <span>本轮 Query 结果</span><b style={classAccent(QUERY_PREDICTION)}><i>{CLASS_VISUALS[QUERY_PREDICTION].glyph}</i>{CLASS_VISUALS[QUERY_PREDICTION].displayLabel}</b><small>当前预测是本轮派生结果，不进入下一轮持久状态</small>
      </div>
      <div className="p9-handoff-next" style={{ opacity: nextBatchOpacity }} data-next-batch-only="true"><b>X_next</b><span>下一批入口提示 · 不播放假想的下一轮训练</span></div>
      <p className="p9-handoff-caption">本轮结束后，只有 Θ_after 与 P_after 进入下一轮；训练样本、冻结响应、目标、损失和单次预测都已完成职责。</p>
    </div>
  );
}

function IncomingBatch() {
  return (
    <div className="p9-incoming-batch" data-canonical-id="incoming_class_batch">
      <div className="p9-incoming-total"><strong>X_new</strong><span>3 类 × 6 张 = 18 张完整新图</span></div>
      <div className="p9-incoming-classes">
        {INCOMING_CLASS_IDS.map((classId) => {
          const representatives = samplesForClass(classId).slice(0, 2);
          return (
            <section className="p9-incoming-class" key={classId} style={classAccent(classId)}>
              <header><b>{CLASS_VISUALS[classId].glyph} {CLASS_VISUALS[classId].displayLabel}</b><span>6 张</span></header>
              <div>{representatives.map((sample) => <SampleToken key={sample.id} sample={sample} role="incoming" compact />)}<small>另 4 张</small></div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function MergeScene({ scene }: { scene: RuntimeScene }) {
  const oldFlightStyle = {
    left: (12 + scene.progress * 57) + "%",
    top: (29 + scene.progress * 14) + "%",
  } as CSSProperties;
  const newFlightStyle = {
    left: (12 + scene.progress * 57) + "%",
    top: (69 - scene.progress * 18) + "%",
  } as CSSProperties;
  const targetSamples = [P_BEFORE.A[0], P_BEFORE.B[0], P_BEFORE.C[0], ...INCOMING_CLASS_IDS.map((classId) => samplesForClass(classId)[0])];
  return (
    <div className="p9-merge-scene" data-clip={scene.clip.id} data-progress={scene.progress.toFixed(2)} data-d-count={scene.dSampleCount ?? 0}>
      <div className="p9-merge-equation">
        <span><b>{scene.oldCopiesInD}</b> / 12 旧图副本</span><i>+</i>
        <span><b>{scene.incomingSamplesInD}</b> / 18 新图</span><i>=</i>
        <strong>D <b>{scene.dSampleCount ?? 0}</b> / {TRAINING_SET_SIZE}</strong>
      </div>
      <div className="p9-merge-canvas">
        <div className="p9-merge-sources">
          <div className="p9-source-card">
            <span className="p9-eyebrow">来源 1 · P_before 副本</span>
            <strong>12 张已存旧图</strong>
            <div className="p9-source-tokens">
              {OLD_CLASS_IDS.map((classId) => <span key={classId} style={classAccent(classId)}>{CLASS_VISUALS[classId].glyph} {P_BEFORE[classId][0].id}</span>)}
            </div>
            <small>左侧原件仍留在 P</small>
          </div>
          <div className="p9-source-card p9-source-card--incoming">
            <span className="p9-eyebrow">来源 2 · X_new</span>
            <strong>D / E / F · 18 张完整图片</strong>
            <div className="p9-source-tokens">
              {INCOMING_CLASS_IDS.map((classId) => <span key={classId} style={classAccent(classId)}>{CLASS_VISUALS[classId].glyph} {samplesForClass(classId)[0].id}</span>)}
            </div>
            <small>每类六张，本轮均可用</small>
          </div>
        </div>
        <div className="p9-merge-routes" aria-hidden="true"><i /><i /></div>
        <span className="p9-flight-token p9-flight-token--old" style={oldFlightStyle} data-sample-id={oldDemoSample.id} data-token-copy="true">
          <SampleToken sample={oldDemoSample} role="exemplar" compact /><small>副本</small>
        </span>
        <span className="p9-flight-token p9-flight-token--new" style={newFlightStyle} data-sample-id={newDemoSample.id} data-token-copy="true">
          <SampleToken sample={newDemoSample} role="incoming" compact />
        </span>
        <div className="p9-d-target" id="training_set_D" data-canonical-id="training_set_D">
          <span className="p9-eyebrow">本轮训练集</span>
          <strong>D</strong>
          <b>{scene.dSampleCount ?? 0} / 30</b>
          <div className="p9-d-examples">{targetSamples.map((sample, index) => <span key={sample.id} className={index < 3 ? "is-copy" : "is-new"} data-sample-id={sample.id}>{sample.id}</span>)}</div>
          <small>显示代表 ID · 总数按真实 D 样本同步</small>
        </div>
      </div>
      <footer className="p9-scene-proof">
        <b>副本关系</b><span data-original-sample-id={oldDemoSample.id}>P 原件 {oldDemoSample.id} 仍在左侧</span><i aria-hidden="true">→</i><span data-copy-sample-id={oldDemoSample.id}>D 中为同 ID 训练副本</span>
      </footer>
    </div>
  );
}

function QValue({ value, progress, column }: { value: number; progress: number; column: number }) {
  const cellStyle = { "--q-fill": (progress * 100) + "%" } as CSSProperties;
  return (
    <span className={"p9-q-cell" + (progress > 0 ? " is-writing" : "")} data-q-column={column + 1} data-progress={progress.toFixed(3)} data-q-value={value.toFixed(6)} style={cellStyle}>
      <i aria-hidden="true" /><b>{progress >= 1 ? value.toFixed(3) : progress > 0 ? value.toFixed(3) : "—"}</b>
    </span>
  );
}

function QTableRow({ sample, active = false, cellProgress = [] }: { sample: Sample; active?: boolean; cellProgress?: readonly number[] }) {
  const values = teacherSnapshotFor(sample);
  return (
    <div className={"p9-q-row" + (active ? " is-active" : "")} role="row" data-q-row={sample.id} data-sample-id={sample.id} style={classAccent(sample.classId)}>
      <b role="rowheader"><span>{CLASS_VISUALS[sample.classId].glyph}</span>{sample.id}</b>
      {values.map((value, column) => <QValue key={column} value={value} progress={active ? cellProgress[column] ?? 0 : 1} column={column} />)}
    </div>
  );
}

function SnapshotScene({ scene }: { scene: RuntimeScene }) {
  const sample = scene.activeQSampleId
    ? INCREMENTAL_STAGE_DATA.trainingSamples.find((entry) => entry.id === scene.activeQSampleId) ?? null
    : null;
  const qRows = demoQSamples.filter((entry, index) => scene.qRowsWritten >= index + 1);
  const visibleRows = [...qRows];
  if (sample && !visibleRows.some((entry) => entry.id === sample.id)) visibleRows.push(sample);
  const routeProgress = scene.progress <= 0.43
    ? scene.progress / 0.43
    : 1 + (scene.progress - 0.43) / 0.57;
  const flightStyle = { left: (6 + Math.min(1, routeProgress) * 84) + "%", top: "78%" } as CSSProperties;
  const cells = sample ? scene.activeQCellProgress : [];
  const notShownCount = Math.max(0, scene.qRowsWritten - qRows.length - (sample ? 1 : 0));
  return (
    <div className="p9-snapshot-scene" data-clip={scene.clip.id} data-progress={scene.progress.toFixed(2)} data-q-rows={scene.qRowsWritten} data-active-sample-id={sample?.id ?? ""}>
      <div className="p9-snapshot-heading">
        <span><b>Q</b> · 旧节点响应快照</span><strong>{scene.qRowsWritten} / 30 行 · 3 列</strong>
      </div>
      <div className="p9-q-route">
        <section className="p9-route-node p9-route-node--data" id="training_set_D" data-canonical-id="training_set_D">
          <span className="p9-eyebrow">D · 当前样本</span>
          <strong>30 个训练 ID</strong>
          {sample ? <SampleToken sample={sample} role={sample.classId === "A" || sample.classId === "B" || sample.classId === "C" ? "exemplar" : "incoming"} compact /> : <small>同一张图依序传入教师网络</small>}
        </section>
        <section className="p9-route-node p9-route-node--teacher" id="old_teacher" data-canonical-id="old_teacher">
          <span className="p9-eyebrow">Θ_before · 旧教师</span>
          <strong>旧类别节点</strong>
          <div className="p9-teacher-nodes">
            {OLD_CLASS_IDS.map((classId) => <span key={classId} style={classAccent(classId)}>{CLASS_VISUALS[classId].glyph}<small>g{CLASS_VISUALS[classId].index}</small></span>)}
          </div>
          <small>冻结快照来源 · 参数尚未更新</small>
        </section>
        <section className="p9-route-node p9-route-node--q" id="response_snapshot_Q" data-canonical-id="response_snapshot_Q">
          <span className="p9-eyebrow">目标矩阵</span>
          <strong>Q · 30 × 3</strong>
          <div className="p9-q-table" role="table" aria-label="Q 响应快照示例行">
            <div className="p9-q-header" role="row"><b role="columnheader">sample ID</b><span role="columnheader">g₁</span><span role="columnheader">g₂</span><span role="columnheader">g₃</span></div>
            {visibleRows.map((entry) => <QTableRow key={entry.id} sample={entry} active={entry.id === sample?.id} cellProgress={entry.id === sample?.id ? cells : []} />)}
            {notShownCount > 0 ? <div className="p9-q-more" role="row">+ {notShownCount} 行已写入各自的 ID</div> : null}
          </div>
          <small className="p9-q-freeze">{scene.qRowsWritten === 30 ? "30 行完成 · Q 保持冻结" : "每个 sample ID 对应一行"}</small>
        </section>
        <div className="p9-q-route-line" aria-hidden="true"><i /></div>
        {sample ? <span className="p9-q-flight" style={flightStyle} data-sample-id={sample.id} aria-hidden="true"><b style={classAccent(sample.classId)}>{CLASS_VISUALS[sample.classId].glyph}</b><small>{sample.id}</small></span> : null}
      </div>
      <div className="p9-q-identity">
        <span>当前流动 ID</span><strong>{sample?.id ?? (scene.qRowsWritten === 30 ? "30 个 ID 已完成" : "等待下一张样本")}</strong>
        <i aria-hidden="true">=</i><span>当前 Q 行</span><strong data-q-current-id={sample?.id ?? ""}>{sample?.id ?? "Q: 30 × 3"}</strong>
      </div>
      <p className="p9-q-explanation">旧样本和新样本都读取 Θ_before 的三个旧输出；Q 的行身份与 D 中的 sample ID 一一对应。</p>
    </div>
  );
}

function InheritedScene() {
  return (
    <div className="p9-inherited-scene" data-clip="inherit-state">
      <span className="p9-state-equation">Sᵣ = Θ_before + P_before</span>
      <h3>这一轮开始前，系统只保留两类持久对象</h3>
      <div className="p9-inherited-objects"><span>Θ_before<small>共享模型参数</small></span><i aria-hidden="true">+</i><span>P_before<small>12 张有序原始图片</small></span></div>
      <p>还没有新批次、D 或 Q。接下来让新类别到达，并保留旧图片的原始身份。</p>
    </div>
  );
}

function ArrivalScene() {
  return (
    <div className="p9-arrival-scene" data-clip="receive-new-batch">
      <span className="p9-state-equation">X_new · 18 张完整新图</span>
      <h3>三类完整图像进入本轮</h3>
      <IncomingBatch />
      <p>每类六张。后续将它们与旧记忆的训练副本放进同一个 D。</p>
    </div>
  );
}

function Guidance({ scene }: { scene: RuntimeScene }) {
  const chapter = RUNTIME_CHAPTERS[scene.chapterIndex];
  const result = scene.clip.id === "merge-training-set"
    ? (scene.dSampleCount ?? 0) + " / 30 个样本已汇入 D"
    : scene.chapterId === "snapshot-q"
      ? scene.qRowsWritten + " / 30 行 Q 已写入"
      : scene.chapterId === "inherited"
        ? "Θ_before 与 P_before 保持固定"
        : scene.chapterId === "train-update"
          ? scene.theta === "after" ? "Θ_after 已提交 · P_before 仍为 12 张" : "目标与六节点 BCE 已对齐 · 等待参数提交"
          : scene.chapterId === "manage-memory"
            ? `${scene.committedMemoryCount} / ${MEMORY_BUDGET} 个图片槽位 · ${scene.newExemplarsSelected} 张新类已选`
            : scene.chapterId === "rebuild-prototypes"
              ? `${PROTOTYPES.length} 个共享运行时原型 · P_after 身份不变`
              : scene.chapterId === "predict"
                ? scene.nearestHighlightProgress > 0
                  ? `最近原型：${CLASS_VISUALS[QUERY_PREDICTION].displayLabel} · 距离 ${QUERY_DISTANCES[0].distance.toFixed(3)}`
                  : `${Math.floor(scene.comparisonProgress * QUERY_DISTANCES.length)} / ${QUERY_DISTANCES.length} 个真实距离已比较`
                : scene.chapterId === "handoff"
                  ? "下一轮起点 = Θ_after + P_after"
                  : "X_new = 18 张图像已到达";
  const known = scene.chapterId === "manage-memory"
    ? "P_before 的旧类列表有序；新类各有六张完整候选，K 固定为 12。"
    : scene.chapterId === "rebuild-prototypes"
      ? "P_after 已固定；类别原型必须使用当前 φ_Θ_after 重新编码。"
      : scene.chapterId === "predict"
        ? "P_after 原型与 Query 来自共享运行时；六条比较按真实距离排序并逐条保留。"
        : scene.chapterId === "handoff"
          ? "Θ_after 与已提交的 P_after 是仅有的下一轮持久起点。"
      : scene.chapterId === "train-update"
        ? "Q 已冻结；旧节点读取匹配 ID 的软目标，新节点读取真实类别硬标签。"
        : scene.chapterId === "inherited" ? "上一轮留下 Θ_before 和 P_before。" : "旧记忆原件仍在固定位置，D/Q 都是本轮临时对象。";
  const next = scene.chapterId === "manage-memory"
    ? "六类名单确认后，集中提交 P_after，再进入重编码。"
    : scene.chapterId === "rebuild-prototypes"
      ? "只在记忆名单确定后生成原型；随后才接入 Query。"
      : scene.chapterId === "predict"
        ? "最后突出真实 argmin；训练 head 保留在模型中，但不参与本次分类。"
        : scene.chapterId === "handoff"
          ? "X_next 只作为下一批入口提示；停在可读的最终状态，不模拟下一轮训练。"
      : scene.chapterId === "train-update"
        ? "这段只显示教学目标与符号化参数提交，不绘制虚构的 loss 或优化器轨迹。"
        : scene.chapterId === "snapshot-q" ? "Q 写完后会冻结，训练阶段再读取它。" : "继续播放或逐片段前进，可以暂停查看中间态。";
  return (
    <aside className="p9-guidance" aria-labelledby="p9-guidance-title">
      <span className="p9-eyebrow">当前步骤 · 第 {scene.chapterIndex + 1} 章 / 8</span>
      <h2 id="p9-guidance-title">{chapter.question}</h2>
      <div className="p9-guide-block"><small>已知</small><p>{known}</p></div>
      <div className="p9-guide-block p9-guide-block--current"><small>正在发生</small><p>{scene.clip.narrative}</p></div>
      <div className="p9-result-card"><small>当前结果</small><strong>{result}</strong></div>
      <p className="p9-guide-next">{next}</p>
    </aside>
  );
}

function ObjectStatusBand({ scene }: { scene: RuntimeScene }) {
  const objectIds: readonly RuntimeObjectId[] = ["X_new", "D", "Q", "targets", "loss", "prototypes", "query", "prediction"];
  const visible = objectIds.filter((id) => scene.objectStatus[id] !== "pending");
  return (
    <section className="p9-object-band" aria-label="持久与临时对象状态">
        <div className="p9-object-band__persistent"><span className="p9-eyebrow">{scene.memory === "building" || scene.memory === "truncating" ? "当前状态 / 记忆候选" : "持久"}</span><b>Θ_{scene.theta}</b><i aria-hidden="true">+</i><b>{scene.memory === "after" ? "P_after · 12 / 12" : scene.memory === "before" ? "P_before · 12 / 12" : `P_after 构建中 · ${scene.committedMemoryCount} / ${MEMORY_BUDGET}`}</b></div>
      <div className="p9-object-band__temporary">
        <span className="p9-eyebrow">本轮暂存与释放</span>
        {visible.length === 0 ? <span className="p9-empty-state">尚未创建临时对象</span> : visible.map((id) => {
          const label = id === "X_new" ? "X_new · 18 张" : id === "D" ? "D · " + (scene.dSampleCount ?? 0) + " / 30" : id === "Q" ? "Q · " + scene.qRowsWritten + " / 30 行" : id;
          const status = scene.objectStatus[id];
          return <span key={id} className={"p9-object-pill p9-object-pill--" + status} data-object-id={id} data-status={status}>{label}{status === "released" ? " · 已释放" : ""}</span>;
        })}
      </div>
    </section>
  );
}

export function PageNine({ onExit }: { onExit: () => void }) {
  const reducedMotion = useReducedMotion();
  const timeline = useAnimationTimeline({ clips: RUNTIME_CLIPS, reducedMotion, autoPlay: false });
  const pause = timeline.controls.pause;
  const scene = runtimeSceneAt(timeline.state.clipIndex, timeline.state.progress);
  const replayBoundary = useRef<RuntimeChapterId | null>(null);
  const progressPercent = ((timeline.state.clipIndex + timeline.state.progress) / RUNTIME_CLIPS.length) * 100;
  useEffect(() => {
    if (replayBoundary.current && replayBoundary.current !== scene.chapterId) {
      replayBoundary.current = null;
      pause();
    }
  }, [scene.chapterId, pause]);

  const currentChapter = RUNTIME_CHAPTERS[scene.chapterIndex];
  const isMerge = scene.clip.id === "merge-training-set";
  const isSnapshot = scene.chapterId === "snapshot-q";
  const isTraining = scene.chapterId === "train-update";
  const isMemory = scene.chapterId === "manage-memory";
  const isPrototype = scene.chapterId === "rebuild-prototypes";
  const handleChapterSelect = (chapterId: RuntimeChapterId) => {
    replayBoundary.current = null;
    timeline.controls.goToClip(RUNTIME_CHAPTER_FIRST_CLIP[chapterId], { autoPlay: false });
  };
  const replayChapter = () => {
    replayBoundary.current = currentChapter.id;
    timeline.controls.goToClip(RUNTIME_CHAPTER_FIRST_CLIP[currentChapter.id]);
  };

  return (
    <article className="p9-page" id="runtime_workbench" data-canonical-id="runtime_workbench" data-clip={scene.clip.id} data-chapter={scene.chapterId} data-progress={scene.progress.toFixed(2)} aria-labelledby="page-nine-title">
      <header className="p9-header">
        <div className="p9-title-block">
          <div className="p9-kicker"><span>第 9 页</span><i /> iCaRL · 一次增量更新</div>
          <h1 id="page-nine-title">从当前状态到下一轮就绪</h1>
          <p>前面各页已解释选样、Replay、Q、BCE 和 Prototype。现在只追踪新类别怎样把 Θ_before + P_before 变成下一轮可用状态。</p>
        </div>
        <div className="p9-controls" aria-label="全流程播放控制">
          <button type="button" className="p9-return" onClick={onExit}>← 第 8 页 · 实验与边界</button>
          <div className="p9-transport">
            <button type="button" onClick={timeline.controls.stepBack} disabled={!timeline.state.hasPrevious} aria-label="上一个片段">‹</button>
            <button type="button" className="p9-play" onClick={timeline.controls.toggle} aria-label={reducedMotion ? "前进一步" : timeline.state.status === "playing" ? "暂停动画" : "播放完整过程"}>{reducedMotion ? "→" : timeline.state.status === "playing" ? "Ⅱ" : "▶"}</button>
            {!reducedMotion ? <button type="button" onClick={replayChapter} aria-label="重播当前章节" title="重播当前章节">↺</button> : null}
            <button type="button" onClick={timeline.controls.stepForward} disabled={!timeline.state.hasNext} aria-label="下一个片段">›</button>
          </div>
          <div className="p9-playback-meter" role="progressbar" aria-label="全流程进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPercent)}>
            <i style={{ width: progressPercent + "%" }} />
          </div>
          <b className="p9-playback-count">片段 {String(timeline.state.clipIndex + 1).padStart(2, "0")} / {RUNTIME_CLIPS.length}</b>
        </div>
      </header>

      <nav className="p9-chapters" aria-label="P9 八个章节">
        {RUNTIME_CHAPTERS.map((chapter, index) => {
          const current = chapter.id === scene.chapterId;
          return (
            <button key={chapter.id} type="button" className={"p9-chapter" + (current ? " is-current" : "") + (index < scene.chapterIndex ? " is-complete" : "")} aria-current={current ? "step" : undefined} title={chapter.question} onClick={() => handleChapterSelect(chapter.id)}>
              <span>{String(index + 1).padStart(2, "0")}</span><b>{chapter.title}</b>
            </button>
          );
        })}
      </nav>

      <div className="p9-main-grid">
        <PersistentState scene={scene} />

        <section className="p9-workbench" aria-label="P9 连续状态工作台">
          <header className="p9-workbench-heading">
            <div><span className="p9-eyebrow">中央工作台 · 当前焦点</span><h2>{scene.clip.narrative}</h2></div>
            <span className="p9-clip-progress">{Math.round(scene.progress * 100)}%</span>
          </header>
          <div className="p9-workbench-canvas" data-focus={scene.focus}>
            {scene.chapterId === "inherited" ? <InheritedScene /> : null}
            {scene.clip.id === "receive-new-batch" ? <ArrivalScene /> : null}
            {isMerge ? <MergeScene scene={scene} /> : null}
            {isSnapshot ? <SnapshotScene scene={scene} /> : null}
            {isTraining ? <TrainingBridgeScene scene={scene} /> : null}
            {isMemory ? <MemoryConstructionScene scene={scene} /> : null}
            {isPrototype ? <PrototypeRebuildScene scene={scene} /> : null}
            {scene.chapterId === "predict" ? <PredictionScene scene={scene} /> : null}
            {scene.chapterId === "handoff" ? <HandoffScene scene={scene} /> : null}
          </div>
          <footer className="p9-workbench-controls">
            <button type="button" onClick={timeline.controls.stepBack} disabled={!timeline.state.hasPrevious}>上一个片段</button>
            <span>{scene.clip.narrative}</span>
            <button type="button" onClick={timeline.controls.stepForward} disabled={!timeline.state.hasNext}>下一个片段</button>
          </footer>
        </section>

        <Guidance scene={scene} />
      </div>

      <ObjectStatusBand scene={scene} />
    </article>
  );
}
