import { useState, type ReactNode } from "react";
import { GuidedStepControls, type GuidedStep } from "../components/GuidedStepControls";

const steps: readonly GuidedStep[] = [
  { title: "先按输出节点的年龄分组", short: "旧节点 / 新节点" },
  { title: "新类图像同时面对两类目标", short: "新图像" },
  { title: "旧 exemplar 也经过全部节点", short: "旧 exemplar" },
  { title: "把 D 的目标读成一张矩阵", short: "目标矩阵" },
  { title: "同一个 sigmoid + BCE 接收两类目标", short: "单节点 BCE" },
  { title: "汇总旧节点与新节点损失", short: "总损失" },
  { title: "两类损失共同更新共享表示", short: "反向传播" },
];

type TargetKind = "soft" | "one" | "zero";
const SOFT_EXAMPLE_TARGET = 0.72;

function TargetPill({ kind, children }: { kind: TargetKind; children: ReactNode }) {
  return <span className={`p7-target-pill p7-target-pill--${kind}`}>{children}</span>;
}

function OutputNodes({ old = ["A", "B", "C"], fresh = ["D"] }: { old?: string[]; fresh?: string[] }) {
  return <div className="p7-node-groups" aria-label="旧类与新类输出节点">
    <section className="p7-node-group p7-node-group--old" data-canonical-id="old_output_nodes">
      <div><b>旧类输出节点</b><span>保留更新前的响应</span></div>
      <div className="p7-node-group__nodes">{old.map((name) => <span key={name}>g<sub>{name}</sub></span>)}</div>
    </section>
    <section className="p7-node-group p7-node-group--new" data-canonical-id="new_output_nodes">
      <div><b>新类输出节点</b><span>学习新到类别的指示目标</span></div>
      <div className="p7-node-group__nodes">{fresh.map((name) => <span key={name}>g<sub>{name}</sub></span>)}</div>
    </section>
  </div>;
}

function TargetRow({ oldSample, active = false }: { oldSample?: boolean; active?: boolean }) {
  const classes = ["p7-target-row", oldSample ? "p7-target-row--old" : "p7-target-row--new", active ? "is-active" : ""];
  return <div className={classes.join(" ")} role="row">
    <span className="p7-target-row__sample" role="rowheader">
      <b>{oldSample ? "P_A" : "D-01"}</b>
      <small>{oldSample ? "保留的 exemplar · 真实类别 A" : "新到图像 · 真实类别 D"}</small>
    </span>
    {(["A", "B", "C"] as const).map((node) => <span className="p7-target-cell p7-target-cell--soft" role="cell" key={node}>
      <small>g<sub>{node}</sub></small><TargetPill kind="soft">q<sub>i</sub><sup>{node}</sup></TargetPill>
    </span>)}
    <span className="p7-target-cell p7-target-cell--hard" role="cell">
      <small>g<sub>D</sub></small><TargetPill kind={oldSample ? "zero" : "one"}>{oldSample ? "hard 0" : "hard 1"}</TargetPill>
    </span>
  </div>;
}

function TargetMatrix({ compact = false }: { compact?: boolean }) {
  return <div className={`p7-target-matrix${compact ? " p7-target-matrix--compact" : ""}`} role="table" aria-label="训练样本与输出节点目标矩阵" data-canonical-id="target_matrix">
    <div className="p7-target-row p7-target-row--head" role="row">
      <span role="columnheader">训练集 D 中的样本</span>
      <span className="p7-target-band p7-target-band--old" role="columnheader" aria-label="旧节点 A、B、C">旧节点 <small>A · B · C</small></span>
      <span className="p7-target-band p7-target-band--new" role="columnheader" aria-label="新节点 D">新节点 <small>D</small></span>
    </div>
    <TargetRow />
    <TargetRow oldSample active={compact} />
  </div>;
}

function ResponseAxis({ target, current }: { target: number; current: number }) {
  const targetKind: TargetKind = target === 1 ? "one" : target === 0 ? "zero" : "soft";
  return <div className="p7-response-axis" aria-label="target 与当前 sigmoid 响应的相对位置">
    <div className="p7-response-axis__ends"><span>0</span><span>独立 sigmoid 输出</span><span>1</span></div>
    <div className="p7-response-axis__rail">
      <span className={`p7-response-axis__target p7-response-axis__target--${targetKind}`} style={{ left: `${target * 100}%` }} aria-label="target position"><i /></span>
      <span className="p7-response-axis__current" style={{ left: `${current * 100}%` }} aria-label="当前响应位置"><i /><b>当前 g</b></span>
    </div>
    <div className="p7-response-axis__legend"><span><i className={`p7-marker p7-marker--${targetKind}`} /> 目标 r</span><span><i className="p7-marker p7-marker--current" /> 当前 g</span></div>
  </div>;
}

function TargetSample({ oldSample }: { oldSample?: boolean }) {
  return <div className={`p7-sample-card${oldSample ? " p7-sample-card--old" : " p7-sample-card--new"}`}>
    <span className="p7-sample-card__image" aria-hidden="true">{oldSample ? "P" : "X"}</span>
    <div><span className="eyebrow">{oldSample ? "来自 exemplar 记忆" : "来自新到数据"}</span><b>{oldSample ? "旧 exemplar P_A" : "新图像 D-01"}</b><small>{oldSample ? "保留的原始图像之一" : "真实类别：D"}</small></div>
  </div>;
}

export function PageSeven({ onContinue }: { onContinue?: () => void }) {
  const [stage, setStage] = useState(0);
  const [targetKind, setTargetKind] = useState<TargetKind>("soft");
  const [current, setCurrent] = useState(0.42);
  const [showCalculation, setShowCalculation] = useState(false);
  const [showObjective, setShowObjective] = useState(false);
  const target = targetKind === "one" ? 1 : targetKind === "zero" ? 0 : SOFT_EXAMPLE_TARGET;
  const safeCurrent = Math.min(0.999, Math.max(0.001, current));
  const bce = -(target * Math.log(safeCurrent) + (1 - target) * Math.log(1 - safeCurrent));
  const gradient = safeCurrent - target;

  return <article className="tutorial-page icarl-page icarl-page--p7">
    <header className="page-heading icarl-page__heading">
      <div className="icarl-page__eyebrow"><span>PAGE 07</span><i /> 蒸馏与损失</div>
      <h1>每张图像都在旧节点与新节点上学习</h1>
      <p>从第 6 页准备好的训练集 D 与响应快照 Q 出发：旧输出节点保留更新前的响应，新输出节点学习当前标签，随后共同更新表示。</p>
    </header>

    <GuidedStepControls steps={steps} current={stage} onChange={setStage} label="Page 7 目标分配与损失教学步骤" />

    {stage === 0 ? <section className="p7-node-overview panel" aria-label="按输出节点区分训练责任">
      <div className="panel-heading"><div><span className="eyebrow">同一训练集 · D</span><h2>先按节点所属阶段分组</h2></div><span className="p7-mini-badge">target 由节点新旧决定</span></div>
      <div className="p7-origin-flow"><div><b>D</b><span>旧 exemplars + 新到图像</span></div><i aria-hidden="true">→</i><div className="p7-shared-network"><b>当前共享网络</b><span>共享特征提取器 φ<sub>Θ</sub></span></div><i aria-hidden="true">→</i><div className="p7-output-box"><span>sigmoid 输出</span><OutputNodes /></div></div>
      <div className="p7-node-principle"><span>关键判断</span><b>Hard / soft 由输出节点的新旧决定，与输入图像是旧样本还是新样本无关。</b></div>
      <p className="p7-evidence-note"><b>承接第 6 页</b> · D 中每个样本都进入当前网络；Q 保存它在所有旧节点上的更新前响应。</p>
    </section> : null}

    {stage === 1 ? <section className="p7-sample-target panel" aria-label="新类图像上的 soft 与 hard targets">
      <div className="panel-heading"><div><span className="eyebrow">新类图像 · yᵢ = D</span><h2>同一张新图像具有两组 target</h2></div><span className="p7-mini-badge p7-mini-badge--new">D-01</span></div>
      <div className="p7-sample-target__layout"><TargetSample />
        <div className="p7-target-strip">
          <section><b className="p7-target-strip__heading">旧节点 · 保持响应</b><div>{["A", "B", "C"].map((node) => <div className="p7-strip-node" key={node}><span>g<sub>{node}</sub></span><TargetPill kind="soft">q<sub>i</sub><sup>{node}</sup></TargetPill></div>)}</div><p>从训练前的 Q 读取各旧节点的响应。</p></section>
          <section><b className="p7-target-strip__heading">新节点 · 学习类别</b><div className="p7-strip-node"><span>g<sub>D</sub></span><TargetPill kind="one">hard 1</TargetPill></div><p>样本真实类别是 D，因此 D 节点的 target 为 1。</p></section>
        </div>
      </div>
      <div className="p7-callout"><b>Soft target ≠ 模糊 ground truth</b><span>qᵢʸ 是训练前模型对这张输入在旧类别节点上的连续 response。不同旧节点的 q 值彼此独立，不要求加总为 1。</span></div>
    </section> : null}

    {stage === 2 ? <section className="p7-sample-target panel" aria-label="旧 exemplar 在所有输出节点上的 targets">
      <div className="panel-heading"><div><span className="eyebrow">OLD EXEMPLAR · yᵢ = A</span><h2>旧图像也经过新节点</h2></div><span className="p7-mini-badge p7-mini-badge--old">P_A</span></div>
      <div className="p7-sample-target__layout"><TargetSample oldSample />
        <div className="p7-target-strip">
          <section><b className="p7-target-strip__heading">旧节点 · 保持响应</b><div>{["A", "B", "C"].map((node) => <div className="p7-strip-node" key={node}><span>g<sub>{node}</sub></span><TargetPill kind="soft">q<sub>i</sub><sup>{node}</sup></TargetPill></div>)}</div><p>仍使用 Q 中这张 exemplar 对应的旧节点响应。</p></section>
          <section><b className="p7-target-strip__heading">新节点 · 学习类别</b><div className="p7-strip-node"><span>g<sub>D</sub></span><TargetPill kind="zero">hard 0</TargetPill></div><p>类别 A 不等于新类别 D，因此新节点 target 为 0。</p></section>
        </div>
      </div>
      <div className="p7-node-principle"><span>为什么两种目标都需要？</span><b>Exemplars 提供真实旧类输入；distillation 指定旧输出节点在这些输入上应保留的响应。</b></div>
    </section> : null}

    {stage === 3 ? <section className="p7-matrix-workbench panel" aria-label="D 中样本与输出节点目标矩阵">
      <div className="panel-heading"><div><span className="eyebrow">样本 × 输出节点目标</span><h2>目标按列区分，每个样本都覆盖所有节点</h2></div><span className="p7-mini-badge">所有行 → 所有节点</span></div>
      <TargetMatrix />
      <div className="p7-matrix-foot"><span><i className="p7-marker p7-marker--soft" /> 旧节点 target 来自 Q</span><span><i className="p7-marker p7-marker--one" /> 新类真实标签</span><span><i className="p7-marker p7-marker--zero" /> 其他新类</span></div>
      <p className="p7-evidence-note">示意中的 A/B/C/D 只标出节点类别；表内不伪造论文未报告的 q 数值。输入属于新类或 exemplar，都有旧节点 soft targets。</p>
    </section> : null}

    {stage === 4 ? <section className="p7-bce-workbench panel" aria-label="交互式单节点二元交叉熵示意">
      <div className="panel-heading"><div><span className="eyebrow">单个 sigmoid 节点 · 单个 BCE</span><h2>hard 与 soft target 共用同一损失</h2></div><span className="p7-mini-badge">单节点查看器</span></div>
      <div className="p7-bce-layout">
        <section className="p7-bce-select"><div className="p7-target-choice" role="group" aria-label="选择单节点 target 类型">
          <button type="button" className={targetKind === "soft" ? "is-selected" : ""} aria-pressed={targetKind === "soft"} onClick={() => setTargetKind("soft")}>旧节点 · soft q</button>
          <button type="button" className={targetKind === "one" ? "is-selected" : ""} aria-pressed={targetKind === "one"} onClick={() => setTargetKind("one")}>新节点 · hard 1</button>
          <button type="button" className={targetKind === "zero" ? "is-selected" : ""} aria-pressed={targetKind === "zero"} onClick={() => setTargetKind("zero")}>新节点 · hard 0</button>
        </div>
          <ResponseAxis target={target} current={current} />
          <label className="p7-slider"><span>调整示意中的当前响应 <b>g = {showCalculation ? current.toFixed(2) : "···"}</b></span><input type="range" min="0.05" max="0.95" step="0.01" value={current} onChange={(event) => setCurrent(Number(event.target.value))} aria-label="调整示意中的当前 sigmoid 响应" /><span className="p7-slider__ends"><i>趋近 0</i><i>趋近 1</i></span></label>
          <p className="p7-teaching-label">教学计算 · 滑块数值仅用于演示，并非论文报告的训练输出。</p>
        </section>
        <section className="p7-bce-formula"><span className="eyebrow">相同的 binary cross-entropy</span><div className="p7-equation">ℓ(r,g) = −[r log g + (1 − r) log(1 − g)]</div><p><b>hard</b> r ∈ {'{0, 1}'} &nbsp;·&nbsp; <b>soft</b> r = q ∈ [0, 1]</p>
          <button type="button" className="icarl-button icarl-button--quiet" aria-expanded={showCalculation} onClick={() => setShowCalculation((value) => !value)}>{showCalculation ? "收起计算" : "查看计算"}</button>
          {showCalculation ? <dl className="p7-calculation" aria-live="polite"><div><dt>目标 r</dt><dd>{target.toFixed(2)}{targetKind === "soft" ? " · 教学示例 q" : " · hard target"}</dd></div><div><dt>当前 g</dt><dd>{current.toFixed(2)} · sigmoid 输出</dd></div><div><dt>BCE ℓ(r,g)</dt><dd>{bce.toFixed(3)} · 根据显示的 r、g 计算</dd></div><div><dt>∂ℓ / ∂a = g − r</dt><dd>{gradient >= 0 ? "+" : ""}{gradient.toFixed(2)} · logit a</dd></div></dl> : null}
        </section>
      </div>
      <details className="p7-gradient-note"><summary>sigmoid + BCE 如何影响 logit 更新？</summary><p>令 sigmoid 前的 logit 为 a，则 ∂ℓ/∂a = g − r。若 g 高于目标，梯度下降会倾向于降低该响应；若 g 低于目标，则会倾向于提高它。</p></details>
    </section> : null}

    {stage === 5 ? <section className="p7-loss-aggregation panel" aria-label="旧节点与新节点损失共同求和">
      <div className="panel-heading"><div><span className="eyebrow">汇总各节点损失</span><h2>保持旧响应与监督新类别共同进入同一目标函数</h2></div><span className="p7-mini-badge">不额外添加 loss weight</span></div>
      <div className="p7-loss-flow"><section className="p7-loss-branch p7-loss-branch--old"><span>旧类输出节点</span><b>L<sub>old</sub></b><small>Q 中的 soft target ↔ 当前 g<sub>A</sub>, g<sub>B</sub>, g<sub>C</sub></small></section><span className="p7-loss-plus" aria-hidden="true">+</span><section className="p7-loss-branch p7-loss-branch--new"><span>新类输出节点</span><b>L<sub>new</sub></b><small>真实标签 hard target ↔ 当前 g<sub>D</sub></small></section><i aria-hidden="true">→</i><section className="p7-loss-total"><span>总损失</span><b>L(Θ) = L<sub>old</sub> + L<sub>new</sub></b></section></div>
      <button type="button" className="icarl-button icarl-button--quiet" aria-expanded={showObjective} onClick={() => setShowObjective((value) => !value)}>{showObjective ? "收起完整目标函数" : "展开完整目标函数"}</button>
      {showObjective ? <div className="p7-objective" data-canonical-id="total_loss"><p><b>L<sub>old</sub></b> = − ∑<sub>(xᵢ,yᵢ)∈D</sub> ∑<sub>y∈old</sub> [qᵢʸ log gʸ(xᵢ) + (1−qᵢʸ) log(1−gʸ(xᵢ))]</p><p><b>L<sub>new</sub></b> = − ∑<sub>(xᵢ,yᵢ)∈D</sub> ∑<sub>y∈new</sub> [1[y=yᵢ] log gʸ(xᵢ) + 1[y≠yᵢ] log(1−gʸ(xᵢ))]</p><p><b>L(Θ) = L<sub>old</sub> + L<sub>new</sub></b></p><small>同一 BCE 项覆盖全部训练样本与对应节点；目标来源随节点类别而变。</small></div> : null}
      <div className="p7-loss-note">论文算法将这两组 BCE 项直接相加；页面没有添加 λ 或可调 loss weight 控件。</div>
    </section> : null}

    {stage === 6 ? <section className="p7-backprop panel" aria-label="两类节点损失反向传播至共享网络">
      <div className="panel-heading"><div><span className="eyebrow">更新共享表示</span><h2>输出节点分工不同，底层表示由两者共同更新</h2></div><span className="p7-mini-badge">反向传播</span></div>
      <div className="p7-backprop-network">
        <section className="p7-network-input"><b>D</b><span>旧 exemplars<br />+ 新到图像</span></section><i aria-hidden="true">→</i>
        <section className="p7-network-feature" data-canonical-id="feature_extractor"><b>φ<sub>Θ</sub></b><span>共享特征提取器</span><small>Θ 同时受两项损失更新</small></section><i aria-hidden="true">→</i>
        <section className="p7-network-head"><span>Training Head · sigmoid 节点</span><OutputNodes /></section><i aria-hidden="true">→</i>
        <section className="p7-network-losses"><b>L<sub>old</sub></b><b>+</b><b>L<sub>new</sub></b><span>合为总损失</span></section>
      </div>
      <div className="p7-shared-branch"><i aria-hidden="true" /><span>两组梯度都经过各自输出节点，回传至共享特征提取器。</span></div>
      <div className="p7-complement"><div><span>Q + DISTILLATION</span><b>告诉旧节点应保留怎样的响应。</b></div><i aria-hidden="true">+</i><div><span>D 中的旧 exemplars</span><b>提供真实旧类图像，让这项约束作用于具体输入。</b></div></div>
      <p className="p7-handoff">Training Head 完成 targets → loss → gradient → 表示更新。训练结束后，最终预测走哪条路径？</p>
      <button type="button" className="icarl-button icarl-button--primary p7-continue" onClick={onContinue} disabled={!onContinue}>继续到第 8 页 · Train ≠ Predict <span aria-hidden="true">→</span></button>
    </section> : null}
  </article>;
}
