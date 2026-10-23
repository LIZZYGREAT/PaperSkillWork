export type StatItem = { id: string; value: string; label: string; note?: string };

/**
 * A row of headline numbers. Use it when two to four values are the point of the
 * section; keep the prose short beside it and never invent a number to fill a slot.
 */
export function StatRow({ items, label }: { items: StatItem[]; label: string }) {
  return <dl className="rk-stats" aria-label={label}>
    {items.map((item) => <div className="rk-stats__item" key={item.id}>
      <dt className="rk-stats__label">{item.label}</dt>
      <dd className="rk-stats__value">{item.value}</dd>
      {item.note ? <dd className="rk-stats__note">{item.note}</dd> : null}
    </div>)}
  </dl>;
}
