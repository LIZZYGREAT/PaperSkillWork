export type PageEntry = {
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

export const PAGES: PageEntry[] = [
  {
    id: 'overview', number: '01', title: '为什么要研究 EWC？',
    question: '持续学习的基本矛盾：共享参数要适应新任务，更新却可能抹掉旧任务能力；冻结参数又会限制新任务。论文研究如何在二者之间保留可塑性。',
    exit: '你能概述灾难性遗忘、稳定性与可塑性冲突，以及 EWC 的研究问题。',
    evidenceIds: ['C01', 'C02', 'C11'], termIds: ['continual_learning', 'catastrophic_forgetting', 'stability_plasticity'],
  },
  {
    id: 'problem', number: '02', title: '为什么任务 B 会覆盖任务 A？',
    question: '先把冲突拆清楚：同一组参数要继续学习，新任务的梯度却看不到旧任务目标。',
    exit: '你能说明自由更新和统一约束各自会带来什么代价。',
    evidenceIds: ['C01', 'C02'], termIds: ['continual_learning', 'catastrophic_forgetting'],
  },
  {
    id: 'handoff', number: '03', title: '任务 A 结束后留下什么？',
    question: '顺序 Bayes 把旧任务后验带入新任务；EWC 的难点是如何用可计算的状态近似它。',
    exit: '你能从 p(θ|D_A) 推出它为何会成为任务 B 的先验因子。',
    evidenceIds: ['C03', 'F01'], termIds: ['bayesian_posterior'],
  },
  {
    id: 'fisher', number: '04', title: 'Fisher 怎样给参数加权？',
    question: '用旧解作中心、用对角 Fisher 作局部精度，让同样大小的偏移产生不同代价。',
    exit: '你能解释 Fᵢ、参数偏移与二次惩罚的关系，以及对角近似丢掉了什么。',
    evidenceIds: ['C03', 'C10', 'F02', 'T02'], termIds: ['fisher_information', 'diagonal_fisher', 'laplace_approximation'],
  },
  {
    id: 'update', number: '05', title: '一次训练步里，哪些对象真的改变？',
    question: '将新任务梯度与 EWC 梯度合并，再区分损失求导和优化器更新。',
    exit: '你能重建总梯度，并指出 θ* 和 F 不会被当前新任务步骤更新。',
    evidenceIds: ['C02', 'C03', 'F02', 'F03', 'I01', 'I02', 'T01'], termIds: ['anchor_parameters', 'ewc_penalty', 'stability_plasticity'],
  },
  {
    id: 'lifecycle', number: '06', title: '任务边界上的状态如何流转？',
    question: 'EWC 在任务结束与新任务训练之间传递哪些参考状态？当前参数、旧锚点、Fisher 和数据各自在何时读写？',
    exit: '你能说出旧任务结束时存下的 θ* 与 F，以及新任务训练中会被优化器更新的 θ。',
    evidenceIds: ['C02', 'C03', 'I01', 'I02'], termIds: ['anchor_parameters', 'ewc_penalty'],
  },
  {
    id: 'mnistProtocol', number: '07', title: 'Permuted MNIST 怎样构造？',
    question: '先读实验协议：每个任务有固定像素置换，依次训练后不再把旧任务样本用于后续训练。',
    exit: '你能解释任务置换如何构造，以及 Figure 2A/B 比较了什么方法。',
    evidenceIds: ['C04', 'R01', 'R02'], termIds: ['permuted_mnist'],
  },
  {
    id: 'mnistResults', number: '08', title: 'MNIST 结果支持哪些结论？',
    question: '分开看性能保持与 Fisher overlap：它们回答不同问题，不能把参数使用相似度读成准确率。',
    exit: '你能定性比较基线趋势，区分图 2A/B 的性能证据和图 2C 的参数使用分析。',
    evidenceIds: ['C05', 'C06', 'R01', 'R02'], termIds: ['fisher_overlap', 'stability_plasticity'],
  },
  {
    id: 'atari', number: '09', title: 'Atari 结果属于整个系统',
    question: '将 EWC 放回 task recognition、按任务经验回放和任务专属参数组成的 DQN 中，再检查结论边界。',
    exit: '你能画出系统边界，说明指标，并指出对角近似和有限容量的限制。',
    evidenceIds: ['C07', 'C08', 'C09', 'C10', 'C11', 'C12', 'R03', 'R04', 'B03'], termIds: ['experience_replay', 'function_regularization'],
  },
  {
    id: 'synthesis', number: '10', title: '综合实验，回到 EWC 的适用边界',
    question: '把 MNIST 与 Atari 的比较放回各自协议，再总结 EWC 保留了什么、依赖什么、仍不能保证什么。',
    exit: '你能基于实验说明 EWC 缓解参数干扰的证据与近似边界，并复述完整学习流程。',
    evidenceIds: ['C05', 'C06', 'C09', 'C10', 'C11', 'F02', 'F03'], termIds: ['stability_plasticity', 'diagonal_fisher'],
  },
];
