import { useEffect, useRef, useState } from "react";
import { FlowStepper } from "../../shared/core/flow-stepper";
import { TermRef } from "../../shared/core/reference";
import { InlineCallout } from "../../shared/foundation/feedback/InlineCallout";
import { useStickyStepSync } from "../../shared/foundation/layout/StickySystemView";
import { trainingSteps } from "../data/process";
import { termsById } from "../data/references";

export function Section03TrainingCycle({ onOpenReference }: { onOpenReference: (termId: string) => void }) {
  const sync = useStickyStepSync();
  const scrollToStep = (stepId: string) => {
    document.getElementById(stepId)?.scrollIntoView({ behavior: "auto", block: "center" });
  };

  return (
    <section className="v3-persistent-stage v3-training-cycle" id="slice-03" aria-labelledby="v3-training-title">
      <header className="v3-stage-heading v3-stage-heading-compact">
        <span className="v3-stage-number">03</span>
        <div><p className="v3-eyebrow">ONE TRAINING CYCLE</p><h2 id="v3-training-title">从一次前向计算走到参数更新</h2><p>按 Warm-up、前向、两项损失、反向传播和优化器更新，跑完一个训练周期。</p></div>
      </header>

      <FlowStepper steps={trainingSteps} label="一次训练周期的六个步骤" onStepChange={(step) => scrollToStep(step.id)} />
      <div className="v3-step-notes" aria-label="训练周期步骤说明">
        {trainingSteps.map((step, index) => <article className="v3-step-note v3-cycle-note" id={step.id} data-step-note={step.id} data-active={sync?.activeStepId === step.id} aria-current={sync?.activeStepId === step.id ? "step" : undefined} key={step.id}>
          <span className="v3-step-note-number">{String(index + 1).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.description}</p>
            {step.id === "cycle-warmup" ? <p className="v3-state-row"><span>θₛ · 冻结</span><span>θₒ · 冻结</span><span>θₙ · 可训练</span></p> : null}
            {step.id === "cycle-forward" ? <p className="v3-path-line"><span>Teacher: Xₙ → Yₒ</span><span>Student: Xₙ → θₛ → Ŷₒ / Ŷₙ</span></p> : null}
            {step.id === "cycle-old-loss" ? <p className="v3-path-line"><span>Yₒ + Ŷₒ</span><b>→</b><strong>L_old</strong></p> : null}
            {step.id === "cycle-new-loss" ? <p className="v3-path-line"><span>Yₙ + Ŷₙ</span><b>→</b><strong>L_new</strong></p> : null}
            {step.id === "cycle-backward" ? <p className="v3-gradient-lines"><span>L_old → θₒ → θₛ</span><span>L_new → θₙ → θₛ</span></p> : null}
            {step.id === "cycle-update" ? <CombinedObjective onOpenReference={onOpenReference} /> : null}
          </div>
        </article>)}
      </div>

      <ReplayOneTrainingStep />
    </section>
  );
}

function CombinedObjective({ onOpenReference }: { onOpenReference: (termId: string) => void }) {
  return <div className="v3-objective-block">
    <p className="v3-objective-formula" aria-label="组合目标：旧任务损失权重乘以旧任务损失，加新任务损失和正则项"><span>L</span> = λₒ L_old + L_new + R</p>
    <dl className="v3-objective-legend">
      <div><dt><TermRef term={termsById["l-old"]} onOpenReference={onOpenReference} /></dt><dd>旧行为保持</dd></div>
      <div><dt><TermRef term={termsById["l-new"]} onOpenReference={onOpenReference} /></dt><dd>新任务学习</dd></div>
      <div><dt><TermRef term={termsById["lambda-o"]} onOpenReference={onOpenReference} /></dt><dd>控制旧任务保持项权重</dd></div>
      <div><dt><TermRef term={termsById.regularization} onOpenReference={onOpenReference} /></dt><dd>普通正则项</dd></div>
    </dl>
    <InlineCallout kind="note" title="Backward 与参数更新是两件事">
      <p>反向传播计算梯度；<code>optimizer.step()</code> 才把梯度应用到参数。Teacher 在整个周期中保持固定。</p>
    </InlineCallout>
  </div>;
}

function ReplayOneTrainingStep() {
  const sync = useStickyStepSync();
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState("可回放一次完整训练周期。 ");
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  const replay = () => {
    if (!sync) return;
    if (playing) {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
      setPlaying(false);
      setStatus("回放已停止。可手动选择任一步骤继续查看。");
      return;
    }
    setPlaying(true);
    setStatus("正在回放：Warm-up → Forward → L_old → L_new → Backward → Optimizer Step。");
    const delay = prefersReducedMotion() ? 300 : 900;
    const advance = (index: number) => {
      sync.setManualStep(trainingSteps[index].id);
      if (index === trainingSteps.length - 1) {
        timer.current = window.setTimeout(() => {
          setPlaying(false);
          setStatus("一次训练周期已完成。Student 参数在 Optimizer Step 后更新。");
          timer.current = null;
        }, delay);
        return;
      }
      timer.current = window.setTimeout(() => advance(index + 1), delay);
    };
    advance(0);
  };

  return <div className="v3-replay-card">
    <div><p className="v3-eyebrow">GRANDLOOP · ONE STEP</p><h3>完整回放一次训练</h3><p>固定 Teacher，逐步经过六个训练步骤，最后更新 Student。</p></div>
    <button type="button" className="v3-replay-button" onClick={replay}>{playing ? "停止回放" : "Replay One Training Step"}</button>
    <p className="v3-replay-status" role="status" aria-live="polite">{status}</p>
  </div>;
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
