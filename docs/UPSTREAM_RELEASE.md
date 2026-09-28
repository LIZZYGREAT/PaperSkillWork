# PaperSkill 上游发布与 W10 预检

本指南说明如何将 PaperSkillWork 中的 LwF 正式源 `papers/lwf/web/final/` 导入 PaperSkill，并生成可审查的上游预检报告。

`web/final/` 是内部冻结的 React + TypeScript 发布源；它不是上游 PR 目录。正式导出目录由 PaperSkill 官方导入命令创建，路径为 `html_output/<paper-name>/<version>/`。上游教程 PR 只应包含该导出目录。

## 开始前

只有 W0–W9 全部完成后才运行 W10。先在 PaperSkillWork 仓库根目录检查：

```powershell
python tools/paper.py check lwf
python tools/paper.py status lwf
```

`check` 必须通过，`status` 中 W0–W9 必须为 `COMPLETE`。这项检查会确认工作区结构和教学实现映射；W2、W4、W7、W9 的学习质量结论仍来自人工评审。

## 准备 PaperSkill

官方仓库地址为 `https://github.com/ReductTech/PaperSkill.git`。全新克隆可按以下步骤准备：

```powershell
git clone https://github.com/ReductTech/PaperSkill.git
Set-Location PaperSkill
git checkout main
git pull --ff-only origin main
git status --short
node --version
npm --version
npm ci
git status --short
```

使用 Node.js 20 或更高版本。`git status --short` 应为空；如果安装依赖后有受版本控制的改动，先查明原因并恢复干净状态，再做预检。

如果从自己的 fork 工作，`origin` 应指向 fork，`upstream` 应指向 `ReductTech/PaperSkill`。先将目标分支同步到官方基线，例如：

```powershell
git remote -v
git fetch upstream
git checkout main
git rebase upstream/main
git status --short
```

按实际仓库的默认分支调整 `main`。**`upstream-check` 只使用传入 checkout 当前的 HEAD；它不会 fetch，也不会判断这个提交是否已更新到最新的 `ReductTech/PaperSkill`。** 因此由操作者确认目标基线后再运行。

## 检查 Final 正式源

在 PaperSkillWork 仓库中运行：

```powershell
$repoRoot = Get-Location
Set-Location papers/lwf/web/final
npm ci
npm run build
npm test
npm run test:browser
Set-Location $repoRoot
python tools/paper.py check lwf
python tools/paper.py status lwf
```

此命令块从 PaperSkillWork 仓库根目录运行。不要把 `web/enhanced/` 当作发布源；配置了 `web.final` 的工作区会优先使用 `web/final/`。

## 填写正式发布标识

在 `papers/lwf/paper.yaml` 的 `release` 项填写真实、已确认的上游标识：

```yaml
release:
  upstream_paper_name: learning_without_forgetting
  upstream_version: <pinyin><MMDD>
  output: html_output/learning_without_forgetting/<pinyin><MMDD>
```

- `upstream_paper_name` 使用完整英文论文标题的小写下划线形式。
- `upstream_version` 按公开署名对应的拼音小写加四位月日填写；当前校验格式还允许末尾追加 `_数字`。
- `output` 必须精确对应 `html_output/<upstream_paper_name>/<upstream_version>`。
- `--participant` 填公开展示的署名；姓名和拼音需由发布者提供，不要猜测或代填。

本项目当前没有设置这些公开发布标识。确认实际署名和版本号后再写入配置。

## 一键运行 W10 上游预检

在 PaperSkillWork 仓库根目录执行：

```powershell
python tools/paper.py upstream-check lwf `
  --paperskill-repo "C:\path\to\PaperSkill" `
  --participant "<public display name>" `
  --pinyin "<romanized-name>" `
  --github "<github-username>"
```

`--paperskill-repo` 必须指向已准备好的干净 Git checkout。若公开署名只含 ASCII 字符，工具不要求 `--pinyin`；发布版本仍须符合 `paper.yaml` 的命名约定。没有 GitHub 用户名时可省略 `--github`。只有当目标导出目录已存在且操作者确认允许替换时，才追加 `--replace-output`。

### 预检做了什么

工具会按以下顺序运行，并将命令结果与路径写入 `papers/lwf/audit/upstream-preflight.json`：

1. 确认所给路径是 Git checkout，且工作区没有已跟踪或未跟踪改动。
2. 记录该 checkout 的 `HEAD` 提交 SHA。
3. 创建隔离的临时 clone 和 `paperskillwork-preflight` 临时分支，并配置仅作用于临时 clone 的 Git 身份。
4. 将 `web/final/` 复制到临时导入源；排除 `node_modules`、`dist`、`dist-ssr` 和 `.vite`。
5. 运行 PaperSkill 官方 `npm run import`，传入论文标题、URL、公开署名及版本信息。
6. 检查导入生成的变更都位于配置的 `html_output/<paper>/<version>/` 目录。
7. 只暂存该导出目录，并创建临时教程提交；确认临时 checkout 已干净。
8. 运行 `npm run validate` 和 `npm run build:paper -- <paper>/<version>`。
9. 确认校验和构建没有留下源码改动，且 HEAD 仍是临时教程提交，然后运行 `npm run preflight`。
10. 将官方导入结果复制到 PaperSkillWork 的 `html_output/`，计算导出目录 SHA-256，并保存机器报告。

这个临时提交是必要的：上游预检按 Git 提交范围模拟 PR。只保留未提交的导出文件，不能准确模拟最终 PR 的变更范围。整个过程不会改动所提供的 PaperSkill checkout 或其 Git 配置；Git 身份仅写在隔离临时 clone 中。

### 官方命令的作用

- `npm run import`：把正式 React 项目导入目标 `html_output/` 并生成 `paper.json`。导入会过滤依赖目录、构建目录和旧的 `paper.json`。
- `npm run validate`：检查必需文件、`paper.json`、资源路径、章节和模块约束、组件注册及上游输出契约。
- `npm run build:paper -- <paper>/<version>`：构建指定导出版本。
- `npm run preflight`：模拟上游 PR 前检查，包括验证、PR 范围校验、受影响构建及合并演练。

### 检查成功报告

预检成功后，检查 `papers/lwf/audit/upstream-preflight.json`，确认：

- `status` 为 `PASS`；
- `upstream_commit` 和 `temporary_commit` 都是有效提交 SHA，且两者不同；
- `unexpected_paths` 为空，`changed_paths` 只在目标导出目录内；
- `npm run import`、`npm run validate`、`npm run build:paper`、`npm run preflight` 的退出码均为 0；
- `export_sha256` 存在。

随后回到 PaperSkillWork 仓库根目录运行：

```powershell
python tools/paper.py check lwf
python tools/paper.py release-check lwf
```

只有报告校验通过且发布检查显示 `RELEASE READY`，才可将工作区标记为 W10 完成。CI 或本地构建通过本身不代表上游已接受或发布。

## 手动排错

只有在需要单独定位导入问题时，才绕开工作流工具手动运行。以下命令应在 PaperSkill checkout 根目录执行：

```powershell
npm run import -- "<path-to-lwf-final>" learning_without_forgetting `
  --title "Learning without Forgetting" `
  --paper-url "https://arxiv.org/pdf/1606.09282" `
  --participant "<public name>" `
  --pinyin "<pinyin>" `
  --version "<pinyin><MMDD>"
npm run validate
npm run build:paper -- learning_without_forgetting/<version>
```

若要把手动结果当作 PR 预演，先只暂存并提交目标教程目录，再运行预检：

```powershell
git add html_output/learning_without_forgetting/<version>
git commit -m "Add Learning without Forgetting tutorial"
npm run preflight -- --base upstream/main
```

提交前用以下命令复核 PR 变更范围：

```powershell
git diff --name-only upstream/main...HEAD
```

最终上游 PR 不应包含其他论文目录、PaperSkillWork 工作流文件、PDF、依赖目录、构建产物、密钥或本机绝对路径。不要将 PaperSkillWork 的 Git 历史合并或 cherry-pick 到 PaperSkill。
