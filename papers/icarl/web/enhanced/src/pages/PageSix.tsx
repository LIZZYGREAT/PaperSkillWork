import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { GuidedStepControls, type GuidedStep } from "../components/GuidedStepControls";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";
import { ALL_CLASS_IDS, CLASS_VISUALS, INCOMING_CLASS_IDS, OLD_CLASS_IDS, P_BEFORE, type ClassId, type Sample } from "../data/icarl-runtime";
import { binaryCrossEntropy, buildTargets, classLabel, studentOutputFor, teacherSnapshotFor, type SixOutputs } from "../data/incremental-training";

type PhaseId = "input" | "targets" | "bce" | "aggregate" | "backprop";
type PlaybackStatus = "idle" | "playing" | "paused" | "complete";

const phases: readonly (GuidedStep & { id: PhaseId; guidance: string })[] = [
  { id: "input", short: "样本进入", title: "同一张图经过共享表示", guidance: "增量训练把旧 exemplar replay 与新类数据放进同一训练集。输入沿共享特征映射 φΘ 进入输出头；六个输出节点始终留在同一位置。" },
  { id: "targets", short: "构造 Target", title: "旧输出沿用 Q，新输出读取标签", guidance: "旧节点的目标来自这张样本在更新前保存的 Q 行；新节点读取真实类别。旧图没有 D/E/F 标签，新图在其它新类节点上仍为 0。" },
  { id: "bce", short: "计算 BCE", title: "每个 sigmoid 节点独立比较 r 与 g", guidance: "以当前选中节点为例，BCE 衡量目标 r 和模型输出 g 的差异。曲线展示损失如何随 g 改变；滑杆只探索这个局部算例，不改写模型演示输出。" },
  { id: "aggregate", short: "汇总损失", title: "六节点损失相加形成样本损失", guidance: "对每个样本，把六个独立节点的 BCE 相加得到 ℓᵢ；再对训练样本聚合。节点之间没有 softmax 竞争，也不要求输出和为 1。" },
  { id: "backprop", short: "反向传播", title: "损失梯度回到共享参数 Θ", guidance: "梯度由输出头向共享表示传播，优化器据此更新 Θ。页面用连续的反向信号展示方向；这里的合成数值是教学动画，不是实际训练轨迹。" },
];

const oldSample = P_BEFORE.B[0];
const sampleChoices: readonly { sample: Sample; label: string }[] = [
  { sample: oldSample, label: "旧类 · C2" },
  { sample: { id: "x_20", classId: "D", raw: [-1.862, -1.598] }, label: "新类 · C4" },
  { sample: { id: "x_28", classId: "E", raw: [0.291, -1.646] }, label: "新类 · C5" },
  { sample: { id: "x_34", classId: "F", raw: [1.715, -1.107] }, label: "新类 · C6" },
];
const DEFAULT_SAMPLE = sampleChoices[2].sample;
const PHASE_DURATION_MS = 1650;

function accent(classId: ClassId): CSSProperties {
  return { "--class-accent": CLASS_VISUALS[classId].color } as CSSProperties;
}

function activeNodeIndex(sample: Sample): number {
  if (sample.classId === "B") return 1;
  return ALL_CLASS_IDS.indexOf(sample.classId);
}

function targetType(sample: Sample, classId: ClassId): "soft" | "one" | "zero" {
  if (OLD_CLASS_IDS.includes(classId as (typeof OLD_CLASS_IDS)[number])) return "soft";
  return sample.classId === classId ? "one" : "zero";
}

function NetworkCanvas({ sample, targets, outputs, phase, phaseProgress, localOutput }: {
  sample: Sample;
  targets: SixOutputs;
  outputs: SixOutputs;
  phase: PhaseId;
  phaseProgress: number;
  localOutput: number;
}) {
  const focusIndex = activeNodeIndex(sample);
  const sampleIsOld = OLD_CLASS_IDS.includes(sample.classId as (typeof OLD_CLASS_IDS)[number]);
  const inputProgress = phase === "input" ? phaseProgress : phase === "targets" || phase === "bce" || phase === "aggregate" || phase === "backprop" ? 1 : 0;
  const targetProgress = phase === "targets" ? phaseProgress : phase === "bce" || phase === "aggregate" || phase === "backprop" ? 1 : 0;
  const bceProgress = phase === "bce" ? phaseProgress : phase === "aggregate" || phase === "backprop" ? 1 : 0;
  const aggregateProgress = phase === "aggregate" ? phaseProgress : phase === "backprop" ? 1 : 0;
  const backpropProgress = phase === "backprop" ? phaseProgress : 0;
  const targetsReady = phase !== "input";
  const aggregateReady = phase === "aggregate" || phase === "backprop";

  return <section className="p6-network-board" aria-label="持续显示的六节点训练计算图" data-phase={phase} data-progress={phaseProgress.toFixed(2)}>
    <div className="p6-network-board__topline"><div><span className="eyebrow">ONE PERSISTENT TRAINING GRAPH</span><h3>一条样本路径 · 六个独立输出节点</h3></div><span className="p6-network-board__sample" style={accent(sample.classId)}><i>{CLASS_VISUALS[sample.classId].glyph}</i>{sample.id} · {classLabel(sample.classId)}</span></div>
    <div className="p6-network-scroll" role="region" aria-label="样本、共享表示、六个输出节点、目标与损失的连接图" tabIndex={0}>
      <div className="p6-network-layout">
        <div className={`p6-input-object ${inputProgress > 0 ? "is-active" : ""} ${inputProgress >= 1 ? "is-arrived" : ""}`} id="training-input-object" style={{ "--motion-progress": inputProgress } as CSSProperties}>
          <span className="p6-graph-kicker">INPUT xᵢ</span><b>{CLASS_VISUALS[sample.classId].glyph}</b><strong>{sample.id}</strong><small>{sampleIsOld ? "P 中 replay exemplar" : "Xnew 中新类样本"}</small>
          <i className="p6-input-object__flight" aria-hidden="true">●</i>
        </div>
        <div className={`p6-feature-object ${inputProgress >= .35 ? "is-active" : ""}`} id="shared-feature-object"><span className="p6-graph-kicker">SHARED FEATURE</span><b>φ<sub>Θ</sub></b><small>同一表示网络</small><i className="p6-feature-object__pulse" aria-hidden="true" /></div>
        <svg className="p6-edge-layer" viewBox="0 0 1000 410" preserveAspectRatio="none" aria-hidden="true">
          <path d="M190 205 C250 205 250 205 320 205" className={`p6-edge p6-edge--input ${inputProgress >= .2 ? "is-flowing" : ""}`} style={{ "--motion-progress": inputProgress } as CSSProperties} />
          {ALL_CLASS_IDS.map((classId, index) => {
            const y = 54 + index * 60;
            return <g key={classId}>
              <path id={`edge-feature-${classId}`} d={`M500 205 C570 205 570 ${y} 640 ${y}`} className={`p6-edge p6-edge--node p6-edge--${targetType(sample, classId)} ${index === focusIndex ? "is-focused" : ""} ${inputProgress >= .7 ? "is-flowing" : ""}`} style={{ "--motion-progress": Math.max(inputProgress, targetProgress) } as CSSProperties} />
              <path id={`edge-target-${classId}`} d={`M820 ${y} C880 ${y} 870 ${y} 925 ${y}`} className={`p6-edge p6-edge--target ${targetProgress > .4 ? "is-flowing" : ""}`} style={{ "--motion-progress": targetProgress } as CSSProperties} />
            </g>;
          })}
        </svg>
        <section className="p6-node-column" aria-label="Student 输出、目标和损失；节点位置跨步骤固定">
          {ALL_CLASS_IDS.map((classId, index) => {
            const kind = targetType(sample, classId);
            const focused = index === focusIndex;
            const bce = binaryCrossEntropy(targets[index], outputs[index]);
            const shownOutput = focused && phase === "bce" ? localOutput : outputs[index];
            return <div className={`p6-node-row p6-node-row--${kind} ${focused ? "is-focused" : ""} ${targetProgress >= 1 ? "has-target" : ""} ${bceProgress >= .65 && focused ? "has-bce" : ""}`} key={classId} style={accent(classId)}>
              <div className="p6-node-row__node" id={`output-node-${classId}`} data-node-id={`g${index + 1}`}>
                <span className="p6-node-row__glyph">{CLASS_VISUALS[classId].glyph}</span>
                <span><b>{CLASS_VISUALS[classId].outputNodeLabel}</b><small>{CLASS_VISUALS[classId].displayLabel}</small></span>
              </div>
              <div className={`p6-node-row__output ${phase === "input" && inputProgress > .5 ? "is-revealed" : phase !== "input" ? "is-revealed" : ""}`} id={`output-value-${classId}`} aria-label={`${CLASS_VISUALS[classId].outputNodeLabel} sigmoid 输出 ${shownOutput.toFixed(3)}`}><small>g</small><b>{shownOutput.toFixed(3)}</b></div>
              <div className={`p6-node-row__target ${targetProgress > .08 ? "is-revealed" : ""}`} id={`target-value-${classId}`} aria-label={`${CLASS_VISUALS[classId].outputNodeLabel} target ${targets[index].toFixed(3)}`}><small>r</small><b>{targetProgress > .08 ? targets[index].toFixed(3) : "—"}</b></div>
              <div className={`p6-node-row__loss ${bceProgress > .35 ? "is-revealed" : ""}`} id={`loss-value-${classId}`} aria-label={`${CLASS_VISUALS[classId].outputNodeLabel} BCE ${bce.toFixed(3)}`}><small>ℓ</small><b>{bceProgress > .35 ? bce.toFixed(3) : "—"}</b></div>
            </div>;
          })}
        </section>
        <div className={`p6-target-caption ${targetProgress > .2 ? "is-visible" : ""}`}><b>rᵢ</b><span>Target</span><small>Q old + label new</small></div>
        <div className={`p6-loss-caption ${aggregateProgress > .25 ? "is-visible" : ""}`} id="loss-aggregation-object"><b>Σ</b><span>ℓᵢ</span><small>six BCE terms</small><strong>{aggregateProgress > .35 ? ALL_CLASS_IDS.reduce((sum, _, index) => sum + binaryCrossEntropy(targets[index], outputs[index]), 0).toFixed(3) : "···"}</strong></div>
        <div className={`p6-gradient-object ${backpropProgress > 0 ? "is-active" : ""}`} id="gradient-flow-object" style={{ "--motion-progress": backpropProgress } as CSSProperties}>
          <span className="p6-graph-kicker">BACKPROPAGATION</span><b>∂L / ∂Θ</b><small>loss gradient → shared φ<sub>Θ</sub></small><i aria-hidden="true">↶</i>
        </div>
      </div>
    </div>
    <div className="p6-network-key"><span><i className="p6-key-dot p6-key-dot--old" />旧节点：Q soft target</span><span><i className="p6-key-dot p6-key-dot--new" />新节点：label hard target</span><span><i className="p6-key-dot p6-key-dot--flow" />动画只显示对象间传递</span></div>
  </section>;
}

function LossCurve({ target, output }: { target: number; output: number }) {
  const width = 320;
  const height = 148;
  const padX = 28;
  const padY = 16;
  const maxLoss = Math.max(3.2, binaryCrossEntropy(target, 0.05), binaryCrossEntropy(target, 0.95));
  const points = Array.from({ length: 81 }, (_, index) => {
    const value = 0.01 + index * 0.01225;
    const loss = binaryCrossEntropy(target, value);
    return [padX + value * (width - 2 * padX), height - padY - (loss / maxLoss) * (height - 2 * padY)] as const;
  });
  const path = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const pointX = padX + output * (width - 2 * padX);
  const pointY = height - padY - (binaryCrossEntropy(target, output) / maxLoss) * (height - 2 * padY);
  return <svg className="p6-loss-curve" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Target r 为 ${target.toFixed(2)} 时的二元交叉熵曲线；当前局部输出 g 为 ${output.toFixed(2)}`}>
    <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} />
    <line x1={padX} y1={padY} x2={padX} y2={height - padY} />
    <path d={path} />
    <line className="p6-loss-curve__guide" x1={pointX} y1={pointY} x2={pointX} y2={height - padY} />
    <circle cx={pointX} cy={pointY} r="5" />
    <text x={padX} y={height - 2}>0</text><text x={width - padX - 8} y={height - 2}>1</text>
    <text x={width - padX - 4} y={height - padY - 6}>g</text><text x="4" y={padY + 2}>ℓ</text>
  </svg>;
}

function Formula({ children, label }: { children: ReactNode; label: string }) {
  return <div className="p6-math" role="math" aria-label={label}>{children}</div>;
}

export function PageSix({ onContinue }: { onContinue?: () => void }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [sampleId, setSampleId] = useState(DEFAULT_SAMPLE.id);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const progressRef = useRef(0);
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [animationRevision, setAnimationRevision] = useState(0);
  const [localOutput, setLocalOutput] = useState(.72);
  const reducedMotion = useReducedMotion();
  const sample = sampleChoices.find((choice) => choice.sample.id === sampleId)?.sample ?? DEFAULT_SAMPLE;
  const targets = useMemo(() => buildTargets(sample), [sample]);
  const outputs = useMemo(() => studentOutputFor(sample), [sample]);
  const phase = phases[phaseIndex];
  const focusIndex = activeNodeIndex(sample);
  const target = targets[focusIndex];
  const localLoss = binaryCrossEntropy(target, localOutput);
  const modelLoss = ALL_CLASS_IDS.reduce((sum, _, index) => sum + binaryCrossEntropy(targets[index], outputs[index]), 0);
  const targetsReady = phaseIndex >= 1;
  const aggregateReady = phaseIndex >= 3;
  const aggregateVisible = phaseIndex >= 3;

  useEffect(() => {
    if (status !== "playing") return;
    if (reducedMotion) {
      progressRef.current = 1;
      setPhaseProgress(1);
      setStatus("complete");
      return;
    }
    const start = performance.now() - progressRef.current * PHASE_DURATION_MS;
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(1, (now - start) / PHASE_DURATION_MS);
      progressRef.current = next;
      setPhaseProgress(next);
      if (next >= 1) {
        setStatus("complete");
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [animationRevision, phaseIndex, reducedMotion, status]);

  function changePhase(next: number) {
    const bounded = Math.max(0, Math.min(phases.length - 1, next));
    setPhaseIndex(bounded);
    progressRef.current = 0;
    setPhaseProgress(0);
    setStatus("playing");
  }

  function playPause() {
    if (status === "playing") setStatus("paused");
    else {
      if (status === "complete") {
        progressRef.current = 0;
        setPhaseProgress(0);
      }
      setStatus("playing");
    }
  }

  function replay() {
    progressRef.current = 0;
    setPhaseProgress(0);
    setAnimationRevision((revision) => revision + 1);
    setStatus("playing");
  }

  function chooseSample(next: Sample) {
    setSampleId(next.id);
    setStatus("paused");
    progressRef.current = 0;
    setPhaseProgress(0);
    setLocalOutput(.72);
  }

  return <article className="tutorial-page icarl-page icarl-page--p6" data-phase={phase.id} data-sample={sample.id}>
    <header className="page-heading icarl-page__heading p6-heading">
      <div className="icarl-page__eyebrow"><span>PAGE 06</span><i /> INCREMENTAL TRAINING · CONTINUOUS VIEW</div>
      <h1>旧知识与新类别怎样一起更新网络？</h1>
      <p>保持一条计算图不变，观察同一张样本怎样穿过六个独立输出节点，再把损失信号送回共享表示。</p>
    </header>

    <section className="p6-workbench" aria-label="连续增量训练交互工作台">
      <div className="p6-workbench__guide">
        <div><span className="eyebrow">PHASE {String(phaseIndex + 1).padStart(2, "0")} / 05</span><h2>{phase.title}</h2><p aria-live="polite">{phase.guidance}</p></div>
        <span className={`p6-workbench__status p6-workbench__status--${status}`}>{status === "playing" ? "动画运行中" : status === "complete" ? "本段完成" : status === "paused" ? "已暂停" : "可逐步查看"}</span>
      </div>

      <details className="p6-phase-rail"><summary>五段引导 · 当前 {phaseIndex + 1}/5</summary><GuidedStepControls steps={phases} current={phaseIndex} onChange={changePhase} label="Page 6 连续增量训练阶段" /></details>

      <div className="p6-sample-chooser"><span>先选一张样本 · Q 与目标同步换行</span><div role="group" aria-label="选择旧类或新类训练样本">
        {sampleChoices.map(({ sample: choice, label }) => <button key={choice.id} type="button" className={sample.id === choice.id ? "is-selected" : ""} aria-pressed={sample.id === choice.id} style={accent(choice.classId)} onClick={() => chooseSample(choice)}><i>{CLASS_VISUALS[choice.classId].glyph}</i>{label}<small>{choice.id}</small></button>)}
      </div></div>

      <NetworkCanvas sample={sample} targets={targets} outputs={outputs} phase={phase.id} phaseProgress={phaseProgress} localOutput={localOutput} />

      <div className="p6-explain-grid">
        <section className="p6-target-panel" aria-label="所选样本真实的六维 Target">
          <header><span className="eyebrow">TARGET VECTOR Rᵢ</span><b>{sample.id} · {classLabel(sample.classId)}</b></header>
          <div className="p6-target-vector">{ALL_CLASS_IDS.map((classId, index) => <div key={classId} style={accent(classId)} className={OLD_CLASS_IDS.includes(classId as (typeof OLD_CLASS_IDS)[number]) ? "is-soft" : targets[index] === 1 ? "is-positive" : "is-negative"}>
            <small>{CLASS_VISUALS[classId].outputNodeLabel}</small><b>{targetsReady ? targets[index].toFixed(3) : "·"}</b><span>{targetsReady ? OLD_CLASS_IDS.includes(classId as (typeof OLD_CLASS_IDS)[number]) ? "Q" : targets[index] === 1 ? "label=1" : "label=0" : "待生成"}</span>
          </div>)}</div>
          <p>这个向量与选择样本的身份绑定。换图会同时读取对应的 Q 行和真实类别标签。</p>
          <details className="p6-vector-details"><summary>显示 Q 与 R 的数值校验</summary><div><span>Q = ({teacherSnapshotFor(sample).map((value) => value.toFixed(3)).join(", ")})</span><span>R = ({targets.map((value) => value.toFixed(3)).join(", ")})</span></div></details>
        </section>

        <section className="p6-bce-panel" aria-label="二元交叉熵局部算例">
          <header><span className="eyebrow">ONE NODE · BCE</span><b>{CLASS_VISUALS[ALL_CLASS_IDS[focusIndex]].outputNodeLabel} · r={target.toFixed(3)}</b></header>
          <Formula label="二元交叉熵：负的 r 乘 log g 加一减 r 乘 log 一减 g">ℓ = −[r log g + (1 − r) log (1 − g)]</Formula>
          <div className="p6-bce-values"><span>局部算例输出 <b>g={localOutput.toFixed(2)}</b></span><strong>ℓ={localLoss.toFixed(3)}</strong></div>
          <LossCurve target={target} output={localOutput} />
          <label className="p6-bce-slider">只探索当前节点的 g
            <input type="range" min="0.05" max="0.95" step="0.01" value={localOutput} aria-label="BCE 局部算例 sigmoid 输出 g" aria-valuetext={`g ${localOutput.toFixed(2)}，损失 ${localLoss.toFixed(3)}`} onChange={(event) => setLocalOutput(Number(event.currentTarget.value))} />
            <span><i>0</i><i>1</i></span>
          </label>
          <small className="p6-isolation-note">局部滑杆不改写上方模型输出，也不改写六项汇总损失。</small>
          <details className="p6-derivative-details"><summary>展开导数与旧 / 新目标解释</summary>
            <Formula label="BCE 对 logit a 的导数等于 g 减 r">∂ℓ / ∂a = g − r</Formula>
            <p>因为 <b>g=σ(a)</b>。旧类节点令 r=q<sub>j</sub>，其中 q<sub>j</sub> 是更新前冻结的教师响应；新类节点令 r=y<sub>j</sub>，来自样本真实标签。两者都进入同一 BCE。</p>
          </details>
        </section>

        <section className="p6-loss-panel" aria-label="六节点样本损失汇总">
          <header><span className="eyebrow">PER-SAMPLE OBJECTIVE</span><b>六项 BCE → ℓᵢ</b></header>
          <div className="p6-loss-sum">{ALL_CLASS_IDS.map((classId, index) => <span key={classId} style={accent(classId)}>{CLASS_VISUALS[classId].outputNodeLabel}<small>{aggregateReady ? binaryCrossEntropy(targets[index], outputs[index]).toFixed(2) : "—"}</small></span>)}</div>
          <Formula label="样本损失等于 j 从 1 到 6 的二元交叉熵之和">ℓᵢ = ∑<sub>j=1</sub><sup>6</sup> ℓ<sub>BCE</sub>(rᵢⱼ, gᵢⱼ)</Formula>
          <div className="p6-loss-total"><span>当前样本总损失</span><b>{aggregateVisible ? modelLoss.toFixed(3) : "等待聚合"}</b></div>
          <p>这些合成输出只供公式核对；滑杆探索值独立显示，不进入此总和。</p>
        </section>

        <section className="p6-gradient-panel" aria-label="反向传播含义">
          <header><span className="eyebrow">GRADIENT FLOW</span><b>局部误差改变共享表示</b></header>
          <div className={`p6-gradient-steps ${phase.id === "backprop" ? "is-running" : ""}`}>
            <span><b>六个输出</b><small>g₁ … g₆</small></span><i aria-hidden="true">←</i><span><b>损失 L</b><small>样本与 batch 聚合</small></span><i aria-hidden="true">←</i><span><b>共享 Θ</b><small>由优化器更新</small></span>
          </div>
          <Formula label="对数几率 a 的局部梯度是输出 g 减目标 r">δ = g − r　　Θ ← Θ − η ∂L / ∂Θ</Formula>
          <p>页面按语义阶段推进同一条路径。该箭头说明梯度方向，不代表这里运行了真实优化器或重新训练了模型。</p>
        </section>
      </div>

      <footer className="p6-controls" aria-label="连续训练动画控制">
        <button type="button" className="icarl-button icarl-button--quiet" onClick={() => changePhase(phaseIndex - 1)} disabled={phaseIndex === 0}>上一步</button>
        <div><button type="button" className="icarl-button icarl-button--quiet" onClick={playPause} aria-label={status === "playing" ? "暂停当前动画" : "继续当前动画"}>{status === "playing" ? "Ⅱ 暂停" : "▶ 继续"}</button><button type="button" className="icarl-button icarl-button--quiet" onClick={replay}>↺ 重播本段</button><span>{reducedMotion ? "已启用减少动态效果" : status === "complete" ? "本段完成" : `${Math.round(phaseProgress * 100)}%`}</span></div>
        {phaseIndex < phases.length - 1
          ? <button type="button" className="icarl-button icarl-button--primary" onClick={() => changePhase(phaseIndex + 1)}>下一段 <b aria-hidden="true">→</b></button>
          : <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue} disabled={!onContinue}>进入第 7 页 · 训练与预测 <b aria-hidden="true">→</b></button>}
      </footer>
    </section>
  </article>;
}
