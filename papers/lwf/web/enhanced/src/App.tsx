import React, { useEffect, useReducer, useRef, useState } from 'react';
import { ReferenceProvider, useReferenceHub } from './components/ReferencePrimitives';
import { ObjectInspector } from './components/ObjectInspector';
import { PersistentWorkspace } from './components/PersistentWorkspace';
import { SceneA } from './scenes/SceneA';
import { SceneB } from './scenes/SceneB';
import { SceneC } from './scenes/SceneC';
import { Scene00 } from './scenes/Scene00';
import {
  initialLearningSession,
  learningReducer,
  type SceneId,
} from './data/session';
import { initialToyState, teachingToyReducer } from './simulation/lwfTeachingToy';

const scenes: { id: SceneId; number: string; title: string; question: string }[] = [
  { id: '00', number: '00', title: '论文背景与研究目标', question: '为什么需要在学习新任务时保留旧任务能力？' },
  { id: 'A', number: '01', title: '问题空间与方法约束', question: '旧数据不可用时，哪些路线仍符合问题设定？' },
  { id: 'B', number: '02', title: '构造 LwF 系统', question: 'Teacher、Student、参数与旧响应如何形成？' },
  { id: 'C', number: '03', title: '执行一个训练步', question: '梯度何时产生，参数又在何时改变？' },
];

function AppContent() {
  const [session, dispatch] = useReducer(learningReducer, initialLearningSession);
  const [toyState, dispatchToy] = useReducer(teachingToyReducer, initialToyState);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasNavigated = useRef(false);
  const previousStudentState = useRef({ created: session.studentCreated, boundary: session.boundary });
  const { openHub } = useReferenceHub();
  const currentIndex = scenes.findIndex((scene) => scene.id === session.activeScene);
  const activeScene = scenes[currentIndex];
  const pageTotal = String(scenes.length).padStart(2, '0');

  const navigate = (scene: SceneId) => {
    dispatch({ type: 'NAVIGATE', scene });
    setSidebarOpen(false);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (hasNavigated.current) requestAnimationFrame(() => headingRef.current?.focus());
    hasNavigated.current = true;
  }, [session.activeScene]);

  useEffect(() => {
    const previous = previousStudentState.current;
    if (session.studentCreated && (!previous.created || previous.boundary !== session.boundary)) {
      dispatchToy({ type: 'RESET_TOY' });
    }
    previousStudentState.current = { created: session.studentCreated, boundary: session.boundary };
  }, [session.studentCreated, session.boundary]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, input, select, textarea, [contenteditable="true"], [role="dialog"]')) return;
      const nextIndex = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= scenes.length) return;
      event.preventDefault();
      navigate(scenes[nextIndex].id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentIndex]);

  const go = (offset: number) => {
    const nextScene = scenes[currentIndex + offset];
    if (nextScene) navigate(nextScene.id);
  };

  return (
    <div className={`lwf-v2 slide-layout ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button
        className="slide-sidebar-toggle"
        type="button"
        aria-expanded={sidebarOpen}
        aria-controls="scene-sidebar"
        onClick={() => setSidebarOpen((value) => !value)}
      >
        <span className="slide-sidebar-toggle-icon" aria-hidden="true">{sidebarOpen ? '×' : '☰'}</span>
        {sidebarOpen ? '关闭目录' : '章节目录'}
      </button>

      {sidebarOpen ? <button className="slide-sidebar-overlay" type="button" aria-label="关闭章节目录" onClick={() => setSidebarOpen(false)} /> : null}

      <aside id="scene-sidebar" className="slide-sidebar" aria-label="LwF 场景目录">
        <div className="slide-sidebar-header">
          <div className="slide-sidebar-venue">ECCV 2016 · WORKSPACE</div>
          <div className="slide-sidebar-title">Learning without Forgetting</div>
          <p className="v2-sidebar-subtitle">机制学习工作台 · 00–03</p>
        </div>
        <nav className="slide-sidebar-nav" aria-label="章节">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              type="button"
              className={`slide-sidebar-item ${session.activeScene === scene.id ? 'active' : ''}`}
              aria-current={session.activeScene === scene.id ? 'page' : undefined}
              onClick={() => navigate(scene.id)}
            >
              <span className="slide-sidebar-num">{scene.number}</span>
              <span className="slide-sidebar-text">{scene.title}</span>
            </button>
          ))}
        </nav>
        <div className="v2-sidebar-tools">
          <button type="button" className="v2-sidebar-reference" onClick={() => openHub()}>
            <span aria-hidden="true">⌕</span><span>Reference Hub</span><span className="v2-sidebar-tool-hint">术语 · 符号 · 证据</span>
          </button>
        </div>
        <div className="v2-sidebar-footnote">场景进度由当前选择决定，不代表学习门禁已通过。</div>
      </aside>

      <button
        className="slide-sidebar-collapse"
        type="button"
        aria-label={sidebarCollapsed ? '展开章节目录' : '折叠章节目录'}
        aria-expanded={!sidebarCollapsed}
        onClick={() => setSidebarCollapsed((value) => !value)}
      >
        {sidebarCollapsed ? '☰' : '◀'}
      </button>

      <main className="slide-main">
        <header className="v2-topbar">
          <a className="v2-brand" href="#scene-title" onClick={(event) => { event.preventDefault(); navigate('00'); }} aria-label="返回 LwF 场景 00">
            <span className="v2-brand-mark">L</span><span>PaperSkillWork <b>/ Enhanced</b></span>
          </a>
          <div className="v2-topbar-actions">
            <span className="v2-workflow-status"><i aria-hidden="true" /> Scene {activeScene.number} / {pageTotal}</span>
            <button className="v2-reference-button" type="button" onClick={() => openHub()}><span>Reference Hub</span><span aria-hidden="true">↗</span></button>
          </div>
        </header>

        <div className="slide-content" key={session.activeScene}>
          <header className="v2-page-heading">
            <div className="v2-breadcrumb"><span>LwF</span><span aria-hidden="true">/</span><span>机制工作台</span><span aria-hidden="true">/</span><strong>Scene {activeScene.id}</strong></div>
            <div className="v2-scene-title-row">
              <div>
                <p className="v2-eyebrow">SCENE {activeScene.number} · {session.activeScene === '00' ? 'PAPER BACKGROUND' : session.activeScene === 'A' ? 'PROBLEM SPACE' : session.activeScene === 'B' ? 'SYSTEM CONSTRUCTION' : 'TRAINING TRACE'}</p>
                <h1 id="scene-title" ref={headingRef} tabIndex={-1}>{activeScene.title}</h1>
                <p className="v2-page-question">{activeScene.question}</p>
              </div>
              <div className="v2-progress-summary" aria-label={`第 ${currentIndex + 1} 页，共 ${scenes.length} 页`}>
                <strong>{activeScene.number}<span> / {pageTotal}</span></strong>
                <div className="v2-progress-track" aria-hidden="true">{scenes.map((scene, index) => <i key={scene.id} className={index <= currentIndex ? 'is-complete' : ''} />)}</div>
                <small>可自由切换场景</small>
              </div>
            </div>
          </header>

          <div className="v2-scene-layout">
            <section className="v2-scene-primary" aria-label={`Scene ${session.activeScene} 交互内容`}>
              {session.activeScene === '00' ? <Scene00 onNext={() => navigate('A')} /> : null}
              {session.activeScene === 'A' ? <SceneA session={session} dispatch={dispatch} onNext={() => navigate('B')} /> : null}
              {session.activeScene === 'B' ? <SceneB session={session} dispatch={dispatch} onNext={() => navigate('C')} onPrevious={() => navigate('A')} /> : null}
              {session.activeScene === 'C' ? <SceneC session={session} dispatch={dispatch} toyState={toyState} dispatchToy={dispatchToy} onPrevious={() => navigate('B')} onReset={() => { dispatchToy({ type: 'RESET_TOY' }); dispatch({ type: 'SET_TRAINING_STAGE', stage: 'idle' }); }} /> : null}
            </section>
            <aside className="v2-scene-support" aria-label="持续工作区与对象检查器">
              <PersistentWorkspace scene={session.activeScene} session={session} dispatch={dispatch} />
              <ObjectInspector scene={session.activeScene} session={session} selectedObject={session.selectedObject} onInspect={(id) => dispatch({ type: 'INSPECT_OBJECT', id })} />
            </aside>
          </div>
        </div>

        <nav className="slide-nav" aria-label="场景翻页">
          <button className="slide-nav-btn" type="button" onClick={() => go(-1)} disabled={currentIndex === 0}>← 上一页</button>
          <span className="slide-nav-counter">{activeScene.number} / {pageTotal}</span>
          <button className="slide-nav-btn slide-nav-btn-primary" type="button" onClick={() => go(1)} disabled={currentIndex === scenes.length - 1}>下一页 →</button>
        </nav>
      </main>
    </div>
  );
}

function ScenePlaceholder({ scene, onNext, onPrevious }: { scene: 'B' | 'C'; onNext?: () => void; onPrevious: () => void }) {
  const title = scene === 'B' ? '构造 LwF 系统' : '执行一个训练步';
  return (
    <section className="v2-scene-panel v2-placeholder-scene">
      <span className="v2-scene-label">SCENE {scene}</span>
      <h2>{title}</h2>
      <p>本场景正在按交互重构指南实现。场景侧栏与上一页 / 下一页导航已经接通。</p>
      <div className="v2-placeholder-actions">
        <button type="button" className="v2-secondary-action" onClick={onPrevious}>返回上一场景</button>
        {onNext ? <button type="button" className="v2-primary-action" onClick={onNext}>进入 Scene C →</button> : null}
      </div>
    </section>
  );
}

export default function App() {
  return <ReferenceProvider><AppContent /></ReferenceProvider>;
}
