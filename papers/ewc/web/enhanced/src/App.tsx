import { ReferenceProvider, useReferenceApi } from "./shared/reference/ReferenceProvider";
import { ReferenceHubDrawer } from "./shared/reference/ReferenceHubDrawer";
import { useReducedMotion } from "./shared/foundation/accessibility/useReducedMotion";
import type { PageId } from "./contracts/ids";
import { PageProblem } from "./pages/PageProblem";
import { PageProbability } from "./pages/PageProbability";

const SLICE_PAGES: { id: PageId; number: string; title: string; eyebrow: string }[] = [
  { id: "page-01-problem", number: "01", title: "顺序训练中的参数变化", eyebrow: "问题起点" },
  { id: "page-02-probability", number: "02", title: "从网络概率到 Loss", eyebrow: "普通训练" },
];

function AppFrame() {
  const api = useReferenceApi();
  const reducedMotion = useReducedMotion();
  const active = SLICE_PAGES.find((page) => page.id === api.currentPage);
  const content = api.currentPage === "page-01-problem" ? <PageProblem />
    : api.currentPage === "page-02-probability" ? <PageProbability />
      : <section className="ewc-slice-placeholder"><div className="ewc-kicker">OUTSIDE THIS REVIEW</div><h1>本轮先审核 Page 1 和 Page 2。</h1><p>Reference Hub 中的其他页面链接仍可用于查阅概念；本次可交互教学内容集中在顺序训练问题，以及普通训练的概率、Likelihood 和 Loss。</p><div className="ewc-contract-preview"><button type="button" className="ewc-button" onClick={() => api.navigatePage("page-01-problem")}>打开 Page 1</button><button type="button" className="ewc-button ewc-button--primary" onClick={() => api.navigatePage("page-02-probability")}>打开 Page 2</button></div></section>;
  return (
    <div className={`ewc-app ${reducedMotion ? "is-reduced-motion" : ""}`}>
      <a className="ewc-skip-link" href="#main-content">跳到当前页面</a>
      <aside className="ewc-rail">
        <div className="ewc-brand"><span className="ewc-brand__mark">E</span><span><b>PaperSkill</b><small>LEARNING SYSTEMS</small></span></div>
        <div className="ewc-rail__section-label">本轮审核页面</div>
        <nav className="ewc-slice-nav" aria-label="W6 Page 1 和 Page 2">
          {SLICE_PAGES.map((page) => (
            <button key={page.id} type="button" className={`ewc-slice-nav__item ${api.currentPage === page.id ? "is-active" : ""}`} aria-current={api.currentPage === page.id ? "page" : undefined} onClick={() => api.navigatePage(page.id)}>
              <span className="ewc-slice-nav__number">{page.number}</span><span className="ewc-slice-nav__copy"><b>{page.title}</b><small>{page.eyebrow}</small></span>
            </button>
          ))}
        </nav>
        <div className="ewc-rail__scope"><span className="ewc-status-dot" />W6 · Page 1–2 review<p>顺序训练问题 → 普通训练的概率与损失。</p></div>
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
