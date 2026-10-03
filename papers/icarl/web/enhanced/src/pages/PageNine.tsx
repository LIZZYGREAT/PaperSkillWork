import { useState } from "react";
import { PaperFigure } from "../shared/core/paper-figure";
import { ReferenceHub } from "../shared/core/reference";
import type { ReferenceItem } from "../shared/core/reference/types";
import { CLASSES_PER_BATCH, TABLE1A, TABLE1B, type AblationResult } from "../data/table1-results";

type EvidenceTab = "setup" | "overall" | "components" | "approximation" | "memory" | "boundaries";
type Benchmark = "cifar" | "small" | "full";
type Mechanism = "prototype" | "rehearsal" | "distillation";
type MethodKey = "icarL" | "hybrid1" | "hybrid2" | "hybrid3" | "lwfMC";

const tabs: { id: EvidenceTab; label: string }[] = [
  { id: "setup", label: "实验设置" }, { id: "overall", label: "整体表现" }, { id: "components", label: "组件对照" },
  { id: "approximation", label: "均值近似" }, { id: "memory", label: "记忆预算" }, { id: "boundaries", label: "适用边界" },
];
const methods: { id: MethodKey; label: string; color: string }[] = [
  { id: "icarL", label: "iCaRL", color: "#39748f" }, { id: "hybrid1", label: "Hybrid 1", color: "#967242" },
  { id: "hybrid2", label: "Hybrid 2", color: "#58845c" }, { id: "hybrid3", label: "Hybrid 3", color: "#a36b56" },
  { id: "lwfMC", label: "LwF.MC", color: "#68747a" },
];
const mechanismComparisons: Record<Mechanism, { title: string; comparisonKind: string; pair: string[]; explanation: string; question: string; nuance: string }> = {
  prototype: { title: "原型分类器", comparisonKind: "CLEANER CONTROLLED COMPARISON", pair: ["iCaRL", "Hybrid 1"], explanation: "两者都使用相同的表示学习与 exemplar；区别在最终分类器：iCaRL 使用 exemplar 均值，Hybrid 1 使用网络输出。", question: "按 exemplar 均值最近邻分类是否有帮助？", nuance: "iCaRL 与 Hybrid 1 在较小类别批次下差距尤其明显；这些设置经历了更多轮表示更新。" },
  rehearsal: { title: "Exemplar 回放", comparisonKind: "CONTRAST PAIR", pair: ["Hybrid 3", "LwF.MC"], explanation: "Hybrid 3 用 exemplars 参与表示学习、不使用蒸馏，最终用网络输出分类；LwF.MC 不使用 exemplars、使用蒸馏，最终同样用网络输出分类。因此两者同时改变了 exemplar 回放和 distillation，并非只改变回放的单变量对照。", question: "加入 exemplar 回放的配置呈现出什么差异？", nuance: "论文作者据此讨论 exemplar rehearsal 的重要性；但该对照不是纯单变量消融，不能把差异只归因于 exemplar。它是 iCIFAR-100 上的对照性证据，也不能推广为所有持续学习任务的普遍结论。" },
  distillation: { title: "知识蒸馏", comparisonKind: "CLEANER CONTROLLED COMPARISON", pair: ["iCaRL", "Hybrid 2"], explanation: "两者都使用原型分类与 exemplar；Hybrid 2 移除了 distillation loss。", question: "保持旧节点响应带来了什么？", nuance: "效果取决于每批类别数。每批 2 类时，Hybrid 2 为 57.6%，iCaRL 为 57.0%。" },
};
const focusLabels: Record<Benchmark, string> = { cifar: "iCIFAR-100", small: "iILSVRC-small", full: "iILSVRC-full" };
const focusDetails: Record<Benchmark, string> = {
  cifar: "iCIFAR-100 · 100 类 · 多类准确率 · 10 个类别顺序 · ResNet-32 · K ≤ 2,000",
  small: "iILSVRC-small · 100 个 ImageNet 类别，每批 10 类 · 验证集 Top-5 准确率 · ResNet-18 · K ≤ 20,000",
  full: "iILSVRC-full · 1,000 个 ImageNet 类别，每批 100 类 · 验证集 Top-5 准确率 · ResNet-18 · K ≤ 20,000",
};

function EvidenceTag({ kind }: { kind: "PAPER RESULT" | "PAPER INTERPRETATION" | "PAPER LIMITATION" | "TEACHING EXPLANATION" | "GENERAL BACKGROUND" }) {
  return <span className={`p9-tag p9-tag--${kind.toLowerCase().replace(/ /g, "-")}`}>[{kind}]</span>;
}

function PageEvidenceHeader() {
  return <header className="page-heading icarl-page__heading">
    <div className="icarl-page__eyebrow"><span>PAGE 09</span><i /> 论文证据与适用边界</div>
    <h1>这些机制由什么证据支持？结论止于哪里？</h1>
    <p>把基准实验、组件对照和记忆边界连回第 1–8 页介绍的机制，逐项区分论文结果、作者解释与教学推导。</p>
  </header>;
}

function EvidenceTabs({ value, onChange }: { value: EvidenceTab; onChange: (tab: EvidenceTab) => void }) {
  return <nav className="p9-tabs" role="tablist" aria-label="第 9 页证据工作台分区">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={value === tab.id} aria-current={value === tab.id ? "step" : undefined} className={value === tab.id ? "is-active" : ""} onClick={() => onChange(tab.id)}>{tab.label}</button>)}</nav>;
}

function BatchSelector({ value, onChange, label = "每批新类别数" }: { value: number; onChange: (value: (typeof CLASSES_PER_BATCH)[number]) => void; label?: string }) {
  return <div className="p9-batch-selector"><span>{label}</span><div role="group" aria-label={label}>{CLASSES_PER_BATCH.map((batch) => <button key={batch} type="button" className={value === batch ? "is-active" : ""} aria-pressed={value === batch} onClick={() => onChange(batch)}>{batch}</button>)}</div></div>;
}

function DatasetCard({ title, strap, classes, batches, metric, backbone, memory, background, sourceHref, sourceLabel }: { title: string; strap: string; classes: string; batches: string; metric: string; backbone: string; memory: string; background: string; sourceHref: string; sourceLabel: string }) {
  return <section className="p9-dataset-card"><div className="p9-dataset-card__top"><div><span className="eyebrow">{strap}</span><h2>{title}</h2></div><span className="p9-image-icon" aria-hidden="true">▧</span></div><div className="p9-dataset-card__background"><EvidenceTag kind="GENERAL BACKGROUND" /><p>{background}</p><a href={sourceHref} target="_blank" rel="noreferrer">{sourceLabel}</a></div><div className="p9-dataset-card__scale"><span>类别数</span><b>{classes}</b></div><div className="p9-dataset-card__batches"><span>每批类别数</span><b>{batches}</b></div><dl><div><dt>指标</dt><dd>{metric}</dd></div><div><dt>骨干网络</dt><dd>{backbone}</dd></div><div><dt>Exemplar 预算</dt><dd>{memory}</dd></div></dl></section>;
}

const datasetReferences: ReferenceItem[] = [
  { id: "cifar-100-dataset", title: "CIFAR-100 dataset", kind: "dataset", summary: "Official dataset description: 100 classes, fine and coarse labels, and its relationship to CIFAR-10.", content: <p><a href="https://www.cs.toronto.edu/~kriz/cifar.html" target="_blank" rel="noreferrer">CIFAR-10 and CIFAR-100 datasets · University of Toronto</a></p>, tags: ["dataset background", "official source"] },
  { id: "ilsvrc-2012-dataset", title: "ImageNet ILSVRC 2012", kind: "dataset", summary: "Official challenge description of its image-classification task and 1,000 object categories.", content: <p><a href="https://www.image-net.org/challenges/LSVRC/2012/" target="_blank" rel="noreferrer">ILSVRC 2012 · ImageNet</a></p>, tags: ["dataset background", "official source"] },
];

function SetupPanel({ batch, setBatch }: { batch: (typeof CLASSES_PER_BATCH)[number]; setBatch: (value: (typeof CLASSES_PER_BATCH)[number]) => void }) {
  const stages = 100 / batch;
  const shownTicks = Math.min(stages, 10);
  const firstSeen = batch;
  const finalSeen = 100;
  return <section className="p9-workbench" role="tabpanel" aria-label="数据集与评估设置">
    <div className="p9-workbench__evidence">
      <div className="panel-heading"><div><span className="eyebrow">数据集概览</span><h2>类别按批次到达，评估范围逐步扩大</h2></div></div>
      <div className="p9-dataset-grid">
        <DatasetCard title="iCIFAR-100" strap="小图像分类" classes="100 个视觉类别" batches="2 / 5 / 10 / 20 / 50" metric="多类准确率" backbone="ResNet-32" memory="K ≤ 2,000" background="CIFAR-100 是自然图像物体分类数据集，含 100 个细类，并组织为 20 个超类。" sourceHref="https://www.cs.toronto.edu/~kriz/cifar.html" sourceLabel="来源：University of Toronto" />
        <DatasetCard title="iILSVRC" strap="ImageNet ILSVRC 2012" classes="100 或 1,000 类" batches="10 或 100" metric="验证集 Top-5 准确率" backbone="ResNet-18" memory="K ≤ 20,000" background="ILSVRC 2012 是面向自然照片中物体识别的大规模 benchmark；官方设置包含 1,000 个对象类别。" sourceHref="https://www.image-net.org/challenges/LSVRC/2012/" sourceLabel="来源：ImageNet ILSVRC 2012" />
      </div>
      <div className="p9-protocol-foot"><span>iILSVRC-small</span><b>100 类 · 每批 10 类</b><i aria-hidden="true">↔</i><span>iILSVRC-full</span><b>1,000 类 · 每批 100 类</b></div>
    </div>
    <aside className="p9-workbench__interpretation">
      <span className="eyebrow">增量评估</span><h2>评估截至当前阶段的全部已见类别</h2>
      <BatchSelector value={batch} onChange={setBatch} />
      <div className="p9-stage-count"><b>{stages}</b><span>训练与评估阶段<br />每批 {batch} 个新类别</span></div>
      <div className="p9-stage-visual" aria-label={`${shownTicks} 个前置评估阶段的示意，总计 ${stages} 个阶段`}>
        {Array.from({ length: shownTicks }, (_, index) => <div key={index} className={index === shownTicks - 1 ? "is-last" : ""}><span>{String(index + 1).padStart(2, "0")}</span><i /></div>)}
        {stages > shownTicks ? <b>另有 {stages - shownTicks} 阶段</b> : null}
      </div>
      <p className="p9-stage-copy">每一步先训练新到达的 {batch} 个类别，再在已见类别 1–{Math.min(firstSeen * shownTicks, finalSeen)} 上评估；最后一步覆盖 1–100。</p>
      <div className="p9-average-note"><EvidenceTag kind="TEACHING EXPLANATION" /><span>Average incremental accuracy 是各增量阶段多类准确率的汇总；Figure 2 横轴表示截至该阶段已学习的类别总数。</span></div>
      <details className="p9-details"><summary>查看实验训练设置</summary><div><p><b>iCIFAR-100</b> · 10 种类别顺序；每批训练 70 epochs；batch size 128；K ≤ 2,000。</p><p><b>iILSVRC</b> · 每批训练 60 epochs；batch size 128；K ≤ 20,000。</p><small>更完整的学习率与 weight decay 配置见来源证据记录。</small></div></details>
    </aside>
  </section>;
}

function overallFocus(benchmark: Benchmark, batch: number): string {
  if (benchmark === "cifar") return `cifar-${batch}`;
  return benchmark === "small" ? "ilsvrc-small" : "ilsvrc-full";
}

function Figure2Evidence({ benchmark, batch }: { benchmark: Benchmark; batch: number }) {
  const focus = overallFocus(benchmark, batch);
  const annotations = [
    { id: "setting", x: 76, y: 4, label: "读横轴", text: "横轴表示截至当前阶段已学习的类别总数，不是当前批次的类别数。" },
  ];
  return <div className={`p9-figure-focus p9-figure-focus--${focus}`} data-focus={focus}>
    <PaperFigure src="/assets/figures/figure-2.png" mode="crop" figureLabel="Figure 2" alt="论文原始 Figure 2：比较 iCIFAR-100 与 iILSVRC 设置下的增量准确率。" caption="iCIFAR-100 与 iILSVRC 类别增量训练结果；曲线报告每个阶段对已见类别的准确率。iCIFAR-100 的全数据单批训练参照值为 68.6%。" source="Rebuffi et al., iCaRL, CVPR 2017, Fig. 2, pp. 7–8." annotations={annotations} />
  </div>;
}

function OverallPanel({ benchmark, setBenchmark, batch, setBatch }: { benchmark: Benchmark; setBenchmark: (value: Benchmark) => void; batch: (typeof CLASSES_PER_BATCH)[number]; setBatch: (value: (typeof CLASSES_PER_BATCH)[number]) => void }) {
  return <section className="p9-workbench p9-workbench--overall" role="tabpanel" aria-label="整体增量实验结果">
    <div className="p9-workbench__evidence">
      <div className="panel-heading"><div><span className="eyebrow">论文图表 · 增量准确率</span><h2>Figure 2 · 观察完整系统随已见类别增长的表现</h2></div><EvidenceTag kind="PAPER RESULT" /></div>
      <div className="p9-setting-controls" role="group" aria-label="选择 Figure 2 中的实验设置">{(["cifar", "small", "full"] as const).map((choice) => <button key={choice} type="button" className={benchmark === choice ? "is-active" : ""} aria-pressed={benchmark === choice} onClick={() => setBenchmark(choice)}>{focusLabels[choice]}</button>)}</div>
      {benchmark === "cifar" ? <BatchSelector value={batch} onChange={setBatch} /> : null}
      <Figure2Evidence benchmark={benchmark} batch={batch} />
      <details className="p9-figure3-details"><summary title="矩阵显示值经过 log(1+x) 变换；原始计数未在此重新计算。">查看预测偏置 · 原始 Figure 3</summary><div className="p9-figure3-layout"><PaperFigure src="/assets/figures/figure-3.png" mode="crop" figureLabel="Figure 3" alt="论文原始 Figure 3：iCaRL、LwF.MC、固定表示与微调的混淆矩阵。" caption="iCIFAR-100 上按每批 10 类训练后的混淆矩阵。为便于观察，矩阵数值经过 log(1+x) 变换。" source="Rebuffi et al., iCaRL, CVPR 2017, Fig. 3, p. 8." /><div className="p9-bias-notes"><div><b>iCaRL</b><span>对已见类别的预测分布相对均匀</span></div><div><b>LwF.MC</b><span>预测更集中于最近加入的类别</span></div><div><b>固定表示</b><span>偏向较早加入的类别</span></div><div><b>微调</b><span>强烈偏向最后一个批次</span></div><p>图中数值经过变换以增强可见度；这里解读的是整体模式，不逐格解释矩阵数值。</p></div></div></details>
    </div>
    <aside className="p9-workbench__interpretation p9-claim-panel">
      <span className="eyebrow">当前实验设置</span><h2>{focusLabels[benchmark]}{benchmark === "cifar" ? ` · 每批 ${batch} 类` : ""}</h2>
      <div className="p9-selected-protocol">{focusDetails[benchmark]}{benchmark === "cifar" ? ` · ${100 / batch} 个增量阶段` : ""}</div>
      <div className="p9-claim-block"><span>问题</span><b>类别不断加入时，几种增量方法的表现如何变化？</b></div>
      <div className="p9-claim-block"><span>观察</span><p>在论文报告的这些设置中，随着已见类别增加，iCaRL 曲线保持在所比较的其他增量方法之上。</p></div>
      <div className="p9-claim-block p9-claim-block--supported"><span>证据支持的结论</span><p>在这些图像分类数据集与实验协议下，完整 iCaRL 系统面对连续类别加入时表现较强。</p></div>
      <div className="p9-claim-block p9-claim-block--boundary"><span>证据边界</span><p>这些曲线支持关于所测数据集、指标与实现的判断，不能证明 iCaRL 在所有持续学习任务中都普遍占优。</p></div>
      <div className="p9-context-note"><EvidenceTag kind="PAPER INTERPRETATION" /><span>iILSVRC-full 是一个例外：固定表示与 LwF.MC 的通常排序在该图中有所不同。</span></div>
      <div className="p9-context-note"><EvidenceTag kind="PAPER RESULT" /><span>Figure 2 图注还报告了全数据单批训练网络的 68.6%；这是另一种批量训练参照。</span></div>
    </aside>
  </section>;
}

function ComponentMatrix() {
  const rows = [
    { name: "iCaRL", values: [1, 1, 1] }, { name: "Hybrid 1", values: [0, 1, 1] },
    { name: "Hybrid 2", values: [1, 1, 0] }, { name: "Hybrid 3", values: [0, 1, 0] }, { name: "LwF.MC", values: [0, 0, 1] },
  ];
  return <div className="p9-component-matrix" role="table" aria-label="iCaRL 与 Hybrid 消融方法的组件配置">
    <div role="row"><b role="columnheader">方法</b><b role="columnheader">原型分类</b><b role="columnheader">样本回放</b><b role="columnheader">知识蒸馏</b></div>
    {rows.map((row) => <div role="row" key={row.name}><b role="rowheader">{row.name}</b>{row.values.map((enabled, index) => <span role="cell" className={enabled ? "is-enabled" : "is-disabled"} aria-label={`${["原型分类器", "exemplar 回放", "知识蒸馏"][index]}：${enabled ? "启用" : "未启用"}`} key={index}>{enabled ? "●" : "○"}</span>)}</div>)}
  </div>;
}

function DotPlot({ data, batch, highlighted, onInspect }: { data: AblationResult; batch: number; highlighted: string[]; onInspect: (method: string, value: number) => void }) {
  return <div className="p9-dotplot" role="group" aria-label={`Table 1a 点图：每批 ${batch} 个新类别`}>
    <div className="p9-dotplot__axis"><span>0%</span><span>20%</span><span>40%</span><span>60%</span><span>70%</span></div>
    {methods.map((method) => {
      const value = data[method.id];
      const emphasized = highlighted.includes(method.label);
      return <button key={method.id} type="button" className={`p9-dotplot__row${emphasized ? " is-emphasized" : ""}`} aria-label={`${method.label}：每批 ${batch} 类时准确率 ${value.toFixed(1)}%。点击查看该结果。`} title={`${method.label} · ${value.toFixed(1)}%`} onClick={() => onInspect(method.label, value)}>
        <span className="p9-dotplot__label">{method.label}</span><span className="p9-dotplot__track"><i style={{ left: `${(value / 70) * 100}%`, backgroundColor: method.color }} /></span>
      </button>;
    })}
  </div>;
}

function Table1aDetails() {
  return <details className="p9-details p9-table-details"><summary>查看 Table 1a 精确数值</summary><div className="p9-table-wrap"><table><caption>平均增量多类准确率（%）· iCIFAR-100</caption><thead><tr><th>每批新类别数</th>{methods.map((method) => <th key={method.id}>{method.label}</th>)}</tr></thead><tbody>{TABLE1A.map((row) => <tr key={row.batchSize}><th>{row.batchSize}</th>{methods.map((method) => <td key={method.id}>{row[method.id].toFixed(1)}</td>)}</tr>)}</tbody></table></div></details>;
}

function ComponentPanel({ batch, setBatch }: { batch: (typeof CLASSES_PER_BATCH)[number]; setBatch: (value: (typeof CLASSES_PER_BATCH)[number]) => void }) {
  const [mechanism, setMechanism] = useState<Mechanism>("prototype");
  const [inspected, setInspected] = useState<{ method: string; value: number } | null>(null);
  const data = TABLE1A.find((row) => row.batchSize === batch)!;
  const comparison = mechanismComparisons[mechanism];
  return <section className="p9-workbench p9-workbench--components" role="tabpanel" aria-label="组件对照分析">
      <div className="p9-workbench__evidence">
      <div className="panel-heading"><div><span className="eyebrow">Component Differential Analysis · 组件差异分析</span><h2>先选择机制，再查看对应实验</h2></div><EvidenceTag kind="PAPER RESULT" /></div>
      <div className="p9-mechanism-select" role="group" aria-label="选择要检查的 iCaRL 机制">{(["prototype", "rehearsal", "distillation"] as const).map((item) => <button key={item} type="button" className={mechanism === item ? "is-active" : ""} aria-pressed={mechanism === item} onClick={() => { setMechanism(item); setInspected(null); }}>{mechanismComparisons[item].title}</button>)}</div>
      <ComponentMatrix />
      <div className="p9-ablation-meta"><span><i className="is-enabled">●</i> 启用</span><span><i className="is-disabled">○</i> 未启用</span><span>Hybrid 行表示消融配置</span></div>
      <BatchSelector value={batch} onChange={(next) => { setBatch(next); setInspected(null); }} />
      <div className="p9-plot-heading"><b>{comparison.question}</b><span>Table 1a · 各增量阶段的平均准确率</span></div>
      <DotPlot data={data} batch={batch} highlighted={comparison.pair} onInspect={(method, value) => setInspected({ method, value })} />
      {inspected ? <div className="p9-inspected-value" aria-live="polite"><b>{inspected.method}</b><span>{inspected.value.toFixed(1)}% · 每批 {batch} 类 · PAPER RESULT</span></div> : <p className="p9-plot-hint">点击图中的方法名称，查看对应精确数值。</p>}
      <Table1aDetails />
    </div>
    <aside className="p9-workbench__interpretation p9-claim-panel">
      <span className="eyebrow">{comparison.comparisonKind} · {comparison.title} · {comparison.pair.join(" vs ")}</span><h2>{comparison.question}</h2>
      <div className="p9-claim-block"><span>对照问题</span><p>{comparison.explanation}</p></div>
      <div className="p9-claim-block p9-claim-block--supported"><span>{mechanism === "rehearsal" ? "对照性证据" : "单因素对照"}</span><p>在所选 iCIFAR-100 每批类别设置下，对照 {comparison.pair.join(" vs ")}。</p></div>
      <div className="p9-claim-block p9-claim-block--boundary"><span>补充说明</span><p>{comparison.nuance}</p></div>
      <div className="p9-claim-block"><span>适用边界</span><p>这些平均值来自论文对 iCIFAR-100 的组件分析，不能说明每个组件在所有设置下都严格提升性能。</p></div>
      {mechanism === "distillation" ? <div className="p9-exception"><b>每种设置下各组件都有帮助吗？</b><strong>并非如此</strong><span>每批 2 类 · iCaRL 57.0% · Hybrid 2 57.6%</span><p>Table 1a 支持蒸馏总体上有贡献，但效果受实验条件影响；作者指出，类别批次最小时蒸馏也可能降低准确率。</p></div> : null}
      <EvidenceTag kind="PAPER INTERPRETATION" />
    </aside>
  </section>;
}

function GapPlot({ batch, values }: { batch: number; values: { icarL: number; ncm: number } }) {
  const gap = values.ncm - values.icarL;
  return <div className="p9-gap-plot" role="img" aria-label={`每批 ${batch} 类时，iCaRL 准确率为 ${values.icarL.toFixed(1)}%，NCM 为 ${values.ncm.toFixed(1)}%；相差 ${gap.toFixed(1)} 个百分点。`}>
    <div className="p9-gap-axis"><span>0</span><span>20</span><span>40</span><span>60</span><span>70</span></div>
    <div className="p9-gap-track"><span className="p9-gap-line" style={{ left: `${(values.icarL / 70) * 100}%`, width: `${(gap / 70) * 100}%` }} /><i className="p9-gap-dot p9-gap-dot--icarL" style={{ left: `${(values.icarL / 70) * 100}%` }} /><i className="p9-gap-dot p9-gap-dot--ncm" style={{ left: `${(values.ncm / 70) * 100}%` }} /></div>
    <div className="p9-gap-legend"><span><i className="p9-gap-dot--icarL" /> iCaRL · exemplar 均值</span><span><i className="p9-gap-dot--ncm" /> NCM · 全数据均值</span></div>
    <div className="p9-gap-summary"><b>相差 {gap.toFixed(1)} 个百分点</b><span>当前 iCIFAR-100 每批类别数：{batch}</span></div>
  </div>;
}

function Table1bDetails() {
  return <details className="p9-details p9-table-details"><summary>查看 Table 1b 精确数值</summary><div className="p9-table-wrap"><table><caption>平均增量多类准确率（%）· 全数据 NCM 诊断参照</caption><thead><tr><th>每批新类别数</th><th>iCaRL</th><th>NCM</th><th>差值 · 百分点</th></tr></thead><tbody>{TABLE1B.map((row) => <tr key={row.batchSize}><th>{row.batchSize}</th><td>{row.icarL.toFixed(1)}</td><td>{row.ncm.toFixed(1)}</td><td>{(row.ncm - row.icarL).toFixed(1)}</td></tr>)}</tbody></table></div></details>;
}

function ApproximationPanel({ batch, setBatch }: { batch: (typeof CLASSES_PER_BATCH)[number]; setBatch: (value: (typeof CLASSES_PER_BATCH)[number]) => void }) {
  const data = TABLE1B.find((row) => row.batchSize === batch)!;
  return <section className="p9-workbench p9-workbench--approximation" role="tabpanel" aria-label="Exemplar 均值与全类别均值比较">
    <div className="p9-workbench__evidence">
      <div className="panel-heading"><div><span className="eyebrow">TABLE 1b · 原型近似</span><h2>少量 exemplar 的均值接近全数据类别均值吗？</h2></div><EvidenceTag kind="PAPER RESULT" /></div>
      <div className="p9-mean-compare">
        <section><span className="p9-mean-label">iCaRL · 受限图像记忆</span><div className="p9-mean-flow"><b>仅当前 P<sub>y</sub></b><i>↓</i><b>当前 φ<sub>Θ</sub></b><i>↓</i><strong>exemplar 均值</strong></div></section>
        <section className="p9-mean-compare__ncm"><span className="p9-mean-label">NCM · 全数据诊断参照</span><div className="p9-mean-flow"><b>全部历史 X<sub>y</sub></b><i>↓</i><b>当前 φ<sub>Θ</sub></b><i>↓</i><strong>全类别均值</strong></div></section>
      </div>
      <div className="p9-feature-recall"><span className="eyebrow">特征空间回顾 · 教学解释</span><div className="p9-feature-recall__picture"><div><span>全部历史类别图像</span><i>• • • • • • •</i><b>★ 全数据均值</b></div><i className="p9-recall-arrow">↔</i><div><span>Exemplar 子集</span><i>■　■　■</i><b>◆ exemplar 均值</b></div></div><p>这项实验衡量：使用 exemplar 均值时，分类准确率会下降多少。</p></div>
      <BatchSelector value={batch} onChange={setBatch} />
      <GapPlot batch={batch} values={data} />
      <Table1bDetails />
      <div className="p9-important-context"><EvidenceTag kind="TEACHING EXPLANATION" /><b>关键背景</b><p>这个 NCM 参照使用全部历史训练数据重新计算类别均值，用来诊断近似质量；它不是记忆预算受限的增量方法。</p></div>
    </div>
    <aside className="p9-workbench__interpretation p9-claim-panel">
      <span className="eyebrow">差值衡量什么？</span><h2>exemplar 均值 ↔ 全类别均值</h2>
      <div className="p9-claim-block"><span>问题</span><p>如果用保留的 exemplar 子集替代所有历史图像，分类准确率会损失多少？</p></div>
      <div className="p9-claim-block p9-claim-block--supported"><span>结果</span><p>每批 {batch} 类时，论文报告的差距为 { (data.ncm - data.icarL).toFixed(1) } 个百分点。</p></div>
      <div className="p9-claim-block"><span>解释</span><p>在测试的 iCIFAR-100 设置中，较小的差距支持 exemplar 均值作为一种近似。</p></div>
      <div className="p9-claim-block p9-claim-block--boundary"><span>边界</span><p>NCM 可以访问全部历史训练数据，因此它的准确率没有受到与 iCaRL 相同的记忆预算约束。</p></div>
      <EvidenceTag kind="PAPER INTERPRETATION" />
    </aside>
  </section>;
}

type MemoryFocus = "budget" | "prototype" | "head";
const memoryInterpretations: Record<MemoryFocus, { label: string; heading: string; copy: string }> = {
  budget: { label: "增大 K", heading: "K 增大意味着保留更多原始 exemplar", copy: "更多旧类图像可以用于 rehearsal，也能提供更大的 exemplar 集合来近似全类别均值。" },
  prototype: { label: "iCaRL 与 NCM", heading: "更多 exemplar 可缩小均值近似差距", copy: "在这项实验中，K ≥ 1,000 时，iCaRL 的 exemplar 均值分类器与 NCM 表现接近。NCM 仍能访问全部历史训练图像。" },
  head: { label: "网络输出分类器", heading: "仅使用网络输出的表现较弱", copy: "Figure 4 中的 Hybrid 1 使用与 iCaRL 相同的表示，但改用网络输出分类器。原图支持定性趋势；页面不重建精确曲线数值。" },
};

function MemoryPanel() {
  const [focus, setFocus] = useState<MemoryFocus>("budget");
  const selected = memoryInterpretations[focus];
  return <section className="p9-workbench p9-workbench--memory" role="tabpanel" aria-label="记忆预算实验结果">
    <div className="p9-workbench__evidence">
      <div className="panel-heading"><div><span className="eyebrow">论文图表 · 记忆预算 K</span><h2>Figure 4 · 阅读原图呈现的定性趋势</h2></div><EvidenceTag kind="PAPER RESULT" /></div>
      <div className="p9-k-direction"><b>记忆预算 K</b><span>较少</span><i aria-hidden="true" /><span>较多</span></div>
      <div className="p9-memory-focus" role="group" aria-label="选择 Figure 4 的证据观察角度">{(Object.keys(memoryInterpretations) as MemoryFocus[]).map((key) => <button key={key} type="button" className={focus === key ? "is-active" : ""} aria-pressed={focus === key} onClick={() => setFocus(key)}>{memoryInterpretations[key].label}</button>)}</div>
      <div className={`p9-figure-focus p9-figure-focus--memory-${focus}`}><PaperFigure src="/assets/figures/figure-4.png" mode="crop" figureLabel="Figure 4" alt="论文原始 Figure 4：每批 10 类的 iCIFAR-100 实验中，不同记忆预算 K 对平均增量准确率的影响。" caption="iCIFAR-100、每批 10 类设置下，不同记忆预算 K 对平均增量准确率的影响。" source="Rebuffi et al., iCaRL, CVPR 2017, Fig. 4, p. 9." /></div>
      <div className="p9-memory-chain"><span>K ↑</span><i>→</i><span>保留更多 exemplars</span><i>→</i><span>增加 replay 样本，并增强原型近似能力</span></div>
      <p className="p9-no-digitize"><EvidenceTag kind="TEACHING EXPLANATION" /><span>这里展示的是 Figure 4 原图；没有从曲线提取或伪造精确数值。</span></p>
    </div>
    <aside className="p9-workbench__interpretation p9-claim-panel">
      <span className="eyebrow">当前观察角度</span><h2>{selected.heading}</h2>
      <div className="p9-claim-block"><span>观察</span><p>{selected.copy}</p></div>
      <div className="p9-claim-block p9-claim-block--supported"><span>证据支持的结论</span><p>记忆预算会影响论文在 iCIFAR-100、每批 10 类设置中比较的几种方法。</p></div>
      <div className="p9-claim-block p9-claim-block--boundary"><span>边界</span><p>该图提供趋势和论文讨论，没有给出完整的曲线数值表。</p></div>
      <EvidenceTag kind="PAPER INTERPRETATION" />
    </aside>
  </section>;
}

function BoundaryCard({ id, mechanism, benefit, cost, note }: { id: string; mechanism: string; benefit: string; cost: string; note: string }) {
  return <article className="p9-boundary-card"><div className="p9-boundary-card__step">{id}</div><div><span>机制</span><b>{mechanism}</b></div><i aria-hidden="true">↔</i><div><span>收益</span><b>{benefit}</b></div><i aria-hidden="true">↔</i><div className="p9-boundary-card__cost"><span>代价 / 边界</span><b>{cost}</b><small>{note}</small></div></article>;
}

function BoundariesPanel({ onContinue }: { onContinue?: () => void }) {
  return <section className="p9-boundaries" role="tabpanel" aria-label="机制收益与资源边界">
    <div className="panel-heading"><div><span className="eyebrow">机制 ↔ 收益 ↔ 代价 / 边界</span><h2>保留方法有效的前提，也看清资源边界</h2></div><EvidenceTag kind="PAPER LIMITATION" /></div>
    <div className="p9-boundary-stack">
      <BoundaryCard id="A" mechanism="限制历史数据访问的增量训练" benefit="加入新类别时，无需保留全部旧训练图像。" cost="论文分析中，增量训练与全数据单批训练参照之间仍存在差距。" note="这不表示所有增量设置的差距相同，也不表示 Table 1a 的每一行都低于 68.6%。" />
      <BoundaryCard id="B" mechanism="在 P 中保留原始 exemplar 图像" benefit="用当前 φΘ 重新编码、回放旧输入，并构建当前类别原型。" cost="仍需保留历史原始样本。" note="隐私要求或原始数据留存限制可能使这种设计不适用。" />
      <BoundaryCard id="C" mechanism="用 K 限制 exemplar 图像数量" benefit="图像预算不会随已见类别数量增长。" cost="模型总记忆并非严格恒定。" note="特征提取器大小固定，但每个类别的输出权重会随已见类别增加。" />
    </div>
    <div className="p9-boundary-tags"><EvidenceTag kind="PAPER INTERPRETATION" /><span>作者将与批量训练的差距，以及涉及隐私的原始图像存储，列为后续研究方向。</span><EvidenceTag kind="PAPER RESULT" /><span>每类输出权重增加时，资源占用也会增长。</span></div>
    <div className="p9-qualified-summary"><span>有限定的总结</span><b>机制 → 受控证据 → 支持的结论 → 明确边界</b><p>iCaRL 在论文报告的协议内有较强证据，但这不能证明它普遍占优、NCM 满足相同记忆预算，或类别无限增加时总记忆仍保持不变。</p></div>
    <section className="p9-end-card"><div><span className="eyebrow">证据回到完整流程</span><h2>把这些对象放回一次完整运行</h2><p>第 10 页追踪 Θ、P、训练对象与最终 prototype prediction 的运行时生命周期。</p></div><button type="button" className="icarl-button icarl-button--primary" onClick={onContinue} disabled={!onContinue}>进入第 10 页 · 完整 iCaRL 循环 <span aria-hidden="true">→</span></button></section>
  </section>;
}

export function PageNine({ onContinue }: { onContinue?: () => void }) {
  const [tab, setTab] = useState<EvidenceTab>("setup");
  const [batch, setBatch] = useState<(typeof CLASSES_PER_BATCH)[number]>(10);
  const [benchmark, setBenchmark] = useState<Benchmark>("cifar");
  const currentIndex = tabs.findIndex((item) => item.id === tab);

  function navigateTab(offset: number) {
    const next = Math.max(0, Math.min(tabs.length - 1, currentIndex + offset));
    setTab(tabs[next].id);
  }

  return <article className="tutorial-page icarl-page icarl-page--p9">
    <PageEvidenceHeader />
    <EvidenceTabs value={tab} onChange={setTab} />
    {tab === "setup" ? <SetupPanel batch={batch} setBatch={setBatch} /> : null}
    {tab === "overall" ? <OverallPanel benchmark={benchmark} setBenchmark={setBenchmark} batch={batch} setBatch={setBatch} /> : null}
    {tab === "components" ? <ComponentPanel batch={batch} setBatch={setBatch} /> : null}
    {tab === "approximation" ? <ApproximationPanel batch={batch} setBatch={setBatch} /> : null}
    {tab === "memory" ? <MemoryPanel /> : null}
    {tab === "boundaries" ? <BoundariesPanel onContinue={onContinue} /> : null}
    {tab !== "boundaries" ? <div className="p9-step-controls"><span>{String(currentIndex + 1).padStart(2, "0")} / {String(tabs.length).padStart(2, "0")} · 论文证据工作台</span><div><button type="button" className="icarl-button icarl-button--quiet" disabled={currentIndex === 0} onClick={() => navigateTab(-1)}>上一部分</button><button type="button" className="icarl-button icarl-button--primary" disabled={currentIndex === tabs.length - 1} onClick={() => navigateTab(1)}>下一部分 <span aria-hidden="true">→</span></button></div></div> : null}
    <details className="p9-reference-hub"><summary>Reference Hub · 数据集背景与来源</summary><ReferenceHub items={datasetReferences} /></details>
  </article>;
}
