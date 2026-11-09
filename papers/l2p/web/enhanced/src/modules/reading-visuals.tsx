import { Specimen } from "./specimen";
import { VectorGlyph } from "./vit-visuals";
import { Sub } from "./lesson-math";
import "./reading-visuals.css";

export function TaskTimeline({ phase }: { phase: number }) {
  return <figure className="task-timeline" aria-label="同一模型沿时间依次学习任务，最后统一测试">
    <svg className="timeline-spine" viewBox="0 0 1000 48" preserveAspectRatio="none" aria-hidden="true"><path d="M12 24H984m-10-7 10 7-10 7" /></svg>
    {[
      { title: "先学鸟与鱼", state: "任务 1 结束", index: 1, note: "建立已有类别的识别能力" },
      { title: "接着学猫与狗", state: "任务 2 结束", index: 2, note: "沿用参数，旧数据往往已不可完整取得" },
      { title: "统一预测", state: "测试阶段", index: 0, note: "只提供图像，在全部已学类别中判断" },
    ].map((item, i) => <div className={"timeline-stop" + (i === phase ? " is-current" : "")} key={item.title}>
      <div className="timeline-card"><b>{item.title}</b><span>{item.state}{item.index > 0 && <> · <math><Sub base="θ" index={item.index} /></math></>}</span></div>
      <span className="timeline-pin" aria-hidden="true" /><p>{item.note}</p>
    </div>)}
    <figcaption>模型沿同一条时间线继续学习。下方切换快照，可对照两个训练阶段后的预测。</figcaption>
  </figure>;
}

export function InterferenceFishbone() {
  return <figure className="interference-fishbone" aria-label="共享参数、新类训练与旧数据访问限制共同形成旧能力受干扰的风险">
    <svg viewBox="0 0 1000 280" preserveAspectRatio="none" aria-hidden="true"><path className="fish-spine" d="M18 140H790m-13-8 13 8-13 8" /><path d="M110 65L245 140M325 215L460 140M535 65L670 140" /><circle cx="245" cy="140" r="4" /><circle cx="460" cy="140" r="4" /><circle cx="670" cy="140" r="4" /></svg>
    <div className="fish-note fish-note--shared"><b>参数由新旧类别共享</b><p>旧图与新图经过同一网络</p></div>
    <div className="fish-note fish-note--new"><b>新类别推动参数更新</b><p>当前优化会改变特征与分数</p></div>
    <div className="fish-note fish-note--past"><b>旧训练图像难以完整回放</b><p>旧类别约束难以同时维持</p></div>
    <div className="fish-result"><strong>旧类别预测<br />可能受到干扰</strong><span>风险来自这些条件的共同作用</span></div>
  </figure>;
}

export function OldImageReading() {
  return <div className="old-image-reading">
    <div className="fixed-image-object"><Specimen /><div><strong>图像始终相同</strong><span>真实类别仍然是鸟</span></div></div>
    <div className="prediction-reading"><h3>变的是参数状态与输出</h3><p>在 <math><Sub base="θ" index={1} /></math> 下最高分是鸟，在 <math><Sub base="θ" index={2} /></math> 下变成猫。后续更新可能干扰模型原先的分类能力。</p><p>是否发生灾难性遗忘，还需比较旧任务整体测试表现。这张图帮助我们看清干扰如何发生。</p></div>
  </div>;
}

export function BackboneHandoff() {
  return <div className="backbone-handoff">
    <div className="backbone-object"><Specimen /><span className="backbone-object__model">预训练 ViT<small>保留视觉主干权重</small></span><VectorGlyph /></div>
    <div><h3>先看看，已有的视觉能力藏在哪里</h3><p>这条思路依赖预训练模型已经形成的特征。下一页沿同一张鸟类图像进入 ViT，看看它怎样从像素得到分类所需的表示。</p></div>
  </div>;
}
