export type FullReplayStep = {
  id: string;
  title: string;
  processStepId: string;
  action: string;
  input: string;
  output: string;
  state: string;
};

export const fullReplaySteps: FullReplayStep[] = [
  {
    id: "old-model",
    title: "旧模型已就绪",
    processStepId: "key-freeze-teacher",
    action: "从已训练完成的 Modelₜ 开始。",
    input: "Modelₜ · 旧任务共享参数 θₛ 与旧 head θₒ",
    output: "可运行的旧任务模型",
    state: "旧训练图像与标签不可用；模型权重仍可用。",
  },
  {
    id: "new-task",
    title: "新任务到来",
    processStepId: "key-freeze-teacher",
    action: "当前任务提供适配所需的样本与新标签。",
    input: "新任务图像 Xₙ 与标签 Yₙ",
    output: "当前阶段的训练输入与监督",
    state: "新旧任务数据条件不同；适配只使用新任务训练数据。",
  },
  {
    id: "freeze-teacher",
    title: "固定旧模型为 Teacher",
    processStepId: "key-freeze-teacher",
    action: "保留 Modelₜ 的固定副本，作为本阶段旧行为来源。",
    input: "Modelₜ · θₛ + θₒ",
    output: "Teacherₜ",
    state: "Teacherₜ 在当前阶段不参与更新。",
  },
  {
    id: "generate-responses",
    title: "在 Xₙ 上生成旧响应",
    processStepId: "key-generate-response",
    action: "让 Teacherₜ 对新任务输入给出已有任务的预测。",
    input: "Teacherₜ + Xₙ",
    output: "Yₒ on Xₙ",
    state: "Yₒ 是旧任务响应目标，不是旧样本或旧任务标签。",
  },
  {
    id: "expand-student",
    title: "扩展 Student 与新 head",
    processStepId: "key-expand-student",
    action: "从旧模型建立 Student，并添加新任务参数 θₙ。",
    input: "旧模型结构 + 新任务类别",
    output: "Studentₜ₊₁ · 共享 θₛ、旧 head θₒ、新 head θₙ",
    state: "Teacherₜ 保持固定；Studentₜ₊₁ 独立接受训练。",
  },
  {
    id: "warmup",
    title: "预热新任务 head",
    processStepId: "cycle-warmup",
    action: "先使用新任务监督训练刚加入的 θₙ。",
    input: "Studentₜ₊₁ + (Xₙ, Yₙ)",
    output: "初步适配的新 head θₙ",
    state: "Warm-up 中 θₛ 与 θₒ 冻结；Teacherₜ 仍固定。",
  },
  {
    id: "joint-training",
    title: "联合优化旧响应与新任务",
    processStepId: "cycle-backward",
    action: "组合 L_old、L_new 与普通正则项，更新可训练的 Student 参数。",
    input: "Teacher 响应 Yₒ、新标签 Yₙ、Student 输出 Ŷₒ / Ŷₙ",
    output: "L = λₒ L_old + L_new + R 的梯度",
    state: "L_old 与 L_new 都影响共享 θₛ；Teacherₜ 始终固定。",
  },
  {
    id: "updated-student",
    title: "得到更新后的 Student",
    processStepId: "cycle-update",
    action: "优化器应用已计算的梯度。",
    input: "联合目标产生的梯度",
    output: "更新后的 Studentₜ₊₁",
    state: "参数变化发生在更新步骤后；当前任务阶段完成。",
  },
  {
    id: "next-teacher",
    title: "交接给下一任务阶段",
    processStepId: "cycle-update",
    action: "将 Studentₜ₊₁ 保存为下一阶段模型。",
    input: "更新后的 Studentₜ₊₁",
    output: "Modelₜ₊₁ → Teacherₜ₊₁",
    state: "下一任务到来时，从新 Teacher 在新 X 上重新生成旧响应。",
  },
];

export const jointTrainingSubsteps = ["Forward", "L_old / L_new", "Backward", "Update"] as const;
