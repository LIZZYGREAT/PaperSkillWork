import { TERMS } from '../data/knowledge';

export function TermGlossary({ ids }: { ids: string[] }) {
  const terms = ids.map((id) => TERMS[id]).filter(Boolean);
  if (!terms.length) return null;
  return (
    <section className="term-section" aria-label="本场景术语">
      <span className="section-kicker">术语</span>
      <div className="term-list">
        {terms.map((term) => (
          <details className="term-item" key={term.label}>
            <summary>{term.label}</summary>
            <p>{term.definition}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
