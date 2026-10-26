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

`new` 在 W0 接收已知的标题、作者、公开 URL、venue、年份和来源类型，一次性写入 `paper.yaml` 并同步初始 `source-cache/manifest.json`；后续阶段读取这些文件，不重复录入。提供 `--url` 时会创建 `source/paper.url`。原文缓存模板只是待补充的脚手架；W1 应基于完整原文阅读填充缓存，并登记所有图表。`source-cache/figures/` 存放捕获的原文视觉素材。W3 记录原图来源和处理计划，不要求先生成衍生图。W5 记录选用素材的位置和渲染方式，衍生图在实现阶段创建。`web/enhanced/` 从项目创建时就包含可独立构建的 React/TypeScript、Vite 入口、锁文件、章节数据入口、组件注册表和基础样式。`tutorial.ts` 初始没有章节，注册表初始没有组件；W6 只向其中加入基于真实论文主线实现的切片，不预置示例章节或假交互。

`release.upstream_paper_name`、`release.upstream_version` 和 `release.output` 初始为空。W9 确认后，用户手动触发 W10；工具从英文论文标题和统一 contributor profile 推导上游论文名及日期版本，并据此填写输出路径 `html_output/<upstream_paper_name>/<upstream_version>`。只有标题或 contributor profile 无法可靠推导时才需要手动补充。内部 `paper_id` 与上游论文名保持独立。W10 操作步骤只见 [docs/UPSTREAM_RELEASE.md](UPSTREAM_RELEASE.md)。

生成模板不会分析原文、分配内容优先级或推进工作流阶段。只有 W2、W4、W7、W9 需要人工评审；W0、W1、W3、W5、W6、W8、W10 在对应 CLI 结构检查通过后记录 `completed_by: automation`。W6/W8 的状态记录不代表 CLI 运行了项目测试、构建、浏览器或教学验收；这些检查由 Agent 执行并单独报告。W2 新执行模型结构只在首次 W2 complete 时校验，旧已完成论文的日常 `check` 不追溯要求迁移。若 W3 的来源/证据冲突、不安全措辞或素材使用权问题尚未解决，就不能完成。

`implementation-plan.md` 中非空的 `reusable_pattern` 必须匹配 `reusable-kit/registry.yaml`，其 `status` 决定成熟度：`deprecated` 使检查失败，`candidate` 只产生 `[WARN]`。使用 `tools/paper.py scaffold-kit <paper-id> --select AssetA,AssetB` 复制 W5 所选资产的准确文件闭包；显式 `--preset continual-learning` 可选择 P0，`--dry-run` 只读预览。相同入口可安全追加，保留本地修改并拒绝冲突。副本独立保存在 `paths <paper-id> --json` 当前解析的 `publish_source` 下的 `src/shared/`，使用 Final-first / Enhanced-fallback 目标；配置了 Final 却缺失，或目标缺少必要的 `src/` 源码结构时应失败，不静默写入 Enhanced。默认只接受 approved；candidate 需显式 `--allow-unapproved`，复制不构成批准。命令与故障处理见 [Reusable Kit](reusable-kit.md)。
