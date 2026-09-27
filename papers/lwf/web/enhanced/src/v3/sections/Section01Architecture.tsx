import { TermRef } from "../../shared/core/reference";
import { LwfArchitectureView } from "../components/LwfArchitectureView";
import { termsById } from "../data/references";

export function Section01Architecture({ onOpenReference, onSelectStage }: { onOpenReference: (termId: string) => void; onSelectStage: (id: string) => void }) {
  return <section className="v3-stage v3-architecture-stage" id="slice-01" aria-labelledby="v3-architecture-title">
    <header className="v3-stage-heading">
      <span className="v3-stage-number">01</span>
      <div><p className="v3-eyebrow">MODEL STRUCTURE</p><h2 id="v3-architecture-title">Teacher 固定，Student 扩展</h2><p><TermRef term={termsById.teacher} onOpenReference={onOpenReference} /> 提供旧行为目标；Student 用共享主体连接旧任务与新任务输出。</p></div>
    </header>
    <LwfArchitectureView onOpenReference={onOpenReference} />
    <button className="v3-next-link" type="button" onClick={() => onSelectStage("slice-02")}>继续看旧响应如何生成 <span aria-hidden="true">↓</span></button>
  </section>;
}
