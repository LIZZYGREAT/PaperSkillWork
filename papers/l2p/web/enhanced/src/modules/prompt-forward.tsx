import { useLessonPlayback, PlaybackControls } from "./lesson-playback";
import { Arrow } from "./vit-visuals";
import { promptPoolConfig, selectedKeyIndices } from "./prompt-retrieval-data";
import "./prompt-forward.css";

const duration = 7000;
const boundaries = [0, 850, 1800, 3100, 4450, 5650, duration];
const selected = selectedKeyIndices("A");
const phases = [
  { label: "承接 P5 的查询 A", short: "接收选集", text: "P5 对查询 A 选出 P₁、P₂、P₁₀、P₃、P₉；分类路径读取这五组对应 Prompt。" },
  { label: "图像嵌入形成 xₑ", short: "得到图像 Token", text: "同一张输入图像经过冻结嵌入层 fₑ，形成 197 个图像 Token，特征宽度为 768。" },
  { label: "沿序列维拼接", short: "组成 xₚ", text: "五组 Prompt 各含五个位置，放到图像序列之前；总长度从 197 增至 222，宽度仍为 768。" },
  { label: "第二次调用同一冻结主干", short: "冻结前向", text: "带 Prompt 的序列再次使用 P5 查询路径所用的同一组冻结 ViT 权重。输出仍保留 222 个位置。" },
  { label: "截取前 25 个 Prompt 位置", short: "Prompt AvgPool", text: "分类只对 25 个 Prompt 位置的输出做平均池化；图像 CLS 与 196 个 Patch 位置不进入这次池化。" },
  { label: "共享分类头生成 Logits", short: "输出类别分数", text: "平均池化得到 768 维表示，送入共享分类器 gφ，得到类别 Logits。这里不展开训练损失或参数更新。" },
];

function phaseAt(position: number) {
  if (position >= duration) return phases.length - 1;
  const index = boundaries.findIndex((_, i) => i < boundaries.length - 1 && position >= boundaries[i] && position < boundaries[i + 1]);
  return Math.max(0, index);
}

function PromptSequence({ compact = false }: { compact?: boolean }) {
  return <span className={`p6-prompt-groups ${compact ? "is-compact" : ""}`} aria-label={`${promptPoolConfig.topN} 个选中 Prompt，每个含 ${promptPoolConfig.promptLength} 个位置`}>
    {selected.map(index => <span className="p6-prompt-group" key={index}>
      {!compact && <b>P<sub>{index}</sub></b>}
      <span>{Array.from({ length: promptPoolConfig.promptLength }, (_, i) => <i key={i} />)}</span>
    </span>)}
  </span>;
}

function ImageSequence({ output = false }: { output?: boolean }) {
  return <span className={`p6-image-sequence ${output ? "is-output" : ""}`} aria-label="图像序列：一个 CLS 位置与 196 个 Patch 位置">
    <b className="p6-cls">CLS</b>
    {Array.from({ length: 7 }, (_, i) => <i key={i} />)}<span>…</span><small>196 Patch</small>
  </span>;
}

export function PromptForward() {
  const playback = useLessonPlayback(duration);
  const activePhase = phaseAt(playback.position);
  const imageProgress = activePhase > 1 ? 1 : activePhase === 1
    ? (playback.position - boundaries[1]) / (boundaries[2] - boundaries[1]) : 0;
  const mergeProgress = activePhase > 2 ? 1 : activePhase === 2
    ? (playback.position - boundaries[2]) / (boundaries[3] - boundaries[2]) : 0;
  const encoderProgress = activePhase > 3 ? 1 : activePhase === 3
    ? (playback.position - boundaries[3]) / (boundaries[4] - boundaries[3]) : 0;
  const readProgress = activePhase > 4 ? 1 : activePhase === 4
    ? (playback.position - boundaries[4]) / (boundaries[5] - boundaries[4]) : 0;
  const outputProgress = activePhase > 5 ? 1 : activePhase === 5
    ? (playback.position - boundaries[5]) / (boundaries[6] - boundaries[5]) : 0;

  return <>
    <p className="lesson-lead">P5 的 Query A 已选出五个 Prompt。P6 把这组检索结果与当前图像 Token 合并，再调用冻结的 ViT 完成分类；<span className="reading-emphasis reading-emphasis--prompt">最终读出来自 Prompt 位置，不是普通 ViT 的 CLS 位置</span>。</p>

    <section className="explain-section">
      <h3>检索和分类是两次调用，共用同一组冻结权重</h3>
      <div className="reading-contrast reading-contrast--calls" role="group" aria-label="检索与分类分别调用同一组冻结的 ViT 权重">
        <div className="reading-call--query"><strong>检索调用 · 先生成 Query</strong><p>不插入 Prompt，从 CLS 输出读取当前图像的 Query。</p></div>
        <div className="reading-call--prompt"><strong>分类调用 · 再读取 Prompt</strong><p>把选中的 Prompt 加到图像 Token 前；两次输入经过同一套冻结权重。</p></div>
      </div>
      <p>下图展开分类调用，并用参数身份标记与 P5 对齐。</p>
    </section>

    <figure className="lesson-figure p6-forward-figure">
      <div className="figure-top"><strong>从 P5 的 S(x<sub>A</sub>) 到类别 Logits</strong><span>同一 θ₀ · 第二次调用 · 前向分类</span></div>
      <div className="figure-body">
        <div className="p6-shared-weights"><span>共享的预训练权重 θ₀</span><span>检索调用：无 Prompt → q(x<sub>A</sub>)</span><span>本页分类调用：加入选中 Prompt → Logits</span></div>

        <div className="p6-source-branches">
          <div className={`p6-selected-source ${activePhase === 0 ? "is-active" : ""}`}>
            <strong>来自 P5 的选集 · S(x<sub>A</sub>)</strong>
            <div>{selected.map(index => <span key={index}>P<sub>{index}</sub></span>)}</div>
            <small>Key 用于选取；Key 本身不拼入序列</small>
          </div>
          <span className="p6-branch-join" aria-label="沿序列长度维拼接">;</span>
          <div className={`p6-image-source ${activePhase >= 1 ? "is-ready" : ""}`}>
            <strong>输入图像 x<sub>A</sub> → 冻结 f<sub>e</sub> → x<sub>e</sub></strong>
            <span className="p6-image-preview" aria-hidden="true" style={{ transform: `scaleX(${.78 + .22 * imageProgress})` }}>
              <ImageSequence />
            </span>
            <small>L = 197 个位置 · D = 768</small>
          </div>
        </div>

        <div className={`p6-composition ${activePhase >= 2 ? "is-open" : ""}`}>
          <div className="p6-composition-heading"><strong>沿序列长度拼接</strong><span>Prompt 在前，图像 Token 在后</span></div>
          <div className="p6-sequence-result" style={{ opacity: .68 + .32 * mergeProgress }}>
            <PromptSequence compact />
            <span className="p6-sequence-divider" aria-hidden="true">;</span>
            <ImageSequence />
          </div>
          <div className="p6-composition-formula">
            <math><msub><mi>x</mi><mi>p</mi></msub><mo>=</mo><mo>[</mo><msub><mi>P</mi><mn>1</mn></msub><mo>;</mo><msub><mi>P</mi><mn>2</mn></msub><mo>;</mo><msub><mi>P</mi><mn>10</mn></msub><mo>;</mo><msub><mi>P</mi><mn>3</mn></msub><mo>;</mo><msub><mi>P</mi><mn>9</mn></msub><mo>;</mo><msub><mi>x</mi><mi>e</mi></msub><mo>]</mo></math>
            <math><msub><mi>x</mi><mi>p</mi></msub><mo>∈</mo><msup><mi>ℝ</mi><mrow><mn>222</mn><mo>×</mo><mn>768</mn></mrow></msup></math>
          </div>
        </div>

        <div className="p6-forward-flow">
          <div className="p6-flow-input"><strong>x<sub>p</sub></strong><span>222 × 768</span><PromptSequence compact /><ImageSequence /></div>
          <div className="p6-motion-lane" aria-hidden="true">
            <svg viewBox="0 0 260 50" preserveAspectRatio="none">
              <path d="M5 26 C74 26 102 26 132 26 S198 26 255 26" />
              <circle cx={5 + 250 * encoderProgress} cy="26" r="5" />
            </svg>
            <span>{activePhase >= 3 ? "逐位置更新上下文表示" : "序列送入 Encoder"}</span>
          </div>
          <div className={`p6-encoder ${activePhase === 3 ? "is-active" : ""}`}>
            <strong>冻结 Transformer f<sub>r</sub></strong>
            <span>Encoder Block 1</span><span>Encoder Block 2</span><i>⋮</i><span>Encoder Block L</span>
            <small>运算经过 · 权重不更新</small>
          </div>
          <Arrow />
          <div className={`p6-output-sequence ${activePhase >= 3 ? "is-ready" : ""}`}>
            <strong>输出序列 H = f<sub>r</sub>(x<sub>p</sub>)</strong>
            <span className="p6-read-bracket" aria-hidden="true">Prompt 位置 · 25</span>
            <PromptSequence compact />
            <ImageSequence output />
            <small>仍保留 222 个位置</small>
          </div>
        </div>

        <div className={`p6-readout-flow ${activePhase >= 4 ? "is-reading" : ""}`}>
          <div className="p6-pool-input">
            <strong>只截取 Prompt 的输出位置</strong>
            <span className="p6-slice-label">H[0:25, :] <small>零基切片</small></span>
            <span className="p6-slice-vector" aria-label="前 25 个 Prompt 输出位置">{Array.from({ length: 25 }, (_, i) => <i key={i} style={{ opacity: .62 + .38 * readProgress }} />)}</span>
          </div>
          <span className="p6-read-arrow" aria-hidden="true">↓</span>
          <div className="p6-average">
            <strong>AvgPool</strong>
            <span className="p6-average-glyph" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <i key={i} style={{ transform: `translateY(${(1 - readProgress) * 6}px)` }} />)}</span>
            <small>25 个位置 → 1 个向量</small>
          </div>
          <Arrow />
          <div className="p6-feature-out"><strong>h(x<sub>A</sub>)</strong><span>768 维</span><i style={{ transform: `scaleX(${.35 + .65 * readProgress})` }} /></div>
          <Arrow />
          <div className={`p6-classifier ${activePhase === 5 ? "is-active" : ""}`}>
            <strong>共享分类器 g<sub>φ</sub></strong>
            <span>Logits z = (z₁, z₂, …, z<sub>C</sub>)</span>
            <span className="p6-logit-vector" aria-label="类别 Logits 向量">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ opacity: .35 + .65 * outputProgress }} />)}</span>
            <small>示意向量 · 数值未给出</small><small>预测规则：arg max<sub>c</sub> z<sub>c</sub></small>
          </div>
        </div>

        <div className="p6-equations">
          <math display="block"><msub><mi>x</mi><mi>e</mi></msub><mo>=</mo><msub><mi>f</mi><mi>e</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo><mo>∈</mo><msup><mi>ℝ</mi><mrow><mn>197</mn><mo>×</mo><mn>768</mn></mrow></msup></math>
          <math display="block"><mi>H</mi><mo>=</mo><msub><mi>f</mi><mi>r</mi></msub><mo>(</mo><msub><mi>x</mi><mi>p</mi></msub><mo>)</mo><mo>∈</mo><msup><mi>ℝ</mi><mrow><mn>222</mn><mo>×</mo><mn>768</mn></mrow></msup></math>
          <math display="block"><mi>h</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mi>AvgPool</mi><mo>(</mo><mi>H</mi><mo>[</mo><mn>0</mn><mo>:</mo><mn>25</mn><mo>,</mo><mo>:</mo><mo>]</mo><mo>)</mo><mo>∈</mo><msup><mi>ℝ</mi><mn>768</mn></msup></math>
          <math display="block"><mi>z</mi><mo>=</mo><msub><mi>g</mi><mi>φ</mi></msub><mo>(</mo><mi>h</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>)</mo><mo>;</mo><mover><mi>y</mi><mo>^</mo></mover><mo>=</mo><msub><mi>argmax</mi><mi>c</mi></msub><msub><mi>z</mi><mi>c</mi></msub></math>
        </div>

        <div className="p6-dimensions" aria-label="本页维度检查">
          <span><b>M</b><strong>10</strong><small>候选 Prompt</small></span><span><b>N</b><strong>5</strong><small>选中 Prompt</small></span><span><b>L<sub>p</sub></b><strong>5</strong><small>每组位置</small></span><span><b>L</b><strong>197</strong><small>图像 Token</small></span><span><b>D</b><strong>768</strong><small>特征宽度</small></span><span className="p6-dim-result"><b>N L<sub>p</sub> + L</b><strong>25 + 197 = 222</strong><small>扩展序列长度</small></span>
        </div>

        <div className="motion-stops" role="group" aria-label="选择 L2P 分类前向阶段">
          {phases.map((phase, index) => <button className="lesson-choice" type="button" key={phase.short} aria-pressed={activePhase === index} onClick={() => playback.seek(boundaries[index])}>{index + 1}. {phase.short}</button>)}
        </div>
        <PlaybackControls playback={playback} label="Prompt 分类前向进度" />
        <p className="motion-status" aria-live="polite">{phases[activePhase].text}</p>
      </div>
      <figcaption>图像 Token 为可读性压缩显示：一个 [CLS] 加 196 个 Patch 位置；Prompt 的 25 个位置逐一绘出。Logits 向量只示意类别分数的形状，不代表具体预测值。分类池化只覆盖序列最前的 25 个 Prompt 输出，不包含其后的 [CLS] 与 Patch。</figcaption>
    </figure>

    <section className="explain-section">
      <h3>为什么不能把 CLS 或整个序列拿来平均？</h3>
      <p>输入序列的前 25 个位置对应五组被选中的 Prompt。经过 Transformer 后，每个位置都带有与图像交互后的上下文信息；<span className="reading-emphasis reading-emphasis--prompt">AvgPool 将这 25 个向量合成一个 768 维表示</span>，交给共享分类头。图像 CLS 虽然仍在序列里，但不属于这里指定的读出区间。</p>
      <p>在这个 Split CIFAR‑100 / CORe50 的 ViT‑B/16 配置下，<math><mi>N</mi><msub><mi>L</mi><mi>p</mi></msub><mo>=</mo><mn>5</mn><mo>×</mo><mn>5</mn><mo>=</mo><mn>25</mn></math>，所以序列长度是 <math><mn>197</mn><mo>+</mo><mn>25</mn><mo>=</mo><mn>222</mn></math>，每个位置仍宽 768。论文的五数据集实验使用不同的 <math><mi>M</mi></math> 与 <math><mi>N</mi></math> 配置；这里不把这些数推广到所有设置。</p>
    </section>

    <p className="lesson-takeaway">一次分类前向已经连通：检索选集决定输入 Prompt，Prompt 位置输出经平均池化后进入分类器。下一步再看这些 Key 和 Prompt 如何在训练中分别得到学习信号。</p>
  </>;
}
