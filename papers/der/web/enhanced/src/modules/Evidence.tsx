import {useState} from "react";
import {EXPERIMENTS,COUNTEREXAMPLES} from "./evidence-data";
import {ReferenceButton} from "./Reference";
import "./evidence.css";
export default function Evidence(){
const [selected,setSelected]=useState(0),experiment=EXPERIMENTS[selected];
return <section className="evidence-section" data-scene="evidence" data-experiment={experiment.id}>
<div className="evidence-lead"><p className="lead">机制解释了为什么这样设计。实验才能回答：在什么条件下，它实际更好？</p><p>下面是论文 arXiv v2 的原表数值重绘，单位为准确率百分比。与前面的合成动画完全分开；保留 ± 原样，不擅自把它解释为标准差或标准误，也不据均值差异推断显著性。</p></div>
<div className="evidence-tabs" role="tablist" aria-label="实验证据设置">{EXPERIMENTS.map((e,i)=><button key={e.id} role="tab" id={e.id+"-tab"} aria-controls="experiment-panel" aria-selected={selected===i} data-experiment-select={i} onClick={()=>setSelected(i)}>{e.title}<small>{i===0?"Class-IL · K=500":i===1?"Task-IL · K=500":i===2?"K=500":"K=200 反例"}</small></button>)}</div>
<figure className="evidence-figure" role="tabpanel" id="experiment-panel" aria-labelledby={experiment.id+"-tab"}><header><div><p className="eyebrow">{experiment.locator} / {experiment.evidence}</p><h3>{experiment.title} · K={experiment.capacity}</h3><p>{experiment.protocol}</p></div><span className="paper-result-label">论文实验结果</span></header>
<p className="experiment-conditions">{experiment.setup}</p><p className="evidence-metric">{experiment.metric}</p>
<div className="evidence-plot" aria-label={experiment.metric}>{experiment.values.map((v,i)=><div className="evidence-row" key={v.method} data-method={v.method} data-mean={v.mean} data-spread={v.spread}><strong>{v.method}</strong><div className="evidence-track"><div className={`evidence-bar method-${i}`} style={{width:v.mean+"%"}}/><span className="evidence-error" aria-hidden="true" style={{left:(v.mean-v.spread)+"%",width:v.spread*2+"%"}}/><span className="evidence-mean" aria-hidden="true" style={{left:v.mean+"%"}}/></div><output>{v.mean.toFixed(2)}<small>±{v.spread.toFixed(2)}</small></output></div>)}<div className="evidence-axis"><span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span></div></div>
<figcaption>{experiment.conclusion}</figcaption></figure>
<section className="counterexamples"><p className="eyebrow">同样可见的反例 / R05</p><h3>多一项监督，没有通用的胜率保证。</h3><div>{COUNTEREXAMPLES.map(e=><article key={e.setting}><h4>{e.setting}</h4><p>{e.text}</p><small>{e.source} · 最终指标</small></article>)}</div></section>
<section className="evidence-limits"><h3>回到机制，理解它的边界。</h3><div><article><span>01</span><h4>有限记忆只能覆盖一部分过去</h4><p>K 固定而流继续增长，每项的边际留存概率下降；小缓存可能遗漏类别，Reservoir 也不按类平衡。</p></article><article><span>02</span><h4>冻结目标不是正确答案</h4><p>z 保留当时模型的行为，包括偏差。DER++ 补入真实标签，但两个历史目标仍可能竞争。</p></article><article><span>03</span><h4>匹配是软约束</h4><p>α、β、增强、网络、容量与训练协议共同影响结果，无法保证任一旧任务损失永不增加。</p></article><article><span>04</span><h4>相同条目数不等于相同内存</h4><p>DER 存 z，DER++ 再存 y。方法的网络、教师与记忆字节开销也不同，不能只凭 K 宣称相同总成本。</p></article></div></section>
<p className="evidence-analysis">作者还分析了局部平坦性和校准：它们是在特定数据集、容量与模型上的经验观察，不是普遍保证。<ReferenceButton term="evidence-analysis">深入分析与证据边界</ReferenceButton></p>
<div className="evidence-close"><p className="eyebrow">回看整条主线</p><p>过去的图不再完整可见，有限记忆留下原图与历史响应。当前标签推动学习，冻结目标约束旧行为；在线选留让这份记忆持续运转。它是一条简单、可执行且有条件实验证据支持的基线。</p><ReferenceButton term="evidence-results">查看补充结果与完整实验来源</ReferenceButton><a href="#U6-complete-system">回到四轮工作台 ↑</a></div>
</section>;
}
