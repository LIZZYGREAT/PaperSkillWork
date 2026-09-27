import { useState } from "react";
import { ProcessLoopExplorer } from "../shared/core/process-loop";
import { ReferenceHub } from "../shared/core/reference";
import { StickySystemView } from "../shared/foundation/layout/StickySystemView";
import { lwfProcess, processSyncSections } from "./data/process";
import { references } from "./data/references";
import { Section00Problem } from "./sections/Section00Problem";
import { Section01Architecture } from "./sections/Section01Architecture";
import { Section02KeyMove } from "./sections/Section02KeyMove";
import { Section03TrainingCycle } from "./sections/Section03TrainingCycle";
import "../shared/foundation/styles/kit.css";
import "./styles/vertical-slice.css";

const stages = [
  { id: "slice-00", number: "00", title: "问题设定" },
  { id: "slice-01", number: "01", title: "模型结构" },
  { id: "slice-02", number: "02", title: "关键做法" },
  { id: "slice-03", number: "03", title: "一次训练" },
];

export function LwfVerticalSlice() {
  const [referencesOpen, setReferencesOpen] = useState(false);
  const [referenceVersion, setReferenceVersion] = useState(0);

  const openReference = (termId: string) => {
    window.history.replaceState(null, "", `#ref-term-${encodeURIComponent(termId)}`);
    setReferenceVersion((value) => value + 1);
    setReferencesOpen(true);
    window.setTimeout(() => document.getElementById("lwf-v3-references")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const toggleReferences = () => {
    const opening = !referencesOpen;
    setReferencesOpen(opening);
    if (opening) window.setTimeout(() => document.getElementById("lwf-v3-references")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  return <div className="lwf-v3">
    <header className="v3-topbar">
      <a className="v3-brand" href="#slice-00" aria-label="LwF First Vertical Slice 首页"><span className="v3-brand-mark">L</span><span>Learning without Forgetting <b>· First Vertical Slice</b></span></a>
      <nav className="v3-stage-nav" aria-label="00 到 03 学习主线">
        {stages.map((stage) => <a href={`#${stage.id}`} key={stage.id}><span>{stage.number}</span>{stage.title}</a>)}
      </nav>
      <button type="button" className="v3-reference-toggle" aria-expanded={referencesOpen} aria-controls="lwf-v3-references" onClick={toggleReferences}>Reference Hub <span aria-hidden="true">⌕</span></button>
    </header>

    <main className="v3-main">
      <section className="v3-hero" aria-labelledby="v3-hero-title">
        <p className="v3-eyebrow">LWF · 00–03</p><h1 id="v3-hero-title">从问题约束到一次完整训练</h1>
        <p>先看旧模型和数据的可用状态，再建立 Teacher / Student 结构，最后沿着同一张系统图走完一次训练。</p>
        <div className="v3-hero-chain" aria-label="学习主线"><span>Problem</span><i>→</i><span>Structure</span><i>→</i><span>Key Move</span><i>→</i><span>Training Cycle</span></div>
      </section>

      <Section00Problem />
      <Section01Architecture onOpenReference={openReference} />

      <section className="v3-persistent-zone" aria-label="旧响应生成与单次训练">
        <StickySystemView
          label="LwF 持续系统视图：Teacher 固定，Student 逐步训练"
          sections={processSyncSections}
          manualOverrideMs={250}
          visual={<div className="v3-system-visual"><div className="v3-system-visual-heading"><p className="v3-eyebrow">PERSISTENT SYSTEM</p><h2>一套对象，贯穿 02–03</h2><p>Teacher 固定 · Student 更新 · Xₙ 同时进入两条路径</p></div><ProcessLoopExplorer spec={lwfProcess} showProgress={false} showInspector={false} /></div>}
        >
          <div className="v3-persistent-content">
            <Section02KeyMove onOpenReference={openReference} />
            <Section03TrainingCycle onOpenReference={openReference} />
          </div>
        </StickySystemView>
      </section>

      <section className="v3-finish" aria-label="00 到 03 主线总结">
        <p className="v3-eyebrow">CORE COMPUTATION GRAPH</p><h2>现在可以复述一次 LwF 训练</h2>
        <p>Teacher 在 Xₙ 上产生 Yₒ；Student 用 L_old 保持旧响应、用 L_new 学习新标签；两项损失共同影响 θₛ，优化器随后更新 Student。</p>
        <a href="#slice-00">回到问题设定 ↑</a>
      </section>

      {referencesOpen ? <section className="v3-reference-section" id="lwf-v3-references" aria-label="LwF 术语与符号参考">
        <div className="v3-reference-section-heading"><div><p className="v3-eyebrow">ON-DEMAND MATERIAL</p><h2>Reference Hub</h2><p>术语、符号、训练阶段与组合目标的简明定义。</p></div><button type="button" onClick={() => setReferencesOpen(false)}>收起参考资料</button></div>
        <ReferenceHub key={referenceVersion} items={references} title="LwF 术语与符号" />
      </section> : null}
    </main>
  </div>;
}

export default LwfVerticalSlice;
