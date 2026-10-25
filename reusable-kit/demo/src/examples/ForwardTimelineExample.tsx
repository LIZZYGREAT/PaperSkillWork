import { useId } from "react";
import { useAnimationTimeline } from "../../../foundation/animation/useAnimationTimeline";

const stages = [
  { id: "sample", title: "输入样本", note: "固定样本 x₁ 进入网络。后续所有表示、得分和响应都属于这一个样本。", symbol: "x₁", durationMs: 900, holdMs: 400 },
  { id: "extractor", title: "共享特征提取器", note: "同一个 x₁ 依次经过共享的卷积特征块与聚合；φΘ 表示这整个特征提取过程。矩形堆叠仅示意处理路径。", symbol: "φΘ(x₁)", durationMs: 1400, holdMs: 500 },
  { id: "representation", title: "特征表示", note: "得到表示 z，送往每一个类别权重。这里用三维向量演示接口，并非论文的真实特征维数。", symbol: "z", durationMs: 1000, holdMs: 400 },
  { id: "scores", title: "逐类得分", note: "每组类别权重与同一个 z 做内积，得到原始得分 gj(x₁)。得分可以为负，也不要求加和为 1。", symbol: "gⱼ(x₁)", durationMs: 1200, holdMs: 500 },
  { id: "responses", title: "Sigmoid 响应", note: "对每个得分分别应用 sigmoid，得到逐类训练响应。各类独立变换，响应之和不要求为 1。", symbol: "σ(gⱼ(x₁))", durationMs: 1200, holdMs: 600 },
];
const features = [1, 0.5, -1];
const weights = [[1, 0, -1], [0, 0, 0], [0, 0, 1]];
const scores = weights.map(row => row.reduce((sum, weight, i) => sum + weight * features[i], 0));
const responses = scores.map(score => 1 / (1 + Math.exp(-score)));
const vectorLabel = (values: number[], decimals?: number) => `[${values.map(n => decimals === undefined ? String(n) : n.toFixed(decimals)).join(", ")}]`;

function StageFormula({ index }: { index: number }) {
  const x = <msub><mi>x</mi><mn>1</mn></msub>;
  const phi = <msub><mi>φ</mi><mi>Θ</mi></msub>;
  const g = <mrow><msub><mi>g</mi><mi>j</mi></msub><mo>(</mo>{x}<mo>)</mo></mrow>;
  return <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label={stages[index].symbol}>
    {index === 0 ? x : index === 1 ? <mrow>{phi}<mo>(</mo>{x}<mo>)</mo></mrow>
      : index === 2 ? <mrow><mi>z</mi><mo>=</mo>{phi}<mo>(</mo>{x}<mo>)</mo></mrow>
      : index === 3 ? <mrow>{g}<mo>=</mo><msubsup><mi>w</mi><mi>j</mi><mi>T</mi></msubsup><mi>z</mi></mrow>
      : <mrow><mi>σ</mi><mo>(</mo>{g}<mo>)</mo><mo>=</mo><mfrac><mn>1</mn><mrow><mn>1</mn><mo>+</mo><msup><mi>e</mi><mrow><mo>−</mo>{g}</mrow></msup></mrow></mfrac></mrow>}
  </math>;
}

function InputImage() {
  const pixels = [0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
  return <div className="pg-input-image" aria-hidden="true">{pixels.map((value, i) => <i key={i} data-ink={value === 1} />)}</div>;
}

function FeatureBlocks({ tracedBlock }: { tracedBlock: number }) {
  return <div className="pg-extractor-drawing">
    <svg viewBox="0 0 290 150" role="img" aria-label="卷积特征块经过深层表示与聚合，得到一个向量；层数为教学示意">
      <g className={tracedBlock === 0 ? "is-tracing" : ""}>
        {[0, 1, 2, 3].map(i => <g key={i}><rect x={12 + i * 8} y={24 + i * 7} width="55" height="76" rx="5" /><path d={`M${23 + i * 8} ${47 + i * 7}h30m-30 16h30m-30 16h30`} /></g>)}
        <rect className="pg-feature-patch" x="50" y="52" width="16" height="18" rx="2" />
      </g>
      <path className="pg-extractor-flow" d="M96 77h24m-5-4 5 4-5 4" />
      <g className={tracedBlock === 1 ? "is-tracing" : ""}>
        {[0, 1, 2].map(i => <rect key={i} x={126 + i * 7} y={39 + i * 6} width="36" height="54" rx="4" />)}
      </g>
      <path className="pg-extractor-flow" d="M181 77h24m-5-4 5 4-5 4" />
      <g className={tracedBlock === 2 ? "is-tracing" : ""}>
        <rect x="213" y="44" width="64" height="61" rx="7" />
        {[18, 33, 25, 43, 31].map((height, i) => <rect className="pg-pool-bar" key={i} x={223 + i * 10} y={94 - height} width="4" height={height} rx="1" />)}
      </g>
    </svg>
    <div className="pg-extractor-labels"><span>卷积特征块</span><span>深层表示</span><span>聚合</span></div>
  </div>;
}

export function ForwardTimelineExample() {
  const responseId = useId();
  const { state, controls } = useAnimationTimeline({ clips: stages, autoPlay: false });
  const index = state.clipIndex;
  const stage = stages[index];
  const tracedBlock = index === 1 ? Math.min(2, Math.floor(state.progress * 3)) : -1;
  const tracedClass = index >= 3 ? Math.min(2, Math.floor(state.progress * 3)) : -1;
  const objectState = (i: number) => i === index ? "active" : i < index ? "done" : "waiting";
  const stageSource = (i: number) => i === 0 ? "固定输入 · 同一张图像" : `来自 ${stages[i - 1].title}`;
  const heading = (i: number) => <div className="pg-stage-heading"><span>{String(i + 1).padStart(2, "0")}</span><strong>{stages[i].title}</strong><small>{i < index ? "已完成" : i === index ? "当前阶段" : "预览"}</small></div>;
  // One snapshot drives the stage, object emphasis, traced sub-object, narrative and outputs.
  return <article className="pg-forward" data-timeline-example="forward" data-stage={state.clipId} data-progress={state.progress.toFixed(3)} data-status={state.status} data-holding={state.isHolding} data-sample="x1">
    <header><div><span>同一样本 · 共享模型</span><h3>看见一张图像，怎样变成逐类响应</h3><p>图像 x₁ → 特征提取器 → 表示 z → 逐类得分 → Sigmoid 响应</p></div><small className="pg-teaching-badge">教学示意 · 非论文实测</small></header>
    <nav className="pg-forward-nav" aria-label="前向计算阶段" data-stage={state.clipId}>
      {stages.map((item, i) => <button type="button" key={item.id} data-stage-target={item.id} aria-current={i === index ? "step" : undefined} onClick={() => controls.goToClip(i)}><span>{String(i + 1).padStart(2, "0")}</span>{item.title}</button>)}
    </nav>
    <div className="pg-forward-controls" aria-label="前向计算播放控制" data-stage={state.clipId}>
      <button type="button" onClick={controls.stepBack} disabled={!state.hasPrevious}>上一阶段</button>
      <span role="status">阶段 {index + 1} / 5 · {state.status === "playing" ? "播放中" : state.atEnd ? "已完成" : "已暂停"} · {Math.round(state.progress * 100)}%{state.isHolding ? " · 停留观察" : ""}</span>
      <button type="button" className="pg-play-control" onClick={controls.toggle} disabled={state.atEnd}>{state.status === "playing" ? "暂停" : state.atEnd ? "已完成" : "播放 / 继续"}</button>
      <button type="button" onClick={controls.stepForward} disabled={!state.hasNext}>下一阶段</button>
      <button type="button" className="pg-replay-control" onClick={controls.replayClip}>重播当前阶段</button>
    </div>
    <div className="pg-forward-track" aria-hidden="true"><i style={{ width: `${(index + state.progress) * 20}%` }} /></div>
    <ol className="pg-forward-system" aria-label="固定样本 x₁ 的完整前向路径" data-stage={state.clipId}>
      <li data-object="sample" data-input-from="sample-x1" data-state={objectState(0)}>
        {heading(0)}<div className="pg-forward-object pg-forward-object--input"><InputImage /><b>x₁</b><p>同一张输入图像</p></div><small className="pg-forward-system__source">{stageSource(0)}</small>
      </li>
      <li data-object="extractor" data-input-from="sample" data-state={objectState(1)}>
        {heading(1)}<div className="pg-forward-object pg-forward-object--extractor"><div className="pg-extractor-heading"><span>共享特征提取器</span><b>φ<sub>Θ</sub></b></div><FeatureBlocks tracedBlock={tracedBlock} /><p>同一组共享参数 Θ</p></div><small className="pg-forward-system__source">{stageSource(1)}</small>
      </li>
      <li data-object="representation" data-input-from="extractor" data-state={objectState(2)}>
        {heading(2)}<div className="pg-forward-object pg-forward-object--representation"><div className="pg-feature-vector" aria-label={`演示特征向量 ${vectorLabel(features)}`}>
          {features.map((value, i) => <div key={i} className="pg-vector-coordinate"><span className="pg-vector-positive">{value > 0 && <i style={{ height: `${value * 48}px` }} />}</span><span className="pg-vector-negative">{value < 0 && <i style={{ height: `${Math.abs(value) * 48}px` }} />}</span><small>{value}</small></div>)}
        </div><b>z = φ<sub>Θ</sub>(x₁)</b><p>同一个 z 送往每类权重</p></div><small className="pg-forward-system__source">{stageSource(2)}</small>
      </li>
      <li data-object="scores" data-input-from="representation" data-state={objectState(3)}>
        {heading(3)}<div className="pg-forward-object pg-forward-object--scores"><span className="pg-output-eyebrow">一个训练输出头</span><div className="pg-class-scores">
          {scores.map((score, j) => <div key={j} className="pg-head-score" data-class={j + 1} data-traced={index === 3 && tracedClass === j}><span className="pg-class-weight">w<sub>{j + 1}</sub></span><span>g<sub>{j + 1}</sub>(x₁)</span><strong>{score}</strong></div>)}
        </div><p>g<sub>j</sub>(x₁) = w<sub>j</sub><sup>T</sup>z</p></div><small className="pg-forward-system__source">{stageSource(3)}</small>
      </li>
      <li data-object="responses" data-input-from="scores" data-state={objectState(4)}>
        {heading(4)}<div className="pg-forward-object pg-forward-object--responses"><span className="pg-output-eyebrow">逐类独立响应</span><div className="pg-class-responses">
          {responses.map((response, j) => <div key={j} className="pg-head-response" data-class={j + 1} data-traced={index === 4 && tracedClass === j}><span className="pg-sigmoid-mark">σ</span><span className="pg-response-value"><label htmlFor={`${responseId}-${j}`}>C{j + 1}</label><meter id={`${responseId}-${j}`} min="0" max="1" value={response} /><strong>{response.toFixed(3)}</strong></span></div>)}
        </div><p>各类独立变换，不要求和为 1</p></div><small className="pg-forward-system__source">{stageSource(4)}</small>
      </li>
    </ol>
    <div className="pg-forward-detail" data-stage={state.clipId}>
      <div className="pg-forward-note" data-stage={state.clipId} aria-live="polite"><span>正在看 / 阶段 {String(index + 1).padStart(2, "0")}</span><h4>{stage.title}</h4><p>{stage.note}</p></div>
      <div className="pg-forward-output" data-stage={state.clipId} data-symbol={stage.symbol}>
        <StageFormula index={index} />
        <p>{index === 0 ? "后续的表示、得分和响应，都属于 x₁" : index === 1 ? "卷积特征块 → 深层表示 → 聚合" : index === 2 ? `演示表示 z = ${vectorLabel(features)}` : index === 3 ? `Wz = ${vectorLabel(scores)}` : `σ(Wz) = ${vectorLabel(responses, 3)}`}</p>
      </div>
    </div>
    <div className="pg-forward-footer"><p className="pg-forward-boundary">训练输出 ≠ 最终预测：iCaRL 最终使用 nearest-mean 分类。这里展示逐类 sigmoid，而非 Softmax；进度表示讲解展开，不是计算耗时。</p><details className="pg-forward-values"><summary>查看演示向量与权重</summary><p>固定 z = {vectorLabel(features)}；W = [{weights.map(row => vectorLabel(row)).join(", ")}]。概览保留目标值，减少动态效果时可逐阶段查看完整结果。</p></details></div>
  </article>;
}
