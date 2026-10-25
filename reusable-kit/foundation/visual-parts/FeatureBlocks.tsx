import './visual-parts.css';

/** A drawing primitive, not an assertion about channel count or CNN topology. */
export function FeatureBlocks({ label, depth = 4, active = false }: { label: string; depth?: number; active?: boolean }) {
  if (!Number.isInteger(depth) || depth < 1 || depth > 7) return <span role="alert">示意堆叠数量须为 1–7。</span>;
  return <figure className="rk-feature-blocks" data-active={active}>
    <svg viewBox="0 0 112 112" role="img" aria-label={label}>
      {Array.from({ length: depth }, (_, i) => <rect key={i} x={12 + i * 6} y={10 + i * 5} width="62" height="76" rx="4" />)}
      <path d={`M${24 + (depth - 1) * 6} ${32 + (depth - 1) * 5}h36m-36 16h36m-36 16h36`} />
    </svg><figcaption>{label}</figcaption>
  </figure>;
}
