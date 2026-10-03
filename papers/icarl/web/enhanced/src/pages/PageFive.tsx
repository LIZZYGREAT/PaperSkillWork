import { useState } from "react";
import { GuidedStepControls, type GuidedStep } from "../components/GuidedStepControls";
import { euclideanDistance, type Vector2 } from "../data/icarl-runtime";
import { HERDING_TEACHING_POINTS, HERDING_TEACHING_QUOTA, HERDING_TEACHING_RESULT, summarizeFeaturePrefix, type HerdingTeachingPoint } from "../data/herding-example";

const steps: readonly GuidedStep[] = [
  { title: "完整类别均值怎样成为目标？", short: "完整目标" },
  { title: "第一个 exemplar 怎样选？", short: "选出 p₁" },
  { title: "为什么 p₂ 不是最近的点？", short: "prefix 补偿" },
  { title: "怎样构造有优先级的列表？", short: "ordered list" },
  { title: "预算从 5 缩到 3 时怎么办？", short: "截断 tail" },
  { title: "首次构造与后续缩减怎样衔接？", short: "先构造，后缩减" },
];

type Point2D = { x: number; y: number };
const CHART = { centerX: 210, centerY: 180, radius: 126 };

function toChartPoint(vector: Vector2): Point2D {
  return { x: CHART.centerX + vector[0] * CHART.radius, y: CHART.centerY - vector[1] * CHART.radius };
}

function starPoints(x: number, y: number, outer = 9, inner = 4) {
  return Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (Math.PI * index) / 5;
    return `${x + Math.cos(angle) * radius},${y + Math.sin(angle) * radius}`;
  }).join(" ");
}

function format(value: number) {
  return value.toFixed(3);
}

function prefixMean(points: readonly HerdingTeachingPoint[]) {
  if (points.length === 0) return null;
  return summarizeFeaturePrefix(points);
}

function UnitCircle({
  selected,
  candidateId,
  prefix,
  comparisonId,
  comparisonPrefix,
  referenceOnly,
}: {
  selected: readonly HerdingTeachingPoint[];
  candidateId?: string;
  prefix: ReturnType<typeof prefixMean>;
  comparisonId?: string;
  comparisonPrefix?: { rawMean: Vector2; normalizedMean: Vector2 } | null;
  referenceOnly: boolean;
}) {
  const targetPoint = toChartPoint(HERDING_TEACHING_RESULT.target);
  const rawTargetPoint = toChartPoint(HERDING_TEACHING_RESULT.targetRawMean);
  const rawPrefixPoint = prefix ? toChartPoint(prefix.rawMean) : null;
  const normalizedPrefixPoint = prefix ? toChartPoint(prefix.normalizedMean) : null;
  const rawComparisonPoint = comparisonPrefix ? toChartPoint(comparisonPrefix.rawMean) : null;
  const normalizedComparisonPoint = comparisonPrefix ? toChartPoint(comparisonPrefix.normalizedMean) : null;
  const selectedIds = new Set(selected.map((point) => point.id));

  return (
    <svg className="p5-unit-circle" viewBox="0 0 420 360" role="img" aria-label={`固定合成特征示例的单位圆。${referenceOnly ? "点位和完整类别均值来自初次构造时的历史参考；后续阶段完整数据不可用。" : `${HERDING_TEACHING_POINTS.length} 个归一化特征点，完整类别目标 μy 位于单位圆上。`}${selected.length ? `当前 prefix 长度 ${selected.length}，` : ""}${candidateId ? `当前候选 ${candidateId}。` : ""}`}>
      <title>归一化特征空间中的 Herding 计算</title>
      <desc>所有输入特征先经 L2 normalization 位于单位圆上。完整类别均值在圆内，归一化后得到目标 μy。当前 prefix 均值也由输入特征计算，再归一化到单位圆。</desc>
      <line className="p5-axis" x1="34" y1={CHART.centerY} x2="386" y2={CHART.centerY} />
      <line className="p5-axis" x1={CHART.centerX} y1="7" x2={CHART.centerX} y2="353" />
      <circle className="p5-circle-boundary" cx={CHART.centerX} cy={CHART.centerY} r={CHART.radius} />
      <line className={`p5-mean-ray p5-mean-ray--target${referenceOnly ? " is-reference" : ""}`} x1={CHART.centerX} y1={CHART.centerY} x2={rawTargetPoint.x} y2={rawTargetPoint.y} />
      <line className={`p5-normalize-ray p5-normalize-ray--target${referenceOnly ? " is-reference" : ""}`} x1={rawTargetPoint.x} y1={rawTargetPoint.y} x2={targetPoint.x} y2={targetPoint.y} />
      {rawPrefixPoint && normalizedPrefixPoint ? <>
        <line className={`p5-mean-ray p5-mean-ray--prefix${referenceOnly ? " is-reference" : ""}`} x1={CHART.centerX} y1={CHART.centerY} x2={rawPrefixPoint.x} y2={rawPrefixPoint.y} />
        <line className={`p5-normalize-ray p5-normalize-ray--prefix${referenceOnly ? " is-reference" : ""}`} x1={rawPrefixPoint.x} y1={rawPrefixPoint.y} x2={normalizedPrefixPoint.x} y2={normalizedPrefixPoint.y} />
      </> : null}
      {rawComparisonPoint && normalizedComparisonPoint ? <>
        <line className="p5-mean-ray p5-mean-ray--comparison" x1={CHART.centerX} y1={CHART.centerY} x2={rawComparisonPoint.x} y2={rawComparisonPoint.y} />
        <line className="p5-normalize-ray p5-normalize-ray--comparison" x1={rawComparisonPoint.x} y1={rawComparisonPoint.y} x2={normalizedComparisonPoint.x} y2={normalizedComparisonPoint.y} />
      </> : null}
      {HERDING_TEACHING_POINTS.map((point) => {
        const { x, y } = toChartPoint(point.feature);
        const selectedPoint = selectedIds.has(point.id);
        return <g key={point.id} aria-hidden="true">
          {selectedPoint ? <circle className="p5-selected-ring" cx={x} cy={y} r="9" /> : null}
          {candidateId === point.id ? <circle className="p5-candidate-ring" cx={x} cy={y} r="13" /> : null}
          {comparisonId === point.id ? <circle className="p5-comparison-ring" cx={x} cy={y} r="16" /> : null}
          <circle className={`p5-data-point${selectedPoint ? " is-selected" : ""}${referenceOnly && !selectedPoint ? " is-reference" : ""}`} cx={x} cy={y} r={selectedPoint ? 5.1 : 3.6} />
        </g>;
      })}
      <polygon className={`p5-marker p5-marker--target${referenceOnly ? " is-reference" : ""}`} points={starPoints(targetPoint.x, targetPoint.y)} />
      <polygon className={`p5-marker p5-marker--raw-target${referenceOnly ? " is-reference" : ""}`} points={`${rawTargetPoint.x},${rawTargetPoint.y - 6} ${rawTargetPoint.x + 6},${rawTargetPoint.y} ${rawTargetPoint.x},${rawTargetPoint.y + 6} ${rawTargetPoint.x - 6},${rawTargetPoint.y}`} />
      {rawPrefixPoint && normalizedPrefixPoint ? <>
        <polygon className={`p5-marker p5-marker--raw-prefix${referenceOnly ? " is-reference" : ""}`} points={`${rawPrefixPoint.x},${rawPrefixPoint.y - 6} ${rawPrefixPoint.x + 6},${rawPrefixPoint.y} ${rawPrefixPoint.x},${rawPrefixPoint.y + 6} ${rawPrefixPoint.x - 6},${rawPrefixPoint.y}`} />
        <circle className={`p5-marker p5-marker--prefix${referenceOnly ? " is-reference" : ""}`} cx={normalizedPrefixPoint.x} cy={normalizedPrefixPoint.y} r="6.5" />
      </> : null}
      {rawComparisonPoint && normalizedComparisonPoint ? <>
        <rect className="p5-marker p5-marker--comparison-raw" x={rawComparisonPoint.x - 5} y={rawComparisonPoint.y - 5} width="10" height="10" />
        <circle className="p5-marker p5-marker--comparison-prefix" cx={normalizedComparisonPoint.x} cy={normalizedComparisonPoint.y} r="5" />
      </> : null}
      <circle className="p5-origin" cx={CHART.centerX} cy={CHART.centerY} r="2.3" />
    </svg>
  );
}

function OrderedList({
  visibleCount,
  prefixCount,
  showRemoved,
}: {
  visibleCount: number;
  prefixCount: number;
  showRemoved: boolean;
}) {
  const list = HERDING_TEACHING_RESULT.ordered.slice(0, visibleCount);
  return <ol className="p5-ordered-list" aria-label="按 Herding 得分优先排序的 exemplar list">
    {list.map((point, index) => {
      const kept = index < prefixCount;
      return <li className={`${kept ? "is-kept" : "is-tail"}${!showRemoved && !kept ? " is-muted" : ""}`} key={point.id}>
        <span className="p5-order-number">p<sub>{index + 1}</sub></span>
        <b>{point.id}</b>
        <small>{index === 0 ? "highest priority" : kept ? "prefix retained" : "tail"}</small>
        {showRemoved && !kept ? <span className="p5-removal-arrow" aria-label="从列表尾部移除">↑</span> : null}
      </li>;
    })}
  </ol>;
}

function InspectTarget() {
  const { points, targetRawMean, target } = HERDING_TEACHING_RESULT;
  const norm = Math.hypot(...targetRawMean);
  return <details className="p5-inspector">
    <summary>Inspect target calculation</summary>
    <div className="p5-inspector__body">
      <p>每个 feature 已先 L2-normalize。先对 {points.length} 个 unit feature 求 mean，再把完整类均值归一化到单位圆。</p>
      <code>μ̄<sub>y</sub> = mean(φ(x₁), …, φ(x₈)) = ({format(targetRawMean[0])}, {format(targetRawMean[1])})</code>
      <code>‖μ̄<sub>y</sub>‖₂ = {format(norm)} → μ<sub>y</sub> = normalize(μ̄<sub>y</sub>) = ({format(target[0])}, {format(target[1])})</code>
      <small>归一化没有使用接近零的退化均值；所有数值由页面中的固定点实时计算。</small>
    </div>
  </details>;
}

export function PageFive({ onContinue }: { onContinue?: () => void }) {
  const [stage, setStage] = useState(0);
  const [prefixCount, setPrefixCount] = useState(HERDING_TEACHING_QUOTA);
  const [compareNearest, setCompareNearest] = useState(false);
  const [timelineMode, setTimelineMode] = useState<"construct" | "later">("construct");

  function changeStage(nextStage: number) {
    setStage(nextStage);
    if (nextStage === 4) setPrefixCount(3);
    if (nextStage === 5) setPrefixCount(timelineMode === "construct" ? HERDING_TEACHING_QUOTA : 3);
  }

  function changeTimelineMode(mode: "construct" | "later") {
    setTimelineMode(mode);
    setPrefixCount(mode === "construct" ? HERDING_TEACHING_QUOTA : 3);
  }

  let activePrefix: HerdingTeachingPoint[] = [];
  if (stage === 1) activePrefix = HERDING_TEACHING_RESULT.ordered.slice(0, 1);
  else if (stage === 2) activePrefix = HERDING_TEACHING_RESULT.ordered.slice(0, 2);
  else if (stage === 3 || stage === 4) activePrefix = HERDING_TEACHING_RESULT.ordered.slice(0, prefixCount);
  else if (stage === 5) activePrefix = HERDING_TEACHING_RESULT.ordered.slice(0, timelineMode === "construct" ? HERDING_TEACHING_QUOTA : 3);

  const activePrefixStats = prefixMean(activePrefix);
  const activeCandidateStep = stage === 1 ? HERDING_TEACHING_RESULT.steps[0] : stage === 2 ? HERDING_TEACHING_RESULT.steps[1] : null;
  const activeCandidate = activeCandidateStep?.chosen;
  const nearestIndividual = HERDING_TEACHING_RESULT.steps[1].candidates.reduce((best, candidate) => candidate.individualDistanceToTarget < best.individualDistanceToTarget ? candidate : best);
  const selectedSecondStep = HERDING_TEACHING_RESULT.steps[1].candidates.find((candidate) => candidate.point.id === HERDING_TEACHING_RESULT.steps[1].chosen.id)!;
  const nearestSecondStep = HERDING_TEACHING_RESULT.steps[1].candidates.find((candidate) => candidate.point.id === nearestIndividual.point.id)!;

  return (
    <article className="tutorial-page icarl-page icarl-page--p5">
      <header className="page-heading icarl-page__heading">
        <div className="icarl-page__eyebrow"><span>PAGE 05</span><i /> EXEMPLAR SELECTION</div>
        <h1>Herding 为记忆建立优先顺序</h1>
        <p>用当前更新后的特征映射，把完整新类的 normalized features 汇成目标；逐个加入候选，让每个 prefix 的均值尽量贴近这个目标。</p>
      </header>

      <GuidedStepControls steps={steps} current={stage} onChange={changeStage} label="Page 5 Herding 教学步骤" />

      <div className="p5-example-note"><span>FIXED SYNTHETIC TEACHING EXAMPLE</span><b>{stage === 5 && timelineMode === "later" ? "construction snapshot φ" : "current post-update φ"}</b><small>{stage === 5 && timelineMode === "later" ? "完整旧类数据已不可用；图中几何只回看首次构造顺序时的固定示例。" : "8 个固定、单位长度的二维 feature vectors · 可复算，无随机点"}</small></div>

      <section className="p5-workbench" aria-label="Herding normalized feature space 和优先列表">
        <section className="panel p5-space-panel">
          <div className="panel-heading"><div><span className="eyebrow">NORMALIZED FEATURE SPACE</span><h2>特征和均值都要归一化</h2></div><span className="p5-unit-badge">‖φ(x)‖₂ = 1</span></div>
          <p className="p5-panel-intro">{stage === 5 && timelineMode === "later" ? "淡色点位与 ★ μᵧ 是首次构造时的历史参照；后续缩减时不再读取完整类数据。" : <>完整类均值先落在圆内，再沿原点方向 normalize 到单位圆，作为 ★ μ<sub>y</sub>。</>}</p>
          <UnitCircle
            selected={activePrefix}
            candidateId={activeCandidate?.id}
            prefix={activePrefixStats}
            comparisonId={compareNearest && stage === 2 ? nearestIndividual.point.id : undefined}
            comparisonPrefix={compareNearest && stage === 2 ? { rawMean: nearestSecondStep.rawPrefixMean, normalizedMean: nearestSecondStep.prefixMean } : null}
            referenceOnly={stage === 5 && timelineMode === "later"}
          />
          <div className="p5-legend" aria-label="Feature space 图例">
            <span><i className={`p5-legend__point${stage === 5 && timelineMode === "later" ? " is-reference" : ""}`} />{stage === 5 && timelineMode === "later" ? "构造时 full-class features（当前不可用）" : "输入 feature"}</span>
            <span><i className="p5-legend__raw-target" />◇ {stage === 5 && timelineMode === "later" ? "构造时 raw mean 参考" : "完整类 raw mean"}</span>
            <span><i className="p5-legend__target">★</i>{stage === 5 && timelineMode === "later" ? "构造时 μᵧ 参考" : <>μ<sub>y</sub></>}</span>
            {activePrefixStats ? <><span><i className="p5-legend__raw-prefix" />◇ 当前 raw prefix mean</span><span><i className="p5-legend__prefix" />◆ μ<sub>P(k)</sub></span></> : null}
            {compareNearest && stage === 2 ? <span><i className="p5-legend__comparison" />□ nearest-point prefix</span> : null}
          </div>
          {stage === 1 ? <div className="p5-space-caption"><b>k = 1</b><span>prefix 只有一个点；第一个选择使 normalized prefix mean 最接近 μ<sub>y</sub>。</span></div> : null}
          {stage === 2 ? <div className="p5-space-caption"><b>k = 2</b><span>图中展示 p₁ 加入每个候选后实际形成的两点 prefix mean，再进行 L2 normalization。</span></div> : null}
          {stage >= 3 ? <div className="p5-space-caption"><b>k = {activePrefix.length}</b><span>{stage === 5 && timelineMode === "later" ? "◆ 以初次构造时的特征坐标回看已保留 prefix；后续运行不会用完整旧类数据重跑 Herding。" : "◆ 是当前实际 prefix 均值的 normalized vector；它会随 prefix 长度重新计算。"}</span></div> : null}
        </section>

        <section className="panel p5-decision-panel">
          {stage === 0 ? <>
            <div className="panel-heading"><div><span className="eyebrow">FULL-CLASS TARGET</span><h2>先建立比较目标</h2></div></div>
            <div className="p5-target-equation"><span>所有 φ(xᵢ)</span><i aria-hidden="true">→</i><b>mean</b><i aria-hidden="true">→</i><strong>normalize</strong><i aria-hidden="true">→</i><em>μ<sub>y</sub></em></div>
            <p className="p5-explain">★ μ<sub>y</sub> 是完整类别归一化均值。每个输入 feature 本身也已归一化，因此所有输入点都落在单位圆上。</p>
            <div className="p5-target-distinction"><div><i className="p5-legend__raw-target" /><b>μ̄<sub>y</sub></b><span>raw full-class mean · 圆内</span></div><i aria-hidden="true">normalize</i><div><i className="p5-legend__target">★</i><b>μ<sub>y</sub></b><span>normalized target · 圆上</span></div></div>
            <div className="p5-target-stats"><span>输入 features<strong>{HERDING_TEACHING_POINTS.length} 个</strong></span><span>输入总长<strong>每个 ‖φ(x)‖₂ = 1</strong></span></div>
            <InspectTarget />
          </> : null}

          {stage === 1 || stage === 2 ? <>
            <div className="panel-heading"><div><span className="eyebrow">GREEDY PREFIX SELECTION</span><h2>{stage === 1 ? "挑出 p₁" : "挑出 p₂"}</h2></div><span className="p5-k-badge">k = {stage}</span></div>
            <div className="p5-selected-sequence"><span>已选择</span>{stage === 1 ? <b>empty prefix</b> : HERDING_TEACHING_RESULT.ordered.slice(0, stage - 1).map((point, index) => <b key={point.id}>p<sub>{index + 1}</sub> · {point.id}</b>)}<i aria-hidden="true">→</i><strong>candidate</strong></div>
            <p className="p5-explain">每个 candidate 都生成一个当前长度的 prefix；选择使归一化 prefix mean 到 μ<sub>y</sub> 距离最小的 candidate。</p>
            <ol className="p5-candidate-rank" aria-label={`第 ${stage} 步候选排名`}>
              {activeCandidateStep?.candidates.slice(0, 4).map((score, index) => <li key={score.point.id} className={score.point.id === activeCandidate?.id ? "is-winner" : ""}>
                <span className="p5-rank-index">{index + 1}</span><b>{score.point.id}</b><small>{stage === 1 ? "1 点 prefix" : `p₁ + ${score.point.id}`}</small><strong>{format(score.distanceToTarget)}</strong>
                {score.point.id === activeCandidate?.id ? <em>选择</em> : null}
              </li>)}
            </ol>
            <div className="p5-winner-callout"><b>p<sub>{stage}</sub> = {activeCandidate?.id}</b><span>normalized prefix mean 距离 μ<sub>y</sub> 最近</span><strong>d = {format(activeCandidateStep?.distanceToTarget ?? 0)}</strong></div>
            {stage === 2 ? <>
              <button type="button" className="p5-compare-button" aria-expanded={compareNearest} onClick={() => setCompareNearest(!compareNearest)}>{compareNearest ? "收起最近单点对照" : "Why not choose the nearest point?"}</button>
              {compareNearest ? <div className="p5-nearest-compare"><div><span>单点到目标最近的候选</span><b>{nearestIndividual.point.id}</b><small>individual distance：{format(nearestIndividual.individualDistanceToTarget)}</small><small>加入 p₁ 后的 prefix score：{format(nearestSecondStep.distanceToTarget)}</small></div><i aria-hidden="true">vs</i><div><span>Herding 选择</span><b>{selectedSecondStep.point.id}</b><small>individual distance：{format(selectedSecondStep.individualDistanceToTarget)}</small><small>加入 p₁ 后的 prefix score：{format(selectedSecondStep.distanceToTarget)}</small></div><p>本例第 2 步，{nearestIndividual.point.id} 单独看更接近 μᵧ；但与 p₁ 合成 prefix 后，{selectedSecondStep.point.id} 的 normalized mean 更接近 μᵧ。算法比较的是当前 prefix score，不是单点距离。</p></div> : null}
            </> : null}
            <details key={`candidate-${stage}`} className="p5-inspector">
              <summary>Inspect candidate calculations</summary>
              <div className="p5-inspector__body">
                <code>μ<sub>P(k)</sub> = normalize(mean(φ(p₁), …, φ(pₖ₋₁), φ(candidate)))</code>
                <code>score = ‖μ<sub>P(k)</sub> − μ<sub>y</sub>‖₂</code>
                <div className="p5-score-table"><div><b>candidate</b><b>raw prefix mean</b><b>normalized mean</b><b>distance</b></div>{activeCandidateStep?.candidates.map((score) => <div key={score.point.id}><span>{score.point.id}</span><span>({format(score.rawPrefixMean[0])}, {format(score.rawPrefixMean[1])})</span><span>({format(score.prefixMean[0])}, {format(score.prefixMean[1])})</span><span>{format(score.distanceToTarget)}</span></div>)}</div>
              </div>
            </details>
          </> : null}

          {stage === 3 ? <>
            <div className="panel-heading"><div><span className="eyebrow">ORDERED EXEMPLAR LIST</span><h2>算法构造顺序就是优先级</h2></div></div>
            <p className="p5-explain">继续对每个 prefix 实际运行同一选择规则，得到 P<sub>y</sub> = (p₁, p₂, …, pₘ)。它是有序列表，不是任意集合。</p>
            <div className="p5-budget-switch" role="group" aria-label="查看不同 prefix 长度">
              <button type="button" aria-pressed={prefixCount === HERDING_TEACHING_QUOTA} onClick={() => setPrefixCount(HERDING_TEACHING_QUOTA)}>m = 4 · 完整列表</button>
              <button type="button" aria-pressed={prefixCount === 3} onClick={() => setPrefixCount(3)}>m = 3 · 当前 prefix</button>
            </div>
            <OrderedList visibleCount={HERDING_TEACHING_QUOTA} prefixCount={prefixCount} showRemoved={false} />
            <p className="p5-list-caption">Highlighted prefix length k = {prefixCount}; its mean marker is computed from the selected points.</p>
            <details className="p5-inspector"><summary>Inspect full prioritized sequence</summary><div className="p5-inspector__body"><div className="p5-order-details">{HERDING_TEACHING_RESULT.steps.map((step, index) => <p key={step.chosen.id}><b>p<sub>{index + 1}</sub> = {step.chosen.id}</b><span>prefix mean distance {format(step.distanceToTarget)}</span></p>)}</div></div></details>
          </> : null}

          {stage === 4 ? <>
            <div className="panel-heading"><div><span className="eyebrow">PREFIX TRUNCATION</span><h2>从 m = 4 缩到 m = 3</h2></div><span className="p5-k-badge">K fixed</span></div>
            <p className="p5-explain">预算下降时保留列表前缀，截断 tail。Herding 构造时已按 prefix 顺序设计代表性，因此本例只保留前三个。</p>
            <div className="p5-truncate-label"><span>保留 P′<sub>y</sub> = (p₁, p₂, p₃)</span><b>truncate list tail ↑</b></div>
            <OrderedList visibleCount={HERDING_TEACHING_QUOTA} prefixCount={3} showRemoved />
            <div className="p5-prefix-result"><span>computed μ<sub>P(3)</sub></span><strong>d to μ<sub>y</sub> = {format(activePrefixStats ? euclideanDistance(activePrefixStats.normalizedMean, HERDING_TEACHING_RESULT.target) : 0)}</strong><small>normalized prefix mean is recalculated from φ(p₁), φ(p₂), φ(p₃).</small></div>
          </> : null}

          {stage === 5 ? <>
            <div className="panel-heading"><div><span className="eyebrow">CONSTRUCT ONCE · REDUCE LATER</span><h2>{timelineMode === "construct" ? "首次出现时完整数据可用" : "完整旧数据不再可用"}</h2></div></div>
            <div className="p5-time-switch" role="group" aria-label="类别 exemplar 的生命周期阶段">
              <button type="button" aria-pressed={timelineMode === "construct"} onClick={() => changeTimelineMode("construct")}>Class y 首次出现</button>
              <button type="button" aria-pressed={timelineMode === "later"} onClick={() => changeTimelineMode("later")}>后续增量阶段</button>
            </div>
            {timelineMode === "construct" ? <div className="p5-lifecycle-flow"><span>FULL X<sub>y</sub> available</span><i>↓</i><span>current post-update φ</span><i>↓</i><span>compute μ<sub>y</sub> → run Herding</span><i>↓</i><b>P<sub>y</sub> = (p₁, …, p₄)</b></div> : <div className="p5-lifecycle-flow p5-lifecycle-flow--later"><span>FULL X<sub>y</sub> unavailable</span><i>↓</i><span>existing ordered P<sub>y</sub> retained</span><i>↓</i><span>m decreases → truncate tail</span><i>↓</i><b>P′<sub>y</sub> = (p₁, p₂, p₃)</b></div>}
            <p className="p5-lifecycle-note">{timelineMode === "construct" ? "Herding 使用 representation update 后的当前特征映射；不是先选 exemplar 再训练表示。" : "旧类完整 Xᵧ 已不可用，因此之后不重跑完整 Herding；已有列表只按新预算截去尾部。图中的均值和点位仅回看首次构造时的几何参照。"}</p>
            <OrderedList visibleCount={HERDING_TEACHING_QUOTA} prefixCount={timelineMode === "construct" ? HERDING_TEACHING_QUOTA : 3} showRemoved={timelineMode === "later"} />
          </> : null}
        </section>
      </section>

      {stage === 5 ? <section className="p5-runtime-order" aria-label="增量更新中的 Exemplar 操作顺序"><span className="eyebrow">RUNTIME ORDER</span><div><span>Update representation</span><i>→</i><b>current post-update φ</b><i>→</i><span>reduce old P</span><i>→</i><strong>construct new P</strong></div><p>旧 exemplar 集按新 quota 缩减；新类 exemplar 使用同一轮 representation update 之后的 φ 构造。</p></section> : null}

      <section className="icarl-concept-note"><span className="icarl-concept-note__index">0{stage + 1}</span><div><span className="eyebrow">这一幕要看懂</span><p>{stage === 0 ? "单位圆中的 ★ μᵧ 来自完整类别归一化均值；候选 feature 和当前 prefix 均值也经过 L2 normalization。" : stage === 1 ? "p₁ 是单点 prefix，因此选择 feature direction 最接近完整类目标的样本。" : stage === 2 ? "p₂ 按加入已有 p₁ 后的新 prefix mean 决定；Herding 优化 prefix，不是只挑到目标最近的单点。" : stage === 3 ? "Herding 真正计算每个 prefix 并生成按优先级排列的 Pᵧ。" : stage === 4 ? "容量下降只截断列表尾部，前三个保留样本形成的均值由当前数据重新计算。" : timelineMode === "construct" ? "类别首次到来时用完整 Xᵧ 和当前 post-update φ 构造优先列表。" : "旧类完整数据不可用后，保留已有列表并按新 quota 截断，不再重跑完整 Herding。"}</p></div></section>

      <footer className="icarl-handoff">
        <div><span className="eyebrow">NEXT · PAGE 06</span><p>新类样本与旧 exemplars 怎样进入一次增量更新？</p></div>
        {onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>进入更新前准备 <b aria-hidden="true">→</b></button> : <span className="icarl-handoff__upcoming">下一页</span>}
      </footer>
    </article>
  );
}
