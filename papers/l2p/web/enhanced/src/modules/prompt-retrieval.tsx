import { Fragment, useState } from "react";
import { useLessonPlayback, PlaybackControls } from "./lesson-playback";
import { Arrow } from "./vit-visuals";
import { promptPoolConfig, rankKeys, selectedKeyIndices, type QueryId } from "./prompt-retrieval-data";
import "./prompt-retrieval.css";

const duration = 7600;
const boundaries = [0, 900, 2650, 4050, 5400, duration];
const phases = [
  { label: "无任务 ID 的当前输入", short: "生成 Query", text: "当前输入先经过不带 Prompt 的冻结 ViT，从位置 0 的 CLS 特征得到查询向量 q(x)。" },
  { label: "同一个 Query 对照 Key 池", short: "逐 Key 比较", text: "外部检索将 q(x) 分别与十个 Key 计算余弦距离；Key 与 Prompt 按相同下标配对。" },
  { label: "距离由小到大排序", short: "按距离排序", text: "对全部 Key 排序，距离越小越相近。此处的距离来自明确给出的二维单位圆示例。" },
  { label: "选取距离最小的五个 Key", short: "取 Top‑N", text: "当前样本选择五个不同索引，并按这些索引读取对应 Prompt；池中的参数仍留在原位。" },
  { label: "生成本次前向的读取视图", short: "读取 Prompt", text: "被选中的五个 Prompt 被复制到本次计算视图中，源池没有消耗或删除任何槽位。" },
];

function phaseAt(position: number) {
  if (position >= duration) return phases.length - 1;
  const index = boundaries.findIndex((_, i) => i < boundaries.length - 1 && position >= boundaries[i] && position < boundaries[i + 1]);
  return Math.max(0, index);
}

function PromptTokens({ count = promptPoolConfig.promptLength, className = "" }: { count?: number; className?: string }) {
  return <span className={`p5-token-row ${className}`} aria-hidden="true">{Array.from({ length: count }, (_, i) => <i key={i} />)}</span>;
}

function PromptIndexList({ indices }: { indices: readonly number[] }) {
  return <span className="p5-overlap-prompts">{indices.map((index, order) => <Fragment key={index}>
    <math><msub><mi>P</mi><mn>{index}</mn></msub></math>
    {order < indices.length - 1 && <span className="p5-overlap-separator" aria-hidden="true">·</span>}
  </Fragment>)}</span>;
}

export function PromptRetrieval() {
  const [query, setQuery] = useState<QueryId>("A");
  const playback = useLessonPlayback(duration);
  const activePhase = phaseAt(playback.position);
  const comparisonProgress = activePhase > 1 ? 1 : activePhase === 1
    ? (playback.position - boundaries[1]) / (boundaries[2] - boundaries[1]) : 0;
  const revealProgress = activePhase > 2 ? 1 : activePhase === 2
    ? (playback.position - boundaries[2]) / (boundaries[3] - boundaries[2]) : 0;
  const copyProgress = activePhase > 4 ? 1 : activePhase === 4
    ? 0.25 + 0.75 * (playback.position - boundaries[4]) / (boundaries[5] - boundaries[4]) : 0;
  const ranking = rankKeys(query);
  const selected = selectedKeyIndices(query);
  const selectedSet = new Set(selected);

  function chooseQuery(next: QueryId) {
    setQuery(next);
    playback.seek(0);
  }

  return <>
    <p className="lesson-lead">P4 的单 Prompt 会被后续任务继续修改。L2P 保留多个 Prompt，并给每个 Prompt 配一个 Key：当前输入先生成 Query，再按样本内容选择 Top‑N，不需要先知道任务 ID。</p>

    <section className="explain-section">
      <h3>Key 负责寻址，Prompt 才进入 ViT</h3>
      <p>每个池槽保存一对参数：<math><msub><mi>k</mi><mi>j</mi></msub></math> 是用于匹配的向量，<math><msub><mi>P</mi><mi>j</mi></msub></math> 是由多个 Token 组成的可学习序列。相同下标只表示配对关系；<span className="reading-emphasis reading-emphasis--key">检索 Key 不会拼入 Transformer，也不是 P3 的 Self‑Attention Key</span>。</p>
      <div className="p5-equations" aria-label="Key-Prompt 池、查询和余弦距离定义">
        <math display="block"><mi>ℳ</mi><mo>=</mo><mo>{"{"}</mo><mo>(</mo><msub><mi>k</mi><mi>j</mi></msub><mo>,</mo><msub><mi>P</mi><mi>j</mi></msub><mo>)</mo><mo>:</mo><mn>1</mn><mo>≤</mo><mi>j</mi><mo>≤</mo><mi>M</mi><mo>{"}"}</mo></math>
        <math display="block"><mi>q</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>[</mo><mn>0</mn><mo>,</mo><mo>:</mo><mo>]</mo></math>
        <math display="block"><mi>γ</mi><mo>(</mo><mi>q</mi><mo>,</mo><msub><mi>k</mi><mi>j</mi></msub><mo>)</mo><mo>=</mo><mn>1</mn><mo>−</mo><mfrac><msup><mi>q</mi><mi>⊤</mi></msup><msub><mi>k</mi><mi>j</mi></msub><mrow><mo>‖</mo><mi>q</mi><mo>‖</mo><mo>‖</mo><msub><mi>k</mi><mi>j</mi></msub><mo>‖</mo></mrow></mfrac></math>
      </div>
      <p>Query 来自当前图像在无 Prompt 冻结 ViT 下的 CLS 输出，其中 <math><mi>f</mi><mo>=</mo><msub><mi>f</mi><mi>r</mi></msub><mo>∘</mo><msub><mi>f</mi><mi>e</mi></msub></math>；随后与池内全部 Key 比较余弦距离，并取距离最小的 <math><mi>N</mi></math> 个配对 Prompt。<span className="reading-emphasis reading-emphasis--query">Query 是当前前向的临时特征；池则是持续保留的参数记忆。</span></p>
    </section>

    <figure className="lesson-figure p5-retrieval-figure">
      <div className="figure-top"><strong>一张输入，十个候选，读取五组 Prompt</strong><span>切换查询或按阶段播放同一组检索状态</span></div>
      <div className="figure-body">
        <div className="p5-query-toggle" role="group" aria-label="选择二维检索教学示例">
          <span>示例查询方向</span>
          <button type="button" className="lesson-choice" aria-pressed={query === "A"} onClick={() => chooseQuery("A")}>查询 A · q<sub>A</sub></button>
          <button type="button" className="lesson-choice" aria-pressed={query === "B"} onClick={() => chooseQuery("B")}>查询 B · q<sub>B</sub></button>
          <span className="p5-query-disclaimer">二维单位圆教学示例 · 非论文测量值</span>
        </div>

        <div className="p5-query-flow" aria-label="由输入图像生成无 Prompt 的 CLS Query">
          <div className="p5-sample"><strong>当前输入 x<sub>{query.toLowerCase()}</sub></strong><span>不提供任务 ID</span></div><Arrow />
          <div className={`p5-no-prompt ${activePhase === 0 ? "is-active" : ""}`}><strong>冻结 ViT f</strong><span>不插入 Prompt</span></div><Arrow />
          <div className={`p5-query-output ${activePhase === 0 ? "is-active" : ""}`}>
            <strong>q(x) = f(x)[0,:]</strong><span className="p5-query-vector" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} />)}</span><small>CLS 特征 · 临时 Query</small>
          </div>
          <span className="p5-compare-caption">分别与 M = {promptPoolConfig.poolSize} 个 Key 比较</span>
        </div>

        <section className="p5-pool" aria-label="十个 Key-Prompt 配对记忆槽">
          <div className="p5-region-heading"><h3>Key–Prompt Pool</h3><span>M = 10 · 每个 P 含 L<sub>p</sub> = 5 个 Token</span></div>
          <div className="p5-pool-grid">
            {Array.from({ length: promptPoolConfig.poolSize }, (_, offset) => {
              const index = offset + 1;
              const item = ranking.find(candidate => candidate.index === index)!;
              const isSelected = selectedSet.has(index);
              const rank = ranking.findIndex(candidate => candidate.index === index) + 1;
              const distance = item.distance;
              const measured = 100 * distance / 2;
              return <div className={`p5-pair-unit ${activePhase >= 3 && isSelected ? "is-selected" : ""}`} key={index}>
                <div className="p5-pair-head"><strong>P<sub>{index}</sub></strong><span>{activePhase >= 3 ? (isSelected ? `Top‑N · #${rank}` : "未选中") : `槽位 ${index}`}</span></div>
                <div className="p5-key-block"><span className="p5-key-label">Key k<sub>{index}</sub></span><span className="p5-key-vector" aria-label={`Key ${index} 向量示意`}>{Array.from({ length: 4 }, (_, i) => <i key={i} />)}</span><small>用于距离比较</small></div>
                <span className="p5-pair-link" aria-hidden="true" />
                <div className="p5-prompt-block"><span>Prompt P<sub>{index}</sub></span><PromptTokens /></div>
                <div className="p5-distance">
                  <span>γ = {activePhase >= 1 ? distance.toFixed(3) : "待比较"}</span>
                  <span className="p5-distance-rail"><i style={{ width: `${comparisonProgress * measured}%` }} /></span>
                </div>
              </div>;
            })}
          </div>
          <div className="p5-pool-legend"><span><i className="p5-legend-key" />检索 Key</span><span><i className="p5-legend-prompt" />输入 Prompt</span><span>同一下标表示配对；池槽始终保留</span></div>
        </section>

        <div className="p5-rank-and-read">
          <section className="p5-ranking" aria-label="按余弦距离升序排列的十个 Key">
            <div className="p5-region-heading"><h3>距离升序 · Top‑N</h3><span>γ 越小越接近 · N = {promptPoolConfig.topN}</span></div>
            {activePhase >= 2 ? <ol>
              {ranking.map((item, index) => {
                const isSelected = index < promptPoolConfig.topN;
                const rowReveal = activePhase > 2 ? 1 : Math.max(0, Math.min(1, 0.38 + revealProgress * (ranking.length + 1) - index));
                return <li className={activePhase >= 3 && isSelected ? "is-selected" : ""} key={item.index} style={{ opacity: rowReveal, transform: `translateY(${(1 - rowReveal) * 7}px)` }}>
                  <span className="p5-rank-index">#{index + 1}</span><strong>k<sub>{item.index}</sub> / P<sub>{item.index}</sub></strong><span className="p5-rank-rail"><i style={{ width: `${100 * item.distance / 2}%` }} /></span><span className="p5-rank-distance">{item.distance.toFixed(3)}</span>
                </li>;
              })}
            </ol> : <div className="p5-ranking-pending"><strong>距离比较完成后，十个候选会按 γ 由小到大重新排列</strong><span>{Array.from({ length: promptPoolConfig.poolSize }, (_, index) => <i key={index}>k<sub>{index + 1}</sub></i>)}</span></div>}
            <p className="p5-set-result">{activePhase >= 3 ? <>S(x<sub>{query.toLowerCase()}</sub>) = &#123;{selected.join(", ")}&#125;</> : "排序后读取距离最小的五项"}</p>
          </section>

          <section className={`p5-read-view ${activePhase >= 4 ? "is-open" : ""}`} aria-label="本次前向读取出的 Prompt 副本">
            <div className="p5-region-heading"><h3>本次前向的读取视图</h3><span>池中参数仍在原位</span></div>
            {activePhase >= 4 ? <div className="p5-read-sequence" style={{ opacity: copyProgress }}>
              {selected.map((index, order) => <div className="p5-read-entry" key={index} style={{ transform: `translateY(${(1 - copyProgress) * 14}px)` }}>
                <div className="p5-read-prompt"><span className="p5-read-label"><math><msub><mi>P</mi><mn>{index}</mn></msub></math></span><PromptTokens className="p5-read-token-row" /></div>
                {order < selected.length - 1 && <span className="p5-read-separator" aria-hidden="true"><math><mo>;</mo></math></span>}
              </div>)}
            </div> : <div className="p5-read-pending"><strong>等待 Top‑N 选集</strong><span>源池保留 · 选中后才生成本次读取视图</span></div>}
            <p>按选择排名读取 {promptPoolConfig.topN} 组 × {promptPoolConfig.promptLength} Token；P6 会将它们接到图像 Token 序列之前。</p>
          </section>
        </div>

        <div className="motion-stops" role="group" aria-label="选择检索过程阶段">
          {phases.map((phase, index) => <button className="lesson-choice" type="button" key={phase.short} aria-pressed={activePhase === index} onClick={() => playback.seek(boundaries[index])}>{index + 1}. {phase.short}</button>)}
        </div>
        <PlaybackControls playback={playback} label="Query 到 Top‑N 的检索进度" />
        <p className="motion-status" aria-live="polite">{phases[activePhase].text}</p>
      </div>
      <figcaption>距离由单位圆公式现场计算并四舍五入到三位。q<sub>A</sub> = (1,0)，q<sub>B</sub> = k<sub>4</sub>；它们只用于展示“不同输入可选出不同 Prompt 组合”，不代表论文中的 ViT 特征或实验数据。</figcaption>
    </figure>

    <section className="explain-section">
      <h3>选中索引是当前输入的路由，不是任务标签</h3>
      <p>查询 A 的 Top‑5 为 <math><mi>S</mi><mo>(</mo><msub><mi>x</mi><mi>A</mi></msub><mo>)</mo><mo>=</mo><mo>{"{"}</mo><mn>1</mn><mo>,</mo><mn>2</mn><mo>,</mo><mn>10</mn><mo>,</mo><mn>3</mn><mo>,</mo><mn>9</mn><mo>{"}"}</mo></math>；查询 B 则为 <math><mi>S</mi><mo>(</mo><msub><mi>x</mi><mi>B</mi></msub><mo>)</mo><mo>=</mo><mo>{"{"}</mo><mn>4</mn><mo>,</mo><mn>3</mn><mo>,</mo><mn>5</mn><mo>,</mo><mn>2</mn><mo>,</mo><mn>6</mn><mo>{"}"}</mo></math>。两次选择共享 P₂、P₃，其余各有不同槽位；索引由当前 Query 决定，不固定代表某个类别或任务。</p>
      <div className="p5-overlap" role="group" aria-label="查询 A 与查询 B 的 Top-5 Prompt 选择及共享槽位">
        <div className="p5-overlap-group"><span className="p5-overlap-label">查询 A</span><PromptIndexList indices={[1, 2, 10, 3, 9]} /></div>
        <div className="p5-shared-mark"><span>共享</span><PromptIndexList indices={[2, 3]} /></div>
        <div className="p5-overlap-group"><span className="p5-overlap-label">查询 B</span><PromptIndexList indices={[4, 3, 5, 2, 6]} /></div>
      </div>
      <div className="reading-contrast reading-contrast--claims" role="group" aria-label="本例能说明的检索行为及其边界">
        <div className="reading-claim--core"><strong>这组结果说明</strong><p>检索按样本选择 Prompt，两个输入的选集可以部分重叠。</p></div>
        <div className="reading-claim--caution"><strong>它不保证</strong><p>共享后绝无冲突；检索也不读取任务 ID、不保存旧图像或删除未选槽位。</p></div>
      </div>
    </section>

    <p className="lesson-takeaway">P5 已按当前图像得到一组 Prompt。接下来把同一组索引接入冻结 ViT，看看正式分类究竟读取哪些输出位置。</p>
  </>;
}
