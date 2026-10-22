import { useState } from "react";
import { ArchitectureExplorer } from "../../core/architecture";
import { ExpandableDetail, ReferenceHub, TermRef } from "../../core/reference";
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
import { StickySystemView } from "../../foundation/layout/StickySystemView";
import { Drawer } from "../../foundation/overlay/Drawer";
import { Popover } from "../../foundation/overlay/Popover";
import {
  ewcArchitecture, ewcFormulaTerms, ewcProcess, ewcResponsibilities, ewcStates, ewcTerms,
  lwfArchitecture, lwfFlow, lwfProcess, lwfResponsibilities, lwfStates, lwfTerms,
} from "./data";

type DemoKind = "lab" | "lwf" | "ewc";

const choices = [
  { value: "lab" as const, label: "Component Lab" },
  { value: "lwf" as const, label: "LwF scenario" },
  { value: "ewc" as const, label: "EWC scenario" },
];
const lwfReferences = [
  { id: "teacher", title: "Teacher", kind: "term" as const, summary: "Fixed previous-task model that provides output targets.", tags: ["model", "old task"] },
  { id: "distillation", title: "Distillation objective", kind: "method" as const, summary: "Output-based signal for retaining old responses.", tags: ["loss", "function"] },
  { id: "heads", title: "Task-specific heads", kind: "implementation" as const, summary: "Separate output branches associated with different task label sets.", tags: ["architecture"] },
];
const ewcReferences = [
  { id: "fisher", title: "Fisher importance", kind: "term" as const, summary: "Parameter-wise weights used in the regularizer.", tags: ["importance", "regularizer"] },
  { id: "optimum", title: "Earlier-task optimum", kind: "symbol" as const, summary: "Reference parameter values stored from the earlier task.", tags: ["parameters"] },
  { id: "penalty", title: "Quadratic penalty", kind: "formula" as const, summary: "Importance-weighted cost for moving away from the stored solution.", tags: ["loss"] },
];
const lwfSections = [
  { id: "lwf-problem", stepId: "arrive" },
  { id: "lwf-teacher", stepId: "teacher" },
  { id: "lwf-forward", stepId: "forward" },
  { id: "lwf-loss", stepId: "loss" },
  { id: "lwf-update", stepId: "update" },
];
const ewcSections = [
  { id: "ewc-task-a", stepId: "old" },
  { id: "ewc-importance", stepId: "estimate" },
  { id: "ewc-stored", stepId: "store" },
  { id: "ewc-task-b", stepId: "new-task" },
  { id: "ewc-penalty", stepId: "penalty" },
  { id: "ewc-update", stepId: "combine" },
];

export default function App() {
  const [demo, setDemo] = useState<DemoKind>("lab");
  return <main className="kit-demo"><header className="kit-demo__header"><div><p className="kit-demo__eyebrow">PAPERSKILLWORK · REUSABLE KIT</p><h1>Component Lab and real-content scenarios</h1><p>Inspect Foundation states first, then exercise two paper-shaped combinations built from the same Kit source.</p></div><SegmentedControl label="Choose demo view" value={demo} options={choices} onChange={setDemo} /></header><InlineCallout kind="note" title="Candidate status">These examples are implementation and review evidence. They do not become approved components until browser screenshots and human visual review are complete.</InlineCallout>{demo === "lab" ? <ComponentLab /> : demo === "lwf" ? <LwfDemo /> : <EwcDemo />}<footer className="kit-demo__footer">Source components are copied into each paper project by <code>tools/paper.py scaffold-kit</code>. Editing a paper's copy does not change this kit.</footer></main>;
}

function ComponentLab() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(36);
  return <div className="kit-demo__paper kit-lab" data-demo-view="component-lab">
    <section className="kit-lab__intro"><p className="rk-type--meta">FOUNDATION V2 · CANDIDATE</p><h2 className="rk-type--heading-1">Readable defaults with bounded variants</h2><p className="rk-type--body">中文正文、English labels、数学符号 θᵢ and code-like IDs share a deliberate hierarchy. Resize the page to inspect wrapping rather than shrinking the content.</p></section>
    <section className="rk-surface" aria-labelledby="lab-type-title"><header className="rk-surface__header"><h3 id="lab-type-title" className="rk-type--heading-2">Typography roles</h3><p className="rk-type--supporting">Semantic roles expose a small token set; paper themes may replace the family and colors.</p></header><div className="kit-lab__type-stack"><p className="rk-type--display">Display / 开篇标题</p><p className="rk-type--heading-1">Heading 1 / 页面标题</p><p className="rk-type--heading-2">Heading 2 / 章节标题</p><p className="rk-type--heading-3">Heading 3 / 内部小节</p><p className="rk-type--body">Body — 主要解释用于连续阅读，包含 Fisher Information、xₜ 和中文标点。</p><p className="rk-type--supporting">Supporting — 图旁说明和辅助信息。</p><p className="rk-type--caption">Caption — Figure 2. Source-bound summary with enough line height.</p><p className="rk-type--diagram-label">Diagram label — Gradient ∇L</p><p className="rk-type--meta">META · VERSION 2 CANDIDATE</p></div></section>
    <section className="rk-surface rk-surface--soft" aria-labelledby="lab-button-title"><header className="rk-surface__header"><h3 id="lab-button-title" className="rk-type--heading-2">Buttons and controls</h3><p className="rk-type--supporting">Variants retain alignment across English, Chinese, icons, long text, and disabled states.</p></header><div className="kit-lab__button-grid"><Button>Primary action</Button><Button variant="secondary">次要操作</Button><Button variant="quiet">Quiet action</Button><Button variant="danger">Delete draft</Button><Button size="small">Small</Button><Button disabled>Unavailable</Button><Button variant="secondary" iconOnly aria-label="Add reference">＋</Button><Button className="kit-lab__long-button">A deliberately long action label that wraps in a narrow container</Button></div><div className="kit-lab__control-row"><Chip active>Selected chip</Chip><Chip tone="good">Verified</Chip><Slider label="Example threshold" value={sliderValue} displayValue={`${sliderValue}%`} onChange={setSliderValue} /></div></section>
    <section className="rk-surface" aria-labelledby="lab-overlay-title"><header className="rk-surface__header"><h3 id="lab-overlay-title" className="rk-type--heading-2">Overlay contracts</h3><p className="rk-type--supporting">Popover remains viewport-safe; the reading Drawer has room for composed two-column content on wide screens.</p></header><div className="kit-lab__button-grid"><Popover label="Compact supporting detail" trigger="Open viewport-safe popover"><p>This supporting detail is intentionally compact. Escape and outside press dismiss it.</p></Popover><Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open reading Drawer</Button></div></section>
    <Drawer open={drawerOpen} title="Reading Drawer" size="reading" onClose={() => setDrawerOpen(false)}><div className="kit-lab__reading-grid"><aside className="rk-surface rk-surface--soft"><p className="rk-type--meta">ENTRY LIST</p><h3 className="rk-type--heading-3">Stable navigation column</h3><p className="rk-type--supporting">The wide contract reserves enough space for a list and a readable detail pane.</p></aside><article className="rk-surface"><p className="rk-type--meta">DETAIL</p><h3 className="rk-type--heading-2">Long-form reference content</h3><p className="rk-type--body">This is a layout contract demonstration, not the final Reference Hub. At narrow widths the columns collapse without horizontal page scrolling.</p></article></div></Drawer>
  </div>;
}

function LwfDemo() {
  const [flowIndex, setFlowIndex] = useState(0);
  const flow = lwfFlow[flowIndex];
  const updateFromStepId = (stepId: string) => {
    const index = lwfFlow.findIndex((item) => item.id === stepId);
    if (index >= 0) setFlowIndex(index);
  };
  return <div className="kit-demo__paper"><h2>Learning without Forgetting (LwF)</h2><p className="kit-demo__lead">Scroll the learning spine or select a step. The process view and stepper stay synchronized.</p><StickySystemView sections={lwfSections} onActiveSectionChange={(section) => { if (section.stepId) updateFromStepId(section.stepId); }} visual={<ProcessLoopExplorer spec={lwfProcess} showProgress onStepChange={(stepId) => updateFromStepId(stepId)} />}>
    <section id="lwf-problem" className="kit-demo__section"><h3>1. Problem: a new task arrives</h3><p>A new task introduces new labels while the model should retain useful behavior from earlier tasks. The teacher stays fixed during the current task.</p><InlineCallout kind="note" title="System state">The task changes; the old model supplies responses while a student learns the new task.</InlineCallout></section>
    <section id="lwf-teacher" className="kit-demo__section"><h3>2. Teacher: preserve an old response target</h3><p>The <TermRef term={lwfTerms[0]} /> evaluates the current input. Its old-class response becomes a target for the student; it is not jointly optimized.</p><ExpandableDetail title="What distillation means here" summary="A supporting definition." level="supporting"><p><TermRef term={lwfTerms[1]} /> compares student outputs with the fixed teacher response. That function-level signal is different from freezing all old parameters.</p></ExpandableDetail></section>
    <section id="lwf-forward" className="kit-demo__section"><h3>3. Forward: one shared backbone, two heads</h3><p>The student backbone θₛ branches into old-class θₒ and new-class θₙ heads. This spatial split represents the model's two output paths.</p><ArchitectureExplorer spec={lwfArchitecture} highlightedIds={flow.relatedIds} /></section>
    <section id="lwf-loss" className="kit-demo__section"><h3>4. Losses: preserve old outputs and learn new labels</h3><div className="kit-demo__loss-pairs"><p><b>Old response:</b> teacher target + student old output → L_old</p><p><b>Current task:</b> new label + student new output → L_new</p><p><b>Update signal:</b> L_old + L_new → backward gradients</p></div><ResponsibilityMap spec={lwfResponsibilities} /></section>
    <section id="lwf-update" className="kit-demo__section"><h3>5. Update: carry the student forward</h3><p>Both objectives contribute to the student update. At the task boundary, the updated student becomes the teacher for task t+1.</p><FlowStepper steps={lwfFlow} step={flowIndex} onStepChange={(step, index) => { setFlowIndex(index); }} /><h4>Task-level lifecycle</h4><p>Advance through the legal phases; try jumping directly from the ready state to promotion.</p><StateMachineExplorer spec={lwfStates} /><ReferenceHub items={lwfReferences} /></section>
  </StickySystemView></div>;
}

function EwcDemo() {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  return <div className="kit-demo__paper"><h2>Elastic Weight Consolidation (EWC)</h2><p className="kit-demo__lead">A second method shape uses the same process, state, and responsibility interfaces.</p><InlineCallout kind="paper-fact" title="Mechanism sketch">This example uses abstract task labels and no benchmark values. Confirm paper-specific notation and conditions against the source before reusing it.</InlineCallout><StickySystemView sections={ewcSections} visual={<ProcessLoopExplorer spec={ewcProcess} showProgress />}>
    <section id="ewc-task-a" className="kit-demo__section"><h3>1. Learn task A</h3><p>Train an earlier-task solution θ* before estimating which parameters matter to its performance.</p><ArchitectureExplorer spec={ewcArchitecture} /></section>
    <section id="ewc-importance" className="kit-demo__section"><h3>2. Estimate parameter importance</h3><p>The Fisher information estimate assigns relative importance to parameters after task A.</p><ResponsibilityMap spec={ewcResponsibilities} /></section>
    <section id="ewc-stored" className="kit-demo__section"><h3>3. Store θ* and importance</h3><p>Retain both the reference parameters and the importance weights for learning later tasks.</p></section>
    <section id="ewc-task-b" className="kit-demo__section"><h3>4. Train task B</h3><p>The new task supplies its own objective, which is combined with the regularization penalty.</p><StateMachineExplorer spec={ewcStates} /></section>
    <section id="ewc-penalty" className="kit-demo__section"><h3>5. Form the EWC penalty</h3><p>The penalty discourages changes to parameters weighted as important for task A.</p><FormulaBlock formula="L(θ) = L_new(θ) + (λ / 2) Σᵢ Fᵢ (θᵢ − θ*ᵢ)²" description="Select a term to highlight its related object in the architecture diagram." terms={ewcFormulaTerms} onTermSelect={(id, relatedIds) => { setSelectedTerm(id); if (relatedIds?.length) document.getElementById(`architecture-node-${relatedIds[0]}`)?.scrollIntoView({ block: "nearest" }); }} /><p className="kit-demo__selection" aria-live="polite">{selectedTerm ? `Selected term: ${selectedTerm}` : "No formula term selected."}</p></section>
    <section id="ewc-update" className="kit-demo__section"><h3>6. Combine and update</h3><p>The optimizer receives the current-task and regularization signals, then updates the current parameter values.</p>
    <CompareView variants={[{ id: "new-task", title: "Current-task objective", summary: "Fits the new task examples." }, { id: "regularized", title: "EWC objective", summary: "Adds an importance-weighted constraint around stored parameters." }]} changes={["The regularized objective includes stored parameter importance and an earlier-task reference point."]} invariants={["Both variants optimize the current model on the new task."]} />
    <p>For example, the <TermRef term={ewcTerms[0]} /> weights the penalty around <TermRef term={ewcTerms[1]} />.</p><ExpandableDetail title="Interpret the penalty carefully" level="advanced"><p>The method discourages changes according to the estimated importance weights; it does not mean every earlier parameter is frozen.</p></ExpandableDetail>
    <ReferenceHub items={ewcReferences} />
    </section>
  </StickySystemView></div>;
}
