import { useState } from "react";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";
import { Arrow } from "./vit-visuals";
import { Specimen } from "./specimen";
import {
  buildSelectionSnapshot,
  promptPoolConfig,
  sharedKeyIndices,
  type QueryId,
  type SelectionSnapshot,
} from "./prompt-retrieval-data";
import {
  CandidateLedger,
  PromptPairPool,
  PromptReadout,
  RetrievalVectorSpace,
  formatSubscript,
} from "./prompt-retrieval-visuals";
import "./prompt-retrieval.css";

const duration = 13_700;
const boundaries = [0, 1_000, 2_600, 8_000, 9_900, 11_700, duration];
const phases = [
  { label: "输入生成 Query", short: "生成 Query", text: "当前图像先经过不插入 Prompt 的冻结 ViT；读取末层 CLS 位置，形成当前输入的 Query。" },
  { label: "计算一项余弦距离", short: "展开一项距离", text: "以 q_A 与 k₂ 为例，从两个向量的夹角 24° 得到 cosθ，再计算余弦距离 γ≈0.086。Query B 会对应展开它最近的 k₄。" },
  { label: "逐个记录全部候选", short: "比较全部 Key", text: "同一个 Query 继续与其余九个 Key 比较。表中的分数都由同一组向量现场计算，展示到小数点后三位。" },
  { label: "排序并确定选集", short: "距离排序 Top‑5", text: "候选评分记录按 γ 升序排列；前五条对应本次读取的五个 Prompt 索引。源 Pool 槽位没有移动。" },
  { label: "按索引读取 Prompt", short: "形成使用视图", text: "从五个选中槽位读取配对 Prompt，按本演示的距离顺序形成一次前向的使用视图；源参数仍保留在池中。" },
  { label: "比较两个输入", short: "查看部分共享", text: "切换 A/B 后 Query 方向与分数会变，Key–Prompt Pool 保持不动。本例选集共享 P₂、P₃。" },
];

const snapshots: Readonly<Record<QueryId, SelectionSnapshot>> = Object.freeze({
  A: buildSelectionSnapshot("A"),
  B: buildSelectionSnapshot("B"),
});
const commonIndices = sharedKeyIndices();

function phaseAt(position: number) {
  if (position >= duration) return phases.length - 1;
  const index = boundaries.findIndex((_, current) => current < boundaries.length - 1
    && position >= boundaries[current] && position < boundaries[current + 1]);
  return Math.max(0, index);
}

function comparisonOrder(query: QueryId) {
  const first = query === "A" ? 2 : 4;
  return [first, ...Array.from({ length: promptPoolConfig.poolSize }, (_, offset) => offset + 1).filter(index => index !== first)];
}

function queryStatus(query: QueryId) {
  return query === "A" ? "q_A · 12°" : "q_B · 116°";
}

function visibleRecords(position: number, phase: number, order: readonly number[]) {
  if (phase === 0) return new Set<number>();
  if (phase === 1) return new Set([order[0]]);
  if (phase >= 3) return new Set(order);
  const progress = Math.max(0, Math.min(1, (position - boundaries[2]) / (boundaries[3] - boundaries[2])));
  const count = Math.min(order.length, 1 + Math.floor(progress * (order.length - 1)));
  return new Set(order.slice(0, count));
}

function activeCandidate(position: number, phase: number, order: readonly number[]) {
  if (phase === 1) return order[0];
  if (phase >= 3) return order[0];
  if (phase !== 2) return null;
  const progress = Math.max(0, Math.min(1, (position - boundaries[2]) / (boundaries[3] - boundaries[2])));
  const offset = Math.min(order.length - 1, 1 + Math.floor(progress * (order.length - 1)));
  return order[offset];
}

function selectionOrder(query: QueryId) {
  return snapshots[query].selected.map(candidate => candidate.index);
}

function Sequence({ snapshot }: { snapshot: SelectionSnapshot }) {
  return <span className="p5-index-sequence">
    {snapshot.selected.map((candidate, offset) => <span className="p5-index-item" key={candidate.index}>
      <math><msub><mi>P</mi><mn>{candidate.index}</mn></msub></math>
      {offset < snapshot.selected.length - 1 && <span className="p5-index-separator" aria-hidden="true">·</span>}
    </span>)}
  </span>;
}

function QueryComparison({ activeQuery }: { activeQuery: QueryId }) {
  return <section className={`p5-query-comparison ${activeQuery === "B" ? "is-b-active" : "is-a-active"}`} aria-label="Query A 与 Query B 的 Top-5 及共享 Prompt">
    <div className="p5-region-heading">
      <h3>同一组槽位，输入决定选集</h3>
      <span>比较两次输入的 Top‑5 索引</span>
    </div>
    <div className="p5-comparison-row">
      <div className={`p5-comparison-set ${activeQuery === "A" ? "is-active" : ""}`}>
        <span className="p5-comparison-label">查询 A · {queryStatus("A")}</span>
        <Sequence snapshot={snapshots.A} />
      </div>
      <div className="p5-shared-set">
        <span>共享槽位</span>
        <span className="p5-shared-indices">{commonIndices.map(index => <math key={index}><msub><mi>P</mi><mn>{index}</mn></msub></math>)}</span>
      </div>
      <div className={`p5-comparison-set ${activeQuery === "B" ? "is-active" : ""}`}>
        <span className="p5-comparison-label">查询 B · {queryStatus("B")}</span>
        <Sequence snapshot={snapshots.B} />
      </div>
    </div>
    <p>这些索引取决于每个样本的 Query，而不是任务或类别标签。本例只说明可以部分共享，不保证共享后永远没有参数冲突。</p>
  </section>;
}

export function PromptRetrieval() {
  const [query, setQuery] = useState<QueryId>("A");
  const playback = useLessonPlayback(duration);
  const activePhase = phaseAt(playback.position);
  const snapshot = snapshots[query];
  const scanOrder = comparisonOrder(query);
  const completedIndices = visibleRecords(playback.position, activePhase, scanOrder);
  const activeCandidateIndex = activeCandidate(playback.position, activePhase, scanOrder);
  const readProgress = activePhase > 4 ? 1 : activePhase === 4
    ? (playback.position - boundaries[4]) / (boundaries[5] - boundaries[4]) : 0;

  function chooseQuery(next: QueryId) {
    setQuery(next);
    playback.seek(0);
  }

  function inspectKey(index: number) {
    const offset = scanOrder.indexOf(index);
    if (offset <= 0) {
      playback.seek(boundaries[1] + 550);
      return;
    }
    const withinScan = (offset - 0.5) / (scanOrder.length - 1);
    playback.seek(boundaries[2] + withinScan * (boundaries[3] - boundaries[2]));
  }

  return <>
    <p className="lesson-lead">P4 的单个共享 Prompt 会被后续任务继续更新。L2P 把多个可学习 Prompt 与 Key 一一配对，让每个输入按自身特征取用一部分参数。</p>

    <section className="explain-section p5-pair-intro">
      <h3>Key 寻址，Prompt 进入模型</h3>
      <p>每个槽位保存一对持久参数：<math><msub><mi>k</mi><mi>j</mi></msub></math> 是与 Query 比较的检索向量；<math><msub><mi>P</mi><mi>j</mi></msub></math> 是含 <math><msub><mi>L</mi><mi>p</mi></msub></math> 个可学习 Token 的序列。相同下标表示一一配对。</p>
      <div className="reading-contrast reading-contrast--claims p5-key-boundary" role="group" aria-label="Key 与 Prompt 的角色区别">
        <div className="reading-claim--core"><strong>Key 只参与外部检索</strong><p>它决定取哪个 Prompt，不会拼进 ViT；这里的 Query/Key 也不是 Self‑Attention 内部的 Q/K/V。</p></div>
        <div className="reading-claim--caution"><strong>Pool 保存可复用参数</strong><p>本次读取不会新增、消耗或删除槽位；选集按样本变化，不按任务固定分区。</p></div>
      </div>
    </section>

    <figure className="lesson-figure p5-retrieval-figure">
      <div className="figure-top"><strong>从图像 Query 到五组 Prompt</strong><span>同一个计算模型驱动向量、分数、排序和读取</span></div>
      <div className="figure-body">
        <div className="p5-query-controls" role="group" aria-label="切换二维检索示例的 Query">
          <div className="p5-query-control-label"><strong>当前输入</strong><span>切换样本，不提供任务 ID</span></div>
          <button type="button" className="lesson-choice" aria-pressed={query === "A"} onClick={() => chooseQuery("A")}>查询 A · 12°</button>
          <button type="button" className="lesson-choice" aria-pressed={query === "B"} onClick={() => chooseQuery("B")}>查询 B · 116°</button>
          <span className="p5-query-demo-note">角度是二维教学方向，不是 ViT 的实际二维输出</span>
        </div>

        <div className="p5-query-flow" aria-label="输入图像经冻结 ViT 生成 Query">
          <div className="p5-query-input"><Specimen /><span><strong>x<sub>{query.toLowerCase()}</sub></strong><small>当前图像</small></span></div>
          <Arrow />
          <div className={`p5-query-frozen ${activePhase === 0 ? "is-active" : ""}`}><strong>冻结 ViT f</strong><small>不插入 Prompt</small></div>
          <Arrow />
          <div className={`p5-query-output ${activePhase === 0 ? "is-active" : ""}`}><strong>q(x) = f(x)[0,:]</strong><small>末层 CLS 特征 · 无任务 ID</small></div>
          <div className="p5-query-example"><span>二维方向示例</span><strong>{queryStatus(query)}</strong></div>
        </div>

        <p className="p5-two-d-boundary">真实机制在高维空间比较 <math><mi>q</mi><mo>(</mo><mi>x</mi><mo>)</mo></math> 与可学习 Keys。为了看清余弦规则，下方用固定的二维单位向量演示；所有数值都是可复算的教学示例。</p>

        <div className="p5-workbench-grid">
          <RetrievalVectorSpace snapshot={snapshot} activeCandidateIndex={activeCandidateIndex} selectedIndices={snapshot.selectedKeyIndices}
            phase={activePhase} onInspectKey={inspectKey} />
          <CandidateLedger snapshot={snapshot} activeCandidateIndex={activeCandidateIndex} completedIndices={completedIndices}
            phase={activePhase} onInspectKey={inspectKey} />
        </div>

        <div className="p5-source-read-grid">
          <PromptPairPool snapshot={snapshot} activeCandidateIndex={activeCandidateIndex} phase={activePhase} onInspectKey={inspectKey} />
          <PromptReadout snapshot={snapshot} visible={activePhase >= 4} progress={readProgress} />
        </div>

        <section className="p5-ranking-rule" aria-label="L2P 的 Top-N 选择目标">
          <div><strong>距离如何决定选集？</strong><span>所有 Key 都评分后，取总距离最小的 N 项。</span></div>
          <math display="block"><msub><mi>K</mi><mi>x</mi></msub><mo>=</mo><munder><mi>argmin</mi><mrow><mi>S</mi><mo>⊆</mo><mo>[</mo><mn>1</mn><mo>,</mo><mi>M</mi><mo>]</mo><mo>,</mo><mo>|</mo><mi>S</mi><mo>|</mo><mo>=</mo><mi>N</mi></mrow></munder><munder><mo>∑</mo><mrow><mi>j</mi><mo>∈</mo><mi>S</mi></mrow></munder><mi>γ</mi><mo>(</mo><mi>q</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>,</mo><msub><mi>k</mi><mi>j</mi></msub><mo>)</mo></math>
          <p>公式 (3) 定义的是 Top‑N 集合；页面按距离从小到大显示索引，便于追踪读取次序。此演示设 M={promptPoolConfig.poolSize}、N={promptPoolConfig.topN}、L<sub>p</sub>={promptPoolConfig.promptLength}；这些容量匹配论文报告的部分配置。</p>
        </section>

        <QueryComparison activeQuery={query} />

        <div className="p5-motion-controls">
          <div className="motion-stops" role="group" aria-label="跳转到检索过程阶段">
            {phases.map((phase, index) => <button className="lesson-choice" type="button" key={phase.short}
              aria-pressed={activePhase === index} onClick={() => playback.seek(boundaries[index] + (index === 4
                ? (boundaries[5] - boundaries[4]) * 0.88
                : index === phases.length - 1 ? 0 : 30))}>
              {index + 1}. {phase.short}
            </button>)}
          </div>
          <PlaybackControls playback={playback} label="Query 到 Top‑N 的检索进度" />
          <p className="motion-status" aria-live="polite">{phases[activePhase].text}</p>
        </div>
      </div>
      <figcaption>在 Query A 下，评分顺序、距离排序和读取视图始终来自同一个快照：{selectionOrder("A").map(index => `P${formatSubscript(index)}`).join(" · ")}。选择这些 Prompt 后，P6 才会把它们接到图像 Token 序列之前。</figcaption>
    </figure>

    <section className="explain-section p5-reading-boundary">
      <h3>从检索结果回到论文机制</h3>
      <p>Query 由未插入 Prompt 的冻结特征提取器得到：<math><mi>q</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>[</mo><mn>0</mn><mo>,</mo><mo>:</mo><mo>]</mo></math>。它与全部 Keys 比较，选中索引后才按相同下标取得 Prompt；Key 本身不参与分类序列。</p>
      <p>本例 Query A 得到 <math><mi>S</mi><mo>(</mo><msub><mi>x</mi><mi>A</mi></msub><mo>)</mo><mo>=</mo><mo>{"{"}</mo><mn>1</mn><mo>,</mo><mn>2</mn><mo>,</mo><mn>10</mn><mo>,</mo><mn>3</mn><mo>,</mo><mn>9</mn><mo>{"}"}</mo></math>，沿用 P6 的输入索引。不同输入可共享部分 Prompt，但结果不是任务标签，也不保证共享后完全没有冲突。</p>
      <p className="p5-example-limits">边界：真实的 Query 与 Key 是高维特征/参数；圆上的角度和数值不是论文实验测量值。基础检索只比较当前 Query 与 Key，不涉及训练时可选的频率加权策略，也不在这里更新任何参数。</p>
    </section>

    <p className="lesson-takeaway">当前输入已按距离找到五组 Prompt。下一页继续追踪同一组索引如何进入 ViT，并从 Prompt 位置读出分类特征。</p>
  </>;
}
