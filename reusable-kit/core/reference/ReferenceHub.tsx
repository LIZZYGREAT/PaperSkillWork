import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KnowledgeEntry, ReferenceKind } from "./types";
import { validateKnowledgeEntries } from "./types";

const KINDS: ReferenceKind[] = ["term", "symbol", "formula", "dataset", "method", "evidence", "advanced"];
const KIND_LABELS: Record<ReferenceKind, string> = {
  term: "Term",
  symbol: "Symbol",
  formula: "Formula",
  dataset: "Dataset",
  method: "Method",
  evidence: "Evidence",
  advanced: "Advanced",
};

export type ReferenceHubProps = {
  entries: KnowledgeEntry[];
  title?: string;
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelectedIdChange?: (entryId: string | null) => void;
  onOpen?: (entry: KnowledgeEntry) => void;
  onJumpToSection?: (sectionId: string, entry: KnowledgeEntry) => void;
};

export function ReferenceHub({ entries, title = "Reference Hub", selectedId, defaultSelectedId = null, onSelectedIdChange, onOpen, onJumpToSection }: ReferenceHubProps) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<ReferenceKind | "all">("all");
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(defaultSelectedId);
  const controlled = selectedId !== undefined;
  const activeId = controlled ? selectedId : internalSelectedId;
  const detailRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const headingId = useId();
  const detailId = useId();
  const selectedTitleId = useId();
  const errors = useMemo(() => validateKnowledgeEntries(entries), [entries]);
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return entries.filter((entry) => {
      const { titleEn, summaryEn, tags = [], sourceRefs = [] } = entry.reference;
      return (kind === "all" || entry.kind === kind) && (!search || [titleEn, summaryEn, ...tags, ...sourceRefs].join(" ").toLocaleLowerCase().includes(search));
    });
  }, [entries, kind, query]);
  const selected = entries.find((entry) => entry.id === activeId) ?? null;

  useEffect(() => {
    if (detailRef.current) detailRef.current.scrollTop = 0;
    if (!activeId) return;
    const button = itemRefs.current.get(activeId);
    const list = listRef.current;
    if (!button || !list) return;
    const buttonBox = button.getBoundingClientRect();
    const listBox = list.getBoundingClientRect();
    if (buttonBox.top < listBox.top || buttonBox.bottom > listBox.bottom) button.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  const selectId = (nextId: string | null) => {
    if (!controlled) setInternalSelectedId(nextId);
    onSelectedIdChange?.(nextId);
    const entry = entries.find((candidate) => candidate.id === nextId);
    if (entry) onOpen?.(entry);
  };

  return (
    <section className="rk-reference-hub" aria-labelledby={headingId} data-mobile-view={selected ? "detail" : "list"}>
      <header className="rk-reference-hub__heading"><div><h2 id={headingId}>{title}</h2><p>Search concepts, methods, evidence, and advanced notes.</p></div><span aria-live="polite">{filtered.length} {filtered.length === 1 ? "item" : "items"}</span></header>
      {errors.length ? <div className="rk-error" role="alert">Knowledge registry is invalid: {errors.join(" ")}</div> : null}
      <div className="rk-reference-hub__filters">
        <label>Search references<input type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Search titles, tags, or sources" /></label>
        <label>Category<select value={kind} onChange={(event) => setKind(event.currentTarget.value as ReferenceKind | "all")}><option value="all">All categories</option>{KINDS.map((value) => <option key={value} value={value}>{KIND_LABELS[value]}</option>)}</select></label>
      </div>
      <div className="rk-reference-hub__grid">
        <ul ref={listRef} className="rk-reference-hub__list" aria-label="Reference entries" tabIndex={0}>
          {filtered.map((entry) => (
            <li key={entry.id}><button ref={(node) => { if (node) itemRefs.current.set(entry.id, node); else itemRefs.current.delete(entry.id); }} type="button" data-reference-id={entry.id} className={activeId === entry.id ? "is-selected" : ""} onClick={() => selectId(entry.id)} aria-current={activeId === entry.id ? "true" : undefined} aria-controls={detailId}>
              <span><b>{entry.reference.titleEn}</b><small>{entry.reference.summaryEn}</small></span><span className="rk-reference-hub__kind">{KIND_LABELS[entry.kind]}</span>
            </button></li>
          ))}
          {!filtered.length ? <li className="rk-reference-hub__empty" role="status">No references match this search.</li> : null}
        </ul>
        <article ref={detailRef} id={detailId} className="rk-reference-hub__detail" aria-live="polite" aria-labelledby={selected ? selectedTitleId : headingId} tabIndex={0}>
          {selected ? <>
            <button type="button" className="rk-reference-hub__back" onClick={() => selectId(null)}>← Back to reference list</button>
            <span className="rk-reference-hub__kind">{KIND_LABELS[selected.kind]}</span>
            <h3 id={selectedTitleId}>{selected.reference.titleEn}</h3>
            <p className="rk-reference-hub__summary">{selected.reference.summaryEn}</p>
            {selected.reference.bodyEn ? <div className="rk-reference-hub__body">{selected.reference.bodyEn}</div> : null}
            {selected.reference.tags?.length ? <div className="rk-reference-hub__tags" aria-label="Tags">{selected.reference.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
            {selected.reference.sourceRefs?.length ? <section className="rk-reference-hub__sources" aria-label="Sources"><h4>Sources</h4><ul>{selected.reference.sourceRefs.map((source) => <li key={source}>{source}</li>)}</ul></section> : null}
            {selected.reference.relatedIds?.length ? <nav className="rk-reference-hub__related" aria-label="Related references"><h4>Related references</h4><div>{selected.reference.relatedIds.map((relatedId) => {
              const related = entries.find((entry) => entry.id === relatedId);
              return related ? <button type="button" key={relatedId} onClick={() => selectId(relatedId)}>{related.reference.titleEn}</button> : null;
            })}</div></nav> : null}
            {selected.reference.relatedSection && onJumpToSection ? <button type="button" className="rk-reference-hub__section-link" onClick={() => onJumpToSection(selected.reference.relatedSection!, selected)}>Return to the related paper section</button> : null}
          </> : <p role="status">Select a reference to open its details.</p>}
        </article>
      </div>
    </section>
  );
}
