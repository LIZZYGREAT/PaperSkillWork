import { ChapterNavigation } from "../components/ChapterNavigation";
import { LwfFullReplay } from "../components/LwfFullReplay";
import type { LwfChapterId } from "../data/chapters";

export function Section07Replay({ onOpenReference, onNavigateChapter }: {
  onOpenReference: (termId: string) => void;
  onNavigateChapter: (chapterId: LwfChapterId) => void;
}) {
  return <section className="v3-narrative-chapter v3-replay-chapter" id="chapter-07" aria-labelledby="v3-replay-title">
    <header className="v3-chapter-heading">
      <span className="v3-stage-number">07</span>
      <div><p className="v3-eyebrow">CHAPTER 07 / 08 · END-TO-END REPLAY</p><h2 id="v3-replay-title">从旧模型开始，把 LwF 完整跑一遍</h2><p>手动逐步回放：看旧模型如何提供响应目标、Student 如何学习新任务，以及更新后的模型怎样交给下一阶段。</p></div>
    </header>

    <section className="v3-replay-block" aria-labelledby="v3-replay-block-title">
      <div className="v3-replay-block-heading"><span>07A · GRAND LOOP</span><h3 id="v3-replay-block-title">一张系统图，跨过一次训练并回到下一任务</h3><p>默认手动控制。播放只辅助浏览；联合优化中的 minibatch 细节仍由 Chapter 03 解释。</p></div>
      <LwfFullReplay onOpenReference={onOpenReference} />
    </section>

    <section className="v3-replay-takeaways" aria-labelledby="v3-replay-takeaways-title">
      <div className="v3-replay-block-heading"><span>FINAL MENTAL MODEL</span><h3 id="v3-replay-takeaways-title">离开前记住这六件事</h3></div>
      <ol>
        <li>旧训练数据不可用，但旧模型仍可用。</li>
        <li>Teacher 在当前新任务输入 Xₙ 上生成旧任务响应 Yₒ。</li>
        <li>Student 保留共享主体和旧 head，并增加新 head θₙ。</li>
        <li>L_old 保持旧响应；L_new 学习当前任务标签。</li>
        <li>联合优化时，共享参数 θₛ 同时受旧响应与新任务目标影响。</li>
        <li>当前 Student 完成后成为下一阶段 Teacher；下一任务会刷新响应目标。</li>
      </ol>
    </section>

    <ChapterNavigation chapterId="07" onNavigate={onNavigateChapter} />
  </section>;
}
