import type { TutorialData } from "../types";

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Dark Experience for General Continual Learning: a Strong, Simple Baseline",
    titleZh: "DER / DER++：用有限记忆保留历史预测",
    paperUrl: "https://arxiv.org/abs/2004.07211v2",
    venue: "NeurIPS 2020",
    scope: "S1–S3 · 首个教学切片",
  },
  chapters: [
    { kind: "chapter", id: "U1-replay-entry", title: "旧数据已过去，\n旧判断如何留下？", summary: "从持续学习的真实约束出发，先看有限回放能做什么，再看它还没记录什么。", navTitle: "从有限回放出发", modules: [{ kind: "module", id: "replay-and-soft-targets", title: "有限回放与历史响应", componentId: "der-replay-entry" }] },
    { kind: "chapter", id: "U2-probability", title: "先比较两组概率，\n让偏离有一个尺度。", summary: "用 Claude / GPT 两类独立合成例，固定过去的概率分布，再观察当前分布怎样偏离它。", navTitle: "用 KL 比较概率", modules: [{ kind: "module", id: "probability-constraint", title: "KL 的对象、定义与短推演", componentId: "der-probability-constraint" }] },
    { kind: "chapter", id: "U3-logit-memory", title: "再回到原始分数，\n留下当时的响应。", summary: "回到 Claude / GPT / DeepSeek 三类分数。DER 选择在 softmax 之前比较 logits，再把训练途中的输出留下。", navTitle: "匹配并冻结 logits", modules: [{ kind: "module", id: "logit-matching", title: "平方匹配与共同平移反例", componentId: "der-logit-matching" }, { kind: "module", id: "memory-snapshot", title: "更新前的 logits 如何成为冻结目标", componentId: "der-memory-snapshot" }] },
  ],
};
