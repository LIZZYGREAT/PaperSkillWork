import { useState } from "react";
import { PageOne } from "./pages/PageOne";
import { PageTwo } from "./pages/PageTwo";
import { PageThree } from "./pages/PageThree";
import { PageFour } from "./pages/PageFour";
import { PageFive } from "./pages/PageFive";
import { PageSix } from "./pages/PageSix";
import { PageSeven } from "./pages/PageSeven";
import { PageEight } from "./pages/PageEight";
import { PageNine } from "./pages/PageNine";
import { PageTen } from "./pages/PageTen";

type PageId = "page-1" | "page-2" | "page-3" | "page-4" | "page-5" | "page-6" | "page-7" | "page-8" | "page-9" | "page-10";

const pages: { id: PageId; number: string; title: string; subtitle: string }[] = [
  { id: "page-1", number: "01", title: "类别增量学习", subtitle: "类别随时间逐批加入" },
  { id: "page-2", number: "02", title: "图像与特征表示", subtitle: "打开模型内部路径" },
  { id: "page-3", number: "03", title: "原型分类", subtitle: "类均值与最近距离" },
  { id: "page-4", number: "04", title: "Exemplar 记忆", subtitle: "真实样本与固定预算" },
  { id: "page-5", number: "05", title: "Herding 选择", subtitle: "有序 exemplar 与 prefix" },
  { id: "page-6", number: "06", title: "更新前准备", subtitle: "训练集 D 与 response Q" },
  { id: "page-7", number: "07", title: "蒸馏与损失", subtitle: "旧类 soft 与新类 hard target" },
  { id: "page-8", number: "08", title: "训练 ≠ 预测", subtitle: "共享模型与最近原型" },
  { id: "page-9", number: "09", title: "实验与边界", subtitle: "论文结果、机制对照与限制" },
  { id: "page-10", number: "10", title: "一次完整更新", subtitle: "跟踪运行时状态" },
];

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("page-1");
  const activePageInfo = pages.find((page) => page.id === activePage)!;

  return (
    <div className={`paper-app ewc-app ${activePage === "page-10" ? "ewc-app--runtime" : ""}`} id="icarL_runtime" data-canonical-id="icarL_runtime">
      <a className="ewc-skip-link" href="#top">跳到当前页面</a>
      <aside className="ewc-rail" aria-label="Tutorial navigation">
        <a className="ewc-brand" href="#top" onClick={(event) => { event.preventDefault(); setActivePage("page-1"); }} aria-label="iCaRL tutorial home">
          <span className="ewc-brand__mark">i</span>
          <span><b>iCaRL</b><small>INCREMENTAL LEARNING</small></span>
        </a>
        <p className="ewc-rail__section-label">学习路径</p>
        <nav className="ewc-slice-nav" aria-label="Tutorial pages">
          {pages.map((page) => (
            <button key={page.id} type="button" className={`ewc-slice-nav__item ${activePage === page.id ? "is-active" : ""}`} aria-current={activePage === page.id ? "page" : undefined} onClick={() => setActivePage(page.id)}>
              <span className="ewc-slice-nav__number">{page.number}</span>
              <span className="ewc-slice-nav__copy"><b>{page.title}</b><small>{page.subtitle}</small></span>
            </button>
          ))}
        </nav>
        <div className="ewc-rail__scope"><span className="ewc-status-dot" /> 论文导读<p>沿着新类别到达、模型更新和下一轮就绪状态，观察同一个学习器。</p></div>
        <div className="ewc-rail__footer">iCaRL · 增量分类与表示学习<small>交互式论文教学页面</small></div>
      </aside>

      <div className="ewc-main-column">
        <header className="ewc-topbar">
          <div className="ewc-topbar__path"><span>ICARL</span><span className="ewc-slash">/</span><strong>{activePageInfo.number} · {activePageInfo.title}</strong></div>
          <span className="ewc-topbar__edition"><i /> W8 · 交互式教程</span>
        </header>
        <main className="tutorial-main ewc-main" id="top">
          {activePage === "page-1" ? <PageOne onOpenPageTwo={() => setActivePage("page-2")} /> : null}
          {activePage === "page-2" ? <PageTwo onOpenPageThree={() => setActivePage("page-3")} /> : null}
          {activePage === "page-3" ? <PageThree onContinue={() => setActivePage("page-4")} /> : null}
          {activePage === "page-4" ? <PageFour onContinue={() => setActivePage("page-5")} /> : null}
          {activePage === "page-5" ? <PageFive onContinue={() => setActivePage("page-6")} /> : null}
          {activePage === "page-6" ? <PageSix onContinue={() => setActivePage("page-7")} /> : null}
          {activePage === "page-7" ? <PageSeven onContinue={() => setActivePage("page-8")} /> : null}
          {activePage === "page-8" ? <PageEight onContinue={() => setActivePage("page-9")} /> : null}
          {activePage === "page-9" ? <PageNine onContinue={() => setActivePage("page-10")} /> : null}
          {activePage === "page-10" ? <PageTen onExit={() => setActivePage("page-9")} /> : null}
        </main>
        <footer className="site-footer ewc-footer"><span>iCaRL · 论文教学页面</span><span>第 01 · 02 · 03 · 04 · 05 · 06 · 07 · 08 · 09 · 10 页</span></footer>
      </div>
    </div>
  );
}
