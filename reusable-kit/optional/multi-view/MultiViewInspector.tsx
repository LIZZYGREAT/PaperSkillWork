import { useState } from "react";
import type { ReactNode } from "react";

export type InspectorView = { id: string; label: string; description?: string; content: ReactNode };

export function MultiViewInspector({ objectLabel, views, initialView }: { objectLabel: string; views: InspectorView[]; initialView?: string }) {
  const [activeId, setActiveId] = useState(initialView ?? views[0]?.id ?? "");
  const active = views.find((view) => view.id === activeId) ?? views[0];
  if (!active) return <div className="rk-multi-view" role="status">No views are available for {objectLabel}.</div>;
  return <section className="rk-multi-view" aria-label={`Views of ${objectLabel}`}><header><span>Same object</span><h3>{objectLabel}</h3></header><div className="rk-multi-view__tabs" role="tablist" aria-label={`${objectLabel} views`}>{views.map((view) => <button key={view.id} type="button" role="tab" id={`rk-view-tab-${view.id}`} aria-selected={active.id === view.id} aria-controls={`rk-view-panel-${view.id}`} onClick={() => setActiveId(view.id)}>{view.label}</button>)}</div><div className="rk-multi-view__panel" role="tabpanel" id={`rk-view-panel-${active.id}`} aria-labelledby={`rk-view-tab-${active.id}`}><h4>{active.label}</h4>{active.description ? <p>{active.description}</p> : null}{active.content}</div></section>;
}
