import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createDiagramPath } from "../../foundation/layout/diagram";
import { layoutGraphByRows } from "../../foundation/layout/graph-layout";
import { useStickyStepSync } from "../../foundation/layout/StickySystemView";
import { useReducedMotion } from "../../foundation/accessibility/useReducedMotion";
import { Button } from "../../foundation/controls/Button";
import { validateProcessLoopSpec } from "./types";
import type { ProcessLoopSpec } from "./types";

function StepPicker({ options, value, onChange }: {
  options: Array<{ id: string; title: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, options.findIndex((option) => option.id === value)));
  const [menuPlacement, setMenuPlacement] = useState({ left: 0, width: 440, maxHeight: 360, openAbove: false });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listId = `rk-step-picker-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const selectedIndex = Math.max(0, options.findIndex((option) => option.id === value));
  const selected = options[selectedIndex];

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  useEffect(() => {
    if (!open) return;
    const placeMenu = () => {
      const trigger = rootRef.current?.getBoundingClientRect();
      if (!trigger) return;
      const width = Math.min(440, window.innerWidth - 32);
      const left = Math.max(16, Math.min(trigger.left, window.innerWidth - width - 16));
      const desiredHeight = Math.min(360, options.length * 43 + 12);
      const spaceBelow = window.innerHeight - trigger.bottom - 16;
      const spaceAbove = trigger.top - 16;
      const openAbove = spaceBelow < Math.min(180, desiredHeight) && spaceAbove > spaceBelow;
      const availableHeight = Math.max(120, Math.min(360, (openAbove ? spaceAbove : spaceBelow) - 8));
      setMenuPlacement({ left: left - trigger.left, width, maxHeight: availableHeight, openAbove });
    };
    placeMenu();
    window.addEventListener("resize", placeMenu);
    const closeWhenOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeWhenOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeWhenOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", placeMenu);
    };
  }, [open]);

  const openAt = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };
  const moveActive = (delta: number) => setActiveIndex((current) => (current + delta + options.length) % options.length);
  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return <div className="rk-process-step-picker" ref={rootRef}>
    <button ref={triggerRef} type="button" className="rk-process-step-picker__trigger" role="combobox" aria-label="Select process step" aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-activedescendant={open ? `${listId}-option-${activeIndex}` : undefined}
      onClick={() => open ? setOpen(false) : openAt(selectedIndex)}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          openAt(selectedIndex);
        }
        if (event.key === "Home") { event.preventDefault(); openAt(0); }
        if (event.key === "End") { event.preventDefault(); openAt(options.length - 1); }
      }}>
      <span>{selected ? `${selectedIndex + 1}. ${selected.title}` : "Choose a step"}</span><span className="rk-process-step-picker__chevron" aria-hidden="true">⌄</span>
    </button>
    {open ? <div id={listId} className="rk-process-step-picker__menu" role="listbox" aria-label="Process steps" style={{ left: `${menuPlacement.left}px`, width: `${menuPlacement.width}px`, maxHeight: `${menuPlacement.maxHeight}px`, top: menuPlacement.openAbove ? "auto" : "calc(100% + 7px)", bottom: menuPlacement.openAbove ? "calc(100% + 7px)" : "auto" }}>
      {options.map((option, index) => <button ref={(element) => { optionRefs.current[index] = element; }} id={`${listId}-option-${index}`} key={option.id} type="button" role="option" aria-selected={option.id === value} className={`rk-process-step-picker__option ${index === activeIndex ? "is-active" : ""}`}
        onClick={() => choose(option.id)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); moveActive(1); }
          if (event.key === "ArrowUp") { event.preventDefault(); moveActive(-1); }
          if (event.key === "Home") { event.preventDefault(); setActiveIndex(0); }
          if (event.key === "End") { event.preventDefault(); setActiveIndex(options.length - 1); }
          if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
          if (event.key === "Tab") setOpen(false);
        }}>
        <span className="rk-process-step-picker__number">{String(index + 1).padStart(2, "0")}</span><span>{option.title}</span>{option.id === value ? <span className="rk-process-step-picker__check" aria-hidden="true">✓</span> : null}
      </button>)}
    </div> : null}
  </div>;
}

export function ProcessLoopExplorer({ spec, initialStep = 0, mode = "manual", showProgress = true, showInspector = true, intervalMs = 2600, nodeWidth = 220, onNodeSelect, onStepChange }: {
  spec: ProcessLoopSpec;
  initialStep?: number;
  mode?: "manual" | "autoplay";
  showProgress?: boolean;
  showInspector?: boolean;
  intervalMs?: number;
  nodeWidth?: number;
  onNodeSelect?: (nodeId: string) => void;
  onStepChange?: (stepId: string, index: number) => void;
}) {
  const reducedMotion = useReducedMotion();
  const stickySync = useStickyStepSync();
  const errors = useMemo(() => validateProcessLoopSpec(spec), [spec]);
  const [internalStepIndex, setInternalStepIndex] = useState(Math.max(0, Math.min(initialStep, spec.steps.length - 1)));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [playing, setPlaying] = useState(mode === "autoplay" && !reducedMotion);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const markerId = `rk-process-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const stickyIndex = !playing && stickySync?.activeStepId ? spec.steps.findIndex((item) => item.id === stickySync.activeStepId) : -1;
  const stepIndex = stickyIndex >= 0 ? stickyIndex : internalStepIndex;
  const step = spec.steps[stepIndex];

  useEffect(() => { if (reducedMotion) setPlaying(false); }, [reducedMotion]);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) => setViewportWidth(entry.contentRect.width));
    observer.observe(viewport);
    setViewportWidth(viewport.clientWidth);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!playing || !step || reducedMotion) return;
    const timer = window.setInterval(() => setInternalStepIndex((current) => (current + 1) % spec.steps.length), Math.max(900, intervalMs));
    return () => window.clearInterval(timer);
  }, [playing, step, spec.steps.length, intervalMs, reducedMotion]);

  if (errors.length) return <div className="rk-process-loop rk-error" role="alert"><strong>ProcessLoopExplorer data needs attention</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>;
  if (!step) return null;

  const nodeSize = { width: Math.max(150, nodeWidth), height: 84 };
  const activeNodes = new Set(step.activeNodes ?? []);
  const activeEdges = new Set(step.activeEdges ?? []);
  const dimNodes = new Set(step.dimNodes ?? []);
  // A spec that authors coordinates keeps them (papers hand-tune those); a spec with
  // no coordinates at all gets the centred grid, which fills the width instead of
  // clustering in a corner.
  const authored = spec.nodes.some((node) => node.position);
  const seeded = spec.nodes.map((node, index) => ({ id: node.id, position: node.position ?? { x: 125 + (index % 4) * 250, y: 70 + Math.floor(index / 4) * 148 } }));
  const layout = authored ? null : layoutGraphByRows(seeded, { nodeWidth: nodeSize.width, nodeHeight: nodeSize.height, maxPerRow: 4, rowBucket: 140 });
  const positions = layout ? layout.positions : new Map(seeded.map((item) => [item.id, item.position!]));
  const canvasWidth = layout ? layout.width : Math.max(760, ...Array.from(positions.values(), (point) => point.x + nodeSize.width / 2 + 24));
  const canvasHeight = layout ? layout.height : Math.max(200, ...Array.from(positions.values(), (point) => point.y + nodeSize.height / 2 + 24));
  const canvasScale = 1;
  const needsScroll = viewportWidth > 0 && canvasWidth > viewportWidth + 1;
  const nodesById = new Map(spec.nodes.map((node) => [node.id, node]));
  const selectedNode = spec.nodes.find((node) => node.id === selectedNodeId);

  const selectNode = (nodeId: string) => { setSelectedNodeId(nodeId); onNodeSelect?.(nodeId); };
  const changeStep = (index: number) => {
    const bounded = Math.max(0, Math.min(index, spec.steps.length - 1));
    setInternalStepIndex(bounded);
    setPlaying(false);
    stickySync?.setManualStep(spec.steps[bounded].id);
    onStepChange?.(spec.steps[bounded].id, bounded);
  };

  return (
    <section className="rk-process-loop" aria-label="Interactive process diagram">
      <div className="rk-process-loop__controls">
        <Button variant="secondary" onClick={() => changeStep(stepIndex - 1)} disabled={stepIndex === 0}>Previous</Button>
        <label>Step <StepPicker options={spec.steps.map(({ id, title }) => ({ id, title }))} value={step.id} onChange={(stepId) => changeStep(spec.steps.findIndex((item) => item.id === stepId))} /></label>
        <Button onClick={() => changeStep(stepIndex + 1)} disabled={stepIndex === spec.steps.length - 1}>Next</Button>
        <Button variant="quiet" onClick={() => { changeStep(0); setSelectedNodeId(null); }}>Reset</Button>
        <Button variant="quiet" onClick={() => setPlaying((value) => !value)} disabled={reducedMotion} aria-pressed={playing}>{playing ? "Pause" : "Play"}</Button>
        {needsScroll ? <Button variant="secondary" className="rk-process-loop__zoom" aria-pressed={zoomed} onClick={() => { setZoomed((value) => !value); if (viewportRef.current) viewportRef.current.scrollLeft = 0; }}>{zoomed ? "Fit complete diagram" : "Scroll the full diagram"}</Button> : null}
      </div>
      {showProgress ? <div className="rk-process-loop__progress" role="progressbar" aria-label="Process progress" aria-valuemin={1} aria-valuemax={spec.steps.length} aria-valuenow={stepIndex + 1}><span style={{ width: `${((stepIndex + 1) / spec.steps.length) * 100}%` }} /></div> : null}
      <div className="rk-process-loop__step-heading" aria-live="polite"><span>Step {stepIndex + 1} of {spec.steps.length}</span><h3>{step.title}</h3><p>{step.summary}</p></div>
      <div className={`rk-process-loop__viewport ${zoomed || needsScroll ? "is-zoomed" : ""}`} ref={viewportRef} tabIndex={0} aria-label={needsScroll ? "Process diagram; scroll horizontally to inspect" : "Complete process diagram"}>
        <div className="rk-process-loop__fit" style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
        <div className="rk-process-loop__canvas" style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
          <svg className="rk-process-loop__edges" viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} role="img" aria-label="Process connections">
            <defs><marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
            {spec.edges.map((edge, index) => {
              const reverse = edge.direction === "reverse" || (!edge.direction && edge.kind === "gradient");
              const sourceId = reverse ? edge.to : edge.from;
              const targetId = reverse ? edge.from : edge.to;
              const source = positions.get(sourceId)!;
              const target = positions.get(targetId)!;
              const route = createDiagramPath(source, target, nodeSize, nodeSize, edge.path);
              const active = activeEdges.has(edge.id);
              const flowing = active && !reducedMotion && (edge.kind === "data" || edge.kind === "gradient");
              const edgeKind = edge.kind ?? "data";
              return <g key={edge.id} className={`rk-process-loop__edge rk-edge--${edgeKind} ${active ? "is-active" : ""} ${flowing ? "is-flowing" : ""}`} data-edge-id={edge.id} data-direction={reverse ? "reverse" : "forward"} data-path={edge.path ?? "straight"}><path d={route.d} markerEnd={`url(#${markerId})`} />{edge.label ? <text x={route.label.x} y={route.label.y - 6}>{edge.label}</text> : null}<title>{edge.label ?? `${nodesById.get(sourceId)?.label} to ${nodesById.get(targetId)?.label}`}</title></g>;
            })}
          </svg>
          <div className="rk-process-loop__nodes">
            {spec.nodes.map((node) => {
              const point = positions.get(node.id)!;
              return <button key={node.id} type="button" className={`rk-process-node rk-process-node--${node.kind ?? "module"} ${activeNodes.has(node.id) ? "is-active" : ""} ${dimNodes.has(node.id) ? "is-dimmed" : ""} ${selectedNodeId === node.id ? "is-selected" : ""}`} style={{ left: `${point.x}px`, top: `${point.y}px`, width: `${nodeSize.width}px` }} aria-pressed={selectedNodeId === node.id} onClick={() => selectNode(node.id)}><span className="rk-process-node__ordinal">{String(spec.nodes.findIndex((item) => item.id === node.id) + 1).padStart(2, "0")}</span><b>{node.label}</b>{node.group ? <small>{node.group}</small> : null}</button>;
            })}
          </div>
        </div>
        </div>
      </div>
      <div className={`rk-process-loop__footer ${step.annotations?.length && showInspector ? "has-annotations" : ""}`}>
        {step.annotations?.length ? <div className="rk-process-loop__annotations" aria-live="polite">{step.annotations.map((annotation, index) => <p key={`${annotation.target}-${index}`}><b>{nodesById.get(annotation.target)?.label}:</b> {annotation.text}</p>)}</div> : null}
        {showInspector ? <aside className="rk-process-loop__inspector" aria-live="polite"><h4>{selectedNode?.label ?? step.detail?.title ?? "Inspect the system"}</h4><p>{selectedNode?.description ?? step.detail?.bullets.join(" ") ?? "Select a node to inspect its role in this process."}</p>{step.detail && !selectedNode ? <ul>{step.detail.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</aside> : null}
      </div>
    </section>
  );
}

export type { ProcessEdge, ProcessLoopSpec, ProcessNode, ProcessStep } from "./types";
