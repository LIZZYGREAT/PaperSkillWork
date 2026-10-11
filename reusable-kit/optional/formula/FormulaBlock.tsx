import { useState } from "react";
import type { ReactNode } from "react";

export type FormulaTermData = { id: string; label: string; explanation: string; relatedIds?: string[] };

export function FormulaTerm({ term, onSelect, selected = false }: { term: FormulaTermData; onSelect?: (term: FormulaTermData) => void; selected?: boolean }) {
  return <button type="button" className={selected ? "rk-formula-term is-selected" : "rk-formula-term"} onClick={() => onSelect?.(term)} aria-label={term.label + ": " + term.explanation} aria-pressed={selected}>{term.label}</button>;
}

export function FormulaBlock({ formula, renderedFormula, accessibleLabel, label = "Formula", termsLabel = "Formula terms", description, terms = [], onTermSelect }: {
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
  return <section className="rk-formula-block" aria-label={label}><div className="rk-formula-block__equation" role="math" aria-label={accessibleLabel ?? formula}>{renderedFormula ?? formula}</div>{description ? <p>{description}</p> : null}{terms.length ? <div className="rk-formula-block__terms" aria-label={termsLabel}>{terms.map((term) => <FormulaTerm key={term.id} term={term} onSelect={choose} selected={selected?.id === term.id} />)}</div> : null}{selected ? <p className="rk-formula-block__explanation" aria-live="polite"><b>{selected.label}</b>: {selected.explanation}</p> : null}</section>;
}
