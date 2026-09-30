import type { RuntimeObjectId } from "../contracts/ids";

const PARAMETER_GROUPS = ["θ¹", "θ²", "θ³"];

export function ParameterModel({ mode = "overview", activeObject, changed = false }: {
  mode?: "overview" | "fixed" | "updating";
  activeObject?: RuntimeObjectId;
  changed?: boolean;
}) {
  const fixed = mode === "fixed";
  const inputActive = activeObject === "task-a-data" || activeObject === "task-a-batch" || activeObject === "task-b-data";
  const networkActive = activeObject === "neural-network" || activeObject === "model-logits" || activeObject === "current-parameters" || activeObject === "task-a-anchor" || activeObject === "fisher-estimator";
  const outputActive = activeObject === "prediction-probabilities" || activeObject === "task-a-loss" || activeObject === "task-b-loss";
  return (
    <div className={`ewc-model ${fixed ? "is-fixed" : ""} ${changed ? "is-changed" : ""}`} aria-label="Same shared neural network and parameter groups">
      <div className="ewc-model__flow">
        <div className={`ewc-model__input ${inputActive ? "is-active" : ""}`}><span className="ewc-model__node-label">INPUT</span><b>Task data</b><small>examples</small></div>
        <span className="ewc-model__arrow" aria-hidden="true">→</span>
        <div className={`ewc-model__network ${networkActive ? "is-active" : ""}`}>
          <div className="ewc-model__network-head"><span className="ewc-model__node-label">SAME MODEL</span><b>Neural network</b><small>shared across tasks</small></div>
          <div className="ewc-model__layers" aria-label="Parameter groups">
            {PARAMETER_GROUPS.map((parameter, index) => {
              const highlighted = activeObject === "current-parameters" || activeObject === "task-a-anchor";
              return <div key={parameter} className={`ewc-model__layer ${highlighted ? "is-highlighted" : ""}`}><span>Layer {index + 1}</span><b>{parameter}</b></div>;
            })}
          </div>
        </div>
        <span className="ewc-model__arrow" aria-hidden="true">→</span>
        <div className={`ewc-model__output ${outputActive ? "is-active" : ""}`}><span className="ewc-model__node-label">OUTPUT</span><b>Task behavior</b><small>depends on θ</small></div>
      </div>
      <div className="ewc-model__parameter-state">
        <span className={`ewc-state-pill ${fixed ? "is-fixed" : changed ? "is-moving" : ""}`}>{fixed ? "PARAMETERS FIXED" : changed ? "θ CHANGED" : "TRAINABLE PARAMETERS"}</span>
        <span className="ewc-model__theta">θ = {changed ? "θ′" : "θ"}</span>
        {fixed ? <span className="ewc-model__fixed-note">reference point: θ_A*</span> : null}
      </div>
    </div>
  );
}
