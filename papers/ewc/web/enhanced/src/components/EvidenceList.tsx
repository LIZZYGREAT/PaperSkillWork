import { EVIDENCE } from '../data/knowledge';
import { ReferenceButton } from './ReferencePrimitives';

export function EvidenceList({ ids }: { ids: string[] }) {
  const entries = ids.map((id) => EVIDENCE[id]).filter(Boolean);
  if (!entries.length) return null;
  return (
    <section className="evidence-section" aria-labelledby="evidence-heading">
      <div className="section-kicker">证据登记</div>
      <h2 id="evidence-heading">本场景依据</h2>
      <div className="evidence-list">
        {entries.map((entry) => (
          <details className="evidence-card" key={entry.id}>
            <summary>
              <span className="evidence-id">{entry.id}</span>
              <span className="evidence-category">{entry.category}</span>
              <span className="evidence-statement">{entry.statement}</span>
            </summary>
            <div className="evidence-detail">
              <p><strong>来源位置：</strong>{entry.sourceLocation}</p>
              <p><strong>边界：</strong>{entry.boundary}</p>
              {entry.sourceUrl && <a href={entry.sourceUrl} target="_blank" rel="noreferrer">打开原文对应部分 ↗</a>}
              <ReferenceButton cardId={`evidence:${entry.id}`}>在 Reference Hub 中查看该证据</ReferenceButton>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
