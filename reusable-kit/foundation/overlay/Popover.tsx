import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export function Popover({ label, trigger, children, className = "" }: { label: string; trigger: ReactNode; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const anchor = triggerRef.current?.getBoundingClientRect();
      const panel = panelRef.current?.getBoundingClientRect();
      if (!anchor) return;
      const width = panel?.width ?? 320;
      const height = panel?.height ?? 180;
      const left = Math.min(Math.max(12, anchor.left), window.innerWidth - width - 12);
      const below = anchor.bottom + 8;
      const top = below + height <= window.innerHeight - 12 ? below : Math.max(12, anchor.top - height - 8);
      setPosition({ top, left, ready: true });
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <>
      <button ref={triggerRef} type="button" className="rk-popover__trigger" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {trigger}
      </button>
      {open ? (
        <div ref={panelRef} className={`rk-popover ${className}`.trim()} role="dialog" aria-label={label} style={{ top: position.top, left: position.left, visibility: position.ready ? "visible" : "hidden" }}>
          <button type="button" className="rk-overlay__close" aria-label="Close" onClick={close}>×</button>
          {children}
        </div>
      ) : null}
    </>
  );
}
