import { useState } from "react";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";
import { Arrow } from "./vit-visuals";
import { Specimen } from "./specimen";
import { buildSelectionSnapshot, promptPoolConfig, type QueryId } from "./prompt-retrieval-data";
import {
  CandidateBars, PromptShelf, PromptTokens, QueryOverlap, VectorSpace, clamp01, formatSubscript,
} from "./prompt-retrieval-visuals";
import "./prompt-retrieval.css";

const snapshots = { A: buildSelectionSnapshot("A"), B: buildSelectionSnapshot("B") };
const { poolSize, topN, promptLength } = promptPoolConfig;
const compareMs = 820;
const scanDuration = poolSize * compareMs + 800;
const rankEnd = 4400;
const readStart = 5100;
const copyMs = 600;
const readDuration = readStart + copyMs * topN + 700;

export function PromptRetrieval() {
  const [query, setQuery] = useState<QueryId>("A");
  const [inspected, setInspected] = useState<number | null>(null);
  const scan = useLessonPlayback(scanDuration);
  const retrieval = useLessonPlayback(readDuration);
  const snapshot = snapshots[query];
  const candidateOffset = Math.min(poolSize - 1, Math.floor(scan.position / compareMs));
  const candidate = snapshot.candidates[inspected ?? candidateOffset];
  const angleProgress = inspected === null ? clamp01((scan.position - candidateOffset * compareMs) / 470) : 1;
  const computed = inspected === null ? candidateOffset + (angleProgress >= 1 ? 1 : 0) : 1;
  const hasScore = (index: number) => inspected === null ? index < computed : index === inspected;
  const scanControls = {
    ...scan,
    toggle() { setInspected(null); scan.toggle(); },
    seek(value: number) { setInspected(null); scan.seek(value); },
  };
  const sort = clamp01((retrieval.position - 900) / (rankEnd - 900));
  const read = Math.min(topN, Math.max(0, (retrieval.position - readStart) / copyMs));
  const rankHint = sort < 1 ? "观察同一个候选条怎样移动到它的距离名次。"
    : read < topN ? "按入选名次，从同编号槽位逐个读取 Prompt。"
    : "五组 Prompt 已备好，源池的十个槽位仍留在原处。";

  function chooseQuery(next: QueryId) {
    if (query === next) return;
    setQuery(next);
    setInspected(null);
    scan.seek(0);
    retrieval.seek(0);
  }

  return <div className="p5-lesson">
    <p className="lesson-lead">P4 中，两批任务若轮流改写同一个 Prompt，旧输入依赖的表示也可能跟着变。准备多组 Prompt 可以分担这种干扰，但测试时只给图像。L2P 要先解决一个问题：如何让图像自己找到合适的 Prompt？</p>

    <section className="explain-section p5-query-primer">
      <h3>用图像本身生成查询向量</h3>
      <p>先让原始图像走一遍不插入 Prompt 的冻结 ViT，再取末层的 <span className="lesson-key">[CLS] 特征作为检索 Query</span>。这样，检索可以在选出 Prompt 之前完成，得到的向量用于找相近的 Key。分类要等选中的 Prompt 接入下一次前向。</p>
      <div className="p5-query-flow" role="group" aria-label="当前图像经不插入 Prompt 的冻结 ViT 生成 Query">
        <div className="p5-query-input"><Specimen /><strong>当前图像</strong></div>
        <Arrow />
        <div><strong>冻结 ViT</strong><span>原始图像序列</span></div>
        <Arrow />
        <div><strong>末层 [CLS] 特征</strong><math><mi>q</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>[</mo><mn>0</mn><mo>,</mo><mo>:</mo><mo>]</mo></math></div>
      </div>
    </section>

    <section className="explain-section p5-pair-intro">
      <h3>用同一个下标把地址和内容配成一对</h3>
      <p>池中每个槽位存两个对象。<span className="lesson-key">外部 Key 负责被比较，配对的 Prompt 负责进入模型</span>。例如，若 Key 的编号是 j，读出的就是同槽位的 Prompt j。P3 的 Attention Key 则是在模型内部计算的，两者处于不同的运算阶段。</p>
      <div className="p5-slot-anatomy" role="group" aria-label="同槽位的检索 Key 与 Prompt">
        <div className="p5-slot-key"><strong>检索地址</strong><math><msub><mi>k</mi><mi>j</mi></msub></math><span>一条向量，参与距离比较</span></div>
        <div className="p5-slot-pair-link">同槽位 j</div>
        <div className="p5-slot-prompt"><strong>可取用的输入</strong><math><msub><mi>P</mi><mi>j</mi></msub></math><PromptTokens /><span>{promptLength} 个 Prompt Token</span></div>
      </div>
    </section>

    <section className="explain-section">
      <h3>固定 Query，逐个比较方向</h3>
      <p>先点选一个 Key，观察它与 Query 的夹角。方向越接近，余弦越接近 1，距离就越小。再播放一次扫描：同一个 Query 保持方向，十个 Key 轮流接受同一条比较规则。下面用二维单位向量演示这一过程。</p>
      <div className="p5-query-controls" role="group" aria-label="切换两个输入的 Query">
        <strong>当前查询</strong>
        {(["A", "B"] as const).map(id => <button key={id} type="button" className="lesson-choice"
          aria-pressed={query === id} onClick={() => chooseQuery(id)}>
          查询 {id} · {snapshots[id].query.angleDegrees}°
        </button>)}
      </div>
      <figure className="lesson-figure p5-compare-figure">
        <div className="figure-top"><strong>每次只量一个夹角</strong></div>
        <div className="figure-body">
          <PlaybackControls playback={scanControls} label="比较进度" />
          <div className="p5-compare-grid" data-query={query} data-computed={computed}>
            <VectorSpace snapshot={snapshot} candidate={candidate} progress={angleProgress} />
            <div className="p5-score">
              <strong className="p5-score-pair"><span>q<sub>{query}</sub></span> 与 <span>k{formatSubscript(candidate.index)}</span></strong>
              <dl>
                <div><dt>夹角 θ</dt><dd>{candidate.thetaDegrees.toFixed(0)}°</dd></div>
                <div><dt>余弦 cos θ</dt><dd>{angleProgress >= 1 ? candidate.cosineSimilarity.toFixed(3) : "—"}</dd></div>
                <div><dt>余弦距离 γ</dt><dd>{angleProgress >= 1 ? candidate.distance.toFixed(3) : "—"}</dd></div>
              </dl>
              <div className="p5-scan-heading"><strong>候选 Key</strong><span>已比较 {computed}/{poolSize}</span></div>
              <div className="p5-scan-keys" role="group" aria-label="点选要比较的 Key">
                {snapshot.candidates.map((item, index) => <button type="button" key={item.index}
                  className="lesson-choice" aria-pressed={item === candidate} data-computed={hasScore(index)}
                  onClick={() => { scan.seek(0); setInspected(index); }}>
                  <span>k{formatSubscript(item.index)}</span>
                  <i aria-hidden="true" style={{ transform: `scaleX(${hasScore(index) ? item.distance / 2 : 0})` }} />
                </button>)}
              </div>
            </div>
          </div>
        </div>
        <figcaption>墨绿实线是固定 Query，青绿实线是正在比较的 Key，暖色弧线量出两者的夹角。</figcaption>
      </figure>
      <p>每个候选的记录都是 <math><mi>γ</mi><mo>(</mo><mi>q</mi><mo>,</mo><mi>k</mi><mo>)</mo><mo>=</mo><mn>1</mn><mo>−</mo><mi>cos</mi><mi>θ</mi></math>。把十个距离排在一起，才能知道哪几个方向最接近当前 Query。</p>
    </section>

    <section className="explain-section">
      <h3>选出最小的五个距离，再用下标取 Prompt</h3>
      <p>横排的十根柱先按池槽位放置，柱越短，距离越小。排序把短柱移到前面，前 {topN} 名给出本例的索引集合。然后按入选次序读出配对的 Prompt，每次取用都保留池中的源参数。</p>
      <figure className="lesson-figure p5-retrieval-figure">
        <div className="figure-top"><strong>距离排序与同索引读取</strong><span>当前 Query {query}</span></div>
        <div className="figure-body">
          <div className="p5-motion-controls">
            <PlaybackControls playback={retrieval} label="排序与读取进度" />
            <div className="motion-stops" role="group" aria-label="查看排序和读取结果">
              <button type="button" className="lesson-choice" onClick={() => retrieval.seek(rankEnd)}>查看排名</button>
              <button type="button" className="lesson-choice" onClick={() => retrieval.seek(readDuration)}>查看读出</button>
            </div>
          </div>
          <p className="p5-rank-hint" aria-live="polite">{rankHint}</p>
          <CandidateBars snapshot={snapshot} progress={sort} />
          <PromptShelf snapshot={snapshot} progress={read} />
        </div>
        <figcaption>距离最小的 {topN} 个 Key 以绿色底线标出。紫色的使用视图按对应索引从源池生成。</figcaption>
      </figure>
      <p>论文公式 (3) 选择的是总距离最小的 N 个索引。只要各项距离独立评分，取最小的 N 项就能得到这个集合。这里按距离顺序展示，方便把每个名次和一次读取对上。</p>
      <details className="p5-score-details">
        <summary>核对 Query {query} 的十项距离</summary>
        <math display="block" aria-label="论文公式三，寻找余弦距离之和最小的 N 个索引">
          <msub><mi>K</mi><mi>x</mi></msub><mo>=</mo>
          <munder><mi>argmin</mi><mrow><mi>S</mi><mo>⊆</mo><mo>[</mo><mn>1</mn><mo>,</mo><mi>M</mi><mo>]</mo><mo>,</mo><mo>|</mo><mi>S</mi><mo>|</mo><mo>=</mo><mi>N</mi></mrow></munder>
          <munder><mo>∑</mo><mrow><mi>j</mi><mo>∈</mo><mi>S</mi></mrow></munder>
          <mi>γ</mi><mo>(</mo><mi>q</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>,</mo><msub><mi>k</mi><mi>j</mi></msub><mo>)</mo>
        </math>
        <table>
          <thead><tr><th scope="col">Key</th><th scope="col">夹角</th><th scope="col">余弦</th><th scope="col">距离</th><th scope="col">名次</th></tr></thead>
          <tbody>{snapshot.ranking.map((item, rank) => <tr key={item.index}>
            <th scope="row">k{formatSubscript(item.index)}</th><td>{item.thetaDegrees.toFixed(0)}°</td>
            <td>{item.cosineSimilarity.toFixed(3)}</td><td>{item.distance.toFixed(3)}</td><td>{rank + 1}</td>
          </tr>)}</tbody>
        </table>
      </details>
    </section>

    <section className="explain-section p5-query-sharing">
      <h3>换一个输入，哪些 Prompt 还能共用？</h3>
      <p>换 Query 后，角度和排名会变，池还是同一个。A 和 B 都选到 P₂、P₃，也分别读到了对方没有取用的三个 Prompt。共享来自输入和 Key 的匹配，因此一个槽位可以被不同输入取用。</p>
      <QueryOverlap first={snapshots.A} second={snapshots.B} />
      <p>P6 沿用 A 的读取结果，把这五组 Prompt 接在图像 Token 前面，执行一次带 Prompt 的前向分类。</p>
    </section>
  </div>;
}
