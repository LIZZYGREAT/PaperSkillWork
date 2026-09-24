# EWC 交互式论文教程 · Canonical

基于 James Kirkpatrick 等人的 *Overcoming catastrophic forgetting in neural networks*（PNAS 2017；arXiv:1612.00796），使用 PaperSkill React + TypeScript + Vite 模板搭建的兼容性基线。

## 本地运行

需要 Node.js 和 npm。在本目录安装依赖后运行：

```bash
npm install
npm run dev
```

生产构建使用 `npm run build`，构建后可用 `npm run preview` 查看静态站点。

## 教学路径

1. 顺序训练为何造成干扰，以及统一约束的代价；
2. `p(θ|D_A)` 如何在顺序 Bayes 视角中成为下一任务的先验因子；
3. 对角 Fisher 如何调节不同参数的偏移代价；
4. EWC penalty、总梯度与当前参数的一次更新；
5. Permuted MNIST 的任务构造、基线与 Fisher overlap；
6. Atari 的组合系统、指标与近似边界。

网页数值计算器明确标记为教学玩具；论文实验只呈现原文支持的设置和定性结论，不推测曲线精确值。Atari 结果按系统级证据说明，包含任务识别、经验回放和任务专属参数。

## 来源

- [arXiv v2 原文](https://arxiv.org/html/1612.00796)
- [PNAS 论文记录](https://doi.org/10.1073/pnas.1611835114)
- 主张与数值边界见 `../../research/02_evidence_registry.yaml`。

## 状态

本目录是由 PaperSkill 模板派生的 Canonical 兼容性基线；内容与浏览器验收尚待人工核验。Canonical 与 Workflow v2 Enhanced 分开维护。
