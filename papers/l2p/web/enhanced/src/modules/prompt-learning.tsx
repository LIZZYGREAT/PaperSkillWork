
import { useState } from "react";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";
import { Sub } from "./lesson-math";
import { promptPoolConfig, QUERIES } from "./prompt-retrieval-data";
import {
  distanceFromExampleKey, gradientSourcesForSlot, P7_BATCH_INDICES, P7_BATCH_SAMPLES,
  P7_COMMON_INDICES, P7_EXAMPLE_GRADIENT, P7_UNTOUCHED_INDICES,
} from "./prompt-learning-data";
import { easeMotion } from "./visual-motion";
import "./prompt-learning.css";

const stops = [
  { time: 0, label: "读取同一快照", note: "A、B 都使用 Θᵦ 检索和分类。点击槽位可对照两份选集。" },
  { time: 2900, label: "分类梯度", note: "A 的分类误差经冻结 Transformer 回到所选 Prompt，也直接到达共享分类器。" },
  { time: 5300, label: "匹配梯度", note: "A 的匹配项直接对所选 Key 求导。硬 Top‑N 的索引挡住了分类梯度到 Key 的路径。" },
  { time: 8350, label: "汇总两份贡献", note: "B 也走两条路径。同一个槽位收到的梯度在批内相加，参数仍是 Θᵦ。" },
  { time: 10900, label: "一次写回", note: "优化器读取整批梯度，写回所选 Prompt、Key 与共享分类器。下一批读取 Θᵦ₊₁。" },
] as const;
const duration = 11900;
const parameterRows = [
  { kind: "prompts", y: 58, fill: "#795caa", pale: "#eee8f5", label: "Prompt" },
  { kind: "classifier", y: 153, fill: "#795caa", pale: "#eee8f5", label: "共享分类器" },
  { kind: "keys", y: 248, fill: "#26736a", pale: "#e5f1ec", label: "Key" },
] as const;

function BatchScene({ time, slot }: { time: number; slot: number }) {
  const progress = (start: number, end: number) => easeMotion((time - start) / (end - start));
  const write = progress(9220, 10770);
  const written = time >= 10770;
  const gradientSources = gradientSourcesForSlot(slot);
  const destinations = parameterRows.map(row => ({
    ...row,
    title: row.kind === "classifier" ? row.label + " φ" : row.label + " " + (row.kind === "prompts" ? "P" : "k") + slot,
    sources: gradientSources[row.kind],
  }));

  return <svg className="p7-scene" viewBox="0 0 900 319" role="img" aria-label={`槽位 ${slot} 的分类和匹配梯度归属。分类梯度汇入选中 Prompt 和共享分类器，匹配梯度汇入选中 Key，批末写回一次。`}>
    <text x="25" y="26" className="p7-strong">样本读入 Θᵦ</text>
    <text x="229" y="26" className="p7-strong">反向传播</text>
    <text x="643" y="26" className="p7-strong">{written ? "写回 Θᵦ₊₁" : "待写回 · 参数 Θᵦ"}</text>
    <path d="M623 34 V293" stroke="#a8bbb0" strokeDasharray="5 5" />
    {P7_BATCH_SAMPLES.map(({id, selected}, i) => {
      const y = 66 + i * 138;
      const query = QUERIES[id].vector;
      const isA = i === 0;
      const active = isA ? 1 : 0.55 + 0.45 * progress(5700, 6700);
      return <g key={id} opacity={active}>
        <circle cx="46" cy={y + 11} r="21" fill={isA ? "#f3e8d9" : "#e0edf3"} stroke={isA ? "#a67437" : "#587c95"} />
        <path d={`M46 ${y + 11} l${16 * query.x} ${-16 * query.y}`} stroke={isA ? "#945b24" : "#456880"} strokeWidth="2.6" />
        <circle cx={46 + 16 * query.x} cy={y + 11 - 16 * query.y} r="3" fill={isA ? "#945b24" : "#456880"} />
        <text x="77" y={y + 5} className="p7-strong">样本 {id} · 标签 y{id}</text>
        <text x="77" y={y + 26}>选集</text>
        {selected.map((index, order) => <g key={index} transform={`translate(${26 + 34 * order} ${y + 49})`}>
          <rect width="29" height="23" rx="3" fill={index === slot ? "#eee8f5" : "#f1f5ef"} stroke={index === slot ? "#795caa" : "#cad5cb"} />
          <text x="14.5" y="16" textAnchor="middle">{index}</text>
        </g>)}
        <text x="229" y={y + 4} className="p7-cls">分类 · CE(z{id}, y{id})</text>
        <text x="229" y={y + 66} className="p7-match">匹配 · ∑ γ(q{id}, kⱼ)</text>
        <path d={`M227 ${y + 18} h142`} stroke="#b89b6d" strokeDasharray="3 4" />
        <text x="229" y={y + 40} className="p7-limit">硬 Top‑N 截断分类 → Key</text>
      </g>;
    })}
    {destinations.map(({kind, title, y, fill, pale, sources}) => {
      const arrived = sources.filter(id => time >= (id === "B" ? 8110 : kind === "keys" ? 5150 : 2730));
      const updates = sources.length > 0;
      return <g key={kind} data-parameter={kind} data-written={written && updates}>
        {sources.map(id => {
          const i = id === "A" ? 0 : 1;
          const isKey = kind === "keys";
          const sourceY = (isKey ? 128 : 66) + i * 138;
          const targetY = y + (i === 0 ? 5 : 26);
          const route = `M389 ${sourceY} C494 ${sourceY}, 523 ${targetY}, 641 ${targetY}`;
          const signal = i === 1 ? progress(6030, 8110) : isKey ? progress(3390, 5150) : progress(640, 2730);
          return <g key={id}>
            <path d={route} fill="none" stroke={fill} strokeWidth="1.5" opacity=".23" strokeDasharray="3 5" />
            <path data-contribution={`${id}-${kind}`} d={route} pathLength="1" fill="none" stroke={fill} strokeWidth="2.6"
              strokeDasharray="1 1" strokeDashoffset={1 - signal} opacity={signal === 0 ? 0 : 1 - 0.60 * write}
              style={{opacity:signal === 0 ? 0 : 1 - 0.60 * write, strokeDashoffset:1 - signal}} />
          </g>;
        })}
        <rect x="641" y={y - 10} width="235" height="69" rx="6" fill={pale} stroke={fill} />
        <text x="656" y={y + 13} className="p7-strong">{title}</text>
        <path d={`M655 ${y + 35} H863`} stroke={fill} opacity=".2" />
        {arrived.map((id, i) => <g key={id} transform={`translate(${656 + i * 28 + write * (112 - i * 28)} ${y + 25})`} opacity={1 - write}>
          <rect width="21" height="22" rx={id === "A" ? 11 : 3} fill={fill} />
          <text x="10.5" y="16" textAnchor="middle" className="p7-receipt">{id}</text>
        </g>)}
        <text x="654" y={y + 47} opacity={updates ? 0 : 1}>本批无直接梯度</text>
        {updates && <g opacity={write}>
          <rect x="655" y={y + 26} width={200 * write} height="24" rx="3" fill={fill} />
          <text x="667" y={y + 44} className="p7-receipt" opacity={progress(10240, 10770)}>{sources.join(" + ")} · {written ? "已写回" : "整批梯度"}</text>
        </g>}
      </g>;
    })}
  </svg>;
}

function KeyGradientStudy() {
  const playback = useLessonPlayback(2200);
  const progress = easeMotion(playback.position / playback.duration);
  const { initialKey, updatedKey } = P7_EXAMPLE_GRADIENT;
  const key = { x: initialKey.x + (updatedKey.x - initialKey.x) * progress, y: initialKey.y };
  const distance = distanceFromExampleKey(key);
  const tipX = 58 + 89 * key.x;
  return <details className="p7-key-study">
    <summary>放大一个 Key 的二维更新</summary>
    <div className="p7-key-study-body">
      <div>
        <p>固定 q = (1, 0)，从 k = (0, 1) 开始。余弦距离的梯度为 (−1, 0)，以步长 0.2 做一步 SGD 得到 k′ = (0.2, 1)。下一次算距离时直接用新的 Key。</p>
        <p>这个局部例子使用二维 SGD。论文实验的优化器是 Adam。</p>
        <PlaybackControls playback={playback} label="Key 更新进度" />
      </div>
      <svg viewBox="0 0 235 142" role="img" aria-label={`当前 Key 的余弦距离为 ${distance.toFixed(3)}`}>
        <path d="M58 16 V116 H204" fill="none" stroke="#a8bbb0" />
        <path d="M58 116 H147" stroke="#a67437" strokeWidth="2.5" />
        <path d="M58 116 V27" stroke="#a8bbb0" strokeDasharray="4 4" />
        <path d={`M58 116 L${tipX} 27`} stroke="#26736a" strokeWidth="3" />
        <circle cx={tipX} cy="27" r="4" fill="#26736a" />
        <text x={tipX + 10} y="31">k</text><text x="155" y="114">q</text>
        <text x="58" y="138">余弦距离 {distance.toFixed(3)}</text>
      </svg>
    </div>
  </details>;
}

export function PromptLearning() {
  const playback = useLessonPlayback(duration);
  const [slot, setSlot] = useState(P7_COMMON_INDICES[0]);
  const stop = stops.reduce((active, item) => item.time <= playback.position ? item : active, stops[0]);
  return <>
    <p className="lesson-lead">P6 用已经选好的 Prompt 得到了类别分数。训练时还知道图像的真实标签，于是可以衡量预测偏差，并用它调整分类过程。检索本身也要学习，因为这一轮选中的 Key 决定了下一轮有哪些 Prompt 容易被读到。</p>
    <section className="explain-section">
      <h3>分类误差沿着前向计算回到 Prompt</h3>
      <p>用交叉熵比较样本的类别分数和标签得到<span className="lesson-key">分类损失</span>。共享分类器直接参与预测，因此可以接收这项损失的梯度。选中的 Prompt 先经过 Transformer，再经平均池化影响类别分数，所以梯度也沿着这条路径回到这些 Prompt。冻结层照常参与求导，其权重保持固定。</p>
      <div className="p7-equation"><math><Sub base="L" index="cls" /><mo>=</mo><mi>CE</mi><mo>(</mo><Sub base="g" index="φ" /><mo>(</mo><mi>h</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>)</mo><mo>,</mo><mi>y</mi><mo>)</mo></math></div>
    </section>
    <section className="explain-section">
      <h3>用距离给已选 Key 直接的学习信号</h3>
      <p>轻微移动一个 Key 时，余弦距离会连续变化。<span className="lesson-key">硬 Top‑N</span>只返回一组整数索引，名次越过入选边界时，索引才会跳变。以当前选集为条件求分类梯度，无法沿离散索引回到 Key 排名。</p>
      <p>因此，L2P 把已选 Key 到冻结 Query 的距离相加，作为<span className="lesson-key">匹配损失</span>。这项距离直接依赖 Key 向量，能让已选 Key 向当前 Query 的方向靠近。系数 λ 控制匹配损失在联合目标中的权重。</p>
      <div className="p7-equation">
        <math><Sub base="L" index="match" /><mo>=</mo><munder><mo>∑</mo><mrow><mi>j</mi><mo>∈</mo><mi>S</mi><mo>(</mo><mi>x</mi><mo>)</mo></mrow></munder>
        <mi>γ</mi><mo>(</mo><mi>q</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>,</mo><Sub base="k" index="j" /><mo>)</mo></math>
        <math><mi>L</mi><mo>=</mo><Sub base="L" index="cls" /><mo>+</mo><mi>λ</mi><Sub base="L" index="match" /></math>
      </div>
    </section>
    <section className="explain-section">
      <h3>两个样本先把贡献累积到同一份参数</h3>
      <p>Mini-batch 是一组共同完成一次更新的样本。下图中的 A、B 沿用 P5 的选集，前向和损失计算都从同一份 <math><Sub base="Θ" index="b" /></math> 读取参数。选集相交于 {P7_COMMON_INDICES.join("、")} 号槽位。观察这些槽位时，两份分类梯度会汇入同一个 Prompt，两份匹配梯度会汇入其配对 Key。</p>
    </section>
    <figure className="lesson-figure p7-batch-figure">
      <div className="p7-control-dock">
        <div className="motion-stops p7-motion-stops" role="group" aria-label="联合训练阶段">
          {stops.map(item => <button className="lesson-choice" type="button" key={item.time} aria-pressed={stop === item}
            onClick={() => playback.seek(item.time)}>{item.label}</button>)}
        </div>
        <PlaybackControls playback={playback} label="批内更新进度" />
      </div>
      <div className="p7-scene-scroll" role="region" tabIndex={0} aria-label="两个样本的学习路径">
        <BatchScene time={playback.position} slot={slot} />
      </div>
      <div className="p7-slots" role="group" aria-label="查看池中槽位">
        <strong>放大槽位</strong>
        {Array.from({length: promptPoolConfig.poolSize}, (_, offset) => {
          const index = offset + 1;
          const sources = gradientSourcesForSlot(index).keys;
          return <button className="lesson-choice" key={index} type="button" aria-pressed={slot === index} data-slot={index}
            aria-label={`槽位 ${index} · ${sources.join(" 和 ") || "本批未命中"}`} onClick={() => setSlot(index)}>
            {index}<span>{sources.join("+") || "·"}</span>
          </button>;
        })}
      </div>
      <figcaption aria-live="polite">{stop.note}</figcaption>
    </figure>
    <section className="explain-section">
      <h3>汇总整批梯度后，优化器写回一次</h3>
      <p>这里按 Algorithm 1 将样本损失相加。对每个参数求导时，A、B 对它的贡献相加，之后执行<span className="lesson-key">一次 Batch 更新</span>。本批命中的槽位是 {P7_BATCH_INDICES.join("、")}，{P7_UNTOUCHED_INDICES.join("、")} 号槽位没有来自本批样本的直接梯度。共享分类器收到 A、B 两份分类梯度。</p>
      <div className="p7-equation">
        <math><Sub base="L" index="batch" /><mo>=</mo><Sub base="L" index="A" /><mo>+</mo><Sub base="L" index="B" /></math>
        <math><Sub base="Θ" index="b+1" /><mo>=</mo><mi>OptimizerStep</mi><mo>(</mo><Sub base="Θ" index="b" /><mo>,</mo><mo>∇</mo><Sub base="L" index="batch" /><mo>)</mo></math>
      </div>
      <KeyGradientStudy />
    </section>
    <p className="lesson-takeaway">下一批重新用更新后的 Key 排名，并从同一组参数读取选中的 Prompt 和分类器。P8 将沿这份状态追踪下一批、下一项任务与最终预测。</p>
  </>;
}
