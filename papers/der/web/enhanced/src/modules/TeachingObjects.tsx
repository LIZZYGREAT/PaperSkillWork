import ModelMark from "./review/ModelMark";
import { HISTORY_Z } from "./math-model";
import "./teaching-objects.css";

/** Paper-local objects; numbers share the lesson's authoritative teaching fixture. */
export function FrozenResponse({ symbol = "z₁" }: { symbol?: string }) {
  return <div className="frozen-response" data-frozen-vector={HISTORY_Z.join(",")}>
    <ModelMark /><span className="frozen-symbol">{symbol}</span>
    <span className="frozen-cells">{HISTORY_Z.map((value,k)=><b key={k}>{value}</b>)}</span>
    <span className="frozen-seal">固定</span>
  </div>;
}

export function TeachingNetwork({ fixed = false }: { fixed?: boolean }) {
  return <svg className="teaching-network" data-fixed={fixed} viewBox="0 0 80 64" aria-hidden="true">
    <path d="M10 16L40 10L70 20M10 16L40 32L70 20M10 48L40 32L70 44M10 48L40 54L70 44M10 16L40 54M10 48L40 10M40 10L70 44M40 54L70 20" />
    {[[10,16],[10,48],[40,10],[40,32],[40,54],[70,20],[70,44]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="5" />)}
  </svg>;
}
