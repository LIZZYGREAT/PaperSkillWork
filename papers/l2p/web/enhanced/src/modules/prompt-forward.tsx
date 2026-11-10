import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLessonPlayback, PlaybackControls } from "./lesson-playback";
import { Arrow } from "./vit-visuals";
import { promptPoolConfig } from "./prompt-retrieval-data";
import {
  P6_FINAL_POOL_EXAMPLE,
  P6_FIRST_PATCH_SEQUENCE_INDEX,
  P6_IMAGE_CLS_SEQUENCE_INDEX,
  P6_LAST_PATCH_SEQUENCE_INDEX,
  P6_POOL_SAMPLE_ROWS,
  P6_PROMPT_COUNT,
  P6_PROMPT_TOKEN_COUNT,
  P6_PROMPT_TOKEN_MAP,
  P6_SELECTED_PROMPT_INDICES,
  P6_SEQUENCE_LENGTH,
  computePromptOutputPool,
} from "./prompt-forward-data";
import "./prompt-forward.css";

const duration = 9450;
const boundaries = [0, 1000, 1950, 4350, 6050, 8450, duration];
const patchCount = promptPoolConfig.imageLength - 1;
const flightStep = 0.033;
const flightSpan = 0.115;
const poolContributions = P6_POOL_SAMPLE_ROWS.flatMap(row => row.values.map((value, tokenIndex) => ({
  promptIndex: row.promptIndex,
  tokenIndex,
  sequenceIndex: row.sequenceStart + tokenIndex,
  value,
})));
const phases = [
  { short: "接收 P5 选集", text: "Query A 的五个索引直接来自 P5 共享检索函数；读取 Prompt 副本，源池保持原位。" },
  { short: "准备图像序列", text: `同一图像经过冻结嵌入层得到 [CLS] 与 ${patchCount} 个 Patch 位置，共 ${promptPoolConfig.imageLength}×${promptPoolConfig.featureWidth}。` },
  { short: "按索引拼接", text: `${P6_PROMPT_COUNT} 组 Prompt 按 P5 返回顺序写入 xₚ 的前 ${P6_PROMPT_TOKEN_COUNT} 个位置；图像 CLS 从绝对位置 ${P6_IMAGE_CLS_SEQUENCE_INDEX} 接续。` },
  { short: "冻结前向", text: `完整的 ${P6_SEQUENCE_LENGTH}×${promptPoolConfig.featureWidth} 序列通过同一组冻结 Transformer 权重；位置身份保留，表示经过上下文计算。` },
  { short: "平均 Prompt 输出", text: `逐个汇总 H[0:${P6_PROMPT_TOKEN_COUNT},:] 中的 ${P6_PROMPT_TOKEN_COUNT} 个 Prompt 输出位置；图像 CLS 与 Patch 输出不参与 AvgPool。` },
  { short: "进入分类器", text: `池化向量 h 属于 ${promptPoolConfig.featureWidth} 维；它进入共享分类头得到 Logits 与 argmax 预测规则。` },
];

function phaseAt(position: number) {
  if (position >= duration) return phases.length - 1;
  const index = boundaries.findIndex((_, i) => i < boundaries.length - 1 && position >= boundaries[i] && position < boundaries[i + 1]);
  return Math.max(0, index);
}

function phaseProgress(position: number, phase: number) {
  return Math.max(0, Math.min(1, (position - boundaries[phase]) / (boundaries[phase + 1] - boundaries[phase])));
}

function clamp(value: number) { return Math.max(0, Math.min(1, value)); }

function easeInOut(value: number) {
  const time = clamp(value);
  const coordinate = (t: number, first: number, second: number) => 3 * (1 - t) ** 2 * t * first + 3 * (1 - t) * t ** 2 * second + t ** 3;
  let low = 0;
  let high = 1;
  let parameter = time;
  for (let iteration = 0; iteration < 12; iteration += 1) {
    parameter = (low + high) / 2;
    if (coordinate(parameter, 0.77, 0.175) < time) low = parameter;
    else high = parameter;
  }
  return coordinate(parameter, 0, 1);
}

function flightProgress(progress: number, index: number) {
  return clamp((progress - index * flightStep) / flightSpan);
}

type Point = Readonly<{ x: number; y: number }>;
type FlightGeometry = Readonly<{ width: number; height: number; points: Readonly<Record<string, Point>> }>;

function pointOnArc(start: Point, end: Point, progress: number): Point {
  const t = easeInOut(progress);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lift = Math.min(76, Math.max(26, Math.abs(dy) * 0.16 + Math.abs(dx) * 0.035));
  const first = { x: start.x + dx * 0.28, y: start.y + dy * 0.18 - lift };
  const second = { x: start.x + dx * 0.72, y: end.y - dy * 0.18 - lift };
  const inverse = 1 - t;
  return {
    x: inverse ** 3 * start.x + 3 * inverse ** 2 * t * first.x + 3 * inverse * t ** 2 * second.x + t ** 3 * end.x,
    y: inverse ** 3 * start.y + 3 * inverse ** 2 * t * first.y + 3 * inverse * t ** 2 * second.y + t ** 3 * end.y,
  };
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useFlightGeometry(figureRef: { current: HTMLElement | null }) {
  const [geometry, setGeometry] = useState<FlightGeometry | null>(null);

  useLayoutEffect(() => {
    const root = figureRef.current;
    if (!root) return;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!root.isConnected) return;
        const rootRect = root.getBoundingClientRect();
        const points: Record<string, Point> = {};
        root.querySelectorAll<HTMLElement>("[data-p6-anchor]").forEach(element => {
          const key = element.dataset.p6Anchor;
          if (!key) return;
          const rect = element.getBoundingClientRect();
          points[key] = { x: rect.left - rootRect.left + rect.width / 2, y: rect.top - rootRect.top + rect.height / 2 };
        });
        const next = { width: rootRect.width, height: rootRect.height, points };
        setGeometry(previous => {
          if (previous && Math.abs(previous.width - next.width) < 0.5 && Math.abs(previous.height - next.height) < 0.5) {
            const keys = Object.keys(points);
            if (keys.length === Object.keys(previous.points).length && keys.every(key => {
              const before = previous.points[key];
              return before && Math.abs(before.x - points[key].x) < 0.5 && Math.abs(before.y - points[key].y) < 0.5;
            })) return previous;
          }
          return next;
        });
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    root.querySelectorAll<HTMLElement>("[data-p6-anchor]").forEach(element => observer.observe(element));
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [figureRef]);

  return geometry;
}

function PromptName({ index }: { index: number }) {
  return <>P<sub>{index}</sub></>;
}

function SourcePromptView() {
  return <div className="p6-source-prompt-list" aria-label="按 P5 Query A 顺序取得的 Prompt 读取副本">
    {P6_SELECTED_PROMPT_INDICES.map((index, promptOrdinal) => <span className="p6-source-prompt" key={index}>
      <strong><PromptName index={index} /></strong>
      <small>读取视图</small>
      <span className="p6-source-prompt-tokens" aria-label={`${promptPoolConfig.promptLength} 个 Prompt Token`}>
        {Array.from({ length: promptPoolConfig.promptLength }, (_, tokenIndex) => <i key={tokenIndex} data-p6-anchor={`prompt-source-${promptOrdinal}-${tokenIndex}`}>T{tokenIndex + 1}</i>)}
      </span>
    </span>)}
  </div>;
}

function PromptSequenceGroups({
  mergeProgress,
  selectedSequenceIndex,
  onSelect,
}: {
  mergeProgress: number;
  selectedSequenceIndex: number;
  onSelect: (sequenceIndex: number) => void;
}) {
  return <div className="p6-sequence-prompt-groups" aria-label={`拼接序列前 ${P6_PROMPT_TOKEN_COUNT} 个 Prompt 位置`}>
    {P6_SELECTED_PROMPT_INDICES.map((promptIndex, promptOrdinal) => {
      const refs = P6_PROMPT_TOKEN_MAP.filter(ref => ref.promptOrdinal === promptOrdinal);
      const groupProgress = clamp(mergeProgress * P6_PROMPT_COUNT - promptOrdinal);
      return <div className="p6-sequence-prompt-group" key={`${promptIndex}-${promptOrdinal}`} style={{ opacity: 0.72 + groupProgress * 0.28 }}>
        <div className="p6-sequence-group-heading"><PromptName index={promptIndex} /><span>位置 {refs[0].sequenceIndex}–{refs[refs.length - 1].sequenceIndex}</span></div>
          <div className="p6-sequence-group-cells">
          {refs.map(ref => {
            const tokenOrdinal = ref.promptOrdinal * promptPoolConfig.promptLength + ref.tokenIndex;
            const arrived = mergeProgress >= tokenOrdinal * flightStep + flightSpan;
            return <button
              className={`p6-sequence-cell ${selectedSequenceIndex === ref.sequenceIndex ? "is-selected" : ""} ${arrived ? "is-composed" : ""}`}
              type="button"
              key={ref.sequenceIndex}
              data-sequence-index={ref.sequenceIndex}
              data-p6-anchor={`prompt-target-${ref.promptOrdinal}-${ref.tokenIndex}`}
              aria-label={`${`Prompt P${ref.promptIndex}`} 内第 ${ref.tokenIndex + 1} 个 Token，扩展序列绝对位置 ${ref.sequenceIndex}`}
              aria-pressed={selectedSequenceIndex === ref.sequenceIndex}
              onClick={() => onSelect(ref.sequenceIndex)}
            ><small>T{ref.tokenIndex + 1}</small><b>{arrived ? ref.sequenceIndex : "·"}</b></button>;
          })}
        </div>
      </div>;
    })}
  </div>;
}

function PositionInspector({ sequenceIndex }: { sequenceIndex: number }) {
  const promptRef = P6_PROMPT_TOKEN_MAP.find(ref => ref.sequenceIndex === sequenceIndex);
  if (promptRef) return <span><strong>当前查看</strong><b><PromptName index={promptRef.promptIndex} /> · Token {promptRef.tokenIndex + 1} / {promptPoolConfig.promptLength}</b><code>xₚ[{promptRef.sequenceIndex}]</code></span>;
  if (sequenceIndex === P6_IMAGE_CLS_SEQUENCE_INDEX) return <span><strong>当前查看</strong><b>图像 [CLS]</b><code>xₚ[{P6_IMAGE_CLS_SEQUENCE_INDEX}]</code></span>;
  const patchIndex = sequenceIndex - P6_IMAGE_CLS_SEQUENCE_INDEX;
  return <span><strong>当前查看</strong><b>图像 Patch {patchIndex} / {patchCount}</b><code>xₚ[{sequenceIndex}]</code></span>;
}

function PoolingTable({
  includedCount,
  groupSums,
  selectedSequenceIndex,
  onSelect,
}: {
  includedCount: number;
  groupSums: readonly number[];
  selectedSequenceIndex: number;
  onSelect: (sequenceIndex: number) => void;
}) {
  return <table className="p6-pool-table" aria-label="五组 Prompt 输出位置在特征维度 1 的可复算示例">
    <thead><tr><th scope="col">Prompt 输出组</th>{Array.from({ length: promptPoolConfig.promptLength }, (_, index) => <th scope="col" key={index} aria-label={`Prompt Token ${index + 1}`}><span className="p6-pool-token-heading"><span className="p6-pool-token-heading-full" aria-hidden="true">Token {index + 1}</span><span className="p6-pool-token-heading-short" aria-hidden="true">T{index + 1}</span></span></th>)}<th scope="col">组内和</th></tr></thead>
    <tbody>
      {P6_POOL_SAMPLE_ROWS.map((row, rowIndex) => <tr key={`${row.promptIndex}-${rowIndex}`}>
        <th scope="row"><PromptName index={row.promptIndex} /><small>位置 {row.sequenceStart}–{row.sequenceStart + row.values.length - 1}</small></th>
        {row.values.map((value, tokenIndex) => {
          const sequenceIndex = row.sequenceStart + tokenIndex;
          const included = sequenceIndex < includedCount;
          const selected = sequenceIndex === selectedSequenceIndex;
          return <td key={sequenceIndex}>
            <button
              className={`p6-pool-value ${included ? "is-included" : ""} ${selected ? "is-selected" : ""}`}
              type="button"
              data-sequence-index={sequenceIndex}
              data-p6-anchor={`pool-source-${sequenceIndex}`}
              aria-label={`H[${sequenceIndex},1] 示例值 ${value.toFixed(1)}，来自 Prompt P${row.promptIndex} 的第 ${tokenIndex + 1} 个输出 Token${included ? "，已计入当前和" : ""}`}
              aria-pressed={selected}
              onClick={() => onSelect(sequenceIndex)}
            ><b>{value.toFixed(1)}</b><small>H[{sequenceIndex},1]</small></button>
          </td>;
        })}
        <td className="p6-row-sum">{includedCount === 0 ? "—" : groupSums[rowIndex].toFixed(2)}</td>
      </tr>)}
    </tbody>
  </table>;
}

function ReadoutScopeMap() {
  return <div className="p6-readout-scope" role="img" aria-label={`AvgPool 读取 H[0:${P6_PROMPT_TOKEN_COUNT},:] 的 ${P6_PROMPT_TOKEN_COUNT} 个 Prompt 输出位置；图像输出 H[${P6_IMAGE_CLS_SEQUENCE_INDEX}:${P6_SEQUENCE_LENGTH},:] 仍保留在上下文序列中，但不进入均值。`}>
    <div className="p6-scope-region p6-scope-included">
      <div className="p6-scope-heading"><strong>读入 AvgPool</strong><code>H[0:{P6_PROMPT_TOKEN_COUNT},:]</code></div>
      <div className="p6-scope-prompt-groups">
        {P6_SELECTED_PROMPT_INDICES.map((index, ordinal) => {
          const firstPosition = ordinal * promptPoolConfig.promptLength;
          const lastPosition = firstPosition + promptPoolConfig.promptLength - 1;
          return <span className="p6-scope-prompt-group" key={`${index}-${ordinal}`}>
            <strong><PromptName index={index} /></strong>
            <small>{firstPosition}–{lastPosition}</small>
            <span className="p6-scope-position-marks" aria-hidden="true">
              {Array.from({ length: promptPoolConfig.promptLength }, (_, tokenIndex) => <i key={tokenIndex} />)}
            </span>
          </span>;
        })}
      </div>
    </div>
    <div className="p6-scope-region p6-scope-retained">
      <div className="p6-scope-heading"><strong>留在 H · 不进入均值</strong><code>H[{P6_IMAGE_CLS_SEQUENCE_INDEX}:{P6_SEQUENCE_LENGTH},:]</code></div>
      <div className="p6-scope-image-positions">
        <span className="p6-scope-cls"><strong>[CLS]</strong><small>{P6_IMAGE_CLS_SEQUENCE_INDEX}</small></span>
        <span className="p6-scope-patches"><i aria-hidden="true" /><strong>Patch × {patchCount}</strong><small>{P6_FIRST_PATCH_SEQUENCE_INDEX}–{P6_LAST_PATCH_SEQUENCE_INDEX}</small></span>
      </div>
    </div>
  </div>;
}

function PoolingTray({ includedCount }: { includedCount: number }) {
  return <div className="p6-pool-tray" role="group" aria-label={`已进入求和区的 ${includedCount} 个 Prompt 输出示例值`}>
    {poolContributions.map(({ promptIndex, tokenIndex, sequenceIndex, value }) => {
      const included = sequenceIndex < includedCount;
      return <span className={`p6-pool-tray-slot ${included ? "is-filled" : ""}`} key={sequenceIndex} data-p6-anchor={`pool-target-${sequenceIndex}`} aria-label={included ? `已收集 H[${sequenceIndex},1] 的示例值 ${value.toFixed(1)}，来自 P${promptIndex} Token ${tokenIndex + 1}` : `等待 H[${sequenceIndex},1] 示例值`}>
        {included ? value.toFixed(1) : ""}
      </span>;
    })}
  </div>;
}

function FlightLayer({
  geometry,
  activePhase,
  mergeProgress,
  encoderProgress,
  poolingProgress,
}: {
  geometry: FlightGeometry | null;
  activePhase: number;
  mergeProgress: number;
  encoderProgress: number;
  poolingProgress: number;
}) {
  if (!geometry) return null;
  const { points, width, height } = geometry;
  const promptFlights = activePhase === 2 ? P6_PROMPT_TOKEN_MAP.flatMap(ref => {
    const ordinal = ref.promptOrdinal * promptPoolConfig.promptLength + ref.tokenIndex;
    const delay = ordinal * flightStep;
    const progress = flightProgress(mergeProgress, ordinal);
    const start = points[`prompt-source-${ref.promptOrdinal}-${ref.tokenIndex}`];
    const end = points[`prompt-target-${ref.promptOrdinal}-${ref.tokenIndex}`];
    if (!start || !end || mergeProgress < delay || progress >= 1) return [];
    const position = pointOnArc(start, end, progress);
    return <g className="p6-flight-token" key={`prompt-${ref.sequenceIndex}`} transform={`translate(${position.x} ${position.y})`}>
      <rect x="-26" y="-12" width="52" height="24" rx="6" />
      <text x="0" y="4" textAnchor="middle">P{ref.promptIndex}·T{ref.tokenIndex + 1}</text>
    </g>;
  }) : [];

  const imageStart = points["image-source"];
  const imageEnd = points["image-target"];
  const imageProgress = clamp((mergeProgress - 0.1) / 0.78);
  const imagePosition = imageStart && imageEnd ? pointOnArc(imageStart, imageEnd, imageProgress) : null;
  const imageFlight = activePhase === 2 && imageStart && imageEnd && mergeProgress >= 0.1 && imageProgress < 1 && imagePosition
    ? <g className="p6-flight-image" transform={`translate(${imagePosition.x} ${imagePosition.y})`}>
      <rect x="-72" y="-17" width="144" height="34" rx="8" />
      <text x="0" y="-1" textAnchor="middle">xₑ · 197 × 768</text>
      <text className="p6-flight-image-detail" x="0" y="11" textAnchor="middle">[CLS] + 196 Patch</text>
    </g> : null;

  const encoderTokens = [
    { id: "prompt", startKey: "encoder-source-prompt", endKey: "encoder-target-prompt", label: "Prompt · 0", output: "H[0]", className: "is-prompt" },
    { id: "cls", startKey: "encoder-source-cls", endKey: "encoder-target-cls", label: "[CLS] · 25", output: "H[25]", className: "is-cls" },
    { id: "patch", startKey: "encoder-source-patch", endKey: "encoder-target-patch", label: "Patch · 221", output: "H[221]", className: "is-patch" },
  ];
  const encoderFlights = activePhase === 3 ? encoderTokens.map(token => {
    const start = points[token.startKey];
    const end = points[token.endKey];
    if (!start || !end) return null;
    const position = pointOnArc(start, end, encoderProgress);
    return <g className={`p6-flight-encoder ${token.className}`} key={token.id} transform={`translate(${position.x} ${position.y})`}>
      <rect x="-42" y="-12" width="84" height="24" rx="6" />
      <text x="0" y="4" textAnchor="middle">{encoderProgress < 0.52 ? token.label : token.output}</text>
    </g>;
  }) : [];

  const poolFlights = activePhase === 4 ? poolContributions.flatMap((contribution, ordinal) => {
    const delay = ordinal * flightStep;
    const progress = flightProgress(poolingProgress, ordinal);
    const start = points[`pool-source-${contribution.sequenceIndex}`];
    const end = points[`pool-target-${contribution.sequenceIndex}`];
    if (!start || !end || poolingProgress < delay || progress >= 1) return [];
    const position = pointOnArc(start, end, progress);
    return <g className="p6-flight-value" key={`pool-${contribution.sequenceIndex}`} transform={`translate(${position.x} ${position.y})`}>
      <rect x="-21" y="-12" width="42" height="24" rx="5" />
      <text x="0" y="4" textAnchor="middle">{contribution.value.toFixed(1)}</text>
    </g>;
  }) : [];

  if (!promptFlights.length && !imageFlight && !encoderFlights.length && !poolFlights.length) return null;
  return <svg className="p6-flight-layer" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
    <g>{promptFlights}{imageFlight}</g>
    <g>{encoderFlights}</g>
    <g>{poolFlights}</g>
  </svg>;
}

export function PromptForward() {
  const playback = useLessonPlayback(duration);
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState(0);
  const figureRef = useRef<HTMLElement | null>(null);
  const geometry = useFlightGeometry(figureRef);
  const activePhase = phaseAt(playback.position);
  const reducedMotion = useReducedMotion();
  const mergeProgress = activePhase > 2 ? 1 : activePhase === 2 ? (reducedMotion ? 1 : phaseProgress(playback.position, 2)) : 0;
  const encoderProgress = activePhase > 3 ? 1 : activePhase === 3 ? (reducedMotion ? 1 : phaseProgress(playback.position, 3)) : 0;
  const poolingProgress = activePhase > 4 ? 1 : activePhase === 4 ? (reducedMotion ? 1 : phaseProgress(playback.position, 4)) : 0;
  const includedCount = activePhase > 4 ? P6_FINAL_POOL_EXAMPLE.totalCount : activePhase === 4
    ? poolContributions.reduce((count, _, index) => count + Number(poolingProgress >= index * flightStep + flightSpan), 0) : 0;
  const poolState = computePromptOutputPool(P6_POOL_SAMPLE_ROWS.map(row => row.values), includedCount);
  const classifierReady = activePhase === 5;
  const sequenceIsOutput = activePhase >= 4;
  const imageFlightProgress = clamp((mergeProgress - 0.1) / 0.78);
  const imageArrived = activePhase > 2 || (activePhase === 2 && imageFlightProgress >= 1);

  return <>
    <p className="lesson-lead">P5 给出的是当前输入的索引集合，不是类别预测。P6 将读取到的五组 Prompt 与同一张图像 Token 合并，再经共享冻结 ViT 前向；<span className="reading-emphasis reading-emphasis--prompt">分类特征从 Prompt 输出位置读出，不从普通 ViT 的 CLS 位置读出</span>。</p>

    <section className="explain-section">
      <h3>检索和分类是两次调用，共用同一组冻结权重</h3>
      <div className="reading-contrast reading-contrast--calls" role="group" aria-label="检索与分类分别调用同一组冻结的 ViT 权重">
        <div className="reading-call--query"><strong>检索调用 · 无 Prompt 生成 Query</strong><p>冻结的 ViT 对原图计算，读取 [CLS] 特征形成 q(x)。</p></div>
        <div className="reading-call--prompt"><strong>分类调用 · 带 Prompt 生成 Logits</strong><p>所选 Prompt 前置后再次经过同一组冻结权重；这不是第二套独立训练的 ViT。</p></div>
      </div>
      <p>以下工作台只展开分类调用。P5 的外部 Key 用于读取，不是 Transformer 输入 Token。</p>
    </section>

    <figure className="lesson-figure p6-forward-figure" ref={figureRef}>
      <div className="figure-top"><strong>从 P5 的 S(x<sub>A</sub>) 追踪到 Prompt 输出平均</strong><span>Query A · 共享冻结权重 θ₀</span></div>
      <div className="p6-control-dock" aria-label="L2P 分类前向播放控制">
        <div className="motion-stops" role="group" aria-label="选择 L2P 分类前向阶段">
          {phases.map((phase, index) => <button className="lesson-choice" type="button" key={phase.short} aria-pressed={activePhase === index} onClick={() => playback.seek(boundaries[index])}>{index + 1}. {phase.short}</button>)}
        </div>
        <div className="p6-control-bottomline">
          <PlaybackControls playback={playback} label="Prompt 序列到类别预测" />
          <p className="motion-status" aria-live="polite">{phases[activePhase].text}</p>
        </div>
      </div>

      <div className="figure-body">
        <div className="p6-shared-weights">
          <strong>同一组预训练权重 θ₀ · 冻结不更新</strong>
          <span>检索：无 Prompt → CLS → q(x<sub>A</sub>)</span>
          <span>分类：插入 Prompt → fᵣ → H</span>
        </div>

          <div className="p6-source-heading"><strong>两路输入在序列维合并</strong><span>源 Pool 保留原位；本次只复制所选 Prompt</span></div>
        <div className="p6-source-branches">
          <section className={`p6-source-column p6-selected-source ${activePhase === 0 ? "is-active" : ""}`} aria-label="P5 计算得到的选中 Prompt">
            <div className="p6-source-label"><strong>P5 · Query A 的 Top-N</strong><span>S(x<sub>A</sub>)</span></div>
            <SourcePromptView />
            <small>顺序来自共享检索快照；每个索引读取配对 Prompt。</small>
          </section>
          <span className="p6-source-join" aria-hidden="true">+</span>
          <section className={`p6-source-column p6-image-source ${activePhase >= 1 ? "is-active" : ""}`} aria-label="冻结嵌入层生成的图像 Token">
            <div className="p6-source-label"><strong>同一图像 x<sub>A</sub> → 冻结 fₑ → xₑ</strong><span>{promptPoolConfig.imageLength} × {promptPoolConfig.featureWidth}</span></div>
            <div className="p6-image-source-strip" data-p6-anchor="image-source"><b>[CLS]</b><i>Patch</i><i>Patch</i><i>Patch</i><span>…</span><i>Patch</i><small>{patchCount} 个图像 Patch</small></div>
            <small>[CLS] + {patchCount} 个 Patch 位置；图像序列宽度 D={promptPoolConfig.featureWidth}。</small>
          </section>
        </div>

        <section className={`p6-sequence-workbench ${activePhase >= 2 ? "is-composed" : ""}`} aria-label="扩展输入与 Transformer 输出的位置映射">
          <div className="p6-sequence-heading">
            <div><strong>{sequenceIsOutput ? "Transformer 输出 H" : activePhase === 3 ? "扩展序列进入冻结 Transformer" : "扩展输入 xₚ"}</strong><span>{sequenceIsOutput ? `位置仍为 ${P6_SEQUENCE_LENGTH}；向量表示已带有上下文` : "Prompt 在前，图像 Token 接在后"}</span></div>
            <b>{sequenceIsOutput ? "H = fᵣ(xₚ)" : <><span>xₚ = [</span>{P6_SELECTED_PROMPT_INDICES.map((index, selectedIndex) => <span key={index}><PromptName index={index} />{selectedIndex < P6_SELECTED_PROMPT_INDICES.length - 1 ? "; " : "; xₑ]"}</span>)}</>}<small>{P6_SEQUENCE_LENGTH} × {promptPoolConfig.featureWidth}</small></b>
          </div>
          <div className="p6-position-key"><span>Prompt 位置 · 0–{P6_PROMPT_TOKEN_COUNT - 1}</span><span>图像位置 · [CLS] {P6_IMAGE_CLS_SEQUENCE_INDEX}，Patch {P6_FIRST_PATCH_SEQUENCE_INDEX}–{P6_LAST_PATCH_SEQUENCE_INDEX}</span></div>
          <PromptSequenceGroups mergeProgress={mergeProgress} selectedSequenceIndex={selectedSequenceIndex} onSelect={setSelectedSequenceIndex} />
          <div className={`p6-image-sequence-row ${imageArrived ? "is-composed" : ""}`} data-p6-anchor="image-target">
            <span className="p6-image-position-prefix">图像 xₑ</span>
            <button className={`p6-image-position p6-cls-position ${selectedSequenceIndex === P6_IMAGE_CLS_SEQUENCE_INDEX ? "is-selected" : ""}`} type="button" data-sequence-index={P6_IMAGE_CLS_SEQUENCE_INDEX} aria-pressed={selectedSequenceIndex === P6_IMAGE_CLS_SEQUENCE_INDEX} aria-label={`图像 CLS，扩展序列绝对位置 ${P6_IMAGE_CLS_SEQUENCE_INDEX}`} onClick={() => setSelectedSequenceIndex(P6_IMAGE_CLS_SEQUENCE_INDEX)}><b>[CLS]</b><small>{P6_IMAGE_CLS_SEQUENCE_INDEX}</small></button>
            <button className={`p6-image-position ${selectedSequenceIndex === P6_FIRST_PATCH_SEQUENCE_INDEX ? "is-selected" : ""}`} type="button" data-sequence-index={P6_FIRST_PATCH_SEQUENCE_INDEX} aria-pressed={selectedSequenceIndex === P6_FIRST_PATCH_SEQUENCE_INDEX} aria-label={`第一个图像 Patch，扩展序列绝对位置 ${P6_FIRST_PATCH_SEQUENCE_INDEX}`} onClick={() => setSelectedSequenceIndex(P6_FIRST_PATCH_SEQUENCE_INDEX)}><b>Patch₁</b><small>{P6_FIRST_PATCH_SEQUENCE_INDEX}</small></button>
            <span className="p6-image-ellipsis" aria-hidden="true">…</span>
            <span className="p6-image-range">{patchCount} 个 Patch 位置</span>
            <button className={`p6-image-position p6-last-patch ${selectedSequenceIndex === P6_LAST_PATCH_SEQUENCE_INDEX ? "is-selected" : ""}`} type="button" data-sequence-index={P6_LAST_PATCH_SEQUENCE_INDEX} aria-pressed={selectedSequenceIndex === P6_LAST_PATCH_SEQUENCE_INDEX} aria-label={`最后一个图像 Patch，扩展序列绝对位置 ${P6_LAST_PATCH_SEQUENCE_INDEX}`} onClick={() => setSelectedSequenceIndex(P6_LAST_PATCH_SEQUENCE_INDEX)}><b>Patch₁₉₆</b><small>{P6_LAST_PATCH_SEQUENCE_INDEX}</small></button>
          </div>
          <div className="p6-sequence-index-note"><PositionInspector sequenceIndex={selectedSequenceIndex} /><span>Key 不进入 xₚ；图像 CLS 和 Patch 输出保留在 H，但不纳入 Prompt 池化。</span></div>
          <div className={`p6-encoder-stage ${activePhase === 3 ? "is-active" : ""}`}>
            <div className="p6-encoder-flow-label"><span>输入与输出位置一一对应</span><span>同一冻结 Transformer fᵣ · 参数不更新</span></div>
            <div className="p6-encoder-lanes" role="img" aria-label={`扩展序列的 Prompt、CLS 和 Patch 代表位置经过同一冻结 Transformer；所有 ${P6_SEQUENCE_LENGTH} 个位置均保留身份并参与上下文计算`}>
              <span className="p6-encoder-lane-line p6-encoder-lane-line--prompt" />
              <span className="p6-encoder-lane-line p6-encoder-lane-line--cls" />
              <span className="p6-encoder-lane-line p6-encoder-lane-line--patch" />
              <span className="p6-encoder-input p6-encoder-input--prompt" data-p6-anchor="encoder-source-prompt"><PromptName index={P6_SELECTED_PROMPT_INDICES[0]} /> · T1</span>
              <span className="p6-encoder-input p6-encoder-input--cls" data-p6-anchor="encoder-source-cls">[CLS] · 25</span>
              <span className="p6-encoder-input p6-encoder-input--patch" data-p6-anchor="encoder-source-patch">Patch · 221</span>
              <div className="p6-encoder-block">
                <strong>冻结 ViT</strong><span>fᵣ · θ₀</span><small>位置不变<br />表示融合上下文</small>
              </div>
              <span className={`p6-encoder-output p6-encoder-output--prompt ${encoderProgress >= 1 ? "is-contextualized" : ""}`} data-p6-anchor="encoder-target-prompt">H[0]</span>
              <span className={`p6-encoder-output p6-encoder-output--cls ${encoderProgress >= 1 ? "is-contextualized" : ""}`} data-p6-anchor="encoder-target-cls">H[25]</span>
              <span className={`p6-encoder-output p6-encoder-output--patch ${encoderProgress >= 1 ? "is-contextualized" : ""}`} data-p6-anchor="encoder-target-patch">H[221]</span>
            </div>
            <p>图中追踪三个代表位置；全部 {P6_SEQUENCE_LENGTH} 个向量都经过同一计算，未展示无依据的真实隐藏状态数值。</p>
          </div>
        </section>

        <section className={`p6-pooling-workbench ${activePhase >= 4 ? "is-active" : ""}`} aria-label="Prompt 输出位置逐维平均计算">
          <div className="p6-pooling-heading">
            <div><strong>只读前 {P6_PROMPT_TOKEN_COUNT} 个 Prompt 输出位置</strong><span>正式读出 H[0:{P6_PROMPT_TOKEN_COUNT}, :] · 图像位置 {P6_IMAGE_CLS_SEQUENCE_INDEX}–{P6_LAST_PATCH_SEQUENCE_INDEX} 留在序列但不进入均值</span></div>
            <math><mi>h</mi><mo>=</mo><mi>AvgPool</mi><mo>(</mo><mi>H</mi><mo>[</mo><mn>0</mn><mo>:</mo><mn>{P6_PROMPT_TOKEN_COUNT}</mn><mo>,</mo><mo>:</mo><mo>]</mo><mo>)</mo></math>
          </div>
          <ReadoutScopeMap />
          <div className="p6-pooling-grid">
            <div className="p6-pool-matrix-wrap">
              <div className="p6-pool-sample-label"><strong>单一特征维度 d=1 的教学数值</strong><span>示例输出值，不是预训练 ViT 的隐藏状态</span></div>
              <PoolingTable includedCount={includedCount} groupSums={poolState.groupSums} selectedSequenceIndex={selectedSequenceIndex} onSelect={setSelectedSequenceIndex} />
            </div>
            <div className="p6-pool-accumulator">
              <span className="p6-pool-dimension">对每个特征维度各自汇总</span>
              <div className="p6-pool-sum"><small>已抵达求和区 · 当前和 / 数量</small><strong>{activePhase < 4 ? "待开始" : `${poolState.sum.toFixed(2)} / ${poolState.includedCount}`}</strong><span>每枚数值方块来自左侧同一行的 H[r,1]</span></div>
              <PoolingTray includedCount={includedCount} />
              <div className={`p6-pool-result ${activePhase >= 4 && includedCount === P6_PROMPT_TOKEN_COUNT ? "is-ready" : ""}`}>
                {includedCount === P6_PROMPT_TOKEN_COUNT
                  ? <math><msub><mi>h</mi><mn>1</mn></msub><mo>=</mo><mfrac><mn>{poolState.sum.toFixed(1)}</mn><mn>{P6_PROMPT_TOKEN_COUNT}</mn></mfrac></math>
                  : includedCount > 0
                    ? <span className="p6-partial-mean">前 {includedCount} 个位置的暂时均值 · 尚未完成</span>
                    : <span className="p6-partial-mean">{activePhase >= 4 ? "等待首个输出位置" : "等待池化阶段"}</span>}
                <strong>{includedCount === P6_PROMPT_TOKEN_COUNT ? poolState.runningMean?.toFixed(2) : "—"}</strong>
              </div>
              <small className="p6-pool-limit">另外 {promptPoolConfig.featureWidth - 1} 个维度执行相同的 {P6_PROMPT_TOKEN_COUNT} 位置平均，最终 h ∈ R<sup>{promptPoolConfig.featureWidth}</sup>。</small>
            </div>
          </div>
          <div className="p6-pooling-equation">
            <math><msub><mi>h</mi><mi>d</mi></msub><mo>=</mo><mfrac><mn>1</mn><mn>{P6_PROMPT_TOKEN_COUNT}</mn></mfrac><munderover><mo>∑</mo><mrow><mi>r</mi><mo>=</mo><mn>0</mn></mrow><mn>{P6_PROMPT_TOKEN_COUNT - 1}</mn></munderover><msub><mi>H</mi><mrow><mi>r</mi><mo>,</mo><mi>d</mi></mrow></msub></math>
            <span>按位置维求和；保持特征维 d 独立。</span>
          </div>
        </section>

        <div className="p6-classification-output">
          <Arrow />
          <div className={`p6-classifier ${classifierReady ? "is-active" : ""}`}>
            <strong>共享分类器 g<sub>φ</sub></strong>
            <math><mi>z</mi><mo>=</mo><msub><mi>g</mi><mi>φ</mi></msub><mo>(</mo><mi>h</mi><mo>)</mo></math>
            <math><mover><mi>y</mi><mo>^</mo></mover><mo>=</mo><msub><mi>argmax</mi><mi>c</mi></msub><msub><mi>z</mi><mi>c</mi></msub></math>
            <span>类别 Logits 数值未在本教学例中计算</span>
          </div>
          <span>前向分类到此为止 · 不展开损失或参数更新</span>
        </div>

        <div className="p6-dimensions" aria-label="本页形状与数量核对">
          <span><b>M</b><strong>{promptPoolConfig.poolSize}</strong><small>池中候选 Prompt 数</small></span>
          <span><b>N</b><strong>{P6_PROMPT_COUNT}</strong><small>当前检索选中数</small></span>
          <span><b>L<sub>p</sub></b><strong>{promptPoolConfig.promptLength}</strong><small>每组 Prompt Token 数</small></span>
          <span><b>L</b><strong>{promptPoolConfig.imageLength}</strong><small>图像 Token 位置数</small></span>
          <span><b>D</b><strong>{promptPoolConfig.featureWidth}</strong><small>向量特征宽度</small></span>
          <span className="p6-dim-result"><b>NL<sub>p</sub> + L</b><strong>{P6_PROMPT_TOKEN_COUNT} + {promptPoolConfig.imageLength} = {P6_SEQUENCE_LENGTH}</strong><small>扩展序列长度</small></span>
        </div>
      </div>
      <FlightLayer geometry={geometry} activePhase={activePhase} mergeProgress={mergeProgress} encoderProgress={encoderProgress} poolingProgress={poolingProgress} />
      <figcaption>位置图把 {P6_PROMPT_TOKEN_COUNT} 个 Prompt Token 逐一展开，图像部分按真实数量压缩显示；输出矩阵中的 d=1 数值只演示 AvgPool 算术。正式流程对 H[0:{P6_PROMPT_TOKEN_COUNT}, :] 的每一个特征维度分别求平均，分类器 Logits 保持符号形式。</figcaption>
    </figure>

    <section className="explain-section">
      <h3>池化的是经过 Transformer 的 Prompt 输出，不是 Prompt 参数本身</h3>
      <p>输入位置里的 Prompt 向量参与冻结 Transformer 计算后，输出 <math><mi>H</mi></math> 的前 {P6_PROMPT_TOKEN_COUNT} 行已携带上下文。正式读出从这些行取值并沿位置方向平均，得到一个 <math><mn>{promptPoolConfig.featureWidth}</mn></math> 维向量交给共享分类器。Prompt Pool 的原参数留在 P5，当前分类路径使用它们的读取视图。</p>
      <p>以 Split CIFAR‑100 / CORe50 的 ViT‑B/16 维度为例：<math><mi>M</mi><mo>=</mo><mn>{promptPoolConfig.poolSize}</mn></math>、<math><mi>N</mi><mo>=</mo><mn>{promptPoolConfig.topN}</mn></math>、<math><msub><mi>L</mi><mi>p</mi></msub><mo>=</mo><mn>{promptPoolConfig.promptLength}</mn></math>、<math><mi>L</mi><mo>=</mo><mn>{promptPoolConfig.imageLength}</mn></math>、<math><mi>D</mi><mo>=</mo><mn>{promptPoolConfig.featureWidth}</mn></math>，所以 <math><msub><mi>x</mi><mi>p</mi></msub><mo>,</mo><mi>H</mi><mo>∈</mo><msup><mi>ℝ</mi><mrow><mn>{P6_SEQUENCE_LENGTH}</mn><mo>×</mo><mn>{promptPoolConfig.featureWidth}</mn></mrow></msup></math>。其他数据集实验会使用不同的池大小或选取数值。</p>
    </section>

    <p className="lesson-takeaway">预测已经得到。接下来要解释：分类误差怎样训练被选中的 Prompt，而离散 Top-N 选择中的 Key 又怎样得到自己的学习信号？</p>
  </>;
}
