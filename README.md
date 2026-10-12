# PaperSkillWork

PaperSkillWork 用于制作以论文原文为依据的交互式教程，帮助初次阅读者重建论文的问题、核心思想、系统架构、信息流、证据和局限。

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
