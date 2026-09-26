export type ResearchTopicTag = {
  id: string;
  category: string;
  label: string;
  detail: string;
};

export const LWF_RESEARCH_TOPICS: ResearchTopicTag[] = [
  {
    id: 'topic',
    category: '研究主题',
    label: '持续学习与灾难性遗忘',
    detail: '模型按顺序接收新任务；本文关注学习新任务时旧任务能力可能退化的问题。',
  },
  {
    id: 'setting',
    category: '问题类型',
    label: '旧数据不可用的增量视觉学习',
    detail: '新阶段只用新任务图像和标签扩展已有视觉模型，不再访问旧任务训练数据。',
  },
  {
    id: 'direction',
    category: '研究方向',
    label: '输出空间约束与知识蒸馏',
    detail: '旧模型在当前新图像上生成旧任务软响应，扩展后的模型匹配这些输出并学习新标签；方法约束输出行为，而非惩罚旧参数偏移。',
  },
];
