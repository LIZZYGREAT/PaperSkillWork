import { DiagramFlow } from "../../foundation/layout/DiagramFlow";
import { StepNav } from "../../compositions/step-nav/StepNav";
import { lwfGraph, lwfGraphSteps, lwfNavItems } from "./figures";
import "./journey-art-direction.css";

export type JourneyArtDirection = "baseline" | "stage" | "reveal";

// Preserve the canonical graph's object IDs and endpoints; only its edge styling
// distinguishes comparison inputs from gradient ownership in this local demo.
export const journeyGraph = {
  ...lwfGraph,
  edges: lwfGraph.edges.map(edge => ({ ...edge, kind: edge.to === "update" ? "gradient" as const : ["lOld", "lNew"].includes(edge.to) ? "control" as const : "data" as const })),
  legend: [
    { id: "forward", text: "实线：前向计算", swatch: "solid" as const },
    { id: "gradient", text: "虚线：损失对 Student 的更新作用", swatch: "gradient" as const },
    ...lwfGraph.legend!.filter(item => item.id !== "flow"),
  ],
  note: "点线进入损失：将目标与预测送入比较；虚线进入更新：表示梯度作用归属，并非额外的前向输出。",
};

export const journeyComparisonPaths = [
  {
    kind: "old" as const,
    purpose: "保留旧响应",
    target: "Teacher 旧响应目标",
    targetDetail: "在当前新任务图像上预先记录",
    prediction: "旧类输出",
    predictionDetail: "来自 Student 旧任务头",
    result: "旧响应偏差",
    explanation: "两边概率先经过温度变换并重新归一化，再计算蒸馏交叉熵；约束的是响应关系，而非冻结 Student 的旧参数。Teacher 目标不需要重新读取旧训练集。",
  },
  {
    kind: "new" as const,
    purpose: "学会新任务",
    target: "当前任务真实标签",
    targetDetail: "只监督新类输出",
    prediction: "新类输出",
    predictionDetail: "来自 Student 新任务头",
    result: "新任务分类误差",
    explanation: "真实标签与新头概率计算分类交叉熵。两个损失各自成立后，下一步才是让它们共同约束同一个学习者。",
  },
];

export function Loss({ kind }: { kind: "old" | "new" }) {
  return <span className="rk-math journey-loss-symbol" data-loss={kind}><var>L</var><sub>{kind}</sub></span>;
}

export const theta = <span className="rk-math"><var>θ</var><sub>s</sub></span>;

export function JourneyReviewSwitcher({ value, onChange }: {
  value: JourneyArtDirection;
  onChange: (direction: JourneyArtDirection) => void;
}) {
  const choices: { id: JourneyArtDirection; label: string; shortLabel: string }[] = [
    { id: "baseline", label: "Baseline", shortLabel: "原版" },
    { id: "stage", label: "A · Shared Visual Stage", shortLabel: "A · 共享舞台" },
    { id: "reveal", label: "B · Editorial Reveal", shortLabel: "B · 编辑展开" },
  ];

  return <div className="journey-review-controls">
    <div className="journey-review-controls__status"><span>G0 · ART DIRECTION</span><strong>CANDIDATE / 未批准</strong></div>
    <div className="journey-review-controls__choices" role="group" aria-label="Reading Journey 方案切换">
      {choices.map(choice => <button
        key={choice.id}
        type="button"
        aria-label={choice.label}
        aria-pressed={value === choice.id}
        data-art-choice={choice.id}
        onClick={() => onChange(choice.id)}
      ><span aria-hidden="true">{choice.shortLabel}</span></button>)}
    </div>
  </div>;
}

export function JourneyDiagramScene({ stepId, onStepChange, className = "" }: {
  stepId: string;
  onStepChange: (stepId: string) => void;
  className?: string;
}) {
  const current = lwfGraphSteps.find(step => step.id === stepId);
  return <div className={`journey-map-scene ${className}`.trim()} data-focus-step={stepId}>
    <div className="journey-map-caption">
      <p role="status" aria-live="polite"><strong>{current?.title ?? "全局概览 · 所有对象同时可见"}</strong><span>{current?.note ?? "Teacher 提供固定参照；Student 承担预测与学习。选择下方步骤，沿同一张图定位。"}</span></p>
      <button type="button" onClick={() => onStepChange("overview")} aria-pressed={stepId === "overview"}>恢复概览</button>
    </div>
    <DiagramFlow
      spec={journeyGraph}
      focus={current ? { nodes: current.nodes, edges: current.edges } : undefined}
      label="LwF 完整阅读系统地图"
      framed={false}
    />
    <StepNav items={lwfNavItems} activeId={stepId} onSelect={onStepChange} label="完整阅读实验：选择机制步骤" />
  </div>;
}

export function JointObjectiveFormula() {
  return <math display="block" data-equation="objective" aria-label="联合目标 J 等于 lambda o 乘 L old 加 L new 加 R"><mi>J</mi><mo>=</mo><msub><mi>λ</mi><mi>o</mi></msub><msub><mi>L</mi><mtext>old</mtext></msub><mo>+</mo><msub><mi>L</mi><mtext>new</mtext></msub><mo>+</mo><mi>R</mi></math>;
}

export function StudentUpdateFormula() {
  return <math display="block" data-equation="parameter-update" aria-label="theta s 赋值为 theta s 减 eta 乘 J 对 theta s 的梯度"><msub><mi>θ</mi><mi>s</mi></msub><mo>←</mo><msub><mi>θ</mi><mi>s</mi></msub><mo>−</mo><mi>η</mi><msub><mo>∇</mo><msub><mi>θ</mi><mi>s</mi></msub></msub><mi>J</mi></math>;
}

function StudentIdentity() {
  return <header className="journey-art-student__identity">
    <div><span className="journey-kicker">TRAINABLE · 联合优化阶段</span><h3>Student</h3></div>
    <p data-parameter-definition>{theta} 统称此处的共享表示、旧任务头和新任务头参数；原文的同名记号只指共享参数。</p>
  </header>;
}

export function JourneyTrainingDetails() {
  return <>
    <div className="journey-training-notes"><b>阶段限定</b><p data-training-phase="warm-up">原文先 warm-up：固定共享参数和旧头，只训练新增任务头；随后才联合训练三组参数。上面的场景表示联合阶段，更新式不限定论文的具体优化器。</p></div>
    <details className="journey-temperature"><summary>温度变换如何对应刚才的旧路比较？</summary><div className="journey-temperature-content"><p>Teacher 旧目标与 Student 旧预测分别做同一温度变换，再计算旧损失。<var>p</var> 为其中任意一个概率向量。<span className="journey-nowrap" data-temperature-setting>原文采用 <var>T</var> = 2。</span></p><div className="journey-temperature-equation"><math display="block" aria-label="p prime i 等于 p i 的一除以 T 次幂，除以所有类别 j 对应幂的和"><msubsup><mi>p</mi><mi>i</mi><mo>′</mo></msubsup><mo>=</mo><mfrac><msup><msub><mi>p</mi><mi>i</mi></msub><mfrac><mn>1</mn><mi>T</mi></mfrac></msup><mrow><munder><mo>∑</mo><mi>j</mi></munder><msup><msub><mi>p</mi><mi>j</mi></msub><mfrac><mn>1</mn><mi>T</mi></mfrac></msup></mrow></mfrac></math></div></div></details>
  </>;
}

function FocusAction({ stepId, onStepChange, children }: { stepId: string; onStepChange: (stepId: string) => void; children: string }) {
  return <button className="journey-art-focus-action" type="button" onClick={() => onStepChange(stepId)}>{children}</button>;
}

function StageComparisonRows({ onStepChange }: { onStepChange: (stepId: string) => void }) {
  return <div className="journey-art-stage-comparisons" aria-label="旧响应与新任务的两次比较">
    {journeyComparisonPaths.map(path => <article key={path.kind} className="journey-art-stage-comparison" role="group" aria-label={path.purpose} data-comparison={path.kind} data-target={path.kind === "old" ? "target" : "label"} data-prediction={path.kind === "old" ? "oldOut" : "newOut"} data-result={path.kind === "old" ? "lOld" : "lNew"}>
      <h3>{path.purpose}</h3>
      <div className="journey-art-stage-pair">
        <p data-comparison-field="target"><small>比较参照</small><strong>{path.target}</strong><span>{path.targetDetail}</span></p>
        <span className="journey-art-stage-join">共同比较</span>
        <p data-comparison-field="prediction"><small>Student 的预测</small><strong>{path.prediction}</strong><span>{path.predictionDetail}</span></p>
      </div>
      <p className="journey-art-stage-result" data-comparison-field="result"><span aria-hidden="true">↓</span><Loss kind={path.kind} /><small>{path.result}</small></p>
      <p className="journey-art-stage-explanation">{path.explanation}</p>
    </article>)}
    <FocusAction stepId="loss" onStepChange={onStepChange}>在主图定位两次比较</FocusAction>
  </div>;
}

function RevealComparisonRows() {
  return <div className="journey-art-reveal-rows" aria-label="两条参照与预测的局部关系">
    {journeyComparisonPaths.map(path => <article key={path.kind} className={`journey-art-reveal-row journey-art-reveal-row--${path.kind}`} role="group" aria-label={path.purpose} data-comparison={path.kind} data-target={path.kind === "old" ? "target" : "label"} data-prediction={path.kind === "old" ? "oldOut" : "newOut"} data-result={path.kind === "old" ? "lOld" : "lNew"}>
      <div className="journey-art-reveal-identity"><span>{path.kind === "old" ? "I / RESPONSE" : "II / LEARNING"}</span><h3>{path.purpose}</h3></div>
      <div className="journey-art-reveal-relation">
        <p className="journey-art-reveal-object" data-comparison-field="target"><small>{path.kind === "old" ? "旧响应目标 · 参照" : "当前真实标签 · 参照"}</small><strong>{path.target}</strong><span>{path.targetDetail}</span></p>
        <span className="journey-art-reveal-join">与</span>
        <p className="journey-art-reveal-object" data-comparison-field="prediction"><small>Student 预测</small><strong>{path.prediction}</strong><span>{path.predictionDetail}</span></p>
        <span className="journey-art-reveal-leads">得到</span>
        <p className="journey-art-reveal-result" data-comparison-field="result"><Loss kind={path.kind} /><span>{path.result}</span></p>
      </div>
      <p className="journey-art-reveal-explanation">{path.explanation}</p>
    </article>)}
  </div>;
}

function StageStudentUpdate() {
  return <>
    <div className="journey-art-student journey-art-student--stage" data-role="student" data-state="trainable" data-stage="joint">
      <StudentIdentity />
      <div className="journey-art-stage-calculation">
        <div className="journey-art-stage-source-row"><span data-loss-source="old"><Loss kind="old" /></span><span aria-hidden="true">+</span><span data-loss-source="new"><Loss kind="new" /></span></div>
        <div className="journey-art-stage-equation"><span>两路合为联合目标</span><div className="journey-art-math-line"><JointObjectiveFormula /></div><p><var>λ</var><sub>o</sub> 为旧损失权重；<var>R</var> 是权重衰减。</p></div>
        <div className="journey-art-stage-equation journey-art-stage-equation--update"><span>梯度下降教学示意</span><div className="journey-art-math-line"><StudentUpdateFormula /></div><p>只更新可训练 Student 参数；<var>η</var> 为步长。</p></div>
      </div>
      <p className="journey-student-conclusion" data-update-target="student">两路损失，都改变 Student。<span data-role="teacher" data-state="frozen">Teacher 始终冻结，只提供参照。</span></p>
    </div>
  </>;
}

function RevealConvergence() {
  return <div className="journey-art-reveal-convergence" role="group" aria-label="L old 与 L new 汇入联合目标，再只更新 Student 参数" data-update-target="student">
    <div className="journey-art-reveal-losses" aria-label="两路损失来源">
      <p data-loss-source="old"><span>保留旧响应</span><Loss kind="old" /></p>
      <p data-loss-source="new"><span>学会新任务</span><Loss kind="new" /></p>
    </div>
    <span className="journey-art-reveal-flow" aria-hidden="true">→</span>
    <div className="journey-art-reveal-objective"><span>共同约束 · 联合目标</span><div className="journey-art-math-line"><JointObjectiveFormula /></div><small><var>λ</var><sub>o</sub>：旧损失权重　·　<var>R</var>：权重衰减</small></div>
    <div className="journey-art-reveal-gradient"><span>梯度作用</span><b aria-hidden="true">→</b></div>
    <div className="journey-art-reveal-update" data-role="student" data-state="trainable" data-stage="joint">
      <span>唯一更新对象</span><h3>Student</h3><p data-parameter-definition>{theta} 统称此处的共享表示、旧任务头和新任务头参数；原文的同名记号只指共享参数。</p><div className="journey-art-math-line"><StudentUpdateFormula /></div><p>梯度下降教学示意；<var>η</var> 为步长。</p>
    </div>
    <p className="journey-art-reveal-teacher" data-role="teacher" data-state="frozen"><strong>Teacher 固定在场外</strong><span>提供旧响应目标，不接收梯度，也不在此处更新。</span></p>
  </div>;
}

function JourneyMapHeading() {
  return <header className="journey-map-heading"><div><p className="journey-kicker">02 / THE WHOLE SYSTEM</p><h2 id="journey-map-title">沿着同一个输入，先看全局。</h2></div><p>先认出对象，再沿两条路径读到最右侧。<br />深色节点标出参数更新的唯一落点。</p></header>;
}

function JourneyComparisonHeading({ onStepChange }: { onStepChange?: (stepId: string) => void }) {
  return <header className="journey-section-heading"><div><p className="journey-kicker">03 / TWO COMPARISONS</p><h2 id="journey-paths-title">两次比较，参照各有来处。</h2></div><p>同一份 Student 共享表示分出两个输出头：旧头对照 Teacher 留下的<strong className="journey-inline-emphasis">旧响应目标</strong>，新头对照当前任务的真实标签。先分清每次比较的来源与结果。</p>{onStepChange ? <FocusAction stepId="loss" onStepChange={onStepChange}>定位两次比较</FocusAction> : null}</header>;
}

export function JourneyArtDirection({ direction, stepId, onStepChange }: {
  direction: Exclude<JourneyArtDirection, "baseline">;
  stepId: string;
  onStepChange: (stepId: string) => void;
}) {
  if (direction === "stage") return <div className="journey-art-stage" data-art-composition="shared-visual-stage">
    <aside className="journey-art-stage__visual" aria-label="02 到 04 持续可见的 LwF 系统图"><JourneyDiagramScene stepId={stepId} onStepChange={onStepChange} /></aside>
    <div className="journey-art-stage__reading">
      <section id="journey-map" className="journey-stage-map" aria-labelledby="journey-map-title">
        <JourneyMapHeading />
        <p className="journey-stage-map-intro">同一批当前任务输入 <var>x</var> 同时经过冻结的 Teacher 与可训练 Student；图中对象会一直留在这里。往下读时，只改变我们要追踪的局部。</p>
      </section>
      <p className="journey-bridge">图中 Teacher 目标和 Student 两类输出已经就位。现在沿同一张图检查两种参照各自进入哪里。</p>
      <section id="journey-paths" className="journey-stage-paths" aria-labelledby="journey-paths-title">
        <JourneyComparisonHeading onStepChange={onStepChange} />
        <StageComparisonRows onStepChange={onStepChange} />
      </section>
      <section id="journey-student" className="journey-stage-optimization" aria-labelledby="journey-student-title">
        <header className="journey-section-heading"><div><p className="journey-kicker">04 / ONE LEARNER</p><h2 id="journey-student-title">两种要求，汇成 Student 的一次更新。</h2></div><p>沿着刚才的两个损失继续：先合成联合目标，再对同一组 Student 参数求梯度。Teacher 留下参照，Student 承担学习。</p><FocusAction stepId="update" onStepChange={onStepChange}>沿图追到 Student 更新</FocusAction></header>
        <StageStudentUpdate />
        <JourneyTrainingDetails />
      </section>
    </div>
  </div>;

  return <div className="journey-art-reveal" data-art-composition="editorial-reveal">
    <section id="journey-map" className="journey-map" aria-labelledby="journey-map-title">
      <JourneyMapHeading />
      <JourneyDiagramScene stepId={stepId} onStepChange={onStepChange} />
      <p className="journey-bridge">全局关系先记住：Teacher 留下旧目标，Student 产生两种预测。下面只展开两组比较，再将结果送进同一个学习者。</p>
    </section>
    <section id="journey-paths" className="journey-paths journey-art-reveal-paths" aria-labelledby="journey-paths-title">
      <JourneyComparisonHeading />
      <RevealComparisonRows />
    </section>
    <section id="journey-student" className="journey-optimization journey-art-reveal-optimization" aria-labelledby="journey-student-title">
      <header className="journey-section-heading"><div><p className="journey-kicker">04 / ONE LEARNER</p><h2 id="journey-student-title">两个损失汇进目标，只有 Student 更新。</h2></div><p>把上一节的两个比较结果放在同一个计算现场里：先形成 <var>J</var>，再将其梯度作用到 Student。Teacher 仍只是固定参照。</p></header>
      <RevealConvergence />
      <JourneyTrainingDetails />
    </section>
  </div>;
}
