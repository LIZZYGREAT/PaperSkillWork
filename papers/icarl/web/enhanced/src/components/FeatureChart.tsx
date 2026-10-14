/** Paper-owned visual grammar. Coordinates remain those of the shared runtime. */
import { placeLabel } from "../shared/animation/easing";

export const FEATURE_FRAME = { width: 640, height: 520, x: 320, y: 260, radius: 160 };
export type ChartPosition = { x: number; y: number };
export type ChartLabel = ChartPosition & { id: string; text: string };

export function featureStar(x: number, y: number, outer = 9, inner = 4) {
  return Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + index * Math.PI / 5;
    return `${index === 0 ? 'M' : 'L'}${x + Math.cos(angle) * radius},${y + Math.sin(angle) * radius}`;
  }).join(' ') + ' Z';
}

/**
 * Places labels around their marks and keeps every one of them inside the frame at any scale.
 * Earlier labels win the space they occupy; later ones flip or slide instead of overlapping.
 */
export function ChartLabels({ labels, obstacles = [], width = FEATURE_FRAME.width, height = FEATURE_FRAME.height, fontSize = 15 }: {
  labels: ChartLabel[];
  obstacles?: ChartPosition[];
  width?: number;
  height?: number;
  fontSize?: number;
}) {
  const boxes: { left: number; top: number; right: number; bottom: number }[] = [];
  return <g className="feature-chart-labels">{labels.map(label => {
    const estimate = [...label.text].reduce((sum, char) => sum + (/[\u2e80-\u9fff\uff00-\uffef]/.test(char) ? 1 : 0.62), 0) * fontSize;
    const options = [20, 34, 52, 78, 106].flatMap(offset => [[1, -1], [-1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
      const placed = placeLabel({ x: label.x, y: label.y }, label.text, {
        dx: sx * offset,
        dy: sy * offset,
        anchor: sx < 0 ? "end" : "start",
        fontSize,
        bounds: { width, height },
        pad: 10,
      });
      const textWidth = estimate * (placed.anchor === "middle" ? 0.5 : 1);
      const box = {
        left: placed.anchor === "end" ? placed.x - estimate : placed.x,
        right: placed.anchor === "end" ? placed.x : placed.x + estimate,
        top: placed.y - fontSize * 0.9,
        bottom: placed.y + fontSize * 0.3,
      };
      const overlaps = boxes.filter(b => box.left < b.right + 6 && box.right > b.left - 6 && box.top < b.bottom + 4 && box.bottom > b.top - 4).length;
      const marks = obstacles.filter(p => p.x + 10 > box.left && p.x - 10 < box.right && p.y + 10 > box.top && p.y - 10 < box.bottom).length;
      return { ...placed, box, textWidth, score: overlaps * 10000 + marks * 1000 + offset };
    }));
    const best = options.sort((a, b) => a.score - b.score)[0];
    boxes.push(best.box);
    const leaderEnd = best.anchor === "end" ? best.x + 2 : best.x - 2;
    return <g key={label.id}>
      <line className="feature-chart-labels__leader" x1={label.x} y1={label.y} x2={leaderEnd} y2={best.y - fontSize * 0.36} />
      <text x={best.x} y={best.y} textAnchor={best.anchor}>{label.text}</text>
    </g>;
  })}</g>;
}
