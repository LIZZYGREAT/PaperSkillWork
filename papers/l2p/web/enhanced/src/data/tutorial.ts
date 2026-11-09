import type { TutorialData } from "../types";
import { references } from "./references";

export const tutorial: TutorialData = {
  meta: { titleZh: "学习提示，持续学习", titleEn: "Learning to Prompt for Continual Learning" },
  chapters: [
    {
      kind: "chapter", id: "p1", title: "学会新类别以后，旧类别还认得吗？", titleHighlight: "旧类别还认得吗",
      summary: "新类别依次到来，旧训练图像往往无法完整回放。对比同一旧图在两份参数快照下的预测，再理解无任务 ID 的统一测试为何更困难。",
      modules: [{ kind: "module", id: "stream", title: "一个分类器，两次任务", componentId: "task-stream" }],
    },
    {
      kind: "chapter", id: "p2", title: "一张图，怎样变成 197 个 Token？", titleHighlight: "197 个 Token",
      summary: "沿同一块 Patch 走过展平、投影和序列组装，理解 196、197 与 768 的来源，再看 Encoder 如何逐层形成分类特征。",
      modules: [{ kind: "module", id: "vit", title: "从图像到上下文特征", componentId: "vit-path" }],
    },
    {
      kind: "chapter", id: "p3", title: "打开一层 Encoder，追踪 Token 如何交换信息", titleHighlight: "交换信息",
      summary: "从一层 Block 的运算地图进入 Q/K/V、权重和 Value 汇聚，再接回多头、残差与 FFN，最后比较固定权重如何响应新的输入。",
      modules: [{ kind: "module", id: "encoder", title: "一层 Transformer 的前向路径", componentId: "encoder-attention" }],
    },
    {
      kind: "chapter", id: "p4", title: "冻结 ViT 时，Prompt 怎样学会适应新任务？", titleHighlight: "Prompt 怎样学会适应",
      summary: "用低维教学 Trace 观察两个 Prompt Token 如何接入图像序列，经历冻结前向、分类损失、梯度回传、一次参数更新与同图复算；再引出共享 Prompt 在后续任务中可能受到的干扰。均值读出只用于解释机制，不代表完整 L2P Prompt Pool 路径。",
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
    {
      kind: "chapter", id: "p9", title: "哪些设计有实验支持，证据边界在哪里？", titleHighlight: "实验支持",
      summary: "用同一 Query 与 Key 重算 Eq. (3)/(4) 的排名，再对照作者实际报告的 Prompt 使用观察、5-datasets 消融和不同增量协议结果。",
      modules: [{ kind: "module", id: "method-evidence", title: "可选检索策略与论文实验证据", componentId: "method-evidence" }],
    },
  ],
  references,
};
