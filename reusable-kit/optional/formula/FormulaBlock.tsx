import { useState } from "react";

export type FormulaTermData = { id: string; label: string; explanation: string; relatedIds?: string[] };

export function FormulaTerm({ term, onSelect }: { term: FormulaTermData; onSelect?: (term: FormulaTermData) => void }) {
  return <button type="button" className="rk-formula-term" onClick={() => onSelect?.(term)} aria-label={`${term.label}: ${term.explanation}`}>{term.label}</button>;
}

export function FormulaBlock({ formula, description, terms = [], onTermSelect }: { formula: string; description?: string; terms?: FormulaTermData[]; onTermSelect?: (termId: string, relatedIds?: string[]) => void }) {
  const [selected, setSelected] = useState<FormulaTermData | null>(null);
  const choose = (term: FormulaTermData) => { setSelected(term); onTermSelect?.(term.id, term.relatedIds); };
  return <section className="rk-formula-block" aria-label="Formula"><div className="rk-formula-block__equation"><code>{formula}</code></div>{description ? <p>{description}</p> : null}{terms.length ? <div className="rk-formula-block__terms" aria-label="Formula terms">{terms.map((term) => <FormulaTerm key={term.id} term={term} onSelect={choose} />)}</div> : null}{selected ? <p className="rk-formula-block__explanation" aria-live="polite"><b>{selected.label}</b>: {selected.explanation}</p> : null}</section>;
}
