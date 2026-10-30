import { SampleToken } from "../shared/foundation/visual-parts/SampleToken";
import { ResponseMeter } from "../shared/foundation/visual-parts/ResponseMeter";
import { CLASSES, LABEL_CURRENT, LABEL_OLD } from "./math-model";
import ModelMark from "./review/ModelMark";
import { Term } from "./Reference";
import "./teaching-front.css";

function Prediction({ current }: { current?: boolean }) {
  const values = current ? LABEL_CURRENT : LABEL_OLD;
  return <article className="prediction-sheet">
    <p className="eyebrow">{current ? "比较时刻 · 当前判断" : "保存时刻 · 历史判断"}</p>
    <p className="prediction-answer">预测 <strong>Claude</strong><span>✓ 正确</span></p>
    <div className="response-reveal" data-response={current ? "current" : "history"}>
      <p className="caption">原始 logits · 共同尺度 0–3</p>
      {CLASSES.map((label, k) => <ResponseMeter key={label} label={label} value={values[k]} min={0} max={3} showScale={false} />)}
    </div>
  </article>;
}

export default function ReplayEntry() {
  return <div className="front-teaching" data-core-items="I01 I02">
    <section className="training-origin" aria-labelledby="training-origin-title">
      <div><p className="eyebrow">S1 · 先从熟悉的训练开始</p><h3 id="training-origin-title">数据向前走，参数也在改变。</h3>
        <p className="front-lead">分类模型根据当前数据调整参数。持续学习时，新的样本不断到来，模型继续使用<strong>同一组参数</strong>训练。</p>
        <p>可是过去的数据未必还在眼前。如果只根据新数据更新，模型对旧输入的判断可能变差，这便产生了<strong>灾难性遗忘</strong>问题。</p>
      </div>
      <figure className="parameter-stream"><p className="figure-label">数据不断到来</p><div className="stream-symbols"><span>x₁</span><span>x₂</span><span>x₃</span><span>…</span></div><div className="parameter-thread"><span>θ₀</span><i>→</i><span>θ₁</span><i>→</i><span>θ₂</span></div><figcaption>同一个模型持续学习。<br />旧输入的判断，也可能随参数一起改变。</figcaption></figure>
    </section>
    <section className="reasoning-stair" aria-label="从完整历史到有限回放的推导">
      <p><span>一个自然想法</span>如果全部历史一直可用，就能把新旧数据混在一起训练。</p>
      <p><span>但空间有上限</span>数据流的长度未知，记忆容量固定，历史不能无限保存。</p>
      <p><span>因此，留下少量历史</span>之后再抽出来复习——这就是<strong>经验回放（ER）</strong>。</p>
    </section>
    <section className="gcl-context"><h3>让这个办法适用于真实的数据流。</h3><p>分布可能逐渐漂移，也可能突然改变，未必按 Task A → Task B 整齐切换。论文将这种现实要求概括为<strong>通用持续学习（GCL）</strong>：训练不依赖任务边界，预测不需要额外的任务编号，历史记忆容量有界。</p><p>有限回放符合这些要求：它让部分旧输入重新参与当前训练，无须等到一个任务结束。</p></section>
    <figure className="er-relation" aria-label="当前数据与记忆旧数据共同监督同一个当前模型">
      <div className="er-sources"><p><strong>当前数据 (xₜ,yₜ)</strong><span>新输入与真实标签</span></p><p><strong>记忆记录 (x′,y′)</strong><span>少量旧输入与真实标签</span></p></div>
      <span className="er-join">共同提供标签监督 →</span><div className="er-model"><strong>当前模型 θ</strong><span>学习新数据，也复习旧数据</span></div>
      <figcaption>新旧数据都参与分类训练；这里先关注回放的作用。</figcaption>
    </figure>
    <p className="front-question">有限回放已经让旧样本可以重新参与训练。<br /><strong>但一张旧图片与一个真实标签，究竟保存了多少过去的模型知识？</strong></p>
    <section className="label-investigation" data-label-revealed="true" aria-labelledby="label-investigation-title">
      <div className="same-input"><SampleToken sampleId="x1" label="同一旧输入 x₁"><ModelMark /></SampleToken><p>真实标签 y₁ = Claude<br /><small>合成分类示例 · Claude / GPT / DeepSeek</small></p></div>
      <p className="eyebrow">S2 · 最终答案与整组响应</p><h3 id="label-investigation-title">两次都预测正确，判断就没有变吗？</h3>
      <div className="prediction-pair"><Prediction /><Prediction current /></div>
      <div id="response-finding" className="response-finding" aria-live="polite"><h4>最高类别相同，另外两类的排序却交换了。</h4><p>真实标签规定了正确类别，却不记录旧模型对其他类别的完整判断。训练分类<Term id="ce">交叉熵</Term>会影响所有输出，但没有要求恢复曾经的那组具体分数。</p><p>如果想保留过去对各类别的响应，就需要额外记录一组输出作为历史监督。它可以是 <Term id="softmax" /> 后的概率，也可以是原始 <Term id="logits" />。这些超出单个类别答案的响应信息，常被称为 <strong>Dark Knowledge（暗知识）</strong>；记录的整组输出可用作软目标。</p></div>
      <p className="caption">本节比较时刻的 a=(2,0,1) 将沿用到下一节。类别名称和像素图案仅用于合成分类教学。</p>
    </section>
    <div className="front-handoff"><p>如果希望当前模型保持过去的整组响应，<br /><strong>怎样把“偏离了多少”定义成可计算、可优化的损失？</strong></p><a href="#U2-probability">比较两种表示空间 ↓</a></div>
  </div>;
}
