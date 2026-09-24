# LwF 前置术语表

> 面向首次阅读 *Learning without Forgetting* 的读者。定义以本文语境为准；一般持续学习概念参考用户提供的《持续学习前置知识笔记》，方法细节以原论文为准。

| 术语 | 简明定义 | 在 LwF 中的角色 | 不要混淆 |
| --- | --- | --- | --- |
| Continual Learning | 数据 / 任务按顺序到来时，学习新知识并尽量保持旧能力 | LwF 的研究背景 | 本文实验不是覆盖所有 CL 设置 |
| Catastrophic Forgetting | 学习新任务后旧任务表现明显下降 | fine-tuning 所显示的核心风险 | 不是数据被删除，而是模型行为退化 |
| Stability–Plasticity | 保留旧能力与适应新任务之间的折衷 | `λ_o` 控制旧任务损失相对权重的教学解释 | 不是论文直接测量的单一指标 |
| CNN | 由卷积网络处理图像的神经网络 | 本文方法和实验对象 | 不等于 Transformer / LLM |
| Shared parameters (`θ_s`) | 多任务共用的网络主体参数 | 产生共享视觉表示；joint-optimize 时更新 | 不等于旧任务专属头 |
| Task-specific head (`θ_o`, `θ_n`) | 为单个任务输出类别预测的参数 | 旧任务头与新增任务头 | 旧头只在 warm-up 阶段冻结，之后可更新 |
| Softmax probability | 将分类 logits 归一化为类别概率 | 旧模型和当前模型的分类响应 | 不是 one-hot 真实标签 |
| Knowledge distillation | 用教师模型输出约束学生 / 当前模型输出 | 用旧模型软响应保持旧任务行为 | 不是旧图像或标签的经验回放 |
| Temperature (`T`) | 对概率进行温度重标定的参数 | `T>1` 让分布更平滑；本文使用 `T=2` | 不与优化器学习率混淆 |
| `λ_o` | 旧任务响应损失的权重 | 平衡旧响应蒸馏与新任务标签损失 | 不是旧任务性能百分数，也不保证无遗忘 |
| Warm-up | 训练开始时冻结部分模型参数，仅训练新增输出层 | 先让新头具备新任务预测能力 | 论文指出它对 LwF 并非关键条件 |
| Joint-optimize | 解冻共享参数与任务头进行联合更新 | 第二阶段最小化完整目标 | 不等于 joint training 基线，后者使用新旧数据 |
| Joint training | 同时用多个任务的训练数据优化共享网络 | 实验参照；需要旧数据 | 不属于 LwF 的数据假设 |
| Replay / Exemplar | 存少量旧任务样本，训练新任务时再次提供 | 本文没有采用 | `Y_o` 是旧模型在新输入上的输出，不是 memory |
| Representation drift | 共享表示因参数更新发生变化 | 解释旧任务性能退化 | 是机制解释，不是论文主损失公式 |
| mAP / accuracy | VOC 使用平均准确率；其他主分类任务使用准确率 | 论文 Table 1 比较指标 | 跨指标值不能直接同尺度比较 |

## 阅读顺序建议

先复习普通分类训练、共享 Backbone / Head、fine-tuning、知识蒸馏与灾难性遗忘，再读本文的架构和损失。EWC、Experience Replay、Prototype、ViT Prompt、LoRA 是更宽的持续学习路线，可用于对照，但不是 LwF 的组成部分。
