export type EvidenceEntry = {
  id: string;
  category: string;
  statement: string;
  sourceLocation: string;
  sourceUrl?: string;
  boundary: string;
};

export const EVIDENCE: Record<string, EvidenceEntry> = {
  C01: { id: 'C01', category: 'PAPER_FACT', statement: '顺序训练会改变共享参数；旧任务数据不再可用时，传统多任务交错训练需要额外保存并重放旧样本。', sourceLocation: 'arXiv v2 §1', sourceUrl: 'https://arxiv.org/html/1612.00796#S1', boundary: '问题动机不代表每种任务序列都会以同一速度遗忘。' },
  C02: { id: 'C02', category: 'PAPER_FACT', statement: 'EWC 以旧任务参数解为中心添加 Fisher 加权的软二次约束。', sourceLocation: 'arXiv v2 §2，Equation (3)', sourceUrl: 'https://arxiv.org/html/1612.00796#S2', boundary: '这是软约束，不是冻结参数。' },
  C03: { id: 'C03', category: 'PAPER_FACT', statement: '作者将旧任务 posterior 作为新任务的 prior 因子，并以中心位于旧解、对角精度由 Fisher 给出的 Gaussian 近似。', sourceLocation: 'arXiv v2 §2，Equations (1)–(3)', sourceUrl: 'https://arxiv.org/html/1612.00796#S2', boundary: '这是对不可处理 posterior 的局部近似。' },
  C04: { id: 'C04', category: 'PAPER_FACT', statement: 'Permuted MNIST 的每个任务使用一组固定的随机像素排列，且完成该任务的固定训练后，旧数据不再参与后续训练。', sourceLocation: 'arXiv v2 §2.1', sourceUrl: 'https://arxiv.org/html/1612.00796#S2.SS1', boundary: '固定排列是每个任务内部共享的，并非每张图片独立随机排列。' },
  C05: { id: 'C05', category: 'PAPER_RESULT', statement: '在展示的 Permuted MNIST 对比中，EWC 能在学习后续任务时保留较早任务表现；均匀约束会妨碍新任务，dropout 对照在任务增加时退化。', sourceLocation: 'arXiv v2 §2.1，Figure 2A–B', sourceUrl: 'https://arxiv.org/html/1612.00796#S2.SS1', boundary: '此处概述原文曲线的定性趋势，不推测具体点值。' },
  C06: { id: 'C06', category: 'PAPER_RESULT', statement: '输入置换差异增大时，网络早期层的 Fisher overlap 降低；输出相同的任务仍可能复用靠近输出的层。', sourceLocation: 'arXiv v2 §2.1，Figure 2C；Appendix 4.3', sourceUrl: 'https://arxiv.org/html/1612.00796#S2.SS1', boundary: 'Fisher overlap 分析参数使用相似度，不是准确率指标。' },
  C07: { id: 'C07', category: 'PAPER_FACT', statement: 'Atari 实验中的 EWC 与任务识别、按任务经验回放和各层任务专属 gain/bias 一起构成更大的 DQN 系统。', sourceLocation: 'arXiv v2 §2.2；Appendix 4.2', sourceUrl: 'https://arxiv.org/html/1612.00796#S2.SS2', boundary: 'Atari 系统不是无回放系统，也不是 EWC 单一组件。' },
  C08: { id: 'C08', category: 'PAPER_FACT', statement: 'Atari 协议每次选择十款游戏，按随机顺序训练并允许游戏再次出现；总 human-normalized score 对每个游戏裁剪到 1。', sourceLocation: 'arXiv v2 §2.2；Appendix 4.2', sourceUrl: 'https://arxiv.org/html/1612.00796#S2.SS2', boundary: '总分上限为 10；结果跨十组游戏选择和每组四个随机种子平均。' },
  C09: { id: 'C09', category: 'PAPER_RESULT', statement: '作者报告 EWC 系统可以学习多款 Atari 游戏，但仍未达到十个独立 DQN 的分数。', sourceLocation: 'arXiv v2 §2.2，Figure 3A–B', sourceUrl: 'https://arxiv.org/html/1612.00796#S2.SS2', boundary: '限于论文采用的系统、游戏选择和训练协议。' },
  C10: { id: 'C10', category: 'AUTHOR_INTERPRETATION', statement: '作者指出 factorized Gaussian 和对角 Fisher 的点估计是显著弱点；Atari 参数扰动结果提示该估计可能低估不确定性。', sourceLocation: 'arXiv v2 §2.2 Figure 3C；§3 Discussion', sourceUrl: 'https://arxiv.org/html/1612.00796#S3', boundary: '这是作者对特定扰动实验的解释，并非所有 Fisher 估计都必然如此。' },
  C11: { id: 'C11', category: 'OUR_INTERPRETATION', statement: 'EWC 缓解参数干扰，但没有创造无限容量，也不保证每个新旧任务目标都能同时满足。', sourceLocation: '本文基于原文方法与结果的综合解释', sourceUrl: 'https://arxiv.org/html/1612.00796', boundary: '综合解读，不是论文中单独报告的实验结果。' },
  C12: { id: 'C12', category: 'FUTURE_WORK', statement: '作者提出 Bayesian neural networks 可能改进局部不确定性估计。', sourceLocation: 'arXiv v2 §3 Discussion', sourceUrl: 'https://arxiv.org/html/1612.00796#S3', boundary: '这是讨论中的方向，不是本文已验证的方法。' },
  F01: { id: 'F01', category: 'PAPER_FACT', statement: 'p(θ|D_A,D_B) ∝ p(D_B|θ) p(θ|D_A)。', sourceLocation: 'arXiv v2 §2，Equation (2)', sourceUrl: 'https://arxiv.org/html/1612.00796#S2', boundary: '省略与 θ 无关的归一化项。' },
  F02: { id: 'F02', category: 'PAPER_FACT', statement: 'L_EWC = L_B + (λ/2) Σᵢ Fᵢ(θᵢ−θ*ᵢ)²。', sourceLocation: 'arXiv v2 §2，Equation (3)', sourceUrl: 'https://arxiv.org/html/1612.00796#S2', boundary: 'Fᵢ 是所用对角近似中的旧任务精度/重要性权重。' },
  F03: { id: 'F03', category: 'OUR_INTERPRETATION', statement: '惩罚对 θᵢ 的导数为 λFᵢ(θᵢ−θ*ᵢ)，与新任务损失梯度相加。', sourceLocation: '对 Equation (3) 求导', sourceUrl: 'https://arxiv.org/html/1612.00796#S2', boundary: '优化器如何据此改变参数取决于具体更新规则。' },
  R01: { id: 'R01', category: 'PAPER_RESULT', statement: 'MNIST：每任务使用固定随机像素排列；Figure 2A 使用两层、每层 400 单元的全连接 ReLU 网络，每个数据集训练 20 个 epoch；比较 SGD、均匀二次约束和 EWC。', sourceLocation: 'arXiv v2 §2.1 Figure 2A；Appendix 4.1', sourceUrl: 'https://arxiv.org/html/1612.00796#S2.SS1', boundary: '原文以曲线显示测试表现，不在本页转录猜测值。' },
  R02: { id: 'R02', category: 'PAPER_RESULT', statement: 'MNIST 增加任务数时，Figure 2B 比较 EWC 与 SGD + dropout；Figure 2C 用 Fisher overlap 分析不同置换下的层间参数使用。', sourceLocation: 'arXiv v2 §2.1 Figure 2B–C；Appendices 4.1、4.3', sourceUrl: 'https://arxiv.org/html/1612.00796#S2.SS1', boundary: '两个面板回答不同问题；overlap 不是性能分数。' },
  R03: { id: 'R03', category: 'PAPER_RESULT', statement: 'Atari：十款游戏、十组游戏选择、每组四个随机种子；指标是各游戏 human-normalized score 裁剪至 1 后求和，EWC 在每款游戏至少训练 20 million frames 后启用。', sourceLocation: 'arXiv v2 §2.2 Figure 3A–B；Appendix 4.2', sourceUrl: 'https://arxiv.org/html/1612.00796#S2.SS2', boundary: '这是包含任务识别与经验回放的系统级比较。' },
  R04: { id: 'R04', category: 'AUTHOR_INTERPRETATION', statement: 'Breakout 扰动测试中，Fisher nullspace 方向扰动对分数的影响类似 inverse-Fisher 方向，作者据此认为当前不确定性估计可能过于自信。', sourceLocation: 'arXiv v2 §2.2 Figure 3C', sourceUrl: 'https://arxiv.org/html/1612.00796#S2.SS2', boundary: '定性描述作者对一次协议的解释，不概括为通用定理。' },
  I01: { id: 'I01', category: 'IMPLEMENTATION_MAPPING', statement: '通用实现可将 θ* 表示为参数对齐的 detached 快照，将 F 表示为不参与梯度计算的参数对齐缓冲区。', sourceLocation: '通用实现映射', boundary: '不是论文给出的代码变量名或 API。' },
  I02: { id: 'I02', category: 'IMPLEMENTATION_MAPPING', statement: '新任务步骤读取当前批次与 θ、θ*、F，计算总损失并反向传播，再由优化器更新当前可训练参数。', sourceLocation: '通用 autograd 实现映射', boundary: '具体优化器和存储结构由实现决定。' },
  T01: { id: 'T01', category: 'TEACHING_TOY', statement: '三参数向量用于计算 EWC penalty、梯度合并和一次 plain-SGD 步骤。', sourceLocation: '本教程教学玩具', boundary: '向量、F、λ、学习率和结果均非论文测量。' },
  T02: { id: 'T02', category: 'TEACHING_TOY', statement: '二维相关高斯示意图用于展示对角近似丢失的参数耦合。', sourceLocation: '本教程教学玩具', boundary: '相关值并非任何实验的后验估计。' },
  B03: { id: 'B03', category: 'GENERAL_BACKGROUND', statement: 'LwF 主要约束模型在输入上的输出行为；EWC 直接约束带重要性权重的参数偏移。', sourceLocation: '跨论文背景对照', boundary: 'LwF 不是 EWC 原论文中的实验基线。' },
};

export const TERMS: Record<string, { label: string; definition: string }> = {
  continual_learning: { label: '持续学习', definition: '任务按序到达，模型尝试保留较早任务能力。' },
  catastrophic_forgetting: { label: '灾难性遗忘', definition: '学习后续任务后，较早任务表现大幅下降。' },
  bayesian_posterior: { label: '后验分布', definition: '观察数据后，对参数可能取值的概率分布。' },
  fisher_information: { label: 'Fisher 信息', definition: 'EWC 用作局部敏感度/精度信息的统计量。' },
  diagonal_fisher: { label: '对角 Fisher', definition: '每个参数保留一个值，忽略参数间的非对角耦合。' },
  laplace_approximation: { label: 'Laplace 近似', definition: '在旧任务解附近用局部 Gaussian 近似复杂 posterior。' },
  anchor_parameters: { label: '参数锚点 θ*', definition: '较早任务结束后保存的参数参考值。' },
  ewc_penalty: { label: 'EWC 惩罚项', definition: '以 θ* 为中心、由 Fisher 加权的二次偏移成本。' },
  stability_plasticity: { label: '稳定性与可塑性', definition: '保留旧任务与适应新任务之间的目标权衡。' },
  permuted_mnist: { label: 'Permuted MNIST', definition: '每个任务对 MNIST 图片施加一组固定像素排列。' },
  fisher_overlap: { label: 'Fisher overlap', definition: '基于任务 Fisher 相似度分析参数使用是否重叠。' },
  experience_replay: { label: '经验回放', definition: '从先前交互样本缓冲区再次取样参与当前更新。' },
  function_regularization: { label: '函数空间约束', definition: '约束输入上的模型输出行为，而不是直接约束参数距离。' },
};
