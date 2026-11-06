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
  ],
  references: [
    { id: "forgetting", name: "灾难性遗忘", definition: "模型学习新任务后，旧任务上的表现大幅退化。", source: "L2P 原文 §1、§5.1" },
    { id: "vit", name: "ViT-B/16", definition: "使用 16×16 图像块的基础规模 Vision Transformer。本文用 224×224 图像和 768 维特征展示典型配置。", source: "L2P 原文 §3.2、§5.2" },
    { id: "attention", name: "缩放点积注意力", definition: "将目标 Query 与每个来源 Key 的点积除以键维度的平方根，对同一目标的所有分数做 Softmax，再对来源 Value 求加权和。", detail: "Softmax 先将各分数取指数，再用每项的指数除以所有指数之和。用同一个常数平移所有分数不改变权重，因此计算时可先减最大分数。", source: "L2P 原文 §3.2 所用 ViT 的架构背景" },
  ],
};
