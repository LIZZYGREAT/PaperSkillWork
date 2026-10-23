import type { ReactNode } from "react";

export type MetaListItem = { id: string; label: string; value: ReactNode };

/**
 * Label/value rows for inspected facts. Hairline rows and a mono label column give
 * textual state a hierarchy instead of another paragraph block. This is a
 * Foundation primitive: `core/*` components use it too.
 */
export function MetaList({ items, label, className = "" }: { items: MetaListItem[]; label: string; className?: string }) {
  return <dl className={`rk-meta-list${className ? ` ${className}` : ""}`} aria-label={label}>
    {items.map((item) => <div className="rk-meta-list__row" key={item.id}>
      <dt className="rk-meta-list__label">{item.label}</dt>
      <dd className="rk-meta-list__value">{item.value}</dd>
    </div>)}
  </dl>;
}
