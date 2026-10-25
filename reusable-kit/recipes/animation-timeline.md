# useAnimationTimeline · P1 candidate

A single clock for related views. Call the Hook once in the owner; derive navigation, object emphasis, narrative, formula/output and controls from its `state`. Clips have only `id`, `durationMs`, optional `holdMs`; teaching data belongs to the caller. Keep clip arrays stable (module constant or memoized). Never add a second timeout/RAF or per-view active stage.

## API

Inputs: `clips`, `autoPlay` (default false), optional `reducedMotion`, injectable `clock` (`request` / `cancel`) and bounded `initialState`. Outputs: `clipId`, `clipIndex`, `clip`, `elapsedMs`, `progress`, `status`, `isHolding`, `atStart/atEnd`, `hasPrevious/hasNext`, `totalClips`, `errors`. Controls: `play`, `pause`, `toggle`, `stepBack`, `stepForward`, `replayClip`, `goToClip(index, {autoPlay?})` (jump defaults to paused). Replay starts the current clip; no implicit whole-sequence reset. A nonfinite index falls back to the first clip.

`progress` reaches 1 at duration end; `isHolding` covers the following hold interval. Pausing retains elapsed time, replay resets it. Empty/invalid clips have explicit inert states. Runtime replacement preserves matching clip identity and bounds time; removed clips fall back to the first. Unmount cancels the scheduled frame. Reduced motion renders complete semantic stages, keeps manual navigation, and never starts continuous playback (`toggle` advances a stage).

## Runnable synchronized scene

Exact source from Gallery `demo/src/examples/ForwardTimelineExample.tsx` (only import paths rewritten); strict TypeScript compiles this same component. Render `ForwardTimelineExample`. The five `data-stage` regions share one snapshot. Stage progress is teaching reveal time, not actual training/computation time. Values are synthetic and internally computed: Wz gives [2,0,−1], independent sigmoid gives [0.881,0.500,0.269]. This is training output, not nearest-mean inference.

```tsx
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

export function ForwardTimelineExample() {
  const { state, controls } = useAnimationTimeline({ clips: stages, autoPlay: false });
  const index = state.clipIndex;
  const stage = stages[index];
  // One clock: all five regions derive from this snapshot. No extra stage or timer state.
  const visible = (objectIndex: number) => objectIndex < index || (objectIndex === index && state.progress === 1);
  return <article className="pg-forward" data-timeline-example="forward" data-stage={state.clipId} data-progress={state.progress.toFixed(3)} data-status={state.status} data-holding={state.isHolding} data-sample="x1">
    <header><span>一个样本 / 一次前向计算</span><h3>从 x₁ 到逐类训练响应</h3><p>教学演示值：固定 z = {vectorLabel(features)}，类别权重 W = [{weights.map(row => vectorLabel(row)).join(", ")}]。概览保留目标值，当前阶段由导航与轮廓标记。</p></header>
    <nav className="pg-forward-nav" aria-label="前向计算阶段" data-stage={state.clipId}>
      {stages.map((item, i) => <button type="button" key={item.id} data-stage-target={item.id} aria-current={i === index ? "step" : undefined} onClick={() => controls.goToClip(i)}><span>{i + 1}</span>{item.title}</button>)}
    </nav>
    <ol className="pg-forward-system" aria-label="固定样本 x₁ 的完整前向路径" data-stage={state.clipId}>
      {stages.map((item, i) => <li key={item.id} data-object={item.id} data-input-from={i === 0 ? "sample-x1" : stages[i - 1].id} data-state={i === index ? "active" : i < index ? "done" : "waiting"}>
        <span className="pg-forward-system__source">{i === 0 ? "固定输入" : `来自 ${stages[i - 1].title}`}</span>
        <strong>{item.title}</strong>
        <div className="pg-forward-art" aria-hidden="true">
          {i === 0 ? <span className="pg-sample-token">◇<small>x₁</small></span>
            : i === 1 ? <div className="pg-feature-blocks"><i /><i /><i /><b>→</b><i /><i /><b>→ 聚合</b></div>
            : i === 2 ? <span className="pg-vector">{vectorLabel(features)}</span>
            : i === 3 ? <span className="pg-vector">{vectorLabel(scores)}</span>
            : <span className="pg-vector">{vectorLabel(responses, 3)}</span>}
        </div>
        <span className="pg-forward-system__symbol">{item.symbol}</span>
        <div className="pg-forward-track" aria-hidden="true"><i style={{ width: `${i < index ? 100 : i === index ? state.progress * 100 : 0}%` }} /></div>
        <small>{i < index ? "已完成" : i === index ? `${Math.round(state.progress * 100)}% · ${state.isHolding ? "停留观察" : "当前阶段"}` : "待处理"}</small>
      </li>)}
    </ol>
    <div className="pg-forward-detail" data-stage={state.clipId}>
      <div className="pg-forward-note" data-stage={state.clipId} aria-live="polite"><span>阶段 {index + 1} / 5 · 固定样本 x₁</span><h4>{stage.title}</h4><p>{stage.note}</p></div>
      <div className="pg-forward-output" data-stage={state.clipId} data-symbol={stage.symbol}>
        <StageFormula index={index} />
        {index < 3 ? <p>{index === 0 ? "样本 x₁ 保持不变" : index === 1 ? "卷积特征块 → 深层表示 → 聚合" : `演示表示 z = ${vectorLabel(features)}`}</p>
          : <table><caption>同一样本 x₁ · {visible(index) ? "本阶段产物" : "目标产物预览，进度表示讲解展开"}（演示值）</caption><thead><tr><th>类别</th><th>得分 gⱼ</th>{index === 4 && <th>响应 σ(gⱼ)</th>}</tr></thead><tbody>{scores.map((score, j) => <tr key={j}><th>C{j + 1}</th><td>{score}</td>{index === 4 && <td><meter min="0" max="1" value={responses[j]} /> {responses[j].toFixed(3)}</td>}</tr>)}</tbody></table>}
      </div>
    </div>
    <div className="pg-forward-controls" aria-label="前向计算播放控制" data-stage={state.clipId}>
      <button type="button" onClick={controls.toggle} disabled={state.atEnd}>{state.status === "playing" ? "暂停" : state.atEnd ? "已完成" : "播放 / 继续"}</button>
      <button type="button" onClick={controls.stepBack} disabled={!state.hasPrevious}>上一阶段</button>
      <button type="button" onClick={controls.stepForward} disabled={!state.hasNext}>下一阶段</button>
      <button type="button" onClick={controls.replayClip}>重播当前阶段</button>
      <span role="status">{state.status} · {Math.round(state.progress * 100)}%{state.isHolding ? " · 停留观察" : ""}</span>
    </div>
    <p className="pg-forward-boundary">这里只展示训练网络的前向输出，不等同于 iCaRL 的 nearest-mean 最终分类。逐类 sigmoid 不是 Softmax。数值与结构均为教学示意；进度条表示讲解展开，不是训练或真实计算耗时。减少动态效果时，按阶段浏览完整图文。</p>
  </article>;
}
```

Copy the optional `.pg-forward*`, `.pg-feature-blocks`, `.pg-vector`, `.pg-sample-token` rules and related responsive queries from `demo/src/pattern-gallery.css` for the Gallery presentation. The TSX also renders as semantic HTML without them. Copy `foundation/animation/` and `foundation/accessibility/useReducedMotion.ts` (scaffold resolves these dependencies); no paper runtime or QA global is needed. MathML typing for strict React TS is supplied by the foundation scaffold.

## Independent reuse evidence and limits

`demo/src/smoke-tests.tsx` uses the same Hook API for a test-only read → transform → validate → write pipeline with a controlled clock, source/destination regions, no network business fields. It verifies intermediate movement, hold, pause/resume, replay during playback, repeated play, completion, clip replacement, invalid jumps, reduced motion and RAF cancellation on unmount. This proves cross-context reuse separately from the main scene's single-clock multi-region synchronization.

The Hook owns time, not neural-network operations or stage prose. Use CSS for isolated transitions; keep training state and geometry in caller code. `easing.ts` remains a dependency-free interpolation utility. Origin: the read-only iCaRL clock, with its private QA global excluded. Human acceptance remains pending.
