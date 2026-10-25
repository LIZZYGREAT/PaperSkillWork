import './visual-parts.css';

export type SignalKind = 'data' | 'control' | 'gradient' | 'reference';
/** For a local directed link; use DiagramFlow for arbitrary multi-node geometry. */
export function FlowConnector({ kind = 'data', label, direction = 'right' }: { kind?: SignalKind; label: string; direction?: 'right' | 'down' | 'left' }) {
  return <span className="rk-flow-connector" data-kind={kind} data-direction={direction} role="img" aria-label={`${label} (${kind}, ${direction})`}>
    <svg viewBox="0 0 48 16" aria-hidden="true"><path className="rk-flow-connector__shaft" d="M2 8H43" /><path d="m37 3 6 5-6 5" /></svg><span>{label}</span>
  </span>;
}
