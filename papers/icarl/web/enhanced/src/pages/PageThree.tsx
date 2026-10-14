import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
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
const chartOrigin = { x: 320, y: 280 };
const chartScale = 175;
const stageDurations = [5200, 5600, 3600, 5600] as const;

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

const plottedVectors: { id: string; vector: Vector2 }[] = [
  ...exemplars.flatMap((sample) => [
    { id: `${sample.id}:raw`, vector: encode2D(sample, "before") },
    { id: `${sample.id}:unit`, vector: normalize(encode2D(sample, "before")) },
  ]),
  ...prototypeCalculations.flatMap((item) => [
    { id: `${item.classId}:mean`, vector: item.rawMean },
    { id: `${item.classId}:prototype`, vector: item.prototype },
  ]),
  { id: "query:raw", vector: queryRawFeature },
  { id: "query:unit", vector: queryFeature },
];
plottedVectors.forEach(({ id, vector }) => {
  const point = chartPoint(vector);
  if (point.x < 12 || point.x > 628 || point.y < 12 || point.y > 548) throw new Error(`P3 plot point ${id} is outside the safe viewport.`);
});

function clamp(value: number) { return Math.max(0, Math.min(1, value)); }
function ease(value: number) { const t = clamp(value); return t * t * (3 - 2 * t); }
function lerp(a: number, b: number, progress: number) { return a + (b - a) * ease(progress); }
function lerpVector(a: Vector2, b: Vector2, progress: number): [number, number] {
  return [lerp(a[0], b[0], progress), lerp(a[1], b[1], progress)];
}

function shortestAngleArc(from: Vector2, to: Vector2, radius: number, progress = 1) {
  const start = Math.atan2(from[1], from[0]);
  const end = Math.atan2(to[1], to[0]);
  let delta = end - start;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const arcEnd = start + delta * ease(progress);
  const startPoint = { x: chartOrigin.x + Math.cos(start) * radius, y: chartOrigin.y - Math.sin(start) * radius };
  const endPoint = { x: chartOrigin.x + Math.cos(arcEnd) * radius, y: chartOrigin.y - Math.sin(arcEnd) * radius };
  return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 0 ${delta >= 0 ? 0 : 1} ${endPoint.x} ${endPoint.y}`;
}

const prototypeLabelPlacement: Record<ClassId, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  A: { dx: 18, dy: -10, anchor: "start" },
  B: { dx: 0, dy: -19, anchor: "middle" },
  C: { dx: -18, dy: -9, anchor: "end" },
  D: { dx: 18, dy: 18, anchor: "start" },
  E: { dx: -18, dy: 17, anchor: "end" },
  F: { dx: 18, dy: -16, anchor: "start" },
};

const meanLabelPlacement: Record<ClassId, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  A: { dx: -13, dy: 22, anchor: "end" },
  B: { dx: -14, dy: 23, anchor: "end" },
  C: { dx: 13, dy: 23, anchor: "start" },
  D: { dx: 13, dy: -15, anchor: "start" },
  E: { dx: -14, dy: -16, anchor: "end" },
  F: { dx: 15, dy: 17, anchor: "start" },
};

function FeatureMap({
  stage,
  progress,
  selectedSampleId,
  onSelectSample,
}: {
  stage: number;
  progress: number;
  selectedSampleId: string;
  onSelectSample: (id: string) => void;
}) {
  const selectedSample = exemplars.find((sample) => sample.id === selectedSampleId) ?? exemplars[0];
  const showPrototypes = stage >= 1;
  const showQuery = stage >= 2;
  const showDecision = stage === 3;
  const sampleOrder = [selectedSampleId, ...exemplars.filter((sample) => sample.id !== selectedSampleId).map((sample) => sample.id)];
  const normalizedPoints = exemplars.map((sample) => {
    const raw = encode2D(sample, "before");
    const normalized = normalize(raw);
    const sampleProgress = stage > 0 ? 1 : clamp(progress * 1.65 - sampleOrder.indexOf(sample.id) * .06);
    return { sample, raw, normalized, sampleProgress, position: chartPoint(lerpVector(raw, normalized, sampleProgress)) };
  });
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
      <svg viewBox="0 0 640 560" role="img" aria-label="十二张已保留图片的单位化特征、三类原型和查询特征构成的固定二维教学空间">
        <title>Exemplar prototype prediction</title>
        <desc>十二张 Exemplar 图片经过同一个固定特征提取器。第二步同时显示圆内均值和归一化后的原型；第三步加入独立 Query；第四步用圆弧展示 Query 与三个原型的方向夹角，并显示 Query 到原型的距离。</desc>
        <circle className="p3-map__unit-circle" cx={chartOrigin.x} cy={chartOrigin.y} r={chartScale} />
        <line className="p3-map__axis" x1="24" y1={chartOrigin.y} x2="616" y2={chartOrigin.y} />
        <line className="p3-map__axis" x1={chartOrigin.x} y1="14" x2={chartOrigin.x} y2="546" />

        {stage === 0 ? normalizedPoints.map(({ sample, raw, normalized, sampleProgress }) => {
          const rawPosition = chartPoint(raw);
          const normalizedPosition = chartPoint(normalized);
          const isSelected = sample.id === selectedSampleId;
          return <g key={`raw-${sample.id}`} className={`p3-map__normalization${isSelected ? " is-selected" : ""}`} style={{ "--p3-point-color": CLASS_VISUALS[sample.classId].color } as CSSProperties}>
            <line className="p3-map__normalization-line" x1={rawPosition.x} y1={rawPosition.y} x2={lerp(rawPosition.x, normalizedPosition.x, sampleProgress)} y2={lerp(rawPosition.y, normalizedPosition.y, sampleProgress)} />
            {isSelected ? <line className="p3-map__radial-ray" x1={chartOrigin.x} y1={chartOrigin.y} x2={lerp(chartOrigin.x, normalizedPosition.x, sampleProgress)} y2={lerp(chartOrigin.y, normalizedPosition.y, sampleProgress)} /> : null}
            <circle className="p3-map__raw-point" cx={rawPosition.x} cy={rawPosition.y} r={isSelected ? 4 : 2.8} />
          </g>;
        }) : null}

        {stage === 1 ? prototypeCalculations.map(({ classId, features, rawMean, prototype }, classIndex) => {
          const local = clamp(progress * 3.05 - classIndex);
          const gatherProgress = clamp(local / .62);
          const projectProgress = clamp((local - .58) / .42);
          const meanPosition = chartPoint(rawMean);
          const prototypePosition = chartPoint(prototype);
          const resultPosition = chartPoint(lerpVector(rawMean, prototype, projectProgress));
          return <g key={`calculation-${classId}`} style={{ "--p3-point-color": CLASS_VISUALS[classId].color } as CSSProperties}>
            {features.map((feature, index) => {
              const source = chartPoint(feature);
              return <circle key={index} className="p3-map__contribution" cx={lerp(source.x, meanPosition.x, gatherProgress)} cy={lerp(source.y, meanPosition.y, gatherProgress)} r="5" style={{ opacity: local < .02 || projectProgress > .78 ? 0 : 1 }} />;
            })}
            <line className="p3-map__radial-ray" x1={chartOrigin.x} y1={chartOrigin.y} x2={lerp(chartOrigin.x, prototypePosition.x, projectProgress)} y2={lerp(chartOrigin.y, prototypePosition.y, projectProgress)} style={{ opacity: projectProgress }} />
            <circle className="p3-map__raw-mean" cx={meanPosition.x} cy={meanPosition.y} r="10" style={{ opacity: clamp((local - .44) / .18) }} />
            <path className={`p3-map__prototype p3-map__prototype--${classId}`} d={`M ${resultPosition.x - 7} ${resultPosition.y - 7} h 14 v 14 h -14 Z`} style={{ opacity: clamp((local - .54) / .18) }} />
            {projectProgress > .94 ? <text className="p3-map__direct-label" x={prototypePosition.x + prototypeLabelPlacement[classId].dx} y={prototypePosition.y + prototypeLabelPlacement[classId].dy} textAnchor={prototypeLabelPlacement[classId].anchor}>μ{CLASS_VISUALS[classId].index}</text> : null}
          </g>;
        }) : null}

        {showPrototypes && stage !== 1 ? prototypeCalculations.map(({ classId, prototype }) => {
          const position = chartPoint(prototype);
          return <line key={`prototype-ray-${classId}`} className="p3-map__radial-ray" x1={chartOrigin.x} y1={chartOrigin.y} x2={position.x} y2={position.y} style={{ "--p3-point-color": CLASS_VISUALS[classId].color } as CSSProperties} />;
        }) : null}

        {showQuery ? (() => {
          const queryMotion = stage > 2 ? 1 : clamp((progress - .48) / .52);
          const position = chartPoint(queryFeature);
          return <line className="p3-map__radial-ray p3-map__radial-ray--query" x1={chartOrigin.x} y1={chartOrigin.y} x2={lerp(chartOrigin.x, position.x, queryMotion)} y2={lerp(chartOrigin.y, position.y, queryMotion)} style={{ opacity: queryMotion }} />;
        })() : null}

        {showDecision ? queryComparisons.map(({ classId }, index) => {
          const local = clamp(progress * 3.15 - index);
          const queryPosition = chartPoint(queryFeature);
          const prototypePosition = chartPoint(prototypeByClass.get(classId)!);
          const lineEnd = { x: lerp(queryPosition.x, prototypePosition.x, local), y: lerp(queryPosition.y, prototypePosition.y, local) };
          return <g key={`comparison-${classId}`} style={{ "--p3-point-color": CLASS_VISUALS[classId].color } as CSSProperties}>
            <line className={`p3-map__distance${index === 0 && progress > .9 ? " is-nearest" : ""}`} x1={queryPosition.x} y1={queryPosition.y} x2={lineEnd.x} y2={lineEnd.y} />
            {local > .38 ? <path className={`p3-map__angle${index === 0 && progress > .9 ? " is-nearest" : ""}`} d={shortestAngleArc(queryFeature, prototypeByClass.get(classId)!, 38 + index * 17, (local - .38) / .62)} /> : null}
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

        {showPrototypes && stage !== 1 ? prototypeCalculations.map(({ classId, prototype }) => {
          const position = chartPoint(prototype);
          const label = prototypeLabelPlacement[classId];
          return <g key={`prototype-${classId}`}>
            <path className={`p3-map__prototype p3-map__prototype--${classId}`} d={`M ${position.x - 7} ${position.y - 7} h 14 v 14 h -14 Z`} />
            <text className="p3-map__direct-label" x={position.x + label.dx} y={position.y + label.dy} textAnchor={label.anchor}>μ{CLASS_VISUALS[classId].index}</text>
          </g>;
        }) : null}

        {stage === 1 ? prototypeCalculations.map(({ classId, rawMean }, classIndex) => {
          const reveal = clamp(progress * 3.05 - classIndex - .44);
          const position = chartPoint(rawMean);
          const label = meanLabelPlacement[classId];
          return <text key={`mean-label-${classId}`} className="p3-map__direct-label p3-map__direct-label--mean" x={position.x + label.dx} y={position.y + label.dy} textAnchor={label.anchor} style={{ opacity: reveal }}>z̄{CLASS_VISUALS[classId].index}</text>;
        }) : null}

        {stage === 2 ? (() => {
          const rawPosition = chartPoint(queryRawFeature);
          const incoming = clamp(progress / .42);
          return <g className="p3-map__query-normalization">
            <path className="p3-map__query-entry" d={`M 34 505 H 112 L ${rawPosition.x} ${rawPosition.y}`} style={{ strokeDashoffset: 520 * (1 - incoming) }} />
            <rect x="72" y="480" width="78" height="38" rx="7" /><text x="111" y="504" textAnchor="middle">φΘ fixed</text>
            <circle cx={lerp(34, rawPosition.x, incoming)} cy={lerp(505, rawPosition.y, incoming)} r="5" />
          </g>;
        })() : null}

        {showQuery ? (() => {
          const rawPosition = chartPoint(queryRawFeature);
          const unitPosition = chartPoint(queryFeature);
          const queryMotion = stage > 2 ? 1 : clamp((progress - .48) / .52);
          const position = { x: lerp(rawPosition.x, unitPosition.x, queryMotion), y: lerp(rawPosition.y, unitPosition.y, queryMotion) };
          return <g>
            <path className="p3-map__query" d={`M ${position.x} ${position.y - 9} l 9 9 l -9 9 l -9 -9 Z`} />
            {queryMotion > .86 ? <text className="p3-map__direct-label p3-map__direct-label--query" x={unitPosition.x + 17} y={unitPosition.y - 12}>zq</text> : null}
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
  const [progress, setProgress] = useState(reducedMotion ? 1 : 0);
  const [isPlaying, setIsPlaying] = useState(!reducedMotion);
  const progressRef = useRef(progress);
  const startedAtRef = useRef<number | null>(null);
  const workbenchRef = useRef<HTMLElement | null>(null);
  const selectedSample = exemplars.find((sample) => sample.id === selectedSampleId) ?? exemplars[0];

  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => {
    const next = reducedMotion ? 1 : 0;
    progressRef.current = next;
    setProgress(next);
    setIsPlaying(!reducedMotion);
    startedAtRef.current = null;
  }, [stage, reducedMotion]);

  useEffect(() => {
    if (!isPlaying || reducedMotion || progressRef.current >= 1) return;
    let frame = 0;
    const duration = stageDurations[stage];
    const tick = (time: number) => {
      if (startedAtRef.current === null) startedAtRef.current = time - progressRef.current * duration;
      const next = clamp((time - startedAtRef.current) / duration);
      progressRef.current = next;
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
      else setIsPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, reducedMotion, stage]);

  function selectStage(nextStage: number) {
    setStage(Math.max(0, Math.min(3, nextStage)));
  }

  function togglePlayback() {
    if (reducedMotion) return;
    if (progressRef.current >= 1) {
      progressRef.current = 0;
      setProgress(0);
      startedAtRef.current = null;
      setIsPlaying(true);
    } else if (isPlaying) {
      setIsPlaying(false);
      startedAtRef.current = null;
    } else {
      startedAtRef.current = null;
      setIsPlaying(true);
    }
  }

  function replayStage() {
    const next = reducedMotion ? 1 : 0;
    progressRef.current = next;
    setProgress(next);
    startedAtRef.current = null;
    setIsPlaying(!reducedMotion);
  }

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
          selectStage(nextStage);
          requestAnimationFrame(() => workbenchRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }));
        }} label="Page 3 最近原型预测阶段快速定位" />
      </details>

      <section className="p3-workbench" aria-label="已保留图片、特征空间和当前预测规则" data-stage={stage} ref={workbenchRef}>
        <header className="p3-workbench__heading">
          <div><span className="eyebrow">STEP {stage + 1} / 4 · {steps[stage].short}</span><h2>{steps[stage].title}</h2><p aria-live="polite">{stageNarratives[stage]}</p></div>
          <span className="p3-phase-badge">{Math.round(progress * 100)}%</span>
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
            <FeatureMap stage={stage} progress={progress} selectedSampleId={selectedSampleId} onSelectSample={setSelectedSampleId} />
          </section>

          <aside className="panel p3-rule-panel" aria-live="polite">
            <div className="panel-heading"><div><span className="eyebrow">正在观察</span><h2>{steps[stage].short}</h2></div></div>
            <p className="p3-current-observation">{stageNarratives[stage]}</p>
            {stage === 3 && progress > .92 ? <p className="p3-prediction">预测类别：{CLASS_VISUALS[predictedClass].displayLabel}</p> : null}
            <details className="p3-calculation-details"><summary>查看完整计算依据</summary><div>
              <p><b>单位特征</b> z<sub>p</sub> = normalize(φ<sub>Θ</sub>(p))</p>
              <p><b>类别原型</b> z̄<sub>y</sub> = ¼Σz<sub>p</sub>，μ<sub>y</sub> = normalize(z̄<sub>y</sub>)</p>
              <p><b>Query</b> z<sub>q</sub> = normalize(φ<sub>Θ fixed</sub>(x<sub>q</sub>))</p>
              <p><b>预测</b> ŷ = arg min<sub>y</sub> ‖z<sub>q</sub> − μ<sub>y</sub>‖₂</p>
            </div></details>
            {stage === 3 ? <details className="p3-distance-details"><summary>核对距离与夹角</summary><div className="p3-distance-list">{queryComparisons.map(({ classId, distance, angle }, index) => <div key={classId} className={index === 0 ? "is-nearest" : ""}><span>μ<sub>{CLASS_VISUALS[classId].index}</sub></span><b>{distance.toFixed(3)}</b><em>{angle.toFixed(1)}°</em><small>{index === 0 ? "最近" : ""}</small></div>)}</div></details> : null}
            <p className="p3-state-boundary">{stage < 3 ? "先看清当前对象如何得到，再进入下一步。" : "单位向量间距离越小，夹角也越小；推断不更新模型参数。"}</p>
          </aside>
        </div>

        <div className="p3-workbench__controls" aria-label="Page 3 教学步骤控制">
          <button type="button" className="icarl-button icarl-button--quiet" onClick={() => selectStage(stage - 1)} disabled={stage === 0}>← 上一步</button>
          <div className="p3-playback-controls">
            <button type="button" className="icarl-button icarl-button--primary" onClick={togglePlayback} disabled={reducedMotion}>{isPlaying ? "暂停" : progress >= 1 ? "再次播放" : "继续"}</button>
            <button type="button" className="icarl-button icarl-button--quiet" onClick={replayStage}>重播本步</button>
            <span aria-live="polite">{String(stage + 1).padStart(2, "0")} / 04 · {steps[stage].short}</span>
          </div>
          <button type="button" className="icarl-button icarl-button--primary" onClick={() => stage < 3 ? selectStage(stage + 1) : onContinue?.()} disabled={stage === 3 && !onContinue}>{stage === 3 ? "进入第 4 页" : "下一步"} <b aria-hidden="true">→</b></button>
        </div>
      </section>

      <footer className="icarl-handoff">
        <div><span className="eyebrow">NEXT · PAGE 04</span><p>我们已经能用当前特征提取器和已选 Exemplars 完成预测，但刚才暂时假定它们已经存在。那么，我们该怎么找到最典型的代表，又怎样管理这些代表？</p></div>
        {onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>筛选与管理代表样本 <b aria-hidden="true">→</b></button> : null}
      </footer>
    </article>
  );
}
