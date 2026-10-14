import { ChartLabels, FEATURE_FRAME, type ChartLabel } from "./FeatureChart";
import { useState, type CSSProperties, type ReactNode } from "react";
import type { Prototype, Vector2, ClassId } from "../data/icarl-runtime";
import { CLASS_VISUALS } from "../data/icarl-runtime";

export type FeaturePoint = {
  id: string;
  classId: ClassId;
  point: Vector2;
  order?: number;
};

export type FeatureSpaceMode = "projection" | "herding" | "prototypes" | "inference";

export function ClassFeatureMarker({ classId, x, y, radius, selected, className = "sample-mark", selectedClassName = "is-selected", fillOverride, legacyShape = false }: {
  classId: ClassId;
  x: number;
  y: number;
  radius: number;
  selected: boolean;
  className?: string;
  selectedClassName?: string;
  fillOverride?: string;
  legacyShape?: boolean;
}) {
  const markerClassName = `${className}${selected ? ` ${selectedClassName}` : ""}`;
  const fill = fillOverride ?? CLASS_VISUALS[classId].color;
  if (!legacyShape) return <circle className={markerClassName} cx={x} cy={y} r={radius} fill={fill} />;
  if (classId === "A") return <polygon className={markerClassName} points={`${x},${y - radius} ${x + radius},${y + radius} ${x - radius},${y + radius}`} fill={fill} />;
  if (classId === "B") return <circle className={markerClassName} cx={x} cy={y} r={radius} fill={fill} />;
  if (classId === "C") return <rect className={markerClassName} x={x - radius} y={y - radius} width={radius * 2} height={radius * 2} fill={fill} />;
  return <polygon className={markerClassName} points={`${x},${y - radius} ${x + radius},${y} ${x},${y + radius} ${x - radius},${y}`} fill={fill} />;
}

const ORIGIN = { x: 180, y: 132 };
const UNIT_RADIUS = 124;
const PROJECTION_SCALE = 39;
const NORMALIZATION_ORIGIN = { x: 380, y: 170 };
const NORMALIZATION_UNIT_RADIUS = 145;
const NORMALIZATION_RAW_SCALE = NORMALIZATION_UNIT_RADIUS;

function starPath(x: number, y: number, outer = 8, inner = 3.6) {
  return Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    return `${index === 0 ? "M" : "L"}${x + Math.cos(angle) * radius},${y + Math.sin(angle) * radius}`;
  }).join(" ") + " Z";
}

export function FeatureSpaceWorkbench({
  mode,
  title,
  description,
  points = [],
  previousPoints = [],
  unitCircle = false,
  rawMean,
  target,
  prefixMean,
  prototypes = [],
  query,
  normalizationSources = [],
  markerScale = 1,
  projectionScale = PROJECTION_SCALE,
  motionProgress,
  showSampleLabels = true,
  herdingRevealCount,
  focusableSamples = true,
  asideContent,
  legacy = false,
}: {
  mode: FeatureSpaceMode;
  title: string;
  description: string;
  points?: FeaturePoint[];
  previousPoints?: FeaturePoint[];
  unitCircle?: boolean;
  rawMean?: Vector2;
  target?: Vector2;
  prefixMean?: Vector2;
  prototypes?: Prototype[];
  query?: Vector2;
  normalizationSources?: FeaturePoint[];
  markerScale?: number;
  projectionScale?: number;
  /** Interpolate current marks from matching previousPoints; omitted preserves the static endpoint view. */
  motionProgress?: number;
  showSampleLabels?: boolean;
  herdingRevealCount?: number;
  focusableSamples?: boolean;
  asideContent?: ReactNode;
  legacy?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const showNormalization = unitCircle && normalizationSources.length > 0;
  const origin = legacy ? (showNormalization ? NORMALIZATION_ORIGIN : ORIGIN) : FEATURE_FRAME;
  const maxRawLength = Math.max(1, ...normalizationSources.map(item => Math.hypot(...item.point)));
  const unitRadius = legacy ? (showNormalization ? NORMALIZATION_UNIT_RADIUS : UNIT_RADIUS) : Math.min(FEATURE_FRAME.radius, 220 / maxRawLength);
  const rawScale = legacy ? (showNormalization ? NORMALIZATION_RAW_SCALE : PROJECTION_SCALE) : unitRadius;
  const xy = (point: Vector2, useUnitScale: boolean, useRawScale = false) => {
    const scale = useRawScale ? rawScale : useUnitScale ? unitRadius : legacy ? projectionScale : projectionScale * 2;
    return { x: origin.x + point[0] * scale, y: origin.y - point[1] * scale };
  };
  const pointById = new Map(points.map((item) => [item.id, item]));
  const motionPositions = new Map<string, { x: number; y: number }>();
  const boundedMotionProgress = Math.max(0, Math.min(1, motionProgress ?? 1));
  if (motionProgress !== undefined) previousPoints.forEach((oldPoint) => {
    const current = pointById.get(oldPoint.id);
    if (!current) return;
    const from = xy(oldPoint.point, unitCircle);
    const to = xy(current.point, unitCircle);
    motionPositions.set(oldPoint.id, {
      x: from.x + (to.x - from.x) * boundedMotionProgress,
      y: from.y + (to.y - from.y) * boundedMotionProgress,
    });
  });
  const rawMeanXY = rawMean ? xy(rawMean, unitCircle) : null;
  const targetXY = target ? xy(target, unitCircle) : null;
  const prefixXY = prefixMean ? xy(prefixMean, unitCircle) : null;
  const queryXY = query ? xy(query, unitCircle) : null;
  const prototypeRows = prototypes.map((prototype) => ({ prototype, point: xy(prototype.point, unitCircle) }));
  const modeLabel = mode === "projection" ? "二维投影" : mode === "herding" ? "Herding 选择" : mode === "prototypes" ? "类别均值向量" : "最近均值分类";

  const obstacles = [...points.map(item => xy(item.point, unitCircle)), ...prototypeRows.map(item => item.point), ...[rawMeanXY, targetXY, prefixXY, queryXY].filter((p): p is { x: number; y: number } => p !== null)];
  const labels: ChartLabel[] = [];
  if (queryXY) labels.push({ ...queryXY, id: "query", text: "query q" });
  prototypeRows.forEach(({ prototype, point }) => labels.push({ ...point, id: `mean-${prototype.classId}`, text: `μ${CLASS_VISUALS[prototype.classId].index} · exemplar 原型` }));
  if (rawMeanXY) labels.push({ ...rawMeanXY, id: "raw", text: "原始均值 μ̄y" });
  if (targetXY) labels.push({ ...targetXY, id: "target", text: "归一化类均值 μy" });
  if (prefixXY) labels.push({ ...prefixXY, id: "prefix", text: "当前前缀均值" });
  points.filter(item => showSampleLabels && (item.id === selectedId || points.length <= 4 || item.order !== undefined && (herdingRevealCount === undefined || item.order <= herdingRevealCount))).forEach(item => labels.push({ ...xy(item.point, unitCircle), id: item.id, text: item.order ? `p${item.order} · ${item.id}` : item.id }));
  const nearestClass = query ? [...prototypes].sort((a, b) => Math.hypot(a.point[0] - query[0], a.point[1] - query[1]) - Math.hypot(b.point[0] - query[0], b.point[1] - query[1]))[0]?.classId : undefined;

  return (
    <figure className={`feature-space feature-space--${mode} ${legacy ? "feature-space--legacy" : "feature-chart"}`} data-canonical-id="unit_circle">
      <figcaption className="feature-space__header">
        <div>
          <span className="eyebrow">{legacy ? modeLabel : "FEATURE SPACE"}</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        {unitCircle ? <span className="unit-badge">‖z‖₂ = 1</span> : null}
      </figcaption>
      <div className="feature-space__viewport">
        <svg viewBox={legacy ? (showNormalization ? "0 -220 760 780" : "0 0 360 264") : "0 0 640 520"} role="img" aria-label={`${title}. ${description}`}>
          <title>{title}</title>
          <desc>{description}</desc>
          {unitCircle ? <circle className="feature-space__unit-circle" cx={origin.x} cy={origin.y} r={unitRadius} data-canonical-id="l2_normalization" /> : null}
          <line className="feature-space__axis" x1={legacy ? (showNormalization ? 30 : 26) : 24} x2={legacy ? (showNormalization ? 730 : 334) : 616} y1={origin.y} y2={origin.y} />
          <line className="feature-space__axis" x1={origin.x} x2={origin.x} y1={legacy ? (showNormalization ? -220 : 16) : 24} y2={legacy ? (showNormalization ? 560 : 246) : 496} />

          {showNormalization ? normalizationSources.map((source) => {
            const normalized = pointById.get(source.id);
            if (!normalized) return null;
            const rawPoint = xy(source.point, false, true);
            const normalizedPoint = xy(normalized.point, true);
            return (
              <g key={`normalization-${source.id}`} className="feature-space__normalization" style={{ "--class-accent": CLASS_VISUALS[source.classId].color } as CSSProperties}>
                <line className="feature-space__normalization-ray" x1={origin.x} y1={origin.y} x2={rawPoint.x} y2={rawPoint.y} />
                <line className="feature-space__normalization-segment" x1={rawPoint.x} y1={rawPoint.y} x2={normalizedPoint.x} y2={normalizedPoint.y} />
                <circle className="feature-space__raw-point" cx={rawPoint.x} cy={rawPoint.y} r="4.2" />
                <title>{`样本 ${source.id}：原始表示 φ_after(x) 沿虚线经过原点方向，单位化点落在单位圆上`}</title>
              </g>
            );
          }) : null}
          <circle className="feature-space__origin" cx={origin.x} cy={origin.y} r="3" />

          {targetXY ? <line className="feature-space__target-ray" x1={origin.x} y1={origin.y} x2={targetXY.x} y2={targetXY.y} /> : null}
          {queryXY ? prototypeRows.map(({ prototype, point }) => <line key={`distance-${prototype.classId}`} className={`feature-space__distance${!legacy && prototype.classId === nearestClass ? " is-nearest" : ""}`} x1={queryXY.x} y1={queryXY.y} x2={point.x} y2={point.y} style={{ "--class-accent": CLASS_VISUALS[prototype.classId].color } as CSSProperties} />) : null}

          {previousPoints.map((oldPoint) => {
            const current = pointById.get(oldPoint.id);
            if (!current) return null;
            const from = xy(oldPoint.point, unitCircle);
            const to = motionPositions.get(oldPoint.id) ?? xy(current.point, unitCircle);
            return <g key={`drift-${oldPoint.id}`}><line className="feature-space__drift" x1={from.x} y1={from.y} x2={to.x} y2={to.y} /><circle className="feature-space__ghost" cx={from.x} cy={from.y} r="4" /><title>{`样本 ${oldPoint.id}：更新前的位置`}</title></g>;
          })}

          {points.map((item) => {
            const position = motionPositions.get(item.id) ?? xy(item.point, unitCircle);
            const motionTracked = motionProgress !== undefined && previousPoints.some((oldPoint) => oldPoint.id === item.id);
            const visibleOrder = item.order !== undefined && (herdingRevealCount === undefined || item.order <= herdingRevealCount) ? item.order : undefined;
            const sampleLabel = visibleOrder === 1
              ? { x: position.x - 8, y: position.y - 8, textAnchor: "end" as const }
              : visibleOrder === 2
                ? { x: position.x + 9, y: position.y < 42 ? position.y + 19 : position.y - 8, textAnchor: "start" as const }
                : visibleOrder === 3
                  ? { x: position.x + 9, y: position.y + 13, textAnchor: "start" as const }
                  : { x: position.x + 8, y: position.y - 7, textAnchor: "start" as const };
            return (
              <g key={item.id} className={`feature-space__sample${item.id === selectedId ? " is-selected" : ""}`} onMouseEnter={() => setSelectedId(item.id)} onFocus={() => setSelectedId(item.id)} onClick={() => setSelectedId(item.id)} tabIndex={focusableSamples ? 0 : -1} role="img" aria-label={`${CLASS_VISUALS[item.classId].displayLabel}，样本 ${item.id}${visibleOrder ? `，Herding 顺序 p${visibleOrder}` : ""}`} data-herding-selected={visibleOrder ? "true" : undefined} data-motion-tracked={motionTracked ? "true" : undefined}>
                <ClassFeatureMarker legacyShape={legacy} classId={item.classId} x={position.x} y={position.y} radius={(visibleOrder ? 7 : 5.5) * markerScale} selected={visibleOrder !== undefined} selectedClassName="is-herding-selected" />
                <title>{`${CLASS_VISUALS[item.classId].displayLabel} · 样本 ${item.id}${visibleOrder ? ` · Herding 顺序 p${visibleOrder}` : ""}`}</title>
                {legacy && showSampleLabels ? <text {...sampleLabel}>{visibleOrder ? `p${visibleOrder}` : item.id}</text> : null}
              </g>
            );
          })}

          {rawMeanXY ? <g className="feature-space__raw-mean"><path d={`M ${rawMeanXY.x} ${rawMeanXY.y - 6} L ${rawMeanXY.x + 6} ${rawMeanXY.y} L ${rawMeanXY.x} ${rawMeanXY.y + 6} L ${rawMeanXY.x - 6} ${rawMeanXY.y} Z`} />{legacy ? <text x={rawMeanXY.x + 9} y={rawMeanXY.y + 15}>原始均值</text> : null}</g> : null}
          {prefixXY ? <g className="feature-space__prefix-mean"><path d={`M ${prefixXY.x} ${prefixXY.y - 6} L ${prefixXY.x + 6} ${prefixXY.y} L ${prefixXY.x} ${prefixXY.y + 6} L ${prefixXY.x - 6} ${prefixXY.y} Z`} />{legacy ? <text x={prefixXY.x + 8} y={prefixXY.y + 17}>当前前缀均值</text> : null}</g> : null}
          {targetXY ? <g className="feature-space__target"><path d={starPath(targetXY.x, targetXY.y)} />{legacy ? <text x={targetXY.x + 11} y={targetXY.y - 9}>归一化类均值</text> : null}</g> : null}

          {prototypeRows.map(({ prototype, point }) => (
            <g key={`prototype-${prototype.classId}`} className="feature-space__prototype" style={{ "--class-accent": CLASS_VISUALS[prototype.classId].color } as CSSProperties}>
              <rect x={point.x - 6} y={point.y - 6} width="12" height="12" rx="2" />
              {legacy ? <text x={point.x + 9} y={point.y + (prototype.classId === "D" ? -2 : prototype.classId === "A" ? 22 : 18)}>{CLASS_VISUALS[prototype.classId].displayLabel} 均值</text> : null}
            </g>
          ))}

          {queryXY ? <g className="feature-space__query"><path d={`M ${queryXY.x} ${queryXY.y - 8} L ${queryXY.x + 8} ${queryXY.y} L ${queryXY.x} ${queryXY.y + 8} L ${queryXY.x - 8} ${queryXY.y} Z`} />{legacy ? <text x={queryXY.x + 10} y={queryXY.y - 10}>待分类样本</text> : null}</g> : null}
          {!legacy ? <ChartLabels labels={labels} obstacles={obstacles} /> : null}
        </svg>
      </div>
      <aside className="feature-space__aside">
        <div className="feature-space__legend" aria-label="特征空间图例">
          {!legacy ? <><span><i className="legend-dot" /> 样本特征 z</span>{query ? <span><i className="legend-query" /> query q</span> : null}</> : null}
          {unitCircle ? <span><i className="legend-ring" /> 单位圆</span> : null}
          {mode === "herding" ? <><span><i className="legend-dot" /> 单位化样本</span>{showNormalization ? <span><i className="legend-source" /> 原始表示 φ(x)</span> : null}<span><i className="legend-raw" /> 原始均值</span>{prefixMean ? <span><i className="legend-prefix" /> 当前前缀均值</span> : null}<span><i className="legend-star" /> 目标均值</span></> : null}
          {mode === "prototypes" || mode === "inference" ? <span><i className="legend-square" /> 当前 exemplar 均值</span> : null}
          {mode === "projection" && (legacy || previousPoints.length > 0) ? <span><i className="legend-ghost" /> 更新前的位置</span> : null}
        </div>
        {asideContent ? <div className="feature-space__aside-content">{asideContent}</div> : null}
      </aside>
    </figure>
  );
}
