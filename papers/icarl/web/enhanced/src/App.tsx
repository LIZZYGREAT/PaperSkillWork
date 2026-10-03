import { useState } from "react";
import { PageOne } from "./pages/PageOne";
import { PageTwo } from "./pages/PageTwo";
import { PageTen } from "./pages/PageTen";

type PageId = "page-1" | "page-2" | "page-10";

const pages: { id: PageId; number: string; title: string; subtitle: string }[] = [
  { id: "page-1", number: "01", title: "The learning setting", subtitle: "Why classes arrive over time" },
  { id: "page-2", number: "02", title: "Image to representation", subtitle: "Open the model" },
  { id: "page-10", number: "10", title: "One complete update", subtitle: "Runtime walkthrough" },
];

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("page-1");
  const activePageInfo = pages.find((page) => page.id === activePage)!;

  return (
    <div className="paper-app ewc-app" id="icarL_runtime" data-canonical-id="icarL_runtime">
      <a className="ewc-skip-link" href="#top">跳到当前页面</a>
      <aside className="ewc-rail" aria-label="Tutorial navigation">
        <a className="ewc-brand" href="#top" onClick={(event) => { event.preventDefault(); setActivePage("page-1"); }} aria-label="iCaRL tutorial home">
          <span className="ewc-brand__mark">i</span>
          <span><b>iCaRL</b><small>INCREMENTAL LEARNING</small></span>
        </a>
        <p className="ewc-rail__section-label">LEARNING PATH</p>
        <nav className="ewc-slice-nav" aria-label="Tutorial pages">
          {pages.map((page) => (
            <button key={page.id} type="button" className={`ewc-slice-nav__item ${activePage === page.id ? "is-active" : ""}`} aria-current={activePage === page.id ? "page" : undefined} onClick={() => setActivePage(page.id)}>
              <span className="ewc-slice-nav__number">{page.number}</span>
              <span className="ewc-slice-nav__copy"><b>{page.title}</b><small>{page.subtitle}</small></span>
            </button>
          ))}
        </nav>
        <div className="ewc-rail__scope"><span className="ewc-status-dot" /> PAPER WALKTHROUGH<p>Follow one shared learner from arriving classes to a ready runtime state.</p></div>
        <div className="ewc-rail__footer">iCaRL · Incremental Classifier and Representation Learning<small>Paper-based teaching view</small></div>
      </aside>

      <div className="ewc-main-column">
        <header className="ewc-topbar">
          <div className="ewc-topbar__path"><span>ICARL</span><span className="ewc-slash">/</span><strong>{activePageInfo.number} · {activePageInfo.title}</strong></div>
          <span className="ewc-topbar__edition"><i /> W6 · INTERACTIVE EDITION</span>
        </header>
        <main className="tutorial-main ewc-main" id="top">
          {activePage === "page-1" ? <PageOne onOpenPageTwo={() => setActivePage("page-2")} /> : null}
          {activePage === "page-2" ? <PageTwo /> : null}
          {activePage === "page-10" ? <PageTen /> : null}
        </main>
        <footer className="site-footer ewc-footer"><span>iCaRL · a paper-based teaching model</span><span>Pages 01 · 02 · 10</span></footer>
      </div>
    </div>
  );
}
