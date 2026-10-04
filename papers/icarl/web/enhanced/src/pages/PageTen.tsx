import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FeatureSpaceWorkbench, type FeatureSpaceMode } from "../components/FeatureSpaceWorkbench";
import { SampleToken } from "../components/SampleToken";
import { PaperTerm } from "../components/PaperTerm";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";
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
  OLD_NODE_COUNT,
  type ClassId,
} from "../data/icarl-runtime";

const runtimeSteps = [
  { title: "当前状态", description: "本轮开始时只有上一轮持久对象 Θ_before 与有序 exemplar 记忆 P_before；下一批数据尚未到达。" },
  { title: "新类别完整到达", description: "新类别 Class 4 的整批图像组成 X_new；训练输出层追加对应节点，旧类别节点继续保留。" },
  { title: "构造训练集 D", description: "把旧记忆中的 exemplar 与新类的全部图像合并，形成这轮更新的训练集。" },
  { title: "保存响应快照 Q", description: "在参数更新前，记录 D 中样本对旧类别节点的响应，供旧类别蒸馏目标使用。" },
  { title: "只更新模型参数 Θ", description: "旧节点使用 Q 中的软目标，新节点使用新类别标签；本阶段更新 Θ，P 仍保持原样。" },
  { title: "按新配额截短旧记忆", description: "类别总数变为 4，每类配额 m = floor(K / 4) = 3；旧列表保留原有顺序的前三项。" },
  { title: "开始为新类执行 Herding", description: "使用更新后的特征映射和 X_new 的完整样本集合；现在还没有样本入选。" },
  { title: "Herding 选出 p₁", description: "选出第一个 exemplar；右侧 P₄ 候选列表和 prefix mean 同步更新。" },
  { title: "Herding 选出 p₂", description: "在 p₁ 的基础上评估下一个 prefix，选出 p₂ 并同步更新 P₄ 与 prefix mean。" },
  { title: "Herding 选出 p₃", description: "再评估一次 prefix，选出 p₃；新类 exemplar 顺序现在完整。" },
  { title: "提交新的持久状态", description: "将 Θ_after 与四个类别各 3 个 exemplar 合并为下一轮的 Θ_after + P_after。" },
  { title: "计算当前类别均值", description: "用当前特征映射重新编码 P_after，并为每个类别计算归一化 exemplar 均值。" },
  { title: "最近均值规则完成预测", description: "编码查询样本并与全部类别均值比较，最小距离对应最终类别；这一步不取 sigmoid 最大值。" },
  { title: "继续类别流", description: "Θ_after + P_after 成为下一轮当前状态；新的 X_next 只作为入口提示，本页不重复运行下一轮。" },
];

const runtimePhases = [
  { id: "CURRENT", title: "当前状态" },
  { id: "ARRIVE", title: "到达" },
  { id: "PREPARE", title: "准备" },
  { id: "SNAPSHOT", title: "快照" },
  { id: "TRAIN", title: "训练" },
  { id: "MEMORY", title: "记忆" },
  { id: "READY", title: "就绪" },
  { id: "PREDICT", title: "预测" },
  { id: "CONTINUE", title: "继续" },
] as const;

type PhaseId = (typeof runtimePhases)[number]["id"];

function phaseAt(stepIndex: number): PhaseId {
  if (stepIndex === 0) return "CURRENT";
  if (stepIndex === 1) return "ARRIVE";
  if (stepIndex === 2) return "PREPARE";
  if (stepIndex === 3) return "SNAPSHOT";
  if (stepIndex === 4) return "TRAIN";
  if (stepIndex >= 5 && stepIndex <= 9) return "MEMORY";
  if (stepIndex === 10) return "READY";
  if (stepIndex === 11 || stepIndex === 12) return "PREDICT";
  return "CONTINUE";
}

const phaseEntryStep: Record<(typeof runtimePhases)[number]["id"], number> = {
  CURRENT: 0,
  ARRIVE: 1,
  PREPARE: 2,
  SNAPSHOT: 3,
  TRAIN: 4,
  MEMORY: 5,
  READY: 10,
  PREDICT: 11,
  CONTINUE: 13,
};

function durationForStep(stepIndex: number) {
  return stepIndex >= 6 && stepIndex <= 9 ? 2450 : 2050;
}

function durationForPhase(phaseIndex: number) {
  const phase = runtimePhases[phaseIndex];
  const nextPhase = runtimePhases[phaseIndex + 1];
  if (!phase || !nextPhase) return 0;
  const startStep = phaseEntryStep[phase.id];
  const endStep = phaseEntryStep[nextPhase.id];
  let duration = 0;
  for (let step = startStep; step < endStep; step += 1) duration += durationForStep(step);
  return duration;
}

function phaseOffsetAtStep(stepIndex: number) {
  const phase = phaseAt(stepIndex);
  let elapsed = 0;
  for (let step = phaseEntryStep[phase]; step < stepIndex; step += 1) elapsed += durationForStep(step);
  return elapsed;
}

function RuntimeTimeline({ stepIndex, journeyDurationMs, animationRevision, initialOffsetMs, isPlaying, onSelect }: {
  stepIndex: number;
  journeyDurationMs: number;
  animationRevision: number;
  initialOffsetMs: number;
  isPlaying: boolean;
  onSelect: (step: number) => void;
}) {
  const activePhase = phaseAt(stepIndex);
  const activeIndex = runtimePhases.findIndex((phase) => phase.id === activePhase);
  const movesToNextPhase = activeIndex < runtimePhases.length - 1;
  const nextIndex = movesToNextPhase ? activeIndex + 1 : activeIndex;
  const stageCenter = (index: number) => 1.5 + (97 * (index + 0.5)) / runtimePhases.length;
  const completedStyle = {
    "--timeline-start": `${stageCenter(0)}%`,
    "--timeline-width": `${stageCenter(activeIndex) - stageCenter(0)}%`,
  } as CSSProperties;
  const journeyStyle = {
    "--timeline-start": `${stageCenter(activeIndex)}%`,
    "--timeline-width": `${stageCenter(nextIndex) - stageCenter(activeIndex)}%`,
    "--timeline-duration": `${journeyDurationMs}ms`,
    "--timeline-delay": `${-Math.min(journeyDurationMs, initialOffsetMs)}ms`,
  } as CSSProperties;
  return (
    <nav className="p10-timeline" aria-label="本轮运行阶段">
      {activeIndex > 0 ? <span className="p10-timeline__completed" style={completedStyle} aria-hidden="true" /> : null}
      {movesToNextPhase ? <span key={`${activePhase}-${animationRevision}`} className={`p10-timeline__journey ${isPlaying ? "is-playing" : "is-paused"}`} style={journeyStyle} aria-hidden="true" /> : null}
      {runtimePhases.map((phase, index) => {
        const current = phase.id === activePhase;
        const passed = index < activeIndex;
        return (
          <button key={phase.id} type="button" className={`p10-timeline__stage ${current ? "is-active" : ""} ${passed ? "is-past" : ""}`} aria-current={current ? "step" : undefined} title={`跳转到：${phase.title}`} onClick={() => onSelect(phaseEntryStep[phase.id])}>
            <span className="p10-timeline__node"><i /></span>
            <b>{phase.title}</b>
            <small>阶段 {String(index + 1).padStart(2, "0")}</small>
          </button>
        );
      })}
    </nav>
  );
}

function MemoryBucket({ classId, stepIndex, herdingRevealCount, stateCommitted }: { classId: ClassId; stepIndex: number; herdingRevealCount: number; stateCommitted: boolean }) {
  const visual = CLASS_VISUALS[classId];
  const isIncomingClass = classId === INCOMING_CLASS_ID;
  const oldListWasTruncated = stepIndex >= 5;
  const oldListStillVisible = stepIndex < 10;
  const current = isIncomingClass
    ? stateCommitted ? P_AFTER[classId] : P_AFTER[classId].slice(0, herdingRevealCount)
    : oldListWasTruncated ? P_AFTER[classId] : P_BEFORE[classId];
  const removed = !isIncomingClass && oldListWasTruncated && oldListStillVisible ? P_BEFORE_REMOVED[classId] : [];
  const waitingForHerding = isIncomingClass && !stateCommitted && herdingRevealCount === 0 && stepIndex >= 1;
  const beforeArrival = isIncomingClass && stepIndex < 1;

  return (
    <section className={`p10-memory-bucket ${isIncomingClass ? "is-new-class" : ""}`} title={`${visual.displayLabel} exemplar 列表，按 p₁、p₂、p₃ 的顺序保存`}>
      <div className="p10-memory-bucket__heading">
        <span className="p10-memory-bucket__glyph" style={{ color: visual.color }}>{visual.glyph}</span>
        <span><strong>P<sub>{visual.index}</sub></strong><small>{visual.displayLabel}</small></span>
        <em>{isIncomingClass ? "新类" : "旧类"}</em>
      </div>
      <div className="p10-memory-bucket__tokens">
        {current.map((sample, index) => <SampleToken key={sample.id} sample={sample} role={isIncomingClass ? "selected" : "exemplar"} order={index + 1} compact />)}
        {removed.map((sample) => <SampleToken key={`removed-${sample.id}`} sample={sample} role="removed" compact />)}
        {waitingForHerding ? <span className="p10-bucket-status">等待新类样本选择</span> : null}
        {beforeArrival ? <span className="p10-bucket-status">尚未建立</span> : null}
      </div>
      <small className="p10-memory-bucket__count">
        {isIncomingClass
          ? beforeArrival ? "未进入记忆" : stateCommitted ? `${current.length} 个已提交` : herdingRevealCount === 0 ? "完整 X_new 仍可用" : herdingRevealCount < NEXT_QUOTA ? `${herdingRevealCount} 个已入选，继续选择` : `${current.length} 个入选，待提交`
          : oldListWasTruncated ? `${current.length} 个保留${removed.length ? ` · ${removed.length} 个待释放` : ""}` : `${current.length} 个已保存`}
      </small>
    </section>
  );
}

type ObjectStatus = "pending" | "active" | "training" | "released";

function WorkspaceObject({ title, symbol, status, statusText, content, canonicalId }: {
  title: string;
  symbol: string;
  status: ObjectStatus;
  statusText: string;
  content: ReactNode;
  canonicalId?: string;
}) {
  return (
    <section className={`p10-object p10-object--${status}`} id={canonicalId} data-canonical-id={canonicalId}>
      <div className="p10-object__heading"><h3><span>{symbol}</span>{title}</h3><small>{statusText}</small></div>
      <div className="p10-object__content">{content}</div>
    </section>
  );
}

function ObjectLifetimeRail({ stepIndex }: { stepIndex: number }) {
  const rows = [
    { id: "persistent_model_state", label: "Θ · 模型参数", start: 0, end: 13, note: stepIndex < 4 ? "Θ_before · 持久" : "Θ_after · 持久" },
    { id: "persistent_memory_state", label: "P · exemplar 记忆", start: 0, end: 13, note: stepIndex < 5 ? "P_before · 持久" : stepIndex < 10 ? "列表更新中" : "P_after · 持久" },
    { id: "incoming_class_batch", label: "X_new · 新类全量数据", start: 1, end: 9, note: stepIndex < 1 ? "尚未到达" : stepIndex < 9 ? "Herding 完成前可用" : "已释放" },
    { id: "training_set_D", label: "D · 本轮训练集", start: 2, end: 4, note: stepIndex < 2 ? "尚未创建" : stepIndex < 5 ? "本轮临时对象" : "训练后释放" },
    { id: "response_snapshot_Q", label: "Q · 旧类响应快照", start: 3, end: 4, note: stepIndex < 3 ? "尚未快照" : stepIndex < 5 ? "用于蒸馏目标" : "训练后释放" },
    { id: "derived_inference_state", label: "μ · 均值与查询向量", start: 11, end: 12, note: stepIndex < 11 ? "尚未计算" : "仅用于当前预测" },
  ];
  return (
    <section className="panel p10-lifetime" id="object_lifetime" data-canonical-id="object_lifetime" aria-labelledby="p10-lifetime-title">
      <div className="p10-section-heading"><div><span className="p10-eyebrow">对象生命周期</span><h2 id="p10-lifetime-title">持久状态与本轮临时对象</h2></div><span className="p10-muted-hint">高亮范围 = 当前仍可用</span></div>
      <div className="p10-lifetime-rows">
        {rows.map((row) => {
          const active = stepIndex >= row.start && stepIndex <= row.end;
          const left = `${(row.start / (runtimeSteps.length - 1)) * 100}%`;
          const width = `${((row.end - row.start) / (runtimeSteps.length - 1)) * 100}%`;
          return (
            <div className={`p10-lifetime-row ${active ? "is-active" : ""}`} key={row.id}>
              <strong>{row.label}</strong>
              <div className="p10-lifetime-row__track"><span className={active ? "is-active" : ""} style={{ left, width }} /></div>
              <small>{row.note}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PageTen({ onExit }: { onExit: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const stepTimerRef = useRef<{ stepIndex: number; remainingMs: number } | null>(null);
  const [timelineAnimationRevision, setTimelineAnimationRevision] = useState(0);
  const [timelineSeed, setTimelineSeed] = useState<{ phaseId: PhaseId; offsetMs: number }>({ phaseId: "CURRENT", offsetMs: 0 });
  const reducedMotion = useReducedMotion();
  const herdingOrders = useMemo(() => new Map(NEW_CLASS_HERDING.ordered.map((sample, index) => [sample.id, index + 1])), []);
  const initialNewClassPoints = useMemo(() => projectSampleFeatures(INCOMING_SAMPLES, "before"), []);
  const updatedNewClassPoints = useMemo(() => projectSampleFeatures(INCOMING_SAMPLES, "after"), []);
  const herdingPoints = useMemo(() => projectSampleFeatures(INCOMING_SAMPLES, "after", true, herdingOrders), [herdingOrders]);
  const herdingRawPoints = useMemo(() => projectSampleFeatures(INCOMING_SAMPLES, "after", false, herdingOrders), [herdingOrders]);
  const exemplarPoints = useMemo(() => projectSampleFeatures(CURRENT_EXEMPLARS, "after", true), []);
  const isTrainingPhase = stepIndex === 4;
  const quotaReduced = stepIndex >= 5;
  const herdingRevealCount = stepIndex < 7 ? 0 : stepIndex === 7 ? 1 : stepIndex === 8 ? 2 : 3;
  const stateCommitted = stepIndex >= 10;
  const predictionReady = stepIndex === 12;
  const continueStream = stepIndex === 13;
  const memoryCount = quotaReduced
    ? REDUCED_MEMORY_SIZE + (stateCommitted ? P_AFTER[INCOMING_CLASS_ID].length : 0)
    : OLD_MEMORY_SIZE;
  const activePhase = phaseAt(stepIndex);
  const stepDurationMs = durationForStep(stepIndex);
  const activePhaseIndex = runtimePhases.findIndex((phase) => phase.id === activePhase);
  const journeyDurationMs = durationForPhase(activePhaseIndex);

  useEffect(() => {
    if (stepTimerRef.current?.stepIndex !== stepIndex) {
      stepTimerRef.current = { stepIndex, remainingMs: stepDurationMs };
    }
    if (!isPlaying || reducedMotion) return;
    if (stepIndex >= runtimeSteps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timerState = stepTimerRef.current;
    const startedAt = performance.now();
    const timer = window.setTimeout(() => {
      stepTimerRef.current = null;
      setStepIndex((value) => Math.min(runtimeSteps.length - 1, value + 1));
    }, timerState?.remainingMs ?? stepDurationMs);
    return () => {
      window.clearTimeout(timer);
      if (timerState && stepTimerRef.current === timerState) {
        timerState.remainingMs = Math.max(0, timerState.remainingMs - (performance.now() - startedAt));
      }
    };
  }, [isPlaying, reducedMotion, stepIndex, stepDurationMs]);

  function chooseStep(nextStep: number) {
    const clampedStep = Math.max(0, Math.min(runtimeSteps.length - 1, nextStep));
    setIsPlaying(false);
    setStepIndex(clampedStep);
    setTimelineSeed({ phaseId: phaseAt(clampedStep), offsetMs: phaseOffsetAtStep(clampedStep) });
    setTimelineAnimationRevision((value) => value + 1);
  }

  function togglePlayback() {
    if (reducedMotion) {
      setStepIndex((value) => value >= runtimeSteps.length - 1 ? 0 : value + 1);
      return;
    }
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (stepIndex >= runtimeSteps.length - 1) setStepIndex(0);
    setIsPlaying(true);
  }

  function restartPlayback() {
    setStepIndex(0);
    setTimelineSeed({ phaseId: "CURRENT", offsetMs: 0 });
    setTimelineAnimationRevision((value) => value + 1);
    setIsPlaying(!reducedMotion);
  }

  let featureMode: FeatureSpaceMode = "projection";
  let featureTitle = "Class 4 的样本表示";
  let featureDescription = "同一批新类样本随当前特征映射变化；二维坐标是固定的教学数据。";
  let featurePoints = stepIndex >= 4 ? updatedNewClassPoints : initialNewClassPoints;
  let previousPoints = stepIndex >= 4 ? initialNewClassPoints : [];
  let useUnitCircle = false;
  let rawMean: readonly [number, number] | undefined;
  let target: readonly [number, number] | undefined;
  let prefixMean: readonly [number, number] | undefined;
  let prototypes = [] as typeof PROTOTYPES;
  let query: readonly [number, number] | undefined;

  if (stepIndex >= 6 && stepIndex <= 10) {
    featureMode = "herding";
    featureTitle = "Herding · Class 4 的 exemplar 选择";
    featureDescription = herdingRevealCount === 0
      ? "虚线连接原始表示 φ_after(x) 与单位圆上的 z/‖z‖；全量候选已就绪，尚未选出 exemplar。"
      : `虚线连接原始表示与单位化特征；当前已按顺序选出 p₁–p${herdingRevealCount}，并用这一前缀重新计算均值。`;
    featurePoints = herdingPoints;
    previousPoints = [];
    useUnitCircle = true;
    rawMean = NEW_CLASS_HERDING.rawTargetMean;
    target = NEW_CLASS_HERDING.target;
    prefixMean = herdingRevealCount > 0 ? NEW_CLASS_HERDING.steps[herdingRevealCount - 1]?.prefixMean : undefined;
  } else if (stepIndex === 11) {
    featureMode = "prototypes";
    featureTitle = "P_after 对应的类别均值";
    featureDescription = "每个类别的已存样本都由 φ_after 重新编码；方框标出归一化后的 exemplar 均值。";
    featurePoints = exemplarPoints;
    previousPoints = [];
    useUnitCircle = true;
    prototypes = PROTOTYPES;
  } else if (stepIndex === 12) {
    featureMode = "inference";
    featureTitle = "查询样本到各类别均值的距离";
    featureDescription = "查询向量和各类别均值均经过 L2 normalization；距离最小的类别给出预测。";
    featurePoints = exemplarPoints;
    previousPoints = [];
    useUnitCircle = true;
    prototypes = PROTOTYPES;
    query = QUERY_FEATURE;
  }

  if (continueStream) {
    featureMode = "projection";
    featureTitle = "下一轮从这里继续";
    featureDescription = "已提交的 Θ_after + P_after 成为下一轮状态；X_next 仅作为后续入口提示。";
    featurePoints = [];
    previousPoints = [];
    useUnitCircle = false;
    rawMean = undefined;
    target = undefined;
    prefixMean = undefined;
    prototypes = [];
    query = undefined;
  }

  const systemState = stepIndex < 4
    ? "Sᵣ = Θ_before + P_before"
    : stepIndex === 4
      ? "Θ_after + P_before"
      : stepIndex === 5
        ? "Θ_after + 截短后的旧 P"
        : stepIndex < 10
          ? "Θ_after + 待提交的 P 候选"
          : continueStream
            ? "Sᵣ₊₁ = Θ_after + P_after"
            : "Θ_after + P_after";
  const stateExplanation = stepIndex < 4
    ? "模型与 exemplar 记忆来自上一轮；X_new、D 和 Q 都不属于持久状态。"
    : stepIndex === 4
      ? "训练阶段只改变 Θ。P 仍是原来的 P_before，旧 exemplar 列表尚未截短。"
      : stepIndex === 5
        ? "模型参数保持 Θ_after；记忆阶段开始更新 P，旧类列表各保留前三项。"
        : stepIndex <= 9
          ? herdingRevealCount === 0
            ? "旧记忆已按新配额截短；新类完整数据仍在，Herding 还没有选出样本。"
            : `${herdingRevealCount} 个新类 exemplar 已逐个选出；P₄ 候选和 prefix mean 与算法步骤同步。`
          : stepIndex === 10
            ? "新的持久状态现已提交：Θ_after 与 P_after 组合成为下一轮状态。"
            : stepIndex === 11
              ? "类别均值由 Θ_after + P_after 推导，不会改变已提交的持久状态。"
              : stepIndex === 12
                ? "查询样本已与所有类别均值比较；预测完成后，派生向量会退出运行视图。"
                : "Sᵣ₊₁ = Θ_after + P_after 成为下一轮当前状态；X_next 是下一轮入口提示，本页不重复运行该轮。";

  return (
    <article className="p10-page p10-board" id="runtime_workbench" data-canonical-id="runtime_workbench" aria-labelledby="page-ten-title">
      <header className="p10-board-header">
        <div className="p10-board-heading">
          <div className="p10-kicker"><span>第 10 页</span><i /> iCaRL 运行总图</div>
          <h1 id="page-ten-title">从新类别到下一轮就绪状态</h1>
          <p>全流程工作台：输入、模型、记忆、训练对象、Herding 与预测。</p>
        </div>
        <div className="p10-board-player" aria-label="完整运行动画播放控制">
          <button type="button" className="p10-back-page" onClick={onExit} title="返回第 9 页 · 实验与边界">← 返回第 9 页</button>
          <div className="p10-player-controls">
            <button type="button" onClick={() => chooseStep(stepIndex - 1)} disabled={stepIndex === 0} aria-label="上一步" title="上一步">‹</button>
            <button type="button" className="p10-player-play" onClick={togglePlayback} aria-label={reducedMotion ? "前进一步" : isPlaying ? "暂停播放" : stepIndex === runtimeSteps.length - 1 ? "重新播放" : "播放完整过程"} title={reducedMotion ? "前进一步" : isPlaying ? "暂停播放" : "播放完整过程"}>{reducedMotion ? "→" : isPlaying ? "Ⅱ" : "▶"}</button>
            {!reducedMotion ? <button type="button" onClick={restartPlayback} aria-label="从头播放" title="从头播放">↺</button> : null}
            <button type="button" onClick={() => chooseStep(stepIndex + 1)} disabled={stepIndex === runtimeSteps.length - 1} aria-label="下一步" title="下一步">›</button>
          </div>
          <label className="p10-player-range"><span className="p10-sr-only">动画状态进度</span><input type="range" min="0" max={runtimeSteps.length - 1} value={stepIndex} onChange={(event) => chooseStep(Number(event.currentTarget.value))} aria-valuetext={`第 ${stepIndex + 1} 步：${runtimeSteps[stepIndex].title}`} /></label>
          <b className="p10-player-count"><span>步骤</span>{String(stepIndex + 1).padStart(2, "0")}<i>/</i>{runtimeSteps.length}</b>
        </div>
        <div className="p10-current-step" aria-live="polite"><span>阶段 {String(activePhaseIndex + 1).padStart(2, "0")} / {runtimePhases.length} · {runtimePhases[activePhaseIndex]?.title}</span><strong>{runtimeSteps[stepIndex].title}</strong><p>{runtimeSteps[stepIndex].description}</p></div>
      </header>

      <RuntimeTimeline stepIndex={stepIndex} journeyDurationMs={journeyDurationMs} animationRevision={timelineAnimationRevision} initialOffsetMs={timelineSeed.phaseId === activePhase ? timelineSeed.offsetMs : 0} isPlaying={isPlaying && !reducedMotion} onSelect={chooseStep} />

      <section className="p10-board-grid" aria-label="iCaRL 一次完整增量更新总图">
        <section className={`panel p10-panel p10-incoming ${stepIndex >= 1 && stepIndex < 10 || continueStream ? "is-current" : ""}`} id="incoming_class_batch" data-canonical-id="incoming_class_batch" aria-labelledby="p10-incoming-title">
          <div className="p10-panel-heading"><div><span className="p10-eyebrow">{continueStream ? "下一轮输入 · X_next" : "新类输入 · X_new"}</span><h2 id="p10-incoming-title">{continueStream ? "等待新的完整批次" : "完整批次到达"}</h2></div><span className="p10-panel-index">01</span></div>
          {continueStream ? <div className="p10-next-input-preview"><strong>X_next</strong><span>下一批完整类别数据</span><small>教学入口提示 · 尚未进入本轮计算</small></div> : stepIndex === 0 ? <div className="p10-empty"><b>下一批尚未到达</b><span>当前持久状态继续保留。</span></div> : stepIndex < 10 ? <>
            <div className="p10-incoming-class"><span className="p10-incoming-class__glyph" style={{ color: CLASS_VISUALS[INCOMING_CLASS_ID].color }}>{CLASS_VISUALS[INCOMING_CLASS_ID].glyph}</span><div><strong>Class 4 · 全量图像</strong><small>{INCOMING_SAMPLES.length} 个样本，无预筛选</small></div></div>
            <div className="p10-incoming-samples">{INCOMING_SAMPLES.map((sample) => {
              const order = herdingOrders.get(sample.id);
              const selected = order !== undefined && order <= NEXT_QUOTA && order <= herdingRevealCount;
              return <SampleToken key={sample.id} sample={sample} role={selected ? "selected" : "incoming"} order={selected ? order : undefined} compact />;
            })}</div>
            <p className="p10-object-note">X<sub>new</sub> 从构造 D 一直保留到 Herding 完成。</p>
          </> : <div className="p10-released"><strong>X<sub>new</sub> 已释放</strong><span>新类 exemplar 已构造，未入选图像也不再占用运行工作区。</span></div>}
        </section>

        <section className={`panel p10-panel p10-model ${stepIndex >= 4 ? "is-updated" : ""}`} id="persistent_model_state" data-canonical-id="persistent_model_state" aria-labelledby="p10-model-title">
          <div className="p10-panel-heading"><div><span className="p10-eyebrow">持久模型 · Θ</span><h2 id="p10-model-title">当前学习器</h2></div><span className={`p10-theta-badge ${stepIndex >= 4 ? "is-after" : ""}`}>{stepIndex >= 4 ? "Θ_after" : "Θ_before"}</span></div>
          <div className="p10-model-flow">
            <div className="p10-extractor" id="feature_extractor" data-canonical-id="feature_extractor" title="共享特征映射 φ_Θ，训练阶段更新其参数 Θ">
              <span className="p10-eyebrow">共享特征提取器</span><div className="p10-extractor__layers" aria-hidden="true"><i /><i /><i /><i /></div><strong>φ<sub>Θ</sub></strong><small>输出表示 z</small>
            </div>
            <span className="p10-model-arrow" aria-hidden="true">→</span>
            <div className={`p10-head ${predictionReady ? "is-dimmed" : ""}`} id="training_head" data-canonical-id="training_head" title="训练输出层在测试阶段仍保留，但最终分类规则不使用它">
              <span className="p10-eyebrow">训练输出层 · 持续保留</span>
              <div className="p10-head__nodes">{OLD_CLASS_IDS.map((classId) => <span key={classId} style={{ "--node-color": CLASS_VISUALS[classId].color } as CSSProperties}>{CLASS_VISUALS[classId].glyph}<small>{CLASS_VISUALS[classId].index}</small></span>)}{stepIndex >= 1 ? <span className="is-new" style={{ "--node-color": CLASS_VISUALS.D.color } as CSSProperties}>{CLASS_VISUALS.D.glyph}<small>{CLASS_VISUALS.D.index}</small></span> : null}</div>
              <small>每个已见类别一个 sigmoid 节点</small>
            </div>
          </div>
          <div className={`p10-model-note ${isTrainingPhase ? "is-training" : ""}`} aria-live="polite">
            {continueStream ? "Θ_after + P_after 继续作为下一轮的持久状态。" : isTrainingPhase ? "训练正在改变 Θ；P 仍是 P_before。" : stepIndex < 4 ? "新类节点会追加到同一个共享模型。" : predictionReady ? "最终预测用 exemplar 均值；训练输出层保留但不参与 argmin。" : "Θ 已更新；接下来单独更新 exemplar 记忆 P。"}
          </div>
        </section>

        <section className="panel p10-panel p10-memory" id="persistent_memory_state" data-canonical-id="persistent_memory_state" aria-labelledby="p10-memory-title">
          <div className="p10-panel-heading"><div><span className="p10-eyebrow">持久图像记忆 · P</span><h2 id="p10-memory-title">有序 exemplar 列表</h2></div><span className="p10-budget-chip">固定预算 K = {MEMORY_BUDGET}</span></div>
          <div className="p10-memory-summary"><span>{quotaReduced ? `新配额 m = floor(${MEMORY_BUDGET} / ${NEXT_CLASS_COUNT}) = ${NEXT_QUOTA}` : `更新前每类保留 ${OLD_QUOTA} 个`}</span><b>{memoryCount} / {MEMORY_BUDGET} 个样本</b></div>
          <div className={`p10-budget-rail ${stepIndex === 5 ? "is-reducing" : ""}`} aria-label={`当前工作记忆使用 ${memoryCount} 个槽位，总预算 ${MEMORY_BUDGET}`}>
            {Array.from({ length: MEMORY_BUDGET }, (_, index) => <i key={index} className={index < memoryCount ? index >= REDUCED_MEMORY_SIZE && stepIndex === 5 ? "is-freeing" : "is-filled" : ""} />)}
          </div>
          <div className="p10-memory-buckets">{(["A", "B", "C", "D"] as ClassId[]).map((classId) => <MemoryBucket key={classId} classId={classId} stepIndex={stepIndex} herdingRevealCount={herdingRevealCount} stateCommitted={stateCommitted} />)}</div>
          <p className="p10-memory-note">顺序从左到右：保留列表前 m 项；被截短的尾项释放。新类只在 Herding 后进入 P。</p>
        </section>

        <section className="panel p10-workspace" aria-labelledby="p10-workspace-title">
          <div className="p10-panel-heading"><div><span className="p10-eyebrow">本轮临时工作区</span><h2 id="p10-workspace-title">只在更新期间存在的对象</h2></div><span className="p10-panel-index">02</span></div>
          <div className="p10-workspace-grid">
            <WorkspaceObject title="训练集" symbol="D" status={stepIndex < 2 ? "pending" : stepIndex < 5 ? "active" : "released"} statusText={stepIndex < 2 ? "待构造" : stepIndex < 5 ? "本轮可用" : "已释放"} canonicalId="training_set_D" content={<><strong>{OLD_MEMORY_SIZE} 个旧 exemplar + {INCOMING_SAMPLES.length} 张新图像</strong><p>合计 {TRAINING_SET_SIZE} 个样本。旧数据只使用 P_before。</p></>} />
            <WorkspaceObject title="旧节点响应快照" symbol="Q" status={stepIndex < 3 ? "pending" : stepIndex < 5 ? "active" : "released"} statusText={stepIndex < 3 ? "待快照" : stepIndex < 5 ? "更新前记录" : "已释放"} canonicalId="response_snapshot_Q" content={<><strong>{TRAINING_SET_SIZE} × {OLD_NODE_COUNT}</strong><p>D 中每个样本对旧类别节点的更新前响应。</p><code>qᵢ¹ · qᵢ² · qᵢ³</code></>} />
            <WorkspaceObject title="训练目标" symbol="y" status={stepIndex < 4 ? "pending" : stepIndex === 4 ? "training" : "released"} statusText={stepIndex < 4 ? "待生成" : stepIndex === 4 ? "参与训练" : "训练后释放"} content={<><p><b>旧节点</b> ← Q 中的软响应</p><p><b>新节点 Class 4</b> ← 新类硬标签</p></>} />
            <WorkspaceObject title="损失与反向传播" symbol="ℒ" status={stepIndex < 4 ? "pending" : stepIndex === 4 ? "training" : "released"} statusText={stepIndex < 4 ? "待计算" : stepIndex === 4 ? "更新 Θ" : "训练后释放"} content={<><strong>逐节点 sigmoid BCE</strong><p>联合更新共享表示与输出层参数。</p><code>ℒ = ℒ_old + ℒ_new</code></>} />
          </div>
          <p className="p10-workspace-note">D、<PaperTerm termId="response-snapshot-q" />、目标与损失都不进入持久状态；Q 必须在 Θ 改变前计算。</p>
        </section>

        <section className="panel p10-feature-panel" id="unit_circle" data-canonical-id="unit_circle" aria-labelledby="p10-feature-heading">
          <div className="p10-panel-heading"><div><span className="p10-eyebrow">{continueStream ? "继续类别流" : "共享特征空间"}</span><h2 id="p10-feature-heading">{featureTitle}</h2></div><span className={`p10-mode-badge p10-mode-badge--${featureMode}`} data-canonical-id={continueStream ? "next_increment_mode" : stepIndex === 12 ? "inference_mode" : stepIndex === 11 ? "prototype_mode" : stepIndex >= 6 ? "herding_mode" : "representation_mode"}>{continueStream ? "下一轮入口" : featureMode === "projection" ? "表示变化" : featureMode === "herding" ? "Herding 选样" : featureMode === "prototypes" ? "类别均值" : "预测"}</span></div>
          {continueStream ? <div className="p10-stream-stage">
            <div className="p10-stream-stage__exiting" aria-hidden="true"><FeatureSpaceWorkbench mode="inference" title="查询样本到各类别均值的距离" description="查询向量和各类别均值均经过 L2 normalization；距离最小的类别给出预测。" points={exemplarPoints} unitCircle prototypes={PROTOTYPES} query={QUERY_FEATURE} focusableSamples={false} asideContent={<div className="p10-prediction-result"><span>最小距离 · 最近类别均值</span><strong><i style={{ color: CLASS_VISUALS[QUERY_PREDICTION].color }}>{CLASS_VISUALS[QUERY_PREDICTION].glyph}</i>{CLASS_VISUALS[QUERY_PREDICTION].displayLabel}</strong><small>距离 {QUERY_DISTANCES[0].distance.toFixed(3)} · 对全部已见类别比较</small></div>} /></div>
            <div className="p10-stream-continuation">
              <div className="p10-stream-state"><span>CURRENT STATE FOR NEXT INCREMENT</span><strong>Θ_after + P_after</strong><small>本轮已提交的模型与 exemplar 记忆</small></div>
              <i aria-hidden="true">→</i>
              <div className="p10-stream-next"><span>下一批输入 · 教学提示</span><strong>X_next</strong><small>下一类别的完整数据将从这里进入</small></div>
            </div>
          </div> : <FeatureSpaceWorkbench
            mode={featureMode}
            title={featureTitle}
            description={featureDescription}
            points={featurePoints}
            previousPoints={previousPoints}
            unitCircle={useUnitCircle}
            rawMean={rawMean}
            target={target}
            prefixMean={prefixMean}
            prototypes={prototypes}
            query={query}
            normalizationSources={featureMode === "herding" ? herdingRawPoints : []}
            markerScale={0.62}
            showSampleLabels={featureMode === "herding"}
            herdingRevealCount={herdingRevealCount}
            asideContent={predictionReady ? <div className="p10-prediction-result" aria-live="polite"><span>最小距离 · 最近类别均值</span><strong><i style={{ color: CLASS_VISUALS[QUERY_PREDICTION].color }}>{CLASS_VISUALS[QUERY_PREDICTION].glyph}</i>{CLASS_VISUALS[QUERY_PREDICTION].displayLabel}</strong><small>距离 {QUERY_DISTANCES[0].distance.toFixed(3)} · 对全部已见类别比较</small></div> : featureMode === "herding" && herdingRevealCount > 0 ? <p className="p10-feature-note">当前已选 p<sub>1</sub>–p<sub>{herdingRevealCount}</sub>；前缀均值使用同一计算步骤，记忆 P₄ 同步显示这些样本。</p> : featureMode === "herding" ? <p className="p10-feature-note">完整新类数据和均值目标已就绪；尚无 exemplar 入选。</p> : <p className="p10-feature-note">当前投影只用于展示表示变化；尚未进入 Herding 时，不会提前展示类别中心。</p>}
          />}
        </section>

        <ObjectLifetimeRail stepIndex={stepIndex} />
        <section className="panel p10-system-state" id="state_commit" data-canonical-id="state_commit" aria-labelledby="p10-state-title" aria-live="polite">
          <div className="p10-section-heading"><div><span className="p10-eyebrow">持久状态迁移</span><h2 id="p10-state-title">当前系统包含什么？</h2></div><span className="p10-state-icon" aria-hidden="true">⚙</span></div>
          <div className="p10-state-equation">{continueStream ? <><div className="is-committed"><small>下一轮当前状态</small><strong>{systemState}</strong></div><span aria-hidden="true">→</span><div><small>下一批输入</small><strong>X_next</strong></div></> : <><div><small>当前</small><strong>{systemState}</strong></div><span aria-hidden="true">→</span><div className={stateCommitted ? "is-committed" : "is-pending"}><small>{stateCommitted ? "已就绪" : "本轮目标"}</small><strong>Θ_after + P_after</strong></div></>}</div>
          <p>{stateExplanation}</p>
          {predictionReady || continueStream ? <div className="p10-next-batch-note"><b>{continueStream ? "CURRENT STATE FOR NEXT INCREMENT" : "预测完成 · 状态保持"}</b><span>{continueStream ? "Sᵣ₊₁ = Θ_after + P_after 已成为当前持久状态；X_next 从此处进入下一轮。" : "Θ_after + P_after 保持持久；现在可将它作为下一轮的当前状态。"}</span></div> : null}
        </section>
      </section>

      <details className="panel p10-inspect">
        <summary onClick={(event) => { const details = event.currentTarget.parentElement as HTMLDetailsElement; window.setTimeout(() => { if (details.open) details.scrollIntoView({ block: "end", behavior: "auto" }); }, 0); }}>示例边界与计算细节 · 复用上方同一组输入</summary>
        <div className="p10-inspect-grid">
          <section><h3>示例边界</h3><p>本页用固定合成特征真实计算配额、Herding 顺序、类别均值与预测距离；Θ 的参数更新只表示状态变化，不虚构梯度轨迹或论文 checkpoint。</p><p>旧节点拟合快照 Q，新节点拟合新类硬标签；ℒ = ℒ_old + ℒ_new。</p><p>P_before 是预置的 synthetic inherited state。当前增量只接收已保存的有序列表；本轮不访问旧类完整训练数据，也不会重新对旧类运行 Herding。源码中的固定旧类样本只用于构造这份教学 fixture。</p></section>
          <section><h3>配额与旧列表截短</h3><p>新类别总数 t = {NEXT_CLASS_COUNT}，每类配额 m = floor(K/t) = floor({MEMORY_BUDGET}/{NEXT_CLASS_COUNT}) = {NEXT_QUOTA}。每个旧列表保留 P_before 的前 m 项；本轮不读取旧完整数据集。</p><p>更新前共 {OLD_MEMORY_SIZE} 个 exemplar；截短后旧类共 {REDUCED_MEMORY_SIZE} 个，新类完成选择后总计 {COMMITTED_MEMORY_SIZE} 个。</p></section>
          <section><h3>新类 Herding 顺序</h3><p>先对 Class 4 的完整特征求均值并归一化，再逐次挑选使当前前缀均值最接近目标的样本。</p><ol className="p10-herding-order">{NEW_CLASS_HERDING.steps.map((step, index) => <li key={step.chosen.id}><strong>p{index + 1} = {step.chosen.id}</strong><span>与目标的距离 {step.distanceToTarget.toFixed(3)}</span><details><summary>查看候选距离</summary><ul>{step.candidateScores.map((candidate) => <li key={candidate.sample.id}>{candidate.sample.id}：{candidate.distanceToTarget.toFixed(3)}</li>)}</ul></details></li>)}</ol></section>
          <section><h3>当前 prototype 与预测距离</h3><p>逐类对归一化 exemplar 表示求均值，再把均值归一化。以下距离与图中的预测使用完全相同的向量。</p><ul className="p10-distance-list">{QUERY_DISTANCES.map((row) => <li key={row.classId}><span>{CLASS_VISUALS[row.classId].glyph} {CLASS_VISUALS[row.classId].displayLabel}</span><code>{row.distance.toFixed(3)}</code></li>)}</ul></section>
        </div>
      </details>

    </article>
  );
}
