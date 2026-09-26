import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { EvidenceList } from './components/EvidenceList';
import { PersistentWorkspace } from './components/PersistentWorkspace';
import { ReferenceButton, ReferenceProvider, useReferenceHub } from './components/ReferencePrimitives';
import { TermGlossary } from './components/TermGlossary';
import { TopicTags } from './components/TopicTags';
import { INITIAL_SESSION, type Session } from './data/session';
import { EWC_RESEARCH_TOPICS, PAPER, PAGES } from './data/tutorial';
import { SceneAtari } from './scenes/SceneAtari';
import { SceneFisher } from './scenes/SceneFisher';
import { SceneHandoff } from './scenes/SceneHandoff';
import { SceneLifecycle } from './scenes/SceneLifecycle';
import { SceneMNISTProtocol } from './scenes/SceneMNISTProtocol';
import { SceneMNISTResults } from './scenes/SceneMNISTResults';
import { SceneOverview } from './scenes/SceneOverview';
import { SceneProblem } from './scenes/SceneProblem';
import { SceneSynthesis } from './scenes/SceneSynthesis';
import { SceneUpdate } from './scenes/SceneUpdate';
import type { SceneProps } from './scenes/types';

const pageComponents: Record<string, ComponentType<SceneProps>> = {
  overview: SceneOverview,
  problem: SceneProblem,
  handoff: SceneHandoff,
  fisher: SceneFisher,
  update: SceneUpdate,
  lifecycle: SceneLifecycle,
  mnistProtocol: SceneMNISTProtocol,
  mnistResults: SceneMNISTResults,
  atari: SceneAtari,
  synthesis: SceneSynthesis,
};

export default function App() {
  return <ReferenceProvider><PaperTutorial /></ReferenceProvider>;
}

function PaperTutorial() {
  const { openHub } = useReferenceHub();
  const [activeId, setActiveId] = useState(PAGES[0].id);
  const [session, setSession] = useState<Session>(INITIAL_SESSION);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const activeIndex = Math.max(0, PAGES.findIndex((page) => page.id === activeId));
  const active = PAGES[activeIndex];
  const ActivePage = pageComponents[active.id];

  const goTo = useCallback((pageId: string) => {
    if (!PAGES.some((page) => page.id === pageId)) return;
    setActiveId(pageId);
    setSidebarOpen(false);
  }, []);
  const movePage = useCallback((direction: -1 | 1) => {
    const nextIndex = Math.min(PAGES.length - 1, Math.max(0, activeIndex + direction));
    goTo(PAGES[nextIndex].id);
  }, [activeIndex, goTo]);

  useEffect(() => {
    const onOpenPage = (event: Event) => goTo((event as CustomEvent<string>).detail);
    window.addEventListener('ewc:open-page', onOpenPage);
    return () => window.removeEventListener('ewc:open-page', onOpenPage);
  }, [goTo]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('page-heading')?.focus({ preventScroll: true });
  }, [activeId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('[role="dialog"]')) return;
      if (target.isContentEditable || target.closest('input,textarea,select,button,a,[role="slider"],[role="spinbutton"]')) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); movePage(1); }
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); movePage(-1); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [movePage]);

  const updateSession = (patch: Partial<Session>) => setSession((current) => ({ ...current, ...patch }));

  return (
    <div className={`ewc-app slide-layout ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button type="button" className="slide-sidebar-toggle" aria-expanded={sidebarOpen} aria-controls="paper-sidebar" onClick={() => setSidebarOpen((open) => !open)}>
        <span className="slide-sidebar-toggle-icon" aria-hidden="true">{sidebarOpen ? '×' : '☰'}</span>目录
      </button>
      {sidebarOpen ? <button type="button" className="slide-sidebar-overlay" aria-label="关闭章节目录" onClick={() => setSidebarOpen(false)} /> : null}

      <aside className="slide-sidebar" id="paper-sidebar" aria-label="论文章节目录">
        <div className="slide-sidebar-header">
          <div className="slide-sidebar-venue">PaperSkill · {PAPER.venue}</div>
          <div className="slide-sidebar-title">{PAPER.titleZh}</div>
        </div>
        <nav className="slide-sidebar-nav" aria-label="十页学习路径">
          {PAGES.map((page, index) => <button key={page.id} type="button" className={`slide-sidebar-item ${active.id === page.id ? 'active' : ''}`} aria-current={active.id === page.id ? 'page' : undefined} onClick={() => goTo(page.id)}>
            <span className="slide-sidebar-num">{String(index + 1).padStart(2, '0')}</span><span className="slide-sidebar-text">{page.title}</span>
          </button>)}
        </nav>
        <div className="sidebar-reference"><ReferenceButton><span aria-hidden="true">⌕</span> 打开 Reference Hub</ReferenceButton></div>
      </aside>

      <button type="button" className="slide-sidebar-collapse" aria-label={sidebarCollapsed ? '展开章节目录' : '折叠章节目录'} title={sidebarCollapsed ? '展开目录' : '折叠目录'} onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}>{sidebarCollapsed ? '☰' : '◀'}</button>

      <main className="slide-main">
        <div className="slide-content" key={active.id}>
          <header className="paper-topbar">
            <a className="paper-wordmark" href="https://doi.org/10.1073/pnas.1611835114" target="_blank" rel="noreferrer"><span>E</span> EWC <small>论文交互导读</small></a>
            <div className="paper-top-actions">
              <ReferenceButton>Reference Hub</ReferenceButton>
              <a href={PAPER.arxiv} target="_blank" rel="noreferrer">论文原文 ↗</a>
            </div>
          </header>
          <div className="page-progress" aria-label={`第 ${activeIndex + 1} 页，共 ${PAGES.length} 页`}>
            <span style={{ width: `${((activeIndex + 1) / PAGES.length) * 100}%` }} />
          </div>

          <div className="page-masthead">
            <div><span className="scene-number">第 {active.number} 页 · EWC 学习路径</span><h1 id="page-heading" tabIndex={-1}>{active.title}</h1>{active.id === 'overview' ? <TopicTags tags={EWC_RESEARCH_TOPICS} /> : null}<p>{active.question}</p></div>
            <span className="progress-count">{String(activeIndex + 1).padStart(2, '0')} <i>/</i> {String(PAGES.length).padStart(2, '0')}</span>
          </div>

          <div className="learning-layout">
            <article className="scene-main" aria-labelledby="page-heading">
              <ActivePage session={session} onSessionChange={updateSession} />
              <div className="scene-exit"><span className="exit-check" aria-hidden="true">✓</span><p><b>完成本页后</b>{active.exit}</p></div>
              <EvidenceList ids={active.evidenceIds} />
            </article>
            <aside className="learning-aside" aria-label="学习状态与术语">
              <PersistentWorkspace session={session} currentScene={active.title} onReset={() => setSession(INITIAL_SESSION)} />
              <TermGlossary ids={active.termIds} />
            </aside>
          </div>
          <footer className="site-footer"><p>实验结论按论文协议和证据登记呈现；交互示例数值会明确标为教学玩具。</p><span>{PAPER.authors} · {PAPER.venue}</span></footer>
        </div>
        <nav className="slide-nav" aria-label="页码导航">
          <button type="button" className="slide-nav-btn" onClick={() => movePage(-1)} disabled={activeIndex === 0}>← 上一页</button>
          <span className="slide-nav-counter">{activeIndex + 1} / {PAGES.length}</span>
          <button type="button" className="slide-nav-btn slide-nav-btn-primary" onClick={() => movePage(1)} disabled={activeIndex === PAGES.length - 1}>下一页 →</button>
        </nav>
      </main>
    </div>
  );
}
