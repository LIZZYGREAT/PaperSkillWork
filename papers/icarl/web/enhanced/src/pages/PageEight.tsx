import { useState, type CSSProperties } from "react";
import { FeatureSpaceWorkbench } from "../components/FeatureSpaceWorkbench";
import { GuidedStepControls, type GuidedStep } from "../components/GuidedStepControls";
import {
  CLASS_VISUALS,
  CURRENT_EXEMPLARS,
  P_AFTER,
  PROTOTYPES,
  QUERY_DISTANCES,
  QUERY_FEATURE,
  QUERY_PREDICTION,
  projectSampleFeatures,
  type ClassId,
} from "../data/icarl-runtime";

const steps: readonly GuidedStep[] = [
  { title: "回看训练路径", short: "训练路径" },
  { title: "切换到预测模式", short: "切换模式" },
  { title: "从当前 P 重建原型", short: "当前原型" },
  { title: "把 query 分给最近原型", short: "最终预测" },
  { title: "并排读出两个运行路径", short: "职责对照" },
];

type RuntimeMode = "train" | "predict";
const classOrder: readonly ClassId[] = ["A", "B", "C", "D"];
const currentPoints = projectSampleFeatures(CURRENT_EXEMPLARS, "after", true);

function ModeSwitch({ mode, onChange }: { mode: RuntimeMode; onChange: (mode: RuntimeMode) => void }) {
  return <div className="p8-mode-switch" role="group" aria-label="选择当前运行路径">
    <button type="button" className={mode === "train" ? "is-active" : ""} aria-pressed={mode === "train"} onClick={() => onChange("train")}>TRAIN <small>targets → 更新 Θ</small></button>
    <button type="button" className={mode === "predict" ? "is-active" : ""} aria-pressed={mode === "predict"} onClick={() => onChange("predict")}>PREDICT <small>query → 最近原型</small></button>
  </div>;
}

function PersistentState() {
  return <section className="p8-persistent-state" aria-label="训练和预测之间保留的状态" data-canonical-id="persistent_state">
    <div><span>持久网络状态</span><b>Θ</b><small>当前特征提取器 φ<sub>Θ</sub> 在两条路径间共享</small></div>
    <i aria-hidden="true">+</i>
    <div><span>持久 exemplar 记忆</span><b>P</b><small>保留原始 exemplars，用于 replay 与计算原型</small></div>
  </section>;
}

function TrainingObjects({ mode }: { mode: RuntimeMode }) {
  const trainingVisible = mode === "train";
  return <section className={`p8-training-objects${trainingVisible ? " is-active" : " is-inactive"}`} aria-label="训练阶段的临时对象" data-canonical-id="training_only_state">
    <div className="p8-object-heading"><div><span className="eyebrow">本轮更新中的临时对象</span><h3>参数更新结束后，这些对象不再参与预测</h3></div><span>{trainingVisible ? "训练中" : "预测时无需"}</span></div>
    <div className="p8-object-list">{[["D", "训练集"], ["Q", "冻结的旧响应"], ["yᵢ", "真实标签"], ["L", "损失"]].map(([symbol, label]) => <div key={symbol}><b>{symbol}</b><span>{label}</span></div>)}</div>
  </section>;
}

function TrainingRecap({ mode }: { mode: RuntimeMode }) {
  return <section className="p8-path-card p8-path-card--train" data-canonical-id="training_path" aria-label="训练路径回顾">
    <div className="p8-path-heading"><span className="eyebrow">TRAIN · 表示学习</span><b>训练路径</b></div>
    <div className="p8-train-flow">
      <div><b>D</b><span>训练样本</span></div><i aria-hidden="true">→</i>
      <div className="p8-flow-feature"><b>φ<sub>Θ</sub></b><span>共享表示</span></div><i aria-hidden="true">→</i>
      <div className={`p8-flow-head${mode === "predict" ? " is-inactive" : ""}`}><b>Training Head</b><span>独立 sigmoid 节点</span></div><i aria-hidden="true">→</i>
      <div><b>Hard / soft</b><span>targets → BCE</span></div><i aria-hidden="true">→</i>
      <div className="p8-flow-update"><b>反向传播</b><span>更新 Θ</span></div>
    </div>
    <p>训练头提供可微的学习信号；它的输出不是最终分类规则。</p>
  </section>;
}

function PredictionPath({ stage, mode }: { stage: number; mode: RuntimeMode }) {
  const showQuery = stage >= 3;
  return <section className={`p8-prediction-workbench${mode === "predict" ? " is-active" : ""}`} data-canonical-id="inference_path" aria-label="原型预测路径工作台">
    <div className="p8-prediction-copy">
      <div className="p8-path-heading"><span className="eyebrow">PREDICT · exemplar 均值最近邻</span><b>{showQuery ? "最终决策读取最近原型" : "先用当前 exemplars 重建 prototypes"}</b></div>
      <div className="p8-exemplar-buckets" aria-label="当前记忆 P_after 中各类别的 exemplar 身份">{classOrder.map((classId) => <section key={classId} style={{ "--class-accent": CLASS_VISUALS[classId].color } as CSSProperties}><b>{CLASS_VISUALS[classId].glyph} {CLASS_VISUALS[classId].displayLabel}<small>{P_AFTER[classId].length} 个 exemplar</small></b><div>{P_AFTER[classId].map((sample) => <span key={sample.id} title={`样本 ${sample.id}`}>{sample.id}</span>)}</div></section>)}</div>
      <div className="p8-predict-flow">
        <section><b>P<sub>1</sub> · P<sub>2</sub> · P<sub>3</sub> · P<sub>4</sub></b><span>当前保留的原始 exemplars</span></section><i aria-hidden="true">→</i>
        <section className="p8-flow-feature"><b>当前 φ<sub>Θ</sub></b><span>由同一模型重新编码</span></section><i aria-hidden="true">→</i>
        <section className="p8-flow-prototype"><b>μ<sub>1</sub> … μ<sub>4</sub></b><span>归一化 exemplar 均值</span></section>
      </div>
      {showQuery ? <div className="p8-head-note"><span>Training Head</span><b>仍保留在网络中</b><small>本次最终决策不读取它的 sigmoid argmax</small></div> : null}
    </div>
    <FeatureSpaceWorkbench
      mode={showQuery ? "inference" : "prototypes"}
      title={showQuery ? "查询表示与当前 exemplar 原型" : "当前 P 的四个类别原型"}
      description={showQuery ? "复用第 10 页的 P_after、归一化原型与 query；最近距离给出当前教学轨迹的预测。" : "复用本教程的 P_after：样本身份、φ_after 投影和四类原型均来自同一组运行数据。"}
      points={currentPoints}
      prototypes={PROTOTYPES}
      query={showQuery ? QUERY_FEATURE : undefined}
      unitCircle
      markerScale={0.82}
      showSampleLabels={false}
      asideContent={<><PrototypeKey showQuery={showQuery} />{showQuery ? <div className="p8-result" aria-live="polite"><span>最近原型距离</span><strong><i style={{ color: CLASS_VISUALS[QUERY_PREDICTION].color }}>{CLASS_VISUALS[QUERY_PREDICTION].glyph}</i> {CLASS_VISUALS[QUERY_PREDICTION].displayLabel}</strong><small>距离 {QUERY_DISTANCES[0].distance.toFixed(3)} · 与第 10 页使用同一 query 和结果</small></div> : <p className="p8-feature-note">P<sub>after</sub> 与各类原型都由当前 φ<sub>Θ</sub> 表示；训练时的 Q 不参与原型计算。</p>}</>}
    />
    {showQuery ? <p className="p8-source-note">教学示例复用自第 10 页 · 坐标为固定合成数据，不是训练得到的 checkpoint，也不是论文结果。</p> : null}
  </section>;
}

function PrototypeKey({ showQuery = false }: { showQuery?: boolean }) {
  return <div className="p8-visual-key" aria-label="特征图类别标记">
    {classOrder.map((classId) => <span key={classId}><i style={{ "--key-color": CLASS_VISUALS[classId].color } as CSSProperties} />{CLASS_VISUALS[classId].displayLabel} 原型</span>)}
    {showQuery ? <span><i className="p8-visual-key__query" />待分类 query</span> : null}
  </div>;
}

function PredictionSummary() {
  return <section className="p8-split-predict" data-canonical-id="inference_path">
    <div className="p8-path-heading"><span className="eyebrow">PREDICT · 最终分类器</span><b>原型路径</b></div>
    <div className="p8-predict-summary-flow"><span>P</span><i aria-hidden="true">→</i><span>当前 φ<sub>Θ</sub></span><i aria-hidden="true">→</i><span>μ<sub>1</sub>…μ<sub>4</sub></span><i aria-hidden="true">→</i><strong>最近类均值</strong></div>
    <p>从当前 exemplar memory 重新计算各类均值，再比较 query 与全部已见类别 prototype 的距离。</p>
  </section>;
}

function PredictionFeatureSpace() {
  return <section className="p8-final-feature-space" aria-label="Page 10 运行样本上的 prototype 分类">
    <FeatureSpaceWorkbench
      mode="inference"
      title="同一组 P_after、query 与最近原型"
      description="与第 10 页复用相同的 exemplar 身份、归一化原型和 query 特征；连接线长度来自同一距离计算。"
      points={currentPoints}
      prototypes={PROTOTYPES}
      query={QUERY_FEATURE}
      unitCircle
      markerScale={0.82}
      showSampleLabels={false}
      asideContent={<><PrototypeKey showQuery /><div className="p8-result" aria-live="polite"><span>最近原型距离</span><strong><i style={{ color: CLASS_VISUALS[QUERY_PREDICTION].color }}>{CLASS_VISUALS[QUERY_PREDICTION].glyph}</i> {CLASS_VISUALS[QUERY_PREDICTION].displayLabel}</strong><small>距离 {QUERY_DISTANCES[0].distance.toFixed(3)} · 与第 10 页使用同一 query 和结果</small></div></>}
    />
    <p className="p8-source-note">教学示例复用自第 10 页 · 坐标为固定合成数据，不是训练得到的 checkpoint，也不是论文结果。</p>
  </section>;
}

function ResponsibilityMap({ mode }: { mode: RuntimeMode }) {
  return <section className="p8-responsibility" aria-label="运行时对象责任对照">
    <div className="panel-heading"><div><span className="eyebrow">对象分工</span><h2>同一个当前模型，两条运行路径</h2></div><span className="p8-mini-tag">当前聚焦：{mode === "train" ? "训练" : "预测"}</span></div>
    <div className="p8-responsibility-table" role="table" aria-label="iCaRL 对象生命周期和用途">
      <div role="row"><b role="columnheader">对象</b><b role="columnheader">训练</b><b role="columnheader">预测</b><b role="columnheader">生命周期</b></div>
      <div role="row"><b role="rowheader">Θ · φ<sub>Θ</sub></b><span role="cell">更新表示</span><span role="cell">编码 query 与 exemplars</span><span role="cell">持久共享</span></div>
      <div role="row"><b role="rowheader">Training Head</b><span role="cell">生成 sigmoid 输出并计算损失</span><span role="cell">不用于最终决策</span><span role="cell">保留在网络中</span></div>
      <div role="row"><b role="rowheader">P · 原始 exemplars</b><span role="cell">作为 D 中的 replay 输入</span><span role="cell">重新计算类别原型</span><span role="cell">持久记忆</span></div>
      <div role="row"><b role="rowheader">D、Q、L</b><span role="cell">准备数据并更新模型</span><span role="cell">预测时无需</span><span role="cell">仅本轮更新使用</span></div>
    </div>
    <div className="p8-inference-rule"><span>最终分类器</span><b>当前 exemplar 原型的最近邻</b><small>不是 sigmoid head 的 argmax · 预测过程不读取 Q</small></div>
  </section>;
}

function MemoryUpdateBridge() {
  return <section className="p8-memory-bridge" aria-label="训练结束后更新 exemplar 记忆">
    <div className="p8-memory-bridge__step"><span>训练结束</span><b>Θ_after + P_before</b><small>Θ 已更新；P 仍是旧列表</small></div>
    <i aria-hidden="true">→</i>
    <div className="p8-memory-bridge__step p8-memory-bridge__step--memory"><span>Memory Management</span><b>截短旧列表 + Herding 新类</b><small>分别处理旧记忆与新类 exemplars</small></div>
    <i aria-hidden="true">→</i>
    <div className="p8-memory-bridge__step p8-memory-bridge__step--ready"><span>下一轮就绪</span><b>Θ_after + P_after</b><small>模型与更新后的记忆共同保留</small></div>
  </section>;
}

function CycleMiniMap() {
  return <section className="p8-cycle" aria-label="从持久状态到下一次预测的完整闭环">
    <span className="eyebrow">一次增量学习循环</span>
    <div><b>Θ + P</b><i>→</i><span>D + Q</span><i>→</i><span>更新 Θ</span><i>→</i><span>更新 P</span><i>→</i><b>当前原型</b><i>→</i><strong>最近类别预测</strong></div>
  </section>;
}

export function PageEight({ onContinue }: { onContinue?: () => void }) {
  const [stage, setStage] = useState(0);
  const [mode, setMode] = useState<RuntimeMode>("train");

  function changeStage(nextStage: number) {
    setStage(nextStage);
    if (nextStage === 0) setMode("train");
    else if (nextStage === 1) setMode("train");
    else setMode("predict");
  }

  return <article className="tutorial-page icarl-page icarl-page--p8">
    <header className="page-heading icarl-page__heading">
      <div className="icarl-page__eyebrow"><span>PAGE 08</span><i /> TRAIN ≠ PREDICT</div>
      <h1>同一表示网络，连接两条不同的运行路径</h1>
      <p>Training Head 为共享表示提供可微学习信号；最终预测则用同一 φ<sub>Θ</sub> 重新编码当前 exemplars，并按最近类均值 prototype 分类。</p>
    </header>

    <div className="p8-controls-row"><GuidedStepControls steps={steps} current={stage} onChange={changeStage} label="Page 8 训练与预测路径教学步骤" /><ModeSwitch mode={mode} onChange={setMode} /></div>

    <section className="p8-shared-model" aria-label="训练和预测共享同一个 current model">
      <div className="p8-shared-model__core"><span className="eyebrow">一个当前模型 · 两条后续路径</span><b>φ<sub>Θ</sub></b><span>TRAIN 与 PREDICT 使用同一个当前特征提取器</span></div>
      <TrainingObjects mode={mode} />
      <PersistentState />
    </section>

    {stage === 0 ? <TrainingRecap mode={mode} /> : null}
    {stage === 1 ? <section className="p8-mode-transition panel" aria-label="从训练模式切换到预测模式">
      <div className="panel-heading"><div><span className="eyebrow">切换运行模式</span><h2>{mode === "predict" ? "训练对象退出，先完成记忆更新" : "选择 PREDICT 查看推理阶段"}</h2></div><span className={`p8-mini-tag${mode === "predict" ? " is-predict" : ""}`}>{mode === "predict" ? "预测" : "训练"}</span></div>
      <div className="p8-transition-grid"><div className={mode === "predict" ? "is-muted" : ""}><span>本轮更新对象 · 当前不活跃</span><b>D + Q + labels + loss</b><small>{mode === "predict" ? "这些对象不参与最终决策" : "更新期间会用到这些对象"}</small></div><div><span>训练结束时的持久状态</span><b>Θ_after + P_before</b><small>训练更新 Θ；旧 exemplar 记忆尚待整理</small></div></div>
      <MemoryUpdateBridge />
      <TrainingRecap mode={mode} />
    </section> : null}
    {stage === 2 || stage === 3 ? <PredictionPath stage={stage} mode={mode} /> : null}
    {stage === 4 ? <section className="p8-split-view" aria-label="训练与预测路径并排比较">
      <div className={`p8-split-view__path p8-split-view__path--train${mode === "train" ? " is-focused" : ""}`}><TrainingRecap mode="train" /><div className="p8-split-conclusion"><b>作用</b><span>更新 Θ，让表示同时从旧目标与新目标中学习</span></div></div>
      <div className={`p8-split-view__path p8-split-view__path--predict${mode === "predict" ? " is-focused" : ""}`}><PredictionSummary /><div className="p8-split-conclusion"><b>作用</b><span>将 query 分配给当前最近的 exemplar 均值</span></div></div>
      <PredictionFeatureSpace />
    </section> : null}

    {stage === 4 ? <><ResponsibilityMap mode={mode} /><CycleMiniMap />
      <section className="p8-handoff panel"><div><span className="eyebrow">机制与证据相连</span><h2>这些设计由什么实验支持？</h2><p>下一页将通过 benchmark、组件对照与记忆边界，查看论文证据及其适用范围。</p></div><button type="button" className="icarl-button icarl-button--primary" onClick={onContinue} disabled={!onContinue}>继续到第 9 页 · 实验与边界 <span aria-hidden="true">→</span></button></section>
    </> : null}
  </article>;
}
