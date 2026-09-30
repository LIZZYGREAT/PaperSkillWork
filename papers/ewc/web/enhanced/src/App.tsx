import { ReferenceProvider, useReferenceApi } from "./shared/reference/ReferenceProvider";
import { ReferenceHubDrawer } from "./shared/reference/ReferenceHubDrawer";
import { useReducedMotion } from "./shared/foundation/accessibility/useReducedMotion";
import type { PageId } from "./contracts/ids";
import { PageProblem } from "./pages/PageProblem";
import { PageFisher } from "./pages/PageFisher";
import { PageObjective } from "./pages/PageObjective";

const SLICE_PAGES: { id: PageId; number: string; title: string; eyebrow: string }[] = [
  { id: "page-01-problem", number: "01", title: "为什么需要 EWC", eyebrow: "问题" },
  { id: "page-05-fisher", number: "05", title: "从概率到 Fisher", eyebrow: "估计" },
  { id: "page-06-ewc-objective", number: "06", title: "从 Fisher 到更新", eyebrow: "目标与梯度" },
];

function AppFrame() {
  const api = useReferenceApi();
  const reducedMotion = useReducedMotion();
  const active = SLICE_PAGES.find((page) => page.id === api.currentPage);
  const content = api.currentPage === "page-01-problem" ? <PageProblem />
    : api.currentPage === "page-05-fisher" ? <PageFisher />
      : api.currentPage === "page-06-ewc-objective" ? <PageObjective />
        : <section className="ewc-slice-placeholder"><div className="ewc-kicker">OUTSIDE THIS W6 SLICE</div><h1>此页面将在 W7 人工核验后继续实现。</h1><p>当前仍停在代表性切片：Page 1 问题、Page 5 Fisher 估计、Page 6 目标与梯度。回到任一已实现页面继续查看。</p><button type="button" className="ewc-button ewc-button--primary" onClick={() => api.navigatePage("page-01-problem")}>回到切片开头 →</button></section>;
  return (
    <div className={`ewc-app ${reducedMotion ? "is-reduced-motion" : ""}`}>
      <a className="ewc-skip-link" href="#main-content">跳到当前页面</a>
      <aside className="ewc-rail">
        <div className="ewc-brand"><span className="ewc-brand__mark">E</span><span><b>PaperSkill</b><small>LEARNING SYSTEMS</small></span></div>
        <div className="ewc-rail__section-label">当前评审切片</div>
        <nav className="ewc-slice-nav" aria-label="W6 代表性页面">
          {SLICE_PAGES.map((page) => (
            <button key={page.id} type="button" className={`ewc-slice-nav__item ${api.currentPage === page.id ? "is-active" : ""}`} aria-current={api.currentPage === page.id ? "page" : undefined} onClick={() => api.navigatePage(page.id)}>
              <span className="ewc-slice-nav__number">{page.number}</span><span className="ewc-slice-nav__copy"><b>{page.title}</b><small>{page.eyebrow}</small></span>
            </button>
          ))}
        </nav>
        <div className="ewc-rail__scope"><span className="ewc-status-dot" />W6 · First vertical slice<p>展示三个代表性页面；完整页面顺序仍以已批准的学习主线为准。</p></div>
        <div className="ewc-rail__footer"><span>Overcoming catastrophic forgetting</span><small>Kirkpatrick et al. · PNAS 2017</small></div>
      </aside>

      <div className="ewc-main-column">
        <header className="ewc-topbar">
          <div className="ewc-topbar__path"><span>CONTINUAL LEARNING</span><span className="ewc-slash">/</span><strong>{active?.eyebrow ?? "W6 Preview"}</strong></div>
          <button type="button" className="ewc-hub-launch" onClick={() => api.openHub()}><span className="ewc-hub-launch__icon">⌕</span><span>Reference Hub</span><kbd>R</kbd></button>
        </header>

        <main id="main-content" className="ewc-main" tabIndex={-1}>{content}</main>
      </div>
      <ReferenceHubDrawer />
    </div>
  );
}

export default function App() {
  return <ReferenceProvider><AppFrame /></ReferenceProvider>;
}
