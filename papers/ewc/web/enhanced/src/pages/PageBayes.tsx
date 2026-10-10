import { useState } from "react";
import { FlowStepper, type FlowStep } from "../shared/core/flow-stepper";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";
import { PARAMETER_STATES, datasetLikelihood, EXAMPLE_EVIDENCE, type ParameterState } from "../data/probabilityExample";
import { MathFormula } from "../shared/teaching/Math";

type Candidate = { id: string; index: number; prior: number; likelihood: number; posterior: number; state: ParameterState };
type DistributionView = "prior" | "likelihood" | "posterior";

const CANDIDATES: Candidate[] = PARAMETER_STATES.map((state) => {
  const likelihood = datasetLikelihood(state);
  const posterior = (state.prior * likelihood) / EXAMPLE_EVIDENCE;
  return { id: `θ⁽${state.index}⁾`, index: state.index, prior: state.prior, likelihood, posterior, state };
});

const BAYES_STEPS: FlowStep[] = [
  {
    id: "task-a-update",
    title: "Task A 更新之前",
    description: "先明确数据到来前的 Prior；下一步再结合 Task A Likelihood 得到 Posterior。",
    statusText: "初态只显示 Prior；尚未吸收 Task A 的数据。",
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

function ProbabilityOriginTable() {
  return (
    <div className="p03-origin-wrap">
      <table className="p03-origin-table">
        <thead>
          <tr><th scope="col">概率对象</th><th scope="col">当前状态</th><th scope="col">来源</th></tr>
        </thead>
        <tbody>
          <tr><th scope="row"><ReferenceTrigger id="p_theta_y_given_x">p<sub>θ</sub>(y | x)</ReferenceTrigger></th><td>已解释</td><td>神经网络的前向计算</td></tr>
          <tr><th scope="row"><ReferenceTrigger id="p_D_given_theta">p(D<sub>A</sub> | θ)</ReferenceTrigger></th><td>已解释</td><td>各样本真实标签的预测概率组合</td></tr>
          <tr className="is-current"><th scope="row"><ReferenceTrigger id="p_theta">p(θ)</ReferenceTrigger></th><td>本页解释</td><td>数据到来前对参数配置的先验建模</td></tr>
          <tr className="is-current"><th scope="row"><ReferenceTrigger id="p_theta_given_D">p(θ | D<sub>A</sub>)</ReferenceTrigger></th><td>本页解释</td><td>结合 Task A 数据之后对参数配置的重新评价</td></tr>
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
        <p>从联合概率的两种分解得到更新式；数据、Prior 与 Posterior 的来源各不相同。</p>
      </div>
      <div className="p03-joint-derivation" aria-label="联合概率 p(theta, D A) 的两种分解">
        <div><span>同一联合概率，从 Likelihood 与 Prior 分解</span><MathFormula block tex={String.raw`p(\theta,D_A)=p(D_A\mid\theta)p(\theta)`} /></div>
        <div><span>从 Posterior 与 Evidence 分解</span><MathFormula block tex={String.raw`p(\theta,D_A)=p(\theta\mid D_A)p(D_A)`} /></div>
      </div>
      <div className="p03-bayes-result" role="group" aria-label="由联合概率分解得到 Bayes 更新公式">
        <span>令两种分解相等，整理得到 Bayes Rule</span>
        <MathFormula block tex={String.raw`p(\theta\mid D_A)=\frac{p(D_A\mid\theta)p(\theta)}{p(D_A)}`} />
      </div>
      <div className="p03-bayes-box" aria-label="Bayes 更新示意：Likelihood 与 Prior 相乘，Evidence 归一化后得到 Posterior">
        <a className="p03-bayes-node p03-bayes-node--prior" href="#prior-explanation">
          <span>BEFORE TASK A DATA</span><b>Prior</b><strong><MathFormula tex={String.raw`p(\theta)`} /></strong><small>观察当前 D<sub>A</sub> 之前的参数权重</small>
        </a>
        <span className="p03-bayes-operator" aria-hidden="true">×</span>
        <a className="p03-bayes-node p03-bayes-node--likelihood" href="#likelihood-explanation">
          <span>FIXED TASK A DATA</span><b>Likelihood</b><strong><MathFormula tex={String.raw`p(D_A\mid\theta)`} /></strong><small>这组参数怎样解释同一份 D<sub>A</sub></small>
        </a>
        <span className="p03-bayes-combine" aria-hidden="true"><i /><b>重新加权</b><i /></span>
        <a className="p03-bayes-node p03-bayes-node--posterior" href="#posterior-explanation">
          <span>AFTER TASK A DATA</span><b>Posterior</b><strong><MathFormula tex={String.raw`p(\theta\mid D_A)`} /></strong><small>数据之后对参数配置的评价</small>
        </a>
        <div className="p03-bayes-normalizer" id="bayes-evidence-normalizer">
          <span>Evidence · p(D<sub>A</sub>)</span><p>对所有候选权重求和，得到归一化分母；后面用同一组示例数值核对。</p>
        </div>
      </div>
      <div className="p03-bayes-explanations">
        <div id="prior-explanation"><span>01 · PRIOR</span><h3><ReferenceTrigger id="prior">p(θ)</ReferenceTrigger> 在当前数据之前设定</h3><p>Prior 是观察这份 D<sub>A</sub> 之前对参数配置的建模分布。它须非负且归一化；已有知识可影响它，但不能看完 D<sub>A</sub> 后为了预设结果任意改数。</p></div>
        <div id="likelihood-explanation"><span>02 · LIKELIHOOD</span><h3><ReferenceTrigger id="likelihood">p(D<sub>A</sub> | θ)</ReferenceTrigger> 对固定数据评价 θ</h3><p>Page 2 已从 logits、Softmax 与真实标签概率算出它。Likelihood 是固定 D<sub>A</sub> 下关于 θ 的函数，不是参数空间上的归一化分布。</p></div>
        <div id="posterior-explanation"><span>03 · POSTERIOR</span><h3><ReferenceTrigger id="posterior">p(θ | D<sub>A</sub>)</ReferenceTrigger> 结合两种来源</h3><p>Likelihood 按旧数据支持度重加权 Prior，Evidence 统一归一化。Posterior 中心回答哪组配置权重最高，不等于告诉我们哪个单一坐标最重要。</p></div>
      </div>
      <details className="p03-full-bayes" id="bayes-evidence-normalizer-detail">
        <summary>连续参数空间：Evidence 是 Prior 加权 Likelihood 的积分</summary>
        <div className="p03-continuous-evidence"><MathFormula block tex={String.raw`p(D_A)=\int p(D_A\mid\theta)p(\theta)\,d\theta`} /><p>这里的 θ 是连续网络参数，p(θ) 表示概率密度；单个精确参数点的概率质量为 0，某个参数区域的概率由密度积分得到。上面的三候选交互则是离散教学例子，用求和而非积分。</p></div>
      </details>
    </section>
  );
}

function CandidateUpdate() {
  const [view, setView] = useState<DistributionView>("prior");
  const [selectedId, setSelectedId] = useState(CANDIDATES[0].id);
  const selected = CANDIDATES.find((candidate) => candidate.id === selectedId) ?? CANDIDATES[0];
  const reference = CANDIDATES[0];
  const score = (candidate: Candidate) => view === "prior" ? candidate.prior : view === "likelihood" ? candidate.likelihood : candidate.posterior;
  const maximumScore = Math.max(...CANDIDATES.map(score));
  const viewCopy: Record<DistributionView, { label: string; note: string }> = {
    prior: { label: "Prior mass", note: "Prior 是观察 D_A 前的离散概率质量；本例三项之和为 1。" },
    likelihood: { label: "Raw Likelihood", note: "固定 D_A 后得到的拟合分数；这些值不在候选 θ 上归一化，也不需要相加为 1。" },
    posterior: { label: "Posterior mass", note: "Prior × Likelihood 经 Evidence 归一化；本例三项之和为 1。" },
  };
  const relativeLikelihood = selected.likelihood / reference.likelihood;
  const relativePrior = selected.prior / reference.prior;
  const relativePosterior = selected.posterior / reference.posterior;
  const oddsEquation = String.raw`\frac{p(\theta^{(${selected.index})}\mid D_A)}{p(\theta^{(1)}\mid D_A)}=\frac{p(D_A\mid\theta^{(${selected.index})})}{p(D_A\mid\theta^{(1)})}\times\frac{p(\theta^{(${selected.index})})}{p(\theta^{(1)})}=\frac{${selected.likelihood.toFixed(4)}}{${reference.likelihood.toFixed(4)}}\times\frac{${selected.prior.toFixed(2)}}{${reference.prior.toFixed(2)}}=${relativePosterior.toFixed(2)}`;

  return (
    <section className="p03-section p03-candidates" id="parameter-belief-update" aria-labelledby="p03-candidates-title">
      <div className="p03-section-heading">
        <div><span className="p03-overline">AN ILLUSTRATIVE UPDATE · THREE CANDIDATE CONFIGURATIONS</span><h2 id="p03-candidates-title">看到数据后，参数配置的相对权重会改变</h2></div>
        <p>三组配置和 D_A 直接复用 Page 2。逐个切换 Prior、Likelihood 与 Posterior，并点选配置核对更新来源。</p>
      </div>
      <div className="p03-distribution-controls" role="group" aria-label="选择参数配置的概率对象">
        <button type="button" aria-pressed={view === "prior"} className={view === "prior" ? "is-active" : ""} onClick={() => setView("prior")}>Prior · before D_A</button>
        <button type="button" aria-pressed={view === "likelihood"} className={view === "likelihood" ? "is-active" : ""} onClick={() => setView("likelihood")}>Likelihood · fixed D_A</button>
        <button type="button" aria-pressed={view === "posterior"} className={view === "posterior" ? "is-active" : ""} onClick={() => setView("posterior")}>Posterior · after D_A</button>
      </div>
      <div className="p03-view-note" aria-live="polite"><b>{viewCopy[view].label}</b><span>{viewCopy[view].note}</span></div>
      <div className="p03-candidate-head" aria-hidden="true"><span>完整参数配置</span><span>当前视图</span><span>Prior</span><span>Likelihood</span><span>Prior × Likelihood</span><span>Posterior</span></div>
      <div className="p03-candidate-list" role="group" aria-label="点击候选参数配置查看 Prior、Likelihood 乘积与 Posterior">
        {CANDIDATES.map((candidate) => {
          const value = score(candidate);
          const product = candidate.prior * candidate.likelihood;
          const active = selected.id === candidate.id;
          return (
            <button className={`p03-candidate-row ${active ? "is-selected" : ""}`} key={candidate.id} type="button" aria-pressed={active} aria-label={`${candidate.id}：Prior ${candidate.prior.toFixed(4)}，Likelihood ${candidate.likelihood.toFixed(6)}，未归一化乘积 ${product.toFixed(6)}，Posterior ${candidate.posterior.toFixed(6)}`} onClick={() => setSelectedId(candidate.id)}>
              <span className="p03-candidate-config"><strong>{candidate.id}</strong><small>完整配置</small></span>
              <span className="p03-candidate-weight" aria-label={`${viewCopy[view].label} ${value.toFixed(6)}`}>
                <span className="p03-candidate-weight__label"><span>{viewCopy[view].label}</span><b>{value.toFixed(4)}</b></span>
                <span className="p03-candidate-weight__track" aria-hidden="true"><i className={`p03-candidate-weight__bar p03-candidate-weight__bar--${view}`} style={{ width: `${(value / maximumScore) * 100}%` }} /></span>
              </span>
              <span className="p03-candidate-value" data-label="Prior">{candidate.prior.toFixed(4)}</span>
              <span className="p03-candidate-value" data-label="Likelihood">{candidate.likelihood.toFixed(6)}</span>
              <span className="p03-candidate-value" data-label="Prior × Likelihood">{product.toFixed(6)}</span>
              <span className="p03-candidate-value p03-candidate-value--posterior" data-label="Posterior">{candidate.posterior.toFixed(6)}</span>
            </button>
          );
        })}
      </div>
      <div className="p03-evidence-check">
        <div><span>DISCRETE EVIDENCE · WEIGHTED SUM</span><MathFormula block tex={String.raw`p(D_A)=\sum_k p(D_A\mid\theta^{(k)})p(\theta^{(k)})`} /></div>
        <p><b>本例 p(D<sub>A</sub>) = {EXAMPLE_EVIDENCE.toFixed(6)}</b>。它是由 Prior 加权后的 Likelihood 总和，既提供 Posterior 的共同分母，也使后验质量归一化。</p>
      </div>
      <div className="p03-selected-explanation" aria-live="polite">
        <div><span>SELECTED CONFIGURATION · {selected.id}</span><p>Page 2 的三条 Task A 真实标签概率：{selected.state.datasetProbabilities.map((probability) => probability.toFixed(4)).join(" × ")} = {selected.likelihood.toFixed(6)}。这正是该配置的固定数据 Likelihood。</p></div>
        <MathFormula block tex={oddsEquation} />
        <p>与 θ⁽¹⁾ 比较时，共同 Evidence p(D<sub>A</sub>) 抵消；后验比值由 Likelihood 比值和 Prior 比值共同决定。当前数值：Likelihood 比值 {relativeLikelihood.toFixed(2)}，Prior 比值 {relativePrior.toFixed(2)}，Posterior 比值 {relativePosterior.toFixed(2)}。这比较的是完整参数配置，不是在排名单个重要坐标。</p>
      </div>
      <p className="p03-teaching-boundary">三组完整配置、D<sub>A</sub> 与 Likelihood 复用 P2。Prior = (0.50, 0.35, 0.15) 是符合归一化规则的教学假设，并非论文报告的网络参数后验。所有显示值来自未舍入计算。</p>
    </section>
  );
}

function SequentialUpdate() {
  const [step, setStep] = useState(0);
  const equations = [
    { expression: String.raw`p(\theta)`, note: "Task A 数据到来前的参数 Prior" },
    { expression: String.raw`p(\theta\mid D_A)\propto p(D_A\mid\theta)p(\theta)`, note: "Task A Posterior 汇总旧任务数据带来的更新" },
    { expression: String.raw`p(\theta\mid D_A,D_B)\propto p(D_B\mid\theta)p(\theta\mid D_A)`, note: "Task A Posterior 成为 Task B 更新中的先验贡献" },
  ];
  const current = equations[step];

  return (
    <section className="p03-section p03-sequential" id="sequential-update" aria-labelledby="p03-sequential-title">
      <div className="p03-section-heading">
        <div><span className="p03-overline">CONTINUAL LEARNING · SEQUENTIAL BAYES</span><h2 id="p03-sequential-title">Task A 学完后，旧 Posterior 怎样进入 Task B？</h2></div>
        <p>假设给定 θ 后，Task A 与 Task B 数据条件独立。于是联合数据 Likelihood 可分解为两项，Task A Posterior 就能作为 Task B 更新的先验贡献。</p>
      </div>
      <div className="p03-sequential-flow" aria-label="Task A posterior 延续到 Task B 的更新关系">
        <div><span>START</span><b>Prior</b><strong><MathFormula tex={String.raw`p(\theta)`} /></strong></div><i aria-hidden="true" />
        <div><span>AFTER TASK A</span><b>Task A Posterior</b><strong><ReferenceTrigger id="task_a_posterior"><MathFormula tex={String.raw`p(\theta\mid D_A)`} /></ReferenceTrigger></strong></div><i aria-hidden="true" />
        <div><span>AFTER TASK B</span><b>Updated Posterior</b><strong><ReferenceTrigger id="task_b_posterior"><MathFormula tex={String.raw`p(\theta\mid D_A,D_B)`} /></ReferenceTrigger></strong></div>
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
        <MathFormula block tex={current.expression} />
      </div>
      <div className="p03-sequential-boundary"><MathFormula block tex={String.raw`p(D_A,D_B\mid\theta)=p(D_A\mid\theta)p(D_B\mid\theta)`} /><p>因此，结合 Task B 数据时可用 <ReferenceTrigger id="task_a_posterior">p(θ | D<sub>A</sub>)</ReferenceTrigger> 作为下一步的先验来源。此式只说明 Bayesian 信息如何顺序更新；真实网络如何保存和近似它留给 P4–P6。</p></div>
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
        <p className="ewc-page-header__dek">第 2 页已比较三组参数配置对同一份 Task A 数据 D<sub>A</sub> 的解释力。Likelihood 是固定数据下关于 θ 的函数，不是参数空间上的概率分布；本页用 Prior 与 Bayes 更新把旧数据支持度转为 Posterior。</p>
      </header>

      <section className="p03-entry" aria-labelledby="p03-entry-title">
        <div className="p03-section-heading">
          <div><span className="p03-overline">CONTINUE FROM PAGE 02</span><h2 id="p03-entry-title">先把已经解释和仍待解释的概率并排放好</h2></div>
        </div>
        <ProbabilityOriginTable />
        <p className="p03-entry-question">同一份 D<sub>A</sub> 与三组完整参数配置已经在 Page 2 逐项算过。Likelihood 给每组配置一个拟合分数，却没有在 θ 上归一化；还需要先验权重，才能得到关于参数配置的 Posterior。</p>
      </section>

      <ParameterPerspectives />
      <BayesBox />
      <CandidateUpdate />
      <SequentialUpdate />

      <section className="p03-handoff" aria-labelledby="p03-handoff-title">
        <div>
          <span className="p03-overline">NEXT · LOCAL POSTERIOR APPROXIMATION</span>
          <h2 id="p03-handoff-title">完整的 Task A Posterior 太复杂，难以直接带到 Task B</h2>
          <p>旧 Posterior 记录了不同参数配置的支持度；但在连续参数空间里，EWC 还需要知道旧解附近的支持度如何随偏移变化。下一页从 <ReferenceTrigger id="theta_a_star">θ<sub>A</sub>*</ReferenceTrigger> 附近的负对数 Posterior 开始，用局部曲率描述这个变化。</p>
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
