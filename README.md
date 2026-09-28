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
```

`new` 会登记论文信息并创建 v3 工作区。若来源是用户提供的 PDF，可用 `--source-location "user-provided PDF"`，此时 `--url` 可以省略；请填写 `--source-type`，用多个 `--author` 提供全部作者，并在已知时填写 `--venue` 和 `--year`。工具不会根据 URL 推断论文内容。

只有 W2、W4、W7、W9 需要 `--reviewed-by` 和 `--note`。W0、W1、W3、W5、W6、W8、W10 在机器检查通过后由工具记录 `completed_by: automation`。若 W3 仍有未解决的来源或证据冲突、不安全的表述，或素材权利不明确，就不能完成。`check` 会校验结构、路径、引用和实现覆盖情况，但不会判断教学质量。

`papers/` 中已有的 Workflow v1/v2 工作区仍由原有检查读取，本次变更不会重写它们。`migrate-v2` 仍用于显式执行 v1 迁移。

## 仓库内技能

按当前工作流阶段使用 `.agents/skills/` 中对应的 skill：

```text
$paper-review             # W2
$evidence-audit           # W3
$learning-architecture    # W4
$implementation-plan      # W5–W7
$scene-spec               # 仅用于旧流程；新工作使用 implementation plan
$enhanced-implementation  # W6–W8
$final-audit              # W9–W10
```

`$narrative-design` 和 `$interaction-design` 已弃用，只是旧名称别名；不会再创建独立的 storyboard 或 interaction-plan 文档。

## 上游发布

PaperSkill 建议作为 PaperSkillWork 的 sibling 轻量检出：

```text
<workspace-parent>/
├── PaperSkill/
└── PaperSkillWork/
```

完整的 partial clone、sparse checkout、W10 检查和 PR 流程见[docs/UPSTREAM_RELEASE.md](docs/UPSTREAM_RELEASE.md)。
