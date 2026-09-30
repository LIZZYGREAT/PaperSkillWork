import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";

const SAMPLE_PIXEL_LEVELS: Record<"A" | "B", number[][]> = {
  A: [
    [0, 1, 1, 0, 2, 3, 1, 0, 0, 2, 4, 1],
    [1, 0, 2, 4, 3, 1, 0, 1, 2, 0, 1, 3],
    [0, 1, 3, 2, 0, 0, 2, 4, 3, 1, 0, 1],
  ],
  B: [
    [0, 2, 4, 3, 1, 0, 0, 2, 3, 4, 1, 0],
    [2, 1, 0, 2, 4, 3, 0, 1, 3, 0, 2, 4],
    [0, 1, 2, 3, 4, 1, 0, 2, 1, 3, 4, 2],
  ],
};

const PIXEL_TONES: Record<"A" | "B", string[]> = {
  A: ["#f5f7f4", "#e6ece8", "#cbd9d1", "#9ab5a8", "#587a6b"],
  B: ["#f9f4f0", "#efddd3", "#e7c1af", "#d99a7c", "#b76548"],
};

const INPUT_NODES = [28, 63, 98];
const HIDDEN_NODES = [17, 39, 61, 83, 105];
const OUTPUT_NODES = [28, 63, 98];

function NeuralNetworkMark({ compact = false, idPrefix }: { compact?: boolean; idPrefix: string }) {
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-description`;
  return (
    <svg
      className={`p01-network ${compact ? "p01-network--compact" : ""}`}
      viewBox="0 0 250 122"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>同一个共享参数神经网络</title>
      <desc id={descriptionId}>输入层连接到隐藏层，再连接到输出层；网络参数统一记作 theta。</desc>
      <g className="p01-network__wires" aria-hidden="true">
        {INPUT_NODES.flatMap((inputY, inputIndex) => HIDDEN_NODES.map((hiddenY, hiddenIndex) => (
          <line key={`ih-${inputIndex}-${hiddenIndex}`} x1="24" y1={inputY} x2="123" y2={hiddenY} />
        )))}
        {HIDDEN_NODES.flatMap((hiddenY, hiddenIndex) => OUTPUT_NODES.map((outputY, outputIndex) => (
          <line key={`ho-${hiddenIndex}-${outputIndex}`} x1="127" y1={hiddenY} x2="226" y2={outputY} />
        )))}
      </g>
      <g className="p01-network__nodes p01-network__nodes--input" aria-hidden="true">
        {INPUT_NODES.map((y) => <circle key={`input-${y}`} cx="22" cy={y} r="7" />)}
      </g>
      <g className="p01-network__nodes p01-network__nodes--hidden" aria-hidden="true">
        {HIDDEN_NODES.map((y) => <circle key={`hidden-${y}`} cx="125" cy={y} r="7" />)}
      </g>
      <g className="p01-network__nodes p01-network__nodes--output" aria-hidden="true">
        {OUTPUT_NODES.map((y) => <circle key={`output-${y}`} cx="228" cy={y} r="7" />)}
      </g>
      <text className="p01-network__layer-label" x="22" y="119" textAnchor="middle">输入</text>
      <text className="p01-network__layer-label" x="125" y="119" textAnchor="middle">网络层</text>
      <text className="p01-network__layer-label" x="228" y="119" textAnchor="middle">输出</text>
    </svg>
  );
}

function DataGlyph({ task }: { task: "A" | "B" }) {
  const sampleOffset = task === "A" ? 0 : 3;
  return (
    <div className={`p01-data-glyph p01-data-glyph--${task.toLowerCase()}`} aria-label={`Task ${task} 的三组图像像素序列示意及对应目标`}>
      <div className="p01-data-glyph__samples" aria-hidden="true">
        {SAMPLE_PIXEL_LEVELS[task].map((sample, sampleIndex) => (
          <div className="p01-data-glyph__sample" key={`${task}-${sampleIndex}`}>
            <span className="p01-data-glyph__sample-id">x<sub>{sampleOffset + sampleIndex + 1}</sub></span>
            <span className="p01-data-glyph__pixels">
              {sample.map((level, markIndex) => <i key={`${sampleIndex}-${markIndex}`} style={{ backgroundColor: PIXEL_TONES[task][level] }} />)}
            </span>
            <span className="p01-data-glyph__target">y<sub>{sampleOffset + sampleIndex + 1}</sub></span>
          </div>
        ))}
      </div>
      <span className="p01-data-glyph__note">{task === "A" ? "旧任务样本" : "新任务样本"} · 图像像素序列示意</span>
    </div>
  );
}

function TrainingArrow() {
  return (
    <svg className="p01-training-signal__arrow" viewBox="0 0 42 20" aria-hidden="true">
      <path d="M2 10h32" />
      <path d="m28 4 8 6-8 6" />
    </svg>
  );
}

function TrainingSignal({ task }: { task: "A" | "B" }) {
  return (
    <div className={`p01-training-signal p01-training-signal--${task.toLowerCase()}`} aria-label={`Task ${task} 的训练过程` }>
      <div className="p01-training-signal__steps">
        <span className="p01-training-signal__step"><i>01</i><b>前向计算</b></span>
        <TrainingArrow />
        <span className="p01-training-signal__step"><i>02</i><b>计算 Loss</b></span>
        <TrainingArrow />
        <span className="p01-training-signal__step"><i>03</i><b>反向传播</b></span>
        <TrainingArrow />
        <span className="p01-training-signal__step p01-training-signal__step--update"><i>04</i><b>更新参数</b></span>
      </div>
      <div className="p01-training-signal__return" aria-hidden="true">
        <svg viewBox="0 0 120 26" preserveAspectRatio="none">
          <path d="M118 3v7c0 7-6 12-14 12H22c-8 0-14-5-14-12V5" />
          <path d="m2 11 6-6 6 6" />
        </svg>
        <b>重复训练步骤</b>
      </div>
    </div>
  );
}

// Each array index is a fixed parameter coordinate; before and after use the same signed scale.
const PARAMETER_GROUPS = [
  { label: "θ¹", before: [-26, 30, 15, -33, 22], after: [-18, 36, 12, -27, 28] },
  { label: "θ²", before: [34, -18, 27, -23, 31], after: [28, -25, -9, -17, 26] },
  { label: "θ³", before: [-15, 35, -28, 19, -32], after: [-23, 29, -20, 26, -27] },
];

function ParameterVector({ changed = false }: { changed?: boolean }) {
  return (
    <div
      className={`p01-parameter-vector ${changed ? "is-changed" : ""}`}
      role="img"
      aria-label={changed
        ? "Task B 更新后的 15 个有符号参数坐标；淡色柱为 Task A 起始值，橙色柱为对应的新值，共享零轴与尺度"
        : "Task A 训练结束时的 15 个有符号参数坐标，共享零轴与尺度"}
    >
      {PARAMETER_GROUPS.map((group) => (
        <div className="p01-parameter-vector__group" key={group.label}>
          <span>{group.label}</span>
          <div className="p01-parameter-vector__plot" aria-hidden="true">
            <span className="p01-parameter-vector__zero" />
            {group.before.map((before, index) => {
              const value = changed ? group.after[index] : before;
              return (
                <span className="p01-parameter-vector__coordinate" key={`${group.label}-${index}`}>
                  {changed && <i className={`p01-parameter-vector__bar p01-parameter-vector__bar--ghost ${before < 0 ? "is-negative" : "is-positive"}`} style={{ height: Math.abs(before) }} />}
                  <i className={`p01-parameter-vector__bar ${changed ? "is-updated" : ""} ${value < 0 ? "is-negative" : "is-positive"}`} style={{ height: Math.abs(value) }} />
                </span>
              );
            })}
          </div>
        </div>
      ))}
      <span className="p01-parameter-vector__caption">同一参数坐标 · 同一尺度</span>
    </div>
  );
}

function ParameterMovement({ parameter, sensitive }: { parameter: 1 | 2; sensitive: boolean }) {
  return (
    <div className={`p01-movement ${sensitive ? "p01-movement--sensitive" : "p01-movement--flexible"}`}>
      <div className="p01-movement__identity">
        <b>θ<sub>{parameter}</sub></b>
        <span>{sensitive ? "Task A 对变化更敏感" : "Task A 对变化较不敏感"}</span>
      </div>
      <div className="p01-movement__track" role="img" aria-label={`参数 θ${parameter} 从 Task A 结束时的位置移动到新位置；移动幅度与另一行相同`}>
        <span className="p01-movement__position p01-movement__position--start">θ<sub>A,{parameter}</sub><sup>*</sup></span>
        <span className="p01-movement__position p01-movement__position--end">θ<sub>{parameter}</sub>′</span>
        <span className="p01-movement__arrow" aria-hidden="true" />
        <i className="p01-movement__anchor" aria-hidden="true" />
        <i className="p01-movement__current" aria-hidden="true" />
      </div>
      <div className="p01-movement__impact" aria-label={`Task A Loss 增加，示意相对影响${sensitive ? "较大" : "较小"}`}>
        <span>Task A Loss 增加</span>
        <div className="p01-movement__impact-track" aria-hidden="true"><i /></div>
      </div>
    </div>
  );
}

export function PageProblem() {
  const api = useReferenceApi();

  return (
    <article className="ewc-page p01-page" aria-labelledby="p01-title">
      <header className="ewc-page-header p01-header" id="problem-context">
        <div className="ewc-page-header__kicker"><span>01</span> CONTINUAL LEARNING · THE PROBLEM</div>
        <h1 id="p01-title">学会新任务时，旧任务为什么可能退步？</h1>
        <p className="ewc-page-header__dek">
          普通监督学习通常让训练数据共同参与优化。<ReferenceTrigger id="continual_learning">持续学习</ReferenceTrigger>面对的情况是：任务或数据按时间到来，而旧数据未必能一直保留。同一个神经网络需要继续适应新任务，同时尽量保持先前的能力。关键在于，后续训练会不会改动旧任务也依赖的参数。
        </p>
        <p className="p01-task-settings"><span>常见评测设置</span> Task-IL、Domain-IL 和 Class-IL 在任务身份是否可用、任务与输出如何组织等方面有所不同；这一页先聚焦它们共享的情形：同一模型依次处理多个任务。</p>
      </header>

      <section className="p01-sequence" aria-labelledby="p01-sequence-title">
        <div className="p01-section-heading">
          <div><span className="p01-overline">ONE MODEL · TWO TASKS · A CHANGING PARAMETER STATE</span><h2 id="p01-sequence-title">沿一条顺序训练路径，看同一个模型怎样被继续更新</h2></div>
          <p>从 Task A 的数据开始，跟住模型与参数，一直看到 Task B 到来之后。</p>
        </div>

        <ol className="p01-flow" aria-label="Task A 到 Task B 的顺序训练流程">
          <li className="p01-stage p01-stage--data-a">
            <span className="p01-stage__marker">01</span>
            <div className="p01-stage__content">
              <div className="p01-stage__copy"><span className="p01-stage__type">INPUT · FIRST TASK</span><h3>Task A Data</h3><p>第一批任务数据进入训练。</p></div>
              <DataGlyph task="A" />
            </div>
          </li>

          <li className="p01-stage p01-stage--model">
            <span className="p01-stage__marker">02</span>
            <div className="p01-stage__content">
              <div className="p01-stage__copy"><span className="p01-stage__type">SHARED NEURAL NETWORK</span><h3>Model <em>θ</em></h3><p>Task A 与 Task B 继续使用同一个共享模型，并持续更新参数 <em>θ</em>。</p></div>
              <div className="p01-model-object"><NeuralNetworkMark idPrefix="task-a-model" /><span className="p01-model-object__parameter">共享参数 <b>θ</b></span></div>
            </div>
          </li>

          <li className="p01-stage p01-stage--train-a">
            <span className="p01-stage__marker">03</span>
            <div className="p01-stage__content">
              <div className="p01-stage__copy"><span className="p01-stage__type">OPTIMIZE ON TASK A</span><h3>Train</h3><p>训练过程反复调整模型参数，让它适应 Task A。</p></div>
              <TrainingSignal task="A" />
            </div>
          </li>

          <li className="p01-stage p01-stage--anchor">
            <span className="p01-stage__marker">04</span>
            <div className="p01-stage__content">
              <div className="p01-stage__copy"><span className="p01-stage__type">TASK A · TRAINING ENDS</span><h3><em>θ</em><sub>A</sub>*</h3><p>模型此时停在一个能完成 Task A 的参数状态。</p></div>
              <div className="p01-state-object"><ParameterVector /><div className="p01-state-object__note"><b>保存下来的位置</b><span>Task A 学习结束时的参数快照</span></div></div>
            </div>
          </li>

          <li className="p01-stage p01-stage--data-b">
            <span className="p01-stage__marker">05</span>
            <div className="p01-stage__content">
              <div className="p01-stage__copy"><span className="p01-stage__type">INPUT · NEXT TASK</span><h3>Task B Data</h3><p>Task B 到来，模型开始针对新的任务数据继续优化。</p></div>
              <DataGlyph task="B" />
            </div>
          </li>

          <li className="p01-stage p01-stage--train-b">
            <span className="p01-stage__marker">06</span>
            <div className="p01-stage__content">
              <div className="p01-stage__copy"><span className="p01-stage__type">SAME MODEL · CONTINUED TRAINING</span><h3>继续训练同一个模型</h3><p>训练从 <em>θ</em><sub>A</sub>* 接着进行；没有换成另一套网络。</p></div>
              <div className="p01-reuse-model"><div className="p01-reuse-model__network"><NeuralNetworkMark compact idPrefix="task-b-same-model" /><span>same model</span></div><span className="p01-reuse-model__link" aria-hidden="true">←</span><div className="p01-reuse-model__update"><span>Task B 的更新信号</span><TrainingSignal task="B" /></div></div>
            </div>
          </li>

          <li className="p01-stage p01-stage--changed">
            <span className="p01-stage__marker">07</span>
            <div className="p01-stage__content">
              <div className="p01-stage__copy"><span className="p01-stage__type">THE SHARED PARAMETERS MOVE</span><h3><em>θ</em> changes</h3><p>同一组参数坐标持续更新：<em>θ</em><sub>A</sub><sup>*</sup> → <em>θ</em><sup>(t+1)</sup> → <em>θ</em><sup>(t+2)</sup> → ⋯。</p></div>
              <div className="p01-changed-state"><ParameterVector changed /><div className="p01-outcomes" aria-label="顺序学习中的可能表现变化">
                <div><span>Task B · 新任务</span><b><i aria-hidden="true">↑</i> 可能改善</b></div>
                <div><span>Task A · 先前任务</span><b><i aria-hidden="true">↓</i> 可能下降</b></div>
                <small>方向示意；不表示每次更新必然遗忘，也不代表论文实验数值。</small>
              </div></div>
            </div>
          </li>
        </ol>
      </section>

      <section className="p01-forgetting" aria-labelledby="p01-forgetting-title">
        <div className="p01-forgetting__label"><span>THE FAILURE MODE</span><b aria-hidden="true">↘</b></div>
        <div className="p01-forgetting__definition"><h2 id="p01-forgetting-title"><ReferenceTrigger id="catastrophic_forgetting">Catastrophic Forgetting</ReferenceTrigger></h2><p>学习新任务时，参数更新可能破坏旧任务所依赖的参数状态，使旧任务性能显著下降。</p></div>
        <p className="p01-forgetting__conflict"><span>落到参数层</span><strong>学习 Task B 必须修改参数；但 Task A 也依赖这些参数。</strong></p>
      </section>

      <section className="p01-parameters" aria-labelledby="p01-parameters-title">
        <div className="p01-section-heading">
          <div><span className="p01-overline">ZOOM IN · REPRESENTATIVE PARAMETERS</span><h2 id="p01-parameters-title">同样大小的参数更新，对旧任务的影响可能不同</h2></div>
          <p>问题不是参数“能不能更新”，而是不同参数发生相同幅度的变化时，对旧任务造成的影响可能不同。</p>
        </div>
        <figure className="p01-movement-compare" aria-label="两次相同幅度的参数移动，引起不同大小的 Task A Loss 增加">
          <figcaption className="p01-movement-compare__equation"><span>两条参数移动的幅度相同</span><b>|Δθ₁| = |Δθ₂|</b></figcaption>
          <ParameterMovement parameter={1} sensitive />
          <ParameterMovement parameter={2} sensitive={false} />
          <p className="p01-movement-compare__note">两条 Loss 使用同一尺度；长度仅示意相对影响，不代表论文实验测量值。</p>
        </figure>
        <p className="p01-parameters__takeaway"><ReferenceTrigger id="parameter_interference">不同参数对旧任务的敏感程度不同</ReferenceTrigger>，因此后续训练需要区分哪些参数应该受到更强约束，哪些参数可以更灵活地更新。</p>
      </section>

      <section className="p01-ewc-preview" id="ewc-motivation" aria-labelledby="p01-ewc-title">
        <div className="p01-ewc-preview__intro"><span className="p01-overline">A CONCEPT PREVIEW · NO FORMULA YET</span><h2 id="p01-ewc-title"><ReferenceTrigger id="ewc">EWC</ReferenceTrigger> 要处理的矛盾</h2><p>不是冻结整个模型，而是记下 Task A 依赖参数的位置与敏感程度；学习 Task B 时，对更敏感的部分限制得更强。</p></div>
        <ol className="p01-ewc-trace" aria-label="EWC 的概念预告">
          <li><span>01</span><b>训练 Task A</b></li><li aria-hidden="true">→</li>
          <li><span>02</span><b>区分参数的旧任务敏感程度</b></li><li aria-hidden="true">→</li>
          <li><span>03</span><b>保存旧任务参数状态</b></li><li aria-hidden="true">→</li>
          <li><span>04</span><b>继续学 Task B，并区别约束</b></li>
        </ol>
      </section>

      <section className="p01-handoff" aria-label="下一页学习目标">
        <div><span className="p01-overline">NEXT · PAGE 02</span><h2>先把普通训练这条链看清楚</h2><p>神经网络怎样产生概率？整份数据的 Likelihood 和 Loss 怎样从这些概率得到？参数又怎样被更新？</p></div>
        <button type="button" className="p01-handoff__button" onClick={() => api.navigatePage("page-02-probability")}><span>打开 Page 2</span><b aria-hidden="true">02 →</b></button>
      </section>
    </article>
  );
}
