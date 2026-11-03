import { useState } from "react";
import { ReferenceProvider } from "./shared/core/reference/ReferenceHub";
import { lazy, Suspense } from "react";
import { tutorial } from "./data/tutorial";
import { widgetRegistry } from "./modules/registry";

const StylePreview = import.meta.env.DEV ? lazy(() => import("./StylePreview")) : null;

export default function App() {
  if (StylePreview && new URLSearchParams(location.search).has("style-preview")) {
    return <Suspense fallback={<p>正在加载样式预览…</p>}><StylePreview /></Suspense>;
  }
  return <ReferenceProvider entries={[]}><Tutorial /></ReferenceProvider>;
}

function Tutorial() {
  const [activeChapterId, setActiveChapterId] = useState(tutorial.chapters[0]?.id ?? "");
  const activeChapter = tutorial.chapters.find((chapter) => chapter.id === activeChapterId);

  if (tutorial.chapters.length === 0) {
    return (
      <main className="rk-reading">
        <section className="empty-state" aria-labelledby="empty-state-title">
          <p className="eyebrow">Paper Tutorial</p>
          <h1 id="empty-state-title">论文教程项目已初始化</h1>
          <p>完成论文阅读与教学设计后，从首个真实学习切片开始添加章节和交互解释。</p>
        </section>
      </main>
    );
  }

  return (
    <main className="rk-reading">
      <nav className="chapter-nav" aria-label="教程章节">
        {tutorial.chapters.map((chapter) => (
          <button
            key={chapter.id}
            type="button"
            aria-pressed={chapter.id === activeChapterId}
            onClick={() => setActiveChapterId(chapter.id)}
          >
            {chapter.title}
          </button>
        ))}
      </nav>

      {activeChapter && (
        <article className="chapter-content">
          <p className="eyebrow">{activeChapter.id}</p>
          <h1>{activeChapter.title}</h1>
          {(activeChapter.summary || activeChapter.bridge) && (
            <p>{activeChapter.summary || activeChapter.bridge}</p>
          )}
          <div className="module-list">
            {activeChapter.modules.map((module) => {
              const Widget = module.componentId ? widgetRegistry[module.componentId] : undefined;
              return (
                <section className="rk-section" key={module.id}>
                  <h2>{module.title}</h2>
                  {(module.desc || module.summary) && <p>{module.desc || module.summary}</p>}
                  {Widget && <Widget chapterId={activeChapter.id} moduleId={module.id} />}
                </section>
              );
            })}
          </div>
        </article>
      )}
    </main>
  );
}
