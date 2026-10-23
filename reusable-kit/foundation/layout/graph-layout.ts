export type GraphLayoutItem = { id: string; position?: { x: number; y: number } };

export type GraphLayoutOptions = {
  nodeWidth: number;
  nodeHeight: number;
  /** Horizontal distance between two neighbours on the same row. */
  gapX?: number;
  /** Vertical distance between two rows. */
  rowGap?: number;
  padding?: number;
  /**
   * Authored `y` values closer than this are treated as the same row, so a paper
   * can keep hand-written coordinates while the coach still gets a compact grid.
   */
  rowBucket?: number;
  /** Wrap a very wide row onto extra rows. */
  maxPerRow?: number;
};

export type GraphLayout = {
  positions: Map<string, { x: number; y: number }>;
  rows: string[][];
  width: number;
  height: number;
};

/**
 * Turn authored node coordinates into a centred grid: states on the same visual
 * row are spread evenly across the canvas, and the canvas shrinks to its content.
 * Nothing is scaled, so in-node text keeps its size.
 */
export function layoutGraphByRows(items: GraphLayoutItem[], options: GraphLayoutOptions): GraphLayout {
  const { nodeWidth, nodeHeight, gapX = 44, rowGap = 56, padding = 26, rowBucket = 130, maxPerRow = 5 } = options;
  if (!items.length) return { positions: new Map(), rows: [], width: nodeWidth + padding * 2, height: nodeHeight + padding * 2 };

  const ys = items.map((item) => item.position?.y ?? 0);
  const minY = Math.min(...ys);
  const bucketOf = new Map<string, number>();
  for (const item of items) bucketOf.set(item.id, Math.max(0, Math.round(((item.position?.y ?? 0) - minY) / rowBucket)));
  const bucketKeys = [...new Set(bucketOf.values())].sort((left, right) => left - right);

  const rows: string[][] = [];
  for (const key of bucketKeys) {
    const members = items
      .filter((item) => bucketOf.get(item.id) === key)
      .sort((left, right) => (left.position?.x ?? 0) - (right.position?.x ?? 0));
    for (let index = 0; index < members.length; index += maxPerRow) {
      rows.push(members.slice(index, index + maxPerRow).map((item) => item.id));
    }
  }

  const widest = Math.max(...rows.map((row) => row.length));
  const width = padding * 2 + widest * nodeWidth + (widest - 1) * gapX;
  const height = padding * 2 + rows.length * nodeHeight + (rows.length - 1) * rowGap;
  const positions = new Map<string, { x: number; y: number }>();
  rows.forEach((row, rowIndex) => {
    const rowWidth = row.length * nodeWidth + (row.length - 1) * gapX;
    const startX = (width - rowWidth) / 2 + nodeWidth / 2;
    const y = padding + nodeHeight / 2 + rowIndex * (nodeHeight + rowGap);
    row.forEach((id, index) => positions.set(id, { x: startX + index * (nodeWidth + gapX), y }));
  });
  return { positions, rows, width, height };
}
