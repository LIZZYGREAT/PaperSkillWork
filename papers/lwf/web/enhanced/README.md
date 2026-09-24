# LwF 交互式精读 · Workflow v2

当前版本在 *Learning without Forgetting*（LwF）的 01–03 交互切片前增加了 00 背景导读页，沿用 PaperSkill 的章节目录和分页框架。四页共用一个持续工作区；Paper 事实、Runtime 实现映射和 Teaching Toy 教学计算分别标注。00 用于解释论文背景，不替代也不计入 A–C 的人工学习验收；场景 D–J 暂不展开。

## 本地预览与构建

需要 Node.js 和 npm。在本目录安装依赖后运行：

```bash
npm install
npm run dev
```

生产构建运行 `npm run build`，构建后的静态文件位于 `dist/`；可用 `npm run preview` 查看构建结果。Vite 使用配置运行器加载配置，适配当前受限工作区。

## 场景 00–03

- **00 · 论文背景与研究目标：** 简介旧任务数据不可用时加入新任务的问题设定、常见路线的取舍、LwF 的旧响应思路及其输入覆盖边界；不增加训练门禁。
- **01 · 问题空间与方法约束：** 展示新旧数据可用性，比较特征提取、微调和联合训练，并由问题条件引出 LwF 需要的旧任务信号。
- **02 · 构造 LwF 系统：** 交互检查任务边界与参数集合，建立独立的 Teacher / Student 对象，按样本 ID 生成旧响应，并配置 warm-up 参数组。
- **03 · 执行一个训练步：** 用户逐步执行 batch、forward、loss、backward 和 optimizer step。小型 Teaching Toy 即时计算示意，不伪装成论文模型运行结果。
- PaperSkill 左侧章节栏与上一页 / 下一页控件保持可用；共享工作区与对象检查器随章节状态更新。
- 场景切换和构建不代表学习验收通过，学习问题与 `G0–G7` 仍待人工核阅。

## 证据与术语

术语说明从 `knowledge/terms.yaml` 读取，证据登记从 `research/02_evidence_registry.yaml` 读取；页面中的术语弹层和“术语与证据”面板共用这些登记源。证据结论以本地论文 PDF、[arXiv 版本](https://arxiv.org/abs/1606.09282)及 `research/` 中的逐项审计为准。推导、实现映射和教学示意会与论文直接事实区分。

## 代码位置

| 路径 | 内容 |
| --- | --- |
| `src/App.tsx` | 分页章节框架、共享会话状态与持续工作区 |
| `src/scenes/Scene00.tsx` | 论文背景、研究目标和方法边界导读 |
| `src/scenes/SceneA.tsx` | 问题条件与路线推理 |
| `src/scenes/SceneB.tsx` | 参数边界、模型对象、旧响应与 optimizer 配置 |
| `src/scenes/SceneC.tsx` | 用户驱动的训练步骤与梯度检查 |
| `src/simulation/lwfTeachingToy.ts` | 独立的可计算教学模型与状态 reducer |
| `src/components/ReferencePrimitives.tsx` | 术语弹层、术语与证据面板 |
| `src/data/registry.ts` | 解析项目内术语和证据登记 |
| `src/styles/v2.css` | 分页布局、场景容器、可读字级与窄屏样式 |
| `src/App.v1.tsx` | 上一版入口快照，留作迁移核对 |

页面是 PaperSkillWork 中的 Enhanced 工作副本；Canonical 论文源和工作流门禁仍分别管理。
