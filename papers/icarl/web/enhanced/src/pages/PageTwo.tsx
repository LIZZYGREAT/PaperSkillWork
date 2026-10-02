import { useMemo, useState } from "react";
import { ArchitectureExplorer, type ArchitectureSpec } from "../shared/core/architecture";
import { FeatureSpaceWorkbench } from "../components/FeatureSpaceWorkbench";
import { SampleToken } from "../components/SampleToken";
import { encode2D, sampleById, CLASS_VISUALS } from "../data/icarl-runtime";

const networkSpec: ArchitectureSpec = {
  nodes: [
    { id: "image", label: "Input image x", group: "Input", detail: "A raw sample enters the same shared learner. The token keeps its sample ID across pages." },
    { id: "feature", label: "Feature Extractor φ_Θ", group: "Shared representation", status: "trainable", detail: "The trainable feature extractor maps an image into a representation. The drawing is an illustrative teaching carrier, not the paper's exact ResNet topology." },
    { id: "representation", label: "Representation z = φ_Θ(x)", group: "Shared representation", detail: "z is an internal feature vector. It is not itself a class label or a prediction." },
    { id: "head", label: "Training Head", group: "Class-wise output", status: "trainable", detail: "The network has one sigmoid output node per class seen so far. These outputs support representation learning." },
    { id: "outputs", label: "g₁(x), …, gₜ(x)", group: "Class-wise output", detail: "Each class node returns its own sigmoid response. The responses are not a softmax distribution and are not iCaRL's final prediction rule." },
  ],
  edges: [
    { id: "image-feature", from: "image", to: "feature", label: "image" },
    { id: "feature-representation", from: "feature", to: "representation", label: "extract" },
    { id: "representation-head", from: "representation", to: "head", label: "z" },
    { id: "head-output", from: "head", to: "outputs", label: "sigmoid responses" },
  ],
};

const projectionIds = ["x_7", "x_3", "x_2", "x_8"];

export function PageTwo() {
  const [modelOpen, setModelOpen] = useState(false);
  const [featureState, setFeatureState] = useState<"before" | "after">("before");
  const [classBatchExpanded, setClassBatchExpanded] = useState(false);

  const points = useMemo(() => projectionIds.map((id) => {
    const sample = sampleById(id);
    return { id, classId: sample.classId, point: encode2D(sample, featureState) };
  }), [featureState]);
  const previousPoints = useMemo(() => featureState === "after" ? projectionIds.map((id) => {
    const sample = sampleById(id);
    return { id, classId: sample.classId, point: encode2D(sample, "before") };
  }) : [], [featureState]);

  return (
    <article className="tutorial-page page-two" aria-labelledby="page-two-title">
      <div className="page-kicker"><span>PAGE 02</span><span>Architecture · representation</span></div>
      <header className="page-heading">
        <h1 id="page-two-title">打开模型黑盒：图片怎样变成特征表示</h1>
        <p>iCaRL 持续更新共享 feature extractor。先看一张样本怎样经过模型，再区分 representation 与训练输出。</p>
      </header>

      {!modelOpen ? (
        <section className="blackbox panel" aria-label="Closed model view">
          <div className="blackbox__sample"><SampleToken sample={sampleById("x_7")} role="raw" /><span>raw image · x</span></div>
          <span className="flow-arrow" aria-hidden="true">→</span>
          <div className="blackbox__model"><span className="eyebrow">ONE SHARED LEARNER</span><strong>AI Model</strong></div>
          <span className="flow-arrow" aria-hidden="true">→</span>
          <div className="blackbox__outputs"><span className="eyebrow">CLASS NODES</span><strong>Network outputs</strong></div>
          <button className="action-button" type="button" onClick={() => setModelOpen(true)}>Open Model <span aria-hidden="true">↗</span></button>
        </section>
      ) : (
        <section className="panel architecture-panel" aria-label="Open iCaRL training network">
          <div className="panel-heading"><div><span className="eyebrow">TRAINING NETWORK</span><h2>一条共享特征路径，后接逐类别输出节点</h2></div><button className="quiet-button" type="button" onClick={() => setModelOpen(false)}>Close model</button></div>
          <ArchitectureExplorer spec={networkSpec} showStatus />
          <p className="teaching-carrier"><strong>Illustrative teaching carrier.</strong> 图中只表达 iCaRL 所需的组件与数据流，不声称复现论文实验所用 ResNet 的精确层数或拓扑。</p>
        </section>
      )}

      <section className="representation-panel panel" aria-labelledby="representation-title">
        <div className="panel-heading"><div><span className="eyebrow">ONE SAMPLE · TWO REPRESENTATION STATES</span><h2 id="representation-title">同一张图像，经过 φ_Θ 后得到 z</h2></div>
          <div className="segmented-switch" role="group" aria-label="Representation state">
            <button type="button" aria-pressed={featureState === "before"} onClick={() => setFeatureState("before")}>Before update</button>
            <button type="button" aria-pressed={featureState === "after"} onClick={() => setFeatureState("after")}>After update</button>
          </div>
        </div>
        <div className="representation-equation" aria-label="z equals feature extractor of x">z = φ<sub>Θ</sub>(x) <span>∈ R<sup>d</sup></span></div>
        <div className="representation-flow">
          <div className="conversion-object"><span className="eyebrow">INPUT SAMPLE</span><SampleToken sample={sampleById("x_7")} role="raw" /><small>{CLASS_VISUALS.A.label} identity stays fixed</small></div>
          <span className="flow-arrow" aria-hidden="true">→</span>
          <div className="conversion-object conversion-object--model"><span className="eyebrow">CURRENT MODEL</span><strong>Feature Extractor</strong><span className="math-label">φ<sub>Θ</sub></span></div>
          <span className="flow-arrow" aria-hidden="true">→</span>
          <div className="conversion-object"><span className="eyebrow">INTERNAL VECTOR</span><strong>z = φ<sub>Θ</sub>(x<sub>7</sub>)</strong><small>not a class label</small></div>
        </div>
        <FeatureSpaceWorkbench
          mode="projection"
          title="同一批样本在表示空间中的位置"
          description="2D teaching projection · 固定合成坐标经确定性映射得到；不代表论文测得的特征或真实训练轨迹。"
          points={points}
          previousPoints={previousPoints}
        />
        <p className="identity-note">Image ≠ Representation ≠ Prediction。实际 representation 通常位于高维 R<sup>d</sup>；这里的二维空间只用于看清样本关系，没有 prototype 或类别中心。</p>
      </section>

      <section className="training-head-panel panel">
        <div className="panel-heading"><div><span className="eyebrow">PER-CLASS TRAINING HEAD</span><h2>同一个 z，分别送到已见类别的输出节点</h2></div>
          <button className="quiet-button" type="button" aria-expanded={classBatchExpanded} onClick={() => setClassBatchExpanded((value) => !value)}>{classBatchExpanded ? "Show first batch" : "Add next class batch"}</button>
        </div>
        <div className="head-equation"><span>z</span><span aria-hidden="true">→</span><span>w<sub>y</sub><sup>⊤</sup>z</span><span aria-hidden="true">→</span><span>sigmoid</span><span aria-hidden="true">→</span><strong>g<sub>y</sub>(x)</strong></div>
        <p className="head-explanation">每个已见类别有自己的输出权重 w<sub>y</sub> 和 sigmoid node；图示只讲 forward path，不展开 loss 或 distillation。</p>
        <div className="output-node-group" aria-live="polite">
          <span className="batch-label">After Batch 1</span>
          <div className="output-nodes">{Array.from({ length: 10 }, (_, index) => <span key={index}>w<sub>{index + 1}</sub></span>)}</div>
          {classBatchExpanded ? <><span className="append-label">same head · new nodes appended</span><div className="output-nodes output-nodes--new">{Array.from({ length: 10 }, (_, index) => <span key={index}>w<sub>{index + 11}</sub></span>)}</div></> : null}
        </div>
      </section>

      <aside className="boundary-callout">
        <span className="eyebrow">KEEP THE ROLES SEPARATE</span>
        <p>Training Head 的输出用于训练表示；它不是 iCaRL 最终作出的类别决定。下一段学习路径再讲最终分类规则。</p>
      </aside>
    </article>
  );
}
