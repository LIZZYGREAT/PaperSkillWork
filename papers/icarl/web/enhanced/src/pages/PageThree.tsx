import { useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { GuidedStepControls, type GuidedStep } from "../components/GuidedStepControls";
import { CLASS_VISUALS, encode2D, mean, samplesForClass, type ClassId, type FeatureState, type Sample, type Vector2 } from "../data/icarl-runtime";

const steps: readonly GuidedStep[] = [
  { title: "样本怎样进入特征空间？", short: "样本 → 特征" },
  { title: "同类特征怎样形成一个中心？", short: "计算均值" },
  { title: "哪个中心决定 query 的类别？", short: "最近原型" },
  { title: "表示变化后，原型何时重算？", short: "更新表示" },
  { title: "旧类完整数据还在吗？", short: "旧数据不可用" },
  { title: "少量保留样本能否近似旧类？", short: "保留少量样本" },
];

const classIds: readonly ClassId[] = ["A", "B", "C"];
const query: Vector2 = [0.4, 2.0];
const allSamples = classIds.flatMap((classId) => samplesForClass(classId));

function classMean(classId: ClassId, state: FeatureState, samples: readonly Sample[] = samplesForClass(classId)): Vector2 {
  return mean(samples.map((sample) => encode2D(sample, state)));
}

function distance(a: Vector2, b: Vector2) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

const prototypeBefore = new Map(classIds.map((id) => [id, classMean(id, "before")]));
const prototypeAfter = new Map(classIds.map((id) => [id, classMean(id, "after")]));
const queryDistances = classIds
  .map((classId) => ({ classId, distance: distance(query, prototypeBefore.get(classId)!) }))
  .sort((a, b) => a.distance - b.distance);
const predictedClass = queryDistances[0].classId;
const retainedSubset = samplesForClass("A").slice(0, 3);

type FormulaFocus = "feature" | "mean" | "distance" | "decision";

function starPath(x: number, y: number) {
  return Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 === 0 ? 9 : 4;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    return `${index === 0 ? "M" : "L"}${x + Math.cos(angle) * radius},${y + Math.sin(angle) * radius}`;
  }).join(" ") + " Z";
}

function FeatureMap({
  stage,
  phase,
  selectedSampleId,
  focus,
  onSelectSample,
}: {
  stage: number;
  phase: number;
  selectedSampleId: string;
  focus: FormulaFocus;
  onSelectSample: (id: string) => void;
}) {
  const points = useMemo(() => {
    if (stage === 0 || stage === 1) return samplesForClass("A");
    if (stage === 2) return allSamples;
    if (stage === 3) return allSamples;
    if (stage === 4) return samplesForClass("A");
    return retainedSubset;
  }, [stage]);

  const currentState: FeatureState = stage === 3 && phase > 0 || stage === 5 ? "after" : "before";
  const chartPoint = (vector: Vector2) => ({ x: 280 + vector[0] * 52, y: 175 - vector[1] * 52 });
  const historicalOnly = stage === 4;
  const showQuery = stage === 2;
  const showMeans = stage === 1 || stage === 2 || stage === 3 && (phase === 0 || phase === 2) || stage === 5;
  const visibleClasses = stage <= 1 || stage >= 4 ? ["A"] as const : classIds;
  const means = visibleClasses.map((classId) => ({
    classId,
    current: stage === 5 ? classMean(classId, "after", retainedSubset) : classMean(classId, currentState),
    old: classMean(classId, "before"),
  }));

  function activatePoint(event: KeyboardEvent<SVGGElement>, sampleId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectSample(sampleId);
    }
  }

  return (
    <div className={`p3-map p3-map--stage-${stage}`}>
      <div className="p3-map__meta"><span>FIXED SYNTHETIC 2D EXAMPLE</span><span>{historicalOnly ? "历史分布 · 当前不可访问" : `当前映射 · φ${currentState === "before" ? "old" : "new"}`}</span><span>所选身份 · {historicalOnly ? "—" : selectedSampleId}</span></div>
      <svg viewBox="0 0 560 350" role="img" aria-label="二维特征空间中，样本点、类别均值与 query 的位置关系">
        <title>Feature space workbench</title>
        <desc>同一编号的样本从输入图像映射到二维特征位置。星形代表由样本计算出的类均值。</desc>
        <defs><marker id="p3-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 8 4 L 0 8" fill="none" stroke="#b88050" strokeWidth="1.2" /></marker></defs>
        <line className="p3-map__axis" x1="50" y1="175" x2="510" y2="175" />
        <line className="p3-map__axis" x1="280" y1="22" x2="280" y2="328" />
        {showMeans && !historicalOnly ? means.map(({ classId, current, old }) => {
          const currentPosition = chartPoint(current);
          const oldPosition = chartPoint(old);
          return <g key={`mean-links-${classId}`}>
            {stage === 1 && classId === "A" ? points.map((sample) => {
              const pos = chartPoint(encode2D(sample, currentState));
              return <line key={`${sample.id}-mean-line`} className="p3-map__mean-link" x1={pos.x} y1={pos.y} x2={currentPosition.x} y2={currentPosition.y} />;
            }) : null}
            {stage === 3 && phase === 2 ? <>
              <path className="p3-map__mean-ghost" d={`M ${oldPosition.x} ${oldPosition.y - 8} L ${oldPosition.x + 8} ${oldPosition.y} L ${oldPosition.x} ${oldPosition.y + 8} L ${oldPosition.x - 8} ${oldPosition.y} Z`} />
              <line className="p3-map__mean-drift" x1={oldPosition.x} y1={oldPosition.y} x2={currentPosition.x} y2={currentPosition.y} />
            </> : null}
            <path className={`p3-map__mean p3-map__mean--${classId}${focus === "mean" || focus === "decision" ? " is-focused" : ""}`} d={starPath(currentPosition.x, currentPosition.y)} />
          </g>;
        }) : null}
        {stage === 3 && phase === 1 ? means.map(({ classId, old }) => {
          const oldPosition = chartPoint(old);
          return <g key={`old-mean-${classId}`}>
            <path className={`p3-map__mean p3-map__mean--${classId}`} d={`M ${oldPosition.x} ${oldPosition.y - 9} L ${oldPosition.x + 9} ${oldPosition.y} L ${oldPosition.x} ${oldPosition.y + 9} L ${oldPosition.x - 9} ${oldPosition.y} Z`} />
            <text className="p3-map__label" x={oldPosition.x + 11} y={oldPosition.y - 10}>μ{classId} · φold</text>
          </g>;
        }) : null}
        {showQuery ? (() => {
          const q = chartPoint(query);
          return <g>
            {classIds.map((classId) => {
              const m = chartPoint(prototypeBefore.get(classId)!);
              return <line key={`q-${classId}`} className={`p3-map__distance${classId === predictedClass || focus === "distance" ? " is-nearest" : ""}`} x1={q.x} y1={q.y} x2={m.x} y2={m.y} />;
            })}
            <circle className={`p3-map__query${focus === "feature" ? " is-focused" : ""}`} cx={q.x} cy={q.y} r="6" />
            <path className="p3-map__query-cross" d={`M ${q.x - 10} ${q.y} H ${q.x + 10} M ${q.x} ${q.y - 10} V ${q.y + 10}`} />
            <text className="p3-map__query-label" x={q.x + 13} y={q.y + 18}>query q</text>
          </g>;
        })() : null}
        {points.map((sample) => {
          const old = encode2D(sample, "before");
          const current = encode2D(sample, currentState);
          const position = chartPoint(current);
          const oldPosition = chartPoint(old);
          const color = CLASS_VISUALS[sample.classId].color;
          const isSelected = !historicalOnly && selectedSampleId === sample.id;
          return <g
            key={`${stage}-${sample.id}`}
            className={`p3-map__point${historicalOnly ? " is-unavailable" : ""}${isSelected ? " is-selected" : ""}${focus === "feature" && isSelected && !showQuery ? " is-focused" : ""}`}
            tabIndex={historicalOnly ? -1 : 0}
            role={historicalOnly ? "img" : "button"}
            aria-label={historicalOnly ? `${CLASS_VISUALS[sample.classId].label}样本 ${sample.id} 的历史位置，目前不可访问` : `${CLASS_VISUALS[sample.classId].label}样本 ${sample.id}，选择以查看图像与特征位置对应关系`}
            onClick={historicalOnly ? undefined : () => onSelectSample(sample.id)}
            onKeyDown={historicalOnly ? undefined : (event) => activatePoint(event, sample.id)}
          >
            {stage === 3 && phase > 0 ? <>
              <line className="p3-map__movement" x1={oldPosition.x} y1={oldPosition.y} x2={position.x} y2={position.y} />
              <circle className="p3-map__old-position" cx={oldPosition.x} cy={oldPosition.y} r="4.5" />
            </> : null}
            <circle cx={position.x} cy={position.y} r={isSelected ? 8 : 6} fill={historicalOnly ? "#cbd2cf" : color} />
            <title>{`${sample.id} ↔ 原始图像身份 ↔ φ(x)`}</title>
          </g>;
        })}
      </svg>
      <div className="p3-map__legend">
        <span><i className={historicalOnly ? "p3-map__legend-ghost" : "p3-map__legend-dot"} />{historicalOnly ? "历史分布 · 当前不可访问" : "特征样本"}</span>
        {(showMeans || stage === 3 && phase === 1) && !historicalOnly ? visibleClasses.map((classId) => <span key={`legend-${classId}`}><i className={`p3-map__legend-mean p3-map__legend-mean--${classId}`} />μ<sub>{classId}</sub>{stage === 3 && phase < 2 ? " · φold" : stage === 3 ? " · φnew" : ""}</span>) : null}
        {stage === 3 && phase > 0 ? <span><i className="p3-map__legend-ghost" />φold 位置</span> : null}
        {showQuery ? <span><i className="p3-map__legend-query" />query q</span> : null}
      </div>
    </div>
  );
}

export function PageThree({ onContinue }: { onContinue?: () => void } = {}) {
  const [stage, setStage] = useState(0);
  const [phase, setPhase] = useState(0);
  const [selectedSampleId, setSelectedSampleId] = useState(samplesForClass("A")[0].id);
  const [focus, setFocus] = useState<FormulaFocus>("feature");
  const selectedSample = allSamples.find((sample) => sample.id === selectedSampleId) ?? allSamples[0];

  function changeStage(nextStage: number) {
    setStage(nextStage);
    if (nextStage === 3) setPhase(0);
  }

  const currentDescription = stage === 0
    ? "每个 feature point 都对应一张样本图像；点选同一编号，追踪 image ↔ φΘ ↔ representation。"
    : stage === 1
      ? "所有 A 类特征共同参与一次均值计算。连线表示纳入聚合，不表示样本被中心吸引。"
      : stage === 2
        ? "query 先进入同一表示空间，再比较到各类均值的欧氏距离；最短距离给出预测。"
        : stage === 3
          ? phase === 0 ? "先更新共享参数 Θ；此刻样本与均值仍在旧映射下。" : phase === 1 ? "固定的样本身份经过新映射后移动；旧均值暂时保留，等待重算。" : "所有样本移动后，才用当前表示重新计算各类均值。" 
          : stage === 4
            ? "问题不是不知道均值怎么算，而是完整旧类样本已不可访问，无法按原式重算真实 μA。"
            : "若长期只保留少量真实旧样本，就能在当前 φ 下重新编码它们；下一页会正式定义这些 exemplar。";

  const shownSourceSamples = stage <= 1 ? samplesForClass("A") : stage === 4 ? [] : stage === 5 ? retainedSubset : [selectedSample];

  return (
    <article className="tutorial-page icarl-page icarl-page--p3">
      <header className="page-heading icarl-page__heading">
        <div className="icarl-page__eyebrow"><span>PAGE 03</span><i /> PROTOTYPE CLASSIFICATION</div>
        <h1>类别原型如何<br className="p3-title-break" />决定预测？</h1>
        <p>把图像变成当前特征表示，以类均值作为 prototype，再选择离 query 最近的类别。表示变化时，原型也必须从当前样本重新计算。</p>
      </header>

      <GuidedStepControls steps={steps} current={stage} onChange={changeStage} label="Page 3 原型分类教学步骤" />

      <section className="p3-workbench" aria-label="样本、特征空间和当前分类规则">
        <section className="panel p3-source">
          <div className="panel-heading"><div><span className="eyebrow">SOURCE</span><h2>样本身份</h2></div><span className="p3-mini-count">{shownSourceSamples.length} 张</span></div>
          <p className="p3-source__intro">点选样本，可在图中定位对应的 feature point。</p>
          <div className="p3-source__samples">
            {shownSourceSamples.map((sample) => (
              <button key={sample.id} type="button" className={`p3-source__sample${selectedSampleId === sample.id ? " is-selected" : ""}`} onClick={() => setSelectedSampleId(sample.id)} aria-pressed={selectedSampleId === sample.id}>
                <span className="p3-source__tile" style={{ "--sample-accent": CLASS_VISUALS[sample.classId].color } as CSSProperties} aria-hidden="true"><i /><i /><i /><i /></span>
                <span><b>{sample.id}</b><small>{CLASS_VISUALS[sample.classId].label} · 合成样本</small></span>
              </button>
            ))}
          </div>
          {stage === 4 ? <div className="p3-source__unavailable"><b>X<sub>A</sub></b><span>完整旧类样本不可访问</span></div> : <div className="p3-source__mapping"><span>IMAGE</span><b>φ<sub>Θ</sub></b><span className="p3-source__mapping-line" aria-hidden="true" /><strong>{selectedSample.id}</strong><small>同一身份，两个表示</small></div>}
        </section>

        <section className="panel p3-space-panel">
          <div className="panel-heading"><div><span className="eyebrow">FEATURE SPACE</span><h2>类别点、均值与 query</h2></div>{stage === 3 ? <span className="p3-phase-badge">{phase + 1} / 3 · {phase === 0 ? "更新 Θ" : phase === 1 ? "移动特征" : "重算均值"}</span> : null}</div>
          <FeatureMap stage={stage} phase={phase} selectedSampleId={selectedSampleId} focus={focus} onSelectSample={setSelectedSampleId} />
          {stage === 3 ? <div className="p3-transition-controls">
            <div><b>{phase === 0 ? "① Θ 更新" : phase === 1 ? "② φΘ 改变，样本位置移动" : "③ 用当前 φΘ 重算 prototype"}</b><span>{phase < 2 ? "依次推进，观察样本先变、均值后变。" : "所有类别均值现已对应新表示。"}</span></div>
            <button type="button" className="icarl-button icarl-button--primary" onClick={() => setPhase((value) => Math.min(2, value + 1))} disabled={phase === 2}>{phase === 0 ? "移动样本" : phase === 1 ? "重算均值" : "已完成"}</button>
          </div> : null}
          <div className="p3-current-caption" aria-live="polite">{currentDescription}</div>
        </section>

        <aside className="panel p3-rule-panel">
          <div className="panel-heading"><div><span className="eyebrow">CURRENT RULE</span><h2>运算与图形联动</h2></div></div>
          {stage >= 4 ? <div className="p3-unavailable-card"><span className="p3-rule-symbol">{stage === 4 ? <>μ<sub>A</sub> = ?</> : <>μ<sub>A</sub> ≈ μ<sub>A,subset</sub></>}</span><b>{stage === 4 ? "完整 X_A 不可访问" : "保留子集的近似中心已计算"}</b><p>{stage === 4 ? "不是均值定义失效，而是求和所需的全部旧样本已经不在训练者可访问的数据中。" : "图中的星形是这 3 个保留样本在当前 φ 下重新编码后得到的均值估计。"}</p></div> : <>
            <div className="p3-formula-list">
              <button type="button" className={focus === "mean" ? "is-active" : ""} onClick={() => setFocus("mean")} aria-pressed={focus === "mean"}><span>类均值</span><strong>μ<sub>y</sub> = (1/|X<sub>y</sub>|) ∑<sub>x ∈ X<sub>y</sub></sub> φ<sub>Θ</sub>(x)</strong></button>
              <button type="button" className={focus === "feature" ? "is-active" : ""} onClick={() => setFocus("feature")} aria-pressed={focus === "feature"}><span>当前表示</span><strong>z = φ<sub>Θ</sub>(x)</strong></button>
              <button type="button" className={focus === "distance" ? "is-active" : ""} onClick={() => setFocus("distance")} aria-pressed={focus === "distance"}><span>距离</span><strong>d = ‖z − μ<sub>y</sub>‖₂</strong></button>
              <button type="button" className={focus === "decision" ? "is-active" : ""} onClick={() => setFocus("decision")} aria-pressed={focus === "decision"}><span>分类决定</span><strong>ŷ = arg min<sub>y</sub> d</strong></button>
            </div>
            {stage === 2 ? <div className="p3-distance-list"><span className="eyebrow">QUERY 距离 · 固定合成值</span>{queryDistances.map(({ classId, distance: value }, index) => <div key={classId} className={index === 0 ? "is-nearest" : ""}><span>μ{classId}</span><b>{value.toFixed(2)}</b><small>{index === 0 ? "最近" : ""}</small></div>)}<strong className="p3-prediction">预测：Class {predictedClass}</strong></div> : null}
          </>}
          {stage === 5 ? <div className="p3-approx-formula">μ<sub>A</sub> ≈ mean&#123;φ<sub>Θ new</sub>(p)&#125;<small>少量保留样本 · Page 4 正式定义</small></div> : null}
          <div className="p3-rule-note"><span>i</span><p><b>Prototype ≠ 权重向量 w<sub>y</sub></b><br />Prototype 从当前样本表示计算；它不是独立通过梯度训练的分类权重。</p></div>
        </aside>
      </section>

      <section className="p3-concept-note" aria-live="polite">
        <span className="p3-concept-note__index">0{stage + 1}</span>
        <div><span className="eyebrow">这一幕要看懂</span><p>{stage === 0 ? "Feature point 不是凭空出现的数据；每一个点都保留了与输入图像的身份对应。" : stage === 1 ? "所有同类特征一次聚合成 class mean。prototype 是这个中心在分类中的角色。" : stage === 2 ? "iCaRL 比较 query 与各类当前均值的距离；本固定示例中最近的是 Class B。" : stage === 3 ? "Θ 先更新，样本表示随后移动，类均值最后才按新表示重算。" : stage === 4 ? "重算旧类真实均值需要完整 X_A；有界记忆使该数据不能被假定一直保留。" : "少量旧样本仍可重新编码，因而有机会近似旧类均值；接下来先定义记忆对象。"}</p></div>
      </section>

      <footer className="icarl-handoff">
        <div><span className="eyebrow">NEXT · PAGE 04</span><p>既然完整旧类数据不能一直保留，iCaRL 长期留下的究竟是什么？</p></div>
        {onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>认识 Exemplar Memory <b aria-hidden="true">→</b></button> : null}
      </footer>
    </article>
  );
}
