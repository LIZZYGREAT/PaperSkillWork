import { useEffect, useMemo, useState } from "react";
import { ChartLabels, FEATURE_FRAME, featureStar, type ChartLabel } from "../components/FeatureChart";
import { GuidedStepControls, type GuidedStep } from "../components/GuidedStepControls";
import { PaperTerm } from "../components/PaperTerm";
import {
  HERDING_DEMO_ORDER,
  HERDING_DEMO_POINTS,
  HERDING_DEMO_QUOTA,
  HERDING_DEMO_ROUNDS,
  HERDING_DEMO_TARGET,
  HERDING_DEMO_TARGET_RAW,
  type HerdingDemoCandidate,
} from "../data/herding-teaching-demo";
import type { Vector2 } from "../data/icarl-runtime";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";

const steps: readonly GuidedStep[] = [
  { title: "什么时候筛选代表，目标是什么？", short: "建立目标" },
  { title: "只有一个名额时怎样选择？", short: "k = 1" },
  { title: "第二张为什么要和第一张一起判断？", short: "k = 2" },
  { title: "第三张怎样形成真实重心？", short: "k = 3" },
  { title: "怎样完成四张有序代表？", short: "k = 4" },
];

const phaseNarratives = [
  [
    "本轮新类表示训练结束后，特征提取器已经稳定；而离开本轮之前，新类的完整图片仍然可用。这正是筛选并保存代表的时机。",
    "八张候选图片先经当前固定模型得到单位特征。完整类别的原始均值汇集所有样本信息，再归一化成目标 μᵧ。",
    "记忆放不下全部图片，所以接下来要找少数样本，使它们的整体特征均值尽量接近这个目标。",
  ],
  ["先只有一个名额。此时候选前缀只含 x 自己，所以 ν₁(x)=z(x)。", "逐个比较候选点到 μᵧ 的距离，最近者成为 p₁。"],
  ["再有第二个名额时，不能简单重复寻找离 μᵧ 最近的单点。", "每个候选都要先和 p₁ 组成两点均值，归一化后再比较；合适的 p₂ 可以补偿第一张代表的偏差。"],
  ["第三轮继续使用同一规则：p₁、p₂ 与候选 x 的三个特征共同求重心。", "这里不是旧均值与候选的普通中点；原始均值必须按三点重新计算，再投到单位圆上评分。"],
  ["第四轮仍逐个比较未选候选，只是复用已经理解的计算并加快节奏。", "每轮只追加一个未选样本，最终得到有固定顺序的四张代表。"],
] as const;

type Point2D = { x: number; y: number };
const CHART = { centerX: FEATURE_FRAME.x, centerY: FEATURE_FRAME.y, radius: FEATURE_FRAME.radius };

function toChartPoint(vector: Vector2): Point2D {
  return { x: CHART.centerX + vector[0] * CHART.radius, y: CHART.centerY - vector[1] * CHART.radius };
}

function diamondPoints(point: Point2D, radius = 6) {
  return `${point.x},${point.y - radius} ${point.x + radius},${point.y} ${point.x},${point.y + radius} ${point.x - radius},${point.y}`;
}

function format(value: number) {
  return value.toFixed(3);
}

function FeatureSpace({ roundIndex, candidate }: { roundIndex: number | null; candidate: HerdingDemoCandidate | null }) {
  const targetRaw = toChartPoint(HERDING_DEMO_TARGET_RAW);
  const target = toChartPoint(HERDING_DEMO_TARGET);
  const selectedBefore = roundIndex === null ? [] : HERDING_DEMO_ORDER.slice(0, roundIndex);
  const selectedIds = new Set(selectedBefore.map((point) => point.id));
  const candidatePoint = candidate ? toChartPoint(candidate.point.feature) : null;
  const rawCandidateMean = candidate ? toChartPoint(candidate.rawPrefixMean) : null;
  const normalizedCandidateMean = candidate ? toChartPoint(candidate.normalizedPrefixMean) : null;
  const previousRawMean = roundIndex && roundIndex > 0 ? toChartPoint(HERDING_DEMO_ROUNDS[roundIndex - 1].rawPrefixMean) : null;
  const labels: ChartLabel[] = [{ ...targetRaw, id: "target-raw", text: "完整类原始均值 μ̄ᵧ" }, { ...target, id: "target", text: "目标 μᵧ" }];
  selectedBefore.forEach((point, index) => labels.push({ ...toChartPoint(point.feature), id: point.id, text: `p${index + 1} · ${point.id}` }));
  if (candidate && candidatePoint) labels.push({ ...candidatePoint, id: `candidate-${candidate.point.id}`, text: `候选 ${candidate.point.id}` });
  if (rawCandidateMean && normalizedCandidateMean && roundIndex !== null && roundIndex > 0) {
    labels.push({ ...rawCandidateMean, id: "candidate-raw-mean", text: `ν̄${roundIndex + 1}(x)` });
    labels.push({ ...normalizedCandidateMean, id: "candidate-mean", text: `ν${roundIndex + 1}(x)` });
  }
  const obstacles = [...HERDING_DEMO_POINTS.map((point) => toChartPoint(point.feature)), targetRaw, target, ...(rawCandidateMean ? [rawCandidateMean] : []), ...(normalizedCandidateMean ? [normalizedCandidateMean] : [])];

  return <svg className="p4-herding-chart" viewBox="0 0 640 520" role="img" aria-label={`单类八个单位特征的 Herding 教学空间。${roundIndex === null ? "当前建立完整类别均值目标。" : `当前第 ${roundIndex + 1} 轮，候选 ${candidate?.point.id ?? "未选择"}。`}`}>
    <title>Herding 候选前缀均值计算</title>
    <desc>八个候选位于单位圆上。完整类别原始均值位于圆内，归一化后得到目标。每轮将已选特征与当前候选求原始均值，再归一化并计算到目标的距离。</desc>
    <line className="p4-axis" x1="24" y1={CHART.centerY} x2="616" y2={CHART.centerY} />
    <line className="p4-axis" x1={CHART.centerX} y1="24" x2={CHART.centerX} y2="496" />
    <circle className="p4-circle" cx={CHART.centerX} cy={CHART.centerY} r={CHART.radius} />
    <line className="p4-target-ray" x1={CHART.centerX} y1={CHART.centerY} x2={targetRaw.x} y2={targetRaw.y} />
    <line className="p4-normalize-ray p4-normalize-ray--target" x1={targetRaw.x} y1={targetRaw.y} x2={target.x} y2={target.y} />
    {candidate && candidatePoint && rawCandidateMean && normalizedCandidateMean ? <>
      {selectedBefore.map((point) => { const position = toChartPoint(point.feature); return <line key={`combine-${point.id}`} className="p4-combine-line" x1={position.x} y1={position.y} x2={candidatePoint.x} y2={candidatePoint.y} />; })}
      {previousRawMean && roundIndex !== null && roundIndex >= 2 ? <line className="p4-weighted-line" x1={previousRawMean.x} y1={previousRawMean.y} x2={candidatePoint.x} y2={candidatePoint.y} /> : null}
      {roundIndex !== null && roundIndex > 0 ? <><line className="p4-prefix-ray" x1={CHART.centerX} y1={CHART.centerY} x2={rawCandidateMean.x} y2={rawCandidateMean.y} /><line className="p4-normalize-ray" x1={rawCandidateMean.x} y1={rawCandidateMean.y} x2={normalizedCandidateMean.x} y2={normalizedCandidateMean.y} /></> : null}
      <line className="p4-score-line" x1={normalizedCandidateMean.x} y1={normalizedCandidateMean.y} x2={target.x} y2={target.y} />
    </> : null}
    {HERDING_DEMO_POINTS.map((point) => {
      const position = toChartPoint(point.feature);
      const isSelected = selectedIds.has(point.id);
      const isCandidate = candidate?.point.id === point.id;
      return <g key={point.id}>{isSelected ? <circle className="p4-selected-ring" cx={position.x} cy={position.y} r="10" /> : null}{isCandidate ? <circle className="p4-candidate-ring" cx={position.x} cy={position.y} r="14" /> : null}<circle className={`p4-data-point${isSelected ? " is-selected" : ""}${isCandidate ? " is-candidate" : ""}`} cx={position.x} cy={position.y} r={isSelected || isCandidate ? 6 : 4.5} />{!isSelected && !isCandidate ? <text className="p4-point-id" x={position.x + 9} y={position.y - 9}>{point.id}</text> : null}</g>;
    })}
    <polygon className="p4-raw-target" points={diamondPoints(targetRaw)} />
    <path className="p4-target" d={featureStar(target.x, target.y)} />
    {rawCandidateMean && normalizedCandidateMean && roundIndex !== null && roundIndex > 0 ? <><polygon className="p4-raw-prefix" points={diamondPoints(rawCandidateMean)} /><path className="p4-prefix" d={featureStar(normalizedCandidateMean.x, normalizedCandidateMean.y)} /></> : null}
    <circle className="p4-origin" cx={CHART.centerX} cy={CHART.centerY} r="2.5" />
    <ChartLabels labels={labels} obstacles={obstacles} />
  </svg>;
}

function RoundFormula({ k }: { k: number }) {
  return <div className="p4-round-formula" aria-label={`第 ${k} 轮候选均值公式`}>
    {k === 1 ? <><b>ν₁(x) = z(x)</b><span>score₁(x) = ‖μᵧ − ν₁(x)‖₂</span></> : null}
    {k === 2 ? <><b>ν̄₂(x) = ½[z(p₁) + z(x)]</b><span>ν₂(x) = normalize(ν̄₂(x))</span></> : null}
    {k === 3 ? <><b>ν̄₃(x) = ⅓[z(p₁) + z(p₂) + z(x)]</b><span>ν₃(x) = normalize(ν̄₃(x))</span></> : null}
    {k === 4 ? <><b>ν̄₄(x) = ¼[z(p₁) + z(p₂) + z(p₃) + z(x)]</b><span>ν₄(x) = normalize(ν̄₄(x))</span></> : null}
    {k > 1 ? <span>score<sub>{k}</sub>(x) = ‖μᵧ − ν<sub>{k}</sub>(x)‖₂</span> : null}
  </div>;
}

function OrderedSlots({ count }: { count: number }) {
  return <div className="p4-slots" aria-label={`已确定 ${count} 个有序 exemplar`}>{Array.from({ length: HERDING_DEMO_QUOTA }, (_, index) => { const point = HERDING_DEMO_ORDER[index]; const filled = index < count; return <span key={index} className={filled ? "is-filled" : ""}><b>p<sub>{index + 1}</sub></b><small>{filled ? point.id : "待选择"}</small></span>; })}</div>;
}

export function PageFour({ onContinue }: { onContinue?: () => void }) {
  const [stage, setStage] = useState(0);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reducedMotion = useReducedMotion();
  const roundIndex = stage === 0 ? null : stage - 1;
  const round = roundIndex === null ? null : HERDING_DEMO_ROUNDS[roundIndex];
  const candidates = useMemo(() => round ? [...round.candidates].sort((a, b) => a.point.id.localeCompare(b.point.id)) : [], [round]);
  const activeCandidate = candidates[candidateIndex] ?? null;

  useEffect(() => { setCandidateIndex(0); setPlaying(false); }, [stage]);
  useEffect(() => {
    if (!playing || reducedMotion || candidates.length < 2) return;
    const timer = window.setInterval(() => setCandidateIndex((current) => { if (current >= candidates.length - 1) { setPlaying(false); return current; } return current + 1; }), stage === 2 ? 1200 : stage === 3 ? 800 : 550);
    return () => window.clearInterval(timer);
  }, [candidates.length, playing, reducedMotion, stage]);

  function replayCandidates() { setCandidateIndex(0); if (!reducedMotion) setPlaying(true); }

  return <article className="tutorial-page icarl-page icarl-page--p4">
    <header className="page-heading icarl-page__heading">
      <div className="icarl-page__eyebrow"><span>PAGE 04</span><i /> EXEMPLAR SELECTION &amp; MANAGEMENT</div>
      <h1>怎样找到少量代表，<br className="p4-title-break" />并让它们共同代表整个类别？</h1>
      <p>P3 已经说明拿到少量代表图片后怎样预测，却暂时假定它们已经存在。现在从一个独立的单类 8→4 教学示例出发，沿着实际计算看懂 <PaperTerm termId="herding">Herding</PaperTerm> 怎样逐轮构造有序 Exemplars。</p>
    </header>
    <GuidedStepControls steps={steps} current={stage} onChange={setStage} label="Page 4 Herding 四轮计算教学步骤" />
    <section className="p4-reasoning" aria-live="polite"><span>0{stage + 1}</span><div><b>为什么进行这一步</b>{phaseNarratives[stage].map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>
    <div className="p4-example-note"><span>INDEPENDENT SYNTHETIC EXAMPLE · ONE CLASS</span><b>8 张候选 → 4 张有序 Exemplars</b><small>不复用 P3 的 P_BEFORE，也不改变共享运行时或完整运行演示的数据。</small></div>
    <section className="p4-workbench" aria-label="Herding 逐轮候选均值计算">
      <section className="panel p4-space-panel">
        <div className="panel-heading"><div><span className="eyebrow">FEATURE SPACE</span><h2>完整类别目标与候选前缀均值</h2></div><span className="p4-unit-badge">‖z(x)‖₂ = 1</span></div>
        <FeatureSpace roundIndex={roundIndex} candidate={activeCandidate} />
        <div className="p4-legend"><span><i className="p4-legend__point" />8 个单位候选特征</span><span><i className="p4-legend__raw" />完整类原始均值 μ̄<sub>y</sub></span><span><i className="p4-legend__target">★</i>归一化目标 μ<sub>y</sub></span>{round ? <><span><i className="p4-legend__candidate" />当前候选</span><span><i className="p4-legend__score" />候选均值到目标的距离</span></> : null}</div>
        {round ? <div className="p4-candidate-controls"><div><button type="button" onClick={() => setPlaying(!playing)} disabled={reducedMotion}>{playing ? "暂停扫描" : "播放扫描"}</button><button type="button" onClick={replayCandidates}>重新播放</button></div><span aria-live="polite">候选 {candidateIndex + 1} / {candidates.length} · {activeCandidate?.point.id}</span></div> : null}
      </section>
      <aside className="panel p4-calculation-panel">
        <div className="panel-heading"><div><span className="eyebrow">CURRENT CALCULATION</span><h2>{round ? `第 ${round.k} 轮 · 比较候选组合` : "先建立完整类别的代表目标"}</h2></div>{round ? <span className="p4-k-badge">k = {round.k}</span> : null}</div>
        {!round ? <><div className="p4-target-equation"><span>8 个 z(x)</span><i>→</i><b>mean</b><i>→</i><strong>μ̄<sub>y</sub></strong><i>→</i><b>normalize</b><i>→</i><em>μ<sub>y</sub></em></div><div className="p4-target-values"><span>μ̄<sub>y</sub><b>({format(HERDING_DEMO_TARGET_RAW[0])}, {format(HERDING_DEMO_TARGET_RAW[1])})</b></span><span>μ<sub>y</sub><b>({format(HERDING_DEMO_TARGET[0])}, {format(HERDING_DEMO_TARGET[1])})</b></span></div><p className="p4-explain">◇ μ̄<sub>y</sub> 通常位于圆内；★ μ<sub>y</sub> 才是归一化后、随后所有候选都要逼近的单位目标。</p></> : <>
          <div className="p4-main-formula"><b>p<sub>k</sub> = arg min<sub>x∈Xᵧ</sub></b><span>‖ μ<sub>y</sub> − (1/k)[z(x)+Σ<sub>j=1</sub><sup>k−1</sup>z(p<sub>j</sub>)] ‖₂</span><small>公式沿用论文省略均值归一化记号的约定；图与分数先 normalize 括号内均值，再和单位目标 μ<sub>y</sub> 比较。</small></div>
          <RoundFormula k={round.k} />
          <div className="p4-selected-prefix"><span>已选前缀</span><b>{round.k === 1 ? "∅" : HERDING_DEMO_ORDER.slice(0, round.k - 1).map((point, index) => `p${index + 1}=${point.id}`).join(" · ")}</b></div>
          {activeCandidate ? <div className="p4-active-values"><span>当前候选<b>x = {activeCandidate.point.id}</b></span><span>原始均值<b>({format(activeCandidate.rawPrefixMean[0])}, {format(activeCandidate.rawPrefixMean[1])})</b></span><span>归一化均值<b>({format(activeCandidate.normalizedPrefixMean[0])}, {format(activeCandidate.normalizedPrefixMean[1])})</b></span><span>距离分数<b>{format(activeCandidate.score)}</b></span></div> : null}
          <div className="p4-candidate-grid" role="group" aria-label={`第 ${round.k} 轮未选候选`}>{candidates.map((candidate, index) => <button key={candidate.point.id} type="button" className={`${index === candidateIndex ? "is-active" : ""}${candidate.point.id === round.chosen.id ? " is-winner" : ""}`} aria-pressed={index === candidateIndex} onClick={() => { setCandidateIndex(index); setPlaying(false); }}><span>{candidate.point.id}</span><b>{format(candidate.score)}</b></button>)}</div>
          <div className="p4-winner"><span>本轮最小分数</span><b>p<sub>{round.k}</sub> = {round.chosen.id}</b><strong>d = {format(round.score)}</strong></div>
          {round.k === 2 ? <p className="p4-key-insight">p₂ 的好坏取决于它和 p₁ 组成的均值，而不是它单独离 μ<sub>y</sub> 多近。图中的线段中点是 ν̄₂(x)，再沿原点方向投到圆上得到实际评分的 ν₂(x)。</p> : null}
          {round.k === 3 ? <p className="p4-key-insight">ν̄₃(x) 是三个点的重心；等价地可由 (2ν̄₂ + z(x))/3 更新，但不能把已经单位化的 ν₂ 当作原始均值。</p> : null}
        </>}
      </aside>
    </section>
    <section className="p4-order-panel panel"><div><span className="eyebrow">ORDERED OUTPUT</span><h2>每轮只追加一个未选样本</h2></div><OrderedSlots count={stage} /></section>
    <details className="p4-pseudocode"><summary>查看与当前动画同步的短伪代码</summary><div><code>输入：完整图片 X_y、已完成本轮训练的特征提取器 φ、名额 m=4</code><code className={stage === 0 ? "is-active" : ""}>μ ← normalize(mean({`{ normalize(φ(x)) | x ∈ X_y }`}))</code><code>P ← []</code><code className={stage > 0 ? "is-active" : ""}>for k = 1..m:</code><code className={stage > 0 ? "is-active" : ""}>　对每个未选候选 x：candidate_mean ← normalize(mean(P 中特征 + z(x)))</code><code className={stage > 0 ? "is-active" : ""}>　score(x) ← ‖ μ − candidate_mean ‖₂</code><code className={stage > 0 ? "is-active" : ""}>　p_k ← score 最小的候选；P.append(p_k)</code></div></details>
    <footer className="icarl-handoff"><div><span className="eyebrow">NEXT · PREFIX &amp; BUDGET</span><p>四轮选择已经得到一条有序列表。下一步回看每个前缀，并理解类别增多、每类容量缩小时为什么只需删除列表尾部。</p></div>{onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>继续理解 Exemplar 管理 <b aria-hidden="true">→</b></button> : null}</footer>
  </article>;
}
