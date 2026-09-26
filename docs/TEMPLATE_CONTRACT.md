# PaperSkillWork 模板约定

`tools/paper.py new` 使用固定模板创建 Workflow v3 工作区。占位符会按字面替换；模板没有额外的模板语言或条件逻辑。

## 允许使用的占位符

```text
{{paper_id}}
{{paper_title}}
{{paper_url}}
{{arxiv_id}}
```

所有新工作流模板只能使用这些占位符。未提供 arXiv ID 时，`{{arxiv_id}}` 会替换为空字符串。

## Workflow v3 文件映射

| 模板 | 生成位置 |
| --- | --- |
| `paper.yaml` | `paper.yaml` |
| `source-content.md` | `source-cache/content.md` |
| `source-manifest.json` | `source-cache/manifest.json` |
| `source-evidence.json` | `source-cache/evidence.json` |
| `paper-model.md` | `research/paper-model.md` |
| `evidence-registry.yaml` | `research/evidence-registry.yaml` |
| `learning-spine.md` | `design/learning-spine.md` |
| `asset-plan.md` | `design/asset-plan.md` |
| `implementation-plan.md` | `design/implementation-plan.md` |
| `implementation-manifest.json` | `web/enhanced/implementation-manifest.json` |
| `final-check.md` | `audit/final-check.md` |

提供 `--url` 时会创建 `source/paper.url`。原文缓存模板只是待补充的脚手架；W1 应基于完整原文阅读填充占位内容，并登记所有图表。`source-cache/figures/` 存放捕获的原文视觉素材。W3 记录原图来源和处理计划，不要求先生成衍生图。W5 记录选用素材的位置和渲染方式，衍生图在实现阶段创建。`web/enhanced/` 会附带空的实现清单；W6 之前不会生成教程页面脚手架。

`release.upstream_paper_name`、`release.upstream_version` 和 `release.output` 初始为空。请显式设置两个上游标识；`release.output` 必须恰好为 `html_output/<upstream_paper_name>/<upstream_version>`，不会根据内部 `paper_id` 自动推导。

生成模板不会分析原文、分配内容优先级或推进工作流阶段。只有 W2、W4、W7、W9 需要人工评审；W0、W1、W3、W5、W6、W8、W10 在检查通过后记录 `completed_by: automation`。若 W3 的来源/证据冲突、不安全措辞或素材使用权问题尚未解决，就不能完成。

`implementation-plan.md` 中非空的 `reusable_pattern` 必须匹配 `reusable-kit/registry.yaml`。持续学习项目可用 `tools/paper.py scaffold-kit <paper-id> --preset continual-learning` 复制 P0 源码，并用 `--add` 复制 W5 明确选择的 P1 组件；复制结果独立保存在论文的 `web/enhanced/src/shared/` 中。

## 旧版模板

旧版脚手架统一收在 `templates/legacy/`：v1 模板直接位于该目录，v2 模板位于 `templates/legacy/v2/`。这些文件只用于明确发起的旧工作区迁移或核对，不属于新工作流，也不应用来生成平行重复的设计文档。
