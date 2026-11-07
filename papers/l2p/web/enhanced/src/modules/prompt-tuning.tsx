import { useLessonPlayback, PlaybackControls } from "./lesson-playback";
import { P4_TOY_EXPERIMENT, P4_TRAINING_TRACE, runP4Forward } from "./prompt-tuning-demo";
import { Arrow } from "./vit-visuals";
import "./prompt-tuning.css";

type Pair = readonly [number, number];
type Matrix = readonly [Pair, Pair];

const duration = 8600;
const boundaries = [0, 950, 2600, 3500, 5000, 6500, 7800, duration];
const phases = [
  { short: "准备输入", text: "固定两枚图像 Token；可学习的 P₀、P₁ 放在序列前端。每个 Token 的宽度都是 2。" },
  { short: "Token 交互", text: "P₀ 生成 Query，与四个 Token 的 Key 比较；权重作用到对应 Value，再逐项汇成 H₀。" },
  { short: "形成损失", text: "分类头给出两个 Logits 和 Softmax 概率，交叉熵针对示例标签 y=1 计算。" },
  { short: "回传梯度", text: "交叉熵的梯度穿过固定 Attention 运算回到 Prompt，并计算分类头梯度；冻结主干参数不进入更新。" },
  { short: "逐值更新", text: "按 P¹=P⁰−η∇Pℒ 与 W¹=W⁰−η∇Wℒ 更新 Prompt 和分类头，再从当前数值重算前向。" },
  { short: "同图复算", text: "同一批 P₀、P₁ 对象带着新参数再次通过相同冻结网络；图像 Token 与主干权重保持不动。" },
  { short: "任务 B 接续", text: "任务 B 可以继续改写同一组 Prompt。此处只说明参数身份延续，不假造任务 B 数据或结果。" },
];

function phaseAt(position: number) {
  if (position >= duration) return phases.length - 1;
  const index = boundaries.findIndex((_, i) => i < boundaries.length - 1 && position >= boundaries[i] && position < boundaries[i + 1]);
  return Math.max(0, index);
}

function phaseProgress(position: number, phase: number) {
  return Math.max(0, Math.min(1, (position - boundaries[phase]) / (boundaries[phase + 1] - boundaries[phase])));
}

function interpolatePair(from: Pair, to: Pair, amount: number): Pair {
  return from.map((value, index) => value + (to[index] - value) * amount) as unknown as Pair;
}

function interpolateMatrix(from: Matrix, to: Matrix, amount: number): Matrix {
  return from.map((row, index) => interpolatePair(row, to[index], amount)) as unknown as Matrix;
}

function clamp(value: number, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }

function cubicBezierProgress(progress: number) {
  const x = clamp(progress);
  const curve = (t: number, a: number, b: number) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 18; iteration += 1) {
    const middle = (low + high) / 2;
    if (curve(middle, 0.77, 0.175) < x) low = middle;
    else high = middle;
  }
  return curve((low + high) / 2, 0, 1);
}

function number(value: number) { return value.toFixed(3); }

function VectorValue({ values }: { values: Pair }) {
  return <code>[{number(values[0])}, {number(values[1])}]</code>;
}

function ParameterMatrix({ label, values }: { label: string; values: Matrix }) {
  return <span className="p4-matrix-value"><b>{label}</b><code>[[{number(values[0][0])}, {number(values[0][1])}], [{number(values[1][0])}, {number(values[1][1])}]]</code></span>;
}

const tokenNames = ["P₀", "P₁", "[CLS]", "Patch₁"];
const tokenRows = [110, 202, 294, 386];
const queryPoint: Pair = [330, 248];
const keyPoint = (y: number): Pair => [395, y];
const contributionPoint = (y: number): Pair => [810, y];
const contextPoint: Pair = [840, 248];

function cubicPoint(from: Pair, control1: Pair, control2: Pair, to: Pair, progress: number): Pair {
  const t = clamp(progress);
  const inverse = 1 - t;
  return [0, 1].map(dimension =>
    inverse ** 3 * from[dimension] + 3 * inverse ** 2 * t * control1[dimension] +
    3 * inverse * t ** 2 * control2[dimension] + t ** 3 * to[dimension],
  ) as unknown as Pair;
}

function MiniVector({ values, x, y, color = "#704d82" }: { values: Pair; x: number; y: number; color?: string }) {
  const origin: Pair = [x + 19, y + 17];
  const endpoint: Pair = [origin[0] + clamp(values[0], -1, 1) * 14, origin[1] - clamp(values[1], -1, 1) * 12];
  const angle = Math.atan2(endpoint[1] - origin[1], endpoint[0] - origin[0]);
  const wingA: Pair = [endpoint[0] - 4 * Math.cos(angle - 0.52), endpoint[1] - 4 * Math.sin(angle - 0.52)];
  const wingB: Pair = [endpoint[0] - 4 * Math.cos(angle + 0.52), endpoint[1] - 4 * Math.sin(angle + 0.52)];
  return <g className="p4-vector-glyph" aria-hidden="true">
    <path d={`M${x + 3} ${origin[1]}H${x + 36} M${origin[0]} ${y + 2}V${y + 29}`} className="p4-vector-axis" />
    <path d={`M${origin[0]} ${origin[1]}L${endpoint[0]} ${endpoint[1]} M${wingA[0]} ${wingA[1]}L${endpoint[0]} ${endpoint[1]}L${wingB[0]} ${wingB[1]}`} stroke={color} className="p4-vector-arrow" />
    <circle cx={endpoint[0]} cy={endpoint[1]} r="2.5" fill={color} />
  </g>;
}

function P4ObjectCircuit({
  state, activePhase, forwardProgress, gradientProgress, currentPrompt, updateProgress,
}: {
  state: NonNullable<ReturnType<typeof runP4Forward>>;
  activePhase: number;
  forwardProgress: number;
  gradientProgress: number;
  currentPrompt: Matrix;
  updateProgress: number;
}) {
  const isReforward = activePhase === 5;
  const qkProgress = clamp(forwardProgress / 0.4);
  const valueProgress = clamp((forwardProgress - 0.3) / 0.49);
  const outputProgress = clamp((forwardProgress - 0.72) / 0.28);
  const attentionActive = activePhase === 1 || isReforward;
  const showGradientValues = activePhase >= 3;

  return <section className={`p4-object-circuit ${isReforward ? "is-reforward" : ""}`} aria-label="Prompt Token 的前向交互、反向梯度与参数移动">
    <div className="p4-object-heading">
      <div><strong>Token 对象流</strong><span>沿着真实计算值走一遍：投影 → 匹配 → Value 加权 → 输出</span></div>
      <span className="p4-object-mode">{isReforward ? "同一对象 · 第二次前向" : activePhase === 4 ? "参数移动中 · 每帧重算" : activePhase >= 2 ? "前向结果固定在此" : "首个 Prompt Query 的局部展开"}</span>
      <small className="p4-object-scroll-hint">窄屏可左右滑动，跟着 Query → Key → Value → 输出。</small>
    </div>

    <div className="p4-object-scroll" role="group" aria-label="可视化的单头 Attention 数据流">
      <svg className="p4-forward-scene" viewBox="0 0 1150 484" role="img" aria-labelledby="p4-forward-title p4-forward-desc">
        <title id="p4-forward-title">P₀ Query 与四个 Key 匹配，再对四个 Value 加权求和</title>
        <desc id="p4-forward-desc">Query 与 Key 的连接强度来自本次 softmax 权重；各 Value 按相同权重缩放后汇聚，经固定的 WO 得到 H₀。P4 只放大展示 P₀ 的 Query，其余输入位置也执行注意力计算。</desc>
        <defs>
          <marker id="p4-object-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5Z" fill="#78907d" /></marker>
          <marker id="p4-gradient-arrow-small" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5Z" fill="#75588a" /></marker>
        </defs>

        <text className="p4-scene-column-label" x="24" y="31">输入序列 · 保留对象身份</text>
        <text className="p4-scene-column-label" x="236" y="31">WQ</text>
        <text className="p4-scene-column-label" x="395" y="31">WK · Key</text>
        <text className="p4-scene-column-label" x="535" y="31">WV · Value</text>
        <text className="p4-scene-column-label" x="690" y="31">αⱼVⱼ</text>
        <text className="p4-scene-column-label" x="840" y="31">Σ 加权汇聚</text>
        <text className="p4-scene-column-label" x="954" y="31">WO</text>
        <text className="p4-scene-column-label" x="1045" y="31">Prompt 输出</text>

        {tokenRows.map((row, index) => {
          const attention = state.firstPromptAttention[index];
          const qEnd = keyPoint(row);
          const qControls: [Pair, Pair] = [[352, queryPoint[1]], [360, row]];
          const qPath = `M${queryPoint[0]} ${queryPoint[1]} C${qControls[0][0]} ${qControls[0][1]} ${qControls[1][0]} ${qControls[1][1]} ${qEnd[0]} ${qEnd[1]}`;
          const qDot = cubicPoint(queryPoint, qControls[0], qControls[1], qEnd, qkProgress);
          const contextEnd = contextPoint;
          const vStart = [contributionPoint(row)[0], row] as Pair;
          const vControls: [Pair, Pair] = [[838, row], [810, contextPoint[1]]];
          const vPath = `M${vStart[0]} ${vStart[1]} C${vControls[0][0]} ${vControls[0][1]} ${vControls[1][0]} ${vControls[1][1]} ${contextEnd[0]} ${contextEnd[1]}`;
          const vDot = cubicPoint(vStart, vControls[0], vControls[1], contextEnd, valueProgress);
          const queryEdge = qkProgress > 0 && attentionActive;
          const valueEdge = valueProgress > 0 && attentionActive;
          const key = state.keys[index];
          const value = state.values[index];
          const weightedValue = state.weightedValueContributions[index];
          return <g key={tokenNames[index]}>
            <path d={`M154 ${row}H395`} className="p4-source-link" opacity={forwardProgress > 0.03 ? 1 : 0.18} />
            <path d={`M154 ${row + 5} C295 ${row + 5} 390 ${row + 22} 535 ${row + 22}`} className="p4-value-source-link" opacity={forwardProgress > 0.08 ? 1 : 0.14} />
            <path d={`M508 ${row}H535`} className="p4-projection-link" opacity={forwardProgress > 0.08 ? 1 : 0.16} />
            <path d={`M650 ${row}H690`} className="p4-projection-link" opacity={valueProgress > 0.02 ? 1 : 0.12} />
            <path d={qPath} className="p4-query-link" style={{ opacity: queryEdge ? 0.25 + attention * 0.75 : 0.08, strokeWidth: 1 + attention * 5 }} />
            <text className="p4-alpha-label" x="350" y={row - 8} opacity={qkProgress > 0.03 ? 1 : 0.35}>α{index}={number(attention)}</text>
            <path d={vPath} className="p4-value-link" style={{ opacity: valueEdge ? 0.3 + attention * 0.7 : 0.08, strokeWidth: 1 + attention * 3 }} />

            <g className={`p4-input-token ${index < 2 ? "is-prompt" : "is-image"}`}>
              <rect x="24" y={row - 27} width="130" height="54" rx="10" />
              <text className="p4-token-name" x="34" y={row - 6}>{tokenNames[index]}</text>
              <text className="p4-token-vector" x="34" y={row + 14}>[{number(state.inputTokens[index][0])}, {number(state.inputTokens[index][1])}]</text>
              <MiniVector values={state.inputTokens[index]} x={101} y={row - 15} color={index < 2 ? "#704d82" : "#3d7a70"} />
            </g>

            <g className={`p4-key-token ${qkProgress > 0.05 ? "is-lit" : ""}`} style={{ opacity: 0.35 + qkProgress * 0.65 }}>
              <rect x="395" y={row - 27} width="113" height="54" rx="9" />
              <text className="p4-node-name" x="403" y={row - 6}>K{index}</text>
              <text className="p4-node-vector" x="403" y={row + 14}>[{number(key[0])}, {number(key[1])}]</text>
              <MiniVector values={key} x={467} y={row - 15} color="#376c7c" />
            </g>

            <g className={`p4-value-token ${valueProgress > 0.05 ? "is-lit" : ""}`} style={{ opacity: 0.38 + valueProgress * 0.62 }}>
              <rect x="535" y={row - 27} width="115" height="54" rx="9" />
              <text className="p4-node-name" x="543" y={row - 6}>V{index}</text>
              <text className="p4-node-vector" x="543" y={row + 14}>[{number(value[0])}, {number(value[1])}]</text>
              <MiniVector values={value} x={610} y={row - 15} color="#387a72" />
            </g>

            <g className={`p4-weighted-token ${valueProgress > 0.45 ? "is-lit" : ""}`} style={{ opacity: 0.24 + valueProgress * 0.76 }}>
              <rect x="690" y={row - 27} width="120" height="54" rx="9" />
              <text className="p4-node-name" x="698" y={row - 6}>α{index}V{index}</text>
              <text className="p4-node-vector" x="698" y={row + 14}>[{number(weightedValue[0])}, {number(weightedValue[1])}]</text>
              <MiniVector values={weightedValue} x={768} y={row - 15} color="#704d82" />
            </g>

            {queryEdge && <circle className="p4-signal-bead p4-query-bead" cx={qDot[0]} cy={qDot[1]} r="4.4" />}
            {valueEdge && <circle className="p4-signal-bead p4-value-bead" cx={vDot[0]} cy={vDot[1]} r="4.2" />}
          </g>;
        })}

        <path d="M154 110 C198 110 197 248 220 248" className="p4-query-source" opacity={forwardProgress > 0.02 ? 1 : 0.12} />
        <g className="p4-query-token" style={{ opacity: clamp(forwardProgress * 1.5) }}>
          <rect x="220" y="211" width="110" height="74" rx="12" />
          <text className="p4-node-name" x="230" y="235">Q₀ ← P₀</text>
          <text className="p4-node-vector" x="230" y="255">[{number(state.firstPromptQuery[0])}, {number(state.firstPromptQuery[1])}]</text>
          <MiniVector values={state.firstPromptQuery} x={284} y={263} color="#704d82" />
        </g>

        <path d="M810 248H840" className="p4-sum-link" opacity={valueProgress} markerEnd="url(#p4-object-arrow)" />
        <g className="p4-context-node" style={{ opacity: clamp(valueProgress * 1.4) }}>
          <circle cx="884" cy="248" r="40" />
          <text className="p4-sum-symbol" x="884" y="244" textAnchor="middle">Σ αV</text>
          <text className="p4-node-vector" x="884" y="260" textAnchor="middle">[{number(state.firstPromptContext[0])}, {number(state.firstPromptContext[1])}]</text>
        </g>
        <path d="M924 248H955" className="p4-sum-link" opacity={outputProgress} markerEnd="url(#p4-object-arrow)" />
        <g className="p4-frozen-node" style={{ opacity: 0.3 + outputProgress * 0.7 }}>
          <rect x="955" y="220" width="60" height="56" rx="9" />
          <text className="p4-node-name" x="985" y="243" textAnchor="middle">W<tspan baselineShift="sub" fontSize="8">O</tspan></text>
          <path d="M977 254v-4a4 4 0 0 1 8 0v4m-10 0h12v9h-12z" className="p4-lock-icon" />
        </g>
        <path d="M1015 248H1040" className="p4-sum-link" opacity={outputProgress} markerEnd="url(#p4-object-arrow)" />
        <g className="p4-output-token" style={{ opacity: clamp(outputProgress * 1.4) }}>
          <rect x="1040" y="214" width="92" height="68" rx="12" />
          <text className="p4-node-name" x="1086" y="239" textAnchor="middle">H₀</text>
          <text className="p4-node-vector" x="1086" y="257" textAnchor="middle">[{number(state.firstPromptOutput[0])}, {number(state.firstPromptOutput[1])}]</text>
        </g>
        <text className="p4-scene-footnote" x="24" y="458">Q₀ 只作局部放大；每个输入位置都会产生自己的 Q，并对全部 K、V 执行同一注意力计算。</text>
        <text className="p4-scene-footnote" x="835" y="458">所有矩阵固定 · 此处仅显示 P₀ 对应输出 H₀</text>
      </svg>
    </div>

    <div className="p4-learning-scene">
      <section className="p4-backprop-scene" aria-label="分类损失梯度经分类头与冻结 Transformer 运算回到 Prompt">
        <div className="p4-subscene-heading"><strong>梯度回到真正接收更新的对象</strong><span>反向经过冻结块；参数写入只落在 P 与分类头 φ</span></div>
        <svg viewBox="0 0 1000 170" role="img" aria-labelledby="p4-gradient-title p4-gradient-desc">
          <title id="p4-gradient-title">梯度由交叉熵经分类头和冻结计算回到 Prompt 参数</title>
          <desc id="p4-gradient-desc">紫色信号从右向左经过分类头与冻结 Transformer 计算，再分流至 P₀ 和 P₁；冻结矩阵接收并传递梯度，但不被更新。</desc>
          <defs><marker id="p4-backprop-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#75588a" /></marker></defs>
          <path d="M900 77H740 M655 77H480 M380 77H210 M380 77C310 77 295 45 210 45 M380 77C310 77 295 112 210 112" className="p4-gradient-path" markerEnd="url(#p4-backprop-arrow)" />
          <g className={`p4-backprop-node p4-backprop-loss ${gradientProgress > 0.02 ? "is-active" : ""}`}>
            <rect x="900" y="48" width="80" height="58" rx="10" /><text x="940" y="73" textAnchor="middle">CE ℒ</text><text x="940" y="91" textAnchor="middle">y=1</text>
          </g>
          <g className={`p4-backprop-node p4-backprop-classifier ${gradientProgress > 0.2 ? "is-active" : ""}`}>
            <rect x="655" y="48" width="85" height="58" rx="10" /><text x="697" y="73" textAnchor="middle">分类头</text><text x="697" y="91" textAnchor="middle">Wcls, bcls</text>
          </g>
          <g className={`p4-backprop-node p4-backprop-frozen ${gradientProgress > 0.48 ? "is-active" : ""}`}>
            <rect x="380" y="43" width="100" height="68" rx="10" /><text x="430" y="70" textAnchor="middle">冻结 fᵣ</text><text x="430" y="88" textAnchor="middle">传梯度 · 不写入</text>
            <path d="M421 98v-4a4 4 0 0 1 8 0v4m-10 0h12v8h-12z" className="p4-lock-icon" />
          </g>
          {[0, 1].map(index => <g className={`p4-backprop-node p4-backprop-prompt ${gradientProgress > 0.76 ? "is-active" : ""}`} key={index}>
            <rect x="115" y={index === 0 ? 20 : 87} width="95" height="50" rx="10" />
            <text x="124" y={index === 0 ? 42 : 109}>P{index} · ∇ℒ</text>
            <text className="p4-gradient-vector" x="124" y={index === 0 ? 59 : 126}>{showGradientValues ? `[${number(P4_TRAINING_TRACE.promptGradients[index][0])}, ${number(P4_TRAINING_TRACE.promptGradients[index][1])}]` : "等待回传"}</text>
          </g>)}
          <g className={`p4-backprop-node p4-gradient-classifier ${gradientProgress > 0.36 ? "is-active" : ""}`}>
            <rect x="755" y="123" width="225" height="32" rx="8" /><text x="867" y="144" textAnchor="middle">∇Wcls ℒ · ∇bcls ℒ 同步得到</text>
          </g>
          {gradientProgress > 0 && [0, 1].map(index => {
            const start: Pair = [900, 77];
            const classPoint: Pair = [655, 77];
            const frozenPoint: Pair = [380, 77];
            const promptPoint: Pair = [210, index === 0 ? 45 : 112];
            const t = gradientProgress;
            const point = t < 0.22
              ? ([start[0] + (classPoint[0] - start[0]) * (t / 0.22), 77] as Pair)
              : t < 0.52
                ? ([classPoint[0] + (frozenPoint[0] - classPoint[0]) * ((t - 0.22) / 0.3), 77] as Pair)
                : cubicPoint(frozenPoint, [330, 77], [290, index === 0 ? 45 : 112], promptPoint, (t - 0.52) / 0.48);
            return <circle className="p4-gradient-bead" key={index} cx={point[0]} cy={point[1]} r="4.2" />;
          })}
        </svg>
      </section>

      <section className="p4-parameter-scene" aria-label="Prompt 参数在二维特征空间中的更新轨迹">
        <div className="p4-subscene-heading"><strong>同一参数对象沿 −η∇P 移动</strong><span>显示局部位移 ×2000；点旁坐标仍是计算得到的真实参数值。</span></div>
        <div className="p4-parameter-plots">
          {[0, 1].map(index => {
            const original = P4_TOY_EXPERIMENT.prompt[index];
            const target = P4_TRAINING_TRACE.updatedPrompt[index];
            const current = currentPrompt[index];
            const revealTarget = activePhase >= 3;
            const displacementScale = 2000;
            const from: Pair = [82, 56];
            const to: Pair = [82 + (target[0] - original[0]) * displacementScale, 56 - (target[1] - original[1]) * displacementScale];
            const now: Pair = [from[0] + (to[0] - from[0]) * updateProgress, from[1] + (to[1] - from[1]) * updateProgress];
            return <div className="p4-parameter-plot" key={index}>
              <svg viewBox="0 0 180 92" role="img" aria-label={`P${index} 参数更新轨迹，局部位移放大 2000 倍；真实值由 (${number(original[0])}, ${number(original[1])}) 移动到 (${number(target[0])}, ${number(target[1])})`}>
                <defs><marker id={`p4-parameter-arrow-${index}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#997caa" /></marker></defs>
                <path d="M20 56H162 M82 12V82" className="p4-parameter-axis" />
                {revealTarget && <path d={`M${from[0]} ${from[1]}L${to[0]} ${to[1]}`} className="p4-parameter-trail" markerEnd={`url(#p4-parameter-arrow-${index})`} />}
                <circle cx={from[0]} cy={from[1]} r="6" className="p4-parameter-origin" />
                {revealTarget && <circle cx={to[0]} cy={to[1]} r="5" className="p4-parameter-target" />}
                <circle cx={now[0]} cy={now[1]} r="6" className="p4-parameter-current" />
                <text x="9" y="16">d₂</text><text x="163" y="72">d₁</text>
              </svg>
              <span><b>P{index}</b><code>{`(${number(current[0])}, ${number(current[1])})`}</code></span>
            </div>;
          })}
        </div>
      </section>
    </div>
    <p className="p4-object-caption">输入点、投影向量、注意力权重、Value 贡献、梯度与参数位置都取自同一份 toy forward/backward trace。画面展开 P₀ 的局部计算；完整分类读出仍取 H₀ 与 H₁ 的均值。</p>
  </section>;
}

export function PromptTuning() {
  const playback = useLessonPlayback(duration);
  const activePhase = phaseAt(playback.position);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const updateProgress = activePhase === 4 ? (reducedMotion ? 1 : cubicBezierProgress(phaseProgress(playback.position, 4))) : activePhase > 4 ? 1 : 0;
  const currentPrompt = interpolateMatrix(P4_TOY_EXPERIMENT.prompt, P4_TRAINING_TRACE.updatedPrompt, updateProgress);
  const currentClassifierWeights = interpolateMatrix(P4_TOY_EXPERIMENT.classifier.weights, P4_TRAINING_TRACE.updatedClassifierWeights, updateProgress);
  const currentClassifierBias = interpolatePair(P4_TOY_EXPERIMENT.classifier.bias, P4_TRAINING_TRACE.updatedClassifierBias, updateProgress);
  const calculation = activePhase === 0 ? null : activePhase === 4
    ? runP4Forward(currentPrompt, currentClassifierWeights, currentClassifierBias)
    : activePhase > 4 ? P4_TRAINING_TRACE.updated : P4_TRAINING_TRACE.initial;
  const gradientProgress = activePhase > 3 ? 1 : activePhase === 3 ? phaseProgress(playback.position, 3) : 0;
  const showLoss = activePhase >= 2;
  const showGradients = activePhase >= 3;
  const showReforward = activePhase >= 5;
  const forwardProgress = activePhase === 1 || activePhase === 5
    ? (reducedMotion ? 1 : phaseProgress(playback.position, activePhase))
    : activePhase > 1 ? 1 : 0;
  const displayState = calculation ?? P4_TRAINING_TRACE.initial;

  return <>
    <p className="lesson-lead">P3 已经给出一个入口：即使 Transformer 权重固定，改变输入 Token 仍会改变输出。Prompt Tuning 把一小段连续向量设为可学习参数，让它随图像一起进入网络，靠分类误差适应新任务。</p>

    <section className="explain-section">
      <h3>Prompt 是一组向量参数，不是图像 Patch 或自然语言句子</h3>
      <p>沿用 P2 的图像嵌入层，先得到 <math><msub><mi>x</mi><mi>e</mi></msub></math>。Prompt 放在这段序列之前：每个 Prompt Token 与图像 Token 有相同的特征宽度 <math><mi>D</mi></math>，因此增加的是位置数，不是新建 Transformer 层。</p>
      <div className="p4-shape-equations">
        <math display="block"><mi>P</mi><mo>∈</mo><msup><mi>ℝ</mi><mrow><msub><mi>L</mi><mi>p</mi></msub><mo>×</mo><mi>D</mi></mrow></msup></math>
        <math display="block"><msub><mi>x</mi><mi>p</mi></msub><mo>=</mo><mo>[</mo><mi>P</mi><mo>;</mo><msub><mi>x</mi><mi>e</mi></msub><mo>]</mo><mo>∈</mo><msup><mi>ℝ</mi><mrow><mo>(</mo><msub><mi>L</mi><mi>p</mi></msub><mo>+</mo><mi>L</mi><mo>)</mo><mo>×</mo><mi>D</mi></mrow></msup><mo>,</mo><mi>H</mi><mo>=</mo><msub><mi>f</mi><mi>r</mi></msub><mo>(</mo><msub><mi>x</mi><mi>p</mi></msub><mo>)</mo></math>
      </div>
      <p>这里的分号表示沿序列长度拼接。P4 用单个 Prompt 做训练原理的简化教学桥；L2P 正式使用多个 Prompt，并读取它们经过 Transformer 后的位置输出，留到 P6。</p>
    </section>

    <figure className="lesson-figure p4-training-figure">
      <div className="figure-top"><strong>一次可复算更新 · 冻结 Attention 中的可学习输入</strong><span>教学模型：2 维、单头、2 个 Prompt Token</span></div>
      <div className="p4-control-dock" aria-label="Prompt 参数实验控制">
        <div className="motion-stops" role="group" aria-label="选择 Prompt 调优的观察阶段">
          {phases.map((phase, index) => <button className="lesson-choice" type="button" key={phase.short} aria-pressed={activePhase === index} onClick={() => playback.seek(boundaries[index])}>{index + 1}. {phase.short}</button>)}
        </div>
        <div className="p4-control-bottomline">
          <PlaybackControls playback={playback} label="一次 Prompt 更新的计算进度" />
          <p className="motion-status" aria-live="polite">{phases[activePhase].text}</p>
        </div>
      </div>
      <div className="figure-body">
        <div className="p4-computation-caption">
          <span>可复算教学数据，不是论文测量值</span>
          <span>固定输入 x<sub>e</sub> 与 Attention 参数 · 标签 y=1 · 学习率 η={P4_TOY_EXPERIMENT.learningRate.toFixed(2)}</span>
        </div>

        <P4ObjectCircuit state={displayState} activePhase={activePhase} forwardProgress={forwardProgress} gradientProgress={gradientProgress} currentPrompt={currentPrompt} updateProgress={updateProgress} />

        <div className="p4-workbench-grid">
          <section className={`p4-workbench-column p4-input-column ${activePhase === 0 ? "is-active" : ""}`} aria-label="Prompt 与固定图像输入">
            <div className="p4-column-heading"><strong>输入 Token</strong><span>宽度 D=2</span></div>
            <div className="p4-live-prompt" aria-label="当前 Prompt 数值">
              <strong>P<sup>{activePhase >= 5 ? "1" : activePhase === 4 ? "t" : "0"}</sup></strong>
              {currentPrompt.map((row, index) => <span key={index}><small>P<sub>{index}</sub></small><VectorValue values={row} /></span>)}
            </div>
            <div className="p4-fixed-inputs">
              <strong>固定图像嵌入 x<sub>e</sub></strong>
              <span><b>[CLS]</b><VectorValue values={P4_TOY_EXPERIMENT.imageTokens[0]} /></span>
              <span><b>Patch₁</b><VectorValue values={P4_TOY_EXPERIMENT.imageTokens[1]} /></span>
              <small>[P₀; P₁; CLS; Patch₁] · 4×2</small>
            </div>
          </section>

          <section className={`p4-workbench-column p4-attention-column ${activePhase === 1 || activePhase === 3 ? "is-active" : ""}`} aria-label="冻结 Attention 前向计算">
            <div className="p4-column-heading"><strong>同一冻结 Attention</strong><span>只更新输入，不更新这些矩阵</span></div>
            <div className="p4-fixed-matrices" aria-label="冻结的注意力投影矩阵">
              <ParameterMatrix label="WQ" values={P4_TOY_EXPERIMENT.frozenWeights.wq} />
              <ParameterMatrix label="WK" values={P4_TOY_EXPERIMENT.frozenWeights.wk} />
              <ParameterMatrix label="WV" values={P4_TOY_EXPERIMENT.frozenWeights.wv} />
              <ParameterMatrix label="WO" values={P4_TOY_EXPERIMENT.frozenWeights.wo} />
            </div>
            <div className="p4-attention-rule"><math><mi>Softmax</mi><mo>(</mo><msub><mi>Q</mi><mn>0</mn></msub><msup><mi>K</mi><mi>T</mi></msup><mo>/</mo><msqrt><mn>2</mn></msqrt><mo>)</mo></math><span>首个 Prompt 对来源位置的权重</span></div>
            <div className="p4-attention-weights">
              {["P₀", "P₁", "[CLS]", "Patch₁"].map((label, index) => <div className="p4-attention-row" key={label}>
                <b>{label}</b><span className="p4-attention-track"><i style={{ transform: `scaleX(${calculation?.firstPromptAttention[index] ?? 0})` }} /></span><code>{calculation ? calculation.firstPromptAttention[index].toFixed(3) : "—"}</code>
              </div>)}
            </div>
            <small className="p4-freeze-note">fᵣ 的运算仍参与反向求导；WQ/WK/WV/WO 的数值保持固定。</small>
          </section>

          <section className={`p4-workbench-column p4-output-column ${activePhase === 2 || activePhase === 5 ? "is-active" : ""}`} aria-label="读出、分类与交叉熵">
            <div className="p4-column-heading"><strong>简化读出与分类</strong><span>单 Prompt 教学设定</span></div>
            <div className="p4-output-readout"><math><mi>h</mi><mo>(</mo><mi>P</mi><mo>,</mo><mi>x</mi><mo>)</mo><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>(</mo><msub><mi>H</mi><mn>0</mn></msub><mo>+</mo><msub><mi>H</mi><mn>1</mn></msub><mo>)</mo></math>{calculation ? <VectorValue values={calculation.promptReadout} /> : <span>等待前向</span>}</div>
            <div className="p4-logits-line"><span>z₀</span><code>{calculation ? number(calculation.logits[0]) : "—"}</code><span>z₁</span><code>{calculation ? number(calculation.logits[1]) : "—"}</code></div>
            <div className="p4-softmax-line"><span>Softmax(z)</span><code>{calculation ? `[${number(calculation.probabilities[0])}, ${number(calculation.probabilities[1])}]` : "等待前向"}</code></div>
            <div className={`p4-loss-readout ${showLoss ? "is-visible" : ""}`}><strong>CE(y=1, z)</strong><code>{showLoss && calculation ? number(calculation.loss) : "等待标签比较"}</code></div>
          </section>
        </div>

        <div className={`p4-gradient-route ${activePhase === 3 ? "is-active" : ""}`} aria-label="分类损失的梯度穿过冻结 Attention 运算，回到 Prompt 与分类头">
          <div className="p4-gradient-heading"><strong>反向梯度</strong><span>来自同一交叉熵计算图</span></div>
          <div className="p4-gradient-visual">
            <math><mo>∂</mo><mi>ℒ</mi><mo>/</mo><mo>∂</mo><mi>h</mi></math>
            <svg viewBox="0 0 520 42" preserveAspectRatio="none" role="img" aria-label="梯度从分类损失经过固定 Attention 运算回传至 Prompt">
              <defs><marker id="p4-gradient-arrow" markerWidth="7" markerHeight="7" refX="2.5" refY="3.5" orient="auto"><path d="M7 0L0 3.5L7 7Z" fill="currentColor" /></marker></defs>
              <path d="M495 21 H18" className="p4-gradient-line" markerEnd="url(#p4-gradient-arrow)" />
              <circle className="p4-gradient-particle" cx="0" cy="21" r="4" transform={`translate(${495 - 477 * gradientProgress} 0)`} />
            </svg>
            <math><mo>∂</mo><mi>ℒ</mi><mo>/</mo><mo>∂</mo><mi>P</mi></math>
          </div>
          <div className="p4-gradient-numbers">
            <span><b>∇P ℒ</b>{showGradients ? <code>[[{number(P4_TRAINING_TRACE.promptGradients[0][0])}, {number(P4_TRAINING_TRACE.promptGradients[0][1])}], [{number(P4_TRAINING_TRACE.promptGradients[1][0])}, {number(P4_TRAINING_TRACE.promptGradients[1][1])}]]</code> : <span>等待损失回传</span>}</span>
            <span><b>∇Wcls ℒ</b>{showGradients ? <code>[[{number(P4_TRAINING_TRACE.classifierWeightGradients[0][0])}, {number(P4_TRAINING_TRACE.classifierWeightGradients[0][1])}], [{number(P4_TRAINING_TRACE.classifierWeightGradients[1][0])}, {number(P4_TRAINING_TRACE.classifierWeightGradients[1][1])}]]</code> : <span>等待损失回传</span>}</span>
            <span><b>∇bcls ℒ</b>{showGradients ? <code>[{number(P4_TRAINING_TRACE.classifierBiasGradients[0])}, {number(P4_TRAINING_TRACE.classifierBiasGradients[1])}]</code> : <span>等待损失回传</span>}</span>
          </div>
        </div>

        <div className={`p4-update-workbench ${activePhase === 4 ? "is-active" : ""}`} aria-label="Prompt 与分类头的一步 SGD 数值更新">
          <div className="p4-update-heading">
            <div><strong>一步 SGD · 数值逐项对应</strong><span>P 与分类头更新；冻结主干不写入优化器</span></div>
            <div className="p4-update-equations"><math><msup><mi>P</mi><mn>1</mn></msup><mo>=</mo><msup><mi>P</mi><mn>0</mn></msup><mo>−</mo><mi>η</mi><msub><mo>∇</mo><mi>P</mi></msub><mi>ℒ</mi></math><math><msubsup><mi>W</mi><mi>cls</mi><mn>1</mn></msubsup><mo>=</mo><msubsup><mi>W</mi><mi>cls</mi><mn>0</mn></msubsup><mo>−</mo><mi>η</mi><msub><mo>∇</mo><msub><mi>W</mi><mi>cls</mi></msub></msub><mi>ℒ</mi></math></div>
          </div>
          <div className="p4-update-grid">
            <div className="p4-prompt-update-table">
              <div className="p4-update-table-head"><span>参数对象</span><span>旧值 P⁰</span><span>梯度 ∇Pℒ</span><span>{activePhase >= 4 ? "当前值 Pᵗ → P¹" : "当前值"}</span></div>
              {[0, 1].map(index => <div className="p4-update-table-row" key={index}>
                <b>P<sub>{index}</sub></b><VectorValue values={P4_TOY_EXPERIMENT.prompt[index]} />{showGradients ? <VectorValue values={P4_TRAINING_TRACE.promptGradients[index]} /> : <span>待计算</span>}<span className="p4-updated-value"><VectorValue values={currentPrompt[index]} />{activePhase >= 4 && <small>终点 <VectorValue values={P4_TRAINING_TRACE.updatedPrompt[index]} /></small>}</span>
              </div>)}
              <small>更新展示沿逐坐标线性插值；中间帧不是额外的优化器步。每帧输出都由当前参数重新计算。</small>
            </div>
            <div className="p4-classifier-update">
              <div className="p4-update-table-head"><span>分类头参数</span><span>梯度</span><span>当前值</span></div>
              <div className="p4-head-gradient-row"><b>Wcls</b>{showGradients ? <code>[[{number(P4_TRAINING_TRACE.classifierWeightGradients[0][0])}, {number(P4_TRAINING_TRACE.classifierWeightGradients[0][1])}], [{number(P4_TRAINING_TRACE.classifierWeightGradients[1][0])}, {number(P4_TRAINING_TRACE.classifierWeightGradients[1][1])}]]</code> : <code>待计算</code>}<code>[[{number(currentClassifierWeights[0][0])}, {number(currentClassifierWeights[0][1])}], [{number(currentClassifierWeights[1][0])}, {number(currentClassifierWeights[1][1])}]]</code></div>
              <div className="p4-head-gradient-row"><b>bcls</b>{showGradients ? <code>[{number(P4_TRAINING_TRACE.classifierBiasGradients[0])}, {number(P4_TRAINING_TRACE.classifierBiasGradients[1])}]</code> : <code>待计算</code>}<code>[{number(currentClassifierBias[0])}, {number(currentClassifierBias[1])}]</code></div>
              <small>δfₑ = δfᵣ = 0：冻结层权重未更新。</small>
            </div>
          </div>
          <div className="p4-reforward-compare" aria-label="更新前后同一图像的重新前向结果">
            <strong>固定同一 xₑ 与 fᵣ，更新前后再前向</strong>
            {showReforward ? <><div><span>更新前 <code>z⁰=[{number(P4_TRAINING_TRACE.initial.logits[0])}, {number(P4_TRAINING_TRACE.initial.logits[1])}]</code><code>ℒ⁰={number(P4_TRAINING_TRACE.initial.loss)}</code></span><Arrow /><span>更新后 <code>z¹=[{calculation ? number(calculation.logits[0]) : number(P4_TRAINING_TRACE.updated.logits[0])}, {calculation ? number(calculation.logits[1]) : number(P4_TRAINING_TRACE.updated.logits[1])}]</code><code>ℒ¹={calculation ? number(calculation.loss) : number(P4_TRAINING_TRACE.updated.loss)}</code></span></div><small>此参数设置的一次教学更新后，损失从 {number(P4_TRAINING_TRACE.initial.loss)} 变为 {number(P4_TRAINING_TRACE.updated.loss)}；不表示每一步 SGD 都保证损失下降。</small></> : <p>完成一次参数更新后，进入“同图复算”查看更新前后的输出。</p>}
          </div>
        </div>
        <p className="p4-model-note">计算图：2 个 Prompt Token + 2 个固定图像 Token → 单头自注意力 → 两个 Prompt 输出取均值（P4 简化读出）→ 线性分类头 → CE。梯度由本地标量反向自动微分得到；中心差分只用于独立校验。</p>
      </div>
      <figcaption>这里的低维参数、图像嵌入和分类标签构成可复算教学模型，不是预训练 ViT 的真实隐藏状态或论文实验数值。正式 L2P 对多个 Prompt 输出位置进行 AvgPool 的分类规则见 P6。</figcaption>
    </figure>

    <section className="explain-section">
      <h3>梯度能穿过冻结运算，参数却不必更新</h3>
      <aside className="reading-note reading-note--prompt">
        <strong>梯度能通过，权重仍冻结</strong>
        <p>分类损失依赖于输入序列里的 P，因此一般情形下可对 P 求梯度。反向计算经过固定的 Transformer 运算，把梯度传到 P；优化器只改 P 与分类器 φ，冻结主干 fₑ、fᵣ 的参数保持原值。</p>
      </aside>
      <div className="p4-gradient-equation">
        <div className="p4-equation-item">
          <span className="p4-equation-label">分类目标</span>
          <math display="block"><msub><mi>ℒ</mi><mi>cls</mi></msub><mo>=</mo><mi>CE</mi><mo>(</mo><msub><mi>g</mi><mi>φ</mi></msub><mo>(</mo><mi>h</mi><mo>(</mo><mi>P</mi><mo>,</mo><mi>x</mi><mo>)</mo><mo>)</mo><mo>,</mo><mi>y</mi><mo>)</mo></math>
        </div>
        <div className="p4-equation-item p4-gradient-condition">
          <span className="p4-equation-label">对 Prompt 的梯度</span>
          <math display="block"><msub><mo>∇</mo><mi>P</mi></msub><msub><mi>ℒ</mi><mi>cls</mi></msub><mo>≠</mo><mn>0</mn></math>
          <small>一般情形</small>
        </div>
      </div>
      <p>这不是在 P4 重新讲一次 Attention。P3 已说明输入 Token 会参与计算；这里沿用该结论，只追踪梯度落到哪里、哪些参数改变。</p>
    </section>

    <section className="explain-section">
      <h3>但所有任务若继续改同一个 Prompt，仍可能相互干扰</h3>
      <p>任务 A 学到的 Prompt 可以继续服务后续输入。若任务 B 接着更新这同一组参数，<span className="reading-emphasis reading-emphasis--caution">原先适用的方向可能改变</span>。因此“冻结 ViT”本身并没有回答怎样减少不同任务对少量可训练参数的争用；这里描述的是可能性，不是保证发生的遗忘结果。</p>
      <figure className={`lesson-figure p4-shared-prompt ${activePhase === 6 ? "is-current-task" : ""}`}>
        <div className="figure-top"><strong>同一组参数跨任务继续使用</strong><span>对象身份保持为同一个 P</span></div>
        <div className="figure-body">
          <div className="p4-task-sequence">
            <div><strong>任务 A</strong><span>分类损失更新 P</span></div><Arrow />
            <div className="p4-shared-parameter"><strong>同一组 Prompt P</strong><math className="p4-parameter-transition" display="block"><msup><mi>P</mi><mrow><mo>(</mo><mi>A</mi><mo>)</mo></mrow></msup><mo>→</mo><msup><mi>P</mi><mrow><mi>A</mi><mo>→</mo><mi>B</mi></mrow></msup></math></div><Arrow />
            <div><strong>任务 B</strong><span>可再次写入这组参数</span></div>
          </div>
          <p className="p4-conflict-note">任务 B 的输入与梯度不在本示例里模拟；这里只标明同一参数对象会继续被使用。</p>
        </div>
      </figure>
    </section>

    <p className="lesson-takeaway">如果一个 Prompt 仍会被多个任务共同修改，能否保存多个 Prompt，再让当前图像自己选出需要的一部分？</p>
  </>;
}
