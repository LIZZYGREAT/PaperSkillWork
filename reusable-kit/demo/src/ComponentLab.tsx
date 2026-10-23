import { useState } from "react";
import { Button } from "../../foundation/controls/Button";
import { Chip } from "../../foundation/controls/Chip";
import { Slider } from "../../foundation/controls/Slider";
import { BarMeter, MetaList, PullQuote, StatRow } from "../../foundation/data";
import { InlineCallout } from "../../foundation/feedback/InlineCallout";
import { DiagramFlow } from "../../foundation/layout/DiagramFlow";
import { Drawer } from "../../foundation/overlay/Drawer";
import { Popover } from "../../foundation/overlay/Popover";
import { FigureFrame } from "../../compositions/figure-frame";
import { SectionHeader } from "../../compositions/section-header";
import { StepNav } from "../../compositions/step-nav";
import { labNavItems, labRoleGraph } from "./figures";

export const labSections = [
  { id: "lab-type-title", title: "Tokens and type" },
  { id: "lab-button-title", title: "Controls" },
  { id: "lab-content-title", title: "Content primitives" },
  { id: "lab-diagram-title", title: "Diagram roles" },
  { id: "lab-nav-title", title: "Step navigation" },
  { id: "lab-figure-title", title: "Page compositions" },
  { id: "lab-overlay-title", title: "Overlays" },
];

const tokens = [
  { id: "canvas", label: "canvas", value: "#F5F2E9" },
  { id: "surface", label: "surface", value: "#FFFDF8" },
  { id: "figure", label: "figure", value: "#EEF2E3" },
  { id: "ink", label: "ink", value: "#182A22" },
  { id: "muted", label: "muted", value: "#586A5D" },
  { id: "line", label: "line", value: "#DEDBC9" },
  { id: "accent", label: "accent", value: "#2E6B4E" },
  { id: "clay", label: "focus / clay", value: "#A9683B" },
];

/**
 * The review surface for the Kit: every section shows a specimen, the states it is
 * allowed to have, and the boundary it has to respect. It is a catalogue, not an
 * approval record.
 */
export function ComponentLab() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(36);
  const [navStep, setNavStep] = useState("objects");
  return <div className="kit-demo__paper kit-lab" data-demo-view="component-lab">
    <section className="kit-lab__intro">
      <p className="rk-type--meta">FOUNDATION v2 · CANDIDATE</p>
      <h2 className="rk-type--heading-1">Readable defaults with bounded variants</h2>
      <p className="rk-type--body">Every teaching page in this demo is assembled from the pieces below. Each section shows the specimen, the states it may take, and the boundary it has to respect.</p>
    </section>
    <InlineCallout kind="note" title="Candidate status">Every component stays a candidate until a named human accepts the rendered result. Nothing here is an approval record.</InlineCallout>

    <section className="rk-surface" aria-labelledby="lab-type-title">
      <header className="rk-surface__header"><h3 id="lab-type-title" className="rk-type--heading-2">Tokens and type roles</h3><p className="rk-type--supporting">One warm paper scale, one green, one clay. Type roles are semantic, so a paper theme can replace the family without breaking the hierarchy.</p></header>
      <div className="kit-lab__type-stack"><p className="rk-type--display">Display / 开篇标题</p><p className="rk-type--heading-1">Heading 1 / 页面标题</p><p className="rk-type--heading-2">Heading 2 / 章节标题</p><p className="rk-type--heading-3">Heading 3 / 内部小节</p><p className="rk-type--body">Body — 主要解释用于连续阅读，包含 Fisher Information、xₜ 和中文标点。</p><p className="rk-type--supporting">Supporting — 图旁说明和辅助信息。</p><p className="rk-type--caption">Caption — Figure 2. Source-bound summary with enough line height.</p><p className="rk-type--diagram-label">Diagram label — Gradient ∇L</p><p className="rk-type--meta">META · VERSION 2 CANDIDATE</p></div>
      <p className="kit-lab__sub">Colour roles</p>
      <ul className="kit-lab__swatches">{tokens.map((token) => <li key={token.id}><i style={{ background: token.value }} aria-hidden="true" /><strong>{token.label}</strong><code>{token.value}</code></li>)}</ul>
    </section>

    <section className="rk-surface rk-surface--soft" aria-labelledby="lab-button-title">
      <header className="rk-surface__header"><h3 id="lab-button-title" className="rk-type--heading-2">Controls</h3><p className="rk-type--supporting">Variants keep alignment across English, Chinese, icons, long labels and disabled states.</p></header>
      <div className="kit-lab__button-grid"><Button>Primary action</Button><Button variant="secondary">次要操作</Button><Button variant="quiet">Quiet action</Button><Button variant="danger">Delete draft</Button><Button size="small">Small</Button><Button disabled>Unavailable</Button><Button variant="secondary" iconOnly aria-label="Add reference">＋</Button><Button className="kit-lab__long-button">A deliberately long action label that wraps in a narrow container</Button></div>
      <div className="kit-lab__control-row"><Chip active>Selected chip</Chip><Chip tone="good">Verified</Chip><Slider label="Example threshold" value={sliderValue} displayValue={`${sliderValue}%`} onChange={setSliderValue} /></div>
    </section>

    <section className="rk-surface" aria-labelledby="lab-content-title">
      <header className="rk-surface__header"><h3 id="lab-content-title" className="rk-type--heading-2">Content primitives</h3><p className="rk-type--supporting">Facts, conclusions and quantities each get their own shape, so a page does not answer every question with another paragraph.</p></header>
      <div className="kit-lab__grid2">
        <div><p className="kit-lab__sub">MetaList · 事实行</p><MetaList label="Meta list sample" items={[{ id: "owner", label: "Owner", value: "Teacher copy" }, { id: "effect", label: "Effect", value: "Old-task responses become available as targets." }, { id: "status", label: "Status", value: "Frozen for this task" }]} /></div>
        <div><p className="kit-lab__sub">BarMeter · 数值比较</p><BarMeter label="Example importance weights" items={[{ id: "t1", label: "θ₁", value: 0.84, display: "0.84" }, { id: "t2", label: "θ₂", value: 0.34, display: "0.34" }, { id: "t3", label: "θ₃", value: 0.62, display: "0.62" }]} /></div>
      </div>
      <p className="kit-lab__sub">PullQuote · 一句结论</p>
      <PullQuote attribution="Reading note">结论应该比正文更短、更确定，否则它只是又一段正文。</PullQuote>
      <p className="kit-lab__sub">StatRow · 头条数字</p>
      <StatRow label="Example statistics" items={[{ id: "s1", value: "01", label: "mechanism", note: "one figure per section" }, { id: "s2", value: "05", label: "focus steps", note: "scroll-linked" }, { id: "s3", value: "02", label: "objectives", note: "compared, then merged" }]} />
    </section>

    <section className="rk-surface" aria-labelledby="lab-diagram-title">
      <header className="rk-surface__header"><h3 id="lab-diagram-title" className="rk-type--heading-2">Diagram roles</h3><p className="rk-type--supporting">Every node role in one figure. Form carries the state, so the figure still reads in greyscale.</p></header>
      <DiagramFlow spec={labRoleGraph} label="Diagram role vocabulary: input, frozen, target, objective, trainable, label and update target" framed={false} className="rk-diagram--roomy" />
    </section>

    <section className="rk-surface" aria-labelledby="lab-nav-title">
      <header className="rk-surface__header"><h3 id="lab-nav-title" className="rk-type--heading-2">Step navigation</h3><p className="rk-type--supporting">Every step name stays complete. The grid wraps to a second row instead of shortening a label with an ellipsis.</p></header>
      <StepNav items={labNavItems} activeId={navStep} onSelect={setNavStep} label="Component Lab step navigation sample" />
    </section>

    <section className="rk-surface" aria-labelledby="lab-figure-title">
      <header className="rk-surface__header"><h3 id="lab-figure-title" className="rk-type--heading-2">Page compositions</h3><p className="rk-type--supporting">The header and frame carry every teaching page, so a new paper inherits the hierarchy instead of inventing another one.</p></header>
      <div className="kit-lab__anatomy">
        <SectionHeader index="01" eyebrow="Section header" title="章节开头用同一种结构" lead="编号、栏目名、标题、导语各就各位；hairline 把标题和上一节分开，而不是再加一层卡片。" />
        <FigureFrame label="Figure frame · 图注条" title="图有自己的抬头与编号" note="图注条说明这张图要回答什么，画布区域用浅色纸面把图和正文分开。"><div className="kit-lab__anatomy-body">图内容区域（DiagramFlow、状态机或论文原图）</div></FigureFrame>
      </div>
    </section>

    <section className="rk-surface" aria-labelledby="lab-overlay-title">
      <header className="rk-surface__header"><h3 id="lab-overlay-title" className="rk-type--heading-2">Overlays</h3><p className="rk-type--supporting">Popover stays viewport-safe; the reading Drawer has room for composed two-column content on wide screens.</p></header>
      <div className="kit-lab__button-grid"><Popover label="Compact supporting detail" trigger="Open viewport-safe popover"><p>This supporting detail is intentionally compact. Escape and outside press dismiss it.</p></Popover><Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open reading Drawer</Button></div>
    </section>
    <Drawer open={drawerOpen} title="Reading Drawer" size="reading" onClose={() => setDrawerOpen(false)}><div className="kit-lab__reading-grid"><aside className="rk-surface rk-surface--soft"><p className="rk-type--meta">ENTRY LIST</p><h3 className="rk-type--heading-3">Stable navigation column</h3><p className="rk-type--supporting">The wide contract reserves enough space for a list and a readable detail pane.</p></aside><article className="rk-surface"><p className="rk-type--meta">DETAIL</p><h3 className="rk-type--heading-2">Long-form reference content</h3><p className="rk-type--body">This is a layout contract demonstration, not the final Reference Hub.</p></article></div></Drawer>
  </div>;
}
