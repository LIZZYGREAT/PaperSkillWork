import { useLessonPlayback, PlaybackControls } from "./lesson-playback";
import { P4_TOY_EXPERIMENT, P4_TRAINING_TRACE, runP4Forward } from "./prompt-tuning-demo";
import { Arrow } from "./vit-visuals";
import "./prompt-tuning.css";

type Pair = readonly [number, number];
type Matrix = readonly [Pair, Pair];

const duration = 7600;
const boundaries = [0, 850, 1850, 2900, 4100, 5550, 6600, duration];
const phases = [
  { short: "准备输入", text: "固定两枚图像 Token；可学习的 P₀、P₁ 放在序列前端。每个 Token 的宽度都是 2。" },
  { short: "冻结前向", text: "同一组固定 WQ、WK、WV、WO 计算单头 Attention；首个 Prompt 对四个输入位置形成可复算权重。" },
  { short: "形成损失", text: "分类头给出两个 Logits 和 Softmax 概率，交叉熵针对示例标签 y=1 计算。" },
  { short: "回传梯度", text: "交叉熵的梯度穿过固定 Attention 运算回到 Prompt，并计算分类头梯度；冻结主干参数不进入更新。" },
  { short: "逐值更新", text: "按 P¹=P⁰−η∇Pℒ 与 W¹=W⁰−η∇Wℒ 更新 Prompt 和分类头，再从当前数值重算前向。" },
  { short: "同图复算", text: "图像 Token 与冻结 Attention 权重保持相同；更新后的 Prompt 和分类头产生新的读出、Logits 与损失。" },
  { short: "任务 B 接续", text: "任务 B 可以继续改写同一组 Prompt。此处只说明参数身份延续，不假造任务 B 数据或结果。" },
];

function phaseAt(position: number) {
  if (position >= duration) return phases.length - 1;
  const index = boundaries.findIndex((_, i) => i < boundaries.length - 1 && position >= boundaries[i] && position < boundaries[i + 1]);
  return Math.max(0, index);
}

function phaseProgress(position: number, phase: number) {
  return Math.max(0, Math.min(1, (position - boundaries[phase]) / (boundaries[phase + 1] - boundaries[phase])));
}

function interpolatePair(from: Pair, to: Pair, amount: number): Pair {
  return from.map((value, index) => value + (to[index] - value) * amount) as unknown as Pair;
}

function interpolateMatrix(from: Matrix, to: Matrix, amount: number): Matrix {
  return from.map((row, index) => interpolatePair(row, to[index], amount)) as unknown as Matrix;
}

function number(value: number) { return value.toFixed(3); }

function VectorValue({ values }: { values: Pair }) {
  return <code>[{number(values[0])}, {number(values[1])}]</code>;
}

function ParameterMatrix({ label, values }: { label: string; values: Matrix }) {
  return <span className="p4-matrix-value"><b>{label}</b><code>[[{number(values[0][0])}, {number(values[0][1])}], [{number(values[1][0])}, {number(values[1][1])}]]</code></span>;
}

export function PromptTuning() {
  const playback = useLessonPlayback(duration);
  const activePhase = phaseAt(playback.position);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const updateProgress = activePhase === 4 ? (reducedMotion ? 1 : phaseProgress(playback.position, 4)) : activePhase > 4 ? 1 : 0;
  const currentPrompt = interpolateMatrix(P4_TOY_EXPERIMENT.prompt, P4_TRAINING_TRACE.updatedPrompt, updateProgress);
  const currentClassifierWeights = interpolateMatrix(P4_TOY_EXPERIMENT.classifier.weights, P4_TRAINING_TRACE.updatedClassifierWeights, updateProgress);
  const currentClassifierBias = interpolatePair(P4_TOY_EXPERIMENT.classifier.bias, P4_TRAINING_TRACE.updatedClassifierBias, updateProgress);
  const calculation = activePhase === 0 ? null : activePhase === 4
    ? runP4Forward(currentPrompt, currentClassifierWeights, currentClassifierBias)
    : activePhase > 4 ? P4_TRAINING_TRACE.updated : P4_TRAINING_TRACE.initial;
  const gradientProgress = activePhase > 3 ? 1 : activePhase === 3 ? phaseProgress(playback.position, 3) : 0;
  const showLoss = activePhase >= 2;
  const showGradients = activePhase >= 3;
  const showReforward = activePhase >= 5;

  return <>
    <p className="lesson-lead">P3 已经给出一个入口：即使 Transformer 权重固定，改变输入 Token 仍会改变输出。Prompt Tuning 把一小段连续向量设为可学习参数，让它随图像一起进入网络，靠分类误差适应新任务。</p>

    <section className="explain-section">
      <h3>Prompt 是一组向量参数，不是图像 Patch 或自然语言句子</h3>
      <p>沿用 P2 的图像嵌入层，先得到 <math><msub><mi>x</mi><mi>e</mi></msub></math>。Prompt 放在这段序列之前：每个 Prompt Token 与图像 Token 有相同的特征宽度 <math><mi>D</mi></math>，因此增加的是位置数，不是新建 Transformer 层。</p>
      <div className="p4-shape-equations">
        <math display="block"><mi>P</mi><mo>∈</mo><msup><mi>ℝ</mi><mrow><msub><mi>L</mi><mi>p</mi></msub><mo>×</mo><mi>D</mi></mrow></msup></math>
        <math display="block"><msub><mi>x</mi><mi>p</mi></msub><mo>=</mo><mo>[</mo><mi>P</mi><mo>;</mo><msub><mi>x</mi><mi>e</mi></msub><mo>]</mo><mo>∈</mo><msup><mi>ℝ</mi><mrow><mo>(</mo><msub><mi>L</mi><mi>p</mi></msub><mo>+</mo><mi>L</mi><mo>)</mo><mo>×</mo><mi>D</mi></mrow></msup><mo>,</mo><mi>H</mi><mo>=</mo><msub><mi>f</mi><mi>r</mi></msub><mo>(</mo><msub><mi>x</mi><mi>p</mi></msub><mo>)</mo></math>
      </div>
      <p>这里的分号表示沿序列长度拼接。P4 用单个 Prompt 做训练原理的简化教学桥；L2P 正式使用多个 Prompt，并读取它们经过 Transformer 后的位置输出，留到 P6。</p>
    </section>

    <figure className="lesson-figure p4-training-figure">
      <div className="figure-top"><strong>一次可复算更新 · 冻结 Attention 中的可学习输入</strong><span>教学模型：2 维、单头、2 个 Prompt Token</span></div>
      <div className="p4-control-dock" aria-label="Prompt 参数实验控制">
        <div className="motion-stops" role="group" aria-label="选择 Prompt 调优的观察阶段">
          {phases.map((phase, index) => <button className="lesson-choice" type="button" key={phase.short} aria-pressed={activePhase === index} onClick={() => playback.seek(boundaries[index])}>{index + 1}. {phase.short}</button>)}
        </div>
        <div className="p4-control-bottomline">
          <PlaybackControls playback={playback} label="一次 Prompt 更新的计算进度" />
          <p className="motion-status" aria-live="polite">{phases[activePhase].text}</p>
        </div>
      </div>
      <div className="figure-body">
        <div className="p4-computation-caption">
          <span>可复算教学数据，不是论文测量值</span>
          <span>固定输入 x<sub>e</sub> 与 Attention 参数 · 标签 y=1 · 学习率 η={P4_TOY_EXPERIMENT.learningRate.toFixed(2)}</span>
        </div>

        <div className="p4-workbench-grid">
          <section className={`p4-workbench-column p4-input-column ${activePhase === 0 ? "is-active" : ""}`} aria-label="Prompt 与固定图像输入">
            <div className="p4-column-heading"><strong>输入 Token</strong><span>宽度 D=2</span></div>
            <div className="p4-live-prompt" aria-label="当前 Prompt 数值">
              <strong>P<sup>{activePhase >= 5 ? "1" : activePhase === 4 ? "t" : "0"}</sup></strong>
              {currentPrompt.map((row, index) => <span key={index}><small>P<sub>{index}</sub></small><VectorValue values={row} /></span>)}
            </div>
            <div className="p4-fixed-inputs">
              <strong>固定图像嵌入 x<sub>e</sub></strong>
              <span><b>[CLS]</b><VectorValue values={P4_TOY_EXPERIMENT.imageTokens[0]} /></span>
              <span><b>Patch₁</b><VectorValue values={P4_TOY_EXPERIMENT.imageTokens[1]} /></span>
              <small>[P₀; P₁; CLS; Patch₁] · 4×2</small>
            </div>
          </section>

          <section className={`p4-workbench-column p4-attention-column ${activePhase === 1 || activePhase === 3 ? "is-active" : ""}`} aria-label="冻结 Attention 前向计算">
            <div className="p4-column-heading"><strong>同一冻结 Attention</strong><span>只更新输入，不更新这些矩阵</span></div>
            <div className="p4-fixed-matrices" aria-label="冻结的注意力投影矩阵">
              <ParameterMatrix label="WQ" values={P4_TOY_EXPERIMENT.frozenWeights.wq} />
              <ParameterMatrix label="WK" values={P4_TOY_EXPERIMENT.frozenWeights.wk} />
              <ParameterMatrix label="WV" values={P4_TOY_EXPERIMENT.frozenWeights.wv} />
              <ParameterMatrix label="WO" values={P4_TOY_EXPERIMENT.frozenWeights.wo} />
            </div>
            <div className="p4-attention-rule"><math><mi>Softmax</mi><mo>(</mo><msub><mi>Q</mi><mn>0</mn></msub><msup><mi>K</mi><mi>T</mi></msup><mo>/</mo><msqrt><mn>2</mn></msqrt><mo>)</mo></math><span>首个 Prompt 对来源位置的权重</span></div>
            <div className="p4-attention-weights">
              {["P₀", "P₁", "[CLS]", "Patch₁"].map((label, index) => <div className="p4-attention-row" key={label}>
                <b>{label}</b><span className="p4-attention-track"><i style={{ transform: `scaleX(${calculation?.firstPromptAttention[index] ?? 0})` }} /></span><code>{calculation ? calculation.firstPromptAttention[index].toFixed(3) : "—"}</code>
              </div>)}
            </div>
            <small className="p4-freeze-note">fᵣ 的运算仍参与反向求导；WQ/WK/WV/WO 的数值保持固定。</small>
          </section>

          <section className={`p4-workbench-column p4-output-column ${activePhase === 2 || activePhase === 5 ? "is-active" : ""}`} aria-label="读出、分类与交叉熵">
            <div className="p4-column-heading"><strong>简化读出与分类</strong><span>单 Prompt 教学设定</span></div>
            <div className="p4-output-readout"><math><mi>h</mi><mo>(</mo><mi>P</mi><mo>,</mo><mi>x</mi><mo>)</mo><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>(</mo><msub><mi>H</mi><mn>0</mn></msub><mo>+</mo><msub><mi>H</mi><mn>1</mn></msub><mo>)</mo></math>{calculation ? <VectorValue values={calculation.promptReadout} /> : <span>等待前向</span>}</div>
            <div className="p4-logits-line"><span>z₀</span><code>{calculation ? number(calculation.logits[0]) : "—"}</code><span>z₁</span><code>{calculation ? number(calculation.logits[1]) : "—"}</code></div>
            <div className="p4-softmax-line"><span>Softmax(z)</span><code>{calculation ? `[${number(calculation.probabilities[0])}, ${number(calculation.probabilities[1])}]` : "等待前向"}</code></div>
            <div className={`p4-loss-readout ${showLoss ? "is-visible" : ""}`}><strong>CE(y=1, z)</strong><code>{showLoss && calculation ? number(calculation.loss) : "等待标签比较"}</code></div>
          </section>
        </div>

        <div className={`p4-gradient-route ${activePhase === 3 ? "is-active" : ""}`} aria-label="分类损失的梯度穿过冻结 Attention 运算，回到 Prompt 与分类头">
          <div className="p4-gradient-heading"><strong>反向梯度</strong><span>来自同一交叉熵计算图</span></div>
          <div className="p4-gradient-visual">
            <math><mo>∂</mo><mi>ℒ</mi><mo>/</mo><mo>∂</mo><mi>h</mi></math>
            <svg viewBox="0 0 520 42" preserveAspectRatio="none" role="img" aria-label="梯度从分类损失经过固定 Attention 运算回传至 Prompt">
              <defs><marker id="p4-gradient-arrow" markerWidth="7" markerHeight="7" refX="2.5" refY="3.5" orient="auto"><path d="M7 0L0 3.5L7 7Z" fill="currentColor" /></marker></defs>
              <path d="M495 21 H18" className="p4-gradient-line" markerEnd="url(#p4-gradient-arrow)" />
              <circle className="p4-gradient-particle" cx="0" cy="21" r="4" transform={`translate(${495 - 477 * gradientProgress} 0)`} />
            </svg>
            <math><mo>∂</mo><mi>ℒ</mi><mo>/</mo><mo>∂</mo><mi>P</mi></math>
          </div>
          <div className="p4-gradient-numbers">
            <span><b>∇P ℒ</b>{showGradients ? <code>[[{number(P4_TRAINING_TRACE.promptGradients[0][0])}, {number(P4_TRAINING_TRACE.promptGradients[0][1])}], [{number(P4_TRAINING_TRACE.promptGradients[1][0])}, {number(P4_TRAINING_TRACE.promptGradients[1][1])}]]</code> : <span>等待损失回传</span>}</span>
            <span><b>∇Wcls ℒ</b>{showGradients ? <code>[[{number(P4_TRAINING_TRACE.classifierWeightGradients[0][0])}, {number(P4_TRAINING_TRACE.classifierWeightGradients[0][1])}], [{number(P4_TRAINING_TRACE.classifierWeightGradients[1][0])}, {number(P4_TRAINING_TRACE.classifierWeightGradients[1][1])}]]</code> : <span>等待损失回传</span>}</span>
            <span><b>∇bcls ℒ</b>{showGradients ? <code>[{number(P4_TRAINING_TRACE.classifierBiasGradients[0])}, {number(P4_TRAINING_TRACE.classifierBiasGradients[1])}]</code> : <span>等待损失回传</span>}</span>
          </div>
        </div>

        <div className={`p4-update-workbench ${activePhase === 4 ? "is-active" : ""}`} aria-label="Prompt 与分类头的一步 SGD 数值更新">
          <div className="p4-update-heading">
            <div><strong>一步 SGD · 数值逐项对应</strong><span>P 与分类头更新；冻结主干不写入优化器</span></div>
            <div className="p4-update-equations"><math><msup><mi>P</mi><mn>1</mn></msup><mo>=</mo><msup><mi>P</mi><mn>0</mn></msup><mo>−</mo><mi>η</mi><msub><mo>∇</mo><mi>P</mi></msub><mi>ℒ</mi></math><math><msubsup><mi>W</mi><mi>cls</mi><mn>1</mn></msubsup><mo>=</mo><msubsup><mi>W</mi><mi>cls</mi><mn>0</mn></msubsup><mo>−</mo><mi>η</mi><msub><mo>∇</mo><msub><mi>W</mi><mi>cls</mi></msub></msub><mi>ℒ</mi></math></div>
          </div>
          <div className="p4-update-grid">
            <div className="p4-prompt-update-table">
              <div className="p4-update-table-head"><span>参数对象</span><span>旧值 P⁰</span><span>梯度 ∇Pℒ</span><span>{activePhase >= 4 ? "当前值 Pᵗ → P¹" : "当前值"}</span></div>
              {[0, 1].map(index => <div className="p4-update-table-row" key={index}>
                <b>P<sub>{index}</sub></b><VectorValue values={P4_TOY_EXPERIMENT.prompt[index]} />{showGradients ? <VectorValue values={P4_TRAINING_TRACE.promptGradients[index]} /> : <span>待计算</span>}<span className="p4-updated-value"><VectorValue values={currentPrompt[index]} />{activePhase >= 4 && <small>终点 <VectorValue values={P4_TRAINING_TRACE.updatedPrompt[index]} /></small>}</span>
              </div>)}
              <small>更新展示沿逐坐标线性插值；中间帧不是额外的优化器步。每帧输出都由当前参数重新计算。</small>
            </div>
            <div className="p4-classifier-update">
              <div className="p4-update-table-head"><span>分类头参数</span><span>梯度</span><span>当前值</span></div>
              <div className="p4-head-gradient-row"><b>Wcls</b>{showGradients ? <code>[[{number(P4_TRAINING_TRACE.classifierWeightGradients[0][0])}, {number(P4_TRAINING_TRACE.classifierWeightGradients[0][1])}], [{number(P4_TRAINING_TRACE.classifierWeightGradients[1][0])}, {number(P4_TRAINING_TRACE.classifierWeightGradients[1][1])}]]</code> : <code>待计算</code>}<code>[[{number(currentClassifierWeights[0][0])}, {number(currentClassifierWeights[0][1])}], [{number(currentClassifierWeights[1][0])}, {number(currentClassifierWeights[1][1])}]]</code></div>
              <div className="p4-head-gradient-row"><b>bcls</b>{showGradients ? <code>[{number(P4_TRAINING_TRACE.classifierBiasGradients[0])}, {number(P4_TRAINING_TRACE.classifierBiasGradients[1])}]</code> : <code>待计算</code>}<code>[{number(currentClassifierBias[0])}, {number(currentClassifierBias[1])}]</code></div>
              <small>δfₑ = δfᵣ = 0：冻结层权重未更新。</small>
            </div>
          </div>
          <div className="p4-reforward-compare" aria-label="更新前后同一图像的重新前向结果">
            <strong>固定同一 xₑ 与 fᵣ，更新前后再前向</strong>
            {showReforward ? <><div><span>更新前 <code>z⁰=[{number(P4_TRAINING_TRACE.initial.logits[0])}, {number(P4_TRAINING_TRACE.initial.logits[1])}]</code><code>ℒ⁰={number(P4_TRAINING_TRACE.initial.loss)}</code></span><Arrow /><span>更新后 <code>z¹=[{calculation ? number(calculation.logits[0]) : number(P4_TRAINING_TRACE.updated.logits[0])}, {calculation ? number(calculation.logits[1]) : number(P4_TRAINING_TRACE.updated.logits[1])}]</code><code>ℒ¹={calculation ? number(calculation.loss) : number(P4_TRAINING_TRACE.updated.loss)}</code></span></div><small>此参数设置的一次教学更新后，损失从 {number(P4_TRAINING_TRACE.initial.loss)} 变为 {number(P4_TRAINING_TRACE.updated.loss)}；不表示每一步 SGD 都保证损失下降。</small></> : <p>完成一次参数更新后，进入“同图复算”查看更新前后的输出。</p>}
          </div>
        </div>
        <p className="p4-model-note">计算图：2 个 Prompt Token + 2 个固定图像 Token → 单头自注意力 → 两个 Prompt 输出取均值（P4 简化读出）→ 线性分类头 → CE。梯度由本地标量反向自动微分得到；中心差分只用于独立校验。</p>
      </div>
      <figcaption>这里的低维参数、图像嵌入和分类标签构成可复算教学模型，不是预训练 ViT 的真实隐藏状态或论文实验数值。正式 L2P 对多个 Prompt 输出位置进行 AvgPool 的分类规则见 P6。</figcaption>
    </figure>

    <section className="explain-section">
      <h3>梯度能穿过冻结运算，参数却不必更新</h3>
      <aside className="reading-note reading-note--prompt">
        <strong>梯度能通过，权重仍冻结</strong>
        <p>分类损失依赖于输入序列里的 P，因此一般情形下可对 P 求梯度。反向计算经过固定的 Transformer 运算，把梯度传到 P；优化器只改 P 与分类器 φ，冻结主干 fₑ、fᵣ 的参数保持原值。</p>
      </aside>
      <div className="p4-gradient-equation">
        <div className="p4-equation-item">
          <span className="p4-equation-label">分类目标</span>
          <math display="block"><msub><mi>ℒ</mi><mi>cls</mi></msub><mo>=</mo><mi>CE</mi><mo>(</mo><msub><mi>g</mi><mi>φ</mi></msub><mo>(</mo><mi>h</mi><mo>(</mo><mi>P</mi><mo>,</mo><mi>x</mi><mo>)</mo><mo>)</mo><mo>,</mo><mi>y</mi><mo>)</mo></math>
        </div>
        <div className="p4-equation-item p4-gradient-condition">
          <span className="p4-equation-label">对 Prompt 的梯度</span>
          <math display="block"><msub><mo>∇</mo><mi>P</mi></msub><msub><mi>ℒ</mi><mi>cls</mi></msub><mo>≠</mo><mn>0</mn></math>
          <small>一般情形</small>
        </div>
      </div>
      <p>这不是在 P4 重新讲一次 Attention。P3 已说明输入 Token 会参与计算；这里沿用该结论，只追踪梯度落到哪里、哪些参数改变。</p>
    </section>

    <section className="explain-section">
      <h3>但所有任务若继续改同一个 Prompt，仍可能相互干扰</h3>
      <p>任务 A 学到的 Prompt 可以继续服务后续输入。若任务 B 接着更新这同一组参数，<span className="reading-emphasis reading-emphasis--caution">原先适用的方向可能改变</span>。因此“冻结 ViT”本身并没有回答怎样减少不同任务对少量可训练参数的争用；这里描述的是可能性，不是保证发生的遗忘结果。</p>
      <figure className={`lesson-figure p4-shared-prompt ${activePhase === 6 ? "is-current-task" : ""}`}>
        <div className="figure-top"><strong>同一组参数跨任务继续使用</strong><span>对象身份保持为同一个 P</span></div>
        <div className="figure-body">
          <div className="p4-task-sequence">
            <div><strong>任务 A</strong><span>分类损失更新 P</span></div><Arrow />
            <div className="p4-shared-parameter"><strong>同一组 Prompt P</strong><math className="p4-parameter-transition" display="block"><msup><mi>P</mi><mrow><mo>(</mo><mi>A</mi><mo>)</mo></mrow></msup><mo>→</mo><msup><mi>P</mi><mrow><mi>A</mi><mo>→</mo><mi>B</mi></mrow></msup></math></div><Arrow />
            <div><strong>任务 B</strong><span>可再次写入这组参数</span></div>
          </div>
          <p className="p4-conflict-note">任务 B 的输入与梯度不在本示例里模拟；这里只标明同一参数对象会继续被使用。</p>
        </div>
      </figure>
    </section>

    <p className="lesson-takeaway">如果一个 Prompt 仍会被多个任务共同修改，能否保存多个 Prompt，再让当前图像自己选出需要的一部分？</p>
  </>;
}
