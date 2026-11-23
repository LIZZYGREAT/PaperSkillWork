# 从视觉 Transformer 到动态 Prompt 检索与参数学习

> 对应论文：*Learning to Prompt for Continual Learning*（Wang et al., 2022）。  
> 阅读定位：本笔记解释理解 L2P 所必需的技术基础与部件之间的因果关系。

## 一、连续学习的约束

### 1. 模型实际面对的数据与任务

先考虑一个已经能够识别图像的分类模型。在普通监督学习中，我们通常将训练样本汇集为一个数据集，训练过程中可以反复访问这些数据。模型的参数通过每轮小批量数据产生的梯度不断更新，最终希望在整个数据分布上取得良好性能。

连续学习的条件不同。设模型先后接收数据流 $\mathcal D_1,\mathcal D_2,\ldots,\mathcal D_T$。第 $t$ 阶段可以获得的训练数据为
$$
\mathcal D_t=\{(x_i^t,y_i^t)\}_{i=1}^{n_t},
$$
其中 $x_i^t$ 是输入图像，$y_i^t$ 是其类别标签。

在进入后续阶段时，模型未必还能访问以前阶段的样本，但在最后测试时，模型仍可能需要识别此前所有阶段学过的类别。

问题由此产生：如果模型把全部参数都用于适应最新阶段的数据，新梯度很可能修改对旧类别有用的表征与决策边界。旧任务准确率随之下降，即灾难性遗忘。

这里的冲突首先是**参数更新的冲突**：新旧任务依赖了部分相同的可训练参数，但更新方向未必一致。

不过，连续学习并不意味着每个任务都应当完全独立。例如，识别不同动物的任务可能共享形状、纹理等知识；完全不共享已有知识也会浪费先前学习成果。因此，理想机制不仅要隔离互相干扰的知识，还应允许相似样本复用共同知识。

### 2. 三种实验协议及其对推断的要求

| 场景 | 数据如何变化 | 推断阶段能否依赖任务 ID | 关键困难 |
|---|---|---|---|
| Task-incremental（任务增量） | 不同任务依次到来，通常有不同类别 | 通常可使用任务 ID | 在已知任务的前提下保存旧能力 |
| Class-incremental（类别增量） | 新类别分阶段出现 | **不能**依赖任务 ID | 输入任意旧/新类别图片，都需要在统一类别空间中判别 |
| Domain-incremental（领域增量） | 类别集合相同，但图像分布或采集条件改变 | 不应依赖测试时的任务 ID | 同一分类目标跨不同领域保持有效 |

论文还讨论 **Task-agnostic / task-free** 场景：数据分布可能逐渐变化，训练过程没有清晰的任务边界，推断也没有任务标识。它与“有明确任务划分、只在测试时隐藏 ID”的类别增量设置并不相同。

这一区别直接限制了可行的方案。如果做法是“每个任务分配一个独立模块，测试时读取任务 ID 再选择模块”，那么即使保留了旧知识，也没有真正解决类别增量或 task-agnostic 推断。

L2P 因此需要一个**由样本内容驱动**、不要求外部提供任务编号的选择机制。

### 3. 从修改模型权重转向修改模型输入

常见的学习思路是：输入 $x$ 固定，通过更新模型参数 $\theta$，使 $f_\theta(x)$ 更适合新任务。

L2P 所依托的另一种思路是：使用已经具备良好视觉表征能力的预训练模型，冻结其核心参数，通过可学习的输入向量控制模型如何处理当前样本。

可以将两种途径写为

$$
\begin{aligned}
\text{常规微调：}&\qquad f_{\theta'}(x), \quad \theta'\text{ 随训练改变};\\
\text{Prompt Tuning：}&\qquad f_{r,\theta}\bigl(\operatorname{concat}(P,f_e(x))\bigr),
\quad \theta\text{ 固定，}P\text{ 随训练改变}.
\end{aligned}
$$

其中 $P$ 是一组可学习向量。重点不在于“输入文字提示”，而是让小规模参数 $P$ 影响冻结模型内部的计算。

这种方式降低了需要修改的参数量，但**冻结主干本身不保证连续学习不遗忘**：只要所有任务争夺同一个 Prompt 或同一个分类器，仍可能发生冲突。如何分配与共享 Prompt 才是后续方法要解决的问题。

## 二、从原始图像建立 ViT 的完整输入表示

### 1. Transformer 接收的是 Token 序列

原始图像可以写为

$$
x\in\mathbb R^{H\times W\times C},
$$

其中 $H,W$ 是高与宽，$C$ 是通道数。Vision Transformer（ViT）的基本输入处理方式是将图像切分为若干不重叠的 Patch，再把每个 Patch 转换为长度为 $D$ 的向量，作为 Transformer 可以处理的 Token。

设每个 Patch 的尺寸为 $S\times S$，并假设 $H,W$ 都能被 $S$ 整除，则 Patch 数量为

$$
N_{\mathrm{patch}}=\frac{H}{S}\frac{W}{S}.
$$

每个 Patch 展平后有 $S^2C$ 个数，所有 Patch 可写成矩阵

$$
X_{\mathrm{patch}}\in\mathbb R^{N_{\mathrm{patch}}\times(S^2C)}.
$$

通过可训练的线性投影（在预训练阶段已经学好），把每个 Patch 映射至共同的特征维度：

$$
E_{\mathrm{patch}}=X_{\mathrm{patch}}W_E+b_E,
\qquad
W_E\in\mathbb R^{(S^2C)\times D}.
$$

输出 $E_{\mathrm{patch}}\in\mathbb R^{N_{\mathrm{patch}}\times D}$，可视为图像的 Token 序列。**线性投影后的一个 Token 是一个图像局部区域的向量表示。**

例如，输入 $224\times224\times3$，使用 ViT-B/16 的 $16\times16$ Patch：

$$
N_{\mathrm{patch}}=(224/16)^2=196,
\qquad S^2C=16^2\times3=768.
$$

ViT-B/16 常用隐藏维度 $D=768$，因此图像会形成 196 个长度为 768 的 Patch Token。这是后面计算 Prompt 长度、输入序列长度与注意力开销的基础。

### 2. `[CLS]` Token 与位置编码

仅有 Patch Token 还存在两个问题：

第一，分类任务需要形成一个面向整张图像的总体表示。ViT 通常为此引入一个可学习的 `[CLS]` Token，将其与 Patch Token 一起送入 Transformer。在多层 Self-Attention 之后，`[CLS]` 可以聚合来自图像不同位置的信息，成为一种全局表征。

第二，单纯的 Self-Attention 并不知道哪个 Patch 位于左上角、哪个位于右下角。通常通过**位置编码**向序列表示提供位置信息，使模型能够区分不同空间位置。

典型 ViT 在嵌入阶段形成如下序列：

$$
X_e=[e_{\mathrm{cls}};e_1;\ldots;e_{N_{\mathrm{patch}}}]+E_{\mathrm{pos}}
\in\mathbb R^{L\times D},
\qquad L=N_{\mathrm{patch}}+1.
$$

本例 $L=197$。每一行都是一个 Token，每列是一个特征维度。

L2P 论文把相关输入处理抽象到预训练嵌入层 $f_e$ 中，没有在方法公式中逐项规定每一种位置编码的工程实现顺序。因此实际实现中，新增 Prompt 的位置编码处理要按具体骨干网络确认。

### 3. 区分嵌入层、Transformer Encoder 与分类器

对于理解 L2P，可以将图像模型划分为三个部件：

$$
\boxed{\text{图像 }x}
\xrightarrow{\ f_e\ }
\boxed{\text{Token 序列 }X_e}
\xrightarrow{\ f_r\ }
\boxed{\text{上下文特征序列 }H}
\xrightarrow{\ \text{读出}\ }
\boxed{\text{分类器输出}}.
$$

- $f_e$：预训练输入嵌入模块，负责图像转 Token，并包含相应的模型输入表示处理。
- $f_r$：由多层 Transformer Encoder 组成的预训练特征处理模块，输入、输出均为 Token 特征序列。
- $g_\phi$：用于当前分类问题的分类头，参数为 $\phi$，把读出的特征映射到类别分数。

原论文记 $f=f_r\circ f_e$，特意将最终分类头排除在 $f$ 之外。其原因是：后续既要使用 $f$ 提取稳定的样本查询特征，也要在 Prompt 增强后的 Transformer 输出上训练分类器。**冻结的预训练特征模型**与**可训练的分类头**必须区分。

## 三、Self-Attention 的计算过程

### 1. Token 之间的交互

假设一张图片包含多个局部 Patch。某个 Patch 自身只能描述局部纹理，判断它是动物耳朵还是背景形状，往往还要观察其他 Patch。Transformer 的 Self-Attention 使每个 Token 根据自己的当前状态，有选择地聚合其他 Token 的信息。

设某层 Transformer 的输入为
$$
Z\in\mathbb R^{L\times D}.
$$
在一个注意力头中，先分别进行三次线性映射：
$$
Q=ZW_Q,\qquad K=ZW_K,\qquad V=ZW_V,
$$

其中 $W_Q,W_K\in\mathbb R^{D\times d_k}$，$W_V\in\mathbb R^{D\times d_v}$。因此
$$
Q,K\in\mathbb R^{L\times d_k},
\qquad V\in\mathbb R^{L\times d_v}.
$$

### 2. 从匹配分数到新 Token 表示

令第 $i$ 个 Token 的 Query 为 $q_i$，第 $j$ 个 Token 的 Key、Value 分别为 $k_j,v_j$。两者的匹配分数为
$$
s_{ij}=\frac{q_i^\top k_j}{\sqrt{d_k}}.
$$
对同一个 $i$，将它与全部 Token 的匹配分数做 Softmax：
$$
a_{ij}=\frac{\exp(s_{ij})}{\sum_{m=1}^{L}\exp(s_{im})},
\qquad \sum_j a_{ij}=1.
$$

再以这些权重对各 Value 加权求和：
$$
o_i=\sum_{j=1}^{L}a_{ij}v_j.
$$

矩阵写法为
$$
\operatorname{Attention}(Q,K,V)
=\operatorname{Softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V.
$$

这里最重要的是数据变化：**一个 Token 的输出不再只取决于它自己，而是取决于整个输入序列内其他 Token 的当前表示及匹配权重。**

实际 ViT 使用 Multi-Head Self-Attention（多头自注意力）：每个注意力头各自拥有一组投影矩阵，从不同特征子空间计算 Token 之间的关系。将各头的输出拼接后，通常再通过输出线性映射恢复模型隐藏维度 $D$：

$$
\operatorname{MSA}(Z)
=\operatorname{Concat}(\mathrm{head}_1,\ldots,\mathrm{head}_h)W_O.
$$

注意力只是 Transformer Encoder Block 的一个部分。一个典型的 Pre-LN Block 还通过残差连接保留输入特征，并利用 MLP 进行非线性变换：

$$
\begin{aligned}
\widetilde Z&=Z+\operatorname{MSA}(\operatorname{LN}(Z)),\\
Z'&=\widetilde Z+\operatorname{MLP}(\operatorname{LN}(\widetilde Z)).
\end{aligned}
$$

这些公式说明：注意力执行跨 Token 信息混合，MLP 对每个 Token 的特征进行变换，残差路径使旧信息能够与更新信息叠加。层与层之间使用上一步的 $Z'$ 继续计算，因此一个 Prompt 的影响可以经多层注意力逐渐传播到其他 Token。具体 Block 的归一化次序取决于 ViT 实现；上述是用于理解计算流的常见结构。

### 3. Prompt Token 插入序列后的双向作用

假设将 $m$ 个可学习 Prompt Token 放在图像 Token 前面，则输入变为

$$
Z_0=[P;X_e]\in\mathbb R^{(m+L)\times D}.
$$

在常规不使用特殊单向注意力掩码的 Self-Attention 中，Token 可以相互关注，因此形成两类同时存在的信息传递：

1. **图像 Token 读取 Prompt 信息**：图像 Token 的输出可能受到 Prompt Token 的 Key/Value 影响。
2. **Prompt Token 读取图像信息**：Prompt Token 的输出也可能聚合图像 Token 的特征，因而成为依赖当前图像内容的表示。

Prompt 训练得到的初始向量是参数化的“指令”，但经过 Transformer 后的 **Prompt 位置输出不再只是固定 Prompt 的副本**，其中可能包含它从当前图像 Token 中聚合的信息。因此可以用这些输出进行分类。


```text
预训练得到的图像 Token ────────────┐
                                ├─> 联合序列 ─> Self-Attention ─> 多层特征交互
可学习 Prompt Token ────────────┘                         │
                                                         ├─> 图像位置输出
                                                         └─> Prompt 位置输出
```

Prompt 有效是因为**新增的可训练向量进入同一套 Q/K/V 运算，改变了注意力、特征混合与最终读出结果**。

## 四、Prompt Tuning

### 1. 从离散提示词到连续可学习向量

自然语言 Prompt 通常由离散 Token 构成：输入提示中的文字先转换为词表索引，再经词嵌入层得到向量。在视觉版的连续 Prompt Tuning 中，我们直接引入一些可学习向量作为新 Token，不要求它们对应任何词语、图像局部或人工可解释的语义。

单个 Prompt 可以是一段包含 $L_p$ 个 Token 的矩阵：

$$
P\in\mathbb R^{L_p\times D}.
$$

这些值在训练开始时初始化，此后通过损失函数对它们求梯度、更新数值。所谓“Prompt 学到任务知识”，在参数层面的准确含义是：**这些向量逐渐被优化成使冻结主干更容易在特定输入分布上做出正确预测的条件输入**。

### 2. Prompt 的位置与维度受约束

图像输入序列的每个 Token 都是长度为 $D$ 的向量。若要沿 Token 数量所在的维度将 Prompt 与图像 Token 拼接，就必须保证两者的特征维度一致：

$$
\underbrace{P}_{L_p\times D}
\quad\text{与}\quad
\underbrace{X_e}_{L\times D}
\quad\Longrightarrow\quad
[P;X_e]\in\mathbb R^{(L_p+L)\times D}.
$$

这种拼接改变了 Transformer **输入的序列长度**，没有改变单个 Token 的隐藏维度，也没有向预训练主干内部添加新的网络层。

### 3. 共享 Prompt 和独立 Prompt 的缺陷

假设所有阶段都共享一个 $P$。

在任务 A 结束时，$P$ 已经学到能使模型正确识别 A 的向量状态；下一阶段若只见到任务 B 数据，则对 $P$ 的梯度只体现 B 的当前需求。经过多轮更新，原来服务于 A 的状态可能被破坏。

这种情况下虽然主干 $\theta$ 冻结了，但 **$P$ 仍是被新旧任务竞争的共享可训练参数**，分类头也可能遭遇旧知识遗忘。因此，单个 Prompt 不意味着没有灾难性遗忘。

另一种极端是每个任务独立维护 $P_t$。它能减少 Prompt 之间的修改冲突，但推断时如果不给任务 ID，就不知道应当选哪一个；相近任务也难以通过共享 Prompt 自然迁移知识。

这两种不足解释了为何需要“多个 Prompt + 自动选择 + 允许重叠共享”的结构，下一节再进一步解释检索机制。

### 4. Prompt 位置的输出作为分类特征

传统 ViT 分类常用 `[CLS]` 的最终隐藏状态。然而，当 Prompt Token 与图像 Token 被联合送入 Transformer 后，Prompt 的输出同样可能综合当前图片的信息。

因此，从计算上完全可以先取得 Prompt 位置的隐藏状态，再用平均池化构造固定维度的表示：
$$
H=f_r([P;X_e]),\qquad
h=\frac{1}{L_p}\sum_{r=1}^{L_p}H_{r,:}.
$$

这一式子用于解释“Prompt 输出可参与分类”的前置原理。**原始 L2P 实际会选中多个 Prompt**，故论文式 (5) 读出的是所有 $N L_p$ 个被插入 Prompt Token 的输出均值。

取均值后的 $h\in\mathbb R^D$ 是定长向量，便于后接线性分类器。不同 Token 可通过注意力抽取不同信息，最后再被汇总。

## 五、从单个 Prompt 扩展到可检索的 Key–Value 记忆

### 1. 普通索引查

如果已经知道样本属于任务 $t$，最简单的选择方法是“根据任务编号查表”。但类别增量与 task-agnostic 推断不能依赖这一信息。

因此需要一种**内容寻址（content-addressable）** 机制：输入自身产生描述其内容的特征，系统用这一特征从存储空间中找出最匹配的项。向量检索、相似度搜索、Key–Value Memory 都可以从这个角度理解。

这里“记忆”不必是旧样本。它可以是随训练更新的参数结构；对 L2P 而言，检索到的 Value 就是可学习 Prompt。

### 2. Prompt Pool 内部存储的是两种角色不同的参数

设有 $M$ 个 Prompt：
$$
\mathcal P=\{P_1,P_2,\ldots,P_M\},
\qquad P_j\in\mathbb R^{L_p\times D}.
$$
为每个 Prompt 独立配置一个 Key：
$$
\mathcal K=\{k_1,k_2,\ldots,k_M\},
\qquad k_j\in\mathbb R^{D_k}.
$$

存储结构为
$$
\{(k_1,P_1),(k_2,P_2),\ldots,(k_M,P_M)\}.
$$

Key 的职责是供样本查询、决定“选择谁”；Prompt 的职责是作为模型条件输入、决定“如何影响预测”。**Key 不需要和 Prompt 形状相同**：Key 是一个向量，而 Prompt 是若干 Token 组成的矩阵。两者通过相同索引关联。

### 3. Query 特征的产生

要查询 Prompt Pool，首先需要将图片 $x$ 变成与 Key 维度一致的 Query：

$$
q:\mathbb R^{H\times W\times C}\rightarrow\mathbb R^{D_k}.
$$

原论文选择冻结的预训练 ViT 作为特征提取器，取其输出 `[CLS]` 位置：

$$
q(x)=f(x)[0,:],
\qquad f=f_r\circ f_e.
$$

这是**不附加当前选择 Prompt 的原始图像特征路径**。由于 $f$ 的参数被冻结，同一张图像在不改变输入与预处理的条件下，可以得到稳定的查询表示。这样 Key 的学习面对一个相对固定的特征空间，不必追逐不断改变的查询网络。

论文用的是 $D_k$ 的一般记法；在直接取 ViT 隐藏特征作为 Query 的具体实现里，Key 通常要与该特征维度相匹配，例如 $D_k=D=768$。

这里“稳定”意味着 Query 生成规则的模型参数不随连续学习更新。

### 4. 余弦相似度与 Key 匹配

一种自然的匹配准则是余弦相似度：

$$
\operatorname{cos}(q,k)
=\frac{q^\top k}{\|q\|_2\|k\|_2}.
$$

它关注两向量夹角而非绝对长度。相同方向时相似度为 $1$，垂直时为 $0$，相反方向时为 $-1$。为符合“距离越小越好”的最小化记法，可以采用

$$
\gamma(q,k)=1-\operatorname{cos}(q,k).
$$

这里假设两个向量均非零；工程实现通常还需要一个数值稳定的小常数。论文声明使用余弦距离效果良好，但未要求所有可能实现都必须采取完全相同的数值稳定化细节。

给定一张图的 Query $q(x)$，分别计算它到全部 Key 的距离，取最小的 $N$ 个：

$$
\mathcal S(x)=\operatorname{TopNMin}
\{\gamma(q(x),k_j)\}_{j=1}^{M}.
$$

然后按索引提取相应 Prompt。该过程不依赖任务编号，选择行为由样本特征和当前 Key 的位置共同决定。

### 5. Top-$N$、共享与参数干扰之间的关系

假设样本 A 选中 Prompt 集合 $\{P_1,P_3\}$，样本 B 选中 $\{P_3,P_4\}$。那么：

- $P_3$ 被两个样本共同使用，两个样本的分类梯度都可能累积到它上面；这提供了潜在的知识共享途径。
- $P_1$ 只接收样本 A 对应的更新，$P_4$ 只接收样本 B 对应的更新；这使部分参数不被所有样本共同修改。
- 两个样本共享 $P_3$ 并不保证共享一定有益。如果它们的训练需求冲突，$P_3$ 仍可能受到梯度干扰。

因此，Prompt Pool 的关键在于**选择集合可随样本变化，且不同样本之间允许部分重叠**。这是一种软性的知识共享与隔离机制。

## 六、参数冻结、损失函数与梯度的联系

### 1. 冻结参数

设冻结的模型参数为 $\theta$，可学习 Prompt 为 $P$，预测过程抽象为
$$
h(P,x)=\operatorname{Readout}\bigl(f_{r,\theta}([P;f_e(x)])\bigr),
\qquad z=g_\phi(h),
$$
其中 $z$ 是分类 logits。训练损失为 $\mathcal L(z,y)$。虽然 $\theta$ 不更新，但输出 $h$ 仍然依赖 $P$，所以

$$
\nabla_{\operatorname{vec}(P)}\mathcal L
=\left(\frac{\partial h}{\partial\operatorname{vec}(P)}\right)^\top
\nabla_h\mathcal L
$$
一般不为零。

冻结表示优化器不修改 $\theta$。反向传播仍可通过冻结层的数学运算，把输出误差传回它们的输入 Prompt。否则根本无法学习 Prompt。

需要同时区分：用于检索的 Query 路径通常可以在不记录梯度的情况下计算，因为原论文没有可训练的查询特征提取器；用于分类的 Prompt 增强路径则必须保留对 Prompt 的梯度通路。这两条路径冻结同一主干参数，但对自动微分的需求不同。

### 2. 分类损失更新 Prompt 与分类器

设类别数量为 $C_{\mathrm{out}}$，分类头暂按最简单的线性层理解：

$$
z=Wh+b,
\quad W\in\mathbb R^{C_{\mathrm{out}}\times D},
\quad z\in\mathbb R^{C_{\mathrm{out}}}.
$$

经过 Softmax 得到 $p_c=\exp(z_c)/\sum_j\exp(z_j)$。对真实类别 $y$ 的交叉熵为

$$
\mathcal L_{\mathrm{CE}}=-\log p_y.
$$

交叉熵对 logits 的导数：
$$
\frac{\partial\mathcal L_{\mathrm{CE}}}{\partial z_c}
=p_c-\mathbf 1[c=y].
$$

这意味着错误类别预测概率偏大时，其对应 logit 的梯度为正；真实类别预测概率偏低时，其对应 logit 的梯度为负。梯度沿分类头向前传给特征：

$$
\nabla_h\mathcal L_{\mathrm{CE}}
=W^\top(p-e_y),
$$

再经冻结的 Transformer 反向传回被选中的 Prompt：

$$
\boxed{
\nabla_{\operatorname{vec}(P_s)}\mathcal L_{\mathrm{CE}}
=\left(\frac{\partial h}{\partial\operatorname{vec}(P_s)}\right)^\top
W^\top(p-e_y)
}
$$

其中 $e_y$ 是真实类别的 one-hot 向量，$\operatorname{vec}(P_s)$ 表示将 Prompt 矩阵展开成向量，便于使用标准 Jacobian 的维度记法。这个等式是为理解梯度路径给出的简化推导，真实 ViT 的 $\partial h/\partial\operatorname{vec}(P_s)$ 内含多层注意力、前馈模块与残差连接的链式求导。

由此得到清晰的参数关系：分类误差更新被选中的 Prompt 与分类头；预训练 ViT 参数虽然参与正反向计算，却始终保持原值。

<mark style="background:#fdbfff"><font color="#7030a0">只根据分类损失，为什么未必能学好 Key</font></mark>

假设根据 Query–Key 距离选择了 $P_1,P_3$。分类损失通过选中的 Prompt 产生梯度，但“哪两个索引被选中”是一次离散 Top-$N$ 决策。对通常的硬排序/索引运算而言，不能直接按连续可微函数那样从分类损失传回所有 Key，并让它们平滑地学会重新排序。

因此 L2P 需要额外的 **Key 匹配损失**。其作用是：对于已经被选中的 Key，显式将其特征方向推向当前样本的 Query，使未来相似输入更可能检索到它。

定义
$$
\mathcal L_{\mathrm{key}}(x)
=\sum_{s\in\mathcal S(x)}\gamma(q(x),k_s).
$$
最终训练目标将分类损失与 Key 匹配损失相加：
$$
\mathcal L(x,y)
=\mathcal L_{\mathrm{CE}}(x,y)
+\lambda\mathcal L_{\mathrm{key}}(x).
$$

$\lambda$ 控制 Key 匹配的优化强度。选取集合 $\mathcal S(x)$ 在该次前向计算中由当前 Key 确定；该匹配损失对**被选中的 Key 向量本身**是可微的。这与“Top-$N$ 索引选择不可微”并不矛盾。

### 4. 余弦距离的梯度方向拉近 Key 和 Query

下面是帮助理解匹配损失的补充推导。令

$$
u=\frac{q}{\|q\|_2},\qquad v=\frac{k}{\|k\|_2},
\qquad\gamma(q,k)=1-u^\top v.
$$

对 $k$ 求导，由归一化向量的导数可得

$$
\nabla_k\gamma(q,k)
=-\frac{1}{\|k\|_2}\left[u-(u^\top v)v\right].
$$

于是梯度下降一步为

$$
k'=k-\eta\nabla_k\gamma
=k+\frac{\eta}{\|k\|_2}
\left[u-(u^\top v)v\right].
$$

方括号中的向量是 $u$ 在垂直于当前 $v$ 的方向上的分量。因此，该步更新使 Key 的方向倾向于朝 Query 方向旋转。这解释了余弦匹配的几何含义；实际还会受到学习率、优化器、数值归一化与同批次多个样本梯度叠加的影响。

### 5. 分类梯度与检索梯度

在论文的基础设定中，两项损失主要分别驱动两类参数：

| 对象 | 影响它的直接训练信号 | 效果 |
|---|---|---|
| 被选中的 Prompt $P_s$ | 分类交叉熵 | 改变输入条件，使冻结模型输出更有利于分类 |
| 被选中的 Key $k_s$ | Query–Key 匹配损失 | 使相应 Key 更匹配当前输入的查询特征 |
| 分类头 $\phi$ | 分类交叉熵 | 将模型读出的表示映射到类别 |
| 预训练模型 $f_e,f_r$ | 不进行参数更新 | 提供固定的嵌入与特征变换基础 |

这是一种**检索学习与 Prompt 内容学习相互配合、但梯度入口不同**的结构。选对 Prompt 才能优化合适的 Prompt；Prompt 的优化会改变后续分类表现；Key 的优化又会改变未来样本能够检索到的 Prompt。因此，两个过程虽然参数更新来源有所区分，运行时仍然通过“选择索引”形成耦合。

## 七、将前置部件串成一次完整计算

### 1. 单个样本：两条路径如何汇合

已经知道输入图像 $x$、冻结 ViT 的 $f_e,f_r$、Prompt Pool、Key 集合与分类头，可以把一次计算分为：

```text
                                   原始图像 x
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
           无 Prompt 的冻结 ViT                 冻结嵌入层 f_e
                    │                                 │
           [CLS] 特征 q(x)                       图像 Token X_e
                    │                                 │
          与每个检索 Key 计算距离                        │
                    │                                 │
            选择 Top-N 个 Key                          │
                    │                                 │
          取出对应的 N 个 Prompt  ──────────────────────┤
                                                      │
                                      [P_s1; ...; P_sN; X_e]
                                                      │
                                          冻结的 Transformer
                                                      │
                                       取 Prompt 位置输出求均值
                                                      │
                                                分类头 g_φ
                                                      │
                                            Logits → 预测类别
```

训练时，右侧分类路径形成交叉熵；左侧被选中的 Key 与 Query 构成匹配损失。两项损失合并以后对各自的可训练参数反向传播。推断时只计算预测，不更新状态。

### 2. 结合 ViT-B/16 检查每个张量的形状

假设 $224\times224$ 图像、$D=768$、输入包含 $197$ 个 Token；设置 Prompt Pool 大小 $M=10$，每次选 $N=5$ 个，每个 Prompt 含 $L_p=5$ 个 Token。

| 处理对象 | 张量形状 | 数据来源与用途 |
|---|---|---|
| 图像 $x$ | $224\times224\times3$ | 当前图像 |
| 图像 Token $X_e$ | $197\times768$ | 196 个 Patch Token + 1 个 `[CLS]` Token |
| Query $q(x)$ | $768$ | 不加 Prompt 的冻结 ViT 输出 `[CLS]` 特征 |
| 全部 Key | $10\times768$ | 与各 Prompt 一一对应的可学习检索向量 |
| 单个 Prompt $P_j$ | $5\times768$ | 5 个可学习 Token |
| 当次选中 Prompt | $5\times5\times768$ | 5 个 Prompt，共 25 个 Token |
| 拼接后的输入 | $222\times768$ | 25 个 Prompt Token + 197 个原图 Token |
| Transformer 输出 | $222\times768$ | 上下文融合后的序列 |
| Prompt 输出平均值 | $768$ | 对前 25 个输出 Token 求均值 |
| 分类 logits | $C_{\mathrm{out}}$ | 当前统一分类空间的类别分数 |

原论文第 5.2 节给出的 CIFAR-100 系列设置为 $M=10,N=5,L_p=5$。在 $D_k=D=768$ 时，Prompt Pool 与 Key 的额外参数量恰好为

$$
\underbrace{10\times5\times768}_{\text{Prompt: }38400}
+\underbrace{10\times768}_{\text{Key: }7680}
=46080.
$$

这是论文报告的 Prompt 相关新增参数数量（不应把“只增加 46,080 个参数”误读为训练中完全没有可训练分类头）。新增参数量小，也不代表计算开销完全不变：更长的 Token 序列会扩大注意力矩阵；按照论文描述，Query 特征提取与加入 Prompt 后的模型计算还承担各自的前向运算。

### 3. 补充伪代码：用于检查前置机制

```text
输入：
    小批量 B = {(x, y)}
    冻结的嵌入层 f_e 与 Transformer f_r
    可训练 Prompt Pool P[1..M]、检索 Key K[1..M]
    可训练分类头 g_φ；选中数量 N；系数 λ

初始化本批次损失 total_loss = 0

for each (x, y) in B:
    # 检索路径：不使用任务 ID
    q = stop_gradient(PretrainedViT_WithoutPrompt(x).CLS_output)
    scores[j] = cosine_distance(q, K[j])  for j = 1..M
    selected_ids = smallest_N_indices(scores)

    # 分类路径：主干参数冻结，但必须能向选中 Prompt 传梯度
    X_e = f_e(x)
    X_in = concat(P[j] for j in selected_ids, X_e)
    H = f_r(X_in)
    h = mean(H[0 : N * prompt_length])
    logits = g_φ(h)

    loss_cls = cross_entropy(logits, y)
    loss_key = sum(scores[j] for j in selected_ids)
    total_loss += loss_cls + λ * loss_key

batch_loss = total_loss / size(B)
backpropagate(batch_loss)
update_selected_prompt_parameters()
update_selected_key_parameters()
update_classifier_parameters()
# f_e 和 f_r 始终不执行参数更新
```

此处 `smallest_N_indices` 是硬选择；`stop_gradient` 用于强调 Query 特征提取器不学习。其目的是检查前述技术如何串接，正式 L2P 算法笔记应以附录 D 为最终顺序依据。

## 八、连续学习时的状态继承

### 1. 上下阶段交接状态

开始学习第一个阶段前，系统已有预训练 ViT 与初始化的 Prompt、Key、分类头。阶段结束后，发生改变的是 Prompt Pool、检索 Key 与分类头，而不是预训练 ViT 的核心参数。

接着新的数据流到来，直接使用**上一阶段留下的这些可训练参数状态**作为起点，重复相同的检索、拼接、分类和优化。旧知识在这种方法中体现为可复用的参数状态，而不是必须重放的旧图像样本。

因此，L2P 中“记忆”的两层含义要分清：预训练 ViT 保留了预训练阶段形成的基础表征能力；Prompt Pool 与其 Key 则承载连续学习过程中逐步学习的条件化适应能力。这也是论文把这种结构与共享记忆空间联系起来的原因。

### 2. 无需测试时任务 ID

L2P 检索规则仅取决于 $q(x)$ 和 Key：

$$
\mathcal S(x)=\operatorname{TopNMin}_j\gamma(q(x),k_j).
$$

式中没有任务编号 $t$，所以可在不提供任务 ID 的条件下工作。但这不意味着系统一定可以准确推断出一个离散任务名称。它完成的是**基于特征的条件选择**，而不是显式任务分类。

这也是同一个 Prompt 可能服务于多个任务、同一任务内部不同样本也可能选择不同 Prompt 的原因。

### 3. 可选的 Prompt 多样化选择

原论文在第 4.2 节还提出：若训练时已知离散的任务边界，则可统计之前任务中各 Prompt 被选中的归一化频率 $h_j$。在新任务训练阶段，用

$$
\gamma(q(x),k_j)\,h_j
$$

代替原来的距离参与 Top-$N$ 选择，使高频使用的 Prompt 受到选择惩罚，鼓励任务差异较大时探索其他 Prompt。这里的 $h_j$ 是原论文给出的频率惩罚形式。

必须准确区分其边界：这是**仅在训练中、并且能够使用任务边界信息时的可选策略**；测试时仍采用不带频率因子的普通检索公式。
