# PaperSkillWork 宏观工作流 v3

本工作流用于制作能帮助读者理解论文内容与动机的教程。基本顺序是：

> 先确定论文的学习主线，再筛选内容优先级；先明确优先级，再设计交互；两者都明确后再开始实现。

W 阶段描述的是制作流程，不是固定的章节提纲。只有 W6 才开始编写教程页面代码。W2、W4、W7、W9 需要人工进行语义评审；W0、W1、W3、W5、W6、W8、W10 在结构检查通过后自动完成。结构检查不能证明教程具备良好的教学效果。

W4/W5 的叙事与表达规则见通用教学设计规范（TEACHING_DESIGN_STANDARD.md）；实际页面的浏览器验收见 Visual QA 规范（VISUAL_QA.md）。以下 W0–W10 阶段和机器可读 schema 保持不变。

## W0–W10 一览

```text
W0 来源登记
 ↓
W1 原文缓存与素材清单
 ↓
W2 论文理解模型
 ↓
W3 证据与素材筛选
 ↓
W4 学习主线与信息优先级
 ↓
W5 视觉与交互规划
 ↓
W6 首个纵向切片
 ↓
W7 人工学习体验评审
 ↓
W8 完整实现
 ↓
W9 学习效果与证据审计
 ↓
W10 上游打包与预检
```

| 阶段 | 要回答的问题与工作内容 | 完成条件 |
| --- | --- | --- |
| W0 | 当前处理的是哪篇论文、哪份来源？记录标题、作者、期刊/会议与年份、来源类型和位置；如有 URL 和来源哈希，也一并记录。此阶段不设计章节、比喻或动画。 | `paper.yaml` 中的必需来源元数据齐全后自动完成。 |
| W1 | 后续工作能否依赖一次稳定、完整的原文阅读和有用的素材清单？完整读取或提取一次原文，并缓存内容、定位信息和视觉素材清单。若缓存失败，应整体修正。 | 缓存文件、清单元数据和图表目录都通过校验后自动完成。 |
| W2 | 论文实际上做了什么？基于原文建立论文理解模型，涵盖问题、洞见、对象、架构、流程、状态/时间、训练/运行、结果和局限。此阶段不设计网页。 | **人工评审：** 确认模型准确解释了论文内容。 |
| W3 | 哪些解释可以安全发布，哪些原文视觉素材有帮助？逐条建立证据，并为每项视觉素材决定使用或排除。记录来源、定位、处理计划和使用权依据；此时还不生成衍生图。 | 结构和引用通过检查后自动完成。若来源/证据冲突尚未解决、表述不安全或素材使用权不明确，则保持阻塞。 |
| W4 | 读者应该沿着哪条因果/运行路径理解论文？哪些内容可以省略？为每个候选内容标记 `CORE`、`SUPPORTING`、`REFERENCE` 或 `DELETE`。 | **人工评审：** 确认学习主线和内容优先级。 |
| W5 | 哪些关系仅靠文字不容易讲清？只规划确有帮助的视觉表达/交互、证据、可复用模式、素材和纵向切片。 | 机器可读的实现计划覆盖所有优先级并通过校验后自动完成；只有真实的教学设计与目标上游契约冲突时，才在现有计划中记录该冲突。此时还不写页面代码。 |
| W6 | 真实切片能否讲清计划中的内容？只实现学习主线中首批 2–3 个阶段；项目模板从创建时就包含上游所需入口。 | implementation-manifest.json 中切片 CORE 均为 complete，并由 Codex 构建和最小浏览器检查后自动完成。 |
| W7 | 看过切片后，初次阅读者是否能更准确地解释论文？评审主线清晰度、重点、架构、流程、文字负担及交互是否有用。 | **人工评审：** 记录 PASS/REVISE 和理由。REVISE 时修改并重复 W6/W7。 |
| W8 | 如何一致地完成已认可的教学模型？实现全部 CORE；紧凑呈现 SUPPORTING；将 REFERENCE 放在主线之外；省略 DELETE。 | 实现覆盖检查、项目测试、生产构建和 Visual QA 通过后自动完成。官方契约由 W10 的正式预检把关。 |
| W9 | 学习者能否重建论文方法？重要主张是否都能追溯来源？由人审阅实际网页、学习结果、证据、视觉表现、无障碍体验、移动端行为和教学示例边界。 | 人工评审：用户预览成品并确认；在 audit/final-check.md 记录真实的教学、证据、视觉和验收结论。 |
| W10 | 教程能否作为独立上游项目导入和验证？ | W9 经使用者确认后，由使用者手动触发一次官方导入、验证、构建与预检；通过后才完成。操作步骤见唯一的[人工投稿操作手册](UPSTREAM_RELEASE.md)。 |

## W1：原文缓存与视觉素材清单

使用以下目录结构：

```text
source-cache/
├── content.md
├── manifest.json
├── evidence.json
└── figures/
```

`content.md` 保存完整提取或转录的论文文本，并按章节、页码、公式记录定位信息。`manifest.json` 保存来源元数据、可用时的来源哈希、提取信息，以及所有原文图表。每项图表至少记录 `id`、`locator`、`caption`，并可选填 `image_path`、`type`、`candidate_role`。`evidence.json` 保存建立证据登记表所需的原文定位笔记。缓存内容是内部规划资料，不会自动成为公开教程内容。

原文视觉素材按以下类型分类：`ARCHITECTURE`、`PIPELINE`、`ALGORITHM`、`MECHANISM`、`RESULT`、`ABLATION`、`DATASET_EXAMPLE`、`QUALITATIVE_RESULT` 或 `LOW_VALUE`。清单必须包含所有原文视觉素材，包括之后决定不使用的素材。

## W2：论文理解模型；W3：证据与素材筛选

论文理解模型只回答“这篇论文在做什么？”。它首先应以简短段落说明原有问题、作者做出的改变，以及这种改变可能带来的帮助。对于复杂系统，应在规划界面前记录组件、所有权、连接/分支、输入、输出，以及共享部分和任务专属部分。追踪一条完整的数据流、状态流或请求流。对于训练类论文，适用时记录输入、输出、监督信号、损失、反向/控制信号和参数更新。

证据登记表回答“哪些内容可以安全地表述？”。每条重要主张都要记录证据 ID、主张、来源定位、类型、适用条件和允许使用的措辞。类型包括 `PAPER_FACT`、`PAPER_RESULT`、`AUTHOR_INTERPRETATION`、`OUR_INTERPRETATION`、`IMPLEMENTATION_MAPPING`、`GENERAL_BACKGROUND` 和 `TEACHING_EXAMPLE`。数值结果应关联对应的数据集、模型、数据划分、指标和实验协议。

对于选作教学用途的素材，W3 记录来源论文/版本、图表编号和页码、来源定位/路径、原始图注、教学作用、处理计划、证据链接、署名信息及已批准的使用权依据。原图必须存在于 `source-cache/figures/`；W3 不要求生成衍生图。W5 在 `design/implementation-plan.md` 中增加机器可读的素材映射，将每项选用的公开素材分配到一个学习主线阶段或 `Reference Hub`，并选择 `original`、`crop`、`redraw` 或 `overlay`。W6/W8 期间生成 `assets/figures/web/` 下的衍生图和对应网页副本；W8 检查网页文件与 README 来源说明，W10 检查导出副本。对于重要但未使用的素材，应说明原因。能访问论文 PDF 并不代表获得了图片使用权。

## W4：信息优先级与学习主线

对于每个 CORE 阶段，人工审查时确认读者先前已知什么、当前缺口是什么、为何引入下一机制、机制中什么发生变化，以及页面上可观察到什么并如何引出下一问题。这是检验因果衔接的提问，不是强制页面字段。术语只在读者确实需要命名或理解相关对象时引入，并指定一个主要教学位置。

学习主线是一条因果/运行过程路径，不是论文目录，也不要求固定章节数。常见结构如下：

```text
问题 → 既有方法为何不足 → 核心思想 → 系统架构
→ 信息/状态流 → 训练/推理 → 证据 → 局限
```

请根据论文调整结构，并保持主线连贯。优先级矩阵应遵守：

- `CORE` 必须安排在主线的某个阶段。
- `SUPPORTING` 用简洁的行内说明、简短交互、悬停提示或可展开细节呈现。
- `REFERENCE` 放入 `Reference Hub`、悬停提示、实现说明或进阶详情，不应成为主线场景。
- `DELETE` 直接省略，即使内容本身正确。

不要为了凑章节而重复解释核心内容。检查器可以发现重复的项目 ID；语义上是否重复仍需人工判断。

## W5：交互规划

在现有 implementation-plan 中记录本次设计交接：文字、图形、交互和动画各自承担什么任务；读者改变什么以及观察到什么；页面、状态和视口的验收范围；已确认的不变量、可自行调整项、未确认的取舍和受影响区域。高风险动画需列出关键状态及对象/连接关系。已有页面或用户提供的已确认设计是约束，不因“优化”之名重做。不要为同一决定新建平行合同；实际渲染检查按 VISUAL_QA.md 执行。

先判断文字、表格或论文原图是否已经足够。只有当空间或时间关系确实难以用文字理解时，才设计可视化。不要仅仅因为某个标量能用滑块调节，就把它扩展成大型实验台。每个 CORE 项目只能在一个实现阶段中指定一个 `primary_vehicle`；深入内容放入参考区。

`design/implementation-plan.md` 中 `implementation:` 下的 YAML 代码块是唯一的机器可读计划。它要求每个 CORE 恰好映射一次、每个 SUPPORTING 都有简洁呈现位置、每个 REFERENCE 都位于主线之外，并且不包含 DELETE。证据引用必须能解析；阶段 ID 必须存在于学习主线（Learning Spine）。`vertical_slice.stages` 和 `required_core_items` 定义 W6 的覆盖检查。选用的素材也必须指定阶段和渲染方式。

如有适用模式，先查阅可复用模式库：Architecture Explorer、Flow Stepper、Branch Highlighter、Before/After Comparator、Timeline、Evidence Viewer、Term Hover、Reference Hub、Expandable Detail 或 Result Protocol Card。将选中的源代码复制或改编到 `web/enhanced/src/`，使每个导出项目都自包含；不要跨论文导入运行时代码。

PaperSkillWork 内的 `reusable-kit/registry.yaml` 是可用模式名称的登记来源。`implementation.stages[].reusable_pattern` 为非空字符串时，W5 检查器会拒绝未登记的名称；不使用可复用模式时填写 `null`。持续学习工作区可在 W5/W6 复制默认组件，再按计划加入可选组件：

```powershell
python tools/paper.py scaffold-kit <paper-id> --preset continual-learning --add EvidenceViewer,BenchmarkExplorer
```

脚手架命令只在 `web/enhanced/src/shared/` 不存在时创建自包含副本。W5 明确选择 P1 可选组件后，在同一次调用中使用 `--add`；之后修改论文副本不会反向改写 Kit。

建议提供 `Reference Hub` 和术语悬停解释。悬停内容应回答：术语是什么、它在本文中的作用是什么、以及容易与什么概念混淆。主线必需的推理应直接展示在主路径中。

### 上游要求处理

W5 不再要求所有项目手写章节/模块映射表。先按真实学习主线设计页面；如已确认的教学设计与目标 PaperSkill 契约出现具体冲突，只在现有 design/implementation-plan.md 记录该冲突和待决选项。上游章节和模块是否合规，以正式预检时的官方校验器及 paper-skill/contract.md 为准，不在本仓库复制一套数量门槛。

新建网页时模板直接提供完整的 React/Vite 源入口。src/data/tutorial.ts 由真实页面实现同步填充；自定义 App 可以直接渲染页面，不需要虚构 componentId。不得生成空白章节、假交互、占位模块或第二套教学运行时。

## W6–W9：实现与评审

每完成一个页面或完整交互，Codex 按 VISUAL_QA.md 对实际浏览器截图进行检查；共享 CSS 或组件变更要扩大回归范围，并保护已经确认的结构、视觉语义和动画。无法执行的检查如实记为 NOT_RUN。

W6 从实际切片开始。首次创建网页时，上游所需的入口、基础样式、tutorial.ts、组件注册表、Vite 配置和锁文件已经由模板生成。Codex 实现真实切片、同步教学数据、安装依赖、构建并进行最小浏览器检查。W6 不再运行或保存独立的 structure 检查报告。

W7 是学习效果评审，不是按钮或动画评审。如果评审者体验切片后仍无法解释问题、核心机制、系统架构和一条完整流程，应先修正教学设计，再继续编写剩余内容。W7 通过后再完成 W8。

W8 完成所有计划中的 CORE，紧凑呈现 SUPPORTING，将 REFERENCE 放在主线之外并省略 DELETE。Codex 检查现有实现覆盖，运行项目测试和生产构建，并对真实发布源完成 Visual QA。W8 不要求准备 PaperSkill 检出或运行官方发布校验器；当前上游契约由 W10 的一次全量正式预检把关。不要重复填写工程检查 PASS。

W9 保留真实人工判断。用户预览最终网页并确认学习、证据和视觉审阅；Codex 将构建、Visual QA、回归范围、教学与证据发现以及用户验收记录在现有 audit/final-check.md。不要要求用户为工程校验结果手填四行 PASS；不要由 Agent 代替用户确认成品。

## W10：一次正式上游预检

W9 经使用者确认后，由使用者手动触发 W10。`tools/paper.py upstream-check` 会读取 `paper.yaml` 中的一次性论文元数据和用户全局 Git 配置中的贡献者资料，在隔离检出中完成官方导入、验证、构建和 preflight，并写入机器报告。Codex 不主动运行 W10、不推送、不创建 PR；用户可明确要求 Codex 解释预检错误或修复具体缺陷。完整 PowerShell 操作步骤只维护在[人工投稿操作手册](UPSTREAM_RELEASE.md)。

## 设计文档与工作区

每个设计决策只保留一份规范文档；不要创建重复的说明文件：

```text
research/
├── paper-model.md
└── evidence-registry.yaml
design/
├── learning-spine.md
├── asset-plan.md
└── implementation-plan.md
audit/
└── final-check.md
```

```text
papers/<paper-id>/
├── paper.yaml
├── source/paper.url
├── source-cache/
├── research/
├── design/
├── audit/
├── assets/figures/{original,web}/
└── web/enhanced/
```

```text
html_output/<paper-name>/<version>/
```

术语和参考内容按需放入应用的知识/参考数据中；不要另建设计文档重复记录相同内容。

## 工具行为与历史工作区

Workflow v3 is the only active workflow contract. `tools/paper.py` validates metadata, source caches, evidence and asset plans, implementation coverage, paths, and export structure. W2/W4/W7/W9 require `--reviewed-by` and `--note`; W0/W1/W3/W5/W6/W8/W10 record `completed_by: automation` after their checks pass. The tooling does not judge teaching quality.

Historical v1/v2 artifacts are preserved by Git history and are not supported by the current CLI or tests. Inspect historical work through Git history or migrate it manually into a new Workflow v3 workspace.
