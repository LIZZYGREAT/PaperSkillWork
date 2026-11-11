
import { useState } from "react";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";
import { Sub } from "./lesson-math";
import { interpolateKeyAngles, P8_STAGES, type RunStage } from "./continual-run-data";
import { easeMotion } from "./visual-motion";
import "./continual-run.css";

const timeline = [
  { start: 0, seek: 0, label: "初始化" },
  { start: 1100, seek: 4410, label: "批次 1" },
  { start: 4800, seek: 4880, label: "写回 1" },
  { start: 7150, seek: 9620, label: "批次 2" },
  { start: 10050, seek: 10130, label: "写回 2" },
  { start: 12300, seek: 13400, label: "继承参数" },
  { start: 14400, seek: 17220, label: "批次 1" },
  { start: 17600, seek: 17680, label: "写回 3" },
  { start: 20100, seek: 23220, label: "预测" },
] as const;

const duration = 23900;
const sections = [
  { label: "起点", first: 0, end: 1 },
  { label: "Task 1", first: 1, end: 5 },
  { label: "任务交接", first: 5, end: 6 },
  { label: "Task 2", first: 6, end: 8 },
  { label: "测试", first: 8, end: 9 },
] as const;
const versionLabels = ["初始化", "Task 1 · 批次 1 后", "Task 1 · 批次 2 后", "Task 2 · 批次 1 后"];

function VersionRail({ cursor, version }: { cursor: number; version: number }) {
  return <div className="p8-state-rail" aria-label={`当前参数版本 Θ${version}`}>
    <div className="p8-state-track" aria-hidden="true">
      <div data-run-state style={{ left: `${cursor * 100 / (versionLabels.length - 1)}%` }} />
    </div>
    <ol>{versionLabels.map((label, index) => <li key={label} aria-current={version === index ? "step" : undefined}>
      <strong>Θ<sub>{index}</sub></strong><span>{label}</span>
    </li>)}</ol>
  </div>;
}

function KeyDial({ angle }: { angle: number }) {
  return <svg viewBox="0 0 30 30" aria-hidden="true">
    <circle cx="15" cy="15" r="13" />
    <path d="M15 15h10l-3-2m3 2-3 2" transform={`rotate(${-angle} 15 15)`} />
  </svg>;
}

function SharedModel({ stage, angles, slot, setSlot, selected, write, version }: {
  stage: RunStage; angles: readonly number[]; slot: number; setSlot: (index: number) => void;
  selected: readonly number[]; write: number; version: number;
}) {
  const isStep = stage.kind === "step";
  const touched = stage.batch?.selectedUnion.includes(slot);
  const previous = stage.batch?.startAngles[slot - 1];
  const current = angles[slot - 1];
  const lastWrite = P8_STAGES.reduce((latest, event) => (
    event.kind === "step" && event.parameterVersion <= version && event.batch?.selectedUnion.includes(slot)
      ? event.parameterVersion : latest
  ), 0);

  return <div className="p8-model">
    <div className="p8-backbone">
      <svg viewBox="0 0 54 40" aria-hidden="true">
        <path d="M2 8H43l8 6H10z M2 18H43l8 6H10z M2 28H43l8 6H10z" />
        <path d="M26 20v-4a4 4 0 0 1 8 0v4m-10 0h12v11H24z" />
      </svg>
      <strong>冻结 ViT</strong><span>fₑ / fᵣ</span>
    </div>
    <div className="p8-pool">
      <div className="p8-pool-title"><strong>同一组 Key–Prompt</strong><span>固定配对 · 选择随输入改变</span></div>
      <div className="p8-pool-slots" role="group" aria-label="查看 Key 与 Prompt 槽位">
        {angles.map((angle, i) => {
          const id = i + 1;
          const active = selected.includes(id);
          const updated = isStep && stage.batch?.selectedUnion.includes(id);
          return <button key={id} type="button" data-slot={id} data-hit={active} aria-pressed={slot === id}
            aria-label={`槽位 ${id}${active ? "，当前选中" : ""}`} onClick={() => setSlot(id)}>
            <KeyDial angle={angle} />
            <span className="p8-prompt-strips" aria-hidden="true" style={{ opacity: updated ? .48 + .52 * write : .75 }} />
            <span>{id}</span>
          </button>;
        })}
      </div>
      <p className="p8-slot-detail" data-angle={current.toFixed(4)}>
        <strong>k{slot}</strong> · {current.toFixed(1)}°
        <span>{isStep && touched ? `（批前 ${previous?.toFixed(1)}°）` : " "}</span>
        <span> · P{slot} 上次写入 Θ{lastWrite}{selected.includes(slot) ? " · 本轮命中" : ""}</span>
      </p>
    </div>
    <div className="p8-classifier">
      <svg viewBox="0 0 48 34" aria-hidden="true">
        <path d="M5 8H18 M5 17H18 M5 26H18 M29 8H43 M29 17H43 M29 26H43" />
        <rect x="17" y="3" width="14" height="28" rx="3" fill={isStep ? `rgba(121, 92, 170, ${.14 + .6 * write})` : "#e9e2f3"} />
      </svg>
      <strong>共享分类器</strong><span>φ · Θ{version}</span>
    </div>
  </div>;
}

function RunProcess({ stage, local, write }: { stage: RunStage; local: number; write: number }) {
  const inference = stage.kind === "inference";
  const samples = stage.query ? [stage.query] : stage.batch?.samples ?? [];
  const hasInputs = samples.length > 0;
  const isStep = stage.kind === "step";
  const progress = isStep ? 1 : local;
  const inputArrival = isStep ? 1 : easeMotion(local / .18);
  const departure = isStep ? easeMotion((local - .89) / .11) : 0;
  const layers = [
    { label: "无 Prompt Query", description: samples.map(({sample}) => `${sample.symbol.replace("x_", "q")} · ${sample.angleDegrees}°`).join(" / "), reveal: .16 },
    { label: "当前 Key 检索", description: samples.map(({sample, selected}) => `${sample.symbol.replace("x_", "")} [${selected.join(" ")}]`).join(" / "), reveal: .37 },
    { label: "带 Prompt 分类", description: inference ? "Logits → 预测 ŷ" : "Prompt 输出均值 → Logits", reveal: .59 },
  ];
  if (!inference) layers.push({
    label: stage.kind === "step" ? "批末写回" : "计算联合损失",
    description: stage.kind === "step" ? (write >= 1 ? "优化器已执行 1 次" : "整批梯度 → 优化器") : "Lcls + λ Lmatch",
    reveal: .81,
  });
  return <section className="p8-process" aria-label={inference ? "推断分支" : "当前数据与运算"} data-mode={inference ? "inference" : stage.kind}>
    <div className="p8-process-title">
      <strong>{stage.title}</strong>
      {hasInputs && <span>{inference ? "无标签 · 无任务 ID" : `标签 ${samples.map(({sample}) => sample.label?.replace("y_", "y")).join("、")}`}</span>}
    </div>
    {hasInputs ? <ol className="p8-operations" style={{ opacity: 1 - departure }}>
      <li><strong>{inference ? "测试图像" : "训练样本"}</strong>
        <span className="p8-input-samples" style={{ opacity: inputArrival, transform: `translateX(${-10 * (1 - inputArrival)}px)` }}>
          {samples.map(({sample}) => <b key={sample.id}>{sample.symbol.replace("x_", "x")}</b>)}
        </span>
      </li>
      {layers.map(({label, description, reveal}) => {
        const amount = easeMotion((progress - reveal) / .14);
        return <li key={label} style={{opacity: .43 + .57 * amount}}>
          <span className="p8-process-fill" aria-hidden="true" style={{transform: `scaleX(${amount})`}} />
          <strong>{label}</strong><span>{amount > .3 ? description : "\u00a0"}</span>
        </li>;
      })}
    </ol> : <p className="p8-no-input">{stage.kind === "boundary"
      ? "Task 1 的训练样本已退出。Task 2 将从当前参数继续读取。"
      : "等待第一个训练批次。Key、Prompt 和分类器只在这里初始化。"}</p>}
  </section>;
}

const trainingCode = `初始化 K、P、φ，冻结 fₑ、fᵣ
for task in 数据流:
  for epoch in task:
    for batch B in epoch:
      L_B ← 0；S_B ← ∅
      for (x, y) in B:
        q ← 无 Prompt 的冻结 ViT(x) 的 [CLS]
        S ← TopN(γ(q, K))                  # Eq. (3)
        H ← fᵣ([P[S]; fₑ(x)])
        z ← gφ(AvgPool(H[0 : N·Lₚ, :]))
        L_B += CE(z, y) + λ Σⱼ∈S γ(q, kⱼ)
        S_B ← S_B ∪ S
      Backward(L_B)
      OptimizerStep(K[S_B], P[S_B], φ)
  # 下一任务沿用当前 K、P、φ`;
const inferenceCode = `q ← 无 Prompt 的冻结 ViT(x) 的 [CLS]
S ← TopN(γ(q, K))                         # Eq. (3)
H ← fᵣ([P[S]; fₑ(x)])
预测 ← argmax gφ(AvgPool(H[0 : N·Lₚ, :]))`;

export function ContinualRun() {
  const playback = useLessonPlayback(duration);
  const [slot, setSlot] = useState(3);
  const phase = timeline.reduce((active, item, index) => item.start <= playback.position ? index : active, 0);
  const stage = P8_STAGES[phase];
  const { start } = timeline[phase];
  const end = timeline[phase + 1]?.start ?? duration;
  const local = (playback.position - start) / (end - start);
  const batch = stage.batch;
  const isStep = stage.kind === "step" && batch !== null;
  const write = isStep ? (local >= .79 ? 1 : easeMotion((local - .16) / .63)) : 0;
  const writing = isStep && local < .79;
  const version = stage.parameterVersion - Number(writing);
  const cursor = writing ? version + write : version;
  const angles = isStep ? interpolateKeyAngles(batch.startAngles, batch.endAngles, write) : stage.angles;
  const selected = local >= .48 || isStep ? stage.query?.selected ?? batch?.selectedUnion ?? [] : [];
  const note = writing
    ? "先汇总损失和梯度，再写回当前这一个批次。状态到达下一版本后才供下一批读取。"
    : stage.note;

  return <>
    <p className="lesson-lead">P7 解释了一批数据如何完成一次更新。在持续学习中，这次更新的结果还要交给下一批，甚至交给另一个任务。模型用的是一套持续保存的参数，当前样本只决定这一轮会用到其中哪些槽位。</p>
    <section className="explain-section">
      <h3>起点只初始化一次</h3>
      <p>将预训练 ViT 的嵌入层和 Transformer 固定下来，并初始化 Key Pool、Prompt Pool 与共享分类器。把这三个可学习部分记为 <math><Sub base="Θ" index="0" /><mo>=</mo><mo>(</mo><mi>K</mi><mo>,</mo><mi>P</mi><mo>,</mo><mi>φ</mi><mo>)</mo></math>。同一个槽位上的 Key 用于检索，Prompt 用于分类。槽位的编号贯穿整个训练与测试。</p>
    </section>
    <section className="explain-section">
      <h3>每批读取当前版本，批末交出新版本</h3>
      <p>Task 1 的第一批沿用 P5 的 A、B。两者各自提取 Query、检索并带 Prompt 分类，计算联合损失后一起写回。看下方版本标记从 Θ₀ 移到 Θ₁ 时，池和分类器的位置与身份都保持固定。<span className="lesson-key">第二批读取 Θ₁</span>，再用自己的 Query 在更新后的 Key 上排名。</p>
    </section>

    <figure className="lesson-figure p8-continuous-figure">
      <div className="p8-control-dock">
        <div className="p8-stage-stops" role="group" aria-label="持续学习时间线">
          {sections.map(section => <div className="p8-time-group" key={section.label}>
            <span>{section.label}</span>
            {timeline.slice(section.first, section.end).map((event, offset) => {
              const index = section.first + offset;
              return <button type="button" className="lesson-choice" key={event.start} aria-pressed={index === phase} data-run-event={index}
                onClick={() => playback.seek(event.seek)}>{event.label}</button>;
            })}
          </div>)}
        </div>
        <PlaybackControls playback={playback} label="运行进度" />
      </div>
      <VersionRail cursor={cursor} version={version} />
      <SharedModel stage={stage} angles={angles} slot={slot} setSlot={setSlot} selected={selected} write={write} version={version} />
      <RunProcess stage={stage} local={local} write={write} />
      <figcaption aria-live="polite">{note}</figcaption>
    </figure>
    <p className="p8-example-note">教学模拟使用单位圆上的 Key 与合成 Query。Key 角度用匹配损失的梯度做二维 SGD，Prompt 与分类器只显示参数身份与更新事件。论文实验采用 Adam。</p>

    <section className="explain-section">
      <h3>任务交接切换数据，模型继承 Θ₂</h3>
      <p>Task 1 的第二批写回 Θ₂ 后，Task 1 的数据退出。基础 L2P 直接用继承下来的 <span className="lesson-key">同一套 Key、Prompt 和分类器</span>处理 Task 2 的第一批，新的 Query 在原池里重新选槽位。这个批次完成后，最新状态变为 Θ₃。</p>
    </section>
    <section className="explain-section">
      <h3>测试只做检索与分类</h3>
      <p>测试输入是一张没有标签、也没有任务 ID 的图像。模型用 Θ₃ 按式 (3) 做普通 Key 距离检索，再取配对 Prompt 做分类前向，最后选出分数最高的类别。此时画面里只剩这条前向路径，损失、反向和优化器都退出，<span className="lesson-key">Θ₃ 保持固定</span>。</p>
    </section>
    <section className="explain-section p8-pseudocode">
      <h3>Algorithm 1 中，循环层级决定写回时机</h3>
      <p>在有任务边界的协议中，每个任务可多轮遍历当前数据，每一轮包含多个批次。样本逐个产生选集与损失，选集取并集，损失累积到整批再反向。参数因此可以跨 Epoch 和任务持续保存。</p>
      <details open><summary>训练 · Task → Epoch → Batch → Sample</summary><pre><code>{trainingCode}</code></pre></details>
      <details><summary>推断 · 只传入图像 x</summary><pre><code>{inferenceCode}</code></pre></details>
      <p>在无明确任务边界的 task-agnostic 设置里，基础方法随数据到达逐批更新。基础 L2P 无需旧样本回放，L2P-R 是加入回放缓存的实验变体。</p>
    </section>
    <p className="lesson-takeaway">同一个槽位可被多个任务中的样本选中。P9 将比较可选的历史频率策略，并用论文的选择分布、消融和主实验观察共享实际发生了多少。</p>
  </>;
}
