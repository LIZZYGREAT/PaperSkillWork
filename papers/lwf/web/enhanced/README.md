# LwF 交互式精读 · Workflow v2

当前版本在 *Learning without Forgetting*（LwF）的交互章节中提供 00 背景导读和 01–10 场景，沿用 PaperSkill 的章节目录和分页框架。各页共用一个持续工作区；Paper 事实、Runtime 实现映射和 Teaching Toy 教学计算分别标注。00 用于解释论文背景，不计入人工学习验收；实现和构建不代表学习门禁通过。

## 本地预览与构建

需要 Node.js 和 npm。在本目录安装依赖后运行：

```bash
npm install
npm run dev
```

生产构建运行 `npm run build`，构建后的静态文件位于 `dist/`；可用 `npm run preview` 查看构建结果。Vite 使用配置运行器加载配置，适配当前受限工作区。

## 场景 00–10

- **00 · 论文背景与研究目标：** 简介旧任务数据不可用时加入新任务的问题设定、常见路线的取舍、LwF 的旧响应思路及其输入覆盖边界；不增加训练门禁。
- **01 · 问题空间与方法约束：** 展示新旧数据可用性，比较特征提取、微调和联合训练，并由问题条件引出 LwF 需要的旧任务信号。
- **02 · 构造 LwF 系统：** 交互检查任务边界与参数集合，建立独立的 Teacher / Student 对象，按样本 ID 生成旧响应，并配置 warm-up 参数组。
- **03 · 执行一个训练步：** 用户逐步执行 batch、forward、loss、backward 和 optimizer step。小型 Teaching Toy 即时计算示意，不伪装成论文模型运行结果。
- **04 · 拆解旧响应蒸馏：** 比较 top-1 与完整响应，动态检查温度变换、逐类损失、缓存和 reduction，并从 Student old logits 查看计算得到的梯度；数值明确标为 Teaching Toy，T² 仅作为显式的实现变体。
- **05 · 稳定性与可塑性的梯度折衷：** 从旧响应 logits 经合成线性 Jacobian 计算共享梯度，与新任务目标组成 aligned / orthogonal / conflicting 场景；展示 λ、温度、reduction、正则化与 plain SGD 对真实 toy 梯度和轨迹的影响，并查看 Figure 7 面板索引、来源审计与原文 PDF 链接。
- **06 · 函数保持与参数保持：** 用可计算反例检查参数空间与函数空间的不同，沿等半径方向比较响应漂移；通过 Xₙ probes 对比参数约束和响应约束，区分参数 L2 与普通 weight decay，并显示未观测输入上的响应边界。
- **07 · 域覆盖与监督缺口：** 用标注为 schematic 的覆盖视图和计算型 Teaching Toy 对比 Xₙ 上相同响应损失与旧支持点上的行为漂移；区分采样稀疏、分布错位、训练与评估权限，浏览论文任务对和数据集背景，不计算没有依据的域距离分数。
- **08 · 连续任务与 Teacher 谱系：** 手动检查 Model₀→Model₁→Model₂→Model₃，追踪 stage-specific responses、旧 head 角色、共享 backbone 演化、缓存重算和 Add Task D 步骤；Teaching Toy target 数值与 Figure 4 论文证据分开展示。
- **09 · 论文证据与结论审计：** 以 claim selector 连接实验设置、Table 1/2、Figure 4/7 与结论边界；程序化重构 ImageNet→CUB 表中的绝对值，逐个检查方法信息条件，并将作者解释、机制说明与论文实测结果分层。
- **10 · 端到端 LwF 工作流：** 将 A–I 汇为 8 步实现路线，提供可切换的 Paper / Runtime / Code 视图、参数组与 shape 示例、手动运行前核对表、实现排错路径，以及下一任务 Teacher 快照循环。页面伪代码是实现导向的说明，不是论文原始代码；shape 与元素数是明确标注的 AlexNet 示例，不代表当前工作区 checkpoint。
- PaperSkill 左侧章节栏与上一页 / 下一页控件保持可用；正文维持单栏阅读宽度，右下角悬浮工作区入口可展开共享工作区与对象检查器，状态随章节更新。A、B、C、J 的相关正文还提供就近入口，可直接打开并定位对象。
- 场景切换和构建不代表学习验收通过，学习问题与 `G0–G7` 仍待人工核阅。

## 证据与术语

全站 Reference Hub 以 `src/data/knowledge.ts` 的符号、公式、数据集、方法、阶段、误区、证据和主张卡为统一目录，并索引 `knowledge/terms.yaml` 与 `research/02_evidence_registry.yaml` 的原始条目。搜索覆盖内容与来源类别，详情提供场景、公式、变量和证据交叉链接；场景入口通过同一 canonical card ID 打开。面板打开时会锁住底层页面滚动，列表与详情各自在面板内滚动。证据结论以本地论文 PDF、[arXiv 版本](https://arxiv.org/abs/1606.09282)及 `research/` 中的逐项审计为准。推导、实现映射和教学示意会与论文直接事实区分。

## 代码位置

| 路径 | 内容 |
| --- | --- |
| `src/App.tsx` | 分页章节框架、共享会话状态与持续工作区 |
| `src/scenes/Scene00.tsx` | 论文背景、研究目标和方法边界导读 |
| `src/scenes/SceneA.tsx` | 问题条件与路线推理 |
| `src/scenes/SceneB.tsx` | 参数边界、模型对象、旧响应与 optimizer 配置 |
| `src/scenes/SceneC.tsx` | 用户驱动的训练步骤与梯度检查 |
| `src/scenes/SceneD.tsx` | 旧响应、温度、损失分解和梯度检查 |
| `src/scenes/SceneE.tsx` | 梯度几何、参数边界、数值 SGD 轨迹及 Figure 7 |
| `src/scenes/SceneF.tsx` | 参数 / 函数空间反例、Xₙ 探针、基线与观测输入边界 |
| `src/scenes/SceneG.tsx` | 定性覆盖示意、样本数对照、旧域 Teaching Toy 与数据泄漏边界 |
| `src/scenes/SceneH.tsx` | 手动任务谱系、target 来源、stage matrix、cache 生命周期与 Task D 流程 |
| `src/scenes/SceneI.tsx` | 主张审计、Table 1 读表、Table 2 / Figure 4 / Figure 7 与证据图 |
| `src/scenes/SceneJ.tsx` | 端到端实现步骤、Paper / Runtime / Code 同步视图、参数生命周期、人工检查清单与排错 |
| `src/data/tableResults.ts` | Table 1 的 LwF 基线、签名差值与程序化绝对值重构 |
| `src/simulation/lwfTeachingToy.ts` | 独立的可计算教学模型与状态 reducer |
| `src/simulation/distillation.ts` | 蒸馏分布、损失、reduction 与梯度计算 |
| `src/simulation/gradientTradeoff.ts` | 旧响应到二维共享 toy 梯度的 Jacobian 映射与目标计算 |
| `src/simulation/functionPreservation.ts` | 参数距离、响应漂移、等价重参数化与探针计算 |
| `src/simulation/domainCoverage.ts` | 覆盖状态、约束样本、教学函数与旧支持点响应计算 |
| `src/components/ReferencePrimitives.tsx` | 术语弹层、术语与证据面板 |
| `src/components/ReferenceHub.tsx` | 全类型统一搜索、筛选、卡片详情和交叉引用抽屉 |
| `src/components/workspaceActions.ts` | 场景正文的工作区打开与对象定位入口 |
| `src/styles/scene-j.css` | Scene J 工作流、运行时映射、参数表、检查清单与窄屏排版 |
| `src/styles/workspace-curtain.css` | 悬浮入口、展开式共享工作区及响应式布局 |
| `src/data/registry.ts` | 解析项目内术语和证据登记 |
| `src/data/knowledge.ts` | 全站 canonical knowledge cards |
| `src/styles/v2.css` | 分页布局、场景容器、可读字级与窄屏样式 |
| `src/App.v1.tsx` | 上一版入口快照，留作迁移核对 |

页面是 PaperSkillWork 中的 Enhanced 工作副本；Canonical 论文源和工作流门禁仍分别管理。

原论文 PDF 通过 arXiv 外链打开，需要浏览器可访问网络；交互页保留图表读图说明和来源边界，不依赖外部 PDF viewer 嵌入。
