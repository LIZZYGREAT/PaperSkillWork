import { useState } from "react";
import { FigureFrame } from "../shared/compositions/figure-frame/FigureFrame";
import { ResponseMeter } from "../shared/foundation/visual-parts/ResponseMeter";
import { KLDecomposition, KLDefinition } from "./MathNotation";
import { formatValue, probabilityComparison, PROBABILITY_CASES, REFERENCE_P } from "./math-model";
import { ReferenceButton, Term } from "./Reference";

export default function ProbabilityConstraint() {
  const [selected, setSelected] = useState(0);
  const scenario = PROBABILITY_CASES[selected];
  const result = probabilityComparison(REFERENCE_P, scenario.values);
  return <div data-core-items="I03" className="probability-lesson" data-probability-case={scenario.id}>
    <p className="lesson-intro">前面看到，正确类别不变，整组响应仍可能改变。现在先用<strong>两类概率</strong>隔离这个问题：要比较的是旧行为的参考分布与当前预测分布，不是两次分类准确率。</p>
    <div className="probability-grid"><div className="concept-copy"><p className="eyebrow">先分清比较对象</p><h3>固定旧概率，<br />观察当前概率。</h3><p><Term id="p">p</Term> 是保存的旧概率，始终固定为 (0.8, 0.2)；<Term id="q">q</Term> 是当前网络的概率，本节只改变它。</p><p>两组都使用猫、狗这两个类别坐标，各项为正，加起来为 1。<Term id="kl" /> 衡量：以 q 代替参考 p 时，平均多付出多少对数损失。</p><p className="quiet-note">这是有方向的差异量，不是对称距离，也不是准确率。</p></div>
      <div className="probability-figure" data-vqa-stable-frame><FigureFrame label="比较概率空间" title="同一组类别，两份概率分配" note="条形尺度统一为 0—1；旧概率 p 不随切换改变。"><div className="probability-head"><span>类别</span><span className="reference-key">p · 固定旧目标</span><span className="current-key">q · 当前预测</span></div><div className="probability-rows">{["猫", "狗"].map((label, index) => <div className="probability-class" key={label}><strong>{label}</strong><ResponseMeter label={`p${index + 1}`} value={result.p[index]} min={0} max={1} showScale={false} /><ResponseMeter label={`q${index + 1}`} value={result.q[index]} min={0} max={1} showScale={false} /></div>)}</div><div className="case-controls" role="group" aria-label="切换当前概率 q">{PROBABILITY_CASES.map((item, index) => <button key={item.id} type="button" data-q-case={item.id} aria-pressed={selected === index} onClick={() => setSelected(index)}>{item.label}</button>)}</div><div className="kl-readout" aria-live="polite"><div><span>当前 KL</span><output data-kl-value={result.kl}>{formatValue(result.kl)}</output><small>自然对数</small></div><p>{scenario.conclusion}</p></div></FigureFrame></div>
    </div>
    <section className="math-story" aria-labelledby="kl-math-title"><div className="math-heading"><span className="eyebrow">让差异成为训练目标</span><h3 id="kl-math-title">按旧概率加权，逐类比较，再汇总。</h3></div><div className="variable-line"><span><b>k</b> 类别编号</span><span><b>C</b> 共同类别总数，本例为 2</span><span><b>pₖ / qₖ</b> 同一类别的旧 / 当前概率</span></div><KLDefinition /><div className="formula-reading"><p><strong>log(pₖ / qₖ)</strong> 比较同一类别的概率分配；乘上旧概率 pₖ，让旧模型更重视的类别在汇总中占更大权重。</p><p>最后对所有 k 求和，得到整组分布的偏离。某个类别的单项可以为负；<strong>非负的是完整 KL</strong>，不是每个单项。</p></div>
      <h3 className="derivation-title">为什么它可以用来训练？拆开一次对数比。</h3><p>利用 log(pₖ/qₖ)=log pₖ−log qₖ，把定义式重排为：</p><KLDecomposition /><div className="entropy-explanation"><p><span>H(p,q)</span> 用当前 q 作预测、按固定 p 加权的平均对数损失，也叫软标签交叉熵。</p><p><span>H(p)</span> 旧分布自身的基准量，只由固定 p 决定，本次优化时不变。</p></div><p className="math-conclusion">因此，<strong>降低 KL 就等价于降低第一部分 H(p,q)</strong>。当前网络可以通过梯度优化这个目标，让 q 靠近旧概率 p；不需要把历史分布变成新的真实标签。</p><div className="detail-link"><ReferenceButton term="kl">完整代入、梯度与非负性证明</ReferenceButton><span>核心定义和短推演已在主线给出</span></div>
    </section>
    <div className="bridge"><span className="bridge-number">下一步 03</span><p>概率约束已经是一个可行方案。<br /><strong>网络在 softmax 前还有原始分数，能否直接保存和比较它们？</strong></p><a href="#U3-logit-memory" aria-label="继续阅读 logits 匹配">继续 <span aria-hidden="true">↓</span></a></div>
  </div>;
}
