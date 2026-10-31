import { SampleToken } from "../shared/foundation/visual-parts/SampleToken";
import { useState } from "react";
import { useSceneTimeline } from "./review/SceneTransport";
import { ResponseMeter } from "../shared/foundation/visual-parts/ResponseMeter";
import { CLASSES, LABEL_CURRENT, LABEL_OLD } from "./math-model";
import ModelMark from "./review/ModelMark";
import type { ModelClass } from "./review/ModelPixel";
import { Term } from "./Reference";
import "./teaching-front.css";
import "./teaching-objects.css";

const REVEAL_CLIPS = [{ id: "展开历史响应", durationMs: 1400, holdMs: 500 }, { id: "对照当前响应", durationMs: 1600, holdMs: 600 }] as const;
function Prediction({ current, progress }: { current?: boolean; progress: number }) {
  const values = current ? LABEL_CURRENT.map((value,k)=>LABEL_OLD[k]+(value-LABEL_OLD[k])*progress) : LABEL_OLD.map(value=>value*progress);
  return <article className="prediction-sheet">
    <p className="eyebrow">{current ? "比较时刻 · 当前判断" : "保存时刻 · 历史判断"}</p>
    <p className="prediction-answer">预测 <strong>Claude</strong><span>✓ 正确</span></p>
    <div className="response-window" style={{minHeight:100+110*progress}}><div className="response-reveal" data-response={current ? "current" : "history"} aria-hidden={progress===0} style={{visibility:progress>0 ? "visible" : "hidden"}}>
      <p className="caption">原始 logits · 共同尺度 0–3</p>
      {CLASSES.map((label, k) => <div className="prediction-coordinate" key={label} data-changed={current && k>0 && progress===1}><ModelMark model={k as ModelClass} /><ResponseMeter label={label} value={values[k]} min={0} max={3} showScale={false} /></div>)}
    </div>{progress===0 && <p className="response-covered">目前只看分类答案<span>整组响应尚未展开</span></p>}</div>
  </article>;
}

export default function ReplayEntry() {
  const reveal = useSceneTimeline(REVEAL_CLIPS);
  const [answerOnly,setAnswerOnly] = useState(true);
  const historyProgress = answerOnly ? 0 : reveal.state.clipIndex>0 ? 1 : reveal.state.progress;
  const currentProgress = answerOnly || reveal.state.clipIndex===0 ? 0 : reveal.state.progress;
  const showResponses = () => { setAnswerOnly(false); if(reveal.reducedMotion) reveal.start(1); else reveal.replay(); };
  return <div className="front-teaching" data-core-items="I01 I02">
    <section className="training-origin" aria-labelledby="training-origin-title">
      <div><p className="eyebrow">S1 · 先从熟悉的训练开始</p><h3 id="training-origin-title">数据向前走，参数也在改变。</h3>
        <p className="front-lead">分类模型根据当前数据调整参数。持续学习时，新的样本不断到来，模型继续使用<strong>同一组参数</strong>训练。</p>
        <p>可是过去的数据未必还在眼前。如果只根据新数据更新，模型对旧输入的判断可能变差，这便产生了<strong>灾难性遗忘</strong>问题。</p>
      </div>
      <figure className="parameter-stream"><p className="figure-label">数据不断到来</p><div className="stream-states">{CLASSES.map((name,k) => <div className="stream-step" key={name}><div className="stream-sample"><ModelMark model={k as ModelClass} /><span>{name}</span><span className="stream-id">x<sub>{k+1}</sub></span><span className="parameter-state">θ<sub>{k}</sub></span></div>{k < CLASSES.length-1 && <svg className="stream-arrow" viewBox="0 0 64 24" role="img" aria-label="持续更新"><path d="M3 12 H59 M51 5 L59 12 L51 19" /></svg>}</div>)}</div><figcaption>数据依次进入同一模型，参数持续更新。<br />旧输入的判断，也可能随之改变。</figcaption></figure>
    </section>
    <section className="reasoning-stair" aria-label="从完整历史到有限回放的推导">
      <article><div className="archive-object archive-all" aria-hidden="true">{Array.from({length:6},(_,i)=><i key={i} />)}<b>…</b></div><h4>全部历史都在？</h4><p>如果历史一直可用，就能把新旧数据混在一起训练。</p></article>
      <article><div className="archive-object archive-limit" aria-hidden="true"><i /><i /><b>容量 K</b></div><h4>空间有上限。</h4><p>数据流长度未知，记忆容量固定，无法无限保存。</p></article>
      <article><div className="archive-replay" aria-hidden="true"><ModelMark /><span>↗</span><span>M</span></div><h4>留下少量，再复习。</h4><p>从小记忆中读回旧样本，这就是<strong>经验回放（ER）</strong>。</p></article>
    </section>
    <section className="gcl-context"><h3>让这个办法适用于真实的数据流。</h3><p>分布可能渐变，也可能突变，未必按 Task A → Task B 整齐切换。论文用<strong>通用持续学习（GCL）</strong>概括三项要求：</p><div className="gcl-constraints"><span><b>训练</b>不依赖任务边界</span><span><b>预测</b>不需要任务编号</span><span><b>记忆</b>容量有界</span></div><p>有限回放让部分旧输入重新参与训练，无须等到一个任务结束。</p></section>
    <figure className="er-relation" aria-label="当前数据与记忆旧数据共同监督同一个当前模型">
      <div className="er-sources"><div className="er-source"><p><strong>当前数据</strong><span>新输入与真实标签</span></p><div className="er-record"><ModelMark model={2} /><span>x<sub>t</sub><small>y<sub>t</sub> = DeepSeek</small></span></div></div><div className="er-source"><p><strong>记忆记录</strong><span>少量旧输入与真实标签</span></p><div className="er-record er-memory-record"><ModelMark /><span>x′<small>y′ = Claude</small></span></div></div></div>
      <div className="er-join"><svg viewBox="0 0 160 280" role="img" aria-label="新旧样本汇合为同一个分类目标"><path d="M2 56 H52 Q72 56 72 76 V120 Q72 140 92 140 H154 M2 224 H52 Q72 224 72 204 V160 Q72 140 92 140 M145 132 L154 140 L145 148" /></svg></div><div className="er-model"><svg className="er-network" viewBox="0 0 80 64" aria-hidden="true"><path d="M10 16L40 10L70 20M10 16L40 32L70 20M10 48L40 32L70 44M10 48L40 54L70 44M10 16L40 54M10 48L40 10M40 10L70 44M40 54L70 20" />{[[10,16],[10,48],[40,10],[40,32],[40,54],[70,20],[70,44]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="5" />)}</svg><div><strong>当前模型 θ</strong><span>学习新数据，也复习旧数据</span></div></div>
      <figcaption>新旧样本共同提供标签监督，训练同一个当前模型。</figcaption>
    </figure>
    <p className="front-question">有限回放已经让旧样本可以重新参与训练。<br /><strong>但一张旧图片与一个真实标签，究竟保存了多少过去的模型知识？</strong></p>
    <section className="label-investigation" data-label-revealed={currentProgress===1} data-history-progress={historyProgress} data-current-progress={currentProgress} aria-labelledby="label-investigation-title">
      <p className="eyebrow">S2 · 从相同答案，发现不同响应</p><h3 id="label-investigation-title">两次都预测正确，判断就没有变吗？</h3>
      <div className="same-input"><SampleToken sampleId="x1" label="同一旧输入 x₁"><ModelMark /></SampleToken><p>真实标签 y₁ = Claude<br /><small>合成分类示例 · Claude / GPT / DeepSeek</small></p></div>
      <div className="reveal-controls" role="group" aria-label="观察分类答案或完整响应"><button data-label-mode="answer" aria-pressed={answerOnly} onClick={()=>{setAnswerOnly(true);reveal.reset();}}>只看分类答案</button><button data-label-mode="full" aria-pressed={!answerOnly} onClick={showResponses}>显示完整响应</button><button data-label-replay onClick={showResponses}>重播揭示</button>{!answerOnly && !reveal.reducedMotion && currentProgress<1 && <button data-label-play onClick={reveal.toggle}>{reveal.state.status==="playing" ? "暂停" : "继续"}</button>}</div>
      <div className="prediction-pair"><Prediction progress={historyProgress} /><Prediction current progress={currentProgress} /></div>
      {currentProgress<1 && <p className="reveal-observation" aria-live="polite">{answerOnly ? "答案一样，模型的完整判断也一样吗？点击“显示完整响应”继续观察。" : reveal.state.clipIndex===0 ? "先展开保存时刻的三类分数，固定这份历史参照。" : "历史响应保持不动；观察当前 GPT 与 DeepSeek 的分数交换。"}</p>}
      <div id="response-finding" className="response-finding" hidden={currentProgress<1} aria-live="polite"><div><h4>答案没变，偏好已经交换。</h4><p>真实标签指定正确类别；分类<Term id="ce">交叉熵</Term>会影响所有输出，却不要求恢复过去的整组分数。</p><p>要保留旧响应，就额外记录 <Term id="softmax" /> 概率或原始 <Term id="logits" />，作为未来匹配的软目标。这些超出单个类别答案的响应信息称为 <strong>Dark Knowledge（暗知识）</strong>。</p></div><div className="response-ranks"><div className="rank-heading"><span>类别偏好</span><span>历史名次</span><span /><span>当前名次</span></div>{CLASSES.map((name,k)=><div className="rank-row" key={name}><span><ModelMark model={k as ModelClass} />{name}</span><b>{LABEL_OLD.filter(value=>value>LABEL_OLD[k]).length+1}</b><span className="rank-direction" aria-hidden="true">{LABEL_OLD[k]===LABEL_CURRENT[k] ? "＝" : "→"}</span><b>{LABEL_CURRENT.filter(value=>value>LABEL_CURRENT[k]).length+1}</b></div>)}</div></div>
      {currentProgress===1 && <p className="caption">本节比较时刻的 a=(2,0,1) 将沿用到下一节。类别名称和像素图案仅用于合成分类教学。</p>}
    </section>

  </div>;
}
