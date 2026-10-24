import { useEffect, useState } from "react";
import { ExpandableDetail, TermRef } from "../../core/reference";
import { FlowStepper } from "../../core/flow-stepper";
import { ResponsibilityMap } from "../../core/responsibility-map";
import { StateMachineExplorer } from "../../core/state-machine";
import { Button } from "../../foundation/controls/Button";
import { InlineCallout } from "../../foundation/feedback/InlineCallout";
import { StickySystemView, useStickyStepSync } from "../../foundation/layout/StickySystemView";
import { DiagramFlow } from "../../foundation/layout/DiagramFlow";
import { FigureFrame } from "../../compositions/figure-frame";
import { SectionHeader } from "../../compositions/section-header";
import { StepNav } from "../../compositions/step-nav";
import { ComponentLab, labSections } from "./ComponentLab";
import { EwcDemo, ewcSections } from "./EwcDemo";
import { KnowledgeDrawer } from "./KnowledgeDrawer";
import { lwfFlow, lwfResponsibilities, lwfStates } from "./data";
import { labNavItems, lwfGraph, lwfGraphSteps, lwfNavItems, lwfObjectiveGraph } from "./figures";
import { ewcKnowledge, lwfKnowledge } from "./knowledge";
import { EditorialStudies, editorialSections } from "./EditorialStudies";
import { EditorialJourney, journeySections } from "./EditorialJourney";

type DemoKind = "lab" | "lwf" | "ewc" | "editorial" | "journey";

const choices = [
  { value: "lab" as const, label: "Component Lab", description: "Typography, controls, overlays" },
  { value: "lwf" as const, label: "LwF scenario", description: "Preserving earlier responses" },
  { value: "ewc" as const, label: "EWC scenario", description: "Protecting important parameters" },
  { value: "editorial" as const, label: "Editorial studies", description: "三种编辑构图 · 待人工评审" },
  { value: "journey" as const, label: "Reading Journey", description: "完整阅读实验 · LwF" },
];
/** LwF sections, grouped so the rail can show the reading structure. */
const lwfGroups = [
  { id: "mechanism", label: "机制", hint: "WHY IT WORKS", sections: [
    { id: "lwf-problem", stepId: "arrive", index: "01", eyebrow: "新任务到达", title: "冲突从哪里开始", rail: "新任务到达" },
    { id: "lwf-teacher", stepId: "teacher", index: "02", eyebrow: "冻结 teacher", title: "只产出目标，不参与更新", rail: "冻结 teacher" },
    { id: "lwf-forward", stepId: "forward", index: "03", eyebrow: "两条路径", title: "同一个输入，两个输出头", rail: "两条计算路径" },
  ] },
  { id: "objective", label: "目标与更新", hint: "WHAT CHANGES", sections: [
    { id: "lwf-loss", stepId: "loss", index: "04", eyebrow: "目标汇合", title: "先各自比较，再合成为一次更新", rail: "两个损失汇合" },
    { id: "lwf-update", stepId: "update", index: "05", eyebrow: "更新与交接", title: "梯度落在 student，交接在任务边界", rail: "更新与交接" },
  ] },
];
const lwfSections = lwfGroups.flatMap((group) => group.sections.map(({ id, stepId, rail }) => ({ id, stepId, title: rail })));

export default function App() {
  const [demo, setDemo] = useState<DemoKind>(() => {
    const requested = new URLSearchParams(window.location.search).get("demo");
    return choices.find(choice => choice.value === requested)?.value ?? "lab";
  });
  const [activeSection, setActiveSection] = useState("lab-type-title");
  const [hubOpen, setHubOpen] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const sections = demo === "lab" ? labSections : demo === "lwf" ? lwfSections : demo === "editorial" ? editorialSections : demo === "journey" ? journeySections : ewcSections;
  const page = demo === "lab"
    ? { number: "01", breadcrumb: "Kit foundations", eyebrow: "PAGE 01 · COMPONENT FOUNDATIONS", title: "把论文机制拆成可读、可交互的组件", description: "Reusable components for turning research methods into clear, inspectable learning experiences." }
    : demo === "lwf"
      ? { number: "02", breadcrumb: "Learning without Forgetting", eyebrow: "PAGE 02 · LEARNING WITHOUT FORGETTING" }
      : demo === "journey" ? { number: "05", breadcrumb: "Reading Journey · 完整阅读实验", eyebrow: "PAGE 05 · READING JOURNEY" }
      : demo === "editorial"
        ? { number: "04", breadcrumb: "Editorial composition studies", eyebrow: "PAGE 04 · EDITORIAL STUDIES" }
        : { number: "03", breadcrumb: "Elastic Weight Consolidation", eyebrow: "PAGE 03 · ELASTIC WEIGHT CONSOLIDATION" };
  const referenceEntries = demo === "ewc" ? ewcKnowledge : lwfKnowledge;
  const activeIndex = Math.max(0, sections.findIndex((section) => section.id === activeSection));

  useEffect(() => {
    setActiveSection(sections[0]?.id ?? "");
    const selectedCourse = document.querySelector<HTMLElement>(".kit-sidebar__course.is-active");
    if (selectedCourse?.parentElement) selectedCourse.parentElement.scrollLeft = selectedCourse.offsetLeft - selectedCourse.parentElement.offsetLeft;
    const anchor = window.location.hash.slice(1);
    if (sections.some(section => section.id === anchor)) document.getElementById(anchor)?.scrollIntoView({ block: "start" });
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
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${sectionId}`);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };

  const chooseDemo = (value: DemoKind) => {
    const url = new URL(window.location.href);
    url.searchParams.set("demo", value);
    url.hash = "";
    window.history.replaceState(null, "", url);
    setDemo(value);
    window.scrollTo(0, 0);
  };

  return <div className="kit-shell" data-visual-direction="warm">
    <aside className="kit-sidebar">
      <a className="kit-sidebar__brand" href="#top" aria-label="PaperSkillWork reusable kit home">
        <span className="kit-sidebar__mark" aria-hidden="true">P</span><span><strong>PaperSkillWork</strong><small>REUSABLE KIT</small></span>
      </a>
      <nav className="kit-sidebar__courses" aria-label="Choose a learning demo">
        <p className="kit-sidebar__label">学习路径 <span>LEARNING PATH</span></p>
        {choices.map((choice, index) => <button key={choice.value} type="button" aria-label={choice.label} aria-current={demo === choice.value ? "page" : undefined} className={`kit-sidebar__course ${demo === choice.value ? "is-active" : ""}`} onClick={() => chooseDemo(choice.value)}>
          <span className="kit-sidebar__number">{String(index + 1).padStart(2, "0")}</span><span className="kit-sidebar__course-copy"><strong>{choice.label}</strong><small>{choice.description}</small></span>
        </button>)}
      </nav>
      <nav className="kit-sidebar__chapters" aria-label="Sections on this page">
        <p>本页内容 <span>ON THIS PAGE</span></p>
        {demo === "lwf" ? lwfGroups.map((group) => <div className="kit-sidebar__group" key={group.id}>
          <p className="kit-sidebar__group-label">{group.label}<span>{group.hint}</span></p>
          {group.sections.map((section) => <button key={section.id} type="button" className={`kit-sidebar__chapter ${activeSection === section.id ? "is-active" : ""}`} onClick={() => goToSection(section.id)}>
            <span>{section.index}</span><strong>{section.rail}</strong>
          </button>)}
        </div>) : sections.map((section, index) => <button key={section.id} type="button" className={`kit-sidebar__chapter ${activeSection === section.id ? "is-active" : ""}`} onClick={() => goToSection(section.id)}>
          <span>{String(index + 1).padStart(2, "0")}</span><strong>{section.title}</strong>
        </button>)}
      </nav>
      <div className="kit-sidebar__progress" aria-hidden="true">
        <p><span>{String(activeIndex + 1).padStart(2, "0")}</span><i>/ {String(sections.length).padStart(2, "0")}</i></p>
        <div><span style={{ width: `${((activeIndex + 1) / Math.max(sections.length, 1)) * 100}%` }} /></div>
      </div>
      <div className="kit-sidebar__footer">PaperSkillWork · Interactive paper learning</div>
    </aside>

    <div className="kit-shell__main" id="top">
      <header className="kit-topbar">
        <div className="kit-topbar__breadcrumb"><span>REUSABLE KIT</span><b>/</b><strong>{page.number} · {page.breadcrumb}</strong></div>
        <div className="kit-topbar__actions"><Button variant="secondary" className="kit-topbar__hub" onClick={() => { setReferenceId(null); setHubOpen(true); }}><span aria-hidden="true">⌕</span> Reference Hub</Button><span className="kit-topbar__badge"><i /> CANDIDATE · 待人工验收</span></div>
      </header>
      <main className="kit-page">
        {demo === "lab" ? <section className="kit-page__intro"><p className="kit-page__eyebrow"><span>{page.eyebrow}</span><i /> PaperSkillWork</p><h1>{page.title}</h1><p>{page.description}</p></section> : null}
        {demo === "lab" ? <ComponentLab /> : demo === "lwf" ? <LwfDemo /> : demo === "editorial" ? <EditorialStudies /> : demo === "journey" ? <EditorialJourney /> : <EwcDemo />}
        <footer className="kit-demo__footer">Source components are copied into each paper project by <code>tools/paper.py scaffold-kit</code>. Editing a paper's copy does not change this kit.</footer>
      </main>
    </div>
    <KnowledgeDrawer entries={referenceEntries} open={hubOpen} selectedId={referenceId} onSelectedIdChange={setReferenceId} onClose={() => setHubOpen(false)} />
  </div>;
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
      <p className="kit-lwf__eyebrow"><span>Learning without Forgetting</span><i aria-hidden="true" /><span>响应保留</span></p>
      <h2>一边<em>保留旧响应</em>，一边<em>学会新类别</em></h2>
      <div className="kit-lwf__hero-foot">
        <p className="kit-lwf__lead">下面的图只回答一件事：同一个输入怎样分成两条计算路径，teacher 的目标与 student 的两类输出在哪里比较，最后是哪个模型被更新。</p>
        <p className="kit-lwf__question"><b>当前问题</b><span>student 能学会当前标签，同时让旧类响应仍然可用吗？</span></p>
      </div>
    </header>
    <StickySystemView sections={lwfSections} onActiveSectionChange={(section) => { if (section.stepId) updateFromStepId(section.stepId); }} visual={<LwfFocusPanel step={flowIndex} onStepChange={setFlowIndex} />}>
      <section id="lwf-problem" className="kit-demo__section">
        <SectionHeader index="01" eyebrow="新任务到达" title="冲突从哪里开始" lead={<>当前任务带来新的标签，而系统必须继续提供旧类的响应。图里同时出现两个对象：新的输入与标签，以及已经训练好、此刻不再变化的 teacher。</>} />
        <p className="rk-pullquote">真正要同时成立的，是“新标签要学”和“旧响应要留”。</p>
        <InlineCallout kind="note" title="系统状态">任务在变，旧模型不跟着变：teacher 只提供旧响应，student 承担本任务的更新。</InlineCallout>
      </section>
      <section id="lwf-teacher" className="kit-demo__section">
        <SectionHeader index="02" eyebrow="冻结 teacher" title="只产出目标，不参与更新" lead={<><TermRef entry={lwfKnowledge[0]} onOpenReference={openReference}>teacher</TermRef> 读取与 student 相同的输入 <span className="rk-math"><var>x</var><sub>t</sub></span>，给出旧类响应目标 <span className="rk-math"><var>T</var><sub>old</sub></span>。它在整个任务期间保持冻结：本任务的梯度不会写回这个模型。</>} />
        <ExpandableDetail title="这里的 distillation 指什么" summary="与冻结全部旧参数的差别。" level="supporting"><p><TermRef entry={lwfKnowledge[1]} onOpenReference={openReference}>distillation objective</TermRef> 比较的是 student 输出与固定 teacher 响应之间的函数层差异；它不等于把旧参数全部冻结，更新仍然作用于 student 参数。</p></ExpandableDetail>
      </section>
      <section id="lwf-forward" className="kit-demo__section">
        <SectionHeader index="03" eyebrow="两条路径，一个 student" title={<>同一个 <span className="rk-math"><var>x</var><sub>t</sub></span>，两个输出头</>} lead={<>teacher 路径只贡献旧响应目标；student 路径用共享骨干 <span className="rk-math"><var>h</var><sub>t</sub></span> 同时产出旧类输出 <span className="rk-math"><var>ŷ</var><sub>old</sub></span> 与新类输出 <span className="rk-math"><var>ŷ</var><sub>new</sub></span>。两路输入相同，身份与用途不同。</>} />
        <div className="kit-lwf__lanes">
          <section className="kit-lwf__lane is-teacher">
            <p className="kit-lwf__lane-label">参考路径 · 冻结</p>
            <h4>Teacher</h4>
            <p>读同一个 <span className="rk-math"><var>x</var><sub>t</sub></span>，只产出旧响应目标 <span className="rk-math"><var>T</var><sub>old</sub></span>。</p>
            <p className="kit-lwf__lane-note">不接收本任务的梯度</p>
          </section>
          <section className="kit-lwf__lane is-student">
            <p className="kit-lwf__lane-label">学习路径 · 可训练</p>
            <h4>Student</h4>
            <p>共享骨干 <span className="rk-math"><var>h</var><sub>t</sub></span> 分出旧类输出 <span className="rk-math"><var>ŷ</var><sub>old</sub></span> 与新类输出 <span className="rk-math"><var>ŷ</var><sub>new</sub></span>。</p>
            <p className="kit-lwf__lane-note">两个损失都写回这里</p>
          </section>
        </div>
      </section>
      <section id="lwf-loss" className="kit-demo__section">
        <SectionHeader index="04" eyebrow="两个目标汇合" title="先各自比较，再合成为一次更新" lead={<>两个损失回答不同的问题，所以在汇合前必须各自读得懂：<span className="rk-math"><var>L</var><sub>old</sub></span> 比较 teacher 目标与 student 旧类输出，<span className="rk-math"><var>L</var><sub>new</sub></span> 比较当前标签与 student 新类输出。</>} />
        <FigureFrame label="图 2 · 目标合成" title="两次比较 → 一个梯度 → 一个更新对象" note="左侧是两条独立的比较链；只有两边的目标都成立，才在中间合成为一次参数更新。">
          <DiagramFlow spec={lwfObjectiveGraph} label="LwF 目标合成：两组比较形成两个损失，合成梯度后只更新 student 参数" framed={false} />
        </FigureFrame>
        <ExpandableDetail title="展开组件责任审计" summary="需要逐项核对“谁负责什么”时再打开。" level="supporting"><ResponsibilityMap spec={lwfResponsibilities} /></ExpandableDetail>
      </section>
      <section id="lwf-update" className="kit-demo__section">
        <SectionHeader index="05" eyebrow="更新与交接" title="梯度落在 student，交接在任务边界" lead="两个目标都作用在 student 参数上。任务结束时，更新后的 student 才成为下一个任务的 teacher；teacher 副本不参与本任务的更新。" />
        <div className="kit-lwf__sequence">
          <FlowStepper steps={lwfFlow} step={flowIndex} onStepChange={(step, index) => { setFlowIndex(index); }} />
        </div>
        <h4 className="kit-lwf__subhead">任务级生命周期</h4>
        <p className="kit-lwf__caption">依次推进合法阶段；试着从 ready 直接跳到 promotion，看看系统如何拒绝。</p>
        <StateMachineExplorer spec={lwfStates} />
        <div className="kit-section-foot">
          <p className="kit-section-foot__note">本节结束时，student 才成为下一任务的 teacher；teacher 副本不参与本任务的更新。</p>
          <Button variant="secondary" onClick={() => { setReferenceId(null); setHubOpen(true); }}>查看 LwF 参考条目</Button>
        </div>
      </section>
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
  return <div className="kit-lwf-panel" data-focus-step={current.id}>
    <FigureFrame
      label="机制总图 · 因果链定位"
      title={<span className="kit-lwf-focus__title">{current.title}</span>}
      counter={{ index: index + 1, total: lwfGraphSteps.length }}
      note={current.note}
      footer={<StepNav items={lwfNavItems} activeId={current.id} onSelect={choose} label="选择 LwF 机制步骤" />}
    >
      <DiagramFlow spec={lwfGraph} focus={{ nodes: current.nodes, edges: current.edges }} label="LwF 因果图：同一输入经 teacher 与 student 两条路径形成两个损失，梯度只更新 student 参数" framed={false} />
    </FigureFrame>
  </div>;
}
