import { useEffect, useState } from "react";

const stages = [
  { id: "slice-00", number: "00", title: "问题设定" },
  { id: "slice-01", number: "01", title: "模型结构" },
  { id: "slice-02", number: "02", title: "关键做法" },
  { id: "slice-03", number: "03", title: "一次训练" },
];

export function LwfStageRail({ activeStepId, onOpenReferences, onSelectStage }: {
  activeStepId: string | null;
  onOpenReferences: () => void;
  onSelectStage: (id: string) => void;
}) {
  const [activeStageId, setActiveStageId] = useState("slice-00");

  useEffect(() => {
    const update = () => {
      const readingLine = window.innerHeight * 0.38;
      const mobileProcess = document.getElementById("v3-mobile-process");
      const mobileRect = mobileProcess?.getBoundingClientRect();
      const processRect = mobileRect && mobileRect.height > 0
        ? mobileRect
        : document.querySelector(".v3-desktop-scrolly")?.getBoundingClientRect();
      const processAtReadingLine = Boolean(processRect && processRect.top <= readingLine && processRect.bottom > readingLine);
      if (activeStepId && processAtReadingLine) {
        setActiveStageId(activeStepId.startsWith("key-") ? "slice-02" : "slice-03");
        return;
      }
      const visible = stages.slice(0, 2).map((stage) => {
        const element = document.getElementById(stage.id);
        return element ? { id: stage.id, rect: element.getBoundingClientRect() } : null;
      }).filter((item): item is { id: string; rect: DOMRect } => Boolean(item && item.rect.bottom > 0 && item.rect.top < window.innerHeight));
      const current = visible.find((item) => item.rect.top <= readingLine && item.rect.bottom > readingLine)
        ?? visible.sort((a, b) => Math.abs(a.rect.top - readingLine) - Math.abs(b.rect.top - readingLine))[0];
      if (current) {
        setActiveStageId(current.id);
        return;
      }
      if (activeStepId) setActiveStageId(activeStepId.startsWith("key-") ? "slice-02" : "slice-03");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [activeStepId]);

  return <aside className="v3-stage-rail" aria-label="LwF 学习导航">
    <div className="v3-rail-brand">
      <span className="v3-rail-mark" aria-hidden="true">L</span>
      <div><strong>Learning without Forgetting</strong><small>ECCV 2016 · 精读工作区</small></div>
    </div>
    <p className="v3-rail-label">FIRST VERTICAL SLICE</p>
    <nav className="v3-rail-nav" aria-label="00 到 03 学习主线">
      {stages.map((stage) => <button key={stage.id} type="button" className={activeStageId === stage.id ? "is-active" : ""} aria-current={activeStageId === stage.id ? "step" : undefined} onClick={() => onSelectStage(stage.id)}>
        <span>{stage.number}</span>{stage.title}
      </button>)}
    </nav>
    <button type="button" className="v3-rail-reference" onClick={onOpenReferences}><span aria-hidden="true">⌕</span> Reference Hub</button>
  </aside>;
}
