import { useMemo, useState } from "react";
import { Button } from "../../foundation/controls/Button";
import { SegmentedControl } from "../../foundation/controls/SegmentedControl";
import { PullQuote } from "../../foundation/data/PullQuote";
import { InlineCallout } from "../../foundation/feedback/InlineCallout";
import { DiagramFlow } from "../../foundation/layout/DiagramFlow";
import type { DiagramSpec } from "../../foundation/layout/DiagramFlow";
import { StickySystemView, useStickyStepSync } from "../../foundation/layout/StickySystemView";
import { FormulaBlock } from "../../optional/formula/FormulaBlock";
import { FigureFrame } from "../../compositions/figure-frame/FigureFrame";
import { SectionHeader } from "../../compositions/section-header/SectionHeader";
import { StepNav } from "../../compositions/step-nav/StepNav";
import { GalleryCodePanel as CodePanel } from "./GalleryCodePanel";
import { MiniNetworkGallerySection } from "./MiniNetworkGallerySection";
import { TimelineGallerySection } from "./TimelineGallerySection";
import "./pattern-gallery.css";

type DiagramCase = "branch" | "merge";
type PathMode = "straight" | "smooth" | "orthogonal";
type DiagramFocus = "all" | "reference" | "learning";
type EditorialLayout = "axis" | "stagger" | "asymmetric" | "overview";

export const patternGallerySections = [
  { id: "gallery-diagrams", title: "Diagram & connectors" },
  { id: "gallery-editorial", title: "Editorial layouts" },
  { id: "gallery-scroll", title: "Scroll & motion" },
  { id: "gallery-typography", title: "Typography & formula" },
  { id: "gallery-mini-network", title: "Mini Network" },
  { id: "gallery-timeline", title: "Timeline" },
];

const branchBase: DiagramSpec = {
  columns: 5,
  zones: [
    { id: "branch-input", label: "输入与任务", from: 1, span: 1 },
    { id: "branch-model", label: "参考 / 学习对象", from: 2, span: 1 },
    { id: "branch-output", label: "可读输出", from: 3, span: 1 },
    { id: "branch-objective", label: "比较与更新", from: 4, span: 2 },
  ],
  nodes: [
    { id: "sample", column: 1, row: 2, order: 1, title: "输入样本 xₜ", badge: "DATA", role: "input", inputLabel: "输入样本" },
    { id: "task", column: 1, row: 5, order: 2, title: "当前任务 t", badge: "CONTROL", role: "label", inputLabel: "任务标记" },
    { id: "teacher", column: 2, row: 1, order: 3, title: "Teacher copy", meta: "本任务冻结", badge: "REFERENCE", role: "frozen", inputLabel: "冻结参考模型" },
    { id: "student", column: 2, row: 4, order: 4, title: "Student model", meta: "本任务更新", badge: "LEARNING", role: "trainable", inputLabel: "可训练模型" },
    { id: "target", column: 3, row: 1, order: 5, title: "旧类响应目标", badge: "TARGET", role: "target", inputLabel: "旧类目标" },
    { id: "prediction", column: 3, row: 4, order: 6, title: "当前预测", badge: "OUTPUT", role: "output", inputLabel: "student 预测" },
    { id: "label", column: 3, row: 7, order: 7, title: "当前真实标签 y", badge: "LABEL", role: "label", inputLabel: "真实标签" },
    { id: "old-loss", column: 4, row: 1, order: 8, title: "响应比较", badge: "OBJECTIVE", role: "objective", inputLabel: "响应比较" },
    { id: "new-loss", column: 4, row: 5, order: 9, title: "标签比较", badge: "OBJECTIVE", role: "objective", inputLabel: "标签比较" },
    { id: "combined", column: 5, row: 3, order: 10, title: "组合目标", meta: "组合规则依论文确定", badge: "OBJECTIVE", role: "objective", inputLabel: "组合目标" },
    { id: "update", column: 5, row: 6, order: 11, title: "student 参数", meta: "唯一更新对象", badge: "UPDATE", role: "update", inputLabel: "student 参数" },
  ],
  edges: [
    { id: "input-teacher", from: "sample", to: "teacher", kind: "data", startPort: "right", endPort: "left", mode: "smooth" },
    { id: "input-student", from: "sample", to: "student", kind: "data", startPort: "right", endPort: "left", mode: "smooth" },
    { id: "teacher-target", from: "teacher", to: "target", kind: "data", mode: "straight" },
    { id: "student-prediction", from: "student", to: "prediction", kind: "data", mode: "straight" },
    { id: "task-control", from: "task", to: "student", kind: "control", mode: "orthogonal" },
    { id: "target-old-loss", from: "target", to: "old-loss", kind: "data", mode: "smooth" },
    { id: "prediction-old-loss", from: "prediction", to: "old-loss", kind: "data", mode: "smooth" },
    { id: "prediction-new-loss", from: "prediction", to: "new-loss", kind: "data", mode: "smooth" },
    { id: "label-new-loss", from: "label", to: "new-loss", kind: "data", mode: "straight" },
    { id: "old-loss-combined", from: "old-loss", to: "combined", kind: "data", mode: "smooth" },
    { id: "new-loss-combined", from: "new-loss", to: "combined", kind: "data", mode: "smooth" },
    { id: "combined-update", from: "combined", to: "update", kind: "gradient", mode: "smooth" },
  ],
  legend: [
    { id: "reference", text: "冻结参考对象", swatch: "frozen" },
    { id: "learning", text: "可训练对象", swatch: "trainable" },
    { id: "target", text: "单一更新目标", swatch: "update" },
  ],
  note: "实线表示输入数据或目标项贡献，点线表示任务控制，虚线仅表示组合目标传向参数更新的梯度。此图为通用结构示意。",
};

const mergeBase: DiagramSpec = {
  columns: 5,
  zones: [
    { id: "merge-operands", label: "两个独立计算", from: 1, span: 2 },
    { id: "merge-results", label: "各自得到结果", from: 3, span: 1 },
    { id: "merge-combine", label: "合并与更新", from: 4, span: 2 },
  ],
  nodes: [
    { id: "prior", column: 1, row: 1, order: 1, title: "旧参数 θᴬ", badge: "FROZEN", role: "frozen", inputLabel: "旧参数" },
    { id: "current", column: 1, row: 3, order: 2, title: "当前参数 θ", badge: "TRAINABLE", role: "trainable", inputLabel: "当前参数" },
    { id: "importance", column: 2, row: 2, order: 3, title: "重要性权重 Ω", badge: "WEIGHT", role: "target", inputLabel: "重要性权重" },
    { id: "stability", column: 3, row: 2, order: 4, title: "保持项", meta: "当前参数与旧参数比较", badge: "OBJECTIVE A", role: "objective", inputLabel: "保持项" },
    { id: "prediction", column: 1, row: 5, order: 5, title: "当前预测 f(x)", badge: "OUTPUT", role: "output", inputLabel: "当前预测" },
    { id: "label", column: 2, row: 5, order: 6, title: "当前标签 y", badge: "LABEL", role: "label", inputLabel: "当前标签" },
    { id: "task-loss", column: 3, row: 5, order: 7, title: "任务损失", badge: "OBJECTIVE B", role: "objective", inputLabel: "任务损失" },
    { id: "combined", column: 4, row: 3, order: 8, title: "组合目标", meta: "合并规则按具体论文填写", badge: "MERGE", role: "objective", inputLabel: "组合目标" },
    { id: "parameters", column: 5, row: 3, order: 9, title: "当前参数 θ", meta: "明确的更新目标", badge: "UPDATE", role: "update", inputLabel: "当前参数更新" },
  ],
  edges: [
    { id: "prior-stability", from: "prior", to: "stability", kind: "data", mode: "smooth" },
    { id: "current-stability", from: "current", to: "stability", kind: "data", mode: "smooth" },
    { id: "importance-stability", from: "importance", to: "stability", kind: "data", mode: "straight" },
    { id: "prediction-task", from: "prediction", to: "task-loss", kind: "data", mode: "smooth" },
    { id: "label-task", from: "label", to: "task-loss", kind: "data", mode: "straight" },
    { id: "stability-combined", from: "stability", to: "combined", kind: "data", mode: "smooth" },
    { id: "task-combined", from: "task-loss", to: "combined", kind: "data", mode: "smooth" },
    { id: "combined-update", from: "combined", to: "parameters", kind: "gradient", mode: "smooth" },
  ],
  legend: [
    { id: "frozen", text: "旧参考量保持固定", swatch: "frozen" },
    { id: "current", text: "当前参数接收更新", swatch: "trainable" },
    { id: "update", text: "更新对象显式标记", swatch: "update" },
  ],
  note: "实线表示计算输入或目标项贡献；虚线只表示组合目标传向参数更新的梯度。权重与组合规则按目标论文填写，不补造公式。",
};

const diagramModes: { value: PathMode; label: string }[] = [
  { value: "straight", label: "Straight" },
  { value: "smooth", label: "Smooth" },
  { value: "orthogonal", label: "Orthogonal" },
];

const branchCode = [
  'import { DiagramFlow } from "./shared/foundation/layout/DiagramFlow";',
  'import type { DiagramSpec } from "./shared/foundation/layout/DiagramFlow";',
  '',
  'const branchSpec: DiagramSpec = {',
  '  columns: 5,',
  '  nodes: [',
  '    { id: "sample", title: "输入样本 xₜ", role: "input", column: 1, row: 2 },',
  '    { id: "task", title: "当前任务 t", role: "label", column: 1, row: 5 },',
  '    { id: "teacher", title: "冻结参考模型", role: "frozen", column: 2, row: 1 },',
  '    { id: "student", title: "可训练模型", role: "trainable", column: 2, row: 4 },',
  '    { id: "target", title: "旧类响应目标", role: "target", column: 3, row: 1 },',
  '    { id: "prediction", title: "当前预测", role: "output", column: 3, row: 4 },',
  '    { id: "label", title: "当前真实标签 y", role: "label", column: 3, row: 7 },',
  '    { id: "old-loss", title: "响应比较", role: "objective", column: 4, row: 1 },',
  '    { id: "new-loss", title: "标签比较", role: "objective", column: 4, row: 5 },',
  '    { id: "combined", title: "组合目标", role: "objective", column: 5, row: 3 },',
  '    { id: "update", title: "student 参数", role: "update", column: 5, row: 6 },',
  '  ],',
  '  edges: [',
  '    { id: "input-teacher", from: "sample", to: "teacher", kind: "data", mode: "smooth" },',
  '    { id: "input-student", from: "sample", to: "student", kind: "data", mode: "smooth" },',
  '    { id: "teacher-target", from: "teacher", to: "target", kind: "data", mode: "straight" },',
  '    { id: "student-prediction", from: "student", to: "prediction", kind: "data", mode: "straight" },',
  '    { id: "task-control", from: "task", to: "student", kind: "control", mode: "orthogonal" },',
  '    { id: "target-old-loss", from: "target", to: "old-loss", kind: "data", mode: "smooth" },',
  '    { id: "prediction-old-loss", from: "prediction", to: "old-loss", kind: "data", mode: "smooth" },',
  '    { id: "prediction-new-loss", from: "prediction", to: "new-loss", kind: "data", mode: "smooth" },',
  '    { id: "label-new-loss", from: "label", to: "new-loss", kind: "data", mode: "straight" },',
  '    { id: "old-loss-combined", from: "old-loss", to: "combined", kind: "data", mode: "smooth" },',
  '    { id: "new-loss-combined", from: "new-loss", to: "combined", kind: "data", mode: "smooth" },',
  '    { id: "combined-update", from: "combined", to: "update", kind: "gradient", mode: "smooth" },',
  '  ],',
  '  note: "Solid = data or objective contribution; dotted = task control; dashed = gradient to the update target.",',
  '};',
  '',
  'export function BranchExample() {',
  '  return <DiagramFlow spec={branchSpec} label="输入经过冻结参考和可训练路径，目标与标签分别比较后进入组合目标" />;',
  '}',
].join("\n");

const mergeCode = [
  'import { DiagramFlow } from "./shared/foundation/layout/DiagramFlow";',
  'import type { DiagramSpec } from "./shared/foundation/layout/DiagramFlow";',
  '',
  'const mergeSpec: DiagramSpec = {',
  '  columns: 5,',
  '  nodes: [',
  '    { id: "prior", title: "旧参数 θᴬ", role: "frozen", column: 1, row: 1 },',
  '    { id: "current", title: "当前参数 θ", role: "trainable", column: 1, row: 3 },',
  '    { id: "importance", title: "重要性权重 Ω", role: "target", column: 2, row: 2 },',
  '    { id: "stability", title: "保持项", role: "objective", column: 3, row: 2 },',
  '    { id: "prediction", title: "当前预测 f(x)", role: "output", column: 1, row: 5 },',
  '    { id: "label", title: "当前标签 y", role: "label", column: 2, row: 5 },',
  '    { id: "task-loss", title: "任务损失", role: "objective", column: 3, row: 5 },',
  '    { id: "combined", title: "组合目标", role: "objective", column: 4, row: 3 },',
  '    { id: "parameters", title: "当前参数 θ", role: "update", column: 5, row: 3 },',
  '  ],',
  '  edges: [',
  '    { id: "prior-stability", from: "prior", to: "stability", kind: "data", mode: "smooth" },',
  '    { id: "current-stability", from: "current", to: "stability", kind: "data", mode: "smooth" },',
  '    { id: "importance-stability", from: "importance", to: "stability", kind: "data", mode: "straight" },',
  '    { id: "prediction-task", from: "prediction", to: "task-loss", kind: "data", mode: "smooth" },',
  '    { id: "label-task", from: "label", to: "task-loss", kind: "data", mode: "straight" },',
  '    { id: "stability-combined", from: "stability", to: "combined", kind: "data", mode: "smooth" },',
  '    { id: "task-combined", from: "task-loss", to: "combined", kind: "data", mode: "smooth" },',
  '    { id: "combined-update", from: "combined", to: "parameters", kind: "gradient", mode: "smooth" },',
  '  ],',
  '  note: "Solid = calculation inputs and objective contributions; dashed = gradient from the combined objective to the update target.",',
  '};',
  '',
  'export function MergeExample() {',
  '  return <DiagramFlow spec={mergeSpec} label="两个完整计算作为数据贡献进入组合目标，再将梯度传向参数更新" />;',
  '}',
].join("\n");

const layoutOptions: { value: EditorialLayout; label: string }[] = [
  { value: "axis", label: "Alternating axis" },
  { value: "stagger", label: "Staggered rows" },
  { value: "asymmetric", label: "Asymmetric" },
  { value: "overview", label: "Overview → detail" },
];

const layoutExamples: Record<EditorialLayout, { title: string; topic: string; headline: { before: string; emphasis: string; after: string }; use: string; avoid: string; source: string; code: string }> = {
  axis: {
    title: "交错叙事轴线",
    topic: "响应保留",
    headline: { before: "先理清", emphasis: "旧目标", after: "，再沿着参照追踪更新" },
    use: "步骤有清楚的先后关系，而且每一步需要独立说明或公式。",
    avoid: "步骤没有因果或时间顺序，或手机上必须并排比较细节。",
    source: "reusable-kit/demo/src/EditorialStudies.tsx · B 段",
    code: [
      '<ol className="story-axis">',
      '  {steps.map((step, index) => (',
      '    <li className={index % 2 ? "story-axis__item is-right" : "story-axis__item"} key={step.id}>',
      '      <span className="story-axis__marker" aria-hidden="true">{index + 1}</span>',
      '      <article className="story-axis__content">',
      '        <h3>{step.title}</h3><p>{step.explanation}</p>',
      '      </article>',
      '    </li>',
      '  ))}',
      '</ol>',
      '',
      '.story-axis { display: grid; gap: 18px; padding: 0; list-style: none; }',
      '.story-axis__item { display: grid; grid-template-columns: minmax(0,1fr) 36px minmax(0,1fr); align-items: start; }',
      '.story-axis__marker { grid-column: 2; grid-row: 1; }',
      '.story-axis__content { position: relative; grid-column: 1; grid-row: 1; }',
      '.story-axis__item.is-right .story-axis__content { grid-column: 3; }',
      '.story-axis__content::after { position: absolute; top: 16px; right: -14px; width: 14px; height: 1px; background: currentColor; content: ""; }',
      '.story-axis__item.is-right .story-axis__content::after { right: auto; left: -14px; }',
      '@media (max-width: 700px) { .story-axis__item { grid-template-columns: 28px minmax(0,1fr); } .story-axis__marker { grid-column: 1; } .story-axis__content, .story-axis__item.is-right .story-axis__content { grid-column: 2; } .story-axis__content::after, .story-axis__item.is-right .story-axis__content::after { right: auto; left: -12px; width: 12px; } }',
    ].join("\n"),
  },
  stagger: {
    title: "阶梯 / 错位比较行",
    topic: "旧知与新类",
    headline: { before: "让", emphasis: "旧类响应", after: "与新类监督清楚对位" },
    use: "读者需要看出比较对象的先后或权重差异，轻微水平位移能帮助追踪行关系。",
    avoid: "横向位移会把关联文字推离对应对象，或窄屏内容因此产生横向滚动。",
    source: "reusable-kit/demo/src/JourneyArtDirection.tsx · reveal rows",
    code: [
      '<div className="comparison-rows">',
      '  {rows.map((row, index) => (',
      '    <article className="comparison-row" data-depth={index % 2 ? "offset" : "base"} key={row.id}>',
      '      <h3>{row.title}</h3><p>{row.relation}</p><strong>{row.result}</strong>',
      '    </article>',
      '  ))}',
      '</div>',
      '',
      '.comparison-rows { display: grid; gap: 16px; }',
      '.comparison-row { display: grid; grid-template-columns: minmax(7rem,.8fr) minmax(0,1fr) minmax(12rem,1.35fr); gap: 8px 16px; align-items: baseline; }',
      '.comparison-row[data-depth="offset"] { width: calc(100% - clamp(24px, 8vw, 88px)); margin-inline-start: clamp(24px, 8vw, 88px); }',
      '@media (max-width: 700px) { .comparison-row { grid-template-columns: 1fr; gap: 6px; } .comparison-row[data-depth="offset"] { margin-inline-start: 0; } }',
    ].join("\n"),
  },
  asymmetric: {
    title: "非对称参照 / 主体双栏",
    topic: "参照与当前对象",
    headline: { before: "让", emphasis: "稳定参照", after: "与当前学习对象各司其职" },
    use: "一侧是轻量参照，另一侧承担主要解释或当前学习对象。",
    avoid: "两边需要逐项对齐比较；这种情况应使用等宽列和一致的行轴。",
    source: "reusable-kit/demo/src/EditorialCCandidates.tsx · C1 / C2",
    code: [
      '<div className="reference-learner">',
      '  <aside><p>REFERENCE · 固定参照</p><h3>{reference.title}</h3><p>{reference.summary}</p></aside>',
      '  <section><p>LEARNING · 当前主体</p><h3>{learner.title}</h3><p>{learner.explanation}</p></section>',
      '</div>',
      '',
      '.reference-learner { display: grid; grid-template-columns: minmax(13rem,.8fr) minmax(0,1.6fr); gap: clamp(20px,4vw,52px); align-items: start; }',
      '.reference-learner aside { color: var(--rk-muted); }',
      '.reference-learner section { border-inline-start: 2px solid var(--rk-accent); padding-inline-start: 22px; }',
      '@media (max-width: 760px) { .reference-learner { grid-template-columns: 1fr; gap: 18px; } .reference-learner section { border-inline-start: 0; border-block-start: 2px solid var(--rk-accent); padding: 16px 0 0; } }',
    ].join("\n"),
  },
  overview: {
    title: "宽图 → 局部解释 → 计算",
    topic: "整体关系 → 局部计算",
    headline: { before: "从系统全貌聚焦到", emphasis: "响应对齐", after: "，再解释计算" },
    use: "先建立整体对象身份，再聚焦其中一段关系，最后解释公式或数值变化。",
    avoid: "每一节都重复同一张大总图，或局部图改变了对象名称与方向。",
    source: "reusable-kit/demo/src/EditorialJourney.tsx · overview / local / calculation",
    code: [
      '<section className="overview-detail">',
      '  <figure className="overview-detail__map" aria-label="共享输入、参照模型与当前模型的关系示意">',
      '    <figcaption>OVERVIEW · 共享输入</figcaption>',
      '    <div className="overview-detail__flow">',
      '      <div className="overview-detail__node"><span>INPUT</span><strong>样本 x</strong></div>',
      '      <i aria-hidden="true">→</i>',
      '      <div className="overview-detail__routes">',
      '        <article><span>REFERENCE · FROZEN</span><strong>旧模型 f_old</strong><small>目标响应 y_old</small></article>',
      '        <article className="is-active"><span>LEARNING · ACTIVE</span><strong>当前模型 f_θ</strong><small>预测响应 y_θ</small></article>',
      '      </div>',
      '      <i aria-hidden="true">→</i>',
      '      <div className="overview-detail__node is-focus"><span>LOCAL FOCUS</span><strong>响应对齐</strong><small>比较两种响应</small></div>',
      '    </div>',
      '  </figure>',
      '  <aside className="overview-detail__reading"><span>LOCAL DETAIL · 示意</span><h3>{detail.title}</h3><p>{detail.explanation}</p><div className="overview-detail__formula">{detail.formula}</div></aside>',
      '</section>',
      '',
      '.overview-detail { display: grid; grid-template-columns: minmax(0,1.7fr) minmax(16rem,.8fr); gap: clamp(20px,4vw,48px); align-items: start; }',
      '.overview-detail__map { min-width: 0; margin: 0; padding: 18px; background: var(--rk-figure); }',
      '.overview-detail__flow { display: grid; grid-template-columns: minmax(5.5rem,.65fr) 14px minmax(10rem,1.3fr) 14px minmax(7rem,.8fr); gap: 10px; align-items: center; }',
      '.overview-detail__routes { display: grid; gap: 8px; }',
      '.overview-detail__node, .overview-detail__routes article { display: grid; gap: 5px; padding: 12px; border: 1px solid var(--rk-line-strong); background: var(--rk-surface); }',
      '.overview-detail__routes .is-active, .overview-detail__node.is-focus { border-color: var(--rk-accent); }',
      '.overview-detail__reading { max-width: 42ch; }',
      '@media (max-width: 760px) { .overview-detail { grid-template-columns: 1fr; } .overview-detail__reading { max-width: none; } }',
    ].join("\n"),
  },
};

const typographyCode = [
  'import { PullQuote } from "./shared/foundation/data/PullQuote";',
  'import { FormulaBlock } from "./shared/optional/formula/FormulaBlock";',
  '',
  'export function TypographyExample() {',
  '  return <section>',
  '    <p>The reference stays fixed; <strong>the current model receives the update</strong>.</p>',
  '    <PullQuote attribution="Teaching takeaway">Explain separate objectives before describing their combined effect.</PullQuote>',
  '    <FormulaBlock',
  '      label="Objective"',
  '      formula="L_total = L_task + λ L_preserve"',
  '      accessibleLabel="Total loss equals task loss plus lambda times preservation loss"',
  '      renderedFormula={<math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>L</mi><mi>total</mi></msub><mo>=</mo><msub><mi>L</mi><mi>task</mi></msub><mo>+</mo><mi>λ</mi><msub><mi>L</mi><mi>preserve</mi></msub></math>}',
  '      terms={[',
  '        { id: "task", label: "L_task", explanation: "The task-fitting term; replace this with the paper\'s definition." },',
  '        { id: "weight", label: "λ", explanation: "The trade-off coefficient; verify its meaning and value in the source." },',
  '        { id: "preserve", label: "L_preserve", explanation: "The preservation objective; do not infer it from this label." },',
  '      ]}',
  '      description="Choose a symbol to read its role."',
  '    />',
  '  </section>;',
  '}',
].join("\n");

const stickyRecipeCode = [
  'import { useState } from "react";',
  'import { DiagramFlow } from "./shared/foundation/layout/DiagramFlow";',
  'import type { DiagramSpec } from "./shared/foundation/layout/DiagramFlow";',
  'import { StickySystemView, useStickyStepSync } from "./shared/foundation/layout/StickySystemView";',
  'import { FigureFrame } from "./shared/compositions/figure-frame/FigureFrame";',
  'import { StepNav } from "./shared/compositions/step-nav/StepNav";',
  '',
  'const steps = [',
  '  { id: "arrive", sectionId: "story-arrive", title: "共享输入", body: "样本进入冻结参考路径和当前学习路径。", nodes: ["sample", "teacher", "student"], edges: ["input-teacher", "input-student"] },',
  '  { id: "compare", sectionId: "story-compare", title: "目标与标签比较", body: "目标响应和真实标签是比较的输入；组合目标再将梯度传向当前参数。", nodes: ["target", "prediction", "label", "old-loss", "new-loss", "combined", "update"], edges: ["target-old-loss", "prediction-old-loss", "prediction-new-loss", "label-new-loss", "old-loss-combined", "new-loss-combined", "combined-update"] },',
  '];',
  '',
  'const storySpec: DiagramSpec = {',
  '  columns: 4,',
  '  nodes: [',
  '    { id: "sample", title: "样本 x", role: "input", column: 1, row: 2 },',
  '    { id: "teacher", title: "冻结参考", role: "frozen", column: 2, row: 1 },',
  '    { id: "student", title: "当前模型", role: "trainable", column: 2, row: 3 },',
  '    { id: "target", title: "旧响应目标", role: "target", column: 3, row: 1 },',
  '    { id: "prediction", title: "当前预测", role: "output", column: 3, row: 3 },',
  '    { id: "label", title: "真实标签 y", role: "label", column: 3, row: 5 },',
  '    { id: "old-loss", title: "响应比较", role: "objective", column: 4, row: 1 },',
  '    { id: "new-loss", title: "标签比较", role: "objective", column: 4, row: 4 },',
  '    { id: "combined", title: "组合目标", role: "objective", column: 4, row: 6 },',
  '    { id: "update", title: "参数更新", role: "update", column: 4, row: 8 },',
  '  ],',
  '  edges: [',
  '    { id: "input-teacher", from: "sample", to: "teacher", kind: "data", mode: "smooth" },',
  '    { id: "input-student", from: "sample", to: "student", kind: "data", mode: "smooth" },',
  '    { id: "teacher-target", from: "teacher", to: "target", kind: "data", mode: "straight" },',
  '    { id: "student-prediction", from: "student", to: "prediction", kind: "data", mode: "straight" },',
  '    { id: "target-old-loss", from: "target", to: "old-loss", kind: "data", mode: "smooth" },',
  '    { id: "prediction-old-loss", from: "prediction", to: "old-loss", kind: "data", mode: "smooth" },',
  '    { id: "prediction-new-loss", from: "prediction", to: "new-loss", kind: "data", mode: "smooth" },',
  '    { id: "label-new-loss", from: "label", to: "new-loss", kind: "data", mode: "straight" },',
  '    { id: "old-loss-combined", from: "old-loss", to: "combined", kind: "data", mode: "smooth" },',
  '    { id: "new-loss-combined", from: "new-loss", to: "combined", kind: "data", mode: "smooth" },',
  '    { id: "combined-update", from: "combined", to: "update", kind: "gradient", mode: "smooth" },',
  '  ],',
  '  note: "Solid = inputs and objective contributions; dashed = gradient to the update target.",',
  '};',
  '',
  'function SyncedFigure({ activeId, onChoose }: { activeId: string; onChoose: (id: string) => void }) {',
  '  const sync = useStickyStepSync();',
  '  const active = steps.find(step => step.id === activeId) ?? steps[0];',
  '  const items = steps.map(step => ({ id: step.id, label: step.title }));',
  '  return <FigureFrame label="Current system state" title={active.title} footer={<StepNav items={items} activeId={activeId} onSelect={id => { onChoose(id); sync?.setManualStep(id); }} label="Choose a figure step" />}>',
  '    <DiagramFlow spec={storySpec} focus={{ nodes: active.nodes, edges: active.edges }} label={`System view: ${active.title}`} framed={false} stackMinWidth={400} />',
  '  </FigureFrame>;',
  '}',
  '',
  'export function ScrollStoryExample() {',
  '  const [activeId, setActiveId] = useState(steps[0].id);',
  '  const sections = steps.map(step => ({ id: step.sectionId, stepId: step.id }));',
  '  return <StickySystemView label="Scroll-synchronized system view" sections={sections}',
  '    onActiveSectionChange={section => { if (section.stepId) setActiveId(section.stepId); }}',
  '    visual={<SyncedFigure activeId={activeId} onChoose={setActiveId} />}>',
  '    {steps.map(step => <section id={step.sectionId} key={step.id}>',
  '      <h2>{step.title}</h2><p>{step.body}</p>',
  '    </section>)}',
  '  </StickySystemView>;',
  '}',
].join("\n");

function PatternGallery() {
  const [diagramCase, setDiagramCase] = useState<DiagramCase>("branch");
  const [pathMode, setPathMode] = useState<PathMode>("smooth");
  const [focusMode, setFocusMode] = useState<DiagramFocus>("all");
  const [editorialLayout, setEditorialLayout] = useState<EditorialLayout>("axis");
  const baseSpec = diagramCase === "branch" ? branchBase : mergeBase;
  const diagramSpec = useMemo<DiagramSpec>(() => ({ ...baseSpec, edges: baseSpec.edges.map((edge) => ({ ...edge, mode: pathMode })) }), [baseSpec, pathMode]);
  const focus = diagramCase === "branch"
    ? focusMode === "reference"
      ? { nodes: ["sample", "teacher", "target", "old-loss"], edges: ["input-teacher", "teacher-target", "target-old-loss"] }
      : focusMode === "learning"
        ? { nodes: ["sample", "task", "student", "prediction", "label", "new-loss"], edges: ["input-student", "task-control", "student-prediction", "prediction-new-loss", "label-new-loss"] }
        : undefined
    : focusMode === "reference"
      ? { nodes: ["prior", "current", "importance", "stability", "combined"], edges: ["prior-stability", "current-stability", "importance-stability", "stability-combined"] }
      : focusMode === "learning"
        ? { nodes: ["prediction", "label", "task-loss", "combined", "parameters"], edges: ["prediction-task", "label-task", "task-combined", "combined-update"] }
        : undefined;

  return <div className="kit-demo__paper pattern-gallery" data-demo-view="pattern-gallery">
    <header className="pattern-gallery__intro">
      <p className="rk-type--meta">REUSABLE PATTERNS · CANDIDATE</p>
      <h2 className="rk-type--heading-1">从一个可见样例，找到下一步可复制的结构</h2>
      <p className="rk-type--body">按能力浏览真实预览、适用边界、最小接口和源码来源。构图 Recipe 提供起步代码；组件成熟度仍以唯一的 Registry 为准。</p>
    </header>

    <InlineCallout kind="note" title="候选状态说明">Reusable Kit 的组件仍为 candidate。构建和浏览器检查只验证实现，不代表人工批准。示意数据也不应被误认成论文结果。</InlineCallout>

    <section id="gallery-diagrams" className="pattern-gallery__section" aria-labelledby="gallery-diagrams-title">
      <SectionHeader index="01" eyebrow="DIAGRAM / CONNECTORS" title="分支、汇合与连接几何" lead="DiagramFlow 已经支持节点角色、数据/梯度/控制线、端口、三种路径几何和聚焦。这里把这些变体放到一个可发现的样例里。" headingId="gallery-diagrams-title" />
      <div className="pattern-gallery__controls">
        <SegmentedControl label="选择图形结构" value={diagramCase} options={[{ value: "branch", label: "分支 · 两条不同职责" }, { value: "merge", label: "汇合 · 两个完整目标" }]} onChange={(value) => { setDiagramCase(value); setFocusMode("all"); }} />
        <SegmentedControl label="选择连线路径" value={pathMode} options={diagramModes} onChange={setPathMode} />
      </div>
      <div className="pattern-gallery__focus-row">
        <span>聚焦：</span>
        <Button variant={focusMode === "all" ? "primary" : "secondary"} size="small" aria-pressed={focusMode === "all"} onClick={() => setFocusMode("all")}>完整结构</Button>
        <Button variant={focusMode === "reference" ? "primary" : "secondary"} size="small" aria-pressed={focusMode === "reference"} onClick={() => setFocusMode("reference")}>{diagramCase === "branch" ? "冻结参考路径" : "保持项路径"}</Button>
        <Button variant={focusMode === "learning" ? "primary" : "secondary"} size="small" aria-pressed={focusMode === "learning"} onClick={() => setFocusMode("learning")}>{diagramCase === "branch" ? "当前学习路径" : "任务目标路径"}</Button>
      </div>
      <FigureFrame
        label={diagramCase === "branch" ? "结构样例 · Branch" : "结构样例 · Merge"}
        title={diagramCase === "branch" ? "同一输入进入职责不同的两条路径" : "先完成两次比较，再组合并更新"}
        note={diagramCase === "branch" ? "实线表示输入数据或目标项贡献，点线表示任务控制，虚线仅表示组合目标传向参数更新的梯度。" : "实线表示计算输入或目标项贡献，虚线仅表示组合目标传向更新对象的梯度。组合规则依据具体论文填写。"}
      >
        <DiagramFlow spec={diagramSpec} focus={focus} label={diagramCase === "branch" ? "分支图样例：输入进入冻结参考路径和可训练路径" : "汇合图样例：保持目标与任务目标在参数更新前汇合"} framed={false} />
      </FigureFrame>
      <div className="pattern-gallery__facts">
        <dl>
          <div><dt>适用</dt><dd>{diagramCase === "branch" ? "一个来源确实分化为意义不同的目标或状态。" : "多个完整计算各有贡献，且必须明确最后的更新对象。"}</dd></div>
          <div><dt>不要用于</dt><dd>{diagramCase === "branch" ? "只是在列举示例，或分支没有不同身份时。" : "组合规则未知、目标可互换，或只剩一个没有上下文的汇合图时。"}</dd></div>
          <div><dt>最小接口</dt><dd><code>columns + nodes + edges</code>；可选 <code>zones</code>、<code>legend</code> 和 <code>focus</code>。边可设 <code>kind</code>、<code>mode</code>、端口与偏移。</dd></div>
          <div><dt>窄屏与键盘</dt><dd>DiagramFlow 自动切换为按输入整理的有序列表。图形选择与聚焦由可键盘操作的按钮完成；路径本身不依赖动画。</dd></div>
          <div><dt>Registry / scaffold</dt><dd><code>DiagramFlow</code> · P0 · candidate。当前需显式传 <code>--allow-unapproved</code> 才能复制。</dd></div>
        </dl>
      </div>
      <CodePanel title="展开可复制的 DiagramFlow 分支样例" code={diagramCase === "branch" ? branchCode : mergeCode} source={diagramCase === "branch" ? "recipes/diagram-branch.md" : "recipes/diagram-merge.md"} level="runnable" notice="完整 TSX 组件；目标和预测是损失输入，组合目标到更新目标才表示梯度。请先在入口引入 Kit 样式。" />
      <p className="pattern-gallery__provenance">已有场景：LwF teacher / student 图与目标合成图，见 <code>reusable-kit/demo/src/figures.tsx</code>；完整论文场景见 <code>papers/lwf/web/final/src/v3/LwfVerticalSlice.tsx</code>。</p>
    </section>

    <section id="gallery-editorial" className="pattern-gallery__section" aria-labelledby="gallery-editorial-title">
      <SectionHeader index="02" eyebrow="EDITORIAL COMPOSITION" title="构图 Recipe，而不是固定页面模板" lead="选择一种表达关系，先看布局如何帮助阅读，再复制最小结构。Recipe 只约束关系和适用边界，不要求所有论文采用同一版式。" headingId="gallery-editorial-title" />
      <SegmentedControl label="选择编辑构图" value={editorialLayout} options={layoutOptions} onChange={setEditorialLayout} />
      <EditorialPreview kind={editorialLayout} />
      <div className="pattern-gallery__facts">
        <dl>
          <div><dt>构图</dt><dd>{layoutExamples[editorialLayout].title}</dd></div>
          <div><dt>适用</dt><dd>{layoutExamples[editorialLayout].use}</dd></div>
          <div><dt>不要用于</dt><dd>{layoutExamples[editorialLayout].avoid}</dd></div>
          <div><dt>窄屏方案</dt><dd>单列重排、清除水平错位、保留原有阅读顺序；不靠缩小字体或裁切内容适配。</dd></div>
          <div><dt>Registry / scaffold</dt><dd>这是构图 Recipe，不是组件条目；无需 scaffold。先复制结构，再按论文的数据和语义改写。</dd></div>
        </dl>
      </div>
      <CodePanel title="展开可复制的 TSX / CSS 构图样例" code={layoutExamples[editorialLayout].code} source={layoutExamples[editorialLayout].source} level="fragment" notice="结构片段，包含配套 TSX 与 CSS，必须一起复制；steps、rows、reference、learner、detail 等由调用方提供。" />
      <p className="pattern-gallery__provenance">更多实际构图：<code>reusable-kit/demo/src/EditorialStudies.tsx</code>、<code>JourneyArtDirection.tsx</code>、<code>EditorialCCandidates.tsx</code>。</p>
    </section>

    <section id="gallery-scroll" className="pattern-gallery__section" aria-labelledby="gallery-scroll-title">
      <SectionHeader index="03" eyebrow="SCROLL / MOTION" title="同一状态驱动固定图与滚动正文" lead="滚动到章节时，左侧主图跟随当前阶段；手动选图后暂时优先显示所选阶段。切换示例，看看同一 StickySystemView 如何承载不同数据。" headingId="gallery-scroll-title" />
      <InlineCallout kind="note" title="交互提示">可以滚动右侧章节，也可以在左侧步骤导航直接选择。手动选择会暂时覆盖滚动位置，随后自动恢复同步。</InlineCallout>
      <StickyStoryChooser />
      <div className="pattern-gallery__facts">
        <dl>
          <div><dt>适用</dt><dd>长文本按序解释同一系统，且读者需要持续看到阶段变化或焦点定位。</dd></div>
          <div><dt>不要用于</dt><dd>正文很短、图不随章节变化，或窄屏下固定图会遮挡阅读时。移动端应改为图文顺序呈现。</dd></div>
          <div><dt>最小接口</dt><dd><code>sections: {"{ id, stepId }[]"}</code>、<code>visual</code> 和 <code>children</code>；手动控件通过 <code>useStickyStepSync().setManualStep()</code> 发送步骤。</dd></div>
          <div><dt>键盘 / 降级</dt><dd>步骤导航可用键盘选择；窄屏按图文顺序堆叠，滚动同步仍可用。该样例不依赖连续动画，reduced motion 下无需改变语义。</dd></div>
          <div><dt>Registry / scaffold</dt><dd><code>StickySystemView</code> · P0 · candidate。复制时显式传 <code>--allow-unapproved</code>。</dd></div>
        </dl>
      </div>
      <CodePanel title="展开可复制的 StickySystemView 用法" code={stickyRecipeCode} source="recipes/sticky-scrollytelling.md" level="runnable" notice="完整 TSX 小样例，DiagramFlow 的 400px 阈值适配双栏视口；更窄时回退为有序列表。请先在入口引入 Kit 样式。" />
      <p className="pattern-gallery__provenance">现有来源：<code>papers/lwf/web/final/src/v3/LwfVerticalSlice.tsx</code> 与 <code>styles/scrollytelling.css</code>；其 Kit 副本有 <code>readingLineRatio</code> 扩展，本 Kit API 未包含该选项。</p>
    </section>

    <section id="gallery-typography" className="pattern-gallery__section" aria-labelledby="gallery-typography-title">
      <SectionHeader index="04" eyebrow="TYPOGRAPHY / FORMULA" title="强调命题，并把符号解释放在公式旁" lead="行内强调标识局部命题，PullQuote 承载一条独立结论；FormulaBlock 将可读公式、术语按钮和逐项说明放在同一阅读区域。" headingId="gallery-typography-title" />
      <div className="pattern-gallery__type-preview">
        <p className="rk-type--body">冻结的参照模型提供稳定目标；<strong>当前可训练模型承担参数更新</strong>。符号 <span className="rk-math"><var>θ</var><sub>t</sub></span> 在正文中保留数学身份。</p>
        <PullQuote attribution="教学结论">需要保留的目标与需要拟合的新任务，可以分别解释，再说明它们如何共同影响更新。</PullQuote>
        <FormulaBlock
          label="目标结构示意"
          formula="L_total = L_task + λ L_preserve"
          accessibleLabel="总目标等于任务损失加 lambda 乘以保持损失"
          renderedFormula={<math><msub><mi>L</mi><mi>total</mi></msub><mo>=</mo><msub><mi>L</mi><mi>task</mi></msub><mo>+</mo><mi>λ</mi><msub><mi>L</mi><mi>preserve</mi></msub></math>}
          description="选择符号，查看它在这个示意式里的角色。真实公式与系数以目标论文为准。"
          terms={[
            { id: "task", label: "L_task", explanation: "表示当前任务的拟合项；此处仅作通用教学符号。" },
            { id: "weight", label: "λ", explanation: "表示两项目标间的权衡系数；具体含义和取值必须查原文。" },
            { id: "preserve", label: "L_preserve", explanation: "表示某种保留目标；不要把它未经核验地映射成特定论文公式。" },
          ]}
        />
      </div>
      <div className="pattern-gallery__facts">
        <dl>
          <div><dt>适用</dt><dd>一个命题值得停留，或公式符号需要与解释同步阅读。</dd></div>
          <div><dt>不要用于</dt><dd>连续多句都加粗，或公式项与目标、实现来源尚未核验时。</dd></div>
          <div><dt>最小接口</dt><dd><code>PullQuote(children, attribution?)</code>；<code>FormulaBlock(formula, renderedFormula, terms, description)</code>。</dd></div>
          <div><dt>键盘 / 降级</dt><dd>公式术语以按钮提供焦点和选择反馈；MathML 由浏览器排版，正文仍提供文字说明。</dd></div>
          <div><dt>Registry / scaffold</dt><dd><code>PullQuote</code> 本次补登记为 P1 candidate；<code>FormulaBlock</code> 已登记为 P1 candidate。</dd></div>
        </dl>
      </div>
      <CodePanel title="展开可复制的文字与公式样例" code={typographyCode} source="recipes/typography-formula.md" level="runnable" notice="完整 TSX 组件；MathML 类型声明由脚手架复制。请先在入口引入 Kit 样式，并用论文来源核对公式。" />
    </section>

    <MiniNetworkGallerySection />
    <TimelineGallerySection />

    <footer className="pattern-gallery__footer">
      <strong>如何复制 Kit 组件</strong>
      <p>Registry 是组件成熟度的唯一来源；本页不复制或覆盖状态。首次复制 P0 基础组件时使用 preset；P1 才能通过 <code>--add</code> 选择。当前条目均为 candidate，<code>--allow-unapproved</code> 只表示接受复制候选组件，不代表批准。</p>
      <pre><code>{'python3 tools/paper.py new kit-smoke-demo --title "Kit Smoke Demo" --url "https://example.org/kit-smoke"\n\n# 二选一：仅复制 P0 基础组件\npython3 tools/paper.py scaffold-kit kit-smoke-demo --preset continual-learning --allow-unapproved\n\n# 或：首次复制 P0，并同时选择需要的 P1\npython3 tools/paper.py scaffold-kit kit-smoke-demo --preset continual-learning --add StepNav,FigureFrame,FormulaBlock,PullQuote,MiniNetworkGlyph,useAnimationTimeline --allow-unapproved'}</code></pre>
      <p>以上命令用于隔离烟测；正式论文请填写真实来源。两条 scaffold 命令互斥，不能顺序用于同一工作区。P0 默认由 preset 复制；<code>--add</code> 只接受 P1，且应在首次命令中一次选好。命令只复制一次，若目标已有 <code>src/shared</code> 会拒绝覆盖；入口文件需添加一次 <code>import "./shared/foundation/styles/kit.css";</code>。</p>
    </footer>
  </div>;
}

function EditorialPreview({ kind }: { kind: EditorialLayout }) {
  const example = layoutExamples[kind];
  return <div className="pattern-gallery__editorial" data-layout={kind}>
    <div className="pattern-gallery__editorial-heading">
      <p className="pattern-gallery__editorial-eyebrow"><span>LEARNING WITHOUT FORGETTING</span><i aria-hidden="true" /><span>{example.topic}</span></p>
      <h3>{example.headline.before}<strong>{example.headline.emphasis}</strong>{example.headline.after}</h3>
    </div>
    {kind === "axis" ? <ol className="pg-axis">
      <li><span className="pg-axis__marker is-current">01</span><article><small>问题</small><h4><mark>旧目标</mark>来自哪里？</h4><p>先确认进入当前过程的参照对象。</p></article></li>
      <li className="is-right"><span className="pg-axis__marker">02</span><article><small>机制</small><h4>哪个对象保持<mark>固定</mark>？</h4><p>给冻结参照一个清楚、稳定的身份。</p></article></li>
      <li><span className="pg-axis__marker">03</span><article><small>更新</small><h4>最后<mark>改变</mark>了什么？</h4><p>把变化对象交给下一步推演。</p></article></li>
    </ol> : null}
    {kind === "stagger" ? <div className="pg-stagger">
      <article><span>01 · OLD TARGET</span><h4><mark>旧类响应</mark></h4><p>参照模型 → <mark>蒸馏目标</mark></p><strong className="pg-stagger__status">保留</strong></article>
      <article data-depth="offset"><span>02 · NEW LABEL</span><h4><mark>新类标签</mark></h4><p>样本输入 → <mark>监督信号</mark></p><strong className="pg-stagger__status">学习</strong></article>
    </div> : null}
    {kind === "asymmetric" ? <div className="pg-asymmetric">
      <aside><span>REFERENCE</span><h4>稳定参照</h4><p>提供较轻的背景与旧状态。</p></aside>
      <section><span>ACTIVE MODEL</span><h4>当前学习对象</h4><p>主要解释空间用于展示输入、状态变化与更新归属。主体有更多内容时，可得到更多宽度。</p><p className="pg-asymmetric__note">视觉层级由面积与边线共同表达，不只依赖颜色。</p></section>
    </div> : null}
    {kind === "overview" ? <div className="pg-overview">
      <figure className="pg-overview__map" aria-label="共享样本进入参照模型和当前模型，并比较两种响应的示意图">
        <figcaption><span>OVERVIEW · 共享输入</span><span>对象身份与方向保持一致</span></figcaption>
        <div className="pg-overview__flow">
          <div className="pg-overview__node"><span>INPUT</span><strong>样本 x</strong><small>同一输入</small></div>
          <i aria-hidden="true">→</i>
          <div className="pg-overview__routes">
            <article><span>REFERENCE · FROZEN</span><strong>旧模型 f_old</strong><small>目标响应 <mark>y_old</mark></small></article>
            <article className="is-active"><span>LEARNING · ACTIVE</span><strong>当前模型 f_θ</strong><small>预测响应 <mark>y_θ</mark></small></article>
          </div>
          <i aria-hidden="true">→</i>
          <div className="pg-overview__node is-focus"><span>LOCAL FOCUS</span><strong>响应对齐</strong><small>比较两种响应</small></div>
        </div>
      </figure>
      <aside><span>LOCAL DETAIL · 示意</span><h4>沿用<mark>同一组对象身份</mark></h4><p>局部说明继续使用总图中的 y_old 与 y_θ，解释两种响应如何进入对齐。</p><div className="pg-overview__formula"><span>对齐损失示意</span><code>L_align = d(y_old, y_θ)</code><small>符号关系仅作布局示例，具体定义以论文为准。</small></div></aside>
    </div> : null}
  </div>;
}

type StoryStep = { id: string; title: string; eyebrow: string; copy: string; nodes: string[]; edges: string[] };
type ScrollStory = { id: string; label: string; description: string; spec: DiagramSpec; steps: StoryStep[] };

const stories: ScrollStory[] = [
  {
    id: "teacher-student",
    label: "Teacher / Student",
    description: "样例 A · 冻结参考与当前学习路径",
    spec: branchBase,
    steps: [
      { id: "arrive", title: "新样本进入", eyebrow: "01 · INPUT", copy: "同一个样本进入两条职责不同的路径。先识别共享输入，再看每个对象各自承担什么工作。", nodes: ["sample", "task"], edges: ["input-teacher", "input-student", "task-control"] },
      { id: "reference", title: "旧响应作为固定目标", eyebrow: "02 · REFERENCE", copy: "冻结参考对象产生目标响应；目标与当前预测作为数据输入进入响应比较。", nodes: ["sample", "teacher", "target", "student", "prediction", "old-loss"], edges: ["input-teacher", "teacher-target", "input-student", "student-prediction", "target-old-loss", "prediction-old-loss"] },
      { id: "prediction", title: "当前模型产生预测", eyebrow: "03 · PREDICTION", copy: "可训练模型处理相同输入，形成当前预测；标签比较还需要当前真实标签。", nodes: ["sample", "task", "student", "prediction", "label", "new-loss"], edges: ["input-student", "task-control", "student-prediction", "prediction-new-loss", "label-new-loss"] },
      { id: "compare", title: "目标分别比较", eyebrow: "04 · OBJECTIVES", copy: "旧响应目标与当前预测进入响应比较；当前预测与真实标签进入任务比较。目标项以数据依赖进入组合目标。", nodes: ["target", "prediction", "label", "old-loss", "new-loss", "combined"], edges: ["target-old-loss", "prediction-old-loss", "prediction-new-loss", "label-new-loss", "old-loss-combined", "new-loss-combined"] },
      { id: "update", title: "更新归属清楚", eyebrow: "05 · UPDATE", copy: "两个目标项先组合，再由组合目标向唯一更新对象传递梯度。具体组合规则由论文决定。", nodes: ["old-loss", "new-loss", "combined", "update"], edges: ["old-loss-combined", "new-loss-combined", "combined-update"] },
    ],
  },
  {
    id: "data-pipeline",
    label: "Data pipeline",
    description: "样例 B · 记录整理与结果生成",
    spec: {
      columns: 3,
      zones: [{ id: "pipeline-input", label: "输入", from: 1, span: 1 }, { id: "pipeline-transform", label: "转换", from: 2, span: 1 }, { id: "pipeline-output", label: "输出", from: 3, span: 1 }],
      nodes: [
        { id: "raw", column: 1, row: 2, order: 1, title: "原始记录", role: "input", badge: "INPUT", inputLabel: "原始记录" },
        { id: "schema", column: 2, row: 2, order: 2, title: "字段规范化", role: "model", badge: "TRANSFORM", inputLabel: "规范化结果" },
        { id: "features", column: 3, row: 2, order: 3, title: "特征提取", role: "trainable", badge: "FEATURES", inputLabel: "特征向量" },
        { id: "quality", column: 3, row: 4, order: 4, title: "质量检查", role: "objective", badge: "CHECK", inputLabel: "质量结果" },
        { id: "report", column: 3, row: 6, order: 5, title: "结构化结果", role: "output", badge: "OUTPUT", inputLabel: "最终结果" },
      ],
      edges: [
        { id: "raw-schema", from: "raw", to: "schema", kind: "data", mode: "straight" },
        { id: "schema-features", from: "schema", to: "features", kind: "data", mode: "smooth" },
        { id: "features-quality", from: "features", to: "quality", kind: "control", mode: "orthogonal" },
        { id: "quality-report", from: "quality", to: "report", kind: "data", mode: "smooth" },
      ],
      note: "示意数据流；具体字段与检查规则由使用者定义。",
    },
    steps: [
      { id: "record", title: "读取原始记录", eyebrow: "01 · READ", copy: "流程从具名输入开始。说明数据从哪里来，以及进入系统时还缺哪些结构。", nodes: ["raw"], edges: ["raw-schema"] },
      { id: "normalize", title: "规范字段结构", eyebrow: "02 · NORMALIZE", copy: "把记录整理成下游可识别的字段；输入与输出的身份在图中保持连续。", nodes: ["raw", "schema"], edges: ["raw-schema"] },
      { id: "extract", title: "派生特征表示", eyebrow: "03 · EXTRACT", copy: "从规范化记录生成特征。若这一过程有多个子步骤，应按真实执行顺序展开。", nodes: ["schema", "features"], edges: ["schema-features"] },
      { id: "check", title: "检查中间结果", eyebrow: "04 · CHECK", copy: "检查与转换分开表达，避免读者把控制条件误认为数据本身。", nodes: ["features", "quality"], edges: ["features-quality"] },
      { id: "report", title: "输出可追踪结果", eyebrow: "05 · OUTPUT", copy: "输出承接检查结果，最终输出应能回溯到输入与所执行的转换。", nodes: ["quality", "report"], edges: ["quality-report"] },
    ],
  },
];

function StickyStoryChooser() {
  const [storyId, setStoryId] = useState(stories[0].id);
  const story = stories.find((item) => item.id === storyId) ?? stories[0];
  return <div className="pattern-gallery__scroll-demo" data-scroll-story={story.id}>
    <SegmentedControl label="选择滚动同步样例" value={storyId} options={stories.map((item) => ({ value: item.id, label: item.label }))} onChange={(value) => { setStoryId(value); document.getElementById("gallery-scroll")?.scrollIntoView({ block: "start" }); }} />
    <p className="pattern-gallery__story-note">{story.description}</p>
    <StickyStory key={story.id} story={story} />
  </div>;
}

function StickyStory({ story }: { story: ScrollStory }) {
  const [activeId, setActiveId] = useState(story.steps[0].id);
  const sections = useMemo(() => story.steps.map((step) => ({ id: `scroll-${story.id}-${step.id}`, stepId: step.id })), [story]);
  const activeIndex = Math.max(0, story.steps.findIndex((step) => step.id === activeId));
  const activeStep = story.steps[activeIndex];
  const navItems = story.steps.map((step) => ({ id: step.id, label: step.title }));
  const choose = (id: string) => {
    setActiveId(id);
  };
  return <StickySystemView
    label={`${story.label} scroll synchronized view`}
    sections={sections}
    onActiveSectionChange={(section) => { if (section.stepId) setActiveId(section.stepId); }}
    visual={<StickyStoryVisual story={story} step={activeStep} activeIndex={activeIndex} navItems={navItems} activeId={activeId} onSelect={choose} />}
  >
    <div className="pattern-gallery__scroll-steps">
      {story.steps.map((step, index) => <section id={`scroll-${story.id}-${step.id}`} className="pattern-gallery__scroll-step" data-scroll-step={step.id} key={step.id}>
        <SectionHeader index={String(index + 1).padStart(2, "0")} eyebrow={step.eyebrow} title={step.title} lead={step.copy} />
        <p className="pattern-gallery__scroll-status">图形焦点：<strong>{activeId === step.id ? "当前步骤" : "向下滚动以同步"}</strong></p>
      </section>)}
    </div>
  </StickySystemView>;
}

function StickyStoryVisual({ story, step, activeIndex, navItems, activeId, onSelect }: {
  story: ScrollStory;
  step: StoryStep;
  activeIndex: number;
  navItems: { id: string; label: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const sync = useStickyStepSync();
  return <FigureFrame label="滚动章节同步 · 当前图形焦点" title={step.title} counter={{ index: activeIndex + 1, total: story.steps.length }} note={step.copy} footer={<StepNav items={navItems} activeId={activeId} onSelect={(id) => { onSelect(id); sync?.setManualStep(id); }} label="手动选择当前图形步骤" />}>
    <DiagramFlow spec={story.spec} focus={{ nodes: step.nodes, edges: step.edges }} label={`${story.label}: ${step.title}`} framed={false} stackMinWidth={400} />
  </FigureFrame>;
}

export { PatternGallery };
