import { useState } from "react";
import { ArchitectureExplorer } from "../../core/architecture";
import { ExpandableDetail, ReferenceHub, TermRef } from "../../core/reference";
import { FlowStepper } from "../../core/flow-stepper";
import { ProcessLoopExplorer } from "../../core/process-loop";
import { ResponsibilityMap } from "../../core/responsibility-map";
import { StateMachineExplorer } from "../../core/state-machine";
import { CompareView } from "../../optional/compare-view";
import { FormulaBlock } from "../../optional/formula";
import { SegmentedControl } from "../../foundation/controls/SegmentedControl";
import { InlineCallout } from "../../foundation/feedback/InlineCallout";
import { StickySystemView } from "../../foundation/layout/StickySystemView";
import {
  ewcArchitecture, ewcFormulaTerms, ewcProcess, ewcResponsibilities, ewcStates, ewcTerms,
  lwfArchitecture, lwfFlow, lwfProcess, lwfResponsibilities, lwfStates, lwfTerms,
} from "./data";

type DemoKind = "lwf" | "ewc";

const choices = [{ value: "lwf" as const, label: "LwF mini demo" }, { value: "ewc" as const, label: "EWC mini demo" }];
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

export default function App() {
  const [demo, setDemo] = useState<DemoKind>("lwf");
  return <main className="kit-demo"><header className="kit-demo__header"><div><p className="kit-demo__eyebrow">PAPERSKILLWORK · REUSABLE KIT</p><h1>Continual learning interaction patterns</h1><p>Two paper-shaped examples use the same data-driven interaction components.</p></div><SegmentedControl label="Choose example paper" value={demo} options={choices} onChange={setDemo} /></header><InlineCallout kind="note" title="About this local demo">The diagrams explain method structure. They contain no reported experiment values and do not replace a source-linked evidence audit.</InlineCallout>{demo === "lwf" ? <LwfDemo /> : <EwcDemo />}<footer className="kit-demo__footer">Source components are copied into each paper project by <code>tools/paper.py scaffold-kit</code>. Editing a paper's copy does not change this kit.</footer></main>;
}

function LwfDemo() {
  const [flowIndex, setFlowIndex] = useState(0);
  const flow = lwfFlow[flowIndex];
  return <div className="kit-demo__paper"><h2>Learning without Forgetting (LwF)</h2><p className="kit-demo__lead">A compact mechanism walkthrough from input to the next task's starting model.</p><StickySystemView visual={<ProcessLoopExplorer spec={lwfProcess} showProgress />}>
    <section id="lwf-architecture" className="kit-demo__section"><h3>1. Persistent model view</h3><p>The same model remains visible as we move from its branches to the learning update.</p><ArchitectureExplorer spec={lwfArchitecture} highlightedIds={flow.relatedIds} /></section>
    <section className="kit-demo__section"><h3>2. One training pass</h3><p>Select a step to highlight the related parts of the architecture above.</p><FlowStepper steps={lwfFlow} step={flowIndex} onStepChange={(_step, index) => setFlowIndex(index)} /></section>
    <section className="kit-demo__section"><h3>3. Who is responsible?</h3><ResponsibilityMap spec={lwfResponsibilities} /></section>
    <section className="kit-demo__section"><h3>4. Task-level state changes</h3><p>Advance through the legal phases; try jumping directly from the ready state to promotion.</p><StateMachineExplorer spec={lwfStates} /></section>
    <section className="kit-demo__section"><h3>5. Terms and supporting detail</h3><p>The <TermRef term={lwfTerms[0]} /> provides a target; <TermRef term={lwfTerms[1]} /> describes the old-response learning signal.</p><ExpandableDetail title="Why show both objectives?" summary="A supporting explanation, outside the main control flow." level="supporting"><p>One objective supplies the current-task learning signal, while the other compares old-class student outputs to the fixed teacher response.</p></ExpandableDetail></section>
    <section id="lwf-reference" className="kit-demo__section"><ReferenceHub items={lwfReferences} /></section>
  </StickySystemView></div>;
}

function EwcDemo() {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  return <div className="kit-demo__paper"><h2>Elastic Weight Consolidation (EWC)</h2><p className="kit-demo__lead">A second method shape uses the same process, state, and responsibility interfaces.</p><InlineCallout kind="paper-fact" title="Mechanism sketch">This example uses abstract task labels and no benchmark values. Confirm paper-specific notation and conditions against the source before reusing it.</InlineCallout><StickySystemView visual={<ProcessLoopExplorer spec={ewcProcess} showProgress />}>
    <section className="kit-demo__section"><h3>1. Parameter and objective structure</h3><ArchitectureExplorer spec={ewcArchitecture} /></section>
    <section className="kit-demo__section"><h3>2. Where each responsibility sits</h3><ResponsibilityMap spec={ewcResponsibilities} /></section>
    <section className="kit-demo__section"><h3>3. Task lifecycle</h3><StateMachineExplorer spec={ewcStates} /></section>
    <section className="kit-demo__section"><h3>4. Read the objective</h3><FormulaBlock formula="L(θ) = L_new(θ) + (λ / 2) Σᵢ Fᵢ (θᵢ − θ*ᵢ)²" description="Select a term to highlight its related object in the architecture diagram." terms={ewcFormulaTerms} onTermSelect={(id, relatedIds) => { setSelectedTerm(id); if (relatedIds?.length) document.getElementById(`architecture-node-${relatedIds[0]}`)?.scrollIntoView({ block: "nearest" }); }} /><p className="kit-demo__selection" aria-live="polite">{selectedTerm ? `Selected term: ${selectedTerm}` : "No formula term selected."}</p></section>
    <section className="kit-demo__section"><CompareView variants={[{ id: "new-task", title: "Current-task objective", summary: "Fits the new task examples." }, { id: "regularized", title: "EWC objective", summary: "Adds an importance-weighted constraint around stored parameters." }]} changes={["The regularized objective includes stored parameter importance and an earlier-task reference point."]} invariants={["Both variants optimize the current model on the new task."]} /></section>
    <section className="kit-demo__section"><p>For example, the <TermRef term={ewcTerms[0]} /> weights the penalty around <TermRef term={ewcTerms[1]} />.</p><ExpandableDetail title="Interpret the penalty carefully" level="advanced"><p>The method discourages changes according to the estimated importance weights; it does not mean every earlier parameter is frozen.</p></ExpandableDetail></section>
    <section className="kit-demo__section"><ReferenceHub items={ewcReferences} /></section>
  </StickySystemView></div>;
}
