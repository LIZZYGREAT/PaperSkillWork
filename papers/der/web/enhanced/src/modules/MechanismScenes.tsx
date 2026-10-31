import { useEffect, useRef, useState } from "react";
import { ResponseMeter } from "../shared/foundation/visual-parts/ResponseMeter";
import ModelMark from "./review/ModelMark";
import type { ModelClass } from "./review/ModelPixel";
import { CLASSES, HISTORY_Z, RESPONSE_CASES, logitComparison, probabilityComparison, formatValue } from "./math-model";
import { KLDefinition, SquaredDefinition, Equation, KLGradientDerivation } from "./MathNotation";
import { ReferenceButton } from "./Reference";
import "./teaching-front.css";
import "./mechanism-scenes.css";

const number = (n: number) => Number(n.toFixed(3)).toString();
const vector = (v: readonly number[]) => `(${v.map(number).join(", ")})`;
const DURATION = 1400;

export default function ResponseComparison() {
  const [selected, setSelected] = useState(1);
  const [a, setA] = useState<readonly number[]>(RESPONSE_CASES[1].values);
  const [focus, setFocus] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(1);
  const origin = useRef<readonly number[]>(HISTORY_Z);
  const position = useRef(1);
  const r = logitComparison(HISTORY_Z, a);
  const probability = probabilityComparison(r.p, r.q);
  function begin(index: number, replay = false) {
    setSelected(index);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setA(RESPONSE_CASES[index].values); setProgress(1); position.current = 1; setPlaying(false); return;
    }
    origin.current = replay ? HISTORY_Z : a;
    setA(origin.current); position.current = 0; setProgress(0); setPlaying(true);
  }
  useEffect(() => {
    if (!playing) return;
    let frame: number, previous: number | undefined;
    const tick = (time: number) => {
      if (previous !== undefined) position.current = Math.min(1, position.current + (time - previous) / DURATION);
      previous = time;
      const t = position.current, eased = t * t * (3 - 2 * t);
      setA(origin.current.map((v, k) => t === 1 ? RESPONSE_CASES[selected].values[k] : v + (RESPONSE_CASES[selected].values[k] - v) * eased));
      setProgress(t);
      if (t < 1) frame = requestAnimationFrame(tick); else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, selected]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const settle = () => { if (media.matches) { setA(RESPONSE_CASES[selected].values); position.current = 1; setProgress(1); setPlaying(false); } };
    media.addEventListener("change", settle); return () => media.removeEventListener("change", settle);
  }, [selected]);
  return <div className="response-lesson" data-core-items="I03 I04">
    <p className="front-lead">固定历史响应，切换当前分数，观察每一类的偏离怎样形成损失。</p>
    <section className="response-lab" data-design="response-comparison" data-case={RESPONSE_CASES[selected].id} data-z={r.z.join(",")} data-a={r.a.join(",")} data-p={r.p.join(",")} data-q={r.q.join(",")} data-kl={r.probabilityKL} data-l2={r.squaredDistance} data-progress={progress} data-playing={playing}>
      <header className="lab-heading"><div><p className="eyebrow">同一条记录 · 固定过去，改变现在</p><h3>分数的变化，两种观察镜头。</h3></div><div className="lab-input"><ModelMark /><span>x₁<small>同一个输入</small></span></div></header>
      <div className="lab-controls"><div className="response-cases" role="group" aria-label="响应比较情形">{RESPONSE_CASES.map((item, i) => <button key={item.id} data-response-case={item.id} aria-pressed={i === selected} onClick={() => begin(i)}>{item.label}</button>)}</div><div className="lab-transport"><button data-response-replay onClick={() => begin(selected, true)}>重播变化</button><button data-response-play disabled={progress === 1} onClick={() => setPlaying(!playing)}>{playing ? "暂停" : "继续"}</button></div></div>
      <div className="response-legend"><span>━ 历史 z · 固定</span><span>━ 当前 a · 可变</span><small>原始分数 · 共用尺度 0–3 · 点击类别追踪对应项</small></div>
      <div className="logit-stage">{CLASSES.map((name, k) => <div className="logit-coordinate" key={name} data-focused={focus === k}>
        <button className="class-focus" aria-pressed={focus === k} onClick={() => setFocus(k)}><ModelMark model={k as ModelClass} />{name}</button>
        <ResponseMeter label="z" value={r.z[k]} min={0} max={3} showScale={false} />
        <div className="current-response"><ResponseMeter label="a" value={r.a[k]} min={0} max={3} showScale={false} /></div>
        <span className="delta-label">a − z = <b>{number(r.differences[k])}</b></span>
      </div>)}</div>
      <div className="observation-lenses">
        <section className="kl-explanation"><p className="eyebrow">01 / 先比较概率</p><h4>归一化后，还差多少？</h4><p className="caption">p=softmax(z)，q=softmax(a) · 共用尺度 0–1</p>
          <div className="probability-pairs">{CLASSES.map((name,k) => <div key={name} data-focused={focus === k}><strong>{name}</strong><ResponseMeter label="p" value={r.p[k]} min={0} max={1} showScale={false} /><div className="current-response"><ResponseMeter label="q" value={r.q[k]} min={0} max={1} showScale={false} /></div></div>)}</div>
          <div className="lens-result"><span>KL(p ∥ q)</span><strong data-kl-value>{formatValue(r.probabilityKL,4)}</strong></div>
          <p className="coordinate-insight">{CLASSES[focus]}：pₖ / qₖ = {number(r.p[focus]/r.q[focus])}<br />本类贡献 pₖ log(pₖ/qₖ) = {number(probability.terms[focus])}</p>
          <KLDefinition /><p>方向是 p ∥ q：p 是固定的旧概率，q 随当前 θ 改变。各类贡献求和得到 KL，单项可以为负。</p>
          <p className="gradient-note">温度 1 · 所选类别输出梯度 qₖ−pₖ = <b>{number(probability.gradient[focus])}</b>。{probability.gradient[focus] < 0 ? "梯度下降倾向提高该类相对分数。" : probability.gradient[focus] > 0 ? "梯度下降倾向降低该类相对分数。" : "这一项无需调整。"}</p>
          <ReferenceButton term="kl">KL 的方向与更多背景</ReferenceButton>
        </section>
        <section id="logit-matching" className="squared-explanation"><p className="eyebrow">02 / 再比较原始分数</p><h4>把每一类的差，累计成损失。</h4><p className="caption">沿用上方的 a−z · 平方使正负偏离不抵消</p>
          <div className="square-flow">{CLASSES.map((name,k) => <div key={name} data-focused={focus === k}><strong>{name}</strong><span className="difference-source">{number(r.differences[k])}</span><span className="square-arrow">↓ 平方</span><b className="square-contribution" data-square={k}>{number(r.squares[k])}</b></div>)}</div>
          <svg className="contribution-paths" viewBox="0 0 480 70" role="img" aria-label="三个平方贡献沿路径汇合为总损失"><path d="M80 2 V20 Q80 34 96 34 H224 Q240 34 240 68 M240 2 V68 M400 2 V20 Q400 34 384 34 H256 Q240 34 240 68" />{progress < 1 && r.squares.map((value,k) => {
            const t = Math.max(0, Math.min(1, progress * 3 - k)), x = 80 + k*160 + (240-(80+k*160))*Math.max(0,Math.min(1,(t-.25)*2));
            const y = t < .25 ? 10+24*t/.25 : t < .75 ? 34 : 34+24*(t-.75)/.25;
            return <g key={k} className="contribution-copy" opacity={t > 0 && t < 1 ? 1 : 0} transform={`translate(${x} ${y})`}><rect x="-23" y="-10" width="46" height="20" rx="5" /><text textAnchor="middle" dominantBaseline="central">{number(value)}</text></g>;
          })}</svg>
          <div className="lens-result square-total"><span>{r.squares.map(number).join(" + ")} {progress < 1 ? "≈" : "="} L_dark</span><strong data-l2-value>{number(r.squaredDistance)}</strong></div>
          <SquaredDefinition /><p>历史 z 始终作为常量。平方匹配的输出梯度 2(a−z) = {vector(r.gradient)}，再经当前网络反向传播至 θ。</p>
          <details className="square-gradient"><summary>查看输出梯度</summary><Equation label="平方匹配对当前 logits 的梯度为二倍 a 减 z"><msub><mi>∇</mi><mi>a</mi></msub><msub><mi>L</mi><mtext>dark</mtext></msub><mo>=</mo><mn>2</mn><mo>(</mo><mi>a</mi><mo>−</mo><mi>z</mi><mo>)</mo></Equation></details>
          <ReferenceButton term="squared">平方匹配的更多推导</ReferenceButton>
        </section>
      </div>
      <div className="lab-verdict"><h4>两个约束在哪里不同？</h4><p className="response-verdict" aria-live="polite">{progress < 1 ? "正在比较不同的当前响应；历史目标保持固定。可暂停观察每一类的差值与贡献。" : RESPONSE_CASES[selected].conclusion}</p><small>合成教学响应；此处演示比较，不是优化器训练过程。</small></div>
    </section>
    <details className="math-derivation"><summary>为什么 KL 对当前 logits 的梯度是 q−p？</summary><KLGradientDerivation /></details>
    <p className="comparison-conclusion">softmax 对统一加常数不敏感：每类同加 1 时，概率不变，原分数却改变了。两个损失保留的信息不同；这个反例不说明 KL 永远更差，也不说明两者恒等。</p>

  </div>;
}
