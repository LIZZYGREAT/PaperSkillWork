# PaperSkillWork 宏观工作流 v3

本工作流用于制作能帮助读者理解论文内容与动机的教程。基本顺序是：

> 先确定论文的学习主线，再筛选内容优先级；先明确优先级，再设计交互；两者都明确后再开始实现。

W 阶段描述的是制作流程，不是固定的章节提纲。只有 W6 才开始编写教程页面代码。W2、W4、W7、W9 需要人工进行语义评审；W0、W1、W3、W5、W6、W8、W10 在结构检查通过后自动完成。结构检查不能证明教程具备良好的教学效果。

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
| W2 | 论文实际上做了什么？基于原文建立论文理解模型，涵盖问题、洞见、对象、架构、流程、状态/时间、训练/运行、结果和局限。此阶段不设计网页。 | **人工评审：**确认模型准确解释了论文内容。 |
| W3 | 哪些解释可以安全发布，哪些原文视觉素材有帮助？逐条建立证据，并为每项视觉素材决定使用或排除。记录来源、定位、处理计划和使用权依据；此时还不生成衍生图。 | 结构和引用通过检查后自动完成。若来源/证据冲突尚未解决、表述不安全或素材使用权不明确，则保持阻塞。 |
| W4 | 读者应该沿着哪条因果/运行路径理解论文？哪些内容可以省略？为每个候选内容标记 `CORE`、`SUPPORTING`、`REFERENCE` 或 `DELETE`。 | **人工评审：**确认学习主线和内容优先级。 |
| W5 | 哪些关系仅靠文字不容易讲清？只规划确有帮助的视觉表达/交互、证据、可复用模式、素材和纵向切片。 | 机器可读的实现计划覆盖所有优先级且校验通过后自动完成；此时还不写页面代码。 |
| W6 | 真实切片能否讲清计划中的内容？只实现学习主线中首批 2–3 个阶段。 | `web/enhanced/implementation-manifest.json` 中的 `vertical_slice.required_core_items` 均标记为 `complete` 后自动完成。 |
| W7 | 看过切片后，初次阅读者是否能更准确地解释论文？评审主线清晰度、重点、架构、流程、文字负担及交互是否有用。 | **人工评审：**记录 PASS/REVISE 和理由。REVISE 时修改并重复 W6/W7。 |
| W8 | 如何一致地完成已认可的教学模型？实现全部 CORE；紧凑呈现 SUPPORTING；将 REFERENCE 放在主线之外；省略 DELETE。 | 实现清单覆盖完整计划，且所选素材的衍生图、网页副本和来源说明均已就绪后自动完成。 |
| W9 | 学习者能否重建论文方法？重要主张是否都能追溯来源？审查学习结果、证据、工程检查、无障碍体验、移动端行为和教学示例边界。 | **人工评审：**在 `audit/final-check.md` 记录学习/证据结论和实际工程检查结果。 |
| W10 | 教程能否作为独立上游项目导入和验证？运行官方导入、校验、构建与预检。 | 只有导出项目通过检查，且 `audit/upstream-preflight.json` 记录上游提交、临时教程提交、限定范围的变更路径、匹配的导出哈希及成功的命令结果后，才自动完成。 |

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

对于选作教学用途的素材，W3 记录来源论文/版本、图表编号和页码、来源定位/路径、原始图注、教学作用、处理计划、证据链接、署名信息及已批准的使用权依据。原图必须存在于 `source-cache/figures/`；W3 不要求生成衍生图。W5 在 `design/implementation-plan.md` 中增加机器可读的素材映射，将每项选用的公开素材分配到一个学习主线阶段或 `Reference Hub`，并选择 `original`、`crop`、`redraw` 或 `overlay`。W6/W8 期间生成 `assets/figures/web/` 下的衍生图和对应网页副本；W8/W10 检查这些文件、导出副本以及 README 来源说明。对于重要但未使用的素材，应说明原因。能访问论文 PDF 并不代表获得了图片使用权。

## W4：信息优先级与学习主线

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

先判断文字、表格或论文原图是否已经足够。只有当空间或时间关系确实难以用文字理解时，才设计可视化。不要仅仅因为某个标量能用滑块调节，就把它扩展成大型实验台。每个 CORE 项目只能在一个实现阶段中指定一个 `primary_vehicle`；深入内容放入参考区。

`design/implementation-plan.md` 中 `implementation:` 下的 YAML 代码块是唯一的机器可读计划。它要求每个 CORE 恰好映射一次、每个 SUPPORTING 都有简洁呈现位置、每个 REFERENCE 都位于主线之外，并且不包含 DELETE。证据引用必须能解析；阶段 ID 必须存在于学习主线（Learning Spine）。`vertical_slice.stages` 和 `required_core_items` 定义 W6 的覆盖检查。选用的素材也必须指定阶段和渲染方式。

如有适用模式，先查阅可复用模式库：Architecture Explorer、Flow Stepper、Branch Highlighter、Before/After Comparator、Timeline、Evidence Viewer、Term Hover、Reference Hub、Expandable Detail 或 Result Protocol Card。将选中的源代码复制或改编到 `web/enhanced/src/`，使每个导出项目都自包含；不要跨论文导入运行时代码。

建议提供 `Reference Hub` 和术语悬停解释。悬停内容应回答：术语是什么、它在本文中的作用是什么、以及容易与什么概念混淆。主线必需的推理应直接展示在主路径中。

## W6–W9：实现与评审

W6 是首次编写教程页面代码的阶段。先实现小型纵向切片，不要一开始就写完所有页面。在 `web/enhanced/implementation-manifest.json` 中记录实现覆盖情况；每个已实现的 CORE 项目都要写明计划阶段、组件和状态。只有切片要求的 CORE 项目均为 `complete`，W6 才能完成。W7 是学习效果评审，不是按钮或动画评审。如果评审者体验切片后仍无法解释问题、核心机制、系统架构和一条完整流程，应先修正教学设计，再继续编写剩余内容。

W7 通过后再完成 W8。W8 要求所有计划中的 CORE 项目均为 `complete`，所有 SUPPORTING/REFERENCE 位置都与计划一致，并且 DELETE 项目继续省略。最终审计应确认读者能够说清问题和核心思想、重建架构和流程、在适用时解释训练/推理、解释设计原因、概述关键结果并指出局限。另需将主张追溯到来源证据，并明确区分教学示例。实际构建、无障碍和移动端结果都要如实记录，不得推断。

## W10：教学设计约束与上游兼容约束

两类约束彼此独立：

- **教学设计约束：**不设固定章节数、交互模式配额、统一比喻、每章动画或 Canvas 要求。只加入确实有助于学习的内容。
- **上游兼容约束（按当前公开校验器要求）：**导出项目包含 6–10 个章节、至少 4 个启用的模块、至少一个含 2 个模块的章节，并包含规定的项目入口文件及官方校验器要求。这些是导出限制，不是内部教学目标。应通过有意义、自然分组的内容满足要求；不要为了数字凭空添加交互玩具。

导出章节只是对已批准学习主线的打包和分组方式，章节边界不决定论文需要多少概念阶段。

内部 `paper_id` 与上游目录标识分开设置：填写 `release.upstream_paper_name`、`release.upstream_version` 和 `release.output`。`release.output` 必须恰好为 `html_output/<upstream_paper_name>/<upstream_version>`。新建教程时这些发布标识默认为空，进入 W10 前应填入目标上游目录名。

导出的项目至少包含：

```text
paper.json
README.md
package.json
package-lock.json
index.html
vite.config.ts
tsconfig.json
src/App.tsx
src/data/tutorial.ts
src/modules/registry.tsx
src/styles/paper.css
```

项目必须能独立构建，使用相对素材路径，在 `README.md` 中说明图片来源，不包含论文 PDF，不依赖门户或上游脚本改动，也不依赖外部共享包。先将本地 PaperSkill 检出更新到目标提交，再运行：

```powershell
python tools/paper.py upstream-check <paper-id> `
  --paperskill-repo C:\path\to\PaperSkill `
  --participant "Public name" [--pinyin "romanized-name"] [--github "username"]
```

命令会记录所提供检出的提交，然后创建隔离的临时克隆和仅存在本地的测试分支。执行 `npm run import` 后，它会拒绝 `release.output` 目录之外的任何变更，只暂存教程目录并创建临时教程提交。随后 `npm run validate`、`npm run build:paper` 和 `npm run preflight` 都基于该提交运行，以模拟真实教程 PR 的变更文件检查。该流程不会修改所提供的 PaperSkill 检出或其 Git 配置。成功后，命令将验证过的导出复制到 `release.output`，并在 `audit/upstream-preflight.json` 记录两个提交 ID、变更路径、命令结果和复制后导出的 SHA-256；W10 会校验报告和哈希。如果目标目录已存在，传入 `--replace-output` 替换生成的导出。教程 PR 只包含 `html_output/<paper-name>/<version>/`；后续工作流或 skill 改进需另行提交。部分公开自动化行为可能不可见，最终是否合并/发布由维护者决定。CI 通过不保证会合并。

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

## 工具行为与旧工作区

新工作区使用 schema/workflow v3。`tools/paper.py` 会校验元数据、缓存文件、证据/素材计划、实现覆盖、路径和导出结构。W2/W4/W7/W9 需要 `--reviewed-by` 和 `--note`；W0/W1/W3/W5/W6/W8/W10 在检查通过后记录 `completed_by: automation`。工具不会判断课程是否教得好。已有 schema v1/v2 工作区仍可按原有检查读取，且不会自动迁移。

不要在本轮宏观工作流调整中批量迁移或重写现有 schema v1/v2 教程。`templates/legacy/` 中的 v1 模板和 v2 脚手架仅用于明确发起的旧工作区迁移，不用于创建新的论文工作。
