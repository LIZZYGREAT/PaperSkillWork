import './visual-parts.css';

export function FeatureAggregation({ label, active = false }: { label: string; active?: boolean }) {
  return <figure className="rk-feature-aggregation" data-active={active}><svg viewBox="0 0 112 112" role="img" aria-label={label}>
    <rect className="rk-feature-aggregation__frame" x="8" y="20" width="96" height="76" rx="9" />
    {[24, 40, 31, 48, 35].map((height, i) => <rect className="rk-feature-aggregation__bar" key={i} x={21 + i * 15} y={82 - height} width="10" height={height} rx="3" />)}
  </svg><figcaption>{label}</figcaption></figure>;
}
