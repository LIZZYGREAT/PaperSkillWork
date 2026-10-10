import { useEffect, useMemo, useRef, useState } from "react";
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
  const selected = filtered.find((item) => item.id === api.hubReferenceId) ?? filtered[0];
  const detailRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (api.hubOpen && selected && selected.id !== api.hubReferenceId) api.openHub(selected.id);
  }, [api.hubOpen, api.hubReferenceId, selected, api.openHub]);
  useEffect(() => { if (detailRef.current) detailRef.current.scrollTop = 0; }, [selected?.id, api.hubOpen]);
  useEffect(() => { if (!api.hubOpen) setQuery(""); }, [api.hubOpen]);

  useEffect(() => {
    if (!api.hubOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [api.hubOpen]);

  const sourceList = (refs?: string[]) => refs?.length ? refs.join(", ") : "教程解释";
  const kindLabels: Record<string, string> = { term:"术语", symbol:"符号", formula:"公式", dataset:"数据集", environment:"环境", method:"方法", phase:"阶段", evidence:"证据", confusion:"易混概念", implementation:"实现", advanced:"进阶" };
  const sourceLabels: Record<string, string> = { PAPER_FACT:"论文事实", PAPER_RESULT:"论文结果", AUTHOR_INTERPRETATION:"作者解释", GENERAL_BACKGROUND:"通用背景", MECHANISM_INTERPRETATION:"机制解释", IMPLEMENTATION_MAPPING:"实现对应", TEACHING_EXAMPLE:"教学示例", LIMITATION:"局限" };

  return (
    <div className="ewc-reference-hub-shell"><MobileSheet open={api.hubOpen} title="参考资料 · Reference Hub" onClose={api.closeHub}>
      <div className="ewc-hub">
        <div className="ewc-hub__intro">
          <p>回顾术语、数学由来及其在 EWC 中的作用。两侧分别滚动，选择条目后右侧从顶部显示。</p>
          <label className="ewc-hub__search">搜索参考资料
            <input autoFocus type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="例如：Fisher、后验、参数锚点" />
          </label>
        </div>
        <div className="ewc-hub__columns">
          <div className="ewc-hub__list" aria-label="知识条目">
            <p className="ewc-hub__count">{filtered.length} 个切片条目</p>
            {filtered.map((item) => (
              <button key={item.id} type="button" className={`ewc-hub__item ${selected?.id === item.id ? "is-selected" : ""}`} onClick={() => api.openHub(item.id)} aria-pressed={selected?.id === item.id}>
                <span className="ewc-hub__item-title">{item.title}</span>
                <span className="ewc-hub__item-kind">{kindLabels[item.kind]}</span>
                <span className="ewc-hub__item-summary">{item.summary}</span>
              </button>
            ))}
            {!filtered.length ? <p className="ewc-hub__empty">没有匹配项，请调整搜索词。</p> : null}
          </div>
          <article ref={detailRef} className="ewc-hub__detail" aria-live="polite" tabIndex={0} aria-label="当前条目详情">
            {selected ? <>
              <span className="ewc-hub__detail-kind">{kindLabels[selected.kind]} · {sourceLabels[selected.sourceCategory ?? ""] ?? "教学参考"}</span>
              <h3>{selected.title}</h3>
              {"symbol" in selected ? <div className="ewc-hub__math">{selected.symbol}</div> : null}
              {"expression" in selected ? <div className="ewc-hub__math">{selected.expression}</div> : null}
              <p>{selected.summary}</p>
              <section><h4>在 EWC 中的作用</h4><p>{selected.roleInEWC ?? selected.role}</p></section>
              {selected.details?.length ? <section><h4>由来、机制与例子</h4><dl className="ewc-hub__details">{selected.details.map((detail) => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.text}{detail.sourceRefs?.length ? <small>（{sourceList(detail.sourceRefs)}）</small> : null}</dd></div>)}</dl></section> : null}
              {"experiment" in selected ? <section><h4>实验条件</h4><p>{selected.experiment}</p><p>{selected.interpretation}</p></section> : null}
              {selected.confusion ? <section className="ewc-hub__note"><h4>易混点</h4><p>{selected.confusion}</p></section> : null}
              {selected.boundary ? <section className="ewc-hub__note"><h4>适用边界</h4><p>{selected.boundary}</p></section> : null}
              <section><h4>来源与证据</h4><p>{sourceLabels[selected.sourceCategory ?? ""] ?? "教学参考"} · {sourceList(selected.sourceRefs)}</p>{"sourceLocator" in selected ? <p>{selected.sourceLocator}</p> : null}</section>
              {selected.relatedPages?.length ? <section><h4>相关页面</h4><div className="ewc-hub__links">{selected.relatedPages.map((target) => <button key={`${target.pageId}-${target.anchorId ?? "top"}`} type="button" onClick={() => api.openReference({ pageId: target.pageId, anchorId: target.anchorId })}>第 {Number(target.pageId.split("-")[1])} 页 →</button>)}</div></section> : null}
              {selected.relatedIds?.length ? <section><h4>相关条目</h4><div className="ewc-hub__links">{selected.relatedIds.filter(id => referenceRegistry[id]).map((id) => <button key={id} type="button" onClick={() => { setQuery(""); api.openHub(id); }}>{referenceRegistry[id]?.title}</button>)}</div></section> : null}
            </> : <p>选择一个条目查看详情。</p>}
          </article>
        </div>
        <p className="ewc-hub__scope">条目区分论文事实、通用背景、教学例子和实现对应；关键概念的推理仍在正文中。</p>
      </div>
    </MobileSheet></div>
  );
}
