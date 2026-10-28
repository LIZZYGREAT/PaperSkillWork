import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { LIFECYCLE_CLIPS } from "../../../web/enhanced/src/modules/review/lifecycle-model";
import { KLBoard, ScoreBoard } from "./MechanismScenes";
import "./review-r2.css";

const LENS_NOTES = [
  "原图保留，临时视图经过增强后送入当前网络。",
  "输出来自本次训练视图，θᵢ 尚未更新。",
  "源输出留在原位，副本成为独立 z₁，值始终是 (2,1,0)。",
  "唯一网络更新，z₁ 保持原值；冻结的是数值。",
  "原图与冻结值组成候选，更新后才写入 slot 0。",
  "从真实已有记录读出 x₁，重新增强并前向，aⱼ 不是 z₁。",
  "对齐同一类别，先相减、再平方，得到历史匹配损失。",
  "当前 CE 与历史匹配损失汇合，只更新同一个网络一次。",
  "当前样本自己的 z₂=(u₁,u₂,u₃)，与回放输出区分后写入第二槽。",
];
const LENSES = LIFECYCLE_CLIPS.map((clip, i) => ({ clip: i, title: clip.id, text: LENS_NOTES[i] }));

function applyReviewScale(doc: Document) {
  if (!doc.getElementById('s2-readable-scale')) {
    const style = doc.createElement('style'); style.id = 's2-readable-scale';
    // Review-only type/camera adjustment, authorised by the user's R2 feedback.
    style.textContent = `
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-small{font-size:13px}
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-row-label{font-size:14px}
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-tile-row{font-size:28px}
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-tile-value{font-size:38px}
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-tile-class{font-size:13px}
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-model-title,
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-object-title,
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-band-title{font-size:17px}
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-theta-label{font-size:20px}
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-contrib{font-size:14px}
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-contrib-note{font-size:11px}
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-frozen-class{font-size:10.5px}
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-frozen-value{font-size:18px}
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-slot-label,
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-slot-note,
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-record-id,
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-record-note{font-size:10.5px}
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-ldark{font-size:23px}
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-plot-title,
      .lifecycle-scene.is-focused .lifecycle-canvas .lc-compare-title{font-size:19px}
      .lifecycle-scene.is-focused .lifecycle-reading .lc-reading-steps p,
      .lifecycle-scene.is-focused .lifecycle-reading .lc-reading-steps strong{font-size:16px}
    `; doc.head.appendChild(style);
  }
  doc.querySelector('.lifecycle-canvas')?.setAttribute('viewBox', '18 38 1084 586');
}
function FreezeBoard() {
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const observer = useRef<MutationObserver | null>(null);
  const seek = (i: number, play = false) => {
    setSelected(i);
    const doc = frame.current?.contentDocument;
    if (doc) applyReviewScale(doc);
    const select = doc?.querySelector<HTMLSelectElement>('[data-scene=lifecycle] select');
    if (!select) return;
    const clip = LENSES[i].clip;
    // Use only the accepted player's public stage controls; its own clock/model stay authoritative.
    select.value = String(clip);
    select.dispatchEvent(new Event('change', { bubbles: true }));
    if (play) requestAnimationFrame(() => doc?.querySelector<HTMLButtonElement>('[data-scene=lifecycle] [data-play]')?.click());
  };
  const ready = () => {
    observer.current?.disconnect();
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    const attach = () => {
      const source = doc.querySelector<HTMLElement>('[data-scene=lifecycle]');
      if (!source) return;
      observer.current?.disconnect();
      observer.current = new MutationObserver(() => setSelected(Number(source.dataset.clip)));
      observer.current.observe(source, { attributes:true, attributeFilter:['data-clip'] });
      seek(selected);
    };
    // React may commit after iframe load: observe readiness, never invent a second clock.
    observer.current = new MutationObserver(attach);
    observer.current.observe(doc.body, { childList:true, subtree:true });
    attach();
  };
  useEffect(() => () => observer.current?.disconnect(), []);
  useEffect(() => { const before = document.body.style.overflow; if (expanded) document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = before; }; }, [expanded]);
  return <section data-design="freeze">
    <div className="freeze-header"><div><h2>冻结与回放，回到同一份真实记录。</h2><p>每个入口都定位到原生命周期播放器。完整舞台、九阶段、样本、槽位与冻结值继续属于同一个动画。</p></div><button onClick={() => setExpanded(true)}>展开原播放器 ↗</button></div>
    <div className={expanded ? 'lens-overlay' : 'lens-inline'}>
      <div className="lens-bar"><div className="lens-list" aria-label="生命周期观察入口">{LENSES.map((lens, i) => <button key={lens.clip} data-lens={lens.clip} aria-pressed={selected === i} onClick={() => seek(i)}><small>{String(lens.clip + 1).padStart(2, '0')}</small>{lens.title}</button>)}</div>{expanded && <button onClick={() => setExpanded(false)}>收起，回到设计板</button>}</div>
      <iframe ref={frame} className="live-frame" title="原生命周期专注播放器 · 同一组件与状态" src="/lifecycle/?review=1&focus=lifecycle&controls=unified-start-r3#lifecycle-player" onLoad={ready} />
    </div>
    <div className="freeze-meta"><p><strong>{LENSES[selected].title}</strong> · {LENSES[selected].text}<br />选择阶段停在起点；上一步先回本阶段起点，再回上一阶段起点。</p><div className="cases"><button data-play-lens onClick={() => seek(selected, true)}>从此处连续播放</button><a href="http://127.0.0.1:5188/?review=1&focus=lifecycle#lifecycle-player" target="_blank" rel="noreferrer">原 5188 入口 ↗</a></div></div>
    <details className="design-note"><summary>查看入口方案、复用边界与后续整合</summary><div className="spec-grid">
      <div><h3>同一场景，放大评审</h3><p>实载现有播放器，复用全部九阶段和记录身份。字体放大与画布留白只在评审视图调整；播放器同步修正阶段起点／回退逻辑，并略加宽 DeepSeek 输出卡，算法与数值不变。展开与收起保留同一个实例及其进度。</p></div>
      <div><h3>未来 S3 的最小实现</h3><p>把这一层观察导航放在同一 React 页面，使用已有播放器入口，避免 iframe 变成正式架构。若新增阶段定位参数，仅作外围导航，仍调用同一个时钟；不改原 SVG、数值或几何。</p></div>
      <div><h3>必须看出的边界</h3><p>候选不等于已入池；z₁ 是历史值，aⱼ 是回放的新输出，z₂ 是当前样本独立快照。DER 记录 (x,z)，标签只监督当前 CE；DER++ 才额外存 y。</p></div>
    </div></details>
  </section>;
}

function Board() {
  const initial = new URLSearchParams(location.search).get('scene');
  const [scene, setScene] = useState(initial === 'logits' || initial === 'freeze' ? initial : 'kl');
  const choose = (id: string) => { setScene(id); const url = new URL(location.href); url.searchParams.set('scene', id); history.replaceState({}, '', url); };
  return <><header className="board-top"><div className="wordmark"><b>DER</b><span>教学场景 / 设计评审</span></div><div className="review-status"><i />S2 · R2 重新设计 · 待审</div></header><main className={`s2-board scene-board-${scene}`}>
    <nav className="scene-tabs" role="tablist" aria-label="三个设计提案">{[['kl','概率与 KL'],['logits','Logit Matching'],['freeze','冻结 / 回放入口']].map(([id, label], i) => <button key={id} role="tab" data-tab={id} aria-selected={scene === id} onClick={() => choose(id)}><span>0{i + 1}</span>{label}</button>)}</nav>
    {scene === 'kl' ? <KLBoard /> : scene === 'logits' ? <ScoreBoard /> : <FreezeBoard />}
  </main></>;
}
createRoot(document.getElementById('root')!).render(<Board />);
