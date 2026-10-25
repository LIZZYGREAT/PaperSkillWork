import './visual-parts.css';

export function FeatureAggregation({ label, active = false }: { label: string; active?: boolean }) {
  return <figure className="rk-feature-aggregation" data-active={active}><svg viewBox="0 0 112 112" role="img" aria-label={label}>
    {[24, 40, 31, 48, 35].map((height, i) => <rect className="rk-feature-aggregation__bar" key={i} x={21 + i * 15} y={82 - height} width="10" height={height} rx="3" />)}
    <path className="rk-feature-aggregation__baseline" d="M13 82.5H103" />
  </svg><figcaption>{label}</figcaption></figure>;
}
