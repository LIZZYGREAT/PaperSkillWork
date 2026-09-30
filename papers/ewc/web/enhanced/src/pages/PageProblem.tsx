import { useState } from "react";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";

const PROCESS_STEPS = [
  {
    title: "先学习 Task A",
    description: "Task A 的数据训练同一个神经网络。训练结束时，参数停在一个能较好完成 Task A 的位置 θ_A*。",
    stage: "task-a",
  },
  {
    title: "Task B 到来",
    description: "新任务到来后，模型从 θ_A* 继续训练；Task B 并没有得到一套互不相干的新参数。",
    stage: "task-b",
  },
  {
    title: "继续训练，参数发生变化",
    description: "为了适应 Task B，优化过程会继续改变共享参数：θ_A* → θ′ → θ″。",
    stage: "updates",
  },
  {
    title: "新任务适应可能伴随旧任务退化",
    description: "Task B 的表现可以改善，但如果更新了 Task A 依赖的参数，Task A 的表现也可能下降。这是顺序学习中的一种可能结果，不是每次更新都必然发生。",
    stage: "outcome",
  },
] as const;

function SequentialProcess({ step }: { step: number }) {
  const stage = PROCESS_STEPS[step].stage;
  const taskBArrived = step >= 1;
  const paramsChanged = step >= 2;

  return (
    <div className={`sequence-board sequence-board--${stage}`} role="group" aria-label="Task A and Task B sequentially train the same model">
      <div className="sequence-board__phase sequence-board__phase--a">
        <span className="sequence-board__phase-label">阶段一 · 先前任务</span>
        <div className={`sequence-node is-reached ${stage === "task-a" ? "is-current" : ""}`}>
          <small>DATA</small><b>Task A 数据</b>
        </div>
        <span className="sequence-arrow" aria-hidden="true">→</span>
        <div className={`sequence-node sequence-node--model is-reached ${stage === "task-a" ? "is-current" : ""}`}>
          <small>同一个模型</small><b>神经网络 θ</b><span>训练 Task A</span>
        </div>
        <span className="sequence-arrow" aria-hidden="true">→</span>
        <div className={`sequence-node sequence-node--state is-reached ${stage === "task-a" || stage === "task-b" ? "is-current" : ""}`}>
          <small>学完 Task A</small><b>θ_A*</b><span>旧任务参数状态</span>
        </div>
      </div>

      <div className={`sequence-board__continuation ${taskBArrived ? "is-active" : ""}`}>
        <span aria-hidden="true">↓</span>
        <b>任务切换，模型与参数继续沿用</b>
        <span aria-hidden="true">↓</span>
      </div>

      <div className="sequence-board__phase sequence-board__phase--b">
        <span className="sequence-board__phase-label">阶段二 · 后续任务</span>
        <div className={`sequence-node ${taskBArrived ? "is-reached" : ""} ${stage === "task-b" ? "is-current" : ""}`}>
          <small>DATA</small><b>Task B 数据</b>
        </div>
        <span className="sequence-arrow" aria-hidden="true">→</span>
        <div className={`sequence-node sequence-node--model ${taskBArrived ? "is-reached" : ""} ${stage === "task-b" || stage === "updates" ? "is-current" : ""}`}>
          <small>仍是同一个模型</small><b>继续训练</b><span>从 θ_A* 接着更新</span>
        </div>
        <span className="sequence-arrow" aria-hidden="true">→</span>
        <div className={`sequence-node sequence-node--state ${paramsChanged ? "is-changed" : ""} ${stage === "updates" || stage === "outcome" ? "is-current" : ""}`}>
          <small>参数继续移动</small><b>{paramsChanged ? "θ_A* → θ′ → θ″" : "θ_A*"}</b><span>{paramsChanged ? "共享参数已改变" : "等待 Task B 更新"}</span>
        </div>
      </div>

      <div className={`sequence-outcomes ${paramsChanged ? "is-visible" : ""}`} aria-live="polite">
        <span className="sequence-outcomes__title">可能的表现变化</span>
        <div className="sequence-outcome sequence-outcome--new"><span>Task B · 新任务</span><b><i aria-hidden="true">{paramsChanged ? "↑" : "—"}</i> {paramsChanged ? "可能改善" : "等待训练"}</b></div>
        <div className="sequence-outcome sequence-outcome--old"><span>Task A · 先前任务</span><b><i aria-hidden="true">{paramsChanged ? "↓" : "—"}</i> {paramsChanged ? "可能下降" : "等待参数更新"}</b></div>
        <p>机制示意：只表达可能出现的方向，不代表论文实验数值，也不表示每次更新都会遗忘。</p>
      </div>
    </div>
  );
}

function ParameterComparison() {
  return (
    <div className="parameter-comparison">
      <div className="parameter-comparison__row">
        <div className="parameter-comparison__identity"><b>θ₁</b><span>Task A 对这里的变化很敏感</span></div>
        <div className="parameter-comparison__movement"><span>Task A 状态</span><b>θ₁,A*</b><i aria-hidden="true">→</i><span className="parameter-comparison__new-value">Task B 更新后 · θ₁′</span></div>
        <strong className="parameter-comparison__effect">旧任务影响较大</strong>
      </div>
      <div className="parameter-comparison__row">
        <div className="parameter-comparison__identity"><b>θ₂</b><span>Task A 对这里的变化相对不敏感</span></div>
        <div className="parameter-comparison__movement"><span>Task A 状态</span><b>θ₂,A*</b><i aria-hidden="true">→</i><span className="parameter-comparison__new-value">Task B 更新后 · θ₂′</span></div>
        <strong className="parameter-comparison__effect">旧任务影响较小</strong>
      </div>
      <p className="parameter-comparison__explanation">同样是为 Task B 留出更新空间，改动 θ₁ 更容易伤到 Task A；改动 θ₂ 的代价相对较小。因此两组参数不应被一概而论。</p>
    </div>
  );
}

export function PageProblem() {
  const [step, setStep] = useState(0);
  const [compareOpen, setCompareOpen] = useState(false);
  const current = PROCESS_STEPS[step];

  return (
    <article className="ewc-page ewc-page--problem" aria-labelledby="problem-title">
      <header className="ewc-page-header" id="problem-context">
        <div className="ewc-page-header__kicker"><span>01</span> 持续学习 · 问题起点</div>
        <h1 id="problem-title">为什么学习新任务，可能会忘掉旧任务？</h1>
        <p className="ewc-page-header__dek">传统监督学习通常假设训练数据可以共同参与训练。许多系统会按时间不断收到新任务，而旧数据未必能一直保留。同一个模型需要适应新任务，同时尽量保持先前学到的能力。<ReferenceTrigger id="continual_learning">持续学习（Continual Learning）</ReferenceTrigger>研究的就是这个基本场景。</p>
        <p className="task-types-note"><b>常见评测设定：</b><ReferenceTrigger id="continual_learning">Task-IL、Domain-IL 与 Class-IL</ReferenceTrigger>：Task-IL 测试时提供任务身份；Domain-IL 不提供任务身份但输入分布变化；Class-IL 不提供任务身份，并在累计类别中预测。这里先关注它们共有的冲突：多个任务依赖同一个持续更新的模型。</p>
      </header>

      <section className="problem-story" id="parameter-conflict" aria-labelledby="conflict-heading">
        <div className="problem-story__heading">
          <div><span className="ewc-section-index">同一个模型 · 按时间学习</span><h2 id="conflict-heading">Task B 到来后，训练还会继续改变参数</h2></div>
          <span className="problem-story__step" aria-live="polite">第 {step + 1} / {PROCESS_STEPS.length} 步</span>
        </div>

        <div className="process-narration" aria-live="polite" aria-atomic="true">
          <span className="process-narration__number">{String(step + 1).padStart(2, "0")}</span>
          <div><h3>{current.title}</h3><p>{current.description}</p></div>
        </div>

        <SequentialProcess step={step} />

        <div className="story-controls" role="group" aria-label="顺序学习过程">
          <button type="button" className="ewc-button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>← 上一步</button>
          <div className="story-controls__steps">
            {PROCESS_STEPS.map((item, index) => <button key={item.title} type="button" aria-label={`第 ${index + 1} 步：${item.title}`} aria-current={step === index ? "step" : undefined} className={step === index ? "is-current" : ""} onClick={() => setStep(index)}>{index + 1}</button>)}
          </div>
          <button type="button" className="ewc-button ewc-button--primary" onClick={() => setStep((value) => Math.min(PROCESS_STEPS.length - 1, value + 1))} disabled={step === PROCESS_STEPS.length - 1}>下一步 →</button>
        </div>
      </section>

      <section className="forgetting-definition" aria-labelledby="forgetting-title">
        <span className="forgetting-definition__label">这个现象称为</span>
        <h2 id="forgetting-title"><ReferenceTrigger id="catastrophic_forgetting">灾难性遗忘（Catastrophic Forgetting）</ReferenceTrigger></h2>
        <p>模型学习新任务时，参数更新破坏了旧任务所依赖的参数状态，导致旧任务性能显著下降。</p>
        <div className="parameter-conflict-statement"><span>核心冲突</span><strong>学习 Task B 必须修改参数；但 Task A 也依赖这些参数。</strong></div>
      </section>

      <section className="parameter-sensitivity" aria-labelledby="sensitivity-title">
        <div className="ewc-section-heading"><div><span className="ewc-section-index">从模型整体放大到参数</span><h2 id="sensitivity-title">哪些参数可以多改，哪些应该少改？</h2></div><p>参数组对旧任务的影响不同。接下来只比较两组代表性参数，不做数值计算。</p></div>
        <div className="parameter-groups" role="group" aria-label="神经网络中的代表性参数组">
          <div><span>Layer 1</span><b>θ¹</b><i aria-hidden="true">→</i><b>θ¹′</b></div>
          <div><span>Layer 2</span><b>θ²</b><i aria-hidden="true">→</i><b>θ²′</b></div>
          <div><span>Layer 3</span><b>θ³</b><i aria-hidden="true">→</i><b>θ³′</b></div>
          <small>Task A 训练后的参数组 → Task B 继续训练后的参数组</small>
        </div>
        <div className="parameter-sensitivity-summary" aria-label="参数对 Task A 的敏感程度不同">
          <div><b>θ₁</b><span>Task A 高度敏感 · 后续应更强约束</span></div>
          <div><b>θ₂</b><span>Task A 相对不敏感 · 可以更灵活</span></div>
        </div>
        <div className="parameter-comparison__heading"><div><span className="ewc-section-index">参数敏感性 · 定性示例</span><h3>对 Task A 来说，两次同样的改动代价可能不同</h3></div><button type="button" className="ewc-button ewc-button--quiet" aria-expanded={compareOpen} aria-controls="parameter-comparison" onClick={() => setCompareOpen((value) => !value)}>{compareOpen ? "收起更新对比" : "Compare parameter updates"}</button></div>
        <div id="parameter-comparison" hidden={!compareOpen}><ParameterComparison /></div>
        <p className="parameter-sensitivity__conclusion"><b>关键不是“完全不改参数”。</b>而是辨别哪些旧任务敏感参数应少改，哪些相对不敏感的参数可以更灵活。</p>
      </section>

      <section className="ewc-preview" id="ewc-motivation" aria-labelledby="ewc-preview-title">
        <div className="ewc-preview__copy"><span className="ewc-section-index">问题建立之后 · 方法预告</span><h2 id="ewc-preview-title"><ReferenceTrigger id="ewc">EWC</ReferenceTrigger> 的基本想法</h2><p>旧任务结束后，估计哪些参数对它更重要并保存这份信息；学习新任务时，对更重要的旧任务参数施加更强的约束。它不是把整个旧模型冻结。</p></div>
        <ol className="ewc-preview__flow" aria-label="EWC 的概念流程">
          <li><span>01</span><b>训练 Task A</b></li><li aria-hidden="true">→</li>
          <li><span>02</span><b>估计参数重要程度</b></li><li aria-hidden="true">→</li>
          <li><span>03</span><b>保存信息</b></li><li aria-hidden="true">→</li>
          <li><span>04</span><b>训练 Task B</b></li><li aria-hidden="true">→</li>
          <li><span>05</span><b>重要参数受到更强约束</b></li>
        </ol>
      </section>

      <section className="page-handoff" aria-label="下一页学习目标">
        <div><span className="ewc-section-index">NEXT · PAGE 02</span><h2>先把普通训练讲清楚</h2><p>神经网络输出什么概率？Likelihood 和 Loss 怎样从预测得到？参数又怎样被更新？下一页沿这条链回答，再进入参数重要性。</p></div>
        <div className="page-handoff__destination"><span>下一页</span><b>Probability → Likelihood → Loss</b><i aria-hidden="true">02 →</i></div>
      </section>
    </article>
  );
}
