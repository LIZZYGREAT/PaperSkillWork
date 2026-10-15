import type { ReactNode } from "react";

type HandoffStep = {
  label: string;
  body: ReactNode;
};

type QuestionHandoffProps = {
  fromPage: number;
  toPage: number;
  steps: readonly [HandoffStep, HandoffStep, HandoffStep];
  actionLabel: string;
  onContinue?: () => void;
  note?: ReactNode;
};

export function QuestionHandoff({ fromPage, toPage, steps, actionLabel, onContinue, note }: QuestionHandoffProps) {
  return <section className="icarl-question-handoff" aria-label={`第 ${fromPage} 页到第 ${toPage} 页的学习衔接`}>
    <header className="icarl-question-handoff__header">
      <span className="eyebrow">沿着问题继续想</span>
      <span>PAGE {String(fromPage).padStart(2, "0")} <i aria-hidden="true">→</i> {String(toPage).padStart(2, "0")}</span>
    </header>
    <div className="icarl-question-handoff__path">
      {steps.map((step, index) => <div key={step.label}>
        <article className={`icarl-question-handoff__step icarl-question-handoff__step--${index === 1 ? "constraint" : index === 2 ? "question" : "known"}`}>
          <span>{String(index + 1).padStart(2, "0")} · {step.label}</span>
          <p>{step.body}</p>
          {index === 2 && onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>{actionLabel} <b aria-hidden="true">→</b></button> : null}
        </article>
        {index < 2 ? <div className={`icarl-question-handoff__connector${index === 1 ? " icarl-question-handoff__connector--reverse" : ""}`} aria-hidden="true" /> : null}
      </div>)}
    </div>
    {note ? <p className="icarl-question-handoff__note">{note}</p> : null}
  </section>;
}
