import ModelMark from "./ModelMark";
import type { ModelClass } from "./ModelPixel";
import { useState } from "react";
import { ResponseMeter } from "../../shared/foundation/visual-parts/ResponseMeter";
import { Equation, KLDefinition, KLDecomposition } from "../MathNotation";
import { PROBABILITY_CLASSES, REFERENCE_P, PROBABILITY_CASES, probabilityComparison, formatValue } from "../math-model";
import { Term, ReferenceButton } from "../Reference";

const stages = ["观察分布", "同类比较", "加权贡献", "汇总 KL"];
const parts = ["pₖ · 旧概率", "qₖ · 当前概率", "log(pₖ/qₖ) · 比较方向", "Σ · 所有类别"];
export default function KLPrototype() {
  const [selected, setSelected] = useState(0);
  const [stage, setStage] = useState(0);
  const [category, setCategory] = useState(0);
  const [part, setPart] = useState(0);
  const result = probabilityComparison(REFERENCE_P, PROBABILITY_CASES[selected].values);
  const ratio = result.p[category] / result.q[category];
  const choosePart = (index: number) => { setPart(index); setStage(index === 3 ? 3 : 1); };
  const goToStage = (next: number) => { setStage(next); setPart((current) => next === 3 ? 3 : current === 3 ? 0 : current); };
  return <section id="review-kl" className="review-scene" data-core-items="I03" data-kl-stage={stage} data-formula-part={part}>
    <header><p className="eyebrow">U2 · 概率比较工作区</p><h1>两组概率的差异，怎样汇成一个 KL？</h1><p>计算 <Term id="kl">KL 散度</Term>：固定旧行为 <Term id="p">p</Term>，观察当前预测 <Term id="q">q</Term>。先比较同一类，再看它对整组差异的贡献。</p><p className="caption">p=(0.8,0.2) 与三个 q 是Claude / GPT 两类独立合成例（不含 DeepSeek 坐标）；DER 实际保留的是历史 logits。</p></header>
    <div className="review-stage-controls" role="group" aria-label="KL 计算阶段">{stages.map((name, index) => <button key={name} data-kl-step={index} aria-pressed={stage === index} onClick={() => goToStage(index)}><small>0{index + 1}</small>{name}</button>)}</div>
    <div className="kl-workspace">
      <div className="distribution-plot"><div className="plot-heading"><span>同一类别 · 点击聚焦</span><span>p 固定 / q 当前 · 统一尺度 0—1</span></div>
        {PROBABILITY_CLASSES.map((label, index) => <div key={label} className="distribution-row" data-category={index} data-focused={stage > 0 && (stage === 3 || category === index)}>
          <button aria-pressed={category === index} data-kl-category={index} onClick={() => { setCategory(index); setStage(1); if (part === 3) setPart(0); }}><ModelMark model={index as ModelClass} />{label}<small>k={index + 1}</small></button>
          <div data-probability-object="p" data-linked={stage > 0 && (stage === 3 || category === index) && (part === 0 || part > 1)}><ResponseMeter label={`p${index + 1} · 旧`} value={result.p[index]} min={0} max={1} showScale={false} /></div>
          <div data-probability-object="q" data-linked={stage > 0 && (stage === 3 || category === index) && part > 0}><ResponseMeter label={`q${index + 1} · 当前`} value={result.q[index]} min={0} max={1} showScale={false} /></div>
        </div>)}
        <div className="case-controls" role="group" aria-label="原型切换当前概率">{PROBABILITY_CASES.map((item, index) => <button key={item.id} data-review-q={item.id} aria-pressed={selected === index} onClick={() => { setSelected(index); setStage(0); setPart(0); setCategory(0); }}>{item.label}</button>)}</div>
        <div className="contribution-chart" aria-label="带符号的类别贡献，统一尺度负 1.2 至正 1.2" data-revealed={stage >= 2}>
          <p className="figure-label">{stage < 2 ? "下一步：将每类比较变成带符号的贡献" : "每类贡献 pₖ log(pₖ/qₖ) · 中线为 0"}</p>
          {stage >= 2 && result.terms.map((value, index) => <div className="contribution-line" key={index} data-contribution={value}><span>{PROBABILITY_CLASSES[index]}</span><div className="signed-track"><i className={value < 0 ? "negative" : "positive"} style={{ left: `${50 + Math.min(0, value) / 2.4 * 100}%`, width: `${Math.abs(value) / 2.4 * 100}%` }} /></div><output>{value > 0 ? "+" : ""}{formatValue(value)}</output></div>)}
        </div>
      </div>
      <div className="calculation-focus" aria-live="polite"><p className="eyebrow">{stages[stage]}</p>
        <KLDefinition focus={stage > 0 ? part : undefined} onSelect={choosePart} /><p>k 为类别编号；C 为共同类别数，本例 C=2。</p>
        <div className="formula-parts" role="group" aria-label="选择 KL 公式项">{parts.map((label, index) => <button key={label} data-formula-select={index} aria-pressed={part === index && stage > 0} onClick={() => choosePart(index)}>{label}</button>)}</div>
        {stage === 0 ? <p>p=(0.8, 0.2) 是参照。两次都判Claude，也可能分配不同的概率。选一个类别，沿着公式观察。</p> : stage === 3 ? <><p>保留各项符号，再把所有类别相加。</p><Equation label="两个类别的贡献相加得到 KL"><mn>{formatValue(result.terms[0])}</mn><mo>+</mo><mo>(</mo><mn>{formatValue(result.terms[1])}</mn><mo>)</mo><mo>≈</mo><mn>{formatValue(result.kl)}</mn></Equation><output className="review-total" data-review-kl={result.kl}>KL ≈ {formatValue(result.kl)}</output><p>显示值保留三位小数。单项可负，完整 KL 非负。{PROBABILITY_CASES[selected].conclusion}</p></> : <><h3>{PROBABILITY_CLASSES[category]} · 第 {category + 1} 类</h3><p data-comparison-direction>pₖ={result.p[category]}，qₖ={result.q[category]}。{part === 0 ? "旧概率是这一项的权重，切换 q 时保持不变。" : part === 1 ? "当前概率是比较对象，来自当前预测。" : `比值为 ${formatValue(ratio)}，对数为 ${formatValue(Math.log(ratio))}；${ratio < 1 ? "q 分得更多，这一项为负。" : ratio > 1 ? "q 分得更少，这一项为正。" : "相等时这一项为 0。"}`}</p>{stage >= 2 && <><Equation label="当前类别的旧概率乘以对数比，得到带符号贡献"><mn>{result.p[category]}</mn><mo>×</mo><mi mathvariant="normal">log</mi><mfrac><mn>{result.p[category]}</mn><mn>{result.q[category]}</mn></mfrac><mo>≈</mo><mn>{formatValue(result.terms[category])}</mn></Equation><p>这是该类别的贡献，还不是完整 KL。{result.terms[category] < 0 ? "负贡献不会单独作为一个非负惩罚。" : "还需要和另一类一起求和。"}</p></>}</>}
      </div>
    </div>
    <div className="review-transport"><button onClick={() => { setStage(0); setPart(0); setCategory(0); }}>重置过程</button><button disabled={stage === 0} onClick={() => goToStage(stage - 1)}>上一步</button><button disabled={stage === 3} onClick={() => goToStage(stage + 1)}>下一步</button><span>单步观察 · 无自动播放</span></div>
    <section className="review-derivation"><h3>为什么可以把它当训练目标？</h3><p>拆开 log(pₖ/qₖ)，就能分出当前网络可改变的部分和固定基准。k 是类别编号；C 是共同类别数，本例为 2。</p><KLDecomposition /><div className="entropy-explanation"><p><span>H(p,q)</span>按旧概率加权的交叉熵，随 q 改变：{formatValue(result.crossEntropy)}。</p><p><span>H(p)</span>仅由固定 p 决定的熵：{formatValue(result.entropy)}，切换时不变。</p></div><p>因此，降低 KL 等价于降低 H(p,q)。这里 p 是历史软目标，并不是新的真实标签。</p><ReferenceButton term="kl">查看 KL 的证明与梯度</ReferenceButton></section>
  </section>;
}
