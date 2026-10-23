export type BarMeterItem = {
  id: string;
  label: string;
  /** 0–max. The bar length is derived from this, never from a hard-coded width. */
  value: number;
  /** What a reader should compare; defaults to the rounded value. */
  display?: string;
  note?: string;
};

/**
 * Ranked horizontal bars for a small set of comparable values. Every bar carries
 * its number, so the figure is readable without estimating lengths by eye.
 */
export function BarMeter({ items, max, label, unit }: { items: BarMeterItem[]; max?: number; label: string; unit?: string }) {
  const ceiling = max ?? Math.max(...items.map((item) => item.value), 1);
  return <ul className="rk-bars" aria-label={label}>
    {items.map((item) => {
      const ratio = Math.max(0, Math.min(1, item.value / ceiling));
      return <li className="rk-bars__row" key={item.id}>
        <span className="rk-bars__label">{item.label}</span>
        <span className="rk-bars__track">
          <span className="rk-bars__fill" style={{ width: `${(ratio * 100).toFixed(1)}%` }} />
        </span>
        <span className="rk-bars__value">{item.display ?? `${Math.round(item.value * 100) / 100}${unit ? ` ${unit}` : ""}`}</span>
        {item.note ? <span className="rk-bars__note">{item.note}</span> : null}
      </li>;
    })}
  </ul>;
}
