import { useState } from "react";
import { ReferenceButton, ReferenceProvider } from "./shared/core/reference/ReferenceHub";
import { lazy, Suspense } from "react";
import { tutorial } from "./data/tutorial";
import { widgetRegistry } from "./modules/registry";
import EditorialFlourish from "./shared/foundation/editorial/EditorialFlourish";

const StylePreview = import.meta.env.DEV ? lazy(() => import("./StylePreview")) : null;

export default function App() {
  if (StylePreview && new URLSearchParams(location.search).has("style-preview")) {
    return <Suspense fallback={<p>正在加载样式预览…</p>}><StylePreview /></Suspense>;
  }
  return <ReferenceProvider entries={tutorial.references ?? []}><Tutorial /></ReferenceProvider>;
}

function Tutorial() {
  const [activeChapterId, setActiveChapterId] = useState(tutorial.chapters[0]?.id ?? "");
  const activeChapter = tutorial.chapters.find((chapter) => chapter.id === activeChapterId);
  const title = tutorial.meta?.titleZh || tutorial.meta?.titleEn || "论文学习笔记";
  const subtitle = tutorial.meta?.titleEn && tutorial.meta?.titleZh ? tutorial.meta.titleEn : "PAPER TUTORIAL";
  const highlight = activeChapter?.titleHighlight;
  const highlightStart = activeChapter && highlight ? activeChapter.title.indexOf(highlight) : -1;

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <a href="#tutorial-opening" className="site-brand" aria-label={`${title} 开头`}>
            <span className="brand-mark" aria-hidden="true">PAPER</span>
            <span>{title}<small>{subtitle}</small></span>
          </a>
          {tutorial.chapters.length > 0 && (
            <nav aria-label="教程章节">
              {tutorial.chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  type="button"
                  aria-pressed={chapter.id === activeChapterId}
                  onClick={() => setActiveChapterId(chapter.id)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>{chapter.title}
                </button>
              ))}
            </nav>
          )}
          {(tutorial.references?.length ?? 0) > 0 && <ReferenceButton>参考资料</ReferenceButton>}
        </div>
      </header>
      <main className="rk-reading rk-editorial-preview">
        <div className="rk-editorial-meta">
          <span>{subtitle}</span>
          <span>{activeChapter?.title || "从问题到证据"}</span>
        </div>
        {activeChapter ? (
          <article className="chapter-content" aria-labelledby="tutorial-title">
            <section className="rk-editorial-opening" id="tutorial-opening">
              <h1 className="rk-headline rk-headline--paper" id="tutorial-title">
                {highlightStart >= 0 && highlight ? <>
                  {activeChapter.title.slice(0, highlightStart)}
                  <mark className="rk-highlight">{highlight}</mark>
                  {activeChapter.title.slice(highlightStart + highlight.length)}
                </> : activeChapter.title}
              </h1>
              {(activeChapter.summary || activeChapter.bridge) && (
                <p className="rk-lead">{activeChapter.summary || activeChapter.bridge}</p>
              )}
              <EditorialFlourish />
            </section>
            <div className="module-list">
              {activeChapter.modules.map((module) => {
                const Widget = module.componentId ? widgetRegistry[module.componentId] : undefined;
                return (
                  <section className="rk-section teaching-module" key={module.id} aria-labelledby={`module-${module.id}`}>
                    <h2 id={`module-${module.id}`}>{module.title}</h2>
                    {(module.desc || module.summary) && <p>{module.desc || module.summary}</p>}
                    {Widget && <Widget chapterId={activeChapter.id} moduleId={module.id} />}
                  </section>
                );
              })}
            </div>
          </article>
        ) : (
          <section className="empty-state rk-editorial-opening" id="tutorial-opening" aria-labelledby="empty-state-title">
            <h1 className="rk-headline rk-headline--paper" id="empty-state-title">论文教程项目已初始化</h1>
            <p className="rk-lead">完成论文阅读与教学设计后，从首个真实学习切片开始添加章节和交互解释。</p>
            <EditorialFlourish />
          </section>
        )}
      </main>
    </>
  );
}
