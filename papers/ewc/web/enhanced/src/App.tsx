import { useState, type ComponentType } from 'react';
import { EvidenceList } from './components/EvidenceList';
import { PersistentWorkspace } from './components/PersistentWorkspace';
import { TermGlossary } from './components/TermGlossary';
import { INITIAL_SESSION, type Session } from './data/session';
import { PAPER, SCENES } from './data/tutorial';
import { SceneAtari } from './scenes/SceneAtari';
import { SceneFisher } from './scenes/SceneFisher';
import { SceneHandoff } from './scenes/SceneHandoff';
import { SceneMNIST } from './scenes/SceneMNIST';
import { SceneProblem } from './scenes/SceneProblem';
import { SceneUpdate } from './scenes/SceneUpdate';
import type { SceneProps } from './scenes/types';

const sceneComponents: Record<string, ComponentType<SceneProps>> = {
  problem: SceneProblem,
  handoff: SceneHandoff,
  fisher: SceneFisher,
  update: SceneUpdate,
  mnist: SceneMNIST,
  atari: SceneAtari,
};

export default function App() {
  const [activeId, setActiveId] = useState(SCENES[0].id);
  const [session, setSession] = useState<Session>(INITIAL_SESSION);
  const activeIndex = SCENES.findIndex((scene) => scene.id === activeId);
  const active = SCENES[activeIndex] ?? SCENES[0];
  const ActiveScene = sceneComponents[active.id];

  const updateSession = (patch: Partial<Session>) => setSession((current) => ({ ...current, ...patch }));
  const moveScene = (direction: -1 | 1) => {
    const next = Math.min(SCENES.length - 1, Math.max(0, activeIndex + direction));
    setActiveId(SCENES[next].id);
    document.getElementById('scene-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="ewc-app">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="EWC 学习站首页"><span className="wordmark-mark">E</span><span>PaperSkill <b>/ EWC</b></span></a>
        <nav className="header-links" aria-label="页面链接">
          <a href="#learning-path">学习路径</a>
          <a href={PAPER.arxiv} target="_blank" rel="noreferrer">论文原文 ↗</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero-panel" aria-labelledby="paper-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" />持续学习 · 方法拆解</div>
            <h1 id="paper-title">让重要参数慢一点改变</h1>
            <p className="hero-lede">从顺序 Bayes 到 Fisher 加权约束，逐步重建弹性权重固化（EWC）如何缓解灾难性遗忘，以及论文证据支持到哪里。</p>
            <div className="paper-meta">
              <span>{PAPER.title}</span><i aria-hidden="true">·</i><span>{PAPER.venue}</span><i aria-hidden="true">·</i><span>{PAPER.authors}</span>
            </div>
            <div className="hero-actions">
              <a className="primary-action" href="#learning-path">开始学习 <span aria-hidden="true">↓</span></a>
              <a className="secondary-action" href={PAPER.doi} target="_blank" rel="noreferrer">PNAS DOI ↗</a>
            </div>
          </div>
          <div className="hero-visual" aria-label="EWC 惩罚的重要参数偏移示意">
            <div className="visual-caption">参数偏移成本</div>
            <div className="weight-row"><span>低重要性</span><div className="weight-track"><i className="weight-bar low" /></div><b>低</b></div>
            <div className="weight-row"><span>中重要性</span><div className="weight-track"><i className="weight-bar medium" /></div><b>中</b></div>
            <div className="weight-row"><span>高重要性</span><div className="weight-track"><i className="weight-bar high" /></div><b>高</b></div>
            <div className="visual-formula">P<sub>i</sub> = <span>λ</span>F<sub>i</sub>Δ<sub>i</sub><sup>2</sup> / 2</div>
            <div className="visual-note"><span className="legend-dot" />旧任务越依赖参数，偏离锚点的代价越大</div>
          </div>
          <div className="hero-footnote"><span>核心问题</span>新任务梯度可能损害旧任务解；EWC 用局部重要性信息调节参数偏移成本。</div>
        </section>

        <section className="learning-section" id="learning-path" aria-labelledby="learning-title">
          <div className="section-heading">
            <div><span className="section-kicker">循序重建 · 六个场景</span><h2 id="learning-title">从问题走到证据边界</h2></div>
            <span className="progress-count">{String(activeIndex + 1).padStart(2, '0')} <i>/</i> {String(SCENES.length).padStart(2, '0')}</span>
          </div>

          <nav className="scene-nav" aria-label="学习场景">
            {SCENES.map((scene, index) => (
              <button key={scene.id} className={scene.id === active.id ? 'scene-nav-item is-active' : 'scene-nav-item'} aria-current={scene.id === active.id ? 'step' : undefined} onClick={() => setActiveId(scene.id)}>
                <span className="scene-nav-number">{scene.number}</span><span className="scene-nav-title">{scene.title}</span>
              </button>
            ))}
          </nav>

          <div className="learning-layout" id="scene-content">
            <article className="scene-main" aria-labelledby="scene-title">
              <div className="scene-intro">
                <span className="scene-number">场景 {active.number}</span>
                <h2 id="scene-title">{active.title}</h2>
                <p>{active.question}</p>
              </div>
              <ActiveScene session={session} onSessionChange={updateSession} />
              <div className="scene-exit"><span className="exit-check">✓</span><p><b>完成本场景后</b>{active.exit}</p></div>
              <div className="scene-pagination">
                <button className="pager-button" onClick={() => moveScene(-1)} disabled={activeIndex === 0}>← 上一场景</button>
                <span>{activeIndex + 1} / {SCENES.length}</span>
                <button className="pager-button pager-next" onClick={() => moveScene(1)} disabled={activeIndex === SCENES.length - 1}>下一场景 →</button>
              </div>
            </article>

            <aside className="learning-aside">
              <PersistentWorkspace session={session} currentScene={active.title} onReset={() => setSession(INITIAL_SESSION)} />
              <TermGlossary ids={active.termIds} />
            </aside>
          </div>

          <EvidenceList ids={active.evidenceIds} />
        </section>

        <footer className="site-footer">
          <div><b>继续追问，而不是背结论。</b><p>交互中的数值只用于解释公式；实验描述以论文原文和已登记证据为准。</p></div>
          <a href={PAPER.arxiv} target="_blank" rel="noreferrer">阅读 arXiv 原文 ↗</a>
        </footer>
      </main>
    </div>
  );
}
