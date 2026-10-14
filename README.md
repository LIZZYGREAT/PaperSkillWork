# PaperSkillWork

PaperSkillWork 用于制作以论文原文为依据的交互式教程，帮助初次阅读者重建论文的问题、核心思想、系统架构、信息流、证据和局限。

## 核心教学设计理念

**PaperSkillWork 的目标不是给论文摘要配上动画，而是让第一次接触论文的读者，能够沿着问题的因果链，独立推演出论文的方法与实际执行过程。**

教程首先说明现实任务、已有条件和约束，从最容易想到的方法出发，说明它们为什么不足，再自然引出论文采用的机制。每一个新概念或新模块都应回答前文留下的具体问题，而不是突然出现一个孤立的术语、公式或动画。

**先建立最简单、能够自洽的系统，再逐步补上真实算法必须解决的难题。** 为了教学，可以暂时假定某些输入或系统状态已经准备好，从而先把一条核心流程讲透；但必须交代这些假设、暂时省略的细节，以及后续在哪一页补上。教学呈现顺序可以不同于论文叙述顺序或真实运行时序，但不能改变算法含义；在完整流程部分必须恢复真实执行顺序。

对于重要机制，应让读者追踪：**当前已经拥有什么输入与状态 → 为什么执行这一步 → 具体计算或处理什么 → 形成哪些中间结果 → 状态是否改变 → 结果怎样传给下一步**。特别要区分训练与推断、持久数据与临时数据、可学习参数与计算得到的量。

**交互是解释因果关系的工具，不是装饰。** 图、公式、示例数据、步骤控制与文字必须对应同一套可核验的计算逻辑；用户应能从画面中重建算法行为。不要为凑页面或交互数量而引入重复内容。关键主线不应藏在悬停提示或低对比度的未激活状态中。

**可视化优先呈现算法行为，而不是一整屏的计算数据。** 对具有真实计算步骤的机制，要通过连续的图形变化展现对象从哪里来、如何计算、为何被选择，以及哪些状态被保留。公式解释图中正在发生的运算；具体坐标、排行榜、逐项小数和调试数据默认收起，按需检查，不能用大量数字代替可视化。与当前动画直接对应的引导文字、图形和操作控制应位于同一个可持续观察的工作区，避免读者反复上下滚动。一个机制的各阶段应保持主要视觉对象和坐标参照连续，不应把切换截图、突然出现的结果或颜色闪烁冒充计算动画。教学合成数据既要符合真实公式，也要让点位、标签和视觉空间清楚可辨。推理链不能因精简被删掉，而应与图形分阶段同步；必要的背景可以放在工作台上方，进入动画后则让当前图形、说明和控制保持相邻。真正的算法动画让输入、模型、节点、目标、损失与参数在一个持续工作区中保有可追踪的身份，再用移动、连接、聚合、变换和聚焦说明它们之间的计算关系。动画的验收看学习者能否解释公式和运行步骤，而不看按钮或动效的数量。

**引导性文案本身也是教学推演。** 教程不仅要说明“做了什么”，还要让读者沿着“回忆已有条件 → 提出问题 → 形成直观想法 → 引入机制 → 观察计算 → 理解下一问题”逐步思考。已经确认的引导逻辑可以为准确性和可读性而润色，但不能删去关键转折、反问和前后因果，把推演压缩成术语清单。概念应在当前问题需要它时出现；先讲透核心机制，再在真正用到时补全训练、筛选、维护和表示变化等系统关系。

**文字、公式与画面应逐段同步呈现。** 长引导应拆成可跟随、可回看的短段，并可用左右交错或轻量展开降低阅读负担；不要一次堆满尚未讲过的术语辨析、重复免责声明或与当前思考无关的边界说明。算法动画先明确输入、已有状态和目标，再展示公式代入、候选形成、结果比较和状态更新；重复迭代遵循“第一轮完整演示、第二轮揭示变化、后续适度加速”的节奏。贪心近似等限制应准确而精炼地交代，不能盖过主线。

**论文事实、推导、教学假设和合成数据要严格区分。** 真实实验结果必须有论文依据；合成坐标与示意动画不能冒充实验或真实训练轨迹。为提高可读性可以调整教学示例，但不得牺牲公式、数据关系与结果的一致性。

**以学习者理解为验收核心。** 自动构建通过、动画流畅或页面好看，都不能取代“读者能否回答为什么引入该机制、它怎样运作、输出如何得到”的人工审查。优先修正因果断裂、语义错误和误导性的可视化，避免过度设计、过度封装、遗留兼容和无必要的大规模重做。

**可视化的一致性要同时覆盖数值、对象和时间。** 同一计算中的目标、模型输出、损失必须来源一致；局部公式探索值不得伪装成模型真实输出。算法动画应在同一可读、无需水平滚动的工作台上，通过对象的连续传递、变换、聚合和反向流动展示实际步骤，不能用切换静态画面、反复显示整套数值表格代替计算过程。文字与控制必须贴近当前图形；有限画面优先留给必要的对象与因果关系，详细数值后置。对任何与训练、优化有关的示意动画，必须明确区别教学演示和真实模型参数更新。

上述原则与仓库现有的 [`AGENTS.md`](AGENTS.md)、[`docs/WORKFLOW.md`](docs/WORKFLOW.md) 和 [`docs/TEACHING_DESIGN_STANDARD.md`](docs/TEACHING_DESIGN_STANDARD.md) 共同约束教程制作；后者继续分别定义仓库规则、工作流阶段和通用教学设计边界。

## 工作流 v3

```text
W0 来源登记 → W1 原文缓存与素材清单 → W2 论文理解模型
→ W3 证据与素材筛选 → W4 学习主线与信息优先级
→ W5 视觉与交互方案 → W6 首个纵向切片
→ W7 人工学习体验评审 → W8 完整实现
→ W9 学习效果与证据审计 → W10 上游打包与预检
```

开始前请先阅读 [docs/WORKFLOW.md](docs/WORKFLOW.md)。核心顺序是：先确定论文的学习主线和内容优先级，再规划交互或编写教程界面。W7 人工学习评审通过后，才能进入完整实现。模板文件及生成路径见[模板约定](docs/TEMPLATE_CONTRACT.md)。

新论文工作区只保留六份设计与审计文档：`research/paper-model.md`、`research/evidence-registry.yaml`、`design/learning-spine.md`、`design/asset-plan.md`、`design/implementation-plan.md` 和 `audit/final-check.md`。原文提取内容放在 `source-cache/`。

## 常用命令

```powershell
python tools/paper.py new <paper-id> --title "..." --url "..." --author "..." --venue "..." --year 2026 --source-type arXiv
python tools/paper.py status <paper-id>
python tools/paper.py check <paper-id>
python tools/paper.py stage <paper-id>
python tools/paper.py stage <paper-id> W0 in_progress
python tools/paper.py stage <paper-id> W0 complete
python tools/paper.py stage <paper-id> W4 complete --reviewed-by "评审者姓名" --note "学习主线已通过评审"
python tools/paper.py release-check <paper-id>
python tools/paper.py paths <paper-id>
python tools/paper.py open <paper-id>
python tools/paper.py release-info <paper-id> --json
python tools/paper.py stage <paper-id> W10 complete
```

`new` 在 W0 一次性记录已知论文信息，并同步初始源缓存元数据；后续阶段从 `paper.yaml` 读取，不重复录入。W6/W8 检查真实网页源。进入 W10 时，先运行只读的 `release-info` 获取论文源码路径和导入参数，再按唯一的[人工投稿操作手册](docs/UPSTREAM_RELEASE.md)在现有 PaperSkill 检出中运行官方 Import、validate 和 preflight；官方 preflight 通过后，用 `stage <paper-id> W10 complete` 记录进度。贡献者默认值通过用户全局 Git 配置在不同论文间复用。

`new` 会登记论文信息并创建 v3 工作区。若来源是用户提供的 PDF，可用 `--source-location "user-provided PDF"`，此时 `--url` 可以省略；请填写 `--source-type`，用多个 `--author` 提供全部作者，并在已知时填写 `--venue` 和 `--year`。工具不会根据 URL 推断论文内容。

只有 W2、W4、W7、W9 需要 `--reviewed-by` 和 `--note`。W0、W1、W3、W5、W6、W8 在机器检查通过后由工具记录 `completed_by: automation`；W10 在使用者完成官方预检后由工具记录进度，不依赖本仓库导出或旧审计报告。若 W3 仍有未解决的来源或证据冲突、不安全的表述，或素材权利不明确，就不能完成。`check` 会校验结构、路径、引用和实现覆盖情况，但不会判断教学质量。

PaperSkillWork current tooling supports Workflow v3 only. Historical workflow versions remain available through Git history but are not runtime compatibility targets.

## 仓库内技能

按当前工作流阶段使用 `.agents/skills/` 中对应的 skill：

```text
$paper-review             # W2
$evidence-audit           # W3
$learning-architecture    # W4
$implementation-plan      # W5–W7
$enhanced-implementation  # W6–W8
$final-audit              # W9–W10
```

## 上游发布

PaperSkill 建议作为 PaperSkillWork 的 sibling 检出：

```text
<workspace-parent>/
├── PaperSkill/
└── PaperSkillWork/
```

首次克隆和轻量 Sparse Checkout 初始化见[PaperSkill 初始化指南](docs/PAPERSKILL_SETUP.md)；日常投稿只遵循[唯一的 W10 投稿手册](docs/UPSTREAM_RELEASE.md)。工作流阶段与评审边界仍以 [docs/WORKFLOW.md](docs/WORKFLOW.md) 为准。
