# useAnimationTimeline · P1 candidate

A single clock for related views. Call the Hook once in the owner; derive navigation, object emphasis, narrative, formula/output and controls from its `state`. Clips have only `id`, `durationMs`, optional `holdMs`; teaching data belongs to the caller. Keep clip arrays stable (module constant or memoized). Never add a second timeout/RAF or per-view active stage.

## API

Inputs: `clips`, `autoPlay` (default false), optional `reducedMotion`, injectable `clock` (`request` / `cancel`) and bounded `initialState`. Outputs: `clipId`, `clipIndex`, `clip`, `elapsedMs`, `progress`, `status`, `isHolding`, `atStart/atEnd`, `hasPrevious/hasNext`, `totalClips`, `errors`. Controls: `play`, `pause`, `toggle`, `stepBack`, `stepForward`, `replayClip`, `goToClip(index, {autoPlay?})` (jump defaults to paused). Replay starts the current clip; no implicit whole-sequence reset. A nonfinite index falls back to the first clip.

`progress` reaches 1 at duration end; `isHolding` covers the following hold interval. Pausing retains elapsed time, replay resets it. Empty/invalid clips have explicit inert states. Runtime replacement preserves matching clip identity and bounds time; removed clips fall back to the first. Unmount cancels the scheduled frame. Reduced motion renders complete semantic stages, keeps manual navigation, and never starts continuous playback (`toggle` advances a stage).

## Runnable synchronized scene

Exact source from Gallery `demo/src/examples/ForwardTimelineExample.tsx` (only import paths rewritten); strict TypeScript compiles this same component. Render `ForwardTimelineExample`. The five `data-stage` regions share one snapshot. The complete system remains visible while progress traces the feature blocks and class rows; those highlights are teaching focus, not a second computation clock. Stage progress is teaching reveal time, not actual training/computation time. Values are synthetic and internally computed: Wz gives [2,0,−1], independent sigmoid gives [0.881,0.500,0.269]. This is training output, not nearest-mean inference.

Save as `ForwardTimelineExample.tsx` and `forward-timeline-example.css`. Also import `shared/foundation/styles/kit.css` in the app. The CSS below is Recipe layout, not hidden Gallery styling.

```tsx
import "./forward-timeline-example.css";
import { SampleToken } from "./shared/foundation/visual-parts/SampleToken";
import { FeatureBlocks } from "./shared/foundation/visual-parts/FeatureBlocks";
import { FeatureAggregation } from "./shared/foundation/visual-parts/FeatureAggregation";
import { RepresentationVector } from "./shared/foundation/visual-parts/RepresentationVector";
import { ResponseMeter } from "./shared/foundation/visual-parts/ResponseMeter";
import { FlowConnector } from "./shared/foundation/visual-parts/FlowConnector";
import { useAnimationTimeline } from "./shared/foundation/animation/useAnimationTimeline";

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
const scoreExtent = Math.max(1, ...scores.map(Math.abs));
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
  return <SampleToken sampleId="x1" label="示意图像 x₁" pixels={pixels} />;
}

function FeatureExtractorDrawing({ tracedBlock }: { tracedBlock: number }) {
  return <div className="pg-extractor-drawing">
    <FeatureBlocks label="卷积特征块" active={tracedBlock === 0} />
    <FlowConnector label="特征" />
    <FeatureBlocks label="深层表示" depth={3} active={tracedBlock === 1} />
    <FlowConnector label="聚合输入" />
    <FeatureAggregation label="聚合" active={tracedBlock === 2} />
  </div>;
}

export function ForwardTimelineExample() {
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
        {heading(1)}<div className="pg-forward-object pg-forward-object--extractor"><div className="pg-extractor-heading"><span>共享特征提取器</span><b>φ<sub>Θ</sub></b></div><FeatureExtractorDrawing tracedBlock={tracedBlock} /><p>同一组共享参数 Θ</p></div><small className="pg-forward-system__source">{stageSource(1)}</small>
      </li>
      <li data-object="representation" data-input-from="extractor" data-state={objectState(2)}>
        {heading(2)}<div className="pg-forward-object pg-forward-object--representation"><RepresentationVector values={features} label={`演示特征向量 ${vectorLabel(features)}`} /><b>z = φ<sub>Θ</sub>(x₁)</b><p>同一个 z 送往每类权重</p></div><small className="pg-forward-system__source">{stageSource(2)}</small>
      </li>
      <li data-object="scores" data-input-from="representation" data-state={objectState(3)}>
        {heading(3)}<div className="pg-forward-object pg-forward-object--scores"><div className="pg-output-heading"><span className="pg-output-eyebrow">一个训练输出头</span><small>尺度：{-scoreExtent} 至 {scoreExtent}</small></div><div className="pg-class-scores">
          {scores.map((score, j) => <div key={j} className="pg-head-score" data-class={j + 1} data-traced={index === 3 && tracedClass === j}><span className="pg-class-weight">w<sub>{j + 1}</sub></span><ResponseMeter value={score} min={-scoreExtent} max={scoreExtent} label={`g${["₁", "₂", "₃"][j]}(x₁)`} showScale={false} /></div>)}
        </div><p>g<sub>j</sub>(x₁) = w<sub>j</sub><sup>T</sup>z</p></div><small className="pg-forward-system__source">{stageSource(3)}</small>
      </li>
      <li data-object="responses" data-input-from="scores" data-state={objectState(4)}>
        {heading(4)}<div className="pg-forward-object pg-forward-object--responses"><div className="pg-output-heading"><span className="pg-output-eyebrow">逐类独立响应</span><small>尺度：0 至 1</small></div><div className="pg-class-responses">
          {responses.map((response, j) => <div key={j} className="pg-head-response" data-class={j + 1} data-traced={index === 4 && tracedClass === j}><span className="pg-sigmoid-mark">σ</span><ResponseMeter value={response} min={0} max={1} label={`C${j + 1}`} showScale={false} /></div>)}
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
```

```css
/* Recipe owns layout and stage emphasis. Visual parts own all drawing. */
.pg-forward { display: grid; gap: 24px; min-width: 0; padding-block: 28px; border-block: 1px solid var(--rk-line); }
.pg-forward header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
.pg-forward header > div { display: grid; gap: 10px; }
.pg-forward h3 { margin: 0; font-size: 24px; line-height: 1.4; }
.pg-forward p { margin: 0; color: var(--rk-muted); font-size: 14px; line-height: 1.8; }
.pg-forward header span, .pg-teaching-badge, .pg-forward-note > span { color: var(--rk-muted); font-size: 13px; }
.pg-forward button { padding: 10px 12px; color: var(--rk-ink); background: var(--rk-surface); border: 1px solid var(--rk-line); border-radius: 6px; font: inherit; font-size: 14px; line-height: 1.5; cursor: pointer; }
.pg-forward button:disabled { opacity: .5; cursor: default; }
.pg-forward button:focus-visible { outline: 2px solid var(--rk-focus); outline-offset: 3px; }
.pg-forward-nav { display: flex; flex-wrap: wrap; gap: 8px; }
.pg-forward-nav button { display: flex; align-items: center; gap: 10px; }
.pg-forward-nav button[aria-current="step"] { background: var(--rk-accent-soft); border-color: var(--rk-accent); }
.pg-forward-nav button > span { font: 12px var(--rk-font-mono); }
.pg-forward-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.pg-forward-controls > span { flex: 1 1 160px; color: var(--rk-muted); font-size: 13px; }
.pg-forward-controls .pg-play-control { background: var(--rk-accent); color: white; }
.pg-forward-track { height: 3px; background: var(--rk-line); }
.pg-forward-track i { display: block; height: 100%; background: var(--rk-accent); }
.pg-forward-system { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px; list-style: none; margin: 0; padding: 0; }
.pg-forward-system > li { display: grid; grid-template-rows: auto 1fr auto; gap: 16px; min-width: 0; padding-top: 16px; border-top: 2px solid var(--rk-line); }
.pg-forward-system > li[data-object="extractor"] { grid-column: span 2; }
.pg-forward-system > li[data-state="active"] { border-color: var(--rk-accent); }
.pg-stage-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-height: 28px; font-size: 14px; }
.pg-stage-heading > span { color: var(--rk-muted); font: 12px var(--rk-font-mono); }
.pg-stage-heading > small { margin-inline-start: auto; color: var(--rk-muted); font-size: 12px; }
.pg-forward-object { display: grid; align-content: center; justify-items: center; gap: 12px; min-width: 0; min-height: 210px; padding: 12px; box-sizing: border-box; }
.pg-forward-object > b { font: 21px/1.5 var(--rk-font-math); }
.pg-forward-object > p, .pg-forward-system__source { color: var(--rk-muted); font-size: 12px; line-height: 1.6; text-align: center; }
.pg-forward-system > li[data-state="active"] .pg-forward-object { background: var(--rk-figure); border-radius: 6px; }
.pg-extractor-heading { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 12px; font-size: 13px; }
.pg-extractor-heading b { font: 22px/1.5 var(--rk-font-math); }
.pg-extractor-drawing { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 12px; width: 100%; }
.pg-class-scores, .pg-class-responses { display: grid; gap: 12px; width: 100%; max-width: 260px; }
.pg-head-score { display: grid; grid-template-columns: 34px minmax(0, 1fr); align-items: center; gap: 10px; font-size: 14px; }
.pg-class-weight { display: inline-block; padding: 5px 8px; border: 1px solid var(--rk-line-strong); border-radius: 50%; }
.pg-head-response { display: grid; grid-template-columns: 16px minmax(0, 1fr); gap: 8px; align-items: start; }
.pg-sigmoid-mark { color: var(--rk-accent); font: 400 13px/1.5 var(--rk-font-math); }
.pg-output-eyebrow { font-size: 13px; color: var(--rk-muted); }
.pg-output-heading { display: grid; gap: 4px; text-align: center; }
.pg-output-heading small { color: var(--rk-muted); font-size: 12px; }
.pg-head-score[data-traced="true"], .pg-head-response[data-traced="true"] { outline: 2px solid var(--rk-accent); outline-offset: 4px; }
.pg-forward-detail { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 32px; padding: 24px; background: var(--rk-surface-soft); }
.pg-forward-note h4 { margin: 10px 0; font-size: 20px; }
.pg-forward-output { display: grid; align-content: center; gap: 12px; min-width: 0; }
.pg-forward-output math { font-size: 24px; }
.pg-forward-output p { text-align: center; overflow-wrap: anywhere; }
.pg-forward-footer { display: grid; gap: 16px; }
.pg-forward-values, .pg-forward .pg-forward-boundary { font-size: 13px; color: var(--rk-muted); }
.pg-forward-values summary { cursor: pointer; }
@media (max-width: 720px) {
  .pg-forward-system { grid-template-columns: minmax(0, 1fr); }
  .pg-forward-system > li[data-object="extractor"] { grid-column: 1; }
  .pg-forward-detail { grid-template-columns: minmax(0, 1fr); padding: 18px; }
  .pg-extractor-drawing { gap: 8px; }
  .pg-extractor-drawing > .rk-flow-connector { min-width: 100%; padding-block: 12px; }
  .pg-extractor-drawing > .rk-flow-connector svg { transform: rotate(90deg); }
}
```
