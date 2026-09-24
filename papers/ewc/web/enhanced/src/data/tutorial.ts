export type SceneEntry = {
  id: string;
  number: string;
  title: string;
  question: string;
  exit: string;
  evidenceIds: string[];
  termIds: string[];
};

export const PAPER = {
  title: 'Overcoming catastrophic forgetting in neural networks',
  titleZh: 'EWC：克服神经网络的灾难性遗忘',
  authors: 'James Kirkpatrick 等 14 位作者',
  venue: 'PNAS · 2017',
  arxiv: 'https://arxiv.org/html/1612.00796',
  doi: 'https://doi.org/10.1073/pnas.1611835114',
};

export const SCENES: SceneEntry[] = [
  {
    id: 'problem', number: '01', title: '为什么任务 B 会覆盖任务 A？',
    question: '先把冲突拆清楚：同一组参数要继续学习，新任务的梯度却看不到旧任务目标。',
    exit: '你能说明自由更新和统一约束各自会带来什么代价。',
    evidenceIds: ['C01', 'C02'], termIds: ['continual_learning', 'catastrophic_forgetting'],
  },
  {
    id: 'handoff', number: '02', title: '任务 A 结束后留下什么？',
    question: '顺序 Bayes 把旧任务后验带入新任务；EWC 的难点是如何用可计算的状态近似它。',
    exit: '你能从 p(θ|D_A) 推出它为何会成为任务 B 的先验因子。',
    evidenceIds: ['C03', 'F01'], termIds: ['bayesian_posterior'],
  },
  {
    id: 'fisher', number: '03', title: 'Fisher 怎样给参数加权？',
    question: '用旧解作中心、用对角 Fisher 作局部精度，让同样大小的偏移产生不同代价。',
    exit: '你能解释 Fᵢ、参数偏移与二次惩罚的关系，以及对角近似丢掉了什么。',
    evidenceIds: ['C03', 'C10', 'F02', 'T02'], termIds: ['fisher_information', 'diagonal_fisher', 'laplace_approximation'],
  },
  {
    id: 'update', number: '04', title: '一次训练步里，哪些对象真的改变？',
    question: '将新任务梯度与 EWC 梯度合并，再区分损失求导和优化器更新。',
    exit: '你能重建总梯度，并指出 θ* 和 F 不会被当前新任务步骤更新。',
    evidenceIds: ['C02', 'C03', 'F02', 'F03', 'I01', 'I02', 'T01'], termIds: ['anchor_parameters', 'ewc_penalty', 'stability_plasticity'],
  },
  {
    id: 'mnist', number: '05', title: 'Permuted MNIST 证明了什么？',
    question: '按任务读取置换规则、对照方法和 Fisher overlap，不从图上猜精确数值。',
    exit: '你能复述任务构造和定性结果，并区分性能曲线与参数使用分析。',
    evidenceIds: ['C04', 'C05', 'C06', 'R01', 'R02'], termIds: ['permuted_mnist', 'fisher_overlap'],
  },
  {
    id: 'atari', number: '06', title: 'Atari 结果属于整个系统',
    question: '将 EWC 放回 task recognition、按任务经验回放和任务专属参数组成的 DQN 中，再检查结论边界。',
    exit: '你能画出系统边界，说明指标，并指出对角近似和有限容量的限制。',
    evidenceIds: ['C07', 'C08', 'C09', 'C10', 'C11', 'C12', 'R03', 'R04', 'B03'], termIds: ['experience_replay', 'function_regularization'],
  },
];
