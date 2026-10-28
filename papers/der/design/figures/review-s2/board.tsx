import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import ModelPixel, { type ModelClass } from "../../../web/enhanced/src/modules/review/ModelPixel";
import { MODEL_CLASSES, PROBABILITY_CLASSES } from "../../../web/enhanced/src/data/model-classes";
import { REFERENCE_P, PROBABILITY_CASES, HISTORY_Z, LOGIT_CASES, probabilityComparison, logitComparison } from "../../../web/enhanced/src/modules/math-model";
import { KLDefinition, KLDecomposition, SquaredDefinition, ShiftIdentity } from "../../../web/enhanced/src/modules/MathNotation";
import { useSceneTimeline, type SceneTimeline } from "../../../web/enhanced/src/modules/review/SceneTransport";
import { mix, windowAt } from "../../../web/enhanced/src/modules/review/lifecycle-model";
import "./board.css";

// Review-only geometry and motion. All numerical losses come from the actual paper model.
const KL_FRAMES = [
  { id: "固定旧分布", durationMs: 1000, holdMs: 700 },
  { id: "重新分配概率", durationMs: 2600, holdMs: 1000 },
  { id: "Claude 的贡献", durationMs: 2600, holdMs: 1400 },
  { id: "GPT 的贡献", durationMs: 2600, holdMs: 1400 },
  { id: "保留符号求和", durationMs: 2000, holdMs: 1800 },
  { id: "重合时归零", durationMs: 2600, holdMs: 1400 },
];
const SCORE_FRAMES = [
  { id: "同类与同尺度", durationMs: 1100, holdMs: 900 },
  { id: "观察分数差", durationMs: 3000, holdMs: 1600 },
  { id: "差值成为平方", durationMs: 2800, holdMs: 1600 },
  { id: "同一批贡献汇总", durationMs: 2400, holdMs: 1800 },
];
const palette = ["#c37a59", "#377b65", "#577bd0"];
const fmt = (n: number, places = 3) => (Math.abs(n) < 1e-12 ? 0 : n).toFixed(places);
const sign = (n: number) => (n < -1e-12 ? "−" : n > 1e-12 ? "+" : "") + fmt(Math.abs(n));
const phase = (clip: number, t: number, n: number) => clip > n ? 1 : clip < n ? 0 : windowAt(t, .06, .82);

function polar(x: number, y: number, r: number, p: number) {
  const angle = p * Math.PI * 2 - Math.PI / 2;
  return { x: x + r * Math.cos(angle), y: y + r * Math.sin(angle) };
}
function arc(x: number, y: number, r: number, a: number, b: number) {
  const start = polar(x, y, r, a), end = polar(x, y, r, b);
  return `M${start.x} ${start.y}A${r} ${r} 0 ${b - a > .5 ? 1 : 0} 1 ${end.x} ${end.y}`;
}
function Ring({ x, y, r, values, width = 24, selected, frozen = false }: {
  x: number; y: number; r: number; values: readonly number[]; width?: number; selected?: number; frozen?: boolean;
}) {
  let previous = 0;
  return <g><circle cx={x} cy={y} r={r} fill="none" stroke="#edf1e9" strokeWidth={width + 7} />
    {values.map((v, k) => {
      const a = previous; previous += v;
      return <path key={k} data-mass={k} data-value={v} d={arc(x, y, r, a + .004, previous - .004)} fill="none" stroke={palette[k]} strokeWidth={width} opacity={selected === undefined || selected === k ? 1 : .22} strokeDasharray={frozen ? "2 1" : undefined} />;
    })}</g>;
}
function Mark({ k, x, y, size = 26 }: { k: number; x: number; y: number; size?: number }) {
  return <ModelPixel model={k as ModelClass} x={x} y={y} size={size} />;
}
function Transport({ timeline, frames }: { timeline: SceneTimeline; frames: typeof KL_FRAMES }) {
  const { state } = timeline;
  const total = frames.reduce((s, f) => s + f.durationMs + f.holdMs, 0) / 1000;
  return <><div className="transport">
    <button className="primary" data-play onClick={timeline.toggle}>{timeline.reducedMotion ? "下一关键帧" : state.status === "playing" ? "暂停草案" : "播放草案"}</button>
    <button data-replay onClick={timeline.replay}>从头播放</button>
    <button data-back disabled={state.clipIndex === 0} onClick={() => timeline.jump(state.clipIndex - 1)}>上一步</button>
    <span className="time">{timeline.elapsedSeconds.toFixed(1)} / {total.toFixed(1)} 秒</span>
    <progress aria-label="运动草案进度" max={total} value={timeline.elapsedSeconds} />
  </div><div className="frames" style={{ "--frames": frames.length } as React.CSSProperties} aria-label="高保真关键帧">
    {frames.map((frame, i) => <button key={frame.id} data-frame={i} aria-pressed={state.clipIndex === i} onClick={() => timeline.jump(i)}><small>0{i + 1}</small>{frame.id}</button>)}
  </div></>;
}

function KLBoard() {
  const timeline = useSceneTimeline(KL_FRAMES);
  const [selected, setSelected] = useState(0);
  useEffect(() => { timeline.jump(1); }, []);
  const { clipIndex: clip, progress: t } = timeline.state;
  const travel = phase(clip, t, 1), returnToP = phase(clip, t, 5);
  const target = PROBABILITY_CASES[selected].values;
  const q = REFERENCE_P.map((p, k) => mix(mix(p, target[k], travel), p, returnToP));
  const r = probabilityComparison(REFERENCE_P, q);
  const focus = clip === 2 ? 0 : clip === 3 ? 1 : undefined;
  const reveal = [clip > 2 ? 1 : clip === 2 ? windowAt(t, .78, 1) : 0, clip > 3 ? 1 : clip === 3 ? windowAt(t, .78, 1) : 0];
  const paired = windowAt(t, .04, .3), logarithm = windowAt(t, .3, .52), weighted = windowAt(t, .52, .74), fly = windowAt(t, .72, 1);
  const collect = phase(clip, t, 4);
  const notes = [
    "p 的两块概率质量固定为 0.8 / 0.2。q 从同一分配出发；颜色表示类别，虚线内圈标记固定参照。",
    "只有右侧 q 的分界在移动，两块始终拼成完整的 1。两次都偏向 Claude，也不代表分配相同。此运动是合成状态比较。",
    `沿同一个 Claude 标识取出 p₁ 与 q₁：先看比值、取对数，再乘固定权重 p₁。单项得到 ${sign(r.terms[0])}。`,
    `同样的动作交给 GPT。q₂ 大于 p₂ 时，log(p₂/q₂) 为负；当前这个单项为 ${sign(r.terms[1])}。`,
    `同一批贡献向中央汇合，符号和来源一起保留。完整 KL=${fmt(r.kl)}，只有总和保证非负；交换 p、q 一般得到不同结果。`,
    "让 q 沿合成比较路径回到 p。扇区分界、逐项贡献和总和同步重合／归零；没有模拟真实优化器或参数训练。",
  ];
  return <section data-design="kl" data-clip={clip} data-progress={t} data-status={timeline.state.status}>
    <div className="scene-heading"><div><h2>概率重新分配，损失逐类形成。</h2><p>固定参照 → 同类取值 → 带符号贡献 → 汇总；两个概率圆始终留在同一舞台。</p></div>
      <div className="cases" aria-label="KL 合成例">{PROBABILITY_CASES.map((c, i) => <button key={c.id} data-case={c.id} aria-pressed={selected === i} onClick={() => { setSelected(i); timeline.jump(1); }}>{c.label}</button>)}</div></div>
    <div className="stage">
      <svg className="scene-canvas" viewBox="0 0 1120 480" role="img" aria-label="两类概率质量经同类比较形成有符号 KL 贡献" data-p={r.p.join(',')} data-q={r.q.join(',')} data-loss={r.kl}>
        <text x="40" y="36" className="small mono">A / 概率空间</text><text x="1080" y="36" className="small" textAnchor="end">Claude / GPT · 独立两类合成例</text>
        {[260, 860].map((x, i) => <g key={i}>
          <text x={x} y="78" textAnchor="middle" className="title">{i ? "当前分配 q" : "旧分布 p · 固定"}</text>
          <Ring x={x} y={204} r={91} values={i ? r.q : r.p} width={30} selected={focus} />
          {!i && <circle cx={x} cy="204" r="65" className="frozen" />}
          <text x={x} y="201" textAnchor="middle" className="big-number">1</text><text x={x} y="224" textAnchor="middle" className="micro">总概率</text>
          {PROBABILITY_CLASSES.map((label, k) => <g key={label} opacity={focus === undefined || focus === k ? 1 : .3}>
            <Mark k={k} x={x - 103 + k * 120} y={321} size={19} />
            <text x={x - 75 + k * 120} y="335" className="caption">{label}</text>
            <text x={x - 75 + k * 120} y="358" className="mono">{fmt((i ? r.q : r.p)[k], 2)}</text>
          </g>)}
        </g>)}
        <path className="guide" strokeDasharray="3 5" d="M380 204H426M694 204H740" />
        {focus === undefined ? <g>
          <text x="560" y="176" textAnchor="middle" className="small">同一类别，沿两边取值</text>
          <text x="560" y="215" textAnchor="middle" className="symbol">pₖ log(pₖ / qₖ)</text>
          <text x="560" y="248" textAnchor="middle" className="caption">{clip === 5 ? "分配重合，贡献归零" : clip >= 4 ? "每一项的符号都留下" : "面积变化表示概率质量重分配"}</text>
        </g> : <g>
          <Mark k={focus} x={544} y={102} size={32} />
          <text x="560" y="159" textAnchor="middle" className="title">{PROBABILITY_CLASSES[focus]}</text>
          <g opacity={paired}><text x="500" y="202" textAnchor="middle" className="small">pₖ · 固定权重</text><text x="620" y="202" textAnchor="middle" className="small">qₖ · 当前</text><text x="560" y="230" textAnchor="middle" className="symbol">/</text></g>
          <text x={mix(185 + focus * 120, 500, paired)} y={mix(358, 233, paired)} textAnchor="middle" className="number">{fmt(r.p[focus], 2)}</text><text x={mix(785 + focus * 120, 620, paired)} y={mix(358, 233, paired)} textAnchor="middle" className="number">{fmt(r.q[focus], 2)}</text>
          <text x="560" y="274" textAnchor="middle" className="caption" opacity={logarithm}>log 比值 = {fmt(Math.log(r.p[focus] / r.q[focus]))}</text>
          <text x="560" y="308" textAnchor="middle" className={`number ${r.terms[focus] < 0 ? 'negative' : 'positive'}`} opacity={weighted} data-focused-contribution={r.terms[focus]}>{fmt(r.p[focus], 1)} × log 比值 = {sign(r.terms[focus])}</text>
          <path className="guide" d={`M560 323Q560 365 ${focus ? 690 : 430} 383`} strokeDasharray="3 4" opacity={weighted} />
          <text x={mix(560, focus ? 690 : 430, fly)} y={mix(308, 422, fly)} textAnchor="middle" className={`number ${r.terms[focus] < 0 ? 'negative' : 'positive'}`} opacity={Math.sin(fly * Math.PI)}>{sign(r.terms[focus])}</text>
        </g>}
        <rect x="240" y="391" width="640" height="58" rx="13" fill={collect > 0 ? '#eef4e9' : '#f7f9f3'} stroke="#dbe5d4" />
        {r.terms.map((value, k) => <g key={k} opacity={reveal[k]} transform={`translate(${mix(k ? 690 : 430, k ? 571 : 430, collect)} 422)`} data-term={value}>
          <text x="0" y="0" className={`number ${value < 0 ? 'negative' : 'positive'}`} textAnchor="middle">{sign(value)}</text>
          <text x="0" y="43" textAnchor="middle" className="micro">{PROBABILITY_CLASSES[k]} 的贡献</text>
        </g>)}
        {collect > 0 && <g opacity={collect}><text x="503" y="422" className="number">+</text><text x="629" y="422" className="number">=</text><text x="676" y="422" className="number" data-kl-total={r.kl}>{fmt(r.kl)}</text><text x="800" y="421" textAnchor="middle" className="small">完整 KL</text></g>}
        {clip < 2 && <text x="560" y="425" textAnchor="middle" className="caption">接下来，沿同类取值形成每一项贡献</text>}
      </svg>
      <div className="formula-strip"><KLDefinition identified={false} focus={clip === 2 || clip === 3 ? 2 : clip >= 4 ? 3 : 0} onSelect={part => timeline.jump(part === 3 ? 4 : 2)} /><div className="symbol-source"><strong>pₖ</strong> 来自左侧固定参照 · <strong>qₖ</strong> 来自右侧当前分配<br />k 是类别编号 · 本例 C=2 · 单项可负，总和非负</div></div>
    </div>
    <Transport timeline={timeline} frames={KL_FRAMES} />
    <div className="narration" aria-live="polite"><strong>{KL_FRAMES[clip].id}</strong><p>{notes[clip]}</p></div>
    <div className="math-connection"><math display="block" aria-label="KL 为交叉熵减去固定旧分布的熵"><msub><mi>D</mi><mtext>KL</mtext></msub><mo>=</mo><mi>H</mi><mo>(</mo><mi>p</mi><mo>,</mo><mi>q</mi><mo>)</mo><mo>−</mo><mi>H</mi><mo>(</mo><mi>p</mi><mo>)</mo></math><p>交叉熵 {fmt(r.crossEntropy)} − 固定熵 {fmt(r.entropy)} = {fmt(r.kl)}。<br />固定 p 时，降低 H(p,q) 也就降低 KL。</p></div>
    <details className="design-note"><summary>查看分镜、运动与数学衔接</summary><div className="spec-grid">
      <div><h3>舞台与对象</h3><p>两块完整的概率质量是视觉主体；类别颜色与像素保持对应。p 内部的虚线表示固定参照，q 的分界连续转动。数值始终由同一合法 q 计算，不用粒子数量近似损失。</p></div>
      <div><h3>动作与交接</h3><p>先用 2.6 秒看清重分配；同类像素依次成为焦点，比值 → 对数 → 加权贡献分步显露。贡献数值沿同一路径进入底部汇总；每镜末尾留 1–1.8 秒供观察。</p></div>
      <div><h3>主线与 Reference</h3><p>主线保留定义、变量来源和熵分解；H(p) 为常量。完整非负性证明与 q−p 梯度放 Reference。概率不一致这一结论承接 U1，并把“为何还比较 logits”交给下一场景。</p></div>
    </div><div className="math-connection"><KLDecomposition identified={false} /><p>H(p,q)={fmt(r.crossEntropy)}；H(p)={fmt(r.entropy)} 固定。<br />两者之差始终等于当前完整 KL。</p></div></details>
  </section>;
}

function ScoreBoard() {
  const timeline = useSceneTimeline(SCORE_FRAMES);
  const [selected, setSelected] = useState(0);
  useEffect(() => { timeline.jump(1); }, []);
  const { clipIndex: clip, progress: t } = timeline.state;
  const movement = phase(clip, t, 1), square = phase(clip, t, 2), sum = phase(clip, t, 3);
  const a = HISTORY_Z.map((v, k) => mix(v, LOGIT_CASES[selected].values[k], movement));
  const r = logitComparison(HISTORY_Z, a);
  const y = (v: number) => 332 - v * 60;
  const notes = [
    "三个类别共用同一尺度。空心方块始终是固定 z；实心圆表示当前 a。起点重合仅用于展开比较，不代表一次训练的初值。",
    selected ? "三个实心圆沿同一尺度一起上移。右侧同一数据算出的 softmax 扇区保持重合：这只是共同平移对照，没有参数更新。" : "同一类别的方块与圆点分开，两个有方向的差值直接可见：Claude 下降、GPT 上升、DeepSeek 不变。",
    "差值数值留在来源位置，同时复制到下方平方面；−1 和 +1 都形成面积为 1 的方块，0 仍是明确的零贡献。平方动作没有再计算一套示例。",
    `三个平方贡献作为同一批数值进入求和，得到 L_dark=${fmt(r.squaredDistance)}。${selected ? '此时概率 KL=0，平方距离为 3；两种约束作用于不同空间。' : '历史 z 不动，当前 a 接收匹配约束。'}`,
  ];
  return <section data-design="logits" data-clip={clip} data-progress={t} data-status={timeline.state.status}>
    <div className="scene-heading"><div><h2>先看见差值，再看见平方怎样形成。</h2><p>同类身份贯穿分数、差值、平方和概率；右侧是同一组 a 的 softmax 投影。</p></div><div className="cases" aria-label="Logit 对照">{LOGIT_CASES.map((c, i) => <button key={c.id} data-case={c.id} aria-pressed={selected === i} onClick={() => { setSelected(i); timeline.jump(1); }}>{i ? '共同平移 +1' : 'Claude / GPT 分数交换'}</button>)}</div></div>
    <div className="stage"><svg className="scene-canvas" viewBox="0 0 1120 480" role="img" aria-label="同类别分数在同尺度相减，平方后汇总，同时投影到概率空间" data-z={r.z.join(',')} data-a={r.a.join(',')} data-loss={r.squaredDistance}>
      <text x="35" y="36" className="small mono">B / 分数空间</text><text x="723" y="36" textAnchor="end" className="small">□ 固定 z　● 当前 a</text>
      <path d="M776 58V450" className="line" />
      {[0, 1, 2, 3].map(v => <g key={v}><text x="47" y={y(v) + 4} textAnchor="end" className="micro mono">{v}</text><line x1="60" x2="722" y1={y(v)} y2={y(v)} stroke="#ecf0e7" strokeDasharray={v ? '2 5' : undefined} /></g>)}
      {MODEL_CLASSES.map((label, k) => {
        const x = 164 + k * 220, delta = r.differences[k];
        const fromY = (y(r.z[k]) + y(r.a[k])) / 2;
        const copyY = mix(fromY + 7, 378, square);
        const side = 38 * Math.sqrt(r.squares[k]) * square;
        const destination = [394, 491, 588][k];
        return <g key={label} data-coordinate={k} data-delta={delta} data-square={r.squares[k]}>
          <Mark k={k} x={x - 50} y={68} size={26} /><text x={x - 15} y="87">{label}</text>
          <line x1={x} x2={x} y1="120" y2="340" className="axis" />
          <rect x={x - 20} y={y(r.z[k]) - 7} width="14" height="14" rx="2" className="score-old" />
          <circle cx={x + 15} cy={y(r.a[k])} r="9" className="score-current" />
          <text x={x - 33} y={y(r.z[k]) + 6} textAnchor="end" className="mono">{fmt(r.z[k], 0)}</text><text x={x + 31} y={y(r.a[k]) + 6} className="mono">{fmt(r.a[k], movement === 1 ? 0 : 1)}</text>
          {clip >= 1 && <g>
            <path d={`M${x + 58} ${y(r.z[k])}h7V${y(r.a[k])}h-7`} fill="none" stroke="#8f9f82" strokeWidth="1.5" />
            <text x={x + 82} y={fromY + 5} className="small mono">{delta < 0 ? '−' : delta > 0 ? '+' : ''}{fmt(Math.abs(delta), movement === 1 ? 0 : 1)}</text>
          </g>}
          {clip >= 2 && <g opacity={square}>
            <rect x={x - side / 2} y={382 - side / 2} width={side} height={side} fill="#e1ecd8" stroke="#aac49d" />
            {delta === 0 && <line x1={x - 17} x2={x + 17} y1="382" y2="382" stroke="#b6c7ac" />}
            <text x={x} y={copyY + 8} textAnchor="middle" className="mono">{square < .8 ? (delta < 0 ? '−' : '') + fmt(Math.abs(delta), 0) : `(${fmt(delta, 0)})²`}</text>
            <text x={x} y="418" textAnchor="middle" className="small">平方贡献 {fmt(r.squares[k], 0)}</text>
          </g>}
          {clip >= 3 && <text x={mix(x + 32, destination, sum)} y={mix(418, 454, sum)} textAnchor="middle" className="number" opacity={windowAt(sum, .02, .15)} data-sum-term={r.squares[k]}>{fmt(r.squares[k], 0)}</text>}
        </g>;
      })}
      <text x="945" y="84" textAnchor="middle" className="title">概率空间</text><text x="945" y="107" textAnchor="middle" className="small">同一组分数 → softmax</text><text x="945" y="129" textAnchor="middle" className="micro">内 p 固定 · 外 q 当前</text>
      <Ring x={945} y={207} r={68} width={15} values={r.q} /><Ring x={945} y={207} r={46} width={9} values={r.p} frozen />
      <text x="945" y="211" textAnchor="middle" className="symbol">p / q</text><text x="945" y="294" textAnchor="middle" className="micro">{selected ? '分布完全重合' : clip ? '相对偏好改变' : '同一分配'}</text>
      {MODEL_CLASSES.map((label, k) => <g key={label}><Mark k={k} x={812} y={304 + k * 34} size={16} /><text x="837" y={317 + k * 34} className="caption">{label}</text><text x="1078" y={317 + k * 34} textAnchor="end" className="micro mono">{fmt(r.p[k])} / {fmt(r.q[k])}</text></g>)}
      <text x="945" y="438" textAnchor="middle" className="number" data-probability-kl={r.probabilityKL}>KL = {fmt(r.probabilityKL)}</text>
      {clip >= 3 && <g opacity={sum}><text x="114" y="454" className="title">L<tspan baselineShift="sub" fontSize="12">dark</tspan></text><text x="442" y="454" className="number">+</text><text x="539" y="454" className="number">+</text><text x="635" y="454" className="number">=</text><text x="682" y="454" className="number" data-score-total={r.squaredDistance}>{fmt(r.squaredDistance, 0)}</text></g>}
      {clip < 2 && <text x="389" y="409" textAnchor="middle" className="caption">{selected ? '分数整体上移，概率分界保持原位' : '有方向的差值，将成为下一镜的平方贡献'}</text>}
    </svg><div className="formula-strip"><SquaredDefinition identified={false} /><div className="symbol-source">z=(2,1,0) 固定 · a={selected ? '(3,2,1)' : '(1,2,0)'} 为比较目标<br />三类独立合成例；不与 U2 两类概率混作同一次前向</div></div></div>
    <Transport timeline={timeline} frames={SCORE_FRAMES} /><div className="narration" aria-live="polite"><strong>{SCORE_FRAMES[clip].id}</strong><p>{notes[clip]}</p></div>
    <div className="math-connection"><math display="block" aria-label="当 a 等于 z 加 c，共同平移不改变 softmax 概率，平方距离为 C c 平方"><mtext>若 a=z+c：</mtext><mi>softmax</mi><mo>(</mo><mi>z</mi><mo>+</mo><mi>c</mi><mo>)</mo><mo>=</mo><mi>softmax</mi><mo>(</mo><mi>z</mi><mo>)</mo><mo>,</mo><msub><mi>L</mi><mtext>dark</mtext></msub><mo>=</mo><mi>C</mi><msup><mi>c</mi><mn>2</mn></msup></math><p>共同平移让 softmax 的分子、分母同乘 eᶜ，公共因子相消。<br />概率保持原值，分数的平方距离仍然改变。</p></div>
    <details className="design-note"><summary>查看分镜、运动与两个空间的关系</summary><div className="spec-grid">
      <div><h3>同尺度，少量锚点</h3><p>一把共同分数尺、三个持续类别身份。方块与圆点分别编码固定／当前；没有三张独立坐标图，没有另一个网络。差值旁只保留必要数字。</p></div>
      <div><h3>差值 → 平方 → 同批求和</h3><p>数字复制到下方，连续转成平方贡献。源差值和固定 z 留在原处。三个贡献一起去往汇总位置，终点停留 1.8 秒；共同平移使用相同的动作语法。</p></div>
      <div><h3>共同平移要给足时间</h3><p>切换 +1 对照，再播放。实心圆用 3 秒一起上移；同一 a(t) 计算右侧每一帧概率。读者能同时观察分数距离改变和概率分界不变，不用只相信终态文字。</p></div>
    </div><div className="math-connection"><ShiftIdentity /><p>softmax(z+c)=softmax(z)，但平方距离为 Cc²。<br />本例 C=3、c=1，所以得到 3；不声称两种约束普遍孰优。</p></div></details>
  </section>;
}

const LENSES = [
  { clip: 1, title: "更新前输出", text: "先看输出来自哪份训练视图，θᵢ 尚未更新。" },
  { clip: 2, title: "复制并冻结", text: "源输出留在原位，副本成为独立 z₁，值始终是 (2,1,0)。" },
  { clip: 3, title: "参数继续更新", text: "唯一网络更新，z₁ 保持原值；冻结的是数值。" },
  { clip: 4, title: "更新后入槽", text: "原图与冻结值组成候选，更新后才写入 slot 0。" },
  { clip: 5, title: "后来读取回放", text: "从真实已有记录读出 x₁，重新增强并前向，aⱼ 不是 z₁。" },
  { clip: 8, title: "x₂ 独立快照", text: "当前样本自己的 z₂=(u₁,u₂,u₃)，不能拿回放输出冒充。" },
];
function FreezeBoard() {
  const [selected, setSelected] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const seek = (i: number, play = false) => {
    setSelected(i);
    const doc = frame.current?.contentDocument;
    const select = doc?.querySelector<HTMLSelectElement>('[data-scene=lifecycle] select');
    if (!select) return;
    const clip = LENSES[i].clip;
    // Use only the accepted player's public stage controls; its own clock/model stay authoritative.
    select.value = String(play ? clip : clip === 8 ? 7 : clip + 1);
    select.dispatchEvent(new Event('change', { bubbles: true }));
    if (!play) requestAnimationFrame(() => doc?.querySelector<HTMLButtonElement>(clip === 8 ? '[data-scene=lifecycle] [data-next]' : '[data-scene=lifecycle] [data-back]')?.click());
  };
  useEffect(() => { const before = document.body.style.overflow; if (expanded) document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = before; }; }, [expanded]);
  return <section data-design="freeze">
    <div className="freeze-header"><div><h2>冻结与回放，回到同一份真实记录。</h2><p>每个入口都定位到原生命周期播放器。完整舞台、九阶段、样本、槽位与冻结值继续属于同一个动画。</p></div><button onClick={() => setExpanded(true)}>展开原播放器 ↗</button></div>
    <div className={expanded ? 'lens-overlay' : 'lens-inline'}>
      <div className="lens-bar"><div className="lens-list" aria-label="生命周期观察入口">{LENSES.map((lens, i) => <button key={lens.clip} data-lens={lens.clip} aria-pressed={selected === i} onClick={() => seek(i)}><small>{String(lens.clip + 1).padStart(2, '0')}</small>{lens.title}</button>)}</div>{expanded && <button onClick={() => setExpanded(false)}>收起，回到设计板</button>}</div>
      <iframe ref={frame} className="live-frame" title="原生命周期专注播放器 · 同一组件与状态" src="/lifecycle/?review=1&focus=lifecycle#lifecycle-player" onLoad={() => seek(selected)} />
    </div>
    <div className="freeze-meta"><p><strong>{LENSES[selected].title}</strong> · {LENSES[selected].text}<br />选入口先定格真实阶段结果；播放器内部可继续、回退或完整重播。</p><div className="cases"><button data-play-lens onClick={() => seek(selected, true)}>从此处连续播放</button><a href="http://127.0.0.1:5188/?review=1&focus=lifecycle#lifecycle-player" target="_blank" rel="noreferrer">原 5188 入口 ↗</a></div></div>
    <details className="design-note"><summary>查看入口方案、复用边界与后续整合</summary><div className="spec-grid">
      <div><h3>主舞台完全沿用</h3><p>此处实载现有生产构建；不是截图，也不是重新画的“简化版”。展开与收起保留同一个 iframe、同一播放器实例及其播放位置。入口只调用既有阶段控件。</p></div>
      <div><h3>未来 S3 的最小实现</h3><p>把这一层观察导航放在同一 React 页面，使用已有播放器入口，避免 iframe 变成正式架构。若新增阶段定位参数，仅作外围导航，仍调用同一个时钟；不改原 SVG、数值或几何。</p></div>
      <div><h3>必须看出的边界</h3><p>候选不等于已入池；z₁ 是历史值，aⱼ 是回放的新输出，z₂ 是当前样本独立快照。DER 记录 (x,z)，标签只监督当前 CE；DER++ 才额外存 y。</p></div>
    </div></details>
  </section>;
}

function Board() {
  const initial = new URLSearchParams(location.search).get('scene');
  const [scene, setScene] = useState(initial === 'logits' || initial === 'freeze' ? initial : 'kl');
  const choose = (id: string) => { setScene(id); const url = new URL(location.href); url.searchParams.set('scene', id); history.replaceState({}, '', url); };
  return <><header className="board-top"><div className="wordmark"><b>DER</b><span>教学场景 / 设计评审</span></div><div className="review-status"><i />S2 · 方向待确认</div></header><main className="s2-board">
    <div className="intro"><div><p className="eyebrow">CONTINUOUS OBJECTS · VISIBLE CALCULATION</p><h1>让计算从画面里发生。</h1><p>关键帧可以停住看，运动草案可以连着看。保留数学，也让对象的变化承担解释。</p></div><div className="scope-note">生命周期专注版继续受保护。<br />本页为 S2 设计提案，W7 保持待审。</div></div>
    <nav className="scene-tabs" role="tablist" aria-label="三个设计提案">{[['kl','概率与 KL'],['logits','Logit Matching'],['freeze','冻结 / 回放入口']].map(([id, label], i) => <button key={id} role="tab" data-tab={id} aria-selected={scene === id} onClick={() => choose(id)}><span>0{i + 1}</span>{label}</button>)}</nav>
    {scene === 'kl' ? <KLBoard /> : scene === 'logits' ? <ScoreBoard /> : <FreezeBoard />}
  </main></>;
}
createRoot(document.getElementById('root')!).render(<Board />);
