import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { TermRef } from "./TermRef";
import type { ReferenceEntry } from "./types";

const ReferenceContext = createContext<{ open: (id: string) => void; entries: ReferenceEntry[] }>({ open: () => {}, entries: [] });
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const { open, entries } = useContext(ReferenceContext);
  const entry = entries.find((item) => item.id === id);
  if (!entry) return <>{children ?? id}</>;
  return <TermRef entry={entry} onOpenReference={() => open(id)}>{children}</TermRef>;
}
export function ReferenceButton({ term, children = "推导与出处" }: { term?: string; children?: ReactNode }) {
  const { open, entries } = useContext(ReferenceContext);
  return <button type="button" className="text-button rk-reference-button" onClick={() => { const id = term ?? entries[0]?.id; if (id) open(id); }}>{children}<span aria-hidden="true"> ↗</span></button>;
}
export function ReferenceProvider({ children, entries, title = "推导与出处", sourceLink }: { children: ReactNode; entries: ReferenceEntry[]; title?: string; sourceLink?: { href: string; label: string } }) {
  const titleId = useId();
  const entryId = useId();
  const termEntries = Object.fromEntries(entries.map((entry) => [entry.id, entry]));
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<string>(entries[0]?.id ?? "");
  const [history, setHistory] = useState<string[]>([]);
  const opener = useRef<HTMLElement | null>(null);
  const article = useRef<HTMLElement>(null);
  const entry = termEntries[active] ?? entries[0];
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const restore = () => opener.current?.focus({ preventScroll: true });
    element.addEventListener("close", restore);
    return () => element.removeEventListener("close", restore);
  }, []);
  const select = (id: string, remember = true) => {
    if (!termEntries[id] || id === active) return;
    if (remember) setHistory((items) => [...items, active]);
    setActive(id);
  };
  useEffect(() => {
    if (!dialog.current?.open) return;
    dialog.current.scrollTop = 0;
    article.current?.focus({ preventScroll: true });
  }, [active]);
  const open = (id: string) => {
    if (!termEntries[id]) return;
    opener.current = document.activeElement as HTMLElement | null;
    setActive(id); setHistory([]);
    if (!dialog.current?.open) dialog.current?.showModal();
    if (dialog.current) dialog.current.scrollTop = 0;
  };
  return <ReferenceContext.Provider value={{ open, entries }}>{children}<dialog role="dialog" ref={dialog} className="reference-dialog" aria-labelledby={titleId} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}><div className="reference-shell"><header><div><p className="eyebrow">按需阅读 · REFERENCE</p><h2 id={titleId}>{title}</h2></div><button type="button" className="close-button" aria-label="关闭参考资料" onClick={() => dialog.current?.close()}>回到正文 <span aria-hidden="true">×</span></button></header><nav aria-label="参考术语">{Object.values(termEntries).map((item) => <button type="button" key={item.id} data-reference-term={item.id} aria-pressed={active === item.id} onClick={() => select(item.id)}>{item.name}</button>)}</nav>{entry && <article ref={article} tabIndex={-1} data-reference-detail={active} aria-labelledby={entryId}><p className="reference-english">{entry.english}</p><h3 id={entryId}>{entry.name}</h3><p>{entry.definition}</p>{entry.role && <p className="reference-role"><strong>在当前场景中：</strong>{entry.role}</p>}{entry.confusion && <p className="quiet-note"><strong>容易混淆：</strong>{entry.confusion}</p>}{entry.detail}<nav className="related-terms" aria-label="相关术语">{(entry.related ?? []).filter((id) => termEntries[id]).map((id) => <button className="text-button" key={id} onClick={() => select(id)}>{termEntries[id].name} ↗</button>)}</nav>{history.length > 0 && <button className="text-button reference-back" onClick={() => { const previous = history[history.length - 1]; setHistory((items) => items.slice(0, -1)); select(previous, false); }}>← 返回上一条目</button>}{(entry.source || sourceLink) && <section className="source-note"><h3>出处与教学边界</h3><p>{entry.source}</p>{sourceLink && <a href={sourceLink.href} target="_blank" rel="noreferrer">{sourceLink.label}</a>}</section>}</article>}</div></dialog></ReferenceContext.Provider>;
}

export { ReferenceProvider as ReferenceHub };
