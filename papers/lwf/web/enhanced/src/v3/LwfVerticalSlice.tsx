import { useEffect, useState } from "react";
import { ReferenceHub, type HubRequest } from "../components/ReferenceHub";
import { useScrollStepSync } from "../shared/foundation/layout/StickySystemView";
import { LwfStageRail } from "./components/LwfStageRail";
import { LwfProcessView } from "./components/LwfProcessView";
import { MobileProcessGuide } from "./components/MobileProcessGuide";
import { processSyncSections } from "./data/process";
import { v3ReferenceIds, v3ReferencePriority } from "./data/references";
import { Section00Problem } from "./sections/Section00Problem";
import { Section01Architecture } from "./sections/Section01Architecture";
import { Section02KeyMove } from "./sections/Section02KeyMove";
import { Section03TrainingCycle } from "./sections/Section03TrainingCycle";
import "../styles/tokens.css";
import "../styles/components.css";
import "../styles/paper.css";
import "../styles/layout.css";
import "../styles/reference-hub.css";
import "../shared/foundation/styles/kit.css";
import "./styles/vertical-slice.css";

const sceneAnchors: Record<string, string> = {
  "00": "slice-00", A: "slice-00", B: "slice-01", C: "slice-02", D: "slice-03",
};

export function LwfVerticalSlice() {
  const [referenceRequest, setReferenceRequest] = useState<HubRequest | null>(null);
  const [mobileStepId, setMobileStepId] = useState("key-new-task");
  const [isNarrow, setIsNarrow] = useState(false);
  const [mobileProcessVisible, setMobileProcessVisible] = useState(false);
  const processSync = useScrollStepSync(processSyncSections, { manualOverrideMs: 2400 });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setIsNarrow(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (!isNarrow) { setMobileProcessVisible(false); return; }
    const update = () => {
      const rect = document.getElementById("v3-mobile-process")?.getBoundingClientRect();
      const line = window.innerHeight * 0.42;
      setMobileProcessVisible(Boolean(rect && rect.top <= line && rect.bottom > line));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isNarrow]);

  const openReference = (termId?: string) => {
    const cardId = termId ? v3ReferenceIds[termId] : undefined;
    setReferenceRequest(cardId ? { cardId } : {});
  };

  const selectStep = (stepId: string) => {
    setMobileStepId(stepId);
    if (isNarrow) setMobileProcessVisible(true);
    processSync.setManualStep(stepId);
  };

  const selectStage = (stageId: string) => {
    if (isNarrow && (stageId === "slice-02" || stageId === "slice-03")) {
      setMobileStepId(stageId === "slice-02" ? "key-new-task" : "cycle-warmup");
      window.setTimeout(() => document.getElementById("v3-mobile-process")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
      return;
    }
    document.getElementById(stageId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openV3Scene = (scene: string) => {
    const targetId = sceneAnchors[scene];
    if (targetId) window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const activeStepId = isNarrow ? (mobileProcessVisible ? mobileStepId : null) : processSync.activeStepId;

  return <div className="lwf-v3">
    <LwfStageRail activeStepId={activeStepId} onOpenReferences={() => openReference()} onSelectStage={selectStage} />
    <main className="v3-main">
      <header className="v3-intro">
        <p className="v3-eyebrow">ECCV 2016 · FIRST VERTICAL SLICE</p>
        <h1>Learning without Forgetting</h1>
        <p>从问题约束到一次完整训练</p>
      </header>

      <Section00Problem onOpenReference={openReference} />
      <Section01Architecture onOpenReference={openReference} onSelectStage={selectStage} />

      <div className="v3-desktop-scrolly" aria-label="关键做法与一次训练">
        <aside className="v3-process-sticky"><LwfProcessView activeStepId={processSync.activeStepId} /></aside>
        <div className="v3-narrative-column">
          <Section02KeyMove activeStepId={processSync.activeStepId} onOpenReference={openReference} onSelectStep={selectStep} />
          <Section03TrainingCycle activeStepId={processSync.activeStepId} onOpenReference={openReference} onSelectStep={selectStep} />
        </div>
      </div>

      <MobileProcessGuide activeStepId={mobileStepId} onSelectStep={selectStep} />
    </main>

    {referenceRequest ? <ReferenceHub request={referenceRequest} onClose={() => setReferenceRequest(null)} priorityIds={v3ReferencePriority} onOpenScene={openV3Scene} /> : null}
  </div>;
}

export default LwfVerticalSlice;
