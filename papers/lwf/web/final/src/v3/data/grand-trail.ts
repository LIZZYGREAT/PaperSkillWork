import type { LwfChapterId } from "./chapters";

export type GrandTrailStep = {
  id: string;
  title: string;
  checkpoint: string;
  action: string;
  input: string;
  output: string;
  state: string;
  why: string;
  activeActors: string[];
  activeFlows: string[];
  referenceId?: string;
  chapterRef?: LwfChapterId;
  durationMs: number;
};

export type GrandTrailEdge = { from: string; to: string; flow: string };

export const grandTrailSteps: GrandTrailStep[] = [
  {
    id: "old-model",
    title: "旧模型就绪",
    checkpoint: "START · MODELₜ",
    action: "从已完成任务 1…t 的旧模型开始。",
    input: "Modelₜ · 共享参数 θₛ + 旧 head θₒ",
    output: "仍可运行的旧任务模型",
    state: "旧训练图像与标签不可用；模型参数仍可访问。",
    why: "旧模型保留了可查询的旧行为，但不需要取回旧训练样本。",
    activeActors: ["model", "old-data-locked"],
    activeFlows: [],
    referenceId: "teacher",
    chapterRef: "01",
    durationMs: 900,
  },
  {
    id: "new-task",
    title: "新任务到来",
    checkpoint: "NEW TASK · INPUT",
    action: "新任务带来当前可用的输入与新标签。",
    input: "Xₙ + Yₙ",
    output: "当前阶段训练数据",
    state: "适配阶段只使用新任务数据；旧任务数据仍不可用。",
    why: "LwF 在新任务样本上同时学习新标签并查询旧模型响应。",
    activeActors: ["model", "new-task", "old-data-locked"],
    activeFlows: ["task-arrival"],
    referenceId: "xn",
    chapterRef: "02",
    durationMs: 1100,
  },
  {
    id: "teacher-student-split",
    title: "固定旧模型状态",
    checkpoint: "FREEZE · OLD MODEL STATE",
    action: "将 Modelₜ 保留为本阶段的固定参照 Teacherₜ；它不参与当前 Student 的参数更新。",
    input: "Modelₜ · θₛ + θₒ",
    output: "Frozen reference · Teacherₜ",
    state: "Teacherₜ 的 θₛ 与 θₒ 固定；正式训练使用 Student，Teacher 不参与参数更新。",
    why: "固定旧模型用于在当前新任务输入上记录旧响应目标。",
    activeActors: ["teacher-frozen"],
    activeFlows: ["teacher-freeze"],
    referenceId: "student",
    chapterRef: "02",
    durationMs: 1500,
  },
  {
    id: "generate-responses",
    title: "记录旧任务响应",
    checkpoint: "RECORD RESPONSE · Yₒ",
    action: "正式训练前，将当前新任务输入 Xₙ 输入固定 Modelₜ，记录旧任务响应 Yₒ。",
    input: "Frozen Modelₜ + Xₙ",
    output: "Yₒ · RECORDED / FIXED TARGET",
    state: "Yₒ 在训练开始前记录，之后作为固定 target；它不是旧任务真值标签、旧样本或 replay sample。",
    why: "旧数据不能访问时，旧模型输出仍能为旧任务行为提供参照。",
    activeActors: ["teacher-frozen", "new-task", "old-response"],
    activeFlows: ["response-refresh"],
    referenceId: "yo",
    chapterRef: "02",
    durationMs: 1500,
  },
  {
    id: "add-head",
    title: "增加新任务 head",
    checkpoint: "EXPAND · θₙ",
    action: "在 Student 的共享表示 θₛ 上保留旧任务 head θₒ，并增加随机初始化的新任务 head θₙ。",
    input: "Modelₜ · θₛ + θₒ",
    output: "Current Student · θₛ + θₒ + θₙ",
    state: "旧输出路径保留；新增 θₙ 负责当前任务预测。",
    why: "新 head 给新任务留出输出通道，无需替换旧任务 head。",
    activeActors: ["teacher-frozen", "student-active", "new-head"],
    activeFlows: ["head-branch"],
    referenceId: "theta-n",
    chapterRef: "02",
    durationMs: 1300,
  },
  {
    id: "warm-up",
    title: "Warm-up 新 head",
    checkpoint: "WARM-UP · ONLY θₙ",
    action: "先使用当前任务标签预热新 head。",
    input: "Xₙ + Yₙ → Student 的新任务分支",
    output: "初步适配的 θₙ",
    state: "Warm-up 时 θₛ 与 θₒ 冻结，只有 θₙ 可训练。",
    why: "先单独适配新输出层，之后再进入旧响应与新任务联合优化。",
    activeActors: ["teacher-frozen", "shared-frozen", "old-head-frozen", "new-head-active"],
    activeFlows: ["new-head-warmup"],
    referenceId: "warm-up",
    chapterRef: "03",
    durationMs: 1300,
  },
  {
    id: "joint-training",
    title: "联合训练两个目标",
    checkpoint: "JOINT TRAINING · L_old + L_new",
    action: "Student 前向产生 Ŷₒ 与 Ŷₙ；固定的 Yₒ 与 Ŷₒ 形成 L_old，Yₙ 与 Ŷₙ 形成 L_new，再执行 Backward。",
    input: "Recorded Yₒ + Student(Xₙ) + Yₙ",
    output: "L = λₒ L_old + L_new + R → gradients ready",
    state: "联合阶段 θₛ、θₒ、θₙ 都是可训练参数；Teacherₜ / frozen old snapshot 不参与当前模型更新。",
    why: "联合目标在保持已观察旧响应与适配当前任务之间提供权衡。",
    activeActors: ["teacher-frozen", "student-active", "old-response", "old-loss", "new-loss", "gradient", "shared-trainable", "old-head-trainable", "new-head-trainable"],
    activeFlows: ["old-loss", "new-loss", "gradient-wave"],
    referenceId: "joint-optimization",
    chapterRef: "03",
    durationMs: 2200,
  },
  {
    id: "update",
    title: "更新 Student",
    checkpoint: "UPDATE · PARAMETERS",
    action: "Optimizer 将当前梯度应用到 θₛ、θₒ、θₙ，完成当前任务中的一次参数更新。",
    input: "Student^(k) + gradients",
    output: "Student^(k+1)",
    state: "这只是当前任务训练过程中的一次 optimizer step；任务尚未完成，Teacherₜ 仍固定。",
    why: "Backward 计算梯度；Optimizer Step 才将梯度应用到可训练参数。",
    activeActors: ["teacher-frozen", "student-updated", "optimizer"],
    activeFlows: ["parameter-update"],
    referenceId: "joint-optimization",
    chapterRef: "03",
    durationMs: 1200,
  },
  {
    id: "next-teacher",
    title: "当前任务完成后晋升",
    checkpoint: "PROMOTION · LOOP CLOSURE",
    action: "Task t+1 训练结束后，最终 Student* 成为 Modelₜ₊₁；Task t+2 到来时再固定为 Teacherₜ₊₁。",
    input: "Student* · Task t+1 training finished",
    output: "Modelₜ₊₁ → next Teacherₜ₊₁",
    state: "模型级下标只在当前任务训练完成后赋予；下一阶段会在新输入上重新记录旧响应。",
    why: "模型沿任务序列递归交接，构成完整生命周期。",
    activeActors: ["student-final", "model-next", "teacher-next", "next-task"],
    activeFlows: ["model-promotion", "loop-closure"],
    referenceId: "sequential-refresh",
    chapterRef: "05",
    durationMs: 1700,
  },
];

export const grandTrailEdges: GrandTrailEdge[] = [
  { from: "old-model", to: "new-task", flow: "task-arrival" },
  { from: "new-task", to: "teacher-student-split", flow: "student-copy" },
  { from: "teacher-student-split", to: "generate-responses", flow: "response-refresh" },
  { from: "generate-responses", to: "add-head", flow: "head-branch" },
  { from: "add-head", to: "warm-up", flow: "new-head-warmup" },
  { from: "warm-up", to: "joint-training", flow: "gradient-wave" },
  { from: "joint-training", to: "update", flow: "parameter-update" },
  { from: "update", to: "next-teacher", flow: "model-promotion" },
];

export const jointTrainingSubsteps = ["Forward", "L_old / L_new", "Backward"] as const;
