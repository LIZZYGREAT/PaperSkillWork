import type { KnowledgeEntry } from "../../core/reference";

export const lwfKnowledge: KnowledgeEntry[] = [
  {
    id: "teacher",
    kind: "term",
    hover: {
      title: "Teacher（教师模型）",
      definitionZh: "一个在当前任务训练期间保持固定的旧模型。它读取当前输入，并提供旧类别上的响应，作为学生模型保留既有行为的参照。",
      paperRoleZh: "为旧响应损失提供目标，但不参与当前轮参数更新。",
      confusionZh: "这里的 teacher 不是与学生同时训练的第二个模型。",
    },
    reference: {
      titleEn: "Fixed previous-task teacher",
      summaryEn: "A frozen copy of the earlier model that supplies response targets for old classes.",
      bodyEn: <><p>The teacher evaluates the same current-task input as the student. Its output over previously learned classes becomes a functional target, so preservation is expressed in output space rather than as a blanket parameter freeze.</p><p>The teacher remains fixed inside the current task. At a later task boundary, the updated student may be copied forward to become the next teacher.</p></>,
      relatedIds: ["distillation", "task-heads"],
      relatedSection: "lwf-teacher",
      sourceRefs: ["Learning without Forgetting, mechanism section"],
      tags: ["old model", "response target", "frozen"],
    },
  },
  {
    id: "distillation",
    kind: "method",
    hover: {
      title: "Distillation（蒸馏约束）",
      definitionZh: "通过比较学生输出与教师输出，让学生在学习新任务时尽量保持旧任务上的响应。它约束的是函数行为，而不是要求所有旧参数完全不变。",
      paperRoleZh: "构成 L_old，并与当前任务损失共同产生更新信号。",
      confusionZh: "不要把输出蒸馏等同于冻结骨干网络。",
    },
    reference: {
      titleEn: "Output-based distillation objective",
      summaryEn: "A preservation objective that compares student responses with targets from a fixed teacher.",
      bodyEn: <><p>A typical objective compares softened teacher and student distributions for old classes. The exact temperature, normalization, and weighting belong to the paper-specific implementation.</p><div className="rk-reference-hub__math" aria-label="Distillation loss formula">L<sub>old</sub> = − Σ<sub>i</sub> q<sub>i</sub><sup>teacher</sup> log q<sub>i</sub><sup>student</sup></div></>,
      relatedIds: ["teacher"],
      relatedSection: "lwf-loss",
      sourceRefs: ["Learning without Forgetting, objective definition"],
      tags: ["loss", "function preservation", "old classes"],
    },
  },
  {
    id: "task-heads",
    kind: "advanced",
    hover: {
      title: "Task-specific heads（任务输出头）",
      definitionZh: "连接共享表示与各任务标签空间的输出分支；不同分支负责不同类别集合。",
      paperRoleZh: "把旧类别响应与新类别监督分到可辨认的输出路径中。",
    },
    reference: {
      titleEn: "Task-specific output heads",
      summaryEn: "Output branches that map a shared representation into distinct task label spaces.",
      bodyEn: <p>The shared backbone can feed more than one output branch. A head identifies a label space and does not, by itself, define how the shared representation is preserved.</p>,
      relatedIds: ["teacher"],
      relatedSection: "lwf-forward",
      sourceRefs: ["Learning without Forgetting, network adaptation description"],
      tags: ["architecture", "label space"],
    },
  },
];

export const ewcKnowledge: KnowledgeEntry[] = [
  {
    id: "fisher",
    kind: "term",
    hover: {
      title: "Fisher importance（参数重要性）",
      definitionZh: "对每个参数给出相对重要程度的估计：如果某个参数对旧任务模型的预测分布更敏感，它在后续任务中偏离原值时会受到更大的惩罚。这里展示的是机制层面的解释，具体估计方式与条件仍需回到论文定义。",
      paperRoleZh: "作为二次惩罚中每个参数位移项的权重。",
      confusionZh: "它不是禁止参数更新的硬掩码，也不等同于所有场景下的因果重要性。",
    },
    reference: {
      titleEn: "Diagonal Fisher importance estimate",
      summaryEn: "A parameter-wise weight used to scale the EWC regularization penalty.",
      bodyEn: <><p>The diagonal approximation keeps one importance value per parameter. A larger value makes displacement from the stored earlier-task solution more expensive during later training.</p><div className="rk-reference-hub__math" aria-label="Diagonal Fisher estimate formula">F<sub>i</sub> ≈ E<sub>(x,y)</sub> [(∂ log p(y|x, θ*) / ∂θ<sub>i</sub>)²]</div><p>This quantity should be interpreted under the estimator and model assumptions used by the source, rather than as a universal measure of parameter value.</p></>,
      relatedIds: ["earlier-optimum", "ewc-penalty"],
      relatedSection: "ewc-importance",
      sourceRefs: ["Elastic Weight Consolidation, Fisher approximation"],
      tags: ["importance", "regularizer", "diagonal approximation"],
    },
  },
  {
    id: "earlier-optimum",
    kind: "symbol",
    hover: {
      title: "θ*（旧任务参考参数）",
      definitionZh: "完成旧任务训练后保存的一组参数值，用作后续正则项衡量参数偏移的参照点。",
      paperRoleZh: "与当前参数 θ 做差，形成逐参数位移。",
      confusionZh: "它不是学习新任务后的当前参数。",
    },
    reference: {
      titleEn: "Stored earlier-task optimum θ*",
      summaryEn: "The saved parameter vector that anchors the quadratic regularizer.",
      bodyEn: <><p>The reference vector records the earlier-task solution at consolidation time. The penalty measures later movement relative to this point, weighted by the corresponding importance values.</p><div className="rk-reference-hub__math" aria-label="Parameter vector matrix example">θ* = [ θ*<sub>1</sub> &nbsp; θ*<sub>2</sub> &nbsp; … &nbsp; θ*<sub>n</sub> ]<sup>T</sup></div></>,
      relatedIds: ["fisher", "ewc-penalty"],
      relatedSection: "ewc-stored",
      sourceRefs: ["Elastic Weight Consolidation, stored task state"],
      tags: ["parameters", "reference point", "stored state"],
    },
  },
  {
    id: "ewc-penalty",
    kind: "formula",
    hover: {
      title: "EWC penalty（二次惩罚）",
      definitionZh: "把当前参数与旧任务参考参数之间的偏移按重要性加权后求和，使重要参数的大幅移动付出更高代价。",
      paperRoleZh: "与新任务损失相加，形成联合优化目标。",
    },
    reference: {
      titleEn: "Importance-weighted quadratic penalty",
      summaryEn: "A soft constraint that discourages movement away from important earlier-task parameters.",
      bodyEn: <><p>The regularized objective balances the current task against a local quadratic approximation around the stored solution.</p><div className="rk-reference-hub__math" aria-label="EWC objective formula">L(θ) = L<sub>new</sub>(θ) + (λ / 2) Σ<sub>i</sub> F<sub>i</sub>(θ<sub>i</sub> − θ*<sub>i</sub>)²</div><p>The coefficient λ controls the trade-off. The penalty is soft: parameters can still move when the combined objective supports that update.</p></>,
      relatedIds: ["fisher", "earlier-optimum"],
      relatedSection: "ewc-penalty",
      sourceRefs: ["Elastic Weight Consolidation, regularized objective"],
      tags: ["formula", "quadratic penalty", "stability-plasticity"],
    },
  },
];
