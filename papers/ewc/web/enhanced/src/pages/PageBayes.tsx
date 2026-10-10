import { useMemo, useState } from "react";
import { FlowStepper, type FlowStep } from "../shared/core/flow-stepper";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";
import { PARAMETER_STATES, datasetLikelihood, EXAMPLE_EVIDENCE } from "../data/probabilityExample";
import { MathFormula } from "../shared/teaching/Math";

type Candidate = { id: string; prior: number; likelihood: number };
type DistributionView = "prior" | "posterior";

const CANDIDATES: Candidate[] = PARAMETER_STATES.map(state => ({
  id: `θ⁽${state.index}⁾`, prior: state.prior, likelihood: datasetLikelihood(state),
}));

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

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
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
          <span>归一化 p(D)</span><p>由 Prior 加权的 Likelihood 求和（连续参数用积分），使后验总权重为 1。</p>
        </div>
      </div>
      <div className="p03-bayes-explanations">
        <div id="prior-explanation"><span>01 · PRIOR</span><h3><ReferenceTrigger id="prior">p(θ)</ReferenceTrigger> 不是模型输出</h3><p>它由建模者在使用当前 D 之前选择，必须非负并归一化。可编码已有知识或偏好；Prior 为零的区域不会被这次更新恢复。不能看完这份 D 后随意挑数冒充先验。</p></div>
        <div id="likelihood-explanation"><span>02 · LIKELIHOOD</span><h3><ReferenceTrigger id="likelihood">p(D | θ)</ReferenceTrigger> 评价数据拟合</h3><p>给定 θ，由模型预测与实际标签共同决定。P2 已从 logits、Softmax 和真实标签项推导出它，本页直接复用；不能为得到想要的后验任意填写 Likelihood。</p></div>
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
  const evidence = useMemo(() => EXAMPLE_EVIDENCE, []);
  const distribution = (candidate: Candidate) => view === "prior" ? candidate.prior : (candidate.prior * candidate.likelihood) / evidence;

  return (
    <section className="p03-section p03-candidates" id="parameter-belief-update" aria-labelledby="p03-candidates-title">
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
              <span className="p03-candidate-likelihood">p(D | {candidate.id}) = {candidate.likelihood.toFixed(4)}</span>
              <span className="p03-candidate-posterior">{formatPercent(posterior)}</span>
            </div>
          );
        })}
      </div>
      <div className="p03-candidate-result" aria-live="polite">
        <span>示例归一化项 p(D) = {evidence.toFixed(4)}</span>
        <p>{view === "prior" ? "当前显示 Prior；选择 Posterior 可检查数据如何重新分配权重。" : "θ⁽¹⁾ 的权重下降，θ⁽²⁾ 与 θ⁽³⁾ 上升；每项由 Prior × Likelihood / Evidence 决定。"}</p>
      </div>
      <p className="p03-teaching-boundary">D 与 Likelihood 复用 P2。Prior = (0.50, 0.35, 0.15) 是本例建模假设，仅在三组候选配置中分配概率，非论文参数后验。显示值舍入，归一化使用未舍入值。</p>
    </section>
  );
}

function PosteriorConstraint() {
  return (
    <section className="p03-section ewc-reasoning" id="posterior-constraint" aria-labelledby="p03-constraint-title">
      <h2 id="p03-constraint-title">旧数据如何通过 Bayes 运算约束参数？</h2>
      <p>我们已有 D_A、共享参数 θ，以及网络在给定 θ 时对旧标签的预测概率。固定同一份 D_A，改变 θ 会改变 Likelihood。Bayes 更新用这个分数乘原有 Prior，再除以由所有配置共同决定的 Evidence：</p>
      <MathFormula block tex={String.raw`p(\theta\mid D_A)=\frac{p(D_A\mid\theta)p(\theta)}{p(D_A)}`} />
      <p>比较两组配置时，Evidence 消去。若 Prior 相同，对旧标签给出更高概率的配置就有更大的后验权重；解释很差的配置被相对降权。Prior 不同时，还必须计入先验偏好：</p>
      <MathFormula block tex={String.raw`\frac{p(\theta^{(a)}\mid D_A)}{p(\theta^{(b)}\mid D_A)}=\frac{p(D_A\mid\theta^{(a)})}{p(D_A\mid\theta^{(b)})}\frac{p(\theta^{(a)})}{p(\theta^{(b)})}`} />
      <p>本页 θ⁽³⁾ 的 Likelihood 是 θ⁽¹⁾ 的 {(CANDIDATES[2].likelihood / CANDIDATES[0].likelihood).toFixed(2)} 倍，但 Prior 只有它的 0.30 倍，后验比值约为 {(CANDIDATES[2].likelihood / CANDIDATES[0].likelihood * 0.3).toFixed(2)}。Evidence 统一缩放，不改变同一 D 下配置之间的排序。某项后验相对其先验上升，当且仅当该项 Likelihood 高于先验加权的平均值 p(D)。</p>
      <MathFormula block tex={String.raw`p(D)=\sum_k p(D\mid\theta^{(k)})p(\theta^{(k)}),\qquad p(D)=\int p(D\mid\theta)p(\theta)\,d\theta`} />
      <p>前式适用于本页离散例子，后式适用于连续参数。p(D) 由模型、数据与 Prior 决定，不是可以任意选择的常数。</p>
      <p>这种相对支持还描述解附近的变化：从受支持的位置沿某方向移动，若旧数据的解释力在控制 Prior 等条件后迅速下降，这个区域的 Posterior 也下降。保留这部分信息，才能让后续任务为离开旧解付出代价。MAP 只回答中心在哪里；附近形状才回答哪些偏移代价大。</p>
      <MathFormula block tex={String.raw`\Phi(\theta)=-\log p(\theta\mid D_A)=-\log p(D_A\mid\theta)-\log p(\theta)+C`} />
      <p>在局部 MAP 驻点 θ_A* 附近，若 Φ 可二阶展开且曲率正定（或作适当正则化），一阶项为零：</p>
      <MathFormula block tex={String.raw`\Phi(\theta)\approx\Phi(\theta_A^*)+\frac12(\theta-\theta_A^*)^\mathsf{T}H_A(\theta-\theta_A^*)`} />
      <p>沿曲率较大的方向，同样偏移增加更多 Φ；因为密度相对中心为 exp(−ΔΦ)，局部 Gaussian 在该方向更窄，约束更强。负对数 Posterior 还包含 Prior，不能直接等同于旧任务 Loss。</p>
      <MathFormula block tex={String.raw`\Delta\Phi=\tfrac12[8\Delta\theta_1^2+0.5\Delta\theta_2^2]`} />
      <p>二维教学例子：两坐标分别单独偏移 0.5，密度因子为 e⁻¹ ≈ 0.368 与 e⁻⁰·⁰⁶²⁵ ≈ 0.939。它说明同幅偏移的代价不同，非论文测得的 Fisher。P4 解释怎样保留局部形状，P5 再用对角 Fisher 近似可计算的局部精度；完整 Hessian、Fisher 与经验估计并不精确等价。</p>
    </section>
  );
}

function SequentialUpdate() {
  const [step, setStep] = useState(0);
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
        <p>给定 θ 后假设两任务数据条件独立，把 Task A Posterior 作为 Task B 的先验贡献，与 p(D_B | θ) 相乘。</p>
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
        <p className="ewc-page-header__dek">第 2 页能比较指定参数对旧数据的解释力；但 Likelihood 不是参数空间的分布。为了保留已有参数知识并继续接收新数据，我们用 Prior 与 Bayes 更新得到 Posterior。</p>
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
      <PosteriorConstraint />
      <SequentialUpdate />

      <section className="p03-handoff" aria-labelledby="p03-handoff-title">
        <div>
          <span className="p03-overline">NEXT · LOCAL POSTERIOR APPROXIMATION</span>
          <h2 id="p03-handoff-title">完整的 Task A Posterior 太复杂，难以直接带到 Task B</h2>
          <p>旧 Posterior 已记录相对支持；EWC 需要中心与周围的变化代价。完整高维分布难以保存与运算，下一页用中心与局部曲率近似 <ReferenceTrigger id="theta_a_star">θ<sub>A</sub>*</ReferenceTrigger> 附近的约束。</p>
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
