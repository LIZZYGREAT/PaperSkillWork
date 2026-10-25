import "./network-examples.css";
import { SampleToken } from "../../../foundation/visual-parts/SampleToken";
import { FlowConnector } from "../../../foundation/visual-parts/FlowConnector";
import { SemanticMark } from "../../../foundation/visual-parts/SemanticMark";
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

function SampleMark() {
  const pixels = [0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
  return <SampleToken sampleId="x1" label="示意输入 x₁" pixels={pixels} />;
}

export function LocalNetworkExample() {
  const [focused, setFocused] = useState(false);
  return <article className="pg-local-network" data-network-example="local">
    <header><div><span>01 · 网络内部</span><h3>同一张网络，查看连接怎样相遇</h3></div><button type="button" aria-pressed={focused} onClick={() => setFocused(value => !value)}>
      {focused ? "显示完整连接" : "聚焦局部连接"}
    </button></header>
    <div className="pg-network-inspect">
      <div className="pg-network-input"><span className="pg-network-kicker">输入图像</span><SampleMark /><strong>x₁</strong><small>同一示意输入</small></div>
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
          <FlowConnector label="x₁" direction="down" />
          <section className="pg-model" data-model={model.id} data-model-identity={model.id === "teacher" ? "frozen" : "trainable"}>
            <h4>{model.name}<SemanticMark state={model.id === "teacher" ? "frozen" : "trainable"}>{model.role}</SemanticMark></h4>
            <MiniNetworkGlyph label={`${model.name} 内部教学结构`} description={`${model.name} 独立接收同一输入 x，产生自己的输出。层数仅为示意。`}
              layers={model.widths.map((nodeCount, index) => ({ id: `layer-${index}`, label: index === 0 ? "输入" : index === model.widths.length - 1 ? "输出" : `隐藏 ${index}`, nodeCount }))}
              connectAdjacent showDetails={false} />
          </section>
          <div className="pg-model-output" data-output-for={model.id}><span aria-hidden="true">→</span><div><small>{model.id === "teacher" ? "参考路径" : "学习路径"}</small><strong>{model.output}</strong><span className="pg-model-symbol">{model.symbol}</span></div></div>
        </div>)}
      </div>
    </div>
    <p className="pg-network-caption">两路都读取 x₁。Teacher 的输出作为参照，不作为 Student 的前向输入；这里不展开损失与参数更新。</p>
  </article>;
}
