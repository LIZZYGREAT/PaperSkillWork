import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "../../foundation/accessibility/useReducedMotion";
import { Button } from "../../foundation/controls/Button";
import { validateProcessLoopSpec } from "./types";
import type { ProcessLoopSpec } from "./types";

export function ProcessLoopExplorer({ spec, initialStep = 0, mode = "manual", showProgress = true, showInspector = true, intervalMs = 2600, onNodeSelect }: {
  spec: ProcessLoopSpec;
  initialStep?: number;
  mode?: "manual" | "autoplay";
  showProgress?: boolean;
  showInspector?: boolean;
  intervalMs?: number;
  onNodeSelect?: (nodeId: string) => void;
}) {
  const reducedMotion = useReducedMotion();
  const errors = useMemo(() => validateProcessLoopSpec(spec), [spec]);
  const [stepIndex, setStepIndex] = useState(Math.max(0, Math.min(initialStep, spec.steps.length - 1)));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(mode === "autoplay" && !reducedMotion);
  const step = spec.steps[stepIndex];

  useEffect(() => { if (reducedMotion) setPlaying(false); }, [reducedMotion]);
  useEffect(() => {
    if (!playing || !step || reducedMotion) return;
    const timer = window.setInterval(() => setStepIndex((current) => (current + 1) % spec.steps.length), Math.max(900, intervalMs));
    return () => window.clearInterval(timer);
  }, [playing, step, spec.steps.length, intervalMs, reducedMotion]);

  if (errors.length) return <div className="rk-process-loop rk-error" role="alert"><strong>ProcessLoopExplorer data needs attention</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>;
  if (!step) return null;
  const activeNodes = new Set(step.activeNodes ?? []);
  const activeEdges = new Set(step.activeEdges ?? []);
  const dimNodes = new Set(step.dimNodes ?? []);
  const rows = Math.ceil(spec.nodes.length / 4);
  const nodePosition = (index: number) => ({ x: 125 + (index % 4) * 250, y: 70 + Math.floor(index / 4) * 148 });
  const nodeIndex = new Map(spec.nodes.map((node, index) => [node.id, index]));
  const selectedNode = spec.nodes.find((node) => node.id === selectedNodeId);

  const selectNode = (nodeId: string) => { setSelectedNodeId(nodeId); onNodeSelect?.(nodeId); };
  const changeStep = (index: number) => { setStepIndex(Math.max(0, Math.min(index, spec.steps.length - 1))); setPlaying(false); };

  return (
    <section className="rk-process-loop" aria-label="Interactive process diagram">
      <div className="rk-process-loop__controls">
        <Button variant="secondary" onClick={() => changeStep(stepIndex - 1)} disabled={stepIndex === 0}>Previous</Button>
        <label>Step <select aria-label="Select process step" value={step.id} onChange={(event) => changeStep(spec.steps.findIndex((item) => item.id === event.currentTarget.value))}>{spec.steps.map((item, index) => <option key={item.id} value={item.id}>{index + 1}. {item.title}</option>)}</select></label>
        <Button variant="secondary" onClick={() => changeStep(stepIndex + 1)} disabled={stepIndex === spec.steps.length - 1}>Next</Button>
        <Button variant="quiet" onClick={() => { setStepIndex(0); setSelectedNodeId(null); setPlaying(false); }}>Reset</Button>
        <Button variant="quiet" onClick={() => setPlaying((value) => !value)} disabled={reducedMotion} aria-pressed={playing}>{playing ? "Pause" : "Play"}</Button>
      </div>
      {showProgress ? <div className="rk-process-loop__progress" role="progressbar" aria-label="Process progress" aria-valuemin={1} aria-valuemax={spec.steps.length} aria-valuenow={stepIndex + 1}><span style={{ width: `${((stepIndex + 1) / spec.steps.length) * 100}%` }} /></div> : null}
      <div className="rk-process-loop__step-heading" aria-live="polite"><span>Step {stepIndex + 1} of {spec.steps.length}</span><h3>{step.title}</h3><p>{step.summary}</p></div>
      <div className="rk-process-loop__viewport" tabIndex={0} aria-label="Scrollable system diagram">
        <div className="rk-process-loop__canvas" style={{ minHeight: `${Math.max(150, rows * 148)}px` }}>
          <svg className="rk-process-loop__edges" viewBox={`0 0 1000 ${Math.max(150, rows * 148)}`} preserveAspectRatio="none" aria-hidden="true">
            {spec.edges.map((edge) => {
              const from = nodePosition(nodeIndex.get(edge.from) ?? 0); const to = nodePosition(nodeIndex.get(edge.to) ?? 0);
              return <g key={edge.id} className={`rk-process-loop__edge rk-edge--${edge.kind ?? "data"} ${activeEdges.has(edge.id) ? "is-active" : ""}`}><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} />{edge.label ? <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6}>{edge.label}</text> : null}</g>;
            })}
          </svg>
          <div className="rk-process-loop__nodes">
            {spec.nodes.map((node, index) => (
              <button key={node.id} type="button" className={`rk-process-node rk-process-node--${node.kind ?? "module"} ${activeNodes.has(node.id) ? "is-active" : ""} ${dimNodes.has(node.id) ? "is-dimmed" : ""} ${selectedNodeId === node.id ? "is-selected" : ""}`} style={{ gridColumn: (index % 4) + 1, gridRow: Math.floor(index / 4) + 1 }} aria-pressed={selectedNodeId === node.id} onClick={() => selectNode(node.id)}>
                <b>{node.label}</b>{node.group ? <small>{node.group}</small> : null}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="rk-process-loop__footer">
        <div className="rk-process-loop__annotations" aria-live="polite">{step.annotations?.map((annotation, index) => <p key={`${annotation.target}-${index}`}><b>{spec.nodes.find((node) => node.id === annotation.target)?.label}:</b> {annotation.text}</p>)}</div>
        {showInspector ? <aside className="rk-process-loop__inspector" aria-live="polite"><h4>{selectedNode?.label ?? step.detail?.title ?? "Inspect the system"}</h4><p>{selectedNode?.description ?? step.detail?.bullets.join(" ") ?? "Select a node to inspect its role in this process."}</p>{step.detail && !selectedNode ? <ul>{step.detail.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</aside> : null}
      </div>
    </section>
  );
}

export type { ProcessEdge, ProcessLoopSpec, ProcessNode, ProcessStep } from "./types";
