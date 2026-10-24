import { useEffect, useState } from "react";
import { Button } from "../../foundation/controls/Button";
import { StepNav } from "../../compositions/step-nav";
import "./editorial-studies.css";

export const editorialSections = [
  { id: "ed-a", title: "A · 参数的分量" },
  { id: "ed-b", title: "B · 一次任务交接" },
  { id: "ed-c", title: "C · 谁接收更新" },
];

const weights = [0.85, 0.30, 0.10];
const thetaA = <span className="rk-math" data-state-object="reference"><var>θ</var><sub>A</sub><sup>*</sup></span>;
const fisherA = <span className="rk-math" data-state-object="importance"><var>F</var><sub>A</sub></span>;
const handoffStages = [
  { id: "learn-a", label: "完成 A", reference: "已生成 · 尚未保存副本", fisher: "尚未估计", use: "B 尚未开始" },
  { id: "save", label: "保存参考", reference: "已保存 · 后续保持固定", fisher: "尚未估计", use: "B 尚未开始" },
  { id: "estimate", label: "估计重要性", reference: "继承已保存副本", fisher: "由 A 估计并保存", use: "B 尚未开始" },
  { id: "use-b", label: "在 B 中使用", reference: "读取已保存副本", fisher: "读取 A 的重要性", use: "B 训练中 · θ 可更新" },
];

export function EditorialStudies() {
  const [stageIndex, setStageIndex] = useState(0);
  const stage = handoffStages[stageIndex];
  const phase = (index: number) => index === stageIndex ? "current" : index < stageIndex ? "completed" : "upcoming";
  const phaseLabel = (index: number) => ({ current: "当前阶段", completed: "已完成", upcoming: "后续预览" })[phase(index)];
  useEffect(() => {
    const section = editorialSections.find(s => `#${s.id}` === window.location.hash);
    if (section) document.getElementById(section.id)?.scrollIntoView({ block: "start", behavior: "instant" });
  }, []);
  return <article className="ed-study" lang="zh-CN" data-demo-view="editorial">
    <header className="ed-study__opening">
      <p className="ed-study__eyebrow">EDITORIAL STUDIES <span>01 / 阅读实验</span></p>
      <h1>让机制，发生在阅读之间。</h1>
      <p>同一张纸，三种组织知识的方式。先看参数的分量，再看状态的交接，最后辨认更新的去向。</p>
      <nav aria-label="三个构图实验">{editorialSections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}</nav>
    </header>

    <section id="ed-a" className="ed-study__section ed-study__a" aria-labelledby="ed-a-title">
      <p className="ed-study__eyebrow">A / INLINE MEANING <span>EWC · 参数重要性</span></p>
      <div className="ed-study__a-layout">
        <div className="ed-study__a-copy">
          <h2 id="ed-a-title">同样的改动，<br />为什么代价不同？</h2>
          <p className="ed-study__lead">任务 A 刚刚学完，模型留下一个参考解 {thetaA}。即将学习 B 时，所有参数都该被一样地保护吗？</p>
          <p>如果模型在旧任务上的预测对某个参数更敏感，移动它就更需要谨慎。EWC 用对角 Fisher 估计为每个 <span className="rk-math"><var>θ</var><sub>i</sub></span> 赋予权重 <span className="rk-math ed-study__importance"><var>F</var><sub>i</sub></span>：<strong className="ed-study__emphasis">并非所有参数，都应被<span className="ed-study__phrase">同等保护。</span></strong></p>
        </div>
        <figure className="ed-study__weights">
          <figcaption><span>三个参数，一份重要性切片</span><strong className="rk-math ed-study__importance"><var>F</var><sub>i</sub></strong></figcaption>
          <div className="ed-study__weight-list">{weights.map((weight, i) => <div className="ed-study__weight" key={i} data-weight={weight}>
            <span className="rk-math"><var>θ</var><sub>{i + 1}</sub></span>
            <div className="ed-study__weight-track"><span style={{ width: `${weight * 100}%` }} /></div>
            <span>{weight.toFixed(2)}</span>
          </div>)}</div>
          <p className="ed-study__micro-note">同等位移下，较大的权重意味着后续更高的二次代价；它不是“禁止移动”。</p>
          <p className="ed-study__caption">教学示意，非论文实验结果。条长只表示合成的 F<sub>i</sub>，不表示参数值。</p>
        </figure>
      </div>
      <p className="ed-study__handoff"><span>接下来</span>先保存“原来在哪里”与“哪些更敏感”。到了任务 B，这两份状态才会共同发挥作用。</p>
    </section>

    <section id="ed-b" className="ed-study__section ed-study__b" aria-labelledby="ed-b-title">
      <p className="ed-study__eyebrow">B / ALTERNATING CHRONICLE <span>EWC · 状态继承</span></p>
      <div className="ed-study__b-heading"><h2 id="ed-b-title">任务结束了，<br />什么被带到下一页？</h2><p>学习是先后发生的。参考位置与重要性却必须跨过任务边界，留给下一次训练读取。</p></div>
      <div className="ed-study__stage-control">
        <div className="ed-study__stage-control-label"><p>沿交接顺序，检查此刻已有的状态</p><Button variant="quiet" size="small" onClick={() => setStageIndex(0)}>重置交接</Button></div>
        <StepNav items={handoffStages} activeId={stage.id} onSelect={(id) => setStageIndex(handoffStages.findIndex((s) => s.id === id))} label="检查 EWC 交接阶段" compact />
        <div className="ed-study__ledger" aria-live="polite" aria-atomic="true" data-stage={stage.id}>
          <p className="ed-study__ledger-task">{stage.use}</p>
          <dl><div data-availability={stageIndex === 0 ? "generated" : "stored"}><dt>{thetaA}</dt><dd>{stage.reference}</dd></div><div data-availability={stageIndex < 2 ? "unavailable" : "stored"}><dt>{fisherA}</dt><dd>{stage.fisher}</dd></div></dl>
        </div>
      </div>
      <ol className="ed-study__chronicle" aria-label="EWC 交接顺序">
        <li className="ed-study__moment" data-stage="learn-a" data-phase={phase(0)} aria-current={stageIndex === 0 ? "step" : undefined}>
          <div className="ed-study__moment-copy"><h3>先完成任务 A</h3><p>在 A 上训练参数，得到参考解 {thetaA}。任务 B 此时尚未开始。</p></div>
          <span className="ed-study__axis-number">01</span>
          <div className="ed-study__moment-visual"><span className="ed-study__phase-label">{phaseLabel(0)}</span><span className="ed-study__caption">生成 / FROM TASK A</span><math display="block" aria-label="任务 A 训练得到 theta A 星"><msub><mi>D</mi><mi>A</mi></msub><mo>→</mo><msubsup data-state-object="reference"><mi>θ</mi><mi>A</mi><mo>*</mo></msubsup></math></div>
        </li>
        <li className="ed-study__moment ed-study__moment--reverse" data-stage="save" data-phase={phase(1)} aria-current={stageIndex === 1 ? "step" : undefined}>
          <div className="ed-study__moment-copy"><h3>把参考位置留下</h3><p>保存 {thetaA} 的数值副本。以后改变的是当前参数 θ，这份参考保持固定。</p></div>
          <span className="ed-study__axis-number">02</span>
          <div className="ed-study__moment-visual ed-study__stored"><span className="ed-study__phase-label">{phaseLabel(1)}</span><span className="ed-study__caption">保存 / REFERENCE</span><div className="ed-study__state-symbol">{thetaA}</div><p>留下位置，而非冻结当前模型</p></div>
        </li>
        <li className="ed-study__moment" data-stage="estimate" data-phase={phase(2)} aria-current={stageIndex === 2 ? "step" : undefined}>
          <div className="ed-study__moment-copy"><h3>再估计重要性</h3><p>在 A 的信息与参考解上估计 {fisherA}，与 {thetaA} 一起保留。它是逐参数的权重，不是 B 的新学习结果。</p></div>
          <span className="ed-study__axis-number">03</span>
          <div className="ed-study__moment-visual"><span className="ed-study__phase-label">{phaseLabel(2)}</span><span className="ed-study__caption">交接 / TWO STORED OBJECTS</span><div className="ed-study__state-pair">{thetaA}<span>＋</span>{fisherA}</div><p>位置 + 重要性</p></div>
        </li>
        <li className="ed-study__moment ed-study__moment--reverse" data-stage="use-b" data-phase={phase(3)} aria-current={stageIndex === 3 ? "step" : undefined}>
          <div className="ed-study__moment-copy"><h3>在任务 B 中读取</h3><p>B 的损失驱动新学习；保存的 {thetaA} 与 {fisherA} 共同决定偏离旧解的代价。约束是软的，参数仍可更新。</p></div>
          <span className="ed-study__axis-number">04</span>
          <div className="ed-study__moment-visual ed-study__penalty"><span className="ed-study__phase-label">{phaseLabel(3)}</span><span className="ed-study__caption">使用 / IN TASK B</span><math display="block" aria-label="EWC 惩罚 lambda 除以二，乘以各参数重要性与位移平方之和"><mfrac><mi>λ</mi><mn>2</mn></mfrac><munder><mo>∑</mo><mi>i</mi></munder><msub data-state-object="importance"><mi>F</mi><mrow><mi>A</mi><mo>,</mo><mi>i</mi></mrow></msub><msup><mrow><mo>(</mo><msub><mi>θ</mi><mi>i</mi></msub><mo>−</mo><msubsup data-state-object="reference"><mi>θ</mi><mrow><mi>A</mi><mo>,</mo><mi>i</mi></mrow><mo>*</mo></msubsup><mo>)</mo></mrow><mn>2</mn></msup></math><p>λ 调节旧任务约束的强度</p></div>
        </li>
      </ol>
      <p className="ed-study__handoff"><span>带走的认识</span>保存的不是过去的训练过程，而是供下一任务使用的参考位置与重要性。</p>
    </section>

    <section id="ed-c" className="ed-study__section ed-study__c" aria-labelledby="ed-c-title">
      <p className="ed-study__eyebrow">C / ASYMMETRIC COMPARISON <span>LwF · 联合优化阶段</span></p>
      <h2 id="ed-c-title">teacher 给出旧响应目标；<br /><em>student 接收更新。</em></h2>
      <p className="ed-study__c-intro">同一批当前任务输入 x，一边问“以前怎样回答”，另一边同时学习“现在怎样回答”。两次比较，指向同一个可训练对象。</p>
      <div className="ed-study__roles">
        <aside className="ed-study__teacher" aria-label="固定 teacher">
          <p className="ed-study__role-label">01 / 固定参照</p><h3>teacher</h3><p>旧模型副本 → 旧类响应目标</p>
          <p className="ed-study__frozen">固定 · 不接收梯度</p>
          <p className="ed-study__caption">这里简写为 teacher；原方法可预先记录这些响应，无需每一步重复运行旧模型。</p>
        </aside>
        <div className="ed-study__student" aria-label="可训练 student">
          <p className="ed-study__role-label">02 / 可训练对象</p><h3>student <span>共享表示 → 两路输出</span></h3>
          <div className="ed-study__signal" data-loss="old"><span>旧类输出</span><p>与 teacher 的旧响应目标比较</p><strong className="rk-math" data-loss-term="old"><var>L</var><sub>old</sub></strong></div>
          <div className="ed-study__signal" data-loss="new"><span>新类输出</span><p>与当前任务的真实标签比较</p><strong className="rk-math" data-loss-term="new"><var>L</var><sub>new</sub></strong></div>
          <p className="ed-study__caption">旧路保留响应，新路学习标签；两路都经过 student 的共享表示。</p>
        </div>
      </div>
      <div className="ed-study__convergence">
        <div><span className="ed-study__caption">两路学习信号，先组成同一个目标</span><math display="block" aria-label="目标 J 等于 lambda old 乘 L old 加 L new 加 R"><mi>J</mi><mo>=</mo><mrow data-loss="old"><msub><mi>λ</mi><mi>o</mi></msub><msub data-loss-term="old"><mi>L</mi><mtext>old</mtext></msub></mrow><mo>+</mo><msub data-loss="new" data-loss-term="new"><mi>L</mi><mtext>new</mtext></msub><mo>+</mo><mi>R</mi></math></div>
        <div className="ed-study__gradient"><p>再对 student 的可训练参数求导</p><math display="block" aria-label="对 student 参数 theta student 求目标 J 的梯度"><msub><mo>∇</mo><msub><mi>θ</mi><mtext>student</mtext></msub></msub><mi>J</mi></math></div>
        <div className="ed-study__update" data-update-target="student"><span aria-hidden="true">↓</span><strong>只更新 student</strong><p>共享参数 + 旧任务头 + 新任务头</p></div>
      </div>
      <p className="ed-study__caption ed-study__formula-note">机制简写，对应 LwF §3、式 (1)–(5) 的联合优化阶段：L<sub>old</sub> 使用温度变换并重新归一化的分布；λ<sub>o</sub> 为旧损失权重，R 为权重衰减。此前 warm-up 只训练新任务参数；这里不展开批次平均与完整训练流程。</p>
      <p className="ed-study__proposition">保留旧响应，<strong>不等于冻结 student。</strong></p>
    </section>
    <footer className="ed-study__sources"><span>机制依据</span><a href="https://arxiv.org/pdf/1612.00796" target="_blank" rel="noreferrer">EWC · §2 / Eq. (3)</a><a href="https://arxiv.org/pdf/1606.09282" target="_blank" rel="noreferrer">LwF · §3 / Eq. (1)–(5)</a><p>本页为构图候选，等待人工评审。</p></footer>
  </article>;
}
