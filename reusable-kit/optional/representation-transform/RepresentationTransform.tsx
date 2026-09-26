import { useState } from "react";
import type { ReactNode } from "react";

export type RepresentationStage = { id: string; title: string; description: string; example?: string; visual?: ReactNode };

export function RepresentationTransform({ stages, label = "Representation transformation" }: { stages: RepresentationStage[]; label?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (!stages.length) return <div className="rk-transform" role="status">No transformation stages are available.</div>;
  const active = stages[Math.min(activeIndex, stages.length - 1)];
  return <section className="rk-transform" aria-label={label}><ol className="rk-transform__stages">{stages.map((stage, index) => <li key={stage.id}><button type="button" className={active.id === stage.id ? "is-active" : ""} aria-current={active.id === stage.id ? "step" : undefined} onClick={() => setActiveIndex(index)}><span>{index + 1}</span>{stage.title}</button>{index < stages.length - 1 ? <span aria-hidden="true" className="rk-transform__arrow">→</span> : null}</li>)}</ol><article className="rk-transform__detail" aria-live="polite"><h3>{active.title}</h3><p>{active.description}</p>{active.example ? <pre>{active.example}</pre> : null}{active.visual}</article></section>;
}
