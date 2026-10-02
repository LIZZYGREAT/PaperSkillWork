import { useState } from "react";
import { PageOne } from "./pages/PageOne";
import { PageTwo } from "./pages/PageTwo";
import { PageTen } from "./pages/PageTen";

type PageId = "page-1" | "page-2" | "page-10";

const pages: { id: PageId; number: string; title: string }[] = [
  { id: "page-1", number: "01", title: "The constraint" },
  { id: "page-2", number: "02", title: "Inside the model" },
  { id: "page-10", number: "10", title: "One full update" },
];

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("page-1");

  return (
    <div className="paper-app" id="icarL_runtime" data-canonical-id="icarL_runtime">
      <header className="site-header">
        <a className="wordmark" href="#top" onClick={(event) => { event.preventDefault(); setActivePage("page-1"); }} aria-label="iCaRL tutorial home">
          <span className="wordmark__mark">i</span><span>iCaRL <small>Incremental learning</small></span>
        </a>
        <div className="slice-badge"><span className="live-dot" /> W6 · vertical slice</div>
      </header>

      <nav className="page-nav" aria-label="Implemented tutorial pages">
        {pages.map((page) => (
          <button key={page.id} type="button" className={`page-nav__item ${activePage === page.id ? "is-active" : ""}`} aria-current={activePage === page.id ? "page" : undefined} onClick={() => setActivePage(page.id)}>
            <span className="page-nav__number">{page.number}</span><span>{page.title}</span>
          </button>
        ))}
        <span className="page-nav__note">Pages 1 · 2 · 10</span>
      </nav>

      <main className="tutorial-main" id="top">
        {activePage === "page-1" ? <PageOne /> : null}
        {activePage === "page-2" ? <PageTwo /> : null}
        {activePage === "page-10" ? <PageTen /> : null}
      </main>

      <footer className="site-footer">
        <span>iCaRL · a paper-based teaching model</span>
        <span>W6 slice: S01 · S02 · S08</span>
      </footer>
    </div>
  );
}
