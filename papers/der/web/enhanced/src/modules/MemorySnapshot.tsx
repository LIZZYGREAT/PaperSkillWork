import SampleLifecyclePrototype from "./review/SampleLifecyclePrototype";
import { ReferenceButton } from "./Reference";
import ModelMark from "./review/ModelMark";
import { FrozenResponse, TeachingNetwork } from "./TeachingObjects";
import { SnapshotOrigin, TwoRoundPreview } from "./MemoryPrelude";
import "./teaching-front.css";

export default function MemorySnapshot() {
  return <div className="snapshot-lesson" data-core-items="I05">
    <section className="supervision-bridge" aria-labelledby="supervision-title"><p className="eyebrow">机制桥接 · 过去的监督从哪里来？</p><h3 id="supervision-title">借用旧输出，不必一直保存旧模型。</h3>
      <p>ER 已经提供了一个有效起点：回放 (x,y)，用真实标签做分类监督。若要维持更完整的历史响应，可以借鉴<strong>教师—学生蒸馏</strong>，让当前学生匹配旧模型给出的输出。</p>
      <div className="teacher-relation" aria-label="教师输出作为学生匹配目标"><div className="teacher-end"><TeachingNetwork fixed /><div><strong>旧教师 · 固定</strong><span>提供参考输出</span></div></div><div className="teacher-target"><span className="target-bars" aria-hidden="true"><i /><i /><i /></span><span>软目标 →</span></div><div className="teacher-end"><TeachingNetwork /><div><strong>当前学生 · 可训练</strong><span>匹配参考输出</span></div></div></div>
      <p>有些持续学习方法在任务末尾保存旧教师。但<strong>知识蒸馏本身不必然依赖任务边界</strong>；关键在于监督如何取得。DER 直接留下有限输入及其当时的 logits，未来让当前网络重新处理这些输入，无需持有完整的历史教师。</p>
      <dl className="record-comparison"><div><dt>ER · 保存 (x,y)</dt><dd><div className="label-record"><ModelMark /><span>y = Claude</span><b>真实标签</b></div><span>旧输入与真实标签，回答“应该属于哪一类”。</span></dd></div><div><dt>DER · 保存 (x,z)</dt><dd><FrozenResponse symbol="z" /><span>旧输入与整组历史 logits，记录“曾经怎样响应”。</span></dd></div></dl>
      <h4>从哪个参数时刻复制这组数值？</h4><p>每一步先用<strong>更新前</strong>的参数前向，再把输出复制为冻结 z。参数继续学习，这个副本保持原值；完成更新后，再把原图与副本作为候选交给记忆池。<strong>候选产生不等于一定留池。</strong></p>
      <SnapshotOrigin />
      <p className="caption">历史记录来自学习轨迹的不同瞬间；保存的是数值副本，不是每个历史时刻的网络。依据原文 §3 Eq.(2)–(5)、Algorithm 1。</p>
    </section>
    <section className="lifecycle-prelesson" aria-labelledby="two-rounds-title"><p className="eyebrow">播放之前 · 先理清两轮完整顺序</p><h3 id="two-rounds-title">先冻结，再更新，再入池。</h3><p>第一轮记忆为空，只有当前分类损失；第二轮才有旧记录可回放。当前样本与回放都用更新前同一组 θ 计算：先复制冻结候选，再合并损失、更新一次，最后才决定入池。</p>
      <TwoRoundPreview />
        <details className="teaching-note"><summary>教学数值与比较时刻</summary><p>D1 是给定数值的合成演示：未来回放取 aⱼ=(1,2,0)，与 z₁ 匹配的平方损失为 2；它区别于 S2/S3 比较时刻的 a=(2,0,1)。x₂ 的快照 z₂ 用符号表示，动画不执行真实训练求值。</p></details>
      <p className="front-question">观看完整动画时，沿同一份记录追踪三个动作：复制并冻结 z₁ → 参数改变而 z₁ 不变 → 新旧样本汇成一次联合更新。</p>
    </section>
    <SampleLifecyclePrototype />
    <div className="snapshot-reference"><ReferenceButton term="z">核对冻结时序与出处</ReferenceButton></div>
  </div>;
}
