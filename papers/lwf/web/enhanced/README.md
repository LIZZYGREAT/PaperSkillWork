# LwF 交互式精读 · Workflow v2

当前版本是 *Learning without Forgetting*（LwF）的第一纵向切片，包含三个场景：问题设定、训练路线比较、旧任务响应 `Y_o` 的来源。三个场景共享同一组旧模型与扩展模型对象。场景 D–J 暂不展开，等待 A–C 的人工学习验收。

## 本地预览与构建

需要 Node.js 和 npm。在本目录安装依赖后运行：

```bash
npm install
npm run dev
```

生产构建运行 `npm run build`，构建后的静态文件位于 `dist/`；可用 `npm run preview` 查看构建结果。Vite 使用配置运行器加载配置，适配当前受限工作区。

## 第一纵向切片

- **A · 问题从哪里来：** 建立旧任务训练数据不可用的约束，并区分微调、特征提取和联合训练。
- **B · 训练路线比较：** 选择路线，查看数据来源、共享参数状态与旧任务信号。
- **C · 追踪旧任务信号：** 沿 `X_n → f_old → Y_o` 重建旧模型响应来源，并与新任务标签 `Y_n` 区分。
- 持久工作区在切换场景时保留同一组共享参数、任务头、模型和信号关系。
- 页面末尾列出学习验收问题。构建和交互不能自动通过学习门禁，`G0–G7` 仍待人工核阅。

## 证据与术语

术语说明从 `knowledge/terms.yaml` 读取，证据登记从 `research/02_evidence_registry.yaml` 读取；页面中的术语弹层和“术语与证据”面板共用这些登记源。证据结论以本地论文 PDF、[arXiv 版本](https://arxiv.org/abs/1606.09282)及 `research/` 中的逐项审计为准。推导、实现映射和教学示意会与论文直接事实区分。

## 代码位置

| 路径 | 内容 |
| --- | --- |
| `src/App.tsx` | Workflow v2 A–C 主体验与持久工作区 |
| `src/components/ReferencePrimitives.tsx` | 术语弹层、术语与证据面板 |
| `src/data/registry.ts` | 解析项目内术语和证据登记 |
| `src/styles/v2.css` | v2 页面、窄屏与减少动态效果样式 |
| `src/App.v1.tsx` | 上一版入口快照，留作迁移核对 |

页面是 PaperSkillWork 中的 Enhanced 工作副本；Canonical 论文源和工作流门禁仍分别管理。
