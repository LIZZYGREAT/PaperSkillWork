import { TaskTimeline, InterferenceFishbone, OldImageReading, BackboneHandoff } from "./reading-visuals";
import { Fragment } from "react";
import { ProjectionFormula, SoftmaxFormula, Sub, Tuple } from "./lesson-math";
import { useState } from "react";
import { Term } from "../shared/core/reference/ReferenceHub";

import { HeadMergeMotion } from "./head-merge-motion";
import { AttentionMotion } from "./attention-motion";
import { ClassifierMotion } from "./classifier-motion";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";
import { PatchMotion } from "./patch-motion";
import { PATCH_GRID, Specimen } from "./specimen";
import { Arrow, BlockDiagram, PatchJourney, VectorGlyph, ViTOverview } from "./vit-visuals";

function LessonVar({ base, index }: { base: string; index: string }) {
  return <math className="lesson-variable"><msub><mi>{base}</mi><mrow>{[...index].map((letter, i) => /[0-9]/.test(letter) ? <mn key={i}>{letter}</mn> : <mi key={i}>{letter}</mi>)}</mrow></msub></math>;
}

const predictions = [
  [{ label: "鸟", value: 86 }, { label: "鱼", value: 14 }],
  [{ label: "鸟", value: 22 }, { label: "鱼", value: 8 }, { label: "猫", value: 63 }, { label: "狗", value: 7 }],
];

export function TaskStream() {
  const [phase, setPhase] = useState(0);
  const playback = useLessonPlayback(2300);
  return (
    <>
      <p className="lesson-lead">普通图像分类通过训练图像和标签调整模型参数，学会区分一组类别。持续学习改变的是数据到来的方式：模型依次接收新的类别，后续阶段往往无法重新取得此前全部训练图像，却仍需保留已经学到的识别能力。</p>
      <p className="lesson-prose">下面让任务 1 和任务 2 依次使用同一个分类器训练。新任务会在已有参数上继续更新，不会自动创建一份与旧任务隔离的模型。</p>
      <TaskTimeline phase={phase} />
      <section className="explain-section">
        <h3>从 <LessonVar base="θ" index="1" /> 到 <LessonVar base="θ" index="2" />，为什么旧预测也会改变？</h3>
        <p>完成任务 1 后的模型参数记为 <math><Sub base="θ" index={1} /></math>。任务 2 从这组参数接着训练，得到 <math><Sub base="θ" index={2} /></math>。训练虽然使用新类别数据，更新的却是整个共享网络中的参数，因此旧类别原先依赖的特征和预测分数也可能改变。</p>
        <InterferenceFishbone />
        <p>下面固定同一张鸟类测试图，先查看任务 1 结束时的预测，再切换到任务 2 结束时的参数快照，比较最高分所属类别。播放时可以追踪当前快照下的前向传播。</p>
      </section>
      <figure className="lesson-figure">
        <div className="figure-top"><strong>同一张旧图，两份参数快照</strong><span>教学预测分数 · 合成示例分布</span></div>
        <div className="figure-body">
          <div className="task-rail" aria-label="选择训练快照">
            {["任务 1 · 鸟、鱼", "任务 2 · 猫、狗"].map((label, index) =>
              <button key={label} type="button" className="lesson-choice" aria-pressed={phase === index} onClick={() => { setPhase(index); playback.seek(0); }}>{label}</button>)}
          </div>
          <div className="task-scene">
            <div className="scene-object"><Specimen /><strong>同一张旧测试图</strong><small>真实类别：鸟</small></div>
            <Arrow />
            <div className="scene-object classifier"><strong>共享分类器</strong>
              <ClassifierMotion phase={phase} position={playback.position} />
              <span className="math-label"><math><msub><mi>f</mi><mrow><Sub base="θ" index={phase + 1} /></mrow></msub></math></span><small>{phase === 0 ? "任务 1 训练后的参数 θ₁" : "任务 2 训练后的参数 θ₂"}</small></div>
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
          <PlaybackControls playback={playback} label="固定快照的前向传播进度" />
          <p className="scene-readout" aria-live="polite">{phase === 0 ? "用 θ₁ 预测这张旧图，最高分是「鸟」。" : "用 θ₂ 预测同一张图，最高分变为「猫」。"}</p>
        </div>
        <figcaption>网络结构为示意，右侧类别分数另行设定，用两个合成快照对照训练前后的预测。百分数表示示例分数；动画播放当前快照的前向传播。</figcaption>
      </figure>
      <OldImageReading />
      <section className="explain-section">
        <h3>测试图来自哪个任务，模型事先并不知道</h3>
        <p>困难还在于，学完第二批类别后，测试输入只有图像，没有“来自任务 1 还是任务 2”的提示。类别增量测试要求模型在全部已学类别中统一选择，不能先按任务号排除猫和狗，再只在旧类别中判断。</p>
        <div className="test-routing" role="group" aria-label="一张测试图进入统一的已学类别空间">
          <div className="route-input"><Specimen /><div><b>只收到图像</b><small>任务 ID 未提供</small></div></div><Arrow />
          <div className="route-classes"><div className="class-tags"><span>鸟</span><span>鱼</span><span>猫</span><span>狗</span></div><small>全部已学类别一起竞争</small></div>
        </div>
        <p>训练时知道任务划分，与测试时没有任务 ID 可以同时成立；训练时也没有明确边界的 task-agnostic 是另一项条件。</p>
      </section>
      <section className="explain-section">
        <h3>能否保留主干的视觉能力？</h3>
        <p>如果预训练模型已经学到了可复用的视觉特征，就可以<span className="reading-emphasis">保留主干权重</span>，让少量其他参数承担后续适应。基础 L2P 沿这个方向设计，<span className="reading-emphasis">无需保存旧样本</span>来做回放。</p>
      </section>
      <BackboneHandoff />
    </>
  );
}

export function ViTPath() {
  const [patch, setPatch] = useState(65);
  const row = Math.floor(patch / PATCH_GRID);
  const col = patch % PATCH_GRID;
  return (
    <>
      <p className="lesson-lead">P1 提出保留预训练主干的视觉能力。L2P 使用的主干是视觉 Transformer（ViT）：它接收图像，在内部形成一组向量表示，供后续分类使用。先沿完整路径认清这些表示从哪里来、怎样传下去。</p>
      <p className="lesson-prose">图中从左向右，输入嵌入模块 <LessonVar base="f" index="e" /> 将图像整理成 Token 序列；多层 Transformer Encoder 组成 <LessonVar base="f" index="r" />，逐层更新各位置的向量；最后从输出序列中读出分类特征。图上的冻结标记表示后续适应时保留主干权重，前向计算仍照常执行。</p>
      <ViTOverview index={patch} select={setPatch} />
      <section className="explain-section">
        <h3>二维图像怎样变成一串向量？</h3>
        <p>Transformer 处理按位置排列的向量序列，图像最初却是由高度、宽度和颜色通道组成的像素数组。ViT 先把图像切成等大的图像块（Patch），将每块像素展平，再通过共享的线性投影变成一个 Patch Token，让局部区域进入模型的特征空间。</p>
        <p>以这里的 ViT-B/16、224×224 输入为例，每块边长为 16，每边得到 14 块，共 14×14=196 块。点击网格或拖动滑块选一块，沿着它的行列位置追踪到对应 Token，再播放通道读取、展平和投影过程。展平只重排像素，投影则把像素值映射为特征坐标。</p>
        <figure className="lesson-figure patch-lab">
          <div className="figure-top"><strong>追踪原图中的一块 Patch</strong><span>点击架构图中的网格或拖动滑块</span></div>
          <div className="figure-body">
            <div className="patch-control">
              <label htmlFor="patch-index">第 {patch + 1} 块 · 第 {row + 1} 行，第 {col + 1} 列</label>
              <input id="patch-index" type="range" min="1" max="196" value={patch + 1} onChange={e => setPatch(Number(e.target.value) - 1)} />
            </div>
            <PatchJourney index={patch} />
            <PatchMotion key={patch} index={patch} />
          </div>
          <figcaption>裁切区域取自同一张插图。展平只重排像素。线性投影用同一组权重把各块变成特征。图中的向量格示意形状和位置。</figcaption>
        </figure>
        <div className="reading-contrast reading-contrast--dimension" role="group" aria-label="Patch 展平与投影后的 768 个数值含义不同">
          <div><strong>展平输入</strong><p><Term id="vit" /> 示例：16×16×3 = 768 个像素通道值</p></div>
          <span className="reading-contrast__flow" aria-hidden="true">→</span>
          <div><strong>线性投影后</strong><p>768 个学习得到的特征坐标</p></div>
          <p className="reading-contrast__conclusion">这里输入和输出都为 768 维，坐标含义已经改变；其他 ViT 配置可以采用不同的投影宽度。</p>
        </div>
      </section>
      <section className="explain-section">
        <h3>序列里为什么有 197 个位置？</h3>
        <p>投影得到的向量承载局部内容，但相似内容出现在不同位置时，对整图的意义可能不同。ViT 为各位置加入对应的位置向量，使模型能利用空间位置信息。</p>
        <p>普通 ViT 还在 196 个 Patch Token 前面加入一个用于整图表示的 <strong>[CLS]</strong> Token。它独占序列中的第 0 位，没有对应的图像块。因此共有 196+1=197 个位置。下面按列看内容与位置向量如何相加，形成输入序列 <LessonVar base="X" index="e" />。</p>
        <div className="sequence-explainer" role="group" aria-label="内容向量与位置向量按列相加">
          <div><b>内容向量</b><span className="token special">[CLS]</span><span className="token">Patch 1</span><span className="token">Patch 2</span><span>…</span><span className="token">Patch 196</span></div>
          <div><b>+ 位置向量</b><math><Sub base="p" index={0} /></math><math><Sub base="p" index={1} /></math><math><Sub base="p" index={2} /></math><span>…</span><math><Sub base="p" index={196} /></math></div>
          <div><b>= 输入 <math><Sub base="X" index="e" /></math></b><span>第 0 位</span><span>第 1 位</span><span>第 2 位</span><span>…</span><span>第 196 位</span></div>
        </div>
        <div className="shape-equation"><math display="block"><msub><mi>X</mi><mi>e</mi></msub><mo>=</mo><msub><mi>f</mi><mi>e</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo><mo>∈</mo><msup><mi>ℝ</mi><mrow><mn>197</mn><mo>×</mo><mn>768</mn></mrow></msup></math></div>
        <p><span className="reading-emphasis">197 是序列长度</span>，<span className="reading-emphasis">768 是每个位置的向量维数</span>。这个形状描述当前演示的配置，序列将整体交给 Encoder 处理。</p>
      </section>
      <section className="explain-section">
        <h3>Encoder 逐层更新什么，分类又读取什么？</h3>
        <p>回到总览中的 Encoder 堆叠：每个 Block 接收前一层的整条序列，保留位置顺序与向量宽度，更新各位置内部的特征。后一层接着处理这些输出；经过多层计算，各位置逐渐携带来自其他区域的信息。</p>
        <p>普通 ViT 分类通常读取末层 [CLS] 表示，再交给分类头。后面的 L2P 会用无 Prompt 的 [CLS] 特征做检索，并从带 Prompt 序列的另一组输出位置读取分类特征；P5–P6 将沿实际路径展开。</p>
      </section>
      <div className="context-bridge" role="group" aria-label="从局部内容到上下文表示，下一页解释中间计算">
        <div><span className="token traced-token">Patch A</span><small>最初只来自一块局部图像</small></div>
        <div className="context-bridge__gap"><span>Encoder 内部发生了什么？</span><Arrow /></div>
        <div><span className="token">A 的新表示</span><small>能够携带 Patch B 的信息</small></div>
        <p>P3 放大其中一个 Block，追踪这次跨位置的信息读取。</p>
      </div>
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

export function EncoderAttention() {
  const [target, setTarget] = useState(0);
  const [extra, setExtra] = useState(false);
  const current = attention(target, extra);
  const base = extra ? attention(target, false) : current;
  return (
    <>
      <p className="lesson-lead">P2 中，每层 Encoder 都会更新整条 Token 序列。打开其中一个 Block，就能看到一个位置怎样读取其他位置，以及读到的信息怎样成为下一层的输入。</p>
      <p className="lesson-prose">图中采用典型的 Pre-LN 结构：输入先经层归一化（LayerNorm），进入多头自注意力（MSA），再加回原输入；随后经过第二次归一化和前馈网络（FFN/MLP），再做一次残差相加。先把这条路径作为地图，接下来放大负责跨位置读取的 Attention。</p>
      <figure className="lesson-figure">
        <div className="figure-top"><strong>Transformer Encoder Block</strong><span>典型 Pre-LN 结构</span></div>
        <div className="figure-body">
          <BlockDiagram />
          <div className="block-equations">
            <math display="block"><mi>U</mi><mo>=</mo><mi>Z</mi><mo>+</mo><mrow><mi mathvariant="normal">MSA</mi><mo>(</mo><mrow><mi mathvariant="normal">LN</mi><mo>(</mo><mi>Z</mi><mo>)</mo></mrow><mo>)</mo></mrow></math>
            <math display="block"><msup><mi>Z</mi><mo>′</mo></msup><mo>=</mo><mi>U</mi><mo>+</mo><mrow><mi mathvariant="normal">MLP</mi><mo>(</mo><mrow><mi mathvariant="normal">LN</mi><mo>(</mo><mi>U</mi><mo>)</mo></mrow><mo>)</mo></mrow></math>
          </div>
        </div>
        <figcaption>典型 Pre-LN Encoder 的结构导航；图中两条支路分别保留 Z 和 U，送往对应加法节点。</figcaption>
      </figure>
      <p className="lesson-prose">Z 是当前层收到的整条序列，U 是注意力结果与原输入相加后的中间序列，Z′ 是本层输出。先沿第一式进入 MSA，等看完多头计算，再回到两条残差路径。</p>

      <h3 className="detail-title">一个位置如何读取整串 Token？</h3>
      <p className="lesson-prose">假设正在更新 [CLS]：它需要决定从每个来源位置读取多少信息。Attention 为每个 Token 生成三种向量，Query（Q）参与目标匹配，Key（K）提供来源的匹配表示，Value（V）提供实际汇聚的内容。来源也包含目标自身。</p>
      <p className="lesson-prose">这三种向量都从当前输入计算出来。记归一化后的 LN(Z) 为 X，通过 <ProjectionFormula symbol="Q" />、<ProjectionFormula symbol="K" /> 和 <ProjectionFormula symbol="V" /> 得到它们。同一个 Head 的三组投影矩阵在所有位置共享。这里的 Key 属于 Transformer 内部 Attention；P5 的池检索 Key 将承担另一种用途。</p>
      <div className="reading-roles" role="group" aria-label="自注意力中 Q、K、V 的分工">
        <div><strong className="reading-role--query">Q · 目标</strong><span>目标位置提出匹配需求</span></div>
        <div><strong className="reading-role--key">K · 来源</strong><span>各位置提供可比较的表示</span></div>
        <div><strong className="reading-role--value">V · 内容</strong><span>按匹配权重汇总到输出</span></div>
      </div>
      <p className="lesson-prose">选定目标 i 后，用它的 <LessonVar base="q" index="i" /> 与各来源 <LessonVar base="k" index="j" /> 点积，并除以 Key 维度 <LessonVar base="d" index="k" /> 的平方根，得到匹配分数 <LessonVar base="s" index="ij" />。Softmax 将这一行分数归一化为总和为 1 的权重 <LessonVar base="a" index="ij" />，再把各来源 <LessonVar base="v" index="j" /> 按权重相加，形成目标的 Head 输出 <LessonVar base="o" index="i" />。</p>
      <div className="attention-rule" role="group" aria-label="一个目标位置从匹配到汇聚的计算">
        <div><span>匹配来源</span><math><Sub base="s" index="ij" /><mo>=</mo><mfrac><mrow><Sub base="q" index="i" /><mo>·</mo><Sub base="k" index="j" /></mrow><msqrt><Sub base="d" index="k" /></msqrt></mfrac></math></div>
        <Arrow />
        <div><span>分配权重</span><math><Sub base="a" index="ij" /><mo>=</mo><mfrac><msup><mi>e</mi><Sub base="s" index="ij" /></msup><mrow><msub><mo>∑</mo><mi>t</mi></msub><msup><mi>e</mi><Sub base="s" index="it" /></msup></mrow></mfrac></math></div>
        <Arrow />
        <div><span>汇聚内容</span><math><Sub base="o" index="i" /><mo>=</mo><msub><mo>∑</mo><mi>j</mi></msub><Sub base="a" index="ij" /><Sub base="v" index="j" /></math></div>
      </div>
      <p className="lesson-prose">下面先保持三个基础 Token，播放匹配、归一化、汇聚三个阶段，追踪 [CLS] 的输出。切换到 Patch A 或 B 时，目标 Query 随之改变，表格会重算该目标的一行权重。额外 Token 开关留到页末的冻结对照中再比较。</p>
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
          <AttentionMotion key={target + ":" + extra} rows={current.rows} query={current.query} output={current.output} target={baseTokens[target].name} />
          <div className="score-table-wrap">
            <table className="attention-table">
              <thead><tr><th scope="col">来源</th><th scope="col">Key</th><th scope="col">Value</th><th scope="col"><math><mfrac><mrow><mi>q</mi><mo>·</mo><mi>k</mi></mrow><msqrt><mn>2</mn></msqrt></mfrac></math></th><th scope="col">Softmax 权重</th></tr></thead>
              <tbody>{current.rows.map(({ name, key, value, score, weight }) => <tr key={name}>
                <th scope="row">{name}</th><td>{vectorText(key)}</td><td>{vectorText(value)}</td><td>{score.toFixed(3)}</td>
                <td><span className="weight-row"><span className="score-track" aria-hidden="true"><span style={{ width: weight * 100 + "%" }} /></span>{(weight * 100).toFixed(1)}%</span></td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="attention-calculation">
            <div><small>① 用目标 Q 匹配每个 K</small><strong><math><mfrac><mrow><Tuple values={current.query} /><mo>·</mo><Tuple values={current.rows[1].key} /></mrow><msqrt><mn>2</mn></msqrt></mfrac></math></strong><span>以 Patch A 为例，得 {current.rows[1].score.toFixed(3)}</span></div>
            <div><small>② 让分数在同一行竞争</small><strong><SoftmaxFormula /></strong><span>Patch A 占 {(current.rows[1].weight * 100).toFixed(1)}%，本行权重总和为 1</span></div>
            <div><small>③ 对 Value 加权并相加</small><strong>{vectorText(current.output, 3)}</strong><span><math><mrow>{current.rows.map((row, i) => <Fragment key={row.name}>
              {i > 0 && <mo>+</mo>}<mn>{row.weight.toFixed(3)}</mn><mo>×</mo><Tuple values={row.value} />
            </Fragment>)}</mrow></math></span></div>
          </div>
        </div>
        <figcaption>二维教学示例：W_Q、W_K 保留坐标，W_V 交换两维。虚线表示匹配，实线表示 Value 汇聚，线宽对应权重。表中数值已四舍五入。</figcaption>
      </figure>
      <p className="lesson-prose">输出由整行 Value 的加权和组成，所以一个位置的表示能够包含其他位置的信息。真实 ViT 对完整序列的每个目标都执行这类计算；这里用少量二维向量展开其中一个 Head，便于对照分数、权重与结果。</p>
      <section className="explain-section">
        <h3>各个 Head 怎样汇回一条序列？</h3>
        <p>多个 Head 并行读取相同的输入序列，各自使用一组投影参数，形成不同的汇聚结果。对同一目标位置，各 Head 的输出沿特征维度拼接，再由输出投影映射回模型宽度 D，得到 MSA 在这个位置的输出。</p>
        <p>下面追踪位置 i 的几组 Head 输出：它们汇入同一个向量。拼接保留各头坐标，输出投影再混合这些特征；其他 Token 位置各自完成同样的计算。</p>
        <figure className="lesson-figure">
          <div className="figure-top"><strong>并行计算 → 拼接 → 输出投影</strong><span>按同一目标位置对齐</span></div>
          <div className="figure-body"><HeadMergeMotion /></div>
          <figcaption>多头改变每个位置的特征，序列顺序仍保留。Block 的输出进入下一层，同一位置可以继续吸收上下文。</figcaption>
        </figure>
      </section>
      <section className="explain-section">
        <h3>把多头结果接回 Block</h3>
        <p>回到开头的两式：第一条残差将 Z 与 MSA 输出逐位置相加，得到 U，保留原表示并加入本次读取的信息。LayerNorm 在每个位置内归一化特征，为接下来的子层计算准备输入。</p>
        <p>随后 FFN 对每个位置的向量做非线性变换，继续加工内部特征；跨位置的信息读取已经由 Attention 完成。第二条残差把 FFN 输出与 U 相加，得到 Z′。这条更新后的序列进入下一层，沿同样的路径继续计算。</p>
      </section>
      <section className="explain-section">
        <h3>同一组权重遇到不同输入，会怎样？</h3>
        <p>冻结网络会固定投影矩阵和 FFN 等参数，当前输入仍会参与 Q/K/V 和后续输出的计算。下面保留三个基础 Token 与相同投影权重，在第二条序列加入一个额外 Token，比较同一目标的 Head 输出。</p>
        <p>打开开关后，原有 Query 与 Key 的匹配分数保持不变，新来源却加入了 Softmax 的分母，原有来源的权重随之重新分配。新的 Value 也进入加权和，目标输出因此发生变化。整个对照只有前向计算，网络权重始终固定。</p>
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
          <figcaption>两条序列复用上方二维示例的计算函数。目标选择与额外 Token 开关会同步更新两处演示，并重置局部播放。<Term id="attention" /> 中附有归一化说明。</figcaption>
        </figure>
      </section>
      <section className="explain-section">
        <h3>这个额外 Token，能学出来吗？</h3>
        <p>刚才只加入一个给定向量，固定网络的输出就发生了变化。如果让这个向量通过训练调整，能否使它带来更适合当前任务的特征？P4 将把这个想法变成可学习的 Prompt，沿分类损失追踪它如何更新。</p>
      </section>
    </>
  );
}
