# PaperSkill 上游发布边界

## 唯一流程说明

W0–W10 的阶段、人工评审和一次正式发布预检统一见 [docs/WORKFLOW.md](WORKFLOW.md)。本文只记录两个仓库的边界和贡献者默认值，不复制命令清单、校验门禁或章节映射表。

## 仓库边界

- `PaperSkillWork` 保存研究、教学设计、页面源码和审计记录。
- `PaperSkill` 是独立的上游检出，提供官方 Import、校验器、构建和 preflight。
- 不合并两个仓库的提交历史，也不把 PaperSkillWork 的提交 cherry-pick 到 PaperSkill。
- `tools/paper.py upstream-check` 在隔离工作树中准备真实上游改动和 `audit/upstream-preflight.json`；它不会推送、发布或创建 PR。
- 工作流、工具或 Skill 的修改属于 PaperSkillWork，应与论文教程导出分开提交。

PaperSkill 可以位于 PaperSkillWork 的同级目录，但普通 `check <paper-id>` 和 CI 不依赖该本机路径。只有 W10 正式预检需要提供一个干净的 PaperSkill Git 检出。

## 统一贡献者默认值

贡献者是本次投稿人，与 `paper.yaml` 中的论文作者身份不同。一次性保存以下全局 Git 配置后，所有论文工作区都会自动读取；这些个人设置不会进入仓库：

- `paperskillwork.participant`：公开显示名。
- `paperskillwork.pinyin`：拼音，用于生成投稿版本名。
- `paperskillwork.github`：可选 GitHub 用户名。

`upstream-check` 的显式参数可临时覆盖全局默认值。论文标题、作者、URL、venue、年份始终从对应项目的 `paper.yaml` 读取。

发布目录名从英文论文标题生成；版本名以贡献者拼音和投稿日期生成。同名版本冲突时不得静默覆盖，需使用上游规则选择新版本或明确授权替换。

## 发布边界

在用户完成 W9 网页预览和真实验收后，Codex 才运行 W10 正式预检。预检成功仅表示导入、官方验证、构建、变更范围和导出文件通过；维护者仍独立决定是否合并。没有用户授权时，不推送、不发布、不创建 PR。
