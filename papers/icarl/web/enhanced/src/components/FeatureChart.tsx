/** Paper-owned visual grammar. Coordinates remain those of the shared runtime. */
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

/** Try four quadrants, then longer leaders; protect marks and earlier labels. */
export function ChartLabels({ labels, obstacles = [], width = FEATURE_FRAME.width, height = FEATURE_FRAME.height }: {
  labels: ChartLabel[];
  obstacles?: ChartPosition[];
  width?: number;
  height?: number;
}) {
  const boxes: { left: number; top: number; right: number; bottom: number }[] = [];
  return <g className="feature-chart-labels">{labels.map(label => {
    const textWidth = [...label.text].reduce((sum, char) => sum + (/[^\x00-\x7f]/.test(char) ? 18 : 10), 0);
    const options = [18, 32, 50, 76, 104].flatMap(offset => [[1, -1], [-1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
      const x = Math.max(20 + (sx < 0 ? textWidth : 0), Math.min(width - 20 - (sx > 0 ? textWidth : 0), label.x + sx * offset));
      const y = Math.max(32, Math.min(height - 20, label.y + sy * offset));
      const box = { left: sx < 0 ? x - textWidth : x, right: sx < 0 ? x : x + textWidth, top: y - 18, bottom: y + 4 };
      const overlaps = boxes.filter(b => box.left < b.right + 8 && box.right > b.left - 8 && box.top < b.bottom + 6 && box.bottom > b.top - 6).length;
      const marks = obstacles.filter(p => p.x + 10 > box.left && p.x - 10 < box.right && p.y + 10 > box.top && p.y - 10 < box.bottom).length;
      return { x, y, sx, box, score: overlaps * 10000 + marks * 1000 + offset };
    }));
    const best = options.sort((a, b) => a.score - b.score)[0];
    boxes.push(best.box);
    return <g key={label.id}>
      <line className="feature-chart-labels__leader" x1={label.x} y1={label.y} x2={best.x} y2={best.y - 5} />
      <text x={best.x} y={best.y} textAnchor={best.sx < 0 ? 'end' : 'start'}>{label.text}</text>
    </g>;
  })}</g>;
}
