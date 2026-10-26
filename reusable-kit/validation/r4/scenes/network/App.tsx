import { useState } from "react";
import { MiniNetworkGlyph, type MiniNetworkConnection } from "./shared/foundation/neural-network/MiniNetworkGlyph";
import "./network-illustration.css";

const temperature = 0.7;
const vibration = -0.2;
const hiddenPreActivations = [
  1.0 * temperature + 0.5 * vibration + 0.1,
  -0.4 * temperature + 1.2 * vibration + 0.5,
  0.6 * temperature + 0.3 * vibration + 0.1,
];
const hidden = hiddenPreActivations.map((value) => Math.max(0, value));
const logit = 0.5 * hidden[0] + 0.2 * hidden[1] + 0.3 * hidden[2] + 0.08;
const score = 1 / (1 + Math.exp(-logit));

const connections: MiniNetworkConnection[] = [
  { id: "temperature-to-h1", fromLayer: "inputs", fromNode: 0, toLayer: "hidden", toNode: 0 },
  { id: "temperature-to-h2", fromLayer: "inputs", fromNode: 0, toLayer: "hidden", toNode: 1 },
  { id: "temperature-to-h3", fromLayer: "inputs", fromNode: 0, toLayer: "hidden", toNode: 2 },
  { id: "vibration-to-h1", fromLayer: "inputs", fromNode: 1, toLayer: "hidden", toNode: 0 },
  { id: "vibration-to-h2", fromLayer: "inputs", fromNode: 1, toLayer: "hidden", toNode: 1 },
  { id: "vibration-to-h3", fromLayer: "inputs", fromNode: 1, toLayer: "hidden", toNode: 2 },
  { id: "h1-to-risk", fromLayer: "hidden", fromNode: 0, toLayer: "output", toNode: 0 },
  { id: "h2-to-risk", fromLayer: "hidden", fromNode: 1, toLayer: "output", toNode: 0 },
  { id: "h3-to-risk", fromLayer: "hidden", fromNode: 2, toLayer: "output", toNode: 0 },
];

const format = (value: number, digits = 2) => value.toFixed(digits);

export function App() {
  const [pathFocused, setPathFocused] = useState(false);

  return (
    <main className="page-shell">
      <header className="page-heading">
        <p className="eyebrow"><span aria-hidden="true" /> Synthetic model · body-text illustration</p>
        <h1>Two sensor signals,<br /><em>one toy score.</em></h1>
        <p className="page-lead">
          A compact 2→3→1 multilayer perceptron turns two readings into one illustrative output.
          The values, weights, and topology here are synthetic teaching choices, not facts from a paper.
        </p>
      </header>

      <section className="reading-row" aria-labelledby="reading-title">
        <article className="reading-copy">
          <p className="section-index">01 <span> / </span> follow one path</p>
          <h2 id="reading-title">The model receives a pair, then compresses it.</h2>
          <p>
            Temperature is <strong>0.70</strong> and vibration is <strong>−0.20</strong>. Each reading reaches three hidden ReLU units;
            their activations are combined by a sigmoid output unit. The network sketch keeps that local connection in view
            while the arithmetic stays in the text.
          </p>

          <div className="reading-values" aria-label="Synthetic input readings">
            <div><span>Temperature</span><strong>0.70</strong></div>
            <div><span>Vibration</span><strong>−0.20</strong></div>
          </div>

          <details className="calculation-check">
            <summary>Check the synthetic arithmetic</summary>
            <div className="calculation-body">
              <p>These small weights are chosen only to make the toy calculation inspectable.</p>
              <ol>
                <li><code>h₁ = ReLU(1.00×0.70 + 0.50×(−0.20) + 0.10) = {format(hidden[0])}</code></li>
                <li><code>h₂ = ReLU(−0.40×0.70 + 1.20×(−0.20) + 0.50) = {format(hidden[1])}</code></li>
                <li><code>h₃ = ReLU(0.60×0.70 + 0.30×(−0.20) + 0.10) = {format(hidden[2])}</code></li>
                <li><code>z = 0.50×h₁ + 0.20×h₂ + 0.30×h₃ + 0.08 = {format(logit, 3)}</code></li>
              </ol>
              <p className="calculation-result"><code>σ(z) = {format(score, 3)} ≈ {format(score)}</code></p>
            </div>
          </details>
        </article>

        <aside className="network-side" aria-label="Synthetic 2 to 3 to 1 network illustration">
          <div className="network-frame">
            <div className="network-heading">
              <p className="figure-kicker">Local topology</p>
              <p className="topology">2 <span>→</span> 3 <span>→</span> 1</p>
            </div>
            <MiniNetworkGlyph
              label="Synthetic sensor-to-score multilayer perceptron"
              description={`Synthetic topology with two sensor inputs, three hidden ReLU units, and one sigmoid output. The illustrative score is ${format(score)}.`}
              layers={[
                { id: "inputs", label: "Sensors", nodeCount: 2 },
                { id: "hidden", label: "Hidden", nodeCount: 3 },
                { id: "output", label: "Risk", nodeCount: 1 },
              ]}
              connections={connections}
              focus={pathFocused ? { edges: ["temperature-to-h1", "h1-to-risk"] } : undefined}
              showDetails={false}
              density="compact"
            />
            <div className="score-band" aria-live="polite">
              <span>Illustrative output</span>
              <strong data-score={format(score)}>{format(score)}</strong>
            </div>
            <button
              className="focus-button"
              type="button"
              aria-pressed={pathFocused}
              onClick={() => setPathFocused((focused) => !focused)}
            >
              {pathFocused ? "Show all connections" : "Focus temperature path"}
            </button>
            <p className="figure-note">One highlighted route: temperature → h₁ → score.</p>
          </div>
        </aside>
      </section>

      <footer className="page-note">
        <span aria-hidden="true">✳</span>
        <p>Synthetic weights and values are for explanation only. This score is illustrative, not a real-world risk assessment or a paper result.</p>
      </footer>
    </main>
  );
}
