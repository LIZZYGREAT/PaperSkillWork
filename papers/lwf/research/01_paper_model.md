# Paper Model: Learning without Forgetting

Paper ID: `lwf`\
Source: `source/paper.pdf` (arXiv:1606.09282v3, PDF pp.1–13)

## Problem

给已经训练好的 CNN 增加新预测任务，同时尽量保留旧任务能力；新任务训练时不再访问旧任务训练数据。普通 fine-tuning 可适配新任务，却可能使旧任务表现退化；feature extraction 保持共享特征不变，却限制对新任务的适配；joint training 能看新旧监督，但不符合旧数据不可用的设定。（摘要、引言及 Figure 1–2，PDF pp.1–3；证据 `C01`、`C06`、`C09`）

## Research Positioning

| Field | Classification | Evidence / source |
| --- | --- | --- |
| Topic | 持续学习中的灾难性遗忘 | The paper frames learning new tasks while retaining prior task capability (`C01`, abstract and introduction, PDF pp.1–2). |
| Problem type / setting | 旧任务训练数据不可用时，为已有视觉模型增添新任务 | New-task images and labels train the expanded CNN without old-task training data (`C01`, method, PDF pp.1, 4). The main experiments are visual classification, with a tracking appendix experiment (`C09`). |
| Research direction | 在新输入上蒸馏旧模型输出，以函数/输出行为约束支持新任务学习 | The old model supplies old-task responses on each new-task image; the expanded model matches these while learning new labels (`C02`, Figure 2(e), PDF pp.3–4). This is output-space regularization, not a penalty on old parameter displacement. |

These labels describe the paper's focus and method. They do not imply that LwF preserves behavior on every old-task input or that its evidence covers all continual-learning settings (`C07`, `C09`).

## Prerequisite Map

| Concept | Level | Depth needed | Source |
| --- | --- | --- | --- |
| 图像分类 / softmax / 交叉熵 | Required | logits、概率、标签与分类损失的关系 | 一般背景 `B01`；式 (1)，p.4 |
| CNN shared parameters 与 task head | Required | 共享表示和任务输出参数的边界 | `A01`–`A03`，pp.3–4 |
| backward / gradient / optimizer update | Required | 梯度计算与参数实际变化的区别 | 一般背景 `B02`；训练目标 p.5 |
| knowledge distillation | Helpful | 教师 soft target 如何约束当前模型 | `C02`、`F02`–`F03`，pp.3–4 |
| continual learning 与 forgetting | Helpful | 学新任务时旧任务行为退化 | `C01`、`C07`，pp.1–2、10 |
| Replay / EWC / Prompt / LoRA | Optional | 只需知道它们不是本文机制 | `A07`、`C10`–`C11`，pp.4–5、10–11 |

## Core Objects and Variables

| Object / symbol | Definition | Role in this paper | Evidence |
| --- | --- | --- | --- |
| `θ_s` | 多任务共用的 CNN 参数 | 产生共享表示；joint-optimize 时参与更新 | `A01`, pp.3–5 |
| `θ_o` | 已有旧任务的任务专属输出参数 | 生成旧任务响应；warm-up 冻结，随后可共同更新 | `A02`, pp.3–5 |
| `θ_n` | 新任务新增输出参数 | 随新类别输出节点随机初始化（Xavier），先单独 warm-up | `A03`, pp.4–5 |
| `X_n`, `Y_n` | 新任务训练图像及真实标签 | 当前可见训练输入和新任务监督 | `C01`, `F01`, pp.1、4–5 |
| `Y_o` | 旧模型对 `X_n` 计算的旧任务概率响应 | 旧任务蒸馏目标；不是旧样本、旧标签或 exemplar memory | `C02`, `A04`, pp.3–5 |
| `Ŷ_o`, `Ŷ_n` | 扩展模型在 `X_n` 上的旧任务 / 新任务输出 | 分别接收旧响应蒸馏和新标签监督 | `F01`–`F04`, pp.4–5 |
| `T` | 温度参数 | 重标定旧教师和当前模型的概率分布；论文使用 `T=2` | `F02`, `F06`, p.4 |
| `λ_o` | 旧响应损失权重 | 多数实验设为 1；改变目标相对权重，不保证相应准确率 | `F05`, p.5 |
| `R` | 普通 weight decay 正则项 | 论文实验中对应 weight decay 0.0005 | `C03`、p.5 |

## Architecture and Ownership

已有模型由共享参数 `θ_s` 与一个或多个旧任务头 `θ_o` 构成。新任务到来时，旧模型仍可在新任务图像 `X_n` 上前向，产生 `Y_o`。扩展后的当前模型复用共享表示，保留旧头并新增 `θ_n`；论文实验主要把最后的输出层作为任务专属层。新节点连接到上一层，权重随机初始化。论文 Figure 2(e) 表示这条双目标路径；不是回放旧训练图像。（`A01`–`A04`、`A07`）

## State and Time

1. **进入新任务前：**旧模型的 `θ_s` 与 `θ_o` 已训练完成。
2. **生成软目标：**用旧模型处理当前新任务图像，记录每个 `X_n` 对应的旧任务响应 `Y_o`。
3. **扩展：**创建并随机初始化 `θ_n`；原参数仍在模型中。
4. **Warm-up：**冻结 `θ_s`、`θ_o`，只训练 `θ_n`。此阶段不是 LwF 损失成立的必要条件；论文为轻微改善及公平比较而保留它。
5. **Joint-optimize：**联合训练 `θ_s`、`θ_o`、`θ_n`。旧头此时可更新，不能说旧任务参数一直冻结。
6. **推理：**共享网络计算一次表示，各任务输出层产生对应任务结果。

作者指出连续任务设置下，每加入一个新任务，会在当前新任务输入上重算旧任务响应；不是让第一任 teacher 永久固定。（`A04`–`A05`；PDF pp.4–5、7–8）

## Data / Tensor Flow

```text
X_n ──→ old model (θ_s, θ_o) ──→ Y_o
 │
 └──→ expanded model (θ_s, θ̂_o, θ̂_n)
          ├── old-task output Ŷ_o ──→ L_old(Y_o, Ŷ_o)
          └── new-task output Ŷ_n ──→ L_new(Y_n, Ŷ_n)
                                      │
                    λ_o L_old + L_new + R
                                      ↓
                     backward → optimizer update
```

对 batch 中每个新任务图像，教师响应和当前输出沿类别维形成概率向量；batch 训练时将单例损失在图像上取平均。论文没有规定教程所用具体张量框架，因此实现尺寸映射只描述为 batch × task-label 维，不补造固定 batch size。（`F01`–`F04`；PDF pp.4–5）

## Transformations and Formulas

新任务监督是交叉熵：`L_new(Y_n, Ŷ_n) = −Y_n · log Ŷ_n`，其中 `Y_n` 是新标签，`Ŷ_n` 来自当前模型的新任务 softmax。

对旧任务响应逐类温度重标定：

```text
y'_o(i)  = y_o(i)^(1/T) / Σ_j y_o(j)^(1/T)
ŷ'_o(i) = ŷ_o(i)^(1/T) / Σ_j ŷ_o(j)^(1/T)
L_old    = −Σ_i y'_o(i) log ŷ'_o(i)
```

温度 `T>1` 让目标分布更平滑，提高低概率类别的相对影响；论文根据 held-out grid search 使用 `T=2`。联合目标：

```text
L_total = λ_o L_old + L_new + R(θ̂_s, θ̂_o, θ̂_n)
```

`R` 是普通 weight decay。LwF 主方法直接约束新任务输入上的输出响应；参数 L2 soft constraint 是对比基线，不是该主损失。（`F01`–`F06`；PDF pp.4–5、9–10）

## Optimization / Update

对当前 batch 执行旧模型前向取 `Y_o`，再执行扩展模型前向得到 `Ŷ_o` 与 `Ŷ_n`；据此计算 `L_old`、`L_new` 和 `R`。Warm-up 阶段只让 `θ_n` 接受新任务损失更新；联合阶段，旧响应损失和新任务损失通过共享表示向 `θ_s` 传播，新/旧 head 分别按其计算图接收相应梯度。`backward()` 计算梯度；参数何时改变由优化器更新步骤完成，二者不能混为一谈。具体框架中的参数容器、优化器组属于 `IMPLEMENTATION_MAPPING`，不是论文源码事实。（`A05`、`I01`–`I03`）

## End-to-End Runtime

```text
训练好旧 CNN (θ_s, θ_o)
→ 读取当前新任务 batch (X_n, Y_n)
→ 旧模型在 X_n 上产生 Y_o
→ 新增并初始化 θ_n
→ 冻结 θ_s / θ_o，仅训练 θ_n (warm-up)
→ 解冻并联合训练 θ_s / θ_o / θ_n
→ 计算旧响应蒸馏 + 新标签监督 + weight decay
→ backward 产生梯度
→ optimizer step 改变本阶段允许更新的参数
→ 得到同时支持旧、新任务预测的扩展模型
```

失败边界：若新任务输入不能代表旧任务分布，在这些输入上匹配旧输出不保证旧域行为被保持；多个任务顺序加入时旧输出约束会变化，仍可能累积遗忘。（`C07`、`E05`）

## Experiments

主实验研究新旧任务分类折衷、任务序列、数据量、网络结构、warm-up 和响应损失。主体网络主要是 AlexNet，少数比较使用 VGG-16；数据集包括 ImageNet、Places365、VOC 2012、CUB-200-2011、MIT Indoor Scenes 及 ImageNet→MNIST 差异任务设置。VOC 报 mAP，其余任务报 accuracy；ImageNet / Places365 / VOC 使用 validation split，CUB / Scenes 使用 test split；表中报告三次训练均值。（`E01`–`E05`；PDF pp.6–10）

可逐项重建的示例是 AlexNet ImageNet→CUB（Table 1(a), p.7）：LwF 为旧 ImageNet accuracy 54.7、新 CUB accuracy 57.7。Fine-tuning、feature extraction、joint training 行在原表记录相对 LwF 的差值，文档中的 absolute value 由差值换算；这点必须随数据呈现。Joint training 用到旧数据，其信息条件不同。结果只支持指定任务对、split、模型和协议，不支持某方法普遍最优。（`E01`–`E04`）

多任务序列中旧任务表现仍会随任务加入而变化。作者关于任务相似性和分布代表性的说明是解释，不是一个对所有任务成立的量化定律。MD-Net 跟踪附录报告 0.373 对 0.383，但作者称差异不具统计显著性。（`E05`–`E06`）

## Limitations

- 输出保持仅约束当前可见新任务输入上的旧响应，不保证整个旧数据分布上的函数不变。
- 新旧域差异可能削弱新输入上旧响应的代表性；连续任务扩展仍可能累计遗忘。
- 系统主实验集中在视觉分类，另有一项跟踪实验；不证明 LLM、foundation model 或任意在线学习能力。
- 分割、检测、小量无标签样本、性能理论界和在线学习属于作者提出的未来工作，不是已验证能力。
- 作者提出的“功能比参数更直接”是论文讨论与本文教学解释的结合，不能将函数一致性夸大到未观测输入。（`C07`–`C11`）

## Reconstruction Matrix

| Object | What | Where | When | Producer | Input | Output | Shape | State | Gradient | Update | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `θ_s` | 共享 CNN 参数 | shared backbone | 新任务训练前已存在 | 旧任务训练 | 上层误差信号 | 共享表示变换 | 参数集合；层形状依模型 | warm-up 冻结、联合阶段可训练 | 新旧目标在共享路径上的梯度 | optimizer step 联合更新 | `A01`, p.4 |
| `θ_o` | 旧任务输出头参数 | 旧任务 head | 新任务进入前存在 | 旧模型训练 | 共享表示 | `Y_o` / 当前 `Ŷ_o` | 旧任务类别输出维度 | warm-up 冻结、联合阶段可更新 | 联合阶段旧响应损失梯度 | optimizer step | `A02`,`A05`, p.4 |
| `θ_n` | 新任务输出参数 | 新任务 head | 新任务加入时创建 | Xavier 随机初始化 | 共享表示 | 新任务类别 logits / `Ŷ_n` | 新类别数 × 前层宽度（论文描述） | warm-up 单独训练，之后联合训练 | `L_new` 梯度 | 两阶段按冻结规则更新 | `A03`,`A05`, pp.4–5 |
| `X_n` | 新任务图像 batch | 数据输入 | warm-up / 联合训练时可见 | 新任务数据集 | 原始图像 | 旧、新模型前向输入 | batch × 图像维；预处理依 backbone | 本轮输入；非旧样本回放 | N/A | 不由 optimizer 更新 | `C01`,`A04`, pp.1,4 |
| `Y_o` | 旧模型响应 | 旧模型前向路径 | 新任务样本上记录 | `(θ_s, θ_o)` 旧模型 | `X_n` | 旧任务软概率目标 | batch × 旧任务标签数 | 每次新任务扩展时在其输入上重算 | N/A；作为 target | 不被 optimizer 更新 | `C02`,`A04`, pp.3–5 |
| `Y_n` | 新任务真实标签 | 新数据监督 | 每个训练样本存在 | 新任务数据集 | 新任务标注 | 监督目标 | batch × 新任务标签数 | 固定 target | N/A | 不由 optimizer 更新 | `F01`, p.4 |
| `L_total` | 联合目标标量 | loss 计算图 | 每个 batch 前向后 | `L_old + L_new + R` | `Y_o, Ŷ_o, Y_n, Ŷ_n, θ` | loss / 参数梯度 | batch loss 后聚合为标量 | 按当前参数重新计算 | `backward()` 产生可训练参数梯度 | optimizer.step 改变允许更新的参数 | `F01`–`F06`, pp.4–5 |

## Source Notes

关键机制已对照本地论文 PDF 第 3–5 页；Table 1 / Table 2 和实验协议已对照第 6–10 页。旧 review 和 evidence audit 保留在原位置作为历史材料，不替代本 v2 模型与 registry。迁移后 G1 仍为 pending，需人工核阅再推进。
