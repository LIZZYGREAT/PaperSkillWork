import { useState } from "react";
import { GuidedStepControls, type GuidedStep } from "../components/GuidedStepControls";
import { CLASS_VISUALS, INCOMING_CLASS_ID, INCOMING_SAMPLES, OLD_CLASS_IDS, OLD_MEMORY_SIZE, P_BEFORE, TRAINING_SET_SIZE, type Sample } from "../data/icarl-runtime";

const steps: readonly GuidedStep[] = [
  { title: "当前网络、旧记忆和新类数据分别是什么？", short: "当前状态 + 新类" },
  { title: "哪些图像合成训练集 D？", short: "准备 D" },
  { title: "为什么先记录更新前响应？", short: "保存 Q" },
  { title: "D 中每张图像都获得旧类响应吗？", short: "覆盖所有样本" },
  { title: "更新 representation 前要准备好什么？", short: "ready to train" },
];

const timelineSteps = [
  "新类别到达",
  "构造训练集 D",
  "快照旧类响应 Q",
  "更新 representation",
  "计算新 quota",
  "缩减旧 P",
  "构造新 P",
] as const;

const OLD_EXEMPLARS: Sample[] = OLD_CLASS_IDS.flatMap((classId) => P_BEFORE[classId]);
const TRAINING_ITEMS: Sample[] = [...OLD_EXEMPLARS, ...INCOMING_SAMPLES];

function sampleStyle(sample: Sample) {
  return { "--sample-accent": CLASS_VISUALS[sample.classId].color } as React.CSSProperties;
}

function SampleChip({ sample, origin }: { sample: Sample; origin: "old" | "new" }) {
  return <span className={`p6-sample-chip p6-sample-chip--${origin}`} style={sampleStyle(sample)}>
    <b>{CLASS_VISUALS[sample.classId].glyph} {CLASS_VISUALS[sample.classId].displayLabel}</b><span>{sample.id}</span><small>{origin === "old" ? "old exemplar" : "new full data"}</small>
  </span>;
}

function MemoryBuckets() {
  return <div className="p6-memory-buckets">
    {OLD_CLASS_IDS.map((classId) => <section className="p6-memory-bucket" key={classId} style={{ "--bucket-accent": CLASS_VISUALS[classId].color } as React.CSSProperties}>
      <div><b>{CLASS_VISUALS[classId].displayLabel}</b><small>P<sub>{CLASS_VISUALS[classId].index}</sub> · {P_BEFORE[classId].length}</small></div>
      <div className="p6-memory-bucket__samples">{P_BEFORE[classId].map((sample) => <SampleChip key={sample.id} sample={sample} origin="old" />)}</div>
    </section>)}
  </div>;
}

function OutputNodes({ compact = false }: { compact?: boolean }) {
  return <div className={`p6-output-nodes${compact ? " p6-output-nodes--compact" : ""}`} aria-label="当前网络的旧类别输出节点">
    {OLD_CLASS_IDS.map((classId) => <span key={classId} style={{ "--node-accent": CLASS_VISUALS[classId].color } as React.CSSProperties}><i />{CLASS_VISUALS[classId].outputNodeLabel}</span>)}
    {compact ? null : <small>new class output nodes · Page 7</small>}
  </div>;
}

function UpdateTimeline({ stage }: { stage: number }) {
  const currentStep = stage === 0 ? 0 : stage === 1 ? 1 : 2;
  return <section className="p6-timeline" aria-label="一次增量更新时间线">
    <div className="p6-timeline__heading"><div><span className="eyebrow">ONE INCREMENTAL UPDATE</span><b>更新顺序</b></div><span>本页聚焦 ①–③</span></div>
    <ol>
      {timelineSteps.map((label, index) => <li key={label} className={`${index <= 2 ? "is-in-scope" : "is-later"}${index === currentStep && stage <= 2 ? " is-current" : index < currentStep || (stage > 2 && index <= currentStep) ? " is-done" : ""}`}>
        <span className="p6-timeline__number">{String(index + 1).padStart(2, "0")}</span><b>{label}</b>
        {index < timelineSteps.length - 1 ? <i aria-hidden="true">→</i> : null}
      </li>)}
    </ol>
    <p>下一步 ④ 才开始参数更新；⑤–⑦ 进入记忆 quota 与 exemplar 操作。</p>
  </section>;
}

function ResponseMatrix({ items = TRAINING_ITEMS }: { items?: readonly Sample[] }) {
  return <div className="p6-response-matrix" role="table" aria-label={`D 中全部 ${items.length} 个样本，对应 ${OLD_CLASS_IDS.length} 个旧类别 response targets`}>
    <div className="p6-response-row p6-response-row--head" role="row">
      <span role="columnheader">D 中样本</span>
      {OLD_CLASS_IDS.map((classId) => <span role="columnheader" key={classId} style={{ "--node-accent": CLASS_VISUALS[classId].color } as React.CSSProperties}>{CLASS_VISUALS[classId].outputNodeLabel}</span>)}
    </div>
    {items.map((sample) => {
      const origin = sample.classId === INCOMING_CLASS_ID ? "new" : "old";
      return <div className={`p6-response-row p6-response-row--${origin}`} role="row" key={sample.id}>
        <span className="p6-response-row__sample" role="rowheader" style={sampleStyle(sample)}><b>{CLASS_VISUALS[sample.classId].index}</b><span>{sample.id}</span><small>{origin === "old" ? "P" : "X"}</small></span>
        {OLD_CLASS_IDS.map((classId) => <span className="p6-q-cell" role="cell" key={classId} aria-label={`q_${sample.id}^${CLASS_VISUALS[classId].index} 已记录`} title={`q_${sample.id}^${CLASS_VISUALS[classId].index} · 更新前旧类 response`}><i aria-hidden="true">●</i><small className="p6-sr-only">qᵢ^{CLASS_VISUALS[classId].index} response 已记录并锁定</small></span>)}
      </div>;
    })}
  </div>;
}

function ObjectLifetime() {
  return <details className="p6-lifetime">
    <summary>Inspect object lifetime</summary>
    <div className="p6-lifetime__table" role="table" aria-label="一次增量更新中对象的生命周期">
      <div role="row"><b role="columnheader">对象</b><b role="columnheader">生命周期</b></div>
      <div role="row"><span role="cell">Θ</span><span role="cell">跨增量阶段持续存在，并在更新中改变</span></div>
      <div role="row"><span role="cell">P</span><span role="cell">跨阶段保留；memory 本身不因读取而消失</span></div>
      <div role="row"><span role="cell">X<sub>new</sub></span><span role="cell">本次新类别阶段提供的完整图像</span></div>
      <div role="row"><span role="cell">D</span><span role="cell">本次 representation update 使用的训练集</span></div>
      <div role="row"><span role="cell">Q</span><span role="cell">只在本次 update 内固定使用的 response snapshot</span></div>
    </div>
  </details>;
}

export function PageSix() {
  const [stage, setStage] = useState(0);

  return (
    <article className="tutorial-page icarl-page icarl-page--p6">
      <header className="page-heading icarl-page__heading">
        <div className="icarl-page__eyebrow"><span>PAGE 06</span><i /> BEFORE UPDATE</div>
        <h1>更新开始前，先准备样本与旧类响应</h1>
        <p>新类数据和旧 exemplars 先组成训练集 D。任何参数变化发生之前，当前网络对 D 中每个样本记录旧类别 response snapshot Q。</p>
      </header>

      <UpdateTimeline stage={stage} />
      <GuidedStepControls steps={steps} current={stage} onChange={setStage} label="Page 6 更新前状态教学步骤" />

      {stage === 0 ? <section className="p6-start-grid" aria-label="更新前已有状态与到达的新类别">
        <section className="panel p6-persistent-state">
          <div className="panel-heading"><div><span className="eyebrow">CURRENT PERSISTENT STATE</span><h2>网络 Θ 与旧记忆 P</h2></div><span className="p6-persistent-badge">跨阶段保留</span></div>
          <div className="p6-theta-card"><div><b>Θ</b><span>current network parameters</span></div><i aria-hidden="true">→</i><div className="p6-feature-head"><b>φ</b><span>feature extractor</span></div><i aria-hidden="true">+</i><div><b>g₁, g₂, g₃</b><span>old-class output nodes</span></div></div>
          <OutputNodes />
          <div className="p6-memory-heading"><b>P = (P<sub>1</sub>, P<sub>2</sub>, P<sub>3</sub>)</b><span>persistent exemplar memory · {OLD_MEMORY_SIZE} images</span></div>
          <MemoryBuckets />
          <p className="p6-persistent-note">这些旧 exemplars 会被读取并放入 D；P 仍留在持久 memory 中。</p>
        </section>
        <section className="panel p6-incoming-state">
          <div className="panel-heading"><div><span className="eyebrow">INCOMING STAGE DATA</span><h2>Class 4 的完整训练图像</h2></div><span className="p6-new-count">{INCOMING_SAMPLES.length} images</span></div>
          <p className="p6-panel-intro">新类到达时，当前阶段可以访问 X<sub>D</sub> 中的全部样本。</p>
          <div className="p6-incoming-list">{INCOMING_SAMPLES.map((sample) => <SampleChip key={sample.id} sample={sample} origin="new" />)}</div>
          <div className="p6-state-separation" aria-label="持久模型、持久记忆和新阶段数据共同组成当前更新状态">
            <div className="p6-state-item"><span>网络参数</span><b>Θ</b></div>
            <i aria-hidden="true">+</i>
            <div className="p6-state-item"><span>旧类记忆</span><b>P</b></div>
            <i aria-hidden="true">+</i>
            <div className="p6-state-item"><span>新类数据</span><strong>X<sub>D</sub></strong></div>
          </div>
        </section>
      </section> : null}

      {stage === 1 ? <section className="p6-build-set" aria-label="构造 training set D">
        <div className="p6-source-panels">
          <section className="panel p6-source-card p6-source-card--old"><div className="panel-heading"><div><span className="eyebrow">PERSISTENT MEMORY</span><h2>旧类 exemplars</h2></div><span>{OLD_EXEMPLARS.length}</span></div><p>P 中样本被读取进 D，来源 memory 仍然保留。</p><div className="p6-source-card__samples">{OLD_EXEMPLARS.map((sample) => <SampleChip key={sample.id} sample={sample} origin="old" />)}</div><b className="p6-source-stays">P remains stored</b></section>
          <span className="p6-set-plus" aria-hidden="true">+</span>
          <section className="panel p6-source-card p6-source-card--new"><div className="panel-heading"><div><span className="eyebrow">INCOMING FULL DATA</span><h2>新类 X<sub>D</sub></h2></div><span>{INCOMING_SAMPLES.length}</span></div><p>本阶段所有新类图像都进入训练集合。</p><div className="p6-source-card__samples">{INCOMING_SAMPLES.map((sample) => <SampleChip key={sample.id} sample={sample} origin="new" />)}</div><b className="p6-source-stays">all new images available</b></section>
          <span className="p6-set-arrow" aria-hidden="true">→</span>
        </div>
        <section className="panel p6-dataset-panel">
          <div className="panel-heading"><div><span className="eyebrow">TRAINING SET · D</span><h2>两类来源汇入同一训练集</h2></div><strong>|D| = {TRAINING_SET_SIZE}</strong></div>
          <div className="p6-dataset-equation"><span>∪ old exemplars from P</span><i aria-hidden="true">+</i><span>∪ full new-class data X<sub>D</sub></span><i aria-hidden="true">=</i><b>D</b></div>
          <div className="p6-dataset-groups"><section><b>OLD · {OLD_EXEMPLARS.length}</b><div>{OLD_EXEMPLARS.map((sample) => <SampleChip key={sample.id} sample={sample} origin="old" />)}</div></section><section><b>NEW · {INCOMING_SAMPLES.length}</b><div>{INCOMING_SAMPLES.map((sample) => <SampleChip key={sample.id} sample={sample} origin="new" />)}</div></section></div>
          <p className="p6-dataset-note">D 中训练样本统一送入本轮更新；旧 exemplar 在 D 中作为样本参与训练，P 则继续作为持久记忆保留。</p>
        </section>
      </section> : null}

      {stage === 2 ? <section className="p6-snapshot-grid" aria-label="更新前网络为 D 中样本记录 Q">
        <section className="panel p6-snapshot-input"><div className="panel-heading"><div><span className="eyebrow">READY TRAINING SET</span><h2>D 已准备好</h2></div><strong>{TRAINING_SET_SIZE} samples</strong></div>
          <div className="p6-count-breakdown"><span>old exemplars<strong>{OLD_EXEMPLARS.length}</strong></span><i>+</i><span>new full data<strong>{INCOMING_SAMPLES.length}</strong></span><i>=</i><b>D · {TRAINING_SET_SIZE}</b></div>
          <div className="p6-representative-rows"><div><span className="p6-origin-tag p6-origin-tag--old">OLD</span><b>old exemplar</b><small>每个旧记忆图像</small></div><div><span className="p6-origin-tag p6-origin-tag--new">NEW</span><b>new-class image</b><small>每个新类完整数据样本</small></div></div>
          <p>D 中的每个样本都要由当前网络记录 old-class responses。</p>
        </section>
        <section className="panel p6-snapshot-pipeline"><div className="panel-heading"><div><span className="eyebrow">BEFORE ANY PARAMETER UPDATE</span><h2>先快照旧节点响应</h2></div><span className="p6-snapshot-badge">pre-update</span></div>
          <div className="p6-snapshot-flow"><div className="p6-flow-node p6-flow-node--d"><b>D</b><span>all {TRAINING_SET_SIZE} samples</span></div><i aria-hidden="true">→</i><div className="p6-flow-network"><span className="eyebrow">CURRENT MODEL · Θ<sub>before</sub></span><b>φ + old output head</b><OutputNodes compact /><small>此刻还是本轮唯一的 current network</small></div><i aria-hidden="true">→</i><div className="p6-flow-node p6-flow-node--q"><b>Q</b><span>update-local response snapshot</span></div></div>
          <div className="p6-response-formula"><b>q<sub>i</sub><sup>y</sup> = g<sub>y</sub>(x<sub>i</sub>)</b><span>y ∈ {"{"}{OLD_CLASS_IDS.join(", ")}{"}"}</span></div>
          <p className="p6-snapshot-note">只有先记录 Q，后续改变 Θ 时才不会丢掉此次更新开始前的旧类 response。Q 完成后固定于本轮 update；它不是永久维护的第二个模型。</p>
        </section>
      </section> : null}

      {stage === 3 ? <section className="panel p6-matrix-panel" aria-label="D 中所有样本的旧类别响应矩阵">
        <div className="panel-heading"><div><span className="eyebrow">ALL TRAINING SAMPLES RECEIVE OLD-CLASS RESPONSES</span><h2>D 中每一行都快照所有旧输出节点</h2></div><span className="p6-matrix-count">{TRAINING_SET_SIZE} × {OLD_CLASS_IDS.length}</span></div>
        <p className="p6-matrix-intro">行是 D 中的实际样本；列是更新开始前已存在的旧类输出节点。每个 ● 表示对应的 q<sub>i</sub><sup>y</sup> 已记录，不显示虚构数值。</p>
        <div className="p6-matrix-legend"><span><i className="p6-origin-tag p6-origin-tag--old">P</i>旧 exemplar</span><span><i className="p6-origin-tag p6-origin-tag--new">X</i>新类完整数据</span><span><i className="p6-q-dot" />response snapshot present</span></div>
        <div className="p6-matrix-groups">
          <section><div className="p6-matrix-group-heading"><b>OLD EXEMPLARS FROM P</b><span>{OLD_EXEMPLARS.length} rows</span></div><ResponseMatrix items={OLD_EXEMPLARS} /></section>
          <section><div className="p6-matrix-group-heading"><b>NEW FULL DATA X<sub>D</sub></b><span>{INCOMING_SAMPLES.length} rows</span></div><ResponseMatrix items={INCOMING_SAMPLES} /></section>
        </div>
        <div className="p6-all-samples-takeaway"><b>all |D| = {TRAINING_SET_SIZE}</b><span>old exemplars and new-class images are treated alike for the pre-update old-node snapshot.</span></div>
        <div className="p6-q-locked"><span>Q</span><b>LOCKED DURING THIS UPDATE</b><small>Θ changes later; these pre-update responses do not.</small></div>
        <p className="p6-new-nodes-note">New-class output nodes are reserved for the next page; this matrix covers the existing old nodes only.</p>
      </section> : null}

      {stage === 4 ? <section className="p6-ready" aria-label="更新前准备完成">
        <div className="p6-ready-flow">
          <section className="p6-ready-card p6-ready-card--d"><span className="eyebrow">TRAINING SET</span><b>D</b><div><span>{OLD_EXEMPLARS.length} old exemplars</span><i>+</i><span>{INCOMING_SAMPLES.length} new images</span></div><strong>{TRAINING_SET_SIZE} samples total</strong></section>
          <i className="p6-ready-arrow" aria-hidden="true">→</i>
          <section className="p6-ready-card p6-ready-card--q"><span className="eyebrow">FROZEN TARGET INFORMATION</span><b>Q <small>LOCKED</small></b><div><span>{TRAINING_SET_SIZE} sample rows</span><i>×</i><span>{OLD_CLASS_IDS.length} old nodes</span></div><strong>update-local · fixed</strong></section>
          <i className="p6-ready-arrow" aria-hidden="true">→</i>
          <section className="p6-ready-card p6-ready-card--theta"><span className="eyebrow">CURRENT NETWORK</span><b>Θ</b><div><OutputNodes compact /></div><strong>ready for representation update</strong></section>
        </div>
        <div className="p6-ready-note"><b>P persists alongside Θ.</b><span>旧 exemplars 被读取进 D，但没有被消耗。Q 保存完成后，不需要把 pre-update 状态长期保留为第二套网络；同一个 current Θ 继续进入更新。</span></div>
        <ObjectLifetime />
      </section> : null}

      <section className="icarl-concept-note"><span className="icarl-concept-note__index">0{stage + 1}</span><div><span className="eyebrow">这一幕要看懂</span><p>{stage === 0 ? "开始更新时，Θ 和旧 exemplar memory P 已持久存在；新类完整图像 Xᴅ 刚刚到达。" : stage === 1 ? "D 由所有新类完整数据和旧类 exemplars 合成；旧记忆作为训练来源被读取，但 P 不会消失。" : stage === 2 ? "参数更新之前，pre-update current network 对整个 D 保存旧输出节点 response，形成本轮使用的 Q。" : stage === 3 ? "qᵢʸ 覆盖 D 中全部样本：旧 exemplar 和新类图像都经过同一个 pre-update model。" : "保留本轮 D、冻结的 Q 和可训练的 current Θ；完成准备后才进入训练目标构造。"}</p></div></section>

      <footer className="icarl-handoff">
        <div><span className="eyebrow">NEXT · PAGE 07</span><p>怎样把旧类 response 与新类 label 变成不同输出节点的训练目标？</p></div>
        <span className="icarl-handoff__upcoming">下一页</span>
      </footer>
    </article>
  );
}
