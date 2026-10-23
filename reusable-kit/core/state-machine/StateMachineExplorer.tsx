import { useId, useMemo, useState } from "react";
import { createDiagramPath } from "../../foundation/layout/diagram";
import { Button } from "../../foundation/controls/Button";
import { Feedback } from "../../foundation/feedback/Feedback";
import { MetaList } from "../../foundation/data/MetaList";
import { attemptTransition, validateStateMachine } from "./types";
import type { StateMachineSpec, StateNode } from "./types";

const NODE_WIDTH = 212;
const NODE_HEIGHT = 104;
const GAP_X = 48;
const ROW_HEIGHT = 156;
const PAD = 28;

/**
 * Place states on a centred grid derived from the authored rows: states that share
 * a `y` sit on one row and are spread evenly across the canvas. Authoring therefore
 * only has to say *which row* a state belongs to, and the drawing fills the width
 * instead of clustering in a corner.
 */
function layoutStates(states: StateNode[]) {
  const rows = new Map<number, StateNode[]>();
  for (const state of states) {
    const key = state.position?.y ?? 0;
    const row = rows.get(key);
    if (row) row.push(state);
    else rows.set(key, [state]);
  }
  const keys = [...rows.keys()].sort((left, right) => left - right);
  const widest = Math.max(...keys.map((key) => rows.get(key)!.length));
  const width = PAD * 2 + widest * NODE_WIDTH + (widest - 1) * GAP_X;
  const height = PAD * 2 + keys.length * NODE_HEIGHT + (keys.length - 1) * (ROW_HEIGHT - NODE_HEIGHT);
  const positions = new Map<string, { x: number; y: number }>();
  keys.forEach((key, rowIndex) => {
    const members = [...rows.get(key)!].sort((left, right) => (left.position?.x ?? 0) - (right.position?.x ?? 0));
    const rowWidth = members.length * NODE_WIDTH + (members.length - 1) * GAP_X;
    const startX = (width - rowWidth) / 2 + NODE_WIDTH / 2;
    const y = PAD + NODE_HEIGHT / 2 + rowIndex * ROW_HEIGHT;
    members.forEach((state, index) => positions.set(state.id, { x: startX + index * (NODE_WIDTH + GAP_X), y }));
  });
  return { positions, width, height };
}

export function StateMachineExplorer({ spec, mode = "guided", showHistory = true, showInspector = true }: { spec: StateMachineSpec; mode?: "guided" | "free-click"; showHistory?: boolean; showInspector?: boolean }) {
  const errors = useMemo(() => validateStateMachine(spec), [spec]);
  const [currentId, setCurrentId] = useState(spec.initialState);
  const [history, setHistory] = useState<string[]>([spec.initialState]);
  const [message, setMessage] = useState("Choose a state to inspect it or attempt a transition.");
  const [invalid, setInvalid] = useState(false);
  const [invalidCount, setInvalidCount] = useState(0);
  const markerId = `rk-state-arrow-${useId()}`;
  const { positions, width, height } = useMemo(() => layoutStates(spec.states), [spec]);
  const size = { width: NODE_WIDTH, height: NODE_HEIGHT };

  if (errors.length) return <div role="alert" className="rk-error"><strong>StateMachineExplorer data needs attention</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>;
  const current = spec.states.find((state) => state.id === currentId)!;
  const knownTransitions = spec.transitions.filter((transition) => transition.from === currentId);
  const availableIds = new Set(knownTransitions.map((transition) => transition.to));
  const visited = new Set(history);
  const stepIndex = spec.states.findIndex((state) => state.id === currentId) + 1;

  const choose = (targetId: string) => {
    const result = attemptTransition(spec, currentId, targetId);
    if (result.valid) {
      setCurrentId(result.state.id);
      setHistory((items) => [...items, result.state.id]);
      setMessage(result.transition.explanation ?? result.transition.condition ?? `Transitioned to ${result.state.label}.`);
      setInvalid(false);
    } else {
      setInvalidCount((count) => count + 1);
      setMessage(result.message);
      setInvalid(true);
    }
  };
  const reset = () => { setCurrentId(spec.initialState); setHistory([spec.initialState]); setInvalidCount(0); setMessage("State history has been reset."); setInvalid(false); };

  return (
    <section className="rk-state-machine" aria-label="Interactive state machine">
      <div className="rk-state-machine__header">
        <p><span>Current state</span><b>{current.label}</b><i aria-hidden="true">{String(stepIndex).padStart(2, "0")} / {String(spec.states.length).padStart(2, "0")}</i></p>
        <Button variant="quiet" onClick={reset}>Reset</Button>
      </div>
      <div className="rk-state-machine__viewport" tabIndex={0} aria-label="Scrollable state transition diagram">
        <div className="rk-state-machine__canvas" style={{ width: `${width}px`, height: `${height}px` }}>
          <svg className="rk-state-machine__edges" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="State transitions">
            <defs><marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
            {spec.transitions.map((transition, index) => {
              const from = positions.get(transition.from)!;
              const to = positions.get(transition.to)!;
              const sameRow = Math.abs(from.y - to.y) < 1;
              const nearlyVertical = Math.abs(from.x - to.x) < NODE_WIDTH / 2;
              const pathMode = transition.path ?? (sameRow || nearlyVertical ? "straight" : to.x <= from.x ? "curve" : "orthogonal");
              const path = createDiagramPath(from, to, size, size, pathMode);
              const available = transition.from === currentId;
              return <g key={`${transition.from}-${transition.to}-${index}`} className={`rk-state-machine__edge ${available ? "is-available" : "is-dimmed"}`} data-from={transition.from} data-to={transition.to} data-path={pathMode}><path d={path.d} markerEnd={`url(#${markerId})`} />{transition.condition ? <text x={path.label.x} y={path.label.y - 6}>{transition.condition}</text> : null}<title>{transition.condition ?? `${transition.from} to ${transition.to}`}</title></g>;
            })}
          </svg>
          <div className="rk-state-machine__states" role="group" aria-label="Available states">
            {spec.states.map((state) => {
              const point = positions.get(state.id)!;
              const next = availableIds.has(state.id);
              const dim = mode === "guided" && state.id !== currentId && !next;
              return <button id={`rk-state-${state.id}`} key={state.id} type="button" className={`rk-state-machine__state ${state.id === currentId ? "is-current" : ""} ${visited.has(state.id) ? "is-visited" : ""} ${next && mode === "guided" ? "is-next" : ""} ${dim ? "is-dimmed" : ""} ${state.terminal ? "is-terminal" : ""}`} style={{ left: `${point.x}px`, top: `${point.y}px` }} aria-current={state.id === currentId ? "step" : undefined} aria-disabled={mode === "guided" && !next && state.id !== currentId ? "true" : undefined} onClick={() => choose(state.id)}>
                <span className="rk-state-machine__state-ordinal">{String(spec.states.findIndex((item) => item.id === state.id) + 1).padStart(2, "0")}</span>
                <b>{state.label}</b>
                {state.owner ? <small>{state.owner}</small> : null}
                {next && mode === "guided" ? <span className="rk-state-machine__available">Next step →</span> : null}
                {state.terminal ? <span className="rk-state-machine__terminal">Terminal</span> : null}
              </button>;
            })}
          </div>
        </div>
      </div>
      <Feedback tone={invalid ? "warn" : "info"}>{message}</Feedback>
      {showInspector ? <aside className="rk-state-machine__inspector" aria-live="polite">
        <header className="rk-state-machine__inspector-head">
          <p className="rk-state-machine__eyebrow">Inspecting this state</p>
          <h3>{current.label}</h3>
          {current.owner ? <p className="rk-state-machine__owner">{current.owner}</p> : null}
        </header>
        <div className="rk-state-machine__inspector-body">
          <div className="rk-state-machine__inspector-main">
            {current.description ? <p className="rk-state-machine__desc">{current.description}</p> : null}
            {current.effect ? <MetaList label="What this state enables" items={[{ id: "effect", label: "Effect", value: current.effect }]} /> : null}
          </div>
          <div className="rk-state-machine__next">
            <p className="rk-state-machine__eyebrow">Allowed next states</p>
            {knownTransitions.length ? <div className="rk-state-machine__chips">
              {knownTransitions.map((transition, index) => {
                const target = spec.states.find((state) => state.id === transition.to);
                return <button key={`${transition.from}-${transition.to}-${index}`} type="button" className="rk-state-machine__chip" onClick={() => choose(transition.to)}>
                  <span>{target?.label ?? transition.to}<i aria-hidden="true">→</i></span>
                  <small>{transition.condition ?? "Ready to apply"}</small>
                </button>;
              })}
            </div> : <p className="rk-state-machine__empty">This is a terminal state: no outgoing transition is defined.</p>}
          </div>
        </div>
      </aside> : null}
      {showHistory ? <div className="rk-state-machine__history">
        <p className="rk-state-machine__eyebrow">Transition history</p>
        <ol className="rk-state-history">
          {history.map((id, index) => <li key={`${id}-${index}`} className={index === history.length - 1 ? "is-current" : undefined}>
            <span className="rk-state-history__index">{String(index + 1).padStart(2, "0")}</span>
            <span>{spec.states.find((state) => state.id === id)?.label}</span>
          </li>)}
        </ol>
        <p className="rk-state-history__meta">Rejected attempts: {invalidCount}</p>
      </div> : null}
    </section>
  );
}

export type { IllegalTransitionHint, StateMachineSpec, StateNode, StateTransition } from "./types";
