
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";
import { Sub } from "./lesson-math";
import { promptPoolConfig as config } from "./prompt-retrieval-data";
import {
  P6_FINAL_POOL_EXAMPLE, P6_IMAGE_CLS_SEQUENCE_INDEX, P6_LAST_PATCH_SEQUENCE_INDEX,
  P6_POOL_SAMPLE_ROWS, P6_PROMPT_TOKEN_COUNT, P6_PROMPT_TOKEN_MAP, P6_SELECTED_PROMPT_INDICES,
  P6_SEQUENCE_LENGTH,
} from "./prompt-forward-data";
import { easeMotion } from "./visual-motion";
import "./prompt-forward.css";

const stops = [
  { time: 0, label: "从池中读取", note: "按 P5 的选择顺序读取 Prompt，配对 Key 留在池中。" },
  { time: 2800, label: "拼成输入", note: "五组 Prompt 排在图像之前，形成一条序列。" },
  { time: 5400, label: "经过编码器", note: "全部位置保留原来的顺序，各向量融合了上下文。" },
  { time: 8600, label: "取出并平均", note: "只对 H 的前 25 行逐维平均，图像输出仍留在 H 中。" },
  { time: 10800, label: "生成类别分数", note: "共享分类器把 768 维向量 h 映射为类别 Logits。" },
] as const;

const duration = 11900;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const promptColors = ["#795caa", "#9869a4", "#6466a3", "#9a6681", "#5b789e"];
const tokenX = (group: number, token: number) => 48 + group * 102 + token * 17;
const sequenceY = 119;
const outputY = 257;

function ForwardScene({ time }: { time: number }) {
  const progress = (start: number, end: number) => easeMotion((time - start) / (end - start));
  const encode = progress(3130, 5140);
  const lift = progress(5750, 6760);
  const gather = progress(6870, 8430);
  const classify = progress(9020, 10650);
  const sourceOpacity = 1 - 0.52 * progress(2800, 3200);
  const vectorX = mix(345, 552, classify);
  const rowY = mix(sequenceY, outputY, encode);
  return <svg className="p6-scene" viewBox="0 0 850 416" role="img" aria-label="25 个 Prompt Token 与图像 Token 拼接，穿过冻结编码器。前 25 个输出被读出、平均，然后送入共享分类器。">
    <text x="48" y="21" className="p6-stage-label">池中配对 · Query A</text>
    <g opacity={sourceOpacity}>
      {P6_SELECTED_PROMPT_INDICES.map((id, group) => {
        const x = tokenX(group, 0) + 15;
        return <g key={id}>
          <path d={`M${x} 43 l7 -7 7 7 -7 7z`} fill="#26736a" />
          <text x={x + 19} y="48">k{id}</text>
          <path d={`M${x + 7} 53 v8`} className="p6-hairline" />
          <rect x={x - 6} y="74" width="76" height="20" rx="3" fill="none" stroke={promptColors[group]} strokeDasharray="3 3" />
        </g>;
      })}
    </g>
    <text x="582" y="47" className="p6-stage-label">图像嵌入 xₑ</text>
    <text x="582" y="68" className="p6-muted">[CLS] 与 {config.imageLength - 1} 个 Patch</text>
    <path d="M36 156H814 M36 286H814" className="p6-hairline" strokeDasharray="4 5" />
    <text x="48" y="152" className="p6-muted" opacity={progress(1800, 2500)}>输入 xₚ · {P6_PROMPT_TOKEN_COUNT} + {config.imageLength} = {P6_SEQUENCE_LENGTH} 个位置</text>

    {[174, 194, 214].map((y, layer) => <path key={y} d={`M44 ${y} H796 L809 ${y + 13} H57 Z`}
      fill={layer === 1 ? "#d7e3e4" : "#e7eeef"} stroke="#a7b9bf" />)}
    <g opacity={1 - 0.93 * Math.sin(Math.PI * encode)}><rect x="310" y="181" width="230" height="44" rx="5" fill="#f7faf9" stroke="#a7b9bf" />
    <path d="M326 200 v-4 a4 4 0 0 1 8 0 v4 m-10 0 h12 v10 h-12z" fill="none" stroke="#3a626e" strokeWidth="1.7" />
    <text x="346" y="208" className="p6-stage-label">冻结 Transformer · fᵣ</text></g>

    <g opacity={encode}>
      <text x="48" y="312" className="p6-stage-label">输出 H</text>
      <text x="133" y="312" className="p6-muted">Prompt 位置 0–{P6_PROMPT_TOKEN_COUNT - 1}</text>
      <text x="582" y="312" className="p6-muted">图像位置 {P6_IMAGE_CLS_SEQUENCE_INDEX}–{P6_LAST_PATCH_SEQUENCE_INDEX}</text>
    </g>
    <path d="M44 281 v5 H538 v-5" fill="none" stroke="#795caa" opacity={lift} />

    {P6_PROMPT_TOKEN_MAP.map(({promptIndex, promptOrdinal: group, tokenIndex: token, sequenceIndex}) => {
      const assemble = progress(240 + group * 220, 1580 + group * 220);
      const x = mix(tokenX(group, token) + 14 - token * 3, tokenX(group, token), assemble);
      const color = promptColors[group];
      const y = mix(83, rowY, assemble);
      const pooledX = mix(x, 325 + sequenceIndex * 1.55, gather);
      const pooledY = mix(y, mix(334, 361, gather), lift);
      return <g key={sequenceIndex} data-position={sequenceIndex}>
        <rect x={x} y={y - 10} width="12" height="21" rx="2" fill={color} opacity={1 - lift * 0.7} />
        <path d={`M${x + 3} ${y + 1} h6 m-6 4 h4`} stroke="white" opacity={encode * (1 - lift * .7)} />
        <rect data-pooled-position={sequenceIndex} x={pooledX} y={pooledY - 10} width="12" height="21" rx="2" fill={color}
          opacity={lift * (1 - gather)} />
        {token === 2 && <text x={x + 6} y={y - 17} fill={color} textAnchor="middle">P{promptIndex}</text>}
      </g>;
    })}
    <g transform={`translate(0 ${mix(83, rowY, progress(700, 2480))})`} opacity={1 - 0.54 * lift}>
      <rect x="582" y="-11" width="59" height="24" rx="4" fill="#dce9ed" stroke="#5d8190" />
      <text x="612" y="6" textAnchor="middle">[CLS]</text>
      {[653, 677, 701, 785].map(x => <rect key={x} x={x} y="-10" width="17" height="22" rx="2" fill="#73939f" />)}
      <text x="747" y="6" textAnchor="middle">···</text>
      <path d="M660 2 h4 m20 0 h4 m20 0 h4 m80 0 h4" stroke="white" opacity={encode} />
    </g>

    <g opacity={lift}>
      <text x="48" y="370" className="p6-stage-label">AvgPool</text>
      <text x="48" y="392" className="p6-muted">逐维相加，再除以 {P6_PROMPT_TOKEN_COUNT}</text>
    </g>
    <g opacity={gather} transform={`translate(${vectorX} 362)`}>
      <rect x="-31" y="-17" width="62" height="34" rx="5" fill="#e9e2f3" stroke="#795caa" />
      <path d="M-20 -5 h16 m-16 5 h11 m-11 5 h16" stroke="#795caa" strokeWidth="2" />
      <text x="13" y="5" textAnchor="middle" className="p6-stage-label">h</text>
    </g>
    <g opacity={progress(8910, 9410)}>
      <path d="M584 362 h16 m130 0 h20 m-5 -4 5 4 -5 4" className="p6-hairline" />
      <rect x="600" y="342" width="130" height="40" rx="6" fill="#eef1e9" stroke="#91a487" />
      <text x="665" y="367" textAnchor="middle" className="p6-stage-label">分类器 gφ</text>
    </g>
    <g opacity={progress(10150, 10780)}>
      <text x="765" y="358" className="p6-stage-label">Logits z</text>
      <text x="765" y="381" className="p6-muted">取最大分数</text>
    </g>
  </svg>;
}

export function PromptForward() {
  const playback = useLessonPlayback(duration);
  const stop = stops.reduce((active, candidate) => candidate.time <= playback.position ? candidate : active, stops[0]);
  return <>
    <p className="lesson-lead">上一页为图像 A 找到了 {P6_SELECTED_PROMPT_INDICES.map(id => `P${id}`).join("、")}。这些是池中已经学到的向量组。要得到类别分数，还要把它们交给 ViT，让每个 Prompt 位置吸收当前图像的信息。</p>

    <section className="explain-section">
      <h3>同一组冻结权重，两次不同的调用</h3>
      <p>检索时，ViT 先单独处理图像，从 <code>[CLS]</code> 位置得到 Query，再用它与外部 Key 比较。拿到索引之后，分类调用重新使用<span className="lesson-key">同一组冻结权重</span>，输入现在包括选中的 Prompt。Key 留在池中，Query 已经完成寻址。</p>
      <dl className="p6-calls">
        <div><dt>检索</dt><dd>图像 → 冻结 ViT → [CLS] → Query → 选集</dd></div>
        <div><dt>分类</dt><dd>Prompt + 图像 → 同一 ViT → Prompt 位置 → Logits</dd></div>
      </dl>
    </section>

    <section className="explain-section">
      <h3>沿序列方向，把 Prompt 接到图像前面</h3>
      <p>P2 的图像嵌入 <math><Sub base="x" index="e" /><mo>=</mo><Sub base="f" index="e" /><mo>(</mo><mi>x</mi><mo>)</mo></math> 已经包含 [CLS] 和 {config.imageLength - 1} 个 Patch。每组选中的 Prompt 含 <math><Sub base="L" index="p" /><mo>=</mo><mn>{config.promptLength}</mn></math> 个 Token。播放时可以看见各组依 P5 的顺序展开，前置于图像序列，随后整条序列穿过冻结编码器。</p>
      <div className="p6-equation"><math>
        <Sub base="x" index="p" /><mo>=</mo><mo>[</mo><Sub base="P" index="s₁" /><mo>;</mo><mo>…</mo><mo>;</mo><Sub base="P" index="sₙ" /><mo>;</mo><Sub base="x" index="e" /><mo>]</mo>
      </math></div>
    </section>

    <figure className="lesson-figure p6-forward-figure">
      <div className="p6-control-dock">
        <div className="motion-stops" role="group" aria-label="分类前向阶段">
          {stops.map(item => <button type="button" className="lesson-choice" key={item.time} aria-pressed={item === stop}
            onClick={() => playback.seek(item.time)}>{item.label}</button>)}
        </div>
        <PlaybackControls playback={playback} label="分类进度" />
      </div>
      <div className="p6-scene-scroll" tabIndex={0} role="region" aria-label="Token 装配、编码与读出图">
        <ForwardScene time={playback.position} />
      </div>
      <figcaption aria-live="polite">{stop.note}</figcaption>
    </figure>

    <section className="explain-section" id="p6-readout">
      <h3>从编码后的 Prompt 位置读出类别特征</h3>
      <p>冻结 Transformer 计算 <math><mi>H</mi><mo>=</mo><Sub base="f" index="r" /><mo>(</mo><Sub base="x" index="p" /><mo>)</mo></math> 时，扩展序列的全部位置参与上下文计算。行号一一对应，向量内容已经改变，因此开头 {P6_PROMPT_TOKEN_COUNT} 个 <span className="lesson-key">Prompt 输出位置</span>现在带有图像信息。图像的 [CLS] 与 Patch 输出仍在 H 中，它们从位置 {P6_IMAGE_CLS_SEQUENCE_INDEX} 开始。</p>
      <p>L2P 对开头 <math><mi>N</mi><Sub base="L" index="p" /></math> 行按位置做平均。每一维独立相加并除以位置数，结果 <math><mi>h</mi></math> 仍为 {config.featureWidth} 维。共享分类器由它得到各类别的 Logits，最高分所在的类别就是本次预测。</p>
      <div className="p6-equation"><math>
        <Sub base="h" index="d" /><mo>=</mo><mfrac><mn>1</mn><mrow><mi>N</mi><Sub base="L" index="p" /></mrow></mfrac>
        <munderover><mo>∑</mo><mrow><mi>r</mi><mo>=</mo><mn>0</mn></mrow><mrow><mi>N</mi><Sub base="L" index="p" /><mo>−</mo><mn>1</mn></mrow></munderover>
        <Sub base="H" index="r,d" />
      </math><math><mi>z</mi><mo>=</mo><Sub base="g" index="φ" /><mo>(</mo><mi>h</mi><mo>)</mo></math></div>
      <details className="p6-inspect">
        <summary>核算平均池化的一维教学例子</summary>
        <p>以下为手工构造的输出分量。每行对应一个 Prompt 的五个输出位置。</p>
        <ul>{P6_POOL_SAMPLE_ROWS.map(row => <li key={row.promptIndex}>
          <strong>P{row.promptIndex}</strong><span>{row.values.map(value => value.toFixed(1)).join(" · ")}</span>
        </li>)}</ul>
        <p>第 1 维平均值 = {P6_FINAL_POOL_EXAMPLE.sum.toFixed(1)} ÷ {P6_FINAL_POOL_EXAMPLE.totalCount} = {P6_FINAL_POOL_EXAMPLE.runningMean?.toFixed(3)}。</p>
      </details>
    </section>
    <section className="explain-section">
      <h3>拼接改变位置数，特征宽度保持不变</h3>
      <p>池容量 <math><mi>M</mi><mo>=</mo><mn>{config.poolSize}</mn></math> 给出候选组数，本次只读 <math><mi>N</mi><mo>=</mo><mn>{P6_SELECTED_PROMPT_INDICES.length}</mn></math> 组。它们贡献 {P6_PROMPT_TOKEN_COUNT} 个位置，与 {config.imageLength} 个图像位置合为 {P6_SEQUENCE_LENGTH} 个位置。输入与输出的每一行都保持 <math><mi>D</mi><mo>=</mo><mn>{config.featureWidth}</mn></math> 维。</p>
    </section>
    <p className="lesson-takeaway">有了类别分数，就能用训练标签衡量预测误差。下一页追踪这个误差怎样训练 Prompt 与分类器，以及检索 Key 从哪里获得自己的学习信号。</p>
  </>;
}
