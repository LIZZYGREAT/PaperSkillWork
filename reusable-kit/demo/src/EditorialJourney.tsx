import { useEffect, useState } from "react";
import { JourneyArtDirection as JourneyArtDirectionView, JourneyDiagramScene, JourneyReviewSwitcher, Loss, theta } from "./JourneyArtDirection";
import type { JourneyArtDirection } from "./JourneyArtDirection";
import "./editorial-journey.css";

export const journeySections = [
  { id: "journey-question", title: "新知识与旧响应" },
  { id: "journey-map", title: "先看全局" },
  { id: "journey-paths", title: "两次比较" },
  { id: "journey-student", title: "一个可训练主体" },
  { id: "journey-handoff", title: "在任务边界交接" },
];

function readArtDirection(): JourneyArtDirection {
  const requested = new URLSearchParams(window.location.search).get("art");
  return requested === "stage" || requested === "reveal" ? requested : "baseline";
}

export function EditorialJourney() {
  const [stepId, setStepId] = useState("overview");
  const [artDirection, setArtDirection] = useState<JourneyArtDirection>(readArtDirection);
  useEffect(() => {
    const syncFromLocation = () => setArtDirection(readArtDirection());
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  const selectArtDirection = (next: JourneyArtDirection) => {
    const candidates = journeySections.map(section => {
      const element = document.getElementById(section.id);
      return element ? { id: section.id, top: element.getBoundingClientRect().top, element } : null;
    }).filter((item): item is { id: string; top: number; element: HTMLElement } => Boolean(item));
    const active = candidates.sort((left, right) => Math.abs(left.top - 110) - Math.abs(right.top - 110))[0];
    const url = new URL(window.location.href);
    if (next === "baseline") url.searchParams.delete("art");
    else url.searchParams.set("art", next);
    if (active) url.hash = active.id;
    window.history.replaceState(null, "", url);
    setArtDirection(next);
    if (active) requestAnimationFrame(() => document.getElementById(active.id)?.scrollIntoView({ behavior: "auto", block: "start" }));
  };

  return <article className="journey" data-demo-view="journey" data-art-direction={artDirection} aria-label="LwF 完整阅读实验">
    <JourneyReviewSwitcher value={artDirection} onChange={selectArtDirection} />
    <header id="journey-question" className="journey-opening">
      <p className="journey-kicker">READING JOURNEY <span>Learning without Forgetting / 01</span></p>
      <h1>新知识进来了，<br /><em>旧响应还能留下吗？</em></h1>
      <p className="journey-lead">新任务带来了图像与标签，旧任务的训练数据却已不可用。只按新标签微调，共享表示可能改变，连带改变旧任务的预测。LwF 要给这次学习加上一份旧响应参照。</p>
      <div className="journey-tension"><p><span>新任务</span>学会当前标签</p><p><span>旧任务</span>保留已有响应</p><a href="#journey-map">同一输入，怎样兼顾两者？ <b aria-hidden="true">↓</b></a></div>
    </header>

    {artDirection === "baseline" ? <>
      <section id="journey-map" className="journey-map" aria-labelledby="journey-map-title">
        <header className="journey-map-heading"><div><p className="journey-kicker">02 / THE WHOLE SYSTEM</p><h2 id="journey-map-title">沿着同一个输入，先看全局。</h2></div><p>先认出对象，再沿两条路径读到最右侧。<br />深色节点标出参数更新的唯一落点。</p></header>
        <JourneyDiagramScene stepId={stepId} onStepChange={setStepId} />
        <p className="journey-bridge">地图已把两路输出放在眼前。下一步只问：它们分别拿什么作参照？</p>
      </section>

    <section id="journey-paths" className="journey-paths" aria-labelledby="journey-paths-title">
      <header className="journey-section-heading"><div><p className="journey-kicker">03 / TWO COMPARISONS</p><h2 id="journey-paths-title">两次比较，参照各有来处。</h2></div><p>同一份 Student 共享表示分出两个输出头：旧头对照 Teacher 留下的<strong className="journey-inline-emphasis">旧响应目标</strong>，新头对照当前任务的真实标签。先分清每次比较的来源与结果。</p></header>
      <div className="journey-comparison-lanes">
        <div className="journey-comparison-head" aria-hidden="true"><span>学习要求</span><span>比较的参照</span><span>Student 的预测</span><span>得到的损失</span></div>
        <div className="journey-comparison" role="group" aria-label="旧响应比较" data-comparison="old" data-target="target" data-prediction="oldOut" data-result="lOld">
          <p className="journey-comparison-purpose"><strong>保留旧响应</strong></p>
          <p data-comparison-field="target"><span>比较的参照</span>Teacher 旧响应目标<small>在当前新任务图像上预先记录</small></p>
          <p data-comparison-field="prediction"><span>Student 的预测</span>旧类输出<small>来自 Student 旧任务头</small></p>
          <p className="journey-comparison-result" data-comparison-field="result"><Loss kind="old" /><small>旧响应偏差</small></p>
        </div>
        <div className="journey-comparison" role="group" aria-label="新任务比较" data-comparison="new" data-target="label" data-prediction="newOut" data-result="lNew">
          <p className="journey-comparison-purpose"><strong>学会新任务</strong></p>
          <p data-comparison-field="target"><span>比较的参照</span>当前任务真实标签<small>只监督新类输出</small></p>
          <p data-comparison-field="prediction"><span>Student 的预测</span>新类输出<small>来自 Student 新任务头</small></p>
          <p className="journey-comparison-result" data-comparison-field="result"><Loss kind="new" /><small>新任务分类误差</small></p>
        </div>
      </div>
      <div className="journey-comparison-notes"><p className="journey-comparison-note"><b>旧路比较响应。</b>两边概率先经过温度变换并重新归一化，再计算蒸馏交叉熵；约束的是响应关系，而非冻结 Student 的旧参数。Teacher 目标不需要重新读取旧训练集。</p><p className="journey-comparison-note"><b>新路比较标签。</b>真实标签与新头概率计算分类交叉熵。两个损失各自成立后，下一步才是让它们共同约束同一个学习者。</p></div>
    </section>

    <section id="journey-student" className="journey-optimization" aria-labelledby="journey-student-title">
      <header className="journey-section-heading"><div><p className="journey-kicker">04 / ONE LEARNER</p><h2 id="journey-student-title">两种要求，汇成 Student 的一次更新。</h2></div><p>沿着刚才的两个损失继续：先合成联合目标，再对同一组 Student 参数求梯度。Teacher 留下参照，Student 承担学习。</p></header>
      <div className="journey-student" data-role="student" data-state="trainable" data-stage="joint">
        <header className="journey-student-identity"><div><span className="journey-kicker">TRAINABLE · 联合优化阶段</span><h3>Student</h3></div><p data-parameter-definition>{theta} 统称此处的共享表示、旧任务头和新任务头参数；原文的同名记号只指共享参数。</p></header>
        <div className="journey-calculation">
          <div className="journey-calculation-stage"><p className="journey-calculation-label">01 · 两路比较结果</p><div className="journey-stage-body journey-loss-inputs"><span data-loss-source="old"><Loss kind="old" /></span><span className="journey-source-join">与</span><span data-loss-source="new"><Loss kind="new" /></span></div><p className="journey-calculation-note">分别来自旧路比较与新路比较</p></div>
          <div className="journey-calculation-stage"><p className="journey-calculation-label">02 · 合成联合目标</p><div className="journey-stage-body"><math display="block" data-equation="objective" aria-label="联合目标 J 等于 lambda o 乘 L old 加 L new 加 R"><mi>J</mi><mo>=</mo><msub><mi>λ</mi><mi>o</mi></msub><msub><mi>L</mi><mtext>old</mtext></msub><mo>+</mo><msub><mi>L</mi><mtext>new</mtext></msub><mo>+</mo><mi>R</mi></math></div><p className="journey-calculation-note"><span className="journey-nowrap"><var>λ</var><sub>o</sub>：旧损失权重</span>；<span className="journey-nowrap"><var>R</var>：权重衰减</span></p></div>
          <div className="journey-calculation-stage"><p className="journey-calculation-label">03 · 更新 Student 参数</p><div className="journey-stage-body"><math display="block" data-equation="parameter-update" aria-label="theta s 赋值为 theta s 减 eta 乘 J 对 theta s 的梯度"><msub><mi>θ</mi><mi>s</mi></msub><mo>←</mo><msub><mi>θ</mi><mi>s</mi></msub><mo>−</mo><mi>η</mi><msub><mo>∇</mo><msub><mi>θ</mi><mi>s</mi></msub></msub><mi>J</mi></math></div><p className="journey-calculation-note">梯度下降教学示意；<var>η</var> 为步长</p></div>
        </div>
        <p className="journey-student-conclusion" data-update-target="student">两路损失，都改变 Student。<span data-role="teacher" data-state="frozen">Teacher 始终冻结，只提供参照。</span></p>
      </div>
      <div className="journey-training-notes"><b>阶段限定</b><p data-training-phase="warm-up">原文先 warm-up：固定共享参数和旧头，只训练新增任务头；随后才联合训练三组参数。上面的场景表示联合阶段，更新式不限定论文的具体优化器。</p></div>
      <details className="journey-temperature"><summary>温度变换如何对应刚才的旧路比较？</summary><div className="journey-temperature-content"><p>Teacher 旧目标与 Student 旧预测分别做同一温度变换，再计算旧损失。<var>p</var> 为其中任意一个概率向量。<span className="journey-nowrap" data-temperature-setting>原文采用 <var>T</var> = 2。</span></p><div className="journey-temperature-equation"><math display="block" aria-label="p prime i 等于 p i 的一除以 T 次幂，除以所有类别 j 对应幂的和"><msubsup><mi>p</mi><mi>i</mi><mo>′</mo></msubsup><mo>=</mo><mfrac><msup><msub><mi>p</mi><mi>i</mi></msub><mfrac><mn>1</mn><mi>T</mi></mfrac></msup><mrow><munder><mo>∑</mo><mi>j</mi></munder><msup><msub><mi>p</mi><mi>j</mi></msub><mfrac><mn>1</mn><mi>T</mi></mfrac></msup></mrow></mfrac></math></div></div></details>
    </section>
    </> : <JourneyArtDirectionView direction={artDirection} stepId={stepId} onStepChange={setStepId} />}

    <section id="journey-handoff" className="journey-handoff" aria-labelledby="journey-handoff-title">
      <header className="journey-section-heading"><div><p className="journey-kicker">05 / AT THE TASK BOUNDARY</p><h2 id="journey-handoff-title">更新在任务内，交接在任务之间。</h2></div><p>本轮联合训练改变 Student 的共享表示与两个任务头；固定 Teacher 不随每次梯度更新同步变化。训练结束后，学好的模型保留下来，成为下一任务的旧模型参照。</p></header>
      <ol className="journey-timeline"><li><span>本任务内</span><strong>Teacher 固定</strong><small>Student 持续学习</small></li><li><span>任务边界</span><strong>保留训练后的模型</strong><small>既有头一起继承</small></li><li><span>下一任务开始</span><strong>在新输入上记录旧响应</strong><small>加入新头，再开始训练</small></li></ol>
      <div className="journey-closing"><p className="journey-proposition">下一任务继承的是模型。</p><p className="journey-boundary-note">旧响应目标要在下一份输入上重新生成。当前任务缓存的响应并不是适用于所有未来样本的记忆库，保留效果也受新旧数据分布关系影响。</p></div>
      <p className="journey-source">机制依据：<a href="https://arxiv.org/abs/1606.09282v3">Li &amp; Hoiem · Learning without Forgetting, v3</a>，§3，Eq.(1)–(4)，Fig.3；顺序任务见 §4.3。Teacher / Student 为本页教学命名，系统地图为机制示意。</p>
    </section>
  </article>;
}
