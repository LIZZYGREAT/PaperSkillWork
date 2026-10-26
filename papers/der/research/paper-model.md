# Paper Model: Dark Experience for General Continual Learning: a Strong, Simple Baseline

Paper ID: `der`。状态：W2 模型形成，**待用户语义评审，未记录人工 PASS**。

唯一原文：[arXiv:2004.07211v2](https://arxiv.org/abs/2004.07211v2)，2020-10-22，NeurIPS 2020，Pietro Buzzega、Matteo Boschini、Angelo Porrello、Davide Abati、Simone Calderara。本地 PDF 共 24 页，含正文、参考文献、附录 A–G；SHA-256 为 `e7dcafb05e9fd77e0524be8b98578cd884a9fe6455322beb2f4a6c4a383cd72e`。本文页码均为该 PDF 页码，与印刷页码一致。完整提取、图表和定位分别见 [content.md](../source-cache/content.md)、[manifest.json](../source-cache/manifest.json)、[evidence.json](../source-cache/evidence.json)。本模型处理原始 DER 及同篇 DER++。

## Core Explanation

持续学习中，只拟合眼前数据会破坏旧任务能力，而完整保留旧数据并重训代价太高。DER 用有界缓冲区保留原始输入及其在训练途中的历史 logits；每次学习当前数据时，再让当前网络在回放输入上的输出接近这些固定历史值。Reservoir Sampling 使记录选取不依赖任务结束信号。DER++ 额外保存标签并加入历史样本分类损失，缓和历史输出自身可能出错的问题。作者用标准 CL 基准及包含突变/渐变分布的 MNIST-360 验证其竞争力；方法缓解遗忘，并不保证每个历史任务的损失永不增加。（§1–3，pp. 1–4，Eq. 5–6。）

## Problem

§3 先用任务分布 $D_1,\ldots,D_T$ 表达理想风险之和，但执行不要求输入任务编号。历史分布已不可完整访问，当前网络必须在学习新输入时保留旧分类行为。GCL 要求训练不依赖任务边界、测试不依赖任务 oracle、记忆有界（pp. 1–2，Table 1，Appendix A）。这不等于所有标准实验均为无边界单遍流：§4 仍按任务组织标准数据，并向需要边界的基线提供边界；Task-IL 还允许测试任务 ID。

目标是学习分类函数，不是重建旧数据或维护每任务独立网络。论文没有给出任意无限增类系统的完整工程协议；比较历史 logits 要求输出类别坐标一致。

## Core Insight

旧行为可在历史输入上通过函数值约束保留，而不直接锁定旧参数。论文从任务末尾教师的 KL 目标（Eq. 2）出发，经有限样本记忆（Eq. 3）转向单一 reservoir（Eq. 4），最后采用 pre-softmax 平方距离（Eq. 5）。各条历史目标来自不同优化时刻，不需要保存对应旧教师参数，也不必等待任务收敛才记录。DER++ 的标签回放是额外目标（Eq. 6），不是 DER 隐含的一部分。（§3–3.1，pp. 3–4。）

## Prerequisites

依据用户笔记，GEM、iCaRL、LwF、EWC 已是阅读背景；这不是需要重新完整教授的课程列表。

| Concept | Required / Helpful / Optional | Depth needed |
| --- | --- | --- |
| logits、softmax、CE、反向传播、SGD | Required | 区分历史常量与可训练输出，理解联合损失更新同一网络 |
| 回放与 Reservoir Sampling | Required | 按数据项留存、计数、读写顺序；不保证类别均衡 |
| 蒸馏与函数输出约束 | Required | 不同目标可来自不同时刻，不需要常驻教师 |
| KL 与平方距离、softmax 平移不变性 | Helpful | 条件性近似不等于任意 logits 上的严格等价 |
| 数据增强与一致性 | Helpful | 重新增强仍匹配同一历史目标 |
| Fisher 迹、平坦性、ECE | Optional | 分析指标，不是 DER 训练模块 |

本次已阅读三份笔记：[DER前置知识.md](../source/notes/DER前置知识.md)、[DER论文逻辑.md](../source/notes/DER论文逻辑.md)、[DER论文笔记.md](../source/notes/DER论文笔记.md)。采用前置知识的对象区分、reservoir 概率直觉和条件性 KL 推导；采用逻辑笔记的时间索引、空池启动与训练/预测分工；采用论文笔记的协议/结论边界线索。论文事实全部回查唯一原文。四个文件依用户要求从 `task/DER/source` 移入，笔记原文未改写，未并入原文缓存。

三份笔记均可读、对应当前论文，没有图片或相对附件引用。《DER论文笔记》的 Obsidian 链接 `[[DER论文逻辑梳理]]` 与实际文件名 `DER论文逻辑.md` 不一致；本模型明确链接实际文件，保留原件。`[[DER前置知识]]` 可对应同目录文件。笔记是内部参考输入，其指令性措辞不改变阶段权限，正文及附件不自动公开。

## Objects and Variables

| Object / variable | Meaning in this paper | Owner / creator | Evidence locator |
| --- | --- | --- | --- |
| $S$ / $D$，$(x,y)$ | 带标签流；算法写逐样本，实验可用 mini-batch | 数据/实验协议 | §3 p. 3；Algorithms 1–2 p. 4；§4.1 |
| $\theta$，$h_\theta$，$f_\theta$ | 当前参数、logits、softmax 概率 | 唯一持续更新的网络 | §3 p. 3 |
| $M$，$K$ | 缓冲区及固定记录容量；K 是本模型消歧记号 | reservoir 管理的训练状态 | §3；Appendix D p. 15 |
| $(x,z)$ / $(x,z,y)$ | DER / DER++ 记录，原图与历史输出，后者另存标签 | 本步前向产生候选，更新后可能写入 | Algorithms 1–2 p. 4 |
| $z$ | 当前增强输入在更新前产生的 logits 数值快照 | 当时模型；保存后冻结 | §3；Algorithms 1–2 |
| $N$ | 插入当前项之前已处理项数，初始化 0 | reservoir 持久计数 | Algorithm 3；本模型规范化 |
| $R_d$，$R_y$ | 输出匹配与额外标签回放的采样，后者仅 DER++ | 对更新前 M 的独立 sample 调用 | Algorithm 2 |
| $a(\cdot)$ | 输入增强，当前与旧图分别执行 | 训练过程 | Algorithms 1–2；§4.1 p. 5 |
| $\alpha,\beta,\eta$ | 输出匹配系数、标签回放系数、学习率（对应原文 lambda） | 超参数配置 | Eq. 5–6；§4.1；Appendix G |

## Architecture and Ownership

只有一个当前分类网络产生 logits 并接收梯度。MNIST 变体使用两隐藏层、每层 100 ReLU 单元的 MLP；CIFAR-10/Tiny ImageNet 使用未预训练 ResNet18（§4.1 p. 5）。这些是实验架构，而非 DER 对所有应用的强制结构。

当前分类、历史输出匹配、DER++ 历史标签分类共享当前参数。旧 z 是数值数组，不是旧网络；不更新、不向生成它的旧参数反传。Reservoir 管理器持有原图记录，负责追加/替换，不做 herding、不维护任务教师或类别原型。推断使用当前网络，不使用 NCM（§3–3.1 pp. 3–4）。

## Data Flow

```text
当前 (x,y) -> 增强 xt -> 当前网络 logits Z -> CE -> 当前损失
                                   \-> 数值候选，更新后才可能写入 M
旧 M -> sample Rd -> 增强旧图 -> 同一网络 -> 与固定旧 z 做平方距离 -> alpha 加权
旧 M -> sample Ry -> 增强旧图 -> 同一网络 -> 旧标签 CE -> beta 加权（仅 DER++）
适用损失相加 -> 一次参数更新 -> reservoir 处理当前候选 -> 下一步 theta,M,N
```

两次采样可以重叠，也可以不同。读取在写入前，当前记录不会因本步新插入而立即作为本步旧记忆回放。写入原图而非增强图，后续回放重新增强（Algorithms 1–2 p. 4；§4.1）。此图描述数据关系；精确次序见唯一执行模型。

## State and Time

令第 i 步进入时为 $\theta_i,M_i$，该步产生 $z_i=h_{\theta_i}(a_i(x_i))$。损失在本步参数更新前计算；先得到 $\theta_{i+1}$，再尝试将 $(x_i,z_i[,y_i])$ 写入 $M_{i+1}$。不使用更新后的参数重算已保存 z。整条记录被替换时，其原图与目标一同退出可回放记忆（p. 4；Appendix D）。

空池第一步只有当前分类目标；写入后第二步才可回放。这是原算法遗漏空池分支的执行补全。满池后当前项未入池，也不影响它已经参与训练。没有任务结束专用步骤。标准多 epoch 包含许多优化步；原文未完整指定重复图片的去重/覆盖策略，不自行加入。

## Algorithm Execution Model

### Source Algorithm and Reconstruction Basis

依据 p. 4 Algorithm 1（DER）、Algorithm 2（DER++），p. 15 Appendix D Algorithm 3（Reservoir），及 p. 3 Eq. 5–6。以下是**显式消歧后的执行整理**，不是逐字原算法。保留 sample -> augment -> 当前 logits -> 正则损失 -> 参数更新 -> 入池的原始顺序；为对应实验使用批次表示，reservoir 对批内每个数据项依次处理。

| 原文 / 笔记位置 | 核验结果与采用依据 |
| --- | --- |
| p. 4 两份 Algorithm 更新行；《DER论文逻辑》§四.2 | 原文印为正号 $\theta\leftarrow\theta+\lambda\nabla L$，与 p. 3 最小化及 p. 5 SGD 叙述不一致。笔记已指出；本整理采用下降减号，列为 W2 人工核对项。原文缓存保留印刷正号。 |
| Algorithm 1 的 sample 和末行；逻辑笔记§四.2 | 原文读取三元组却只存 (x,z)，DER 损失不用旧标签；本整理 DER 记录为二元组，DER++ 为三元组。 |
| Algorithm 1–2 初始化空 M 后直接 sample | 原文未写空池行为，本整理跳过回放、正常执行当前 CE；这是补全，不声称原文已有此分支。 |
| Algorithm 3；逻辑笔记§六，前置知识§四 | 原文条件为 `M > N`，未展开计数递增。分离容量 K、容器 M、此前计数 N；满池随机整数包含 0 和 N，最后 N 加一。前置知识的先递增 1 基计数表达同一概率。 |
| 逻辑笔记§四.2 DER 伪代码、§七流程图；前置知识§八 | 这些段落先当前前向后采样；p. 4 原文先 sample，再增强/前向。本模型按原文顺序。固定参数、无额外副作用时可解释相同损失，但不声称随机数消耗或带状态网络的运行顺序可任意交换。 |
| 逻辑笔记§八随时预测；Appendix B.2 p. 13 | 当前参数可以定义预测入口；MNIST-360 实际只在整流结束后评测。不能据前者断言作者每步测试。 |

上述说明没有回写原笔记，也没有用笔记代替原文。

### Inputs and Initialization

输入是顺序带标签 mini-batch 流 S、模式 DER 或 DER++、容量 K>0、学习率 eta>0、alpha（DER++ 再加 beta）、增强规则和回放 batch 大小。初始化当前网络、空 M、N=0；没有旧教师。输出类别坐标必须一致。按论文有限类别基准建模，不凭空指定动态扩头或旧 logits 补维。

具体网络、SGD 配置、数据顺序、多 epoch 来自实验。标准 CL 固定当前/回放 batch 大小；MNIST-360 搜索两者（§4.1 p. 5；Appendix G.1 p. 20，Table 9 pp. 21–23）。

### Executable Pseudocode

```text
TRAIN(S, mode, K, alpha, beta, eta, replay_size):
    theta = initialize_current_network()
    M = []
    N = 0                                  # 已处理数据项数，非任务数
    for B in S:                            # 原始 X 和真实 Y
        if M is not empty:
            Rd = sample(M, replay_size)     # 从写入前的记忆采样
            if mode == DER++:
                Ry = sample(M, replay_size) # 第二次调用，允许与 Rd 重叠

        Xt = augment(B.X)
        if M is not empty:
            Xdt = augment(Rd.X)
            if mode == DER++:
                Xyt = augment(Ry.X)

        Z = h_theta(Xt)                    # 更新前
        Zsave = detached_value_copy(Z)     # 保存数值，不保存旧网络或反传图
        if M is not empty:
            Ldark = mean_over_records(sum_over_classes((h_theta(Xdt)-Rd.Z)^2))
            Llabel = CE(Ry.Y, softmax(h_theta(Xyt))) if mode == DER++ else 0
        else:
            Ldark = 0
            Llabel = 0

        Lcurrent = CE(B.Y, softmax(Z))
        L = Lcurrent + alpha*Ldark
        if mode == DER++:
            L = L + beta*Llabel
        theta = theta - eta*gradient(L, theta) # 一次联合下降；正号消歧已披露

        for (x,y,z) in aligned_records(B.X,B.Y,Zsave):
            v = (x,z) if mode == DER else (x,z,y)
            if N < K:
                M.append(v)
            else:
                j = UniformIntegerInclusive(0,N)
                if j < K:
                    M[j] = v
            N = N + 1
        # 下一步继承 theta,M,N；不刷新旧 z，不创建任务教师
    return theta,M,N
```

CE 对 batch 平均；输出匹配先按类别平方求和，再按记录平均，对应 Eq. 5–6 的样本期望。若类别维也平均，梯度尺度会改变，需要与 alpha 和实际实现一起核对。原算法的 `f_theta(Xt)` 在此复用同一数学函数的当前 Z；此整理不声称复现源码的随机状态、BN 统计、空池/小池采样 API 或逐位运行，若复现实验须另查固定代码版本。

处理 n>=K 个数据项后，每个流位置的留存概率为 K/n（§3，Appendix D）；这不保证类别覆盖、代表性或永久留存。重复访问同一图片如何构成流项，仍须对照实验实现。

### Prediction / Inference Entry

依据 §3 函数定义及 §4 评测协议**补充整理**，原文没有独立预测 Algorithm：

```text
PREDICT(x_query, trained_theta, C_eval):
    a = h_trained_theta(preprocess_for_evaluation(x_query))
    return argmax(a[c] for c in C_eval)
```

Class-IL/Domain-IL/GCL 不读取测试任务 ID；Task-IL 根据已知任务限定候选类别（§4 p. 4）。预测只读模型，不读 M、不求 replay 损失、不反传，不改变训练计数；需要概率时可计算 softmax。评测预处理依协议，不把训练随机增强自动用作测试。

Table 2 报告所有任务结束后的平均准确率；Appendix B.2 明确 MNIST-360 整流结束测试，且测试旋转无训练 offset。可定义中途预测不代表论文逐步评测。FWT/BWT/FRG 的任务时点评估属于 Appendix F.4 附加协议，不成为 DER 更新步骤。

### State Classification

| State / value | Created or read when | Temporary / derived / persistent | Frozen / updatable | Consumed or retained by |
| --- | --- | --- | --- | --- |
| 当前 theta | 初始化、每步前向/更新 | 跨轮模型参数 | 梯度更新 | 下一步训练及预测 |
| M 槽位 | 先读，参数更新后写 | 跨轮持久 | reservoir 追加/替换 | 未来 sample |
| 已存历史 z | 入池保存此前前向数值 | 随记录持久 | 冻结，直至整条替换 | 未来平方匹配，不反传旧模型 |
| N、K | 插入时读取 | 跨轮计数/配置 | N 增加，K 固定 | reservoir |
| Rd、Ry | 每步 sample | 临时选择 | 本步只读 | 回放损失 |
| 增强图、Z、Zsave | 参数更新前 | 临时/派生；Zsave 可能转为持久 | Zsave 数值固定 | 当前损失及候选入池 |
| 损失、梯度 | 前向/反向 | 临时/派生 | 本步计算 | 更新后释放 |
| alpha、beta、eta、类别坐标 | 实验配置 | 持久配置 | 不通过本损失学习 | 损失/优化/输出解释 |

## Training

当前标签监督 CE，旧 logits 监督平方距离；DER++ 再用第二次采样的旧标签监督 CE。各路径梯度进入同一当前网络，历史目标只作常量。一次联合目标下降与三次分开下降不同。空池时仅当前 CE；旧 logits 来自更新前，入池动作在更新后（p. 4）。

所有方法使用 SGD。标准 MNIST 每任务 1 epoch，Sequential CIFAR-10 为 50，Tiny ImageNet 为 100；CIFAR/Tiny 当前及回放图都使用随机裁剪/翻转（§4.1）。多 epoch 不等于需要任务结束教师；也不能把主表复杂数据实验误报为严格单遍。Fisher、ECE 和平坦性都不是训练损失。

## Inference / Runtime

待测图经评测预处理和当前网络得到分数，在允许类别集合取最大值。GCL 无任务 oracle，Task-IL 掩码是协议特例。纯预测不需要缓冲区；继续学习则保留当前模型及 M、N。网络函数定义支撑此路径，原文不提供独立部署接口。MNIST-360 测试旋转规则见 Appendix B.2（p. 13），不是训练时的 offset。

## Core Equations

$h_\theta(x)$ 是 logits，$f_\theta(x)=\operatorname{softmax}(h_\theta(x))$；z 是历史 logits，y 是真实标签，ell 是 CE。§3 p. 3 Eq. 5–6：

$$
L_{\mathrm{DER}}=L_{t_c}+\alpha\,\mathbb E_{(x,z)\sim M}\|z-h_\theta(x)\|_2^2.
$$

$$
L_{\mathrm{DER++}}=L_{t_c}
+\alpha\,\mathbb E_{(x',y',z')\sim M}\|z'-h_\theta(x')\|_2^2
+\beta\,\mathbb E_{(x'',y'',z'')\sim M}\ell(y'',f_\theta(x'')).
$$

当前 batch 分类损失近似 Ltc；Algorithm 1–2 在输入上显式增强，两条历史期望由两次 sample 近似。beta=0 时 DER++ 目标退化为 DER；p. 3 脚注说 0.5/0.5 稳定，Table 9 实际选取仍随数据集/容量变化。

采用《DER前置知识》§三的边界说明：KL 对当前 logits 的梯度为 q-p，平方距离为 2(a-z)。Softmax 对共同平移不变，因此两者并非全局严格相等。局部二次型 $\frac12\delta^T(\operatorname{diag}(p)-pp^T)\delta$ 是辅助推导，**不是本论文新增公式或 DER 步骤**。原文等价性说法有假设且引用蒸馏工作，不扩大为无条件定理。

笔记§五的增强损失均值/方差分解和§七的 Fisher 迹恒等式也属数学背景；论文 §4.1 提到隐式一致性、§5 使用经验 Fisher 分析曲率，没有独立一致性/Fisher 训练模块。

## Results

以下数值从本地 v2 原表核对，完整表已缓存。`±` 原样保留，未擅自认定为标准差或标准误；Table 2 明确平均十次不同初始化。

| Question / setting | Conditions | Reported results (%) | Supported conclusion / locator |
| --- | --- | --- | --- |
| 小缓存是否改善 Class-IL？ | S-CIFAR-10，5×2 类，未预训练 ResNet18，50 epochs/task，K=500，最终平均准确率，10 runs | ER 57.74±0.27；DER 70.51±1.67；DER++ 72.70±1.36 | 此协议优于 ER；Table 2 p. 6，§4.1–4.2 |
| 测试 oracle 下呢？ | 同一 CIFAR，Task-IL 提供任务 ID，K=500 | ER 93.61±0.27；DER 93.40±0.39；DER++ 93.88±0.50 | DER 并非逐项占优；不可与 Class-IL 混作同一指标；Table 2 |
| 跨数据集呢？ | S-Tiny ImageNet，10×20 类，ResNet18，100 epochs/task，K=500，Class-IL | ER 9.99±0.29；DER 17.75±1.14；DER++ 19.38±1.41 | 此协议有更高最终平均准确率；Table 2 |
| 无边界且域渐变呢？ | MNIST-360，数字 0–8，9 对类别×3 轮，图像仅出现一次，2×100 ReLU MLP，K=500，整流结束测试 | ER 65.04±1.53；DER 69.11±1.66；DER++ 69.62±1.59 | 支持此 GCL 基准；Table 3 p. 7，Appendix B。当前/回放 batch 大小经搜索，非纯机制隔离实验 |
| DER++ 是否必胜？ | K=200 Tiny Class-IL；K=5120 CIFAR Task-IL；K=200 MNIST-360 | Tiny DER 11.87±0.78 > DER++ 10.96±1.17；CIFAR ER 96.98±0.17 > DER++ 96.12±0.21；MNIST-360 DER 55.22±1.67 > DER++ 54.16±3.02 | 增加标签项不保证提高每项性能；Tables 2–3 |

§5 pp. 7–9、Figure 2 p. 8 的分析边界：

- 平坦性：S-CIFAR-10 K=500 的高斯扰动损失及不同容量经验 Fisher 迹比较，支持作者的经验判断；不证明所有曲率方向或未来任务的表现。
- 校准：S-Tiny ImageNet K=500 的 ECE/可靠性图显示相较 ER/FDR 更少过度自信；不是所有流的保证。
- 记忆信息量：在最终缓冲区上从头训练新网络，再用每类 10 个测试样本微调、在剩余测试样本评估。它是独立分析实验，不是 DER 常规训练步骤，也不等于通常完全不接触测试标签的部署协议。
- 开销：Fig. 2(f)、p. 9 的实测环境是 Titan X/i7-6850K；§4.2 脚注约 2.5h 与 MER 300h 是特定基准观察，不是普适复杂度比。Appendix C 总内存包括网络/教师/记忆；相同条目数不代表相同字节数。

Appendix F 包含 Seq-MNIST（Table 4）、极小记忆 replay 变体（Figure 4）、单 epoch（Table 5）、FWT/BWT/FRG（Tables 6–8）；Appendix G 完整参数表已缓存。单 epoch JOINT 自身欠拟合是作者对该协议的解读限制，不能泛化为在线学习无效。

## Limitations

作者讨论：分布突变前模型可能给历史 logits 带来偏置（§3）；极小 reservoir 会遗漏类别，利用非最大输出恢复 ghost classes 是推测（Appendix F.2 p. 17）；单 epoch 欠拟合可能混淆遗忘（Appendix F.3）。

本模型的分析边界：有限样本输出约束不是所有历史风险的硬约束；等概率不保证类别均衡；固定记录数不保证无限增类时固定字节开销。平坦性、校准、性能联系是经验分析，不构成唯一因果证明。动态扩头、旧 logits 对齐、重复图像去重、BN/随机状态等未被原算法完整规定，未用其他论文或现代代码补作原论文事实。

待人工核对：接受披露的下降符号、记录格式、reservoir 计数消歧和空池补全；确认更新前 logits/更新后入池时序、DER++ 双采样及预测入口；确认笔记教学重排与原文顺序的区别、MNIST-360 测试时机与结果边界。W2 保持 `in_progress`，W3–W5 及页面开发尚未启动。