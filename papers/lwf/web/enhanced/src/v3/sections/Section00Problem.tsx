import { baselineRoutes, problemFacts } from "../data/problem";

export function Section00Problem() {
  return (
    <section className="v3-stage v3-problem" id="slice-00" aria-labelledby="v3-problem-title">
      <header className="v3-stage-heading">
        <span className="v3-stage-number">00</span>
        <div><p className="v3-eyebrow">PROBLEM SETTING</p><h2 id="v3-problem-title">旧模型还在，旧数据不在</h2><p>新任务到来时，LwF 要在学习新任务的同时保留旧任务行为。</p></div>
      </header>

      <div className="v3-fact-grid" aria-label="问题设定中的数据与模型状态">
        {problemFacts.map((fact) => (
          <article className={`v3-fact-card ${fact.available ? "is-available" : "is-unavailable"}`} key={fact.id}>
            <span>{fact.title}</span><strong>{fact.state}</strong><p>{fact.detail}</p>
          </article>
        ))}
      </div>

      <div className="v3-baseline-block">
        <div className="v3-subheading"><div><p className="v3-eyebrow">BASELINES UNDER THE SAME CONSTRAINTS</p><h3>三种常见路线各自放弃了什么？</h3></div><span>学习新任务 · 保留旧任务 · 不用旧数据</span></div>
        <div className="v3-baseline-grid">
          {baselineRoutes.map((route) => (
            <article className={`v3-baseline-card ${route.id === "joint-training" ? "is-mismatch" : ""}`} key={route.id}>
              <h4>{route.title}</h4><p className="v3-baseline-good"><span aria-hidden="true">+</span>{route.good}</p><p className="v3-baseline-limit"><span aria-hidden="true">−</span>{route.limit}</p>
              {route.id === "joint-training" ? <strong className="v3-constraint-tag">需要旧训练数据</strong> : null}
            </article>
          ))}
        </div>
      </div>

      <p className="v3-one-line-method"><span>LwF 的关键做法</span>用旧模型在新任务图像上的响应，代替不可获得的旧任务训练监督。</p>
      <a className="v3-next-link" href="#slice-01">先看 Teacher 与 Student 的结构 <span aria-hidden="true">↓</span></a>
    </section>
  );
}
