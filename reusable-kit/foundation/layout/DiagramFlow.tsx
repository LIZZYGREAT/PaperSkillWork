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
  /**
   * `bar` lays the badge, title and note out side by side across the full width —
   * use it for a convergence target that several branches write into.
   */
  variant?: "card" | "bar";
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

/** A named band behind a group of columns: the cheapest way to name a stage. */
export type DiagramZone = { id: string; label: string; from: number; span: number };

export type DiagramSpec = {
  columns: number;
  /** Optional grid-template-columns; defaults to equal columns. */
  template?: string;
  nodes: DiagramNodeSpec[];
  edges: DiagramEdgeSpec[];
  zones?: DiagramZone[];
  legend?: DiagramLegendItem[];
  note?: ReactNode;
};

export type DiagramFocus = { nodes?: string[]; edges?: string[] };

type MeasuredEdge = { id: string; d: string; start: { x: number; y: number }; end: { x: number; y: number } };

const DEFAULT_STACK_MIN = 660;

function readingOrder(node: DiagramNodeSpec): number {
  return node.order ?? node.row * 100 + node.column;
}

/**
 * Declarative teaching diagram: real DOM nodes in a grid plus connectors measured
 * from those nodes. Wide layouts draw the graph with named stage bands; narrow
 * layouts reflow the same spec into an ordered derivation list grouped by the same
 * bands. Nothing is scaled down, so in-figure text keeps its size at every viewport.
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

  const titleById = useMemo(() => new Map(spec.nodes.map((node) => [node.id, node])), [spec]);
  const incomingById = useMemo(() => {
    const incoming = new Map<string, string[]>();
    for (const edge of spec.edges) incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge.from]);
    return incoming;
  }, [spec]);
  const zoneOf = useMemo(() => {
    const map = new Map<string, DiagramZone>();
    for (const zone of spec.zones ?? []) {
      for (const node of spec.nodes) {
        if (node.column >= zone.from && node.column < zone.from + zone.span) map.set(node.id, zone);
      }
    }
    return map;
  }, [spec]);
  const listGroups = useMemo(() => {
    const sorted = [...spec.nodes].sort((left, right) => readingOrder(left) - readingOrder(right));
    const groups: { zone: DiagramZone | null; nodes: DiagramNodeSpec[] }[] = [];
    const claimed = new Set<string>();
    for (const zone of spec.zones ?? []) {
      const members = sorted.filter((node) => zoneOf.get(node.id)?.id === zone.id);
      if (!members.length) continue;
      for (const node of members) claimed.add(node.id);
      groups.push({ zone, nodes: members });
    }
    const rest = sorted.filter((node) => !claimed.has(node.id));
    if (rest.length) groups.push({ zone: null, nodes: rest });
    return groups;
  }, [spec, zoneOf]);
  const rowOffset = spec.zones?.length ? 1 : 0;
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
      nextPaths.push({ id: edge.id, d: geometry.d, start: geometry.start, end: geometry.end });
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
  const nodeClass = (node: DiagramNodeSpec) => {
    const active = focusNodes !== null && focusNodes.has(node.id);
    const dimmed = focusNodes !== null && !focusNodes.has(node.id);
    return `rk-diagram__node${node.variant === "bar" ? " rk-diagram__node--bar" : ""}${active ? " is-active" : ""}${dimmed ? " is-dimmed" : ""}`;
  };

  const legend = spec.legend?.length ? (
    <figcaption>
      <ul className="rk-diagram__legend">
        {spec.legend.map((item) => <li key={item.id}><i className={`is-${item.swatch}`} aria-hidden="true" />{item.text}</li>)}
      </ul>
      {spec.note ? <p className="rk-diagram__note">{spec.note}</p> : null}
    </figcaption>
  ) : spec.note ? <figcaption><p className="rk-diagram__note">{spec.note}</p></figcaption> : null;

  const gridTemplate = spec.template ?? `repeat(${spec.columns}, minmax(0, 1fr))`;

  return <figure className={`rk-diagram${framed ? "" : " rk-diagram--flush"}${stacked ? " is-stacked" : ""} ${className}`.trim()} aria-label={label} data-diagram-mode={stacked ? "list" : "grid"} data-diagram-label={label}>
    <div className="rk-diagram__canvas" ref={canvasRef} style={stacked ? undefined : { gridTemplateColumns: gridTemplate }}>
      {stacked ? (
        <div className="rk-diagram__list">
          {listGroups.map((group, groupIndex) => <section key={group.zone?.id ?? `group-${groupIndex}`} className="rk-diagram__list-group">
            {group.zone ? <p className="rk-diagram__list-zone">{group.zone.label}</p> : null}
            <ol className="rk-diagram__list-items">
              {group.nodes.map((node) => {
                const incoming = (incomingById.get(node.id) ?? []).map((sourceId) => titleById.get(sourceId)?.inputLabel ?? sourceId);
                return <li key={node.id} className={`${nodeClass(node)} rk-diagram__list-node`} data-diagram-node={node.id} data-state={node.role ?? "model"}>
                  {node.badge ? <span className="rk-diagram__badge">{node.badge}</span> : null}
                  <span className="rk-diagram__title">{node.title}</span>
                  {node.meta ? <span className="rk-diagram__meta">{node.meta}</span> : null}
                  {incoming.length ? <span className="rk-diagram__list-inputs">{`输入 ← ${incoming.join(" · ")}`}</span> : null}
                </li>;
              })}
            </ol>
          </section>)}
        </div>
      ) : <>
        {spec.zones?.length ? <>
          <div className="rk-diagram__zone-rule" aria-hidden="true" style={{ gridColumn: "1 / -1", gridRow: 1 }} />
          {spec.zones.map((zone) => <p key={zone.id} className="rk-diagram__zone-label" style={{ gridColumn: `${zone.from} / span ${zone.span}`, gridRow: 1 }}>{zone.label}</p>)}
        </> : null}
        <svg className="rk-diagram__edges" viewBox={`0 0 ${Math.max(size.width, 1)} ${Math.max(size.height, 1)}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <defs>
            <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" markerUnits="userSpaceOnUse" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>
          {spec.edges.map((edge) => {
            const measured = paths.find((path) => path.id === edge.id);
            if (!measured) return null;
            const state = edgeState(edge);
            return <g key={edge.id} className={`rk-diagram__edge is-${edge.kind ?? "data"}${state.active ? " is-active" : ""}${state.dimmed ? " is-dimmed" : ""}`} data-diagram-edge={edge.id} data-from={edge.from} data-to={edge.to}>
              <path d={measured.d} markerEnd={`url(#${markerId})`} />
              <circle className="rk-diagram__port" cx={measured.start.x} cy={measured.start.y} r="2.1" />
              <circle className="rk-diagram__port" cx={measured.end.x} cy={measured.end.y} r="2.1" />
              <title>{`${titleById.get(edge.from)?.inputLabel ?? edge.from} → ${titleById.get(edge.to)?.inputLabel ?? edge.to}`}</title>
            </g>;
          })}
        </svg>
        {spec.nodes.map((node) => <div
          key={node.id}
          ref={setNodeRef(node.id)}
          className={nodeClass(node)}
          data-diagram-node={node.id}
          data-state={node.role ?? "model"}
          id={`diagram-node-${node.id}`}
          style={{ gridColumn: `${node.column} / span ${node.columnSpan ?? 1}`, gridRow: `${node.row + rowOffset} / span ${node.rowSpan ?? 1}` }}
        >
          {node.badge ? <span className="rk-diagram__badge">{node.badge}</span> : null}
          <span className="rk-diagram__title">{node.title}</span>
          {node.meta ? <span className="rk-diagram__meta">{node.meta}</span> : null}
        </div>)}
      </>}
    </div>
    {legend}
  </figure>;
}
