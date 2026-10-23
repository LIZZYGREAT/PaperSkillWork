import { SegmentedControl } from "../../foundation/controls/SegmentedControl";
import type { ReactNode } from "react";
import { useState } from "react";

export type ComparePanel = { id: string; title: string; summary?: string; content?: ReactNode; points?: string[] };
export type CompareViewMode = "side-by-side" | "before-after" | "invariant-changing";

/**
 * Two variants read as A/B columns with their own letter, rule and tone, and the
 * consequence of choosing between them is stated below as two short lists. The
 * mode switch only changes framing, not the content.
 */
export function CompareView({ variants, changes = [], invariants = [], initialMode = "invariant-changing" }: { variants: [ComparePanel, ComparePanel]; changes?: string[]; invariants?: string[]; initialMode?: CompareViewMode }) {
  const [mode, setMode] = useState<CompareViewMode>(initialMode);
  const options = [{ value: "side-by-side" as const, label: "Side by side" }, { value: "before-after" as const, label: "Before / after" }, { value: "invariant-changing" as const, label: "What changes" }];
  return (
    <section className={`rk-compare rk-compare--${mode}`} aria-label="Comparison">
      <div className="rk-compare__bar"><p className="rk-compare__bar-label">Two ways to state the objective</p><SegmentedControl label="Comparison view" value={mode} options={options} onChange={setMode} /></div>
      <div className="rk-compare__panels">{variants.map((variant, index) => <article className={`rk-compare__panel ${index === 0 ? "is-a" : "is-b"}${mode === "before-after" && index === 1 ? " is-after" : ""}`} key={variant.id}>
        <header className="rk-compare__panel-head"><span className="rk-compare__badge" aria-hidden="true">{index === 0 ? "A" : "B"}</span><h3>{variant.title}</h3></header>
        {variant.summary ? <p className="rk-compare__summary">{variant.summary}</p> : null}
        {variant.content}
        {variant.points ? <ul className="rk-compare__points">{variant.points.map((point) => <li key={point}>{point}</li>)}</ul> : null}
      </article>)}</div>
      {mode === "invariant-changing" ? <div className="rk-compare__key">
        <div className="rk-compare__key-block is-change"><p className="rk-compare__key-label">What changes</p>{changes.length ? <ul>{changes.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No changes specified.</p>}</div>
        <div className="rk-compare__key-block is-invariant"><p className="rk-compare__key-label">What stays invariant</p>{invariants.length ? <ul>{invariants.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No invariants specified.</p>}</div>
      </div> : null}
    </section>
  );
}
