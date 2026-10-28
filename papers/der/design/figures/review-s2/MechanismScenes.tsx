import React, { useId, useState } from "react";
import ModelPixel, { type ModelClass } from "../../../web/enhanced/src/modules/review/ModelPixel";
import { MODEL_CLASSES, PROBABILITY_CLASSES } from "../../../web/enhanced/src/data/model-classes";
import { REFERENCE_P, PROBABILITY_CASES, HISTORY_Z, LOGIT_CASES, probabilityComparison, logitComparison } from "../../../web/enhanced/src/modules/math-model";
import { KLDefinition, KLDecomposition, ShiftIdentity } from "../../../web/enhanced/src/modules/MathNotation";
import { useSceneTimeline, type SceneTimeline } from "../../../web/enhanced/src/modules/review/SceneTransport";
import { mix, windowAt } from "../../../web/enhanced/src/modules/review/lifecycle-model";

// Only review composition changes here; the existing paper model still computes every value.
const KL_FRAMES = [
  { id: "固定旧分布", durationMs: 1000, holdMs: 900 },
  { id: "当前分配改变", durationMs: 2800, holdMs: 1200 },
  { id: "Claude：取值与计算", durationMs: 3200, holdMs: 1500 },
  { id: "GPT：保留负贡献", durationMs: 3200, holdMs: 1500 },
  { id: "完整 KL", durationMs: 2400, holdMs: 1800 },
  { id: "分布重合", durationMs: 2800, holdMs: 1500 },
];
const SCORE_FRAMES = [
  { id: "对齐同一类别", durationMs: 1200, holdMs: 900 },
  { id: "看见分数变化", durationMs: 3000, holdMs: 1500 },
  { id: "相减，再平方", durationMs: 3200, holdMs: 1500 },
  { id: "同一批贡献求和", durationMs: 2400, holdMs: 1800 },
];
const fmt = (n: number, digits = 3) => (Math.abs(n) < 1e-12 ? 0 : n).toFixed(digits);
const signed = (n: number, digits = 3) => `${n < -1e-12 ? '−' : n > 1e-12 ? '+' : ''}${fmt(Math.abs(n), digits)}`;
const phase = (clip: number, t: number, i: number) => clip > i ? 1 : clip < i ? 0 : windowAt(t, .08, .86);
// Carry the preceding stage into the opening of the next one. These weights
// come from the same playback clock, so pausing also pauses the crossfade.
const handoff = (clip: number, t: number) => clip === 0 ? 1 : windowAt(t, 0, .16);
const blend = (clip: number, t: number, valueAt: (index: number) => number) => mix(valueAt(Math.max(0, clip - 1)), valueAt(clip), handoff(clip, t));
const layerOpacity = (clip: number, t: number, matches: (index: number) => boolean) => {
  const current = matches(clip), previous = matches(Math.max(0, clip - 1));
  if (current && previous) return 1;
  // Fade through the surface: distinct formulas must never form ghost digits.
  return current ? windowAt(handoff(clip, t), .5, 1) : previous ? 1 - windowAt(handoff(clip, t), 0, .5) : 0;
};

function StageNarration({ timeline, frames, notes }: { timeline: SceneTimeline; frames: typeof KL_FRAMES; notes: string[] }) {
  const { clipIndex: clip, progress: t } = timeline.state;
  return <div className="narration narration-stack" aria-live="polite">{frames.map((frame, i) => {
    const opacity = layerOpacity(clip, t, index => index === i);
    return <div key={frame.id} className="narration-layer" data-shown={opacity > 0} aria-hidden={i !== clip} style={{ opacity }}><strong>{frame.id}</strong><p>{notes[i]}</p></div>;
  })}</div>;
}

function Brand({ k, size = 36 }: { k: number; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true"><ModelPixel model={k as ModelClass} x={4} y={4} size={40} /></svg>;
}
function Transport({ timeline, frames }: { timeline: SceneTimeline; frames: typeof KL_FRAMES }) {
  const { state } = timeline;
  const total = frames.reduce((n, f) => n + f.durationMs + f.holdMs, 0) / 1000;
  return <><div className="transport">
    <button className="primary" data-play disabled={timeline.reducedMotion && !state.hasNext} onClick={timeline.toggle}>{timeline.reducedMotion ? '下一语义步骤' : state.status === 'playing' ? '暂停' : '播放 / 继续'}</button>
    <button data-replay onClick={timeline.replay}>重播整段</button><button data-back disabled={!timeline.canGoBack} onClick={timeline.previous}>上一步</button><button data-next disabled={!state.hasNext} onClick={timeline.next}>下一步</button>
    <span className="time">{timeline.elapsedSeconds.toFixed(1)} / {total.toFixed(1)} 秒</span><progress aria-label="整段播放进度" max={total} value={timeline.elapsedSeconds} />
  </div><div className="frames" style={{ '--frames': frames.length } as React.CSSProperties} aria-label="阶段导航：选择后停在阶段起点">
    {frames.map((f, i) => <button key={f.id} data-frame={i} aria-pressed={state.clipIndex === i} onClick={() => timeline.start(i)}><small>0{i + 1}</small>{f.id}</button>)}
  </div></>;
}

/** A continuous 100-unit probability field: fractional cells preserve exact total mass. */
function ProbabilityField({ values, emphasis }: { values: readonly number[]; emphasis: number[] }) {
  const cellClip = `probability-cell-${useId().replace(/:/g, '')}`;
  return <svg className="probability-field" viewBox="0 0 218 218" role="img" aria-label={`概率图谱 ${values.map(v => fmt(v, 2)).join(' / ')}`}>
    <defs><clipPath id={cellClip}><rect width="20" height="20" rx="3" /></clipPath></defs>
    {Array.from({ length: 100 }, (_, i) => {
      const x = i % 10 * 22, y = Math.floor(i / 10) * 22;
      const part = Math.max(0, Math.min(1, values[0] * 100 - i));
      return <g key={i} transform={`translate(${x} ${y})`} clipPath={`url(#${cellClip})`}>
        <rect width="20" height="20" fill="#f7f8f4" />
        <rect width={20 * part} height="20" fill="var(--category-claude)" opacity={emphasis[0]} data-probability-category="Claude" data-mass={part / 100} />
        <rect x={20 * part} width={20 * (1 - part)} height="20" fill="var(--category-gpt)" opacity={emphasis[1]} data-probability-category="GPT" data-mass={(1 - part) / 100} />
      </g>;
    })}
  </svg>;
}
function DistributionSheet({ values, current, emphasis }: { values: readonly number[]; current?: boolean; emphasis: number[] }) {
  return <article className={`distribution-sheet ${current ? 'current-sheet' : ''}`}>
    <header><span className="sheet-code">{current ? 'CURRENT' : 'REFERENCE'}</span><h3>{current ? '当前分布 q' : '固定旧分布 p'}</h3></header>
    <ProbabilityField values={values} emphasis={emphasis} />
    <div className="distribution-values">{PROBABILITY_CLASSES.map((label, k) => <div key={label} data-probability-value={values[k]} data-category={k}>
      <span className={`category-swatch tone-${k}`} /><span>{label}</span><strong>{fmt(values[k], 2)}</strong>
    </div>)}</div>
  </article>;
}

function ContributionEquation({ p, q, result, reveal }: { p: number; q: number; result: number; reveal: number }) {
  return <div className="calculation-equation" data-contribution-equation>
    <math display="block" aria-label="固定权重乘以概率比的自然对数"><mn style={{ color: `color-mix(in srgb, var(--ink) ${windowAt(reveal, .16, .36) * 100}%, #a7b4a8)` }}>{fmt(p, 2)}</mn><mo>×</mo><mi mathvariant="normal">ln</mi><mfrac><mn>{fmt(p, 2)}</mn><mn>{fmt(q, 2)}</mn></mfrac></math>
    <div className="calculation-intermediate" style={{ opacity: windowAt(reveal, .3, .55) }}><span>概率比 {fmt(p / q)}</span><span>ln 比值 {signed(Math.log(p / q))}</span></div>
    <div className={`contribution-answer ${result < 0 ? 'is-negative' : ''}`} style={{ opacity: windowAt(reveal, .55, .8), transform: `translateY(${(1 - windowAt(reveal, .55, .8)) * 12}px)` }}><span>这一类的贡献</span><strong data-focused-contribution={result}>{signed(result)}</strong></div>
  </div>;
}

function KLSum({ terms, total, visible, progress }: { terms: number[]; total: number; visible: number[]; progress: number }) {
  return <div className="kl-total-tray">
    <div className="total-label"><span className="sheet-code">SIGNED CONTRIBUTIONS</span><strong>各项带着符号，组成完整 KL</strong></div>
    <div className="sum-terms">{terms.map((value, k) => <React.Fragment key={k}>{k > 0 && <span className="operator" style={{ opacity: progress }}>+</span>}<div className={`contribution-cell ${value < 0 ? 'is-negative' : ''}`} data-term={value} style={{ opacity: visible[k] }}><span>{PROBABILITY_CLASSES[k]}</span><strong>{value < 0 ? `(${signed(value)})` : fmt(value)}</strong></div></React.Fragment>)}</div>
    <div className="sum-answer" style={{ opacity: progress }}><span className="operator">=</span><div><span>KL</span><strong data-kl-total={total}>{fmt(total)}</strong></div></div>
  </div>;
}

const calculationView = (clip: number) => clip < 2 ? 0 : clip - 1;
function KLCalculation({ clip, progress, result }: { clip: number; progress: number; result: ReturnType<typeof probabilityComparison> }) {
  return <article className="calculation-surface calculation-stack">{[0, 1, 2, 3, 4].map(view => {
    const opacity = layerOpacity(clip, progress, index => calculationView(index) === view);
    const focus = view === 1 || view === 2 ? view - 1 : undefined;
    const reveal = focus === undefined ? 1 : clip > focus + 2 ? 1 : clip === focus + 2 ? progress : 0;
    return <div key={view} data-calculation-panel={view} data-shown={opacity > 0} className="calculation-layer" aria-hidden={calculationView(clip) !== view} style={{ opacity }}>
      {focus === undefined ? <><div className="calculation-heading calculation-summary"><span className="sheet-code">{view >= 3 ? 'ACCUMULATE' : 'READ THE SAME CATEGORY'}</span><h3>{view >= 3 ? '单项可负，完整 KL 非负。' : '先确定概率从哪里来。'}</h3></div><div className="calculation-empty"><span>固定权重 pₖ</span><span>比较对象 qₖ</span><math display="block"><msub><mi>p</mi><mi>k</mi></msub><mi mathvariant="normal">ln</mi><mfrac><msub><mi>p</mi><mi>k</mi></msub><msub><mi>q</mi><mi>k</mi></msub></mfrac></math><p>{view === 4 ? '分配重合时，每一项与总和都归零。' : '依次取同类别的两个值，计算后保留符号。'}</p></div></> : <><div className="calculation-heading"><Brand k={focus} size={32} /><div><span className="sheet-code">CATEGORY 0{focus + 1}</span><h3>{PROBABILITY_CLASSES[focus]}</h3></div></div><p className="calculation-source">从左侧同一类别读取 pₖ 与 qₖ，代入一次计算。</p><ContributionEquation p={result.p[focus]} q={result.q[focus]} result={result.terms[focus]} reveal={reveal} /></>}
    </div>;
  })}</article>;
}

export function KLBoard() {
  const timeline = useSceneTimeline(KL_FRAMES), [selected, setSelected] = useState(0);
  const { clipIndex: clip, progress: t } = timeline.state;
  const q = REFERENCE_P.map((p, k) => mix(mix(p, PROBABILITY_CASES[selected].values[k], phase(clip, t, 1)), p, phase(clip, t, 5)));
  const r = probabilityComparison(REFERENCE_P, q);
  const emphasis = [0, 1].map(k => blend(clip, t, index => index === (k === 0 ? 3 : 2) ? .58 : 1));
  const visible = [clip > 2 ? 1 : clip === 2 ? windowAt(t, .8, 1) : 0, clip > 3 ? 1 : clip === 3 ? windowAt(t, .8, 1) : 0];
  const notes = [
    '两份图谱具有相同的面积与类别坐标；左侧 p 固定，右侧 q 从相同分配开始。每格为总质量的 1%，部分格连续填充，所有概率仍精确相加为 1。',
    '当前图谱的分界缓慢移动，固定参照留在原处。两次最高类别相同，也可能分配不同。这里比较合成状态，不模拟真实参数更新。',
    `聚焦 Claude：从两份图谱读取 ${fmt(r.p[0], 2)} 与 ${fmt(r.q[0], 2)}，先取比值及对数，再乘固定权重，形成 ${signed(r.terms[0])}。`,
    `把同一过程交给 GPT：保留对数比与贡献的符号。本例这一项为 ${signed(r.terms[1])}，不能把每个单项都画成非负惩罚。`,
    `两项作为同一批贡献进入汇总，完整 KL=${fmt(r.kl)}。非负结论属于总和；交换 p 与 q 一般不相同。`,
    '让 q 回到 p，图谱分界、两项贡献与总和同步归零。这个比较路径不代表真实优化器轨迹。',
  ];
  return <section data-design="kl" data-clip={clip} data-progress={t} data-status={timeline.state.status}>
    <div className="scene-heading"><div><p className="eyebrow">A / PROBABILITY COMPARISON</p><h2>同一个类别，怎样形成一个贡献？</h2></div><div className="cases" aria-label="KL 合成例">{PROBABILITY_CASES.map((c, i) => <button key={c.id} data-case={c.id} aria-pressed={i === selected} onClick={() => { setSelected(i); timeline.reset(); }}>{c.label}</button>)}</div></div>
    <div className="stage kl-stage"><div className="scene-canvas kl-composition" data-p={r.p.join(',')} data-q={r.q.join(',')} data-loss={r.kl}>
      <div className="probability-pair"><DistributionSheet values={r.p} emphasis={emphasis} /><DistributionSheet values={r.q} current emphasis={emphasis} /><p className="pair-caption">Claude / GPT 两类独立合成例 · 左侧固定，右侧重新分配</p></div>
      <KLCalculation clip={clip} progress={t} result={r} />
    </div><KLSum terms={r.terms} total={r.kl} visible={visible} progress={phase(clip, t, 4)} /></div>
    <div className="mainline-math"><div className="definition-block"><KLDefinition identified={false} /><p>p 来自固定旧分布，q 来自当前分配；k 为类别编号，本例 C=2。</p></div><div className="short-derivation"><math display="block"><msub><mi>D</mi><mtext>KL</mtext></msub><mo>=</mo><mi>H</mi><mo>(</mo><mi>p</mi><mo>,</mo><mi>q</mi><mo>)</mo><mo>−</mo><mi>H</mi><mo>(</mo><mi>p</mi><mo>)</mo></math><p>{fmt(r.crossEntropy)} − {fmt(r.entropy)} = {fmt(r.kl)}；H(p) 固定。</p></div></div>
    <Transport timeline={timeline} frames={KL_FRAMES} /><StageNarration timeline={timeline} frames={KL_FRAMES} notes={notes} />
    <details className="design-note"><summary>设计说明与数学衔接</summary><div className="spec-grid"><div><h3>两个连续的概率对象</h3><p>柔色图谱承担分配变化，类别身份与来源一直保留。图谱的颜色与品牌像素分开：大片面积统一使用浅橙和浅绿，不以品牌主色填满场景。</p></div><div><h3>清楚的计算归属</h3><p>右侧使用实际 MathML 分数，来源、代入、对数中间量和贡献各有独立行。贡献进入单独的汇总带；不画虚线拖尾，也不让飞行数值穿过公式。</p></div><div><h3>知识的进入和离开</h3><p>由 U1 的“相同最高类仍会偏离”进入；保留 KL 定义、方向和熵分解。完整非负性证明与梯度仍放 Reference；之后再追问 logits 约束有什么不同。</p></div></div><KLDecomposition identified={false} /></details>
  </section>;
}

export function ScoreBoard() {
  const timeline = useSceneTimeline(SCORE_FRAMES), [selected, setSelected] = useState(0);
  const { clipIndex: clip, progress: t } = timeline.state;
  const move = phase(clip, t, 1), square = phase(clip, t, 2), sum = phase(clip, t, 3);
  const a = HISTORY_Z.map((v, k) => mix(v, LOGIT_CASES[selected].values[k], move)), r = logitComparison(HISTORY_Z, a);
  const notes = [
    '每张响应卡只对应一个类别。空心方标是固定历史 z，实心圆标是当前 a；两者属于同一类别坐标。',
    selected ? '三个当前分数同时增加同一个 c，当前数字标记同步抬升；下方两个概率指纹保持完全相同。这里没有参数更新。' : '从相同基线展开比较：Claude 的当前分数下降，GPT 上升，DeepSeek 不变。改变的是合成比较状态，不是真实训练结果。',
    '先相减，再把同一个差值平方。负数用括号完整包住，三项分别得到非负贡献；源分数继续留在原处。',
    `同一批平方贡献相加，L_dark=${fmt(r.squaredDistance, 0)}。${selected ? '共同平移时，概率 KL 为 0，分数平方距离为 3。' : '默认示例为 1+1+0=2，历史 z 不随此过程改变。'}`,
  ];
  return <section data-design="logits" data-clip={clip} data-progress={t} data-status={timeline.state.status}>
    <div className="scene-heading"><div><p className="eyebrow">B / SCORE MATCHING</p><h2>保留每一份来源，算清每一项平方。</h2></div><div className="cases" aria-label="Logit 对照">{LOGIT_CASES.map((c, i) => <button key={c.id} data-case={c.id} aria-pressed={selected === i} onClick={() => { setSelected(i); timeline.reset(); }}>{i ? '共同平移 +1' : 'Claude / GPT 分数交换'}</button>)}</div></div>
    <div className="stage score-stage"><div className="scene-canvas" data-z={r.z.join(',')} data-a={r.a.join(',')} data-loss={r.squaredDistance}>
      <div className="score-cards">{MODEL_CLASSES.map((label, k) => <article key={label} className="response-card" data-coordinate={k} data-delta={r.differences[k]} data-square={r.squares[k]}>
        <header><Brand k={k} size={44} /><div><span className="sheet-code">CLASS 0{k + 1}</span><h3>{label}</h3></div></header>
        <div className="paired-scores"><div className="history-score"><span><i className="frozen-mark" />历史 zₖ</span><strong>{fmt(r.z[k], 0)}</strong></div><div className="current-score"><span><i className="current-mark" />当前 aₖ</span><strong style={{ transform: `translateY(${-r.differences[k] * 12}px)` }}>{fmt(r.a[k], move === 1 ? 0 : 1)}</strong></div></div>
        <div className="difference-row" style={{ opacity: phase(clip, t, 1) }}><span>同类相减</span><math display="block"><mn>{fmt(r.a[k], move === 1 ? 0 : 1)}</mn><mo>−</mo><mn>{fmt(r.z[k], 0)}</mn><mo>=</mo><mn>{signed(r.differences[k], move === 1 ? 0 : 1)}</mn></math></div>
        <div className="square-receipt" style={{ opacity: square, transform: `translateY(${(1 - square) * 16}px)` }}><div className="square-formula"><span>再平方</span><math display="block"><msup><mrow><mo>(</mo><mn>{signed(r.differences[k], 0)}</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>=</mo></math></div><div className={`square-value ${r.squares[k] === 0 ? 'is-zero' : ''}`} style={{ '--unfold': square } as React.CSSProperties}><strong data-square-result={r.squares[k]}>{fmt(r.squares[k], 0)}</strong></div></div>
        <div className="card-probabilities"><span>概率 p / q</span><strong><span data-fingerprint="p" data-value={r.p[k]}>{fmt(r.p[k])}</span><i>/</i><span data-fingerprint="q" data-value={r.q[k]}>{fmt(r.q[k])}</span></strong></div>
      </article>)}</div>
      <div className="score-total-tray"><div className="total-label"><span className="sheet-code">ONE BATCH OF CONTRIBUTIONS</span><strong>平方后，汇成一次求和。</strong></div><div className="score-sum" style={{ opacity: sum }}><math display="block" aria-label="同一批平方贡献的总和"><msub><mi>L</mi><mtext>dark</mtext></msub><mo>=</mo>{r.squares.map((v, k) => <React.Fragment key={k}>{k > 0 && <mo>+</mo>}<mn data-sum-term={v}>{fmt(v, 0)}</mn></React.Fragment>)}<mo>=</mo><mn data-score-total={r.squaredDistance}>{fmt(r.squaredDistance, 0)}</mn></math></div></div>
      <div className="probability-verdict"><span>各卡片的 p / q 均由同一组 z / a 经 softmax 计算</span><strong data-probability-kl={r.probabilityKL}>概率 KL = {fmt(r.probabilityKL)}</strong></div>
    </div></div>
    <div className="mainline-math"><div className="definition-block"><math display="block" aria-label="历史匹配损失等于各类别的当前分数与固定历史分数之差的平方和"><msub><mi>L</mi><mtext>dark</mtext></msub><mo>=</mo><munderover><mo>∑</mo><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>C</mi></munderover><msup><mrow><mo>(</mo><msub><mi>a</mi><mi>k</mi></msub><mo>−</mo><msub><mi>z</mi><mi>k</mi></msub><mo>)</mo></mrow><mn>2</mn></msup></math><p>三类独立合成例：z=(2,1,0) 固定，不与 U2 的两类概率混作同一次前向。</p></div><div className="short-derivation"><math display="block"><mtext>若 a=z+c：</mtext><msub><mi>L</mi><mtext>dark</mtext></msub><mo>=</mo><mi>C</mi><msup><mi>c</mi><mn>2</mn></msup></math><p>softmax(z+c)=softmax(z)。公共因子 eᶜ 相消，概率保持不变。</p></div></div>
    <Transport timeline={timeline} frames={SCORE_FRAMES} /><StageNarration timeline={timeline} frames={SCORE_FRAMES} notes={notes} />
    <details className="design-note"><summary>设计说明与共同平移的数学衔接</summary><div className="spec-grid"><div><h3>响应卡替代坐标图</h3><p>固定值、当前值、减法和平方共享同一张类别卡，数值采用适中的字号。每项计算有独立空间，不把文字堆在节点边。</p></div><div><h3>计算逐步展开</h3><p>当前数字变化后才出现差值，再展开平方回执，最后用同一批贡献形成求和。所有动画由现有单时钟派生；不使用虚线拖尾或与公式争抢空间的飞行数字。</p></div><div><h3>两个空间同时观察</h3><p>共同平移时，当前数值标记同步上移；同一张卡上的 p / q 保持相同。两种约束的差别来自同一组实时计算，不代表参数训练或方法性能比较。</p></div></div><ShiftIdentity /></details>
  </section>;
}
