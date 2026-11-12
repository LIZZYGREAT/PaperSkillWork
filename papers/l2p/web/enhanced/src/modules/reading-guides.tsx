import { P6_IMAGE_CLS_SEQUENCE_INDEX, P6_PROMPT_TOKEN_COUNT } from "./prompt-forward-data";
import { promptPoolConfig } from "./prompt-retrieval-data";
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
