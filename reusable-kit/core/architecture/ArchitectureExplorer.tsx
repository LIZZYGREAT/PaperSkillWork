import { useMemo, useState } from "react";
import type { ArchitectureSpec } from "./types";
import { validateArchitectureSpec } from "./types";

export function ArchitectureExplorer({ spec, highlightedIds = [], highlightedBranches = [], showStatus = true, onNodeSelect }: {
  spec: ArchitectureSpec;
  highlightedIds?: string[];
  highlightedBranches?: string[];
  showStatus?: boolean;
  onNodeSelect?: (nodeId: string) => void;
}) {
  const errors = useMemo(() => validateArchitectureSpec(spec), [spec]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const highlighted = new Set(highlightedIds);
  const branches = new Set(highlightedBranches);
  if (errors.length) return <div role="alert" className="rk-error"><strong>ArchitectureExplorer data needs attention</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>;
  const groups = Array.from(new Set(spec.nodes.map((node) => node.group ?? "System")));
  const visible = spec.nodes.filter((node) => !collapsed.includes(node.group ?? "System"));
  const positions = new Map<string, { x: number; y: number }>();
  const groupedRows = groups.map((group) => visible.filter((node) => (node.group ?? "System") === group)).filter((nodes) => nodes.length);
  let row = 0;
  for (const nodes of groupedRows) {
    nodes.forEach((node, index) => positions.set(node.id, { x: 160 + index * 270, y: 72 + row * 140 }));
    row += 1;
  }
  const width = Math.max(540, ...groupedRows.map((nodes) => 320 + nodes.length * 270));
  const selected = spec.nodes.find((node) => node.id === selectedId);
  const toggleGroup = (group: string) => setCollapsed((items) => items.includes(group) ? items.filter((item) => item !== group) : [...items, group]);

  return (
    <section className="rk-architecture" aria-label="Interactive architecture diagram">
      <div className="rk-architecture__group-controls">{groups.map((group) => <button key={group} type="button" className="rk-architecture__group-toggle" aria-expanded={!collapsed.includes(group)} onClick={() => toggleGroup(group)}>{collapsed.includes(group) ? "Expand" : "Collapse"} {group}</button>)}</div>
      <div className="rk-architecture__viewport" tabIndex={0} aria-label="Scrollable architecture diagram">
        <div className="rk-architecture__canvas" style={{ width: `${width}px`, minHeight: `${Math.max(150, row * 140)}px` }}>
          <svg className="rk-architecture__edges" viewBox={`0 0 ${width} ${Math.max(150, row * 140)}`} preserveAspectRatio="none" aria-hidden="true">{spec.edges.map((edge, index) => {
            const from = positions.get(edge.from); const to = positions.get(edge.to); if (!from || !to) return null;
            const active = !highlighted.size && !branches.size || highlighted.has(edge.from) && highlighted.has(edge.to) || Boolean(edge.branch && branches.has(edge.branch));
            return <g key={edge.id ?? `${edge.from}-${edge.to}-${index}`} className={`rk-architecture__edge ${active ? "is-active" : "is-dimmed"}`}><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} />{edge.label ? <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 5}>{edge.label}</text> : null}</g>;
          })}</svg>
          {visible.map((node) => { const point = positions.get(node.id)!; const active = !highlighted.size || highlighted.has(node.id); return <button id={`architecture-node-${node.id}`} key={node.id} type="button" className={`rk-architecture__node rk-architecture__node--${node.status ?? "normal"} ${active ? "is-active" : "is-dimmed"} ${selectedId === node.id ? "is-selected" : ""}`} style={{ left: `${point.x}px`, top: `${point.y}px` }} aria-pressed={selectedId === node.id} onClick={() => { setSelectedId(node.id); onNodeSelect?.(node.id); }}><b>{node.label}</b>{node.group ? <small>{node.group}</small> : null}{showStatus && node.status && node.status !== "normal" ? <span className="rk-architecture__status">{node.status}</span> : null}</button>; })}
        </div>
      </div>
      <aside className="rk-architecture__inspector" aria-live="polite"><strong>{selected?.label ?? "Select a component"}</strong><p>{selected?.detail ?? "Inspect node ownership and the paths that connect components."}</p>{selected?.status ? <span className="rk-architecture__status">{selected.status}</span> : null}</aside>
      <p className="rk-architecture__legend">Frozen nodes preserve parameters; trainable nodes can change during optimization.</p>
    </section>
  );
}

export type { ArchitectureEdge, ArchitectureNode, ArchitectureSpec } from "./types";
