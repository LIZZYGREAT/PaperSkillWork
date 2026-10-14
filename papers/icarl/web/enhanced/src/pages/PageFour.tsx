import { useEffect, useRef, useState } from "react";
import { ChartLabels, FEATURE_FRAME, featureStar, type ChartLabel } from "../components/FeatureChart";
import { GuidedStepControls, type GuidedStep } from "../components/GuidedStepControls";
import {
  HERDING_DEMO_ORDER,
  HERDING_DEMO_POINTS,
  HERDING_DEMO_QUOTA,
  HERDING_DEMO_ROUNDS,
  HERDING_DEMO_TARGET,
  HERDING_DEMO_TARGET_RAW,
  type HerdingDemoCandidate,
} from "../data/herding-teaching-demo";
import type { Vector2 } from "../data/icarl-runtime";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";

const steps: readonly GuidedStep[] = [
  { title: "完整类别的特征均值怎样成为目标？", short: "建立目标" },
  { title: "只有一个名额时怎样选择？", short: "k = 1" },
  { title: "第二张怎样补上第一张的偏差？", short: "k = 2" },
  { title: "第三张怎样改变三点重心？", short: "k = 3" },
  { title: "第四轮怎样延续同一规则？", short: "k = 4" },
  { title: "为什么结果形成有序前缀？", short: "回看前缀" },
  { title: "预算收缩时怎样维护旧列表？", short: "截去尾部" },
];

const phaseTitles = [
  "先确定要逼近的完整类别目标",
  "从未选样本中找最靠近目标的第一项",
  "把已有 p₁ 和候选一起计算",
  "从已有两项的均值继续形成三点重心",
  "固定前三项，完成第四次选择",
  "回看同一选择顺序的不同长度",
  "总容量不变时，只保留有序列表的前缀",
] as const;

const targetMicrocopy = [
  "类别的八个样本都可用；当前模型 φ 在这次筛选中保持固定。",
  "先对八个单位特征求平均，得到完整类别的原始均值。",
  "将原始均值沿原点方向单位化，得到随后要逼近的目标。",
] as const;

const secondRoundMicrocopy = [
  "先固定已经选出的 p₁，再观察一个尚未选择的候选 x。",
  "z(p₁) 与 z(x) 各复制出一个贡献点，两个贡献点同时向共同中点移动。",
  "两个贡献点在中点汇合；这个位置就是原始前缀均值 ν̄₂(x)。",
  "将 ν̄₂(x) 沿原点方向单位化，得到用于比较的 ν₂(x)。",
  "用 ν₂(x) 到 μ_full 的距离评分；此时还没有检查完所有候选。",
] as const;

const thirdRoundMicrocopy = [
  "固定前两项，并取一个尚未选择的候选 x。",
  "z(p₁)、z(p₂) 与 z(x) 各复制出一个贡献点，同时向共同重心移动。",
  "三个贡献点在重心汇合；这个位置就是 ν̄₃(x) = [z(p₁)+z(p₂)+z(x)]/3。",
  "将新均值单位化，得到本轮用于评分的 ν₃(x)。",
  "用 ν₃(x) 到 μ_full 的距离评分；本轮仍需检查其他候选。",
] as const;

type Point2D = { x: number; y: number };
type FlowState = {
  stage: number;
  candidateIndex: number;
  microStep: number;
  committed: boolean;
  prefixCount: number;
};

const CHART = { centerX: FEATURE_FRAME.x, centerY: FEATURE_FRAME.y, radius: Math.min(210, FEATURE_FRAME.radius + 30) };
const CLOCKWISE_START_ANGLE = 90;
const clockwiseRank = (angle: number) => (CLOCKWISE_START_ANGLE - angle + 360) % 360;
const CANDIDATES_BY_ROUND = HERDING_DEMO_ROUNDS.map((round) =>
  [...round.candidates].sort((a, b) => clockwiseRank(a.point.angle) - clockwiseRank(b.point.angle)),
);

function clamp(value: number) { return Math.max(0, Math.min(1, value)); }
function ease(value: number) { const t = clamp(value); return t * t * (3 - 2 * t); }
function lerp(a: number, b: number, progress: number) { return a + (b - a) * ease(progress); }
function lerpVector(a: Vector2, b: Vector2, progress: number): [number, number] { return [lerp(a[0], b[0], progress), lerp(a[1], b[1], progress)]; }
function toChartPoint(vector: Vector2): Point2D {
  return { x: CHART.centerX + vector[0] * CHART.radius, y: CHART.centerY - vector[1] * CHART.radius };
}

function diamondPoints(point: Point2D, radius = 6) {
  return `${point.x},${point.y - radius} ${point.x + radius},${point.y} ${point.x},${point.y + radius} ${point.x - radius},${point.y}`;
}

function format(value: number) {
  return value.toFixed(3);
}

function initialFlow(stage: number): FlowState {
  return {
    stage,
    candidateIndex: 0,
    microStep: stage === 1 || stage === 4 ? 4 : 0,
    committed: false,
    prefixCount: 4,
  };
}

function advanceFlow(flow: FlowState): FlowState {
  if (flow.stage === 0) {
    return flow.microStep < 2
      ? { ...flow, microStep: flow.microStep + 1 }
      : initialFlow(1);
  }
  if (flow.stage >= 5) {
    if (flow.stage === 5) return initialFlow(6);
    return flow.prefixCount === 4 ? { ...flow, prefixCount: 3 } : flow;
  }

  if (flow.committed) {
    return flow.stage < 4
      ? initialFlow(flow.stage + 1)
      : initialFlow(5);
  }

  const roundIndex = flow.stage - 1;
  const candidates = CANDIDATES_BY_ROUND[roundIndex];
  const hasDetailedFirstCandidate = roundIndex === 1 || roundIndex === 2;
  if (hasDetailedFirstCandidate && flow.candidateIndex === 0 && flow.microStep < 4) {
    return { ...flow, microStep: flow.microStep + 1 };
  }
  if (flow.candidateIndex < candidates.length - 1) {
    return { ...flow, candidateIndex: flow.candidateIndex + 1, microStep: 4 };
  }
  return { ...flow, committed: true };
}

function previousFlow(flow: FlowState): FlowState {
  if (flow.stage === 0) return { ...flow, microStep: Math.max(0, flow.microStep - 1) };
  if (flow.stage === 5) {
    const previous = initialFlow(4);
    return { ...previous, candidateIndex: CANDIDATES_BY_ROUND[3].length - 1, committed: true };
  }
  if (flow.stage === 6) return { ...initialFlow(5), prefixCount: 4 };

  const candidates = CANDIDATES_BY_ROUND[flow.stage - 1];
  if (flow.committed) return { ...flow, candidateIndex: candidates.length - 1, microStep: 4, committed: false };
  if (flow.candidateIndex > 0) return { ...flow, candidateIndex: flow.candidateIndex - 1, microStep: 4 };
  if ((flow.stage === 2 || flow.stage === 3) && flow.microStep > 0) return { ...flow, microStep: flow.microStep - 1 };
  if (flow.stage === 1) return { ...initialFlow(0), microStep: 2 };

  const previous = initialFlow(flow.stage - 1);
  const previousCandidates = CANDIDATES_BY_ROUND[flow.stage - 2];
  return { ...previous, candidateIndex: previousCandidates.length - 1, committed: true };
}

function currentPrompt(flow: FlowState, candidate: HerdingDemoCandidate | null) {
  if (flow.stage === 0) return targetMicrocopy[flow.microStep];
  if (flow.stage === 5) return `当前选中的前 ${flow.prefixCount} 项，就是算法当初运行前 ${flow.prefixCount} 轮留下的代表组合。`;
  if (flow.stage === 6) {
    return flow.prefixCount === 4
      ? "三类时每类有四个名额；新类别到来后，总预算仍为 K=12。"
      : "旧类完整训练图片不再可用；保留 p₁、p₂、p₃ 这个已有前缀，不重新运行 Herding。";
  }
  if (flow.committed) return `全部未选候选都已比较。本轮将最接近目标的样本追加为 p${flow.stage}。`;
  if (!candidate) return "继续查看本轮候选。";
  if (flow.stage === 2 && flow.candidateIndex === 0) return secondRoundMicrocopy[flow.microStep];
  if (flow.stage === 3 && flow.candidateIndex === 0) return thirdRoundMicrocopy[flow.microStep];
  return `正在检查候选 ${candidate.point.id}；每轮都固定已有前缀，并用归一化后的候选均值比较。`;
}

function currentFormula(flow: FlowState, candidate: HerdingDemoCandidate | null) {
  const candidateId = candidate?.point.id ?? "x";
  const score = candidate ? format(candidate.score) : "—";
  const round = flow.stage >= 1 && flow.stage <= 4 ? HERDING_DEMO_ROUNDS[flow.stage - 1] : null;
  if (flow.stage === 0) {
    if (flow.microStep === 0) return <span>z(x) = normalize(φ(x))</span>;
    if (flow.microStep === 1) return <span>μ̄<sub>full</sub> = (1 / |X<sub>y</sub>|) Σ<sub>x∈Xy</sub> z(x)</span>;
    return <span>μ<sub>full</sub> = normalize(μ̄<sub>full</sub>)</span>;
  }
  if (flow.stage === 5) {
    return <span>ν<sub>{flow.prefixCount}</sub> = normalize((1/{flow.prefixCount}) Σ<sub>i=1…{flow.prefixCount}</sub> z(p<sub>i</sub>))</span>;
  }
  if (flow.stage === 6) {
    return <div className="p4-formula-stack"><span>m = ⌊K / t⌋</span><span>K = 12，t = 4 → m = 3</span></div>;
  }
  if (flow.committed && round) return <div className="p4-formula-stack"><span>p<sub>{flow.stage}</sub> = {round.chosen.id}</span><span>{round.chosen.id} = arg min<sub>x∉P</sub> d<sub>{flow.stage}</sub>(x)</span></div>;
  if (flow.stage === 1) return <div className="p4-formula-stack"><span>ν<sub>1</sub>({candidateId}) = z({candidateId})</span><span>d<sub>1</sub>({candidateId}) = ‖μ<sub>full</sub> − ν<sub>1</sub>({candidateId})‖₂ = {score}</span></div>;
  if (flow.stage === 2) {
    if (flow.microStep === 0) return <span>S<sub>2</sub>({candidateId}) = {`{z(p₁), z(${candidateId})}`}</span>;
    if (flow.microStep <= 2) return <span>ν̄<sub>2</sub>({candidateId}) = [z(p<sub>1</sub>) + z({candidateId})] / 2</span>;
    if (flow.microStep === 3) return <span>ν<sub>2</sub>({candidateId}) = normalize(ν̄<sub>2</sub>({candidateId}))</span>;
    return <span>d<sub>2</sub>({candidateId}) = ‖μ<sub>full</sub> − ν<sub>2</sub>({candidateId})‖₂ = {score}</span>;
  }
  if (flow.stage === 3) {
    if (flow.microStep === 0) return <span>S<sub>3</sub>({candidateId}) = {`{z(p₁), z(p₂), z(${candidateId})}`}</span>;
    if (flow.microStep <= 2) return <span>ν̄<sub>3</sub>({candidateId}) = [z(p<sub>1</sub>) + z(p<sub>2</sub>) + z({candidateId})] / 3</span>;
    if (flow.microStep === 3) return <span>ν<sub>3</sub>({candidateId}) = normalize(ν̄<sub>3</sub>({candidateId}))</span>;
    return <span>d<sub>3</sub>({candidateId}) = ‖μ<sub>full</sub> − ν<sub>3</sub>({candidateId})‖₂ = {score}</span>;
  }
  if (flow.stage === 4) {
    return <div className="p4-formula-stack"><span>ν̄<sub>4</sub>({candidateId}) = [z(p<sub>1</sub>) + z(p<sub>2</sub>) + z(p<sub>3</sub>) + z({candidateId})] / 4</span><span>ν<sub>4</sub>({candidateId}) = normalize(ν̄<sub>4</sub>({candidateId}))</span><span>d<sub>4</sub>({candidateId}) = {score}</span></div>;
  }
  return null;
}

function HerdingFeatureSpace({ flow, candidate, motionProgress }: { flow: FlowState; candidate: HerdingDemoCandidate | null; motionProgress: number }) {
  const targetRaw = toChartPoint(HERDING_DEMO_TARGET_RAW);
  const target = toChartPoint(HERDING_DEMO_TARGET);
  const roundIndex = flow.stage >= 1 && flow.stage <= 4 ? flow.stage - 1 : null;
  const activeRound = roundIndex === null ? null : HERDING_DEMO_ROUNDS[roundIndex];
  const activeCandidate = candidate && !flow.committed ? candidate : null;
  const selectedCount = roundIndex === null
    ? flow.stage >= 5 ? flow.prefixCount : 0
    : roundIndex + Number(flow.committed);
  const selected = HERDING_DEMO_ORDER.slice(0, selectedCount);
  const selectedIds = new Set(selected.map((point) => point.id));
  const targetRawVisible = flow.stage !== 0 || flow.microStep >= 1;
  const targetVisible = flow.stage !== 0 || flow.microStep >= 2;
  const isDetailedCandidate = (roundIndex === 1 || roundIndex === 2) && flow.candidateIndex === 0;
  const gatherProgress = isDetailedCandidate
    ? flow.microStep > 1 ? 1 : flow.microStep === 1 ? clamp(motionProgress) : 0
    : clamp((motionProgress - .08) / .42);
  const normalizeProgress = isDetailedCandidate
    ? flow.microStep > 3 ? 1 : flow.microStep === 3 ? clamp(motionProgress) : 0
    : clamp((motionProgress - .52) / .24);
  const scoreProgress = flow.stage === 1
    ? clamp(motionProgress)
    : isDetailedCandidate
      ? flow.microStep > 4 ? 1 : flow.microStep === 4 ? clamp(motionProgress) : 0
      : clamp((motionProgress - .76) / .24);
  const showCombination = activeCandidate !== null && roundIndex !== null && roundIndex > 0
    && (isDetailedCandidate ? flow.microStep === 1 : true);
  const showMean = activeCandidate !== null && roundIndex !== null && roundIndex > 0
    && (isDetailedCandidate ? flow.microStep >= 2 : gatherProgress >= .92);
  const showNormalized = activeCandidate !== null && roundIndex !== null && roundIndex > 0
    && (isDetailedCandidate ? flow.microStep >= 3 : normalizeProgress > 0);
  const scoreCandidate = activeCandidate !== null && scoreProgress > 0;
  const reviewRound = flow.stage === 5 || flow.stage === 6 ? HERDING_DEMO_ROUNDS[flow.prefixCount - 1] : null;
  const rawMean = activeCandidate ? toChartPoint(activeCandidate.rawPrefixMean) : null;
  const normalizedMean = activeCandidate ? toChartPoint(activeCandidate.normalizedPrefixMean) : null;
  const activeReviewMean = reviewRound ? toChartPoint(reviewRound.normalizedPrefixMean) : null;
  const committedMean = flow.committed && activeRound ? toChartPoint(activeRound.normalizedPrefixMean) : null;
  const candidatePoint = activeCandidate ? toChartPoint(activeCandidate.point.feature) : null;
  const contributionPoints = activeCandidate && roundIndex !== null
    ? [...HERDING_DEMO_ORDER.slice(0, roundIndex), activeCandidate.point]
    : [];
  const animatedRawMean = activeCandidate ? activeCandidate.rawPrefixMean : null;
  const animatedNormalizedMean = activeCandidate ? activeCandidate.normalizedPrefixMean : null;
  const animatedMean = animatedRawMean && animatedNormalizedMean
    ? toChartPoint(lerpVector(animatedRawMean, animatedNormalizedMean, normalizeProgress))
    : null;
  const candidateForLabels = candidatePoint && activeCandidate
    ? { ...candidatePoint, id: `candidate-${activeCandidate.point.id}`, text: `候选 ${activeCandidate.point.id}` }
    : null;
  const plottedMean = flow.stage >= 5
    ? activeReviewMean
    : flow.committed ? committedMean
    : !activeCandidate || roundIndex === 0 || !showMean ? null
    : isDetailedCandidate
      ? flow.microStep === 2 ? rawMean : animatedMean
      : animatedMean;
  const plottedMeanIsRaw = Boolean(activeCandidate && !flow.committed && flow.stage < 5 && normalizeProgress < .96);
  const plottedMeanIsNormalized = Boolean(flow.committed || flow.stage >= 5 || normalizeProgress >= .96);
  const labels: ChartLabel[] = [];
  if (targetRawVisible) labels.push({ ...targetRaw, id: "target-raw", text: "μ̄_full" });
  if (targetVisible) labels.push({ ...target, id: "target", text: "目标 μ_full" });
  if (candidateForLabels) labels.push(candidateForLabels);
  if (plottedMean && (showMean || showNormalized || flow.committed || flow.stage >= 5)) {
    labels.push({ ...plottedMean, id: "active-mean", text: plottedMeanIsNormalized ? `ν${flow.stage >= 5 ? flow.prefixCount : flow.stage}` : `ν̄${flow.stage}(x)` });
  }
  const obstacles = [
    ...HERDING_DEMO_POINTS.map((point) => toChartPoint(point.feature)),
    ...(targetRawVisible ? [targetRaw] : []),
    ...(targetVisible ? [target] : []),
    ...(rawMean && showMean ? [rawMean] : []),
    ...(normalizedMean && showNormalized ? [normalizedMean] : []),
  ];

  return <svg className="p4-herding-chart" viewBox="0 0 640 520" role="img" aria-label={`固定的八样本 Herding 特征空间。第 ${flow.stage + 1} 幕；${activeCandidate ? `当前候选 ${activeCandidate.point.id}` : `当前有序前缀长度 ${selectedCount}`}。`}>
    <title>同一特征空间中的 Herding 计算与前缀回看</title>
    <desc>坐标轴、八个单位候选特征和完整类别目标贯穿所有阶段。候选均值、归一化位置、距离和有序选择均由同一份 Herding 计算生成。</desc>
    <line className="p4-axis" x1="24" y1={CHART.centerY} x2="616" y2={CHART.centerY} />
    <line className="p4-axis" x1={CHART.centerX} y1="24" x2={CHART.centerX} y2="496" />
    <circle className="p4-circle" cx={CHART.centerX} cy={CHART.centerY} r={CHART.radius} />
    {flow.stage === 0 && flow.microStep <= 1 ? HERDING_DEMO_POINTS.map((point) => {
      const source = toChartPoint(point.feature);
      const targetProgress = flow.microStep === 0 ? motionProgress : 1;
      return <circle key={`target-contribution-${point.id}`} className="p4-contribution-dot" cx={lerp(source.x, targetRaw.x, targetProgress)} cy={lerp(source.y, targetRaw.y, targetProgress)} r="5.5" />;
    }) : null}
    {flow.stage === 0 && flow.microStep === 1 ? <circle className="p4-animated-mean" cx={lerp(targetRaw.x, target.x, motionProgress)} cy={lerp(targetRaw.y, target.y, motionProgress)} r="8" /> : null}
    {flow.stage === 0 && flow.microStep >= 1 ? HERDING_DEMO_POINTS.map((point) => {
      const position = toChartPoint(point.feature);
      return <line key={`target-mean-${point.id}`} className="p4-target-mean-line" x1={position.x} y1={position.y} x2={targetRaw.x} y2={targetRaw.y} />;
    }) : null}
    {targetRawVisible ? <line className="p4-target-ray" x1={CHART.centerX} y1={CHART.centerY} x2={targetRaw.x} y2={targetRaw.y} /> : null}
    {targetVisible && flow.stage === 0 ? <line className="p4-normalize-ray p4-normalize-ray--target" x1={targetRaw.x} y1={targetRaw.y} x2={target.x} y2={target.y} /> : null}
    {flow.stage === 5 ? <polyline className="p4-prefix-track" points={HERDING_DEMO_ROUNDS.map((round) => { const point = toChartPoint(round.normalizedPrefixMean); return `${point.x},${point.y}`; }).join(" ")} /> : null}
    {showCombination && rawMean ? contributionPoints.map((point) => {
      const position = toChartPoint(point.feature);
      return <line key={`combine-${point.id}`} className="p4-combine-line" x1={position.x} y1={position.y} x2={rawMean.x} y2={rawMean.y} />;
    }) : null}
    {showMean && rawMean ? <line className="p4-prefix-ray" x1={CHART.centerX} y1={CHART.centerY} x2={rawMean.x} y2={rawMean.y} /> : null}
    {showNormalized && rawMean && animatedMean ? <line className="p4-normalize-ray" x1={rawMean.x} y1={rawMean.y} x2={animatedMean.x} y2={animatedMean.y} /> : null}
    {flow.committed && committedMean ? <line className="p4-score-line" x1={committedMean.x} y1={committedMean.y} x2={target.x} y2={target.y} /> : null}
    {flow.stage >= 5 && activeReviewMean ? <line className="p4-score-line" x1={activeReviewMean.x} y1={activeReviewMean.y} x2={target.x} y2={target.y} /> : null}
    {HERDING_DEMO_POINTS.map((point) => {
      const position = toChartPoint(point.feature);
      const isSelected = selectedIds.has(point.id);
      const isCandidate = activeCandidate?.point.id === point.id;
      return <g key={point.id} className="p4-point" aria-label={`${point.id}${isSelected ? `，有序样本 p${selected.findIndex((item) => item.id === point.id) + 1}` : "，未选候选"}`}>
        <title>{`${point.id} · 单位化合成特征${isSelected ? ` · p${selected.findIndex((item) => item.id === point.id) + 1}` : ""}`}</title>
        {isSelected ? <circle className="p4-selected-ring" cx={position.x} cy={position.y} r="11" /> : null}
        {isCandidate ? <circle className="p4-candidate-ring" cx={position.x} cy={position.y} r="14" /> : null}
        <circle className={`p4-data-point${isSelected ? " is-selected" : ""}${isCandidate ? " is-candidate" : ""}`} cx={position.x} cy={position.y} r={isSelected || isCandidate ? 6.3 : 5} />
      </g>;
    })}
    {activeCandidate && candidatePoint && rawMean && normalizedMean ? <g className="p4-live-calculation">
      {showCombination ? contributionPoints.map((point) => {
        const source = toChartPoint(point.feature);
        return <circle key={`contribution-${point.id}`} className="p4-contribution-dot" cx={lerp(source.x, rawMean.x, gatherProgress)} cy={lerp(source.y, rawMean.y, gatherProgress)} r="5.5" />;
      }) : null}
      {scoreCandidate ? <line className="p4-score-line p4-score-line--growing" x1={normalizedMean.x} y1={normalizedMean.y} x2={lerp(normalizedMean.x, target.x, scoreProgress)} y2={lerp(normalizedMean.y, target.y, scoreProgress)} /> : null}
    </g> : null}
    {flow.stage === 5 ? HERDING_DEMO_ROUNDS.map((item, index) => {
      const position = toChartPoint(item.normalizedPrefixMean);
      return <circle key={`prefix-${item.k}`} className={`p4-prefix-node${item.k === flow.prefixCount ? " is-active" : ""}`} cx={position.x} cy={position.y} r={item.k === flow.prefixCount ? 7 : 4.5} />;
    }) : null}
    {targetRawVisible ? <polygon className="p4-raw-target" points={diamondPoints(targetRaw)} /> : null}
    {targetVisible ? <path className="p4-target" d={featureStar(target.x, target.y)} /> : null}
    <circle className={`p4-moving-mean${plottedMeanIsRaw ? " is-raw" : ""}`} cx={plottedMean?.x ?? 0} cy={plottedMean?.y ?? 0} r="8" visibility={plottedMean && (showMean || showNormalized || flow.committed || flow.stage >= 5) ? "visible" : "hidden"} />
    <circle className="p4-origin" cx={CHART.centerX} cy={CHART.centerY} r="3" />
    <ChartLabels labels={labels} obstacles={obstacles} />
  </svg>;
}

function OrderedSlots({ count, tailVisible }: { count: number; tailVisible: boolean }) {
  return <div className="p4-slots" aria-label={`当前保留 ${count} 个有序 exemplar`}>
    {Array.from({ length: HERDING_DEMO_QUOTA }, (_, index) => {
      const point = HERDING_DEMO_ORDER[index];
      const filled = index < count;
      return <span key={index} className={`${filled ? "is-filled" : ""}${index === 3 && !tailVisible ? " is-removed" : ""}`}>
        <b>p<sub>{index + 1}</sub></b><small>{filled ? point.id : index === 3 ? "尾部" : "待选择"}</small>
      </span>;
    })}
  </div>;
}

function DistanceRuler({ flow, candidates, motionProgress }: { flow: FlowState; candidates: readonly HerdingDemoCandidate[]; motionProgress: number }) {
  if (flow.stage < 1 || flow.stage > 4 || candidates.length === 0) return null;
  const maximum = Math.max(...candidates.map((item) => item.score), .0001);
  const revealed = flow.committed ? candidates.length : flow.candidateIndex + (motionProgress > .75 ? 1 : 0);
  return <div className="p4-distance-ruler" aria-label="本轮候选到完整类别目标的同尺度距离比较">
    <div><b>同尺度距离尺</b><span>{revealed} / {candidates.length}</span></div>
    <div className="p4-distance-ruler__rows">{candidates.slice(0, revealed).map((item, index) => {
      const current = !flow.committed && index === flow.candidateIndex;
      const progress = current ? clamp((motionProgress - .75) / .25) : 1;
      const chosen = flow.committed && item.point.id === HERDING_DEMO_ROUNDS[flow.stage - 1].chosen.id;
      return <span key={item.point.id} className={chosen ? "is-chosen" : ""}><code>{item.point.id}</code><i style={{ width: `${item.score / maximum * progress * 100}%` }} /><small>{item.score.toFixed(3)}</small></span>;
    })}</div>
  </div>;
}

function CalculationDetails({ flow }: { flow: FlowState }) {
  const completed = flow.stage > 4 || flow.committed;
  return <details className="p4-calculation-details">
    <summary>查看精确坐标、距离与候选排序</summary>
    {flow.stage === 0 ? <p>完整类别原始均值：({format(HERDING_DEMO_TARGET_RAW[0])}, {format(HERDING_DEMO_TARGET_RAW[1])})；单位目标 μ<sub>full</sub>：({format(HERDING_DEMO_TARGET[0])}, {format(HERDING_DEMO_TARGET[1])})。</p>
      : !completed ? <p>本轮候选仍在逐个检查。完成比较后，这里会显示原始均值、单位化均值和全部实际分数。</p> : <>
      <p>坐标、归一化结果和分数均来自当前固定示例的 Herding 计算；距离越小，候选均值越接近 μ<sub>full</sub>。</p>
      {HERDING_DEMO_ROUNDS.map((round) => <details key={round.k}>
        <summary>第 {round.k} 轮 · {round.candidates.length} 个未选候选</summary>
        <div className="p4-score-table" role="table" aria-label={`第 ${round.k} 轮候选坐标与得分`}>
          <div className="p4-score-table__head" role="row"><span>候选</span><span>原始均值</span><span>单位化均值</span><span>距离</span></div>
          {round.candidates.map((candidate) => <div role="row" key={candidate.point.id} className={candidate.point.id === round.chosen.id ? "is-chosen" : ""}>
            <span>{candidate.point.id}{candidate.point.id === round.chosen.id ? " · 选中" : ""}</span>
            <span>({format(candidate.rawPrefixMean[0])}, {format(candidate.rawPrefixMean[1])})</span>
            <span>({format(candidate.normalizedPrefixMean[0])}, {format(candidate.normalizedPrefixMean[1])})</span>
            <span>{format(candidate.score)}</span>
          </div>)}
        </div>
      </details>)}
      <p>完整类别原始均值：({format(HERDING_DEMO_TARGET_RAW[0])}, {format(HERDING_DEMO_TARGET_RAW[1])})；单位目标 μ<sub>full</sub>：({format(HERDING_DEMO_TARGET[0])}, {format(HERDING_DEMO_TARGET[1])})。</p>
    </>}
  </details>;
}

export function PageFour({ onContinue }: { onContinue?: () => void }) {
  const [flow, setFlow] = useState<FlowState>(() => initialFlow(0));
  const [playing, setPlaying] = useState(false);
  const [motionProgress, setMotionProgress] = useState(0);
  const motionProgressRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();
  const workbenchRef = useRef<HTMLElement | null>(null);
  const chapterJumpsRef = useRef<HTMLDetailsElement | null>(null);
  const roundIndex = flow.stage >= 1 && flow.stage <= 4 ? flow.stage - 1 : null;
  const round = roundIndex === null ? null : HERDING_DEMO_ROUNDS[roundIndex];
  const candidates = roundIndex === null ? [] : CANDIDATES_BY_ROUND[roundIndex];
  const candidate = candidates[flow.candidateIndex] ?? null;
  const stepCanPlay = flow.stage <= 4 && !flow.committed && !(flow.stage === 0 && flow.microStep >= 2);
  const slotCount = roundIndex === null ? flow.stage >= 5 ? flow.prefixCount : 0 : roundIndex + Number(flow.committed);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    if (!stepCanPlay) {
      setPlaying(false);
      return;
    }
    let frame = 0;
    const duration = (flow.stage === 2 || flow.stage === 3) && flow.candidateIndex === 0 ? 1500 : flow.stage === 0 ? 1000 : flow.stage === 4 ? 720 : 860;
    const tick = (time: number) => {
      if (startedAtRef.current === null) startedAtRef.current = time - motionProgressRef.current * duration;
      const next = clamp((time - startedAtRef.current) / duration);
      motionProgressRef.current = next;
      setMotionProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
      else {
        startedAtRef.current = null;
        motionProgressRef.current = 0;
        setMotionProgress(0);
        setFlow((current) => advanceFlow(current));
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [flow, playing, reducedMotion, stepCanPlay]);

  function resetMotion() {
    motionProgressRef.current = reducedMotion ? 1 : 0;
    setMotionProgress(reducedMotion ? 1 : 0);
    startedAtRef.current = null;
  }

  function changeStage(stage: number) {
    setPlaying(false);
    resetMotion();
    setFlow(initialFlow(stage));
    if (chapterJumpsRef.current) chapterJumpsRef.current.open = false;
    requestAnimationFrame(() => workbenchRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }));
  }

  function previous() {
    setPlaying(false);
    resetMotion();
    setFlow((current) => previousFlow(current));
  }

  function next() {
    setPlaying(false);
    resetMotion();
    if (flow.stage === 6 && flow.prefixCount === 3) {
      onContinue?.();
      return;
    }
    setFlow((current) => advanceFlow(current));
  }

  function replay() {
    setPlaying(false);
    resetMotion();
    setFlow(initialFlow(flow.stage));
    if (flow.stage <= 4 && !reducedMotion) setPlaying(true);
  }

  function togglePlayback() {
    if (playing) {
      setPlaying(false);
      startedAtRef.current = null;
    } else if (stepCanPlay && !reducedMotion) {
      startedAtRef.current = null;
      setPlaying(true);
    }
  }

  function focusWorkbench() {
    workbenchRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  const detailLabel = round
    ? flow.committed ? `第 ${round.k} 轮已完成 · p${round.k} = ${round.chosen.id}` : `候选 ${flow.candidateIndex + 1} / ${candidates.length}${candidate ? ` · ${candidate.point.id}` : ""}`
    : flow.stage === 0 ? `目标建立 · 微步 ${flow.microStep + 1} / 3`
    : flow.stage === 5 ? `正在检查前 ${flow.prefixCount} 项`
    : flow.prefixCount === 4 ? "每类保留四项" : "每类保留三项";
  const nextLabel = flow.stage === 6 && flow.prefixCount === 3 ? "进入第 5 页" : "下一步";

  return <article className="tutorial-page icarl-page icarl-page--p4">
    <header className="page-heading icarl-page__heading p4-intro">
      <div className="icarl-page__eyebrow"><span>PAGE 04</span><i /> EXEMPLAR SELECTION &amp; MANAGEMENT</div>
      <h1>怎样找到少量代表，<br className="p4-title-break" />并让它们共同代表整个类别？</h1>
      <p>已选 Exemplars 可以支持预测；现在回到一个新类别的完整训练数据仍可用的时候，看看怎样用少量样本逼近这个类别的整体特征，并在以后预算收紧时保留有用的顺序。</p>
      <button type="button" className="icarl-button icarl-button--primary p4-start-button" onClick={focusWorkbench}>开始演示 <b aria-hidden="true">↓</b></button>
    </header>

    <details className="p4-chapter-jumps" ref={chapterJumpsRef}>
      <summary>章节快速定位 · 7 个阶段</summary>
      <GuidedStepControls steps={steps} current={flow.stage} onChange={changeStage} label="Page 4 Herding 阶段快速定位" />
    </details>

    <section className="p4-workbench" aria-label="Herding 同屏教学工作台" data-stage={flow.stage} data-micro-step={flow.microStep} data-candidate-index={flow.candidateIndex} data-committed={flow.committed} data-motion-progress={motionProgress.toFixed(2)} ref={workbenchRef}>
      <header className="p4-workbench__heading">
        <div><span className="eyebrow">{flow.stage === 0 ? "BUILD THE CLASS TARGET" : flow.stage >= 5 ? "REVIEW THE ORDERED MEMORY" : `HERDING · ROUND ${flow.stage}`}</span><h2>{phaseTitles[flow.stage]}</h2><p aria-live="polite">{currentPrompt(flow, candidate)}</p></div>
        <span className="p4-workbench__phase">{playing ? `${Math.round(motionProgress * 100)}%` : `${String(flow.stage + 1).padStart(2, "0")} / 07`}</span>
      </header>

      <div className="p4-workbench__layout">
        <section className="panel p4-visual-panel">
          <div className="p4-panel-title"><div><span className="eyebrow">ONE FIXED FEATURE SPACE</span><h3>目标、候选与当前前缀</h3></div><span>‖z(x)‖₂ = 1</span></div>
          <div className="p4-chart-frame"><HerdingFeatureSpace flow={flow} candidate={candidate} motionProgress={reducedMotion ? 1 : motionProgress} /></div>
          <div className="p4-legend" aria-label="图形标记说明"><span><i className="p4-legend__point" />单位特征</span><span><i className="p4-legend__target">★</i>完整类别目标 μ<sub>full</sub></span><span><i className="p4-legend__mean" />当前前缀均值</span><span><i className="p4-legend__score" />到目标的比较距离</span></div>
        </section>

        <aside className="panel p4-guidance-panel" aria-live="polite">
          <div className="p4-panel-title"><div><span className="eyebrow">CURRENT CALCULATION</span><h3>{round ? `第 ${round.k} 轮 · ${flow.committed ? "已选结果" : "逐个检查候选"}` : flow.stage === 5 ? "有序前缀" : flow.stage === 6 ? "固定总预算 K" : "完整类别目标"}</h3></div>{round ? <span className="p4-k-badge">k = {round.k}</span> : null}</div>
          <div className="p4-current-formula" aria-label="当前公式">{currentFormula(flow, candidate)}</div>
          <p className="p4-current-reading">
            {flow.stage === 0 ? flow.microStep === 2 ? "目标概括完整类别的平均特征；它不是类别保存了全部信息。" : "这些样本经筛选时固定的特征提取器转成单位特征。" : null}
            {round && !flow.committed ? `当前正在查看 ${candidate?.point.id ?? "候选"}；扫描结束后才会揭示本轮选择。` : null}
            {round && flow.committed ? <>本轮选择 <b>p<sub>{round.k}</sub> = {round.chosen.id}</b>；该项由所有未选候选的实际分数决定。</> : null}
            {flow.stage === 5 ? <>前 {flow.prefixCount} 项是当初运行前 {flow.prefixCount} 轮的结果。贪心距离不保证逐轮变小，也不保证固定长度下的全局最优。</> : null}
            {flow.stage === 6 ? flow.prefixCount === 4 ? "类别从三个变成四个，每类名额由四个缩到三个。" : <>保留 <b>p₁ → p₂ → p₃</b>，只移除列表尾部 p₄；这时不再访问旧类的完整图片，也不重跑 Herding。</> : null}
          </p>
          {flow.stage === 5 ? <div className="p4-prefix-picker" role="group" aria-label="切换要回看的 Herding 前缀长度">{HERDING_DEMO_ROUNDS.map((item) => <button type="button" key={item.k} aria-pressed={flow.prefixCount === item.k} onClick={() => setFlow((current) => ({ ...current, prefixCount: item.k }))}>前 {item.k} 项</button>)}</div> : null}
          {flow.stage === 6 ? <div className="p4-budget-change"><span>总容量 K = 12</span><b>3 类 × 4 项 <i>→</i> 4 类 × 3 项</b></div> : null}
          <div className="p4-memory-heading"><b>有序 Exemplars</b><span>{slotCount} / 4</span></div>
          <OrderedSlots count={slotCount} tailVisible={flow.stage !== 6 || flow.prefixCount === 4} />
          <DistanceRuler flow={flow} candidates={candidates} motionProgress={reducedMotion ? 1 : motionProgress} />
          {flow.stage === 2 && flow.candidateIndex === 0 && !flow.committed ? <div className="p4-microstep-status"><span>{["标出两个端点", "贡献点从端点出发", "汇聚为中点", "单位化", "比较"][flow.microStep]}</span><b>微步 {flow.microStep + 1} / 5</b></div> : null}
          {flow.stage === 3 && flow.candidateIndex === 0 && !flow.committed ? <div className="p4-microstep-status"><span>{["标出三个端点", "贡献点从端点出发", "汇聚为三点重心", "单位化", "比较"][flow.microStep]}</span><b>微步 {flow.microStep + 1} / 5</b></div> : null}
        </aside>
      </div>

      <div className="p4-workbench__controls" aria-label="当前教学步骤控制">
        <button type="button" className="icarl-button icarl-button--quiet" onClick={previous} disabled={flow.stage === 0 && flow.microStep === 0}>上一步</button>
        <div className="p4-workbench__control-center">
          {flow.stage <= 4 && !flow.committed ? <button type="button" className="icarl-button icarl-button--quiet" onClick={togglePlayback} disabled={reducedMotion || !stepCanPlay}>{playing ? "暂停" : "自动播放"}</button> : null}
          <button type="button" className="icarl-button icarl-button--quiet" onClick={replay}>重播本阶段</button>
          <span aria-live="polite">{detailLabel}</span>
        </div>
        <button type="button" className="icarl-button icarl-button--primary" onClick={next} disabled={flow.stage === 6 && flow.prefixCount === 3 && !onContinue}>{nextLabel} <b aria-hidden="true">→</b></button>
      </div>
      {reducedMotion ? <p className="p4-motion-note">减少动态效果已开启：可用「下一步」逐步查看计算。</p> : null}
    </section>

    <CalculationDetails flow={flow} />
    <details className="p4-pseudocode"><summary>查看简短算法步骤</summary><div>
      <code>目标：μ<sub>full</sub> ← normalize(mean({`{ normalize(φ(x)) | x ∈ X_y }`}))</code>
      <code>对 k = 1…m，固定已有前缀 P<sub>k−1</sub></code>
      <code>对每个未选 x，计算 ν<sub>k</sub>(x) = normalize(mean(z(P<sub>k−1</sub>) ∪ z(x)))</code>
      <code>追加距离 μ<sub>full</sub> 最小的候选；每轮只追加一个样本</code>
    </div></details>
    <footer className="icarl-handoff p4-handoff"><div><span className="eyebrow">NEXT · PAGE 05</span><p>现在，我们已经知道怎样从完整类别数据中选出少量代表图片，也知道了如何在预算变紧时保留已有列表的前缀。它们已经承担了一项任务：通过类别原型支持之后的预测。可新的类别还会继续到来，特征提取器也需要不断更新。那么，这些保存下来的 Exemplars，能不能在训练时继续发挥作用？</p></div>{onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>进入第 5 页 · 让 Exemplars 参与更新 <b aria-hidden="true">→</b></button> : null}</footer>
  </article>;
}
