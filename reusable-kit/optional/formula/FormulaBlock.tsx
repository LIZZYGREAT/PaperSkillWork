import { useState } from "react";
import type { ReactNode } from "react";

export type FormulaTermData = { id: string; label: string; explanation: string; relatedIds?: string[] };

export function FormulaTerm({ term, onSelect, selected = false }: { term: FormulaTermData; onSelect?: (term: FormulaTermData) => void; selected?: boolean }) {
  return <button type="button" className={selected ? "rk-formula-term is-selected" : "rk-formula-term"} onClick={() => onSelect?.(term)} aria-label={term.label + ": " + term.explanation} aria-pressed={selected}>{term.label}</button>;
}

/**
 * A formula beside the reading it needs. The equation gets its own tinted panel
 * with real typesetting (pass MathML through `renderedFormula`); the terms and the
 * selected explanation sit next to it, so a reader can read the expression and its
 * annotation at the same time instead of scrolling between blocks.
 */
export function FormulaBlock({ formula, renderedFormula, accessibleLabel, label = "Formula", termsLabel = "Terms", description, terms = [], onTermSelect }: {
  formula: string;
  renderedFormula?: ReactNode;
  accessibleLabel?: string;
  label?: string;
  termsLabel?: string;
  description?: string;
  terms?: FormulaTermData[];
  onTermSelect?: (termId: string, relatedIds?: string[]) => void;
}) {
  const [selected, setSelected] = useState<FormulaTermData | null>(null);
  const choose = (term: FormulaTermData) => { setSelected(term); onTermSelect?.(term.id, term.relatedIds); };
  return <section className="rk-formula-block" aria-label={label}>
    <div className="rk-formula-block__main">
      <p className="rk-formula-block__label">{label}</p>
      <div className="rk-formula-block__equation" role="math" aria-label={accessibleLabel ?? formula}>{renderedFormula ?? formula}</div>
    </div>
    <div className="rk-formula-block__side">
      {terms.length ? <div className="rk-formula-block__terms">
        <p className="rk-formula-block__terms-label">{termsLabel} · 逐项查看</p>
        <div className="rk-formula-block__term-list" role="group" aria-label={termsLabel}>{terms.map((term) => <FormulaTerm key={term.id} term={term} onSelect={choose} selected={selected?.id === term.id} />)}</div>
      </div> : null}
      <div className={selected ? "rk-formula-block__explanation has-term" : "rk-formula-block__explanation"} aria-live="polite">
        {selected
          ? <><p className="rk-formula-block__term-name">{selected.label}</p><p className="rk-formula-block__term-body">{selected.explanation}</p></>
          : <p className="rk-formula-block__hint">{description ?? "选择一个符号，看它在式子里指什么。"}</p>}
      </div>
    </div>
  </section>;
}
