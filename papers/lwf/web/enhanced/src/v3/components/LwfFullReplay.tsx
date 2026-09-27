import { useEffect, useState } from "react";
import { LwfProcessView } from "./LwfProcessView";
import { fullReplaySteps, jointTrainingSubsteps } from "../data/full-replay";

const speedOptions = [1, 1.5] as const;

export function LwfFullReplay({ onOpenReference }: { onOpenReference: (termId: string) => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof speedOptions)[number]>(1);
  const step = fullReplaySteps[stepIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => setStepIndex((current) => (current + 1) % fullReplaySteps.length), 1800 / speed);
    return () => window.clearInterval(timer);
  }, [isPlaying, speed]);

  const goPrevious = () => setStepIndex((current) => (current - 1 + fullReplaySteps.length) % fullReplaySteps.length);
  const goNext = () => setStepIndex((current) => (current + 1) % fullReplaySteps.length);

  return <div className="v3-full-replay" data-replay-step={step.id}>
    <div className="v3-replay-stage">
      <div className="v3-replay-system-visual">
        <div className="v3-replay-graph-label"><span>SAME SYSTEM GRAPH · FULL-LOOP VIEW</span><p>沿用 Chapter 02–03 的 LwF 系统图；当前高亮对应完整任务生命周期中的位置。</p></div>
        <LwfProcessView activeStepId={step.processStepId} fullReplayLabel={{ index: stepIndex + 1, total: fullReplaySteps.length, title: step.title }} />
        {step.id === "next-teacher" ? <div className="v3-replay-loopback" aria-label="更新后的模型成为下一阶段 Teacher 并接收下一任务">
          <span>Studentₜ₊₁</span><i aria-hidden="true">→</i><span>Modelₜ₊₁ / Teacherₜ₊₁</span><i aria-hidden="true">↺</i><span>Task t+2 arrives</span>
        </div> : null}
      </div>

      <aside className="v3-replay-state-panel" aria-label="当前回放状态">
        <div className="v3-replay-state-heading"><span>STEP {String(stepIndex + 1).padStart(2, "0")} / 09</span><h3>{step.title}</h3></div>
        <p className="v3-replay-current-action">{step.action}</p>
        <dl>
          <div><dt>Input</dt><dd>{step.input}</dd></div>
          <div><dt>Output</dt><dd>{step.output}</dd></div>
          <div><dt>State</dt><dd>{step.state}</dd></div>
        </dl>
        {step.id === "joint-training" ? <div className="v3-replay-joint-detail" aria-label="联合训练中的 minibatch 计算顺序">
          <span>JOINT TRAINING · INTERNAL MINIBATCH</span>
          <p>{jointTrainingSubsteps.map((label, index) => <span key={label}>{index ? <i aria-hidden="true">→</i> : null}{label}</span>)}</p>
          <small>这个内部 minibatch 顺序对应 Chapter 03；上方仍显示同一张系统图。</small>
        </div> : null}
        {step.id === "next-teacher" ? <p className="v3-replay-cycle-note">闭环：新 Student 成为下一阶段 Teacher；新任务到来后，在新的 X 上重新生成旧响应。</p> : null}
        <button className="v3-replay-reference" type="button" onClick={() => onOpenReference("l-old")}>Reference Hub · 旧响应目标 ↗</button>
      </aside>
    </div>

    <div className="v3-replay-progress" aria-label="完整回放进度">
      {fullReplaySteps.map((item, index) => <div key={item.id} className={index === stepIndex ? "is-current" : index < stepIndex ? "is-complete" : ""} aria-current={index === stepIndex ? "step" : undefined}>
        <span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong>
      </div>)}
    </div>

    <div className="v3-replay-controls" aria-label="完整回放控制">
      <div className="v3-replay-step-controls">
        <button type="button" onClick={goPrevious} aria-label="上一步">← Previous</button>
        {isPlaying
          ? <button type="button" className="is-primary" onClick={() => setIsPlaying(false)} aria-label="暂停回放">❚❚ Pause</button>
          : <button type="button" className="is-primary" onClick={() => setIsPlaying(true)} aria-label="播放回放">▶ Play</button>}
        <button type="button" onClick={goNext} aria-label="下一步">Next →</button>
      </div>
      <div className="v3-replay-speed" role="group" aria-label="播放速度">
        <span>Speed</span>{speedOptions.map((option) => <button key={option} type="button" aria-pressed={speed === option} onClick={() => setSpeed(option)}>{option}×</button>)}
      </div>
      <p className="v3-replay-live" role="status" aria-live="polite">{isPlaying ? "Playing" : "Manual"} · Step {stepIndex + 1} of {fullReplaySteps.length}</p>
    </div>
  </div>;
}
