import { useState } from "react";
import type { ReactNode } from "react";
import type { RuntimeObjectId } from "../contracts/ids";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";

const ASSEMBLY_STEPS = [
  { title: "Measure displacement", note: "Compare the current parameter with the fixed Task-A anchor." },
  { title: "Square the displacement", note: "Keep the size of the deviation; positive and negative directions do not cancel." },
  { title: "Weight each parameter", note: "Use its Task-A Fisher value so equal-size moves can carry different costs." },
  { title: "Sum and scale", note: "Aggregate across parameters, then use λ for the overall constraint strength." },
];

function FormulaToken({ id, object, children }: { id: "task_b_loss" | "lambda_ewc" | "fisher_a_i" | "theta" | "theta_a_star" | "task_b_gradient" | "ewc_gradient" | "total_gradient" | "ewc_objective" | "ewc_penalty"; object: RuntimeObjectId; children: ReactNode }) {
  const api = useReferenceApi();
  return <ReferenceTrigger id={id} onActivate={() => api.setActiveRuntimeObject(object)}>{children}</ReferenceTrigger>;
}

function RuntimeNode({ id, title, detail, tag }: { id: RuntimeObjectId; title: string; detail: string; tag?: string }) {
  const api = useReferenceApi();
  const active = api.activeRuntimeObject === id;
  return <button type="button" className={`runtime-node ${active ? "is-highlighted" : ""}`} onClick={() => api.setActiveRuntimeObject(active ? undefined : id)} aria-pressed={active} data-runtime-id={id}><span>{tag ?? "RUNTIME OBJECT"}</span><b>{title}</b><small>{detail}</small></button>;
}

function ParameterGradientExample({ label, fisherWeight, ewcGradient, totalGradient, strong }: { label: string; fisherWeight: string; ewcGradient: string; totalGradient: string; strong?: boolean }) {
  return (
    <div className={`parameter-gradient-example ${strong ? "is-strong" : ""}`}>
      <div className="parameter-gradient-example__heading"><b>{label}</b><span>{fisherWeight}</span></div>
      <div className="parameter-gradient-example__row"><span>Task-B gradient</span><b>−0.20</b></div>
      <div className="parameter-gradient-example__row"><span>EWC gradient</span><b>+{ewcGradient}</b></div>
      <div className="parameter-gradient-example__row is-total"><span>Total gradient</span><b>{totalGradient}</b></div>
      <div className="parameter-gradient-example__track"><i /></div>
      <small>同样的 Task-B 信号下，{strong ? "抵消更多，但总梯度仍非零" : "抵消较少，参数保留更大适应空间"}。</small>
    </div>
  );
}

export function PageObjective() {
  const [assemblyStep, setAssemblyStep] = useState(0);
  const api = useReferenceApi();
  const assembly = ASSEMBLY_STEPS[assemblyStep];
  return (
    <article className="ewc-page ewc-page--objective" aria-labelledby="objective-title">
      <header className="ewc-page-header" id="ewc-objective">
        <div className="ewc-page-header__kicker"><span>06</span> OBJECTIVE → UPDATE</div>
        <h1 id="objective-title">把旧任务留下的参数信息，接入 Task B 的更新。</h1>
        <p className="ewc-page-header__dek">Task B 需要学习新数据；Task A 留下固定的参数位置和 Fisher 估计。EWC 把两条路径合到同一个目标里。</p>
      </header>

      <section className="objective-inputs" aria-label="Objective inputs">
        <div className="objective-input objective-input--current"><span>NEW TASK · CURRENT LOSS</span><b>Task B data → L_B(θ)</b><small>继续适应当前任务</small></div>
        <div className="objective-input__plus">+</div>
        <div className="objective-input objective-input--memory"><span>OLD TASK · SAVED STATE</span><b>θ_A* + F_A</b><small>Task A 的 anchor 与局部敏感性近似</small></div>
      </section>

      <section className="penalty-assembly" id="penalty-components" aria-labelledby="assembly-title">
        <div className="fisher-workbench__header"><div><span className="ewc-section-index">A / BUILD THE CONSTRAINT</span><h2 id="assembly-title">先逐项装配旧任务的 penalty</h2></div><span className="ewc-micro-label">STEP {assemblyStep + 1} / 04</span></div>
        <div className="assembly-step-tabs" role="group" aria-label="Penalty assembly steps">
          {ASSEMBLY_STEPS.map((item, index) => <button key={item.title} type="button" className={assemblyStep === index ? "is-active" : ""} aria-current={assemblyStep === index ? "step" : undefined} onClick={() => setAssemblyStep(index)}><span>{String(index + 1).padStart(2, "0")}</span><b>{item.title}</b></button>)}
        </div>
        <div className="assembly-explanation" aria-live="polite"><span className="assembly-explanation__dot" /><p><strong>{assembly.title}.</strong> {assembly.note}</p></div>
        <div className="assembly-formula" role="math" aria-label={`Penalty assembly step ${assemblyStep + 1}: ${assembly.title}`}>
          {assemblyStep === 0 ? <><FormulaToken id="theta" object="current-parameters"><span className="math-variable">θ<sub>i</sub></span></FormulaToken><span className="assembly-compare">compare with</span><FormulaToken id="theta_a_star" object="task-a-anchor"><span className="math-variable">θ<sub>A,i</sub>*</span></FormulaToken></> : null}
          {assemblyStep === 1 ? <><span>(</span><FormulaToken id="theta" object="current-parameters"><span className="math-variable">θ<sub>i</sub></span></FormulaToken><span> − </span><FormulaToken id="theta_a_star" object="task-a-anchor"><span className="math-variable">θ<sub>A,i</sub>*</span></FormulaToken><span>)<sup>2</sup></span></> : null}
          {assemblyStep >= 2 ? <>{assemblyStep === 3 ? <span className="math-fraction"><span>λ</span><i /><span>2</span></span> : null}{assemblyStep === 3 ? <span> Σ<sub>i</sub> </span> : null}<FormulaToken id="fisher_a_i" object="task-a-fisher"><span className="math-variable">F<sub>A,i</sub></span></FormulaToken><span> (</span><FormulaToken id="theta" object="current-parameters"><span className="math-variable">θ<sub>i</sub></span></FormulaToken><span> − </span><FormulaToken id="theta_a_star" object="task-a-anchor"><span className="math-variable">θ<sub>A,i</sub>*</span></FormulaToken><span>)<sup>2</sup></span></> : null}
        </div>
        {assemblyStep === 3 ? <div className="objective-equation" aria-labelledby="objective-equation-label">
          <div className="objective-equation__label" id="objective-equation-label"><span className="source-badge source-badge--paper">PAPER · EQUATION (3)</span><span>Task B loss + Task A constraint</span></div>
          <div className="ewc-equation ewc-equation--objective" role="math" aria-label="L of theta equals Task-B loss plus lambda over two times the sum of Task-A Fisher weight times squared parameter displacement from the Task-A anchor">
            <span className="math-variable">L(θ)</span><span> = </span><FormulaToken id="task_b_loss" object="task-b-loss"><span className="math-variable">L<sub>B</sub>(θ)</span></FormulaToken><span> + </span>
            <span className="math-fraction"><span>1</span><i /><span>2</span></span><FormulaToken id="lambda_ewc" object="ewc-penalty"><span className="math-variable">λ</span></FormulaToken><span> Σ<sub>i</sub> </span>
            <FormulaToken id="fisher_a_i" object="task-a-fisher"><span className="math-variable">F<sub>A,i</sub></span></FormulaToken><span>(</span><FormulaToken id="theta" object="current-parameters"><span className="math-variable">θ<sub>i</sub></span></FormulaToken><span> − </span><FormulaToken id="theta_a_star" object="task-a-anchor"><span className="math-variable">θ<sub>A,i</sub>*</span></FormulaToken><span>)<sup>2</sup></span>
          </div>
          <p>F<sub>A,i</sub> 区分参数之间的相对约束强度；λ 调整整个约束的强度。二者作用不同。</p>
        </div> : null}
      </section>

      {assemblyStep === 3 ? <>
        <section className="formula-runtime-link" aria-label="Formula to runtime links">
          <div className="formula-runtime-link__heading"><span className="ewc-section-index">SYMBOL ↔ RUNTIME</span><p>点击公式里的符号查看它对应的运行对象。</p></div>
          <div className="runtime-object-row">
            <RuntimeNode id="task-b-loss" title="Task-B loss" detail="new-task objective" tag="CURRENT TASK" />
            <RuntimeNode id="task-a-anchor" title="θ_A*" detail="frozen Task-A anchor" tag="SAVED STATE" />
            <RuntimeNode id="task-a-fisher" title="F_A" detail="per-parameter weights" tag="SAVED STATE" />
            <RuntimeNode id="ewc-penalty" title="EWC penalty" detail="quadratic constraint" tag="CONSTRAINT" />
          </div>
          {api.activeRuntimeObject ? <p className="runtime-focus-note" aria-live="polite">当前关联对象：<b>{api.activeRuntimeObject}</b></p> : null}
        </section>

        <section className="gradient-section" id="gradient-junction" aria-labelledby="gradient-title">
          <div className="ewc-section-heading"><div><span className="ewc-section-index">B / GRADIENT JUNCTION</span><h2 id="gradient-title">约束通过额外梯度影响更新，不会冻结参数</h2></div><p>由论文式 (3) 求导得到下式；它是公式的导数，不是论文单独列出的新公式。</p></div>
          <div className="ewc-equation ewc-equation--gradient" role="math" aria-label="Derivative of the EWC objective with respect to parameter i equals Task-B gradient plus lambda times Fisher weight times displacement from the Task-A anchor">
            <span>∂L / ∂θ<sub>i</sub> = </span><FormulaToken id="task_b_gradient" object="task-b-gradient"><span className="math-variable">g<sub>B,i</sub></span></FormulaToken><span> + </span><FormulaToken id="ewc_gradient" object="ewc-gradient"><span className="math-variable">λ F<sub>A,i</sub>(θ<sub>i</sub> − θ<sub>A,i</sub>*)</span></FormulaToken>
          </div>
          <div className="gradient-junction" aria-label="Task and EWC gradients join before the optimizer update">
            <div className="gradient-junction__branch"><RuntimeNode id="task-b-gradient" title="g_B" detail="Task-B loss gradient" tag="LEARN TASK B" /><span className="gradient-junction__line" aria-hidden="true" /></div>
            <span className="gradient-junction__plus" aria-hidden="true">+</span>
            <div className="gradient-junction__branch"><RuntimeNode id="ewc-gradient" title="g_EWC" detail="penalty gradient; descent pulls toward θ_A*" tag="EWC PENALTY" /><span className="gradient-junction__line" aria-hidden="true" /></div>
            <span className="gradient-junction__merge" aria-hidden="true">↘</span>
            <div className="gradient-junction__result"><RuntimeNode id="total-gradient" title="g_total = g_B + g_EWC" detail="combined update signal" tag="TOTAL GRADIENT" /></div>
            <span className="gradient-junction__line gradient-junction__line--to-optimizer" aria-hidden="true" />
            <RuntimeNode id="optimizer" title="optimizer.step()" detail="updates current θ" tag="PARAMETERS MAY MOVE" />
          </div>
          <div className="gradient-example-heading"><span className="source-badge source-badge--example">TEACHING EXAMPLE</span><p>示意梯度值，用来显示约束如何抵消更新信号；不是论文实验结果。</p></div>
          <div className="parameter-outcomes"><ParameterGradientExample label="HIGH-FISHER PARAMETER · θ₁" fisherWeight="stronger relative constraint" ewcGradient="0.16" totalGradient="−0.04" strong /><ParameterGradientExample label="LOW-FISHER PARAMETER · θ₂" fisherWeight="more room to adapt" ewcGradient="0.01" totalGradient="−0.19" /></div>
          <div className="ewc-not-freeze"><b>Constrain ≠ freeze</b><span>参数仍然可以变化。EWC 提高高 Fisher 参数偏离旧 anchor 的代价，让更新幅度受到更强约束。</span></div>
        </section>
      </> : null}

      <section className="w7-handoff" aria-label="W7 human review boundary"><span className="w7-handoff__marker">W7 REVIEW BOUNDARY</span><p>这就是 W6 代表性切片的终点。完整页面尚未展开；请在此处人工核验问题表达、Fisher 来源边界、公式可读性与公式到运行对象的对应关系。</p><button type="button" className="ewc-button ewc-button--quiet" onClick={() => api.navigatePage("page-01-problem")}>← 回到切片开头</button></section>
    </article>
  );
}
