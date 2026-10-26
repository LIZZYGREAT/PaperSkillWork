# Learning Spine: Dark Experience for General Continual Learning: a Strong, Simple Baseline

Paper ID: der

## Overall Reading Goal

读者完成后应能解释：在没有任务边界且记忆受限时，DER 如何用留存输入上的历史 logits 约束当前分类器；DER++ 如何额外加入历史标签监督；Reservoir 如何决定哪些流样本仍在缓冲区；以及从空缓冲区、一次参数更新、写入/替换、跨轮状态传递直到预测的完整次序。教学对象假设已经熟悉分类、交叉熵、SGD、回放和持续学习中的遗忘问题；只回忆所需术语，不把用户本机笔记作为读者必须取得的材料。

## Primary Learning Spine

问题约束 → 历史函数行为 → 有限记忆如何延续 → DER 与 DER++ 的一次更新 → 从空池贯通到预测 → 条件化解释实验与局限

## Priority Matrix

YAML 是唯一的阶段/优先级来源。核心概念各有一个主要讲解位置；后续只恢复变量和结论，不重复完整推导。

```yaml
stages:
  - id: S1
    question: '训练和测试不能依赖任务边界/任务 oracle、且不能无限保存数据时，DER 要解决的遗忘问题是什么？'
  - id: S2
    question: '为什么把旧网络在历史输入上的输出作为目标，可以比保留旧教师网络更适合有限记忆？'
  - id: S3
    question: '没有任务结束信号时，固定容量记忆如何在长数据流中选留样本？'
  - id: S4
    question: 'DER 一步怎样合并当前学习和旧行为约束，DER++ 又增加了什么？'
  - id: S5
    question: '局部机制如何构成从空记忆开始、更新模型、改变缓冲区、延续到下一批并预测的完整系统？'
  - id: S6
    question: '实验结果支持哪些有限结论，哪些协议、分析和例外必须一起说明？'
items:
  - id: I01
    title: 'GCL 约束与遗忘缺口'
    priority: CORE
    stage: S1
    placement: mainline
    evidence_refs: [C01]
  - id: I02
    title: '历史 logits 与 DER 的函数匹配目标'
    priority: CORE
    stage: S2
    placement: mainline
    evidence_refs: [C02, C10]
  - id: I03
    title: 'Reservoir、容量 K、记忆 M 与计数 N'
    priority: CORE
    stage: S3
    placement: mainline
    evidence_refs: [C06, M03, I01]
  - id: I04
    title: '一次 DER/DER++ 训练更新的真实读写顺序'
    priority: CORE
    stage: S4
    placement: mainline
    evidence_refs: [C02, C03, C04, C05, M02, M04]
  - id: I05
    title: '空池起步到预测的完整算法贯通'
    priority: CORE
    stage: S5
    placement: mainline
    evidence_refs: [M01, C04, C05, C06, M03, M05]
  - id: I06
    title: '带协议和边界的结果解释'
    priority: CORE
    stage: S6
    placement: mainline
    evidence_refs: [R01, R02, R03, R04, R05, R07, R08, R09, C07, C08, C09, I02]
  - id: I07
    title: 'CE 与 logits 平方距离的短直觉，再落到 Eq. (5)'
    priority: SUPPORTING
    stage: S2
    placement: compact-inline
    evidence_refs: [C02, C10]
  - id: I08
    title: 'K/n 留存概率及其条件'
    priority: SUPPORTING
    stage: S3
    placement: expandable
    evidence_refs: [C06, M03]
  - id: I09
    title: '标注为合成教学例子的 K=2 三样本 reservoir 轨迹'
    priority: SUPPORTING
    stage: S5
    placement: expandable
    evidence_refs: [C06, M01, M03]
  - id: I10
    title: 'Task-IL 测试任务身份例外'
    priority: SUPPORTING
    stage: S6
    placement: compact-inline
    evidence_refs: [C07]
  - id: I11
    title: '主表逐行数值、配置与 ± 原样记录'
    priority: REFERENCE
    stage: null
    placement: Evidence details
    evidence_refs: [R01, R02, R03, R04, R05, I02, C09]
  - id: I12
    title: 'Figure 2 分析与 ghost-class 作者猜想'
    priority: REFERENCE
    stage: null
    placement: Evidence details
    evidence_refs: [AI01, AI02, AI03]
  - id: I13
    title: 'Appendix Tables 4–8 的补充指标'
    priority: REFERENCE
    stage: null
    placement: Evidence details
    evidence_refs: [R07, R08, R09]
  - id: I14
    title: '全面复述其他持续学习方法的算法和历史'
    priority: DELETE
    stage: null
    placement: none
    evidence_refs: []
  - id: I15
    title: '完整 KL 二阶展开、Fisher 迹恒等式或从反向传播开始的数学课程'
    priority: DELETE
    stage: null
    placement: none
    evidence_refs: []
  - id: I16
    title: '在每一段重复 Eq. (5)、Eq. (6) 和完整 Algorithm 1–3'
    priority: DELETE
    stage: null
    placement: none
    evidence_refs: []
```

## Reader's Causal Path

读者先带着持续学习的基本问题进入：新数据会推动参数改变，旧任务表现因此可能丢失；而 GCL 进一步要求学习与测试不倚赖任务边界或任务 oracle，并把可存数据限制在有限记忆里（S1）。完整保存历史数据并反复重训不符合这个约束。这里先界定问题和评测约束，不把标准 Class-IL、Task-IL、Domain-IL 的实验流程误说成同一种无边界流。

有了“旧行为需要被保留”这个缺口，才引出函数输出。论文先由旧模型输出的 KL 蒸馏动机，转向有限输入样本和单一 reservoir，再得到 Eq. (5) 的历史 logits 平方距离。读者只需理解当前网络在相同历史输入上的输出要靠近一个冻结目标；不需要保存每个旧模型，也不把 KL 与平方距离说成无条件严格等价（S2）。这一结论产生了具体的记忆记录问题：哪些输入和目标值能留到未来？

固定容量 reservoir 用流样本位置而非任务结束来管理记忆。S3 首次区分容量 K、容器 M 和已处理项数 N，解释填满前追加、填满后按 Algorithm 3 的抽样逻辑替换；Appendix D 给出 K/n 的边际留存概率。样本级均匀抽样不保证类别均衡，也不保证某个样本永久留下。该机制提供可用的旧输入后，才具备解释训练更新的条件。

S4 从一次已有旧记忆的训练步骤建立局部因果：先从写入前的 M 采样，增强当前输入与回放输入，以当前参数计算 logits；DER 组合当前标签 CE 和冻结历史 logits 的匹配损失。DER++ 通过第二次分开的采样调用增加旧标签 CE，两组样本允许重叠。所有损失合入同一网络的一次更新，随后才写入当前数据，并保存参数更新前计算的历史目标。此处讲清对象与次序，但不把它伪装成完整的空池执行过程。

接着 S5 独立承担系统级整合，而不是把 S2–S4 图解拼接：从 θ、M=空、N=0 开始，第一批跳过未定义的回放支路（这是项目补全），只用当前 CE；保存更新前 logits，在一次参数更新后将候选记录放入记忆。第二批开始先读已有 M，再计算损失、更新参数、最后写入。容量 K=2 的三样本小轨迹用于展示填充与随机替换分支，必须标注为合成教学例子、不是论文数据。每轮的 θ、M、N 传给下一轮，旧 z 不刷新，也不创建旧教师；完整流结束后由当前模型做预测，普通预测不读取训练缓冲区，Task-IL 的任务身份仅作为协议限定候选类别的例外。

S6 回到证据：主表只能支持对应数据集、容量、骨干、训练轮数和评估协议下的报告结果。CIFAR-10 Class-IL、Tiny ImageNet Class-IL 与 MNIST-360 的实例显示优势可能明显；CIFAR-10 Task-IL 中 DER 未超过 ER，若干容量/协议下 DER++ 也未占优。MNIST-360 在整段流完成后评估，不能借它声称逐步测试。Figure 2 的平坦性与校准观察是特定实验分析；ghost-class 是作者猜想；记忆有限也不等于类别均衡或永不遗忘。保留 ± 原记号，不替论文补写未说明的统计定义。

## Cognitive Dependencies

| 概念 | 唯一主讲位置 | 后续恢复方式 | 延后内容与重复边界 |
| --- | --- | --- | --- |
| GCL 任务边界、oracle、有限记忆约束 | S1 | S4/S5 只简短回顾“无边界/旧数据有限” | S1 只界定 GCL；标准 benchmark 的 Task-IL 例外留到 S6 |
| 当前输出 hθ 与历史目标 z | S2 | S4/S5 用已定义的符号 | S2 解释目标的意义；后续不重新推导教师到 Eq. (5) |
| K、M、N 与留存概率 | S3 | S5 用同一对象完整追踪 | 只在 S3 解释 reservoir 概率；S5 重演其分支，不重证证明 |
| 当前 CE、logit 匹配与 DER++ 标签 CE | S4 | S5 用项名恢复 | S4 给局部目标与双采样；S5 不再逐项推导 Eq. (5)/(6) |
| 空池补全、更新前 z、更新后写入、预测 | S5 | S6 只关联评估时机 | S5 声明哪些是原文、规范化整理或教学补全；不把预测伪代码说成原文算法 |
| 数据集、容量、Task-IL、MNIST-360 测试时机和结果边界 | S6 | Reference 项可按需查 | 不把 Table 2/3 的比较提前当作机制因果证明 |

读者需要的记忆负担控制在变量与结论级：每个概念有一个主讲位置；当完整算法重新使用这些概念时只提示其来源，不再次从头教一次。

## Mathematical Expression Strategy

1. 先用分类问题的已知交叉熵作锚，再解释 logits 是 softmax 前的类别分数。历史 z 是入池时产生的固定数值；当前 hθ(x) 会随参数更新。只有这两个对象分清后才写 Eq. (5)。
2. Eq. (2)–(4) 只作为论证桥梁：教师函数输出 → 有限历史输入 → 单一记忆采样。说明动机，不要求完整 KL 微积分、Taylor 展开或教师网络实现。随后用 Eq. (5) 说明当前标签 CE 与历史输出平方距离是两个目标；需保留旧 z 的坐标和目标值。
3. DER++ 到读者理解 DER 两项以后再写 Eq. (6)：新旧标签都经分类损失，历史标签 CE 是新增的 β 项，使用第二次记忆采样。以项的来源解释 α/β，不先推导整页符号。
4. Reservoir 先用容量 K、已看项数 N 和长度不超过 K 的 M 说清追加/替换，再写 n≥K 时 K/n 的边际概率。需要把一个小随机分支展开到 j∈{0,…,N}，并说明类别不均衡的边界。这个计数记号属于披露过的规范化表达。
5. 更新只介绍一次联合目标的一次 SGD；把原算法印刷的加号及 W2 采用下降减号的理由放在一个简短的源文消歧说明中。不要让读者把排印差异当成算法新增组件。
6. Section 5 的经验 Fisher、扰动损失与 ECE 作为结果分析的概念提示，放在 S6 或证据参考；不教成 DER 训练公式，也不在主线完整证明 Fisher 恒等式。

## Complete Algorithm Integration

S5 必须是一个有独立系统目标的完整演练。读者进入前已经知道 GCL 约束、历史 logits、reservoir 以及 DER/DER++ 的单步损失；此处把这些对象放回 W2 的真实时间顺序：

1. 初始化当前参数 θ₀、固定容量 K、空记忆 M、计数 N=0；没有旧教师。流中的原始输入和标签作为候选，输出类别坐标在该基准中一致。
2. 若 M 为空，跳过两条历史回放损失，仅计算当前标签 CE。这是明确标注的教学/实现补全；不是声称原文 Algorithm 1/2 明示了空池分支。
3. 若 M 非空，先从写入前的 M 采样输出匹配组；DER++ 再调用一次 sample 取标签组，两组可能重叠。按原文流程增强当前和回放输入，计算当前 logits、历史输出匹配，以及 DER++ 的可选标签 CE。
4. 所有当步损失合成后对同一当前模型做一次参数更新。历史 z 保持冻结；当前候选 z 在本步参数更新前计算，并复制为持久数值。
5. 更新之后逐条处理当前批的候选：若 N<K，追加；否则抽取闭区间 [0,N] 中的整数 j，若 j<K 则替换 M[j]，否则丢弃候选；每条流记录随后令 N 增加 1。使用 K 表示容量、M 表示容器、N 表示旧计数是披露的规范化解释。原文符号/计数差异见 M03。
6. 贯穿小例子：标注为“合成教学例子”的 K=2 数据流 x₁,x₂,x₃。x₁ 时 M 为空，仅当前 CE；更新后存入 (x₁,z₁)，N=1。x₂ 时先从一项 M 取回放，再更新，随后追加候选，记忆有两项且 N=2。x₃ 时先从这两项中回放并更新；候选进入 reservoir 时从 {0,1,2} 抽 j，j=0 或 1 时替换相应槽位，j=2 时不替换；最后 N=3。因此第三项被纳入的概率是 2/3。每个输入 z 都来自各自入池那一步更新前的模型。DER++ 另有标签 CE 与第二采样调用，但训练回放仍在当前写入之前。
7. 后续批次继承新的 θ、M、N，不把历史 z 重算。训练结束后执行当前模型预测；预测读 θ 和评测输入，不读 M、不更新 N。Task-IL 允许按任务身份限制类别，GCL/Class-IL/Domain-IL 则遵照各自不提供该 oracle 的协议。论文实际 MNIST-360 指标在整流结束后报告。

原文印刷算法不一致、计数规范化、空池分支和预测入口都要在完整演练中维持标签；完整算法不是逐页脚本，也不是页面布局、动画或组件方案。

## Human Review

W4 尚未通过人工审核；当前主线等待用户复核。审核通过后再用阶段 CLI 记录 reviewer 和 note。W5 页面/视觉设计与 W5 之后的工作均不在本轮范围。

请重点复核：读者背景假设是否合适；S1→S6 因果顺序是否自然；Eq. (2)–(6) 和 reservoir 概率是否在需要时出现；完整算法是否覆盖 W2 的真实次序及所有跨轮状态；K=2 是否清楚标明为合成例子；S6 是否同时保留结果优势、反例、评测协议和作者分析边界；CORE 是否只留下理解 DER 主机制所需内容。