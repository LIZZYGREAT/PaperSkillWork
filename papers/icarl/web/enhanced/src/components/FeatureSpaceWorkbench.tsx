import type { CSSProperties } from "react";
import type { Prototype, Vector2, ClassId } from "../data/icarl-runtime";
import { CLASS_VISUALS } from "../data/icarl-runtime";

export type FeaturePoint = {
  id: string;
  classId: ClassId;
  point: Vector2;
  order?: number;
};

export type FeatureSpaceMode = "projection" | "herding" | "prototypes" | "inference";

const ORIGIN = { x: 180, y: 132 };
const UNIT_RADIUS = 94;
const PROJECTION_SCALE = 39;

function xy(point: Vector2, unitCircle: boolean) {
  const scale = unitCircle ? UNIT_RADIUS : PROJECTION_SCALE;
  return { x: ORIGIN.x + point[0] * scale, y: ORIGIN.y - point[1] * scale };
}

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
  showSampleLabels = true,
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
  showSampleLabels?: boolean;
}) {
  const pointById = new Map(points.map((item) => [item.id, item]));
  const rawMeanXY = rawMean ? xy(rawMean, unitCircle) : null;
  const targetXY = target ? xy(target, unitCircle) : null;
  const prefixXY = prefixMean ? xy(prefixMean, unitCircle) : null;
  const queryXY = query ? xy(query, unitCircle) : null;
  const prototypeRows = prototypes.map((prototype) => ({ prototype, point: xy(prototype.point, unitCircle) }));
  const label = mode === "projection" ? "2D teaching projection" : `${mode} feature space`;

  return (
    <figure className={`feature-space feature-space--${mode}`} data-canonical-id="unit_circle">
      <figcaption className="feature-space__header">
        <div>
          <span className="eyebrow">{label}</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        {unitCircle ? <span className="unit-badge">‖z‖₂ = 1</span> : null}
      </figcaption>
      <div className="feature-space__viewport">
        <svg viewBox="0 0 360 264" role="img" aria-label={`${title}. ${description}`}>
          <title>{title}</title>
          <desc>{description}</desc>
          {unitCircle ? <circle className="feature-space__unit-circle" cx={ORIGIN.x} cy={ORIGIN.y} r={UNIT_RADIUS} data-canonical-id="l2_normalization" /> : null}
          <line className="feature-space__axis" x1="26" x2="334" y1={ORIGIN.y} y2={ORIGIN.y} />
          <line className="feature-space__axis" x1={ORIGIN.x} x2={ORIGIN.x} y1="16" y2="246" />
          <circle className="feature-space__origin" cx={ORIGIN.x} cy={ORIGIN.y} r="3" />

          {targetXY ? <line className="feature-space__target-ray" x1={ORIGIN.x} y1={ORIGIN.y} x2={targetXY.x} y2={targetXY.y} /> : null}
          {queryXY ? prototypeRows.map(({ prototype, point }) => <line key={`distance-${prototype.classId}`} className="feature-space__distance" x1={queryXY.x} y1={queryXY.y} x2={point.x} y2={point.y} style={{ "--class-accent": CLASS_VISUALS[prototype.classId].color } as CSSProperties} />) : null}

          {previousPoints.map((oldPoint) => {
            const current = pointById.get(oldPoint.id);
            if (!current) return null;
            const from = xy(oldPoint.point, unitCircle);
            const to = xy(current.point, unitCircle);
            return <g key={`drift-${oldPoint.id}`}><line className="feature-space__drift" x1={from.x} y1={from.y} x2={to.x} y2={to.y} /><circle className="feature-space__ghost" cx={from.x} cy={from.y} r="4" /><title>{oldPoint.id}: previous position to current position</title></g>;
          })}

          {points.map((item) => {
            const position = xy(item.point, unitCircle);
            const color = CLASS_VISUALS[item.classId].color;
            return (
              <g key={item.id} className="feature-space__sample" tabIndex={0} role="img" aria-label={`${CLASS_VISUALS[item.classId].label}, ${item.id}${item.order ? `, herding order ${item.order}` : ""}`}>
                <circle className="sample-mark" cx={position.x} cy={position.y} r={item.order ? "6.5" : "5.5"} fill={color} />
                <title>{`${CLASS_VISUALS[item.classId].label} · ${item.id}${item.order ? ` · Herding ${item.order}` : ""}`}</title>
                {showSampleLabels ? <text x={position.x + 8} y={position.y - 7}>{item.order ? `p${item.order}` : item.id}</text> : null}
              </g>
            );
          })}

          {rawMeanXY ? <g className="feature-space__raw-mean"><path d={`M ${rawMeanXY.x} ${rawMeanXY.y - 6} L ${rawMeanXY.x + 6} ${rawMeanXY.y} L ${rawMeanXY.x} ${rawMeanXY.y + 6} L ${rawMeanXY.x - 6} ${rawMeanXY.y} Z`} /><text x={rawMeanXY.x + 9} y={rawMeanXY.y + 15}>raw mean</text></g> : null}
          {prefixXY ? <g className="feature-space__prefix-mean"><path d={`M ${prefixXY.x} ${prefixXY.y - 6} L ${prefixXY.x + 6} ${prefixXY.y} L ${prefixXY.x} ${prefixXY.y + 6} L ${prefixXY.x - 6} ${prefixXY.y} Z`} /><text x={prefixXY.x + 8} y={prefixXY.y + 17}>prefix mean</text></g> : null}
          {targetXY ? <g className="feature-space__target"><path d={starPath(targetXY.x, targetXY.y)} /><text x={targetXY.x + 11} y={targetXY.y - 9}>normalized class mean</text></g> : null}

          {prototypeRows.map(({ prototype, point }) => (
            <g key={`prototype-${prototype.classId}`} className="feature-space__prototype" style={{ "--class-accent": CLASS_VISUALS[prototype.classId].color } as CSSProperties}>
              <rect x={point.x - 6} y={point.y - 6} width="12" height="12" rx="2" />
              <text x={point.x + 9} y={point.y + 18}>{CLASS_VISUALS[prototype.classId].label} prototype</text>
            </g>
          ))}

          {queryXY ? <g className="feature-space__query"><path d={`M ${queryXY.x} ${queryXY.y - 8} L ${queryXY.x + 8} ${queryXY.y} L ${queryXY.x} ${queryXY.y + 8} L ${queryXY.x - 8} ${queryXY.y} Z`} /><text x={queryXY.x + 10} y={queryXY.y - 10}>query</text></g> : null}
        </svg>
      </div>
      <div className="feature-space__legend" aria-label="Feature space legend">
        {unitCircle ? <span><i className="legend-ring" /> Unit circle</span> : null}
        {mode === "herding" ? <><span><i className="legend-dot" /> normalized samples</span><span><i className="legend-raw" /> raw mean</span><span><i className="legend-star" /> normalized target</span></> : null}
        {mode === "prototypes" || mode === "inference" ? <span><i className="legend-square" /> current exemplar prototype</span> : null}
        {mode === "projection" ? <span><i className="legend-ghost" /> same sample before update</span> : null}
      </div>
    </figure>
  );
}
