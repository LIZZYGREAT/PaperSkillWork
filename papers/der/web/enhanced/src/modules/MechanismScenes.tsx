import React, { useId, useLayoutEffect, useRef, useState } from "react";
import ModelPixel, { type ModelClass } from "./review/ModelPixel";
import { MODEL_CLASSES, PROBABILITY_CLASSES } from "../data/model-classes";
import { REFERENCE_P, PROBABILITY_CASES, HISTORY_Z, LOGIT_CASES, probabilityComparison, logitComparison } from "./math-model";
import { KLDefinition, SquaredDefinition } from "./MathNotation";
import { ReferenceButton } from "./Reference";
import { useSceneTimeline, type SceneTimeline } from "./review/SceneTransport";
import { mix, windowAt } from "./review/lifecycle-model";

import "./mechanism-scenes.css";
// Production composition; paper-owned math and playback.
const KL_FRAMES = [
  { id: "固定旧分布", durationMs: 1000, holdMs: 900 },
  { id: "当前分配改变", durationMs: 2800, holdMs: 1200 },
  { id: "Claude：取值与计算", durationMs: 4400, holdMs: 1500 },
  { id: "GPT：计算与交接", durationMs: 4400, holdMs: 1500 },
  { id: "完整 KL", durationMs: 2400, holdMs: 1800 },
  { id: "分布重合", durationMs: 2800, holdMs: 1500 },
];
const SCORE_FRAMES = [
  { id: "对齐同一类别", durationMs: 1200, holdMs: 900 },
  { id: "看见分数变化", durationMs: 3600, holdMs: 1500 },
  { id: "相减，再平方", durationMs: 4200, holdMs: 1600 },
  { id: "同一批贡献求和", durationMs: 3000, holdMs: 1800 },
];
const fmt = (n: number, digits = 3) => (Math.abs(n) < 1e-12 ? 0 : n).toFixed(digits);
const signed = (n: number, digits = 3) => `${n < -1e-12 ? '−' : n > 1e-12 ? '+' : ''}${fmt(Math.abs(n), digits)}`;
const phase = (clip: number, t: number, i: number) => clip > i ? 1 : clip < i ? 0 : windowAt(t, .08, .86);
const local = (clip: number, t: number, i: number) => clip > i ? 1 : clip < i ? 0 : t;
const emphasisAt = (clip: number, t: number, k: number) => {
  const weight = (i: number) => i === (k === 0 ? 3 : 2) ? .58 : 1;
  return mix(weight(Math.max(0, clip - 1)), weight(clip), windowAt(t, 0, .16));
};

function Brand({ k, size = 36 }: { k: number; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true"><ModelPixel model={k as ModelClass} x={4} y={4} size={40} /></svg>;
}
function Transport({ timeline, frames }: { timeline: SceneTimeline; frames: typeof KL_FRAMES }) {
  const { state } = timeline, total = frames.reduce((n, f) => n + f.durationMs + f.holdMs, 0) / 1000;
  return <><div className="transport" role="group" aria-label="场景播放控制">
    <button className="primary" data-play disabled={timeline.reducedMotion && !state.hasNext} onClick={timeline.toggle}>{timeline.reducedMotion ? '下一语义步骤' : state.status === 'playing' ? '暂停' : '播放 / 继续'}</button>
    <button data-replay onClick={timeline.replay}>重播整段</button><button data-back disabled={!timeline.canGoBack} onClick={timeline.previous}>上一步</button><button data-next disabled={!state.hasNext} onClick={timeline.next}>下一步</button>
    <span className="playback-status">{timeline.reducedMotion ? '减少动态 · 手动阅读' : state.status === 'playing' ? '播放中' : state.status === 'finished' ? '播放结束' : '已暂停'}</span><progress aria-label="整段播放进度" max={total} value={timeline.elapsedSeconds} />
  </div><div className="frames" style={{ '--frames': frames.length } as React.CSSProperties} aria-label="阶段导航：选择后停在阶段起点">
    {frames.map((f, i) => <button key={f.id} data-frame={i} aria-pressed={state.clipIndex === i} onClick={() => timeline.start(i)}><small>0{i + 1}</small>{f.id}</button>)}
  </div></>;
}
function StageNarration({ timeline, frames, notes }: { timeline: SceneTimeline; frames: typeof KL_FRAMES; notes: string[] }) {
  // One readable sentence at a time; no stacked translucent text at a handoff.
  return <div className="narration" aria-live="polite"><strong>{frames[timeline.state.clipIndex].id}</strong><p>{notes[timeline.state.clipIndex]}</p></div>;
}

/** A value copy travels between measured anchors. The original stays visible.
 * Geometry only: ResizeObserver never owns playback, numbers, or animation time. */
function ResultTransfer({ from, to, progress, label, children, reduced, tone }: { from: string; to: string; progress: number; label: string; children: React.ReactNode; reduced: boolean; tone?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [points, setPoints] = useState<number[] | null>(null);
  useLayoutEffect(() => {
    const root = ref.current?.closest('.stage');
    if (!root) return;
    const update = () => {
      const source = root.querySelector(from)?.getBoundingClientRect(), target = root.querySelector(to)?.getBoundingClientRect(), box = root.getBoundingClientRect();
      if (source && target) setPoints([source.x + source.width / 2 - box.x, source.y + source.height / 2 - box.y, target.x + target.width / 2 - box.x, target.y + target.height / 2 - box.y]);
    };
    update(); const observer = new ResizeObserver(update); observer.observe(root);
    return () => observer.disconnect();
  }, [from, to]);
  const p = windowAt(progress, .72, .96), active = !reduced && progress > .72 && progress < .98 && points;
  return <span ref={ref} className={`result-transfer${tone === undefined ? "" : ` tone-${tone}`}`} data-transfer={label} aria-hidden="true" style={{ opacity: active ? Math.min(windowAt(progress, .72, .76), 1 - windowAt(progress, .94, .98)) : 0,
    left: points ? mix(points[0], points[2], p) : 0, top: points ? mix(points[1], points[3], p) - Math.sin(p * Math.PI) * 14 : 0 }}>{children}</span>;
}

function ProbabilityField({ values, emphasis }: { values: readonly number[]; emphasis: number[] }) {
  const id = `field-${useId().replace(/:/g, '')}`;
  // A continuous shared-area partition; grid is only a scale for probability mass.
  return <svg className="probability-field" viewBox="0 0 218 218" role="img" aria-label={`概率分配 ${values.map(v => fmt(v, 2)).join(' / ')}`}>
    <defs><clipPath id={id}><rect width="218" height="218" rx="9" /></clipPath><pattern id={`${id}-grid`} width="21.8" height="21.8" patternUnits="userSpaceOnUse"><path d="M21.8 0H0V21.8" fill="none" stroke="#fff" strokeWidth="2.3" /></pattern></defs>
    <g clipPath={`url(#${id})`}><rect width="218" height="218" fill="#f6f7f2" />
      <rect width="218" height={218 * values[0]} fill="var(--category-claude)" opacity={emphasis[0]} data-probability-category="Claude" data-mass={values[0]} />
      <rect width="218" y={218 * values[0]} height={218 * values[1]} fill="var(--category-gpt)" opacity={emphasis[1]} data-probability-category="GPT" data-mass={values[1]} />
      <rect width="218" height="218" fill={`url(#${id}-grid)`} />
      <path d={`M0 ${218 * values[0]}H218`} stroke="#758877" strokeWidth="1.5" data-partition={values[0]} />
    </g>
  </svg>;
}
function DistributionSheet({ values, current, emphasis }: { values: readonly number[]; current?: boolean; emphasis: number[] }) {
  return <article className={`distribution-sheet ${current ? 'current-sheet' : ''}`}>
    <header><span className="sheet-code">{current ? '比较对象' : '固定参照'}</span><h3>{current ? '当前分布 q' : '旧分布 p'}</h3></header>
    <ProbabilityField values={values} emphasis={emphasis} />
    <div className="distribution-values">{PROBABILITY_CLASSES.map((label, k) => <div key={label} data-probability-value={values[k]} data-category={k} style={{ borderColor: emphasis[k] === 1 ? "var(--tone-line)" : "#e2e7df" }} className={`source-tag tone-${k}`}>
      <span className="source-name"><span className={current ? 'current-mark' : 'frozen-mark'} />{label}</span><strong><small>{current ? 'q' : 'p'}ₖ</small>{fmt(values[k], 2)}</strong>
    </div>)}</div>
  </article>;
}
function KLLane({ k, result, progress, active }: { k: number; result: ReturnType<typeof probabilityComparison>; progress: number; active: boolean }) {
  const p = result.p[k], q = result.q[k], value = result.terms[k];
  const read = windowAt(progress, .03, .19), log = windowAt(progress, .22, .39), weight = windowAt(progress, .44, .6), answer = windowAt(progress, .62, .72);
  return <div className={`calculation-lane tone-${k}`} data-active={active} data-lane={k}>
    <header><Brand k={k} size={28} /><h3>{PROBABILITY_CLASSES[k]}</h3><span>{progress >= .72 ? '贡献保留' : active ? '正在计算' : '等待取值'}</span></header>
    <div className="operand-pair" style={{ opacity: read, transform: `translateX(${(1 - read) * -16}px)` }}>
      <span className="source-tag"><i className="frozen-mark" />pₖ <b>{fmt(p, 2)}</b></span><span className="source-tag"><i className="current-mark" />qₖ <b>{fmt(q, 2)}</b></span><small>同类取值</small>
    </div>
    <div className="calculation-steps">
      <div style={{ opacity: log }}><span>① 比值 → 自然对数</span><math display="block"><mi mathvariant="normal">ln</mi><mfrac><mn>{fmt(p, 2)}</mn><mn>{fmt(q, 2)}</mn></mfrac><mo>=</mo><mn>{signed(Math.log(p / q))}</mn></math></div>
      <div style={{ opacity: weight }}><span>② 乘固定旧权重</span><math display="block"><mn>{fmt(p, 2)}</mn><mo>×</mo><mo>(</mo><mn>{signed(Math.log(p / q))}</mn><mo>)</mo></math></div>
    </div>
    <div className="contribution-answer" style={{ opacity: answer }}><span>带符号贡献</span><strong data-origin-kl={k} data-focused-contribution={value}>{signed(value)}</strong></div>
  </div>;
}
function KLSum({ result, clip, t }: { result: ReturnType<typeof probabilityComparison>; clip: number; t: number }) {
  const sum = phase(clip, t, 4);
  return <div className="kl-total-tray"><div className="total-label"><span className="sheet-code">同一组贡献</span><strong>单项保留正负，总和量化偏离</strong></div>
    <div className="sum-terms">{result.terms.map((v, k) => <React.Fragment key={k}>{k > 0 && <span className="operator" style={{ opacity: sum }}>+</span>}<div data-target-kl={k} className={`contribution-cell tone-${k}`} style={{ opacity: windowAt(local(clip, t, k + 2), .98, 1) }}><span>{PROBABILITY_CLASSES[k]}</span><strong data-term={v}>{v < 0 ? `(${signed(v)})` : signed(v)}</strong></div></React.Fragment>)}</div>
    <div className="sum-answer" style={{ opacity: sum }}><span className="operator">=</span><div><span>完整 KL ≥ 0</span><strong data-kl-total={result.kl}>{fmt(result.kl)}</strong></div></div>
  </div>;
}
export function KLBoard() {
  const timeline = useSceneTimeline(KL_FRAMES), [selected, setSelected] = useState(0);
  const { clipIndex: clip, progress: t } = timeline.state;
  const q = REFERENCE_P.map((p, k) => mix(mix(p, PROBABILITY_CASES[selected].values[k], phase(clip, t, 1)), p, phase(clip, t, 5)));
  const r = probabilityComparison(REFERENCE_P, q), emphasis = [0, 1].map(k => emphasisAt(clip, t, k));
  const notes = [
    '同样大小的图谱表示概率分配。方标 p 固定，圆标 q 将改变；面积不是 KL，右侧公式才定义比较方式。',
    'q 的分界连续移动，p 保持不动。两次最高类别相同，也可能有不同的概率分配。',
    `跟随 Claude 的色签读取 pₖ/qₖ → 求自然对数 → 乘旧权重，得到 ${signed(r.terms[0])}，再送到下方。`,
    `同样读取 GPT：qₖ 大于 pₖ 时，对数比为负，本项为 ${signed(r.terms[1])}。Claude 的结果继续保留。`,
    `正负项共同求和得到 ${fmt(r.kl)}；非负性属于完整 KL，而非每个单项。固定 p 时，H(p) 是常数，减小交叉熵就减小 KL。`,
    'q 回到 p，比值变成 1、对数与贡献归零。KL≥0，且正概率下仅在 p=q 时为 0；这是合成概率对照，不是真实梯度下降轨迹。',
  ];
  return <section className="mechanism-scenes" data-design="kl" data-clip={clip} data-progress={t} data-status={timeline.state.status}>
    <div className="scene-heading"><div><p className="eyebrow">01 / 概率约束</p><h2>跟随同一类别，从概率走到 KL。</h2></div><div className="cases" aria-label="KL 合成例">{PROBABILITY_CASES.map((c, i) => <button key={c.id} data-case={c.id} aria-pressed={i === selected} onClick={() => { setSelected(i); timeline.reset(); }}>{c.label}</button>)}</div></div>
    <Transport timeline={timeline} frames={KL_FRAMES} />
    <div className="stage kl-stage"><div className="scene-canvas kl-composition" data-p={r.p.join(',')} data-q={r.q.join(',')} data-loss={r.kl}>
      <div className="probability-pair"><DistributionSheet values={r.p} emphasis={emphasis} /><DistributionSheet values={r.q} current emphasis={emphasis} /><p className="pair-caption">Claude / GPT 两类合成例 · 同色签对应同一类别<br />每格为总面积的 1%；分界可连续经过格子。</p></div>
      <article className="calculation-surface"><div className="calculation-intro"><h3>取值 → 对数比 → 旧概率加权</h3><div className="kl-main-equation"><KLDefinition identified={false}/><p>k 对齐同一类别；p 是固定旧概率，q 随当前分配变化。完整求和比较两组分布，单项可以为负。</p><ReferenceButton term="kl">非负证明、方向与梯度</ReferenceButton></div></div>{[0, 1].map(k => <KLLane key={k} k={k} result={r} progress={local(clip, t, k + 2)} active={clip === k + 2} />)}</article>
    </div><KLSum result={r} clip={clip} t={t} />{[0, 1].map(k => <ResultTransfer key={k} from={`[data-origin-kl="${k}"]`} to={`[data-target-kl="${k}"]`} progress={local(clip, t, k + 2)} label={PROBABILITY_CLASSES[k]} tone={k} reduced={timeline.reducedMotion}><span>{PROBABILITY_CLASSES[k]}</span><b>{signed(r.terms[k])}</b></ResultTransfer>)}
      <div className="kl-objective-note"><span>固定旧分布 p 时</span><math display="block" aria-label="KL 等于交叉熵 H p q 减去固定熵 H p"><mi>D</mi><mo>(</mo><mi>p</mi><mo>∥</mo><mi>q</mi><mo>)</mo><mo>=</mo><mi>H</mi><mo>(</mo><mi>p</mi><mo>,</mo><mi>q</mi><mo>)</mo><mo>−</mo><mi>H</mi><mo>(</mo><mi>p</mi><mo>)</mo></math><p>H(p) 不随 q 改变，因此最小化 KL 等价于最小化交叉熵 H(p,q)。</p></div>
    </div>
    <StageNarration timeline={timeline} frames={KL_FRAMES} notes={notes} />
    <div className="scene-handoff"><span>下一问</span><p>KL 已给概率偏离一个可优化的尺度；但 softmax 看不见分数的共同平移。若要保留原始响应，直接比较 logits 会发生什么？</p></div>
  </section>;
}

function ScoreTrack({ z, a, reveal }: { z: number; a: number; reveal: number }) {
  const x = (v: number) => 30 + v * 84, delta = a - z;
  return <svg className="score-track" viewBox="0 0 312 128" role="img" aria-label={`共同刻度 0 至 3，固定 z ${fmt(z, 0)}，当前 a ${fmt(a, 2)}`} data-history-position={z} data-current-position={a}>
    <line x1="30" x2="282" y1="108" y2="108" className="track-axis" />{[0, 1, 2, 3].map(n => <g key={n}><line x1={x(n)} x2={x(n)} y1="103" y2="112" className="track-axis" /><text x={x(n)} y="127" textAnchor="middle">{n}</text></g>)}
    <line x1={x(z)} x2={x(z)} y1="33" y2="101" className="history-guide" /><text x={x(z)} y="20" textAnchor="middle">z = {fmt(z, 0)}</text><rect data-history-marker x={x(z) - 7} y="31" width="14" height="14" rx="2" className="history-point" />
    <g style={{ opacity: reveal }}><rect data-score-gap x={Math.min(x(z), x(a))} y="49" width={Math.abs(delta) * 84} height="8" rx="3" className="gap-band" /><path d={`M${x(a)} 53l${-Math.sign(delta) * 7} -5v10Z`} className="gap-tip" opacity={Math.abs(delta) > .03 ? 1 : 0} /></g>
    <circle data-current-marker cx={x(a)} cy="65" r="7" className="current-point" /><text x={x(a)} y="88" textAnchor="middle" className="a-label">a = {fmt(a, 1)}</text>
  </svg>;
}
function SquareReceipt({ delta, value, reveal, k }: { delta: number; value: number; reveal: number; k: number }) {
  const side = Math.abs(delta) * 48, height = mix(5, side, reveal);
  return <div className="square-receipt" style={{ opacity: windowAt(reveal, 0, .12) }}>
    <svg className="area-receipt" viewBox="0 0 76 76" role="img" aria-label={`差距绝对值 ${fmt(Math.abs(delta), 1)} 的平方，面积 ${fmt(value, 2)}`}>
      <rect data-square-area={value} x={(76 - side) / 2} y={(76 - height) / 2} width={side} height={height} rx="2" className="area-fill" />
      {value === 0 && <circle cx="38" cy="38" r="3" fill="#8c9b87" />}
    </svg><div><span>{value === 0 ? '差距为零，无面积' : '差距展开成平方面积'}</span><math display="block"><msup><mrow><mo>(</mo><mn>{signed(delta, 0)}</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>=</mo><mn data-origin-square={k} data-square-result={value}>{fmt(value, 0)}</mn></math></div>
  </div>;
}
function ProbabilityProjection({ result, shifted }: { result: ReturnType<typeof logitComparison>; shifted: boolean }) {
  return <div className="probability-projection"><header><div><span className="sheet-code">同一组分数 → softmax → 概率空间</span><h3>{shifted ? '分数一起移动，概率仍然重合。' : '分数变化，概率投影同步变化。'}</h3></div><div className="fingerprint-legend"><span><i className="frozen-mark" />旧 p</span><span><i className="current-mark" />当前 q</span></div></header>
    <div className="projection-columns">{MODEL_CLASSES.map((name, k) => <div className="projection-cell" key={name}><div><span>{name}</span><span className="projection-values"><span data-fingerprint="p" data-value={result.p[k]}>{fmt(result.p[k])}</span><i>/</i><span data-fingerprint="q" data-value={result.q[k]}>{fmt(result.q[k])}</span></span></div><svg viewBox="0 0 312 54" role="img" aria-label={`${name} 旧概率 ${fmt(result.p[k])}，当前概率 ${fmt(result.q[k])}`}>
      <line x1="22" x2="290" y1="20" y2="20" className="track-axis" /><text x="22" y="49" textAnchor="middle">0</text><text x="290" y="49" textAnchor="middle">1</text>
      <rect data-projection-p={result.p[k]} x={22 + result.p[k] * 268 - 8} y="12" width="16" height="16" rx="2" className="history-point" /><circle data-projection-q={result.q[k]} cx={22 + result.q[k] * 268} cy="20" r="4.5" className="current-point" />
    </svg></div>)}</div><div className="probability-verdict"><span>方框是旧概率，圆点是当前概率；重合表示两者相同。</span><strong data-probability-kl={result.probabilityKL}>概率 KL = {fmt(result.probabilityKL)}</strong></div>
    {shifted && <div className="shift-identity-note"><math display="block" aria-label="softmax z 加 c 乘全一向量等于 softmax z；平方距离为 C c 平方"><mi>softmax</mi><mo>(</mo><mi>z</mi><mo>+</mo><mi>c</mi><mi mathvariant="bold">1</mi><mo>)</mo><mo>=</mo><mi>softmax</mi><mo>(</mo><mi>z</mi><mo>)</mo><mo>;</mo><mspace width="1em"/><msub><mi>L</mi><mtext>dark</mtext></msub><mo>=</mo><mi>C</mi><msup><mi>c</mi><mn>2</mn></msup></math><span>本例 C=3、c=1：概率 KL=0，logit 平方距离=3。</span></div>}
  </div>;
}
export function ScoreBoard() {
  const timeline = useSceneTimeline(SCORE_FRAMES), [selected, setSelected] = useState(0);
  const { clipIndex: clip, progress: t } = timeline.state;
  const move = phase(clip, t, 1), squareTime = local(clip, t, 2), sum = phase(clip, t, 3);
  const a = HISTORY_Z.map((v, k) => mix(v, LOGIT_CASES[selected].values[k], move)), r = logitComparison(HISTORY_Z, a);
  const notes = [
    '三类共用 0 至 3 的分数刻度。空心方标 z 固定，实心圆标 a 从相同位置开始；下方是同一组分数的概率投影。',
    selected ? '三个当前圆标同步向右移动，旧方标不动。下方 p/q 全程重合：共同平移改变 logits，却不改变 softmax 概率。' : 'Claude 的圆标向左，GPT 向右，DeepSeek 留在原处。下方概率由同一组当前分数实时计算。',
    selected ? '三个差值都为 +1，各自展开成相同的单位正方形。概率投影保持重合，分数空间却累积了三份平方偏离。' : '逐类把差距展开成面积：−1 与 +1 都形成单位正方形；零差距没有面积。先相减再平方，正负偏离不会抵消。',
    `三项带着类别身份汇入一次求和：${r.squares.map(v => fmt(v, 0)).join('+')}=${fmt(r.squaredDistance, 0)}。${selected ? '概率 KL=0，分数平方距离=3，两个目标约束不同空间。' : '历史 z 始终固定；合成插值只用于观察比较，不代表真实 SGD。'}`,
  ];
  return <section className="mechanism-scenes" data-design="logits" data-clip={clip} data-progress={t} data-status={timeline.state.status}>
    <div className="scene-heading"><div><p className="eyebrow">02 / 分数约束</p><h2>看见分数的距离，也看见概率的投影。</h2></div><div className="cases" aria-label="Logit 对照">{LOGIT_CASES.map((c, i) => <button key={c.id} data-case={c.id} aria-pressed={selected === i} onClick={() => { setSelected(i); timeline.reset(); }}>{i ? '共同平移 +1' : 'Claude / GPT 分数交换'}</button>)}</div></div>
    <Transport timeline={timeline} frames={SCORE_FRAMES} />
    <div className="stage score-stage"><div className="scene-canvas" data-z={r.z.join(',')} data-a={r.a.join(',')} data-loss={r.squaredDistance}>
      <div className="score-space-label"><strong>分数空间</strong><span><i className="frozen-mark" />历史 z 固定</span><span><i className="current-mark" />当前 a 移动</span><small>三卡共同刻度 · 0 → 3</small></div>
      <div className="score-main-equation"><SquaredDefinition identified={false}/><p>a 是当前 logits，z 是保存时冻结的历史 logits；按同一类别对齐。先观察分数偏差，再看每项平方怎样组成损失。</p><ReferenceButton term="squared">梯度、共同平移与深入推导</ReferenceButton></div>
      <div className="score-cards">{MODEL_CLASSES.map((name, k) => <article key={name} className="response-card" data-coordinate={k} data-delta={r.differences[k]} data-square={r.squares[k]}>
        <header><Brand k={k} size={34} /><h3>{name}</h3><span className="sheet-code">0{k + 1}</span></header>
        <ScoreTrack z={r.z[k]} a={r.a[k]} reveal={move} />
        <div className="difference-row" style={{ opacity: move }}><span>同类相减</span><math display="block"><mn>{fmt(r.a[k], move === 1 ? 0 : 1)}</mn><mo>−</mo><mn>{fmt(r.z[k], 0)}</mn><mo>=</mo><mn>{signed(r.differences[k], move === 1 ? 0 : 1)}</mn></math></div>
        <SquareReceipt k={k} delta={r.differences[k]} value={r.squares[k]} reveal={windowAt(squareTime, k * .23, k * .23 + .4)} />
      </article>)}</div>
      <div className="score-total-tray"><div className="score-sum-heading"><div className="total-label"><span className="sheet-code">同一批平方贡献</span><strong>平方后，一次求和。</strong></div><div className="score-final" style={{ opacity: windowAt(local(clip, t, 3), .96, 1) }}><math display="block"><msub><mi>L</mi><mtext>dark</mtext></msub><mo>=</mo><mn data-score-total={r.squaredDistance}>{fmt(r.squaredDistance, 0)}</mn></math></div></div><div className="score-sum-columns">{r.squares.map((v, k) => <div key={k} className="score-sum-cell"><div data-target-square={k} style={{ opacity: windowAt(local(clip, t, 3), .5 + k * .18, .6 + k * .18) }}><span>{MODEL_CLASSES[k]}</span><math display="block"><mn data-sum-term={v}>{fmt(v, 0)}</mn></math></div>{k < 2 && <span className="sum-plus" style={{ opacity: sum }}>+</span>}</div>)}</div></div>
      <ProbabilityProjection result={r} shifted={selected === 1} />
    </div>{[0, 1, 2].map(k => <ResultTransfer key={k} from={`[data-origin-square="${k}"]`} to={`[data-target-square="${k}"]`} progress={windowAt(local(clip, t, 3), k * .18, .5 + k * .18)} label={MODEL_CLASSES[k]} reduced={timeline.reducedMotion}><span>{MODEL_CLASSES[k]}</span><b>{fmt(r.squares[k], 0)}</b></ResultTransfer>)}</div>
    <StageNarration timeline={timeline} frames={SCORE_FRAMES} notes={notes} />
    <div className="scene-handoff"><span>下一问</span><p>平方匹配保留了共同平移也会改变的原始分数信息。现在沿同一条样本记录，看看网络在什么时候复制并冻结这组 logits，留给未来回放。</p></div>
  </section>;
}
