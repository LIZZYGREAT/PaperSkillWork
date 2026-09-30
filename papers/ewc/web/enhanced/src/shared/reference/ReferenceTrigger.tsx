import { useCallback, useRef, useState } from "react";
import type { FocusEvent, MouseEvent, PointerEvent, ReactNode } from "react";
import { usePopoverPosition } from "../foundation/overlay/Popover";
import type { CanonicalReferenceId } from "../../contracts/ids";
import { referenceRegistry } from "../../data/referenceRegistry";
import { useReferenceApi } from "./ReferenceProvider";

export function ReferenceTrigger({ id, children, className = "", onActivate }: {
  id: CanonicalReferenceId;
  children: ReactNode;
  className?: string;
  onActivate?: () => void;
}) {
  const api = useReferenceApi();
  const item = referenceRegistry[id];
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const close = useCallback(() => { setOpen(false); setPinned(false); }, []);
  const position = usePopoverPosition(triggerRef, panelRef, open, close);

  const cancelClose = () => {
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
  };
  const scheduleClose = () => {
    cancelClose();
    timerRef.current = window.setTimeout(() => {
      if (!pinned && document.activeElement !== triggerRef.current && !panelRef.current?.contains(document.activeElement)) setOpen(false);
    }, 160);
  };
  const onBlur = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && (triggerRef.current?.contains(next) || panelRef.current?.contains(next))) return;
    scheduleClose();
  };
  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onActivate?.();
    if (open && pinned) { setPinned(false); setOpen(false); }
    else { cancelClose(); setPinned(true); setOpen(true); }
  };

  if (!item) return <>{children}</>;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`ewc-reference-trigger ${className}`.trim()}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`reference-preview-${id}`}
        onPointerEnter={(_event: PointerEvent<HTMLButtonElement>) => { cancelClose(); setOpen(true); }}
        onPointerLeave={scheduleClose}
        onFocus={() => { cancelClose(); setOpen(true); }}
        onBlur={onBlur}
        onClick={onClick}
      >{children}</button>
      {open ? (
        <div
          ref={panelRef}
          id={`reference-preview-${id}`}
          className="ewc-reference-preview"
          role="dialog"
          aria-label={`${item.title} quick reference`}
          style={{ top: position.top, left: position.left, visibility: position.ready ? "visible" : "hidden" }}
          onPointerEnter={cancelClose}
          onPointerLeave={scheduleClose}
          onBlur={onBlur}
        >
          <div className="ewc-reference-preview__eyebrow">{item.kind} · {item.sourceCategory ?? "tutorial reference"}</div>
          <h3>{item.title}</h3>
          <p>{item.summary}</p>
          <p className="ewc-reference-preview__role"><strong>作用</strong> {item.role}</p>
          {item.confusion ? <p className="ewc-reference-preview__boundary"><strong>注意</strong> {item.confusion}</p> : null}
          {item.boundary ? <p className="ewc-reference-preview__boundary">{item.boundary}</p> : null}
          <button className="ewc-text-action" type="button" onClick={() => api.openReference({ referenceId: id })}>在 Reference Hub 中查看 →</button>
        </div>
      ) : null}
    </>
  );
}
