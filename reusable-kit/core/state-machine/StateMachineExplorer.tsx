import { useMemo, useState } from "react";
import { Button } from "../../foundation/controls/Button";
import { Feedback } from "../../foundation/feedback/Feedback";
import { attemptTransition, validateStateMachine } from "./types";
import type { StateMachineSpec } from "./types";

export function StateMachineExplorer({ spec, mode = "guided", showHistory = true, showInspector = true }: { spec: StateMachineSpec; mode?: "guided" | "free-click"; showHistory?: boolean; showInspector?: boolean }) {
  const errors = useMemo(() => validateStateMachine(spec), [spec]);
  const [currentId, setCurrentId] = useState(spec.initialState);
  const [history, setHistory] = useState<string[]>([spec.initialState]);
  const [message, setMessage] = useState("Choose a state to inspect it or attempt a transition.");
  const [invalid, setInvalid] = useState(false);
  const [invalidCount, setInvalidCount] = useState(0);
  if (errors.length) return <div role="alert" className="rk-error"><strong>StateMachineExplorer data needs attention</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>;
  const current = spec.states.find((state) => state.id === currentId)!;
  const knownTransitions = spec.transitions.filter((transition) => transition.from === currentId);
  const visited = new Set(history);

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
  const reset = () => { setCurrentId(spec.initialState); setHistory([spec.initialState]); setInvalidCount(0); setMessage("State history has been reset."); };

  return (
    <section className="rk-state-machine" aria-label="Interactive state machine">
      <div className="rk-state-machine__header"><p>Current state: <b>{current.label}</b></p><Button variant="quiet" onClick={reset}>Reset</Button></div>
      <div className="rk-state-machine__states" role="group" aria-label="Available states">
        {spec.states.map((state, index) => {
          const outgoing = spec.transitions.some((transition) => transition.from === currentId && transition.to === state.id);
          return <div className="rk-state-machine__state-wrap" key={state.id}><button type="button" className={`rk-state-machine__state ${state.id === currentId ? "is-current" : ""} ${visited.has(state.id) ? "is-visited" : ""} ${state.terminal ? "is-terminal" : ""}`} aria-current={state.id === currentId ? "step" : undefined} onClick={() => choose(state.id)}><b>{state.label}</b>{state.owner ? <small>Owner: {state.owner}</small> : null}{outgoing && mode === "guided" ? <span className="rk-state-machine__available">Next step</span> : null}</button>{index < spec.states.length - 1 ? <span className="rk-state-machine__arrow" aria-hidden="true">→</span> : null}</div>;
        })}
      </div>
      <Feedback tone={invalid ? "warn" : "info"}>{message}</Feedback>
      {showInspector ? <aside className="rk-state-machine__inspector" aria-live="polite"><h3>{current.label}</h3>{current.description ? <p>{current.description}</p> : null}{current.effect ? <p><b>Effect:</b> {current.effect}</p> : null}<h4>Allowed next states</h4>{knownTransitions.length ? <ul>{knownTransitions.map((transition) => <li key={`${transition.from}-${transition.to}`}><b>{spec.states.find((state) => state.id === transition.to)?.label}</b>{transition.condition ? ` — ${transition.condition}` : ""}</li>)}</ul> : <p>No outgoing transition is defined.</p>}</aside> : null}
      {showHistory ? <div className="rk-state-machine__history"><h4>Transition history</h4><ol>{history.map((id, index) => <li key={`${id}-${index}`}>{spec.states.find((state) => state.id === id)?.label}</li>)}</ol><p>Rejected attempts: {invalidCount}</p></div> : null}
    </section>
  );
}

export type { IllegalTransitionHint, StateMachineSpec, StateNode, StateTransition } from "./types";
