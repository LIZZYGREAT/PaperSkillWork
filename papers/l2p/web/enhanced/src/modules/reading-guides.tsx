import { P6_IMAGE_CLS_SEQUENCE_INDEX, P6_PROMPT_TOKEN_COUNT } from "./prompt-forward-data";
import { promptPoolConfig } from "./prompt-retrieval-data";
import { P7_COMMON_INDICES } from "./prompt-learning-data";
import "./reading-guides.css";

export function P4ParameterGuide() {
  return <figure className="reading-guide p4-parameter-guide" aria-label="区分梯度回传与优化器写回">
    <dl>
      <div><dt><span className="guide-symbol" data-tone="prompt"><math><mi>P</mi><mo>,</mo><mi>φ</mi></math></span>可学习参数</dt><dd>Prompt 与分类头收到梯度，<span className="lesson-key">各自写回一次</span>。</dd></div>
      <div><dt><span className="guide-symbol" data-tone="frozen"><math><msub><mi>f</mi><mi>r</mi></msub></math></span>冻结计算</dt><dd>梯度可以经过这里回到 Prompt，<span className="lesson-key lesson-key--type">主干权重保持原值</span>。</dd></div>
    </dl>
    <figcaption>先点「反向传播」，再点「更新一次」：前一格追踪梯度，后一格才比较参数值。</figcaption>
  </figure>;
}

export function P5RankGuide() {
  return <figure className="reading-guide p5-rank-guide" aria-label="距离、下标和 Prompt 的交接顺序">
    <ol>
      <li><span className="guide-symbol" data-tone="frozen"><math><mi>γ</mi></math></span><div><strong>量距离</strong><p>每个 Key 得到一个分数，越小越靠前。</p></div></li>
      <li><span className="guide-symbol" data-tone="selected"><math><mi>S</mi><mo>(</mo><mi>x</mi><mo>)</mo></math></span><div><strong>留索引</strong><p>截取前 {promptPoolConfig.topN} 名，记下原池的槽位号。</p></div></li>
      <li><span className="guide-symbol" data-tone="prompt"><math><msub><mi>P</mi><mi>j</mi></msub></math></span><div><strong>取内容</strong><p>用槽位号读取 Prompt，源槽位还在原处。</p></div></li>
    </ol>
    <figcaption>读下图时认准编号：一根柱改变名次后，仍指向原来那个池槽位。</figcaption>
  </figure>;
}

export function P6ReadoutGuide() {
  return <figure className="reading-guide p6-readout-guide" aria-label="放大编码后的 Prompt 与图像输出分界">
    <div className="p6-guide-rows">
      <div className="p6-guide-prompt">
        <span>Prompt 输出</span>
        <strong>第 0–{P6_PROMPT_TOKEN_COUNT - 1} 行</strong>
        <div className="guide-token-strip" aria-hidden="true">{Array.from({ length: P6_PROMPT_TOKEN_COUNT }, (_, index) => <i key={index} />)}</div>
        <span>逐维平均，得到 <math><mi>h</mi></math></span>
      </div>
      <div className="p6-guide-image">
        <span>图像输出</span>
        <strong>第 {P6_IMAGE_CLS_SEQUENCE_INDEX} 行起</strong>
        <div className="guide-token-strip" aria-hidden="true"><i className="guide-cls" /><i /><i /><i /></div>
        <span>从 [CLS] 开始，随后是 Patch</span>
      </div>
    </div>
    <figcaption>这是输出序列的局部放大。所有位置都参与编码，平均池化只读取紫色位置。</figcaption>
  </figure>;
}


export function P7BatchGuide() {
  const slot = P7_COMMON_INDICES[0];
  return <figure className="reading-guide p7-batch-guide" aria-label={`追踪 A、B 在同一个槽位 ${slot} 的梯度贡献`}>
    <div className="p7-guide-snapshot">A 和 B 都从 <math><msub><mi>Θ</mi><mi>b</mi></msub></math> 读取槽位 {slot}</div>
    <table>
      <thead><tr><th scope="col">样本来源</th><th scope="col" data-tone="prompt">Prompt {slot}</th><th scope="col" data-tone="frozen">Key {slot}</th></tr></thead>
      <tbody>{["A", "B"].map(sample => <tr key={sample}><th scope="row">{sample}</th><td>分类梯度 · {sample}</td><td>匹配梯度 · {sample}</td></tr>)}
        <tr className="p7-guide-total"><th scope="row">批末合计</th><td>A + B</td><td>A + B</td></tr>
      </tbody>
    </table>
    <figcaption>下面在「放大槽位」中选 {slot} 号，再与仅命中一个样本的槽位对照。每一列先汇总自己的梯度，然后统一写回。</figcaption>
  </figure>;
}

export function P8LoopGuide() {
  return <figure className="reading-guide p8-loop-guide" aria-label="训练循环从任务嵌套到批内样本">
    <ol>
      <li data-depth="0"><b>Task</b><span>换成当前任务的数据，继承已有模型状态。</span></li>
      <li data-depth="1"><b>Epoch</b><span>遍历当前任务的数据一次。</span></li>
      <li data-depth="2" data-write><b>Batch</b><span>汇总这一批的损失，<span className="lesson-key">写回一次</span>。</span></li>
      <li data-depth="3"><b>Sample</b><span>生成自己的选集与损失；继续读取同一批的旧状态。</span></li>
    </ol>
    <figcaption>逐层向内看计算的范围：最内层产出样本贡献，返回 Batch 层才更新参数。</figcaption>
  </figure>;
}

export function P9EvidenceGuide() {
  const evidence = [
    { target: "selection", locator: "Figure 3", question: "哪些 Prompt 被共用？", scope: "选择分布记录共用模式，不给槽位指定任务。" },
    { target: "ablation", locator: "Table 5", question: "移除设计后会怎样？", scope: "在同一 5-datasets 配置中比较完整与消融版本。" },
    { target: "results", locator: "Tables 1、3、4", question: "效果在哪些协议里成立？", scope: "按协议读指标：平均准确率、遗忘与测试准确率各有口径。" },
  ];
  return <figure className="reading-guide p9-evidence-guide" aria-label="根据问题选择论文证据">
    <ol>{evidence.map(item => <li key={item.target}>
      <a href={`#p9-${item.target}-evidence`}><span>{item.locator}</span><strong>{item.question}</strong></a>
      <p>{item.scope}</p>
    </li>)}</ol>
    <figcaption>从一个问题出发查一组证据，比较前先核对数据集、协议和指标。</figcaption>
  </figure>;
}
