import type { TutorialData } from "../types";
import { LWF_UPSTREAM_CHAPTERS } from "../v3/data/upstream-adapter.ts";

// Official import source for the current eight-chapter LwF learning spine.
export const tutorial: TutorialData = {
  meta: {
    titleEn: "Learning without Forgetting",
    titleZh: "不遗忘学习",
    venue: "ECCV 2016 · arXiv:1606.09282v3",
    authors: "Zhizhong Li · Derek Hoiem",
    affiliation: "论文首页未列机构",
    domain: "视觉分类与连续任务学习",
    coreProblem: "无法访问旧任务训练数据时，怎样给已有卷积网络添加新预测能力并限制旧能力退化？",
    coreInsight: "用旧模型在新任务输入上的旧任务响应作软约束，同时用新标签学习新任务。",
    keywords: ["持续学习", "知识蒸馏", "卷积神经网络"],
  },
  hero: {
    oldMethod: {
      desc: "直接微调会更新共享层，旧任务表现存在退化风险。",
      componentId: "lwf-hero",
    },
    newMethod: {
      desc: "LwF 在同一新输入上匹配旧响应，并学习新任务标签。",
      componentId: "lwf-hero",
    },
  },
  chapters: LWF_UPSTREAM_CHAPTERS,
};
