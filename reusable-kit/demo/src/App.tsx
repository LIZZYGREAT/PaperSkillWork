import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
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
import { Drawer } from "../../foundation/overlay/Drawer";
import { Popover } from "../../foundation/overlay/Popover";
import {
  ewcFormulaTerms, ewcProcess, ewcResponsibilities, ewcStates,
  lwfFlow, lwfResponsibilities, lwfStates,
} from "./data";
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
  { id: "lab-overlay-title", title: "Overlay contracts" },
];
const lwfSections = [
  { id: "lwf-problem", stepId: "arrive", title: "A new task arrives" },
  { id: "lwf-teacher", stepId: "teacher", title: "Keep the old model fixed" },
  { id: "lwf-forward", stepId: "forward", title: "Run both model paths" },
  { id: "lwf-loss", stepId: "loss", title: "Form the two losses" },
  { id: "lwf-update", stepId: "update", title: "Update the student" },
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
  return <div className="kit-demo__paper kit-lab" data-demo-view="component-lab">
    <section className="kit-lab__intro"><p className="rk-type--meta">FOUNDATION V2 · CANDIDATE</p><h2 className="rk-type--heading-1">Readable defaults with bounded variants</h2><p className="rk-type--body">中文正文、English labels、数学符号 θᵢ and code-like IDs share a deliberate hierarchy. Resize the page to inspect wrapping rather than shrinking the content.</p></section>
    <InlineCallout kind="note" title="Candidate status">Warm Editorial and Clear Research are review candidates. Neither becomes an approved Kit default until screenshot review and explicit human acceptance.</InlineCallout>
    <section className="rk-surface" aria-labelledby="lab-type-title"><header className="rk-surface__header"><h3 id="lab-type-title" className="rk-type--heading-2">Typography roles</h3><p className="rk-type--supporting">Semantic roles expose a small token set; paper themes may replace the family and colors.</p></header><div className="kit-lab__type-stack"><p className="rk-type--display">Display / 开篇标题</p><p className="rk-type--heading-1">Heading 1 / 页面标题</p><p className="rk-type--heading-2">Heading 2 / 章节标题</p><p className="rk-type--heading-3">Heading 3 / 内部小节</p><p className="rk-type--body">Body — 主要解释用于连续阅读，包含 Fisher Information、xₜ 和中文标点。</p><p className="rk-type--supporting">Supporting — 图旁说明和辅助信息。</p><p className="rk-type--caption">Caption — Figure 2. Source-bound summary with enough line height.</p><p className="rk-type--diagram-label">Diagram label — Gradient ∇L</p><p className="rk-type--meta">META · VERSION 2 CANDIDATE</p></div></section>
    <section className="rk-surface rk-surface--soft" aria-labelledby="lab-button-title"><header className="rk-surface__header"><h3 id="lab-button-title" className="rk-type--heading-2">Buttons and controls</h3><p className="rk-type--supporting">Variants retain alignment across English, Chinese, icons, long text, and disabled states.</p></header><div className="kit-lab__button-grid"><Button>Primary action</Button><Button variant="secondary">次要操作</Button><Button variant="quiet">Quiet action</Button><Button variant="danger">Delete draft</Button><Button size="small">Small</Button><Button disabled>Unavailable</Button><Button variant="secondary" iconOnly aria-label="Add reference">＋</Button><Button className="kit-lab__long-button">A deliberately long action label that wraps in a narrow container</Button></div><div className="kit-lab__control-row"><Chip active>Selected chip</Chip><Chip tone="good">Verified</Chip><Slider label="Example threshold" value={sliderValue} displayValue={`${sliderValue}%`} onChange={setSliderValue} /></div></section>
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
  return <div className="kit-demo__paper kit-method-page kit-lwf" data-demo-view="lwf"><StickySystemView sections={lwfSections} onActiveSectionChange={(section) => { if (section.stepId) updateFromStepId(section.stepId); }} visual={<div className="kit-lwf__opening"><header className="kit-lwf__hero"><p>LEARNING WITHOUT FORGETTING · RESPONSE PRESERVATION</p><h2>Keep an old behavior visible while the student learns something new</h2><span>Follow one causal question at a time. The visual removes unrelated edges instead of shrinking a complete topology into the frame.</span><div className="kit-lwf__premise"><b>THE QUESTION</b><p>Can the student learn current labels while its earlier response remains available?</p></div></header><LwfFocusVisual step={flowIndex} onStepChange={setFlowIndex} /></div>}>
    <section id="lwf-problem" className="kit-demo__section"><h3>1. Problem: a new task arrives</h3><p>A new task introduces new labels while the model should retain useful behavior from earlier tasks. The teacher stays fixed during the current task.</p><InlineCallout kind="note" title="System state">The task changes; the old model supplies responses while a student learns the new task.</InlineCallout></section>
    <section id="lwf-teacher" className="kit-demo__section"><h3>2. Teacher: preserve an old response target</h3><p>The <TermRef entry={lwfKnowledge[0]} onOpenReference={openReference}>teacher</TermRef> evaluates the current input. Its old-class response becomes a target for the student; it is not jointly optimized.</p><ExpandableDetail title="What distillation means here" summary="A supporting definition." level="supporting"><p><TermRef entry={lwfKnowledge[1]} onOpenReference={openReference}>distillation objective</TermRef> compares student outputs with the fixed teacher response. That function-level signal is different from freezing all old parameters.</p></ExpandableDetail></section>
    <section id="lwf-forward" className="kit-demo__section kit-lwf__chapter"><header><span>03 · TWO PURPOSES, ONE STUDENT</span><h3>Separate the teacher target from the student's two outputs</h3><p>The fixed teacher contributes only an old-response target. The trainable student produces an old-class response and a new-class response from its shared backbone.</p></header><LwfModelLanes /></section>
    <section id="lwf-loss" className="kit-demo__section kit-lwf__chapter"><header><span>04 · OBJECTIVES MEET</span><h3>Two comparisons create one update signal</h3><p>The losses answer different questions. Their gradients meet only after each comparison is understandable on its own.</p></header><LwfObjectiveComposer /><ExpandableDetail title="Inspect the responsibility audit" summary="Open the reusable map only when you need a component-by-component ownership check." level="supporting"><ResponsibilityMap spec={lwfResponsibilities} /></ExpandableDetail></section>
    <section id="lwf-update" className="kit-demo__section"><h3>5. Update: carry the student forward</h3><p>Both objectives contribute to the student update. At the task boundary, the updated student becomes the teacher for task t+1.</p><FlowStepper steps={lwfFlow} step={flowIndex} onStepChange={(step, index) => { setFlowIndex(index); }} /><h4>Task-level lifecycle</h4><p>Advance through the legal phases; try jumping directly from the ready state to promotion.</p><StateMachineExplorer spec={lwfStates} /><Button variant="secondary" onClick={() => { setReferenceId(null); setHubOpen(true); }}>Browse LwF references</Button></section>
  </StickySystemView><KnowledgeDrawer entries={lwfKnowledge} open={hubOpen} selectedId={referenceId} onSelectedIdChange={setReferenceId} onClose={() => setHubOpen(false)} /></div>;
}

const lwfFocusCopy = [
  { id: "arrive", tab: "New task", title: "A new task enters an existing system", note: "Start with the conflict: learn the current labels without discarding the earlier response." },
  { id: "teacher", tab: "Keep teacher fixed", title: "The old model becomes a fixed response provider", note: "Only the teacher path is in focus. No update enters this model during the task." },
  { id: "forward", tab: "Run two paths", title: "Teacher and student see the same input for different reasons", note: "The teacher supplies a target; the student supplies the responses that will be trained." },
  { id: "loss", tab: "Form two losses", title: "Two objectives, one student update", note: "Old-response preservation and current-task learning stay visually distinct until their gradients combine." },
  { id: "update", tab: "Carry forward", title: "Update the student, then promote it at the task boundary", note: "The teacher remains fixed during learning; promotion happens only after the student update is complete." },
];

function LwfFocusVisual({ step, onStepChange }: { step: number; onStepChange: (step: number) => void }) {
  const stickySync = useStickyStepSync();
  const current = lwfFocusCopy[Math.max(0, Math.min(step, lwfFocusCopy.length - 1))];
  const choose = (index: number) => {
    onStepChange(index);
    stickySync?.setManualStep(lwfFocusCopy[index].id);
  };
  return <section className="kit-lwf-focus" aria-label="Focused LwF mechanism" data-focus-step={current.id}>
    <header><div><span>FOCUSED SYSTEM VIEW</span><h3 className="kit-lwf-focus__title">{current.title}</h3><p>{current.note}</p></div><strong>{String(step + 1).padStart(2, "0")} / 05</strong></header>
    <nav aria-label="Choose LwF focus step">{lwfFocusCopy.map((item, index) => <button key={item.id} type="button" aria-pressed={index === step} onClick={() => choose(index)}><i>{String(index + 1).padStart(2, "0")}</i><span>{item.tab}</span></button>)}</nav>
    <LwfFocusScene stepId={current.id} />
  </section>;
}

function LwfFocusScene({ stepId }: { stepId: string }) {
  if (stepId === "arrive") return <div className="kit-lwf-scene kit-lwf-scene--arrive"><article className="is-input"><span>NEW CONDITION</span><strong>Current task xₜ, yₜ</strong><small>new examples and labels</small></article><b aria-hidden="true">→</b><div className="kit-lwf-scene__question"><span>LEARNING CONFLICT</span><strong>Change the student</strong><em>without losing the earlier response</em></div></div>;
  if (stepId === "teacher") return <div className="kit-lwf-scene kit-lwf-scene--teacher"><article className="is-input"><span>SAME INPUT</span><strong>xₜ</strong></article><b aria-hidden="true">→</b><article className="is-frozen"><span>FROZEN</span><strong>Fixed teacher</strong><small>no parameter update</small></article><b aria-hidden="true">→</b><article className="is-target"><span>OUTPUT</span><strong>Old-response target</strong><small>what the student should preserve</small></article></div>;
  if (stepId === "forward") return <div className="kit-lwf-scene kit-lwf-scene--forward"><div className="kit-lwf-scene__shared-input"><span>SHARED INPUT</span><strong>xₜ</strong></div><div className="kit-lwf-scene__lanes"><article><span>REFERENCE LANE · FROZEN</span><div><b>Teacher</b><i aria-hidden="true">→</i><b>Old target</b></div></article><article><span>LEARNING LANE · TRAINABLE</span><div><b>Student backbone</b><i aria-hidden="true">→</i><b>Old head + new head</b></div></article></div></div>;
  if (stepId === "loss") return <div className="kit-lwf-scene kit-lwf-scene--loss"><article className="is-preserve"><span>PRESERVE</span><strong>teacher target ↔ student old output</strong><small>L_old</small></article><article className="is-learn"><span>LEARN</span><strong>current label ↔ student new output</strong><small>L_new</small></article><b aria-hidden="true">↓</b><div><span>COMBINE AFTER COMPARISON</span><strong>∇L_old + ∇L_new</strong></div></div>;
  return <div className="kit-lwf-scene kit-lwf-scene--update"><div className="kit-lwf-scene__signal"><span>COMBINED SIGNAL</span><strong>∇L_old + ∇L_new</strong></div><b aria-hidden="true">→</b><article className="is-student"><span>UPDATE</span><strong>Trainable student</strong></article><b aria-hidden="true">→</b><article className="is-promote"><span>TASK BOUNDARY</span><strong>Next teacher</strong><small>promotion, not joint training</small></article></div>;
}

function LwfModelLanes() {
  return <div className="kit-lwf-lanes" role="img" aria-label="Fixed teacher lane produces the old response target while the trainable student lane branches into old and new class outputs">
    <div className="kit-lwf-lanes__input"><span>SAME INPUT</span><strong>xₜ</strong></div>
    <section className="kit-lwf-lanes__lane is-teacher"><header><span>REFERENCE LANE</span><b>Frozen for this task</b></header><div><strong>Fixed teacher</strong><i aria-hidden="true">→</i><strong>Old-response target</strong></div><p>Produces the behavior to preserve.</p></section>
    <section className="kit-lwf-lanes__lane is-student"><header><span>LEARNING LANE</span><b>Receives gradients</b></header><div><strong>Student backbone θₛ</strong><i aria-hidden="true">→</i><span><b>Old-class output</b><b>New-class output</b></span></div><p>Produces both trainable comparisons.</p></section>
  </div>;
}

function LwfObjectiveComposer() {
  return <div className="kit-lwf-objectives">
    <div className="kit-lwf-objectives__pair"><article className="is-preserve"><span>OLD BEHAVIOR</span><h4>Preserve the response</h4><p>Teacher target <b>compared with</b> student old output</p><strong>L_old</strong></article><article className="is-learn"><span>CURRENT TASK</span><h4>Learn the new labels</h4><p>Current label <b>compared with</b> student new output</p><strong>L_new</strong></article></div>
    <div className="kit-lwf-objectives__merge"><i aria-hidden="true">↘</i><div><span>SHARED DESTINATION</span><strong>Both gradients update the student</strong><p>The teacher remains fixed; the optimizer changes only trainable student parameters.</p></div><i aria-hidden="true">↙</i></div>
    <dl><div><dt>Teacher</dt><dd>supplies the old target</dd></div><div><dt>Student</dt><dd>supplies old and new outputs</dd></div><div><dt>Objectives</dt><dd>state what to preserve and learn</dd></div><div><dt>Optimizer</dt><dd>applies the combined update</dd></div></dl>
  </div>;
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
    <section id="ewc-task-a" className="kit-demo__section kit-ewc__chapter"><header className="kit-ewc__chapter-header"><span>01 · ESTABLISH THE REFERENCE</span><h3>Learn task A before anything can be protected</h3><p>The model updates its current parameters while fitting task A. At this moment, Fisher importance and the EWC penalty do not exist yet.</p></header><div className="kit-ewc__task-a-visual" role="img" aria-label="Task A data updates a trainable parameter field and produces the stored solution theta star"><div className="kit-ewc__source"><span>TASK A</span><strong>examples + objective</strong><small>available now</small></div><span className="kit-ewc__flow" aria-hidden="true">→</span><div className="kit-ewc__parameter-field"><span>TRAINABLE PARAMETERS θ</span><div className="kit-ewc__parameter-row"><i style={{ "--parameter-level": "76%" } as CSSProperties} /><i style={{ "--parameter-level": "38%" } as CSSProperties} /><i style={{ "--parameter-level": "58%" } as CSSProperties} /><i style={{ "--parameter-level": "88%" } as CSSProperties} /><i style={{ "--parameter-level": "46%" } as CSSProperties} /></div><small>updates continue while task A is learned</small></div><span className="kit-ewc__flow" aria-hidden="true">→</span><div className="kit-ewc__result"><span>PRODUCED AT STAGE END</span><strong>stored solution θ*</strong><small>reference values only; importance is next</small></div></div><div className="kit-ewc__handoff"><span>What this stage hands forward</span><p>A parameter reference θ* that can later be paired with an importance estimate. No future penalty is active in this stage.</p></div></section>
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
