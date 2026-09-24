import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Overcoming catastrophic forgetting in neural networks',
    titleZh: 'EWC：克服神经网络的灾难性遗忘',
    venue: 'PNAS · 2017',
    authors: 'James Kirkpatrick 等 14 位作者',
    affiliation: 'DeepMind；Imperial College London',
    domain: '持续学习 · 神经网络 · 强化学习',
    coreProblem: '网络顺序学习新任务时，更新共享参数会破坏旧任务能力；旧数据又未必能持续访问。',
    coreInsight: '估计旧任务对每个参数的敏感程度，并用对角 Fisher 对旧参数解施加软二次约束。',
    keywords: ['持续学习', 'Fisher 信息', '贝叶斯近似'],
  },
  hero: {
    oldMethod: {
      desc: '只按新任务损失更新：参数能快速适应 B，但也可能离开 A 的低误差区域。对所有参数施加相同约束，则可能让 B 难以学好。',
    },
    newMethod: {
      desc: 'EWC 将上一任务的解与对角 Fisher 作为参考状态。新任务仍更新共享参数，但旧任务更重要的参数移动代价更高。',
    },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '同一组参数，为什么会遗忘？', badge: 'inf', badgeLabel: '问题',
      bridge: '先看任务 A 与 B 如何争用同一个参数向量；保护旧任务和学习新任务是两个同时存在的目标。',
      analogy: { title: '局部比喻：弹簧只画约束强度', text: '后面会用弹簧示意“偏离旧参数需要付出代价”。弹簧不是算法本身，也不能替代 Fisher 的定义。' },
      modules: [{ kind: 'module', id: '1.1', title: '选择训练信号', desc: '切换 B-only、统一约束和 EWC 示意，辨认每种目标里有哪些信号。图示不表示测得的精度曲线。', componentId: 'method-compare' }],
      insight: 'EWC 不是冻结旧参数，而是为不同参数设置不同的偏移代价。',
      formula: { lead: '先把问题写成目标函数：', unicode: 'L_B(θ)  +  old-task constraint', symbols: [{ sym: 'L_B', desc: '当前新任务 B 的损失。' }, { sym: 'θ', desc: '会被当前优化步骤更新的参数。' }] },
      takeaways: [
        { icon: '↻', title: '任务按顺序到达', desc: '新任务到来时，旧任务的数据可能不再用于训练。' },
        { icon: '⚖', title: '保护也有代价', desc: '约束太弱会遗忘；约束太强会妨碍学习新任务。' },
        { icon: '◎', title: '需要参数级权重', desc: '核心问题转为：哪些旧参数更值得保护？' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: '任务 A 的信息如何传给 B？', badge: 'inf', badgeLabel: '概率视角',
      bridge: '贝叶斯视角提供了顺序学习的结构：旧任务后验成为新任务的先验因子。',
      analogy: { title: '对象交接', text: '任务 A 结束后，B 不再读取 A 的样本；理论推导保留的是 p(θ | D_A) 这一后验信息。' },
      modules: [{ kind: 'module', id: '2.1', title: '推进后验交接', desc: '逐步检查 A 的数据、旧后验与 B 的似然分别出现在哪里。', componentId: 'handoff-stage' }],
      formula: { lead: '顺序 Bayes（常数项省略）：', unicode: 'p(θ | D_A, D_B) ∝ p(D_B | θ) · p(θ | D_A)', symbols: [{ sym: 'D_A', desc: '较早任务 A 的数据。' }, { sym: 'D_B', desc: '当前任务 B 的数据。' }, { sym: 'p(θ|D_A)', desc: 'A 学完后的参数后验，接下来充当先验因子。' }] },
      takeaways: [
        { icon: 'A', title: 'A 的数据形成后验', desc: '旧任务信息在理论上体现在参数后验中。' },
        { icon: 'B', title: 'B 提供新的似然', desc: '新任务目标与旧后验一起决定新的参数解。' },
        { icon: '…', title: '完整后验太复杂', desc: 'EWC 接下来要构造可计算的局部近似。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-3', title: 'Fisher 如何决定“少动谁”？', badge: 'both', badgeLabel: '近似机制',
      bridge: '上一任务解是二次约束的中心；对角 Fisher 近似局部精度，为参数分别设置约束强度。',
      analogy: { title: '弹簧边界', text: '同样的参数偏移，较大的 F_i 会对应更高的二次代价。它仍是软约束，参数可以移动。' },
      modules: [{ kind: 'module', id: '3.1', title: '改变参数偏移', desc: '选择一个教学参数并调节偏移，查看二次惩罚与恢复梯度如何计算。数值是示例，不是论文 Fisher。', componentId: 'importance-explorer' }],
      insight: '对角近似只保留每个参数单独的权重；它没有表达参数之间的相关方向。',
      formula: { lead: '对角 Fisher 作为局部精度：', unicode: 'F ≈ diag(F₁, …, Fₙ)', symbols: [{ sym: 'F_i', desc: '参数 i 的 Fisher 对角元素，作为局部重要性/精度权重。' }, { sym: 'diag', desc: '只保留矩阵对角线，舍弃非对角耦合。' }] },
      takeaways: [
        { icon: 'F', title: '不是看参数大小', desc: '惩罚强度由 Fisher 权重决定，不由权重绝对值直接决定。' },
        { icon: '↔', title: '偏移仍然允许', desc: '偏移会产生按重要性加权的代价与恢复方向。' },
        { icon: '▦', title: '对角线有边界', desc: '它省下计算与存储，却忽略参数间的耦合。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-4', title: '一次训练步里，究竟更新什么？', badge: 'trn', badgeLabel: '优化',
      bridge: '重要性、锚点和当前任务损失汇入同一个可微目标；只有优化器步骤实际改写当前参数。',
      analogy: { title: '回拉不是冻结', text: '弹簧的斜率随 λF_i 改变；它对梯度施加回拉信号，不会直接把参数锁死。' },
      modules: [{ kind: 'module', id: '4.1', title: '调节 λ 并计算一步', desc: '使用固定的教学玩具向量计算 penalty、总梯度和一次 plain-SGD 更新。', componentId: 'update-calculator' }],
      formula: { lead: '论文 Equation (3)：', unicode: 'L_EWC = L_B + (λ/2) Σ_i F_i (θ_i − θ*_i)²', symbols: [{ sym: 'θ*_i', desc: '上一任务结束时保存的参数锚点。' }, { sym: 'λ', desc: '控制旧任务约束整体强度的系数。' }, { sym: 'L_B', desc: '当前任务 B 的损失。' }] },
      takeaways: [
        { icon: '＋', title: '总损失相加', desc: '新任务损失与旧任务的加权二次项共同参与求导。' },
        { icon: '∇', title: '惩罚贡献梯度', desc: '每个参数获得 λF_i(θ_i−θ*_i) 的回拉项。' },
        { icon: '↗', title: '优化器更新 θ', desc: '锚点 θ* 与 Fisher F 是参考状态，不由该步更新。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-5', title: 'Permuted MNIST 验证了什么？', badge: 'both', badgeLabel: '证据',
      bridge: '用每个任务固定的像素置换构造连续分类任务，比较遗忘、均匀保护与按参数保护。',
      analogy: { title: '任务输入映射', text: '每个任务对所有图像使用同一随机像素排列；任务难度相近，但输入映射不同。' },
      modules: [{ kind: 'module', id: '5.1', title: '检查实验协议与主张', desc: '切换任务构造、基线对照和 Fisher 重叠三个证据卡。曲线只作文字概述，不填写猜测值。', componentId: 'mnist-evidence' }],
      takeaways: [
        { icon: '⌁', title: '置换在任务内固定', desc: '同一任务中的图像共享像素排列，不是每张图都另行打乱。' },
        { icon: '≠', title: '对比对应不同问题', desc: '性能曲线比较保留与学习；Fisher overlap 分析参数使用相似度。' },
        { icon: '!', title: '结果有协议边界', desc: '不外推为任意任务、任意网络或零遗忘保证。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-6', title: 'Atari 结果属于哪个系统？', badge: 'both', badgeLabel: '边界',
      bridge: '强化学习实验中的 EWC 是组合系统的一部分。读结果时要辨认任务识别、经验回放与任务专属参数。',
      analogy: { title: '从算法到系统', text: 'EWC 约束共享参数；它不负责判断当前游戏，也不负责存取每个任务的经验缓冲区。' },
      modules: [
        { kind: 'module', id: '6.1', title: '拆开 Atari 组件', desc: '选择系统组件，检查它属于 EWC 还是更大的 DQN agent。', componentId: 'atari-system' },
        { kind: 'module', id: '6.2', title: '读结果边界', desc: '核对指标、任务数和证据范围，避免把系统级结果说成 EWC 单项效果。', componentId: 'claim-boundary' },
      ],
      insight: '作者指出 factorized Gaussian 与 diagonal Fisher 是显著近似；扰动测试提示 Fisher 可能低估某些参数的不确定性。',
      formula: { lead: 'Atari 总分：', unicode: 'Σ_game min(human-normalized score, 1)   (上限 10)', symbols: [{ sym: '10', desc: '每次实验选择十个游戏，单游戏分数裁剪至 1，合计最大为 10。' }] },
      takeaways: [
        { icon: '▤', title: '系统不只有 EWC', desc: '还有 task recognition、per-task replay 与游戏专属 gain/bias。' },
        { icon: '↗', title: '学到多款游戏', desc: '论文报告 EWC 系统能学多款游戏，但仍低于十个独立 DQN。' },
        { icon: '⋯', title: '近似会失准', desc: '实验不证明无限容量、零遗忘或现代大模型效果。' },
      ],
    },
  ],
};
