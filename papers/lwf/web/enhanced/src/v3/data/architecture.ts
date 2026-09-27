import type { ArchitectureSpec } from "../../shared/core/architecture";

export const architectureSpec: ArchitectureSpec = {
  nodes: [
    { id: "teacher-input", label: "Xₙ", group: "Teacher · 固定旧模型", detail: "当前新任务输入；旧模型可以继续对它运行。", position: { x: 130, y: 120 } },
    { id: "teacher-shared", label: "θₛ", group: "Teacher · 固定旧模型", detail: "Teacher 持有的旧共享参数副本；在本轮训练中冻结。", status: "frozen", position: { x: 410, y: 120 } },
    { id: "teacher-old-head", label: "θₒ", group: "Teacher · 固定旧模型", detail: "Teacher 的旧任务 head；与共享参数一起保持固定。", status: "frozen", position: { x: 690, y: 120 } },
    { id: "teacher-output", label: "Yₒ", group: "Teacher · 固定旧模型", detail: "Teacher 对当前 Xₙ 的旧任务响应，不是旧数据或旧真值。", position: { x: 970, y: 120 } },

    { id: "student-input", label: "Xₙ", group: "Student · 扩展模型", detail: "Student 使用同一批当前任务输入。", position: { x: 130, y: 390 } },
    { id: "student-shared", label: "θₛ", group: "Student · 扩展模型", detail: "共享表示参数；warm-up 后参与旧任务保持和新任务学习。", status: "trainable", position: { x: 410, y: 390 } },
    { id: "student-old-head", label: "θₒ", group: "Student · 扩展模型", detail: "Student 中的旧任务 head；联合优化阶段可训练。", status: "trainable", position: { x: 690, y: 315 } },
    { id: "student-new-head", label: "θₙ", group: "Student · 扩展模型", detail: "为新任务新初始化的 head；warm-up 时首先训练。", status: "trainable", position: { x: 690, y: 465 } },
    { id: "student-old-output", label: "Ŷₒ", group: "Student · 扩展模型", detail: "Student 的旧任务输出，与 Teacher 的 Yₒ 形成旧响应损失。", position: { x: 970, y: 315 } },
    { id: "student-new-output", label: "Ŷₙ", group: "Student · 扩展模型", detail: "Student 的新任务输出，由新任务标签监督。", position: { x: 970, y: 465 } },
  ],
  edges: [
    { from: "teacher-input", to: "teacher-shared", label: "输入" },
    { from: "teacher-shared", to: "teacher-old-head", label: "旧任务分支" },
    { from: "teacher-old-head", to: "teacher-output", label: "产生响应" },
    { from: "student-input", to: "student-shared", label: "输入" },
    { from: "student-shared", to: "student-old-head", label: "旧任务分支", branch: "old" },
    { from: "student-shared", to: "student-new-head", label: "新任务分支", branch: "new" },
    { from: "student-old-head", to: "student-old-output", label: "旧类输出", branch: "old" },
    { from: "student-new-head", to: "student-new-output", label: "新类输出", branch: "new" },
  ],
};
