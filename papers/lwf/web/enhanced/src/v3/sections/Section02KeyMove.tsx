import { FlowStepper } from "../../shared/core/flow-stepper";
import { ExpandableDetail, TermRef } from "../../shared/core/reference";
import { InlineCallout } from "../../shared/foundation/feedback/InlineCallout";
import { useStickyStepSync } from "../../shared/foundation/layout/StickySystemView";
import { keyMoveSteps } from "../data/process";
import { termsById } from "../data/references";

export function Section02KeyMove({ onOpenReference }: { onOpenReference: (termId: string) => void }) {
  const sync = useStickyStepSync();
  const scrollToStep = (stepId: string) => {
    document.getElementById(stepId)?.scrollIntoView({ behavior: "auto", block: "center" });
  };

  return (
    <section className="v3-persistent-stage v3-key-move" id="slice-02" aria-labelledby="v3-key-move-title">
      <header className="v3-stage-heading v3-stage-heading-compact">
        <span className="v3-stage-number">02</span>
        <div><p className="v3-eyebrow">KEY MOVE</p><h2 id="v3-key-move-title">没有旧数据，为什么还能保留旧知识？</h2><p>因为旧模型仍可运行：把当前 <TermRef term={termsById.xn} onOpenReference={onOpenReference} /> 输入 Teacher，生成旧响应 <TermRef term={termsById.yo} onOpenReference={onOpenReference} />。</p></div>
      </header>

      <FlowStepper steps={keyMoveSteps} label="构造 LwF 的四步过程" onStepChange={(step) => scrollToStep(step.id)} />
      <div className="v3-step-notes" aria-label="旧响应生成与 Student 构造">
        {keyMoveSteps.map((step) => <article className="v3-step-note" id={step.id} data-step-note={step.id} data-active={sync?.activeStepId === step.id} aria-current={sync?.activeStepId === step.id ? "step" : undefined} key={step.id}>
          <span className="v3-step-note-number">{String(keyMoveSteps.indexOf(step) + 1).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.description}</p></div>
        </article>)}
      </div>

      <InlineCallout kind="note" title="辨清 Yₒ 的来源">
        <p><strong>Yₒ 不是旧任务真值、旧数据集，也不是 replay sample。</strong>它是 Teacher 对当前新任务输入 Xₙ 的旧任务输出。</p>
      </InlineCallout>
      <ExpandableDetail title="为什么要在新任务输入上生成响应？" summary="只用当前阶段仍可访问的输入建立旧行为目标。" level="supporting">
        <p>当前只有 Xₙ 可用于训练，Teacher 仍能对它产生旧任务响应。因而 LwF 在新输入分布上约束 Student；这一约束覆盖到哪里，会影响方法的适用边界，后续阶段再讨论。</p>
      </ExpandableDetail>
    </section>
  );
}
