import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { GuidedStepControls, type GuidedStep } from "../components/GuidedStepControls";
import { PaperTerm } from "../components/PaperTerm";
import { ClassFeatureMarker } from "../components/FeatureSpaceWorkbench";
import { CLASS_VISUALS, encode2D, encodeRawVector, euclideanDistance, mean, normalize, P_BEFORE, type ClassId, type Vector2 } from "../data/icarl-runtime";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";

const steps: readonly GuidedStep[] = [
  { title: "已保留图片怎样变成可比较的特征？", short: "图片变特征" },
  { title: "同类特征怎样形成类别原型？", short: "计算类别原型" },
  { title: "新的 Query 怎样进入同一空间？", short: "输入 Query" },
  { title: "怎样依据最近原型输出预测？", short: "最近原型预测" },
];

const classIds: readonly ClassId[] = ["A", "B", "C"];
const exemplarByClass = new Map(classIds.map((classId) => [classId, P_BEFORE[classId]]));
const exemplars = classIds.flatMap((classId) => exemplarByClass.get(classId)!);
const queryInput: Vector2 = [1.732, -1.0];
const queryRawFeature = encodeRawVector(queryInput, "before");
const queryFeature = normalize(queryRawFeature);
const chartOrigin = { x: 320, y: 260 };
const chartScale = 180;

type PrototypeCalculation = {
  classId: ClassId;
  features: [number, number][];
  rawMean: [number, number];
  prototype: [number, number];
};

const prototypeCalculations: PrototypeCalculation[] = classIds.map((classId) => {
  const features = exemplarByClass.get(classId)!.map((sample) => normalize(encode2D(sample, "before")));
  const rawMean = mean(features);
  return { classId, features, rawMean, prototype: normalize(rawMean) };
});

const prototypeByClass = new Map(prototypeCalculations.map((item) => [item.classId, item.prototype]));
const queryComparisons = prototypeCalculations
  .map(({ classId, prototype }) => {
    const cosine = Math.max(-1, Math.min(1, queryFeature[0] * prototype[0] + queryFeature[1] * prototype[1]));
    return {
      classId,
      distance: euclideanDistance(queryFeature, prototype),
      angle: Math.acos(cosine) * 180 / Math.PI,
    };
  })
  .sort((a, b) => a.distance - b.distance || a.classId.localeCompare(b.classId));
const predictedClass = queryComparisons[0].classId;

function chartPoint(vector: Vector2) {
  return { x: chartOrigin.x + vector[0] * chartScale, y: chartOrigin.y - vector[1] * chartScale };
}

function shortestAngleArc(from: Vector2, to: Vector2, radius: number) {
  const start = Math.atan2(from[1], from[0]);
  const end = Math.atan2(to[1], to[0]);
  let delta = end - start;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const arcEnd = start + delta;
  const startPoint = { x: chartOrigin.x + Math.cos(start) * radius, y: chartOrigin.y - Math.sin(start) * radius };
  const endPoint = { x: chartOrigin.x + Math.cos(arcEnd) * radius, y: chartOrigin.y - Math.sin(arcEnd) * radius };
  return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 0 ${delta >= 0 ? 0 : 1} ${endPoint.x} ${endPoint.y}`;
}

const prototypeLabelPlacement: Record<ClassId, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  A: { dx: 18, dy: -10, anchor: "start" },
  B: { dx: 0, dy: -19, anchor: "middle" },
  C: { dx: -18, dy: -9, anchor: "end" },
  D: { dx: 18, dy: 18, anchor: "start" },
};

const meanLabelPlacement: Record<ClassId, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  A: { dx: -13, dy: 22, anchor: "end" },
  B: { dx: -14, dy: 23, anchor: "end" },
  C: { dx: 13, dy: 23, anchor: "start" },
  D: { dx: 13, dy: -15, anchor: "start" },
};

function FeatureMap({
  stage,
  selectedSampleId,
  onSelectSample,
}: {
  stage: number;
  selectedSampleId: string;
  onSelectSample: (id: string) => void;
}) {
  const selectedSample = exemplars.find((sample) => sample.id === selectedSampleId) ?? exemplars[0];
  const showPrototypes = stage >= 1;
  const showQuery = stage >= 2;
  const showDecision = stage === 3;
  const normalizedPoints = exemplars.map((sample) => ({ sample, position: chartPoint(normalize(encode2D(sample, "before"))) }));
  function activatePoint(event: KeyboardEvent<SVGGElement>, sampleId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectSample(sampleId);
    }
  }

  return (
    <div className={`p3-map p3-map--stage-${stage}`}>
      <div className="p3-map__meta">
        <span>FIXED SYNTHETIC · 2D TEACHING SPACE</span>
        <span>所选 {selectedSampleId} · φ<sub>Θ fixed</sub></span>
      </div>
      <svg viewBox="0 0 640 520" role="img" aria-label="十二张已保留图片的单位化特征、三类原型和查询特征构成的固定二维教学空间">
        <title>Exemplar prototype prediction</title>
        <desc>十二张 Exemplar 图片经过同一个固定特征提取器。第二步同时显示圆内均值和归一化后的原型；第三步加入独立 Query；第四步用圆弧展示 Query 与三个原型的方向夹角，并显示 Query 到原型的距离。</desc>
        <circle className="p3-map__unit-circle" cx={chartOrigin.x} cy={chartOrigin.y} r={chartScale} />
        <line className="p3-map__axis" x1="24" y1={chartOrigin.y} x2="616" y2={chartOrigin.y} />
        <line className="p3-map__axis" x1={chartOrigin.x} y1="14" x2={chartOrigin.x} y2="506" />

        {stage === 0 ? exemplars.map((sample) => {
          const rawPosition = chartPoint(encode2D(sample, "before"));
          const normalizedPosition = chartPoint(normalize(encode2D(sample, "before")));
          const isSelected = sample.id === selectedSampleId;
          return <g key={`raw-${sample.id}`} className={`p3-map__normalization${isSelected ? " is-selected" : ""}`} style={{ "--p3-point-color": CLASS_VISUALS[sample.classId].color } as CSSProperties}>
            {isSelected ? <line className="p3-map__radial-ray" x1={chartOrigin.x} y1={chartOrigin.y} x2={normalizedPosition.x} y2={normalizedPosition.y} /> : null}
            <circle className="p3-map__raw-point" cx={rawPosition.x} cy={rawPosition.y} r={isSelected ? 4 : 2.8} />
          </g>;
        }) : null}

        {stage === 1 ? prototypeCalculations.map(({ classId, rawMean, prototype }) => {
          const meanPosition = chartPoint(rawMean);
          const prototypePosition = chartPoint(prototype);
          return <g key={`calculation-${classId}`} style={{ "--p3-point-color": CLASS_VISUALS[classId].color } as CSSProperties}>
            <line className="p3-map__radial-ray" x1={chartOrigin.x} y1={chartOrigin.y} x2={prototypePosition.x} y2={prototypePosition.y} />
            <circle className="p3-map__raw-mean" cx={meanPosition.x} cy={meanPosition.y} r="10" />
          </g>;
        }) : null}

        {showPrototypes && stage !== 1 ? prototypeCalculations.map(({ classId, prototype }) => {
          const position = chartPoint(prototype);
          return <line key={`prototype-ray-${classId}`} className="p3-map__radial-ray" x1={chartOrigin.x} y1={chartOrigin.y} x2={position.x} y2={position.y} style={{ "--p3-point-color": CLASS_VISUALS[classId].color } as CSSProperties} />;
        }) : null}

        {showQuery ? (() => {
          const position = chartPoint(queryFeature);
          return <line className="p3-map__radial-ray p3-map__radial-ray--query" x1={chartOrigin.x} y1={chartOrigin.y} x2={position.x} y2={position.y} />;
        })() : null}

        {showDecision ? queryComparisons.map(({ classId }, index) => {
          const queryPosition = chartPoint(queryFeature);
          const prototypePosition = chartPoint(prototypeByClass.get(classId)!);
          return <g key={`comparison-${classId}`} style={{ "--p3-point-color": CLASS_VISUALS[classId].color } as CSSProperties}>
            <line className={`p3-map__distance${index === 0 ? " is-nearest" : ""}`} x1={queryPosition.x} y1={queryPosition.y} x2={prototypePosition.x} y2={prototypePosition.y} />
            <path className={`p3-map__angle${index === 0 ? " is-nearest" : ""}`} d={shortestAngleArc(queryFeature, prototypeByClass.get(classId)!, 38 + index * 17)} />
          </g>;
        }) : null}

        {normalizedPoints.map(({ sample, position }) => {
          const isSelected = sample.id === selectedSampleId;
          const color = CLASS_VISUALS[sample.classId].color;
          return <g
            key={sample.id}
            className={`p3-map__point${isSelected ? " is-selected" : ""}`}
            tabIndex={0}
            role="button"
            aria-label={`${CLASS_VISUALS[sample.classId].displayLabel} 已保留样本 ${sample.id}；选择以联动左栏身份`}
            onClick={() => onSelectSample(sample.id)}
            onKeyDown={(event) => activatePoint(event, sample.id)}
          >
            <ClassFeatureMarker className="p3-map__normalized-point" classId={sample.classId} x={position.x} y={position.y} radius={isSelected ? 4.4 : 3.3} selected={false} fillOverride={color} />
            <title>{`${sample.id} · P_BEFORE[${sample.classId}] · z_p`}</title>
          </g>;
        })}

        {showPrototypes ? prototypeCalculations.map(({ classId, prototype }) => {
          const position = chartPoint(prototype);
          const label = prototypeLabelPlacement[classId];
          return <g key={`prototype-${classId}`}>
            <path className={`p3-map__prototype p3-map__prototype--${classId}`} d={`M ${position.x - 7} ${position.y - 7} h 14 v 14 h -14 Z`} />
            <text className="p3-map__direct-label" x={position.x + label.dx} y={position.y + label.dy} textAnchor={label.anchor}>μ{CLASS_VISUALS[classId].index}</text>
          </g>;
        }) : null}

        {stage === 1 ? prototypeCalculations.map(({ classId, rawMean }) => {
          const position = chartPoint(rawMean);
          const label = meanLabelPlacement[classId];
          return <text key={`mean-label-${classId}`} className="p3-map__direct-label p3-map__direct-label--mean" x={position.x + label.dx} y={position.y + label.dy} textAnchor={label.anchor}>z̄{CLASS_VISUALS[classId].index}</text>;
        }) : null}

        {stage === 2 ? (() => {
          const rawPosition = chartPoint(queryRawFeature);
          return <g className="p3-map__query-normalization">
            <circle cx={rawPosition.x} cy={rawPosition.y} r="4" />
          </g>;
        })() : null}

        {showQuery ? (() => {
          const position = chartPoint(queryFeature);
          return <g>
            <path className="p3-map__query" d={`M ${position.x} ${position.y - 9} l 9 9 l -9 9 l -9 -9 Z`} />
            <text className="p3-map__direct-label p3-map__direct-label--query" x={position.x + 17} y={position.y - 12}>zq</text>
          </g>;
        })() : null}

        {stage === 0 ? (() => {
          const position = normalizedPoints.find(({ sample }) => sample.id === selectedSampleId)!.position;
          return <text className="p3-map__direct-label p3-map__direct-label--sample" x={position.x + 12} y={position.y - 10}>{selectedSample.id}</text>;
        })() : null}

        <circle className="p3-map__origin" cx={chartOrigin.x} cy={chartOrigin.y} r="3.2" />
      </svg>
      <div className="p3-map__legend">
        <span><i className="p3-map__legend-unit-circle" />虚线圆：单位圆（‖z‖₂=1）</span>
        {stage === 0 ? <span><i className="p3-map__legend-raw" />未单位化特征 f<sub>Θ</sub>(p)</span> : null}
        <span><i className="p3-map__legend-dot" />外圈彩色点：12 个单位化 Exemplar 特征 z<sub>p</sub></span>
        {stage === 1 ? <span><i className="p3-map__legend-raw-mean" />圆内均值 z̄<sub>y</sub></span> : null}
        {showPrototypes ? <span><i className="p3-map__legend-prototype" />方框：类别 Prototype μ<sub>y</sub></span> : null}
        {stage >= 1 ? <span><i className="p3-map__legend-ray" />圆心径向虚线：单位向量方向</span> : null}
        {stage === 2 ? <span><i className="p3-map__legend-query-raw" />空心点：归一化前的 Query 特征 f<sub>Θ</sub>(x<sub>q</sub>)</span> : null}
        {showQuery ? <span><i className="p3-map__legend-query" />菱形：单位化 Query 特征 z<sub>q</sub></span> : null}
        {showDecision ? <span><i className="p3-map__legend-angle" />彩色圆弧：z<sub>q</sub> 与 μ<sub>y</sub> 的夹角 θ<sub>y</sub></span> : null}
        {showDecision ? <span><i className="p3-map__legend-distance" />Query 到 Prototype 的距离</span> : null}
      </div>
    </div>
  );
}

const stageNarratives = [
  "P_BEFORE 中三类各有四张原始图片。先用当前固定的 Feature Extractor 编码，并将每张特征单位化；这一步只形成可比较的 Exemplar Features。",
  "单张图容易受个体差异影响，所以对每类四个单位特征先求均值、再 L2 归一化，得到该类用于预测的 Prototype。",
  "新的 Query 不属于这十二张 Exemplar；它经过同一个固定特征提取器并单位化，三个 Prototype 在此步保持不变。",
  "分别比较 Query 与三个 Prototype 的欧氏距离，最近者给出预测；这次推断只读取当前模型与 Exemplar Memory，不更新它们。",
] as const;

export function PageThree({ onContinue }: { onContinue?: () => void } = {}) {
  const [stage, setStage] = useState(0);
  const [selectedSampleId, setSelectedSampleId] = useState(P_BEFORE.A[0].id);
  const reducedMotion = useReducedMotion();
  const workbenchRef = useRef<HTMLElement | null>(null);
  const selectedSample = exemplars.find((sample) => sample.id === selectedSampleId) ?? exemplars[0];

  return (
    <article className="tutorial-page icarl-page icarl-page--p3">
      <header className="page-heading icarl-page__heading">
        <div className="icarl-page__eyebrow"><span>PAGE 03</span><i /> PROTOTYPE CLASSIFICATION</div>
        <h1>已选代表图片怎样<br className="p3-title-break" />完成一次预测？</h1>
        <p>先假定三类代表图片已经选好，并且 Feature Extractor 训练完成、暂时固定。让这些 Exemplars 和一张新 Query 进入同一特征空间，看看 iCaRL 怎样用它们完成预测。</p>
        <button type="button" className="icarl-button icarl-button--primary p3-start-button" onClick={() => workbenchRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" })}>开始演示 <b aria-hidden="true">↓</b></button>
      </header>

      <details className="p3-chapter-jumps">
        <summary>章节快速定位 · 4 个阶段</summary>
        <GuidedStepControls steps={steps} current={stage} onChange={(nextStage) => {
          setStage(nextStage);
          requestAnimationFrame(() => workbenchRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }));
        }} label="Page 3 最近原型预测阶段快速定位" />
      </details>

      <section className="p3-workbench" aria-label="已保留图片、特征空间和当前预测规则" data-stage={stage} ref={workbenchRef}>
        <header className="p3-workbench__heading">
          <div><span className="eyebrow">STEP {stage + 1} / 4 · {steps[stage].short}</span><h2>{steps[stage].title}</h2><p aria-live="polite">{stageNarratives[stage]}</p></div>
          <span className="p3-phase-badge">{String(stage + 1).padStart(2, "0")} / 04</span>
        </header>

        <div className="p3-workbench__layout">
          <section className="panel p3-source">
            <div className="panel-heading"><div><span className="eyebrow">SOURCE</span><h2>已保留 Exemplars</h2></div><span className="p3-mini-count">12 张</span></div>
            <div className="p3-source__samples p3-source__samples--grouped">
              {classIds.map((classId) => {
                const classSamples = exemplarByClass.get(classId)!;
                return <section className="p3-source__group" key={classId} style={{ "--p3-group-color": CLASS_VISUALS[classId].color } as CSSProperties}>
                  <div><b>{CLASS_VISUALS[classId].displayLabel}</b><span>P<sub>{CLASS_VISUALS[classId].index}</sub> · {classSamples.length} 张</span></div>
                  <div>{classSamples.map((sample) => (
                    <button key={sample.id} type="button" className={`p3-source__sample${selectedSampleId === sample.id ? " is-selected" : ""}`} onClick={() => setSelectedSampleId(sample.id)} aria-pressed={selectedSampleId === sample.id} title={`${CLASS_VISUALS[sample.classId].displayLabel} · ${sample.id}`}>
                      <i aria-hidden="true" style={{ color: CLASS_VISUALS[sample.classId].color }}>{CLASS_VISUALS[sample.classId].glyph}</i><b>{sample.id}</b>
                    </button>
                  ))}</div>
                </section>;
              })}
            </div>
            <div className="p3-source__mapping" aria-label={`已保留图片 ${selectedSample.id} 经固定特征提取器得到单位化特征`}><span>当前图片</span><strong>{selectedSample.id} → φ<sub>Θ fixed</sub> → z<sub>p</sub></strong></div>
            {stage >= 2 ? <div className="p3-query-source"><span>独立的新输入</span><b>x<sub>q</sub></b><p>Query 不属于上面的十二张 Exemplar。</p></div> : null}
          </section>

          <section className="panel p3-space-panel">
            <div className="panel-heading"><div><span className="eyebrow">FEATURE SPACE</span><h2>单位特征、Prototype 与 Query</h2></div></div>
            <FeatureMap stage={stage} selectedSampleId={selectedSampleId} onSelectSample={setSelectedSampleId} />
          </section>

          <aside className="panel p3-rule-panel" aria-live="polite">
            <div className="panel-heading"><div><span className="eyebrow">CURRENT RULE</span><h2>本步的计算与结果</h2></div></div>
            {stage === 0 ? <div className="p3-rule-stack"><div className="p3-rule-card is-active"><span>图像进入单位特征空间</span><strong>z<sub>p</sub> = normalize(φ<sub>Θ</sub>(p))</strong></div><p className="p3-state-boundary">得到三组单位化特征；尚未计算 Prototype，也尚未输入 Query。</p></div> : null}
            {stage === 1 ? <div className="p3-rule-stack"><div className="p3-rule-card is-active"><span>每类四个 Exemplar Features</span><strong>z̄<sub>y</sub> = ¼ Σ z<sub>p</sub>　→　μ<sub>y</sub> = normalize(z̄<sub>y</sub>)</strong></div><p className="p3-state-boundary">圆内标记是均值 z̄<sub>y</sub>；单位圆上的方框 Prototype μ<sub>y</sub> 才用于分类。</p></div> : null}
            {stage === 2 ? <div className="p3-rule-stack"><div className="p3-rule-card is-active"><span>Query 使用同一个固定模型</span><strong>z<sub>q</sub> = normalize(φ<sub>Θ fixed</sub>(x<sub>q</sub>))</strong></div><p className="p3-state-boundary">三个 Prototype 保持不变；Query 只进入预测，不加入 Exemplar Memory。</p></div> : null}
            {stage === 3 ? <>
              <div className="p3-rule-stack"><div className="p3-rule-card is-active"><span>最近原型分类</span><strong>ŷ = arg min<sub>y</sub> ‖z<sub>q</sub> − μ<sub>y</sub>‖<sub>2</sub></strong></div><p className="p3-prediction">预测类别：{CLASS_VISUALS[predictedClass].displayLabel}</p><p className="p3-state-boundary">推断读取当前模型与 Exemplar Memory，不改变 Θ 或 P。</p></div>
              <details className="p3-distance-details"><summary>查看三个类别的距离与夹角</summary><div className="p3-distance-list"><span className="eyebrow">Synthetic 2D teaching example</span>{queryComparisons.map(({ classId, distance, angle }, index) => <div key={classId} className={index === 0 ? "is-nearest" : ""}><span>μ<sub>{CLASS_VISUALS[classId].index}</sub></span><b>d = {distance.toFixed(3)}</b><em>θ = {angle.toFixed(1)}°</em><small>{index === 0 ? "最近" : ""}</small></div>)}</div></details>
              <details className="p3-normalized-note"><summary>为什么最近距离也对应最小夹角？</summary><div><p>因为 z<sub>q</sub> 与 μ<sub>y</sub> 都是单位向量：</p><code>d<sub>y</sub><sup>2</sup> = 2 − 2z<sub>q</sub><sup>T</sup>μ<sub>y</sub> = 2 − 2cos θ<sub>y</sub></code><p>论文的规则是最近 Prototype；夹角是单位化条件下的等价几何解释。</p></div></details>
            </> : null}
          </aside>
        </div>

        <div className="p3-workbench__controls" aria-label="Page 3 教学步骤控制">
          <button type="button" className="icarl-button icarl-button--quiet" onClick={() => setStage((current) => Math.max(0, current - 1))} disabled={stage === 0}>上一步</button>
          <span aria-live="polite">{String(stage + 1).padStart(2, "0")} / 04 · {steps[stage].short}</span>
          <button type="button" className="icarl-button icarl-button--primary" onClick={() => stage < 3 ? setStage(stage + 1) : onContinue?.()} disabled={stage === 3 && !onContinue}>{stage === 3 ? "进入第 4 页" : "下一步"} <b aria-hidden="true">→</b></button>
        </div>
      </section>

      <footer className="icarl-handoff">
        <div><span className="eyebrow">NEXT · PAGE 04</span><p>这次预测依赖已经选好的 Exemplars；刚才我们暂时假定这些代表已经存在。下一页追问它们从哪里来，以及预算变紧时怎样管理。</p></div>
        {onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>筛选与管理代表样本 <b aria-hidden="true">→</b></button> : null}
      </footer>
    </article>
  );
}
