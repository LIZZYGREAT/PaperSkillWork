import type { ResponsibilityMapSpec } from "../../shared/core/responsibility-map";

export const responsibilities: ResponsibilityMapSpec = {
  actors: [
    { id: "teacher", name: "Teacher", description: "固定的旧模型", can: "对 Xₙ 提供 Yₒ", cannot: "参与 Student 的参数更新" },
    { id: "shared", name: "共享参数 θₛ", description: "Student 的共享表示网络", can: "接收旧、新两项损失的梯度", cannot: "独自决定旧或新任务输出" },
    { id: "old-head", name: "旧任务 head θₒ", description: "Student 的旧任务分支", can: "产生 Ŷₒ 并接收 L_old 梯度", cannot: "提供新任务真值" },
    { id: "new-head", name: "新任务 head θₙ", description: "为当前任务新加入的分支", can: "产生 Ŷₙ 并接收 L_new 梯度", cannot: "提供旧任务监督" },
  ],
  steps: [
    { id: "teacher-target", label: "提供旧响应目标 Yₒ", owners: ["teacher"], note: "Teacher 在当前输入 Xₙ 上运行，保持固定。" },
    { id: "shared-feature", label: "计算共享表示", owners: ["shared"], note: "共享参数连接旧、新两个任务分支。" },
    { id: "old-output", label: "产生旧任务输出 Ŷₒ", owners: ["shared", "old-head"], note: "L_old 比较 Student 的 Ŷₒ 与 Teacher 的 Yₒ。" },
    { id: "new-output", label: "产生新任务输出 Ŷₙ", owners: ["shared", "new-head"], note: "L_new 使用新任务真值 Yₙ 监督 Ŷₙ。" },
  ],
  conclusion: "Teacher 提供旧响应；Student 共享表示并分出两个 head，各自接收对应任务信号。",
};
