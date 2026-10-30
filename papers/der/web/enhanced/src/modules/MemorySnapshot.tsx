import SampleLifecyclePrototype from "./review/SampleLifecyclePrototype";
import { ReferenceButton } from "./Reference";
import "./teaching-front.css";

export default function MemorySnapshot() {
  return <div className="snapshot-lesson" data-core-items="I05">
    <section className="supervision-bridge" aria-labelledby="supervision-title"><p className="eyebrow">机制桥接 · 过去的监督从哪里来？</p><h3 id="supervision-title">借用旧输出，不必一直保存旧模型。</h3>
      <p>ER 已经提供了一个有效起点：回放 (x,y)，用真实标签做分类监督。若要维持更完整的历史响应，可以借鉴<strong>教师—学生蒸馏</strong>，让当前学生匹配旧模型给出的输出。</p>
      <div className="teacher-relation" aria-label="教师输出作为学生匹配目标"><span>旧教师的输出</span><i>→ 作为软监督 →</i><span>当前学生匹配</span></div>
      <p>有些持续学习方法在任务末尾保存旧教师。但<strong>知识蒸馏本身不必然依赖任务边界</strong>；关键在于监督如何取得。DER 直接留下有限输入及其当时的 logits，未来让当前网络重新处理这些输入，无需持有完整的历史教师。</p>
      <dl className="record-comparison"><div><dt>ER · 保存 (x,y)</dt><dd>旧输入与真实标签<br />回答“应该属于哪一类”</dd></div><div><dt>DER · 保存 (x,z)</dt><dd>旧输入与当时的整组 logits<br />记录“曾经怎样响应”</dd></div></dl>
      <h4>从哪个参数时刻复制这组数值？</h4><p>每一步先用<strong>更新前</strong>的参数前向，再把输出复制为冻结 z。参数继续学习，这个副本保持原值；完成更新后，再把原图与副本作为候选交给记忆池。<strong>候选产生不等于一定留池。</strong></p>
      <ol className="snapshot-time-axis" aria-label="更新前取值与更新后选留"><li><strong>θ₀</strong><span>x₁ 前向 → 复制冻结 z₁</span></li><li><strong>θ₁</strong><span>更新后处理 (x₁,z₁) 候选<br />x₂ 前向 → 复制冻结 z₂</span></li><li><strong>θ₂</strong><span>更新后处理 (x₂,z₂) 候选<br />已冻结的 z₁、z₂ 不跟着更新</span></li></ol>
      <p className="caption">历史记录来自学习轨迹的不同瞬间；保存的是数值副本，不是每个历史时刻的网络。依据原文 §3 Eq.(2)–(5)、Algorithm 1。</p>
    </section>
    <section className="lifecycle-prelesson" aria-labelledby="two-rounds-title"><p className="eyebrow">播放之前 · 先理清两轮完整顺序</p><h3 id="two-rounds-title">先冻结，再更新，再入池。</h3><p>记录内容和产生时机已经明确。现在把它们放回训练：当前分类与历史匹配怎样合并？哪一轮才有旧记录可用？</p>
      <article className="first-round"><div><p className="round-number">第一轮 · x₁ 到来</p><h4>空记忆中，历史记录如何诞生？</h4><p>从当前模型 θ₀ 和空记忆 M=[] 开始。带标签的 x₁ 到来后，先产生增强视图，用尚未更新的模型计算整组 logits，并复制为冻结 z₁=(2,1,0)。y₁ 用于当前分类监督；基本 DER 未来保存的是 (x₁,z₁)。</p><p>此时还没有历史记录可回放，只有当前分类损失。它更新 θ₀→θ₁。<strong>最后</strong>才将原图与冻结响应交给记忆池；本例有空槽，所以成功写入。</p></div>
        <div className="round-state"><p className="state-edge">起点　θ₀ · M=[] · N=0</p><ol><li>x₁,y₁ → 增强 → 更新前前向</li><li>复制 z₁=(2,1,0)，冻结</li><li>当前分类损失 → 更新 θ₀→θ₁</li><li>更新后，候选 (x₁,z₁) 写入空槽</li></ol><p className="state-edge">终点　θ₁ · M=[(x₁,z₁)] · N=1<br /><strong>z₁ 仍为 (2,1,0)</strong></p></div>
      </article>
      <article className="second-round"><p className="round-number">第二轮 · x₂ 到来</p><h4>旧记录现在才成为历史监督。</h4><p>当前 x₂ 用真实标签形成分类损失。与此同时，记忆中已有 (x₁,z₁)：把旧输入重新送入<strong>同一个当前网络 θ₁</strong>，得到现在的输出 aⱼ，再与固定 z₁ 逐类平方匹配。两项合成后，只对当前模型做<strong>一次联合参数更新</strong>。</p>
        <div className="joint-round" aria-label="第二轮同一参数上的两项损失合并"><p className="state-edge">起点　θ₁ · M=[(x₁,z₁)] · N=1</p><div className="joint-branches"><p><strong>当前 x₂ + y₂</strong><span>当前分类 → L_current</span></p><p><strong>记忆 x₁ + 固定 z₁</strong><span>同一 θ₁ 前向 → aⱼ → L_dark</span></p></div><p className="joint-target">L_DER = L_current + αL_dark<br /><strong>一次联合更新 θ₁ → θ₂</strong></p><p>更新后处理 x₂ 的冻结候选 (x₂,z₂)</p><p className="state-edge">终点　θ₂ · 两条记忆 · N=2 · z₁ 未改变</p></div>
        <p>本步 x₂ 的<strong>更新前输出</strong>也复制为新候选 z₂，完成更新后才尝试入池。本例第二个槽位仍空，因而写入成功。已经保存的 z₁ 始终不会刷新。</p>
        <p className="caption">D1 是给定数值的合成演示：未来回放取 aⱼ=(1,2,0)，与 z₁ 匹配的平方损失为 2；它区别于 S2/S3 比较时刻的 a=(2,0,1)。x₂ 的快照 z₂ 用符号表示，动画不执行真实训练求值。</p>
      </article>
      <p className="front-question">现在执行顺序已经明确。下面请集中观察：同一份 x₁ 如何生成并冻结 z₁；参数更新后 z₁ 为何保持不变；以及未来 x₂ 到来时，它怎样参与一次联合训练。</p>
    </section>
    <SampleLifecyclePrototype />
    <div className="front-handoff"><p>一条历史记录已经走完了生成、冻结、更新后写入和未来匹配。但是数据流不会停止：每次训练都可能产生新的候选，而记忆只有有限的槽位。<br /><strong>哪些记录能留下，哪些需要被替换？</strong></p><ReferenceButton term="z">核对冻结时序与出处</ReferenceButton><br /><a href="#U4-reservoir-and-step">观察有限记忆如何选留 ↓</a></div>
  </div>;
}
