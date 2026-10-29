import { EXPERIMENTS, COUNTEREXAMPLES } from "./evidence-data";
import { ReferenceButton } from "./Reference";
import "./evidence.css";

const methodClass = (method: string) => method === "DER++" ? "method-derplus" : "method-" + method.toLowerCase();

const FINDINGS = [
  {
    id: "class-il",
    label: "S-CIFAR-10 · Class-IL · K=500",
    text: "在这个协议和容量下，DER 与 DER++ 的表中均值高于 ER。",
  },
  {
    id: "task-il",
    label: "S-CIFAR-10 · Task-IL · K=500",
    text: "测试可用任务身份；DER 的表中均值略低于 ER，不应与 Class-IL 混作同一协议。",
  },
  {
    id: "capacity",
    label: "MNIST-360 · 容量变化",
    text: "K=500 与 K=200 的表项排序不同；额外标签监督没有普遍胜出保证。",
  },
];

function ExperimentCard({ experiment }: { experiment: typeof EXPERIMENTS[number] }) {
  return (
    <figure
      className="evidence-card"
      data-experiment={experiment.id}
      data-evidence-id={experiment.evidence}
      data-source-locator={experiment.locator}
    >
      <header>
        <div>
          <p className="eyebrow">{experiment.evidence} · {experiment.locator}</p>
          <h3>{experiment.title}<span> / K={experiment.capacity}</span></h3>
          <p className="evidence-protocol">{experiment.protocol}</p>
        </div>
        <span className="paper-result-label">论文原表</span>
      </header>
      <p className="experiment-conditions">{experiment.setup}</p>
      <p className="evidence-metric">{experiment.metric}</p>
      <div className="evidence-plot" role="img" aria-label={experiment.metric + "；条长表示表中均值"}>
        {experiment.values.map(value => (
          <div
            className="evidence-row"
            key={value.method}
            data-method={value.method}
            data-mean={value.mean}
            data-spread={value.spread}
            aria-label={value.method + " " + value.mean.toFixed(2) + " ± " + value.spread.toFixed(2) + "%"}
          >
            <strong>{value.method}</strong>
            <div className="evidence-track" aria-hidden="true">
              <div className={"evidence-bar " + methodClass(value.method)} style={{ width: value.mean + "%" }} />
              <span className="evidence-mean" style={{ left: value.mean + "%" }} />
            </div>
            <output><b>{value.mean.toFixed(2)}</b><small>±{value.spread.toFixed(2)}</small></output>
          </div>
        ))}
        <div className="evidence-axis" aria-hidden="true">
          <span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span>
        </div>
      </div>
      <figcaption>{experiment.conclusion}</figcaption>
    </figure>
  );
}

export default function Evidence() {
  return (
    <section className="evidence-section" data-scene="evidence" data-experiment-count={EXPERIMENTS.length}>
      <div className="evidence-lead">
        <p className="lead">结果支持哪些判断，取决于数据集、协议和容量。</p>
        <p>
          下图逐项重绘论文 arXiv v2 的表格值。条长只表示表中均值，右侧照录 ±；
          原表没有在这里说明其统计含义，因此不作解释，也不从均值差推断显著性。
          每项结果都保留自己的测试协议、实验条件和来源定位。
        </p>
      </div>

      <section className="evidence-findings" aria-label="关键发现">
        {FINDINGS.map((finding, index) => (
          <article key={finding.id} data-finding={finding.id}>
            <span>0{index + 1}</span>
            <div><h3>{finding.label}</h3><p>{finding.text}</p></div>
          </article>
        ))}
      </section>

      <div className="evidence-legend" aria-label="图例">
        <span><i className="legend-er" /> ER</span>
        <span><i className="legend-der" /> DER</span>
        <span><i className="legend-derplus" /> DER++</span>
        <small>所有图共用 0–100% 量尺；点标记均值，± 仅以原表文字保留。</small>
      </div>

      <section className="evidence-grid" aria-label="论文主结果对照">
        {EXPERIMENTS.map(experiment => <ExperimentCard key={experiment.id} experiment={experiment} />)}
      </section>

      <section className="counterexamples" data-evidence-id="R05">
        <header>
          <div><p className="eyebrow">R05 · Tables 2–3</p><h3>同样重要的反例</h3></div>
          <p>这些配置中，DER++ 没有取得更高的表中均值。</p>
        </header>
        <div>
          {COUNTEREXAMPLES.map(example => (
            <article key={example.setting}>
              <h4>{example.setting}</h4>
              <p>{example.text}</p>
              <small>{example.evidence} · {example.source}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="evidence-limits">
        <header><p className="eyebrow">如何阅读这些结果</p><h3>边界仍由机制和实验条件决定。</h3></header>
        <div>
          <article><h4>有限记忆不是类别配额</h4><p>Reservoir 按流位置等概率留存，不保证小缓存覆盖每个类别。</p></article>
          <article><h4>冻结 z 可能保留旧偏差</h4><p>DER++ 加入真实历史标签，但两类监督仍可能竞争。</p></article>
          <article><h4>均值不构成普遍保证</h4><p>增强、容量、网络与训练协议共同影响实测结果。</p></article>
          <article><h4>相同 K 不代表相同字节成本</h4><p>DER++ 还存历史标签；条目数不能替代总内存比较。</p></article>
        </div>
      </section>

      <p className="evidence-analysis">
        论文还给出局部平坦性与校准分析；它们是特定设置下的经验观察。
        <ReferenceButton term="evidence-analysis">查看分析与局限</ReferenceButton>
      </p>
      <div className="evidence-close">
        <p className="eyebrow">回看整条主线</p>
        <p>有限记忆保留部分旧输入与响应，当前标签推动学习，冻结目标约束旧行为；表格显示这些选择在具体基准中有竞争力，也受协议和容量限制。</p>
        <ReferenceButton term="evidence-results">打开完整结果表与来源</ReferenceButton>
        <a href="#U6-complete-system">返回四轮工作台 ↑</a>
      </div>
    </section>
  );
}
