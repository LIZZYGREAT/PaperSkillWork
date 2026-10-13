import { useState } from "react";
import { GuidedStepControls, type GuidedStep } from "../components/GuidedStepControls";
import { PaperTerm } from "../components/PaperTerm";
import { CLASS_VISUALS, INCOMING_CLASS_ID, INCOMING_SAMPLES, OLD_CLASS_IDS, OLD_MEMORY_SIZE, P_BEFORE, TRAINING_SET_SIZE, type Sample } from "../data/icarl-runtime";

const steps: readonly GuidedStep[] = [
  { title: "保存的 Exemplars 怎样参与下一轮学习？", short: "接续预测与训练" },
  { title: "哪些图像共同进入训练集 D？", short: "Replay · 构造 D" },
  { title: "为什么先记录更新前响应 Q？", short: "快照 Q" },
  { title: "Q 覆盖 D 中哪些图片和输出？", short: "检查覆盖范围" },
  { title: "开始更新前，D 和 Q 如何就绪？", short: "准备训练" },
];

const stageNarratives = [
  [
    "到这里，我们已经知道怎样挑选有代表性的 Exemplars，并在记忆有限时维护它们。P3 还展示了它们的一项作用：构造类别 Prototype，帮助未来的 Query 完成预测。",
    "但类别学习还要继续。下一批新类别到来时，特征提取器需要更新参数；如果只用新类别图片训练，旧类别能力就可能退化。保存下来的 Exemplars 能不能也参与训练，让模型继续接触旧类信息？",
    "自然的做法是把新类别的完整训练图片和已保存的旧类 Exemplars 放在一起。接下来先看这组训练输入怎样形成，再看参数更新前还要记录什么。",
  ],
  ["把旧类图片再次作为本轮训练输入，称为 Replay 或 Rehearsal。旧 Exemplars 与新类完整数据一起组成 D；读取样本不会让持久记忆 P 消失。"],
  ["D 已包含新旧两类图片。如果现在直接更新网络，旧类别节点原先对这些图片的响应可能改变。",
    "因此先用尚未更新的当前模型，记录 D 中每张图片在所有旧类输出节点上的 sigmoid 响应，形成这轮训练使用的 Q。"],
  ["Q 的行覆盖 D 中每张图片：既包含旧 Exemplars，也包含新类完整数据。",
    "Q 的列覆盖所有旧类输出节点；新类节点尚无旧响应，不为它构造 Q。"],
  ["现在 D、更新前冻结的 Q 和可训练的当前网络已经就绪。",
    "下一步才会把新类别标签与旧类别响应分别变成训练目标，让同一个模型学习新类并尽量保留旧类能力。"],
] as const;

const timelineSteps = [
  "新类别到达",
  "构造训练集 D",
  "快照旧类响应 Q",
  "更新 representation",
  "构造节点目标与损失",
] as const;

const OLD_EXEMPLARS: Sample[] = OLD_CLASS_IDS.flatMap((classId) => P_BEFORE[classId]);
const TRAINING_ITEMS: Sample[] = [...OLD_EXEMPLARS, ...INCOMING_SAMPLES];

function sampleStyle(sample: Sample) {
  return { "--sample-accent": CLASS_VISUALS[sample.classId].color } as React.CSSProperties;
}

function SampleChip({ sample, origin }: { sample: Sample; origin: "old" | "new" }) {
  return <span className={`p5-sample-chip p5-sample-chip--${origin}`} style={sampleStyle(sample)}>
    <b>{CLASS_VISUALS[sample.classId].glyph} {CLASS_VISUALS[sample.classId].displayLabel}</b><span>{sample.id}</span><small>{origin === "old" ? "old exemplar" : "new full data"}</small>
  </span>;
}

function MemoryBuckets() {
  return <div className="p5-memory-buckets">
    {OLD_CLASS_IDS.map((classId) => <section className="p5-memory-bucket" key={classId} style={{ "--bucket-accent": CLASS_VISUALS[classId].color } as React.CSSProperties}>
      <div><b>{CLASS_VISUALS[classId].displayLabel}</b><small>P<sub>{CLASS_VISUALS[classId].index}</sub> · {P_BEFORE[classId].length}</small></div>
      <div className="p5-memory-bucket__samples">{P_BEFORE[classId].map((sample) => <SampleChip key={sample.id} sample={sample} origin="old" />)}</div>
    </section>)}
  </div>;
}

function OutputNodes({ compact = false }: { compact?: boolean }) {
  return <div className={`p5-output-nodes${compact ? " p5-output-nodes--compact" : ""}`} aria-label="本轮扩展后的旧类与新类输出节点">
    {OLD_CLASS_IDS.map((classId) => <span key={classId} style={{ "--node-accent": CLASS_VISUALS[classId].color } as React.CSSProperties}><i />{CLASS_VISUALS[classId].outputNodeLabel}</span>)}
    <span className="p5-output-nodes__new" style={{ "--node-accent": CLASS_VISUALS[INCOMING_CLASS_ID].color } as React.CSSProperties}><i />{CLASS_VISUALS[INCOMING_CLASS_ID].outputNodeLabel}</span>
    {compact ? null : <small>新增 g₄ 已在本轮训练前加入；Q 只快照旧节点响应。</small>}
  </div>;
}

function UpdateTimeline({ stage }: { stage: number }) {
  const currentStep = stage === 0 ? 0 : stage === 1 ? 1 : 2;
  return <section className="p5-timeline" aria-label="一次增量更新时间线">
    <div className="p5-timeline__heading"><div><span className="eyebrow">ONE INCREMENTAL UPDATE</span><b>更新顺序</b></div><span>本页聚焦 ①–③</span></div>
    <ol>
      {timelineSteps.map((label, index) => <li key={label} className={`${index <= 2 ? "is-in-scope" : "is-later"}${index === currentStep && stage <= 2 ? " is-current" : index < currentStep || (stage > 2 && index <= currentStep) ? " is-done" : ""}`}>
        <span className="p5-timeline__number">{String(index + 1).padStart(2, "0")}</span><b>{label}</b>
        {index < timelineSteps.length - 1 ? <i aria-hidden="true">→</i> : null}
      </li>)}
    </ol>
    <p>本页建立 D 与更新前的 Q；下一页再用两者构造训练目标并更新参数。</p>
  </section>;
}

function ResponseMatrix({ items = TRAINING_ITEMS }: { items?: readonly Sample[] }) {
  return <div className="p5-response-matrix" role="table" aria-label={`D 中全部 ${items.length} 个样本，对应 ${OLD_CLASS_IDS.length} 个旧类别 response targets`}>
    <div className="p5-response-row p5-response-row--head" role="row">
      <span role="columnheader">D 中样本</span>
      {OLD_CLASS_IDS.map((classId) => <span role="columnheader" key={classId} style={{ "--node-accent": CLASS_VISUALS[classId].color } as React.CSSProperties}>{CLASS_VISUALS[classId].outputNodeLabel}</span>)}
    </div>
    {items.map((sample) => {
      const origin = sample.classId === INCOMING_CLASS_ID ? "new" : "old";
      return <div className={`p5-response-row p5-response-row--${origin}`} role="row" key={sample.id}>
        <span className="p5-response-row__sample" role="rowheader" style={sampleStyle(sample)}><b>{CLASS_VISUALS[sample.classId].index}</b><span>{sample.id}</span><small>{origin === "old" ? "P" : "X"}</small></span>
        {OLD_CLASS_IDS.map((classId) => <span className="p5-q-cell" role="cell" key={classId} aria-label={`q_${sample.id}^${CLASS_VISUALS[classId].index} 已记录`} title={`q_${sample.id}^${CLASS_VISUALS[classId].index} · 更新前旧类 response`}><i aria-hidden="true">●</i><small className="p5-sr-only">qᵢ^{CLASS_VISUALS[classId].index} response 已记录并锁定</small></span>)}
      </div>;
    })}
  </div>;
}

function ObjectLifetime() {
  return <details className="p5-lifetime">
    <summary>Inspect object lifetime</summary>
    <div className="p5-lifetime__table" role="table" aria-label="一次增量更新中对象的生命周期">
      <div role="row"><b role="columnheader">对象</b><b role="columnheader">生命周期</b></div>
      <div role="row"><span role="cell">Θ</span><span role="cell">跨增量阶段持续存在，并在更新中改变</span></div>
      <div role="row"><span role="cell">P</span><span role="cell">跨阶段保留；memory 本身不因读取而消失</span></div>
      <div role="row"><span role="cell">X<sub>new</sub></span><span role="cell">本次新类别阶段提供的完整图像</span></div>
      <div role="row"><span role="cell">D</span><span role="cell">本次 representation update 使用的训练集</span></div>
      <div role="row"><span role="cell">Q</span><span role="cell">只在本次 update 内固定使用的 response snapshot</span></div>
    </div>
  </details>;
}

export function PageFive({ onContinue }: { onContinue?: () => void }) {
  const [stage, setStage] = useState(0);

  return (
    <article className="tutorial-page icarl-page icarl-page--p5">
      <header className="page-heading icarl-page__heading">
        <div className="icarl-page__eyebrow"><span>PAGE 05</span><i /> EXEMPLARS JOIN THE NEXT UPDATE</div>
        <h1>这些代表图片怎样继续参与学习？</h1>
        <p>前面，我们用 Exemplars 维护了可供未来预测的类别代表，也建立了筛选和管理记忆的办法。接下来，新类别数据到来，模型要继续学习；我们怎样把旧类 Exemplars 用到这次参数更新中？先从本轮已有的模型、旧记忆和新类数据出发，看看训练集如何形成，以及为什么更新前要记录旧类响应。</p>
      </header>

      <section className="p5-reasoning" aria-live="polite" aria-label={`第 ${stage + 1} 步推理引导`}>
        <span>0{stage + 1}</span><div><b>从已有作用继续追问</b>{stageNarratives[stage].map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </section>

      {stage > 0 ? <UpdateTimeline stage={stage} /> : null}
      <GuidedStepControls steps={steps} current={stage} onChange={setStage} label="Page 5 Replay、D 与 Q 教学步骤" />

      {stage === 0 ? <section className="p5-start-grid" aria-label="更新前已有状态与到达的新类别">
        <section className="panel p5-persistent-state">
          <div className="panel-heading"><div><span className="eyebrow">CURRENT PERSISTENT STATE</span><h2>网络 Θ 与旧记忆 P</h2></div><span className="p5-persistent-badge">跨阶段保留</span></div>
          <div className="p5-theta-card"><div><b>Θ</b><span>current network parameters</span></div><i aria-hidden="true">→</i><div className="p5-feature-head"><b>φ</b><span>feature extractor</span></div><i aria-hidden="true">+</i><div><b>g₁, g₂, g₃, g₄</b><span>expanded output layer · before training</span></div></div>
          <OutputNodes />
          <div className="p5-memory-heading"><b>P = (P<sub>1</sub>, P<sub>2</sub>, P<sub>3</sub>)</b><span>persistent exemplar memory · {OLD_MEMORY_SIZE} images</span></div>
          <MemoryBuckets />
          <p className="p5-persistent-note">这些旧 exemplars 会被读取并放入 D；P 仍留在持久 memory 中。</p>
        </section>
        <section className="panel p5-incoming-state">
          <div className="panel-heading"><div><span className="eyebrow">INCOMING STAGE DATA</span><h2>Class 4 的完整训练图像</h2></div><span className="p5-new-count">{INCOMING_SAMPLES.length} images</span></div>
          <p className="p5-panel-intro">新类到达时，当前阶段可以访问 X<sub>D</sub> 中的全部样本。</p>
          <div className="p5-incoming-list">{INCOMING_SAMPLES.map((sample) => <SampleChip key={sample.id} sample={sample} origin="new" />)}</div>
          <div className="p5-state-separation" aria-label="持久模型、持久记忆和新阶段数据共同组成当前更新状态">
            <div className="p5-state-item"><span>网络参数</span><b>Θ</b></div>
            <i aria-hidden="true">+</i>
            <div className="p5-state-item"><span>旧类记忆</span><b>P</b></div>
            <i aria-hidden="true">+</i>
            <div className="p5-state-item"><span>新类数据</span><strong>X<sub>D</sub></strong></div>
          </div>
        </section>
      </section> : null}

      {stage === 1 ? <section className="p5-build-set" aria-label="构造 training set D">
        <div className="p5-source-panels">
          <section className="panel p5-source-card p5-source-card--old"><div className="panel-heading"><div><span className="eyebrow">PERSISTENT MEMORY</span><h2>旧类 exemplars</h2></div><span>{OLD_EXEMPLARS.length}</span></div><p>P 中样本被读取进 D，来源 memory 仍然保留。</p><div className="p5-source-card__samples">{OLD_EXEMPLARS.map((sample) => <SampleChip key={sample.id} sample={sample} origin="old" />)}</div><b className="p5-source-stays">P remains stored</b></section>
          <span className="p5-set-plus" aria-hidden="true">+</span>
          <section className="panel p5-source-card p5-source-card--new"><div className="panel-heading"><div><span className="eyebrow">INCOMING FULL DATA</span><h2>新类 X<sub>D</sub></h2></div><span>{INCOMING_SAMPLES.length}</span></div><p>本阶段所有新类图像都进入训练集合。</p><div className="p5-source-card__samples">{INCOMING_SAMPLES.map((sample) => <SampleChip key={sample.id} sample={sample} origin="new" />)}</div><b className="p5-source-stays">all new images available</b></section>
          <span className="p5-set-arrow" aria-hidden="true">→</span>
        </div>
        <section className="panel p5-dataset-panel">
          <div className="panel-heading"><div><span className="eyebrow">REPLAY / REHEARSAL · TRAINING SET D</span><h2>两类来源汇入同一训练集</h2></div><strong>|D| = {TRAINING_SET_SIZE}</strong></div>
          <div className="p5-dataset-equation"><span>∪ old exemplars from P</span><i aria-hidden="true">+</i><span>∪ full new-class data X<sub>D</sub></span><i aria-hidden="true">=</i><b>D</b></div>
          <div className="p5-dataset-groups"><section><b>OLD · {OLD_EXEMPLARS.length}</b><div>{OLD_EXEMPLARS.map((sample) => <SampleChip key={sample.id} sample={sample} origin="old" />)}</div></section><section><b>NEW · {INCOMING_SAMPLES.length}</b><div>{INCOMING_SAMPLES.map((sample) => <SampleChip key={sample.id} sample={sample} origin="new" />)}</div></section></div>
          <p className="p5-dataset-note">D 中训练样本统一送入本轮更新；旧 exemplar 在 D 中作为样本参与训练，P 则继续作为持久记忆保留。</p>
        </section>
      </section> : null}

      {stage === 2 ? <section className="p5-snapshot-grid" aria-label="更新前网络为 D 中样本记录 Q">
        <section className="panel p5-snapshot-input"><div className="panel-heading"><div><span className="eyebrow">READY TRAINING SET</span><h2>D 已准备好</h2></div><strong>{TRAINING_SET_SIZE} samples</strong></div>
          <div className="p5-count-breakdown"><span>old exemplars<strong>{OLD_EXEMPLARS.length}</strong></span><i>+</i><span>new full data<strong>{INCOMING_SAMPLES.length}</strong></span><i>=</i><b>D · {TRAINING_SET_SIZE}</b></div>
          <div className="p5-representative-rows"><div><span className="p5-origin-tag p5-origin-tag--old">OLD</span><b>old exemplar</b><small>每个旧记忆图像</small></div><div><span className="p5-origin-tag p5-origin-tag--new">NEW</span><b>new-class image</b><small>每个新类完整数据样本</small></div></div>
          <p>D 中的每个样本都要由当前网络记录 old-class responses。</p>
        </section>
        <section className="panel p5-snapshot-pipeline"><div className="panel-heading"><div><span className="eyebrow">BEFORE ANY PARAMETER UPDATE</span><h2>先快照旧节点响应</h2></div><span className="p5-snapshot-badge">pre-update</span></div>
          <div className="p5-snapshot-flow"><div className="p5-flow-node p5-flow-node--d"><b>D</b><span>all {TRAINING_SET_SIZE} samples</span></div><i aria-hidden="true">→</i><div className="p5-flow-network"><span className="eyebrow">CURRENT MODEL · Θ<sub>before</sub></span><b>φ + old output head</b><OutputNodes compact /><small>此刻还是本轮唯一的 current network</small></div><i aria-hidden="true">→</i><div className="p5-flow-node p5-flow-node--q"><b>Q</b><span>update-local response snapshot</span></div></div>
          <div className="p5-response-formula"><b>q<sub>i</sub><sup>y</sup> = g<sub>y</sub>(x<sub>i</sub>)</b><span>y ∈ {"{"}{OLD_CLASS_IDS.map((classId) => CLASS_VISUALS[classId].index).join(", ")}{"}"}</span></div>
          <p className="p5-snapshot-note">只有先记录 Q，后续改变 Θ 时才不会丢掉此次更新开始前的旧类 response。Q 完成后固定于本轮 update；它不是永久维护的第二个模型。</p>
        </section>
      </section> : null}

      {stage === 3 ? <section className="panel p5-matrix-panel" aria-label="D 中所有样本的旧类别响应矩阵">
        <div className="panel-heading"><div><span className="eyebrow">ALL TRAINING SAMPLES RECEIVE OLD-CLASS RESPONSES</span><h2>D 中每一行都快照所有旧输出节点</h2></div><span className="p5-matrix-count">{TRAINING_SET_SIZE} × {OLD_CLASS_IDS.length}</span></div>
        <p className="p5-matrix-intro">行是 D 中的实际样本；列是更新开始前已存在的旧类输出节点。每个 ● 表示对应的 q<sub>i</sub><sup>y</sup> 已记录，不显示虚构数值。</p>
        <div className="p5-matrix-legend"><span><i className="p5-origin-tag p5-origin-tag--old">P</i>旧 exemplar</span><span><i className="p5-origin-tag p5-origin-tag--new">X</i>新类完整数据</span><span><i className="p5-q-dot" />response snapshot present</span></div>
        <div className="p5-matrix-groups">
          <section><div className="p5-matrix-group-heading"><b>OLD EXEMPLARS FROM P</b><span>{OLD_EXEMPLARS.length} rows</span></div><ResponseMatrix items={OLD_EXEMPLARS} /></section>
          <section><div className="p5-matrix-group-heading"><b>NEW FULL DATA X<sub>D</sub></b><span>{INCOMING_SAMPLES.length} rows</span></div><ResponseMatrix items={INCOMING_SAMPLES} /></section>
        </div>
        <div className="p5-all-samples-takeaway"><b>all |D| = {TRAINING_SET_SIZE}</b><span>old exemplars and new-class images are treated alike for the pre-update old-node snapshot.</span></div>
        <div className="p5-q-locked"><span>Q</span><b>LOCKED DURING THIS UPDATE</b><small>Θ changes later; these pre-update responses do not.</small></div>
          <p className="p5-new-nodes-note">All four output nodes are present before training. Q snapshots only g₁–g₃; the new node g₄ receives its hard target from the label.</p>
      </section> : null}

      {stage === 4 ? <section className="p5-ready" aria-label="更新前准备完成">
        <div className="p5-ready-flow">
          <section className="p5-ready-card p5-ready-card--d"><span className="eyebrow">TRAINING SET</span><b>D</b><div><span>{OLD_EXEMPLARS.length} old exemplars</span><i>+</i><span>{INCOMING_SAMPLES.length} new images</span></div><strong>{TRAINING_SET_SIZE} samples total</strong></section>
          <i className="p5-ready-arrow" aria-hidden="true">→</i>
          <section className="p5-ready-card p5-ready-card--q"><span className="eyebrow">FROZEN TARGET INFORMATION</span><b>Q <small>LOCKED</small></b><div><span>{TRAINING_SET_SIZE} sample rows</span><i>×</i><span>{OLD_CLASS_IDS.length} old nodes</span></div><strong>update-local · fixed</strong></section>
          <i className="p5-ready-arrow" aria-hidden="true">→</i>
          <section className="p5-ready-card p5-ready-card--theta"><span className="eyebrow">CURRENT NETWORK</span><b>Θ</b><div><OutputNodes compact /></div><strong>ready for representation update</strong></section>
        </div>
        <div className="p5-ready-note"><b>P persists alongside Θ.</b><span>旧 exemplars 被读取进 D，但没有被消耗。Q 保存完成后，不需要把 pre-update 状态长期保留为第二套网络；同一个 current Θ 继续进入更新。</span></div>
        <ObjectLifetime />
      </section> : null}

      <section className="icarl-concept-note"><span className="icarl-concept-note__index">0{stage + 1}</span><div><span className="eyebrow">这一幕要看懂</span><p>{stage === 0 ? "Exemplars 先支持预测；下一轮中它们作为旧类训练图片，与新类完整数据一起参加学习。" : stage === 1 ? "D 由所有新类完整数据和旧类 Exemplars 合成；旧记忆作为训练来源被读取，但 P 不会消失。" : stage === 2 ? "参数更新之前，pre-update current network 对整个 D 保存旧输出节点 response，形成本轮使用的 Q。" : stage === 3 ? "qᵢʸ 覆盖 D 中全部样本：旧 Exemplars 和新类图像都经过同一个 pre-update model；列只对应旧类节点。" : "保留本轮 D、冻结的 Q 和可训练的 current Θ；完成准备后才进入训练目标构造。"}</p></div></section>

      <footer className="icarl-handoff">
        <div><span className="eyebrow">NEXT · PAGE 06</span><p>现在 D 已由新类完整数据和旧类 Exemplars 组成，更新前的旧类响应也已固定为 Q。接下来怎样用新类标签与旧类响应构造目标，使模型学到新类并尽量保留旧类能力？</p></div>
        {onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>进入第 6 页 · 蒸馏与损失 <b aria-hidden="true">→</b></button> : <span className="icarl-handoff__upcoming">下一页</span>}
      </footer>
    </article>
  );
}
