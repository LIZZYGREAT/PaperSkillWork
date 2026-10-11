import { useCallback, useId, useRef, useState } from "react";
import type { FocusEvent, PointerEvent } from "react";
import { usePopoverPosition } from "../../foundation/overlay/Popover";
import type { TermDefinition, TermRefLabels } from "./types";

const DEFAULT_LABELS: TermRefLabels = {
  definition: "definition",
  paperRole: "Role in this paper:",
  easyToConfuse: "Easy to confuse with:",
  sourceKind: "Source type:",
  openReference: "Open in Reference Hub",
};

export function TermRef({ term, children, onOpenReference, labels }: {
  term: TermDefinition;
  children?: string;
  onOpenReference?: (termId: string) => void;
  labels?: Partial<TermRefLabels>;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const skipNextFocusOpen = useRef(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
  const copy = { ...DEFAULT_LABELS, ...labels };
  const open = !dismissed && (hovered || focused || pinned);

  const close = useCallback(() => {
    setHovered(false);
    setFocused(false);
    setPinned(false);
    setDismissed(true);
  }, []);
  const noteEscape = useCallback(() => {
    skipNextFocusOpen.current = document.activeElement !== triggerRef.current;
  }, []);
  const position = usePopoverPosition(triggerRef, panelRef, open, close, { onEscape: noteEscape });

  const onFocus = () => {
    if (skipNextFocusOpen.current) {
      skipNextFocusOpen.current = false;
      return;
    }
    setDismissed(false);
    setFocused(true);
  };
  const closeOnBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  };
  const closeOnLeave = (event: PointerEvent<HTMLSpanElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && panelRef.current?.contains(nextTarget)) return;
    setHovered(false);
  };
  const onTriggerClick = () => {
    if (pinned) {
      setHovered(false);
      setFocused(false);
      setPinned(false);
      setDismissed(true);
      return;
    }
    setDismissed(false);
    setPinned(true);
  };
  const openReference = () => {
    onOpenReference?.(term.id);
    close();
  };
  const openOnHover = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType === "touch") return;
    setDismissed(false);
    setHovered(true);
  };

  return (
    <span className="rk-term-ref-wrap" onPointerEnter={openOnHover} onPointerLeave={closeOnLeave} onFocus={onFocus} onBlur={closeOnBlur}>
      <button ref={triggerRef} type="button" className="rk-term-ref" aria-haspopup="dialog" aria-expanded={open} aria-controls={panelId} onClick={onTriggerClick}>
        {children ?? term.label}
      </button>
      {open ? (
        <div ref={panelRef} className="rk-term-popover" id={panelId} role="dialog" aria-label={term.label + " " + copy.definition} style={{ top: position.top, left: position.left, visibility: position.ready ? "visible" : "hidden" }}>
          <strong>{term.fullName ?? term.label}</strong>
          <span>{term.definition}</span>
          {term.paperRole ? <span><b>{copy.paperRole}</b> {term.paperRole}</span> : null}
          {term.confusion ? <span><b>{copy.easyToConfuse}</b> {term.confusion}</span> : null}
          {term.sourceKind ? <small><b>{copy.sourceKind}</b> {term.sourceKind}</small> : null}
          {onOpenReference ? <button type="button" className="rk-term-popover__link" onClick={openReference}>{copy.openReference}</button> : null}
        </div>
      ) : null}
    </span>
  );
}

export const TermPopover = TermRef;
