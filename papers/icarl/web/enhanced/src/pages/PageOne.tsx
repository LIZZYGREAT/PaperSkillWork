import { useState, type CSSProperties } from "react";
import { PaperTerm } from "../components/PaperTerm";

type PageOneProps = { onOpenPageTwo: () => void };

const stages = [
  { title: "任务背景", note: "新类别逐批到来，同一个学习器持续更新；预测面向全部已见类别，图像记忆有上限。", status: "先建立问题场景。" },
  { title: "两种直接做法", note: "先看两条自然的路线：保存全部历史并重训练，或只围绕新类别继续训练。", status: "比较做法 A 与 B。" },
  { title: "为什么都不够", note: "A 无法守住记忆上限，B 可能损害旧类识别；需要同时考虑多项约束。", status: "从做法推导难点。" },
  { title: "四项要求", note: "学习新类、保留旧类识别、统一预测，并遵守有界记忆。", status: "下一步：打开共享模型。" },
];

const batches = [
  { name: "类别批次 1", range: "类别 1–10" },
  { name: "类别批次 2", range: "类别 11–20" },
  { name: "类别批次 3", range: "类别 21–30" },
];

export function PageOne({ onOpenPageTwo }: PageOneProps) {
  const [step, setStep] = useState(0);
  const seenCount = [10, 20, 30, 30][step];
  const arrivedCount = Math.min(step + 1, 3);
  const currentBatch = arrivedCount - 1;
  const totalSteps = stages.length;

  return (
    <article className="tutorial-page p1-page" aria-labelledby="page-one-title">
      <div className="p1-kicker"><span>第 01 页</span><i /> 类别增量学习的任务设定</div>
      <header className="page-heading p1-heading">
        <h1 id="page-one-title">类别逐批到来，分类器不能重新开始</h1>
        <p><PaperTerm termId="class-incremental-learning" /> 中，新类别会随时间出现。同一个模型要在所有已见类别中直接预测，同时面对有限的旧数据记忆。</p>
      </header>

      <section className="p1-guided panel" aria-labelledby="p1-guided-title">
        <div className="p1-guided__top">
          <div><span className="p1-eyebrow">引导阅读 · {String(step + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}</span><h2 id="p1-guided-title">{stages[step].title}</h2></div>
          <div className="p1-step-actions">
            <button type="button" className="p1-control p1-control--quiet" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} aria-label="上一步">← <span>上一步</span></button>
            <button type="button" className="p1-control p1-control--primary" onClick={() => setStep((value) => Math.min(totalSteps - 1, value + 1))} disabled={step === totalSteps - 1} aria-label="下一步"><span>下一步</span> →</button>
          </div>
        </div>
        <nav className="p1-step-nav" aria-label="第 1 页引导阶段">
          {stages.map((stage, index) => (
            <button key={stage.title} type="button" className={`p1-step-nav__item ${step === index ? "is-active" : ""} ${index < step ? "is-complete" : ""}`} onClick={() => setStep(index)} aria-pressed={step === index}>
              <span>{String(index + 1).padStart(2, "0")}</span><b>{stage.title}</b>
            </button>
          ))}
        </nav>
        <div className="p1-guided__summary" aria-live="polite"><span className="p1-guided__pulse" /><p>{stages[step].note}</p><strong>{stages[step].status}</strong></div>
      </section>

      <section className="p1-class-stream panel" aria-labelledby="p1-stream-title">
        <div className="p1-section-head">
          <div><span className="p1-eyebrow">01 · 任务背景</span><h2 id="p1-stream-title">新类别沿时间进入同一条学习路径</h2></div>
          <span className="p1-time-label">时间 <svg viewBox="0 0 48 12" aria-hidden="true"><path d="M1 6h42m-6-5 6 5-6 5" /></svg></span>
        </div>
        <div className="p1-batch-track" data-arrived={arrivedCount}>
          <div className="p1-track-line" aria-hidden="true"><span style={{ "--progress": `${((arrivedCount - 1) / 2) * 100}%` } as CSSProperties} /></div>
          {batches.map((batch, index) => {
            const arrived = index < arrivedCount;
            return (
              <div key={batch.name} className={`p1-batch ${arrived ? "is-arrived" : "is-future"} ${index === currentBatch ? "is-current" : ""}`}>
                <div className="p1-batch__marker" aria-hidden="true"><i /></div>
                <div className="p1-batch__card">
                  <div className="p1-batch__top"><span>{batch.name}</span><em>{arrived ? (index === currentBatch ? "当前" : "已见") : "待到达"}</em></div>
                  <strong>{batch.range}</strong>
                  <div className="p1-batch__classes" aria-label={`${batch.range}，十个类别`}>
                    {Array.from({ length: 10 }, (_, classIndex) => <i key={classIndex} />)}
                  </div>
                  <small>{arrived ? "类别继续保留在预测范围中" : "尚未到达"}</small>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p1-stream-caption"><span>每批加入新的类别。</span><span>同一个学习器贯穿整个序列。</span></div>
      </section>

      <section className="p1-background-facts" aria-label="任务背景的三项约束">
        <div><span className="p1-eyebrow">持续更新</span><strong>同一个学习器</strong><p>参数随批次更新，模型贯穿整个类别序列。</p></div>
        <div aria-live="polite"><span className="p1-eyebrow">统一预测</span><strong>C1–C{seenCount}</strong><p>从全部已见类别中选择，不依赖测试样本的批次。</p></div>
        <div><span className="p1-eyebrow">有限图像记忆</span><strong>K · 固定上限</strong><p>历史越来越长，可保存的图像数量仍受预算限制。</p></div>
      </section>

      <section className={`p1-naive-section ${step === 1 ? "is-focused" : ""}`} aria-labelledby="p1-naive-title">
        <div className="p1-section-head"><div><span className="p1-eyebrow">02 · 两种直接做法</span><h2 id="p1-naive-title">先看看最自然想到的两条路线</h2></div><span className="p1-qualitative-note">概念对比</span></div>
        <div className="p1-naive-grid">
          <article className="p1-naive-card p1-naive-card--memory">
            <div className="p1-naive-card__visual" aria-hidden="true"><div className="p1-archive-stack">{Array.from({ length: 7 }, (_, index) => <i key={index} />)}</div><span className="p1-overflow-arrow">↗</span><b>持续增长</b></div>
            <span className="p1-card-label">做法 A · 保存全部图像</span><h3>保留全部历史数据并重新训练</h3><p>旧图像可以继续使用，但存储量会随历史持续增长。</p>
            <div className="p1-verdict"><i>×</i><span>超出有界记忆限制</span></div>
          </article>
          <article className="p1-naive-card p1-naive-card--new">
            <div className="p1-naive-card__visual" aria-hidden="true"><span className="p1-model-mini">模型</span><svg viewBox="0 0 84 24"><path d="M2 12h75m-8-7 8 7-8 7" /></svg><span className="p1-new-mini">新数据</span></div>
            <span className="p1-card-label">做法 B · 只使用新数据训练</span><h3>只围绕刚到达的类别继续训练</h3><p>新类能力可以提升，但可能出现<PaperTerm termId="catastrophic-forgetting">灾难性遗忘</PaperTerm>，旧类别区分能力因此下降。</p>
            <div className="p1-verdict"><i>×</i><span>旧类别能力可能退化</span></div>
          </article>
        </div>
      </section>

      <section className={`p1-constraints panel ${step === 2 ? "is-focused" : ""}`} aria-labelledby="p1-constraints-title">
        <span className="p1-eyebrow">03 · 为什么两种做法都不够</span>
        <h2 id="p1-constraints-title">需要同时满足多项约束</h2>
        <p>做法 A 保留了旧图像，却违反有限记忆；做法 B 集中学习新类，却可能失去旧类识别能力。任务必须兼顾这些要求。</p>
      </section>

      <section className={`p1-problem panel ${step === 3 ? "is-active" : ""}`} aria-labelledby="p1-problem-title">
        <div className="p1-problem__lead"><span className="p1-eyebrow">04 · 类别增量学习问题</span><h2 id="p1-problem-title">系统需要同时做到</h2><p>因此，iCaRL 围绕以下四项要求展开。</p></div>
        <ol><li>学习新到来的类别</li><li>继续识别以前见过的类别</li><li>在统一标签空间中预测</li><li>遵守有界图像记忆</li></ol>
        <button type="button" className="p1-open-model" onClick={onOpenPageTwo}>打开模型 <span aria-hidden="true">→</span></button>
      </section>
    </article>
  );
}
