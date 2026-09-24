import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { termById, type TermRecord } from '../data/registry';
import { ReferenceHub as UnifiedReferenceHub, type HubRequest } from './ReferenceHub';

type ReferenceActions = { openHub: (request?: HubRequest) => void };
const ReferenceContext = createContext<ReferenceActions>({ openHub: () => undefined });

export function ReferenceProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<HubRequest | null>(null);
  const openHub = (next: HubRequest = {}) => setRequest(next);
  const closeHub = () => setRequest(null);
  return (
    <ReferenceContext.Provider value={{ openHub }}>
      {children}
      <UnifiedReferenceHub request={request} onClose={closeHub} />
    </ReferenceContext.Provider>
  );
}

export function useReferenceHub() {
  return useContext(ReferenceContext);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function TermPopover({ term, onOpenHub }: { term: TermRecord; onOpenHub: () => void }) {
  return (
    <section className="v2-term-popover" role="dialog" aria-label={`${term.label} 术语说明`}>
      <div className="v2-popover-heading">
        <strong>{term.label}</strong>
        <span>{term.full_name}</span>
      </div>
      <p>{term.definition}</p>
      <dl>
        <div><dt>在本文中的作用</dt><dd>{term.paper_role}</dd></div>
        <div><dt>容易混淆</dt><dd>{term.confusion}</dd></div>
      </dl>
      {term.source_ref ? (
        <div className="v2-source-inline">
          来源分类：{term.source_category} · <code>{term.source_ref}</code>
        </div>
      ) : null}
      <button className="v2-text-button" type="button" onClick={onOpenHub}>在参考库中查看 →</button>
    </section>
  );
}

export function TermRef({ id, children }: { id: string; children?: React.ReactNode }) {
  const term = termById.get(id);
  const { openHub } = useReferenceHub();
  const rootRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLElement>(null);
  const [pinned, setPinned] = useState(false);
  const [preview, setPreview] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12 });
  const visible = Boolean(term && (pinned || preview));

  const updatePosition = () => {
    const anchor = buttonRef.current?.getBoundingClientRect();
    const popover = popoverRef.current?.getBoundingClientRect();
    if (!anchor) return;
    const width = Math.min(popover?.width || 340, window.innerWidth - 24);
    const left = clamp(anchor.left, 12, window.innerWidth - width - 12);
    const height = popover?.height || 260;
    const below = anchor.bottom + 10;
    const top = below + height <= window.innerHeight - 12
      ? below
      : clamp(anchor.top - height - 10, 12, window.innerHeight - height - 12);
    setPosition({ left, top });
  };

  useLayoutEffect(() => {
    if (!visible) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [visible, term]);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPinned(false);
        setPreview(false);
        buttonRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPinned(false);
        setPreview(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [visible]);

  if (!term) return <span>{children || id}</span>;
  return (
    <span
      ref={rootRef}
      className="v2-term-ref-wrap"
      onPointerEnter={(event) => { if (event.pointerType === 'mouse') setPreview(true); }}
      onPointerLeave={(event) => { if (event.pointerType === 'mouse' && !pinned) setPreview(false); }}
      onFocusCapture={() => setPreview(true)}
      onBlurCapture={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null) && !pinned) setPreview(false);
      }}
    >
      <button
        ref={buttonRef}
        className="v2-term-ref"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={visible}
        onClick={() => { setPinned((value) => !value); setPreview(false); }}
      >
        {children || term.label}
      </button>
      {visible ? (
        <div
          ref={popoverRef as React.RefObject<HTMLDivElement>}
          className="v2-term-popover-anchor"
          style={{ left: position.left, top: position.top }}
          onPointerEnter={() => setPreview(true)}
          onPointerLeave={() => { if (!pinned) setPreview(false); }}
        >
          <TermPopover term={term} onOpenHub={() => { setPinned(false); setPreview(false); openHub({ termId: term.id }); }} />
        </div>
      ) : null}
    </span>
  );
}
