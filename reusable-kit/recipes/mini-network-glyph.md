# MiniNetworkGlyph · P1 candidate

Use one Glyph for one small layer/node topology. `layers` supplies stable IDs, labels and counts; `connections` supplies explicit displayed-node endpoints, or `connectAdjacent` opts into adjacent full connectivity. `focus` is caller-controlled and never changes geometry. `progress` is a rendering input in [0,1], not a clock. There is no Fisher, training, CNN or probability computation.

`showDetails` (default `true`) controls optional count/identity metadata, layer detail and visible caption. Use `false` when a surrounding figure already explains those details. Layer labels, accessible SVG description and representative-node disclosure always remain. This supports compact diagrams in any outer composition, not a paper-specific model role.

Glyphs share one normalized coordinate frame. At the same density and rendered width, changing layer count preserves node diameter, drawing height and label baseline. A side-by-side comparison should give both Glyphs equal available width; do not resize their internal SVG separately.

Layers stay centred but use different vertical spans according to their visible node count. Two nodes sit nearer the centre; input and hidden layers spread farther vertically to keep a balanced silhouette. Equal spacing across layers is not a design goal. The canvas grows vertically when more than five visible nodes need space; a comparison of such taller graphs should account for their different row counts.

## Runnable single Glyph and parallel composition

This is the exact TSX rendered by Gallery (`demo/src/examples/NetworkExamples.tsx`, only import paths rewritten), compiled by its strict TypeScript build. Render `LocalNetworkExample` for the single 3–5–3 topology; render `ParallelModelsExample` for independent 3-layer / 4-layer configurations. Counts are teaching illustrations. Shared input and whole-model ownership live outside the Glyph; no Teacher → Student forward edge exists.

Save as `NetworkExamples.tsx` and `network-examples.css`. Also import `shared/foundation/styles/kit.css` in the app. The CSS below is Recipe layout, not hidden Gallery styling.

```tsx
import "./network-examples.css";
import { SampleToken } from "./shared/foundation/visual-parts/SampleToken";
import { FlowConnector } from "./shared/foundation/visual-parts/FlowConnector";
import { SemanticMark } from "./shared/foundation/visual-parts/SemanticMark";
import { useState } from "react";
import { MiniNetworkGlyph, type MiniNetworkLayer } from "./shared/foundation/neural-network/MiniNetworkGlyph";

const layers: MiniNetworkLayer[] = [
  { id: "input", label: "输入", nodeCount: 3 },
  { id: "hidden", label: "隐藏层", nodeCount: 5 },
  { id: "output", label: "输出", nodeCount: 3 },
];
const selectedPath = {
  nodes: ["input:1", "hidden:2", "output:1"],
  edges: ["input-1-hidden-2", "hidden-2-output-1"],
};

function SampleMark() {
  const pixels = [0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
  return <SampleToken sampleId="x1" label="示意输入" pixels={pixels} />;
}

export function LocalNetworkExample() {
  const [focused, setFocused] = useState(false);
  return <article className="pg-local-network" data-network-example="local">
    <header><div><span>01 · 网络内部</span><h3>同一张网络，查看连接怎样相遇</h3></div><button type="button" aria-pressed={focused} onClick={() => setFocused(value => !value)}>
      {focused ? "显示完整连接" : "聚焦局部连接"}
    </button></header>
    <div className="pg-network-inspect">
      <div className="pg-network-input"><span className="pg-network-kicker">输入图像</span><SampleMark /><span className="rk-diagram-symbol" role="math" aria-label="x₁">x<sub>1</sub></span><small>同一示意输入</small></div>
      <FlowConnector label="输入" />
      <div className="pg-network-topology"><span className="pg-network-kicker">三层网络 · 3–5–3</span>
        <MiniNetworkGlyph label="三层教学网络" description="输入 3、隐藏层 5、输出 3；人工指定一条连接路径，不计算 Fisher 重要性。"
          layers={layers} connectAdjacent focus={focused ? selectedPath : undefined} showDetails={false} />
      </div>
      <aside className="pg-network-selection" data-focus-mode={focused ? "selected" : "all"} aria-live="polite"><span className="pg-network-kicker">{focused ? "当前路径" : "完整连接"}</span><strong>{focused ? "沿两条连接看一条路径" : "30 条连接，保留完整结构"}</strong>
        {focused ? <ol><li>输入节点 2</li><li>隐藏节点 3</li><li>输出节点 2</li></ol> : <p>3 个输入节点连接 5 个隐藏节点，再连接 3 个输出节点。</p>}
        <small>切换只改变强调，节点位置与连接集合保持不变。</small>
      </aside>
    </div>
    <p className="pg-network-caption">教学示意 · 节点数不对应论文实验架构。高亮由调用者指定，不是自动计算的 Fisher 重要性。</p>
  </article>;
}

const models = [
  { id: "teacher", name: "Teacher", role: "参数冻结", output: "参照响应", symbol: "t", widths: [3, 4, 3] },
  { id: "student", name: "Student", role: "可训练", output: "当前响应", symbol: "s", widths: [3, 5, 4, 3] },
];

export function ParallelModelsExample() {
  return <article className="pg-model-composition" data-network-example="parallel">
    <header><div><span>02 · 共享输入，独立模型</span><h3>输入分成两路，模型各自产生响应</h3></div><p>模型身份标在整块容器上；<br />内部小网络仍使用同一个 Glyph。</p></header>
    <div className="pg-model-branches">
      <div className="pg-shared-input" data-shared-input="x"><span className="pg-network-kicker">共享输入</span><SampleMark /><strong>同一输入 <span className="rk-diagram-symbol" role="math" aria-label="x₁">x<sub>1</sub></span></strong><span>分别送入两路</span></div>
      <div className="pg-model-paths">
        {models.map(model => <div className="pg-model-path" key={model.id} data-model-path={model.id} data-from="x" data-to={model.id}>
          <FlowConnector label="x₁" direction="down"><span className="rk-diagram-symbol">x<sub>1</sub></span></FlowConnector>
          <section className="pg-model" data-model={model.id} data-model-identity={model.id === "teacher" ? "frozen" : "trainable"}>
            <h4>{model.name}<SemanticMark state={model.id === "teacher" ? "frozen" : "trainable"}>{model.role}</SemanticMark></h4>
            <MiniNetworkGlyph label={`${model.name} 内部教学结构`} description={`${model.name} 独立接收同一输入 x，产生自己的输出。层数仅为示意。`}
              layers={model.widths.map((nodeCount, index) => ({ id: `layer-${index}`, label: index === 0 ? "输入" : index === model.widths.length - 1 ? "输出" : `隐藏 ${index}`, nodeCount }))}
              connectAdjacent showDetails={false} />
          </section>
          <div className="pg-model-output" data-output-for={model.id}><FlowConnector label={model.output} direction="down" /><span className="pg-model-symbol rk-diagram-symbol" role="math" aria-label={`${model.symbol}(x₁)`}>{model.symbol}(x<sub>1</sub>)</span><small>{model.id === "teacher" ? "参考路径" : "学习路径"}</small></div>
        </div>)}
      </div>
    </div>
    <p className="pg-network-caption">两路都读取 x₁。Teacher 的输出作为参照，不作为 Student 的前向输入；这里不展开损失与参数更新。</p>
  </article>;
}
```

```css
/* Copy this Recipe layout alongside NetworkExamples.tsx. */
.pg-local-network, .pg-model-composition { display: grid; gap: 24px; min-width: 0; padding-block: 28px; border-block: 1px solid var(--rk-line); }
.pg-local-network header, .pg-model-composition header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; align-items: center; }
.pg-local-network header > div, .pg-model-composition header > div { display: grid; gap: 8px; }
.pg-local-network h3, .pg-model-composition h3 { margin: 0; font-size: 22px; line-height: 1.4; }
.pg-local-network p, .pg-model-composition p { margin: 0; color: var(--rk-muted); font-size: 14px; line-height: 1.7; }
.pg-network-kicker, .pg-local-network header span, .pg-model-composition header span { color: var(--rk-muted); font-size: 13px; }
.pg-local-network button { padding: 10px 16px; border: 1px solid var(--rk-line-strong); border-radius: 6px; font: inherit; font-size: 14px; color: var(--rk-accent-strong); background: var(--rk-surface); cursor: pointer; }
.pg-local-network button[aria-pressed="true"] { background: var(--rk-accent-soft); }
.pg-local-network button:focus-visible { outline: 2px solid var(--rk-focus); outline-offset: 3px; }
.pg-network-inspect { display: grid; grid-template-columns: 96px 44px minmax(0, 360px) minmax(160px, 240px); justify-content: center; align-items: center; gap: 24px; padding-block: 16px; }
.pg-network-input, .pg-network-topology, .pg-network-selection { display: grid; gap: 14px; min-width: 0; }
.pg-network-input { justify-items: center; text-align: center; }
.pg-network-input small, .pg-network-selection small { color: var(--rk-muted); font-size: 13px; line-height: 1.7; }
.pg-network-selection { align-content: start; border-inline-start: 2px solid var(--rk-line); padding-inline-start: 22px; }
.pg-network-selection > strong { font-size: 18px; line-height: 1.5; }
.pg-network-selection ol { margin: 0; padding-inline-start: 22px; font-size: 14px; line-height: 1.8; }
.pg-model-branches { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; }
.pg-shared-input { position: relative; display: grid; grid-template-columns: auto auto; justify-self: center; align-items: center; justify-items: center; gap: 10px 24px; text-align: center; font: 400 var(--rk-type-diagram-label)/1.5 var(--rk-font-body); }
.pg-shared-input .pg-network-kicker { font-size: var(--rk-type-diagram-label); }
.pg-shared-input .rk-sample-token { grid-row: 1 / 4; }
.pg-shared-input::after { position: absolute; top: 100%; left: 50%; width: 1px; height: 18px; background: var(--rk-line-strong); content: ""; }
.pg-model-paths { position: relative; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin-inline: 24px; }
.pg-model-paths::before { position: absolute; top: 0; left: calc(25% - 6px); right: calc(25% - 6px); height: 1px; background: var(--rk-line-strong); content: ""; }
.pg-model-path { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto 1fr auto; gap: 18px; justify-items: center; align-content: start; }
.pg-model { box-sizing: border-box; display: grid; align-content: start; gap: 18px; width: 100%; min-width: 0; padding: 20px; border: 1px solid var(--rk-line-strong); border-radius: 8px; background: var(--rk-surface); }
.pg-model[data-model-identity="frozen"] { border-style: dashed; }
.pg-model h4 { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin: 0; font-size: 18px; }
.pg-model-output { display: grid; justify-items: center; gap: 6px; }
.pg-model-output small { font: 400 var(--rk-type-caption)/1.5 var(--rk-font-body); color: var(--rk-muted); }
.pg-network-caption { font-size: 13px; color: var(--rk-muted); }
.pg-primitive-boundary { font-size: 14px; color: var(--rk-muted); line-height: 1.7; }
@media (max-width: 1100px) { .pg-network-inspect { grid-template-columns: 80px 44px minmax(0, 360px); } .pg-network-selection { grid-column: 1 / -1; } }
@media (max-width: 700px) {
  .pg-network-inspect, .pg-model-branches { grid-template-columns: minmax(0, 1fr); }
  .pg-network-inspect > .rk-flow-connector svg { transform: rotate(90deg); }
  .pg-network-inspect > .rk-flow-connector { padding-block: 10px; }
  .pg-model-paths { grid-template-columns: minmax(0, 1fr); margin: 0; }
  .pg-model-paths::before { display: none; }
  .pg-model { padding: 14px; }
}
```
