import { useMemo, useState } from "react";
import { FlowStepper, type FlowStep } from "../shared/core/flow-stepper";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";

type Candidate = { id: string; prior: number; likelihood: number };
type DistributionView = "prior" | "posterior";

const CANDIDATES: Candidate[] = [
  { id: "θ₁", prior: 0.5, likelihood: 0.15 },
  { id: "θ₂", prior: 0.35, likelihood: 0.45 },
  { id: "θ₃", prior: 0.15, likelihood: 0.85 },
];

const BAYES_STEPS: FlowStep[] = [
  {
    id: "task-a-update",
    title: "观察 Task A 数据",
    description: "将参数先验 p(θ) 与 Task A 的 Likelihood p(D_A | θ) 结合，得到 Task A Posterior。",
    statusText: "这一步把普通训练中的数据解释能力，接到参数概率上。",
  },
  {
    id: "task-boundary",
    title: "保留 Task A 的 Posterior",
    description: "Task A 学完后，p(θ | D_A) 汇总了旧任务数据对参数配置的约束。",
    statusText: "它是数学上的旧任务信息，不是另一套网络参数。",
  },
  {
    id: "task-b-update",
    title: "用 Task B 数据继续更新",
    description: "Task A 的 Posterior 作为新的先验贡献，再与 Task B 的 Likelihood 结合。",
    statusText: "旧任务的信息由此进入后续更新。",
  },
];

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function ProbabilityOriginTable() {
  return (
    <div className="p03-origin-wrap">
      <table className="p03-origin-table">
        <thead>
          <tr><th scope="col">概率对象</th><th scope="col">当前状态</th><th scope="col">来源</th></tr>
        </thead>
        <tbody>
          <tr><th scope="row"><ReferenceTrigger id="p_theta_y_given_x">p<sub>θ</sub>(y | x)</ReferenceTrigger></th><td>已解释</td><td>神经网络的前向计算</td></tr>
          <tr><th scope="row"><ReferenceTrigger id="p_D_given_theta">p(D | θ)</ReferenceTrigger></th><td>已解释</td><td>各样本真实标签的预测概率组合</td></tr>
          <tr className="is-current"><th scope="row"><ReferenceTrigger id="p_theta">p(θ)</ReferenceTrigger></th><td>本页解释</td><td>数据到来前对参数配置的先验建模</td></tr>
          <tr className="is-current"><th scope="row"><ReferenceTrigger id="p_theta_given_D">p(θ | D)</ReferenceTrigger></th><td>本页解释</td><td>结合数据之后对参数的重新评价</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function ParameterPerspectives() {
  return (
    <section className="p03-section p03-perspectives" aria-labelledby="p03-perspectives-title">
      <div className="p03-section-heading">
        <div><span className="p03-overline">TWO WAYS TO DESCRIBE θ</span><h2 id="p03-perspectives-title">从一组数值，到参数配置的概率分布</h2></div>
        <p>Bayesian 视角描述的是我们对不同参数配置的相信程度，不表示程序同时保存了无数个模型。</p>
      </div>
      <div className="p03-perspective-compare">
        <div className="p03-perspective p03-perspective--ordinary">
          <span className="p03-perspective__label">ORDINARY PARAMETER VIEW</span>
          <h3>θ 是当前的一组具体数值</h3>
          <div className="p03-vector" role="img" aria-label="θ 由网络中的权重和偏置组成，是一组具体参数值">
            <span>θ =</span><i>W⁽¹⁾</i><b>,</b><i>b⁽¹⁾</i><b>,</b><i>W⁽²⁾</i><b>,</b><i>…</i>
          </div>
          <p>训练会不断调整这些参数，让模型更好地解释当前数据。</p>
        </div>
        <div className="p03-perspective__divider" aria-hidden="true"><span>换一个描述角度</span><i /></div>
        <div className="p03-perspective p03-perspective--bayesian">
          <span className="p03-perspective__label">BAYESIAN PARAMETER VIEW</span>
          <h3>p(θ) 描述不同配置的先验合理性</h3>
          <div className="p03-prior-points" role="img" aria-label="三个候选参数配置具有不同的先验权重">
            {CANDIDATES.map((candidate) => <span key={candidate.id}><i style={{ height: `${18 + candidate.prior * 48}px` }} /><b>{candidate.id}</b></span>)}
            <small>possible parameter configurations</small>
          </div>
          <p><ReferenceTrigger id="prior">Prior p(θ)</ReferenceTrigger> 来自建模者的选择，不是网络 Forward 自动算出的输出。</p>
        </div>
      </div>
      <details className="p03-background-detail" id="gaussian-prior-l2-link">
        <summary>展开背景：Gaussian Prior 与 L2 正则</summary>
        <div>
          <p>一个常见背景示例是 <span className="p03-math">p(θ) = 𝒩(0, σ²I)</span>。它会降低极端参数值的先验权重。在相应设定下，负对数先验会产生二次惩罚，因此与 L2 正则有形式上的联系。</p>
          <p className="p03-boundary">这是一般背景示例。EWC 论文没有为一般 Bayes 公式指定这种 Gaussian Prior。</p>
        </div>
      </details>
    </section>
  );
}

function BayesBox() {
  return (
    <section className="p03-section p03-bayes-section" id="prior-likelihood-posterior" aria-labelledby="p03-bayes-title">
      <div className="p03-section-heading">
        <div><span className="p03-overline">PRIOR × LIKELIHOOD · BAYES UPDATE</span><h2 id="p03-bayes-title">Bayes Rule 把数据和参数先验接起来</h2></div>
        <p>先看比例关系。点击每一项，可跳到本页的解释。</p>
      </div>
      <div className="p03-bayes-equation" role="math" aria-label="Posterior 正比于数据 Likelihood 乘以参数 Prior">
        <span><ReferenceTrigger id="posterior">p(θ | D)</ReferenceTrigger></span><b>∝</b>
        <span><ReferenceTrigger id="likelihood">p(D | θ)</ReferenceTrigger></span><b>×</b>
        <span><ReferenceTrigger id="prior">p(θ)</ReferenceTrigger></span>
      </div>
      <div className="p03-bayes-box" aria-label="Bayes 方块图，Prior 与 Likelihood 结合并经 Evidence 归一化得到 Posterior">
        <a className="p03-bayes-node p03-bayes-node--prior" href="#prior-explanation">
          <span>BEFORE DATA</span><b>Prior</b><strong>p(θ)</strong><small>参数配置的先验权重</small>
        </a>
        <span className="p03-bayes-operator" aria-hidden="true">×</span>
        <a className="p03-bayes-node p03-bayes-node--likelihood" href="#likelihood-explanation">
          <span>OBSERVED DATA</span><b>Likelihood</b><strong>p(D | θ)</strong><small>这组参数对数据解释得如何</small>
        </a>
        <span className="p03-bayes-combine" aria-hidden="true"><i /><b>重新加权</b><i /></span>
        <a className="p03-bayes-node p03-bayes-node--posterior" href="#posterior-explanation">
          <span>AFTER DATA</span><b>Posterior</b><strong>p(θ | D)</strong><small>看到数据后的参数评价</small>
        </a>
        <div className="p03-bayes-normalizer" id="bayes-evidence-normalizer">
          <span>归一化 by p(D)</span><p>Evidence 使结果成为合法的概率分布。</p>
        </div>
      </div>
      <div className="p03-bayes-explanations">
        <div id="prior-explanation"><span>01 · PRIOR</span><h3><ReferenceTrigger id="prior">p(θ)</ReferenceTrigger> 不是模型输出</h3><p>它是数据到来前，对参数配置合理性的先验描述。Prior 是建模选择，不是已知答案。</p></div>
        <div id="likelihood-explanation"><span>02 · LIKELIHOOD</span><h3><ReferenceTrigger id="likelihood">p(D | θ)</ReferenceTrigger> 评价数据拟合</h3><p>给定 θ，衡量模型对已观察数据 D 的解释能力。第 2 页已从网络输出推导出它。</p></div>
        <div id="posterior-explanation"><span>03 · POSTERIOR</span><h3><ReferenceTrigger id="posterior">p(θ | D)</ReferenceTrigger> 更新参数信念</h3><p>Posterior 将先验偏好与数据证据结合，重新分配不同参数配置的概率。</p></div>
      </div>
      <details className="p03-full-bayes" id="bayes-evidence-normalizer-detail">
        <summary>展开完整 Bayes Rule</summary>
        <div className="p03-full-bayes__formula" role="math" aria-label="Posterior 等于 Likelihood 乘 Prior 再除以 Evidence">
          <span>p(θ | D)</span><b>=</b><span className="p03-fraction"><i>p(D | θ)p(θ)</i><i>p(D)</i></span>
        </div>
        <p>分子合并 Likelihood 与 Prior；分母 p(D) 负责归一化。论文用这一关系描述 Task A 的 Posterior 如何进入 Task B 的更新。</p>
      </details>
    </section>
  );
}

function CandidateUpdate() {
  const [view, setView] = useState<DistributionView>("prior");
  const evidence = useMemo(() => CANDIDATES.reduce((sum, candidate) => sum + candidate.prior * candidate.likelihood, 0), []);
  const distribution = (candidate: Candidate) => view === "prior" ? candidate.prior : (candidate.prior * candidate.likelihood) / evidence;

  return (
    <section className="p03-section p03-candidates" aria-labelledby="p03-candidates-title">
      <div className="p03-section-heading">
        <div><span className="p03-overline">AN ILLUSTRATIVE UPDATE · THREE CANDIDATE CONFIGURATIONS</span><h2 id="p03-candidates-title">看到数据后，参数配置的相对权重会改变</h2></div>
        <p>选择更新前后，观察同一组候选参数的分布怎样变化。</p>
      </div>
      <div className="p03-distribution-controls" role="group" aria-label="切换观察参数分布的更新前后状态">
        <button type="button" aria-pressed={view === "prior"} className={view === "prior" ? "is-active" : ""} onClick={() => setView("prior")}>数据到来前 · Prior</button>
        <button type="button" aria-pressed={view === "posterior"} className={view === "posterior" ? "is-active" : ""} onClick={() => setView("posterior")}>看到 D 之后 · Posterior</button>
      </div>
      <div className="p03-candidate-head" aria-hidden="true"><span>候选参数</span><span>当前分布权重</span><span>数据 Likelihood</span><span>更新后 Posterior</span></div>
      <div className="p03-candidate-list" role="group" aria-label="三个示意参数配置的先验、Likelihood 与 Posterior">
        {CANDIDATES.map((candidate) => {
          const posterior = (candidate.prior * candidate.likelihood) / evidence;
          const weight = distribution(candidate);
          return (
            <div className="p03-candidate-row" key={candidate.id} aria-label={`${candidate.id}：Prior ${formatPercent(candidate.prior)}，Likelihood ${formatPercent(candidate.likelihood)}，Posterior ${formatPercent(posterior)}`}>
              <strong>{candidate.id}</strong>
              <div className="p03-candidate-weight" aria-label={`${view === "prior" ? "Prior" : "Posterior"} 权重 ${formatPercent(weight)}`}>
                <div className="p03-candidate-weight__label"><span>{view === "prior" ? "Prior p(θ)" : "Posterior p(θ | D)"}</span><b>{formatPercent(weight)}</b></div>
                <span className="p03-candidate-weight__track" aria-hidden="true"><i className={view === "posterior" ? "is-posterior" : ""} style={{ width: `${weight * 100}%` }} /></span>
              </div>
              <span className="p03-candidate-likelihood">p(D | {candidate.id}) = {formatPercent(candidate.likelihood)}</span>
              <span className="p03-candidate-posterior">{formatPercent(posterior)}</span>
            </div>
          );
        })}
      </div>
      <div className="p03-candidate-result" aria-live="polite">
        <span>示例归一化项 p(D) = {evidence.toFixed(2)}</span>
        <p>{view === "prior" ? "当前显示数据到来前的 Prior；数据越支持某组参数，它在 Posterior 中的相对权重越可能上升。" : "当前显示 Posterior。θ₂ 与 θ₃ 对这份示意数据的 Likelihood 较高，因此它们的相对权重上升。"}</p>
      </div>
      <p className="p03-teaching-boundary">示意数值只用于演示 Bayes 更新，不是论文中的参数、数据或实验结果。</p>
    </section>
  );
}

function SequentialUpdate() {
  const [step, setStep] = useState(2);
  const equations = [
    { expression: "p(θ)", note: "Task A 数据到来前的参数 Prior" },
    { expression: "p(θ | D_A) ∝ p(D_A | θ) p(θ)", note: "Task A Posterior 汇总旧任务数据带来的更新" },
    { expression: "p(θ | D_A, D_B) ∝ p(D_B | θ) p(θ | D_A)", note: "Task A Posterior 成为 Task B 更新中的先验贡献" },
  ];
  const current = equations[step];

  return (
    <section className="p03-section p03-sequential" id="sequential-update" aria-labelledby="p03-sequential-title">
      <div className="p03-section-heading">
        <div><span className="p03-overline">CONTINUAL LEARNING · SEQUENTIAL BAYES</span><h2 id="p03-sequential-title">Task A 学完后，旧 Posterior 怎样进入 Task B？</h2></div>
        <p>对顺序任务而言，前一任务的参数 Posterior 会参与下一次更新。</p>
      </div>
      <div className="p03-sequential-flow" aria-label="Task A posterior 延续到 Task B 的更新关系">
        <div><span>START</span><b>Prior</b><strong>p(θ)</strong></div><i aria-hidden="true" />
        <div><span>AFTER TASK A</span><b>Task A Posterior</b><strong><ReferenceTrigger id="task_a_posterior">p(θ | D<sub>A</sub>)</ReferenceTrigger></strong></div><i aria-hidden="true" />
        <div><span>AFTER TASK B</span><b>Updated Posterior</b><strong><ReferenceTrigger id="task_b_posterior">p(θ | D<sub>A</sub>, D<sub>B</sub>)</ReferenceTrigger></strong></div>
      </div>
      <FlowStepper
        label="Task A 到 Task B 的 Bayes 更新步骤"
        steps={BAYES_STEPS}
        step={step}
        onStepChange={(_selected, selectedIndex) => setStep(selectedIndex)}
        labels={{ step: "步骤", of: "/", previous: "上一步", next: "下一步" }}
      />
      <div className="p03-sequential-equation" aria-live="polite">
        <span>{current.note}</span>
        <strong>{current.expression}</strong>
      </div>
      <p className="p03-sequential-boundary">这是论文中的顺序 Bayesian 更新关系：Task A 的信息随 <ReferenceTrigger id="task_a_posterior">Posterior</ReferenceTrigger> 进入 Task B；这里还没有说明如何在真实网络里存储或近似它。</p>
    </section>
  );
}

export function PageBayes() {
  const api = useReferenceApi();

  return (
    <article className="ewc-page p03-page" aria-labelledby="p03-title">
      <header className="ewc-page-header p03-header">
        <div className="ewc-page-header__kicker"><span>03</span> BAYESIAN VIEW · PRIOR TO POSTERIOR</div>
        <h1 id="p03-title">参数的 Prior 与 Posterior</h1>
        <p className="ewc-page-header__dek">第 2 页解释了网络怎样给数据概率。现在继续追问：如果数据有 Likelihood，参数 θ 本身的概率从哪里来？</p>
      </header>

      <section className="p03-entry" aria-labelledby="p03-entry-title">
        <div className="p03-section-heading">
          <div><span className="p03-overline">CONTINUE FROM PAGE 02</span><h2 id="p03-entry-title">先把已经解释和仍待解释的概率并排放好</h2></div>
        </div>
        <ProbabilityOriginTable />
        <p className="p03-entry-question">数据的概率来源已经清楚。参数只是网络里的权重，为什么也能写成 <ReferenceTrigger id="p_theta">p(θ)</ReferenceTrigger>？</p>
      </section>

      <ParameterPerspectives />
      <BayesBox />
      <CandidateUpdate />
      <SequentialUpdate />

      <section className="p03-handoff" aria-labelledby="p03-handoff-title">
        <div>
          <span className="p03-overline">NEXT · LOCAL POSTERIOR APPROXIMATION</span>
          <h2 id="p03-handoff-title">完整的 Task A Posterior 太复杂，难以直接带到 Task B</h2>
          <p>因此下一步要问：旧任务的关键约束，能不能只在 <ReferenceTrigger id="theta_a_star">θ<sub>A</sub>*</ReferenceTrigger> 附近保留？</p>
        </div>
        <button type="button" onClick={() => api.navigatePage("page-04-laplace")}>继续到 Page 4 · Laplace 局部近似 <span aria-hidden="true">→</span></button>
      </section>

      <nav className="p03-page-nav" aria-label="学习页面导航">
        <button type="button" onClick={() => api.navigatePage("page-02-probability")}>← Page 2 · Likelihood 与 Loss</button>
        <button type="button" onClick={() => api.navigatePage("page-04-laplace")}>Page 4 · Laplace →</button>
      </nav>
    </article>
  );
}
