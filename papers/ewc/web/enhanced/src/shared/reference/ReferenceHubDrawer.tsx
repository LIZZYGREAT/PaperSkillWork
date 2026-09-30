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
          <p>按需回忆术语、符号及其在 EWC 中的作用。正文主线仍负责首次讲解。</p>
          <label className="ewc-hub__search">搜索知识条目
            <input autoFocus type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="例如：Fisher、旧任务位置、不更新参数" />
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
              <section><h4>在 EWC 中的作用</h4><p>{selected.roleInEWC ?? selected.role}</p></section>
              {"meaning" in selected ? <section><h4>含义</h4><p>{selected.meaning}</p></section> : null}
              {selected.confusion ? <section className="ewc-hub__note"><h4>容易混淆</h4><p>{selected.confusion}</p></section> : null}
              {selected.boundary ? <section className="ewc-hub__note"><h4>边界</h4><p>{selected.boundary}</p></section> : null}
              <section><h4>来源类别与证据</h4><p>{selected.sourceCategory ?? "Tutorial reference"} · {sourceList(selected.sourceRefs)}</p></section>
              {selected.relatedPages?.length ? <section><h4>相关页面</h4><div className="ewc-hub__links">{selected.relatedPages.map((target) => <button key={`${target.pageId}-${target.anchorId ?? "top"}`} type="button" onClick={() => api.openReference({ pageId: target.pageId, anchorId: target.anchorId })}>{target.pageId.replace("page-", "Page ")} →</button>)}</div></section> : null}
              {selected.relatedIds?.length ? <section><h4>相关条目</h4><div className="ewc-hub__links">{selected.relatedIds.map((id) => <button key={id} type="button" onClick={() => api.openHub(id)}>{referenceRegistry[id]?.title ?? id}</button>)}</div></section> : null}
            </> : <p>选择一个条目查看详情。</p>}
          </article>
        </div>
        <p className="ewc-hub__scope">此面板是 W6 的 Reference shell；完整索引与全站交叉引用留待后续页面稳定后补齐。</p>
      </div>
    </MobileSheet>
  );
}
