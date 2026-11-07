import { useRef, useState } from "react";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";
import { promptPoolConfig } from "./prompt-retrieval-data";
import {
  distanceFromExampleKey,
  gradientSourcesForSlot,
  P7_BATCH_INDICES,
  P7_BATCH_SAMPLES,
  P7_COMMON_INDICES,
  P7_EXAMPLE_GRADIENT,
  P7_UNTOUCHED_INDICES,
  type BatchSample,
} from "./prompt-learning-data";
import { curvePath, pointOnCurve, useMotionAnchors, type MotionPoint } from "./visual-motion";
import "./prompt-learning.css";

const duration = 12_400;
const boundaries = [0, 1_550, 3_650, 5_400, 7_300, 9_700, duration];
const phases = [
  { short: "已完成分类", text: "P6 的前向结果已经到位。样本 A 与 B 各自保留 Query、Top‑5、Logits 和标签；此时两者都仍读取同一份更新前参数。" },
  { short: "分类梯度", text: "每个交叉熵分别沿分类计算回到本样本选中的 Prompt 与共享分类器。梯度可以穿过冻结 Transformer，但冻结权重本身不写回。" },
  { short: "离散选择边界", text: "硬 Top‑N 只给出索引集合。分类损失不会沿离散索引为 Key 提供普通的连续排序梯度，因此需要独立的匹配目标。" },
  { short: "Key 匹配梯度", text: "匹配损失使用 Query 与当前选中 Key 的余弦距离，直接训练这些 Key。这里的 Key 变化会影响以后批次的寻址。" },
  { short: "汇总同批贡献", text: "相同槽位接收来自 A、B 的两份直接梯度贡献；所有样本都基于同一个批次前快照计算，损失与选中集合先在 Batch 内汇总。" },
  { short: "一次写回", text: "此时才执行一次优化器 Step，形成 Θᵦ₊₁。槽位身份保持不变；本批没有直接损失梯度的槽位不被标为命中。" },
];
const poolIndices = Array.from({ length: promptPoolConfig.poolSize }, (_, offset) => offset + 1);

function clamp(value: number) { return Math.max(0, Math.min(1, value)); }

function phaseAt(position: number) {
  if (position >= duration) return phases.length - 1;
  const index = boundaries.findIndex((start, offset) => offset < boundaries.length - 1 && position >= start && position < boundaries[offset + 1]);
  return Math.max(0, index);
}

function phaseProgress(position: number, phase: number) {
  return clamp((position - boundaries[phase]) / (boundaries[phase + 1] - boundaries[phase]));
}

type LossMode = "combined" | "classification" | "matching";
type SampleFocus = "all" | "A" | "B";
type RouteKind = "classification" | "matching";
type GradientRoute = Readonly<{
  id: string;
  sample: BatchSample;
  slot: number;
  kind: RouteKind;
  start: MotionPoint;
  end: MotionPoint;
  order: number;
}>;

function makeRoutes(points: Readonly<Record<string, MotionPoint>>): readonly GradientRoute[] {
  return P7_BATCH_SAMPLES.flatMap((sample, sampleOffset) => sample.selected.flatMap((slot, order) => {
    const cls = points["loss-cls-" + sample.id];
    const match = points["loss-match-" + sample.id];
    const key = points["key-" + slot];
    const prompt = points["prompt-" + slot];
    const routes: GradientRoute[] = [];
    if (cls && prompt) routes.push({
      id: sample.id + "-cls-" + slot,
      sample,
      slot,
      kind: "classification",
      start: cls,
      end: prompt,
      order: sampleOffset * sample.selected.length + order,
    });
    if (match && key) routes.push({
      id: sample.id + "-match-" + slot,
      sample,
      slot,
      kind: "matching",
      start: match,
      end: key,
      order: sampleOffset * sample.selected.length + order,
    });
    return routes;
  }));
}

function MathKey({ prefix, index }: { prefix: string; index: number }) {
  return <math><msub><mi>{prefix}</mi><mn>{index}</mn></msub></math>;
}

function SampleLane({
  sample,
  activePhase,
  sampleFocus,
  slotFocus,
  lossMode,
  onFocus,
}: {
  sample: BatchSample;
  activePhase: number;
  sampleFocus: SampleFocus;
  slotFocus: number | null;
  lossMode: LossMode;
  onFocus: (focus: SampleFocus) => void;
}) {
  const isFocused = sampleFocus === "all" || sampleFocus === sample.id;
  return <article className={"p7-sample-lane p7-sample-lane--" + sample.id.toLowerCase() + " " + (isFocused ? "is-focused" : "is-muted") + " " + (activePhase === 0 ? "is-forward" : "")} aria-label={"同一 Mini-batch 的样本 " + sample.id}>
    <div className="p7-sample-origin">
      <button type="button" className="p7-sample-mark" aria-pressed={sampleFocus === sample.id} onClick={() => onFocus(sampleFocus === sample.id ? "all" : sample.id)}>
        <span>{sample.id}</span><small>样本 {sample.id}</small>
      </button>
      <strong><i>{sample.symbol}</i></strong>
      <small>标签 <i>{sample.labelSymbol}</i></small>
    </div>
    <div className="p7-sample-compute">
      <div className="p7-query-line"><span className="p7-query-dot" /> <strong>{sample.queryLabel}</strong><small>无 Prompt 的冻结 ViT [CLS]</small></div>
      <div className="p7-selected-prompts" aria-label={sample.symbol + " 的 P5 Top-5 选集"}>
        <span className="p7-row-label">本次离散 Top‑5</span>
        <div>{sample.selected.map(index => <span className={"p7-selection-chip " + (slotFocus === index ? "is-inspected" : "")} key={index}><MathKey prefix="P" index={index} /></span>)}</div>
      </div>
      <small className="p7-read-note">来自 P5 同一选择快照 · Key–Prompt 配对按编号保留</small>
    </div>
    <div className="p7-loss-pair">
      <div className={"p7-loss-node p7-loss-node--cls " + (lossMode !== "matching" && activePhase >= 1 ? "is-active" : "")} data-motion-anchor={"loss-cls-" + sample.id}>
        <strong>分类损失</strong><b>CE({sample.logitsSymbol}, {sample.labelSymbol})</b><small>对选中 Prompt 与共享 φ 求梯度</small>
      </div>
      <div className={"p7-loss-node p7-loss-node--match " + (lossMode !== "classification" && activePhase >= 3 ? "is-active" : "")} data-motion-anchor={"loss-match-" + sample.id}>
        <strong>匹配损失</strong><b>Σ γ({sample.queryLabel}, kⱼ)</b><small>仅对 S({sample.symbol}) 中 Key 求梯度</small>
      </div>
    </div>
  </article>;
}

function BatchPool({
  activePhase,
  slotFocus,
  sampleFocus,
  onSlotFocus,
}: {
  activePhase: number;
  slotFocus: number | null;
  sampleFocus: SampleFocus;
  onSlotFocus: (index: number | null) => void;
}) {
  return <section className="p7-pool-panel" aria-label="十个固定 Key–Prompt 参数槽位">
    <div className="p7-pool-heading"><div><strong>同一份 Key–Prompt Pool</strong><span>槽位 M={promptPoolConfig.poolSize} · 每个 P 含 Lₚ={promptPoolConfig.promptLength} 个 Token</span></div>
      <span className={"p7-version-chip " + (activePhase >= 5 ? "is-updated" : "")}><b>Θᵦ</b><i>→</i><b>{activePhase >= 5 ? "Θᵦ₊₁" : "待写回"}</b></span>
    </div>
    <div className="p7-pool-grid">
      {poolIndices.map(index => {
        const sources = gradientSourcesForSlot(index);
        const hitA = sources.prompts.includes("A");
        const hitB = sources.prompts.includes("B");
        const selected = hitA || hitB;
        const common = hitA && hitB;
        const updating = activePhase >= 5 && selected;
        return <button type="button" key={index}
          className={"p7-pair-slot " + (selected ? "is-selected " : "") + (common ? "is-common " : "") + (slotFocus === index ? "is-inspected " : "") + (updating ? "is-updating " : "") + (sampleFocus !== "all" && !(sampleFocus === "A" ? hitA : hitB) ? "is-filtered" : "")}
          data-slot-index={index}
          aria-label={"槽位 " + index + "，Key k" + index + " 与 Prompt P" + index + " 配对；" + (selected ? "本批收到 " + [hitA ? "样本 A" : "", hitB ? "样本 B" : ""].filter(Boolean).join("、") + " 的直接梯度" : "本批无直接损失梯度")}
          aria-pressed={slotFocus === index}
          onClick={() => onSlotFocus(slotFocus === index ? null : index)}>
          <span className="p7-pair-top"><span className="p7-slot-index">{String(index).padStart(2, "0")}</span><span className="p7-slot-state">{common ? "A + B" : selected ? (hitA ? "A 来源" : "B 来源") : "未命中"}</span></span>
          <span className="p7-pair-values">
            <span className="p7-key-value" data-motion-anchor={"key-" + index}><MathKey prefix="k" index={index} /><i aria-hidden="true" /></span>
            <span className="p7-prompt-value" data-motion-anchor={"prompt-" + index}><MathKey prefix="P" index={index} /><span aria-hidden="true">{Array.from({ length: promptPoolConfig.promptLength }, (_, token) => <i key={token} />)}</span></span>
          </span>
          <span className="p7-gradient-source">
            {selected ? <>{hitA && <i className="p7-source-dot p7-source-dot--a">A</i>}{hitB && <i className="p7-source-dot p7-source-dot--b">B</i>}{updating ? <b>已写回</b> : <b>{common ? "两份贡献汇合" : "直接梯度"}</b>}</> : <b>本批无直接损失梯度</b>}
          </span>
        </button>;
      })}
    </div>
    <div className="p7-pool-foot"><span><i className="p7-key-legend" />匹配损失 → Key</span><span><i className="p7-prompt-legend" />分类损失 → Prompt</span><span className="p7-pool-footnote">梯度来源描述本批的直接损失路径；不把优化器状态简化成永久不变的承诺。</span></div>
  </section>;
}

function GradientOverlay({
  geometry,
  position,
  activePhase,
  sampleFocus,
  lossMode,
}: {
  geometry: ReturnType<typeof useMotionAnchors>;
  position: number;
  activePhase: number;
  sampleFocus: SampleFocus;
  lossMode: LossMode;
}) {
  if (!geometry) return null;
  const progress = phaseProgress(position, activePhase);
  const routes = makeRoutes(geometry.points).filter(route => sampleFocus === "all" || route.sample.id === sampleFocus);
  return <svg className="p7-gradient-overlay" width={geometry.width} height={geometry.height} viewBox={"0 0 " + geometry.width + " " + geometry.height} aria-hidden="true">
    {routes.map(route => {
      const classification = route.kind === "classification";
      const allowed = classification ? lossMode !== "matching" : lossMode !== "classification";
      const routePhase = classification ? 1 : 3;
      const visible = allowed && activePhase >= routePhase;
      if (!visible) return null;
      const offset = (route.order % 5) * (route.sample.id === "A" ? -7 : 7);
      const path = curvePath(route.start, route.end, offset);
      const localProgress = activePhase === routePhase ? clamp((progress * 5.6 - (route.order % 5) * 0.68) / 0.96) : 1;
      const point = pointOnCurve(route.start, route.end, localProgress, offset);
      return <g className={"p7-gradient-route p7-gradient-route--" + route.kind + " p7-gradient-route--" + route.sample.id.toLowerCase()} key={route.id}>
        <path d={path} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - localProgress} />
        {localProgress > 0 && localProgress < 1 && <circle cx={point.x} cy={point.y} r="4.2" className="p7-gradient-particle" />}
      </g>;
    })}
  </svg>;
}

function KeyGradientStudy({ activePhase, progress }: { activePhase: number; progress: number }) {
  const amount = activePhase < 3 ? 0 : activePhase === 3 ? progress : 1;
  const key = {
    x: P7_EXAMPLE_GRADIENT.initialKey.x + (P7_EXAMPLE_GRADIENT.updatedKey.x - P7_EXAMPLE_GRADIENT.initialKey.x) * amount,
    y: P7_EXAMPLE_GRADIENT.initialKey.y + (P7_EXAMPLE_GRADIENT.updatedKey.y - P7_EXAMPLE_GRADIENT.initialKey.y) * amount,
  };
  const distance = distanceFromExampleKey(key);
  const origin = { x: 90, y: 105 };
  const scale = 68;
  return <section className={"p7-key-study " + (activePhase === 3 ? "is-active" : activePhase > 3 ? "is-complete" : "")} aria-label="独立的二维 Key 梯度示例">
    <div className="p7-key-study-copy"><span className="p7-study-tag">单 Key 可复算示例</span><h3>距离可微，Top‑N 索引保持离散</h3>
      <p>此处独立演示余弦距离对一个已选 Key 的梯度；坐标不复用 P5 的 Key，也不代表完整 Batch 的 Adam 轨迹。</p>
      <math display="block"><mi>q</mi><mo>=</mo><mo>(</mo><mn>1</mn><mo>,</mo><mn>0</mn><mo>)</mo><mo>,</mo><mi>k</mi><mo>=</mo><mo>(</mo><mn>0</mn><mo>,</mo><mn>1</mn><mo>)</mo><mo>,</mo><mi>η</mi><mo>=</mo><mn>0.2</mn></math>
      <math display="block"><mo>∇</mo><msub><mi>k</mi><mn>0</mn></msub><mi>γ</mi><mo>=</mo><mo>(</mo><mo>−</mo><mn>1</mn><mo>,</mo><mn>0</mn><mo>)</mo><mo>;</mo><mi>k</mi><mo>′</mo><mo>=</mo><mo>(</mo><mn>0.2</mn><mo>,</mo><mn>1</mn><mo>)</mo></math>
    </div>
    <svg className="p7-key-study-plot" viewBox="0 0 250 150" role="img" aria-label={"教学向量 k 从 (0, 1) 连续移到 (0.2, 1)，当前余弦距离 " + distance.toFixed(6)}>
      <line x1="28" y1={origin.y} x2="224" y2={origin.y} className="p7-study-axis" />
      <line x1={origin.x} y1="19" x2={origin.x} y2="132" className="p7-study-axis" />
      <line x1={origin.x} y1={origin.y} x2={origin.x + scale} y2={origin.y} className="p7-study-vector p7-study-vector--query" />
      <line x1={origin.x} y1={origin.y} x2={origin.x + key.x * scale} y2={origin.y - key.y * scale} className="p7-study-vector p7-study-vector--key" />
      <circle cx={origin.x + key.x * scale} cy={origin.y - key.y * scale} r="5.5" className="p7-study-key-tip" />
      <circle cx={origin.x + scale} cy={origin.y} r="4.5" className="p7-study-query-tip" />
      <text x="184" y="99">q=(1,0)</text><text x="100" y="23">k(t)</text>
      <text x="111" y="139">γ = {distance.toFixed(6)}</text>
    </svg>
    <div className="p7-key-study-readout"><span><small>初始距离</small><b>1.000000</b></span><i aria-hidden="true">→</i><span><small>当前距离</small><b>{distance.toFixed(6)}</b></span><small className="p7-study-boundary">按梯度下降方向连续移动；只有明确标注的 SGD 教学例子</small></div>
  </section>;
}

export function PromptLearning() {
  const playback = useLessonPlayback(duration);
  const activePhase = phaseAt(playback.position);
  const progress = phaseProgress(playback.position, activePhase);
  const [sampleFocus, setSampleFocus] = useState<SampleFocus>("all");
  const [lossMode, setLossMode] = useState<LossMode>("combined");
  const [slotFocus, setSlotFocus] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const geometry = useMotionAnchors(stageRef);
  const inspectedSources = slotFocus === null ? null : gradientSourcesForSlot(slotFocus);
  const selectedDistanceA = slotFocus === null ? null : P7_BATCH_SAMPLES[0].distances[slotFocus];
  const selectedDistanceB = slotFocus === null ? null : P7_BATCH_SAMPLES[1].distances[slotFocus];

  return <>
    <p className="lesson-lead">P6 的 Logits 现在接上真实的学习信号。分类误差训练被调用的 Prompt 和共享分类器；独立匹配误差训练 Key，让以后更容易找到合适的 Prompt。</p>
    <section className="p7-intro explain-section">
      <h3>两个目标，分别回答两个问题</h3>
      <div className="p7-loss-contract">
        <div className="p7-loss-contract-item p7-loss-contract-item--cls"><span>分类目标</span><math><msub><mi mathvariant="normal">L</mi><mi>cls</mi></msub><mo>=</mo><mi>CE</mi><mo>(</mo><mi>g</mi><mo>(</mo><mi>h</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>)</mo><mo>,</mo><mi>y</mi><mo>)</mo></math><p>让 Prompt 条件下的分类输出贴近标签；梯度到达选中 Prompt 与共享分类器 φ。</p></div>
        <div className="p7-loss-contract-item p7-loss-contract-item--match"><span>寻址目标</span><math><msub><mi mathvariant="normal">L</mi><mi>match</mi></msub><mo>=</mo><munder><mo>∑</mo><mrow><mi>j</mi><mo>∈</mo><mi>S</mi><mo>(</mo><mi>x</mi><mo>)</mo></mrow></munder><mi>γ</mi><mo>(</mo><mi>q</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>,</mo><msub><mi>k</mi><mi>j</mi></msub><mo>)</mo></math><p>距离函数对 Key 可微；硬 Top‑N 返回离散索引，不把分类梯度传成普通连续 Key 排名梯度。</p></div>
      </div>
      <p className="p7-combined-objective">论文把两项损失相加：<math><mi>L</mi><mo>=</mo><msub><mi>L</mi><mi>cls</mi></msub><mo>+</mo><mi>λ</mi><msub><mi>L</mi><mi>match</mi></msub></math>。冻结 ViT 可参与反向计算，只有 Prompt、Key 与共享分类器属于可训练参数。</p>
    </section>

    <figure className="lesson-figure p7-batch-figure">
      <div className="figure-top"><strong>Mini-batch 梯度与参数写回</strong><span>两样本教学缩影 · 与 P5 共用选集 · 真实实验 Batch 大小按协议设定</span></div>
      <div className="figure-body">
        <div className="p7-control-dock" aria-label="Batch 更新动画控制">
          <div className="p7-control-topline">
            <div className="p7-control-groups">
              <div className="p7-control-group" role="group" aria-label="筛选梯度来源样本"><strong>查看样本</strong>
                {(["all", "A", "B"] as const).map(value => <button type="button" key={value} className="lesson-choice" aria-pressed={sampleFocus === value} onClick={() => setSampleFocus(value)}>{value === "all" ? "A + B" : "样本 " + value}</button>)}
              </div>
              <div className="p7-control-group" role="group" aria-label="筛选当前显示的损失路径"><strong>损失路径</strong>
                {(["combined", "classification", "matching"] as const).map(value => <button type="button" key={value} className="lesson-choice" aria-pressed={lossMode === value} onClick={() => setLossMode(value)}>{value === "combined" ? "合并" : value === "classification" ? "分类" : "匹配"}</button>)}
              </div>
            </div>
            <div className="p7-motion-stops" role="group" aria-label="跳转到更新阶段">
              {phases.map((phase, index) => <button type="button" className="lesson-choice" key={phase.short} aria-pressed={activePhase === index} onClick={() => playback.seek(boundaries[index] + 30)}>{index + 1}. {phase.short}</button>)}
            </div>
          </div>
          <div className="p7-control-bottomline"><PlaybackControls playback={playback} label="损失形成到一次 Batch 写回" /><p className="p7-motion-status" aria-live="polite">{phases[activePhase].text}</p></div>
        </div>

        <div className="p7-routing-stage" ref={stageRef}>
          <GradientOverlay geometry={geometry} position={playback.position} activePhase={activePhase} sampleFocus={sampleFocus} lossMode={lossMode} />
          <div className="p7-sample-lanes">
            {P7_BATCH_SAMPLES.map(sample => <SampleLane key={sample.id} sample={sample} activePhase={activePhase} sampleFocus={sampleFocus} slotFocus={slotFocus} lossMode={lossMode}
              onFocus={focus => setSampleFocus(focus)} />)}
          </div>

          <div className={"p7-batch-accumulator " + (activePhase >= 4 ? "is-active" : "")}>
            <div><span className="p7-accumulator-mark">∑</span><span><strong>Batch 损失累积</strong><small>L<sub>B</sub> = L<sub>A</sub> + L<sub>B</sub></small></span></div>
            <span className="p7-accumulator-sets"><b>A ∪ B</b><i>→</i><strong>{P7_BATCH_INDICES.map(index => "P" + index).join(" · ")}</strong></span>
            <span className="p7-optimizer-step"><b>{activePhase >= 5 ? "Optimizer Step · 1 次" : "等待整个 Batch"}</b><small>先累积，再统一写回</small></span>
          </div>

          <BatchPool activePhase={activePhase} slotFocus={slotFocus} sampleFocus={sampleFocus}
            onSlotFocus={index => setSlotFocus(index)} />
        </div>

        <div className="p7-inspector" aria-live="polite">
          {slotFocus !== null && inspectedSources ? <>
            <strong>槽位 {slotFocus} 的来源追踪</strong>
            <span>Prompt 梯度：{inspectedSources.prompts.length ? inspectedSources.prompts.map(id => "样本 " + id).join(" + ") : "本批无直接梯度"}</span>
            <span>Key 梯度：{inspectedSources.keys.length ? inspectedSources.keys.map(id => "样本 " + id).join(" + ") : "本批无直接梯度"}</span>
            {selectedDistanceA !== null && selectedDistanceA !== undefined && <span>q<sub>A</sub>–k<sub>{slotFocus}</sub>：γ={selectedDistanceA.toFixed(6)}</span>}
            {selectedDistanceB !== null && selectedDistanceB !== undefined && <span>q<sub>B</sub>–k<sub>{slotFocus}</sub>：γ={selectedDistanceB.toFixed(6)}</span>}
          </> : <>
            <strong>{activePhase >= 5 ? "Batch 状态已交给下一轮" : "选择任一槽位，检查它的梯度来源"}</strong>
            <span>共同命中 {P7_COMMON_INDICES.map(index => "P" + index).join("、")}：A 与 B 的贡献分别汇合。</span>
            <span>未命中槽位 {P7_UNTOUCHED_INDICES.map(index => "P" + index).join("、")}：没有来自本批样本的直接损失梯度。</span>
          </>}
        </div>

        <KeyGradientStudy activePhase={activePhase} progress={progress} />
        <div className="p7-batch-boundary"><strong>更新边界</strong><span>两个样本均使用 Θᵦ 完成前向与损失</span><i>→</i><span>累积 Batch 梯度</span><i>→</i><b>一次优化器更新</b><span>→ Θᵦ₊₁</span></div>
      </div>
      <figcaption>P7 将 P5 的选择结果带入 P6 的分类输出。同一槽位的梯度来源由本批两个 Query 的实际 Top‑5 选集计算；没有捏造 Logits、分类损失或高维梯度数值。</figcaption>
    </figure>

    <section className="p7-reading-notes">
      <h3>为什么先看离散索引，再看匹配损失？</h3>
      <p>Top‑N 在所有 Key 中挑出一个集合，索引本身是硬选择。分类交叉熵可以经冻结 Transformer 的计算路径回到被注入的 Prompt，但不会通过这个离散索引直接提供普通连续梯度去调整排序依据。</p>
      <p>Eq. (5) 因此把两种角色放进同一个目标：<strong>分类损失训练选中的 Prompt 与 φ；匹配损失直接训练选中的 Key。</strong>同一 Prompt 可以被多个样本调用，所以两个样本的贡献先相加，再执行一次批次更新。</p>
      <p className="lesson-takeaway">本批结束后，同一组 P、K 与共享分类器形成 Θᵦ₊₁；下一批必须从这个新状态重新检索。</p>
      <p className="p7-source-note">来源：原论文 §4.2–4.3、Eq. (5) 与 Appendix D Algorithm 1。简化向量图是单 Key 的 SGD 教学演算；论文实验配置使用 Adam，二者不代表相同优化器轨迹。</p>
    </section>
  </>;
}
