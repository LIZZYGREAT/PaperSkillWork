import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ClassFeatureMarker } from "../components/FeatureSpaceWorkbench";
import {
  CLASS_VISUALS,
  encode2D,
  encodeRawVector,
  euclideanDistance,
  mean,
  normalize,
  P_BEFORE,
  type ClassId,
  type Vector2,
} from "../data/icarl-runtime";
import {
  activeNarrationIndex,
  useAnimationTimeline,
  type AnimationClip,
} from "../shared/animation/useAnimationTimeline";
import {
  arcSegmentPath,
  clamp,
  lerpPoint,
  lineRevealPath,
  placeLabel,
  progressWithin,
  smoothstep,
  type Point,
} from "../shared/animation/easing";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";

/* ------------------------------------------------------------------ data --- */

const classIds: readonly ClassId[] = ["A", "B", "C"];
const exemplarByClass = new Map(classIds.map((classId) => [classId, P_BEFORE[classId]]));
const exemplars = classIds.flatMap((classId) => exemplarByClass.get(classId)!);

const queryInput: Vector2 = [1.732, -1.0];
const queryRawFeature = encodeRawVector(queryInput, "before");
const queryUnitFeature = normalize(queryRawFeature);

type PrototypeCalculation = {
  classId: ClassId;
  features: [number, number][];
  rawMean: [number, number];
  prototype: [number, number];
  meanDistanceToRaw: number;
};

const prototypeCalculations: PrototypeCalculation[] = classIds.map((classId) => {
  const features = exemplarByClass.get(classId)!.map((sample) => normalize(encode2D(sample, "before")));
  const rawMean = mean(features);
  return {
    classId,
    features,
    rawMean,
    prototype: normalize(rawMean),
    meanDistanceToRaw: euclideanDistance(rawMean, features[0]),
  };
});

/**
 * Displayed distances. Values below the unit circle's own resolution are surfaced verbatim in the
 * checkpoint view instead of being nudged, so the geometry never contradicts the formula.
 */
const queryComparisons = prototypeCalculations
  .map(({ classId, prototype }) => ({
    classId,
    distance: euclideanDistance(queryUnitFeature, prototype),
  }))
  .sort((a, b) => a.distance - b.distance || a.classId.localeCompare(b.classId));
const predictedClass = queryComparisons[0].classId;
const comparisonOrder: ClassId[] = ["A", "B", "C"];

/* ------------------------------------------------------------- projection --- */

/**
 * The teaching space is a square viewBox so the scene always fills its slot: the container is
 * roughly square, and a non-square viewBox would letterbox the geometry and shrink the circle.
 */
const VIEW = { width: 600, height: 600 };

const projectedVectors: { id: string; vector: Vector2 }[] = [
  ...exemplars.flatMap((sample) => [
    { id: `${sample.id}:raw`, vector: encode2D(sample, "before") },
    { id: `${sample.id}:unit`, vector: normalize(encode2D(sample, "before")) },
  ]),
  ...prototypeCalculations.flatMap((item) => [
    { id: `${item.classId}:mean`, vector: item.rawMean },
    { id: `${item.classId}:prototype`, vector: item.prototype },
  ]),
  { id: "query:raw", vector: queryRawFeature },
  { id: "query:unit", vector: queryUnitFeature },
];

const LABEL_FALLBACK = { dx: 15, dy: -13, anchor: "start" as const };

/** Extra space each label needs beyond its mark, per side, in feature units. */
const prototypeLabel: Partial<Record<ClassId, { dx: number; dy: number; anchor: "start" | "middle" | "end" }>> = {
  A: { dx: 15, dy: -13, anchor: "start" },
  B: { dx: 0, dy: -23, anchor: "middle" },
  C: { dx: -15, dy: -11, anchor: "end" },
};

const meanLabel: Partial<Record<ClassId, { dx: number; dy: number; anchor: "start" | "middle" | "end" }>> = {
  A: { dx: -13, dy: 22, anchor: "end" },
  B: { dx: -13, dy: 20, anchor: "end" },
  C: { dx: 15, dy: 21, anchor: "start" },
};

/** z_q drops below its marker: that corner is free of other marks and of the comparison chords. */
const queryLabel = { dx: 16, dy: 34, anchor: "start" as const };

/**
 * Fit every plotted object plus the space its label needs. Solving this as one padded box is what
 * lets the diagram be as large as its slot allows while guaranteeing that nothing is clipped.
 */
const chartFrame = (() => {
  const boxes: { min: [number, number]; max: [number, number] }[] = projectedVectors.map((item) => ({
    min: [item.vector[0] - 0.13, item.vector[1] - 0.11],
    max: [item.vector[0] + 0.13, item.vector[1] + 0.11],
  }));
  prototypeCalculations.forEach((item) => {
    const placement = prototypeLabel[item.classId] ?? LABEL_FALLBACK;
    const extraTop = placement.dy < 0 ? 0.28 : 0.1;
    const extraSide = Math.abs(placement.dx) > 20 ? 0.3 : 0.22;
    const side = placement.anchor === "end" ? -extraSide : placement.anchor === "start" ? extraSide : 0;
    boxes.push({
      min: [item.prototype[0] + Math.min(0, side), item.prototype[1] - 0.1],
      max: [item.prototype[0] + Math.max(0, side), item.prototype[1] + extraTop],
    });
    boxes.push({ min: [item.rawMean[0] - 0.24, item.rawMean[1] - 0.24], max: [item.rawMean[0] + 0.24, item.rawMean[1] + 0.24] });
  });
  // The Query is entered at a low y; its marker and the z_q label extend right and downward.
  boxes.push({ min: [queryUnitFeature[0] - 0.12, queryUnitFeature[1] - 0.12], max: [queryUnitFeature[0] + 0.62, queryUnitFeature[1] + 0.4] });
  boxes.push({ min: [queryRawFeature[0] - 0.2, queryRawFeature[1] - 0.4], max: [queryRawFeature[0] + 0.2, queryRawFeature[1] + 0.12] });

  const minX = Math.min(...boxes.map((box) => box.min[0]));
  const maxX = Math.max(...boxes.map((box) => box.max[0]));
  const minY = Math.min(...boxes.map((box) => box.min[1]));
  const maxY = Math.max(...boxes.map((box) => box.max[1]));
  const MARGIN = 22;
  const usable = Math.min(VIEW.width, VIEW.height) - MARGIN * 2;
  const scale = usable / Math.max(maxX - minX, maxY - minY);
  const origin = {
    x: MARGIN + (0 - minX) * scale + (usable - (maxX - minX) * scale) / 2,
    y: MARGIN + (maxY - 0) * scale + (usable - (maxY - minY) * scale) / 2,
  };
  return { scale, origin };
})();

const chartScale = chartFrame.scale;
const ORIGIN = chartFrame.origin;
const SAFE = { left: 18, right: VIEW.width - 18, top: 18, bottom: VIEW.height - 34 };

function project(vector: Vector2): Point {
  return { x: ORIGIN.x + vector[0] * chartScale, y: ORIGIN.y - vector[1] * chartScale };
}

const samplePointById = new Map(
  exemplars.map((sample) => {
    const raw = encode2D(sample, "before");
    const unit = normalize(raw);
    return [sample.id, { sample, raw, unit, rawPoint: project(raw), unitPoint: project(unit) }];
  }),
);

// The fit above must include every plotted vector; a regression here would crop the diagram.
projectedVectors.forEach(({ id, vector }) => {
  const point = project(vector);
  if (
    point.x < SAFE.left - 4 ||
    point.x > SAFE.right + 4 ||
    point.y < SAFE.top - 4 ||
    point.y > SAFE.bottom + 4
  ) {
    throw new Error(`P3 plot point ${id} is outside the safe viewport.`);
  }
});

/* --------------------------------------------------------------- timeline --- */

const clips: readonly AnimationClip[] = [
  { id: "p3-a-normalize", durationMs: 6600, holdMs: 900, narrative: "十二张代表图片的单位化" },
  { id: "p3-b-aggregate", durationMs: 8600, holdMs: 1100, narrative: "贡献点聚合成类别均值，再单位化为原型" },
  { id: "p3-c-query", durationMs: 5000, holdMs: 900, narrative: "Query 先落入原始特征位置，再单位化" },
  { id: "p3-d-decide", durationMs: 7800, holdMs: 1200, narrative: "逐条比较距离与夹角，argmin 给出预测" },
];

const clipNarratives: readonly (readonly string[])[] = [
  [
    "前面已经知道：网络能把一张图片变成特征向量。",
    "现在让这十二张已选代表图片进入同一个特征空间，按类别逐批把特征缩放到单位长度。",
    "图中细虚线是从圆心出发的方向，点只沿自己的方向移动到单位圆上，方向不会改变。",
    "十二个点都完成后，我们才有了一组可以直接互相比较的单位特征。",
  ],
  [
    "单张图片只代表类别中的一个具体样本，个体差异很大。",
    "我们要判断的是 Query 属于哪个类别，所以把同一类的四个单位特征汇总成一个类别代表。",
    "四个原始点保持不动，各自复制出一个小贡献点，一起向它们的算术平均位置移动。",
    "四个贡献点汇合处就是类别均值 z̄_y；原始特征点仍在原处。",
    "从均值沿着圆心方向把它单位化，就得到落在单位圆上的原型 μ_y，它是之后用来比较的类别方向。",
  ],
  [
    "图中出现一张不属于那十二张 Exemplars 的新图片 Query。",
    "它先由同一个固定特征提取器落到自己的原始特征位置。",
    "再沿圆心方向单位化：z_q = normalize(φ(x_q))。",
    "Query 只用于这次推断，它不会进入 Exemplar Memory，也不修改模型参数。",
  ],
  [
    "现在只比较单位圆上的 z_q 与三个原型 μ_y。",
    "依次画出 Query 到每个原型的比较线，每条线对应一个真实距离。",
    "再以圆心为顶点画出方向夹角：单位化以后，距离越小，夹角也越小。",
    "三条都比较完，最近的那条加深，对应原型就是预测类别。",
  ],
];

const clipTitles: readonly string[] = [
  "代表图片变成单位特征",
  "四张同类样本形成一个 Prototype",
  "新 Query 进入同一空间",
  "几何比较与决策",
];

/* ------------------------------------------------------------------ types --- */

type SceneState = {
  clipIndex: number;
  progress: number;
  rawPointOpacity: number;
  /** null while raw features are hidden; 1 when fully faded out. */
  rawGhostOpacity: number;
  unitizeProgressByClass: number[];
  contributionByClass: (number | null)[];
  meanRevealByClass: number[];
  prototypeProgressByClass: number[];
  contributionOpacityByClass: number[];
  meanOpacityByClass: number[];
  queryRawOpacity: number;
  queryRawGhostOpacity: number;
  queryUnitizeProgress: number;
  queryOpacity: number;
  comparisonProgress: number[];
  arcProgress: number[];
  decisionProgress: number;
  predictedOpacity: number;
  showPrototypes: boolean;
};

function sceneAt(clipIndex: number, progress: number): SceneState {
  const p = clamp(progress);
  const perClassWindow = 0.78 / classIds.length;

  const unitizeProgressByClass = classIds.map((_, index) => {
    if (clipIndex === 0) {
      const start = 0.14 + index * perClassWindow;
      return smoothstep(progressWithin(p, start, start + perClassWindow * 0.86));
    }
    return 1;
  });

  const contributionByClass = classIds.map((_, index) => {
    if (clipIndex !== 1) return null;
    const start = 0.04 + index * 0.3;
    return smoothstep(progressWithin(p, start, start + 0.17));
  });

  const meanRevealByClass = classIds.map((_, index) => {
    if (clipIndex === 0) return 0;
    if (clipIndex > 1) return 1;
    const start = 0.04 + index * 0.3;
    return clamp(progressWithin(p, start + 0.15, start + 0.22));
  });

  const prototypeProgressByClass = classIds.map((_, index) => {
    if (clipIndex === 0) return 0;
    if (clipIndex > 1) return 1;
    const start = 0.04 + index * 0.3;
    return smoothstep(progressWithin(p, start + 0.21, start + 0.3));
  });

  const contributionOpacityByClass = classIds.map((_, index) => {
    if (clipIndex !== 1) return 0;
    const start = 0.04 + index * 0.3;
    return clamp(progressWithin(p, start + 0.16, start + 0.2)) * (1 - clamp(progressWithin(p, start + 0.2, start + 0.25)));
  });

  const meanOpacityByClass = classIds.map((_, index) => {
    if (clipIndex === 0) return 0;
    if (clipIndex > 1) return 0;
    const start = 0.04 + index * 0.3;
    return clamp(progressWithin(p, start + 0.15, start + 0.2)) * (1 - clamp(progressWithin(p, start + 0.27, start + 0.31)));
  });

  const queryRawOpacity = clipIndex < 2 ? 0 : clipIndex > 2 ? 1 : clamp(progressWithin(p, 0.03, 0.16));
  const queryUnitizeProgress = clipIndex < 2 ? 0 : clipIndex > 2 ? 1 : smoothstep(progressWithin(p, 0.26, 0.66));
  const queryOpacity = clipIndex < 2 ? 0 : clipIndex > 2 ? 1 : clamp(progressWithin(p, 0.1, 0.26));
  const queryRawGhostOpacity =
    clipIndex > 2 ? 0 : clipIndex === 2 ? clamp(progressWithin(p, 0.46, 0.7)) * 0.65 : 0;

  const comparisonProgress = comparisonOrder.map((_, index) => {
    if (clipIndex < 3) return 0;
    const start = 0.04 + index * 0.17;
    return smoothstep(progressWithin(p, start, start + 0.14));
  });
  const arcProgress = comparisonOrder.map((_, index) => {
    if (clipIndex < 3) return 0;
    const start = 0.26 + index * 0.17;
    return smoothstep(progressWithin(p, start, start + 0.14));
  });
  const decisionProgress = clipIndex < 3 ? 0 : smoothstep(progressWithin(p, 0.8, 0.93));
  const predictedOpacity = clipIndex < 3 ? 0 : clamp(progressWithin(p, 0.88, 0.96));

  return {
    clipIndex,
    progress: p,
    rawPointOpacity: clipIndex > 0 ? 0 : 1 - clamp(progressWithin(p, 0.62, 0.92)),
    rawGhostOpacity: clipIndex === 0 ? clamp(progressWithin(p, 0.68, 0.96)) * 0.5 : 1,
    unitizeProgressByClass,
    contributionByClass,
    meanRevealByClass,
    prototypeProgressByClass,
    contributionOpacityByClass,
    meanOpacityByClass,
    queryRawOpacity,
    queryRawGhostOpacity,
    queryUnitizeProgress,
    queryOpacity,
    comparisonProgress,
    arcProgress,
    decisionProgress,
    predictedOpacity,
    showPrototypes: clipIndex >= 1,
  };
}

/* ---------------------------------------------------------------- subviews --- */

const ARC_RADIUS = [46, 62, 78] as const;

function FeatureScene({ scene, selectedSampleId, onSelectSample }: {
  scene: SceneState;
  selectedSampleId: string;
  onSelectSample: (id: string) => void;
}) {
  const origin = ORIGIN;
  const comparisonIndexByClass = new Map(comparisonOrder.map((classId, index) => [classId, index]));
  const predictedIndex = comparisonIndexByClass.get(predictedClass) ?? 0;

  function activate(event: KeyboardEvent<SVGGElement>, sampleId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectSample(sampleId);
    }
  }

  return (
    <div className="p3-canvas">
      <svg
        className="p3-scene"
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="十二张已保留图片的单位化特征、三类原型与查询特征构成的固定二维教学空间"
      >
      <title>Exemplar 原型分类</title>
      <desc>十二张 Exemplar 依次单位化；同类四个单位特征通过贡献点聚合成均值，再单位化为原型；独立 Query 先落到原始特征位置再单位化；最后逐条绘制距离线与圆心角弧，由 argmin 给出预测。</desc>

      <circle className="p3-scene__unit-circle" cx={origin.x} cy={origin.y} r={chartScale} />
      <line className="p3-scene__axis" x1="14" y1={origin.y} x2={VIEW.width - 14} y2={origin.y} />
      <line className="p3-scene__axis" x1={origin.x} y1="14" x2={origin.x} y2={VIEW.height - 14} />

      {/* Persistent normalization layer: rays and moving points keep their identity across clips. */}
      {exemplars.map((sample) => {
        const entry = samplePointById.get(sample.id)!;
        const classIndex = classIds.indexOf(sample.classId);
        const classProgress = scene.unitizeProgressByClass[classIndex] ?? 0;
        const moving = lerpPoint(entry.rawPoint, entry.unitPoint, classProgress);
        const isSelected = sample.id === selectedSampleId;
        const color = CLASS_VISUALS[sample.classId].color;
        const style = { "--p3-point-color": color } as CSSProperties;
        return (
          <g key={`unitize-${sample.id}`} className="p3-scene__unitize" style={style}>
            {classProgress > 0 ? (
              <line
                className="p3-scene__radial-ray"
                x1={origin.x}
                y1={origin.y}
                x2={moving.x}
                y2={moving.y}
                opacity={isSelected ? 0.85 : 0.4}
              />
            ) : null}
            {scene.rawGhostOpacity > 0 && classProgress > 0.02 ? (
              <circle
                className="p3-scene__raw-ghost"
                cx={entry.rawPoint.x}
                cy={entry.rawPoint.y}
                r="4"
                opacity={scene.rawGhostOpacity}
              />
            ) : null}
            {scene.rawPointOpacity > 0 ? (
              <circle
                className="p3-scene__raw-point"
                cx={entry.rawPoint.x}
                cy={entry.rawPoint.y}
                r={isSelected ? 5 : 3.6}
                opacity={scene.rawPointOpacity}
              />
            ) : null}
          </g>
        );
      })}

      {/* Aggregation layer for the currently computed class. */}
      {classIds.map((classId) => {
        const calculation = prototypeCalculations.find((item) => item.classId === classId)!;
        const classIndex = classIds.indexOf(classId);
        const gather = scene.contributionByClass[classIndex];
        const meanPoint = project(calculation.rawMean);
        if (gather === null || gather === undefined) return null;
        return (
          <g key={`aggregate-${classId}`} className="p3-scene__aggregate" style={{ "--p3-point-color": CLASS_VISUALS[classId].color } as CSSProperties}>
            <line className="p3-scene__radial-ray" x1={origin.x} y1={origin.y} x2={meanPoint.x} y2={meanPoint.y} opacity={0.5} />
            {calculation.features.map((feature, index) => {
              const source = project(feature);
              const position = lerpPoint(source, meanPoint, gather);
              return (
                <g key={`contribution-${classId}-${index}`}>
                  <line
                    className="p3-scene__contribution-line"
                    x1={source.x}
                    y1={source.y}
                    x2={meanPoint.x}
                    y2={meanPoint.y}
                    opacity={0.5}
                  />
                  <circle
                    className="p3-scene__contribution"
                    cx={position.x}
                    cy={position.y}
                    r="6"
                    opacity={scene.contributionOpacityByClass[classIndex] ?? 0}
                  />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Normalized feature points: one stable node per exemplar, never remounted between clips. */}
      {exemplars.map((sample) => {
        const entry = samplePointById.get(sample.id)!;
        const classIndex = classIds.indexOf(sample.classId);
        const isSelected = sample.id === selectedSampleId;
        const color = CLASS_VISUALS[sample.classId].color;
        return (
          <g
            key={`unit-${sample.id}`}
            className={`p3-scene__point${isSelected ? " is-selected" : ""}`}
            tabIndex={0}
            role="button"
            aria-label={`${CLASS_VISUALS[sample.classId].displayLabel} 已保留样本 ${sample.id}；选择以联动左栏身份`}
            onClick={() => onSelectSample(sample.id)}
            onKeyDown={(event) => activate(event, sample.id)}
          >
            <ClassFeatureMarker
              className="p3-scene__unit-point"
              classId={sample.classId}
              x={entry.unitPoint.x}
              y={entry.unitPoint.y}
              radius={isSelected ? 5 : 3.8}
              selected={false}
              fillOverride={color}
            />
            <title>{`${sample.id} · P_BEFORE[${sample.classId}] · 单位化特征 z_p`}</title>
          </g>
        );
      })}

      {/* Category means (inside the circle) and prototypes (on the circle). */}
      {prototypeCalculations.map((calculation) => {
        const classIndex = classIds.indexOf(calculation.classId);
        const meanPoint = project(calculation.rawMean);
        const prototypePoint = project(calculation.prototype);
        const move = scene.prototypeProgressByClass[classIndex] ?? 0;
        const markerPoint = lerpPoint(meanPoint, prototypePoint, move);
        const label = prototypeLabel[calculation.classId] ?? LABEL_FALLBACK;
        const meanPlacement = meanLabel[calculation.classId] ?? LABEL_FALLBACK;
        return (
          <g key={`prototype-${calculation.classId}`} style={{ "--p3-point-color": CLASS_VISUALS[calculation.classId].color } as CSSProperties}>
            {move > 0.01 && move < 0.99 ? (
              <path
                className="p3-scene__normalize-path"
                d={lineRevealPath(meanPoint, prototypePoint, move)}
                opacity={0.9}
              />
            ) : null}
            <circle
              className="p3-scene__raw-mean"
              cx={meanPoint.x}
              cy={meanPoint.y}
              r="9"
              opacity={scene.meanOpacityByClass[classIndex] ?? 0}
            />
            <path
              className="p3-scene__prototype"
              d={`M ${markerPoint.x - 7.5} ${markerPoint.y - 7.5} h 15 v 15 h -15 Z`}
              opacity={scene.showPrototypes ? clamp(move * 1.6) : 0}
            />
            {scene.showPrototypes && move > 0.6 ? (
              <PlacedLabel
                point={prototypePoint}
                text={`μ${CLASS_VISUALS[calculation.classId].index}`}
                placement={label}
                fontSize={17}
                className="p3-scene__label"
              />
            ) : null}
            {(scene.meanOpacityByClass[classIndex] ?? 0) > 0.05 ? (
              <PlacedLabel
                point={meanPoint}
                text={`z̄${CLASS_VISUALS[calculation.classId].index}`}
                placement={meanPlacement}
                fontSize={15}
                className="p3-scene__label p3-scene__label--mean"
              />
            ) : null}
          </g>
        );
      })}

      {/* Query: enters at its raw feature position, then normalizes along a radial path. */}
      <g className="p3-scene__query" opacity={scene.queryOpacity}>
        {scene.queryRawOpacity > 0.02 ? (
          <circle
            className="p3-scene__query-raw"
            cx={project(queryRawFeature).x}
            cy={project(queryRawFeature).y}
            r="5"
            opacity={scene.queryRawOpacity}
          />
        ) : null}
        {scene.queryRawGhostOpacity > 0.02 ? (
          <circle
            className="p3-scene__raw-ghost"
            cx={project(queryRawFeature).x}
            cy={project(queryRawFeature).y}
            r="5"
            opacity={scene.queryRawGhostOpacity}
          />
        ) : null}
        {scene.queryUnitizeProgress > 0.01 && scene.queryUnitizeProgress < 0.99 ? (
          <path
            className="p3-scene__normalize-path p3-scene__normalize-path--query"
            d={lineRevealPath(project(queryRawFeature), project(queryUnitFeature), scene.queryUnitizeProgress)}
          />
        ) : null}
        {scene.clipIndex === 2 && scene.queryRawOpacity > 0.4 ? (
          <PlacedLabel
            point={project(queryRawFeature)}
            text="φ(x_q)"
            placement={{ dx: 12, dy: -14, anchor: "start" }}
            fontSize={14}
            className="p3-scene__label p3-scene__label--query"
          />
        ) : null}
      </g>

      {/* Comparison lines, then angle arcs with the vertex at the origin. */}
      {comparisonOrder.map((classId, index) => {
        const prototype = prototypeCalculations.find((item) => item.classId === classId)!.prototype;
        const prototypePoint = project(prototype);
        const queryPoint = project(queryUnitFeature);
        const lineProgress = scene.comparisonProgress[index] ?? 0;
        const reveal = scene.arcProgress[index] ?? 0;
        const isNearest = classId === predictedClass;
        const emphasized = scene.decisionProgress > 0 && isNearest;
        const faded = scene.decisionProgress > 0 && !isNearest;
        const className = [
          "p3-scene__comparison",
          emphasized ? "is-nearest" : "",
          faded ? "is-faded" : "",
        ].filter(Boolean).join(" ");
        return (
          <g key={`comparison-${classId}`} className={className} style={{ "--p3-point-color": CLASS_VISUALS[classId].color } as CSSProperties}>
            {lineProgress > 0.01 ? (
              <path className="p3-scene__distance-line" d={lineRevealPath(queryPoint, prototypePoint, lineProgress)} />
            ) : null}
            {reveal > 0.01 ? (
              <AngleArc
                center={origin}
                radius={ARC_RADIUS[index]}
                from={queryUnitFeature}
                to={prototype}
                progress={reveal}
              />
            ) : null}
          </g>
        );
      })}

      {/* Query marker sits above the comparison lines so it stays visible at every checkpoint. */}
      {scene.queryOpacity > 0.05 ? (
        <g className="p3-scene__query p3-scene__query--marker" opacity={scene.queryOpacity}>
          <QueryMarker point={lerpPoint(project(queryRawFeature), project(queryUnitFeature), scene.queryUnitizeProgress)} />
        {scene.queryUnitizeProgress > 0.5 ? (
          <PlacedLabel
            point={project(queryUnitFeature)}
            text="z_q"
            placement={queryLabel}
            fontSize={17}
            className="p3-scene__label p3-scene__label--query"
          />
        ) : null}
        </g>
      ) : null}

      {/* Prediction is revealed once, after all three comparisons, and comes from the real argmin. */}
      {scene.predictedOpacity > 0.02 ? (
        <g className="p3-scene__decision" opacity={scene.predictedOpacity}>
          <line
            className="p3-scene__decision-leader"
            x1={project(prototypeCalculations.find((item) => item.classId === predictedClass)!.prototype).x}
            y1={project(prototypeCalculations.find((item) => item.classId === predictedClass)!.prototype).y}
            x2={project(prototypeCalculations.find((item) => item.classId === predictedClass)!.prototype).x + 40}
            y2={project(prototypeCalculations.find((item) => item.classId === predictedClass)!.prototype).y + 40}
          />
          <text
            x={project(prototypeCalculations.find((item) => item.classId === predictedClass)!.prototype).x + 46}
            y={project(prototypeCalculations.find((item) => item.classId === predictedClass)!.prototype).y + 46}
          >
            ŷ = {CLASS_VISUALS[predictedClass].displayLabel}
          </text>
        </g>
      ) : null}

      <circle className="p3-scene__origin" cx={origin.x} cy={origin.y} r="3.4" />
      <text className="p3-scene__scale-note" x="14" y="22">
        固定合成二维教学特征空间 · 单位圆 ‖z‖₂ = 1 · 全部图形共用同一坐标系
      </text>
      </svg>
    </div>
  );
}

function AngleArc({ center, radius, from, to, progress }: {
  center: Point;
  radius: number;
  from: Vector2;
  to: Vector2;
  progress: number;
}) {
  const startDeg = (Math.atan2(from[1], from[0]) * 180) / Math.PI;
  const endDeg = (Math.atan2(to[1], to[0]) * 180) / Math.PI;
  // Screen y grows downward, so the feature angle must be negated to draw in SVG space.
  const startScreen = -startDeg;
  let delta = -endDeg - startScreen;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return (
    <path
      className="p3-scene__angle"
      d={arcSegmentPath(center, radius, startScreen, delta * clamp(progress))}
    />
  );
}

function QueryMarker({ point }: { point: Point }) {
  const radius = 6.5;
  return (
    <path
      className="p3-scene__query-marker"
      d={`M ${point.x} ${point.y - radius} L ${point.x + radius} ${point.y} L ${point.x} ${point.y + radius} L ${point.x - radius} ${point.y} Z`}
    />
  );
}

/** Draws a label with a short leader, keeping the text inside the canvas at any scale. */
function PlacedLabel({ point, text, placement, fontSize, className }: {
  point: Point;
  text: string;
  placement: { dx: number; dy: number; anchor?: "start" | "middle" | "end" };
  fontSize: number;
  className: string;
}) {
  const placed = placeLabel(point, text, {
    dx: placement.dx,
    dy: placement.dy,
    anchor: placement.anchor,
    fontSize,
    bounds: { width: VIEW.width, height: VIEW.height },
  });
  return (
    <g className={className}>
      <line className="p3-scene__label-leader" x1={point.x} y1={point.y} x2={placed.x} y2={placed.y - fontSize * 0.34} />
      <text x={placed.x} y={placed.y} textAnchor={placed.anchor}>{text}</text>
    </g>
  );
}

/* ------------------------------------------------------------------- page --- */

export function PageThree({ onContinue }: { onContinue?: () => void } = {}) {
  const reducedMotion = useReducedMotion();
  const { state, controls } = useAnimationTimeline({ clips, reducedMotion });
  const scene = useMemo(() => sceneAt(state.clipIndex, state.progress), [state.clipIndex, state.progress]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(P_BEFORE.A[0].id);
  const workbenchRef = useRef<HTMLElement | null>(null);
  const chapterJumpsRef = useRef<HTMLDetailsElement | null>(null);

  const selectedSample = exemplars.find((sample) => sample.id === selectedSampleId) ?? exemplars[0];
  const selectedEntry = samplePointById.get(selectedSample.id)!;
  const selectedClassIndex = classIds.indexOf(selectedSample.classId);
  const selectedUnitized = (scene.unitizeProgressByClass[selectedClassIndex] ?? 0) > 0.999;
  const selectedRaw = encode2D(selectedSample, "before");
  const selectedUnit = normalize(selectedRaw);

  const narrationIndex = activeNarrationIndex(clipNarratives[state.clipIndex], state.progress);
  const predictedVisible = scene.predictedOpacity > 0.4;
  const comparisonLabel = state.clipIndex < 3
    ? "尚未开始比较"
    : scene.comparisonProgress.filter((value) => value > 0.999).length + " / 3 条比较线";

  function focusWorkbench() {
    workbenchRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  function jumpToClip(index: number) {
    controls.goToClip(index);
    if (chapterJumpsRef.current) chapterJumpsRef.current.open = false;
    requestAnimationFrame(focusWorkbench);
  }

  return (
    <article className="tutorial-page icarl-page icarl-page--p3">
      <header className="page-heading icarl-page__heading">
        <div className="icarl-page__eyebrow"><span>PAGE 03</span><i /> PROTOTYPE CLASSIFICATION</div>
        <h1>已选代表图片怎样<br className="p3-title-break" />完成一次预测？</h1>
        <p>先假定三类代表图片已经选好，并且 Feature Extractor 训练完成、暂时固定。让这些 Exemplars 和一张新 Query 进入同一特征空间，看看 iCaRL 怎样用它们完成预测。</p>
        <button type="button" className="icarl-button icarl-button--primary p3-start-button" onClick={focusWorkbench}>开始演示 <b aria-hidden="true">↓</b></button>
      </header>

      <section
        className="p3-workbench"
        aria-label="已保留图片、特征空间与当前预测规则"
        data-clip={state.clip.id}
        data-progress={state.progress.toFixed(3)}
        data-status={state.status}
        ref={workbenchRef}
      >
        <header className="p3-workbench__heading">
          <div>
            <span className="eyebrow">片段 {state.clipIndex + 1} / {clips.length} · {clipTitles[state.clipIndex]}</span>
            <h2>{state.clip.narrative}</h2>
            <p aria-live="polite">{clipNarratives[state.clipIndex][narrationIndex]}</p>
          </div>
          <span className="p3-workbench__phase">{state.isHolding ? "结果停留" : `${Math.round(state.progress * 100)}%`}</span>
        </header>

        <div className="p3-workbench__layout">
          <section className="panel p3-source" aria-label="已保留 Exemplars 来源">
            <div className="panel-heading">
              <div><span className="eyebrow">SOURCE</span><h2>已保留 Exemplars</h2></div>
              <span className="p3-mini-count">12 张</span>
            </div>
            <div className="p3-source__samples">
              {classIds.map((classId) => {
                const classSamples = exemplarByClass.get(classId)!;
                const classProgress = scene.unitizeProgressByClass[classIds.indexOf(classId)] ?? 0;
                const done = classProgress > 0.999;
                const active = classProgress > 0.001 && !done;
                return (
                  <section
                    className={`p3-source__group${done ? " is-done" : ""}${active ? " is-active" : ""}`}
                    key={classId}
                    style={{ "--p3-group-color": CLASS_VISUALS[classId].color } as CSSProperties}
                  >
                    <div>
                      <b>{CLASS_VISUALS[classId].displayLabel}</b>
                      <span>P<sub>{CLASS_VISUALS[classId].index}</sub> · {classSamples.length} 张 · {done ? "已进入特征空间" : active ? "单位化中" : "待单位化"}</span>
                    </div>
                    <div className="p3-source__grid">
                      {classSamples.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          className={`p3-source__sample${selectedSampleId === sample.id ? " is-selected" : ""}`}
                          onClick={() => setSelectedSampleId(sample.id)}
                          aria-pressed={selectedSampleId === sample.id}
                          title={`${CLASS_VISUALS[sample.classId].displayLabel} · ${sample.id}`}
                        >
                          <i aria-hidden="true">{CLASS_VISUALS[sample.classId].glyph}</i>
                          <b>{sample.id}</b>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
            <div className="p3-source__mapping" aria-label={`当前图片 ${selectedSample.id} 的特征与单位化结果`}>
              <span>当前图片 · {CLASS_VISUALS[selectedSample.classId].displayLabel}</span>
              <strong>{selectedSample.id} → f<sub>Θ</sub>(p) = ({selectedRaw[0].toFixed(2)}, {selectedRaw[1].toFixed(2)})</strong>
              <strong>‖f‖₂ = {Math.hypot(selectedRaw[0], selectedRaw[1]).toFixed(2)} → {selectedUnitized ? "z" : "…"}<sub>p</sub> = ({selectedUnit[0].toFixed(2)}, {selectedUnit[1].toFixed(2)})</strong>
            </div>
            {state.clipIndex >= 2 ? (
              <div className="p3-query-source">
                <span>独立的新输入 · 不属于上面十二张</span>
                <b>x<sub>q</sub></b>
                <p>{state.clipIndex === 2 && scene.queryUnitizeProgress < 0.99 ? "先落到原始特征位置，再沿圆心方向单位化。" : "已得到单位化查询特征 z_q；它不进入 Exemplar Memory。"}</p>
              </div>
            ) : null}
          </section>

          <section className="panel p3-space-panel">
            <div className="panel-heading">
              <div><span className="eyebrow">ONE FIXED FEATURE SPACE</span><h2>单位特征、Prototype 与 Query</h2></div>
              <span className="p3-mini-count">{comparisonLabel}</span>
            </div>
            <FeatureScene scene={scene} selectedSampleId={selectedSampleId} onSelectSample={setSelectedSampleId} />
            <div className="p3-scene__legend" aria-label="图形标记说明">
              <span><i className="p3-legend-unit" />单位圆 ‖z‖₂=1</span>
              <span><i className="p3-legend-raw" />f<sub>Θ</sub>(p)</span>
              <span><i className="p3-legend-unit-point" />z<sub>p</sub></span>
              <span><i className="p3-legend-mean" />z̄<sub>y</sub></span>
              <span><i className="p3-legend-prototype" />μ<sub>y</sub></span>
              <span><i className="p3-legend-query" />z<sub>q</sub></span>
              <span><i className="p3-legend-distance" />距离</span>
              <span><i className="p3-legend-angle" />圆心夹角</span>
            </div>
          </section>

          <aside className="panel p3-rule-panel" aria-live="polite">
            <div className="panel-heading"><div><span className="eyebrow">正在观察</span><h2>{clipTitles[state.clipIndex]}</h2></div></div>
            <p className="p3-current-observation">{clipNarratives[state.clipIndex][narrationIndex]}</p>
            <ul className="p3-progress-list">
              {clips.map((clip, index) => (
                <li key={clip.id} className={index === state.clipIndex ? "is-current" : index < state.clipIndex ? "is-complete" : ""}>
                  <span>{String(index + 1).padStart(2, "0")}</span>{clipTitles[index]}
                </li>
              ))}
            </ul>
            {state.clipIndex >= 1 ? (
              <div className="p3-mean-readout">
                {prototypeCalculations.map((calculation) => {
                  const classIndex = classIds.indexOf(calculation.classId);
                  const meanOpacity = scene.meanOpacityByClass[classIndex] ?? 0;
                  const prototypeProgress = scene.prototypeProgressByClass[classIndex] ?? 0;
                  return (
                    <span key={calculation.classId} style={{ "--p3-group-color": CLASS_VISUALS[calculation.classId].color } as CSSProperties}>
                      <b>μ{CLASS_VISUALS[calculation.classId].index}</b>
                      <em>
                        {meanOpacity > 0.1
                          ? `z̄=(${calculation.rawMean[0].toFixed(3)}, ${calculation.rawMean[1].toFixed(3)})`
                          : "—"}
                      </em>
                      <i>
                        {prototypeProgress > 0.99
                          ? `→ (${calculation.prototype[0].toFixed(3)}, ${calculation.prototype[1].toFixed(3)})`
                          : prototypeProgress > 0.01
                            ? "单位化中"
                            : "待计算"}
                      </i>
                    </span>
                  );
                })}
              </div>
            ) : null}
            {state.clipIndex >= 3 ? (
              <div className="p3-comparison-readout">
                {queryComparisons.map(({ classId, distance }, index) => (
                  <span key={classId} className={classId === predictedClass && predictedVisible ? "is-nearest" : ""}>
                    <b>‖z_q − μ{CLASS_VISUALS[classId].index}‖₂</b>
                    <em>{(scene.comparisonProgress[comparisonOrder.indexOf(classId)] ?? 0) > 0.99 ? distance.toFixed(3) : "…"}</em>
                    <small>{index === 0 ? "最短" : ""}</small>
                  </span>
                ))}
              </div>
            ) : null}
            {predictedVisible ? (
              <p className="p3-prediction">
                ŷ = arg min<sub>y</sub> ‖z_q − μ<sub>y</sub>‖₂ = {CLASS_VISUALS[predictedClass].displayLabel}
              </p>
            ) : null}
            <details className="p3-calculation-details">
              <summary>查看完整计算依据</summary>
              <div>
                <p><b>单位特征</b> z<sub>p</sub> = f<sub>Θ</sub>(p) / ‖f<sub>Θ</sub>(p)‖₂</p>
                <p><b>类别均值</b> z̄<sub>y</sub> = (1/|P<sub>y</sub>|) Σ<sub>p∈P<sub>y</sub></sub> z<sub>p</sub>（本页每类四张，即 ¼Σz<sub>p</sub>）</p>
                <p><b>类别原型</b> μ<sub>y</sub> = z̄<sub>y</sub> / ‖z̄<sub>y</sub>‖₂</p>
                <p><b>查询特征</b> z<sub>q</sub> = φ<sub>Θ fixed</sub>(x<sub>q</sub>) / ‖φ<sub>Θ fixed</sub>(x<sub>q</sub>)‖₂</p>
                <p><b>预测</b> ŷ = arg min<sub>y</sub> ‖z<sub>q</sub> − μ<sub>y</sub>‖₂</p>
              </div>
            </details>
            <details className="p3-calculation-details">
              <summary>核对单位化前后的坐标</summary>
              <div className="p3-coordinate-table">
                {exemplars.map((sample) => {
                  const raw = encode2D(sample, "before");
                  const unit = normalize(raw);
                  return (
                    <p key={sample.id}>
                      <b>{sample.id}</b>
                      f = ({raw[0].toFixed(2)}, {raw[1].toFixed(2)}) · ‖f‖₂ = {Math.hypot(raw[0], raw[1]).toFixed(2)} · z = ({unit[0].toFixed(2)}, {unit[1].toFixed(2)}) · ‖z‖₂ = 1.00
                    </p>
                  );
                })}
                {prototypeCalculations.map((calculation) => (
                  <p key={`mean-${calculation.classId}`}>
                    <b>z̄{CLASS_VISUALS[calculation.classId].index}</b>
                    ({calculation.rawMean[0].toFixed(3)}, {calculation.rawMean[1].toFixed(3)}) → μ{CLASS_VISUALS[calculation.classId].index} ({calculation.prototype[0].toFixed(3)}, {calculation.prototype[1].toFixed(3)})
                  </p>
                ))}
                <p><b>z_q</b>({queryUnitFeature[0].toFixed(3)}, {queryUnitFeature[1].toFixed(3)}) · ‖z_q‖₂ = 1.000</p>
                {queryComparisons.map(({ classId, distance }) => (
                  <p key={`distance-${classId}`}><b>d(μ{CLASS_VISUALS[classId].index})</b>{distance.toFixed(4)}{classId === predictedClass ? " · 最近 → 预测" : ""}</p>
                ))}
              </div>
            </details>
            <p className="p3-state-boundary">
              当前片段只读取已固定的特征提取器与 Exemplar Memory：不训练、不写入记忆、不展开 Herding。
            </p>
          </aside>
        </div>

        <div className="p3-workbench__controls" aria-label="Page 3 动画控制">
          <button type="button" className="icarl-button icarl-button--quiet" onClick={controls.stepBack} disabled={!state.hasPrevious}>← 上一步</button>
          <div className="p3-playback-controls">
            <button type="button" className="icarl-button icarl-button--quiet" onClick={controls.toggle}>
              {state.status === "playing" ? "Ⅱ 暂停" : reducedMotion ? "▶ 下一片段" : state.atEnd ? "▶ 重新播放" : "▶ 继续"}
            </button>
            <button type="button" className="icarl-button icarl-button--quiet" onClick={controls.replayClip}>↺ 重播本片段</button>
            <span aria-live="polite">{String(state.clipIndex + 1).padStart(2, "0")} / 0{clips.length} · {state.clip.narrative} · {state.isHolding ? "停留" : `${Math.round(state.progress * 100)}%`}</span>
          </div>
          <button type="button" className="icarl-button icarl-button--primary" onClick={controls.stepForward} disabled={!state.hasNext}>下一步 →</button>
        </div>

        <div className="p3-clip-rail" role="group" aria-label="片段定位">
          {clips.map((clip, index) => (
            <button
              key={clip.id}
              type="button"
              className={index === state.clipIndex ? "is-current" : index < state.clipIndex ? "is-complete" : ""}
              aria-pressed={index === state.clipIndex}
              onClick={() => jumpToClip(index)}
            >
              <b>{String(index + 1).padStart(2, "0")}</b>{clipTitles[index]}
            </button>
          ))}
        </div>
      </section>

      <footer className="icarl-handoff">
        <div>
          <span className="eyebrow">NEXT · PAGE 04</span>
          <p>我们已经能用当前特征提取器和已选 Exemplars 完成预测，但刚才暂时假定它们已经存在。那么，我们该怎么找到最典型的代表，又怎样管理这些代表？</p>
        </div>
        {onContinue ? <button type="button" className="icarl-button icarl-button--primary" onClick={onContinue}>筛选与管理代表样本 <b aria-hidden="true">→</b></button> : null}
      </footer>
    </article>
  );
}

