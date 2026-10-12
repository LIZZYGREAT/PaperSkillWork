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

提供 `--url` 时会创建 `source/paper.url`。原文缓存模板只是待补充的脚手架；W1 应基于完整原文阅读填充缓存，并登记所有图表。`source-cache/figures/` 存放捕获的原文视觉素材。W3 记录原图来源和处理计划，不要求先生成衍生图。W5 记录选用素材的位置和渲染方式，衍生图在实现阶段创建。`web/enhanced/` 从项目创建时就包含可独立构建的 React/TypeScript、Vite 入口、锁文件、章节数据入口、组件注册表和基础样式。`tutorial.ts` 初始没有章节，注册表初始没有组件；W6 只向其中加入基于真实论文主线实现的切片，不预置示例章节或假交互。

`release.upstream_paper_name`、`release.upstream_version` 和 `release.output` 初始为空。W10 从英文论文标题生成上游论文名，从统一 contributor profile 和当前日期生成版本，并据此填写输出路径 `html_output/<upstream_paper_name>/<upstream_version>`。只有标题或 contributor profile 无法可靠推导时才需要手动补充。内部 `paper_id` 与上游论文名保持独立。

生成模板不会分析原文、分配内容优先级或推进工作流阶段。只有 W2、W4、W7、W9 需要人工评审；W0、W1、W3、W5、W6、W8、W10 在检查通过后记录 `completed_by: automation`。若 W3 的来源/证据冲突、不安全措辞或素材使用权问题尚未解决，就不能完成。

`implementation-plan.md` 中非空的 `reusable_pattern` 必须匹配 `reusable-kit/registry.yaml`。持续学习项目可用 `tools/paper.py scaffold-kit <paper-id> --preset continual-learning` 复制 P0 源码，并用 `--add` 复制 W5 明确选择的 P1 组件；复制结果独立保存在论文的 `web/enhanced/src/shared/` 中。
