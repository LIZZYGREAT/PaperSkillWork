import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortDiagramPath } from "./diagram";
import type { DiagramPortMode } from "./diagram";

export type DiagramRole = "input" | "model" | "trainable" | "frozen" | "target" | "objective" | "label" | "update" | "output";

export type DiagramNodeSpec = {
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  badge?: string;
  role?: DiagramRole;
  /** 1-based grid column in the wide layout. */
  column: number;
  /** 1-based grid row in the wide layout. */
  row: number;
  columnSpan?: number;
  rowSpan?: number;
  /** Reading order when the diagram reflows to a single column. */
  order?: number;
  /** Short plain-text name used by the reflowed list when this node is an input. */
  inputLabel?: string;
};

export type DiagramEdgeSpec = {
  id: string;
  from: string;
  to: string;
  kind?: "data" | "gradient" | "control";
  mode?: DiagramPortMode;
  label?: string;
};

export type DiagramLegendItem = {
  id: string;
  text: string;
  swatch: "solid" | "gradient" | "frozen" | "trainable" | "update";
};

export type DiagramSpec = {
  columns: number;
  nodes: DiagramNodeSpec[];
  edges: DiagramEdgeSpec[];
  legend?: DiagramLegendItem[];
  note?: ReactNode;
};

export type DiagramFocus = { nodes?: string[]; edges?: string[] };

type MeasuredEdge = { id: string; d: string; label: { x: number; y: number } | null };

const DEFAULT_STACK_MIN = 660;

function readingOrder(node: DiagramNodeSpec): number {
  return node.order ?? node.row * 100 + node.column;
}

/**
 * Declarative teaching diagram: real DOM nodes in a grid plus connectors measured
 * from those nodes. Wide layouts draw the graph; narrow layouts reflow the same
 * spec into an ordered derivation list that names every input. Nothing is scaled
 * down, so in-figure text keeps its size at every viewport.
 */
export function DiagramFlow({ spec, focus, label, className = "", framed = true, stackMinWidth }: {
  spec: DiagramSpec;
  focus?: DiagramFocus;
  label: string;
  className?: string;
  framed?: boolean;
  stackMinWidth?: number;
}) {
  const markerId = `rk-diagram-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());
  const [stacked, setStacked] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [paths, setPaths] = useState<MeasuredEdge[]>([]);

  const edgeByEndpoints = useMemo(() => {
    const incoming = new Map<string, string[]>();
    for (const edge of spec.edges) {
      incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge.from]);
    }
    return incoming;
  }, [spec]);
  const titleById = useMemo(() => new Map(spec.nodes.map((node) => [node.id, node])), [spec]);
  const orderedNodes = useMemo(() => [...spec.nodes].sort((left, right) => readingOrder(left) - readingOrder(right)), [spec]);
  const focusNodes = focus?.nodes ? new Set(focus.nodes) : null;
  const focusEdges = focus?.edges ? new Set(focus.edges) : null;

  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    const threshold = stackMinWidth ?? Math.max(DEFAULT_STACK_MIN, spec.columns * 124 + 24);
    const nextStacked = box.width > 0 && box.width < threshold;
    setStacked((current) => (current === nextStacked ? current : nextStacked));
    if (nextStacked) {
      setSize((current) => (current.width === 0 && current.height === 0 ? current : { width: 0, height: 0 }));
      setPaths((current) => (current.length === 0 ? current : []));
      return;
    }
    const boxes = new Map<string, { cx: number; cy: number; width: number; height: number }>();
    for (const node of spec.nodes) {
      const element = nodeRefs.current.get(node.id);
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      boxes.set(node.id, { cx: rect.left - box.left + rect.width / 2, cy: rect.top - box.top + rect.height / 2, width: rect.width, height: rect.height });
    }
    const nextPaths: MeasuredEdge[] = [];
    for (const edge of spec.edges) {
      const from = boxes.get(edge.from);
      const to = boxes.get(edge.to);
      if (!from || !to) continue;
      const geometry = createPortDiagramPath(
        { x: from.cx, y: from.cy },
        { x: to.cx, y: to.cy },
        { width: from.width, height: from.height },
        { width: to.width, height: to.height },
        { mode: edge.mode ?? "straight" },
      );
      nextPaths.push({ id: edge.id, d: geometry.d, label: edge.label ? geometry.label : null });
    }
    setSize((current) => (Math.abs(current.width - box.width) < 0.5 && Math.abs(current.height - box.height) < 0.5 ? current : { width: box.width, height: box.height }));
    setPaths(nextPaths);
  }, [spec, stackMinWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    measure();
    const observer = new ResizeObserver(() => measure());
    observer.observe(canvas);
    for (const element of nodeRefs.current.values()) observer.observe(element);
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => measure()).catch(() => {});
    }
    return () => observer.disconnect();
  }, [measure, stacked]);

  const setNodeRef = (nodeId: string) => (element: HTMLDivElement | null) => {
    if (element) nodeRefs.current.set(nodeId, element);
    else nodeRefs.current.delete(nodeId);
  };

  const edgeState = (edge: DiagramEdgeSpec) => {
    const active = focusEdges === null || focusEdges.has(edge.id);
    const touching = focusNodes === null || focusNodes.has(edge.from) || focusNodes.has(edge.to);
    return { active, dimmed: !active || !touching };
  };
  const nodeState = (node: DiagramNodeSpec) => {
    if (focusNodes === null) return { active: false, dimmed: false };
    return focusNodes.has(node.id) ? { active: true, dimmed: false } : { active: false, dimmed: true };
  };
  const nodeClass = (node: DiagramNodeSpec) => {
    const state = nodeState(node);
    return `rk-diagram__node${state.active ? " is-active" : ""}${state.dimmed ? " is-dimmed" : ""}`;
  };

  const legend = spec.legend?.length ? (
    <figcaption>
      <ul className="rk-diagram__legend">
        {spec.legend.map((item) => <li key={item.id}><i className={`is-${item.swatch}`} aria-hidden="true" />{item.text}</li>)}
      </ul>
      {spec.note ? <p className="rk-diagram__note">{spec.note}</p> : null}
    </figcaption>
  ) : spec.note ? <figcaption><p className="rk-diagram__note">{spec.note}</p></figcaption> : null;

  return <figure className={`rk-diagram${framed ? "" : " rk-diagram--flush"}${stacked ? " is-stacked" : ""} ${className}`.trim()} aria-label={label} data-diagram-mode={stacked ? "list" : "grid"} data-diagram-label={label}>
    <div className="rk-diagram__canvas" ref={canvasRef} style={stacked ? undefined : { gridTemplateColumns: `repeat(${spec.columns}, minmax(0, 1fr))` }}>
      {stacked ? (
        <ol className="rk-diagram__list">
          {orderedNodes.map((node, index) => {
            const incoming = (edgeByEndpoints.get(node.id) ?? []).map((sourceId) => titleById.get(sourceId)?.inputLabel ?? sourceId);
            return <li key={node.id} className={`${nodeClass(node)} rk-diagram__list-node`} data-diagram-node={node.id} data-state={node.role ?? "model"}>
              <span className="rk-diagram__list-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="rk-diagram__title">{node.title}</span>
              {node.meta ? <span className="rk-diagram__meta">{node.meta}</span> : null}
              {incoming.length ? <span className="rk-diagram__list-inputs">{`输入 ← ${incoming.join(" · ")}`}</span> : null}
              {node.badge ? <span className="rk-diagram__badge">{node.badge}</span> : null}
            </li>;
          })}
        </ol>
      ) : <>
        <svg className="rk-diagram__edges" viewBox={`0 0 ${Math.max(size.width, 1)} ${Math.max(size.height, 1)}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <defs>
            <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>
          {spec.edges.map((edge) => {
            const measured = paths.find((path) => path.id === edge.id);
            if (!measured) return null;
            const state = edgeState(edge);
            return <g key={edge.id} className={`rk-diagram__edge is-${edge.kind ?? "data"}${state.active ? " is-active" : ""}${state.dimmed ? " is-dimmed" : ""}`} data-diagram-edge={edge.id} data-from={edge.from} data-to={edge.to}>
              <path d={measured.d} markerEnd={`url(#${markerId})`} />
              <title>{`${titleById.get(edge.from)?.id ?? edge.from} to ${titleById.get(edge.to)?.id ?? edge.to}`}</title>
            </g>;
          })}
        </svg>
        {spec.edges.map((edge) => {
          if (!edge.label) return null;
          const measured = paths.find((path) => path.id === edge.id);
          if (!measured?.label || !size.width) return null;
          const left = Math.min(Math.max(measured.label.x, 42), Math.max(size.width - 42, 42));
          return <span key={`${edge.id}-label`} className="rk-diagram__label" style={{ left: `${left}px`, top: `${measured.label.y}px` }}>{edge.label}</span>;
        })}
        {spec.nodes.map((node) => <div
          key={node.id}
          ref={setNodeRef(node.id)}
          className={nodeClass(node)}
          data-diagram-node={node.id}
          data-state={node.role ?? "model"}
          id={`diagram-node-${node.id}`}
          style={{ gridColumn: `${node.column} / span ${node.columnSpan ?? 1}`, gridRow: `${node.row} / span ${node.rowSpan ?? 1}` }}
        >
          <span className="rk-diagram__title">{node.title}</span>
          {node.meta ? <span className="rk-diagram__meta">{node.meta}</span> : null}
          {node.badge ? <span className="rk-diagram__badge">{node.badge}</span> : null}
        </div>)}
      </>}
    </div>
    {legend}
  </figure>;
}
