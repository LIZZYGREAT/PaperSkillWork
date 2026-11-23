# Learning without Forgetting Evidence Audit

> Paper ID：`lwf`<br>
> Source：`source/paper.pdf`（arXiv:1606.09282v3，PDF pp.1–13；论文内页码与 PDF 页码一致）<br>
> Workflow Gate：G2 Evidence Audit（论文主张初审已完成；按新增的原图审计要求，图表盘点仍待执行；未推进 gate）

## 一、核对原则

网页事实以本地原论文为准；两份 CL 笔记作为教学背景，不能替代论文证据。网页必须标明“论文事实 / 论文结果 / 作者解释 / 教学示意 / 我们的解读”。数值必须绑定任务对、模型、数据划分与指标。未知或由表格差值换算的项目要明确说出。

## 二、核心主张核对

| ID | 主张 | 类型 | 原文依据 | 网页使用范围 / 注意点 |
| --- | --- | --- | --- | --- |
| C01 | LwF 的目标是在没有旧任务训练数据时向已有 CNN 加入新任务并尽量保留旧能力 | `PAPER_FACT` | 摘要、引言，PDF pp.1–2 | 可以直接陈述；边界为作者的视觉 CNN 设置 |
| C02 | LwF 在新任务样本上记录旧模型旧任务响应，再匹配当前模型响应 | `PAPER_FACT` | Figure 2(e), 方法，PDF pp.3–4 | 要说清输入是新任务图像；这些响应不是旧样本回放 |
| C03 | 目标由新任务交叉熵、加权旧任务蒸馏损失和 weight decay 组成 | `PAPER_FACT` | 式 (1)–(4)，PDF p.4；Figure 3, PDF p.5 | 写作 `λ_o L_old + L_new + R`；不要将 LwF 主方法写成参数距离惩罚 |
| C04 | `T=2`，`λ_o` 大多数实验为 1，`R` 的 weight decay 为 0.0005 | `PAPER_FACT` | PDF pp.4–5 | 参数是论文实验设置，不表示对所有任务最优 |
| C05 | 训练先冻结 `θ_s, θ_o` 训练新头，再联合训练 `θ_s, θ_o, θ_n` | `PAPER_FACT` | 方法，PDF p.4 | 旧头在第二阶段参与联合优化；warm-up 对 LwF 不是关键条件 |
| C06 | LwF 在所测多项分类任务中通常优于 fine-tuning 的新旧任务折衷，但存在任务对例外 | `PAPER_RESULT` | Table 1, PDF p.7；Figure 4, PDF p.8 | 必须给定确切任务对与指标；不能概括为普遍领先 |
| C07 | 旧响应在新任务输入上的约束有分布代表性限制 | `AUTHOR_INTERPRETATION` + `OUR_INTERPRETATION` | 引言、讨论与 ImageNet→MNIST / CUB 分析，PDF pp.2, 7, 10 | 作者指出可能的分布影响；网页把它提炼为可理解的适用边界，须标“解读” |
| C08 | 方法组合知识蒸馏和 fine-tuning | `AUTHOR_INTERPRETATION` | 相关工作 / 讨论，PDF pp.2, 10 | 可作为作者定位；不是称其为 replay 或 parameter-isolation |
| C09 | 论文只在分类任务上作系统主实验，并附一项 MD-Net 跟踪实验 | `PAPER_FACT` | PDF pp.6–10, 12–13 | 不外推至 LLM、foundation model 或广泛在线学习 |
| C10 | 方法还可用于分割、检测、样本缓存改进与在线学习 | `FUTURE_WORK` | 讨论，PDF pp.10–11 | 只能放在“作者未来方向”，不能写成已实现能力 |
| C11 | 旧参数变化不一定等价于旧功能变化；LwF 以响应而非参数距离为主约束 | `AUTHOR_INTERPRETATION` | Figure 7 讨论及参数 L2 对照，PDF pp.9–10 | “功能保持”作为解释简写，限定在受约束的新任务输入上 |

## 三、架构与机制核对

| ID | 组件 / 机制 | 论文是否提出 | 当前实现证据 | 网页事实边界 |
| --- | --- | --- | --- | --- |
| A01 | 共享网络参数 `θ_s` | 是 | 主干为 AlexNet，少量验证用 VGG-16；PDF pp.4, 6–7 | 不称为现代 ViT 或 LLM backbone |
| A02 | 旧任务专属参数 `θ_o` | 是 | 原模型已有的输出参数；joint-optimize 时可更新，PDF pp.4–5 | 不能说旧头永久冻结 |
| A03 | 新任务参数 `θ_n` | 是 | 为新类别新增输出节点 / 权重，Xavier 初始化，PDF pp.4–5 | 主实验通常只把最终输出层作为 task-specific |
| A04 | 新数据上的旧响应 `Y_o` | 是 | 算法步骤先用旧模型处理 `X_n`，PDF pp.4–5 | 不是从旧数据缓存取得；soft target 不是真实旧标签 |
| A05 | Warm-up + joint-optimize | 是 | 先训练 `θ_n`，之后联合优化三类参数，PDF p.4 | 不是一开始所有参数都自由更新 |
| A06 | 温度蒸馏 `T=2` | 是 | 式 (2)–(4)，PDF p.4 | 仅呈现论文分类输出形式；softening 图可用标明的教学 logits |
| A07 | Replay buffer / exemplar memory | 否 | 论文设定明确不使用旧任务训练数据，PDF pp.1, 4–5 | 不得将 `Y_o` 称作 replay memory |
| A08 | 任务扩展架构与额外 task-specific layers | 有替代设计实验 | Figure 6 / Table 2, PDF pp.9–10 | network expansion 是对照 / 消融，不是默认 LwF 主结构 |

## 四、公式与变量核对

| ID | 公式 / 变量 | 论文定义 | 来源 | 网页说明约束 |
| --- | --- | --- | --- | --- |
| F01 | `L_new = −y_n · log ŷ_n` | 新任务单样本多项逻辑 / 交叉熵损失 | 式 (1), PDF p.4 | `y_n` 为 one-hot 标签；概率来自 softmax |
| F02 | `y'_o(i) ∝ y_o(i)^(1/T)`；当前输出同理归一化 | 温度化旧模型与当前模型概率 | 式 (4), PDF p.4 | 展示归一化；温度提高会平滑分布 |
| F03 | `L_old = −Σ_i y'_o(i) log ŷ'_o(i)` | 旧任务响应的蒸馏交叉熵 | 式 (2)–(3), PDF p.4 | 限于旧任务输出维度；多个旧任务与标签项求和 |
| F04 | `L_total = λ_o L_old + L_new + R` | 参数的联合训练目标 | PDF p.5, Fig.3 | `R` 是普通 weight decay，不能改写成 Fisher/EWC |
| F05 | `λ_o` | 旧响应损失权重；多数实验设为 1 | PDF p.5 | 较大提高旧任务目标相对权重；不等于成功保证 |
| F06 | `T=2` | 通过 held-out grid search 选择的本文设置 | PDF p.4 | 热度示意用自定义 logits 时明确标“教学示意，不是论文数据” |

## 五、实验数字核对

| ID | Benchmark / 条件 | Metric / split | 方法 | 论文可见值 | 网页值 | 状态 |
| --- | --- | --- | --- | ---: | ---: | --- |
| E01 | ImageNet→CUB；AlexNet；Table 1(a) | ImageNet old accuracy / CUB new accuracy；ImageNet validation、CUB test；三次均值 | LwF | 54.7 / 57.7 | 54.7 / 57.7 | PASS，原表值 |
| E02 | 同上 | 同上 | Fine-tuning | 原表相对 LwF 为 −3.8 / −0.7 | 50.9 / 57.0 | PASS，按 Table 1 delta 换算 |
| E03 | 同上 | 同上 | Feature extraction | 原表相对 LwF 为 +2.3 / −5.2 | 57.0 / 52.5 | PASS，按 Table 1 delta 换算 |
| E04 | 同上 | 同上 | Joint training | 原表相对 LwF 为 +0.6 / −1.1 | 55.3 / 56.6 | PASS，按 Table 1 delta 换算；使用旧数据 |
| E05 | Places365→CUB | Places365 accuracy drop 相对 Table 1(a) LwF 行 | Fine-tuning / LwF / joint training | 论文文字给 8.4 / 3.8 / 1.5 个百分点旧任务损失 | 不作为主互动精确图 | PASS，PDF p.7 明确解释 |
| E06 | MD-Net tracking appendix | VOT 2015 expected average overlap | MD-Net / MD-Net + LwF | 0.373 / 0.383 | 0.373 / 0.383（仅文中附注） | PASS；论文称差异不具统计显著性 |

换算规则：Table 1 注明其他方法行记录的是与 LwF 的 performance difference；`baseline absolute = LwF value + signed difference`。网页及 README 会标明换算，避免让用户误以为 Table 1 逐项直接列出了所有绝对值。Table 1 对 VOC 使用 mAP，其余使用 accuracy；不可把这一局部表格的 ImageNet / CUB acc 与 VOC mAP 混在同一轴上。

## 六、Figure 与素材核对

下表记录的是旧版网页当时如何重述图表，不是“禁止使用原图”的长期规则。依照现行工作流，LwF 的原图清晰度、教学价值、复用权利及网页讲解尚待逐图复核；在此之前不能把本节视为完整的 source visual audit。当前网页确实主要使用自制图，但这只描述现有实现状态。

| Figure / Table | 内容 | 原文位置 | 网页处理 |
| --- | --- | --- | --- |
| Figure 1 | 方法的定性比较表 | PDF p.2 | 旧版以自制文字 / 对照图重述；原图待评估 |
| Figure 2 | 原结构、基线与 LwF 流程 | PDF p.3 | 旧版使用自制交互结构图；原图待评估 |
| Figure 3 | LwF 算法步骤 | PDF p.5 | 旧版以步骤交互重述；原图待评估 |
| Table 1 | 多任务方法比较 | PDF p.7 | 旧版采用 ImageNet→CUB 四法对比；需评估原表是否值得并列展示 |
| Figure 4 | 多任务加入后各任务准确率曲线 | PDF p.8 | 旧版以定性时间线表达；原图及其可读性待评估 |
| Table 2 / Figure 7 | 架构与损失消融 / 性能折衷 | PDF pp.9–10 | 旧版以文字重述；原图表待评估并链接已有证据项 |
| Table 3 | 附录跟踪分数 | PDF p.12 | 旧版在局限区作次要证据；原表待评估，须保留“不显著”限定 |

盘点状态：待完成。后续在 `research/01_paper_model.md` 的 Source Visual Inventory 中记录上述项目及其他图表的教学价值、`WEB` / `SOURCE_ONLY` / `OMIT` 决策、授权依据、保存路径与场景解释；有价值且允许复用的原图应予保留并在网页讲解。源 PDF 位于 `source/`，不因此进入网页发布包。

## 七、结论边界

### 可直接支持

- 在论文测试的分类设置中，LwF 仅用新任务数据训练并以旧模型输出提供约束。
- 它在多数被测任务对中比 fine-tuning 更好地保持旧任务性能；不同方法之间存在权衡。
- 对新任务图像计算一次共享表示即可得到各任务输出；joint training 需要旧数据且作者报告训练更慢。

### 需要限定

- 性能是任务对、模型、split 与超参数条件下的实验结果；多任务序列会继续产生遗忘。
- 新样本并非旧任务代表时，旧响应约束不足；MNIST 例子中新任务适配不如 fine-tuning，旧任务也明显下降。
- 输出行为保持仅作用于可见新任务输入，不意味着旧分布上的完全函数保持。
- 跟踪实验样本范围有限且提升无统计显著性。

### 不能推出

- 不推出无需任何数据或教师计算；训练新任务图像和旧网络响应仍必需。
- 不推出零遗忘、旧知识完美保留、参数完全冻结、支持任意模态或大语言模型。
- 不推出 LwF 方法实现了 EWC、Replay、Exemplar、Prompt / LoRA。
- 不把作者的未来工作描述成当前系统功能。

## 八、论文内部矛盾与不确定项

- Table 1(a) 表头脚注提到 validation 表现，但 PDF p.6 的协议说明指出 CUB / Scenes 使用 test split，ImageNet / Places365 / VOC 使用 validation split。网页必须按 p.6 说明将所选 ImageNet→CUB 数值标为 ImageNet validation + CUB test，不照抄简化 caption。
- Table 1 对基线采用相对 LwF 差值；绝对分数是可复算值，应保留说明与一位小数精度。
- 任务序列实验重新计算其他旧任务在当前新数据上的响应，因此软目标会随每次扩展而变化；这正是实际顺序流程的一部分，不能声称固定一位最初教师贯穿所有任务。
- 作者关于“像 joint training”的结论来自特定任务对；joint training 使用旧数据，比较并非数据条件相同。

## 九、Enhanced 实现约束

- 旧输出须画成旧模型在**新任务输入**上的软响应，并始终区分响应与旧训练样本。
- 架构必须显示共享 `θ_s`、旧头 `θ_o`、新头 `θ_n`；Warm-up 冻结 `θ_s, θ_o`，联合阶段三类参数均参与更新。
- LwF 主目标使用 `λ_o L_old + L_new + R`；参数 L2 只作为被比较的另一种方法。
- 教学分布、温度曲线、损失权重滑杆若非论文定量数据，必须标记“示意”。不允许将模拟结果表现成准确率或论文训练曲线。
- 基准比较仅展示一个证据完整的 ImageNet→CUB 表，并显示 split、模型、metric 与均值协议。基线绝对值标记为由原表差值换算。
- 任务差异交互只表达定性推论：新输入越不代表旧域，软响应约束越难覆盖旧域；坐标不代表论文量化的相似度。
- “稳定性 / 可塑性”“功能保持”是我们的教学解释，旁注回论文定义与实际数据边界。
- 不称 LwF 为 replay；不声称旧任务头始终被冻结；不暗示所有旧模型输出都被无限期固定。
- 不添加来源不清的图片、字体、第三方 CDN 或运行时依赖。论文原图按 Source Visual Inventory 记录来源与复用权利；不得因旧版页面使用自制 Canvas 图而一概排除原图。

## 十、最终核对结论

Evidence Audit Status：

```text
PASS_WITH_NOTES
```

说明：主机制、损失、关键超参数、任务与指标、代表性 Table 1 结果、消融方向和结论边界均已与本地 PDF 定位核对。两项发布相关说明保留为显式备注：Table 1 的 baseline 值由原表 delta 换算；Table 1 的数据 split 需结合正文协议说明理解。此状态仅覆盖论文主张核对，不覆盖尚未执行的 source visual inventory；不替代用户对最终网页的人工核对，也不推进 G2。
