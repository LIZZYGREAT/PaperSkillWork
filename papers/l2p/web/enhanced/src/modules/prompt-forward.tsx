import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLessonPlayback, PlaybackControls } from "./lesson-playback";
import { Arrow } from "./vit-visuals";
import { promptPoolConfig } from "./prompt-retrieval-data";
import {
  P6_FIRST_PATCH_SEQUENCE_INDEX,
  P6_IMAGE_CLS_SEQUENCE_INDEX,
  P6_LAST_PATCH_SEQUENCE_INDEX,
  P6_PROMPT_COUNT,
  P6_PROMPT_TOKEN_COUNT,
  P6_PROMPT_TOKEN_MAP,
  P6_SELECTED_PROMPT_INDICES,
  P6_SEQUENCE_LENGTH,
} from "./prompt-forward-data";
import "./prompt-forward.css";

const duration = 9450;
const boundaries = [0, 1000, 1950, 4350, 6050, 8450, duration];
const patchCount = promptPoolConfig.imageLength - 1;
const flightStep = 0.033;
const flightSpan = 0.115;
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

function ReadoutScopeMap({ active }: { active: boolean }) {
  return <div className={`p6-readout-scope ${active ? "is-active" : ""}`} role="img" aria-label={`AvgPool 读取 H[0:${P6_PROMPT_TOKEN_COUNT},:] 的 ${P6_PROMPT_TOKEN_COUNT} 个 Prompt 输出位置；图像输出 H[${P6_IMAGE_CLS_SEQUENCE_INDEX}:${P6_SEQUENCE_LENGTH},:] 仍保留在上下文序列中，但不进入均值。`}>
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

function FlightLayer({
  geometry,
  activePhase,
  mergeProgress,
  encoderProgress,
}: {
  geometry: FlightGeometry | null;
  activePhase: number;
  mergeProgress: number;
  encoderProgress: number;
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

  if (!promptFlights.length && !imageFlight && !encoderFlights.length) return null;
  return <svg className="p6-flight-layer" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
    <g>{promptFlights}{imageFlight}</g>
    <g>{encoderFlights}</g>
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

    <section className="explain-section p6-splice-primer">
      <h3>先按 P5 返回的下标取值，再沿序列方向拼接</h3>
      <p>这一步把五组 Prompt 的读取副本放到图像 Token 前面。每组贡献 <math><msub><mi>L</mi><mi>p</mi></msub></math> 个位置；图像 Token 接在后面，Key 不会跟着进入输入。</p>
      <div className="p6-splice-notation" role="img" aria-label={`P5 返回的五组 Prompt，每组 ${promptPoolConfig.promptLength} 个位置，与 ${promptPoolConfig.imageLength} 个图像位置拼接，得到 ${P6_SEQUENCE_LENGTH} 个位置`}>
        <span className="p6-splice-picked"><small>P5 的选集顺序</small><strong>{P6_SELECTED_PROMPT_INDICES.map((index, ordinal) => <span key={`${index}-${ordinal}`}><PromptName index={index} />{ordinal < P6_SELECTED_PROMPT_INDICES.length - 1 ? " · " : ""}</span>)}</strong></span>
        <span className="p6-splice-multiplicity">每组 L<sub>p</sub> = {promptPoolConfig.promptLength}</span>
        <span className="p6-splice-operator" aria-hidden="true">+</span>
        <span className="p6-splice-image"><small>图像序列 x<sub>e</sub></small><strong>L = {promptPoolConfig.imageLength}</strong></span>
        <span className="p6-splice-operator" aria-hidden="true">=</span>
        <span className="p6-splice-total"><small>输入长度</small><strong>{P6_PROMPT_COUNT} × {promptPoolConfig.promptLength} + {promptPoolConfig.imageLength} = {P6_SEQUENCE_LENGTH}</strong></span>
      </div>
    </section>

    <figure className="lesson-figure p6-forward-figure" ref={figureRef}>
      <div className="figure-top"><strong>沿位置追踪拼接输入与冻结前向</strong><span>Query A · 共享冻结权重 θ₀</span></div>
      <div className="p6-control-dock" aria-label="L2P 分类前向播放控制">
        <div className="motion-stops" role="group" aria-label="选择 L2P 分类前向阶段">
          {phases.map((phase, index) => <button className="lesson-choice" type="button" key={phase.short} aria-pressed={activePhase === index} onClick={() => playback.seek(boundaries[index])}>{index + 1}. {phase.short}</button>)}
        </div>
        <div className="p6-control-bottomline">
          <PlaybackControls playback={playback} label="Prompt 序列到类别预测" />
          <p className="motion-status" aria-live="polite">{phases[activePhase].text}{activePhase >= 4 ? <> <a href="#p6-readout">查看下方读出图 ↓</a></> : null}</p>
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

      </div>
      <FlightLayer geometry={geometry} activePhase={activePhase} mergeProgress={mergeProgress} encoderProgress={encoderProgress} />
      <figcaption>图中逐组展示 Prompt 位置，图像序列按真实数量压缩；前向动画抽样追踪 Prompt、[CLS] 与 Patch 的代表位置。完整序列仍有 {P6_SEQUENCE_LENGTH} 个位置。</figcaption>
    </figure>

    <section id="p6-readout" className={`explain-section p6-readout-section ${activePhase >= 4 ? "is-active" : ""}`}>
      <h3>分类读出只取上下文后的 Prompt 输出位置</h3>
      <p>冻结 Transformer 处理了整个拼接序列，输出 <math><mi>H</mi></math> 中的 Prompt 行也已融合图像上下文。分类时从 <math><mi>H</mi><mo>[</mo><mn>0</mn><mo>:</mo><mn>{P6_PROMPT_TOKEN_COUNT}</mn><mo>,</mo><mo>:</mo><mo>]</mo></math> 取出这些输出并沿位置方向平均；图像的 CLS 与 Patch 仍在 H 中，但不进入这个均值。</p>
      <ReadoutScopeMap active={activePhase >= 4} />
      <div className="p6-pooling-equation">
        <math><msub><mi>h</mi><mi>d</mi></msub><mo>=</mo><mfrac><mn>1</mn><mn>{P6_PROMPT_TOKEN_COUNT}</mn></mfrac><munderover><mo>∑</mo><mrow><mi>r</mi><mo>=</mo><mn>0</mn></mrow><mn>{P6_PROMPT_TOKEN_COUNT - 1}</mn></munderover><msub><mi>H</mi><mrow><mi>r</mi><mo>,</mo><mi>d</mi></mrow></msub></math>
        <span>每个特征维 d 独立计算；h ∈ ℝ<sup>{promptPoolConfig.featureWidth}</sup>。</span>
      </div>
      <div className="p6-classification-output">
        <div className="p6-pooled-vector"><small>Prompt 输出平均</small><strong>h ∈ ℝ<sup>{promptPoolConfig.featureWidth}</sup></strong></div>
        <Arrow />
        <div className={`p6-classifier ${classifierReady ? "is-active" : ""}`}>
          <strong>共享分类器 g<sub>φ</sub></strong>
          <math><mi>z</mi><mo>=</mo><msub><mi>g</mi><mi>φ</mi></msub><mo>(</mo><mi>h</mi><mo>)</mo></math>
          <math><mover><mi>y</mi><mo>^</mo></mover><mo>=</mo><msub><mi>argmax</mi><mi>c</mi></msub><msub><mi>z</mi><mi>c</mi></msub></math>
          <span>这里保留分类规则；不虚构 Logits 数值</span>
        </div>
      </div>
      <p className="p6-classifier-boundary">前向预测到此结束。损失计算和 Prompt / Key 的学习信号留到 P7。</p>
    </section>

    <section className="explain-section p6-dimension-section">
      <h3>核对序列长度与向量宽度</h3>
      <p>Prompt 增加的是位置数；每个位置的特征宽度仍由冻结 ViT 的维度决定。下面把本教学配置中的数量关系排在一起。</p>
      <table className="p6-shape-ledger">
        <caption>本页输入与读出形状</caption>
        <thead><tr><th scope="col">关系</th><th scope="col">本例数值</th><th scope="col">含义</th></tr></thead>
        <tbody>
          <tr><th scope="row">池容量与选集</th><td>M = {promptPoolConfig.poolSize} · N = {P6_PROMPT_COUNT}</td><td>候选槽位数 · 当前读取组数</td></tr>
          <tr><th scope="row">Prompt 位置</th><td>N × L<sub>p</sub> = {P6_PROMPT_COUNT} × {promptPoolConfig.promptLength} = {P6_PROMPT_TOKEN_COUNT}</td><td>拼接到输入序列前部</td></tr>
          <tr><th scope="row">图像位置</th><td>L = {promptPoolConfig.imageLength}</td><td>[CLS] 与 Patch 序列</td></tr>
          <tr><th scope="row">扩展序列长度</th><td>NL<sub>p</sub> + L = {P6_PROMPT_TOKEN_COUNT} + {promptPoolConfig.imageLength} = {P6_SEQUENCE_LENGTH}</td><td>xₚ 与 H 的位置数</td></tr>
          <tr><th scope="row">特征宽度</th><td>D = {promptPoolConfig.featureWidth}</td><td>每个位置的向量宽度；h 也为 D 维</td></tr>
        </tbody>
      </table>
    </section>

    <p className="lesson-takeaway">预测已经得到。接下来要解释：分类误差怎样训练被选中的 Prompt，而离散 Top-N 选择中的 Key 又怎样得到自己的学习信号？</p>
  </>;
}
