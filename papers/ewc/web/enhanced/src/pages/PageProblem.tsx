import { useState } from "react";
import { CompareView } from "../shared/optional/compare-view";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";
import { ParameterModel } from "../components/ParameterModel";

export function PageProblem() {
  const [taskBUpdated, setTaskBUpdated] = useState(false);
  const api = useReferenceApi();
  return (
    <article className="ewc-page ewc-page--problem" aria-labelledby="problem-title">
      <header className="ewc-page-header" id="problem-context">
        <div className="ewc-page-header__kicker"><span>01</span> THE PROBLEM</div>
        <h1 id="problem-title">学习 Task B，模型仍会改动同一组参数。</h1>
        <p className="ewc-page-header__dek">顺序学习让一个模型先后面对不同任务。继续适应新任务需要更新原有参数；其中一部分也支撑着已经学会的 Task A。</p>
      </header>

      <section className="problem-story" aria-labelledby="conflict-heading">
        <div className="problem-story__heading">
          <div><span className="ewc-section-index">A / SHARED MODEL</span><h2 id="conflict-heading">新任务到来时，同一个模型继续训练</h2></div>
          <span className={`problem-story__step ${taskBUpdated ? "is-after" : ""}`}>{taskBUpdated ? "AFTER TASK B UPDATE" : "AFTER TASK A"}</span>
        </div>
        <div className="problem-story__task-row">
          <div className={`problem-story__task ${!taskBUpdated ? "is-current" : ""}`}><span className="problem-story__task-id">TASK A</span><b>旧任务已学会</b><small>当前参数位置 θ_A*</small></div>
          <div className="problem-story__handoff"><span>same model</span><i aria-hidden="true" /></div>
          <div className={`problem-story__task ${taskBUpdated ? "is-current" : ""}`}><span className="problem-story__task-id">TASK B</span><b>继续适应新数据</b><small>仍要更新原有参数</small></div>
        </div>
        <ParameterModel mode={taskBUpdated ? "updating" : "overview"} changed={taskBUpdated} />
        <div className="problem-story__consequence" aria-live="polite">
          <div className={`problem-story__signal ${taskBUpdated ? "is-risk" : ""}`}><span>Task B performance</span><b>{taskBUpdated ? "↑ adapts" : "—"}</b></div>
          <div className="problem-story__signal-divider" aria-hidden="true">↔</div>
          <div className={`problem-story__signal ${taskBUpdated ? "is-risk" : ""}`}><span>Task A performance</span><b>{taskBUpdated ? "may fall" : "at risk"}</b></div>
          <button type="button" className="ewc-button ewc-button--primary" aria-pressed={taskBUpdated} onClick={() => setTaskBUpdated((value) => !value)}>
            {taskBUpdated ? "Reset to θ_A*" : "Show a Task B update"}<span aria-hidden="true">{taskBUpdated ? "↺" : "→"}</span>
          </button>
        </div>
        <p className="problem-story__footnote">示意的是可能的参数冲突；此处没有绘制论文中的准确率或实验数值。</p>
      </section>

      <figure className="paper-figure-card" aria-labelledby="figure-one-caption">
        <div className="paper-figure-card__top"><span className="ewc-section-index">PAPER FIGURE / MECHANISM OVERVIEW</span><span className="source-badge source-badge--paper">FIGURE 1</span></div>
        <img src="./images/figure-1.png" alt="论文 Figure 1 的参数空间示意：Task A 与 Task B 的低误差区域相交；无约束更新、统一 L2 约束与 EWC 分别沿蓝色、绿色和红色路径移动。" />
        <figcaption id="figure-one-caption"><strong>论文 Figure 1.</strong> 示意无约束更新、统一约束与 EWC 对 Task-A/Task-B 参数区域的不同折衷。原图完整保留，仅沿图像边界裁切，供非商业教育用途展示。Kirkpatrick et al., PNAS 2017, 114(13):3521–3526, Fig. 1.</figcaption>
      </figure>

      <section className="parameter-sensitivity" id="parameter-conflict" aria-labelledby="sensitivity-heading">
        <div className="ewc-section-heading"><div><span className="ewc-section-index">B / PARAMETER CONFLICT</span><h2 id="sensitivity-heading">问题不是“能不能改”，而是“哪些更该少改”</h2></div><p>Task A 对参数的依赖并不相同。相同大小的参数移动，可能对旧任务产生不同影响。</p></div>
        <CompareView initialMode="side-by-side" variants={[
          { id: "sensitive-parameter", title: "θ₁ · Task A 更敏感", summary: "相同大小的移动，可能更明显地影响旧任务行为。", content: <div className="parameter-compare-visual is-sensitive"><span className="parameter-compare-visual__anchor">θ_A*</span><i aria-hidden="true" /><span className={`parameter-compare-visual__current ${taskBUpdated ? "is-displaced" : ""}`}>θ₁</span><small>constrain more</small></div> },
          { id: "flexible-parameter", title: "θ₂ · Task A 相对不敏感", summary: "相同大小的移动，对旧任务行为的影响可能较小。", content: <div className="parameter-compare-visual is-flexible"><span className="parameter-compare-visual__anchor">θ_A*</span><i aria-hidden="true" /><span className={`parameter-compare-visual__current ${taskBUpdated ? "is-displaced" : ""}`}>θ₂</span><small>leave more flexible</small></div> },
        ]} changes={["Task B moves the same shared model.", "A later update can affect Task A differently across parameters."]} invariants={["The Task-A reference point is the same.", "These two groups are representative, not measured values."]} />
        <div className="problem-question"><span className="problem-question__mark">?</span><p><strong>哪些参数可以多改，哪些应该少改？</strong><br />这就是 EWC 要处理的核心矛盾。</p></div>
      </section>

      <section className="ewc-preview" id="ewc-motivation" aria-labelledby="ewc-preview-title">
        <div className="ewc-preview__copy"><span className="ewc-section-index">THE EWC IDEA</span><h2 id="ewc-preview-title">保留差异化约束，不冻结整个模型</h2><p><ReferenceTrigger id="ewc">Elastic Weight Consolidation</ReferenceTrigger> 在旧任务结束后估计参数的相对敏感性，并在后续训练中让不同参数承受不同强度的约束。</p></div>
        <div className="ewc-preview__flow" aria-label="EWC high-level process"><div><span>01</span><b>Train Task A</b></div><i aria-hidden="true">→</i><div><span>02</span><b>Record sensitivity</b></div><i aria-hidden="true">→</i><div><span>03</span><b>Constrain Task B</b></div></div>
        <div className="ewc-page-handoff"><p>在讨论怎样估计敏感性之前，先看 Fisher 估计如何沿着固定参数、梯度与样本累计这一条路径形成。</p><button type="button" className="ewc-button ewc-button--next" onClick={() => api.navigatePage("page-05-fisher")}>进入本次切片的 Fisher 段 <span>05 →</span></button></div>
        <p className="ewc-slice-note">本次 W6 是代表性切片，暂时略过 Page 2–4；完整教程恢复已批准的 Page 1–10 顺序后才进入 W8。</p>
      </section>
    </article>
  );
}
