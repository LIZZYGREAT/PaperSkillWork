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

export function P6SequenceRuler() {
  const imageLength = config.imageLength;
  return <figure className="p6-sequence-ruler" aria-label={`扩展序列位置比例：${P6_PROMPT_TOKEN_COUNT} 个 Prompt 位置加 ${imageLength} 个图像位置，合计 ${P6_SEQUENCE_LENGTH} 个位置，宽度 ${config.featureWidth} 维`}>
    <div className="p6-sequence-ruler__legend" aria-hidden="true">
      <span>Prompt 段 · {P6_PROMPT_TOKEN_COUNT} 位 · 0–{P6_PROMPT_TOKEN_COUNT - 1}</span>
      <span>图像段 · {imageLength} 位 · [CLS] + {imageLength - 1} Patch</span>
    </div>
    <div className="p6-sequence-ruler__scroll" tabIndex={0} role="region" aria-label="扩展序列比例尺；可横向滚动查看">
      <div className="p6-sequence-ruler__track">
        <div className="p6-ruler-prompt" style={{ flexGrow: P6_PROMPT_TOKEN_COUNT, gridTemplateColumns: `repeat(${P6_SELECTED_PROMPT_INDICES.length}, minmax(0, 1fr))` }}>
          {P6_SELECTED_PROMPT_INDICES.map((id, index) => <div className="p6-ruler-group" key={`${id}-${index}`}>
            <span>P<sub>{id}</sub></span>
            <span className="p6-ruler-group__positions" aria-hidden="true">{Array.from({ length: config.promptLength }, (_, token) => <i key={token} />)}</span>
          </div>)}
        </div>
        <div className="p6-ruler-image" style={{ flexGrow: imageLength }}>
          {Array.from({ length: imageLength }, (_, position) => <i key={position} data-cls={position === 0 || undefined} aria-hidden="true" />)}
        </div>
      </div>
    </div>
    <div className="p6-sequence-ruler__sum">
      <span>{P6_PROMPT_TOKEN_COUNT} Prompt</span><span aria-hidden="true">+</span><span>{imageLength} 图像位置</span>
      <span aria-hidden="true">=</span><span>{P6_SEQUENCE_LENGTH} 个位置</span><span className="p6-ruler-width">每个位置均为 {config.featureWidth} 维</span>
    </div>
    <figcaption>长度比例对应序列行数；深蓝首格是 [CLS]，其后为 Patch。行数拼接后增加，向量宽度不变。</figcaption>
  </figure>;
}
