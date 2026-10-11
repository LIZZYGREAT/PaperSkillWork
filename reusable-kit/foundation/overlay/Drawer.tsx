import { useCallback, useId, useRef } from "react";
import type { ReactNode } from "react";
import { useFocusTrap } from "../accessibility/useReducedMotion";

export function Drawer({ open, title, onClose, children, side = "right", closeLabel = "Close" }: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  side?: "left" | "right";
  closeLabel?: string;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  const handleClose = useCallback(() => closeRef.current(), []);
  const panelRef = useFocusTrap<HTMLDivElement>(open, handleClose);
  if (!open) return null;
  return (
    <div className="rk-overlay" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={panelRef} className={"rk-drawer rk-drawer--" + side} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <header className="rk-overlay__header"><h2 id={titleId}>{title}</h2><button type="button" className="rk-overlay__close" onClick={onClose} aria-label={closeLabel}>×</button></header>
        <div className="rk-overlay__body">{children}</div>
      </section>
    </div>
  );
}
