import { useState } from "react";
import { DiagramFlow } from "../../foundation/layout/DiagramFlow";
import { StepNav } from "../../compositions/step-nav";
import { lwfGraph, lwfGraphSteps, lwfNavItems } from "./figures";
import "./editorial-journey.css";

export const journeySections = [
  { id: "journey-question", title: "新知识与旧响应" },
  { id: "journey-map", title: "先看全局" },
  { id: "journey-paths", title: "两次比较" },
  { id: "journey-student", title: "一个可训练主体" },
  { id: "journey-handoff", title: "在任务边界交接" },
];

// Same authoritative objects, geometry, endpoints and step IDs. Only this
// experiment distinguishes comparison/update edges and explains their meaning.
const journeyGraph = {
  ...lwfGraph,
  edges: lwfGraph.edges.map(edge => ({ ...edge, kind: edge.to === "update" ? "gradient" as const : ["lOld", "lNew"].includes(edge.to) ? "control" as const : "data" as const })),
  legend: [
    { id: "forward", text: "实线：前向计算", swatch: "solid" as const },
    { id: "gradient", text: "虚线：损失对 Student 的更新作用", swatch: "gradient" as const },
    ...lwfGraph.legend!.filter(item => item.id !== "flow"),
  ],
  note: "点线进入损失：将目标与预测送入比较；虚线进入更新：表示梯度作用归属，并非额外的前向输出。",
};

function Loss({ kind }: { kind: "old" | "new" }) {
  return <span className="rk-math" data-loss={kind}><var>L</var><sub>{kind}</sub></span>;
}
const theta = <span className="rk-math"><var>θ</var><sub>s</sub></span>;

export function EditorialJourney() {
  const [stepId, setStepId] = useState("overview");
  const current = lwfGraphSteps.find(step => step.id === stepId);
  return <article className="journey" data-demo-view="journey" aria-label="LwF 完整阅读实验">
    <header id="journey-question" className="journey-opening">
      <p className="journey-kicker">READING JOURNEY <span>Learning without Forgetting / 01</span></p>
      <h1>新知识进来了，<br /><em>旧响应还能留下吗？</em></h1>
      <p className="journey-lead">新任务带来了图像与标签，旧任务的训练数据却已不可用。只按新标签微调，共享表示可能改变，连带改变旧任务的预测。LwF 要给这次学习加上一份旧响应参照。</p>
      <div className="journey-tension"><p><span>新任务</span>学会当前标签</p><p><span>旧任务</span>保留已有响应</p><a href="#journey-map">同一输入，怎样兼顾两者？ <b aria-hidden="true">↓</b></a></div>
    </header>

    <section id="journey-map" className="journey-map" aria-labelledby="journey-map-title">
      <header className="journey-map-heading"><div><p className="journey-kicker">02 / THE WHOLE SYSTEM</p><h2 id="journey-map-title">沿着同一个输入，先看全局。</h2></div><p>先认出对象，再沿两条路径读到最右侧。<br />深色节点标出参数更新的唯一落点。</p></header>
      <div className="journey-map-scene" data-focus-step={stepId}>
        <div className="journey-map-caption"><p role="status" aria-live="polite"><strong>{current?.title ?? "全局概览 · 所有对象同时可见"}</strong><span>{current?.note ?? "Teacher 提供固定参照；Student 承担预测与学习。选择下方步骤，沿同一张图定位。"}</span></p><button type="button" onClick={() => setStepId("overview")} aria-pressed={stepId === "overview"}>恢复概览</button></div>
        <DiagramFlow spec={journeyGraph} focus={current ? { nodes: current.nodes, edges: current.edges } : undefined} label="LwF 完整阅读系统地图" framed={false} />
        <StepNav items={lwfNavItems} activeId={stepId} onSelect={setStepId} label="完整阅读实验：选择机制步骤" />
      </div>
      <p className="journey-bridge">地图已把两路输出放在眼前。下一步只问：它们分别拿什么作参照？</p>
    </section>

    <section id="journey-paths" className="journey-paths" aria-labelledby="journey-paths-title">
      <aside><p className="journey-kicker">03 / TWO COMPARISONS</p><p>回看地图中的<br /><b>目标 / 预测 / 标签</b></p><p className="journey-aside-note">Teacher 的响应来自当前新任务图像，而非重新读取旧训练集；原文先记录这些响应，训练时可直接读取。</p></aside>
      <div className="journey-paths-copy"><h2 id="journey-paths-title">两次比较，参照各有来处。</h2>
        <p>Teacher 在当前输入上留下<strong className="journey-inline-emphasis">旧响应目标</strong>。Student 旧头给出的预测要接近它；新头则面对当前任务的真实标签。两路预测来自同一份 Student 共享表示，但监督来源不同。</p>
        <div className="journey-comparison" data-comparison="old" data-target="target" data-prediction="oldOut" data-result="lOld"><p><span>固定参照</span>Teacher 旧响应目标</p><span className="journey-compare-sign" aria-label="与预测比较">↔</span><p><span>Student 预测</span>旧类输出</p><p className="journey-comparison-result"><Loss kind="old" /><small>旧响应偏差</small></p></div>
        <p className="journey-comparison-note">比较前，两边概率都经过温度变换并重新归一化，再计算蒸馏交叉熵。它保留的是响应关系，并不把 Student 的旧参数锁住。</p>
        <div className="journey-comparison" data-comparison="new" data-target="label" data-prediction="newOut" data-result="lNew"><p><span>真实监督</span>当前任务标签</p><span className="journey-compare-sign" aria-label="与预测比较">↔</span><p><span>Student 预测</span>新类输出</p><p className="journey-comparison-result"><Loss kind="new" /><small>新任务分类误差</small></p></div>
        <p className="journey-comparison-note">这里用新标签与新头概率计算分类交叉熵。两个损失各自成立后，还需要共同约束同一个学习者。</p>
      </div>
    </section>

    <section id="journey-student" className="journey-optimization" aria-labelledby="journey-student-title">
      <header><p className="journey-kicker">04 / ONE LEARNER</p><h2 id="journey-student-title">把两种要求，交给同一个 Student。</h2><p>比较已经完成。现在将它们写入联合目标，让保留旧响应和学习新任务共同影响参数。</p></header>
      <div className="journey-student" data-role="student" data-state="trainable" data-stage="joint">
        <header><div><span className="journey-kicker">TRAINABLE · 联合优化阶段</span><h3>Student</h3></div><p data-parameter-definition>{theta} 统称此处的共享表示、旧任务头和新任务头参数；原文的同名记号只指共享参数。</p></header>
        <div className="journey-loss-inputs"><p data-loss-source="old"><Loss kind="old" /><span>承接旧目标 ↔ 旧预测</span></p><p data-loss-source="new"><Loss kind="new" /><span>承接真实标签 ↔ 新预测</span></p></div>
        <div className="journey-equations">
          <div><p>联合目标 / 两种要求在这里汇合</p><math display="block" data-equation="objective" aria-label="联合目标 J 等于 lambda o 乘 L old 加 L new 加 R"><mi>J</mi><mo>=</mo><msub><mi>λ</mi><mi>o</mi></msub><msub><mi>L</mi><mtext>old</mtext></msub><mo>+</mo><msub><mi>L</mi><mtext>new</mtext></msub><mo>+</mo><mi>R</mi></math></div>
          <div><p>参数更新 / 梯度下降教学示意</p><math display="block" data-equation="parameter-update" aria-label="theta s 赋值为 theta s 减 eta 乘 J 对 theta s 的梯度"><msub><mi>θ</mi><mi>s</mi></msub><mo>←</mo><msub><mi>θ</mi><mi>s</mi></msub><mo>−</mo><mi>η</mi><msub><mo>∇</mo><msub><mi>θ</mi><mi>s</mi></msub></msub><mi>J</mi></math></div>
        </div>
        <p className="journey-student-conclusion" data-update-target="student">两路损失，都改变 Student。<span data-role="teacher" data-state="frozen">Teacher 始终冻结，只提供参照。</span></p>
      </div>
      <div className="journey-training-notes"><p data-training-phase="warm-up"><b>先 warm-up，再联合训练。</b>原文先固定共享参数和旧头，只训练新增任务头；随后才联合训练三组参数。上面的场景表示后一个阶段。</p><p><b>保留数学条件。</b><var>λ</var><sub>o</sub> 控制旧损失权重，<var>R</var> 是权重衰减正则项；<var>η</var> 为教学更新式的步长，不限定具体优化器。</p></div>
      <details className="journey-temperature"><summary>温度变换如何对应刚才的旧路比较？</summary><p>对 Teacher 旧目标与 Student 旧预测分别应用下式（<var>p</var> 为其中任意一个概率向量），再计算旧损失。原文采用 <var>T</var> = 2。</p><math display="block" aria-label="p prime i 等于 p i 的一除以 T 次幂，除以所有类别 j 对应幂的和"><msubsup><mi>p</mi><mi>i</mi><mo>′</mo></msubsup><mo>=</mo><mfrac><msup><msub><mi>p</mi><mi>i</mi></msub><mfrac><mn>1</mn><mi>T</mi></mfrac></msup><mrow><munder><mo>∑</mo><mi>j</mi></munder><msup><msub><mi>p</mi><mi>j</mi></msub><mfrac><mn>1</mn><mi>T</mi></mfrac></msup></mrow></mfrac></math></details>
    </section>

    <section id="journey-handoff" className="journey-handoff" aria-labelledby="journey-handoff-title">
      <p className="journey-kicker">05 / AT THE TASK BOUNDARY</p><h2 id="journey-handoff-title">更新在任务内，交接在任务之间。</h2>
      <p>本轮联合训练改变 Student 的共享表示与两个任务头；固定 Teacher 不随每次梯度更新同步变化。训练结束后，学好的模型保留下来，成为下一任务的旧模型参照。</p>
      <ol className="journey-timeline"><li><span>本任务内</span><strong>Teacher 固定</strong><small>Student 持续学习</small></li><li><span>任务边界</span><strong>保留训练后的模型</strong><small>既有头一起继承</small></li><li><span>下一任务开始</span><strong>在新输入上记录旧响应</strong><small>加入新头，再开始训练</small></li></ol>
      <p>下一任务继承的是模型；旧响应目标要在下一份输入上重新生成。当前任务缓存的响应并不是适用于所有未来样本的记忆库，保留效果也受新旧数据分布关系影响。</p>
      <p className="journey-proposition">留下旧行为的参照，<br />让同一个学习者继续改变。</p>
      <p className="journey-source">机制依据：<a href="https://arxiv.org/abs/1606.09282v3">Li &amp; Hoiem · Learning without Forgetting, v3</a>，§3，Eq.(1)–(4)，Fig.3；顺序任务见 §4.3。Teacher / Student 为本页教学命名，系统地图为机制示意。</p>
    </section>
  </article>;
}
