# EWC：克服神经网络的灾难性遗忘 · Enhanced 交互式教程

基于 Kirkpatrick 等人的论文 *Overcoming catastrophic forgetting in neural networks*，使用 PaperSkill React + TypeScript + Vite 模板构建。Enhanced 版按十页学习路径，从问题与前置概念逐步讲到 Bayesian 交接、Fisher 重要性、一次参数更新、任务边界状态、实验协议与完整因果流程。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

交互中的参数、Fisher、梯度和更新数值均明确标记为教学玩具；实验结论引用原文并说明适用边界。最终交付保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 目录结构

| 路径 | 说明 | 是否生成器（Agent）修改 |
| ---- | ---- | ---- |
| `src/data/tutorial.ts` | 论文、场景导航和场景问题/学习出口元信息 | ✅ |
| `src/data/knowledge.ts` | 证据索引与术语定义 | ✅ |
| `src/data/session.ts` | 可复算的教学玩具状态和公式计算 | ✅ |
| `src/scenes/*.tsx` | 六个可交互学习场景 | ✅ |
| `src/styles/paper.css` | Enhanced 页面布局与响应式交互样式 | ✅ |
| `src/modules/*.tsx` + `registry.tsx` | PaperSkill 模板组件（Canonical 版复用其组件注册方案） | 模板保留 |
| `public/images/*` | 论文原图（可选） | ✅ 仅放图 |
| `src/components/*` | 静态展示组件（Hero/Chapter/Module…） | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具（canvasKit / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。

## 十页学习路径

1. 研究问题、必要概念与 EWC 实现步骤预览
2. 任务 B 的梯度为何可能覆盖任务 A
3. 顺序 Bayes 如何把旧任务后验传递为新任务先验因子
4. Fisher 与局部对角近似如何设定参数偏移成本
5. 总梯度如何合成，以及一次更新真正改变哪些对象
6. 参数、旧锚点、Fisher 与数据在任务边界上的生命周期
7. Permuted MNIST 的任务构造和实验协议
8. MNIST 结果与 Fisher overlap 的证据边界
9. Atari 组合系统、指标、限制和可支持的主张
10. 对照实验结论并逐步回放 EWC 的完整状态流

证据卡可展开查看来源段落、对应原文链接和主张边界；术语卡可展开查看当前场景定义。教学状态在切换场景时保留，可从状态台重置。
