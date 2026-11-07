import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";
import { promptPoolConfig } from "./prompt-retrieval-data";
import {
  interpolateKeyAngles,
  P8_STAGES,
  type RunSelection,
  type RunStage,
} from "./continual-run-data";
import { curvePath, pointOnCurve, useMotionAnchors, type MotionPoint } from "./visual-motion";
import "./continual-run.css";

const duration = 13_000;
const boundaries = [0, 1_300, 2_900, 4_350, 5_850, 7_200, 8_500, 10_050, 11_500, duration];
const slotIndices = Array.from({ length: promptPoolConfig.poolSize }, (_, index) => index + 1);

function clamp(value: number) { return Math.max(0, Math.min(1, value)); }

function phaseAt(position: number) {
  if (position >= duration) return P8_STAGES.length - 1;
  const index = boundaries.findIndex((start, offset) => offset < boundaries.length - 1 && position >= start && position < boundaries[offset + 1]);
  return Math.max(0, index);
}

function phaseProgress(position: number, phase: number) {
  return clamp((position - boundaries[phase]) / (boundaries[phase + 1] - boundaries[phase]));
}

type TransitRoute = Readonly<{ id: string; start: MotionPoint; end: MotionPoint; progress: number; sampleIndex: number }>;

function activeSelections(stage: RunStage): readonly RunSelection[] {
  if (stage.batch) return stage.batch.samples;
  return stage.query ? [stage.query] : [];
}

function QueryTransit({
  geometry,
  stage,
  progress,
  reducedMotion,
}: {
  geometry: ReturnType<typeof useMotionAnchors>;
  stage: RunStage;
  progress: number;
  reducedMotion: boolean;
}) {
  if (!geometry || reducedMotion || (stage.kind !== "forward" && stage.kind !== "inference")) return null;
  const selections = activeSelections(stage);
  if (!selections.length) return null;
  const transitProgress = progress;
  const routes: TransitRoute[] = selections.flatMap((selection, sampleIndex) => {
    const queryPoint = geometry.points["p8-query-" + selection.sample.id];
    if (!queryPoint || !selection.selected.length) return [];
    const sweep = clamp(transitProgress * 1.65 + (selections.length > 1 ? sampleIndex * 0.18 : 0));
    const targetOffset = Math.min(selection.selected.length - 1, Math.floor(sweep * selection.selected.length));
    const localProgress = clamp(sweep * selection.selected.length - targetOffset);
    const keyPoint = geometry.points["p8-slot-" + selection.selected[targetOffset]];
    if (!keyPoint) return [];
    return [{
      id: selection.sample.id,
      start: queryPoint,
      end: keyPoint,
      progress: localProgress,
      sampleIndex,
    }];
  });
  return <svg className="p8-transit-overlay" width={geometry.width} height={geometry.height} viewBox={"0 0 " + geometry.width + " " + geometry.height} aria-hidden="true">
    {routes.map(route => {
      const point = pointOnCurve(route.start, route.end, route.progress, route.sampleIndex * 5);
      return <g className="p8-transit p8-transit--query" key={route.id}>
        <path d={curvePath(route.start, route.end, route.sampleIndex * 5)} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - route.progress} />
        <circle cx={point.x} cy={point.y} r="4.5" />
      </g>;
    })}
  </svg>;
}

function KeyCompass({ angle, live }: { angle: number; live: boolean }) {
  return <svg className={"p8-key-compass " + (live ? "is-live" : "")} viewBox="0 0 34 34" aria-hidden="true">
    <circle cx="17" cy="17" r="13.5" />
    <line x1="17" y1="17" x2="28" y2="17" className="p8-key-ray" style={{ transform: "rotate(" + angle + "deg)" } as CSSProperties} />
    <circle cx="28" cy="17" r="2.3" className="p8-key-tip" style={{ transform: "rotate(" + angle + "deg)" } as CSSProperties} />
    <circle cx="17" cy="17" r="1.6" className="p8-key-center" />
  </svg>;
}

function PersistentPool({
  stage,
  angles,
  phaseProgressValue,
  slotFocus,
  onSlotFocus,
  live,
}: {
  stage: RunStage;
  angles: readonly number[];
  phaseProgressValue: number;
  slotFocus: number | null;
  onSlotFocus: (index: number) => void;
  live: boolean;
}) {
  const active = activeSelections(stage);
  const bySlot = new Map<number, string[]>();
  active.forEach(({ sample, selected }) => selected.forEach(index => {
    const sources = bySlot.get(index) ?? [];
    sources.push(sample.id);
    bySlot.set(index, sources);
  }));
  const updatedSlots = new Set(stage.kind === "step" ? Object.keys(stage.batch?.gradientBySlot ?? {}).map(Number) : []);
  return <section className="p8-pool-panel" aria-label="跨 Batch 与任务持续复用的十个 Key–Prompt 槽位">
    <div className="p8-panel-heading">
      <div><strong>同一份 Key–Prompt Pool</strong><span>固定 M={promptPoolConfig.poolSize} 个槽位 · 本次每个 Prompt 含 Lₚ={promptPoolConfig.promptLength} 个 Token</span></div>
      <span className="p8-pool-version"><b>{stage.kind === "step" ? "Θ" + (stage.parameterVersion - 1) : "Θ" + stage.parameterVersion}</b><i>{stage.kind === "step" ? "→" : "·"}</i><b>{stage.kind === "step" ? "Θ" + stage.parameterVersion : "参数沿用"}</b></span>
    </div>
    <div className="p8-pool-grid">
      {slotIndices.map(index => {
        const sources = bySlot.get(index) ?? [];
        const selected = sources.length > 0;
        const updated = updatedSlots.has(index);
        const angle = angles[index - 1];
        return <button type="button" key={index} data-slot-index={index} data-motion-anchor={"p8-slot-" + index}
          className={"p8-pair-slot " + (selected ? "is-selected " : "") + (sources.length > 1 ? "is-shared " : "") + (updated ? "is-updated " : "") + (slotFocus === index ? "is-inspected" : "")}
          aria-label={"槽位 " + index + "，Key k" + index + " 与 Prompt P" + index + "；" + (selected ? "当前由 " + sources.join("、") + " 选中" : "当前未选中") + "；Key 角度 " + angle.toFixed(2) + " 度"}
          aria-pressed={slotFocus === index} onClick={() => onSlotFocus(index)}>
          <span className="p8-slot-heading"><b>{String(index).padStart(2, "0")}</b><small>{selected ? sources.join(" + ") : "保留"}</small></span>
          <span className="p8-pair-values"><span className="p8-key-value"><KeyCompass angle={angle} live={live} /><span><b>k<sub>{index}</sub></b><small>θ {angle.toFixed(1)}°</small></span></span>
            <span className="p8-prompt-value"><b>P<sub>{index}</sub></b><span aria-hidden="true">{Array.from({ length: promptPoolConfig.promptLength }, (_, token) => <i key={token} />)}</span></span></span>
          <span className="p8-slot-state">{updated ? "当前 Batch 匹配梯度命中" : selected ? (sources.length > 1 ? "多个样本共用此槽位" : "本次 Top‑N 命中") : "槽位身份与参数保留"}</span>
        </button>;
      })}
    </div>
    <div className="p8-pool-legend"><span><i className="p8-legend-key" /> Key 用于 Query 检索</span><span><i className="p8-legend-prompt" />配对 Prompt 进入分类路径</span><span className="p8-pool-note">读取不会删除槽位；只有当前批次选中的对象获得相应梯度。</span></div>
    <SlotInspector stage={stage} slotIndex={slotFocus} angles={angles} />
    {stage.kind === "step" && <div className="p8-step-progress" role="status">
      <span className="p8-step-progress-label">Batch 内梯度已累积</span>
      <span className="p8-step-progress-track"><i style={{ transform: "scaleX(" + phaseProgressValue + ")" }} /></span>
      <b>{phaseProgressValue >= .98 ? "Step 完成" : "本批一次写回"}</b>
    </div>}
  </section>;
}

function SlotInspector({ stage, slotIndex, angles }: { stage: RunStage; slotIndex: number | null; angles: readonly number[] }) {
  if (slotIndex === null) return <p className="p8-slot-inspector">选择一个槽位，查看当前批次为何命中它，以及对应的 Key–Prompt 参数身份。</p>;
  const entries = activeSelections(stage).filter(selection => selection.selected.includes(slotIndex));
  const source = entries.length ? entries.map(selection => selection.sample.symbol + " · γ=" + selection.distances[slotIndex].toFixed(6)).join("；") : "本阶段没有样本直接选中此槽位";
  return <p className="p8-slot-inspector" aria-live="polite"><strong>槽位 {slotIndex}</strong><span>Key 当前角度 {angles[slotIndex - 1].toFixed(3)}°。</span><span>{source}。</span><span>k<sub>{slotIndex}</sub> 只负责寻址，配对的 P<sub>{slotIndex}</sub> 才作为 Prompt Token 进入分类计算。</span></p>;
}

function CurrentInputs({ stage }: { stage: RunStage }) {
  const selections = activeSelections(stage);
  if (!selections.length) {
    return <aside className={"p8-input-panel p8-input-panel--" + stage.kind} aria-label="当前阶段的数据入口">
      <span className="p8-kicker">{stage.kind === "boundary" ? "任务边界" : "模型初态"}</span>
      <strong>{stage.kind === "boundary" ? "训练数据切换" : "尚未送入样本"}</strong>
      <p>{stage.kind === "boundary" ? "输入端短暂清空，参数池和分类器留在原位。下一批数据到来后再生成 Query。" : "十个槽位已初始化；冻结主干、Prompt、Key 与共享分类器各有明确身份。"}</p>
      {stage.kind === "boundary" && <span className="p8-boundary-handoff">Θ₂ → Task 2 使用同一对象</span>}
    </aside>;
  }
  return <aside className={"p8-input-panel p8-input-panel--" + stage.kind} aria-label="当前阶段的数据入口">
    <span className="p8-kicker">{stage.kind === "inference" ? "测试输入" : stage.batch?.task + " · " + stage.batch?.batch}</span>
    <strong>{stage.kind === "inference" ? "无任务 ID 的单样本" : stage.kind === "step" ? "同一 Batch 已完成前向" : "当前可用训练样本"}</strong>
    <div className="p8-sample-list">
      {selections.map(({ sample }) => <article className="p8-run-sample" key={sample.id}>
        <span className="p8-sample-mark" data-motion-anchor={"p8-query-" + sample.id}><i />{sample.symbol}</span>
        <span className="p8-sample-copy"><b>{sample.source}</b><small>{sample.label ? "标签 " + sample.label + " · 参与当前训练损失" : "标签未提供 · 仅生成预测"}</small></span>
      </article>)}
    </div>
    <div className="p8-query-explainer"><span>无 Prompt 冻结 ViT</span><i aria-hidden="true">→</i><b>q(x) → 当前 K → Top‑{promptPoolConfig.topN}</b></div>
    <p className="p8-input-note">{stage.kind === "inference" ? "测试沿用 Eq. (3)；检索不需要先判定任务身份。" : "检索由输入 Query 决定；当前 Batch 的标签只进入分类损失。"}</p>
  </aside>;
}

function SharedModelState({ stage, progress }: { stage: RunStage; progress: number }) {
  const stepDone = stage.kind === "step" && progress >= .98;
  const version = stage.kind === "step" ? (stepDone ? stage.parameterVersion : stage.parameterVersion - 1) : stage.parameterVersion;
  return <div className="p8-model-state" aria-label="持续复用的模型参数状态">
    <div className="p8-frozen-state"><span className="p8-lock" aria-hidden="true">▣</span><span><b>同一冻结 ViT</b><small>fₑ、fᵣ 保持 θ₀</small></span><span className="p8-state-tag">不更新</span></div>
    <div className="p8-trainable-state"><span className="p8-pool-glyph" aria-hidden="true">K↔P</span><span><b>Key–Prompt Pool</b><small>{stage.kind === "step" && !stepDone ? "本批写回中" : "固定槽位，参数持续继承"}</small></span><span className="p8-state-tag">Θ{version}</span></div>
    <div className="p8-classifier-state"><span className="p8-classifier-glyph" aria-hidden="true">gφ</span><span><b>一个共享分类器</b><small>{stage.kind === "step" && !stepDone ? "累计当前批次分类梯度" : "所有任务沿用同一 φ"}</small></span><span className="p8-state-tag">φ{version}</span></div>
  </div>;
}

function BatchMath({ stage }: { stage: RunStage }) {
  if (!stage.batch) return null;
  return <div className="p8-batch-summary" aria-label="当前批次的选择和更新摘要">
    <div><span>当前选集并集</span><strong>{stage.batch.selectedUnion.map(index => "P" + index).join(" · ")}</strong></div>
    <div><span>Batch 损失</span><strong>{stage.kind === "step" ? "Σᵢ [Lcls,i + λ Lmatch,i]" : "Lcls + λ Lmatch"}</strong></div>
    <div><span>更新边界</span><strong>{stage.kind === "step" ? "累积后 · Optimizer Step ×1" : "当前参数版本内完成前向"}</strong></div>
  </div>;
}

export function ContinualRun() {
  const playback = useLessonPlayback(duration);
  const activePhase = phaseAt(playback.position);
  const stage = P8_STAGES[activePhase];
  const progress = phaseProgress(playback.position, activePhase);
  const [slotFocus, setSlotFocus] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);
  const rootRef = useRef<HTMLDivElement>(null);
  const geometry = useMotionAnchors(rootRef);
  const activeAngles = stage.kind === "step" && stage.batch
    ? interpolateKeyAngles(stage.batch.startAngles, stage.batch.endAngles, progress)
    : stage.angles;
  const liveUpdate = stage.kind === "step" && playback.playing;

  return <>
    <p className="lesson-lead">P7 结束后，参数不再停在一张更新图里。沿着同一组 Key–Prompt 槽位，看每个 Batch 如何读当前状态、累积一次更新，再把新状态交给下一个 Batch、下一个任务和最终测试。</p>

    <section className="p8-run-intro explain-section">
      <h3>时间在前进，系统身份保持</h3>
      <p>任务切换会替换当前可用数据；它不会替换 Key Pool、Prompt Pool 或共享分类器。底部时间点代表参数状态交接，中央十个配对槽位从头到尾都是同一批对象。</p>
    </section>

    <figure className="lesson-figure p8-continuous-figure">
      <div className="figure-top"><strong>持续运行状态台</strong><span>稳定 Pool 身份 · Batch 后更新 · 推断无任务 ID</span></div>
      <div className="figure-body">
        <div className="p8-control-dock" aria-label="持续学习时间轴控制">
          <div className="p8-stage-stops" role="group" aria-label="选择训练与推断阶段">
            {P8_STAGES.map((item, index) => <button type="button" className="lesson-choice" key={item.id} aria-pressed={activePhase === index} onClick={() => playback.seek(boundaries[index] + 50)}>
              <span>{String(index + 1).padStart(2, "0")}</span>{item.short}
            </button>)}
          </div>
          <div className="p8-playback-row"><PlaybackControls playback={playback} label="一份参数状态跨 Batch 与任务传递" /><p className="p8-stage-note" aria-live="polite">{stage.note}</p></div>
          <div className="p8-time-rail" aria-label="参数状态时间轨道">
            {P8_STAGES.map((item, index) => <button type="button" key={item.id} aria-label={item.title} aria-current={activePhase === index ? "step" : undefined} onClick={() => playback.seek(boundaries[index] + 50)} className={"p8-time-node " + (index <= activePhase ? "is-reached " : "") + (activePhase === index ? "is-current" : "")}>
              <i>{item.kind === "step" ? "↻" : item.kind === "inference" ? "⌕" : item.kind === "boundary" ? "⇢" : index === 0 ? "Θ" : "•"}</i><span>{item.short}</span>
            </button>)}
          </div>
        </div>

        <div className={"p8-live-workbench " + (stage.kind === "inference" ? "is-inference " : "") + (stage.kind === "boundary" ? "is-boundary" : "")} ref={rootRef}>
          <QueryTransit geometry={geometry} stage={stage} progress={progress} reducedMotion={reducedMotion} />
          <div className="p8-workbench-topline"><span><b>{stage.title}</b><small>{stage.kind === "step" ? "在本批样本都完成前向后，才写回一次" : stage.kind === "inference" ? "当前只运行前向检索与分类" : "同一模型的当前观察点"}</small></span>
            <span className="p8-theta-version"><small>参数版本</small><b>{stage.kind === "step" && progress < .98 ? "Θ" + (stage.parameterVersion - 1) + " → Θ" + stage.parameterVersion : "Θ" + stage.parameterVersion}</b></span>
          </div>
          <div className="p8-stage-grid">
            <CurrentInputs stage={stage} />
            <div className="p8-addressing-panel">
              <span className="p8-kicker">检索与分类共用同一模型</span>
              <div className="p8-addressing-path"><span>Query</span><i aria-hidden="true">→</i><b>当前 Key 排名</b><i aria-hidden="true">→</i><b>读取配对 Prompt</b></div>
              <div className="p8-classification-path"><span>Prompt + xₑ</span><i aria-hidden="true">→</i><span>同一冻结 fᵣ</span><i aria-hidden="true">→</i><span>共享 gφ</span></div>
              <small>Key 只用于寻址，不作为 Transformer Token；分类仍读取选中 Prompt 的输出。</small>
              {stage.kind === "inference" ? <div className="p8-inference-output"><b>Logits → argmax</b><span>预测符号保留为 ŷ · 未模拟类别分数</span></div> : <div className="p8-training-signal"><b>{stage.kind === "step" ? "Lcls + λLmatch" : "训练标签进入 Lcls"}</b><span>{stage.kind === "step" ? "本批损失合并后统一反向传播" : "匹配损失训练本次选中的 Key"}</span></div>}
            </div>
            <PersistentPool stage={stage} angles={activeAngles} phaseProgressValue={progress} slotFocus={slotFocus} onSlotFocus={setSlotFocus} live={liveUpdate} />
          </div>
          <SharedModelState stage={stage} progress={progress} />
          <BatchMath stage={stage} />
          {stage.kind === "step" && <p className="p8-simulation-note">连续 Key 轨迹是二维角度参数上的 SGD 教学模拟：q、k 为单位向量，∂γ/∂θₖ=−sin(θq−θk)。Prompt/分类器梯度来源按算法呈现但不伪造数值；论文实验使用 Adam。</p>}
        </div>
      </div>
      <figcaption>对象身份固定，选择集合随当前 Key 状态重算。这里用 P5 的确定性角度例子演示寻址；Task 1/Task 2 的扩展 Query 是明确标注的合成教学输入。</figcaption>
    </figure>

    <section className="p8-pseudocode explain-section">
      <div><span className="p8-section-kicker">Algorithm 1 · 教学整理</span><h3>循环层级决定何时更新</h3>
        <p>每个样本独立产生 Query 与 Top‑N 选集；一个 Batch 的损失全部累积后才调用优化器。任务边界传递状态，不重建 Pool。以下伪代码保留论文执行顺序，并把反向步骤展开到批次级。</p>
      </div>
      <pre aria-label="L2P 训练与推断伪代码"><code>{`初始化 P、K、φ；冻结 fₑ、fᵣ
for task t:
  for epoch e:
    for mini-batch B:
      L_B ← 0；S_B ← ∅
      for each (x, y) in B:
        q ← FrozenViTWithoutPrompt(x).CLS
        S ← TopNByKeyDistance(q, K)         # Eq. (3)
        H ← fᵣ([P[S]; fₑ(x)])
        z ← gφ(Mean(H[0 : N·Lₚ, :]))
        L_B += CE(z,y) + λ Σⱼ∈S γ(q,kⱼ)
        S_B ← S_B ∪ S
      Backward(L_B)
      OptimizerStep(P[S_B], K[S_B], φ)
      # fₑ、fᵣ 权重保持冻结
  # 将当前 P、K、φ 交给下一任务

推断：用 Eq. (3) 检索并分类；无 y、Loss、Backward、Step、task ID`}</code></pre>
      <div className="p8-run-boundaries"><p><strong>有任务边界的实验</strong><span>可按协议多轮遍历该任务数据；状态跨 Epoch 与任务持续保留。</span></p><p><strong>Task-agnostic 基础路径</strong><span>数据按到达顺序逐 Batch 更新，不需要任务段标记；不启用 P9 的历史频率分支。</span></p><p><strong>缓存条件</strong><span>基础 L2P 不重放旧样本；L2P-R 是另一个加入缓存的实验变体。</span></p></div>
    </section>

    <section className="p8-next-question explain-section"><h3>模型已经跑通；共享效果要由证据回答</h3><p>参数状态在新任务中延续，Prompt 也可能再次被选中。P9 接着比较一个有任务边界时可选的训练策略，再核对作者报告的选择分布、消融和主实验结果。</p></section>
  </>;
}
