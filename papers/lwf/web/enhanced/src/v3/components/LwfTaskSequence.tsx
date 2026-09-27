import { StateMachineExplorer } from "../../shared/core/state-machine";
import { taskSequence } from "../data/sequential";

export function LwfTaskSequence() {
  return <div className="v3-task-sequence" aria-label="LwF task-level sequence">
    <p className="v3-task-sequence-hint">Select the highlighted next state to follow how one learned model becomes the next stage’s Teacher.</p>
    <StateMachineExplorer spec={taskSequence} mode="guided" showHistory={false} />
    <p className="v3-task-sequence-footnote">Conceptual task lifecycle. “Adapt Student” contains the minibatch-level work from Chapter 03; this diagram does not add another training loop.</p>
  </div>;
}
