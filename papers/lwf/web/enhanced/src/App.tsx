import React, { useState } from 'react';
import { ReferenceProvider, TermRef, useReferenceHub } from './components/ReferencePrimitives';

type SceneId = 'A' | 'B' | 'C';
type MethodId = 'feature' | 'finetune' | 'joint' | 'lwf';

const scenes: { id: SceneId; title: string; question: string; output: string }[] = [
  { id: 'A', title: '问题从哪里来', question: '新任务到来时，为什么旧任务可能退化？', output: '明确旧数据约束与“适配新任务 / 保留旧行为”的冲突。' },
  { id: 'B', title: '训练路线比较', question: '每种方法能看哪些数据、会更新哪些参数？', output: '比较四条训练路线的数据来源与可训练参数。' },
  { id: 'C', title: '追踪旧任务信号', question: '旧样本不可用时，Y_o 从哪里来？', output: '重建 X_n → 旧模型 → Y_o，并区分 Y_n。' },
];

const methods: Record<MethodId, { label: string; oldData: string; newData: string; shared: string; oldSignal: string; summary: string }> = {
  feature: {
    label: 'Feature extraction', oldData: '不使用', newData: '新图像 + 新标签', shared: '冻结', oldSignal: '没有旧响应目标',
    summary: '固定共享表示，只训练新任务输出。旧特征不变，但模型不能专门调整共享表示来适配新任务。',
  },
  finetune: {
    label: 'Fine-tuning', oldData: '不使用', newData: '新图像 + 新标签', shared: '更新', oldSignal: '没有旧响应目标',
    summary: '可调整共享表示来适配新任务；同一变化可能让旧任务依赖的表示漂移，旧性能因此有退化风险。',
  },
  joint: {
    label: 'Joint training', oldData: '需要旧图像 + 旧标签', newData: '新图像 + 新标签', shared: '更新', oldSignal: '旧任务真实监督',
    summary: '可同时使用新旧任务监督，但需要旧任务训练数据，不满足本文要解决的数据约束。',
  },
  lwf: {
    label: 'Learning without Forgetting', oldData: '不使用旧图像 / 标签', newData: '新图像 + 新标签', shared: '联合阶段更新', oldSignal: '旧模型在新图像上的响应 Y_o',
    summary: '保留旧模型，在当前新图像 X_n 上生成旧任务软响应 Y_o；扩展模型同时学习 Y_o 与新标签 Y_n。',
  },
};

function moveRadioSelection(event: React.KeyboardEvent<HTMLButtonElement>, index: number, count: number, onSelect: (nextIndex: number) => void) {
  const key = event.key;
  if (!['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Home', 'End'].includes(key)) return;
  event.preventDefault();
  const nextIndex = key === 'Home' ? 0 : key === 'End' ? count - 1
    : (index + (key === 'ArrowLeft' || key === 'ArrowUp' ? count - 1 : 1)) % count;
  onSelect(nextIndex);
  event.currentTarget.closest('[role="radiogroup"]')
    ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIndex]?.focus();
}

function moveTabSelection(event: React.KeyboardEvent<HTMLButtonElement>, index: number, count: number, onSelect: (nextIndex: number) => void) {
  const key = event.key;
  if (!['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Home', 'End'].includes(key)) return;
  event.preventDefault();
  const nextIndex = key === 'Home' ? 0 : key === 'End' ? count - 1
    : (index + (key === 'ArrowLeft' || key === 'ArrowUp' ? count - 1 : 1)) % count;
  onSelect(nextIndex);
  event.currentTarget.closest('[role="tablist"]')
    ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
}

function AppContent() {
  const [activeScene, setActiveScene] = useState<SceneId>('A');
  const [selectedMethod, setSelectedMethod] = useState<MethodId>('finetune');
  const scene = scenes.find((item) => item.id === activeScene)!;
  const { openHub } = useReferenceHub();

  return (
    <div className="lwf-v2">
      <header className="v2-topbar">
        <a className="v2-brand" href="#top" aria-label="LwF 工作区首页"><span className="v2-brand-mark">L</span><span>PaperSkillWork <b>/ LwF</b></span></a>
        <div className="v2-topbar-actions">
          <span className="v2-workflow-status"><i aria-hidden="true" /> Workflow v2 · G0–G7 pending</span>
          <button className="v2-reference-button" type="button" onClick={() => openHub()}>术语与证据 <span aria-hidden="true">↗</span></button>
        </div>
      </header>

      <main id="top" className="v2-page">
        <section className="v2-hero">
          <div className="v2-hero-copy">
            <div className="v2-paper-meta"><span>ECCV 2016</span><span>·</span><span>Li & Hoiem</span><span>·</span><a href="https://arxiv.org/abs/1606.09282" target="_blank" rel="noreferrer">arXiv:1606.09282 ↗</a></div>
            <p className="v2-eyebrow">FIRST VERTICAL SLICE · SCENES A–C</p>
            <h1>旧任务信号从哪里来？<br /><em>追踪 LwF 如何接入新任务</em></h1>
            <p className="v2-hero-summary">从问题设定出发，认识共享网络和任务头，再追踪旧模型如何在新任务输入上产生软目标。每个场景都围绕同一组对象展开。</p>
            <div className="v2-hero-outcomes">
              <span><b>01</b> 说清旧数据约束</span><span><b>02</b> 区分四种训练路线</span><span><b>03</b> 重建 <code>X_n → Y_o</code></span>
            </div>
          </div>
          <div className="v2-hero-side">
            <span className="v2-side-label">本轮学习问题</span>
            <strong>在看不到旧训练图像时，旧模型还能提供什么？</strong>
            <p>先认识论文要解决的冲突，再看它用什么信号处理冲突。</p>
            <a href="#learning-path">进入场景 <span aria-hidden="true">↓</span></a>
          </div>
        </section>

        <PersistentWorkspace activeScene={activeScene} selectedMethod={selectedMethod} />

        <section id="learning-path" className="v2-learning-path" aria-labelledby="path-title">
          <div className="v2-section-heading">
            <div><p className="v2-eyebrow">LEARNING PATH</p><h2 id="path-title">从问题到可用信号</h2></div>
            <span className="v2-scene-count">已整理 3 个场景 · 后续机制待验收</span>
          </div>
          <div className="v2-scene-tabs" role="tablist" aria-label="学习场景">
            {scenes.map((item, index) => (
              <button key={item.id} id={`scene-tab-${item.id}`} type="button" role="tab" aria-selected={activeScene === item.id} aria-controls="scene-panel" tabIndex={activeScene === item.id ? 0 : -1} className={activeScene === item.id ? 'is-active' : ''} onClick={() => setActiveScene(item.id)} onKeyDown={(event) => moveTabSelection(event, index, scenes.length, (nextIndex) => setActiveScene(scenes[nextIndex].id))}>
                <span className="v2-tab-letter">{item.id}</span><span className="v2-tab-copy"><strong>{item.title}</strong><small>{item.question}</small></span><span className="v2-tab-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>

          <article id="scene-panel" className="v2-scene-panel" role="tabpanel" aria-labelledby={`scene-tab-${activeScene}`} tabIndex={0}>
            <header className="v2-scene-header">
              <div><span className="v2-scene-label">SCENE {activeScene}</span><h3>{scene.title}</h3></div>
              <div className="v2-scene-target"><span>本场景完成后，你应能</span><strong>{scene.output}</strong></div>
            </header>
            {activeScene === 'A' ? <SceneA /> : null}
            {activeScene === 'B' ? <SceneB selectedMethod={selectedMethod} onSelect={setSelectedMethod} /> : null}
            {activeScene === 'C' ? <SceneC /> : null}
          </article>
        </section>

        <section className="v2-acceptance" aria-labelledby="acceptance-title">
          <div className="v2-acceptance-heading">
            <div><p className="v2-eyebrow">HUMAN ACCEPTANCE</p><h2 id="acceptance-title">第一纵向切片验收问题</h2></div>
            <span className="v2-pending-pill">等待人工核阅</span>
          </div>
          <p>下面的问题对应 Scene A–C 的学习目标。交互操作和结构检查不能代替学习验收；当前页面不会自动把任何 Gate 标记为完成。</p>
          <ol>
            <li>我是否理解旧任务训练数据为什么不可用，以及这会怎样限制方法？</li>
            <li>我能否说清 `θ_s`、旧任务头和新任务头各在架构哪里？</li>
            <li>我能否解释 feature extraction、fine-tuning、joint training 与 LwF 的数据和参数差别？</li>
            <li>我能否独立画出 `X_n → 旧模型 → Y_o`，并区分 `Y_o`、旧样本与新标签 `Y_n`？</li>
          </ol>
        </section>

        <footer className="v2-footer">
          <div><strong>Learning without Forgetting</strong><span>工作区教学版本 · v2 First Vertical Slice</span></div>
          <div><span>Evidence Registry 已连接</span><a href="https://arxiv.org/abs/1606.09282" target="_blank" rel="noreferrer">查看论文 ↗</a></div>
        </footer>
      </main>
    </div>
  );
}

function PersistentWorkspace({ activeScene, selectedMethod }: { activeScene: SceneId; selectedMethod: MethodId }) {
  const route = methods[selectedMethod];
  const focus = activeScene === 'A' ? 'problem' : activeScene === 'B' ? 'routes' : 'signal';
  return (
    <section className={`v2-workspace v2-focus-${focus}`} aria-labelledby="workspace-title">
      <header className="v2-workspace-header">
        <div><p className="v2-eyebrow">PERSISTENT MODEL</p><h2 id="workspace-title">共享工作区 <span>· 同一组对象，贯穿场景 A–C</span></h2></div>
        <div className="v2-workspace-focus"><span>当前焦点</span><strong>{focus === 'problem' ? '旧数据约束与性能冲突' : focus === 'routes' ? route.label : '旧响应的来源与去向'}</strong></div>
      </header>
      <div className="v2-flow-board" aria-label="旧模型与扩展模型的信息流">
        <div className="v2-flow-input"><small>新任务 batch</small><code>X_n</code><span>图像</span></div>
        <div className="v2-flow-lanes">
          <div className={`v2-flow-lane v2-old-lane ${activeScene === 'C' ? 'is-highlighted' : ''}`}>
            <span className="v2-lane-label">旧模型 · 生成目标</span>
            <div className="v2-model-card v2-old-model"><span>原有模型</span><strong>f_old</strong><small>θ_s · θ_o</small></div>
            <span className="v2-flow-arrow" aria-hidden="true">→</span>
            <div className="v2-output-card v2-output-old"><small>旧任务响应</small><strong>Y_o</strong><span>soft target</span></div>
          </div>
          <div className={`v2-flow-lane v2-current-lane ${activeScene === 'C' ? 'is-highlighted' : ''}`}>
            <span className="v2-lane-label">扩展模型 · 当前训练</span>
            <div className="v2-model-card v2-current-model"><span>共享表示 + 任务头</span><strong>f_new</strong><small>θ̂_s · θ̂_o · θ̂_n</small></div>
            <span className="v2-flow-arrow" aria-hidden="true">→</span>
            <div className="v2-output-pair"><div className="v2-output-card"><small>旧任务输出</small><strong>Ŷ_o</strong></div><div className="v2-output-card v2-output-new"><small>新任务输出</small><strong>Ŷ_n</strong></div></div>
          </div>
        </div>
        <div className="v2-target-rail"><span>旧模型目标 <strong>Y_o</strong> 来自对同一 `X_n` 的前向</span><span>新任务标签 <strong>Y_n</strong> 来自数据集</span></div>
      </div>
      <div className="v2-object-legend" aria-label="持续使用的核心对象">
        <div><code>θ_s</code><span>共享 CNN 参数</span></div><div><code>θ_o</code><span>已有任务头</span></div><div><code>θ_n</code><span>新任务新增参数</span></div><div className="v2-no-replay"><span className="v2-no-replay-icon" aria-hidden="true">×</span><span>没有旧样本回放</span></div>
      </div>
      {activeScene === 'B' ? <p className="v2-workspace-route-note"><strong>{route.label}：</strong>{route.summary} <span>参数路径：共享部分 {route.shared} · 旧响应：{route.oldSignal}。</span></p> : null}
      {activeScene === 'C' ? <p className="v2-workspace-route-note"><strong>信号读法：</strong>同一个新任务输入进入旧模型和扩展模型；旧模型在 {`X_n`} 上的旧任务响应 {`Y_o`} 与新任务数据集的 {`Y_n`} 走不同的监督路径。</p> : null}
    </section>
  );
}

function SceneA() {
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const isCorrect = answer === 'old-data';
  const choices = [
    { value: 'old-data', label: '旧任务训练图像与标签' },
    { value: 'teacher', label: '已经训练好的旧模型' },
    { value: 'new-data', label: '新任务图像与标签' },
  ];
  return (
    <div className="v2-scene-body">
      <div className="v2-explanation">
        <p>想象一个已经能做旧任务的分类网络。现在只拿到新任务图像和标签：模型要学会新类别，但旧任务训练图像和标签不能继续使用。更新共享参数可能让新任务更适配，也可能改变旧任务依赖的表示。</p>
        <p>因此，问题不是“怎样冻结一切”，而是：<strong>在只有新任务数据时，怎样继续适配，同时给旧任务行为留下参照？</strong></p>
        <p>这里的 <TermRef id="shared_parameters">共享参数</TermRef> 会被多个任务使用；当它们改变时，旧任务输出可能跟着改变。这个现象叫 <TermRef id="catastrophic_forgetting">灾难性遗忘</TermRef>。</p>
      </div>
      <div className="v2-contrast-grid">
        <article className="v2-contrast-card v2-contrast-risk"><span className="v2-card-kicker">直接更新</span><h4>Fine-tuning</h4><p>共享表示可以适配新任务，但缺少旧任务目标作参照，旧任务性能有退化风险。</p><div className="v2-parameter-state"><span>θ_s</span><b>可更新</b></div></article>
        <article className="v2-contrast-card"><span className="v2-card-kicker">保持冻结</span><h4>Feature extraction</h4><p>旧共享表示保持不变，但新任务不能专门调整共享特征。</p><div className="v2-parameter-state is-frozen"><span>θ_s</span><b>冻结</b></div></article>
        <article className="v2-contrast-card v2-contrast-muted"><span className="v2-card-kicker">旧监督可见</span><h4>Joint training</h4><p>新旧监督都能使用，但需要旧任务训练数据，不符合当前问题设定。</p><div className="v2-parameter-state is-outside"><span>旧数据</span><b>不可用</b></div></article>
      </div>
      <div className="v2-check-question">
        <div><span className="v2-question-label">快速自检 · 问题设定</span><h4>当前训练时，哪一种资源不可用？</h4></div>
        <div className="v2-choice-list" role="radiogroup" aria-label="选择 LwF 问题设定中的不可用资源">
          {choices.map(({ value, label }, index) => <button key={value} type="button" role="radio" aria-checked={answer === value} tabIndex={answer === value || (!answer && index === 0) ? 0 : -1} className={answer === value ? 'is-selected' : ''} onClick={() => { setAnswer(value); setChecked(false); }} onKeyDown={(event) => moveRadioSelection(event, index, choices.length, (nextIndex) => { setAnswer(choices[nextIndex].value); setChecked(false); })}>{label}</button>)}
        </div>
        <button className="v2-primary-action" type="button" disabled={!answer} onClick={() => setChecked(true)}>核对理解</button>
        {checked ? <p className={`v2-answer-feedback ${isCorrect ? 'is-correct' : 'is-incorrect'}`} role="status">{isCorrect ? '对。旧任务训练图像与标签不可用；旧模型仍可处理当前的新任务图像。' : '再想想：LwF 保留旧模型作为信号来源，新任务图像和标签仍然可见。'}</p> : null}
      </div>
    </div>
  );
}

function SceneB({ selectedMethod, onSelect }: { selectedMethod: MethodId; onSelect: (id: MethodId) => void }) {
  const selected = methods[selectedMethod];
  const methodIds = Object.keys(methods) as MethodId[];
  return (
    <div className="v2-scene-body">
      <div className="v2-explanation">
        <p>四条路线在“能否调整共享表示”和“是否需要旧任务数据”上不同。选择一种路线，检查它实际能看到什么，以及哪些对象可以变化。</p>
        <p>LwF 不是 <TermRef id="replay">样本回放</TermRef>，也不是 <TermRef id="joint_training">联合训练基线</TermRef>：它在不使用旧任务训练样本的同时，保留一个能在新输入上运行的旧模型。</p>
      </div>
      <div className="v2-method-controls" role="tablist" aria-label="比较训练路线">
        {methodIds.map((id, index) => <button key={id} id={`method-tab-${id}`} type="button" role="tab" aria-selected={selectedMethod === id} aria-controls="method-panel" tabIndex={selectedMethod === id ? 0 : -1} className={selectedMethod === id ? 'is-active' : ''} onClick={() => onSelect(id)} onKeyDown={(event) => moveTabSelection(event, index, methodIds.length, (nextIndex) => onSelect(methodIds[nextIndex]))}>{methods[id].label}</button>)}
      </div>
      <div id="method-panel" className="v2-method-detail" role="tabpanel" aria-labelledby={`method-tab-${selectedMethod}`} tabIndex={0}>
        <div className="v2-method-detail-heading"><span>当前路线</span><h4>{selected.label}</h4><p>{selected.summary}</p></div>
        <dl className="v2-method-facts">
          <div><dt>旧任务训练数据</dt><dd>{selected.oldData}</dd></div>
          <div><dt>新任务训练数据</dt><dd>{selected.newData}</dd></div>
          <div><dt>共享参数 θ_s</dt><dd>{selected.shared}</dd></div>
          <div><dt>旧任务信号</dt><dd>{selected.oldSignal}</dd></div>
        </dl>
      </div>
      <p className="v2-paper-note"><span aria-hidden="true">i</span> 这是对问题设定和参数路径的比较，不是训练时长、内存或跨任务对的性能排行榜。论文中的具体结果稍后与数据集、模型和指标一起核对。</p>
    </div>
  );
}

function SceneC() {
  const [selectedSignal, setSelectedSignal] = useState<'response' | 'old-example' | 'new-label' | null>(null);
  const correct = selectedSignal === 'response';
  const choices = [
    { value: 'old-example', label: '从旧任务图像缓存中取出的真实标签' },
    { value: 'response', label: '旧模型对当前新任务图像的旧任务概率响应' },
    { value: 'new-label', label: '新任务数据集提供的真实标签' },
  ] as const;
  return (
    <div className="v2-scene-body">
      <div className="v2-explanation">
        <p>现在沿共享工作区中的输入走一遍。<TermRef id="knowledge_distillation">知识蒸馏</TermRef> 通常让一个模型的输出指导当前模型；在 LwF 里，关键是教师在哪种输入上给出这个输出。</p>
        <p>旧模型和扩展模型都处理新任务图像 <code>X_n</code>。旧模型输出旧任务概率 <code>Y_o</code>；数据集给出新任务真值 <code>Y_n</code>。两类目标来源不同，后面会进入不同损失。</p>
      </div>
      <div className="v2-signal-trace" role="group" aria-label="LwF 旧任务目标的生成过程">
        <div className="v2-trace-step"><span>01</span><small>当前可见输入</small><strong>X_n</strong><p>新任务图像</p></div>
        <span className="v2-trace-arrow" aria-hidden="true">→</span>
        <div className="v2-trace-step"><span>02</span><small>已有教师</small><strong>f_old</strong><p>旧模型 `(θ_s, θ_o)`</p></div>
        <span className="v2-trace-arrow" aria-hidden="true">→</span>
        <div className="v2-trace-step v2-trace-result"><span>03</span><small>记录旧任务输出</small><strong>Y_o</strong><p>旧任务软响应</p></div>
      </div>
      <div className="v2-signal-targets">
        <div><span>旧任务保持目标</span><p><strong>Y_o</strong> ← 旧模型在 <code>X_n</code> 上的预测</p></div>
        <div><span>新任务监督目标</span><p><strong>Y_n</strong> ← 新任务数据集的真实标签</p></div>
        <div><span>当前模型输出</span><p><strong>Ŷ_o / Ŷ_n</strong> ← 扩展模型在同一输入上的预测</p></div>
      </div>
      <div className="v2-check-question v2-signal-question">
        <div><span className="v2-question-label">追踪检查 · Y_o 的来源</span><h4>选择描述 `Y_o` 的正确说法</h4></div>
        <div className="v2-choice-list" role="radiogroup" aria-label="选择旧任务响应的来源">
          {choices.map(({ value, label }, index) => <button key={value} type="button" role="radio" aria-checked={selectedSignal === value} tabIndex={selectedSignal === value || (!selectedSignal && index === 0) ? 0 : -1} className={selectedSignal === value ? 'is-selected' : ''} onClick={() => setSelectedSignal(value)} onKeyDown={(event) => moveRadioSelection(event, index, choices.length, (nextIndex) => setSelectedSignal(choices[nextIndex].value))}>{label}</button>)}
        </div>
        {selectedSignal ? <p className={`v2-answer-feedback ${correct ? 'is-correct' : 'is-incorrect'}`} role="status">{correct ? '正确。X_n 经过旧模型得到 Y_o；它是输出响应，不是旧样本或新任务标签。' : '这描述的是另一种信号。Y_o 来自旧模型对当前 X_n 的前向输出。'}</p> : null}
      </div>
      <p className="v2-next-question"><span>接下来要解决</span>旧响应与新标签分别进入什么损失？新增参数什么时候创建？</p>
    </div>
  );
}

export default function App() {
  return <ReferenceProvider><AppContent /></ReferenceProvider>;
}
