import { useLessonPlayback, PlaybackControls } from "./lesson-playback";
import { Term } from "../shared/core/reference/ReferenceHub";
import { P4_TOY_EXPERIMENT, P4_TRAINING_TRACE, runP4Forward } from "./prompt-tuning-demo";
import "./prompt-tuning.css";

type Pair = readonly [number, number];
type Matrix = readonly [Pair, Pair];
type ForwardState = NonNullable<ReturnType<typeof runP4Forward>>;
type AttentionRoute = {
  sourceIndex: number;
  kind: "query" | "value";
  from: Pair;
  controls: [Pair, Pair];
  to: Pair;
  length: number;
};
type TimedAttentionRoute = AttentionRoute & { startMs: number; travelMs: number; settleMs: number };
type CubicRoute = { from: Pair; controls: [Pair, Pair]; to: Pair };
type TimedGradientRoute = CubicRoute & { length: number; startMs: number; travelMs: number; settleMs: number };

const duration = 29_900;
const boundaries = [0, 2_300, 9_500, 11_800, 19_400, 21_700, 28_900, duration];
const phases = [
  { short: "组装输入", text: "P₀、P₁ 与固定的 [CLS]、Patch₁ 已组成同一输入；准备就绪后开始固定权重计算。" },
  { short: "冻结前向", text: "输入与计算图保持清晰；绿点先完成 P₀ 查询，抵达后紫点再逐项汇总加权值，随后显出读出与分类。" },
  { short: "分类与损失", text: "H₀、H₁ 汇成教学读出 h，经可训练分类头得到 Logits；标签 y=1 给出交叉熵。" },
  { short: "梯度回传", text: "梯度先从损失经过分类头与读出，再依次沿 H₀→P₀、H₁→P₁ 穿过冻结计算；φ 同样取得梯度。" },
  { short: "一次参数更新", text: "按一次 SGD 更新 P 与 φ。轨迹插值只呈现这一步的位移，不代表额外训练步。" },
  { short: "同图复算", text: "更新后的 P、φ 按相同顺序再次经过前向；输入 xₑ 与冻结计算保持原样。" },
  { short: "任务 B 接续", text: "下一任务可以继续使用并更新这同一组 P；这里不模拟任务 B 的梯度或遗忘数值。" },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function phaseAt(position: number) {
  if (position >= duration) return phases.length - 1;
  const index = boundaries.findIndex((start, offset) => offset < boundaries.length - 1
    && position >= start && position < boundaries[offset + 1]);
  return Math.max(0, index);
}

function phaseProgress(position: number, phase: number) {
  return clamp((position - boundaries[phase]) / (boundaries[phase + 1] - boundaries[phase]));
}

function cubicBezierProgress(progress: number) {
  const x = clamp(progress);
  const curve = (t: number, a: number, b: number) =>
    3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 16; iteration += 1) {
    const middle = (low + high) / 2;
    if (curve(middle, 0.77, 0.175) < x) low = middle;
    else high = middle;
  }
  return curve((low + high) / 2, 0, 1);
}

function interpolatePair(from: Pair, to: Pair, amount: number): Pair {
  return from.map((value, index) => value + (to[index] - value) * amount) as unknown as Pair;
}

function interpolateMatrix(from: Matrix, to: Matrix, amount: number): Matrix {
  return from.map((row, index) => interpolatePair(row, to[index], amount)) as unknown as Matrix;
}

function number(value: number) {
  return value.toFixed(3);
}

function pairText(values: Pair) {
  return "[" + number(values[0]) + ", " + number(values[1]) + "]";
}

function matrixText(values: Matrix) {
  return "[[" + number(values[0][0]) + ", " + number(values[0][1]) + "], ["
    + number(values[1][0]) + ", " + number(values[1][1]) + "]]";
}

function cubicPoint(from: Pair, control1: Pair, control2: Pair, to: Pair, progress: number): Pair {
  const t = clamp(progress);
  const inverse = 1 - t;
  return [0, 1].map(dimension =>
    inverse ** 3 * from[dimension]
      + 3 * inverse ** 2 * t * control1[dimension]
      + 3 * inverse * t ** 2 * control2[dimension]
      + t ** 3 * to[dimension],
  ) as unknown as Pair;
}

function cubicPath(from: Pair, control1: Pair, control2: Pair, to: Pair) {
  return "M" + from[0] + " " + from[1] + " C"
    + control1[0] + " " + control1[1] + " " + control2[0] + " " + control2[1]
    + " " + to[0] + " " + to[1];
}

function cubicLength(from: Pair, control1: Pair, control2: Pair, to: Pair) {
  const steps = 32;
  let previous = from;
  let length = 0;
  for (let step = 1; step <= steps; step += 1) {
    const point = cubicPoint(from, control1, control2, to, step / steps);
    length += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
    previous = point;
  }
  return length;
}

function cubicPointAtLengthFraction(
  from: Pair,
  control1: Pair,
  control2: Pair,
  to: Pair,
  progress: number,
  length: number,
): Pair {
  if (length <= 0) return from;
  const steps = 32;
  const targetDistance = clamp(progress) * length;
  let previous = from;
  let travelled = 0;
  for (let step = 1; step <= steps; step += 1) {
    const point = cubicPoint(from, control1, control2, to, step / steps);
    const segmentLength = Math.hypot(point[0] - previous[0], point[1] - previous[1]);
    if (travelled + segmentLength >= targetDistance && segmentLength > 0) {
      const segmentProgress = clamp((targetDistance - travelled) / segmentLength);
      const curveProgress = (step - 1 + segmentProgress) / steps;
      return cubicPoint(from, control1, control2, to, curveProgress);
    }
    travelled += segmentLength;
    previous = point;
  }
  return to;
}

const promptGradientReturnRoutes: CubicRoute[] = [
  { from: [164, 105], controls: [[228, 104], [342, 88]], to: [402, 91] },
  { from: [579, 220], controls: [[520, 246], [260, 246]], to: [164, 157] },
];
const querySourceRoute = {
  from: [164, 105] as Pair,
  controls: [[176, 105], [192, 139]] as [Pair, Pair],
  to: [208, 151] as Pair,
};
const downstreamRoutes = [
  { from: [538, 153] as Pair, controls: [[542, 153], [546, 153]] as [Pair, Pair], to: [550, 153] as Pair },
  { from: [579, 153] as Pair, controls: [[585, 153], [588, 122]] as [Pair, Pair], to: [598, 126] as Pair },
  { from: [579, 220] as Pair, controls: [[585, 220], [592, 220]] as [Pair, Pair], to: [598, 220] as Pair },
  { from: [724, 126] as Pair, controls: [[738, 126], [740, 147]] as [Pair, Pair], to: [750, 156] as Pair },
  { from: [724, 220] as Pair, controls: [[738, 220], [740, 197]] as [Pair, Pair], to: [750, 188] as Pair },
  { from: [828, 173] as Pair, controls: [[832, 173], [837, 173]] as [Pair, Pair], to: [841, 173] as Pair },
  { from: [944, 173] as Pair, controls: [[952, 173], [960, 173]] as [Pair, Pair], to: [970, 173] as Pair },
];

function reverseCubicRoute(route: CubicRoute): CubicRoute {
  return { from: route.to, controls: [route.controls[1], route.controls[0]], to: route.from };
}

function PromptLearningStage({
  state,
  phase,
  position,
  prompt,
  updateProgress,
  forwardTimeline,
  gradientTimeline,
}: {
  state: ForwardState;
  phase: number;
  position: number;
  prompt: Matrix;
  updateProgress: number;
  forwardTimeline: number;
  gradientTimeline: number;
}) {
  const setupProgress = phase === 0 ? cubicBezierProgress(phaseProgress(position, 0)) : 1;
  const inputRows = [84, 136, 188, 240];
  const names = ["P₀", "P₁", "[CLS]", "Patch₁"];
  const colors = ["prompt", "prompt", "image", "image"];
  const forwardActive = phase === 1 || phase === 5;
  const sourceY = [91, 133, 175, 217];
  const queryOrigin: Pair = [354, 151];
  const valueTargets: Pair[] = [[474, 134], [467, 146], [467, 160], [474, 172]];
  const attentionRoutes: AttentionRoute[] = sourceY.flatMap((y, sourceIndex) => {
    const routes = [
      {
        sourceIndex,
        kind: "query" as const,
        from: queryOrigin,
        controls: [[364, queryOrigin[1]], [368, y + (y < queryOrigin[1] ? 11 : -11)]] as [Pair, Pair],
        to: [375, y] as Pair,
      },
      {
        sourceIndex,
        kind: "value" as const,
        from: [427, y] as Pair,
        controls: [[435, y], [valueTargets[sourceIndex][0] - 12, valueTargets[sourceIndex][1] + (sourceIndex < 2 ? -12 : 12)]] as [Pair, Pair],
        to: valueTargets[sourceIndex],
      },
    ];
    return routes.map(route => ({ ...route, length: cubicLength(route.from, route.controls[0], route.controls[1], route.to) }));
  });
  const querySourceMotion: AttentionRoute = {
    sourceIndex: -1,
    kind: "query",
    ...querySourceRoute,
    length: cubicLength(querySourceRoute.from, querySourceRoute.controls[0], querySourceRoute.controls[1], querySourceRoute.to),
  };
  const focusDurationMs = 520;
  const beadSpeed = 130;
  let eventCursorMs = focusDurationMs;
  const timedRoutes: TimedAttentionRoute[] = [querySourceMotion, ...attentionRoutes].map(route => {
    const travelMs = route.length / beadSpeed * 1_000;
    const settleMs = route.kind === "query" ? 130 : 100;
    const event = { ...route, startMs: eventCursorMs, travelMs, settleMs };
    eventCursorMs += travelMs + settleMs;
    return event;
  });
  const attentionEndMs = eventCursorMs;
  const gradientRouteDefinitions = [
    reverseCubicRoute(downstreamRoutes[6]),
    reverseCubicRoute(downstreamRoutes[5]),
    reverseCubicRoute(downstreamRoutes[3]),
    reverseCubicRoute(downstreamRoutes[1]),
    reverseCubicRoute(downstreamRoutes[0]),
    reverseCubicRoute(attentionRoutes[1]),
    reverseCubicRoute(promptGradientReturnRoutes[0]),
    reverseCubicRoute(downstreamRoutes[4]),
    reverseCubicRoute(downstreamRoutes[2]),
    reverseCubicRoute(promptGradientReturnRoutes[1]),
  ];
  const gradientDurationMs = boundaries[4] - boundaries[3];
  const gradientElapsedMs = gradientTimeline * gradientDurationMs;
  let gradientCursorMs = 0;
  const gradientRoutes: TimedGradientRoute[] = gradientRouteDefinitions.map(route => {
    const length = cubicLength(route.from, route.controls[0], route.controls[1], route.to);
    const travelMs = length / 145 * 1_000;
    const settleMs = 75;
    const event = { ...route, length, startMs: gradientCursorMs, travelMs, settleMs };
    gradientCursorMs += travelMs + settleMs;
    return event;
  });
  const gradientRouteComplete = (index: number) => phase > 3
    || phase === 3 && gradientElapsedMs >= gradientRoutes[index].startMs + gradientRoutes[index].travelMs + gradientRoutes[index].settleMs;
  const gradientRouteStarted = (index: number) => phase > 3
    || phase === 3 && gradientElapsedMs >= gradientRoutes[index].startMs;
  const activeGradientRoute = phase === 3
    ? gradientRoutes.find(route => gradientElapsedMs >= route.startMs
      && gradientElapsedMs < route.startMs + route.travelMs + route.settleMs) ?? null
    : null;
  const activeGradientRouteProgress = activeGradientRoute
    ? clamp((gradientElapsedMs - activeGradientRoute.startMs) / activeGradientRoute.travelMs)
    : 0;
  const activeGradientRoutePoint = activeGradientRoute
    ? cubicPointAtLengthFraction(
      activeGradientRoute.from,
      activeGradientRoute.controls[0],
      activeGradientRoute.controls[1],
      activeGradientRoute.to,
      activeGradientRouteProgress,
      activeGradientRoute.length,
    )
    : null;
  const promptGradientReceived = [gradientRouteComplete(6), gradientRouteComplete(9)];
  const forwardDurationMs = boundaries[2] - boundaries[1];
  const forwardElapsedMs = forwardActive ? forwardTimeline * forwardDurationMs : 0;
  const activeEvent = forwardActive
    ? timedRoutes.find(event => forwardElapsedMs >= event.startMs && forwardElapsedMs < event.startMs + event.travelMs + event.settleMs) ?? null
    : null;
  const activeEventProgress = activeEvent ? clamp((forwardElapsedMs - activeEvent.startMs) / activeEvent.travelMs) : 0;
  const activeEventPoint = activeEvent
    ? cubicPointAtLengthFraction(
      activeEvent.from,
      activeEvent.controls[0],
      activeEvent.controls[1],
      activeEvent.to,
      activeEventProgress,
      activeEvent.length,
    )
    : null;
  const routeOpacity = (event: TimedAttentionRoute) => {
    if (phase === 3) return 0.24;
    if (!forwardActive) return phase === 0 ? 0.4 : 1;
    if (forwardElapsedMs < event.startMs) return 0.09;
    if (forwardElapsedMs < event.startMs + event.travelMs + event.settleMs) return 0.82;
    return 0.42;
  };
  const attentionProgress = forwardActive
    ? clamp((forwardElapsedMs - focusDurationMs) / Math.max(1, attentionEndMs - focusDurationMs))
    : phase === 0 ? 0.52 : phase === 3 ? 0.72 : 1;
  const outputReveal = (stage: number) => {
    if (phase === 3) {
      if (stage === 0) return gradientRouteStarted(2) ? 0.9 : 0.66;
      if (stage === 1) return gradientRouteStarted(7) ? 0.9 : 0.66;
      if (stage === 2) return 0.78;
      if (stage === 3) return gradientRouteStarted(0) ? 0.9 : 0.76;
      return 0.92;
    }
    if (!forwardActive) return phase === 0 ? 0.46 : 1;
    const startMs = attentionEndMs + 100 + stage * 230;
    return 0.12 + 0.88 * clamp((forwardElapsedMs - startMs) / 220);
  };
  const promptOutputOpacity = [outputReveal(0), outputReveal(1)];
  const readoutOpacity = outputReveal(2);
  const classifierOpacity = outputReveal(3);
  const lossOpacity = outputReveal(4);
  const afterForward = phase === 5 && lossOpacity >= 0.99 || phase === 6;
  const currentLoss = state.loss;
  const inputTokenValues = state.inputTokens;
  const classifierWeightBefore = P4_TOY_EXPERIMENT.classifier.weights[0][0];
  const classifierWeightAfter = P4_TRAINING_TRACE.updatedClassifierWeights[0][0];
  const classifierWeightCurrent = classifierWeightBefore + (classifierWeightAfter - classifierWeightBefore) * updateProgress;
  const classifierMarkerX = 868 + clamp((classifierWeightCurrent - 0.25) / 0.25) * 270;

  return <div className="p4-stage-scroll" role="group" aria-label="Prompt 调优的统一计算舞台">
    <svg
      className="p4-stage-svg"
      viewBox="0 0 1180 468"
      role="img"
      aria-labelledby="p4-stage-title p4-stage-desc"
    >
      <title id="p4-stage-title">同一组 Prompt 进入冻结计算，接收梯度并更新</title>
      <desc id="p4-stage-desc">左侧显示 P₀、P₁ 与固定图像 Token，中间展示固定 Attention 运算，右侧展示 Prompt 输出、均值读出、分类头和损失。反向阶段沿同一舞台回到 Prompt，只有 Prompt 与分类头的参数更新。</desc>
      <defs>
        <marker id="p4-flow-arrow" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L5 2.5L0 5Z" fill="#718b78" /></marker>
        <marker id="p4-gradient-arrow" markerWidth="5.5" markerHeight="5.5" refX="5" refY="2.75" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L5.5 2.75L0 5.5Z" fill="#745887" /></marker>
      </defs>

      <text className="p4-zone-label" x="24" y="28">输入与可学习参数</text>
      <text className="p4-zone-sub" x="24" y="47">P₀、P₁ 同属一个 Prompt</text>
      <text className="p4-zone-label" x="194" y="28">冻结的前向计算 fᵣ</text>
      <text className="p4-zone-sub" x="194" y="47">单头 Attention 教学模型 · 参数固定</text>
      <text className="p4-zone-label" x="598" y="28">Prompt 位置输出</text>
      <text className="p4-zone-label" x="742" y="28">教学读出</text>
      <text className="p4-zone-label" x="836" y="28">可训练分类头 φ</text>
      <text className="p4-zone-label" x="978" y="28">标签与损失</text>

      <path d="M20 58H171V284H20Z" className="p4-input-frame" />
      <text className="p4-frame-caption" x="31" y="73">xₚ = [P₀; P₁; xₑ]</text>
      {inputRows.map((row, index) => {
        const isPrompt = index < 2;
        const y = row;
        const vector = isPrompt ? prompt[index] : inputTokenValues[index];
        return <g key={names[index]} className={"p4-token-card p4-token-card--" + colors[index]}>
          <rect x="28" y={y} width="136" height="43" rx="9" />
          <text className="p4-token-label" x="39" y={y + 17}>{names[index]}</text>
          <text className="p4-token-value" x="39" y={y + 34}>{pairText(vector)}</text>
          {isPrompt && phase >= 3 && <text className="p4-token-state" x="111" y={y + 16}>{phase >= 4 ? "可更新" : promptGradientReceived[index] ? `∇P${index}` : ""}</text>}
        </g>;
      })}

      <rect x="192" y="58" width="387" height="246" rx="15" className="p4-encoder-frame" />
      <text className="p4-encoder-title" x="209" y="78">固定权重仍执行计算</text>
      <g className="p4-lock-badge">
        <rect x="488" y="64" width="77" height="25" rx="12" />
        <path d="M501 77v-3a4 4 0 0 1 8 0v3m-9 0h10v7h-10z" />
        <text x="514" y="81">冻结</text>
      </g>

      {[0, 1].map(index => <path
        key={"input-flow-" + index}
        d={"M164 " + (inputRows[index] + 21) + "H192"}
        className={index === 0 ? "p4-input-link p4-input-link--prompt" : "p4-input-link"}
        markerEnd="url(#p4-flow-arrow)"
        opacity={phase === 3 ? 0.16 : setupProgress}
      />)}
      {[2, 3].map(index => <path key={"image-flow-" + index} d={"M164 " + (inputRows[index] + 21) + "H192"} className="p4-input-link p4-input-link--image" markerEnd="url(#p4-flow-arrow)" opacity={phase === 3 ? 0.16 : 1} />)}

      <g className="p4-query-node" style={{ opacity: 0.25 + attentionProgress * 0.75 }}>
        <rect x="208" y="124" width="146" height="55" rx="10" />
        <text className="p4-node-title" x="218" y="143">Q₀ ← P₀</text>
        <text className="p4-node-value" x="218" y="162">{pairText(state.firstPromptQuery)}</text>
      </g>
      <path d={cubicPath(querySourceRoute.from, querySourceRoute.controls[0], querySourceRoute.controls[1], querySourceRoute.to)} className="p4-query-source" markerEnd="url(#p4-flow-arrow)" opacity={routeOpacity(timedRoutes[0])} />

      {sourceY.map((y, index) => {
        const attention = state.firstPromptAttention[index];
        const queryEvent = timedRoutes[index * 2 + 1];
        const valueEvent = timedRoutes[index * 2 + 2];
        const sourceActive = forwardActive && forwardElapsedMs >= queryEvent.startMs
          && forwardElapsedMs < valueEvent.startMs + valueEvent.travelMs + valueEvent.settleMs;
        const sourceDone = forwardActive && forwardElapsedMs >= valueEvent.startMs + valueEvent.travelMs + valueEvent.settleMs;
        const sourceLabel = ["P₀", "P₁", "[CLS]", "Patch₁"][index];
        return <g key={"attention-source-" + index}>
          <g className="p4-source-chip" style={{ opacity: forwardActive ? sourceActive ? 0.98 : sourceDone ? 0.6 : 0.36 : 0.34 + attentionProgress * 0.66 }}>
            <rect x="375" y={y - 15} width="52" height="30" rx="8" />
            <text x="401" y={y - 3} textAnchor="middle">{sourceLabel}</text>
            <text className="p4-alpha" x="401" y={y + 11} textAnchor="middle">α={number(attention)}</text>
          </g>
        </g>;
      })}

      <g className="p4-sum-node" style={{ opacity: 0.28 + attentionProgress * 0.72 }}>
        <rect x="430" y="124" width="108" height="58" rx="13" />
        <text x="484" y="148" textAnchor="middle">Σ αV</text>
        <text className="p4-node-value" x="484" y="165" textAnchor="middle">{pairText(state.firstPromptContext)}</text>
      </g>
      <g className="p4-frozen-projection">
        <rect x="550" y="133" width="29" height="40" rx="7" />
        <text x="564" y="150" textAnchor="middle">W</text>
        <text x="564" y="163" textAnchor="middle">O</text>
      </g>
      <text className="p4-compute-caption" x="209" y="265">局部展开 P₀；P₁ 也经过同一冻结运算</text>
      <text className="p4-compute-caption" x="209" y="283">反向导数通过 fᵣ，权重锚点保持不动</text>

      {[0, 1].map(index => {
        const output = state.promptOutputs[index];
        const y = index === 0 ? 101 : 194;
        return <g key={"prompt-output-" + index} className="p4-output-token" style={{ opacity: promptOutputOpacity[index] }}>
          <rect x="598" y={y} width="126" height="51" rx="10" />
          <text className="p4-token-label" x="610" y={y + 20}>H{index} ← P{index}</text>
          <text className="p4-token-value" x="610" y={y + 38}>{pairText(output)}</text>
        </g>;
      })}

      <g className="p4-readout-node" style={{ opacity: readoutOpacity }}>
        <rect x="750" y="143" width="78" height="59" rx="10" />
        <text className="p4-node-title" x="789" y="163" textAnchor="middle">h</text>
        <text className="p4-node-value p4-readout-equation" x="789" y="181" textAnchor="middle">½(H₀+H₁)</text>
        <text className="p4-node-value" x="789" y="194" textAnchor="middle">{pairText(state.promptReadout)}</text>
      </g>
      <g className="p4-classifier-node" style={{ opacity: classifierOpacity }}>
        <rect x="841" y="135" width="103" height="76" rx="11" />
        <text className="p4-classifier-mark" x="892" y="160" textAnchor="middle">gφ</text>
        <text className="p4-classifier-copy" x="892" y="178" textAnchor="middle">Wcls · bcls</text>
        <text className="p4-trainable-tag" x="892" y="196" textAnchor="middle">可训练</text>
      </g>
      <g className="p4-loss-node" style={{ opacity: lossOpacity }}>
        <rect x="970" y="119" width="190" height="111" rx="12" />
        <text className="p4-loss-title" x="984" y="139">分类结果 · y=1</text>
        <text className="p4-loss-value" x="984" y="160">z = [{number(state.logits[0])}, {number(state.logits[1])}]</text>
        <text className="p4-loss-value" x="984" y="180">softmax = [{number(state.probabilities[0])}, {number(state.probabilities[1])}]</text>
        <path d="M984 191H1147" className="p4-loss-divider" />
        <text className="p4-loss-final" x="984" y="213">CE = {number(currentLoss)}</text>
      </g>

      <g className="p4-forward-connectors">
        {sourceY.map((_, index) => {
          const route = attentionRoutes[index * 2];
          return <path
            key={"query-link-" + index}
            d={cubicPath(route.from, route.controls[0], route.controls[1], route.to)}
            className="p4-attention-link"
            markerEnd="url(#p4-flow-arrow)"
            style={{ opacity: routeOpacity(timedRoutes[index * 2 + 1]), strokeWidth: 0.8 + state.firstPromptAttention[index] * 3.4 }}
          />;
        })}
        {sourceY.map((_, index) => <path
          key={"value-link-" + index}
          d={cubicPath(attentionRoutes[index * 2 + 1].from, attentionRoutes[index * 2 + 1].controls[0], attentionRoutes[index * 2 + 1].controls[1], attentionRoutes[index * 2 + 1].to)}
          className="p4-value-link"
          markerEnd="url(#p4-flow-arrow)"
          style={{ opacity: routeOpacity(timedRoutes[index * 2 + 2]), strokeWidth: 0.8 + state.firstPromptAttention[index] * 2.3 }}
        />)}
        <path d={cubicPath(downstreamRoutes[0].from, downstreamRoutes[0].controls[0], downstreamRoutes[0].controls[1], downstreamRoutes[0].to)} className="p4-operator-link" markerEnd="url(#p4-flow-arrow)" style={{ opacity: phase === 3 ? 0.24 : attentionProgress }} />
        {downstreamRoutes.slice(1).map((route, index) => <path
          key={"downstream-link-" + index}
          d={cubicPath(route.from, route.controls[0], route.controls[1], route.to)}
          className={index === 1 ? "p4-output-link p4-output-link--secondary" : index > 1 ? "p4-readout-link" : "p4-output-link"}
          markerEnd="url(#p4-flow-arrow)"
          style={{ opacity: phase === 3 ? 0.24 : [attentionProgress, promptOutputOpacity[0], promptOutputOpacity[1], readoutOpacity, readoutOpacity, classifierOpacity, lossOpacity][index + 1] }}
        />)}
      </g>
      {activeEvent && activeEventPoint && <circle
        className={activeEvent.kind === "value" ? "p4-value-bead" : "p4-flow-bead"}
        cx={activeEventPoint[0]}
        cy={activeEventPoint[1]}
        r="4.2"
      />}
      {phase >= 5 && <g className="p4-loss-compare">
        <text x="970" y="250">同图对照</text>
        <text x="970" y="267">更新前 ℒ⁰ = {number(P4_TRAINING_TRACE.initial.loss)}</text>
        <text x="970" y="284" style={{ opacity: afterForward ? 1 : 0.38 }}>更新后 ℒ¹ = {number(P4_TRAINING_TRACE.updated.loss)}</text>
      </g>}

      {phase === 3 && <>
        {gradientRoutes.map((route, index) => gradientRouteComplete(index) && <path
          key={"gradient-history-" + index}
          d={cubicPath(route.from, route.controls[0], route.controls[1], route.to)}
          className="p4-gradient-history-route"
          markerEnd="url(#p4-gradient-arrow)"
        />)}
        {activeGradientRoute && <path
          d={cubicPath(activeGradientRoute.from, activeGradientRoute.controls[0], activeGradientRoute.controls[1], activeGradientRoute.to)}
          className="p4-gradient-route"
          markerEnd="url(#p4-gradient-arrow)"
        />}
        {activeGradientRoutePoint && <circle className="p4-gradient-bead" cx={activeGradientRoutePoint[0]} cy={activeGradientRoutePoint[1]} r="4" />}
        {gradientRouteComplete(0) && <>
          <path d="M892 229V211" className="p4-gradient-branch" markerEnd="url(#p4-gradient-arrow)" />
          <text className="p4-gradient-label" x="918" y="226" textAnchor="middle">∇φ</text>
        </>}
      </>}

      <path d="M20 313H220" className="p4-divider" />
      <g style={{ opacity: clamp((setupProgress - 0.8) / 0.2) }}>
        <text className="p4-mini-title" x="24" y="331">Prompt 参数变化</text>
        <text className="p4-parameter-caption" x="24" y="347">旧值与当前值 · 实际坐标</text>
        {[0, 1].map(index => {
          const updated = P4_TRAINING_TRACE.updatedPrompt[index];
          const original = P4_TOY_EXPERIMENT.prompt[index];
          const current = interpolatePair(original, updated, updateProgress);
          const row = index === 0 ? 370 : 411;
          return <g key={"parameter-position-" + index} className="p4-parameter-readout">
            <text className="p4-parameter-label" x="24" y={row}>P{index}</text>
            <text className="p4-parameter-value" x="52" y={row - 7}>旧 {pairText(original)}</text>
            <text className="p4-parameter-value p4-parameter-value--current" x="52" y={row + 9}>现 {pairText(current)}</text>
          </g>;
        })}
      </g>

      <rect x="242" y="320" width="366" height="119" rx="12" className="p4-freeze-summary" />
      <text className="p4-mini-title" x="260" y="344">被冻结的 fₑ、fᵣ</text>
      <g className="p4-freeze-icons">
        <rect x="260" y="358" width="86" height="34" rx="8" />
        <text x="303" y="380" textAnchor="middle">WQ · WK</text>
        <rect x="355" y="358" width="86" height="34" rx="8" />
        <text x="398" y="380" textAnchor="middle">WV · WO</text>
        <path d="M456 375H490" />
        <circle cx="500" cy="375" r="10" />
        <path d="M496 375h8m-4-4v8" />
      </g>
      <text className="p4-freeze-copy" x="260" y="414">梯度可穿过运算；冻结权重不进入更新</text>
      <text className="p4-freeze-copy" x="260" y="429">xₑ 已由固定 fₑ 得到，本轮保持不变</text>

      <rect x="622" y="320" width="538" height="119" rx="12" className="p4-phi-summary" />
      <text className="p4-mini-title" x="642" y="344">分类头 φ 也随这一步更新</text>
      <text className="p4-phi-label" x="642" y="370">示例系数 Wcls[0,0]</text>
      <path d="M868 374H1138" className="p4-classifier-axis" />
      <path d={"M" + (868 + clamp((classifierWeightBefore - 0.25) / 0.25) * 270) + " 374H" + classifierMarkerX} className="p4-classifier-trail" />
      <circle cx={868 + clamp((classifierWeightBefore - 0.25) / 0.25) * 270} cy="374" r="4.4" className="p4-parameter-origin" />
      <circle cx={classifierMarkerX} cy="374" r="4.8" className="p4-classifier-current" />
      <text className="p4-phi-value" x="642" y="398">W⁰={number(classifierWeightBefore)} → 当前 {number(classifierWeightCurrent)}</text>
      <text className="p4-phi-value" x="642" y="419">{phase >= 5 ? "同一 xₑ 与 fᵣ · 已重跑前向" : "完整矩阵与偏置变化见计算详情"}</text>
      <text className="p4-phi-scale" x="868" y="398">0.25</text>
      <text className="p4-phi-scale" x="1124" y="398">0.50</text>

      {phase === 6 && <g className="p4-task-handoff">
        <rect x="242" y="444" width="918" height="18" rx="8" />
        <text x="254" y="457">任务 A 已更新的同一组 P → 任务 B 可继续写入；跨任务干扰是待解决的可能性</text>
      </g>}
    </svg>
  </div>;
}

function TraceDetails({ state }: { state: ForwardState }) {
  const initial = P4_TRAINING_TRACE.initial;
  const updated = P4_TRAINING_TRACE.updated;
  const experiment = P4_TOY_EXPERIMENT;
  return <details className="p4-trace-details">
    <summary>展开同一份教学 Trace 的计算细节</summary>
    <p>以下二维数值、Logits、损失、梯度与更新都来自一个前向/反向计算图；它们是可复算教学值，不是预训练 ViT 的隐藏状态或论文实验结果。</p>
    <div className="p4-detail-grid">
      <section>
        <h4>固定运算与输入</h4>
        <p>Prompt 初值：<code>{matrixText(experiment.prompt)}</code></p>
        <p>图像 Token：<code>{matrixText(experiment.imageTokens)}</code></p>
        <p>WQ：<code>{matrixText(experiment.frozenWeights.wq)}</code></p>
        <p>WK：<code>{matrixText(experiment.frozenWeights.wk)}</code></p>
        <p>WV：<code>{matrixText(experiment.frozenWeights.wv)}</code></p>
        <p>WO：<code>{matrixText(experiment.frozenWeights.wo)}</code></p>
      </section>
      <section>
        <h4>首个 Prompt 的 Attention</h4>
        <p>Q₀：<code>{pairText(initial.firstPromptQuery)}</code></p>
        <p>K₀…K₃：<code>{initial.keys.map(pairText).join(" · ")}</code></p>
        <p>V₀…V₃：<code>{initial.values.map(pairText).join(" · ")}</code></p>
        <p>α₀…α₃：<code>{initial.firstPromptAttention.map(number).join(" · ")}</code></p>
        <p>Σ αV：<code>{pairText(initial.firstPromptContext)}</code></p>
        <p>当前 H₀：<code>{pairText(state.firstPromptOutput)}</code></p>
      </section>
      <section>
        <h4>分类与损失</h4>
        <p>读出 h：<code>{pairText(initial.promptReadout)}</code></p>
        <p>Logits：<code>{pairText(initial.logits)}</code></p>
        <p>Softmax：<code>{pairText(initial.probabilities)}</code></p>
        <p>标签 y：<code>{experiment.label}</code>；交叉熵：<code>{number(initial.loss)}</code></p>
        <p>更新后 Logits：<code>{pairText(updated.logits)}</code></p>
        <p>更新后损失：<code>{number(updated.loss)}</code></p>
        <p>Wcls⁰：<code>{matrixText(experiment.classifier.weights)}</code></p>
        <p>Wcls¹：<code>{matrixText(P4_TRAINING_TRACE.updatedClassifierWeights)}</code></p>
        <p>bcls⁰：<code>{pairText(experiment.classifier.bias)}</code>；bcls¹：<code>{pairText(P4_TRAINING_TRACE.updatedClassifierBias)}</code></p>
      </section>
      <section>
        <h4>梯度与一次 SGD</h4>
        <p>∇Pℒ：<code>{matrixText(P4_TRAINING_TRACE.promptGradients)}</code></p>
        <p>P¹：<code>{matrixText(P4_TRAINING_TRACE.updatedPrompt)}</code></p>
        <p>∇Wclsℒ：<code>{matrixText(P4_TRAINING_TRACE.classifierWeightGradients)}</code></p>
        <p>∇bclsℒ：<code>{pairText(P4_TRAINING_TRACE.classifierBiasGradients)}</code></p>
        <p>学习率 η：<code>{number(experiment.learningRate)}</code></p>
        <p>中心差分梯度校验最大误差：<code>{P4_TRAINING_TRACE.gradientCheck.maxAbsoluteError.toExponential(2)}</code>（ε={P4_TRAINING_TRACE.gradientCheck.epsilon}）</p>
      </section>
    </div>
  </details>;
}

export function PromptTuning() {
  const playback = useLessonPlayback(duration);
  const activePhase = phaseAt(playback.position);
  const updateProgress = activePhase === 4
    ? cubicBezierProgress(phaseProgress(playback.position, 4))
    : activePhase > 4 ? 1 : 0;
  const currentPrompt = interpolateMatrix(P4_TOY_EXPERIMENT.prompt, P4_TRAINING_TRACE.updatedPrompt, updateProgress);
  const currentClassifierWeights = interpolateMatrix(
    P4_TOY_EXPERIMENT.classifier.weights,
    P4_TRAINING_TRACE.updatedClassifierWeights,
    updateProgress,
  );
  const currentClassifierBias = interpolatePair(
    P4_TOY_EXPERIMENT.classifier.bias,
    P4_TRAINING_TRACE.updatedClassifierBias,
    updateProgress,
  );
  const forwardTimeline = activePhase === 1 || activePhase === 5
    ? phaseProgress(playback.position, activePhase)
    : 0;
  const gradientTimeline = activePhase === 3 ? phaseProgress(playback.position, 3) : 0;
  const currentState = activePhase === 4
    ? runP4Forward(currentPrompt, currentClassifierWeights, currentClassifierBias)
    : activePhase >= 5 ? P4_TRAINING_TRACE.updated : P4_TRAINING_TRACE.initial;

  return <>
    <p className="lesson-lead">P3 的对照说明：即使 Transformer 参数固定，额外 Token 仍能改变它的输出。接下来要问的是，这个 Token 能否从给定向量变成可学习参数，让任务损失告诉我们该怎样调整？这就是 <Term id="prompt-tuning">Prompt Tuning</Term> 要追踪的训练入口。</p>

    <section className="explain-section">
      <h3>Prompt 是加在图像序列前端的一组向量</h3>
      <p>沿用 P2 得到的图像嵌入 <math><msub><mi>x</mi><mi>e</mi></msub></math>，把同一组可学习的 <Term id="prompt-token">Prompt Token</Term> 接到序列前端。<math><msub><mi>L</mi><mi>p</mi></msub></math> 表示 Prompt 位置数，<math><mi>L</mi></math> 表示图像 Token 数，<math><mi>D</mi></math> 是每个位置的向量宽度；拼接增加位置，不改变宽度。</p>
      <div className="p4-shape-equations">
        <math display="block"><mi>P</mi><mo>∈</mo><msup><mi>ℝ</mi><mrow><msub><mi>L</mi><mi>p</mi></msub><mo>×</mo><mi>D</mi></mrow></msup><mo>,</mo><msub><mi>x</mi><mi>p</mi></msub><mo>=</mo><mo>[</mo><mi>P</mi><mo>;</mo><msub><mi>x</mi><mi>e</mi></msub><mo>]</mo></math>
        <math display="block"><msub><mi>x</mi><mi>p</mi></msub><mo>∈</mo><msup><mi>ℝ</mi><mrow><mo>(</mo><msub><mi>L</mi><mi>p</mi></msub><mo>+</mo><mi>L</mi><mo>)</mo><mo>×</mo><mi>D</mi></mrow></msup><mo>,</mo><mi>H</mi><mo>=</mo><msub><mi>f</mi><mi>r</mi></msub><mo>(</mo><msub><mi>x</mi><mi>p</mi></msub><mo>)</mo></math>
      </div>
      <div className="p4-specimen-board" role="group" aria-label="Prompt 参数与固定图像 Token 组成的输入序列">
        <div className="p4-specimen-source p4-specimen-source--prompt">
          <div className="p4-specimen-source__heading"><strong>可学习前缀 P</strong><span>训练时写入</span></div>
          <div className="p4-vector-specimens">
            {P4_TOY_EXPERIMENT.prompt.map((vector, index) => <div className="p4-vector-specimen" key={index}>
              <b>P<sub>{index}</sub></b><code>{pairText(vector)}</code><span>Prompt</span>
            </div>)}
          </div>
        </div>
        <div className="p4-specimen-source p4-specimen-source--image">
          <div className="p4-specimen-source__heading"><strong>固定图像 Token xₑ</strong><span>沿用 P2 的嵌入</span></div>
          <div className="p4-vector-specimens">
            {P4_TOY_EXPERIMENT.imageTokens.map((vector, index) => <div className="p4-vector-specimen" key={index}>
              <b>{index === 0 ? "[CLS]" : "Patch₁"}</b><code>{pairText(vector)}</code><span>图像</span>
            </div>)}
          </div>
        </div>
        <div className="p4-sequence-specimen">
          <strong>xₚ</strong>
          <div className="p4-sequence-specimen__slots" aria-label="P0、P1、CLS、Patch1 的顺序">
            <span>P₀</span><span>P₁</span><i aria-hidden="true" /><span>[CLS]</span><span>Patch₁</span>
          </div>
          <code>(Lₚ + L) × D = 4 × 2</code>
        </div>
      </div>
      <p>在 P2 的 ViT-B/16 参照中，图像序列为 <span className="lesson-number">197</span>×<span className="lesson-number lesson-number--width">768</span>；加两枚 Prompt Token 后成为 199×768。下面的教学 Trace 缩到 Lₚ=2、L=2、D=2，让每个参数的变化都能读出来。P₀、P₁ 是同一组 Prompt 的两个位置；Prompt Pool 的检索留到 P5。</p>

      <h3>这组输入怎样走到分类损失？</h3>
      <p>拼好的序列 <math><msub><mi>x</mi><mi>p</mi></msub></math> 进入同一个冻结前向计算 <math><msub><mi>f</mi><mi>r</mi></msub></math>。我们只读出两个 Prompt 位置的输出并取平均，再交给可训练分类头 <math><msub><mi>g</mi><mi>φ</mi></msub></math>；分类结果与标签 <math><mi>y</mi></math> 比较后得到损失。冻结表示主干参数不写回，前向计算仍会正常执行。</p>
      <div className="p4-forward-equations" aria-label="从冻结前向到分类损失的教学计算路径">
        <div>
          <span>读取两个 Prompt 输出</span>
          <math display="block"><mi>h</mi><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>(</mo><msub><mi>H</mi><mrow><msub><mi>P</mi><mn>0</mn></msub></mrow></msub><mo>+</mo><msub><mi>H</mi><mrow><msub><mi>P</mi><mn>1</mn></msub></mrow></msub><mo>)</mo></math>
        </div>
        <div>
          <span>分类头与标签形成损失</span>
          <math display="block"><mi>z</mi><mo>=</mo><msub><mi>g</mi><mi>φ</mi></msub><mo>(</mo><mi>h</mi><mo>)</mo><mo>,</mo><msub><mi>ℒ</mi><mtext>cls</mtext></msub><mo>=</mo><mi mathvariant="normal">CE</mi><mo>(</mo><mi>z</mi><mo>,</mo><mi>y</mi><mo>)</mo></math>
        </div>
      </div>
      <div className="p4-readout-confluence" role="group" aria-label="两个 Prompt 位置的输出汇成读出向量，再进入分类头与交叉熵">
        <div className="p4-readout-source">
          <div className="p4-readout-source__heading">冻结前向的 Prompt 输出</div>
          {P4_TRAINING_TRACE.initial.promptOutputs.map((vector, index) => <div className="p4-output-specimen" key={index}>
            <strong>H<sub>P{index}</sub></strong><code>{pairText(vector)}</code>
          </div>)}
        </div>
        <svg className="p4-readout-converge" viewBox="0 0 110 180" aria-hidden="true">
          <path d="M 2 44 C 42 44, 50 90, 106 90 M 2 136 C 42 136, 50 90, 106 90" />
          <circle cx="106" cy="90" r="4" />
        </svg>
        <div className="p4-readout-pool">
          <span>均值读出</span>
          <strong>h</strong>
          <code>{pairText(P4_TRAINING_TRACE.initial.promptReadout)}</code>
        </div>
        <div className="p4-readout-classifier">
          <div className="p4-classifier-stamp"><strong>gφ</strong><span>可训练分类头</span></div>
          <div className="p4-loss-stamp">
            <span>标签 y={P4_TOY_EXPERIMENT.label} · Logits z</span>
            <code>{pairText(P4_TRAINING_TRACE.initial.logits)}</code>
            <strong>CE = {number(P4_TRAINING_TRACE.initial.loss)}</strong>
          </div>
        </div>
      </div>
      <p>这里的两个位置平均是为了把 Prompt 输出与分类损失连成一条可复算的教学路径；完整 L2P 对检索所得 Prompt 的分类读出会在 P6 展开。</p>
    </section>

    <figure className="lesson-figure p4-training-figure">
      <div className="figure-top"><strong>一轮 Prompt 学习 · 前向和反向共用一个舞台</strong><span>低维单头教学模型 · 明确区分参数与激活值</span></div>
      <div className="p4-control-dock" aria-label="Prompt 学习过程控制">
        <div className="p4-phase-list" role="group" aria-label="选择学习过程阶段">
          {phases.map((phase, index) => <button
            className="lesson-choice"
            type="button"
            key={phase.short}
            aria-pressed={activePhase === index}
            onClick={() => playback.seek(boundaries[index])}
          ><span className="p4-phase-index">{String(index + 1).padStart(2, "0")}</span><span>{phase.short}</span></button>)}
        </div>
        <div className="p4-control-bottomline">
          <PlaybackControls playback={playback} label="Prompt 学习进度" />
          <p className="motion-status" aria-live="polite">{phases[activePhase].text}</p>
        </div>
      </div>
      <div className="figure-body p4-figure-body">
        <p className="p4-stage-guide">沿左侧追踪 P₀、P₁ 怎样与图像 Token 一起进入冻结计算；再看右侧损失如何产生回传信号，最后核对同一图像读入新参数后的结果。</p>
        <div className="p4-data-note">
          <span>可复算的教学数据，不是论文测量值</span>
          <span>标签 y={P4_TOY_EXPERIMENT.label} · η={number(P4_TOY_EXPERIMENT.learningRate)}</span>
        </div>
        <PromptLearningStage
          state={currentState}
          phase={activePhase}
          position={playback.position}
          prompt={currentPrompt}
          updateProgress={updateProgress}
          forwardTimeline={forwardTimeline}
          gradientTimeline={gradientTimeline}
        />
        <p className="p4-stage-caption">左侧数字是 Token 向量的实际坐标。紫色表示可学习 Prompt，绿色表示固定图像输入，灰蓝框表示冻结计算，暖橙提示训练目标；向量、注意力权重、梯度和输出来自同一份计算 Trace。</p>
        <TraceDetails state={currentState} />
      </div>
      <figcaption>该 Trace 使用 2 个 Prompt Token、2 个固定图像 Token、一个冻结单头 Attention 和一个可训练二分类头。P4 用 Prompt 输出的均值作为教学读出；它用于解释梯度机制，不代表完整 L2P Prompt Pool 的检索与分类路径。</figcaption>
    </figure>

    <section className="explain-section">
      <h3>损失的导数经过固定计算，更新只写入 P 与 φ</h3>
      <p>先从分类损失沿前向路径反向追踪：误差信号经过分类头和均值读出，再穿过冻结的 <math><msub><mi>f</mi><mi>r</mi></msub></math> 回到输入中的 Prompt。梯度能穿过这些运算；“冻结”只表示主干参数不会被写回。分类头 <math><mi>φ</mi></math> 和 Prompt <math><mi>P</mi></math> 都会得到各自的梯度。</p>
      <figure className="lesson-figure p4-gradient-figure">
        <div className="figure-top"><strong>梯度经过什么，优化器写入什么</strong><span>分开核对导数路径与参数状态</span></div>
        <div className="figure-body">
          <table className="p4-gradient-ledger">
            <caption>本轮反向信号与参数写回范围</caption>
            <thead><tr><th scope="col">对象</th><th scope="col">反向计算</th><th scope="col">优化器写回</th></tr></thead>
            <tbody>
              <tr className="p4-gradient-ledger__prompt"><th scope="row"><span>Prompt</span><strong>P</strong></th><td><code>∇<sub>P</sub>ℒ<sub>cls</sub></code></td><td><b>更新参数</b></td></tr>
              <tr className="p4-gradient-ledger__head"><th scope="row"><span>分类头</span><strong>φ</strong></th><td><code>∇<sub>φ</sub>ℒ<sub>cls</sub></code></td><td><b>更新参数</b></td></tr>
              <tr className="p4-gradient-ledger__frozen"><th scope="row"><span>冻结主干</span><strong>θ<sub>ViT</sub></strong></th><td>导数穿过 f<sub>r</sub> 运算回到 P</td><td><b>权重不变</b></td></tr>
              <tr className="p4-gradient-ledger__input"><th scope="row"><span>图像输入</span><strong>x<sub>e</sub></strong></th><td>作为固定表示参与前向</td><td><b>不写入参数</b></td></tr>
            </tbody>
          </table>
        </div>
        <figcaption>Prompt 与分类头取得梯度并更新；冻结主干中的运算仍参与输入导数计算，主干权重保持原值。</figcaption>
      </figure>
      <div className="p4-gradient-equation">
        <div className="p4-equation-item">
          <span className="p4-equation-label">一次教学 SGD 更新</span>
          <math display="block"><msup><mi>P</mi><mn>1</mn></msup><mo>=</mo><msup><mi>P</mi><mn>0</mn></msup><mo>−</mo><mi>η</mi><msub><mo>∇</mo><mi>P</mi></msub><msub><mi>ℒ</mi><mtext>cls</mtext></msub></math>
          <math display="block"><msup><mi>φ</mi><mn>1</mn></msup><mo>=</mo><msup><mi>φ</mi><mn>0</mn></msup><mo>−</mo><mi>η</mi><msub><mo>∇</mo><mi>φ</mi></msub><msub><mi>ℒ</mi><mtext>cls</mtext></msub></math>
        </div>
        <div className="p4-equation-item p4-gradient-condition">
          <span className="p4-equation-label">固定主干</span>
          <math display="block"><msup><msub><mi>θ</mi><mtext>ViT</mtext></msub><mn>1</mn></msup><mo>=</mo><msup><msub><mi>θ</mi><mtext>ViT</mtext></msub><mn>0</mn></msup></math>
          <small>导数经过运算，主干权重不写回</small>
        </div>
      </div>
      <p>舞台中的 P 位移按这份 Trace 的梯度方向呈现；接下来要确认它是否影响预测，需把更新后的参数重新送入同一输入和同一冻结计算。</p>
      <div className="p4-update-explainer">
        <p>一次写回只改变 <strong>P</strong> 与 <strong>φ</strong>。之后用同一图像嵌入 <math><msub><mi>x</mi><mi>e</mi></msub></math>、同一标签 <math><mi>y</mi></math> 和同一组 <math><msub><mi>θ</mi><mtext>ViT</mtext></msub></math> 再做前向；这样才能把新旧输出差异对应到刚更新的参数。</p>
        <div className="p4-parameter-compare" role="group" aria-label="同一份 Trace 的 Prompt 与分类头更新前后数值">
          <div className="p4-compare-condition"><span>复算条件保持</span><strong>同一 xₑ · 同一 y · 同一 θ<sub>ViT</sub></strong></div>
          <div className="p4-compare-states">
            <section className="p4-parameter-state p4-parameter-state--before">
              <h4>写回前 <span>P<sup>0</sup> · φ<sup>0</sup></span></h4>
              <div className="p4-prompt-register">
                {P4_TOY_EXPERIMENT.prompt.map((vector, index) => <div key={index}><b>P<sub>{index}</sub></b><code>{pairText(vector)}</code></div>)}
              </div>
              <div className="p4-classifier-register">
                <span>W<sub>cls</sub></span><code>{matrixText(P4_TOY_EXPERIMENT.classifier.weights)}</code>
                <span>b<sub>cls</sub></span><code>{pairText(P4_TOY_EXPERIMENT.classifier.bias)}</code>
              </div>
            </section>
            <div className="p4-compare-update"><span>一次教学 SGD</span><strong>−η∇ℒ<sub>cls</sub></strong></div>
            <section className="p4-parameter-state p4-parameter-state--after">
              <h4>写回后 <span>P<sup>1</sup> · φ<sup>1</sup></span></h4>
              <div className="p4-prompt-register">
                {P4_TRAINING_TRACE.updatedPrompt.map((vector, index) => <div key={index}><b>P<sub>{index}</sub></b><code>{pairText(vector)}</code></div>)}
              </div>
              <div className="p4-classifier-register">
                <span>W<sub>cls</sub></span><code>{matrixText(P4_TRAINING_TRACE.updatedClassifierWeights)}</code>
                <span>b<sub>cls</sub></span><code>{pairText(P4_TRAINING_TRACE.updatedClassifierBias)}</code>
              </div>
            </section>
          </div>
          <div className="p4-loss-comparison"><span>同图重新前向后的教学 Trace</span><strong>CE {number(P4_TRAINING_TRACE.initial.loss)} <i aria-hidden="true">→</i> {number(P4_TRAINING_TRACE.updated.loss)}</strong></div>
        </div>
      </div>
      <p>本例的损失变化只描述这一次教学计算；它不是论文测量值，也不保证一般训练步骤都会下降。完整向量、梯度与 Logits 可在舞台的计算详情中核对。</p>
    </section>

    <section className="explain-section p4-shared-section">
      <h3>任务继续到来时，共享 Prompt 仍可能受到干扰</h3>
      <p>任务 A 学到的一组 Prompt 可以继续给任务 B 使用。若 B 的分类目标继续写入同一组参数，先前输入依赖的表示可能随之改变。冻结 ViT 缩小了可更新范围；不同任务之间怎样减少这组共享参数的争用，仍需下一页回答。</p>
      <div className="p4-shared-parameter" role="group" aria-label="任务 A 与任务 B 继续使用同一组 Prompt 参数">
        <div className="p4-sharing-task p4-sharing-task--a">
          <span>任务 A</span><strong>已学到的输入行为</strong><small>沿用这组 Prompt</small>
        </div>
        <div className="p4-sharing-connector"><span>使用 / 写入</span><i aria-hidden="true" /></div>
        <div className="p4-shared-slot">
          <span>共享参数位置</span><strong>P</strong><div><i>P₀</i><i>P₁</i></div>
        </div>
        <div className="p4-sharing-connector"><span>继续使用</span><i aria-hidden="true" /></div>
        <div className="p4-sharing-task p4-sharing-task--b">
          <span>任务 B</span><strong>新目标到来</strong><small>若继续训练，会写入同一组 P</small>
        </div>
        <div className="p4-sharing-impact"><span>可能的影响</span><strong>任务 A 依赖的表示可能改变</strong></div>
      </div>
      <div className="p4-p5-question"><span>P5 要接住的问题</span><strong>能否保存多组 Prompt，再由当前输入选用合适的一组？</strong></div>
      <p className="p4-task-note">这里只指出参数身份延续带来的干扰可能性；没有模拟任务 B 的数据、梯度或遗忘结果。</p>
    </section>

  </>;
}
