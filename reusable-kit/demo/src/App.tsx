import { useEffect, useState } from "react";
import { ExpandableDetail, ReferenceHub, TermRef } from "../../core/reference";
import type { KnowledgeEntry } from "../../core/reference";
import { FlowStepper } from "../../core/flow-stepper";
import { ProcessLoopExplorer } from "../../core/process-loop";
import { ResponsibilityMap } from "../../core/responsibility-map";
import { StateMachineExplorer } from "../../core/state-machine";
import { CompareView } from "../../optional/compare-view";
import { FormulaBlock } from "../../optional/formula";
import { Button } from "../../foundation/controls/Button";
import { Chip } from "../../foundation/controls/Chip";
import { SegmentedControl } from "../../foundation/controls/SegmentedControl";
import { Slider } from "../../foundation/controls/Slider";
import { InlineCallout } from "../../foundation/feedback/InlineCallout";
import { StickySystemView, useStickyStepSync } from "../../foundation/layout/StickySystemView";
import { DiagramFlow } from "../../foundation/layout/DiagramFlow";
import { Drawer } from "../../foundation/overlay/Drawer";
import { Popover } from "../../foundation/overlay/Popover";
import { StepNav } from "../../compositions/step-nav";
import {
  ewcFormulaTerms, ewcProcess, ewcResponsibilities, ewcStates,
  lwfFlow, lwfResponsibilities, lwfStates,
} from "./data";
import { ewcTaskAGraph, labNavItems, lwfGraph, lwfGraphSteps, lwfNavItems, lwfObjectiveGraph } from "./figures";
import { ewcKnowledge, lwfKnowledge } from "./knowledge";

type DemoKind = "lab" | "lwf" | "ewc";
type VisualDirection = "warm" | "clear";

const choices = [
  { value: "lab" as const, label: "Component Lab", description: "Typography, controls, overlays" },
  { value: "lwf" as const, label: "LwF scenario", description: "Preserving earlier responses" },
  { value: "ewc" as const, label: "EWC scenario", description: "Protecting important parameters" },
];
const labSections = [
  { id: "lab-type-title", title: "Typography roles" },
  { id: "lab-button-title", title: "Buttons and controls" },
  { id: "lab-nav-title", title: "Step navigation" },
  { id: "lab-overlay-title", title: "Overlay contracts" },
];
const lwfSections = [
  { id: "lwf-problem", stepId: "arrive", title: "新任务到达" },
  { id: "lwf-teacher", stepId: "teacher", title: "冻结 teacher" },
  { id: "lwf-forward", stepId: "forward", title: "两条计算路径" },
  { id: "lwf-loss", stepId: "loss", title: "两个损失汇合" },
  { id: "lwf-update", stepId: "update", title: "更新与交接" },
];
const ewcSections = [
  { id: "ewc-task-a", stepId: "old", title: "Learn task A" },
  { id: "ewc-importance", stepId: "estimate", title: "Estimate importance" },
  { id: "ewc-stored", stepId: "store", title: "Store earlier-task state" },
  { id: "ewc-task-b", stepId: "new-task", title: "Train task B" },
  { id: "ewc-penalty", stepId: "penalty", title: "Form the EWC penalty" },
  { id: "ewc-update", stepId: "combine", title: "Combine and update" },
];

export default function App() {
  const [demo, setDemo] = useState<DemoKind>("lab");
  const [visualDirection, setVisualDirection] = useState<VisualDirection>("warm");
  const [activeSection, setActiveSection] = useState("lab-type-title");
  const [hubOpen, setHubOpen] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const sections = demo === "lab" ? labSections : demo === "lwf" ? lwfSections : ewcSections;
  const page = demo === "lab"
    ? { number: "01", breadcrumb: "Kit foundations", eyebrow: "PAGE 01 · COMPONENT FOUNDATIONS", title: "把论文机制拆成可读、可交互的组件", description: "Reusable components for turning research methods into clear, inspectable learning experiences." }
    : demo === "lwf"
      ? { number: "02", breadcrumb: "Learning without Forgetting", eyebrow: "PAGE 02 · LEARNING WITHOUT FORGETTING", title: "旧知识要保留，新任务仍要学习", description: "Learning without Forgetting (LwF) uses fixed teacher responses to preserve earlier behavior while a student learns new classes." }
      : { number: "03", breadcrumb: "Elastic Weight Consolidation", eyebrow: "PAGE 03 · ELASTIC WEIGHT CONSOLIDATION", title: "重要参数少改，模型继续学习", description: "EWC estimates which earlier-task parameters matter and regularizes changes while learning the next task." };
  const referenceEntries = demo === "ewc" ? ewcKnowledge : lwfKnowledge;

  useEffect(() => {
    setActiveSection(sections[0]?.id ?? "");
    const targets = sections.map((section) => document.getElementById(section.id)).filter((element): element is HTMLElement => Boolean(element));
    if (!targets.length || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });
    targets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [demo, sections]);

  const goToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <div className={`kit-shell kit-shell--${visualDirection}`} data-visual-direction={visualDirection}>
    <aside className="kit-sidebar">
      <a className="kit-sidebar__brand" href="#top" aria-label="PaperSkillWork reusable kit home">
        <span className="kit-sidebar__mark" aria-hidden="true">P</span><span><strong>PaperSkillWork</strong><small>REUSABLE KIT</small></span>
      </a>
      <p className="kit-sidebar__label">学习路径 <span>LEARNING PATH</span></p>
      <nav className="kit-sidebar__courses" aria-label="Choose a learning demo">
        {choices.map((choice, index) => <button key={choice.value} type="button" aria-label={choice.label} aria-current={demo === choice.value ? "page" : undefined} className={`kit-sidebar__course ${demo === choice.value ? "is-active" : ""}`} onClick={() => setDemo(choice.value)}>
          <span className="kit-sidebar__number">{String(index + 1).padStart(2, "0")}</span><span className="kit-sidebar__course-copy"><strong>{choice.label}</strong><small>{choice.description}</small></span>
        </button>)}
      </nav>
      <nav className="kit-sidebar__chapters" aria-label="Sections on this page">
        <p>本页内容 <span>ON THIS PAGE</span></p>
        {sections.map((section, index) => <button key={section.id} type="button" className={`kit-sidebar__chapter ${activeSection === section.id ? "is-active" : ""}`} onClick={() => goToSection(section.id)}>
          <span>{String(index + 1).padStart(2, "0")}</span><strong>{section.title}</strong>
        </button>)}
      </nav>
      <aside className="kit-sidebar__note"><span className="kit-sidebar__note-dot" /> <strong>论文导读</strong><p>沿着任务、模型更新与损失信号，观察同一个学习器如何持续演进。</p></aside>
      <div className="kit-sidebar__footer">PaperSkillWork · Interactive paper learning</div>
    </aside>

    <div className="kit-shell__main" id="top">
      <header className="kit-topbar">
        <div className="kit-topbar__breadcrumb"><span>REUSABLE KIT</span><b>/</b><strong>{page.number} · {page.breadcrumb}</strong></div>
        <div className="kit-topbar__actions"><SegmentedControl label="Visual direction candidate" value={visualDirection} options={[{ value: "warm", label: "Warm Editorial" }, { value: "clear", label: "Clear Research" }]} onChange={setVisualDirection} className="kit-topbar__directions" /><Button variant="secondary" className="kit-topbar__hub" onClick={() => { setReferenceId(null); setHubOpen(true); }}><span aria-hidden="true">⌕</span> Reference Hub</Button><span className="kit-topbar__badge"><i /> CANDIDATE</span></div>
      </header>
      <main className="kit-page">
        {demo === "lab" ? <section className="kit-page__intro"><p className="kit-page__eyebrow"><span>{page.eyebrow}</span><i /> PaperSkillWork</p><h1>{page.title}</h1><p>{page.description}</p></section> : null}
        {demo === "lab" ? <ComponentLab /> : demo === "lwf" ? <LwfDemo /> : <EwcDemo />}
        <footer className="kit-demo__footer">Source components are copied into each paper project by <code>tools/paper.py scaffold-kit</code>. Editing a paper's copy does not change this kit.</footer>
      </main>
    </div>
    <KnowledgeDrawer entries={referenceEntries} open={hubOpen} selectedId={referenceId} onSelectedIdChange={setReferenceId} onClose={() => setHubOpen(false)} />
  </div>;
}

function ComponentLab() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(36);
  const [navStep, setNavStep] = useState("objects");
  return <div className="kit-demo__paper kit-lab" data-demo-view="component-lab">
    <section className="kit-lab__intro"><p className="rk-type--meta">FOUNDATION V2 · CANDIDATE</p><h2 className="rk-type--heading-1">Readable defaults with bounded variants</h2><p className="rk-type--body">中文正文、English labels、数学符号 θᵢ and code-like IDs share a deliberate hierarchy. Resize the page to inspect wrapping rather than shrinking the content.</p></section>
    <InlineCallout kind="note" title="Candidate status">Warm Editorial and Clear Research are review candidates. Neither becomes an approved Kit default until screenshot review and explicit human acceptance.</InlineCallout>
    <section className="rk-surface" aria-labelledby="lab-type-title"><header className="rk-surface__header"><h3 id="lab-type-title" className="rk-type--heading-2">Typography roles</h3><p className="rk-type--supporting">Semantic roles expose a small token set; paper themes may replace the family and colors.</p></header><div className="kit-lab__type-stack"><p className="rk-type--display">Display / 开篇标题</p><p className="rk-type--heading-1">Heading 1 / 页面标题</p><p className="rk-type--heading-2">Heading 2 / 章节标题</p><p className="rk-type--heading-3">Heading 3 / 内部小节</p><p className="rk-type--body">Body — 主要解释用于连续阅读，包含 Fisher Information、xₜ 和中文标点。</p><p className="rk-type--supporting">Supporting — 图旁说明和辅助信息。</p><p className="rk-type--caption">Caption — Figure 2. Source-bound summary with enough line height.</p><p className="rk-type--diagram-label">Diagram label — Gradient ∇L</p><p className="rk-type--meta">META · VERSION 2 CANDIDATE</p><p className="rk-math">样本公式 <var>L</var><sub>old</sub> = −Σ<sub>i</sub> <var>t</var><sub>i</sub> log <var>ŷ</var><sub>i</sub></p></div></section>
    <section className="rk-surface rk-surface--soft" aria-labelledby="lab-button-title"><header className="rk-surface__header"><h3 id="lab-button-title" className="rk-type--heading-2">Buttons and controls</h3><p className="rk-type--supporting">Variants retain alignment across English, Chinese, icons, long text, and disabled states.</p></header><div className="kit-lab__button-grid"><Button>Primary action</Button><Button variant="secondary">次要操作</Button><Button variant="quiet">Quiet action</Button><Button variant="danger">Delete draft</Button><Button size="small">Small</Button><Button disabled>Unavailable</Button><Button variant="secondary" iconOnly aria-label="Add reference">＋</Button><Button className="kit-lab__long-button">A deliberately long action label that wraps in a narrow container</Button></div><div className="kit-lab__control-row"><Chip active>Selected chip</Chip><Chip tone="good">Verified</Chip><Slider label="Example threshold" value={sliderValue} displayValue={`${sliderValue}%`} onChange={setSliderValue} /></div></section>
    <section className="rk-surface" aria-labelledby="lab-nav-title"><header className="rk-surface__header"><h3 id="lab-nav-title" className="rk-type--heading-2">Step navigation</h3><p className="rk-type--supporting">Every step name stays complete. The grid wraps to a second row instead of shortening a label with an ellipsis, and the current step is marked by a bottom rule plus a tint, not by a heavy border.</p></header><StepNav items={labNavItems} activeId={navStep} onSelect={setNavStep} label="Component Lab step navigation sample" /></section>
    <section className="rk-surface" aria-labelledby="lab-overlay-title"><header className="rk-surface__header"><h3 id="lab-overlay-title" className="rk-type--heading-2">Overlay contracts</h3><p className="rk-type--supporting">Popover remains viewport-safe; the reading Drawer has room for composed two-column content on wide screens.</p></header><div className="kit-lab__button-grid"><Popover label="Compact supporting detail" trigger="Open viewport-safe popover"><p>This supporting detail is intentionally compact. Escape and outside press dismiss it.</p></Popover><Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open reading Drawer</Button></div></section>
    <Drawer open={drawerOpen} title="Reading Drawer" size="reading" onClose={() => setDrawerOpen(false)}><div className="kit-lab__reading-grid"><aside className="rk-surface rk-surface--soft"><p className="rk-type--meta">ENTRY LIST</p><h3 className="rk-type--heading-3">Stable navigation column</h3><p className="rk-type--supporting">The wide contract reserves enough space for a list and a readable detail pane.</p></aside><article className="rk-surface"><p className="rk-type--meta">DETAIL</p><h3 className="rk-type--heading-2">Long-form reference content</h3><p className="rk-type--body">This is a layout contract demonstration, not the final Reference Hub. At narrow widths the columns collapse without horizontal page scrolling.</p></article></div></Drawer>
  </div>;
}

function KnowledgeDrawer({ entries, open, selectedId, onSelectedIdChange, onClose }: {
  entries: KnowledgeEntry[];
  open: boolean;
  selectedId: string | null;
  onSelectedIdChange: (entryId: string | null) => void;
  onClose: () => void;
}) {
  const jumpToSection = (sectionId: string) => {
    onClose();
    window.requestAnimationFrame(() => document.getElementById(sectionId)?.scrollIntoView({ block: "center" }));
  };
  return <Drawer open={open} title="Reference Hub" size="reading" onClose={onClose}><ReferenceHub entries={entries} title="Knowledge entries" selectedId={selectedId} onSelectedIdChange={onSelectedIdChange} onJumpToSection={jumpToSection} /></Drawer>;
}

function LwfDemo() {
  const [flowIndex, setFlowIndex] = useState(0);
  const [hubOpen, setHubOpen] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const openReference = (entryId: string) => { setReferenceId(entryId); setHubOpen(true); };
  const updateFromStepId = (stepId: string) => {
    const index = lwfFlow.findIndex((item) => item.id === stepId);
    if (index >= 0) setFlowIndex(index);
  };
  return <div className="kit-demo__paper kit-method-page kit-lwf" data-demo-view="lwf">
    <header className="kit-lwf__hero">
      <p className="kit-lwf__kicker">LEARNING WITHOUT FORGETTING · RESPONSE PRESERVATION</p>
      <h2>一边保留旧响应，一边学会新类别</h2>
      <p className="kit-lwf__lead">下面的图只回答一件事：同一个输入怎样分成两条计算路径，teacher 的目标与 student 的两类输出在哪里比较，最后是哪个模型被更新。</p>
      <p className="kit-lwf__question"><b>当前问题</b><span>student 能学会当前标签，同时让旧类响应仍然可用吗？</span></p>
    </header>
    <StickySystemView sections={lwfSections} onActiveSectionChange={(section) => { if (section.stepId) updateFromStepId(section.stepId); }} visual={<LwfFocusPanel step={flowIndex} onStepChange={setFlowIndex} />}>
      <section id="lwf-problem" className="kit-demo__section"><h3>1. 新任务到达：冲突从哪里开始</h3><p>当前任务带来新的标签，而系统必须继续提供旧类的响应。图里两个对象同时出现：新的输入与标签，以及已经训练好、此时不再变化的 teacher。</p><InlineCallout kind="note" title="系统状态">任务在变，旧模型不跟着变：teacher 只提供旧响应，student 承担本任务的更新。</InlineCallout></section>
      <section id="lwf-teacher" className="kit-demo__section"><h3>2. Teacher：只产出目标，不参与更新</h3><p><TermRef entry={lwfKnowledge[0]} onOpenReference={openReference}>teacher</TermRef> 读取与 student 相同的输入 <span className="rk-math"><var>x</var><sub>t</sub></span>，给出旧类响应目标 <span className="rk-math"><var>T</var><sub>old</sub></span>。它在整个任务期间保持冻结：本任务的梯度不会写回这个模型。</p><ExpandableDetail title="这里的 distillation 指什么" summary="与冻结全部旧参数的差别。" level="supporting"><p><TermRef entry={lwfKnowledge[1]} onOpenReference={openReference}>distillation objective</TermRef> 比较的是 student 输出与固定 teacher 响应之间的函数层差异；它不等于把旧参数全部冻结，更新仍然作用于 student 参数。</p></ExpandableDetail></section>
      <section id="lwf-forward" className="kit-demo__section kit-lwf__chapter"><header><span>03 · 两条路径，一个 student</span><h3>同一个 x<sub>t</sub>，两个输出头</h3><p>teacher 路径只贡献旧响应目标；student 路径用共享骨干 <span className="rk-math"><var>h</var><sub>t</sub></span> 同时产出旧类输出 <span className="rk-math"><var>ŷ</var><sub>old</sub></span> 与新类输出 <span className="rk-math"><var>ŷ</var><sub>new</sub></span>。两路输入相同，身份与用途不同。</p></header>
        <ul className="kit-lwf__facts">
          <li><b>输入</b><span>同一批当前任务样本进入两条路径。</span></li>
          <li><b>Teacher</b><span>冻结，只产出旧响应目标，不接收梯度。</span></li>
          <li><b>Student</b><span>共享骨干可训练，两个输出头分别服务旧类与新类。</span></li>
          <li><b>监督</b><span>旧类靠 teacher 目标，新类靠当前任务标签。</span></li>
        </ul>
      </section>
      <section id="lwf-loss" className="kit-demo__section kit-lwf__chapter"><header><span>04 · 两个目标在这里汇合</span><h3>先各自比较，再合成为一次更新</h3><p>两个损失回答不同的问题，所以在汇合前必须各自读得懂：<span className="rk-math"><var>L</var><sub>old</sub></span> 比较 teacher 目标与 student 旧类输出，<span className="rk-math"><var>L</var><sub>new</sub></span> 比较当前标签与 student 新类输出。</p></header>
        <DiagramFlow spec={lwfObjectiveGraph} label="LwF 目标合成：两组比较形成两个损失，合成梯度后只更新 student 参数" />
        <ExpandableDetail title="展开组件责任审计" summary="需要逐项核对“谁负责什么”时再打开。" level="supporting"><ResponsibilityMap spec={lwfResponsibilities} /></ExpandableDetail>
      </section>
      <section id="lwf-update" className="kit-demo__section"><h3>5. 更新与交接</h3><p>两个目标都作用在 student 参数上。任务结束时，更新后的 student 才成为下一个任务的 teacher。</p><FlowStepper steps={lwfFlow} step={flowIndex} onStepChange={(step, index) => { setFlowIndex(index); }} /><h4>任务级生命周期</h4><p>依次推进合法阶段；试着从 ready 直接跳到 promotion，看看系统如何拒绝。</p><StateMachineExplorer spec={lwfStates} /><Button variant="secondary" onClick={() => { setReferenceId(null); setHubOpen(true); }}>Browse LwF references</Button></section>
    </StickySystemView><KnowledgeDrawer entries={lwfKnowledge} open={hubOpen} selectedId={referenceId} onSelectedIdChange={setReferenceId} onClose={() => setHubOpen(false)} /></div>;
}

function LwfFocusPanel({ step, onStepChange }: { step: number; onStepChange: (step: number) => void }) {
  const stickySync = useStickyStepSync();
  const index = Math.max(0, Math.min(step, lwfGraphSteps.length - 1));
  const current = lwfGraphSteps[index];
  const choose = (stepId: string) => {
    const next = lwfGraphSteps.findIndex((item) => item.id === stepId);
    if (next < 0) return;
    onStepChange(next);
    stickySync?.setManualStep(stepId);
  };
  return <section className="kit-lwf-panel" aria-label="LwF 计算关系图" data-focus-step={current.id}>
    <header className="kit-lwf-panel__header">
      <div>
        <p className="kit-lwf-panel__meta">因果链定位 · STEP {String(index + 1).padStart(2, "0")} / {String(lwfGraphSteps.length).padStart(2, "0")}</p>
        <h3 className="kit-lwf-focus__title">{current.title}</h3>
        <p className="kit-lwf-panel__note">{current.note}</p>
      </div>
    </header>
    <StepNav items={lwfNavItems} activeId={current.id} onSelect={choose} label="选择 LwF 机制步骤" />
    <DiagramFlow spec={lwfGraph} focus={{ nodes: current.nodes, edges: current.edges }} label="LwF 因果图：同一输入经 teacher 与 student 两条路径形成两个损失，梯度只更新 student 参数" framed={false} />
  </section>;
}

function EwcDemo() {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [hubOpen, setHubOpen] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const openReference = (entryId: string) => { setReferenceId(entryId); setHubOpen(true); };
  return <div className="kit-demo__paper kit-method-page kit-ewc" data-demo-view="ewc">
    <header className="kit-ewc__hero"><div><p className="kit-ewc__kicker">ELASTIC WEIGHT CONSOLIDATION · MECHANISM STUDY</p><h2>When a model learns again, what should it resist changing?</h2><p className="kit-demo__lead">First learn task A. Only after that solution exists do we estimate which parameters deserve stronger protection during task B.</p></div><aside className="kit-ewc__brief" aria-label="Reading brief"><span>OBSERVE</span><strong>State appears only when the algorithm has produced it.</strong><p>Future objects stay visibly dormant, so the whole-system map never masquerades as the current execution state.</p></aside></header>
    <InlineCallout kind="paper-fact" title="Mechanism sketch">This candidate uses abstract task labels, synthetic parameter examples, and no benchmark values. Confirm paper-specific notation and conditions against the source before reuse.</InlineCallout>
    <StickySystemView sections={ewcSections} visual={<div className="kit-ewc__system"><header><div><span>WHOLE-SYSTEM MAP</span><strong>Inactive objects are context, not completed state</strong></div><i>Scroll-linked</i></header><ProcessLoopExplorer spec={ewcProcess} nodeWidth={180} showProgress /></div>}>
    <section id="ewc-task-a" className="kit-demo__section kit-ewc__chapter"><header className="kit-ewc__chapter-header"><span>01 · ESTABLISH THE REFERENCE</span><h3>Learn task A before anything can be protected</h3><p>The model updates its current parameters while fitting task A. At this moment, Fisher importance and the EWC penalty do not exist yet.</p></header><DiagramFlow spec={ewcTaskAGraph} label="Task A training: data updates trainable parameters and produces the stored reference theta star" /><div className="kit-ewc__handoff"><span>What this stage hands forward</span><p>A parameter reference θ* that can later be paired with an importance estimate. No future penalty is active in this stage.</p></div></section>
    <section id="ewc-importance" className="kit-demo__section kit-ewc__chapter"><header className="kit-ewc__chapter-header"><span>02 · ASK WHAT MATTERS</span><h3>Estimate importance as a visible transformation</h3><p>With θ* available, the earlier-task model and estimation data produce parameter-wise weights. The result changes how strongly later movement is discouraged.</p></header><div className="kit-ewc__importance"><div className="kit-ewc__importance-input"><span>INPUT</span><strong>θ* + task A estimation signal</strong><p>The earlier solution is fixed while sensitivity is estimated.</p></div><div className="kit-ewc__estimator" aria-label="Fisher importance estimation"><span>ESTIMATE</span><strong>Diagonal Fisher importance</strong><div><i /><i /><i /><i /></div><small>synthetic teaching profile</small></div><div className="kit-ewc__importance-output"><span>OUTPUT · F</span><ol><li><b>θ₁</b><i style={{ width: "84%" }} /><em>higher</em></li><li><b>θ₂</b><i style={{ width: "34%" }} /><em>lower</em></li><li><b>θ₃</b><i style={{ width: "62%" }} /><em>medium</em></li></ol></div></div><div className="kit-ewc__interpretation"><span>INTERPRETATION</span><p>These weights do not freeze the model. They prepare a later constraint in which equal parameter movements can carry unequal cost.</p></div><ExpandableDetail title="Inspect component responsibilities" summary="The reusable ResponsibilityMap remains available as a supporting audit view." level="supporting"><ResponsibilityMap spec={ewcResponsibilities} /></ExpandableDetail></section>
    <section id="ewc-stored" className="kit-demo__section"><h3>3. Store θ* and importance</h3><p>Retain both the reference parameters and the importance weights for learning later tasks.</p></section>
    <section id="ewc-task-b" className="kit-demo__section"><h3>4. Train task B</h3><p>The new task supplies its own objective, which is combined with the regularization penalty.</p><StateMachineExplorer spec={ewcStates} /></section>
    <section id="ewc-penalty" className="kit-demo__section"><h3>5. Form the EWC penalty</h3><p>The penalty discourages changes to parameters weighted as important for task A.</p><FormulaBlock formula="L(θ) = L_new(θ) + (λ / 2) Σᵢ Fᵢ (θᵢ − θ*ᵢ)²" description="Select a term to highlight its related object in the architecture diagram." terms={ewcFormulaTerms} onTermSelect={(id, relatedIds) => { setSelectedTerm(id); if (relatedIds?.length) document.getElementById(`architecture-node-${relatedIds[0]}`)?.scrollIntoView({ block: "nearest" }); }} /><p className="kit-demo__selection" aria-live="polite">{selectedTerm ? `Selected term: ${selectedTerm}` : "No formula term selected."}</p></section>
    <section id="ewc-update" className="kit-demo__section"><h3>6. Combine and update</h3><p>The optimizer receives the current-task and regularization signals, then updates the current parameter values.</p>
    <CompareView variants={[{ id: "new-task", title: "Current-task objective", summary: "Fits the new task examples." }, { id: "regularized", title: "EWC objective", summary: "Adds an importance-weighted constraint around stored parameters." }]} changes={["The regularized objective includes stored parameter importance and an earlier-task reference point."]} invariants={["Both variants optimize the current model on the new task."]} />
    <p>For example, the <TermRef entry={ewcKnowledge[0]} onOpenReference={openReference}>Fisher importance estimate</TermRef> weights the penalty around <TermRef entry={ewcKnowledge[1]} onOpenReference={openReference}>θ*</TermRef>.</p><ExpandableDetail title="Interpret the penalty carefully" level="advanced"><p>The method discourages changes according to the estimated importance weights; it does not mean every earlier parameter is frozen.</p></ExpandableDetail>
    <Button variant="secondary" onClick={() => { setReferenceId(null); setHubOpen(true); }}>Browse EWC references</Button>
    </section>
  </StickySystemView><KnowledgeDrawer entries={ewcKnowledge} open={hubOpen} selectedId={referenceId} onSelectedIdChange={setReferenceId} onClose={() => setHubOpen(false)} /></div>;
}
