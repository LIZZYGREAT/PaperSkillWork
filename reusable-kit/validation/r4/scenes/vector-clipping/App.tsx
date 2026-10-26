import { useMemo, useState } from 'react';
import { FlowConnector } from './shared/foundation/visual-parts/FlowConnector';
import { RepresentationVector } from './shared/foundation/visual-parts/RepresentationVector';
import { ResponseMeter } from './shared/foundation/visual-parts/ResponseMeter';

type Inputs = { gx: number; gy: number; threshold: number };

function clipGradient({ gx, gy, threshold }: Inputs) {
  const norm = Math.hypot(gx, gy);
  const scale = norm === 0 ? 1 : Math.min(1, threshold / norm);
  const clipped = [gx * scale, gy * scale];
  return { norm, scale, clipped, clippedNorm: Math.hypot(...clipped) };
}

const number = (value: number) => Number(value.toFixed(2));
const format = (value: number) => `${number(value)}`;
const signed = (value: number) => number(value) < 0 ? `−${Math.abs(number(value))}` : format(value);

export function App() {
  const [inputs, setInputs] = useState<Inputs>({ gx: 3, gy: 4, threshold: 2 });
  const result = useMemo(() => clipGradient(inputs), [inputs]);
  const setInput = (key: keyof Inputs, value: number) => setInputs(current => ({ ...current, [key]: value }));

  return <main className="clip-page" data-vector-clipping data-gx={inputs.gx} data-gy={inputs.gy} data-threshold={inputs.threshold} data-norm={result.norm} data-scale={result.scale} data-clipped-norm={result.clippedNorm}>
    <header className="clip-heading">
      <p className="clip-eyebrow"><span aria-hidden="true" /> REUSABLE KIT · R4 POSITIVE REUSE</p>
      <h1>Keep a gradient within a chosen length.</h1>
      <p className="clip-lead">A synthetic two-coordinate gradient makes norm clipping visible: measure its length, compute one scale, then apply that same scale to every coordinate.</p>
    </header>

    <section className="clip-controls" aria-labelledby="clip-controls-title">
      <div className="clip-controls__heading">
        <p className="clip-step">SET THE INPUT</p>
        <h2 id="clip-controls-title">Change the vector or threshold.</h2>
      </div>
      <label className="clip-control">
        <span>Gradient x · g₁</span><output htmlFor="clip-gx">{signed(inputs.gx)}</output>
        <input id="clip-gx" aria-label="Gradient x component g₁" type="range" min="-5" max="5" step="0.5" value={inputs.gx} onChange={event => setInput('gx', Number(event.target.value))} />
      </label>
      <label className="clip-control">
        <span>Gradient y · g₂</span><output htmlFor="clip-gy">{signed(inputs.gy)}</output>
        <input id="clip-gy" aria-label="Gradient y component g₂" type="range" min="-5" max="5" step="0.5" value={inputs.gy} onChange={event => setInput('gy', Number(event.target.value))} />
      </label>
      <label className="clip-control clip-control--threshold">
        <span>Maximum length · c</span><output htmlFor="clip-threshold">{number(inputs.threshold)}</output>
        <input id="clip-threshold" aria-label="Maximum gradient length c" type="range" min="0.5" max="5" step="0.5" value={inputs.threshold} onChange={event => setInput('threshold', Number(event.target.value))} />
      </label>
    </section>

    <section className="clip-process" aria-labelledby="clip-process-title">
      <div className="clip-process__heading">
        <div><p className="clip-step">FOLLOW THE CALCULATION</p><h2 id="clip-process-title">One input state drives every result.</h2></div>
        <p className="clip-flow-note">Arrows show calculations on an already-computed gradient; they do not depict a model’s backpropagation path.</p>
      </div>

      <div className="clip-flow" aria-live="polite">
        <article className="clip-card clip-card--vector" data-stage="gradient">
          <p className="clip-card__meta">01 <span>INPUT GRADIENT</span></p>
          <div className="clip-card__vector"><RepresentationVector values={[inputs.gx, inputs.gy]} extent={5} label="Gradient g" /></div>
          <p className="clip-card__equation">g = ({signed(inputs.gx)}, {signed(inputs.gy)})</p>
        </article>

        <FlowConnector kind="data" direction="right" label="norm" />

        <article className="clip-card" data-stage="norm">
          <p className="clip-card__meta">02 <span>VECTOR LENGTH</span></p>
          <p className="clip-card__result" data-value="norm">{number(result.norm)}</p>
          <p className="clip-card__equation">‖g‖₂ = √(g₁² + g₂²)</p>
          <p className="clip-card__detail">Measured norm before clipping</p>
        </article>

        <FlowConnector kind="data" direction="right" label="scale" />

        <article className="clip-card" data-stage="scale">
          <p className="clip-card__meta">03 <span>SHARED SCALE</span></p>
          <div className="clip-card__meter" data-value="scale"><ResponseMeter value={result.scale} min={0} max={1} label="Scale factor α" /></div>
          <div className="clip-card__formula" aria-label="Scale factor calculation">
            <p className="clip-card__equation">α = min(1, c / ‖g‖₂)</p>
            <p className="clip-card__substitution">{result.norm === 0 ? 'Zero vector: α = 1' : `= min(1, ${format(inputs.threshold)} / ${format(result.norm)}) = ${format(result.scale)}`}</p>
          </div>
          <p className="clip-card__detail">One factor multiplies both coordinates</p>
        </article>

        <FlowConnector kind="data" direction="right" label="apply α" />

        <article className="clip-card clip-card--vector clip-card--output" data-stage="clipped">
          <p className="clip-card__meta">04 <span>CLIPPED GRADIENT</span></p>
          <div className="clip-card__vector"><RepresentationVector values={result.clipped.map(number)} extent={5} label="Clipped gradient g′" /></div>
          <p className="clip-card__equation">g′ = αg = ({signed(result.clipped[0])}, {signed(result.clipped[1])})</p>
          <p className="clip-card__detail">‖g′‖₂ = {number(result.clippedNorm)} ≤ c = {number(inputs.threshold)}</p>
        </article>
      </div>

      <p className="clip-footnote">Teaching example with synthetic values. The vector is a gradient value being transformed; the display does not claim that these arrows show gradient propagation through a model.</p>
    </section>
  </main>;
}
