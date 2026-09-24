# LwF Learning Contract

Paper ID: `lwf`  
Source: `source/paper.pdf` (arXiv:1606.09282v3)

## Target Reader

第一次读 *Learning without Forgetting*，理解基础图像分类与神经网络训练，但不熟悉持续学习和本文训练过程的读者。

## Reader Prerequisites

| Concept | Level | Depth needed |
| --- | --- | --- |
| 监督分类、logits、softmax、交叉熵 | Required | 能解释输入、概率输出和标签如何形成分类损失 |
| CNN 的共享 backbone 与分类 head | Required | 能区分共享表示参数和任务专属输出参数 |
| 反向传播、梯度、优化器更新 | Required | 知道计算梯度与真正更新参数是不同步骤 |
| 知识蒸馏 | Helpful | 理解教师概率分布可作为软目标；正文会补足本文用法 |
| 顺序任务、灾难性遗忘 | Helpful | 理解新任务到来时旧任务表现可能下降 |
| Replay、EWC、Prompt、LoRA | Optional | 仅作方法边界对照，不进入 LwF 核心机制 |

## Reader Unknowns

- 新任务训练时哪些旧数据仍不可访问？
- `θ_s`、`θ_o`、`θ_n` 分别处于架构的哪里，何时创建、冻结或更新？
- `Y_o` 从什么输入和模型产生，它与旧样本、旧标签、回放记忆有什么区别？
- 新任务监督与旧响应蒸馏怎样经过 forward、loss、backward 和 optimizer update？
- 温度 `T` 与权重 `λ_o` 改变什么，不能据此推出什么？
- 论文实验支持哪些结论，任务分布、任务序列和 split 对结论有什么限制？

## Final Learning Outcomes

教程完成后，读者应能：

1. 画出共享网络、旧任务头、新任务头、教师响应与新任务数据之间的关系。
2. 追踪一个新任务 batch：旧模型前向得到 `Y_o`，扩展模型前向得到 `Ŷ_o` 与 `Ŷ_n`，计算两类损失和正则项，再说明梯度何时、由谁用于更新。
3. 解释温度变换、`L_old`、`L_new`、`R` 与 `λ_o` 的作用及其边界。
4. 将论文符号映射到可能的运行时参数集合，同时标清论文事实与实现解释。
5. 用具体数据集、模型、split 和指标解释至少一个实验，并指出它没有证明什么。
6. 说明新输入不能代表旧任务分布、连续加入任务时为何仍会遗忘。

## Expected Depth

主线深入解释数据设定、模型对象、阶段状态、信号流、联合损失、更新语义和结论边界。完整复现 MatConvNet、增强细节和所有相关工作留作参考材料。

## Implementation Depth

解释论文参数组与可能的 `shared_backbone` / 任务分类头参数集合的对应关系。说明 batch 张量概念、冻结状态、梯度来源、optimizer 参数组以及 `optimizer.step()` 的状态改变。代码映射标为实现解释，不冒充论文代码逐行描述。

## Evidence Depth

机制以原文第 3 节、Figure 2–3 和式 (1)–(4) 为依据。结果以论文表格/图及实验协议为依据；Table 1 相对 LwF 的基线差值换算结果必须单独标注。区分论文事实、论文结果、作者解释、我们的解释、实现映射、一般背景和教学示意。

## What This Tutorial Is Not

- 不是论文摘要或论文目录的网页化复述。
- 不是固定词典隐喻贯穿全站的动画合集。
- 不是声称 LwF 保证零遗忘、适用于所有任务或已验证现代大模型。
- 不是 PaperSkill 的正式发布副本。
