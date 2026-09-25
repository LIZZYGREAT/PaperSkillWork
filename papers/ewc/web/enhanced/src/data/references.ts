import { EVIDENCE, TERMS, type EvidenceEntry } from './knowledge';

export type ReferenceKind = 'symbol' | 'formula' | 'dataset' | 'method' | 'claim' | 'evidence' | 'term';
export type ReferenceRequest = { cardId?: string };
export type ReferenceField = { label: string; value: string };
export type ReferenceEntry = {
  id: string;
  kind: ReferenceKind;
  title: string;
  summary: string;
  category: string;
  fields: ReferenceField[];
  evidenceIds: string[];
  pageIds: string[];
  relatedIds: string[];
  boundary?: string;
  sourceUrl?: string;
  keywords: string;
};

export const REFERENCE_KIND_LABELS: Record<ReferenceKind, string> = {
  symbol: '符号',
  formula: '公式',
  dataset: '实验 / 数据集',
  method: '方法',
  claim: '主张审计',
  evidence: '论文证据',
  term: '术语',
};

const symbols: ReferenceEntry[] = [
  {
    id: 'symbol:theta', kind: 'symbol', title: '当前参数 θ', summary: '正在由当前任务目标与优化器更新的模型参数。', category: '实现映射',
    fields: [{ label: '对象类别', value: '可训练参数集合' }, { label: '何时变化', value: '反向传播后由优化器步骤改变' }, { label: '常见混淆', value: '与保存的锚点 θ* 不同；同一任务步中只有当前可训练参数改变。' }],
    evidenceIds: ['F02', 'F03', 'I01', 'I02'], pageIds: ['update', 'lifecycle', 'synthesis'], relatedIds: ['symbol:theta-star', 'formula:ewc-objective'], keywords: 'theta 参数 权重 当前模型 optimizer optimizer step',
  },
  {
    id: 'symbol:theta-star', kind: 'symbol', title: '旧任务锚点 θ*', summary: '较早任务结束后保存的参数解，作为后续 EWC 惩罚的中心。', category: '实现映射',
    fields: [{ label: '对象类别', value: '与模型参数逐项对齐的 detached 快照' }, { label: '何时产生', value: '任务边界处保存先前任务解' }, { label: '何时读取', value: '计算后续任务的二次惩罚' }, { label: '常见混淆', value: '不是被冻结的当前参数，也不是旧数据。' }],
    evidenceIds: ['C02', 'F02', 'I01'], pageIds: ['fisher', 'update', 'lifecycle', 'synthesis'], relatedIds: ['symbol:theta', 'symbol:fisher'], keywords: 'theta star 锚点 旧参数 snapshot reference',
  },
  {
    id: 'symbol:fisher', kind: 'symbol', title: '对角 Fisher F', summary: 'EWC 用于近似局部后验精度 / 参数重要性的对角权重。', category: '论文方法事实',
    fields: [{ label: '对象类别', value: '非负、与参数逐项对齐的权重 / buffer' }, { label: '作用', value: '决定相同偏移对不同参数产生多大二次代价' }, { label: '近似边界', value: '只保留对角项，不显式表示参数间相关方向。' }],
    evidenceIds: ['C03', 'C10', 'F02'], pageIds: ['fisher', 'lifecycle', 'mnistResults', 'atari', 'synthesis'], relatedIds: ['symbol:theta-star', 'formula:ewc-objective'], keywords: 'Fisher importance 对角 精度 parameter importance',
  },
  {
    id: 'symbol:lambda', kind: 'symbol', title: '约束系数 λ', summary: '缩放旧任务惩罚整体强度的超参数。', category: '论文方法事实',
    fields: [{ label: '对象类别', value: '标量配置' }, { label: '作用', value: '调节稳定旧任务与适应新任务的权衡' }, { label: '梯度', value: '不是被训练的模型参数。' }],
    evidenceIds: ['F02', 'T01'], pageIds: ['fisher', 'update', 'synthesis'], relatedIds: ['formula:ewc-objective'], keywords: 'lambda regularization strength 超参数 trade off',
  },
  {
    id: 'symbol:task-data', kind: 'symbol', title: '任务数据 Dₖ', summary: '按序到达的任务训练数据；当前任务数据产生当前学习信号。', category: '论文方法事实',
    fields: [{ label: '旧任务数据', value: '后续 EWC penalty 使用保存的参数 / Fisher 参考，不把原始旧样本接入该二次项。' }, { label: '当前任务数据', value: '参与当前任务似然 / 损失和梯度计算。' }],
    evidenceIds: ['C01', 'C04', 'C07'], pageIds: ['overview', 'handoff', 'lifecycle', 'mnistProtocol', 'synthesis'], relatedIds: ['formula:bayes-handoff', 'symbol:theta'], keywords: 'D_A D_B task dataset 样本 数据',
  },
  {
    id: 'symbol:loss-b', kind: 'symbol', title: '当前任务损失 Lᴮ', summary: '当前任务 B 数据所定义的训练目标。', category: '论文方法事实',
    fields: [{ label: '梯度来源', value: '当前任务批次经模型前向和损失计算' }, { label: 'EWC 关系', value: '与 Fisher 加权的旧任务 penalty 相加后再求导。' }],
    evidenceIds: ['F02', 'F03'], pageIds: ['problem', 'update', 'lifecycle', 'synthesis'], relatedIds: ['formula:ewc-objective', 'symbol:theta'], keywords: 'L_B loss 新任务目标 gradient 当前批次',
  },
];

const formulas: ReferenceEntry[] = [
  {
    id: 'formula:bayes-handoff', kind: 'formula', title: '顺序 Bayes 后验交接', summary: '新任务后验正比于新任务似然乘上旧任务后验。', category: '论文公式',
    fields: [{ label: '表达式', value: 'p(θ | D_A,D_B) ∝ p(D_B | θ) · p(θ | D_A)' }, { label: '作用', value: '把较早任务的信息作为新任务的 prior factor。' }, { label: '边界', value: 'EWC 后续以局部近似表达旧后验，并不保存精确深度网络后验。' }],
    evidenceIds: ['C03', 'F01'], pageIds: ['handoff', 'synthesis'], relatedIds: ['symbol:task-data', 'formula:ewc-objective'], keywords: 'Bayes posterior prior equation 2 后验 先验',
  },
  {
    id: 'formula:ewc-objective', kind: 'formula', title: 'EWC 二次目标', summary: '当前任务损失加上由旧任务 Fisher 权重加权的参数偏移惩罚。', category: '论文公式',
    fields: [{ label: '表达式', value: 'L_EWC = L_B + (λ/2) Σ_i F_i(θ_i−θ*_i)²' }, { label: '变量', value: 'θ 当前参数 · θ* 旧任务锚点 · F 对角 Fisher · λ 约束强度' }, { label: '多任务形式', value: '对先前任务锚点与 Fisher 项求和。' }, { label: '结果', value: '软二次约束；参数仍可改变。' }],
    evidenceIds: ['C02', 'C03', 'F02'], pageIds: ['overview', 'fisher', 'update', 'lifecycle', 'synthesis'], relatedIds: ['symbol:theta', 'symbol:theta-star', 'symbol:fisher', 'symbol:lambda'], keywords: 'Equation 3 penalty quadratic EWC objective 目标',
  },
  {
    id: 'formula:combined-gradient', kind: 'formula', title: '合并梯度', summary: 'EWC penalty 的梯度与当前任务梯度相加。', category: '推导 / 实现映射',
    fields: [{ label: '表达式', value: 'g_total = g_B + λF ⊙ (θ−θ*)' }, { label: '下一步', value: '优化器根据总梯度更新当前可训练 θ。' }, { label: '参考状态', value: '该步不更新 θ* 和 F。' }],
    evidenceIds: ['F02', 'F03', 'I02'], pageIds: ['update', 'lifecycle', 'synthesis'], relatedIds: ['formula:ewc-objective', 'symbol:theta'], keywords: 'gradient derivative optimizer update backward 梯度求导',
  },
];

const datasets: ReferenceEntry[] = [
  {
    id: 'dataset:permuted-mnist', kind: 'dataset', title: 'Permuted MNIST', summary: '每个任务对应一组固定随机像素排列的持续分类基准。', category: '论文实验',
    fields: [{ label: '任务构造', value: '每个任务内所有图片使用相同的像素排列。' }, { label: '主要模型', value: 'Figure 2A：两层全连接 ReLU 网络，每层 400 个单元。' }, { label: '训练安排', value: 'Figure 2A 每个数据集训练 20 个 epoch；旧任务数据不再参与后续训练。' }, { label: '分析面板', value: 'Figure 2A–B 性能比较；Figure 2C Fisher overlap。' }],
    evidenceIds: ['C04', 'C05', 'C06', 'R01', 'R02'], pageIds: ['mnistProtocol', 'mnistResults', 'synthesis'], relatedIds: ['method:ewc', 'method:uniform', 'formula:ewc-objective'], keywords: 'MNIST dataset permutations fully connected ReLU 400 epochs',
  },
  {
    id: 'dataset:atari', kind: 'dataset', title: 'Atari 连续强化学习实验', summary: '任务感知 DQN 系统在多款 Atari 游戏上按序与重复顺序学习。', category: '论文实验',
    fields: [{ label: '任务协议', value: '每组选择 10 款游戏，按随机顺序训练并允许游戏再次出现。' }, { label: '系统组件', value: 'task recognition、per-task replay、task-specific gains/biases 与 EWC。' }, { label: '指标', value: 'human-normalized score 每款裁剪至 1 后求和，总上限为 10。' }, { label: '结果范围', value: 'EWC 系统学到多款游戏，但低于十个独立 DQN。' }],
    evidenceIds: ['C07', 'C08', 'C09', 'R03'], pageIds: ['atari', 'synthesis'], relatedIds: ['method:ewc', 'method:lwf'], keywords: 'Atari DQN games replay task recognition score',
  },
];

const methods: ReferenceEntry[] = [
  { id: 'method:ewc', kind: 'method', title: 'EWC', summary: '用旧任务参数解和 Fisher 加权二次惩罚保护重要参数的持续学习方法。', category: '论文方法事实', fields: [{ label: '约束对象', value: '参数空间中的偏移' }, { label: '旧任务状态', value: '锚点 θ* 与 Fisher 权重 F' }, { label: '旧数据重放', value: 'EWC penalty 本身不把原始旧任务数据接入当前目标。' }], evidenceIds: ['C02', 'C03', 'F02'], pageIds: ['overview', 'problem', 'fisher', 'update', 'lifecycle', 'synthesis'], relatedIds: ['method:uniform', 'method:lwf', 'formula:ewc-objective'], keywords: 'elastic weight consolidation parameter regularization', boundary: '不是零遗忘保证，也不是 Atari agent 的全部组成。' },
  { id: 'method:uniform', kind: 'method', title: '均匀二次约束', summary: '对所有参数相同强度地惩罚偏离旧解。', category: '对照方法', fields: [{ label: '与 EWC 的差别', value: '不使用参数间不同的 Fisher 权重。' }, { label: '风险', value: '可能同样限制与旧任务关系较弱的参数，妨碍新任务。' }], evidenceIds: ['C05', 'R01'], pageIds: ['problem', 'mnistProtocol', 'mnistResults'], relatedIds: ['method:ewc'], keywords: 'uniform penalty quadratic constraint baseline', boundary: 'Figure 2 所示比较范围内的对照，不等于所有统一正则算法。' },
  { id: 'method:sgd', kind: 'method', title: 'B-only SGD 对照', summary: '只优化当前任务损失，不加入旧任务保护项。', category: '对照方法', fields: [{ label: '当前信号', value: '∇L_B' }, { label: '风险', value: '没有旧任务误差信号，更新可能损害先前任务。' }], evidenceIds: ['C05', 'R01', 'R02'], pageIds: ['problem', 'mnistProtocol', 'mnistResults', 'atari'], relatedIds: ['method:ewc'], keywords: 'SGD B only plain gradient descent baseline', boundary: '是特定论文实验中的对照，不代表所有无正则优化器表现相同。' },
  { id: 'method:lwf', kind: 'method', title: 'LwF（跨论文参照）', summary: 'LwF 主要在输出 / 函数空间约束旧任务响应；EWC 在参数空间惩罚重要参数偏移。', category: '一般背景', fields: [{ label: 'EWC 约束对象', value: '带 Fisher 权重的参数距离。' }, { label: 'LwF 约束对象', value: '模型在输入上的旧任务输出响应。' }, { label: '实验关系', value: 'LwF 不是 EWC 原论文的对照基线。' }], evidenceIds: ['B03'], pageIds: ['atari', 'synthesis'], relatedIds: ['method:ewc'], keywords: 'Learning without Forgetting function space outputs distillation', boundary: '背景对照，不是 EWC 原论文实验结论。' },
];

const claims: ReferenceEntry[] = [
  { id: 'claim:mitigates-not-eliminates', kind: 'claim', title: 'EWC 缓解干扰，但不保证零遗忘', summary: '论文实验支持有限设置中的保持与学习权衡；不能推出对任意序列完全无遗忘。', category: '主张边界', fields: [{ label: '判断', value: '支持有限协议中的缓解；“保证完全不遗忘”过强。' }, { label: '相关证据', value: 'C05、C09、C11' }], evidenceIds: ['C05', 'C09', 'C11'], pageIds: ['mnistResults', 'atari', 'synthesis'], relatedIds: ['method:ewc', 'dataset:permuted-mnist', 'dataset:atari'], boundary: '不把两个实验概括为对所有模型、任务或数据流的保证。', keywords: 'claim conclusion zero forgetting guarantee catastrophic forgetting' },
  { id: 'claim:no-llm-evidence', kind: 'claim', title: '原论文没有 LLM 实验', summary: '原文的核心实证是 Permuted MNIST 与 Atari 系统，不直接验证大语言模型。', category: '主张边界', fields: [{ label: '判断', value: '把原结果说成验证 EWC 对 LLM 有效，超出证据。' }, { label: '相关证据', value: 'C04–C09' }], evidenceIds: ['C04', 'C07', 'C09'], pageIds: ['atari', 'synthesis'], relatedIds: ['dataset:permuted-mnist', 'dataset:atari'], boundary: '其他工作可能研究 EWC 与 LLM；该卡只描述这篇论文。', keywords: 'LLM large language model foundation model claim' },
];

function evidenceCategory(entry: EvidenceEntry) {
  const labels: Record<string, string> = {
    PAPER_FACT: '论文事实', PAPER_RESULT: '论文结果', AUTHOR_INTERPRETATION: '作者解释',
    OUR_INTERPRETATION: '本文解读', IMPLEMENTATION_MAPPING: '实现映射', TEACHING_TOY: '教学玩具',
    GENERAL_BACKGROUND: '一般背景', FUTURE_WORK: '未来方向',
  };
  return labels[entry.category] ?? entry.category;
}

function pageIdsForEvidence(id: string) {
  const map: Record<string, string[]> = {
    C01: ['overview', 'problem'], C02: ['problem', 'fisher', 'update', 'lifecycle'], C03: ['handoff', 'fisher', 'lifecycle'],
    C04: ['mnistProtocol'], C05: ['mnistResults', 'synthesis'], C06: ['mnistResults'],
    C07: ['atari', 'synthesis'], C08: ['atari'], C09: ['atari', 'synthesis'], C10: ['fisher', 'atari'],
    C11: ['atari', 'synthesis'], C12: ['atari'], F01: ['handoff'], F02: ['fisher', 'update', 'lifecycle', 'synthesis'], F03: ['update', 'synthesis'],
    R01: ['mnistProtocol', 'mnistResults'], R02: ['mnistProtocol', 'mnistResults'], R03: ['atari'], R04: ['atari'],
    I01: ['update', 'lifecycle'], I02: ['update', 'lifecycle'], T01: ['update'], T02: ['fisher'], B03: ['atari'],
  };
  return map[id] ?? ['synthesis'];
}

const evidenceEntries: ReferenceEntry[] = Object.values(EVIDENCE).map((item) => ({
  id: `evidence:${item.id}`, kind: item.category === 'OUR_INTERPRETATION' ? 'claim' : 'evidence',
  title: item.id, summary: item.statement, category: evidenceCategory(item),
  fields: [{ label: '来源位置', value: item.sourceLocation }, { label: '证据类别', value: evidenceCategory(item) }, { label: '边界', value: item.boundary }],
  evidenceIds: [], pageIds: pageIdsForEvidence(item.id), relatedIds: [], boundary: item.boundary, sourceUrl: item.sourceUrl,
  keywords: `${item.id} ${item.category} ${item.statement} ${item.sourceLocation} ${item.boundary}`,
}));

const terms: ReferenceEntry[] = Object.entries(TERMS).map(([id, item]) => ({
  id: `term:${id}`, kind: 'term', title: item.label, summary: item.definition, category: '术语',
  fields: [{ label: '定义', value: item.definition }, { label: '本教程中的作用', value: '帮助解释 EWC 的问题、近似、运行状态或证据。' }],
  evidenceIds: [], pageIds: termPageIds(id), relatedIds: [], keywords: `${id} ${item.label} ${item.definition}`,
}));

function termPageIds(id: string) {
  const map: Record<string, string[]> = {
    continual_learning: ['overview', 'problem'], catastrophic_forgetting: ['overview', 'problem'],
    bayesian_posterior: ['handoff'], fisher_information: ['fisher'], diagonal_fisher: ['fisher', 'atari'],
    laplace_approximation: ['fisher'], anchor_parameters: ['update', 'lifecycle'], ewc_penalty: ['update', 'lifecycle'],
    stability_plasticity: ['problem', 'synthesis'], permuted_mnist: ['mnistProtocol', 'mnistResults'],
    fisher_overlap: ['mnistResults'], experience_replay: ['atari'], function_regularization: ['atari'],
  };
  return map[id] ?? [];
}

export const REFERENCE_PAGES: Record<string, string> = {
  overview: '研究问题与论文导读', problem: '为什么任务 B 会覆盖任务 A？', handoff: '任务 A 的信息怎样传给 B？',
  fisher: 'Fisher 怎样决定参数偏移代价？', update: '一次 EWC 更新到底改变什么？', lifecycle: '任务边界上的状态如何流转？',
  mnistProtocol: 'Permuted MNIST 如何构造？', mnistResults: 'MNIST 结果支持哪些结论？', atari: 'Atari 结果属于整个系统', synthesis: '综合结论与 EWC 全流程',
};

export const ALL_REFERENCE_ENTRIES: ReferenceEntry[] = [...symbols, ...formulas, ...datasets, ...methods, ...claims, ...evidenceEntries, ...terms];
export const REFERENCE_ENTRY_BY_ID = new Map(ALL_REFERENCE_ENTRIES.map((entry) => [entry.id, entry]));

export function resolveReferenceId(id: string) {
  if (REFERENCE_ENTRY_BY_ID.has(id)) return id;
  if (REFERENCE_ENTRY_BY_ID.has(`evidence:${id}`)) return `evidence:${id}`;
  if (REFERENCE_ENTRY_BY_ID.has(`term:${id}`)) return `term:${id}`;
  return id;
}
