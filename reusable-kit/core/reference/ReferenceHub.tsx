import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReferenceHubLabels, ReferenceItem, ReferenceKind } from "./types";

const KINDS: ReferenceKind[] = ["term", "symbol", "formula", "dataset", "method", "evidence", "implementation", "advanced"];
const DEFAULT_LABELS: ReferenceHubLabels = {
  description: "Search terms, methods, evidence, and implementation notes.",
  search: "Search references",
  searchPlaceholder: "Search",
  category: "Category",
  allCategories: "All categories",
  itemCount: "{count} items",
  noMatches: "No references match this search.",
  selectPrompt: "Select a reference to open its details.",
  jumpToSection: "Jump to related section",
};

export function ReferenceHub({ items, title = "Reference Hub", onOpen, labels }: {
  items: ReferenceItem[];
  title?: string;
  onOpen?: (item: ReferenceItem) => void;
  labels?: Partial<ReferenceHubLabels>;
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<ReferenceKind | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const detailId = useId();
  const selectedTitleId = useId();
  const copy = { ...DEFAULT_LABELS, ...labels };
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return items.filter((item) => (kind === "all" || item.kind === kind) && (!search || [item.title, item.summary, ...(item.tags ?? [])].join(" ").toLocaleLowerCase().includes(search)));
  }, [items, kind, query]);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (detailRef.current) detailRef.current.scrollTop = 0;
  }, [selectedId]);

  useEffect(() => {
    const match = window.location.hash.match(/^#ref-(.+)$/);
    if (!match) return;
    try {
      const id = decodeURIComponent(match[1]);
      if (items.some((item) => item.id === id)) setSelectedId(id);
    } catch {
      setSelectedId(null);
    }
  }, [items]);

  const select = (item: ReferenceItem) => {
    setSelectedId(item.id);
    onOpen?.(item);
    window.history.replaceState(null, "", `#ref-${encodeURIComponent(item.id)}`);
  };

  return (
    <section className="rk-reference-hub" aria-label={title}>
      <header className="rk-reference-hub__heading"><div><h2 id={headingId}>{title}</h2><p>{copy.description}</p></div><span aria-live="polite">{copy.itemCount.replace("{count}", String(filtered.length))}</span></header>
      <div className="rk-reference-hub__filters">
        <label>{copy.search}<input type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder={copy.searchPlaceholder} /></label>
        <label>{copy.category}<select value={kind} onChange={(event) => setKind(event.currentTarget.value as ReferenceKind | "all")}><option value="all">{copy.allCategories}</option>{KINDS.map((value) => <option key={value} value={value}>{copy.categoryNames?.[value] ?? value}</option>)}</select></label>
      </div>
      <div className="rk-reference-hub__grid">
        <ul className="rk-reference-hub__list" aria-label={title + " entries"} tabIndex={0}>
          {filtered.map((item) => (
            <li key={item.id}><button id={"ref-" + item.id} type="button" className={selectedId === item.id ? "is-selected" : ""} onClick={() => select(item)} aria-current={selectedId === item.id ? "true" : undefined} aria-controls={detailId}>
              <span><b>{item.title}</b><small>{item.summary}</small></span><span className="rk-reference-hub__kind">{copy.categoryNames?.[item.kind] ?? item.kind}</span>
            </button></li>
          ))}
          {!filtered.length ? <li className="rk-reference-hub__empty">{copy.noMatches}</li> : null}
        </ul>
        <article ref={detailRef} id={detailId} className="rk-reference-hub__detail" aria-live="polite" aria-labelledby={selected ? selectedTitleId : headingId} tabIndex={0}>
          {selected ? <><span className="rk-reference-hub__kind">{copy.categoryNames?.[selected.kind] ?? selected.kind}</span><h3 id={selectedTitleId}>{selected.title}</h3><p>{selected.summary}</p>{selected.content}<div className="rk-reference-hub__tags">{selected.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>{selected.relatedSection ? <a href={`#${selected.relatedSection}`}>{copy.jumpToSection}</a> : null}</> : <p>{copy.selectPrompt}</p>}
        </article>
      </div>
    </section>
  );
}
