import type { ReactNode } from "react";

export type TutorialRouteStep = {
  title: string;
  input: ReactNode;
  operation: ReactNode;
  result: ReactNode;
};

type TutorialRoutePreviewProps = {
  context: ReactNode;
  reasoning: ReactNode;
  steps: readonly TutorialRouteStep[];
  output: ReactNode;
  demoNote: ReactNode;
};

function StepConnector() {
  return (
    <svg className="tutorial-route__connector" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M2 12h16m-5-5 5 5-5 5" />
    </svg>
  );
}

export function TutorialRoutePreview({ context, reasoning, steps, output, demoNote }: TutorialRoutePreviewProps) {
  return (
    <section className="tutorial-route" aria-label="播放前的算法推理与执行路线">
      <header className="tutorial-route__reasoning">
        <span className="tutorial-route__eyebrow">BEFORE PLAYING · 先理解原理</span>
        <h2>为什么这样做</h2>
        <p className="tutorial-route__context"><b>已有状态与目标</b>{context}</p>
        <div className="tutorial-route__reasoning-copy">{reasoning}</div>
      </header>

      <section className="tutorial-route__execution" aria-labelledby="tutorial-route-execution-title">
        <h3 id="tutorial-route-execution-title">怎样实际执行</h3>
        <ol className="tutorial-route__steps" aria-label="算法执行顺序">
          {steps.map((step, index) => (
            <li className="tutorial-route__step" key={`${index}-${step.title}`}>
              <article className="tutorial-route__step-card">
                <header className="tutorial-route__step-heading">
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <h4>{step.title}</h4>
                </header>
                <dl className="tutorial-route__step-details">
                  <div><dt>输入</dt><dd>{step.input}</dd></div>
                  <div><dt>处理</dt><dd>{step.operation}</dd></div>
                  <div><dt>得到</dt><dd>{step.result}</dd></div>
                </dl>
              </article>
              {index < steps.length - 1 ? <StepConnector /> : null}
            </li>
          ))}
        </ol>
      </section>

      <footer className="tutorial-route__handoff">
        <p><b>结果与下一步</b>{output}</p>
        <p className="tutorial-route__demo-note"><b>本次演示</b>{demoNote}</p>
      </footer>
    </section>
  );
}
