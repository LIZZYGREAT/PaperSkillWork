import { useState } from "react";
import { FlowStepper } from "../shared/core/flow-stepper";
import { ParameterModel } from "../components/ParameterModel";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";

const ESTIMATION_STEPS = [
  { id: "fixed-anchor", title: "固定在 θ_A*", description: "Task A 已完成训练。估计期间仍使用同一个神经网络，但参数停在 Task-A 解 θ_A*。", statusText: "PARAMETERS FIXED · OPTIMIZER OFF" },
  { id: "sample-forward", title: "取一个 Task-A 样本", description: "样本 (xₙ, yₙ) 经过固定参数的网络，得到对观测标签的预测概率。", statusText: "FORWARD PASS · SAME MODEL" },
  { id: "log-score", title: "计算 log-probability 的梯度", description: "∂ log pθ(yₙ | xₙ) / ∂ θᵢ 描述这个 log-probability 在当前点对参数 θᵢ 的局部变化率。", statusText: "GRADIENT ENABLED" },
  { id: "square-score", title: "平方每个参数的梯度", description: "梯度的正负方向不再互相抵消；平方后的量表达局部变化幅度。", statusText: "SQUARE · KEEP PARAMETER-WISE VALUES" },
  { id: "aggregate-samples", title: "跨样本平均", description: "对选定的 Task-A 样本累计或平均每个参数的平方梯度，形成一个对角估计。", statusText: "SAMPLE AGGREGATION · NO PARAMETER UPDATE" },
  { id: "fisher-output", title: "得到 F_A", description: "输出与参数块逐项对齐的 Task-A Fisher 估计，供下一页的约束目标使用。", statusText: "OUTPUT · F_A" },
];

export function PageFisher() {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"training" | "estimation">("estimation");
  const api = useReferenceApi();
  const selectStep = (index: number) => {
    setStep(index);
    const linked: (typeof api.activeRuntimeObject)[] = ["task-a-anchor", "task-a-batch", "prediction-probabilities", "fisher-estimator", "task-a-fisher", "task-a-fisher"];
    api.setActiveRuntimeObject(linked[index]);
  };
  return (
    <article className="ewc-page ewc-page--fisher" aria-labelledby="fisher-title">
      <header className="ewc-page-header" id="fisher-estimation">
        <div className="ewc-page-header__kicker"><span>05</span> LOCAL SENSITIVITY</div>
        <h1 id="fisher-title">Fisher 从哪里来？从固定参数下的概率梯度开始。</h1>
        <p className="ewc-page-header__dek">它不是凭空出现的分数。我们沿着同一个模型，追踪旧任务样本的 log-probability 如何随参数微小变化，再把逐样本信号汇总。</p>
      </header>

      <section className="fisher-origin" id="score-gradient" aria-label="Fisher estimation starts at the model output">
        <div className="fisher-origin__copy"><span className="ewc-section-index">START FROM A FAMILIAR OUTPUT</span><p>当前网络在 θ_A* 下给出的 <ReferenceTrigger id="p_theta_y_given_x" onActivate={() => api.setActiveRuntimeObject("prediction-probabilities")}>p_θ(y | x)</ReferenceTrigger> 是估计的起点。现在的问题是：这项概率对某个参数 θᵢ 有多敏感？</p></div>
        <div className="fisher-origin__bridge"><span>local posterior width</span><i aria-hidden="true">→</i><b>computable sensitivity signal</b></div>
      </section>

      <section className="fisher-workbench" aria-labelledby="fisher-workbench-title">
        <div className="fisher-workbench__header"><div><span className="ewc-section-index">A / ESTIMATION PATH</span><h2 id="fisher-workbench-title">从一个样本的 score，到参数级估计</h2></div><span className="ewc-micro-label">SELECT A STEP</span></div>
        <div className="fisher-workbench__body">
          <div className="fisher-model-panel">
            <div className="fisher-model-panel__top"><span className="ewc-live-mark"><i /> SAME NETWORK</span><span className="ewc-state-pill is-fixed">θ = θ_A*</span></div>
            <ParameterModel mode="fixed" activeObject={api.activeRuntimeObject} />
            <div className="fisher-model-panel__legend"><span><i className="legend-swatch is-parameter" />parameter groups</span><span><i className="legend-swatch is-fixed" />fixed during this pass</span></div>
          </div>
          <FlowStepper steps={ESTIMATION_STEPS} step={step} onStepChange={(_item, index) => selectStep(index)} label="Fisher estimation explanation" />
        </div>
      </section>

      <section className="fisher-formula-area" id="square-and-aggregate" aria-labelledby="fisher-formula-title">
        <div className="fisher-formula-area__heading"><div><span className="ewc-section-index">THE SELECTED ESTIMATOR</span><h2 id="fisher-formula-title">逐项保留“梯度大小”，再跨样本汇总</h2></div><span className="source-badge source-badge--background">GENERAL BACKGROUND</span></div>
        <div className="ewc-equation ewc-equation--fisher" role="math" aria-label="Selected observed-label empirical Fisher estimator, not a recipe specified by the EWC paper">
          <span className="math-variable">F<sub>A,i</sub></span><span> ≈ </span><span className="math-fraction"><span>1</span><i /><span>N</span></span><span> Σ<sub>n=1</sub><sup>N</sup> </span><span>(</span><span className="math-fraction"><span>∂</span><i /><span>∂θ<sub>i</sub></span></span><span> log p<sub>θ</sub>(y<sub>n</sub> | x<sub>n</sub>) )</span><sup>2</sup>
        </div>
        <p className="fisher-formula-area__note"><ReferenceTrigger id="empirical_fisher_estimator_background">本页采用的 observed-label empirical-Fisher 估计示例</ReferenceTrigger>。2017 年 EWC 论文没有规定这一通用的逐样本梯度平方估计方法；这里用它把计算路径具体化。</p>
      </section>

      <section className="training-mode-compare" id="training-vs-estimation" aria-labelledby="mode-title">
        <div className="ewc-section-heading"><div><span className="ewc-section-index">B / TWO DIFFERENT MODES</span><h2 id="mode-title">反向计算梯度，不等于更新参数</h2></div><p>选择运行模式，查看 Gradient 和 optimizer.step() 的区别。</p></div>
        <div className="mode-tabs" role="group" aria-label="运行模式"><button type="button" aria-pressed={mode === "training"} className={mode === "training" ? "is-active" : ""} onClick={() => setMode("training")}>Normal Training</button><button type="button" aria-pressed={mode === "estimation"} className={mode === "estimation" ? "is-active" : ""} onClick={() => setMode("estimation")}>Fisher Estimation</button></div>
        <div className="mode-compare-grid" aria-live="polite">
          <div className={`mode-compare-card ${mode === "training" ? "is-selected" : ""}`}><span className="mode-compare-card__index">{mode === "training" ? "CURRENT MODE" : "MODE 01"}</span><h3>普通训练</h3><div className="mode-steps"><span>forward</span><i>→</i><span>loss</span><i>→</i><span>backward</span><i>→</i><span className="is-on">optimizer.step()</span></div><div className="mode-status-row"><span>Gradient <b>ENABLED</b></span><span>Optimizer <b>ON</b></span><span>Parameters <b>MOVE</b></span></div></div>
          <div className={`mode-compare-card ${mode === "estimation" ? "is-selected" : ""}`}><span className="mode-compare-card__index">{mode === "estimation" ? "CURRENT MODE" : "MODE 02"}</span><h3>Fisher Estimation</h3><div className="mode-steps"><span>forward</span><i>→</i><span>log p</span><i>→</i><span>gradient²</span><i>→</i><span className="is-off">accumulate</span></div><div className="mode-status-row"><span>Gradient <b>ENABLED</b></span><span>Optimizer <b>OFF</b></span><span>Parameters <b>FIXED</b></span></div></div>
        </div>
        <p className="mode-conclusion">Fisher Estimation 需要 gradient，但不调用 <code>optimizer.step()</code>；本示例的参数保持在 θ_A*。</p>
      </section>

      <section className="fisher-result" id="fisher-role" aria-labelledby="fisher-result-title">
        <div className="fisher-result__text"><span className="ewc-section-index">OUTPUT FOR PAGE 6</span><h2 id="fisher-result-title">Task A 留下两个不同对象</h2><p><ReferenceTrigger id="fisher_information">Fisher</ReferenceTrigger> 在 EWC 中作为局部 precision 的近似，用来区分参数约束强弱；不是精确的参数重要性，也不等于精确 Posterior Hessian。</p></div>
        <div className="fisher-result__objects"><div className="state-object"><span>FROZEN REFERENCE</span><b><ReferenceTrigger id="theta_a_star" onActivate={() => api.setActiveRuntimeObject("task-a-anchor")}>θ_A*</ReferenceTrigger></b><small>Task A 训练结束时的参数</small></div><div className="state-object state-object--fisher"><span>PARAMETER-WISE ESTIMATE</span><b><ReferenceTrigger id="fisher_a" onActivate={() => api.setActiveRuntimeObject("task-a-fisher")}>F_A</ReferenceTrigger></b><small>与参数块对齐的局部敏感性近似</small></div></div>
        <button type="button" className="ewc-button ewc-button--next" onClick={() => api.navigatePage("page-06-ewc-objective")}>下一段切片：把旧状态接入 Task B <span>06 →</span></button>
      </section>
    </article>
  );
}
