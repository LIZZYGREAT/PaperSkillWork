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

const duration = 18_100;
const boundaries = [0, 2_300, 5_400, 7_200, 11_700, 14_000, 17_100, duration];
const phases = [
  { short: "组装输入", text: "两枚紫色参数 Token 移到序列前端；它们与固定的 [CLS]、Patch₁ 组成同一输入。" },
  { short: "冻结前向", text: "同一组固定运算处理四个位置。观察 P₀ 的注意力路径与它对应的输出 H₀。" },
  { short: "分类与损失", text: "H₀、H₁ 汇成教学读出 h，经可训练分类头得到 Logits；标签 y=1 给出交叉熵。" },
  { short: "梯度回传", text: "紫色梯度沿同一计算场反向经过冻结运算，回到 P；分类头 φ 也取得梯度。" },
  { short: "一次参数更新", text: "按一次 SGD 更新 P 与 φ。轨迹插值只呈现这一步的位移，不代表额外训练步。" },
  { short: "同图复算", text: "更新后的 P、φ 再次进入同一前向；输入 xₑ 与冻结计算保持原样。" },
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

const gradientRailStart: Pair = [1060, 230];
const gradientRailTurn: Pair = [1060, 252];
const gradientRailEnd: Pair = [228, 252];
const promptGradientBranches = [
  { target: [212, 105] as Pair, controls: [[228, 226], [220, 137]] as const },
  { target: [212, 157] as Pair, controls: [[228, 235], [220, 181]] as const },
];
const querySourceRoute = {
  from: [212, 105] as Pair,
  controls: [[236, 105], [240, 139]] as [Pair, Pair],
  to: [266, 151] as Pair,
};
const downstreamRoutes = [
  { from: [520, 153] as Pair, controls: [[528, 153], [536, 153]] as [Pair, Pair], to: [544, 153] as Pair },
  { from: [574, 153] as Pair, controls: [[585, 153], [588, 122]] as [Pair, Pair], to: [598, 126] as Pair },
  { from: [579, 220] as Pair, controls: [[585, 220], [592, 220]] as [Pair, Pair], to: [598, 220] as Pair },
  { from: [724, 126] as Pair, controls: [[738, 126], [740, 147]] as [Pair, Pair], to: [750, 156] as Pair },
  { from: [724, 220] as Pair, controls: [[738, 220], [740, 197]] as [Pair, Pair], to: [750, 188] as Pair },
  { from: [828, 173] as Pair, controls: [[832, 173], [837, 173]] as [Pair, Pair], to: [841, 173] as Pair },
  { from: [944, 173] as Pair, controls: [[952, 173], [960, 173]] as [Pair, Pair], to: [970, 173] as Pair },
];

function gradientRailPoint(progress: number): Pair {
  const verticalLength = gradientRailTurn[1] - gradientRailStart[1];
  const horizontalLength = gradientRailTurn[0] - gradientRailEnd[0];
  const distance = clamp(progress) * (verticalLength + horizontalLength);
  if (distance <= verticalLength) return [gradientRailStart[0], gradientRailStart[1] + distance];
  return [gradientRailTurn[0] - (distance - verticalLength), gradientRailTurn[1]];
}

function MiniVector({ values, x, y, color }: { values: Pair; x: number; y: number; color: string }) {
  const origin: Pair = [x + 16, y + 13];
  const endpoint: Pair = [origin[0] + clamp(values[0], -1, 1) * 13, origin[1] - clamp(values[1], -1, 1) * 11];
  const angle = Math.atan2(endpoint[1] - origin[1], endpoint[0] - origin[0]);
  const wingA: Pair = [endpoint[0] - 4 * Math.cos(angle - 0.52), endpoint[1] - 4 * Math.sin(angle - 0.52)];
  const wingB: Pair = [endpoint[0] - 4 * Math.cos(angle + 0.52), endpoint[1] - 4 * Math.sin(angle + 0.52)];
  return <g className="p4-vector-glyph" aria-hidden="true">
    <path d={"M" + (x + 1) + " " + origin[1] + "H" + (x + 31) + " M" + origin[0] + " " + (y + 1) + "V" + (y + 25)} className="p4-vector-axis" />
    <path d={"M" + origin[0] + " " + origin[1] + "L" + endpoint[0] + " " + endpoint[1]
      + " M" + wingA[0] + " " + wingA[1] + "L" + endpoint[0] + " " + endpoint[1]
      + "L" + wingB[0] + " " + wingB[1]} stroke={color} className="p4-vector-arrow" />
    <circle cx={endpoint[0]} cy={endpoint[1]} r="2.4" fill={color} />
  </g>;
}

function PromptLearningStage({
  state,
  phase,
  position,
  prompt,
  updateProgress,
  forwardProgress,
  forwardTimeline,
  gradientProgress,
  gradientTimeline,
}: {
  state: ForwardState;
  phase: number;
  position: number;
  prompt: Matrix;
  updateProgress: number;
  forwardProgress: number;
  forwardTimeline: number;
  gradientProgress: number;
  gradientTimeline: number;
}) {
  const insertionProgress = phase === 0 ? cubicBezierProgress(phaseProgress(position, 0)) : 1;
  const inputRows = [84, 136, 188, 240];
  const names = ["P₀", "P₁", "[CLS]", "Patch₁"];
  const colors = ["prompt", "prompt", "image", "image"];
  const forwardActive = phase === 1 || phase === 5;
  const attentionProgress = forwardActive ? forwardProgress : (phase > 1 && phase < 5 || phase === 6 ? 1 : 0);
  const gradientOpacity = phase === 3 ? gradientProgress : 0;
  const outputOpacity = phase === 0 ? 0.12 : phase === 1
    ? clamp(forwardProgress * 1.5)
    : phase === 5 ? clamp((forwardProgress - 0.72) / 0.28) : 1;
  const afterForward = phase === 5 && forwardProgress >= 0.86 || phase === 6;
  const currentLoss = state.loss;
  const sourceY = [91, 133, 175, 217];
  const queryOrigin: Pair = [354, 151];
  const valueTargets: Pair[] = [[474, 134], [467, 146], [467, 160], [474, 172]];
  const attentionRoutes: AttentionRoute[] = sourceY.flatMap((y, sourceIndex) => {
    const routes = [
      {
        sourceIndex,
        kind: "query" as const,
        from: queryOrigin,
        controls: [[364, queryOrigin[1]], [380, y + (y < queryOrigin[1] ? 11 : -11)]] as [Pair, Pair],
        to: [402, y] as Pair,
      },
      {
        sourceIndex,
        kind: "value" as const,
        from: [446, y] as Pair,
        controls: [[454, y], [valueTargets[sourceIndex][0] - 12, valueTargets[sourceIndex][1] + (sourceIndex < 2 ? -12 : 12)]] as [Pair, Pair],
        to: valueTargets[sourceIndex],
      },
    ];
    return routes.map(route => ({ ...route, length: cubicLength(route.from, route.controls[0], route.controls[1], route.to) }));
  });
  const totalAttentionLength = attentionRoutes.reduce((total, route) => total + route.length, 0);
  const attentionTravelWindow = 1;
  let remainingAttentionDistance = forwardTimeline < attentionTravelWindow
    ? (forwardTimeline / attentionTravelWindow) * totalAttentionLength
    : totalAttentionLength;
  const activeAttentionRoute = forwardActive && forwardTimeline < attentionTravelWindow
    ? attentionRoutes.find(route => {
      if (remainingAttentionDistance < route.length) return true;
      remainingAttentionDistance -= route.length;
      return false;
    }) ?? null
    : null;
  const activeAttentionProgress = activeAttentionRoute
    ? remainingAttentionDistance / activeAttentionRoute.length
    : 0;
  const activeAttentionPoint = activeAttentionRoute
    ? cubicPointAtLengthFraction(
      activeAttentionRoute.from,
      activeAttentionRoute.controls[0],
      activeAttentionRoute.controls[1],
      activeAttentionRoute.to,
      activeAttentionProgress,
      activeAttentionRoute.length,
    )
    : null;
  const inputTokenValues = state.inputTokens;
  const targetPromptY = [inputRows[0], inputRows[1]];
  const parkedPromptY = [326, 379];
  const promptY = [0, 1].map(index => targetPromptY[index] + (parkedPromptY[index] - targetPromptY[index]) * (1 - insertionProgress));
  const parameterScale = 2_000;
  const parameterRows = [358, 410];
  const classifierWeightBefore = P4_TOY_EXPERIMENT.classifier.weights[0][0];
  const classifierWeightAfter = P4_TRAINING_TRACE.updatedClassifierWeights[0][0];
  const classifierWeightCurrent = classifierWeightBefore + (classifierWeightAfter - classifierWeightBefore) * updateProgress;
  const classifierMarkerX = 844 + clamp((classifierWeightCurrent - 0.25) / 0.25) * 270;

  return <div className="p4-stage-scroll" role="group" aria-label="Prompt 调优的统一计算舞台">
    <svg className="p4-stage-svg" viewBox="0 0 1180 468" role="img" aria-labelledby="p4-stage-title p4-stage-desc">
      <title id="p4-stage-title">同一组 Prompt 进入冻结计算，接收梯度并更新</title>
      <desc id="p4-stage-desc">左侧显示 P₀、P₁ 与固定图像 Token，中间展示固定 Attention 运算，右侧展示 Prompt 输出、均值读出、分类头和损失。反向阶段沿同一舞台回到 Prompt，只有 Prompt 与分类头的参数更新。</desc>
      <defs>
        <marker id="p4-flow-arrow" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L5 2.5L0 5Z" fill="#718b78" /></marker>
        <marker id="p4-gradient-arrow" markerWidth="5.5" markerHeight="5.5" refX="5" refY="2.75" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L5.5 2.75L0 5.5Z" fill="#745887" /></marker>
      </defs>

      <text className="p4-zone-label" x="24" y="28">输入与可学习参数</text>
      <text className="p4-zone-sub" x="24" y="47">P₀、P₁ 同属一个 Prompt</text>
      <text className="p4-zone-label" x="244" y="28">冻结的前向计算 fᵣ</text>
      <text className="p4-zone-sub" x="244" y="47">单头 Attention 教学模型 · 参数固定</text>
      <text className="p4-zone-label" x="598" y="28">Prompt 位置输出</text>
      <text className="p4-zone-label" x="742" y="28">教学读出</text>
      <text className="p4-zone-label" x="836" y="28">可训练分类头 φ</text>
      <text className="p4-zone-label" x="978" y="28">标签与损失</text>

      <path d="M20 58H219V284H20Z" className="p4-input-frame" />
      <text className="p4-frame-caption" x="31" y="73">xₚ = [P₀; P₁; xₑ]</text>
      <text className="p4-frame-caption p4-fixed-caption" x="132" y="73">图像 xₑ 固定</text>
      {inputRows.map((row, index) => {
        const isPrompt = index < 2;
        const y = isPrompt ? promptY[index] : row;
        const vector = isPrompt ? prompt[index] : inputTokenValues[index];
        const tokenColor = isPrompt ? "#745684" : "#32796f";
        return <g key={names[index]} className={"p4-token-card p4-token-card--" + colors[index]} style={{ opacity: isPrompt ? 0.4 + insertionProgress * 0.6 : 1 }}>
          <rect x="28" y={y} width="184" height="43" rx="9" />
          <text className="p4-token-label" x="39" y={y + 17}>{names[index]}</text>
          <text className="p4-token-value" x="39" y={y + 34}>{pairText(vector)}</text>
          <MiniVector values={vector} x={166} y={y + 8} color={tokenColor} />
          {isPrompt && phase >= 3 && <text className="p4-token-state" x="126" y={y + 16}>{phase >= 4 ? "可更新" : "∇P"}</text>}
        </g>;
      })}

      <rect x="242" y="58" width="337" height="246" rx="15" className="p4-encoder-frame" />
      <text className="p4-encoder-title" x="259" y="78">固定权重仍执行计算</text>
      <g className="p4-lock-badge">
        <rect x="488" y="64" width="77" height="25" rx="12" />
        <path d="M501 77v-3a4 4 0 0 1 8 0v3m-9 0h10v7h-10z" />
        <text x="514" y="81">冻结</text>
      </g>

      {[0, 1].map(index => <path
        key={"input-flow-" + index}
        d={"M212 " + (inputRows[index] + 21) + "H242"}
        className={index === 0 ? "p4-input-link p4-input-link--prompt" : "p4-input-link"}
        markerEnd="url(#p4-flow-arrow)"
        opacity={insertionProgress}
      />)}
      {[2, 3].map(index => <path key={"image-flow-" + index} d={"M212 " + (inputRows[index] + 21) + "H242"} className="p4-input-link p4-input-link--image" markerEnd="url(#p4-flow-arrow)" />)}

      <g className="p4-query-node" style={{ opacity: 0.25 + attentionProgress * 0.75 }}>
        <rect x="266" y="124" width="88" height="55" rx="10" />
        <text className="p4-node-title" x="276" y="143">Q₀ ← P₀</text>
        <text className="p4-node-value" x="276" y="162">{pairText(state.firstPromptQuery)}</text>
      </g>
      <path d={cubicPath(querySourceRoute.from, querySourceRoute.controls[0], querySourceRoute.controls[1], querySourceRoute.to)} className="p4-query-source" markerEnd="url(#p4-flow-arrow)" opacity={phase === 3 ? 0.12 : attentionProgress} />

      {sourceY.map((y, index) => {
        const attention = state.firstPromptAttention[index];
        const activeHere = activeAttentionRoute?.sourceIndex === index;
        const sourceLabel = ["P₀", "P₁", "[CLS]", "Patch₁"][index];
        return <g key={"attention-source-" + index}>
          <g className="p4-source-chip" style={{ opacity: 0.34 + attentionProgress * 0.66 }}>
            <rect x="402" y={y - 15} width="44" height="30" rx="8" />
            <text x="424" y={y - 3} textAnchor="middle">{sourceLabel}</text>
            <text className="p4-alpha" x="424" y={y + 11} textAnchor="middle">α={number(attention)}</text>
          </g>
          {forwardActive && forwardTimeline > 0 && activeHere && activeAttentionPoint && <circle
            className={activeAttentionRoute.kind === "query" ? "p4-flow-bead" : "p4-value-bead"}
            cx={activeAttentionPoint[0]}
            cy={activeAttentionPoint[1]}
            r="3.2"
          />}
        </g>;
      })}

      <g className="p4-sum-node" style={{ opacity: 0.28 + attentionProgress * 0.72 }}>
        <circle cx="493" cy="153" r="27" />
        <text x="493" y="150" textAnchor="middle">Σ αV</text>
        <text className="p4-node-value" x="493" y="164" textAnchor="middle">{pairText(state.firstPromptContext)}</text>
      </g>
      <g className="p4-frozen-projection">
        <rect x="544" y="133" width="29" height="40" rx="7" />
        <text x="558" y="150" textAnchor="middle">W</text>
        <text x="558" y="163" textAnchor="middle">O</text>
      </g>
      <text className="p4-compute-caption" x="258" y="265">局部展开 P₀；P₁ 也经过同一冻结运算</text>
      <text className="p4-compute-caption" x="258" y="283">反向导数通过 fᵣ，权重锚点保持不动</text>

      {[0, 1].map(index => {
        const output = state.promptOutputs[index];
        const y = index === 0 ? 101 : 194;
        return <g key={"prompt-output-" + index} className="p4-output-token" style={{ opacity: outputOpacity }}>
          <rect x="598" y={y} width="126" height="51" rx="10" />
          <text className="p4-token-label" x="610" y={y + 20}>H{index} ← P{index}</text>
          <text className="p4-token-value" x="610" y={y + 38}>{pairText(output)}</text>
        </g>;
      })}

      <g className="p4-readout-node" style={{ opacity: outputOpacity }}>
        <rect x="750" y="143" width="78" height="59" rx="10" />
        <text className="p4-node-title" x="789" y="163" textAnchor="middle">h</text>
        <text className="p4-node-value" x="789" y="181" textAnchor="middle">½(H₀+H₁)</text>
        <text className="p4-node-value" x="789" y="194" textAnchor="middle">{pairText(state.promptReadout)}</text>
      </g>
      <g className="p4-classifier-node" style={{ opacity: outputOpacity }}>
        <rect x="841" y="135" width="103" height="76" rx="11" />
        <text className="p4-classifier-mark" x="892" y="160" textAnchor="middle">gφ</text>
        <text className="p4-classifier-copy" x="892" y="178" textAnchor="middle">Wcls · bcls</text>
        <text className="p4-trainable-tag" x="892" y="196" textAnchor="middle">可训练</text>
      </g>
      <g className="p4-loss-node" style={{ opacity: outputOpacity }}>
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
            style={{ opacity: phase === 3 ? 0.12 : 0.08 + attentionProgress * (0.2 + state.firstPromptAttention[index] * 0.8), strokeWidth: 0.8 + state.firstPromptAttention[index] * 3.4 }}
          />;
        })}
        {sourceY.map((_, index) => <path
          key={"value-link-" + index}
          d={cubicPath(attentionRoutes[index * 2 + 1].from, attentionRoutes[index * 2 + 1].controls[0], attentionRoutes[index * 2 + 1].controls[1], attentionRoutes[index * 2 + 1].to)}
          className="p4-value-link"
          markerEnd="url(#p4-flow-arrow)"
          style={{ opacity: phase === 3 ? 0.12 : 0.25 + state.firstPromptAttention[index] * 0.75, strokeWidth: 0.8 + state.firstPromptAttention[index] * 2.3 }}
        />)}
        <path d="M446 153H466" className="p4-operator-link" markerEnd="url(#p4-flow-arrow)" style={{ opacity: phase === 3 ? 0.12 : attentionProgress }} />
        <path d={cubicPath(downstreamRoutes[0].from, downstreamRoutes[0].controls[0], downstreamRoutes[0].controls[1], downstreamRoutes[0].to)} className="p4-operator-link" markerEnd="url(#p4-flow-arrow)" style={{ opacity: phase === 3 ? 0.12 : attentionProgress }} />
        {downstreamRoutes.slice(1).map((route, index) => <path
          key={"downstream-link-" + index}
          d={cubicPath(route.from, route.controls[0], route.controls[1], route.to)}
          className={index === 1 ? "p4-output-link p4-output-link--secondary" : index > 1 ? "p4-readout-link" : "p4-output-link"}
          markerEnd="url(#p4-flow-arrow)"
          style={{ opacity: phase === 3 ? 0.12 : outputOpacity }}
        />)}
      </g>
      {phase >= 5 && <g className="p4-loss-compare">
        <text x="970" y="250">同图对照</text>
        <text x="970" y="267">更新前 ℒ⁰ = {number(P4_TRAINING_TRACE.initial.loss)}</text>
        <text x="970" y="284" style={{ opacity: afterForward ? 1 : 0.38 }}>更新后 ℒ¹ = {number(P4_TRAINING_TRACE.updated.loss)}</text>
      </g>}

      {phase === 3 && <>
        <path d="M1060 230V252H228" className="p4-gradient-route" style={{ opacity: gradientOpacity }} />
        <path d="M892 252V211" className="p4-gradient-branch" markerEnd="url(#p4-gradient-arrow)" style={{ opacity: gradientOpacity }} />
        {promptGradientBranches.map((branch, index) => <path
          key={"prompt-gradient-branch-" + index}
          d={cubicPath([228, 252], branch.controls[0], branch.controls[1], branch.target)}
          className="p4-gradient-branch"
          markerEnd="url(#p4-gradient-arrow)"
          style={{ opacity: gradientOpacity }}
        />)}
        <text className="p4-gradient-label" x="918" y="240" textAnchor="middle" style={{ opacity: gradientOpacity }}>∇φ</text>
        {phase === 3 && gradientProgress > 0 && <>
          {(() => {
            const point = gradientRailPoint(gradientTimeline);
            return <circle className="p4-gradient-bead" cx={point[0]} cy={point[1]} r="3.2" />;
          })()}
        </>}
      </>}

      <path d="M20 313H220" className="p4-divider" />
      <text className="p4-mini-title" x="24" y="331">参数局部视图</text>
      <text className="p4-mini-note" x="123" y="331">位移 ×2000 · 坐标值见 Token</text>
      {[0, 1].map(index => {
        const row = parameterRows[index];
        const origin: Pair = [137, row];
        const updated = P4_TRAINING_TRACE.updatedPrompt[index];
        const original = P4_TOY_EXPERIMENT.prompt[index];
        const target: Pair = [
          origin[0] + (updated[0] - original[0]) * parameterScale,
          origin[1] - (updated[1] - original[1]) * parameterScale,
        ];
        const now: Pair = [
          origin[0] + (target[0] - origin[0]) * updateProgress,
          origin[1] + (target[1] - origin[1]) * updateProgress,
        ];
        return <g key={"parameter-position-" + index} className="p4-parameter-view" style={{ opacity: phase >= 3 ? 1 : 0.48 }}>
          <text x="25" y={row + 4}>P{index}</text>
          <path d={"M58 " + row + "H211M137 " + (row - 17) + "V" + (row + 17)} className="p4-parameter-axis" />
          {phase >= 4 && <path d={"M" + origin[0] + " " + origin[1] + "L" + target[0] + " " + target[1]} className="p4-parameter-trail" />}
          <circle cx={origin[0]} cy={origin[1]} r="4.3" className="p4-parameter-origin" />
          {phase >= 4 && <circle cx={target[0]} cy={target[1]} r="4.3" className="p4-parameter-target" />}
          <circle cx={now[0]} cy={now[1]} r="4.7" className="p4-parameter-current" />
        </g>;
      })}

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
      <path d="M844 374H1114" className="p4-classifier-axis" />
      <path d={"M" + (844 + clamp((classifierWeightBefore - 0.25) / 0.25) * 270) + " 374H" + classifierMarkerX} className="p4-classifier-trail" />
      <circle cx={844 + clamp((classifierWeightBefore - 0.25) / 0.25) * 270} cy="374" r="4.4" className="p4-parameter-origin" />
      <circle cx={classifierMarkerX} cy="374" r="4.8" className="p4-classifier-current" />
      <text className="p4-phi-value" x="642" y="398">W⁰={number(classifierWeightBefore)} → 当前 {number(classifierWeightCurrent)}</text>
      <text className="p4-phi-value" x="642" y="419">{phase >= 5 ? "同一 xₑ 与 fᵣ · 已重跑前向" : "完整矩阵与偏置变化见计算详情"}</text>
      <text className="p4-phi-scale" x="844" y="398">0.25</text>
      <text className="p4-phi-scale" x="1100" y="398">0.50</text>

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
  const forwardProgress = activePhase === 1 || activePhase === 5
    ? cubicBezierProgress(forwardTimeline)
    : activePhase > 1 && activePhase < 5 || activePhase === 6 ? 1 : 0;
  const gradientTimeline = activePhase === 3 ? phaseProgress(playback.position, 3) : 0;
  const gradientProgress = activePhase === 3 ? cubicBezierProgress(gradientTimeline) : 0;
  const currentState = activePhase === 4
    ? runP4Forward(currentPrompt, currentClassifierWeights, currentClassifierBias)
    : activePhase === 5 && forwardProgress < 0.86
      ? P4_TRAINING_TRACE.initial
      : activePhase >= 5 ? P4_TRAINING_TRACE.updated : P4_TRAINING_TRACE.initial;

  return <>
    <p className="lesson-lead">P3 已说明，固定的 Transformer 参数仍会对输入 Token 执行计算，输出也会随输入改变。P4 接着把 <Term id="prompt-token">Prompt Token</Term> 设为可学习参数；这种做法叫 <Term id="prompt-tuning">Prompt Tuning</Term>。让分类损失沿固定计算路径回传，看看更新真正落在哪里。</p>

    <section className="explain-section">
      <h3>Prompt 是加在图像序列前端的一组向量</h3>
      <p>沿用 P2 的图像嵌入 <math><msub><mi>x</mi><mi>e</mi></msub></math>，再把可学习的 <Term id="prompt-token">Prompt Token</Term> 接到序列前端。它们的宽度与图像 Token 相同，所以 Prompt 增加序列位置，不改变隐藏宽度 <math><mi>D</mi></math>。</p>
      <div className="p4-shape-equations">
        <math display="block"><mi>P</mi><mo>∈</mo><msup><mi>ℝ</mi><mrow><msub><mi>L</mi><mi>p</mi></msub><mo>×</mo><mi>D</mi></mrow></msup><mo>,</mo><msub><mi>x</mi><mi>p</mi></msub><mo>=</mo><mo>[</mo><mi>P</mi><mo>;</mo><msub><mi>x</mi><mi>e</mi></msub><mo>]</mo></math>
        <math display="block"><msub><mi>x</mi><mi>p</mi></msub><mo>∈</mo><msup><mi>ℝ</mi><mrow><mo>(</mo><msub><mi>L</mi><mi>p</mi></msub><mo>+</mo><mi>L</mi><mo>)</mo><mo>×</mo><mi>D</mi></mrow></msup><mo>,</mo><mi>H</mi><mo>=</mo><msub><mi>f</mi><mi>r</mi></msub><mo>(</mo><msub><mi>x</mi><mi>p</mi></msub><mo>)</mo></math>
      </div>
      <p>在 P2 的 ViT-B/16 参照中，图像序列为 <span className="lesson-number">197</span>×<span className="lesson-number lesson-number--width">768</span>；若加两枚 Prompt Token，形状成为 199×768。下面的计算 Trace 则缩到 Lₚ=2、L=2、D=2，让每个参数的变化都能被读出来。两枚 Token 是同一组 Prompt 的两个位置，Pool 检索留到 P5。</p>
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
          >{String.fromCharCode(65 + index)} · {phase.short}</button>)}
        </div>
        <div className="p4-control-bottomline">
          <PlaybackControls playback={playback} label="Prompt 学习进度" />
          <p className="motion-status" aria-live="polite">{phases[activePhase].text}</p>
        </div>
      </div>
      <div className="figure-body p4-figure-body">
        <div className="p4-data-note">
          <span>可复算的教学数据，不是论文测量值</span>
          <span>固定 xₑ · 标签 y={P4_TOY_EXPERIMENT.label} · η={number(P4_TOY_EXPERIMENT.learningRate)}</span>
        </div>
        <PromptLearningStage
          state={currentState}
          phase={activePhase}
          position={playback.position}
          prompt={currentPrompt}
          updateProgress={updateProgress}
          forwardProgress={forwardProgress}
          forwardTimeline={forwardTimeline}
          gradientProgress={gradientProgress}
          gradientTimeline={gradientTimeline}
        />
        <p className="p4-stage-caption">紫色表示可学习 Prompt，绿色表示固定图像输入，灰蓝框表示冻结计算，暖橙提示当前训练目标。向量、注意力权重、梯度和输出来自同一份计算 Trace。</p>
        <TraceDetails state={currentState} />
      </div>
      <figcaption>该 Trace 使用 2 个 Prompt Token、2 个固定图像 Token、一个冻结单头 Attention 和一个可训练二分类头。P4 用 Prompt 输出的均值作为教学读出；它用于解释梯度机制，不代表完整 L2P Prompt Pool 的检索与分类路径。</figcaption>
    </figure>

    <section className="explain-section">
      <h3>损失的导数经过固定计算，更新只写入 P 与 φ</h3>
      <p>分类头给出 Logits，与标签比较后形成损失。因为输出依赖输入参数 P，反向求导会穿过 <math><msub><mi>f</mi><mi>r</mi></msub></math> 的固定运算，将 <Term id="gradient-flow">梯度回传</Term> 给 Prompt；优化器更新 Prompt 与可训练分类头 <math><mi>φ</mi></math>，冻结的主干参数保留原值。</p>
      <div className="p4-gradient-equation">
        <div className="p4-equation-item">
          <span className="p4-equation-label">一次教学 SGD 更新</span>
          <math display="block"><msup><mi>P</mi><mn>1</mn></msup><mo>=</mo><msup><mi>P</mi><mn>0</mn></msup><mo>−</mo><mi>η</mi><msub><mo>∇</mo><mi>P</mi></msub><mi>ℒ</mi></math>
          <math display="block"><msup><mi>φ</mi><mn>1</mn></msup><mo>=</mo><msup><mi>φ</mi><mn>0</mn></msup><mo>−</mo><mi>η</mi><msub><mo>∇</mo><mi>φ</mi></msub><mi>ℒ</mi></math>
        </div>
        <div className="p4-equation-item p4-gradient-condition">
          <span className="p4-equation-label">固定主干</span>
          <math display="block"><msup><mi>θ</mi><mn>1</mn></msup><mo>=</mo><msup><mi>θ</mi><mn>0</mn></msup></math>
          <small>反向经过运算，权重不写回</small>
        </div>
      </div>
      <p>动画中的更新位移按真实梯度方向呈现，坐标和更新前后 Logits、损失均可在计算详情中复核。该教学例子的损失变化只描述这一次计算，不保证一般训练步骤都会下降。</p>
    </section>

    <section className="explain-section p4-shared-section">
      <h3>任务继续到来时，共享 Prompt 仍可能受到干扰</h3>
      <p>任务 A 学到的一组 Prompt 可以继续给任务 B 使用。若 B 的分类目标继续写入同一组参数，先前输入依赖的表示可能随之改变。冻结 ViT 缩小了可更新范围；不同任务之间怎样减少这组共享参数的争用，仍需下一页回答。</p>
      <div className="p4-task-rail" aria-label="同一组 Prompt 从任务 A 延续到任务 B">
        <div><strong>任务 A</strong><span>更新 P</span></div>
        <span className="p4-task-arrow" aria-hidden="true" />
        <div className="p4-task-identity"><strong>同一组 P</strong><math display="block"><msup><mi>P</mi><mrow><mi>A</mi><mo>→</mo><mi>B</mi></mrow></msup></math></div>
        <span className="p4-task-arrow" aria-hidden="true" />
        <div><strong>任务 B</strong><span>可继续更新 P</span></div>
      </div>
      <p className="p4-task-note">这里只指出参数身份延续带来的干扰可能性；没有模拟任务 B 的数据、梯度或遗忘结果。</p>
    </section>

    <p className="lesson-takeaway">如果多个任务继续共享可学习参数，怎样保存多组 Prompt，并由当前输入选出合适的一组？</p>
  </>;
}
