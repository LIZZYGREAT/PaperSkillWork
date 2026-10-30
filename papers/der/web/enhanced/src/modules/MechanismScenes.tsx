import { useState } from "react";
import { ResponseMeter } from "../shared/foundation/visual-parts/ResponseMeter";
import { CLASSES, HISTORY_Z, RESPONSE_CASES, responseComparison, formatValue } from "./math-model";
import { KLDefinition, SquaredDefinition, Equation } from "./MathNotation";
import { ReferenceButton } from "./Reference";
import "./teaching-front.css";
import "./mechanism-scenes.css";

const vector = (v: readonly number[], digits = 0) => `(${v.map(x => formatValue(x, digits)).join(", ")})`;
function ResponseSpace({ probability, result }: { probability?: boolean; result: ReturnType<typeof responseComparison> }) {
  return <section className="response-space" aria-label={probability ? "概率分布" : "原始 logits"}>
    <h4>{probability ? "概率分布" : "原始 logits"}</h4>
    <p className="caption">{probability ? "p=softmax(z)，q=softmax(a) · 尺度 0–1" : "同类分数直接比较 · 共同尺度 0–3"}</p>
    <div className="response-legend"><span>□ 历史{probability ? " p" : " z"} · 固定</span><span>● 当前{probability ? " q" : " a"}</span></div>
    {CLASSES.map((name, k) => <div className="response-coordinate" key={name}><strong>{name}</strong>
      <div className="history-response"><ResponseMeter label={probability ? "p" : "z"} value={probability ? result.p[k] : result.z[k]} min={0} max={probability ? 1 : 3} showScale={false} /></div>
      <div className="current-response"><ResponseMeter label={probability ? "q" : "a"} value={probability ? result.q[k] : result.a[k]} min={0} max={probability ? 1 : 3} showScale={false} /></div>
    </div>)}
  </section>;
}
export default function ResponseComparison() {
  const [selected, setSelected] = useState(1);
  const r = responseComparison(selected);
  return <div className="response-lesson" data-core-items="I03 I04">
    <p className="front-lead">上一节已经看见，同一个 x₁ 的最高类别可以不变，整组响应却发生偏移。现在固定历史 z={vector(HISTORY_Z)}，寻找一个能训练当前模型的约束。</p>
    <section className="math-explanation kl-explanation"><div><p className="eyebrow">候选一 · 在概率空间中比较</p><h3>把过去的概率，作为固定目标。</h3><p>先将两组分数变成概率：p=softmax(z) 是固定的旧概率，q=softmax(a) 来自当前网络。用旧概率 pₖ 加权每一类的对数比，再求和，就得到有方向的 <strong>KL 散度</strong>。</p><p>它回答：当前分配 q 对固定旧分布 p 偏离多少？这里的方向始终是 p ∥ q。</p></div>
      <div className="math-panel"><KLDefinition /><p>k 对齐同一个类别；pₖ 不训练，qₖ 随当前参数 θ 改变。</p><Equation label="KL 对当前 logit a k 的梯度为 q k 减 p k"><mfrac><mrow><mo>∂</mo><msub><mi>D</mi><mtext>KL</mtext></msub></mrow><mrow><mo>∂</mo><msub><mi>a</mi><mi>k</mi></msub></mrow></mfrac><mo>=</mo><msub><mi>q</mi><mi>k</mi></msub><mo>−</mo><msub><mi>p</mi><mi>k</mi></msub></Equation><p>当 qₖ&lt;pₖ，梯度下降倾向提高该类相对分数；qₖ&gt;pₖ 时反向调整。</p><ReferenceButton term="kl">KL 的方向与更多背景</ReferenceButton></div>
    </section>
    <details className="math-derivation"><summary>为什么输出梯度是 q−p？</summary><p>展开 log qₖ=aₖ−log Σⱼ exp(aⱼ)，得到 KL=Σₖ pₖ log pₖ−Σₖ pₖaₖ+log Σⱼ exp(aⱼ)。第一项固定，且 Σₖpₖ=1，所以对 aₖ 求导为 −pₖ+qₖ。</p><p>也就是 KL=H(p,q)−H(p)。H(p) 不随 q 改变，优化当前参数时，最小化 KL 与最小化软标签交叉熵等价。KL 非负，但各项 pₖ log(pₖ/qₖ) 可以为负；交换 p、q 通常改变结果。</p></details>
    <section className="math-explanation squared-explanation"><div className="math-panel"><SquaredDefinition /><Equation label="平方匹配对当前 logits 的梯度为二倍 a 减 z"><msub><mi>∇</mi><mi>a</mi></msub><msub><mi>L</mi><mtext>dark</mtext></msub><mo>=</mo><mn>2</mn><mo>(</mo><mi>a</mi><mo>−</mo><mi>z</mi><mo>)</mo></Equation><p>默认比较 a={vector(RESPONSE_CASES[1].values)}：差值 {vector(responseComparison(1).differences)}，平方和 {responseComparison(1).squaredDistance}，输出梯度 {vector(responseComparison(1).gradient)}。</p><ReferenceButton term="squared">平方匹配的更多推导</ReferenceButton></div>
      <div><p className="eyebrow">候选二 · 回到原始分数</p><h3>模型已经产生 logits，能直接比较吗？</h3><p>可以。把当前 a 与固定 z 按类别相减、平方后求和，正负偏离就不会互相抵消。这就是 <strong>Logit Matching</strong>。</p><p>梯度 2(a−z) 给出输出层的调整方向，再经当前网络反向传播至 θ。历史 z 始终作为常量，无须再训练一台旧网络。</p></div>
    </section>
    <section className="response-lab" data-design="response-comparison" data-case={RESPONSE_CASES[selected].id} data-z={r.z.join(",")} data-a={r.a.join(",")} data-p={r.p.join(",")} data-q={r.q.join(",")} data-kl={r.probabilityKL} data-l2={r.squaredDistance}>
      <header><p className="eyebrow">同一输入 x₁ · 两种表示，同一组数据</p><h3>换一种变化，检验两种约束。</h3><p>历史目标一直固定。切换当前 a，观察概率与原始分数如何一起变化。</p></header>
      <div className="response-cases" role="group" aria-label="响应比较情形">{RESPONSE_CASES.map((item, i) => <button key={item.id} data-response-case={item.id} aria-pressed={i === selected} onClick={() => setSelected(i)}>{item.label}</button>)}</div>
      <div className="response-spaces"><ResponseSpace probability result={r} /><ResponseSpace result={r} /></div>
      <div className="response-losses" aria-live="polite"><p><span>概率约束 · KL(p ∥ q)</span><strong data-kl-value>{formatValue(r.probabilityKL, 4)}</strong><small>输出梯度 q−p = {vector(r.klGradient, 3)}</small></p><p><span>分数约束 · ‖a−z‖²</span><strong data-l2-value>{r.squaredDistance}</strong><small>输出梯度 2(a−z) = {vector(r.gradient)}</small></p></div>
      <p className="response-verdict" aria-live="polite">{RESPONSE_CASES[selected].conclusion}</p>
      {selected === 2 && <details className="math-derivation"><summary>共同平移为什么不改变概率？</summary><p>softmax(z+c1) 的分子、分母都乘上 exp(c)，相除后抵消。本例每类加 1，原始分数差却是三个 1，平方和为 3。</p></details>}
    </section>
    <p className="comparison-conclusion">两个损失都能约束历史响应，但保留的信息不同。softmax 对统一加常数不敏感，logits 平方匹配会约束这一变化。这个反例不说明 KL 永远更差，也不说明两种损失恒等。</p>
    <div className="front-handoff"><p>现在已经能把历史响应的变化变成训练损失。DER 选择直接比较 logits。<br /><strong>但这份过去的 logits 从哪里获得？是否必须保存整个旧模型？</strong></p><a href="#U3-logit-memory">追踪历史监督的来源 ↓</a></div>
  </div>;
}
