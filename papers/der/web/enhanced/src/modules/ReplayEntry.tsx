import { SampleToken } from "../shared/foundation/visual-parts/SampleToken";
import { CLASSES, LABEL_CURRENT, LABEL_OLD } from "./math-model";
import { Term } from "./Reference";

export function CatMark() {
  return <svg className="cat-mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M13 27 14 10 27 20 Q32 18 37 20 L50 10 51 27 Q58 53 32 56 Q6 53 13 27Z" fill="currentColor" opacity=".12" stroke="currentColor" strokeWidth="2" /><path d="M22 34h3m14 0h3M30 41l2 2 2-2m-2 2v4m-5 0q5 5 10 0M12 40l12 2m-13 5 13-1m16-4 12-2m-12 6 13 1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

function Ranking({ values, current }: { values: readonly number[]; current?: boolean }) {
  return <div className={`ranking ${current ? "is-current" : ""}`}><p className="figure-label">{current ? "后来的一种判断" : "曾经的一种判断"}</p><div className="ranking-rows">{CLASSES.map((label, index) => <div className="ranking-row" key={label}><span>{label}</span><div className="ranking-track"><span style={{ width: `${values[index] / 2 * 100}%` }} /></div><span className="ranking-result">{index === 0 ? "最高" : values[index] > 0 ? "其次" : "更低"}</span></div>)}</div><p className="same-answer">预测：<strong>猫</strong> <span>✓</span></p></div>;
}

export default function ReplayEntry() {
  return <div className="replay-entry" data-core-items="I01 I02">
    <div className="opening-grid"><div className="opening-copy"><p className="lead">新图片不断到来，网络持续更新。<br />但过去的完整数据，未必还能取回。</p><p>只学眼前的数据，可能把旧判断改坏，这就是灾难性遗忘。保存全部历史再重训又太昂贵——先留下少量旧图片和标签，学新数据时抽回来复习，是一个自然的起点。</p><p>这叫<strong>经验回放（ER）</strong>。它不需要恢复旧网络：新旧图片都训练同一个当前模型。</p><div className="constraints"><span>不等任务结束</span><span>预测不需任务编号</span><span>记忆容量有界</span></div><p className="caption">论文以这三项 GCL 约束为设计目标。相邻数据的类别与外观可能相关，最新批次未必代表全部历史。</p></div>
      <figure className="memory-illustration" aria-label="输入不断到来，只能留下少量原图和真实标签用于未来回放"><div className="stream-heading"><span className="figure-label">持续到来的输入</span><span className="stream-time">时间向前 <span aria-hidden="true">→</span></span></div><div className="input-stream"><div className="faded-record">x₁<small>已过去</small></div><SampleToken sampleId="x2" label="x₂ · 同一原图"><CatMark /></SampleToken><div className="next-record">x₃<small>新数据</small></div><span className="stream-dots" aria-hidden="true">···</span></div><div className="retain-link"><span aria-hidden="true">↓</span><span>保留少量历史记录，未来再看</span></div><div className="limited-memory"><div><span className="figure-label">有限回放记忆 M</span><span className="capacity-label">容量固定</span></div><div className="memory-slots"><span><b>x₂</b><i>原图</i><span className="label-tag">y = 猫</span></span><span className="slot-empty">其他历史记录</span></div></div><figcaption>留下的是图片与标签；完整历史不会一直可用。</figcaption></figure>
    </div>
    <section className="label-question" aria-labelledby="label-question-title"><div className="section-prompt"><p className="eyebrow">但这份记录还少了什么？</p><h3 id="label-question-title">同样判对，整组判断也可以不同。</h3><p>标签 <strong>y = 猫</strong> 告诉网络正确类别，却没有记下旧模型如何评价狗与狐狸。两边猫都最高，另外两类的相对偏好却交换了。</p></div><div className="rankings"><Ranking values={LABEL_OLD} /><div className="same-label-divider"><span>同一 x₂</span><span className="label-tag">同一 y = 猫</span></div><Ranking values={LABEL_CURRENT} current /></div><p className="caption">合成教学对照；条形表示类别分数的相对大小。分类<Term id="ce">交叉熵</Term>会影响所有类别，但硬标签不要求恢复旧模型的具体整组响应。</p></section>
    <div className="bridge"><span className="bridge-number">下一步 02</span><p>除了复习正确类别，还可以保留旧输出作为软目标。<br /><strong>怎样把“判断变了多少”变成可优化的量？</strong> 先从 <Term id="softmax" /> 得到的类别概率出发。</p><a href="#U2-probability" aria-label="继续阅读概率约束">继续 <span aria-hidden="true">↓</span></a></div>
  </div>;
}
