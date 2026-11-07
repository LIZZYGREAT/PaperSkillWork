import { useState } from "react";
import { useLessonPlayback, PlaybackControls } from "./lesson-playback";
import { Arrow } from "./vit-visuals";
import { promptPoolConfig } from "./prompt-retrieval-data";
import {
  P6_FINAL_POOL_EXAMPLE,
  P6_FIRST_PATCH_SEQUENCE_INDEX,
  P6_IMAGE_CLS_SEQUENCE_INDEX,
  P6_LAST_PATCH_SEQUENCE_INDEX,
  P6_POOL_SAMPLE_ROWS,
  P6_PROMPT_COUNT,
  P6_PROMPT_TOKEN_COUNT,
  P6_PROMPT_TOKEN_MAP,
  P6_SELECTED_PROMPT_INDICES,
  P6_SEQUENCE_LENGTH,
  computePromptOutputPool,
} from "./prompt-forward-data";
import "./prompt-forward.css";

const duration = 7400;
const boundaries = [0, 900, 1800, 3250, 4550, 6100, duration];
const patchCount = promptPoolConfig.imageLength - 1;
const phases = [
  { short: "接收 P5 选集", text: "Query A 的五个索引直接来自 P5 共享检索函数；读取 Prompt 副本，源池保持原位。" },
  { short: "准备图像序列", text: `同一图像经过冻结嵌入层得到 [CLS] 与 ${patchCount} 个 Patch 位置，共 ${promptPoolConfig.imageLength}×${promptPoolConfig.featureWidth}。` },
  { short: "按索引拼接", text: `${P6_PROMPT_COUNT} 组 Prompt 按 P5 返回顺序写入 xₚ 的前 ${P6_PROMPT_TOKEN_COUNT} 个位置；图像 CLS 从绝对位置 ${P6_IMAGE_CLS_SEQUENCE_INDEX} 接续。` },
  { short: "冻结前向", text: `完整的 ${P6_SEQUENCE_LENGTH}×${promptPoolConfig.featureWidth} 序列通过同一组冻结 Transformer 权重；位置身份保留，表示经过上下文计算。` },
  { short: "平均 Prompt 输出", text: `逐个汇总 H[0:${P6_PROMPT_TOKEN_COUNT},:] 中的 ${P6_PROMPT_TOKEN_COUNT} 个 Prompt 输出位置；图像 CLS 与 Patch 输出不参与 AvgPool。` },
  { short: "进入分类器", text: `池化向量 h 属于 ${promptPoolConfig.featureWidth} 维；它进入共享分类头得到 Logits 与 argmax 预测规则。` },
];

function phaseAt(position: number) {
  if (position >= duration) return phases.length - 1;
  const index = boundaries.findIndex((_, i) => i < boundaries.length - 1 && position >= boundaries[i] && position < boundaries[i + 1]);
  return Math.max(0, index);
}

function phaseProgress(position: number, phase: number) {
  return Math.max(0, Math.min(1, (position - boundaries[phase]) / (boundaries[phase + 1] - boundaries[phase])));
}

function clamp(value: number) { return Math.max(0, Math.min(1, value)); }

function PromptName({ index }: { index: number }) {
  return <>P<sub>{index}</sub></>;
}

function SourcePromptView() {
  return <div className="p6-source-prompt-list" aria-label="按 P5 Query A 顺序取得的 Prompt 读取副本">
    {P6_SELECTED_PROMPT_INDICES.map(index => <span key={index}><PromptName index={index} /><small>{promptPoolConfig.promptLength} 个 Token</small></span>)}
  </div>;
}

function PromptSequenceGroups({
  mergeProgress,
  selectedSequenceIndex,
  onSelect,
}: {
  mergeProgress: number;
  selectedSequenceIndex: number;
  onSelect: (sequenceIndex: number) => void;
}) {
  return <div className="p6-sequence-prompt-groups" aria-label={`拼接序列前 ${P6_PROMPT_TOKEN_COUNT} 个 Prompt 位置`}>
    {P6_SELECTED_PROMPT_INDICES.map((promptIndex, promptOrdinal) => {
      const refs = P6_PROMPT_TOKEN_MAP.filter(ref => ref.promptOrdinal === promptOrdinal);
      const groupProgress = clamp(mergeProgress * P6_PROMPT_COUNT - promptOrdinal);
      return <div className="p6-sequence-prompt-group" key={`${promptIndex}-${promptOrdinal}`} style={{ opacity: 0.72 + groupProgress * 0.28 }}>
        <div className="p6-sequence-group-heading"><PromptName index={promptIndex} /><span>位置 {refs[0].sequenceIndex}–{refs[refs.length - 1].sequenceIndex}</span></div>
        <div className="p6-sequence-group-cells">
          {refs.map(ref => {
            const cellProgress = clamp(groupProgress * promptPoolConfig.promptLength - ref.tokenIndex);
            return <button
              className={`p6-sequence-cell ${selectedSequenceIndex === ref.sequenceIndex ? "is-selected" : ""} ${cellProgress >= 1 ? "is-composed" : ""}`}
              type="button"
              key={ref.sequenceIndex}
              data-sequence-index={ref.sequenceIndex}
              aria-label={`${`Prompt P${ref.promptIndex}`} 内第 ${ref.tokenIndex + 1} 个 Token，扩展序列绝对位置 ${ref.sequenceIndex}`}
              aria-pressed={selectedSequenceIndex === ref.sequenceIndex}
              onClick={() => onSelect(ref.sequenceIndex)}
              style={{ opacity: 0.5 + 0.5 * cellProgress, transform: `translateY(${(1 - cellProgress) * 4}px)` }}
            ><small>T{ref.tokenIndex + 1}</small><b>{ref.sequenceIndex}</b></button>;
          })}
        </div>
      </div>;
    })}
  </div>;
}

function PositionInspector({ sequenceIndex }: { sequenceIndex: number }) {
  const promptRef = P6_PROMPT_TOKEN_MAP.find(ref => ref.sequenceIndex === sequenceIndex);
  if (promptRef) return <span><strong>当前查看</strong><b><PromptName index={promptRef.promptIndex} /> · Token {promptRef.tokenIndex + 1} / {promptPoolConfig.promptLength}</b><code>xₚ[{promptRef.sequenceIndex}]</code></span>;
  if (sequenceIndex === P6_IMAGE_CLS_SEQUENCE_INDEX) return <span><strong>当前查看</strong><b>图像 [CLS]</b><code>xₚ[{P6_IMAGE_CLS_SEQUENCE_INDEX}]</code></span>;
  const patchIndex = sequenceIndex - P6_IMAGE_CLS_SEQUENCE_INDEX;
  return <span><strong>当前查看</strong><b>图像 Patch {patchIndex} / {patchCount}</b><code>xₚ[{sequenceIndex}]</code></span>;
}

function PoolingTable({
  includedCount,
  groupSums,
  selectedSequenceIndex,
  onSelect,
}: {
  includedCount: number;
  groupSums: readonly number[];
  selectedSequenceIndex: number;
  onSelect: (sequenceIndex: number) => void;
}) {
  return <table className="p6-pool-table" aria-label="五组 Prompt 输出位置在特征维度 1 的可复算示例">
    <thead><tr><th scope="col">Prompt 输出组</th>{Array.from({ length: promptPoolConfig.promptLength }, (_, index) => <th scope="col" key={index}>Token {index + 1}</th>)}<th scope="col">组内和</th></tr></thead>
    <tbody>
      {P6_POOL_SAMPLE_ROWS.map((row, rowIndex) => <tr key={`${row.promptIndex}-${rowIndex}`}>
        <th scope="row"><PromptName index={row.promptIndex} /><small>位置 {row.sequenceStart}–{row.sequenceStart + row.values.length - 1}</small></th>
        {row.values.map((value, tokenIndex) => {
          const sequenceIndex = row.sequenceStart + tokenIndex;
          const included = sequenceIndex < includedCount;
          const selected = sequenceIndex === selectedSequenceIndex;
          return <td key={sequenceIndex}>
            <button
              className={`p6-pool-value ${included ? "is-included" : ""} ${selected ? "is-selected" : ""}`}
              type="button"
              data-sequence-index={sequenceIndex}
              aria-label={`H[${sequenceIndex},1] 示例值 ${value.toFixed(1)}，来自 Prompt P${row.promptIndex} 的第 ${tokenIndex + 1} 个输出 Token${included ? "，已计入当前和" : ""}`}
              aria-pressed={selected}
              onClick={() => onSelect(sequenceIndex)}
            ><b>{value.toFixed(1)}</b><small>H[{sequenceIndex},1]</small></button>
          </td>;
        })}
        <td className="p6-row-sum">{includedCount === 0 ? "—" : groupSums[rowIndex].toFixed(2)}</td>
      </tr>)}
    </tbody>
  </table>;
}

export function PromptForward() {
  const playback = useLessonPlayback(duration);
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState(0);
  const activePhase = phaseAt(playback.position);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mergeProgress = activePhase > 2 ? 1 : activePhase === 2 ? (reducedMotion ? 1 : phaseProgress(playback.position, 2)) : 0;
  const encoderProgress = activePhase > 3 ? 1 : activePhase === 3 ? (reducedMotion ? 1 : phaseProgress(playback.position, 3)) : 0;
  const poolingProgress = activePhase > 4 ? 1 : activePhase === 4 ? (reducedMotion ? 1 : phaseProgress(playback.position, 4)) : 0;
  const includedCount = activePhase > 4 ? P6_FINAL_POOL_EXAMPLE.totalCount : activePhase === 4
    ? Math.floor(poolingProgress * P6_FINAL_POOL_EXAMPLE.totalCount) : 0;
  const poolState = computePromptOutputPool(P6_POOL_SAMPLE_ROWS.map(row => row.values), includedCount);
  const classifierReady = activePhase === 5;
  const sequenceIsOutput = activePhase >= 4;

  return <>
    <p className="lesson-lead">P5 的 Query A 已选出五个 Prompt。P6 把这些读取副本与同一张图像 Token 合并，再调用共享的冻结 ViT 完成分类；<span className="reading-emphasis reading-emphasis--prompt">最终读出来自 Prompt 位置，不是普通 ViT 的 CLS 位置</span>。</p>

    <section className="explain-section">
      <h3>检索和分类是两次调用，共用同一组冻结权重</h3>
      <div className="reading-contrast reading-contrast--calls" role="group" aria-label="检索与分类分别调用同一组冻结的 ViT 权重">
        <div className="reading-call--query"><strong>检索调用 · 无 Prompt 生成 Query</strong><p>冻结的 ViT 对原图计算，读取 [CLS] 特征形成 q(x)。</p></div>
        <div className="reading-call--prompt"><strong>分类调用 · 带 Prompt 生成 Logits</strong><p>所选 Prompt 前置后再次经过同一组冻结权重；这不是第二套独立训练的 ViT。</p></div>
      </div>
      <p>以下工作台只展开分类调用。P5 的外部 Key 用于读取，不是 Transformer 输入 Token。</p>
    </section>

    <figure className="lesson-figure p6-forward-figure">
      <div className="figure-top"><strong>从 P5 的 S(x<sub>A</sub>) 追踪到 Prompt 输出平均</strong><span>Query A · 共享冻结权重 θ₀</span></div>
      <div className="p6-control-dock" aria-label="L2P 分类前向播放控制">
        <div className="motion-stops" role="group" aria-label="选择 L2P 分类前向阶段">
          {phases.map((phase, index) => <button className="lesson-choice" type="button" key={phase.short} aria-pressed={activePhase === index} onClick={() => playback.seek(boundaries[index])}>{index + 1}. {phase.short}</button>)}
        </div>
        <div className="p6-control-bottomline">
          <PlaybackControls playback={playback} label="Prompt 序列到类别预测" />
          <p className="motion-status" aria-live="polite">{phases[activePhase].text}</p>
        </div>
      </div>

      <div className="figure-body">
        <div className="p6-shared-weights">
          <strong>同一组预训练权重 θ₀ · 冻结不更新</strong>
          <span>检索：无 Prompt → CLS → q(x<sub>A</sub>)</span>
          <span>分类：插入 Prompt → fᵣ → H</span>
        </div>

        <div className="p6-source-heading"><strong>两路输入在序列维合并</strong><span>读取 Prompt 副本不清空 P5 的源池</span></div>
        <div className="p6-source-branches">
          <section className={`p6-source-column p6-selected-source ${activePhase === 0 ? "is-active" : ""}`} aria-label="P5 计算得到的选中 Prompt">
            <div className="p6-source-label"><strong>P5 · Query A 的 Top-N</strong><span>S(x<sub>A</sub>)</span></div>
            <SourcePromptView />
            <small>顺序来自共享检索快照；每个索引读取配对 Prompt。</small>
          </section>
          <span className="p6-source-join" aria-hidden="true">+</span>
          <section className={`p6-source-column p6-image-source ${activePhase >= 1 ? "is-active" : ""}`} aria-label="冻结嵌入层生成的图像 Token">
            <div className="p6-source-label"><strong>同一图像 x<sub>A</sub> → 冻结 fₑ → xₑ</strong><span>{promptPoolConfig.imageLength} × {promptPoolConfig.featureWidth}</span></div>
            <div className="p6-image-source-strip"><b>[CLS]</b><i>Patch</i><i>Patch</i><i>Patch</i><span>…</span><i>Patch</i><small>{patchCount} 个图像 Patch</small></div>
            <small>[CLS] + {patchCount} 个 Patch 位置；图像序列宽度 D={promptPoolConfig.featureWidth}。</small>
          </section>
        </div>

        <section className={`p6-sequence-workbench ${activePhase >= 2 ? "is-composed" : ""}`} aria-label="扩展输入与 Transformer 输出的位置映射">
          <div className="p6-sequence-heading">
            <div><strong>{sequenceIsOutput ? "Transformer 输出 H" : activePhase === 3 ? "扩展序列进入冻结 Transformer" : "扩展输入 xₚ"}</strong><span>{sequenceIsOutput ? `位置仍为 ${P6_SEQUENCE_LENGTH}；向量表示已带有上下文` : "Prompt 在前，图像 Token 接在后"}</span></div>
            <b>{sequenceIsOutput ? "H = fᵣ(xₚ)" : <><span>xₚ = [</span>{P6_SELECTED_PROMPT_INDICES.map((index, selectedIndex) => <span key={index}><PromptName index={index} />{selectedIndex < P6_SELECTED_PROMPT_INDICES.length - 1 ? "; " : "; xₑ]"}</span>)}</>}<small>{P6_SEQUENCE_LENGTH} × {promptPoolConfig.featureWidth}</small></b>
          </div>
          <div className="p6-position-key"><span>Prompt 位置 · 0–{P6_PROMPT_TOKEN_COUNT - 1}</span><span>图像位置 · [CLS] {P6_IMAGE_CLS_SEQUENCE_INDEX}，Patch {P6_FIRST_PATCH_SEQUENCE_INDEX}–{P6_LAST_PATCH_SEQUENCE_INDEX}</span></div>
          <PromptSequenceGroups mergeProgress={mergeProgress} selectedSequenceIndex={selectedSequenceIndex} onSelect={setSelectedSequenceIndex} />
          <div className="p6-image-sequence-row">
            <span className="p6-image-position-prefix">图像 xₑ</span>
            <button className={`p6-image-position p6-cls-position ${selectedSequenceIndex === P6_IMAGE_CLS_SEQUENCE_INDEX ? "is-selected" : ""}`} type="button" data-sequence-index={P6_IMAGE_CLS_SEQUENCE_INDEX} aria-pressed={selectedSequenceIndex === P6_IMAGE_CLS_SEQUENCE_INDEX} aria-label={`图像 CLS，扩展序列绝对位置 ${P6_IMAGE_CLS_SEQUENCE_INDEX}`} onClick={() => setSelectedSequenceIndex(P6_IMAGE_CLS_SEQUENCE_INDEX)}><b>[CLS]</b><small>{P6_IMAGE_CLS_SEQUENCE_INDEX}</small></button>
            <button className={`p6-image-position ${selectedSequenceIndex === P6_FIRST_PATCH_SEQUENCE_INDEX ? "is-selected" : ""}`} type="button" data-sequence-index={P6_FIRST_PATCH_SEQUENCE_INDEX} aria-pressed={selectedSequenceIndex === P6_FIRST_PATCH_SEQUENCE_INDEX} aria-label={`第一个图像 Patch，扩展序列绝对位置 ${P6_FIRST_PATCH_SEQUENCE_INDEX}`} onClick={() => setSelectedSequenceIndex(P6_FIRST_PATCH_SEQUENCE_INDEX)}><b>Patch₁</b><small>{P6_FIRST_PATCH_SEQUENCE_INDEX}</small></button>
            <span className="p6-image-ellipsis" aria-hidden="true">…</span>
            <span className="p6-image-range">{patchCount} 个 Patch 位置</span>
            <button className={`p6-image-position p6-last-patch ${selectedSequenceIndex === P6_LAST_PATCH_SEQUENCE_INDEX ? "is-selected" : ""}`} type="button" data-sequence-index={P6_LAST_PATCH_SEQUENCE_INDEX} aria-pressed={selectedSequenceIndex === P6_LAST_PATCH_SEQUENCE_INDEX} aria-label={`最后一个图像 Patch，扩展序列绝对位置 ${P6_LAST_PATCH_SEQUENCE_INDEX}`} onClick={() => setSelectedSequenceIndex(P6_LAST_PATCH_SEQUENCE_INDEX)}><b>Patch₁₉₆</b><small>{P6_LAST_PATCH_SEQUENCE_INDEX}</small></button>
          </div>
          <div className="p6-sequence-index-note"><PositionInspector sequenceIndex={selectedSequenceIndex} /><span>Key 不进入 xₚ；图像 CLS 和 Patch 输出保留在 H，但不纳入 Prompt 池化。</span></div>
          <div className={`p6-encoder-stage ${activePhase === 3 ? "is-active" : ""}`}>
            <div className="p6-encoder-flow-label"><span>输入与输出位置一一对应</span><span>同一冻结 Transformer fᵣ · 参数不更新</span></div>
            <div className="p6-encoder-flow" aria-label="完整扩展序列通过冻结 Transformer">
              <span className="p6-encoder-flow-start">xₚ · {P6_SEQUENCE_LENGTH} 位置</span>
              <svg viewBox="0 0 360 38" preserveAspectRatio="none" role="img" aria-label="序列位置从输入到输出依次通过冻结计算">
                <defs><marker id="p6-forward-arrow" markerWidth="7" markerHeight="7" refX="2.5" refY="3.5" orient="auto"><path d="M7 0L0 3.5L7 7Z" fill="currentColor" /></marker></defs>
                <path d="M8 19 H352" className="p6-encoder-line" markerEnd="url(#p6-forward-arrow)" />
                <circle className="p6-encoder-particle" cx="0" cy="19" r="4" transform={`translate(${8 + 344 * encoderProgress} 0)`} />
              </svg>
              <span className="p6-encoder-block">冻结 ViT fᵣ<br /><small>θ₀</small></span>
              <span className="p6-encoder-flow-end">H · {P6_SEQUENCE_LENGTH} 位置</span>
            </div>
            <p>序列长度与位置身份保留；各输出向量已在冻结网络中相互作用。</p>
          </div>
        </section>

        <section className={`p6-pooling-workbench ${activePhase >= 4 ? "is-active" : ""}`} aria-label="Prompt 输出位置逐维平均计算">
          <div className="p6-pooling-heading">
            <div><strong>只读前 {P6_PROMPT_TOKEN_COUNT} 个 Prompt 输出位置</strong><span>正式读出 H[0:{P6_PROMPT_TOKEN_COUNT}, :] · 图像位置 {P6_IMAGE_CLS_SEQUENCE_INDEX}–{P6_LAST_PATCH_SEQUENCE_INDEX} 留在序列但不进入均值</span></div>
            <math><mi>h</mi><mo>=</mo><mi>AvgPool</mi><mo>(</mo><mi>H</mi><mo>[</mo><mn>0</mn><mo>:</mo><mn>{P6_PROMPT_TOKEN_COUNT}</mn><mo>,</mo><mo>:</mo><mo>]</mo><mo>)</mo></math>
          </div>
          <div className="p6-pooling-grid">
            <div className="p6-pool-matrix-wrap">
              <div className="p6-pool-sample-label"><strong>单一特征维度 d=1 的教学数值</strong><span>示例输出值，不是预训练 ViT 的隐藏状态</span></div>
              <PoolingTable includedCount={includedCount} groupSums={poolState.groupSums} selectedSequenceIndex={selectedSequenceIndex} onSelect={setSelectedSequenceIndex} />
            </div>
            <div className="p6-pool-accumulator">
              <span className="p6-pool-dimension">对每个特征维度各自汇总</span>
              <div className="p6-pool-sum"><small>当前累计</small><strong>{activePhase < 4 ? "待开始" : `${poolState.sum.toFixed(2)} / ${poolState.includedCount}`}</strong><span>已计入位置 / {P6_PROMPT_TOKEN_COUNT}</span></div>
              <div className={`p6-pool-result ${activePhase >= 4 && includedCount === P6_PROMPT_TOKEN_COUNT ? "is-ready" : ""}`}>
                <math><msub><mi>h</mi><mn>1</mn></msub><mo>=</mo>{activePhase >= 4 && includedCount > 0
                  ? <mfrac><mn>{poolState.sum.toFixed(1)}</mn><mn>{poolState.includedCount}</mn></mfrac>
                  : <mo>—</mo>}</math>
                <strong>{activePhase >= 4 ? poolState.runningMean?.toFixed(2) ?? "—" : "—"}</strong>
              </div>
              <small className="p6-pool-limit">另外 {promptPoolConfig.featureWidth - 1} 个维度执行相同的 {P6_PROMPT_TOKEN_COUNT} 位置平均，最终 h ∈ R<sup>{promptPoolConfig.featureWidth}</sup>。</small>
            </div>
          </div>
          <div className="p6-pooling-equation">
            <math><msub><mi>h</mi><mi>d</mi></msub><mo>=</mo><mfrac><mn>1</mn><mn>{P6_PROMPT_TOKEN_COUNT}</mn></mfrac><munderover><mo>∑</mo><mrow><mi>r</mi><mo>=</mo><mn>0</mn></mrow><mn>{P6_PROMPT_TOKEN_COUNT - 1}</mn></munderover><msub><mi>H</mi><mrow><mi>r</mi><mo>,</mo><mi>d</mi></mrow></msub></math>
            <span>按位置维求和；保持特征维 d 独立。</span>
          </div>
        </section>

        <div className="p6-classification-output">
          <Arrow />
          <div className={`p6-classifier ${classifierReady ? "is-active" : ""}`}>
            <strong>共享分类器 g<sub>φ</sub></strong>
            <math><mi>z</mi><mo>=</mo><msub><mi>g</mi><mi>φ</mi></msub><mo>(</mo><mi>h</mi><mo>)</mo></math>
            <math><mover><mi>y</mi><mo>^</mo></mover><mo>=</mo><msub><mi>argmax</mi><mi>c</mi></msub><msub><mi>z</mi><mi>c</mi></msub></math>
            <span>类别 Logits 数值未在本教学例中计算</span>
          </div>
          <span>前向分类到此为止 · 不展开损失或参数更新</span>
        </div>

        <div className="p6-dimensions" aria-label="本页形状与数量核对">
          <span><b>M</b><strong>{promptPoolConfig.poolSize}</strong><small>池中候选 Prompt 数</small></span>
          <span><b>N</b><strong>{P6_PROMPT_COUNT}</strong><small>当前检索选中数</small></span>
          <span><b>L<sub>p</sub></b><strong>{promptPoolConfig.promptLength}</strong><small>每组 Prompt Token 数</small></span>
          <span><b>L</b><strong>{promptPoolConfig.imageLength}</strong><small>图像 Token 位置数</small></span>
          <span><b>D</b><strong>{promptPoolConfig.featureWidth}</strong><small>向量特征宽度</small></span>
          <span className="p6-dim-result"><b>NL<sub>p</sub> + L</b><strong>{P6_PROMPT_TOKEN_COUNT} + {promptPoolConfig.imageLength} = {P6_SEQUENCE_LENGTH}</strong><small>扩展序列长度</small></span>
        </div>
      </div>
      <figcaption>位置图把 {P6_PROMPT_TOKEN_COUNT} 个 Prompt Token 逐一展开，图像部分按真实数量压缩显示；输出矩阵中的 d=1 数值只演示 AvgPool 算术。正式流程对 H[0:{P6_PROMPT_TOKEN_COUNT}, :] 的每一个特征维度分别求平均，分类器 Logits 保持符号形式。</figcaption>
    </figure>

    <section className="explain-section">
      <h3>池化的是经过 Transformer 的 Prompt 输出，不是 Prompt 参数本身</h3>
      <p>输入位置里的 Prompt 向量参与冻结 Transformer 计算后，输出 <math><mi>H</mi></math> 的前 {P6_PROMPT_TOKEN_COUNT} 行已携带上下文。正式读出从这些行取值并沿位置方向平均，得到一个 <math><mn>{promptPoolConfig.featureWidth}</mn></math> 维向量交给共享分类器。Prompt Pool 的原参数留在 P5，当前分类路径使用它们的读取视图。</p>
      <p>以 Split CIFAR‑100 / CORe50 的 ViT‑B/16 维度为例：<math><mi>M</mi><mo>=</mo><mn>{promptPoolConfig.poolSize}</mn></math>、<math><mi>N</mi><mo>=</mo><mn>{promptPoolConfig.topN}</mn></math>、<math><msub><mi>L</mi><mi>p</mi></msub><mo>=</mo><mn>{promptPoolConfig.promptLength}</mn></math>、<math><mi>L</mi><mo>=</mo><mn>{promptPoolConfig.imageLength}</mn></math>、<math><mi>D</mi><mo>=</mo><mn>{promptPoolConfig.featureWidth}</mn></math>，所以 <math><msub><mi>x</mi><mi>p</mi></msub><mo>,</mo><mi>H</mi><mo>∈</mo><msup><mi>ℝ</mi><mrow><mn>{P6_SEQUENCE_LENGTH}</mn><mo>×</mo><mn>{promptPoolConfig.featureWidth}</mn></mrow></msup></math>。其他数据集实验会使用不同的池大小或选取数值。</p>
    </section>

    <p className="lesson-takeaway">预测已经得到。接下来要解释：分类误差怎样训练被选中的 Prompt，而离散 Top-N 选择中的 Key 又怎样得到自己的学习信号？</p>
  </>;
}
