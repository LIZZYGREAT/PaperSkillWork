# MiniNetworkGlyph · P1 candidate

Use one Glyph for one small layer/node topology. `layers` supplies stable IDs, labels and counts; `connections` supplies explicit displayed-node endpoints, or `connectAdjacent` opts into adjacent full connectivity. `focus` is caller-controlled and never changes geometry. `progress` is a rendering input in [0,1], not a clock. There is no Fisher, training, CNN or probability computation.

`showDetails` (default `true`) controls optional count/identity metadata, layer detail and visible caption. Use `false` when a surrounding figure already explains those details. Layer labels, accessible SVG description and representative-node disclosure always remain. This supports compact diagrams in any outer composition, not a paper-specific model role.

## Runnable single Glyph and parallel composition

This is the exact TSX rendered by Gallery (`demo/src/examples/NetworkExamples.tsx`, only import paths rewritten), compiled by its strict TypeScript build. Render `LocalNetworkExample` for the single 3–5–3 topology; render `ParallelModelsExample` for independent 3-layer / 4-layer configurations. Counts are teaching illustrations. Shared input and whole-model ownership live outside the Glyph; no Teacher → Student forward edge exists.

```tsx
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
  return <span className="pg-network-sample" aria-hidden="true">{pixels.map((value, i) => <i key={i} data-ink={value === 1} />)}</span>;
}

export function LocalNetworkExample() {
  const [focused, setFocused] = useState(false);
  return <article className="pg-local-network" data-network-example="local">
    <header><div><span>01 · 网络内部</span><h3>同一张网络，查看连接怎样相遇</h3></div><button type="button" aria-pressed={focused} onClick={() => setFocused(value => !value)}>
      {focused ? "显示完整连接" : "聚焦局部连接"}
    </button></header>
    <div className="pg-network-inspect">
      <div className="pg-network-input"><span className="pg-network-kicker">输入图像</span><SampleMark /><strong>x₁</strong><small>同一示意输入</small></div>
      <span className="pg-network-link" aria-hidden="true">→</span>
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
  { id: "teacher", name: "Teacher", role: "参数冻结", output: "参照响应", symbol: "t(x₁)", widths: [3, 4, 3] },
  { id: "student", name: "Student", role: "可训练", output: "当前响应", symbol: "s(x₁)", widths: [3, 5, 4, 3] },
];

export function ParallelModelsExample() {
  return <article className="pg-model-composition" data-network-example="parallel">
    <header><div><span>02 · 共享输入，独立模型</span><h3>输入分成两路，模型各自产生响应</h3></div><p>模型身份标在整块容器上；<br />内部小网络仍使用同一个 Glyph。</p></header>
    <div className="pg-model-branches">
      <div className="pg-shared-input" data-shared-input="x"><span className="pg-network-kicker">共享输入</span><SampleMark /><strong>同一输入 x₁</strong><span>分别送入两路</span></div>
      <div className="pg-model-paths">
        {models.map(model => <div className="pg-model-path" key={model.id} data-model-path={model.id} data-from="x" data-to={model.id}>
          <span className="pg-model-arrow" aria-hidden="true">→</span>
          <section className="pg-model" data-model={model.id} data-model-identity={model.id === "teacher" ? "frozen" : "trainable"}>
            <h4>{model.name}<small>{model.role}</small></h4>
            <MiniNetworkGlyph label={`${model.name} 内部教学结构`} description={`${model.name} 独立接收同一输入 x，产生自己的输出。层数仅为示意。`}
              layers={model.widths.map((nodeCount, index) => ({ id: `layer-${index}`, label: index === 0 ? "输入" : index === model.widths.length - 1 ? "输出" : `隐藏 ${index}`, nodeCount }))}
              connectAdjacent showDetails={false} />
          </section>
          <div className="pg-model-output" data-output-for={model.id}><span aria-hidden="true">→</span><div><small>{model.id === "teacher" ? "参考路径" : "学习路径"}</small><strong>{model.output}</strong><em>{model.symbol}</em></div></div>
        </div>)}
      </div>
    </div>
    <p className="pg-network-caption">两路都读取 x₁。Teacher 的输出作为参照，不作为 Student 的前向输入；这里不展开损失与参数更新。</p>
  </article>;
}
```

For the Gallery layout, copy the warm palette token block at the top, the dedicated Network CSS section (`.pg-local-network`, `.pg-network-*`, `.pg-model-*`, `.pg-shared-input`) and related responsive rules from `demo/src/pattern-gallery.css`. Without these optional presentation rules the TSX still renders in document order. Each model row explicitly identifies input `x` and its own output. Frozen uses a dashed container plus text; trainable uses a solid container plus text.

## Copy and boundaries

Copy `foundation/neural-network/` and its required foundation styles/tokens (or use `scaffold-kit --add MiniNetworkGlyph --allow-unapproved` on the first scaffold). The TSX imports its paired CSS. No runtime import from `papers/**` is needed.

Counts above seven are representative, not architecture recovery; explicit endpoints index visible nodes. Compression is disclosed even with `showDetails={false}`. Supply real layer names and long readable labels. Multiple instances have unique ARIA title/description IDs. Narrow layouts reflow labels; the outer layout must reflow model relationships too.

Use blocks for convolutional feature maps, a feature extractor, vector z and class heads, as illustrated by the read-only iCaRL `SharedTrainingHead.tsx`. Use DiagramFlow or local composition for model branches, objectives and update ownership. The EWC 3–5–3 source only motivates a small teaching topology; the LwF `lwfGraph` motivates parallel shared input. Neither validates these demo widths as experimental architecture.

Evidence: `tests/advanced-primitives.spec.mjs` checks fixed geometry under focus, 30 retained edges, separate model ownership and responsive labels. Core smoke fixtures independently cover sparse edges, compression, layer identities and invalid inputs. Human acceptance remains pending.
