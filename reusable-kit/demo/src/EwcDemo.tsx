import { useState } from "react";
import { ExpandableDetail, TermRef } from "../../core/reference";
import { CompareView } from "../../optional/compare-view";
import { FormulaBlock } from "../../optional/formula";
import { ResponsibilityMap } from "../../core/responsibility-map";
import { StateMachineExplorer } from "../../core/state-machine";
import { Button } from "../../foundation/controls/Button";
import { InlineCallout } from "../../foundation/feedback/InlineCallout";
import { StickySystemView, useStickyStepSync } from "../../foundation/layout/StickySystemView";
import { DiagramFlow } from "../../foundation/layout/DiagramFlow";
import { MetaList } from "../../foundation/data/MetaList";
import { FigureFrame } from "../../compositions/figure-frame";
import { SectionHeader } from "../../compositions/section-header";
import { StepNav } from "../../compositions/step-nav";
import { ewcFormulaTerms, ewcResponsibilities, ewcStates } from "./data";
import { ewcNavItems, ewcSystemGraph, ewcSystemSteps, ewcTaskAGraph } from "./figures";
import { ewcKnowledge } from "./knowledge";
import { KnowledgeDrawer } from "./KnowledgeDrawer";

export const ewcSections = [
  { id: "ewc-task-a", stepId: "old", title: "Learn task A" },
  { id: "ewc-importance", stepId: "estimate", title: "Estimate importance" },
  { id: "ewc-stored", stepId: "store", title: "Store earlier-task state" },
  { id: "ewc-task-b", stepId: "new-task", title: "Train task B" },
  { id: "ewc-penalty", stepId: "penalty", title: "Form the EWC penalty" },
  { id: "ewc-update", stepId: "combine", title: "Combine and update" },
];

const thetaStar = <span className="rk-math"><var>θ</var><sup>*</sup></span>;
const fisher = <span className="rk-math"><var>F</var></span>;

export function EwcDemo() {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [hubOpen, setHubOpen] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const openReference = (entryId: string) => { setReferenceId(entryId); setHubOpen(true); };
  const updateFromStepId = (stepId: string) => {
    const index = ewcSystemSteps.findIndex((item) => item.id === stepId);
    if (index >= 0) setStepIndex(index);
  };
  return <div className="kit-demo__paper kit-method-page kit-ewc" data-demo-view="ewc">
    <header className="kit-ewc__hero">
      <p className="kit-ewc__eyebrow"><span>Elastic Weight Consolidation</span><i aria-hidden="true" /><span>参数重要性</span></p>
      <h2>模型再次学习时，<em>哪些参数不该乱动</em></h2>
      <div className="kit-ewc__hero-foot">
        <p className="kit-ewc__lead">先学 task A，只有那个解存在之后，才谈得上估计哪些参数值得保护，并在 task B 上为更大的改动收取更高代价。</p>
        <p className="kit-ewc__question"><b>当前问题</b><span>训练 task B 时，凭什么判断哪些参数不能动？</span></p>
      </div>
    </header>
    <StickySystemView sections={ewcSections} onActiveSectionChange={(section) => { if (section.stepId) updateFromStepId(section.stepId); }} visual={<EwcSystemPanel step={stepIndex} onStepChange={setStepIndex} />}>
      <section id="ewc-task-a" className="kit-demo__section">
        <SectionHeader index="01" eyebrow="Establish the reference" title="Learn task A before anything can be protected" lead={<>The model updates its current parameters while fitting task A. At this moment, Fisher importance and the EWC penalty do not exist yet.</>} />
        <FigureFrame label="Figure 2 · Stage output" title="Task A produces a reference, not a constraint" note="θ* is a numeric reference. Importance is estimated afterwards, from that solution.">
          <DiagramFlow spec={ewcTaskAGraph} label="Task A training: data updates trainable parameters and produces the stored reference theta star" framed={false} />
        </FigureFrame>
        <InlineCallout kind="paper-fact" title="Mechanism sketch">Abstract task labels and a synthetic importance profile; no benchmark values and no source citations yet.</InlineCallout>
      </section>
      <section id="ewc-importance" className="kit-demo__section">
        <SectionHeader index="02" eyebrow="Ask what matters" title="Estimate importance as a visible transformation" lead={<>With θ* available, the earlier-task model and its estimation signal produce one weight per parameter. The result changes how strongly later movement is discouraged.</>} />
        <FigureFrame label="Figure 3 · Importance" title="From a stored solution to per-parameter weights" note="These weights do not freeze anything. They set the price of movement in the next stage.">
          <div className="kit-ewc__estimate">
            <div className="kit-ewc__estimate-col">
              <p className="kit-ewc__estimate-label">Input</p>
              <p className="kit-ewc__estimate-title">{thetaStar} + task A estimation signal</p>
              <p className="kit-ewc__estimate-body">The earlier solution is held fixed while sensitivity is measured.</p>
            </div>
            <div className="kit-ewc__estimate-col is-middle">
              <p className="kit-ewc__estimate-label">Estimate</p>
              <p className="kit-ewc__estimate-title">Diagonal Fisher importance</p>
              <div className="kit-ewc__estimate-orbs" aria-hidden="true"><i /><i /><i /><i /></div>
              <p className="kit-ewc__estimate-body">A synthetic teaching profile, not paper data.</p>
            </div>
            <div className="kit-ewc__estimate-col">
              <p className="kit-ewc__estimate-label">Output · {fisher}</p>
              <ul className="kit-ewc__estimate-bars">
                <li><b>θ₁</b><span><i style={{ width: "84%" }} /></span><em>0.84</em></li>
                <li><b>θ₂</b><span><i style={{ width: "34%" }} /></span><em>0.34</em></li>
                <li><b>θ₃</b><span><i style={{ width: "62%" }} /></span><em>0.62</em></li>
              </ul>
            </div>
          </div>
        </FigureFrame>
        <ExpandableDetail title="Inspect component responsibilities" summary="The reusable ResponsibilityMap stays available as a supporting audit view." level="supporting"><ResponsibilityMap spec={ewcResponsibilities} /></ExpandableDetail>
      </section>
      <section id="ewc-stored" className="kit-demo__section">
        <SectionHeader index="03" eyebrow="Keep it available" title="Two things are stored, and both stay fixed" lead="Neither the reference solution nor the importance weights are trained during the next task; they are read whenever the penalty is evaluated." />
        <MetaList label="Stored earlier-task state" items={[
          { id: "star", label: "Reference", value: <>Stored optimum {thetaStar} — the point the penalty pulls toward.</> },
          { id: "fisher", label: "Weights", value: <>Importance {fisher} — how much each parameter costs to move.</> },
          { id: "trainable", label: "Trainable", value: "Only the current parameters. The stored state is read-only." },
        ]} />
      </section>
      <section id="ewc-task-b" className="kit-demo__section">
        <SectionHeader index="04" eyebrow="Train task B" title="The new objective arrives, the constraint follows" lead="Task B supplies its own examples and loss. The stored state does not compete with it; it only changes what movement costs." />
        <StateMachineExplorer spec={ewcStates} />
      </section>
      <section id="ewc-penalty" className="kit-demo__section">
        <SectionHeader index="05" eyebrow="Form the penalty" title="Equal movement, unequal cost" lead={<>The penalty is quadratic in the distance from {thetaStar} and weighted by {fisher}: the same numerical change costs more where the earlier task was more sensitive.</>} />
        <FormulaBlock formula="L(θ) = L_new(θ) + (λ / 2) Σᵢ Fᵢ (θᵢ − θ*ᵢ)²" description="Select a term to highlight the object it belongs to." terms={ewcFormulaTerms} onTermSelect={(id) => setSelectedTerm(id)} />
        <p className="kit-demo__selection" aria-live="polite">{selectedTerm ? `Selected term: ${selectedTerm}` : "No formula term selected."}</p>
      </section>
      <section id="ewc-update" className="kit-demo__section">
        <SectionHeader index="06" eyebrow="Combine and update" title="One optimizer, two different signals" lead="The actual optimizer applies both; the two objectives answer different questions and stay visible as separate inputs." />
        <CompareView variants={[{ id: "new-task", title: "Current-task objective", summary: "Fits the new task examples." }, { id: "regularized", title: "EWC objective", summary: "Adds an importance-weighted constraint around stored parameters." }]} changes={["The regularized objective includes stored parameter importance and an earlier-task reference point."]} invariants={["Both variants optimize the current model on the new task."]} />
        <p>The <TermRef entry={ewcKnowledge[0]} onOpenReference={openReference}>Fisher importance estimate</TermRef> weights the penalty around <TermRef entry={ewcKnowledge[1]} onOpenReference={openReference}>θ*</TermRef>.</p>
        <ExpandableDetail title="Interpret the penalty carefully" level="advanced"><p>The method discourages changes according to the estimated importance weights; it does not mean every earlier parameter is frozen.</p></ExpandableDetail>
        <div className="kit-section-foot">
          <p className="kit-section-foot__note">The consolidated θ is the model a later task would regularize again.</p>
          <Button variant="secondary" onClick={() => { setReferenceId(null); setHubOpen(true); }}>查看 EWC 参考条目</Button>
        </div>
      </section>
    </StickySystemView>
    <KnowledgeDrawer entries={ewcKnowledge} open={hubOpen} selectedId={referenceId} onSelectedIdChange={setReferenceId} onClose={() => setHubOpen(false)} />
  </div>;
}

function EwcSystemPanel({ step, onStepChange }: { step: number; onStepChange: (step: number) => void }) {
  const stickySync = useStickyStepSync();
  const index = Math.max(0, Math.min(step, ewcSystemSteps.length - 1));
  const current = ewcSystemSteps[index];
  const choose = (stepId: string) => {
    const next = ewcSystemSteps.findIndex((item) => item.id === stepId);
    if (next < 0) return;
    onStepChange(next);
    stickySync?.setManualStep(stepId);
  };
  return <div className="kit-ewc-panel" data-focus-step={current.id}>
    <FigureFrame
      label="Whole-system view · 全系统视图"
      title={current.title}
      counter={{ index: index + 1, total: ewcSystemSteps.length }}
      note={current.note}
      footer={<StepNav items={ewcNavItems} activeId={current.id} onSelect={choose} label="Choose the EWC step to inspect" />}
    >
      <DiagramFlow spec={ewcSystemGraph} focus={{ nodes: current.nodes, edges: current.edges }} label="EWC whole-system view: task A produces a stored reference and importance weights, which regularize the task B update" framed={false} />
    </FigureFrame>
  </div>;
}
