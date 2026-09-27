import type { ReferenceItem, TermDefinition } from "../../shared/core/reference";

export const terms: TermDefinition[] = [
  { id: "teacher", label: "Teacher", fullName: "固定的旧模型", definition: "上一任务训练完成后保留下来的模型副本。", paperRole: "在当前输入 Xₙ 上产生旧任务响应 Yₒ。", confusion: "不是当前要更新的 Student。", sourceKind: "方法结构" },
  { id: "student", label: "Student", fullName: "扩展后的可训练模型", definition: "包含共享参数、旧任务 head 和新增任务 head 的当前模型。", paperRole: "共同学习旧响应保持与新任务目标。", confusion: "不是 Teacher 的共享可变副本；两者参数对象独立。", sourceKind: "方法结构" },
  { id: "theta-s", label: "θₛ", fullName: "共享参数", definition: "多个任务共同使用的表示网络参数。", paperRole: "warm-up 后参与新任务学习和旧响应保持。", confusion: "不等同于某个任务专属 head。", sourceKind: "符号" },
  { id: "theta-o", label: "θₒ", fullName: "旧任务 head 参数", definition: "Student 中连接共享表示与旧任务输出的参数。", paperRole: "产生 Ŷₒ，并在联合优化阶段接收 L_old 梯度。", confusion: "Teacher 的对应参数保持固定。", sourceKind: "符号" },
  { id: "theta-n", label: "θₙ", fullName: "新任务 head 参数", definition: "为当前新任务新初始化的任务专属参数。", paperRole: "warm-up 阶段首先训练，之后参与联合优化。", confusion: "新 head 不等于整套 Student。", sourceKind: "符号" },
  { id: "xn", label: "Xₙ", fullName: "当前任务输入", definition: "当前新任务可访问的输入样本。", paperRole: "同时输入 Teacher 与 Student。", confusion: "不是旧任务数据。", sourceKind: "符号" },
  { id: "yo", label: "Yₒ", fullName: "Teacher 的旧任务响应", definition: "Teacher 对当前任务输入 Xₙ 产生的旧任务输出。", paperRole: "在当前输入分布上作为旧行为保持目标。", confusion: "不是 old ground-truth label、旧数据集或 replay sample。", sourceKind: "符号" },
  { id: "yn", label: "Yₙ", fullName: "新任务真实标签", definition: "与当前输入 Xₙ 配对的新任务监督标签。", paperRole: "监督 Student 的新任务输出 Ŷₙ。", confusion: "不用于监督旧任务输出。", sourceKind: "符号" },
  { id: "yhat-o", label: "Ŷₒ", fullName: "Student 的旧任务输出", definition: "Student 在旧任务 head 上对当前输入的预测。", paperRole: "与 Teacher 的 Yₒ 共同形成 L_old。", confusion: "不是 Teacher target。", sourceKind: "符号" },
  { id: "yhat-n", label: "Ŷₙ", fullName: "Student 的新任务输出", definition: "Student 在新增任务 head 上对当前输入的预测。", paperRole: "与新任务标签 Yₙ 形成 L_new。", confusion: "不是 Yₙ 本身。", sourceKind: "符号" },
  { id: "l-old", label: "L_old", fullName: "旧响应保持损失", definition: "衡量 Student 旧任务输出与 Teacher 响应之间差异的损失项。", paperRole: "在没有旧训练输入时约束旧任务行为。", confusion: "训练目标来自 Teacher 输出，不来自旧任务真值。", sourceKind: "方法目标" },
  { id: "l-new", label: "L_new", fullName: "新任务损失", definition: "由新任务真实标签监督 Student 新任务输出。", paperRole: "驱动 Student 学习当前任务。", confusion: "与旧响应蒸馏使用不同的目标。", sourceKind: "方法目标" },
  { id: "lambda-o", label: "λₒ", fullName: "旧任务损失权重", definition: "组合目标中乘在 L_old 前的权重。", paperRole: "调整旧任务保持项相对新任务损失的影响。", confusion: "不是温度参数。", sourceKind: "符号" },
  { id: "regularization", label: "R", fullName: "普通正则项", definition: "组合目标中的常规正则化项。", paperRole: "与 L_old、L_new 一起构成优化目标。", confusion: "不是第三个任务的监督损失。", sourceKind: "符号" },
  { id: "warm-up", label: "Warm-up", fullName: "新 head 预热阶段", definition: "先单独训练新任务 head 的阶段。", paperRole: "暂时冻结 Student 的共享参数与旧 head。", confusion: "它不是 Teacher 训练阶段。", sourceKind: "训练阶段" },
  { id: "joint-optimization", label: "联合优化", fullName: "共享参数与任务 head 联合更新", definition: "Warm-up 后，用旧响应损失和新任务损失共同更新 Student。", paperRole: "让 θₛ 同时接收旧、新目标带来的梯度。", confusion: "Teacher 仍保持固定。", sourceKind: "训练阶段" },
];

export const references: ReferenceItem[] = [
  ...terms.map((term) => ({ id: `term-${term.id}`, title: term.label, kind: "term" as const, summary: term.definition, tags: [term.fullName ?? term.label, term.paperRole ?? "", term.confusion ?? ""] })),
  { id: "objective", title: "组合目标", kind: "formula", summary: "L = λₒ L_old + L_new + R", tags: ["旧任务保持", "新任务学习", "普通正则项"] },
  { id: "training-cycle", title: "单次训练周期", kind: "implementation", summary: "Warm-up → Forward → L_old / L_new → Backward → Optimizer Step", relatedSection: "slice-03", tags: ["训练", "梯度", "参数更新"] },
];

export const termsById = Object.fromEntries(terms.map((term) => [term.id, term])) as Record<string, TermDefinition>;
