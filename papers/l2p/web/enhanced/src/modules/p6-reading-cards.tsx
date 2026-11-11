import { promptPoolConfig } from "./prompt-retrieval-data";
import { P6_PROMPT_TOKEN_COUNT, P6_SELECTED_PROMPT_INDICES, P6_SEQUENCE_LENGTH } from "./prompt-forward-data";
import "./p6-reading-cards.css";

const config = promptPoolConfig;

export function P6CallMap() {
  return <figure className="p6-call-map reading-card-figure" aria-label="先用无 Prompt 图像特征检索，再用同一冻结 ViT 做 Prompt 分类">
    <div className="p6-call-map__heading">两次调用依次使用同一套冻结权重</div>
    <div className="p6-call-map__rows">
      <div className="p6-call-row" data-route="retrieve">
        <span className="p6-call-row__step">先检索</span>
        <article className="p6-call-card"><span>图像</span><span className="p6-call-card__main">x</span><small>不插入 Prompt</small></article>
        <span className="p6-call-arrow" aria-hidden="true">→</span>
        <article className="p6-call-card p6-call-card--frozen"><span>冻结 ViT</span><span className="p6-call-card__main">fₑ → fᵣ</span><small>只计算当前图像</small></article>
        <span className="p6-call-arrow" aria-hidden="true">→</span>
        <article className="p6-call-card p6-call-card--query"><span>读出寻址特征</span><span className="p6-call-card__main">[CLS] → q(x)</span><small>与 Key 比较，得到 S(x)</small></article>
      </div>
      <div className="p6-call-row" data-route="classify">
        <span className="p6-call-row__step">再分类</span>
        <article className="p6-call-card p6-call-card--prompt"><span>拼成输入</span><span className="p6-call-card__main p6-call-selection">{P6_SELECTED_PROMPT_INDICES.map((id, index) => <span key={id}>P<sub>{id}</sub>{index < P6_SELECTED_PROMPT_INDICES.length - 1 ? ", " : " + "}</span>)}xₑ</span><small>使用刚才选出的 Prompt</small></article>
        <span className="p6-call-arrow" aria-hidden="true">→</span>
        <article className="p6-call-card p6-call-card--frozen"><span>同一冻结 ViT</span><span className="p6-call-card__main">fᵣ(xₚ) = H</span><small>整条扩展序列共同计算</small></article>
        <span className="p6-call-arrow" aria-hidden="true">→</span>
        <article className="p6-call-card p6-call-card--readout"><span>读分类特征</span><span className="p6-call-card__main">Prompt 输出 → h → z</span><small>AvgPool 后交给 gφ</small></article>
      </div>
    </div>
    <figcaption>q(x) 负责从 Key 中找 Prompt；分类特征 h 则来自带 Prompt 的另一次前向。二者使用相同冻结权重，但输入和读出位置不同。</figcaption>
  </figure>;
}

export function P6ShapeCards() {
  return <figure className="p6-shape-cards reading-card-figure" aria-label="Prompt 数量、图像位置与扩展序列形状">
    <article className="p6-shape-card p6-shape-card--prompt">
      <span className="p6-shape-card__eyebrow">本次选中</span>
      <span className="p6-shape-card__value">{P6_SELECTED_PROMPT_INDICES.length} 组 × {config.promptLength} 个</span>
      <span className="p6-shape-card__formula">= {P6_PROMPT_TOKEN_COUNT} 个 Prompt 位置</span>
      <small>池容量 M = {config.poolSize}；本次选 N = {P6_SELECTED_PROMPT_INDICES.length}</small>
    </article>
    <span className="p6-shape-operator" aria-hidden="true">+</span>
    <article className="p6-shape-card p6-shape-card--image">
      <span className="p6-shape-card__eyebrow">图像嵌入</span>
      <span className="p6-shape-card__value">{config.imageLength} 个位置</span>
      <span className="p6-shape-card__formula">[CLS] + {config.imageLength - 1} 个 Patch</span>
      <small>从扩展序列位置 {P6_PROMPT_TOKEN_COUNT} 开始</small>
    </article>
    <span className="p6-shape-operator" aria-hidden="true">→</span>
    <article className="p6-shape-card p6-shape-card--total">
      <span className="p6-shape-card__eyebrow">送入冻结 Transformer</span>
      <span className="p6-shape-card__value">{P6_SEQUENCE_LENGTH} × {config.featureWidth}</span>
      <span className="p6-shape-card__formula">位置数增加，宽度 D 不变</span>
      <small>输出 H 保留每个位置的上下文特征</small>
    </article>
  </figure>;
}
