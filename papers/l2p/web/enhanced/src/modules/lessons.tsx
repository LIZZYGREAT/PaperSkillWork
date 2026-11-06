import { useState } from "react";
import type { ReactNode } from "react";
import { Term } from "../shared/core/reference/ReferenceHub";

import { PATCH_GRID, Specimen } from "./specimen";
import { Arrow, BlockDiagram, HeadMerge, PatchJourney, VectorGlyph, ViTOverview } from "./vit-visuals";

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
      <p className="lesson-lead">普通图像分类会用标签纠正预测，更新模型参数。现在把训练数据拆成按顺序到来的任务。任务 2 开始时，任务 1 的原始图像可能已经无法访问，分类器却要接着学习。</p>
      <figure className="training-strip">
        <div className="training-stop"><small>第一批训练图像</small><div className="class-tags"><span>鸟</span><span>鱼</span></div><b>任务 1 完成 · θ₁</b></div>
        <div className="training-update"><Arrow /><small>沿用并更新参数</small></div>
        <div className="training-stop"><small>随后到来的图像</small><div className="class-tags"><span>猫</span><span>狗</span></div><b>任务 2 完成 · θ₂</b></div>
      </figure>
      <section className="explain-section">
        <h3>更新一次，用同一张旧图再试一次</h3>
        <p>θ₂ 从 θ₁ 接着训练。由于新旧类使用同一组权重，这次更新也可能改动旧类依赖的特征。下面固定测试图，只切换参数快照。</p>
      </section>
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
            <div className="scene-object classifier"><strong>共享分类器</strong>
              <svg className="classifier-glyph" viewBox="0 0 100 48" aria-hidden="true">
                <path className={phase === 1 ? "updated-weights" : ""} d="M12 12 49 8 87 12 M12 12 49 24 87 36 M12 36 49 8 87 36 M12 36 49 40 87 12 M12 12 49 40 87 36 M12 36 49 24 87 12" />
                {[ [12,12], [12,36], [49,8], [49,24], [49,40], [87,12], [87,36] ].map(([x,y]) => <circle key={x + ":" + y} cx={x} cy={y} r="4.5" />)}
              </svg>
              <span className="math-label">{phase === 0 ? "fθ₁" : "fθ₂"}</span><small>{phase === 0 ? "完成任务 1 的训练" : "接着用新类图像更新"}</small></div>
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
      <section className="explain-section">
        <h3>测试图来自哪个任务，模型事先并不知道</h3>
        <p>上面那张图仍是鸟。到了第二次测试，模型要在鸟、鱼、猫、狗里统一选择。若让模型先用任务号排除猫和狗，就改变了类别增量的测试条件。</p>
        <div className="test-routing" role="group" aria-label="一张测试图进入统一的已学类别空间">
          <div className="route-input"><Specimen /><div><b>只收到图像</b><small>任务 ID 未提供</small></div></div><Arrow />
          <div className="route-classes"><div className="class-tags"><span>鸟</span><span>鱼</span><span>猫</span><span>狗</span></div><small>全部已学类别一起竞争</small></div>
        </div>
        <p>这张旧图的误判说明干扰可能怎样发生。<Term id="forgetting" /> 要从旧任务整体表现的退化来判断。论文也考察类别集合不变、数据域变化的领域增量，以及训练边界不明确的设定。</p>
      </section>
      <section className="explain-section">
        <h3>能否保留主干的视觉能力？</h3>
        <p>如果预训练模型已经学到了可复用的视觉特征，就可以保留主干权重，让少量其他参数承担后续适应。基础 L2P 沿这个方向设计，无需保存旧样本来做回放。</p>
      </section>
      <Takeaway>要知道冻结以后还有什么可以利用，先跟着这张图走一遍 ViT，看它怎样形成视觉特征。</Takeaway>
    </>
  );
}

export function ViTPath() {
  const [patch, setPatch] = useState(65);
  const row = Math.floor(patch / PATCH_GRID);
  const col = patch % PATCH_GRID;
  return (
    <>
      <p className="lesson-lead">P1 把分类器当成了黑盒。要理解 L2P 为什么能冻结主干，我们先把黑盒拆开，看看图像在哪里变成向量，又在哪里获得上下文。</p>
      <ViTOverview index={patch} select={setPatch} />
      <section className="explain-section">
        <h3>二维图像怎样变成一串向量？</h3>
        <p>Transformer 的输入是一串同宽向量。把 224×224 的图像沿两轴每 16 像素切一次，每边得到 14 块，一共 196 块。按从上到下、每行从左到右的顺序编号，就能把二维网格排成一条序列。</p>
        <figure className="lesson-figure patch-lab">
          <div className="figure-top"><strong>追踪原图中的一块 Patch</strong><span>点击架构图中的网格或拖动滑块</span></div>
          <div className="figure-body">
            <div className="patch-control">
              <label htmlFor="patch-index">第 {patch + 1} 块 · 第 {row + 1} 行，第 {col + 1} 列</label>
              <input id="patch-index" type="range" min="1" max="196" value={patch + 1} onChange={e => setPatch(Number(e.target.value) - 1)} />
            </div>
            <PatchJourney index={patch} />
          </div>
          <figcaption>裁切区域取自同一张插图。展平只重排像素。线性投影用同一组权重把各块变成特征。图中的向量格示意形状和位置。</figcaption>
        </figure>
        <p>在这个 <Term id="vit" /> 示例里，展平前有 16×16×3 个通道值，投影后也恰好有 768 个坐标。前者是原图的颜色，后者是权重计算出的特征。数目碰巧相同，坐标含义已经改变。</p>
      </section>
      <section className="explain-section">
        <h3>序列里为什么有 197 个位置？</h3>
        <p>196 个 Patch Token 前面另放一个 <strong>[CLS]</strong>。它没有对应图像块，是为整图表征预留的位置。再把每个位置的向量加到对应 Token 上，告诉模型相同内容出现在哪里。</p>
        <div className="sequence-explainer" role="group" aria-label="内容向量与位置向量按列相加">
          <div><b>内容向量</b><span className="token special">[CLS]</span><span className="token">Patch 1</span><span className="token">Patch 2</span><span>…</span><span className="token">Patch 196</span></div>
          <div><b>+ 位置向量</b><span>p₀</span><span>p₁</span><span>p₂</span><span>…</span><span>p₁₉₆</span></div>
          <div><b>= 输入 Xₑ</b><span>第 0 位</span><span>第 1 位</span><span>第 2 位</span><span>…</span><span>第 196 位</span></div>
        </div>
        <div className="shape-equation"><math display="block"><msub><mi>X</mi><mi>e</mi></msub><mo>=</mo><msub><mi>f</mi><mi>e</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo><mo>∈</mo><msup><mi>ℝ</mi><mrow><mn>197</mn><mo>×</mo><mn>768</mn></mrow></msup></math></div>
        <p>197 数的是位置，768 数的是每个位置的特征坐标。进了 Encoder，位置和宽度继续保留，各层更新的则是这些位置的向量内容。末层依然有 197 个输出，普通 ViT 从中取 [CLS] 作为整图分类的输入。</p>
      </section>
      <Takeaway>一个位置能保留自己的编号，又能读到别处的信息吗？接下来打开架构图里那个 Block，看 [CLS] 和 Patch Token 怎样交换信息。</Takeaway>
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

function AttentionRouting({ state, target }: { state: ReturnType<typeof attention>; target: string }) {
  return <div className="attention-routing" aria-label="目标 Query 分别匹配各 Key，每个 Value 按权重汇入目标输出">
    <svg className="routing-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {state.rows.map(({name, weight}, i) => {
        const y = (i + .5) * 100 / state.rows.length;
        return <g key={name}>
          <path className="query-line" d={`M20 50 C29 50 31 ${y} 40 ${y}`} vectorEffect="non-scaling-stroke" />
          <path className="value-line" d={`M60 ${y} C69 ${y} 71 50 80 50`} vectorEffect="non-scaling-stroke"
            strokeWidth={1 + weight * 6} />
        </g>;
      })}
    </svg>
    <div className="routing-end"><small>目标 {target}</small><strong>Q {vectorText(state.query)}</strong></div>
    <div className="routing-sources">
      {state.rows.map(({name,weight}) => <div key={name}><b>{name}</b><small>Key ↔ Value</small><span>{(weight * 100).toFixed(1)}%</span></div>)}
    </div>
    <div className="routing-end"><small>汇聚结果</small><strong>{vectorText(state.output, 3)}</strong></div>
  </div>;
}

export function EncoderAttention() {
  const [target, setTarget] = useState(0);
  const [extra, setExtra] = useState(false);
  const current = attention(target, extra);
  const base = extra ? attention(target, false) : current;
  return (
    <>
      <p className="lesson-lead">P2 留下了一个问题：编号固定的 Token，怎样读到别的位置？打开一个典型 Pre-LN Block。主路先汇聚跨位置的信息，再变换各位置的特征。两条残差支路把各自的输入送到加法节点。</p>
      <figure className="lesson-figure">
        <div className="figure-top"><strong>Transformer Encoder Block</strong><span>典型 Pre-LN 结构</span></div>
        <div className="figure-body">
          <BlockDiagram />
          <div className="block-equations">
            <math display="block"><mi>U</mi><mo>=</mo><mi>Z</mi><mo>+</mo><mi>MSA</mi><mo>(</mo><mi>LN</mi><mo>(</mo><mi>Z</mi><mo>)</mo><mo>)</mo></math>
            <math display="block"><msup><mi>Z</mi><mo>′</mo></msup><mo>=</mo><mi>U</mi><mo>+</mo><mi>MLP</mi><mo>(</mo><mi>LN</mi><mo>(</mo><mi>U</mi><mo>)</mo><mo>)</mo></math>
          </div>
        </div>
        <figcaption>每个子层在计算前先归一化，再与该子层的原输入相加。注意力跨 Token 读取信息，FFN 单独变换每个 Token 的特征。Z′ 接入下一层。</figcaption>
      </figure>

      <h3 className="detail-title">一个位置如何读取整串 Token？</h3>
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
          <AttentionRouting state={current} target={baseTokens[target].name} />
          <div className="score-table-wrap">
            <table className="attention-table">
              <thead><tr><th scope="col">来源</th><th scope="col">Key</th><th scope="col">Value</th><th scope="col">Q · K / √2</th><th scope="col">Softmax 权重</th></tr></thead>
              <tbody>{current.rows.map(({ name, key, value, score, weight }) => <tr key={name}>
                <th scope="row">{name}</th><td>{vectorText(key)}</td><td>{vectorText(value)}</td><td>{score.toFixed(3)}</td>
                <td><span className="weight-row"><span className="score-track" aria-hidden="true"><span style={{ width: weight * 100 + "%" }} /></span>{(weight * 100).toFixed(1)}%</span></td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="attention-calculation">
            <div><small>① 用目标 Q 匹配每个 K</small><strong>{vectorText(current.query)} · {vectorText(current.rows[1].key)} ÷ √2</strong><span>以 Patch A 为例，得 {current.rows[1].score.toFixed(3)}</span></div>
            <div><small>② 让分数在同一行竞争</small><strong>exp(sⱼ) / Σ exp(sₖ)</strong><span>Patch A 占 {(current.rows[1].weight * 100).toFixed(1)}%，本行权重总和为 1</span></div>
            <div><small>③ 对 Value 加权并相加</small><strong>{vectorText(current.output, 3)}</strong><span>{current.rows.map(row => row.weight.toFixed(3) + " × " + vectorText(row.value)).join(" + ")}</span></div>
          </div>
        </div>
        <figcaption>虚线表示 Q 与各 Key 匹配，实线表示 Value 汇入输出，线越粗权重越大。来源包含目标本身。真实 ViT 处理完整序列，表中数值已四舍五入。</figcaption>
      </figure>
      <section className="explain-section">
        <h3>各个 Head 怎样汇回一条序列？</h3>
        <p>每个 Head 会对每个目标位置重复上面的一行计算。不同 Head 各有自己的投影权重。同一位置的各头输出沿特征维度拼接，再由输出投影映射回 D 维，随后才能和该位置的残差相加。</p>
        <figure className="lesson-figure">
          <div className="figure-top"><strong>并行计算 → 拼接 → 输出投影</strong><span>按同一目标位置对齐</span></div>
          <div className="figure-body"><HeadMerge /></div>
          <figcaption>多头改变每个位置的特征，序列顺序仍保留。Block 的输出进入下一层，同一位置可以继续吸收上下文。</figcaption>
        </figure>
      </section>
      <section className="explain-section">
        <h3>同一组权重遇到不同输入，会怎样？</h3>
        <p>比较同一目标位置的两次前向计算。保持原来的三个 Token 及投影权重固定，只加一个新来源。即使原来的匹配分数不变，新 Key 也会改变 Softmax 的分母，重新分配各来源的权重。新的 Value 随之进入加权和。</p>
        <figure className="lesson-figure">
          <div className="figure-top"><strong>冻结权重，改变输入序列</strong><span>对照目标 {baseTokens[target].name}</span></div>
          <div className="figure-body">
            <label className="extra-switch"><input type="checkbox" checked={extra} onChange={e => setExtra(e.target.checked)} />在第二条序列加入额外 Token</label>
            <div className="frozen-compare" aria-live="polite">
              {[{label: "原序列", output: base.output, added: false}, {label: "对照序列", output: current.output, added: extra}].map(({ label, output, added }) => (
                <div className="frozen-lane" key={label}>
                  <div><small>{label}</small><div className="architecture-tokens"><span className="token special">CLS</span><span className="token">A</span><span className="token">B</span>{added && <span className="token traced-token">新</span>}</div></div>
                  <Arrow /><div className="frozen-model"><VectorGlyph /><b>同一组投影权重</b></div><Arrow />
                  <div><small>目标的 Head 输出</small><strong>{vectorText(output, 3)}</strong></div>
                </div>
              ))}
            </div>
          </div>
          <figcaption>输出来自同一个二维示例。变化出现在前向计算中。打开 <Term id="attention" /> 可查看归一化公式。</figcaption>
        </figure>
      </section>
      <Takeaway>冻结的是参数。只要改变输入，前向计算仍可得到不同特征。既然增加一个 Token 就能影响输出，它能否成为专门用于适应新任务的可学习输入？</Takeaway>
    </>
  );
}
