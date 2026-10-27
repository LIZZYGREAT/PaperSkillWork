import { useState } from "react";
import { KLDefinition, KLDecomposition } from "../MathNotation";
import { PROBABILITY_CASES, formatValue as f } from "../math-model";
import { Term, ReferenceButton } from "../Reference";
import { KL_CLIPS, klSceneAt, lerp } from "./animation-model";
import SceneTransport, { useSceneTimeline } from "./SceneTransport";
import "./animation.css";

const guidance = [
  "先在同一把尺上建立旧分布 p。它固定不动，q 从同一分布出发。",
  "只有 q 在改变；两根概率条始终非负且相加为 1。这里是合成分布比较，不是参数训练轨迹。",
  "沿猫这一行配对：旧概率 p₁ 是权重，p₁/q₁ 的对数决定贡献的方向。",
  "再看狗这一行：q₂ 大于 p₂ 时，对数比为负；这一类可以给出负贡献。",
  "连接线把每类的概率比较交给下方贡献轴。条形从零生长，负值留在零线左边。",
  "保留符号后求和，得到完整 KL。H(p) 固定，因此减小 H(p,q) 就会减小 KL。",
];
export default function KLPrototype() {
  const [selected, setSelected] = useState(0);
  const [part, setPart] = useState<number | undefined>();
  const timeline = useSceneTimeline(KL_CLIPS);
  const { clipIndex: clip, progress } = timeline.state;
  const s = klSceneAt(clip, progress, selected);
  const focus = part ?? (clip < 2 ? undefined : clip < 4 ? 2 : clip === 4 ? 0 : 3);
  const selectPart = (index: number) => { setPart(index); timeline.jump(index === 3 ? 5 : 2); };
  return <section id="review-kl" className="review-scene motion-scene" data-scene="kl" data-clip={clip} data-progress={progress} data-status={timeline.state.status}>
    <header><p className="eyebrow">U2 · 概率到贡献</p><h1>看见每一类，怎样贡献到 KL。</h1><p>固定参考 <Term id="p">p</Term>，观察当前概率 <Term id="q">q</Term>。同类比较产生带符号项，所有类别共同组成 <Term id="kl">KL 散度</Term>。</p></header>
    <div className="case-controls" role="group" aria-label="选择概率例子">{PROBABILITY_CASES.map((item, index) => <button key={item.id} data-case={item.id} aria-pressed={selected === index} onClick={() => { setSelected(index); setPart(undefined); timeline.reset(); }}>{item.label}</button>)}</div>
    <div className="motion-drawing"><svg className="motion-canvas" viewBox="0 0 1080 475" role="img" aria-label={`固定 p=${s.p}，当前 q=${s.q}；KL=${f(s.kl)}。${guidance[clip]}`}>
      <text x="30" y="34">01 / 同类概率 · 同一尺度 0—1</text><text x="700" y="34" className="small-label">灰绿 p 固定　深绿 q 当前</text>
      {[0, .25, .5, .75, 1].map((v) => <g key={v}><line className="grid" x1={160 + 650 * v} x2={160 + 650 * v} y1="55" y2="229" /><text className="small-label" x={160 + 650 * v} y="249" textAnchor="middle">{v}</text></g>)}
      {["猫", "狗"].map((label, i) => {
        const y = 75 + i * 85;
        return <g key={label} data-probability-row={i} data-p={s.p[i]} data-q={s.q[i]}>
          {clip >= 2 && clip <= 3 && s.category === i && <rect x="20" y={y - 19} width="1038" height="77" rx="4" className="focus-wash" />}
          <text x="35" y={y + 14}>{label} · k={i + 1}</text>
          <rect className="old" x="160" y={y - 9} height="16" width={650 * s.p[i] * s.referenceGrowth} data-p-bar={i} /><rect className="now" x="160" y={y + 16} height="16" width={650 * s.q[i] * s.referenceGrowth} data-q-bar={i} />
          <text x="850" y={y + 2} className="numeric">p={f(s.p[i])}</text><text x="850" y={y + 28} className="numeric">q={f(s.q[i])}</text>
          {clip >= 2 && <path className="flow" data-ratio-line={i} d={`M ${160 + 650 * s.p[i]} ${y + 1} L ${lerp(160 + 650 * s.p[i], 160 + 650 * s.q[i], clip > 3 || s.category !== i ? 1 : s.comparison)} ${y + 25}`} />}
          {clip >= 2 && (clip > 3 || s.category === i) && <text x="1015" y={y + 15} textAnchor="middle" className="small-label">log 比值<tspan x="1015" dy="20">{f(Math.log(s.p[i] / s.q[i]))}</tspan></text>}
          {clip >= 4 && <path className="flow" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - s.contributionGrowth} d={`M ${160 + 650 * s.q[i]} ${y + 35} Q ${160 + 650 * s.q[i]} 275, ${420 + (i ? -20 : 20)} ${313 + i * 55}`} />}
        </g>;
      })}
      <text x="30" y="288">02 / pₖ log(pₖ/qₖ)</text><line x1="420" x2="420" y1="300" y2="405" className="grid" /><text x="420" y="423" textAnchor="middle" className="small-label">0 · 带符号贡献</text>
      {s.terms.map((v, i) => <g key={i} data-term={v} data-reveal={s.contributionGrowth}>
        <text x="35" y={329 + i * 55}>{["猫", "狗"][i]}</text><rect data-term-bar={i} className={v < 0 ? "negative" : "now"} x={420 + Math.min(0, v) * 230 * s.contributionGrowth} y={310 + i * 55} width={Math.abs(v) * 230 * s.contributionGrowth} height="25" />
        <text x="690" y={329 + i * 55} className="numeric">{clip >= 4 ? `${v >= 0 ? "+" : ""}${f(v)}` : "待比较"}</text>
        {clip >= 5 && <path className="flow" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - s.sumGrowth} d={`M 775 ${324 + i * 55} Q 815 ${324 + i * 55}, 830 350`} />}
      </g>)}
      <text x="850" y="324" className="small-label">03 / 所有类别相加</text><text x="850" y="365" className="large-value" data-total={s.kl}>{clip >= 5 ? `KL=${f(s.kl)}` : "KL 待汇总"}</text>
      <text x="30" y="456" className="small-label">两类合成例 · 条形 / 公式 / 总量均由同一 q(t) 计算 · 贡献条的生长表示展开，不表示改变贡献值</text>
    </svg></div>
    <div className="motion-formula"><KLDefinition focus={focus} onSelect={selectPart} /><div className="formula-parts" aria-label="聚焦公式项">{["pₖ 权重", "qₖ 当前", "log 比值", "Σ 求和"].map((label, i) => <button key={label} aria-pressed={focus === i} onClick={() => selectPart(i)}>{label}</button>)}</div></div>
    <div className="motion-narration" aria-live="polite"><strong>{KL_CLIPS[clip].id}</strong><p>{guidance[clip]}{clip === 5 && ` 单项可负，完整 KL 非负。${PROBABILITY_CASES[selected].conclusion}`}</p></div>
    <SceneTransport timeline={timeline} clips={KL_CLIPS} label="KL" />
    <section className="review-derivation"><h3>当前网络能改变哪一部分？</h3><p>k 为类别编号，C 为共同类别数（本例 2）；p 是固定软目标。拆开对数比可得：</p><KLDecomposition /><div className="entropy-explanation"><p><span>H(p,q) · 随 q 改变</span><meter min="0" max="1.5" value={s.crossEntropy} /> {f(s.crossEntropy)}</p><p><span>H(p) · 固定基准</span><meter min="0" max="1.5" value={s.entropy} /> {f(s.entropy)}</p></div><p>两者之差为 {f(s.kl)}。优化时 p 不变，降低交叉熵也就降低 KL。</p><ReferenceButton term="kl">证明与梯度</ReferenceButton></section>
  </section>;
}
