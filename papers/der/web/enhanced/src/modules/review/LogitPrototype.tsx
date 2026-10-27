import { useState } from "react";
import { SquaredDefinition, Equation } from "../MathNotation";
import { CLASSES, LOGIT_CASES, formatValue as f } from "../math-model";
import { Term, ReferenceButton } from "../Reference";
import { LOGIT_CLIPS, logitSceneAt, lerp } from "./animation-model";
import SceneTransport, { useSceneTimeline } from "./SceneTransport";
import "./animation.css";

const guidance = [
  "历史空心点固定，当前实心点从同类坐标分出。每一对只比较同一个类别。",
  "当前点连续移动，差值线随 aₖ−zₖ 伸缩。此处是合成比较路径，不是真实 SGD 更新。",
  "沿对应连线，把有方向的差值转成非负平方贡献。负 1 与正 1 都贡献 1，零仍为 0。",
  "把各类平方贡献相加。右侧概率由左侧当前分数实时计算，可直接对照两个空间。",
];
export default function LogitPrototype() {
  const [selected, setSelected] = useState(0);
  const timeline = useSceneTimeline(LOGIT_CLIPS);
  const { clipIndex: clip, progress } = timeline.state;
  const s = logitSceneAt(clip, progress, selected);
  const y = (value: number) => 245 - value * 50;
  return <section id="review-logits" className="review-scene motion-scene" data-scene="logits" data-clip={clip} data-progress={progress} data-status={timeline.state.status}>
    <header><p className="eyebrow">U3 · 分数到平方距离</p><h2>偏差怎样构成损失？</h2><p>固定 <Term id="z">历史 z</Term>=(2,1,0)，让 <Term id="a">当前 a</Term> 与它逐类比较。旁边的 <Term id="softmax" /> 概率始终来自同一组 <Term id="logits" />。</p></header>
    <div className="case-controls" role="group" aria-label="选择分数例子">{LOGIT_CASES.map((item, index) => <button key={item.id} data-case={item.id} aria-pressed={selected === index} onClick={() => { setSelected(index); timeline.reset(); }}>{item.label}</button>)}</div>
    <div className="motion-drawing"><svg className="motion-canvas" viewBox="0 0 1080 480" role="img" aria-label={`历史 ${s.z}，当前 ${s.a}；平方距离 ${f(s.squaredDistance)}，概率 KL ${f(s.probabilityKL)}`}>
      <text x="28" y="34">分数坐标 / ○ 历史 z　● 当前 a</text><text x="757" y="34">同一组分数 → softmax</text>
      {[0,1,2,3].map((v) => <g key={v}><line x1="55" x2="670" y1={y(v)} y2={y(v)} className="grid" /><text x="28" y={y(v)+6}>{v}</text></g>)}
      <line className="grid" x1="715" x2="715" y1="52" y2="440" />
      {CLASSES.map((label, i) => {
        const x = 150+i*210, currentX=lerp(x-18,x+18,s.pairing);
        return <g key={label} data-logit-row={i} data-a={s.a[i]} data-z={s.z[i]} data-difference={s.differences[i]} data-square={s.squares[i]}>
          <line x1={x-18} x2={x-18} y1="245" y2={y(s.z[i])} stroke="var(--motion-old)" strokeWidth="5" /><line x1={currentX} x2={currentX} y1="245" y2={y(s.a[i])} stroke="var(--motion-now)" strokeWidth="5" />
          <circle data-history-point={i} cx={x-18} cy={y(s.z[i])} r="7" fill="var(--rk-surface)" stroke="var(--motion-old)" strokeWidth="2" /><circle data-current-point={i} cx={currentX} cy={y(s.a[i])} r="7" className="now" />
          <text x={x-40} y={y(s.z[i])-16} textAnchor="end" className="numeric">z={f(s.z[i],1)}</text><text x={x+40} y={y(s.a[i])-16} className="numeric">a={f(s.a[i],1)}</text>
          {clip>=1 && <g><path data-difference-line={i} className="flow" d={`M ${x+55} ${y(s.z[i])} h 9 v ${y(s.a[i])-y(s.z[i])} h -9`} /><text x={x+77} y={(y(s.z[i])+y(s.a[i]))/2+7} className="numeric">{s.differences[i]>0?"+":""}{f(s.differences[i],1)}</text></g>}
          <text x={x} y="284" textAnchor="middle">{label}</text>
          {clip>=2 && <><path className="flow" pathLength="1" strokeDasharray="1" strokeDashoffset={1-s.squareGrowth} d={`M ${x+60} ${y(s.a[i])+12} Q ${x+95} 300, ${x} 330`} /><rect data-square-block={i} x={x-46} y={393-48*s.squares[i]*s.squareGrowth} width="92" height={48*s.squares[i]*s.squareGrowth} className="focus-wash" /><line x1={x-46} x2={x+46} y1="393" y2="393" className="grid" /><text x={x} y="422" textAnchor="middle" className="numeric">({f(s.differences[i],1)})²={f(s.squares[i],1)}</text></>}
          {clip>=3 && <path className="flow" pathLength="1" strokeDasharray="1" strokeDashoffset={1-s.sumGrowth} d={`M ${x+46} 375 Q ${x+95} 320, 760 375`} />}
        </g>;
      })}
      {CLASSES.map((label,i)=><g key={label} data-softmax-row={i} data-p={s.p[i]} data-q={s.q[i]}>
        <text x="757" y={79+i*82}>{label}</text><text x="1020" y={79+i*82} textAnchor="end" className="small-label">p / q</text>
        <rect x="790" y={91+i*82} width={190*s.p[i]} height="12" className="old" /><rect x="790" y={108+i*82} width={190*s.q[i]} height="12" className="now" data-softmax-bar={i} />
        <text x="1025" y={101+i*82} className="small-label" textAnchor="middle">{f(s.p[i])}</text><text x="1025" y={119+i*82} className="small-label" textAnchor="middle">{f(s.q[i])}</text>
      </g>)}
      <text x="757" y="337" data-probability-kl={s.probabilityKL}>KL = {f(s.probabilityKL)}</text><text x="780" y="383" className="large-value" data-loss={s.squaredDistance}>{clip>=3?`L_dark = ${f(s.squaredDistance)}`:"等待平方汇总"}</text>
      <text x="780" y="419" className="small-label">{selected===1?"三个当前点同步平移，概率重合":"非零差值各自形成平方贡献"}</text>
      <text x="28" y="459" className="small-label">独立三类合成例 · 不与 U2 两类例子混作一次前向 · 平方块的生长表示展开，不改变实际平方值</text>
    </svg></div>
    <div className="motion-formula" data-calculation-focus={clip}><SquaredDefinition /><div className="formula-parts"><button onClick={()=>timeline.jump(1)} aria-pressed={clip===1}>aₖ−zₖ · 偏差</button><button onClick={()=>timeline.jump(2)} aria-pressed={clip===2}>平方</button><button onClick={()=>timeline.jump(3)} aria-pressed={clip===3}>Σ · 求和</button></div></div>
    <div className="motion-narration" aria-live="polite"><strong>{LOGIT_CLIPS[clip].id}</strong><p>{guidance[clip]}{selected===1 && clip>=1 && " 同时给各分数加 c：softmax 的分子、分母共乘 eᶜ，概率比例不变。"}</p></div>
    <SceneTransport timeline={timeline} clips={LOGIT_CLIPS} label="Logits" />
    <section className="review-derivation"><h3>相同的概率，仍可有不同的分数。</h3><p>共同平移 a=z+c 时，softmax 中的公共因子 eᶜ 在分子分母相消。概率 KL 为 0，平方距离仍为 Cc²；本例 C=3、c=1，平方距离为 3。切换上方例子并播放，可看见这个差别如何形成。</p><Equation label="共同平移后 softmax 不变，平方距离为类别数乘 c 的平方"><mi>softmax</mi><mo>(</mo><mi>z</mi><mo>+</mo><mi>c</mi><mo>)</mo><mo>=</mo><mi>softmax</mi><mo>(</mo><mi>z</mi><mo>)</mo><mo>,</mo><msub><mi>L</mi><mtext>dark</mtext></msub><mo>=</mo><mi>C</mi><msup><mi>c</mi><mn>2</mn></msup></Equation><p>两种约束作用在不同空间，不是全局等价关系。DER 选择 <Term id="squared">logits 平方匹配</Term>；概率监督本身仍有意义。</p><ReferenceButton term="softmax">完整平移推导</ReferenceButton></section>
  </section>;
}

