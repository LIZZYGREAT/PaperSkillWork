import { useState } from "react";
import { FlowStepper, type FlowStep } from "../shared/core/flow-stepper";

const steps: FlowStep[] = [
  { id: "p1-initial", title: "Initial classes", description: "The learner first sees one class batch.", statusText: "One learner remains active." },
  { id: "p1-arrive-2", title: "A new batch arrives", description: "New classes join the stream; the earlier class labels stay in scope.", statusText: "The learner is not recreated." },
  { id: "p1-expand-2", title: "Prediction space expands", description: "A test query must be compared with all classes seen so far.", statusText: "There is no current-batch ID at test time." },
  { id: "p1-arrive-3", title: "The stream continues", description: "Another class batch arrives and the shared prediction space expands again.", statusText: "Seen classes grow over time." },
  { id: "p1-memory", title: "Memory stays bounded", description: "The history grows, but the available image memory cannot grow without limit.", statusText: "The capacity rail stays the same size." },
  { id: "p1-problem", title: "State the problem", description: "Learn new classes, retain old-class capability, predict over all seen classes, and respect bounded memory.", statusText: "The method itself begins on the next pages." },
];

const classCountAtStep = [10, 20, 20, 30, 30, 30];

export function PageOne() {
  const [stepIndex, setStepIndex] = useState(0);
  const seenCount = classCountAtStep[stepIndex];
  const arrivedBatches = stepIndex >= 3 ? 3 : stepIndex >= 1 ? 2 : 1;

  return (
    <article className="tutorial-page page-one" aria-labelledby="page-one-title">
      <div className="page-kicker"><span>PAGE 01</span><span>Problem setting</span></div>
      <header className="page-heading">
        <h1 id="page-one-title">类别不断加入，分类器不能重新开始</h1>
        <p>Class-Incremental Learning 中，新类别逐批出现；每个时刻，模型都要在所有已见类别中直接做一次统一预测。</p>
      </header>

      <section className="panel guided-panel" aria-label="Class stream guided steps">
        <div className="panel-heading"><div><span className="eyebrow">CLASS STREAM</span><h2>同一个 learner，接收连续的类别批次</h2></div><span className="time-label">time →</span></div>
        <FlowStepper steps={steps} step={stepIndex} onStepChange={(_step, index) => setStepIndex(index)} label="Page 1 class stream steps" />

        <div className="stream-workspace">
          <div className="stream-batches" aria-label={`${arrivedBatches} class batches have arrived`}>
            {[
              { range: "Classes 1–10", label: "Class Batch 1" },
              { range: "Classes 11–20", label: "Class Batch 2" },
              { range: "Classes 21–30", label: "Class Batch 3" },
            ].map((batch, index) => (
              <div key={batch.label} className={`stream-batch ${index < arrivedBatches ? "is-arrived" : "is-future"} ${index === arrivedBatches - 1 ? "is-current" : ""}`}>
                <span className="stream-batch__tag">{batch.label}</span>
                <strong>{batch.range}</strong>
                <span className="stream-batch__status">{index < arrivedBatches ? "available" : "not arrived"}</span>
              </div>
            ))}
            <span className="stream-arrow" aria-hidden="true">→</span>
            <div className="same-learner"><span className="eyebrow">PERSISTENT OBJECT</span><strong>Same learner</strong><small>continues across batches</small></div>
          </div>

          <div className="expansion-row">
            <div className="prediction-space" aria-live="polite">
              <div className="panel-heading"><div><span className="eyebrow">SHARED PREDICTION SPACE</span><h3>Seen classes: 1–{seenCount}</h3></div><span className="class-count">{seenCount} labels</span></div>
              <div className="class-range-list">
                {Array.from({ length: Math.ceil(seenCount / 10) }, (_, index) => {
                  const first = index * 10 + 1;
                  const last = Math.min(first + 9, seenCount);
                  return <span key={first} className={`class-range class-range--${index}`}>C{first}–C{last}</span>;
                })}
              </div>
              <div className="query-route"><span className="query-chip">Test query</span><span className="route-line" aria-hidden="true" /><strong>choose from all {seenCount} seen classes</strong></div>
              <p className="inline-note">测试时没有“当前来自哪个 batch”的捷径。</p>
            </div>

            <aside className="memory-constraint" aria-label="Fixed memory capacity">
              <span className="eyebrow">BOUNDED RESOURCE</span>
              <strong>Available image memory · K fixed</strong>
              <div className="memory-rail" aria-hidden="true"><span /></div>
              <small>History grows; the capacity rail does not. Bar width is schematic.</small>
            </aside>
          </div>
        </div>
      </section>

      <section className="naive-grid" aria-label="Two naive approaches and their limitations">
        <article className={`naive-card ${stepIndex >= 4 ? "is-revealed" : ""}`}>
          <span className="eyebrow">OPTION A · KEEP ALL HISTORY</span>
          <div className="history-visual" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
          <h2>保存所有旧图像，再和新类一起重训</h2>
          <p>旧数据仍可用，但存储量会随历史持续增长，违背有界记忆约束。</p>
        </article>
        <article className={`naive-card ${stepIndex >= 4 ? "is-revealed" : ""}`}>
          <span className="eyebrow">OPTION B · NEW DATA ONLY</span>
          <div className="new-only-visual" aria-hidden="true"><b>new classes</b><span>→</span><b>continued update</b></div>
          <h2>后续只用新类别数据继续训练</h2>
          <p>模型可能覆盖先前学到的区分信息，旧类能力因此下降。</p>
        </article>
      </section>

      <section className={`problem-statement ${stepIndex === 5 ? "is-active" : ""}`} aria-live="polite">
        <div><span className="eyebrow">THE SETTING</span><h2>需要同时满足四个条件</h2></div>
        <ol>
          <li>学习新到来的类别</li>
          <li>继续识别以前见过的类别</li>
          <li>在一个共享标签空间中预测</li>
          <li>使用有界的图像记忆</li>
        </ol>
        <p>下一页打开模型黑盒：它究竟学习和保存什么？</p>
      </section>
    </article>
  );
}
