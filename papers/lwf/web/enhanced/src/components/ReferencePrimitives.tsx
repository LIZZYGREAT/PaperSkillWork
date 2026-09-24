import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { evidence, evidenceById, termById, terms, type TermRecord } from '../data/registry';

type HubRequest = { termId?: string; evidenceId?: string };
type ReferenceActions = { openHub: (request?: HubRequest) => void };
const ReferenceContext = createContext<ReferenceActions>({ openHub: () => undefined });

export function ReferenceProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<HubRequest | null>(null);
  const openHub = (next: HubRequest = {}) => setRequest(next);
  const closeHub = () => setRequest(null);
  return (
    <ReferenceContext.Provider value={{ openHub }}>
      {children}
      <ReferenceHub request={request} onClose={closeHub} />
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

function ReferenceHub({ request, onClose }: { request: HubRequest | null; onClose: () => void }) {
  const [tab, setTab] = useState<'terms' | 'evidence'>('terms');
  const [termId, setTermId] = useState(terms[0]?.id || '');
  const [evidenceId, setEvidenceId] = useState(evidence[0]?.id || '');
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!request) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    if (request.termId) {
      setTab('terms');
      setTermId(request.termId);
    }
    if (request.evidenceId) {
      setTab('evidence');
      setEvidenceId(request.evidenceId);
    }
    setQuery('');
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => previousFocus.current?.focus();
  }, [request]);

  if (!request) return null;
  const selectedTerm = termById.get(termId);
  const selectedEvidence = evidenceById.get(evidenceId);
  const filteredTerms = terms.filter((term) => `${term.label} ${term.full_name} ${term.definition}`.toLowerCase().includes(query.toLowerCase()));
  const filteredEvidence = evidence.filter((item) => `${item.id} ${item.text} ${item.type}`.toLowerCase().includes(query.toLowerCase()));

  const onDialogKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="v2-drawer-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside ref={panelRef} className="v2-reference-drawer" role="dialog" aria-modal="true" aria-labelledby="v2-reference-title" onKeyDown={onDialogKeyDown}>
        <header className="v2-drawer-header">
          <div><span className="v2-eyebrow">KNOWLEDGE REGISTRY</span><h2 id="v2-reference-title">术语与证据参考库</h2></div>
          <button ref={closeRef} className="v2-icon-button" type="button" onClick={onClose} aria-label="关闭参考库">×</button>
        </header>
        <div className="v2-drawer-tabs" role="group" aria-label="参考库类别">
          <button type="button" aria-pressed={tab === 'terms'} className={tab === 'terms' ? 'is-active' : ''} onClick={() => setTab('terms')}>术语 · {terms.length}</button>
          <button type="button" aria-pressed={tab === 'evidence'} className={tab === 'evidence' ? 'is-active' : ''} onClick={() => setTab('evidence')}>证据 · {evidence.length}</button>
        </div>
        <label className="v2-reference-search">
          <span className="v2-sr-only">搜索参考库</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === 'terms' ? '搜索术语' : '搜索证据编号或主张'} />
        </label>
        {tab === 'terms' ? (
          <div className="v2-reference-columns">
            <nav className="v2-reference-list" aria-label="术语列表">
              {filteredTerms.map((term) => (
                <button key={term.id} className={term.id === termId ? 'is-selected' : ''} onClick={() => setTermId(term.id)}>
                  <strong>{term.label}</strong><small>{term.id}</small>
                </button>
              ))}
            </nav>
            {selectedTerm ? <TermDetails term={selectedTerm} onEvidence={(id) => { setEvidenceId(id); setTab('evidence'); setQuery(''); }} /> : <p className="v2-empty-state">没有匹配术语。</p>}
          </div>
        ) : (
          <div className="v2-reference-columns">
            <nav className="v2-reference-list" aria-label="证据列表">
              {filteredEvidence.map((item) => (
                <button key={item.id} className={item.id === evidenceId ? 'is-selected' : ''} onClick={() => setEvidenceId(item.id)}>
                  <strong>{item.id}</strong><small>{item.type.replace(/_/g, ' ')}</small>
                </button>
              ))}
            </nav>
            {selectedEvidence ? <EvidenceDetails id={selectedEvidence.id} /> : <p className="v2-empty-state">没有匹配证据。</p>}
          </div>
        )}
        <footer className="v2-drawer-footer">结构化内容来自当前论文的 `knowledge/terms.yaml` 与 `research/02_evidence_registry.yaml`。</footer>
      </aside>
    </div>
  );
}

function TermDetails({ term, onEvidence }: { term: TermRecord; onEvidence: (id: string) => void }) {
  return (
    <article className="v2-reference-detail">
      <span className="v2-reference-category">{term.source_category}</span>
      <h3>{term.label}</h3>
      <p className="v2-reference-fullname">{term.full_name}</p>
      <dl>
        <div><dt>定义</dt><dd>{term.definition}</dd></div>
        <div><dt>本文角色</dt><dd>{term.paper_role}</dd></div>
        <div><dt>容易混淆</dt><dd>{term.confusion}</dd></div>
        <div><dt>前置术语</dt><dd>{term.prerequisites.length ? term.prerequisites.map((id) => termById.get(id)?.label || id).join('、') : '无'}</dd></div>
      </dl>
      {term.source_ref ? <button className="v2-evidence-link" type="button" onClick={() => onEvidence(term.source_ref!)}>查看依据：{term.source_ref} →</button> : null}
    </article>
  );
}

function EvidenceDetails({ id }: { id: string }) {
  const item = evidenceById.get(id);
  if (!item) return <p className="v2-empty-state">找不到证据记录。</p>;
  return (
    <article className="v2-reference-detail">
      <span className="v2-reference-category">{item.type.replace(/_/g, ' ')}</span>
      <h3>{item.id}</h3>
      <p>{item.text}</p>
      <dl><div><dt>Registry 区段</dt><dd>{item.group}</dd></div><div><dt>来源位置</dt><dd>{item.location || '无论文来源；这是背景或实现映射。'}</dd></div></dl>
      <a className="v2-evidence-link" href="https://arxiv.org/abs/1606.09282" target="_blank" rel="noreferrer">打开原论文 ↗</a>
    </article>
  );
}
