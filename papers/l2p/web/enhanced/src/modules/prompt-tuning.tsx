import { useLessonPlayback, PlaybackControls } from "./lesson-playback";
import { Specimen } from "./specimen";
import { Arrow } from "./vit-visuals";
import "./prompt-tuning.css";

const duration = 7200;
const boundaries = [0, 900, 1900, 3000, 3900, 5350, 6300, duration];
const phases = [
  { label: "先得到图像 Token", short: "图像嵌入", text: "冻结的嵌入层先把当前图像变成宽度为 D 的 Token 序列 xₑ。" },
  { label: "把可学习 P 前置", short: "拼接 Prompt", text: "一组与图像 Token 同宽的 Prompt 向量放在 xₑ 前面；序列变长，特征宽度不变。" },
  { label: "通过冻结 Transformer", short: "冻结前向", text: "扩展序列通过原有 Transformer。权重固定，Token 的输出仍取决于当前输入。" },
  { label: "计算分类损失", short: "分类误差", text: "分类器把教学读出 h(P,x) 映射为类别分数，再与标签 y 计算交叉熵。" },
  { label: "梯度回到可学习参数", short: "梯度回传", text: "梯度经过冻结 Transformer 的计算回到输入 P；fᵣ 的参数没有被更新。" },
  { label: "更新 P 和分类头", short: "参数更新", text: "优化器更新 Prompt P 与分类头 φ。预训练的 fₑ、fᵣ 仍保持原值。" },
  { label: "下一任务再次使用同一 P", short: "继续使用 P", text: "若后续任务继续训练同一组 P，它可能与旧任务需要的方向产生参数争用；这不意味着每次都会遗忘。" },
];

function phaseAt(position: number) {
  if (position >= duration) return phases.length - 1;
  const index = boundaries.findIndex((end, i) => i < boundaries.length - 1 && position >= end && position < boundaries[i + 1]);
  return Math.max(0, index);
}

function TokenStrip({ kind, label, count = 5 }: { kind: "prompt" | "image"; label: string; count?: number }) {
  return <div className={`p4-token-strip p4-token-strip--${kind}`}>
    <span className="p4-token-label">{label}</span>
    <span className="p4-token-cells" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => <i className={kind === "image" && index === 0 ? "p4-token p4-token--cls" : "p4-token"} key={index}>{kind === "image" && index === 0 ? "CLS" : ""}</i>)}
      {kind === "image" && <span className="p4-token-ellipsis">…</span>}
    </span>
  </div>;
}

export function PromptTuning() {
  const playback = useLessonPlayback(duration);
  const activePhase = phaseAt(playback.position);
  const gradientProgress = activePhase > 4 ? 1 : activePhase === 4
    ? (playback.position - boundaries[4]) / (boundaries[5] - boundaries[4]) : 0;
  const updateProgress = activePhase > 5 ? 1 : activePhase === 5
    ? (playback.position - boundaries[5]) / (boundaries[6] - boundaries[5]) : 0;

  return <>
    <p className="lesson-lead">P3 已经给出一个入口：即使 Transformer 权重固定，改变输入 Token 仍会改变输出。Prompt Tuning 把一小段连续向量设为可学习参数，让它随图像一起进入网络，靠分类误差适应新任务。</p>

    <section className="explain-section">
      <h3>Prompt 是一组向量参数，不是图像 Patch 或自然语言句子</h3>
      <p>沿用 P2 的图像嵌入层，先得到 <math><msub><mi>x</mi><mi>e</mi></msub></math>。Prompt 放在这段序列之前：每个 Prompt Token 与图像 Token 有相同的特征宽度 <math><mi>D</mi></math>，因此增加的是位置数，不是新建 Transformer 层。</p>
      <div className="p4-shape-equations">
        <math display="block"><mi>P</mi><mo>∈</mo><msup><mi>ℝ</mi><mrow><msub><mi>L</mi><mi>p</mi></msub><mo>×</mo><mi>D</mi></mrow></msup></math>
        <math display="block"><msub><mi>x</mi><mi>p</mi></msub><mo>=</mo><mo>[</mo><mi>P</mi><mo>;</mo><msub><mi>x</mi><mi>e</mi></msub><mo>]</mo><mo>∈</mo><msup><mi>ℝ</mi><mrow><mo>(</mo><msub><mi>L</mi><mi>p</mi></msub><mo>+</mo><mi>L</mi><mo>)</mo><mo>×</mo><mi>D</mi></mrow></msup><mo>,</mo><mi>H</mi><mo>=</mo><msub><mi>f</mi><mi>r</mi></msub><mo>(</mo><msub><mi>x</mi><mi>p</mi></msub><mo>)</mo></math>
      </div>
      <p>这里的分号表示沿序列长度拼接。P4 先用一个 Prompt 解释学习原理；L2P 正式使用多个 Prompt，分类时读取它们经过 Transformer 后的位置输出，留到 P6。</p>
    </section>

    <figure className="lesson-figure p4-training-figure">
      <div className="figure-top"><strong>单 Prompt 教学桥 · 从输入到一次更新</strong><span>播放、暂停或拖动到任一计算阶段</span></div>
      <div className="figure-body">
        <div className="p4-step-strip" aria-label="Prompt 调优的前向与更新路径">
          <div className={`p4-step p4-step--source ${activePhase === 0 ? "is-active" : ""}`}>
            <Specimen />
            <strong>图像 x</strong>
            <span className="p4-mini-module p4-frozen">冻结 fₑ</span>
            <math><msub><mi>x</mi><mi>e</mi></msub><mo>=</mo><msub><mi>f</mi><mi>e</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo></math>
          </div>
          <Arrow />
          <div className={`p4-step p4-step--assembly ${activePhase === 1 ? "is-active" : ""}`}>
            <strong>同宽 Token，前置拼接</strong>
            <TokenStrip kind="prompt" label="可学习 P" />
            <TokenStrip kind="image" label="图像序列 xₑ" count={4} />
            <div className="p4-composed-sequence">
              <span>送入 fᵣ</span>
              <span className="p4-composed-cells" aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => <i className="p4-token" key={`p${index}`} />)}
                <i className="p4-token p4-token--cls">CLS</i><i className="p4-token p4-token--image" /><i className="p4-token p4-token--image" /><span>…</span>
              </span>
            </div>
            <small>位置从 L 变为 L + Lₚ · 每个位置仍宽 D</small>
          </div>
          <Arrow />
          <div className={`p4-step p4-step--encoder ${activePhase === 2 || activePhase === 4 ? "is-active" : ""}`}>
            <strong>冻结 Transformer</strong>
            <div className="p4-encoder-stack" aria-label="同一组冻结的 Transformer Encoder 层">
              <span>Encoder Block 1</span><span>Encoder Block 2</span><i>⋮</i><span>Encoder Block L</span>
            </div>
            <small>前向与梯度计算都经过这里；权重不更新</small>
          </div>
          <Arrow />
          <div className={`p4-step p4-step--loss ${activePhase === 3 ? "is-active" : ""}`}>
            <div className="p4-readout"><strong>h(P,x)</strong><small>简化教学读出</small></div>
            <span className="p4-down-flow" aria-hidden="true">↓</span>
            <div className="p4-classifier"><strong>共享分类头 gφ</strong><small>可训练</small></div>
            <div className="p4-loss"><strong>交叉熵</strong><math><msub><mi>ℒ</mi><mtext>cls</mtext></msub><mo>=</mo><mi>CE</mi><mo>(</mo><msub><mi>g</mi><mi>φ</mi></msub><mo>(</mo><mi>h</mi><mo>)</mo><mo>,</mo><mi>y</mi><mo>)</mo></math></div>
          </div>
        </div>

        <div className={`p4-gradient-route ${activePhase === 4 ? "is-active" : ""}`} aria-label="分类损失的梯度经过冻结的 Transformer 运算，回到 Prompt 输入">
          <div className="p4-gradient-label"><strong>反向计算</strong><small>梯度从分类损失返回</small></div>
          <div className="p4-gradient-track">
            <span className="p4-gradient-source">∂ℒ / ∂h</span>
            <svg viewBox="0 0 720 54" preserveAspectRatio="none" role="img" aria-label="梯度沿相反方向穿过冻结 fᵣ 到达 Prompt">
              <defs><marker id="p4-gradient-arrow" markerWidth="8" markerHeight="8" refX="3" refY="4" orient="auto"><path d="M8 0L0 4L8 8Z" fill="currentColor" /></marker></defs>
              <path d="M690 28 H35" className="p4-gradient-line" markerEnd="url(#p4-gradient-arrow)" />
              <circle className="p4-gradient-particle" cx={690 - 655 * Math.min(1, Math.max(0, gradientProgress))} cy="28" r="6" />
            </svg>
            <span className="p4-gradient-target">∂ℒ / ∂P</span>
            <span className="p4-gradient-frozen">穿过 fᵣ 运算 · fᵣ 参数保持冻结</span>
          </div>
        </div>

        <div className={`p4-update-row ${activePhase === 5 ? "is-active" : ""}`} aria-label="更新可学习参数 P 和 φ，冻结的预训练参数保持不变">
          <div className="p4-update-label"><strong>参数更新</strong><small>仅更新可学习部分</small></div>
          <div className="p4-parameter-change"><span>P⁽⁰⁾</span><div className="p4-change-track"><i style={{ transform: `scaleX(${updateProgress})` }} /></div><span>P⁽¹⁾</span></div>
          <div className="p4-parameter-change p4-parameter-change--head"><span>φ⁽⁰⁾</span><div className="p4-change-track"><i style={{ transform: `scaleX(${updateProgress})` }} /></div><span>φ⁽¹⁾</span></div>
          <div className="p4-stays-fixed"><span>fₑ</span><span>fᵣ</span><small>权重未改</small></div>
        </div>

        <div className="motion-stops" role="group" aria-label="选择 Prompt 调优的观察阶段">
          {phases.map((phase, index) => <button className="lesson-choice" type="button" key={phase.short} aria-pressed={activePhase === index} onClick={() => playback.seek(boundaries[index])}>{index + 1}. {phase.short}</button>)}
        </div>
        <PlaybackControls playback={playback} label="Prompt 前向与更新进度" />
        <p className="motion-status" aria-live="polite">{phases[activePhase].text}</p>
      </div>
      <figcaption>单 Prompt 只用于解释可学习输入怎样适应冻结网络。这里的 h(P,x) 是抽象教学读出，不代表 L2P 正式分类头的读取位置。</figcaption>
    </figure>

    <section className="explain-section">
      <h3>梯度能穿过冻结运算，参数却不必更新</h3>
      <p>分类损失依赖于输入序列里的 P，因此一般情形下可对 P 求梯度。反向计算经过固定的 Transformer 运算，把梯度传到 P；优化器只改 P 与分类器 φ，冻结主干 fₑ、fᵣ 的参数保持原值。</p>
      <div className="p4-gradient-equation">
        <math display="block"><msub><mi>ℒ</mi><mtext>cls</mtext></msub><mo>=</mo><mi>CE</mi><mo>(</mo><msub><mi>g</mi><mi>φ</mi></msub><mo>(</mo><mi>h</mi><mo>(</mo><mi>P</mi><mo>,</mo><mi>x</mi><mo>)</mo><mo>)</mo><mo>,</mo><mi>y</mi><mo>)</mo></math>
        <math display="block"><msub><mo>∇</mo><mi>P</mi></msub><msub><mi>ℒ</mi><mtext>cls</mtext></msub><mo>≠</mo><mn>0</mn><mtext>（一般情形）</mtext></math>
      </div>
      <p>这不是在 P4 重新讲一次 Attention。P3 已说明输入 Token 会参与计算；这里沿用该结论，只追踪梯度落到哪里、哪些参数改变。</p>
    </section>

    <section className="explain-section">
      <h3>但所有任务若继续改同一个 Prompt，仍可能相互干扰</h3>
      <p>任务 A 学到的 Prompt 可以继续服务后续输入。若任务 B 接着更新这同一组参数，原先适用的方向可能改变。因此“冻结 ViT”本身并没有回答怎样减少不同任务对少量可训练参数的争用；这里描述的是可能性，不是保证发生的遗忘结果。</p>
      <figure className="lesson-figure p4-shared-prompt">
        <div className="figure-top"><strong>同一组参数跨任务继续使用</strong><span>对象身份保持为同一个 P</span></div>
        <div className="figure-body">
          <div className="p4-task-sequence">
            <div><strong>任务 A</strong><span>分类损失更新 P</span></div><Arrow />
            <div className="p4-shared-parameter"><strong>同一组 Prompt P</strong><span>P⁽ᴬ⁾ → P⁽ᴬ→ᴮ⁾</span></div><Arrow />
            <div><strong>任务 B</strong><span>再次写入这组参数</span></div>
          </div>
          <p className="p4-conflict-note">后续更新可能改变旧任务依赖的参数关系；本图没有表示一个必然的遗忘幅度。</p>
        </div>
      </figure>
    </section>

    <p className="lesson-takeaway">如果一个 Prompt 仍会被多个任务共同修改，能否保存多个 Prompt，再让当前图像自己选出需要的一部分？</p>
  </>;
}
