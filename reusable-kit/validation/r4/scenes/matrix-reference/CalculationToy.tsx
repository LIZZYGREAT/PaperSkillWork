import { useState } from 'react';

type Stage = {
  short: string;
  explanation: string;
};

const patch = [
  [1, 3],
  [5, 7],
] as const;

const rowMeans = patch.map(row => row.reduce((sum, value) => sum + value, 0) / row.length);
const globalMean = patch.flat().reduce((sum, value) => sum + value, 0) / patch.flat().length;
const centeredRowMeans = rowMeans.map(value => value - globalMean);
const meanSquaredCenteredRowMean = centeredRowMeans.reduce((sum, value) => sum + value ** 2, 0) / centeredRowMeans.length;

const stages: Stage[] = [
  { short: 'Input', explanation: 'Keep the four grayscale readings as given. The cells are teaching data, not a dataset sample.' },
  { short: 'Row means', explanation: 'Average within each row: (1 + 3) ÷ 2 = 2, and (5 + 7) ÷ 2 = 6.' },
  { short: 'Center', explanation: 'The four-pixel mean is 4. Subtract that same reference from each row mean to get −2 and 2.' },
  { short: 'Square', explanation: 'Square the centered row means and average them: (4 + 4) ÷ 2 = 4.' },
];

function intensityColor(value: number) {
  const channel = Math.round(34 + (value / 7) * 214);
  return `rgb(${channel} ${channel} ${channel})`;
}

export function CalculationToy() {
  const [activeStage, setActiveStage] = useState(0);

  return (
    <div className="page-shell">
      <header className="site-mark" aria-label="Teaching toy">
        <span className="site-mark__symbol" aria-hidden="true"><i /><i /><i /><i /></span>
        <span>NUMBER STUDY <b>／</b> 01</span>
        <span className="site-mark__right">A grayscale patch</span>
      </header>

      <main>
        <section className="hero" aria-labelledby="page-title">
          <div className="hero__main">
            <p className="eyebrow"><span className="eyebrow__dot" /> TEACHING TOY · FOUR VALUES</p>
            <h1 id="page-title">Four pixels.<br /><em>One spread.</em></h1>
            <p className="hero__lede">Follow a tiny grayscale patch from its raw values to the spread between its two row averages.</p>
          </div>
          <aside className="question-note">
            <span className="question-note__label">THE QUESTION</span>
            <p>How far are the row means from the center of the whole patch?</p>
            <div className="question-note__route"><span>pixels</span><b aria-hidden="true">→</b><span>row means</span><b aria-hidden="true">→</b><strong>spread</strong></div>
          </aside>
          <div className="toy-stamp"><span>TEACHING</span><b>TOY</b><small>not paper data</small></div>
        </section>

        <section className="calculation" aria-labelledby="calculation-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow section-heading__eyebrow">READ LEFT TO RIGHT</p>
              <h2 id="calculation-title">Every number has a source.</h2>
            </div>
            <p className="section-heading__note">One input. Three small calculations.<br />{' '}No hidden dataset or model.</p>
          </div>

          <div
            className="process-grid"
            data-row-means={JSON.stringify(rowMeans)}
            data-global-mean={globalMean}
            data-centered-row-means={JSON.stringify(centeredRowMeans)}
            data-final-result={meanSquaredCenteredRowMean}
          >
            <article className={`process-step ${activeStage === 0 ? 'is-active' : ''}`} data-step-card="0">
              <div className="step-meta"><span>01</span><span>INPUT</span></div>
              <h3>Start with the patch</h3>
              <p className="step-description">The cell labels keep the original grayscale values.</p>
              <div className="patch-frame">
                <span className="patch-frame__axis">INTENSITY</span>
                <div className="patch-grid" role="group" aria-label="Two by two grayscale patch with values 1, 3, 5 and 7">
                  {patch.flat().map((value, index) => (
                    <span
                      className="patch-cell"
                      key={`${index}-${value}`}
                      role="img"
                      aria-label={`row ${Math.floor(index / 2) + 1}, column ${(index % 2) + 1}: grayscale value ${value}`}
                      style={{ backgroundColor: intensityColor(value), color: value < 4 ? '#fff' : '#192a24' }}
                    >{value}</span>
                  ))}
                </div>
              </div>
              <p className="step-footnote"><span className="shade-key" aria-hidden="true"><i /><i /><i /></span> darker → lighter</p>
            </article>

            <span className="flow-mark" aria-hidden="true"><i /></span>

            <article className={`process-step ${activeStage === 1 ? 'is-active' : ''}`} data-step-card="1">
              <div className="step-meta"><span>02</span><span>ROW MEANS</span></div>
              <h3>Average each row</h3>
              <p className="step-description">The arithmetic stays beside its result.</p>
              <div className="row-calculations">
                {rowMeans.map((mean, index) => (
                  <div className="row-calculation" key={index}>
                    <span className="row-calculation__name">ROW {index + 1}</span>
                    <span className="row-calculation__equation">({patch[index].join(' + ')}) ÷ 2</span>
                    <output className="row-calculation__value" aria-label={`row ${index + 1} mean ${mean}`}>{mean}</output>
                  </div>
                ))}
              </div>
              <div className="vector-result"><span>row means</span><strong>[{rowMeans.join(', ')}]</strong></div>
            </article>

            <span className="flow-mark" aria-hidden="true"><i /></span>

            <article className={`process-step ${activeStage === 2 ? 'is-active' : ''}`} data-step-card="2">
              <div className="step-meta"><span>03</span><span>CENTER</span></div>
              <h3>Use the patch mean</h3>
              <p className="step-description">Both row means share the same reference: the mean of all four pixels.</p>
              <div className="reference-mean"><span>WHOLE-PATCH MEAN</span><strong>{globalMean}</strong><small>(1 + 3 + 5 + 7) ÷ 4</small></div>
              <div className="centered-rows">
                {centeredRowMeans.map((value, index) => (
                  <div className="centered-row" key={index}>
                    <span>ROW {index + 1}</span>
                    <span>{rowMeans[index]} − {globalMean}</span>
                    <strong>{value < 0 ? `−${Math.abs(value)}` : value}</strong>
                  </div>
                ))}
              </div>
              <div className="vector-result vector-result--centered"><span>centered row means</span><strong>[{centeredRowMeans.map(value => value < 0 ? `−${Math.abs(value)}` : value).join(', ')}]</strong></div>
            </article>

            <span className="flow-mark" aria-hidden="true"><i /></span>

            <article className={`process-step process-step--answer ${activeStage === 3 ? 'is-active' : ''}`} data-step-card="3">
              <div className="step-meta"><span>04</span><span>MEAN SQUARE</span></div>
              <h3>Measure their spread</h3>
              <p className="step-description">Square the centered row means, then average the two squares.</p>
              <div className="answer-display">
                <span className="answer-display__label">ROW-MEAN VARIANCE</span>
                <strong className="answer-display__value" aria-label={`mean squared centered row mean ${meanSquaredCenteredRowMean}`}>{meanSquaredCenteredRowMean}</strong>
                <span className="answer-display__equation">((−2)² + 2²) ÷ 2</span>
              </div>
              <p className="step-footnote step-footnote--answer">Mean squared deviation of the <em>row means</em>.</p>
            </article>
          </div>
        </section>

        <section className="trace-control" aria-labelledby="trace-title">
          <div className="trace-control__copy">
            <p className="eyebrow">TRACE THE STEPS</p>
            <h2 id="trace-title">Choose a calculation.</h2>
          </div>
          <div className="step-tabs" role="group" aria-label="Calculation step">
            {stages.map((stage, index) => (
              <button
                type="button"
                key={stage.short}
                aria-pressed={activeStage === index}
                aria-controls="step-explanation"
                onClick={() => setActiveStage(index)}
              ><span>0{index + 1}</span>{stage.short}</button>
            ))}
          </div>
          <p className="step-explanation" id="step-explanation" aria-live="polite" data-active-step={activeStage}>{stages[activeStage].explanation}</p>
        </section>

        <footer className="page-footer">
          <span><b>TEACHING TOY</b> · Synthetic values made for this calculation.</span>
          <span>Final value is the variance of the two row means, not of all four pixels.</span>
        </footer>
      </main>
    </div>
  );
}
