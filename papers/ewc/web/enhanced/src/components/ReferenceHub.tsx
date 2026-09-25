import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  ALL_REFERENCE_ENTRIES,
  REFERENCE_ENTRY_BY_ID,
  REFERENCE_KIND_LABELS,
  REFERENCE_PAGES,
  resolveReferenceId,
  type ReferenceEntry,
  type ReferenceKind,
  type ReferenceRequest,
} from '../data/references';

const kinds: ReferenceKind[] = ['symbol', 'formula', 'dataset', 'method', 'claim', 'evidence', 'term'];

export function ReferenceHub({ request, onClose }: { request: ReferenceRequest | null; onClose: () => void }) {
  const [selectedId, setSelectedId] = useState('formula:ewc-objective');
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<ReferenceKind | 'all'>('all');
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!request) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setSelectedId(request.cardId ? resolveReferenceId(request.cardId) : 'formula:ewc-objective');
    setQuery('');
    setKindFilter('all');
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.body.style.overflow = oldOverflow;
      previousFocus.current?.focus();
    };
  }, [request]);

  const filteredEntries = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return ALL_REFERENCE_ENTRIES.filter((entry) => {
      const matchesKind = kindFilter === 'all' || entry.kind === kindFilter;
      const matchesQuery = !needle || `${entry.id} ${entry.kind} ${entry.category} ${entry.title} ${entry.summary} ${entry.keywords} ${entry.fields.map((field) => `${field.label} ${field.value}`).join(' ')}`.toLocaleLowerCase().includes(needle);
      return matchesKind && matchesQuery;
    }).sort((a, b) => {
      if (!needle) return kinds.indexOf(a.kind) - kinds.indexOf(b.kind) || a.title.localeCompare(b.title, 'zh-CN');
      const rank = (entry: ReferenceEntry) => {
        const title = entry.title.toLocaleLowerCase();
        const id = entry.id.toLocaleLowerCase();
        return title === needle || id === needle ? 0 : title.startsWith(needle) || id.startsWith(needle) ? 1 : title.includes(needle) ? 2 : 3;
      };
      return rank(a) - rank(b) || kinds.indexOf(a.kind) - kinds.indexOf(b.kind) || a.title.localeCompare(b.title, 'zh-CN');
    });
  }, [kindFilter, query]);

  useEffect(() => {
    if (filteredEntries.length && !filteredEntries.some((entry) => entry.id === selectedId)) setSelectedId(filteredEntries[0].id);
  }, [filteredEntries, selectedId]);

  if (!request) return null;
  const selected = REFERENCE_ENTRY_BY_ID.get(selectedId);
  const onDialogKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); return; }
    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')];
    if (!focusable.length) return;
    if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable[focusable.length - 1].focus(); }
    else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) { event.preventDefault(); focusable[0].focus(); }
  };

  const navigateToPage = (pageId: string) => {
    window.dispatchEvent(new CustomEvent('ewc:open-page', { detail: pageId }));
    onClose();
  };
  const selectRelated = (id: string) => {
    const resolved = resolveReferenceId(id);
    if (REFERENCE_ENTRY_BY_ID.has(resolved)) setSelectedId(resolved);
  };

  return (
    <div className="reference-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={panelRef} className="reference-hub" role="dialog" aria-modal="true" aria-labelledby="reference-title" onKeyDown={onDialogKeyDown}>
        <header className="reference-header">
          <div><span className="reference-eyebrow">全站知识索引</span><h2 id="reference-title">Reference Hub</h2><p>跨页搜索术语、符号、公式、方法、实验与证据</p></div>
          <button ref={closeRef} type="button" className="reference-close" aria-label="关闭 Reference Hub" onClick={onClose}>×</button>
        </header>
        <label className="reference-search"><span className="reference-sr-only">搜索参考库</span><input autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 Fisher、θ*、Equation 3、MNIST、Atari、C05…" /></label>
        <div className="reference-filter-row">
          <label>条目类型<select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as ReferenceKind | 'all')}><option value="all">全部类型 · {ALL_REFERENCE_ENTRIES.length}</option>{kinds.map((kind) => <option key={kind} value={kind}>{REFERENCE_KIND_LABELS[kind]}</option>)}</select></label>
          <span aria-live="polite">{filteredEntries.length} 条结果</span>
        </div>
        <div className="reference-columns">
          <nav className="reference-results" aria-label="参考条目">
            {groupEntries(filteredEntries).map(([kind, entries]) => <section className="reference-group" key={kind}>
              <h3>{REFERENCE_KIND_LABELS[kind]} · {entries.length}</h3>
              {entries.map((entry) => <button type="button" key={entry.id} className={entry.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedId(entry.id)}>
                <strong>{entry.title}</strong><small>{entry.id} · {entry.category}</small>
              </button>)}
            </section>)}
            {!filteredEntries.length ? <p className="reference-empty">没有匹配的条目。试试证据编号、符号或实验名。</p> : null}
          </nav>
          {selected ? <ReferenceDetails entry={selected} onSelect={selectRelated} onNavigate={navigateToPage} /> : <p className="reference-empty">选择一条记录查看定义与交叉引用。</p>}
        </div>
        <footer className="reference-footer">来源类别和主张边界保留在每条记录中；教学示意与论文结果分开标记。</footer>
      </section>
    </div>
  );
}

function groupEntries(entries: ReferenceEntry[]) {
  const groups = new Map<ReferenceKind, ReferenceEntry[]>();
  for (const entry of entries) groups.set(entry.kind, [...(groups.get(entry.kind) ?? []), entry]);
  return [...groups.entries()].sort(([a], [b]) => kinds.indexOf(a) - kinds.indexOf(b));
}

function ReferenceDetails({ entry, onSelect, onNavigate }: { entry: ReferenceEntry; onSelect: (id: string) => void; onNavigate: (pageId: string) => void }) {
  const related = entry.relatedIds.map(resolveReferenceId).filter((id, index, all) => REFERENCE_ENTRY_BY_ID.has(id) && all.indexOf(id) === index);
  const pages = entry.pageIds.filter((id, index, all) => REFERENCE_PAGES[id] && all.indexOf(id) === index);
  return <article className="reference-detail">
    <div className="reference-badges"><span>{entry.category}</span><span>{REFERENCE_KIND_LABELS[entry.kind]}</span></div>
    <h3>{entry.title}</h3><code className="reference-id">{entry.id}</code><p className="reference-summary">{entry.summary}</p>
    <dl>{entry.fields.map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.value || '—'}</dd></div>)}{entry.boundary ? <div><dt>主张边界</dt><dd>{entry.boundary}</dd></div> : null}</dl>
    {entry.sourceUrl ? <a className="reference-source-link" href={entry.sourceUrl} target="_blank" rel="noreferrer">打开原文对应位置 ↗</a> : null}
    {pages.length ? <section className="reference-related"><strong>使用此条目的页面</strong><div>{pages.map((id) => <button key={id} type="button" onClick={() => onNavigate(id)}>{REFERENCE_PAGES[id]} →</button>)}</div></section> : null}
    {related.length ? <section className="reference-related"><strong>关联知识</strong><div>{related.map((id) => <button key={id} type="button" onClick={() => onSelect(id)}>{REFERENCE_ENTRY_BY_ID.get(id)?.title ?? id} ↗</button>)}</div></section> : null}
    {entry.evidenceIds.length ? <section className="reference-related"><strong>支持 / 关联证据</strong><div>{entry.evidenceIds.map((id) => <button key={id} type="button" onClick={() => onSelect(`evidence:${id}`)}>{id} ↗</button>)}</div></section> : null}
  </article>;
}
