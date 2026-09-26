import { useState } from "react";
import type { FocusEvent, PointerEvent } from "react";
import type { TermDefinition } from "./types";

export function TermRef({ term, children, onOpenReference }: { term: TermDefinition; children?: string; onOpenReference?: (termId: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || focused || pinned;
  const closeOnBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  };
  const closeOnLeave = (_event: PointerEvent<HTMLSpanElement>) => setHovered(false);

  return (
    <span className="rk-term-ref-wrap" onPointerEnter={() => setHovered(true)} onPointerLeave={closeOnLeave} onFocus={() => setFocused(true)} onBlur={closeOnBlur}>
      <button type="button" className="rk-term-ref" aria-haspopup="dialog" aria-expanded={open} aria-controls={`rk-term-${term.id}`} onClick={() => setPinned((value) => !value)}>
        {children ?? term.label}
      </button>
      {open ? (
        <span className="rk-term-popover" id={`rk-term-${term.id}`} role="dialog" aria-label={`${term.label} definition`}>
          <strong>{term.fullName ?? term.label}</strong>
          <span>{term.definition}</span>
          {term.paperRole ? <span><b>Role in this paper:</b> {term.paperRole}</span> : null}
          {term.confusion ? <span><b>Easy to confuse with:</b> {term.confusion}</span> : null}
          {term.sourceKind ? <small>Source type: {term.sourceKind}</small> : null}
          {onOpenReference ? <button type="button" className="rk-term-popover__link" onClick={() => onOpenReference(term.id)}>Open in Reference Hub</button> : null}
        </span>
      ) : null}
    </span>
  );
}

export const TermPopover = TermRef;
