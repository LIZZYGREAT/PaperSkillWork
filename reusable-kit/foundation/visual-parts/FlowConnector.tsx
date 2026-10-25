import './visual-parts.css';

export type SignalKind = 'data' | 'control' | 'gradient' | 'reference';
/** For a local directed link; use DiagramFlow for arbitrary multi-node geometry. */
export function FlowConnector({ kind = 'data', label, direction = 'right' }: { kind?: SignalKind; label: string; direction?: 'right' | 'down' | 'left' }) {
  return <span className="rk-flow-connector" data-kind={kind} data-direction={direction} role="img" aria-label={`${label} (${kind}, ${direction})`}>
    <svg viewBox={direction === 'down' ? '0 0 16 48' : '0 0 48 16'} aria-hidden="true"><path className="rk-flow-connector__shaft" d={direction === 'down' ? 'M8 2V43' : 'M2 8H43'} /><path d={direction === 'down' ? 'm3 37 5 6 5-6' : 'm37 3 6 5-6 5'} /></svg><span>{label}</span>
  </span>;
}
