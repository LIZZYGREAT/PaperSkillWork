import type { ReactNode } from "react";

export function StickySystemView({ visual, children, label = "Persistent system view" }: { visual: ReactNode; children: ReactNode; label?: string }) {
  return (
    <section className="rk-sticky-system" aria-label={label}>
      <div className="rk-sticky-system__visual">{visual}</div>
      <div className="rk-sticky-system__content">{children}</div>
    </section>
  );
}
