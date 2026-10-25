import { useId, type CSSProperties } from "react";
import "./mini-network-glyph.css";

export type NetworkIdentity = "neutral" | "frozen" | "trainable";

export type MiniNetworkLayer = {
  id: string;
  label: string;
  nodeCount: number;
  displayNodeCount?: number;
  identity?: NetworkIdentity;
  detail?: string;
};

export type MiniNetworkConnection = {
  id: string;
  fromLayer: string;
  fromNode: number;
  toLayer: string;
  toNode: number;
  state?: "neutral" | "focused" | "muted";
  progress?: number;
};

export type MiniNetworkFocus = {
  layers?: string[];
  nodes?: string[];
  edges?: string[];
};

export type MiniNetworkGlyphProps = {
  layers: MiniNetworkLayer[];
  label: string;
  description: string;
  connections?: MiniNetworkConnection[];
  connectAdjacent?: boolean;
  focus?: MiniNetworkFocus;
  /** Hide optional metadata in a larger composition; labels and compression disclosure remain. */
  showDetails?: boolean;
  density?: 'compact' | 'standard' | 'inspect';
  className?: string;
};

const MAX_VISIBLE_NODES = 7;
const nodeKey = (layerId: string, nodeIndex: number) => `${layerId}:${nodeIndex}`;
const visibleCount = (layer: MiniNetworkLayer) => Math.min(layer.nodeCount, layer.displayNodeCount ?? MAX_VISIBLE_NODES, MAX_VISIBLE_NODES);

export function validateMiniNetworkGlyph({ layers, connections = [] }: Pick<MiniNetworkGlyphProps, "layers" | "connections">) {
  const problems: string[] = [];
  if (layers.length < 2) problems.push("MiniNetworkGlyph needs at least two layers.");
  const ids = new Set<string>();
  layers.forEach((layer) => {
    if (!layer.id.trim()) problems.push("Every layer needs a stable id.");
    if (ids.has(layer.id)) problems.push(`Layer id '${layer.id}' is duplicated.`);
    ids.add(layer.id);
    if (!Number.isInteger(layer.nodeCount) || layer.nodeCount < 1) problems.push(`Layer '${layer.id}' needs a positive integer nodeCount.`);
    if (layer.displayNodeCount !== undefined && (!Number.isInteger(layer.displayNodeCount) || layer.displayNodeCount < 1)) problems.push(`Layer '${layer.id}' needs a positive integer displayNodeCount.`);
  });
  const edgeIds = new Set<string>();
  connections.forEach((edge) => {
    if (edgeIds.has(edge.id)) problems.push(`Connection id '${edge.id}' is duplicated.`);
    edgeIds.add(edge.id);
    const from = layers.find((layer) => layer.id === edge.fromLayer);
    const to = layers.find((layer) => layer.id === edge.toLayer);
    if (!from || !to) problems.push(`Connection '${edge.id}' references an unknown layer.`);
    if (from && (!Number.isInteger(edge.fromNode) || edge.fromNode < 0 || edge.fromNode >= visibleCount(from))) problems.push(`Connection '${edge.id}' has an invalid source node.`);
    if (to && (!Number.isInteger(edge.toNode) || edge.toNode < 0 || edge.toNode >= visibleCount(to))) problems.push(`Connection '${edge.id}' has an invalid target node.`);
    if (edge.progress !== undefined && (!Number.isFinite(edge.progress) || edge.progress < 0 || edge.progress > 1)) problems.push(`Connection '${edge.id}' needs progress between 0 and 1.`);
  });
  return problems;
}

function fullConnections(layers: MiniNetworkLayer[]): MiniNetworkConnection[] {
  return layers.slice(0, -1).flatMap((layer, layerIndex) => {
    const next = layers[layerIndex + 1];
    return Array.from({ length: visibleCount(layer) }, (_, fromNode) =>
      Array.from({ length: visibleCount(next) }, (__, toNode) => ({
        id: `${layer.id}-${fromNode}-${next.id}-${toNode}`,
        fromLayer: layer.id,
        fromNode,
        toLayer: next.id,
        toNode,
      })),
    ).flat();
  });
}

export function MiniNetworkGlyph({ layers, label, description, connections, connectAdjacent = false, focus, showDetails = true, density = 'standard', className = "" }: MiniNetworkGlyphProps) {
  const instanceId = useId().replace(/:/g, "");
  const titleId = `rk-network-${instanceId}-title`;
  const descriptionId = `rk-network-${instanceId}-description`;
  const problems = validateMiniNetworkGlyph({ layers, connections });
  if (problems.length) return <div className="rk-error" role="alert">{problems.join(" ")}</div>;

  // A shared coordinate frame keeps node size and graph height independent of
  // layer count. Density and available width determine the rendered scale.
  const width = 384;
  // Nodes occupy y=14..150 with equal padding above and below the graph.
  const height = 164;
  const top = 22;
  const usableHeight = 120;
  const positions = new Map<string, { x: number; y: number }>();
  layers.forEach((layer, layerIndex) => {
    const count = visibleCount(layer);
    const x = ((layerIndex + 0.5) / layers.length) * width;
    Array.from({ length: count }, (_, nodeIndex) => {
      const y = count === 1 ? top + usableHeight / 2 : top + (nodeIndex / (count - 1)) * usableHeight;
      positions.set(nodeKey(layer.id, nodeIndex), { x, y });
    });
  });
  const renderedConnections = connections ?? (connectAdjacent ? fullConnections(layers) : []);
  const focused = Boolean(focus?.layers?.length || focus?.nodes?.length || focus?.edges?.length);
  const isFocusedNode = (layerId: string, index: number) => focus?.layers?.includes(layerId) || focus?.nodes?.includes(nodeKey(layerId, index));

  return <figure className={`rk-mini-network ${className}`.trim()} data-density={density}>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${titleId} ${descriptionId}`} preserveAspectRatio="xMidYMid meet">
      <title id={titleId}>{label}</title>
      <desc id={descriptionId}>{description}</desc>
      <g className="rk-mini-network__edges" aria-hidden="true">
        {renderedConnections.map((edge) => {
          const start = positions.get(nodeKey(edge.fromLayer, edge.fromNode))!;
          const end = positions.get(nodeKey(edge.toLayer, edge.toNode))!;
          const edgeIsFocused = edge.state === "focused" || focus?.edges?.includes(edge.id);
          const edgeIsMuted = edge.state === "muted" || (focused && !edgeIsFocused && !isFocusedNode(edge.fromLayer, edge.fromNode) && !isFocusedNode(edge.toLayer, edge.toNode));
          const length = Math.hypot(end.x - start.x, end.y - start.y) || 1;
          const dx = (end.x - start.x) / length * 8;
          const dy = (end.y - start.y) / length * 8;
          const coordinates = { x1: start.x + dx, y1: start.y + dy, x2: end.x - dx, y2: end.y - dy };
          return <g key={edge.id}>
            <line data-network-edge={edge.id} className={`${edgeIsFocused && edge.progress === undefined ? "is-focused" : ""} ${edgeIsMuted ? "is-muted" : ""}`.trim()} {...coordinates} />
            {edge.progress !== undefined && <line
              data-network-edge-progress={edge.id}
              data-progress={edge.progress.toFixed(3)}
              className="rk-mini-network__edge-progress"
              pathLength="1"
              style={{ "--rk-network-edge-progress": edge.progress } as CSSProperties}
              {...coordinates}
            />}
          </g>;
        })}
      </g>
      {layers.map((layer) => <g key={layer.id} data-network-layer={layer.id} data-identity={layer.identity ?? "neutral"} className={focus?.layers?.includes(layer.id) ? "is-focused" : ""} aria-hidden="true">
        {Array.from({ length: visibleCount(layer) }, (_, nodeIndex) => {
          const point = positions.get(nodeKey(layer.id, nodeIndex))!;
          const nodeFocused = isFocusedNode(layer.id, nodeIndex);
          return <circle key={nodeIndex} data-network-node={nodeKey(layer.id, nodeIndex)} className={`${nodeFocused ? "is-focused" : ""} ${focused && !nodeFocused ? "is-muted" : ""}`.trim()} cx={point.x} cy={point.y} r="8" />;
        })}
      </g>)}
    </svg>
    <ol className="rk-mini-network__labels" style={{ gridTemplateColumns: `repeat(${layers.length}, minmax(0, 1fr))` }}>
      {layers.map((layer) => <li key={layer.id} data-network-label={layer.id} data-identity={layer.identity ?? "neutral"}>
        <strong>{layer.label}</strong>
        {showDetails && <span>{layer.identity ?? "neutral"} · {layer.nodeCount} {layer.nodeCount === 1 ? "node" : "nodes"}</span>}
        {layer.nodeCount > visibleCount(layer) && <small>Original structure: {layer.nodeCount}; showing {visibleCount(layer)} representative nodes.</small>}
        {showDetails && layer.detail && <small>{layer.detail}</small>}
      </li>)}
    </ol>
    {showDetails && <figcaption>{description}</figcaption>}
  </figure>;
}
