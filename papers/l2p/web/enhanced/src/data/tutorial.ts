import type { TutorialData } from "../types";

export const tutorial: TutorialData = {
  meta: { titleZh: "学习提示，持续学习", titleEn: "Learning to Prompt for Continual Learning" },
  chapters: [
    {
      kind: "chapter", id: "p1", title: "学会新类别以后，旧类别还认得吗？", titleHighlight: "旧类别还认得吗",
      summary: "数据按任务陆续到来。用同一张旧图对比两次预测，看看更新同一个分类器会带来什么变化。",
      modules: [{ kind: "module", id: "stream", title: "一个分类器，两次任务", componentId: "task-stream" }],
    },
    {
      kind: "chapter", id: "p2", title: "一张图，怎样变成 197 个 Token？", titleHighlight: "197 个 Token",
      summary: "跟着同一张图走过 ViT。先看主干全貌，再放大一块 Patch，找到它进入序列的位置。",
      modules: [{ kind: "module", id: "vit", title: "从图像到上下文特征", componentId: "vit-path" }],
    },
    {
      kind: "chapter", id: "p3", title: "打开一层 Encoder，追踪 Token 如何交换信息", titleHighlight: "交换信息",
      summary: "在一层 Transformer 中，Token 可以读取其他位置的信息。沿着一条注意力计算路径，看看冻结的网络如何响应新输入。",
      modules: [{ kind: "module", id: "encoder", title: "一层 Transformer 的前向路径", componentId: "encoder-attention" }],
    },
    {
      kind: "chapter", id: "p4", title: "冻结 ViT 时，Prompt 怎样学会适应新任务？", titleHighlight: "Prompt 怎样学会适应",
      summary: "P3 说明输入 Token 会参与冻结网络的计算。现在把一小段可学习向量放到图像序列前面，跟着一次分类训练，看哪些参数会改变。",
      modules: [{ kind: "module", id: "prompt-tuning", title: "把可学习 Prompt 放进冻结的 ViT", componentId: "prompt-tuning" }],
    },
    {
      kind: "chapter", id: "p5", title: "模型怎样为每个输入挑选 Prompt？", titleHighlight: "挑选 Prompt",
      summary: "单个 Prompt 可能被后续任务反复修改。现在建立一组 Key–Prompt 配对记忆，让当前图像内容决定本次使用哪些 Prompt。",
      modules: [{ kind: "module", id: "prompt-retrieval", title: "从 Query 到样本级 Top‑N 检索", componentId: "prompt-retrieval" }],
    },
    {
      kind: "chapter", id: "p6", title: "选中的 Prompt 如何参与完整分类？", titleHighlight: "完整分类",
      summary: "P5 已经为当前输入找到一组 Prompt。跟着它们和图像 Token 一起进入同一冻结 ViT，再追踪 L2P 真正用于分类的输出位置。",
      modules: [{ kind: "module", id: "prompt-forward", title: "从检索选集到类别 Logits", componentId: "prompt-forward" }],
    },
    {
      kind: "chapter", id: "p7", title: "一个 Mini-batch 怎样共同更新 Key、Prompt 和分类器？", titleHighlight: "共同更新 Key",
      summary: "P6 已经得到分类输出。现在追踪两类损失各自训练什么、硬 Top‑N 把梯度路径截在哪里，以及两个样本如何先累计再写回同一批参数。",
      modules: [{ kind: "module", id: "prompt-learning", title: "从两项损失到一次 Batch 参数写回", componentId: "prompt-learning" }],
    },
    {
      kind: "chapter", id: "p8", title: "同一套参数怎样跨任务持续运行？", titleHighlight: "跨任务持续运行",
      summary: "沿着同一个 Key–Prompt Pool，从初始化经过多个 Batch、任务交接走到无任务 ID 的推断；每一批都读取当前状态，并在批末统一更新。",
      modules: [{ kind: "module", id: "continual-run", title: "从初始化、Batch 更新到最终推断", componentId: "continual-run" }],
    },
  ],
  references: [
    { id: "forgetting", name: "灾难性遗忘", definition: "模型学习新任务后，旧任务上的表现大幅退化。", source: "L2P 原文 §1、§5.1" },
    { id: "vit", name: "ViT-B/16", definition: "使用 16×16 图像块的基础规模 Vision Transformer。本文用 224×224 图像和 768 维特征展示典型配置。", source: "L2P 原文 §3.2、§5.2" },
    { id: "attention", name: "缩放点积注意力", definition: "将目标 Query 与每个来源 Key 的点积除以键维度的平方根，对同一目标的所有分数做 Softmax，再对来源 Value 求加权和。", detail: "Softmax 先将各分数取指数，再用每项的指数除以所有指数之和。用同一个常数平移所有分数不改变权重，因此计算时可先减最大分数。", source: "L2P 原文 §3.2 所用 ViT 的架构背景" },
  ],
};
