import { ArchitectureExplorer } from "../../shared/core/architecture";
import { ResponsibilityMap } from "../../shared/core/responsibility-map";
import { TermRef } from "../../shared/core/reference";
import { architectureSpec } from "../data/architecture";
import { responsibilities } from "../data/responsibilities";
import { termsById } from "../data/references";

export function Section01Architecture({ onOpenReference }: { onOpenReference: (termId: string) => void }) {
  return (
    <section className="v3-stage v3-architecture-stage" id="slice-01" aria-labelledby="v3-architecture-title">
      <header className="v3-stage-heading">
        <span className="v3-stage-number">01</span>
        <div><p className="v3-eyebrow">ARCHITECTURE</p><h2 id="v3-architecture-title">先分清模型归属与参数状态</h2><p><TermRef term={termsById.teacher} onOpenReference={onOpenReference} /> 固定不动；<TermRef term={termsById.student} onOpenReference={onOpenReference} /> 是扩展后要训练的模型。</p></div>
      </header>

      <div className="v3-architecture-visual">
        <ArchitectureExplorer spec={architectureSpec} showStatus />
      </div>
      <p className="v3-architecture-caption">Teacher 与 Student 是两套参数独立的模型。Student 的共享层连接旧、新两个任务 head。</p>

      <div className="v3-supporting-map">
        <div className="v3-subheading"><div><p className="v3-eyebrow">RESPONSIBILITIES</p><h3>每个对象负责哪一段计算？</h3></div><span>选择一项查看责任</span></div>
        <ResponsibilityMap spec={responsibilities} />
      </div>
      <a className="v3-next-link" href="#slice-02">带着这套结构看旧响应从哪里来 <span aria-hidden="true">↓</span></a>
    </section>
  );
}
