import { Fragment, useMemo, useState } from "react";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";

import { PARAMETER_STATES, datasetLikelihood, negativeLogLikelihood, type ParameterState } from "../data/probabilityExample";
import { MathFormula } from "../shared/teaching/Math";

const CLASS_NAMES = ["class A", "class B", "class C"];
const SAMPLE_NAMES = ["(x₁, y₁=A)", "(x₂, y₂=B)", "(x₃, y₃=C)"];
const INPUT_PATTERN = [1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1];
const INPUT_NODES = [25, 61, 97];
const HIDDEN_NODES = [17, 39, 61, 83, 105];
const OUTPUT_NODES = [25, 61, 97];

function formatProbability(value: number) {
  return value.toFixed(2);
}

function ParameterStateNotation({ candidate }: { candidate: ParameterState["candidate"] }) {
  return <>θ<sup>({{ A: 1, B: 2, C: 3 }[candidate]})</sup></>;
}

function InputSample() {
  return (
    <div className="p02-input-sample" role="img" aria-label="用于演示的输入样本 x 一，右侧标签 y 一为 class A">
      <div className="p02-input-sample__pixels" aria-hidden="true">{INPUT_PATTERN.map((pixel, index) => <i className={pixel ? "is-on" : ""} key={index} />)}</div>
      <div className="p02-input-sample__label"><b>x₁</b><span>true label <strong>A</strong></span></div>
      <small>输入示意 · 教学示例</small>
    </div>
  );
}

function ForwardNetwork() {
  return (
    <svg className="p02-network" viewBox="0 0 250 122" role="img" aria-labelledby="p02-network-title p02-network-description">
      <title id="p02-network-title">前向计算的神经网络</title>
      <desc id="p02-network-description">输入经过多个相连的网络层，输出由当前参数 theta 决定。</desc>
      <g className="p02-network__wires" aria-hidden="true">
        {INPUT_NODES.flatMap((inputY, inputIndex) => HIDDEN_NODES.map((hiddenY, hiddenIndex) => <line key={`ih-${inputIndex}-${hiddenIndex}`} x1="24" y1={inputY} x2="123" y2={hiddenY} />))}
        {HIDDEN_NODES.flatMap((hiddenY, hiddenIndex) => OUTPUT_NODES.map((outputY, outputIndex) => <line key={`ho-${hiddenIndex}-${outputIndex}`} x1="127" y1={hiddenY} x2="226" y2={outputY} />))}
      </g>
      <g className="p02-network__nodes p02-network__nodes--input" aria-hidden="true">{INPUT_NODES.map((y) => <circle key={`i-${y}`} cx="22" cy={y} r="7" />)}</g>
      <g className="p02-network__nodes p02-network__nodes--hidden" aria-hidden="true">{HIDDEN_NODES.map((y) => <circle key={`h-${y}`} cx="125" cy={y} r="7" />)}</g>
      <g className="p02-network__nodes p02-network__nodes--output" aria-hidden="true">{OUTPUT_NODES.map((y) => <circle key={`o-${y}`} cx="228" cy={y} r="7" />)}</g>
      <text className="p02-network__label" x="22" y="119" textAnchor="middle">input</text>
      <text className="p02-network__label" x="125" y="119" textAnchor="middle">hidden</text>
      <text className="p02-network__label" x="228" y="119" textAnchor="middle">output</text>
    </svg>
  );
}

function LogitValues({ values }: { values: ParameterState["logits"] }) {
  return (
    <div className="p02-logit-list" aria-label="神经网络输出的 logits">
      {values.map((value, index) => (
        <div className="p02-logit-row" key={CLASS_NAMES[index]}>
          <span>{CLASS_NAMES[index]}</span>
          <div className="p02-logit-row__bar"><i style={{ width: `${Math.max(4, Math.min(100, ((value + 4) / 4) * 100))}%` }} /></div>
          <b>{value.toFixed(2)}</b>
        </div>
      ))}
      <div className="p02-logit-axis"><span>−4</span><span>logit z</span><span>0</span></div>
    </div>
  );
}

function ProbabilityValues({ values }: { values: ParameterState["probabilities"] }) {
  return (
    <div className="p02-probability-list" aria-label="Softmax 后的类别概率">
      {values.map((value, index) => (
        <div className={`p02-probability-row ${index === 0 ? "is-observed" : ""}`} key={CLASS_NAMES[index]}>
          <span>{CLASS_NAMES[index]}{index === 0 ? " · y₁" : ""}</span>
          <div className="p02-probability-row__bar"><i style={{ width: `${value * 100}%` }} /></div>
          <b>{formatProbability(value)}</b>
        </div>
      ))}
      <small>合计 1.00 · 真实标签是 class A</small>
    </div>
  );
}

function ParameterComparison({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const maximumLikelihood = Math.max(...PARAMETER_STATES.map(datasetLikelihood));
  return (
    <div className="p02-state-comparison" role="group" aria-label="固定数据集，切换参数状态比较似然与损失">
      {PARAMETER_STATES.map((state, index) => {
        const likelihood = datasetLikelihood(state);
        const loss = negativeLogLikelihood(state);
        const selected = selectedId === state.id;
        return (
          <button className={`p02-state-row ${selected ? "is-selected" : ""}`} type="button" key={state.id} aria-pressed={selected} onClick={() => onSelect(state.id)}>
            <span className="p02-state-row__model"><i>{String(index + 1).padStart(2, "0")}</i><b><ParameterStateNotation candidate={state.candidate} /></b><small>{selected ? `当前候选参数状态 · 配置 ${state.index}` : `完整模型候选配置 · 配置 ${state.index}`}</small></span>
            <span className="p02-state-row__samples" aria-label={`逐样本真实类别概率 ${state.datasetProbabilities.map(formatProbability).join(", ")}`}>
              {state.datasetProbabilities.map((probability, sampleIndex) => <span className="p02-probability-chip" key={`${state.id}-${sampleIndex}`}>{formatProbability(probability)}</span>)}
            </span>
            <span className="p02-state-row__score"><small>p(D | <ParameterStateNotation candidate={state.candidate} />)</small><b>{likelihood.toFixed(4)}</b><i><em style={{ width: `${(likelihood / maximumLikelihood) * 100}%` }} /></i></span>
            <span className="p02-state-row__loss"><small>NLL</small><b>{loss.toFixed(2)}</b></span>
          </button>
        );
      })}
    </div>
  );
}

export function PageProbability() {
  const [selectedId, setSelectedId] = useState("theta-b");
  const [showSoftmax, setShowSoftmax] = useState(false);
  const api = useReferenceApi();
  const selected = PARAMETER_STATES.find((state) => state.id === selectedId) ?? PARAMETER_STATES[1];
  const likelihood = useMemo(() => datasetLikelihood(selected), [selected]);
  const datasetNll = useMemo(() => negativeLogLikelihood(selected), [selected]);
  const sampleNll = -Math.log(selected.probabilities[0]);

  return (
    <article className="ewc-page p02-page" aria-labelledby="p02-title">
      <header className="ewc-page-header p02-header">
        <div className="ewc-page-header__kicker"><span>02</span> ORDINARY TRAINING · PROBABILITY TO LOSS</div>
        <h1 id="p02-title">从神经网络的输出，走到数据的 Likelihood 与训练 Loss。</h1>
        <p className="ewc-page-header__dek">给定已观察输入 x 和当前参数，网络先预测标签的条件概率 p<sub>θ</sub>(y|x)；再组合每个样本真实标签的条件概率，得到数据 Likelihood。取负对数后，便回到熟悉的训练损失。</p>
      </header>

      <section className="p02-forward" id="forward-probability" aria-labelledby="p02-forward-title">
        <div className="p02-section-heading"><div><span className="p02-overline">01 · ONE INPUT THROUGH THE NETWORK</span><h2 id="p02-forward-title">概率不是额外加上的输出：它来自当前网络的前向计算</h2></div><span className="p02-example-badge">教学示例 · 非论文实测</span></div>

        <div className="p02-forward-path" aria-label="输入经过神经网络，得到 logits 和类别概率">
          <div className="p02-flow-node p02-flow-node--input">
            <span className="p02-node-label">INPUT</span><InputSample />
          </div>
          <span className="p02-flow-arrow" aria-hidden="true">⟶</span>
          <div className="p02-flow-node p02-flow-node--network">
            <span className="p02-node-label">CURRENT MODEL</span><div className="p02-model-state"><ReferenceTrigger id="neural_network">Neural Network f<sub>θ</sub></ReferenceTrigger><b>当前候选参数状态 <ParameterStateNotation candidate={selected.candidate} /></b></div><ForwardNetwork />
          </div>
          <span className="p02-flow-arrow" aria-hidden="true">⟶</span>
          <div className="p02-flow-node p02-flow-node--logits">
            <span className="p02-node-label">RAW OUTPUT</span><h3>logits z</h3><LogitValues values={selected.logits} />
          </div>
          <span className="p02-flow-arrow" aria-hidden="true">⟶</span>
          <div className="p02-flow-node p02-flow-node--probability">
            <span className="p02-node-label">SOFTMAX</span><h3><ReferenceTrigger id="p_theta_y_given_x">p<sub>θ</sub>(y | x)</ReferenceTrigger></h3><ProbabilityValues values={selected.probabilities} />
          </div>
        </div>

        <div className="p02-forward-caption">
          <div className="p02-forward-caption__formula" aria-label="输入 x 一，经过网络得到 logits z，再经 Softmax 得到预测概率">
            <span>x₁</span><b aria-hidden="true">→</b><span>z = f<sub>θ</sub>(x₁)</span><b aria-hidden="true">→</b><span>Softmax(z)</span><b aria-hidden="true">→</b><strong>p<sub>θ</sub>(y | x₁)</strong>
          </div>
          <p className="p02-forward-caption__note"><b>真实标签概率</b>取 class A 这一项。它越高，模型给正确答案的置信度越高；本例单样本 Loss 为 <code>−ln {formatProbability(selected.probabilities[0])} = {sampleNll.toFixed(2)}</code>。</p>
        </div>

        <details className="p02-softmax-detail" open={showSoftmax} onToggle={(event) => setShowSoftmax(event.currentTarget.open)}>
          <summary aria-expanded={showSoftmax}>Softmax 怎样把 logits 变成概率？</summary>
          <div className="p02-softmax-detail__body"><MathFormula tex={String.raw`p_\theta(y=c\mid x)=\frac{e^{z_c}}{\sum_j e^{z_j}}`} /><p>它把各类别分数转换成总和为 1 的分布。主路径只需记住：网络先算 logits，Softmax 再给出类别概率。</p></div>
        </details>
      </section>

      <section className="p02-likelihood" id="likelihood-origin" aria-labelledby="p02-likelihood-title">
        <div className="p02-section-heading"><div><span className="p02-overline">02 · EXPAND FROM ONE SAMPLE TO DATASET D</span><h2 id="p02-likelihood-title">固定同一份数据 D，比较不同参数 θ 的解释能力</h2></div><span className="p02-fixed-data"><i /> D FIXED · θ CHANGES</span></div>

        <div className="p02-dataset-definition"><span className="p02-dataset-symbol">D</span><div><b>同一份训练数据</b><span>每个样本都保留其输入和真实标签；切换 θ 时，x 和 y 不变。</span></div><div className="p02-dataset-samples" aria-label="固定的三个训练样本">
          {SAMPLE_NAMES.map((name, index) => <span key={name}><i>{index + 1}</i><b>{name}</b></span>)}
        </div></div>

        <div className="p02-likelihood-equation">
          <div className="p02-likelihood-formula" role="math" aria-label="数据 D 在参数 theta 下的 likelihood 等于各样本真实标签概率的乘积">
            <MathFormula tex={String.raw`p(D\mid\theta)=\prod_{n=1}^{N}p_\theta(y_n\mid x_n)`} />
          </div>
          <div className="p02-sample-product" aria-live="polite" aria-label={`当前参数状态下的数据 likelihood：${selected.datasetProbabilities.map(formatProbability).join(" 乘 ")} 等于 ${likelihood.toFixed(4)}`}>
            {selected.datasetProbabilities.map((probability, index) => <Fragment key={`product-${index}`}><span className="p02-product-term"><small>样本 {index + 1}</small><b>{formatProbability(probability)}</b></span>{index < selected.datasetProbabilities.length - 1 ? <span className="p02-product-operator" aria-hidden="true">×</span> : null}</Fragment>)}
            <b className="p02-product-equals" aria-hidden="true">=</b>
            <span className="p02-product-result"><small>p(D | <ParameterStateNotation candidate={selected.candidate} />)</small><b>{likelihood.toFixed(4)}</b></span>
          </div>
          <small className="p02-assumption">D = ［(xₙ, yₙ)］；将输入作为条件，假设给定 θ 与输入后，各标签条件独立。p(D | θ) 简记条件标签似然，不建模输入生成。</small>
        </div>

        <div className="p02-perspective-compare" id="likelihood-comparison" aria-label="Probability 与 Likelihood 的观察视角对比">
          <div className="p02-perspective-compare__item p02-perspective-compare__item--probability"><span>PROBABILITY · 固定 θ 和已观察输入 x</span><p>看给定输入 x 时，模型为不同标签 y 预测的条件概率：<b>看哪些标签可能对应这个输入。</b></p></div>
          <div className="p02-perspective-compare__item p02-perspective-compare__item--likelihood"><span><ReferenceTrigger id="likelihood">LIKELIHOOD · 固定已观察的 (xₙ, yₙ)</ReferenceTrigger></span><p>把已观察输入和标签保持不变，改变 θ，比较哪组参数给这些标签更高的条件似然：<b>看不同参数如何解释同一批已观察标签。</b>它是关于 θ 的函数，不是 θ 的概率分布。</p></div>
        </div>

        <details className="p02-softmax-detail">
          <summary>核对当前配置的三条 Forward 输出与真实标签概率</summary>
          <div className="p02-origin-table__scroll"><table>
            <thead><tr><th>固定样本 / 标签</th><th>logits（A, B, C）</th><th>Softmax（A, B, C）</th><th>取真实标签项</th></tr></thead>
            <tbody>{selected.sampleLogits.map((row, n) => <tr key={n}><th>{SAMPLE_NAMES[n]}</th><td>{row.map(v => v.toFixed(2)).join(", ")}</td><td>{selected.sampleProbabilities[n].map(v => v.toFixed(4)).join(", ")}</td><td>{selected.datasetProbabilities[n].toFixed(4)}</td></tr>)}</tbody>
          </table></div>
        </details>
        <div className="p02-comparison-heading"><div><span className="p02-overline">PARAMETER SWITCH · SAME DATA · DIFFERENT PREDICTIONS</span><h3>选一组参数，看三条样本概率怎样共同改变 Likelihood</h3></div><span>点击一行查看该配置的预设 Forward 输出</span></div>
        <div className="p02-state-row-head" aria-hidden="true"><span>候选参数状态</span><span><i>x₁</i><i>x₂</i><i>x₃</i><b>每个样本真实标签的概率</b></span><span>数据 Likelihood</span><span>负对数损失</span></div>
        <ParameterComparison selectedId={selectedId} onSelect={setSelectedId} />
        <p className="p02-boundary-note">教学示例，非论文实测。每一行是完整参数配置 θ⁽¹⁾ / θ⁽²⁾ / θ⁽³⁾，θᵢ 才是单个坐标。网络图只示意结构，本例预设每个配置的三条 Forward logits；概率由 Softmax 计算。显示值舍入，Likelihood 与 NLL 使用未舍入值。P3 直接复用这份 D 和这三组 Likelihood。</p>
      </section>

      <section className="p02-loss-update" id="loss-and-update" aria-labelledby="p02-loss-title">
        <div className="p02-section-heading"><div><span className="p02-overline">03 · FROM LIKELIHOOD TO PARAMETER UPDATE</span><h2 id="p02-loss-title">最大化 Likelihood，等价于最小化负对数损失</h2></div><p>负号把“概率越大越好”改写成“Loss 越小越好”；对数把样本概率的乘积改写为求和。</p></div>
        <div className="p02-nll-explanation" aria-label="负对数似然的定义和作用">
          <span>NEGATIVE LOG-LIKELIHOOD · NLL</span>
          <MathFormula block tex={String.raw`L_{\mathrm{NLL}}(\theta)=-\log p(D\mid\theta)=-\sum_{n=1}^{N}\log p_\theta(y_n\mid x_n)`} />
          <p>对每个真实标签的预测概率取 log 再取负；概率越高，NLL 越小。这样就能把乘积形式的 Likelihood 写成可相加、可最小化的训练损失。</p>
        </div>
        <div className="p02-training-chain" aria-label="Likelihood 变成 Loss，计算梯度后更新参数">
          <div className="p02-training-node"><span>DATA FIT</span><strong>log p(D | θ)</strong><small>越大越好</small></div><span className="p02-training-arrow" aria-hidden="true">→</span>
          <div className="p02-training-node p02-training-node--loss"><span>CHANGE SIGN</span><strong>−log p(D | θ)</strong><small>Negative Log-Likelihood</small></div><span className="p02-training-arrow" aria-hidden="true">→</span>
          <div className="p02-training-node p02-training-node--loss"><span>CLASSIFICATION LOSS</span><strong>L(θ)</strong><small>真实类别交叉熵的求和（常按 batch 求平均）</small></div><span className="p02-training-arrow" aria-hidden="true">→</span>
          <div className="p02-gradient-node"><span>BACKWARD</span><strong>∇<sub>θ</sub>L</strong><div aria-hidden="true"><i /><i /><i /><i /></div><small>loss 对参数的梯度</small></div><span className="p02-training-arrow" aria-hidden="true">→</span>
          <div className="p02-update-node"><span>OPTIMIZER STEP</span><strong>θ ← θ − η∇<sub>θ</sub>L</strong><small>参数状态改变</small></div>
        </div>
        <div className="p02-update-return"><span className="p02-update-return__line" aria-hidden="true"/><p>更新后的 <em>θ</em> 返回同一个模型；下一批样本再经过新的前向计算。</p><ReferenceTrigger id="optimizer_step">反向计算梯度与 optimizer.step() 是两个不同动作</ReferenceTrigger></div>
        <div className="p02-dataset-loss" aria-live="polite" aria-label={`当前候选参数状态 theta [${selected.candidate}]；条件数据 likelihood ${likelihood.toFixed(4)}；总 NLL ${datasetNll.toFixed(2)}`}>
          <span className="p02-dataset-loss__metric"><small>当前候选参数状态</small><b><ParameterStateNotation candidate={selected.candidate} /></b></span>
          <span className="p02-dataset-loss__metric"><small>p(D | θ)</small><b>{likelihood.toFixed(4)}</b></span>
          <span className="p02-dataset-loss__metric"><small>总 NLL</small><b>{datasetNll.toFixed(2)}</b></span>
          <span className="p02-dataset-loss__interpretation">Likelihood 越高，NLL 越低</span>
        </div>
      </section>

      <section className="p02-origin-table" id="probability-source-table" aria-labelledby="p02-origin-title">
        <div className="p02-section-heading"><div><span className="p02-overline">WHAT HAS A SOURCE NOW?</span><h2 id="p02-origin-title">哪些概率已经从网络训练中得到解释？</h2></div></div>
        <div className="p02-origin-table__scroll"><table>
          <thead><tr><th>概率对象</th><th>本页状态</th><th>来源 / 下一步</th></tr></thead>
          <tbody>
            <tr><th><ReferenceTrigger id="p_theta_y_given_x">p<sub>θ</sub>(y | x)</ReferenceTrigger></th><td><span className="p02-status p02-status--done">已解释</span></td><td>当前网络前向计算，再经 Softmax 得到。</td></tr>
            <tr><th><ReferenceTrigger id="p_D_given_theta">p(D | θ)</ReferenceTrigger></th><td><span className="p02-status p02-status--done">已解释</span></td><td>把输入 xₙ 视为已观察条件，组合每个真实标签 yₙ 的条件概率 pθ(yₙ | xₙ)。</td></tr>
            <tr><th><ReferenceTrigger id="p_theta">p(θ)</ReferenceTrigger></th><td><span className="p02-status p02-status--next">留到下一页</span></td><td>不是 Forward 算出的输出；接下来要问，怎样给参数本身建立概率视角？</td></tr>
            <tr><th><ReferenceTrigger id="p_theta_given_D">p(θ | D)</ReferenceTrigger></th><td><span className="p02-status p02-status--next">留到下一页</span></td><td>本页还没有解释；它需要把参数视角和数据 Likelihood 接在一起。</td></tr>
          </tbody>
        </table></div>
      </section>

      <section className="p02-handoff" aria-label="通往下一页的问题">
        <div><span className="p02-overline">NEXT · BAYESIAN PARAMETER VIEW</span><h2>有了拟合分数，怎样保留旧任务对参数的支持？</h2><p>Likelihood 评价指定 θ 对同一份 D 的解释力，却没有在参数空间归一化，也没有表达已有参数知识。下一页用 <ReferenceTrigger id="prior">Prior</ReferenceTrigger> 与 Bayes Rule 把这些分数变成 Posterior，让旧任务信息参与后续更新。</p></div>
        <div className="p02-handoff__question"><span>OPEN QUESTION</span><b>p(θ) = ?</b><small>not a network output</small></div>
      </section>

      <div className="p02-review-exit"><span>W8 IMPLEMENTATION · PAGES 01–03</span><button type="button" onClick={() => api.navigatePage("page-03-bayes")}>下一页：参数的 Prior 与 Posterior →</button></div>
    </article>
  );
}

