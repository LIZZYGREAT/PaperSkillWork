import { useState, type CSSProperties } from "react";

type PageOneProps = { onOpenPageTwo: () => void };

const stages = [
  { title: "A learner begins", note: "The first class batch defines the initial prediction space.", status: "Classes 1–10 are in view." },
  { title: "A new batch arrives", note: "Class labels arrive over time while the learner itself remains the same.", status: "The earlier labels stay in scope." },
  { title: "The shared label space expands", note: "At test time, the model must choose from every class seen so far.", status: "There is no current-batch shortcut." },
  { title: "History grows; memory stays bounded", note: "More classes and past data accumulate, but available image memory cannot grow without limit.", status: "The K-slot memory rail stays the same size." },
  { title: "Two simple strategies fall short", note: "Keeping every image breaks the memory limit; using only new images risks losing old-class ability.", status: "Each strategy misses a required condition." },
  { title: "State the learning problem", note: "Learn new classes, preserve old-class recognition, predict across one label space, and respect bounded memory.", status: "Next: open the shared model." },
];

const batches = [
  { name: "CLASS BATCH 1", range: "Classes 1–10" },
  { name: "CLASS BATCH 2", range: "Classes 11–20" },
  { name: "CLASS BATCH 3", range: "Classes 21–30" },
];

function Arrow({ label }: { label: string }) {
  return (
    <div className="p1-flow-arrow" aria-hidden="true">
      <svg viewBox="0 0 72 22"><path d="M2 11h62m-8-7 8 7-8 7" /></svg>
      <span>{label}</span>
    </div>
  );
}

export function PageOne({ onOpenPageTwo }: PageOneProps) {
  const [step, setStep] = useState(0);
  const seenCount = [10, 10, 20, 30, 30, 30][step];
  const arrivedCount = step >= 3 ? 3 : step >= 1 ? 2 : 1;
  const currentBatch = step >= 3 ? 2 : step >= 1 ? 1 : 0;
  const totalSteps = stages.length;

  return (
    <article className="tutorial-page p1-page" aria-labelledby="page-one-title">
      <div className="p1-kicker"><span>PAGE 01</span><i /> THE LEARNING SETTING</div>
      <header className="page-heading p1-heading">
        <h1 id="page-one-title">类别逐批到来，分类器不能重新开始</h1>
        <p>Class-Incremental Learning 中，新类别会随时间出现。同一个模型要在所有已见类别中直接预测，同时面对有限的旧数据记忆。</p>
      </header>

      <section className="p1-guided panel" aria-labelledby="p1-guided-title">
        <div className="p1-guided__top">
          <div><span className="p1-eyebrow">GUIDED VIEW · {String(step + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}</span><h2 id="p1-guided-title">{stages[step].title}</h2></div>
          <div className="p1-step-actions">
            <button type="button" className="p1-control p1-control--quiet" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} aria-label="Previous step">← <span>Previous</span></button>
            <button type="button" className="p1-control p1-control--primary" onClick={() => setStep((value) => Math.min(totalSteps - 1, value + 1))} disabled={step === totalSteps - 1} aria-label="Next step"><span>Next</span> →</button>
          </div>
        </div>
        <nav className="p1-step-nav" aria-label="Page 1 guided stages">
          {stages.map((stage, index) => (
            <button key={stage.title} type="button" className={`p1-step-nav__item ${step === index ? "is-active" : ""} ${index < step ? "is-complete" : ""}`} onClick={() => setStep(index)} aria-pressed={step === index}>
              <span>{String(index + 1).padStart(2, "0")}</span><b>{stage.title}</b>
            </button>
          ))}
        </nav>
        <div className="p1-guided__summary" aria-live="polite"><span className="p1-guided__pulse" /><p>{stages[step].note}</p><strong>{stages[step].status}</strong></div>
      </section>

      <section className="p1-class-stream panel" aria-labelledby="p1-stream-title">
        <div className="p1-section-head">
          <div><span className="p1-eyebrow">01 · CLASS STREAM</span><h2 id="p1-stream-title">新类别沿时间进入同一条学习路径</h2></div>
          <span className="p1-time-label">TIME <svg viewBox="0 0 48 12" aria-hidden="true"><path d="M1 6h42m-6-5 6 5-6 5" /></svg></span>
        </div>
        <div className="p1-batch-track" data-arrived={arrivedCount}>
          <div className="p1-track-line" aria-hidden="true"><span style={{ "--progress": `${((arrivedCount - 1) / 2) * 100}%` } as CSSProperties} /></div>
          {batches.map((batch, index) => {
            const arrived = index < arrivedCount;
            return (
              <div key={batch.name} className={`p1-batch ${arrived ? "is-arrived" : "is-future"} ${index === currentBatch ? "is-current" : ""}`}>
                <div className="p1-batch__marker" aria-hidden="true"><i /></div>
                <div className="p1-batch__card">
                  <div className="p1-batch__top"><span>{batch.name}</span><em>{arrived ? (index === currentBatch ? "CURRENT" : "SEEN") : "UP NEXT"}</em></div>
                  <strong>{batch.range}</strong>
                  <div className="p1-batch__classes" aria-label={`${batch.range}, ten class labels`}>
                    {Array.from({ length: 10 }, (_, classIndex) => <i key={classIndex} />)}
                  </div>
                  <small>{arrived ? "labels remain in scope" : "not arrived yet"}</small>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p1-stream-caption"><span>Each batch adds classes to the sequence.</span><span>One learner persists across all three.</span></div>
      </section>

      <section className="p1-model-map" aria-label="One learner and one unified prediction space">
        <section className="p1-learner panel">
          <div className="p1-section-head"><div><span className="p1-eyebrow">02 · PERSISTENT MODEL</span><h2>Same learner</h2></div><span className="p1-object-badge">ONE SHARED MODEL</span></div>
          <div className="p1-model-diagram">
            <div className="p1-model-layers" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            <div><strong>Feature extractor</strong><span>updates as learning continues</span></div>
            <b className="p1-model-symbol">φ<sub>Θ</sub></b>
          </div>
          <div className="p1-learner-foot"><span><i /> Same model instance</span><span>not a new classifier per batch</span></div>
        </section>
        <Arrow label="one shared label space" />
        <section className="p1-prediction panel" aria-live="polite">
          <div className="p1-section-head"><div><span className="p1-eyebrow">03 · UNIFIED INFERENCE</span><h2>Choose among all seen classes</h2></div><span className="p1-count">{seenCount}<small> seen</small></span></div>
          <div className="p1-label-groups">
            {Array.from({ length: Math.ceil(seenCount / 10) }, (_, index) => {
              const first = index * 10 + 1;
              const last = Math.min(first + 9, seenCount);
              return <div className={`p1-label-group p1-label-group--${index}`} key={first}><span>C{first}–C{last}</span><i /><i /><i /></div>;
            })}
          </div>
          <div className="p1-query-route"><span className="p1-query-icon">x</span><svg viewBox="0 0 80 20" aria-hidden="true"><path d="M2 10h70m-7-7 7 7-7 7" /></svg><strong>one prediction over C1–C{seenCount}</strong></div>
          <p>测试时不依赖样本来自哪个 batch。</p>
        </section>
      </section>

      <section className={`p1-memory panel ${step >= 3 ? "is-emphasized" : ""}`} aria-label="Growing class history and fixed image memory">
        <div className="p1-section-head"><div><span className="p1-eyebrow">A CONSTRAINT THAT PERSISTS</span><h2>历史变长，可用图像记忆仍有上限</h2></div><span className="p1-fixed-tag">K · FIXED CAPACITY</span></div>
        <div className="p1-memory-compare">
          <div className="p1-memory-row"><strong>Labels arrived</strong><div className="p1-history-rail" aria-label={`${arrivedCount} class batches have arrived`}>{[0, 1, 2].map((index) => <i key={index} className={index < arrivedCount ? "is-filled" : ""} />)}</div><span>{arrivedCount * 10} labels</span></div>
          <div className="p1-memory-row"><strong>Image memory</strong><div className="p1-fixed-rail" aria-label="Fixed memory budget K"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><span>same budget K</span></div>
        </div>
      </section>

      <section className={`p1-naive-section ${step >= 4 ? "is-revealed" : "is-muted"}`} aria-labelledby="p1-naive-title" aria-live="polite">
        <div className="p1-section-head"><div><span className="p1-eyebrow">WHY THE SETTING IS HARD</span><h2 id="p1-naive-title">Two natural strategies leave a gap</h2></div><span className="p1-qualitative-note">CONCEPTUAL COMPARISON</span></div>
        <div className="p1-naive-grid">
          <article className="p1-naive-card p1-naive-card--memory">
            <div className="p1-naive-card__visual" aria-hidden="true"><div className="p1-archive-stack">{Array.from({ length: 7 }, (_, index) => <i key={index} />)}</div><span className="p1-overflow-arrow">↗</span><b>keeps growing</b></div>
            <span className="p1-card-label">OPTION A · KEEP EVERY IMAGE</span><h3>Save all past data and retrain</h3><p>Old images stay available, but storage grows with the entire history.</p>
            <div className="p1-verdict"><i>×</i><span>Violates bounded memory</span></div>
          </article>
          <article className="p1-naive-card p1-naive-card--new">
            <div className="p1-naive-card__visual" aria-hidden="true"><span className="p1-model-mini">MODEL</span><svg viewBox="0 0 84 24"><path d="M2 12h75m-8-7 8 7-8 7" /></svg><span className="p1-new-mini">NEW DATA</span></div>
            <span className="p1-card-label">OPTION B · TRAIN ON NEW DATA ONLY</span><h3>Continue with only the arriving classes</h3><p>New classes can improve while old-class distinctions may degrade.</p>
            <div className="p1-verdict"><i>×</i><span>Old-class ability is at risk</span></div>
          </article>
        </div>
      </section>

      <section className={`p1-problem panel ${step === 5 ? "is-active" : ""}`} aria-labelledby="p1-problem-title">
        <div className="p1-problem__lead"><span className="p1-eyebrow">THE CLASS-INCREMENTAL LEARNING PROBLEM</span><h2 id="p1-problem-title">What the system must do</h2><p>iCaRL is designed around all four requirements together.</p></div>
        <ol><li>Learn newly arriving classes</li><li>Keep recognizing earlier classes</li><li>Predict in one shared label space</li><li>Work with bounded image memory</li></ol>
        <button type="button" className="p1-open-model" onClick={onOpenPageTwo}>Open the model <span aria-hidden="true">→</span></button>
      </section>
    </article>
  );
}
