# PaperSkill 上游发布：人工操作手册

本文是 W10 投稿操作的唯一完整指南。工作流定义和评审边界见 [docs/WORKFLOW.md](WORKFLOW.md)。教程贡献只提交到 PaperSkill 的个人 Fork；PaperSkillWork 的研究、工具和工作流变更使用独立仓库与提交。

## PowerShell 操作入口

所有 `tools/paper.py` 命令都从 PaperSkillWork 仓库根目录执行。每个 PowerShell 会话开始时运行一次以下变量块；新开终端后需要重新定义，当前会话内无需重复。处理其他论文时，只需把 `$PaperId` 改为对应标识：

~~~powershell
# 示例路径请按本机实际位置调整
Set-Location 'C:\path\to\PaperWork\PaperSkillWork'
$PaperId = 'ewc'  # 每篇论文、每个新 PowerShell 会话设置一次
$Work = (Get-Location).Path
$PaperSkillRepo = (Resolve-Path '..\PaperSkill').Path
~~~

## A. 新建论文时填写一次元数据

仅新建论文工作区时运行 `new`。已有 EWC 工作区不要重新运行 `new`，直接从 C 节继续。新建其他论文时，先在上方变量块中设置对应的 `$PaperId`。参数按论文真实信息填写；作者有几位就重复几个 `--author`：

```powershell
python tools/paper.py new $PaperId --title "完整英文论文标题" `
  --url "https://..." --source-type "arXiv" `
  --author "作者 A" --author "作者 B" --venue "会议/期刊" --year 2026
```

W0 一次性填写 `paper_id`、英文标题、作者、公开论文 URL、年份、venue、来源类型等已知信息。该命令将元数据写入 `papers/$PaperId/paper.yaml`，并同步初始源缓存元数据。W1–W10 直接读取 `paper.yaml`；不得要求再填一次。若信息缺失或错误，只修正 `paper.yaml` 并同步对应缓存，不新增另一张元数据表。投稿所需的 `--paper-url` 必须是 HTTPS 公开链接，计划投稿时尽量在 W0 提供。

## B. 首次投稿前设置一次贡献者资料

贡献者是投稿人，不等于论文作者。以下全局 Git 配置由同一用户的后续论文复用，不会写入每篇论文的 `paper.yaml`：

```powershell
git config --global paperskillwork.participant "公开展示名"
git config --global paperskillwork.pinyin "拼音或英文标识"
# 可选
git config --global paperskillwork.github "GitHub用户名"
```

版本名前缀优先使用拼音；若没有拼音，可从 ASCII 展示名或 GitHub 用户名推导。只有无法推导时才需要补充拼音。

## C. W9 确认后，由使用者手动运行 W10

**工作目录约定：** 凡运行 `tools/paper.py` 的命令，先进入 PaperSkillWork 仓库根目录；凡运行 `git -C $PaperSkillRepo` 的命令，`$PaperSkillRepo` 指向旁边独立的 PaperSkill 仓库，不是当前工作目录。

已配置的个人检出应让 `origin` 指向个人 Fork、`upstream` 指向官方 PaperSkill；可用 `git -C $PaperSkillRepo remote -v` 核对。

### 首次建立轻量 PaperSkill 检出（仅在尚不存在时）

如果本机还没有 PaperSkill 检出，在两个仓库的父目录运行以下命令。已有配置好的 PaperSkill 检出直接复用并跳过此节，不要重新克隆：

~~~powershell
# 仅首次建立时运行
Set-Location 'C:\path\to\PaperWork'
git clone --filter=blob:none --sparse --depth=1 --single-branch --branch main https://github.com/ReductTech/PaperSkill.git PaperSkill

# 初始 origin 指向官方；改名为 upstream，再添加个人 Fork 作为 origin
git -C .\PaperSkill remote rename origin upstream
git -C .\PaperSkill remote add origin https://github.com/<fork-owner>/PaperSkill.git

# 只检出日常工作所需目录
git -C .\PaperSkill sparse-checkout set catalog docs paper-skill schemas scripts
Set-Location $Work
~~~

`--depth=1` 限制历史深度，`--filter=blob:none` 按需下载文件内容，`--sparse` 配合目录列表限制工作树范围。三者用途不同。日常使用不要运行 `git fetch --unshallow`，也不要展开全部 `html_output`；当前投稿所需的单论文目录只在 D 节展开。

### 日常同步官方 main

确认 PaperSkill 工作区干净，且没有尚未完成、需要保留的贡献分支后，从 PaperSkillWork 根目录同步。先用 `git -C $PaperSkillRepo remote -v` 检查远端；**只有输出中没有名为 `upstream` 的远端时，才首次添加官方远端。** 如果已有 `upstream` 且 URL 正确，跳过下面的添加命令，不要重复执行：

~~~powershell
# 仅当 remote -v 中没有 upstream 时执行一次
git -C $PaperSkillRepo remote add upstream https://github.com/ReductTech/PaperSkill.git
if ($LASTEXITCODE -ne 0) { throw 'Could not add upstream remote' }
~~~

先检查状态；`status --short` 应无输出，有任何输出都应先处理而不要继续。然后获取浅层更新、切换到官方 main，并核对提交号：

~~~powershell
git -C $PaperSkillRepo status --short
# 只有工作区干净且可以离开当前分支时才继续
git -C $PaperSkillRepo fetch --progress --no-tags --depth=50 --filter=blob:none upstream +main:refs/remotes/upstream/main
if ($LASTEXITCODE -ne 0) { throw 'Upstream fetch failed: do not use a stale upstream/main' }

git -C $PaperSkillRepo switch --detach upstream/main
if ($LASTEXITCODE -ne 0) { throw 'Cannot switch to upstream/main' }

$head = git -C $PaperSkillRepo rev-parse HEAD
$base = git -C $PaperSkillRepo rev-parse upstream/main
if ($head -ne $base) { throw 'PaperSkill HEAD does not match upstream/main' }
~~~

最后两项 SHA 必须相同。`--filter=blob:none` 保留按需下载，显式 refspec 确保本地 `upstream/main` 被刷新。`git switch --detach` 不会把尚未确认的贡献分支重置掉；不要改用无条件 `git reset --hard` 或 `git push origin main:main`。不需要另建 W10 克隆或拉取全部历史。如果本地检出以前已下载了全部数据，不必为此删除或重建。

以下只读命令可用于诊断轻量检出状态：

~~~powershell
git -C $PaperSkillRepo rev-parse --is-shallow-repository
git -C $PaperSkillRepo config --get remote.upstream.partialclonefilter
git -C $PaperSkillRepo sparse-checkout list
~~~

按上述方式首次建立的检出通常分别显示 true、blob:none，以及 catalog、docs、paper-skill、schemas、scripts。状态不同只表示本机检出优化方式不同；不要据此判定发布源失败，也不要自动重建仓库。

W9 确认后，使用者手动触发唯一的正式预检：

~~~powershell
python tools/paper.py upstream-check $PaperId --paperskill-repo $PaperSkillRepo
~~~

该命令从 `paper.yaml` 读取论文信息，从全局 Git 配置读取贡献者资料，在隔离检出中依次执行官方导入、验证、构建和 preflight。它会生成/更新本地导出和 `papers/$PaperId/audit/upstream-preflight.json`，但不会修改提供的 PaperSkill 检出、推送或创建 PR。预检成功前，自动推导的发布字段不会写回 `paper.yaml`；失败可重试。

运行时会立即显示当前 W10 阶段；官方 partial clone、Sparse Checkout 后首次 Checkout 可能触发的 lazy fetch 会显示 Git 原生传输进度。若停在 `Checking out sparse upstream baseline`，表示正在检出上游基线或按需获取对象；观察 Git 的实际下载进度。最终判定仍以机器报告中的命令结果和退出码为准。

只有命令退出码为 0、报告 status 为 PASS、unexpected_paths 为空、commands 全部为退出码 0，且报告列出成功的 import、validate、build:paper、preflight 后，才继续。报告同时记录导出 SHA-256。核对报告并记录 W10：

~~~powershell
$reportPath = "papers/$PaperId/audit/upstream-preflight.json"
$report = Get-Content $reportPath -Raw | ConvertFrom-Json
if ($report.status -ne 'PASS') { throw 'W10 preflight failed; do not submit' }
if ($report.unexpected_paths.Count -ne 0) { throw 'Unexpected upstream paths; do not submit' }
if (@($report.commands | Where-Object { $_.exit_code -ne 0 }).Count -ne 0) { throw 'A preflight command failed; do not submit' }
$relative = "html_output/$($report.paper_name)/$($report.version)"
$source = Join-Path $Work $relative
if (-not (Test-Path $source)) { throw "Export missing: $source" }
python tools/paper.py stage $PaperId W10 complete
~~~

`stage` 会再次核验机器报告。无需手填重复的 PASS 行。

## D. 将已验证导出提交到个人 Fork

仍使用上面的个人 Fork 检出。只复制报告对应的导出目录，不合并 PaperSkillWork 的提交历史：

~~~powershell
$branch = "paper/$PaperId-$($report.version)"
git -C $PaperSkillRepo switch --no-track -c $branch upstream/main
if ($LASTEXITCODE -ne 0) { throw 'Cannot create contribution branch' }

# 仅已启用 Sparse Checkout 时展开本次投稿论文；完整检出保持原样
$isSparse = git -C $PaperSkillRepo config --bool core.sparseCheckout
if ($isSparse -eq 'true') {
  git -C $PaperSkillRepo sparse-checkout add "html_output/$($report.paper_name)"
  if ($LASTEXITCODE -ne 0) { throw 'Failed to expand sparse checkout' }
}

$parent = Join-Path $PaperSkillRepo "html_output/$($report.paper_name)"
New-Item -ItemType Directory -Path $parent -Force | Out-Null
$target = Join-Path $parent $report.version
if (Test-Path $target) { throw "Version already exists: $target" }
Copy-Item -LiteralPath $source -Destination $target -Recurse

git -C $PaperSkillRepo add -- $relative
$staged = @(git -C $PaperSkillRepo diff --cached --name-only)
$prefix = "$relative/"
$outside = @($staged | Where-Object { -not $_.StartsWith($prefix) })
if ($staged.Count -eq 0 -or $outside.Count -ne 0) {
  throw 'Staged changes must contain only the reported tutorial export directory'
}
git -C $PaperSkillRepo diff --cached --check
git -C $PaperSkillRepo commit -m "Add $PaperId interactive tutorial"
if ($LASTEXITCODE -ne 0) { throw 'Commit failed; do not proceed to preflight or push' }
~~~

核对暂存与提交内容仅包含 `html_output/<paper-name>/<version>/`。不要提交 catalog/papers.json、PaperSkillWork 的 `paper.yaml` 或审计文档、PDF、node_modules、dist 等文件。

## E. 对真实 Fork 提交做最终预检，再手动推送和创建 PR

最后一次 preflight 验证的是 Fork 上的真实提交。它不是重新逐条运行导入、验证和构建命令：

~~~powershell
Push-Location $PaperSkillRepo
try {
  npm run preflight -- --base upstream/main
  if ($LASTEXITCODE -ne 0) { throw 'PR preflight failed; fix and rerun before pushing' }
  git push -u origin $branch
  if ($LASTEXITCODE -ne 0) { throw 'Push failed' }
}
finally { Pop-Location }
~~~

推送成功后，使用者在 GitHub 页面手动创建指向 ReductTech/PaperSkill:main 的 PR，head 选择个人 Fork 的 `$branch`。核对 diff 后填写 PR 标题、论文简介和网页预览/交互说明，并等待上游 CI 与维护者审核。维护者决定是否批准和合并。

PR 完成并结束本论文操作后，确认工作区干净且变更已提交，再恢复日常基础 Sparse Checkout：

~~~powershell
git -C $PaperSkillRepo sparse-checkout set catalog docs paper-skill schemas scripts
~~~

## F. 常见问题

- **PaperSkill HEAD 与最新上游 main 不一致：** 确认工作区干净，按 C 节 fetch `upstream/main`，切换到 `upstream/main` 后重跑 W10。
- **上游结构或构建失败：** 回到 PaperSkillWork 修复真实网页源，再重跑 `upstream-check`。不要手改报告；若本地导出目录已存在，先确认是否需要 `--replace-output`，该选项只影响本地生成目录。
- **版本已存在：** 不覆盖上游内容。自动版本在下一次预检时重新选择可用后缀；如需手动指定新版本，只修改 `paper.yaml` 中的发布字段。失败的自动推导不会锁定版本。
- **Checkout 阶段停顿或出现 `Could not add alternate ... is shallow`：** 若后面紧接完整的 `Receiving objects: 100%`，该提示只表示备用对象库未能复用浅克隆对象，不单独代表失败。停在 `Checking out sparse upstream baseline` 时，正在执行 Checkout 或 lazy fetch；观察 Git 的实际下载，不要因此重新 clone。
- **网络不稳定：** 可选择 HTTPS 或 SSH 远端。若使用 SSH，可先测试 `ssh -T -p 443 git@ssh.github.com`，并按需使用 SSH 443 地址；不要因此强制更改全局代理、全局 Git 配置或本机其他仓库的协议。
