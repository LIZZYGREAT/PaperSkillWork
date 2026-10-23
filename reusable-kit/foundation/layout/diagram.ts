export type DiagramPoint = { x: number; y: number };
export type DiagramNodeSize = { width: number; height: number };
export type DiagramPathMode = "straight" | "curve" | "orthogonal";
export type DiagramPath = { d: string; label: DiagramPoint };
export type DiagramPort = "left" | "right" | "top" | "bottom";
export type DiagramPortMode = "straight" | "smooth" | "orthogonal";
export type DiagramPortPath = { d: string; label: DiagramPoint; start: DiagramPoint; end: DiagramPoint; startPort: DiagramPort; endPort: DiagramPort };

function boundaryPoint(center: DiagramPoint, toward: DiagramPoint, size: DiagramNodeSize): DiagramPoint {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  const scale = 1 / Math.max(Math.abs(dx) / (size.width / 2), Math.abs(dy) / (size.height / 2), 0.0001);
  return { x: center.x + dx * scale, y: center.y + dy * scale };
}

export function createDiagramPath(
  source: DiagramPoint,
  target: DiagramPoint,
  sourceSize: DiagramNodeSize,
  targetSize: DiagramNodeSize,
  mode: DiagramPathMode = "straight",
): DiagramPath {
  const start = boundaryPoint(source, target, sourceSize);
  const end = boundaryPoint(target, source, targetSize);
  const distance = Math.hypot(end.x - start.x, end.y - start.y);

  if (mode === "orthogonal") {
    if (end.x <= start.x) {
      const gutterY = Math.min(start.y, end.y) - 64;
      return { d: `M ${start.x} ${start.y} L ${start.x} ${gutterY} L ${end.x} ${gutterY} L ${end.x} ${end.y}`, label: { x: (start.x + end.x) / 2, y: gutterY } };
    }
    const middleX = (start.x + end.x) / 2;
    return { d: `M ${start.x} ${start.y} L ${middleX} ${start.y} L ${middleX} ${end.y} L ${end.x} ${end.y}`, label: { x: middleX, y: (start.y + end.y) / 2 } };
  }

  if (mode === "curve") {
    const middleX = (start.x + end.x) / 2;
    const middleY = (start.y + end.y) / 2;
    const loopBack = end.x <= start.x;
    const offset = Math.min(76, Math.max(30, distance * 0.16));
    const control = loopBack
      ? { x: middleX, y: Math.min(start.y, end.y) - offset }
      : { x: middleX, y: middleY - offset };
    return {
      d: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
      label: { x: (start.x + 2 * control.x + end.x) / 4, y: (start.y + 2 * control.y + end.y) / 4 },
    };
  }

  return { d: `M ${start.x} ${start.y} L ${end.x} ${end.y}`, label: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 } };
}

/** Point on one named edge of a box, using the box centre and size. */
export function diagramPortPoint(center: DiagramPoint, size: DiagramNodeSize, port: DiagramPort, offset = 0.5): DiagramPoint {
  const along = Math.max(0.05, Math.min(0.95, offset));
  switch (port) {
    case "left": return { x: center.x - size.width / 2, y: center.y - size.height / 2 + size.height * along };
    case "right": return { x: center.x + size.width / 2, y: center.y - size.height / 2 + size.height * along };
    case "top": return { x: center.x - size.width / 2 + size.width * along, y: center.y - size.height / 2 };
    default: return { x: center.x - size.width / 2 + size.width * along, y: center.y + size.height / 2 };
  }
}

/**
 * Pick the pair of box edges that a connector should leave from and arrive at.
 * Connectors stay on the dominant axis, so a diagram keeps a readable direction
 * when the reader resizes the page instead of being rescaled to fit.
 */
export function chooseDiagramPorts(
  source: DiagramPoint,
  target: DiagramPoint,
  sourceSize: DiagramNodeSize,
  targetSize: DiagramNodeSize,
): { startPort: DiagramPort; endPort: DiagramPort } {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  if (Math.abs(dx) >= Math.abs(dy) * 0.9) {
    return dx >= 0 ? { startPort: "right", endPort: "left" } : { startPort: "left", endPort: "right" };
  }
  return dy >= 0 ? { startPort: "bottom", endPort: "top" } : { startPort: "top", endPort: "bottom" };
}

/**
 * Port-anchored connector geometry. `mode: "smooth"` is a cubic funnel that keeps
 * converging edges from overlapping the boxes they connect.
 */
export function createPortDiagramPath(
  source: DiagramPoint,
  target: DiagramPoint,
  sourceSize: DiagramNodeSize,
  targetSize: DiagramNodeSize,
  options: { mode?: DiagramPortMode; startPort?: DiagramPort; endPort?: DiagramPort; startOffset?: number; endOffset?: number } = {},
): DiagramPortPath {
  const chosen = chooseDiagramPorts(source, target, sourceSize, targetSize);
  const startPort = options.startPort ?? chosen.startPort;
  const endPort = options.endPort ?? chosen.endPort;
  const start = diagramPortPoint(source, sourceSize, startPort, options.startOffset);
  const end = diagramPortPoint(target, targetSize, endPort, options.endOffset);
  const mode = options.mode ?? "straight";
  const horizontal = ["left", "right"].includes(startPort);
  const label = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

  if (mode === "orthogonal") {
    if (horizontal) {
      const middleX = (start.x + end.x) / 2;
      return { d: `M ${start.x} ${start.y} L ${middleX} ${start.y} L ${middleX} ${end.y} L ${end.x} ${end.y}`, label: { x: middleX, y: (start.y + end.y) / 2 }, start, end, startPort, endPort };
    }
    const middleY = (start.y + end.y) / 2;
    return { d: `M ${start.x} ${start.y} L ${start.x} ${middleY} L ${end.x} ${middleY} L ${end.x} ${end.y}`, label: { x: (start.x + end.x) / 2, y: middleY }, start, end, startPort, endPort };
  }

  if (mode === "smooth") {
    if (horizontal) {
      const bend = Math.max(12, Math.abs(end.x - start.x) * 0.45);
      const sign = end.x >= start.x ? 1 : -1;
      return {
        d: `M ${start.x} ${start.y} C ${start.x + bend * sign} ${start.y}, ${end.x - bend * sign} ${end.y}, ${end.x} ${end.y}`,
        label: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        start,
        end,
        startPort,
        endPort,
      };
    }
    const bend = Math.max(12, Math.abs(end.y - start.y) * 0.45);
    const sign = end.y >= start.y ? 1 : -1;
    return {
      d: `M ${start.x} ${start.y} C ${start.x} ${start.y + bend * sign}, ${end.x} ${end.y - bend * sign}, ${end.x} ${end.y}`,
      label: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
      start,
      end,
      startPort,
      endPort,
    };
  }

  return { d: `M ${start.x} ${start.y} L ${end.x} ${end.y}`, label, start, end, startPort, endPort };
}
