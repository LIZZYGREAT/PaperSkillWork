import { useState } from "react";
import { TermRef } from "../../shared/core/reference";
import { termsById } from "../data/references";

type ArchitectureNode = "teacher" | "student" | "theta-s" | "theta-o" | "theta-n" | "xn" | "yo" | "yhat-o" | "yhat-n";

const descriptions: Record<ArchitectureNode, { title: string; body: string; term?: string; source: string }> = {
  teacher: { title: "Teacher · 固定旧模型", body: "旧任务完成后的模型副本。它在这一轮保持冻结，只负责对当前 Xₙ 生成旧任务目标。", term: "teacher", source: "模型来源 · A01 / C02" },
  student: { title: "Student · 扩展后的当前模型", body: "独立于 Teacher 的可训练模型，保留共享主体和旧任务输出，并新增当前任务 head。", term: "student", source: "模型扩展 · A01 / A02" },
  "theta-s": { title: "θₛ · 共享参数", body: "共享特征主体。Teacher 持有冻结副本；Student 中的 θₛ 在 warm-up 后接收旧、新目标的梯度。", term: "theta-s", source: "共享参数 · A01 / A05" },
  "theta-o": { title: "θₒ · 旧任务 head", body: "Teacher 中的对应参数保持冻结；Student 的 θₒ 在联合优化阶段可训练，产生 Ŷₒ。", term: "theta-o", source: "旧任务输出参数 · A02 / A05" },
  "theta-n": { title: "θₙ · 新任务 head", body: "从 Student 的共享表示分出，为当前任务新初始化；warm-up 阶段先单独训练。", term: "theta-n", source: "新任务输出参数 · A03 / A05" },
  xn: { title: "Xₙ · 当前任务输入", body: "同一批当前任务样本分别送入 Teacher 与 Student；它不是旧任务训练数据。", term: "xn", source: "当前任务输入 · C01 / A04" },
  yo: { title: "Yₒ · Teacher 的旧任务响应", body: "Teacher 对当前 Xₙ 的旧任务输出，作为保持旧行为的目标；它不是旧任务真值或回放样本。", term: "yo", source: "记录的旧响应 · C02 / A04" },
  "yhat-o": { title: "Ŷₒ · Student 的旧任务输出", body: "Student 的旧任务 head 对 Xₙ 的预测，与 Teacher 的 Yₒ 一起形成 L_old。", term: "yhat-o", source: "旧任务预测端 · A04 / F03" },
  "yhat-n": { title: "Ŷₙ · Student 的新任务输出", body: "Student 新任务 head 的预测，由当前新任务标签 Yₙ 监督。", term: "yhat-n", source: "新任务预测端 · F01" },
};

function Node({ id, label, sublabel, status, selected, onSelect }: {
  id: ArchitectureNode;
  label: string;
  sublabel: string;
  status?: string;
  selected: boolean;
  onSelect: (id: ArchitectureNode) => void;
}) {
  return <button type="button" className={`v3-architecture-node ${selected ? "is-selected" : ""}`} aria-pressed={selected} onClick={() => onSelect(id)}>
    <strong>{label}</strong><span>{sublabel}</span>{status ? <small>{status}</small> : null}
  </button>;
}

export function LwfArchitectureView({ onOpenReference }: { onOpenReference: (termId: string) => void }) {
  const [selected, setSelected] = useState<ArchitectureNode>("theta-s");
  const info = descriptions[selected];

  return <div className="v3-architecture-composition">
    <article className="v3-model-zone v3-teacher-zone" aria-label="Teacher 固定旧模型">
      <header><div><p className="v3-eyebrow">OLD MODEL / TEACHER</p><h3>旧模型快照</h3></div><span className="v3-model-badge">FROZEN · 固定</span></header>
      <div className="v3-teacher-path">
        <Node id="xn" label="Xₙ" sublabel="当前输入" selected={selected === "xn"} onSelect={setSelected} />
        <span className="v3-architecture-arrow" aria-hidden="true">→</span>
        <Node id="theta-s" label="θₛ" sublabel="conv1–5 · fc6–7" status="共享主体" selected={selected === "theta-s"} onSelect={setSelected} />
        <span className="v3-architecture-arrow" aria-hidden="true">→</span>
        <Node id="theta-o" label="θₒ" sublabel="fc8_old" status="旧任务 head" selected={selected === "theta-o"} onSelect={setSelected} />
        <span className="v3-architecture-arrow" aria-hidden="true">→</span>
        <Node id="yo" label="Yₒ" sublabel="旧任务响应" selected={selected === "yo"} onSelect={setSelected} />
      </div>
    </article>

    <article className="v3-model-zone v3-student-zone" aria-label="Student 扩展模型">
      <header><div><p className="v3-eyebrow">STUDENT / CURRENT MODEL</p><h3>独立的扩展模型</h3></div><span className="v3-model-badge is-trainable">TRAINABLE · 可训练</span></header>
      <div className="v3-student-path">
        <Node id="xn" label="Xₙ" sublabel="同一批输入" selected={selected === "xn"} onSelect={setSelected} />
        <span className="v3-architecture-arrow" aria-hidden="true">→</span>
        <Node id="theta-s" label="θₛ" sublabel="conv1–5 · fc6–7" status="共享主体" selected={selected === "theta-s"} onSelect={setSelected} />
        <span className="v3-branch-mark" aria-hidden="true">↗<br />↘</span>
        <div className="v3-head-branches">
          <div className="v3-head-branch"><Node id="theta-o" label="θₒ" sublabel="fc8_old" status="旧 head" selected={selected === "theta-o"} onSelect={setSelected} /><span className="v3-architecture-arrow" aria-hidden="true">→</span><Node id="yhat-o" label="Ŷₒ" sublabel="旧任务预测" selected={selected === "yhat-o"} onSelect={setSelected} /></div>
          <div className="v3-head-branch is-new"><Node id="theta-n" label="θₙ" sublabel="新增 fc8_new" status="新 head" selected={selected === "theta-n"} onSelect={setSelected} /><span className="v3-architecture-arrow" aria-hidden="true">→</span><Node id="yhat-n" label="Ŷₙ" sublabel="新任务预测" selected={selected === "yhat-n"} onSelect={setSelected} /></div>
        </div>
      </div>
      <p className="v3-architecture-layer-note"><span>层级关系</span> 共享主体 conv1–5 → fc6 → fc7；fc8_old 保留旧输出，新增 fc8_new 从共享表示分出。</p>
    </article>

    <aside className="v3-architecture-inspector" aria-live="polite" aria-label="模型节点说明">
      <div><p className="v3-eyebrow">SELECTED COMPONENT</p><h3>{info.title}</h3><p>{info.body}</p></div>
      <div className="v3-inspector-reference"><span>{info.source}</span><TermRef term={termsById[info.term ?? "theta-s"]} onOpenReference={onOpenReference} /></div>
    </aside>
  </div>;
}
