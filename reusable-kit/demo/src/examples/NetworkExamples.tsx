import { useState } from "react";
import { MiniNetworkGlyph, type MiniNetworkLayer } from "../../../foundation/neural-network/MiniNetworkGlyph";

const layers: MiniNetworkLayer[] = [
  { id: "input", label: "输入", nodeCount: 3 },
  { id: "hidden", label: "隐藏层", nodeCount: 5 },
  { id: "output", label: "输出", nodeCount: 3 },
];
const selectedPath = {
  nodes: ["input:1", "hidden:2", "output:1"],
  edges: ["input-1-hidden-2", "hidden-2-output-1"],
};

export function LocalNetworkExample() {
  const [focused, setFocused] = useState(false);
  return <article className="pg-local-network" data-network-example="local">
    <header><span>01 / 局部连接</span><h3>同一个 3–5–3 网络，改变关注的连接</h3></header>
    <button type="button" aria-pressed={focused} onClick={() => setFocused(value => !value)}>
      {focused ? "显示完整连接" : "聚焦局部连接"}
    </button>
    <MiniNetworkGlyph label="三层教学网络" description="输入 3、隐藏层 5、输出 3；人工指定一条连接路径，不计算 Fisher 重要性。"
      layers={layers} connectAdjacent focus={focused ? selectedPath : undefined} showDetails={false} />
    <p>教学示意，节点数不对应论文实验架构。高亮由调用者指定，用于检查连接关系，不是自动计算的 Fisher 重要性。</p>
  </article>;
}

const models = [
  { id: "teacher", name: "Teacher", role: "冻结模型 · 参数不更新", output: "reference output · 参照响应", widths: [3, 4, 3] },
  { id: "student", name: "Student", role: "可训练模型 · 参数可更新", output: "current output · 当前响应", widths: [3, 5, 4, 3] },
];

export function ParallelModelsExample() {
  return <article className="pg-model-composition" data-network-example="parallel">
    <header><span>02 / 外层组合</span><h3>同一输入，两个独立模型</h3></header>
    <p>外层负责分支和模型身份；每个 Glyph 只画一个模型的内部小网络。这里仅示意并行前向关系。</p>
    <div className="pg-model-branches">
      <div className="pg-shared-input" data-shared-input="x"><strong>同一输入 x</strong><span>分别送入两路</span></div>
      <div className="pg-model-paths">
        {models.map(model => <div className="pg-model-path" key={model.id} data-model-path={model.id} data-from="x" data-to={model.id}>
          <span className="pg-model-arrow" aria-hidden="true">→</span>
          <section className="pg-model" data-model={model.id} data-model-identity={model.id === "teacher" ? "frozen" : "trainable"}>
            <h4>{model.name}<small>{model.role}</small></h4>
            <MiniNetworkGlyph label={`${model.name} 内部教学结构`} description={`${model.name} 独立接收同一输入 x，产生自己的输出。层数仅为示意。`}
              layers={model.widths.map((nodeCount, index) => ({ id: `layer-${index}`, label: index === 0 ? "输入" : index === model.widths.length - 1 ? "输出" : `隐藏 ${index}`, nodeCount }))}
              connectAdjacent showDetails={false} />
          </section>
          <div className="pg-model-output" data-output-for={model.id}><span aria-hidden="true">→</span><strong>{model.output}</strong></div>
        </div>)}
      </div>
    </div>
  </article>;
}
