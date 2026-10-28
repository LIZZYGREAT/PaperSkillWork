import ModelPixel, { type ModelClass } from "./ModelPixel";
import { useState } from "react";
import { ResponseMeter } from "../../shared/foundation/visual-parts/ResponseMeter";
import { SquaredDefinition, ShiftIdentity, Equation } from "../MathNotation";
import { CLASSES, HISTORY_Z, LOGIT_CASES, logitComparison, formatValue } from "../math-model";
import { Term, ReferenceButton } from "../Reference";

const stages = ["对齐分数", "显示偏差", "平方贡献", "汇总损失"];
export default function LogitPrototype() {
  const [selected, setSelected] = useState(0);
  const [stage, setStage] = useState(0);
  const result = logitComparison(HISTORY_Z, LOGIT_CASES[selected].values);
  const y = (value: number) => 214 - value * 52;
  return <section id="review-logits" className="review-scene" data-core-items="I04" data-logit-stage={stage}>
    <header><p className="eyebrow">U3 · 同一类别的分数与概率</p><h2>先看偏差，再让平方形成损失。</h2><p>在 <Term id="logits">logits</Term> 空间，<Term id="z">历史 z</Term> 固定为 (2, 1, 0)，<Term id="a">当前 a</Term> 与它逐类对齐。切换共同平移，可同时观察原始分数与 <Term id="softmax" /> 概率。</p><p className="caption">Claude / GPT / DeepSeek 三类 logits 是独立合成对照，不是论文实验值或网络更新轨迹；与 U2 两类概率不属于同一次前向。</p></header>
    <div className="case-controls" role="group" aria-label="原型切换当前分数">{LOGIT_CASES.map((item, index) => <button key={item.id} data-review-a={item.id} aria-pressed={selected === index} onClick={() => { setSelected(index); setStage(0); }}>{item.label}</button>)}</div>
    <div className="review-stage-controls" role="group" aria-label="平方匹配阶段">{stages.map((label, index) => <button key={label} data-logit-step={index} aria-pressed={stage === index} onClick={() => setStage(index)}><small>0{index + 1}</small>{label}</button>)}</div>
    <div className="score-workspace"><div className="score-main"><div className="plot-heading"><span>分数坐标 · 共用基线 0</span><span>○ 历史 z　● 当前 a</span></div>
      <svg className="aligned-logits" viewBox="0 0 720 325" role="img" aria-label={`历史分数 ${result.z}，当前分数 ${result.a}；${stage > 0 ? `逐类偏差 ${result.differences}` : "先对齐相同类别"}`}>
        {[0, 1, 2, 3].map((tick) => <g key={tick}><line x1="40" x2="690" y1={y(tick)} y2={y(tick)} className="score-gridline" /><text x="15" y={y(tick) + 5}>{tick}</text></g>)}
        {CLASSES.map((label, index) => { const x = 130 + index * 215; return <g key={label} data-score-coordinate={index}>
          <line x1={x - 24} x2={x - 24} y1={214} y2={y(result.z[index])} className="history-stem" /><line x1={x + 24} x2={x + 24} y1={214} y2={y(result.a[index])} className="current-stem" />
          <circle cx={x - 24} cy={y(result.z[index])} r="7" className="history-dot" /><circle cx={x + 24} cy={y(result.a[index])} r="7" className="current-dot" />
          <text x={x - 44} y={y(result.z[index]) - 16} textAnchor="middle">z={result.z[index]}</text><text x={x + 43} y={y(result.a[index]) - 16} textAnchor="middle">a={result.a[index]}</text>
          {stage >= 1 && <g data-delta={result.differences[index]}><line x1={x + 62} x2={x + 62} y1={y(result.z[index])} y2={y(result.a[index])} className="delta-line" />{result.differences[index] !== 0 && <path d={`M ${x + 57} ${y(result.a[index]) + (result.differences[index] < 0 ? -7 : 7)} L ${x + 62} ${y(result.a[index])} L ${x + 67} ${y(result.a[index]) + (result.differences[index] < 0 ? -7 : 7)}`} className="delta-line" />}<text x={x + 78} y={(y(result.z[index]) + y(result.a[index])) / 2 + 5} className="delta-label">{result.differences[index] > 0 ? "+" : ""}{result.differences[index]}</text></g>}
          <ModelPixel model={index as ModelClass} x={x - 63} y={228} size={22} /><text x={x + 6} y="246" textAnchor="middle">{label}</text>
          {stage >= 2 && <g data-square={result.squares[index]}><rect x={x - 52} y="267" width="104" height="40" rx="4" className="square-tile" /><text x={x} y="293" textAnchor="middle">({result.differences[index]})² = {result.squares[index]}</text></g>}
        </g>; })}
      </svg><p className="score-operation" aria-live="polite">{stage === 0 ? "同一类别共用纵轴；历史圆点保持原位，当前实心点可以移动。" : stage === 1 ? "区段连接 z 与 a，标出 a−z。下降为负，上升为正，重合为 0。" : stage === 2 ? "把偏差平方：−1 与 +1 都贡献 1，零偏差仍贡献 0。" : "相同类别先比较，再将非负的平方贡献求和。"}</p>
    </div><aside className="probability-projection"><p className="eyebrow">同一数据 → softmax 概率</p><p>这里每一对概率都由左图对应的 z、a 计算。</p>{CLASSES.map((label, index) => <div key={label} data-projection-category={index}><strong>{label}</strong><ResponseMeter label="p · 历史" value={result.p[index]} min={0} max={1} showScale={false} /><ResponseMeter label="q · 当前" value={result.q[index]} min={0} max={1} showScale={false} /></div>)}<p className="projection-verdict" data-review-probability-kl={result.probabilityKL}>KL = {formatValue(result.probabilityKL)}{selected === 1 ? " · 三对概率重合" : " · 概率发生变化"}</p></aside></div>
    <div className="logit-formula-result"><SquaredDefinition />{stage === 3 && <output className="review-total" data-review-squared={result.squaredDistance}>L_dark = {result.squares.join(" + ")} = {result.squaredDistance}</output>}</div>
    <div className="review-transport"><button onClick={() => setStage(0)}>重置过程</button><button disabled={stage === 0} onClick={() => setStage(stage - 1)}>上一步</button><button disabled={stage === 3} onClick={() => setStage(stage + 1)}>下一步</button><span>分数与概率始终来自同一组数据</span></div>
    <section className="review-derivation"><h3>共同增加 1，改变的是哪个空间？</h3><p>选择“全部分数增加 1”：历史点保持原位，当前点都向上移动 1；右侧三对概率却完全重合。分子、分母同时乘 eᶜ，比例不变。</p><ShiftIdentity /><Equation label="共同平移 c 后，平方距离为 C 乘 c 的平方"><msub><mi>L</mi><mtext>dark</mtext></msub><mo>=</mo><mi>C</mi><msup><mi>c</mi><mn>2</mn></msup></Equation><p>本例 C=3、c=1，因此 KL=0 而平方和为 3。两种约束不同；这不意味着概率监督无效，也不是全局等价关系。输出匹配采用 <Term id="squared">平方距离</Term>，这是作者选择 logits 空间的原因。</p><ReferenceButton term="squared">查看平方距离的梯度与局部近似</ReferenceButton></section>
  </section>;
}
