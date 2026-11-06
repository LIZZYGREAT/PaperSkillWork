import { useState } from "react";
import type { ReactNode } from "react";
import { Term } from "../shared/core/reference/ReferenceHub";

const GRID = 14;

function pixel(x: number, y: number) {
  if ((y === 10 && x > 0) || (y === 9 && x > 9)) return "#876343";
  if (x === 10 && y === 4) return "#c59349";
  if (x === 8 && y === 3) return "#182a22";
  if ((x - 7) ** 2 + (y - 4) ** 2 < 9) return "#477587";
  if ((x - 6) ** 2 / 15 + (y - 7) ** 2 / 7 < 1) return x < 6 ? "#547c88" : "#d59b63";
  if (x + y === 11 && x < 5 && x > 0) return "#477587";
  return ["#dce7cc", "#c8d8b3", "#e3e9d0", "#d0ddbe"][(x * 5 + y * 3 + x * y) % 4];
}

function Specimen({ selected, onSelect }: { selected?: number; onSelect?: (index: number) => void }) {
  return (
    <svg className={onSelect ? "specimen specimen-select" : "specimen"} viewBox="0 0 14 14" role="img"
      aria-label={onSelect ? "鸟图像的 14×14 Patch 网格。可用下方滑块选择。" : "教学用像素鸟图像"}
      shapeRendering="crispEdges">
      {Array.from({ length: GRID * GRID }, (_, index) => (
        <rect key={index} x={index % GRID} y={Math.floor(index / GRID)} width="1" height="1"
          fill={pixel(index % GRID, Math.floor(index / GRID))} onClick={onSelect ? () => onSelect(index) : undefined} />
      ))}
      {onSelect && Array.from({ length: 13 }, (_, index) => (
        <path key={index} d={`M${index + 1} 0v14 M0 ${index + 1}h14`} stroke="#ffffff" strokeOpacity=".76"
          strokeWidth=".055" pointerEvents="none" />
      ))}
      {selected !== undefined && <rect x={selected % GRID + .05} y={Math.floor(selected / GRID) + .05}
        width=".9" height=".9" stroke="#1b4a34" strokeWidth=".13" fill="none" pointerEvents="none" />}
    </svg>
  );
}

function Arrow() {
  return <svg className="flow-arrow" viewBox="0 0 24 18" aria-hidden="true"><path d="M2 9h18m-6-5 6 5-6 5" /></svg>;
}

function Takeaway({ children }: { children: ReactNode }) {
  return <p className="lesson-takeaway">{children}</p>;
}

const predictions = [
  [{ label: "鸟", value: 86 }, { label: "鱼", value: 14 }],
  [{ label: "鸟", value: 22 }, { label: "鱼", value: 8 }, { label: "猫", value: 63 }, { label: "狗", value: 7 }],
];

export function TaskStream() {
  const [phase, setPhase] = useState(0);
  return (
    <>
      <p className="rk-prose">通常，一张图像 <i>x</i> 经过分类器得到各类别的分数，训练则用标签更新参数。连续学习改变的是数据到达的方式。旧任务的图像可能已经无法访问，新数据仍会更新同一组参数。</p>
      <figure className="lesson-figure">
        <div className="figure-top"><strong>顺序训练 → 统一预测</strong><span>合成教学示例</span></div>
        <div className="figure-body">
          <div className="task-rail" aria-label="选择训练快照">
            {["任务 1 · 鸟、鱼", "任务 2 · 猫、狗"].map((label, index) =>
              <button key={label} type="button" className="lesson-choice" aria-pressed={phase === index} onClick={() => setPhase(index)}>{label}</button>)}
          </div>
          <div className="task-scene">
            <div className="scene-object"><Specimen /><strong>同一张旧测试图</strong><small>真实类别：鸟</small></div>
            <Arrow />
            <div className="scene-object classifier"><strong>共享分类器</strong><span className="math-label">{phase === 0 ? "fθ₁" : "fθ₂"}</span><small>{phase === 0 ? "完成任务 1 的训练" : "接着用新类图像更新"}</small></div>
            <Arrow />
            <div className="score-panels" aria-label="两个训练快照的预测对照">
              {predictions.map((rows, index) =>
                <section key={index} className={index === phase ? "score-panel is-active" : "score-panel"}>
                  <h3>任务 {index + 1} 后 <small>{index === phase ? "当前快照" : "对照"}</small></h3>
                  {rows.map(({ label, value }) => <div className="score-row" key={label}>
                    <span>{label}</span><span className="score-track" aria-hidden="true"><span style={{ width: value + "%" }} className={label === "鸟" ? "bird-score" : ""} /></span><span>{value}%</span>
                  </div>)}
                </section>)}
            </div>
          </div>
          <p className="scene-readout" aria-live="polite">{phase === 0 ? "用 θ₁ 预测这张旧图，最高分是「鸟」。" : "用 θ₂ 预测同一张图，最高分变为「猫」。"}</p>
        </div>
        <figcaption>示意分数用于对照共享参数的两个状态。论文的 Split CIFAR-100 将 100 类分为 10 个任务，每个任务含 10 个互不重叠的类别。</figcaption>
      </figure>
      <div className="lesson-notes">
        <section><h3>旧预测为什么会变？</h3><p>新任务的更新也改动了旧类依赖的权重。旧任务表现因此可能下降，这就是 <Term id="forgetting" />。</p></section>
        <section><h3>测试时要选哪些类？</h3><p>类别增量测试不给任务 ID，候选来自所有已学类别。论文也考察领域增量和训练边界不显式可用的设定。</p></section>
      </div>
      <Takeaway>作者从一个已经学到视觉表征的主干出发，保留主干权重，把后续适应交给少量可训练参数。下一步拆开这个主干，看看特征从哪里来。</Takeaway>
    </>
  );
}

function Tokens({ output = false, patch }: { output?: boolean; patch?: number }) {
  const selected = patch === undefined ? null : patch + 1;
  return (
    <div className="token-strip" aria-label={output ? "输出 Token 序列" : "输入 Token 序列"}>
      <span className="token special">CLS</span>
      {selected === null ? <><span className="token">{output ? "z₁" : "1"}</span><span>…</span><span className="token">{output ? "z₁₉₆" : "196"}</span></> : <>
        {selected > 1 && <span aria-hidden="true">…</span>}
        <span className="token traced-token" aria-label={`选中 Patch 的 Token ${selected}`}>{selected}</span>
        {selected < 196 && <span aria-hidden="true">…</span>}
      </>}
    </div>
  );
}

export function ViTPath() {
  const [patch, setPatch] = useState(63);
  const row = Math.floor(patch / GRID);
  const col = patch % GRID;
  return (
    <>
      <p className="rk-prose">预训练特征主干分成两段。输入嵌入 <i>fₑ</i> 把二维图像变成向量序列，Encoder 堆叠 <i>fᵣ</i> 逐层更新这些向量。</p>
      <figure className="lesson-figure">
        <div className="figure-top"><strong>Vision Transformer</strong><span>典型 ViT-B/16 · 224×224 输入</span></div>
        <div className="figure-body">
          <div className="vit-flow">
            <div className="flow-group embed-group">
              <span className="group-name">fₑ · 输入嵌入</span>
              <div className="flow-group-body">
                <div className="flow-node"><Specimen /><strong>图像</strong><small>224×224×3</small></div><Arrow />
                <div className="flow-node"><Specimen selected={patch} onSelect={setPatch} /><strong>Patch 网格</strong><small>14×14 块</small></div><Arrow />
                <div className="flow-node"><div className="projection">线性映射</div><strong>Patch → Token</strong><small>逐块投影</small></div><Arrow />
                <div className="flow-node"><Tokens patch={patch} /><strong>输入序列</strong><small>另加 CLS 与位置信息</small></div>
              </div>
            </div>
            <Arrow />
            <div className="flow-group encoder-group">
              <span className="group-name">fᵣ · 特征计算</span>
              <div className="encoder-stack"><span>Block 1</span><span>Block 2</span><span>⋮</span><span>Block 12</span></div>
              <small>输出接入下一层</small>
            </div>
            <Arrow />
            <div className="flow-group output-group">
              <span className="group-name">输出与读出</span><Tokens output />
              <p><b>[CLS] 特征</b><br /><small>普通 ViT 分类头的输入</small></p>
            </div>
          </div>
          <div className="patch-detail">
            <div className="patch-control">
              <h3>放大一块 Patch</h3>
              <p>点击上方网格，或用滑块追踪同一块图像区域。</p>
              <label htmlFor="patch-index">第 {patch + 1} 块 · 第 {row + 1} 行，第 {col + 1} 列</label>
              <input id="patch-index" type="range" min="1" max="196" value={patch + 1} onChange={e => setPatch(Number(e.target.value) - 1)} />
            </div>
            <div className="patch-chain">
              <div className="flow-node"><div className="patch-crop" style={{ backgroundColor: pixel(col, row) }} /><strong>Patch {patch + 1}</strong><small>16×16×3</small></div>
              <Arrow />
              <div className="flow-node"><div className="projection">展平 → 投影</div><strong>向量映射</strong><small>16×16×3 → 768 个输入值</small></div>
              <Arrow />
              <div className="flow-node"><span className="token active-token">{patch + 1}</span><strong>Token {patch + 1}</strong><small>768 维特征</small></div>
            </div>
          </div>
        </div>
        <figcaption>图像为像素化示例。方块表示对应位置，特征由投影计算。普通 ViT 分类读出在图中单独标注。</figcaption>
      </figure>
      <div className="lesson-notes">
        <section><h3>197 是长度，768 是宽度</h3><p>每边 224 ÷ 16 = 14 块，得到 196 个 Patch Token。另有一个 [CLS] 特殊位置。位置编码帮助区分来自不同区域的 Token。</p></section>
        <section><h3>层层传递的是特征序列</h3><p><Term id="vit" /> 的典型 12 层堆叠保留序列的形状，各层更新向量中的内容。普通 ViT 可用末层 [CLS] 做分类，L2P 在后续方法中另有分类读出。</p></section>
      </div>
      <div className="shape-equation"><math display="block"><msub><mi>X</mi><mi>e</mi></msub><mo>=</mo><msub><mi>f</mi><mi>e</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo><mo>∈</mo><msup><mi>ℝ</mi><mrow><mn>197</mn><mo>×</mo><mn>768</mn></mrow></msup></math></div>
      <Takeaway>最初的 Patch Token 来自局部图像。经过 Encoder，它为什么能带上其他位置的信息？打开一层来看。</Takeaway>
    </>
  );
}


type Vector = readonly [number, number];

const baseTokens = [
  { name: "[CLS]", vector: [1, 0] },
  { name: "Patch A", vector: [2, 1] },
  { name: "Patch B", vector: [0, 2] },
] as const;
const extraToken = { name: "额外 Token", vector: [3, 2] } as const;

function attention(target: number, extra: boolean) {
  const tokens = extra ? [...baseTokens, extraToken] : [...baseTokens];
  // W_Q and W_K are identity. W_V swaps the two coordinates.
  const query = baseTokens[target].vector;
  const terms = tokens.map(({ name, vector }) => ({
    name, key: vector, value: [vector[1], vector[0]] as Vector,
    score: (query[0] * vector[0] + query[1] * vector[1]) / Math.sqrt(2),
  }));
  const max = Math.max(...terms.map(row => row.score));
  const denominator = terms.reduce((sum, row) => sum + Math.exp(row.score - max), 0);
  const rows = terms.map(row => ({ ...row, weight: Math.exp(row.score - max) / denominator }));
  const output = rows.reduce<Vector>((sum, row) =>
    [sum[0] + row.value[0] * row.weight, sum[1] + row.value[1] * row.weight], [0, 0]);
  return { rows, output, query };
}

function vectorText(values: Vector, digits = 0) {
  return "[" + values.map(value => value.toFixed(digits)).join(", ") + "]";
}

function ResidualPath({ input, operation, result }: { input: string; operation: string; result: string }) {
  return (
    <div className="residual-unit">
      <div className="bypass"><span>残差 · 保留输入 {input}</span></div>
      <div className="block-nodes">
        <strong>{input}</strong><Arrow /><span>LayerNorm</span><Arrow />
        <b>{operation}</b><Arrow /><span className="sum-node" aria-label="与残差相加">+</span><Arrow /><strong>{result}</strong>
      </div>
    </div>
  );
}

export function EncoderAttention() {
  const [target, setTarget] = useState(0);
  const [extra, setExtra] = useState(false);
  const current = attention(target, extra);
  const base = extra ? attention(target, false) : current;
  return (
    <>
      <p className="rk-prose">P2 的每个 Block 都接收一整串 Token。下面拆开一个典型的 Pre-LN Block，沿着输入 <i>Z</i> 追到输出 <i>Z′</i>。</p>
      <figure className="lesson-figure">
        <div className="figure-top"><strong>Transformer Encoder Block</strong><span>典型 Pre-LN 结构</span></div>
        <div className="figure-body">
          <div className="block-flow">
            <ResidualPath input="Z" operation="多头注意力" result="U" />
            <ResidualPath input="U" operation="MLP / FFN" result="Z′" />
          </div>
          <div className="block-equations">
            <math display="block"><mi>U</mi><mo>=</mo><mi>Z</mi><mo>+</mo><mi>MSA</mi><mo>(</mo><mi>LN</mi><mo>(</mo><mi>Z</mi><mo>)</mo><mo>)</mo></math>
            <math display="block"><msup><mi>Z</mi><mo>′</mo></msup><mo>=</mo><mi>U</mi><mo>+</mo><mi>MLP</mi><mo>(</mo><mi>LN</mi><mo>(</mo><mi>U</mi><mo>)</mo><mo>)</mo></math>
          </div>
        </div>
        <figcaption>每个子层在计算前先归一化，再与该子层的原输入相加。注意力跨 Token 读取信息，FFN 单独变换每个 Token 的特征。Z′ 接入下一层。</figcaption>
      </figure>

      <h3 className="detail-title">放大多头注意力中的一个 Head</h3>
      <p className="rk-prose">记归一化后的输入为 X，三组投影得到 Q = XW<sub>Q</sub>、K = XW<sub>K</sub>、V = XW<sub>V</sub>。选中一个目标，用它的 Q 和各来源的 K 计算匹配，再用匹配得到的权重汇总 V。</p>
      <figure className="lesson-figure attention-figure">
        <div className="figure-top"><strong>从匹配分数到输出向量</strong><span>二维教学示例 · 投影权重固定</span></div>
        <div className="figure-body">
          <div className="attention-controls">
            <div className="target-picker" aria-label="选择目标 Token">
              {baseTokens.map(({ name }, i) => <button key={name} className="lesson-choice" type="button"
                aria-pressed={target === i} onClick={() => setTarget(i)}>{name}</button>)}
            </div>
            <label className="extra-switch"><input type="checkbox" checked={extra} onChange={e => setExtra(e.target.checked)} />加入额外 Token</label>
          </div>
          <p className="attention-query">目标 {baseTokens[target].name} 的 Q = <b>{vectorText(current.query)}</b>。示例的 Q、K 保留原坐标，V 交换两维。</p>
          <div className="score-table-wrap">
            <table className="attention-table">
              <thead><tr><th scope="col">来源</th><th scope="col">Key</th><th scope="col">Value</th><th scope="col">Q · K / √2</th><th scope="col">Softmax 权重</th></tr></thead>
              <tbody>{current.rows.map(({ name, key, value, score, weight }) => <tr key={name}>
                <th scope="row">{name}</th><td>{vectorText(key)}</td><td>{vectorText(value)}</td><td>{score.toFixed(3)}</td>
                <td><span className="weight-row"><span className="score-track" aria-hidden="true"><span style={{ width: weight * 100 + "%" }} /></span>{(weight * 100).toFixed(1)}%</span></td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="attention-result" aria-live="polite">
            <div><small>同一目标 · 原序列</small><strong>{vectorText(base.output, 3)}</strong></div>
            <div><small>{extra ? "加入额外 Token · Σ 权重 × V" : "当前输出 · Σ 权重 × V"}</small><strong>{vectorText(current.output, 3)}</strong></div>
          </div>
        </div>
        <figcaption>这里展示一个目标的一行计算，来源包含目标本身。权重对当前全部来源归一化。真实 ViT 处理完整序列，显示值已四舍五入。</figcaption>
      </figure>
      <div className="lesson-notes">
        <section><h3>多个 Head 如何汇合？</h3><p>每个 Head 有各自的 Q、K、V 投影，独立得到聚合向量。把同一位置的各 Head 输出拼接，再经输出投影回到模型宽度。</p></section>
        <section><h3>为什么权重固定，输出还会变？</h3><p>加入额外 Token 后，原 Token 和投影权重保持固定。新的 Key 和 Value 参与匹配与聚合，改变了原目标的权重和输出。可打开 <Term id="attention" /> 查看归一化公式。</p></section>
      </div>
      <Takeaway>冻结的是参数。只要改变输入，前向计算仍可得到不同特征。既然增加一个 Token 就能影响输出，它能否成为专门用于适应新任务的可学习输入？</Takeaway>
    </>
  );
}
