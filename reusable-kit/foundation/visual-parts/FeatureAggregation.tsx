import './visual-parts.css';

export function FeatureAggregation({ label, active = false }: { label: string; active?: boolean }) {
  return <figure className="rk-feature-aggregation" data-active={active}><svg viewBox="0 0 112 112" role="img" aria-label={label}>
    <rect x="10" y="24" width="92" height="64" rx="7" />
    {[23, 41, 30, 49, 36].map((h, i) => <path key={i} d={`M${27 + i * 14} 76v-${h}`} />)}
  </svg><figcaption>{label}</figcaption></figure>;
}
