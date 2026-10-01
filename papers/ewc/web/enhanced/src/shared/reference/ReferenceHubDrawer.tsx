import { useEffect, useMemo, useState } from "react";
import { MobileSheet } from "../foundation/overlay/MobileSheet";
import { referenceRegistry } from "../../data/referenceRegistry";
import type { AnyReference } from "./types";
import { useReferenceApi } from "./ReferenceProvider";

function searchableText(item: AnyReference): string {
  return [item.id, item.title, item.fullName, item.summary, item.role, item.roleInEWC, item.confusion,
    item.boundary, item.sourceCategory, ...(item.keywords ?? []), ...(item.tags ?? []), ...(item.sourceRefs ?? [])]
    .filter(Boolean).join(" ").toLocaleLowerCase();
}

export function ReferenceHubDrawer() {
  const api = useReferenceApi();
  const [query, setQuery] = useState("");
  const entries = useMemo(() => Object.values(referenceRegistry).filter((item): item is AnyReference => Boolean(item)), []);
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return search ? entries.filter((item) => searchableText(item).includes(search)) : entries;
  }, [entries, query]);
  const selected = entries.find((item) => item.id === api.hubReferenceId) ?? filtered[0];

  useEffect(() => {
    if (!api.hubOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [api.hubOpen]);

  const sourceList = (refs?: string[]) => refs?.length ? refs.join(", ") : "Tutorial explanation";

  return (
    <MobileSheet open={api.hubOpen} title="Reference Hub" onClose={api.closeHub}>
      <div className="ewc-hub">
        <div className="ewc-hub__intro">
          <p>Use this panel to recall terms, symbols, and their roles in EWC; the main text remains the first place each idea is introduced.</p>
          <label className="ewc-hub__search">Search references
            <input autoFocus type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="e.g. Fisher, Task-A anchor, parameter updates" />
          </label>
        </div>
        <div className="ewc-hub__columns">
          <div className="ewc-hub__list" aria-label="知识条目">
            <p className="ewc-hub__count">{filtered.length} 个切片条目</p>
            {filtered.map((item) => (
              <button key={item.id} type="button" className={`ewc-hub__item ${selected?.id === item.id ? "is-selected" : ""}`} onClick={() => api.openHub(item.id)} aria-pressed={selected?.id === item.id}>
                <span className="ewc-hub__item-title">{item.title}</span>
                <span className="ewc-hub__item-kind">{item.kind}</span>
                <span className="ewc-hub__item-summary">{item.summary}</span>
              </button>
            ))}
            {!filtered.length ? <p className="ewc-hub__empty">没有匹配项。W6 仅包含切片需要的参考内容。</p> : null}
          </div>
          <article className="ewc-hub__detail" aria-live="polite">
            {selected ? <>
              <span className="ewc-hub__detail-kind">{selected.kind} · {selected.sourceCategory ?? "teaching reference"}</span>
              <h3>{selected.title}</h3>
              {"symbol" in selected ? <div className="ewc-hub__math">{selected.symbol}</div> : null}
              {"expression" in selected ? <div className="ewc-hub__math">{selected.expression}</div> : null}
              <p>{selected.summary}</p>
              {"definition" in selected ? <section><h4>Definition</h4><p>{selected.definition}</p></section> : null}
              <section><h4>Role in EWC</h4><p>{selected.roleInEWC ?? selected.role}</p></section>
              {"meaning" in selected ? <section><h4>Meaning</h4><p>{selected.meaning}</p></section> : null}
              {selected.details?.length ? <section><h4>Evaluation settings</h4><dl className="ewc-hub__details">{selected.details.map((detail) => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.text}</dd></div>)}</dl></section> : null}
              {selected.confusion ? <section className="ewc-hub__note"><h4>Common confusion</h4><p>{selected.confusion}</p></section> : null}
              {selected.boundary ? <section className="ewc-hub__note"><h4>Scope</h4><p>{selected.boundary}</p></section> : null}
              <section><h4>Source and evidence</h4><p>{selected.sourceCategory ?? "Tutorial reference"} · {sourceList(selected.sourceRefs)}</p></section>
              {selected.relatedPages?.length ? <section><h4>Related pages</h4><div className="ewc-hub__links">{selected.relatedPages.map((target) => <button key={`${target.pageId}-${target.anchorId ?? "top"}`} type="button" onClick={() => api.openReference({ pageId: target.pageId, anchorId: target.anchorId })}>{target.pageId.replace("page-", "Page ")} →</button>)}</div></section> : null}
              {selected.relatedIds?.length ? <section><h4>Related entries</h4><div className="ewc-hub__links">{selected.relatedIds.map((id) => <button key={id} type="button" onClick={() => api.openHub(id)}>{referenceRegistry[id]?.title ?? id}</button>)}</div></section> : null}
            </> : <p>选择一个条目查看详情。</p>}
          </article>
        </div>
        <p className="ewc-hub__scope">Reference index for the completed tutorial: entries distinguish paper claims, background, teaching examples, and implementation mappings, with links back to the relevant pages.</p>
      </div>
    </MobileSheet>
  );
}
