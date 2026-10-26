# PaperSkill 投稿操作手册（W10）

本文是唯一的 W10 发布手册。W0 的论文信息只在 papers/<paper-id>/paper.yaml 录入一次；贡献者信息使用一次性 Git 全局配置。正式版本由 PaperSkill 官方 Import 直接写入 PaperSkill 仓库，并在那里完成验证、提交和预检。

```text
PaperSkillWork/papers/<id>/web/{final 或 enhanced}
        │  release-info 只读读取论文信息、源码路径和贡献者资料
        ▼
PaperSkill：同步 upstream/main → 新建 paper/<id> 分支
        │  官方 npm run import
        ▼
PaperSkill/html_output/<paper-name>/<version>/
        │  官方 validate → 仅提交本论文版本 → 官方 preflight
        ▼
使用者自行 Push，并在 GitHub 创建 PR
```

PaperSkillWork 不生成 html_output/ 副本，不创建临时 PaperSkill 克隆，也不运行自定义 Import、Validate 或 Preflight。本文只给出命令；Codex 不会替使用者修改 PaperSkill 检出、提交到个人 Fork、Push 或创建 PR。

## 一次性准备

PaperSkill 应是 PaperSkillWork 的相邻 Git 检出。首次克隆或初始化稀疏检出时，先按[首次轻量克隆与 Sparse Checkout 指南](PAPERSKILL_SETUP.md)操作。日常投稿复用现有检出。

全局贡献者信息只配置一次。姓名必填；署名含非 ASCII 字符时，拼音或 GitHub 用户名至少提供一个，便于官方 Import 生成版本标识：

```powershell
git config --global paperskillwork.participant "公开署名"
git config --global paperskillwork.pinyin "拼音"
git config --global paperskillwork.github "GitHub用户名"
```

ASCII 署名可直接用于版本标识，pinyin 和 github 可以留空。不要在每篇论文中重填贡献者资料。

paper.yaml 中已有的 title、paper.url、作者、年份和 venue 是论文信息的唯一记录。release.upstream_paper_name 可留空并按英文标题推导，也可在 paper.yaml 中明确覆盖。release.upstream_version 和 release.output 为旧配置结构保留的元数据；不要在 PaperSkillWork 中创建相应目录或预先分配版本。官方 Import 负责选择可用版本及 _2、_3 后缀。

## A. 读取信息并检查两个仓库

从 PaperSkillWork 根目录打开 PowerShell。本次投稿只输入一次论文 ID，后续步骤沿用 $PaperId：

```powershell
Set-Location 'C:\path\to\PaperWork\PaperSkillWork'
$PaperId = Read-Host 'Paper ID'
$Work = (Get-Location).Path
$PaperSkillRepo = (Resolve-Path '..\PaperSkill').Path

$InfoJson = python tools/paper.py release-info $PaperId --json
$PythonExit = $LASTEXITCODE
if ($PythonExit -ne 0 -or -not $InfoJson) { throw 'Could not read release metadata' }
try { $Info = $InfoJson | ConvertFrom-Json -ErrorAction Stop }
catch { throw 'release-info did not return valid JSON' }

$WorkRoot = (git -C $Work rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0) { throw 'PaperSkillWork is not a Git checkout' }
$PaperSkillRoot = (git -C $PaperSkillRepo rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0) { throw 'PaperSkill is not a Git checkout' }
if ($WorkRoot -eq $PaperSkillRoot) { throw 'PaperSkill must be a separate repository' }

$Info | Format-List paper_id, paper_name, title, paper_url, source, participant, pinyin, github, year, venue
git -C $PaperSkillRepo remote -v
```

release-info 只读 paper.yaml、实际 final 或 enhanced 源码目录和全局 Git 配置，输出纯 JSON。它不会下载、复制、创建或修改文件，也不会调用 npm。缺少标题、HTTPS 论文 URL、网页源码或署名资料时会报错并以非零状态退出。

继续前确认 PaperSkill 的 origin 指向个人 Fork、upstream 指向 ReductTech/PaperSkill，并检查工作区和暂存区没有待保留改动：

```powershell
git -C $PaperSkillRepo branch --show-current
git -C $PaperSkillRepo remote -v
git -C $PaperSkillRepo config --bool core.sparseCheckout
git -C $PaperSkillRepo sparse-checkout list
git -C $PaperSkillRepo status --short
git -C $PaperSkillRepo status --short --untracked-files=no
git -C $PaperSkillRepo diff --cached --name-only
git -C $PaperSkillRepo diff --name-only

$CatalogPath = Join-Path $PaperSkillRepo 'catalog/papers.json'
if (-not (Test-Path -LiteralPath $CatalogPath -PathType Leaf)) { throw 'catalog/papers.json is not present in this checkout' }
git -C $PaperSkillRepo ls-files --error-unmatch -- catalog/papers.json *> $null
if ($LASTEXITCODE -ne 0) { throw 'catalog/papers.json is not tracked; do not run the catalog restore step' }
$CatalogStatus = @(git -C $PaperSkillRepo status --porcelain -- catalog/papers.json)
if ($LASTEXITCODE -ne 0 -or $CatalogStatus.Count -ne 0) { throw 'catalog/papers.json has pre-existing changes; preserve them and stop' }
```

若状态有改动、`catalog/papers.json` 不存在/未跟踪/已有修改、当前处于尚未完成的 paper/* 分支，或稀疏范围包含整个 html_output/，先停下核对。目录文件必须在整个 W10 流程开始时就确认干净，后续不得用 `git restore` 清理任何预存改动。不要 reset、删除文件或覆盖分支。检查后按[初始化指南的安全收敛步骤](PAPERSKILL_SETUP.md#五安全展开或收敛稀疏范围)恢复基础稀疏范围。PaperSkillWork 中可能遗留的 /html_output/ 不在本次流程中清理。

## B. 同步官方主线、建分支并仅展开当前论文

前提：PaperSkill 工作区与暂存区干净，已确认基础稀疏范围正确，且不在需继续的贡献分支中。

```powershell
git -C $PaperSkillRepo fetch --progress --no-tags --depth=50 --filter=blob:none upstream +main:refs/remotes/upstream/main
if ($LASTEXITCODE -ne 0) { throw 'Failed to refresh upstream/main' }

$Branch = "paper/$PaperId"
git -c core.longpaths=true -C $PaperSkillRepo switch --no-track -c $Branch upstream/main
if ($LASTEXITCODE -ne 0) { throw 'Cannot create branch; inspect existing branch and state' }

git -c core.longpaths=true -C $PaperSkillRepo sparse-checkout set --cone catalog docs paper-skill schemas scripts "html_output/$($Info.paper_name)"
if ($LASTEXITCODE -ne 0) { throw 'Cannot set single-paper sparse checkout; stop and inspect state' }

git -C $PaperSkillRepo sparse-checkout list
```

如果 paper/<id> 已存在，停止并检查该分支；不要用 -B、reset --hard 或覆盖已有版本。预期稀疏目录为 catalog、docs、paper-skill、schemas、scripts 和 html_output/<当前论文名>，不包含整个 html_output。core.longpaths=true 仅用于本次命令，不修改全局 Git 配置。

## C. 在 PaperSkill 中官方导入并验证

在首次使用或依赖缺失时安装 PaperSkill 根目录依赖；后续投稿可跳过：

```powershell
Push-Location $PaperSkillRepo
try {
  if (-not (Test-Path -LiteralPath 'node_modules')) {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'PaperSkill npm ci failed' }
  }

  $Before = @()
  $PaperDir = Join-Path $PaperSkillRepo "html_output/$($Info.paper_name)"
  if (Test-Path -LiteralPath $PaperDir) {
    $Before = @(Get-ChildItem -LiteralPath $PaperDir -Directory | Select-Object -ExpandProperty Name)
  }

  $ImportArgs = @('run', 'import', '--', $Info.source, $Info.paper_name,
    '--title', $Info.title, '--paper-url', $Info.paper_url,
    '--participant', $Info.participant)
  if ($Info.pinyin) { $ImportArgs += @('--pinyin', $Info.pinyin) }
  if ($Info.github) { $ImportArgs += @('--github', $Info.github) }
  if ($null -ne $Info.year) { $ImportArgs += @('--year', [string]$Info.year) }
  if ($Info.venue) { $ImportArgs += @('--venue', $Info.venue) }

  & npm @ImportArgs
  if ($LASTEXITCODE -ne 0) { throw 'Official import failed' }

  $After = @(Get-ChildItem -LiteralPath $PaperDir -Directory | Select-Object -ExpandProperty Name)
  $NewVersions = @($After | Where-Object { $_ -notin $Before })
  if ($NewVersions.Count -ne 1) { throw 'Cannot identify exactly one imported version; inspect the official import output' }
  $Version = $NewVersions[0]
  $Relative = "html_output/$($Info.paper_name)/$Version"
  Write-Host "Imported: $Relative"

  npm run validate
  if ($LASTEXITCODE -ne 0) { throw 'Official validation failed; do not commit' }

  # 目录文件须在 W10 开始时已确认干净；Import/validate 若意外改动了它则停止，不覆盖该改动。
  $BeforeCatalogRun = @(git status --porcelain --untracked-files=all)
  if ($LASTEXITCODE -ne 0) { throw 'Could not inspect status before catalog generation' }
  $CatalogStatus = @(git status --porcelain -- catalog/papers.json)
  if ($LASTEXITCODE -ne 0 -or $CatalogStatus.Count -ne 0) {
    throw 'catalog/papers.json changed before generation; preserve and inspect it instead of restoring'
  }

  npm run catalog
  if ($LASTEXITCODE -ne 0) { throw 'Official catalog generation failed; inspect the working tree before continuing' }

  # Sparse checkout only indexes the currently checked-out subset. Ensure catalog generation changed no other path.
  $AfterCatalogRun = @(git status --porcelain --untracked-files=all)
  if ($LASTEXITCODE -ne 0) { throw 'Could not inspect status after catalog generation' }
  $BeforeOther = @($BeforeCatalogRun | Where-Object { $_ -notmatch '\s+catalog/papers\.json$' } | Sort-Object)
  $AfterOther = @($AfterCatalogRun | Where-Object { $_ -notmatch '\s+catalog/papers\.json$' } | Sort-Object)
  if (($BeforeOther -join [Environment]::NewLine) -ne ($AfterOther -join [Environment]::NewLine)) {
    throw 'Catalog generation changed unexpected paths; inspect everything and do not restore or stage'
  }

  $CatalogStatus = @(git status --porcelain -- catalog/papers.json)
  if ($LASTEXITCODE -ne 0) { throw 'Could not inspect generated catalog status' }
  if ($CatalogStatus.Count -gt 0) {
    git restore -- catalog/papers.json
    if ($LASTEXITCODE -ne 0) { throw 'Could not restore the catalog generated from the confirmed-clean baseline' }
  }
  $CatalogStatus = @(git status --short -- catalog/papers.json)
  if ($LASTEXITCODE -ne 0 -or $CatalogStatus.Count -ne 0) {
    throw 'Generated catalog changes remain; inspect before staging'
  }
}
finally { Pop-Location }
```

npm run import 从 PaperSkillWork 的现有网页源码直接生成版本。官方 Import 过滤 node_modules、dist、.git 等工作文件并生成 paper.json。`npm run catalog` 仅验证当前 sparse checkout 可生成索引；脚本再次确认自动变更只涉及最初已确认干净的 `catalog/papers.json` 后才恢复该文件，并检查恢复完成。它不代表已索引整个上游仓库。正式版本只存在于 PaperSkill/$Relative；不要复制到 PaperSkillWork，也不要额外运行单篇 build，完整预检会构建受影响版本。

## D. 仅提交当前论文版本并运行官方 preflight

```powershell
Push-Location $PaperSkillRepo
try {
  git add -- $Relative
  if ($LASTEXITCODE -ne 0) { throw 'Staging failed' }

  $Staged = @(git diff --cached --name-only)
  if ($LASTEXITCODE -ne 0) { throw 'Could not inspect staged paths' }
  $Prefix = "$Relative/"
  $Outside = @($Staged | Where-Object { -not $_.StartsWith($Prefix, [StringComparison]::Ordinal) })
  if ($Staged.Count -eq 0 -or $Outside.Count -ne 0) {
    throw 'Unexpected staged paths; do not commit'
  }
  git diff --cached --check
  if ($LASTEXITCODE -ne 0) { throw 'Whitespace check failed' }

  git commit -m "feat: add $PaperId interactive tutorial"
  if ($LASTEXITCODE -ne 0) { throw 'Commit failed' }

  # upstream/main 已在 B 节更新；--no-fetch 避免重复传输。
  npm run preflight -- --base upstream/main --no-fetch
  if ($LASTEXITCODE -ne 0) { throw 'Official preflight failed; do not push' }

  $Changed = @(git diff --name-only upstream/main...HEAD)
  if ($LASTEXITCODE -ne 0) { throw 'Could not inspect the contribution diff' }
  $Outside = @($Changed | Where-Object { -not $_.StartsWith($Prefix, [StringComparison]::Ordinal) })
  if ($Changed.Count -eq 0 -or $Outside.Count -ne 0) {
    throw 'The contribution diff is not limited to the current paper version; do not push'
  }
  $Status = @(git status --porcelain)
  if ($LASTEXITCODE -ne 0 -or $Status.Count -ne 0) {
    throw 'PaperSkill is not clean after preflight; inspect before proceeding'
  }

  Write-Host "Preflight passed for $Relative"
}
finally { Pop-Location }
```

只有官方 preflight 成功、差异仅含当前版本且 PaperSkill 工作区干净后，回到 PaperSkillWork 记录 W10：

```powershell
Set-Location $Work
python tools/paper.py stage $PaperId W10 complete
if ($LASTEXITCODE -ne 0) { throw 'Could not record W10 completion' }
```

这条命令只记录进度，不生成或伪造机器报告，也不再次运行预检。可在既有 papers/$PaperId/audit/final-check.md 简短记下实际运行的官方命令、PASS 结果和 PaperSkill 目标路径；不要新建平行报告。

Push 和 PR 由使用者自行决定并执行：

```powershell
# 仅在核对通过后由使用者执行：
# git -C $PaperSkillRepo push -u origin $Branch
# 然后在 GitHub 创建：个人 Fork:$Branch → ReductTech/PaperSkill:main
```

任何 Git 或 npm 命令返回非零状态都应立即停止并检查输出。不要继续提交、Push 或用重置命令掩盖错误。

## E. 已发布版本的补丁修复（Patch PR）

适用于教程已合并到 `ReductTech/PaperSkill:main`、只需修复自己现有版本中的代码、样式或资源的情况。原版本目录和在线 URL 不变。
```text
PaperSkillWork 中修好源文件
→ PaperSkill 从最新 upstream/main 创建 fix/* 分支
→ 仅替换对应文件 → Git 差异检查
→ Commit → 官方 Preflight → Push → 创建修复 PR
→ PR 合并、Pages 部署成功后原 URL 自动更新
```
本流程不运行 `npm run import`、不创建 `<version>_2`、不修改 `paper.json`、不重复记录 W10 完成状态，也不重新克隆仓库。以下操作由使用者在已有的相邻仓库中执行。

### 1. 设置本次修补范围

在 `PaperSkillWork` 根目录打开 PowerShell，修改开头三个变量即可。`$Files` 仅列出本次要同步的、相对于网页项目根目录的文件；多文件修复时继续添加数组元素。
```powershell
Set-Location 'C:\path\to\PaperWork\PaperSkillWork'

$PaperId = 'ewc'                            # PaperSkillWork 论文 ID
$Version = 'ganwenjie1012'                 # 已经正式发布的原版本，不能换名
$Files = @('src/styles/page10.css')        # 本次确实修改过的文件
$Branch = "fix/$PaperId-$(Get-Date -Format yyyyMMddHHmmss)"

$Work = (Get-Location).Path
$Repo = (Resolve-Path '..\PaperSkill').Path
$InfoJson = python tools/paper.py release-info $PaperId --json
if ($LASTEXITCODE -ne 0 -or -not $InfoJson) { throw 'release-info failed' }
$Info = $InfoJson | ConvertFrom-Json
$Relative = "html_output/$($Info.paper_name)/$Version"
$Expected = @($Files | ForEach-Object { "$Relative/$_" })

# 两个仓库及版本必须已经存在；保留任何未提交的修改，禁止自动清理。
if (@(git -C $Repo status --porcelain).Count -ne 0) {
  throw 'PaperSkill worktree is not clean; inspect before continuing'
}
```

### 2. 新建修复分支，仅复制修改文件

```powershell
git -C $Repo fetch --progress --no-tags --depth=50 --filter=blob:none upstream +main:refs/remotes/upstream/main
if ($LASTEXITCODE -ne 0) { throw 'Fetch upstream/main failed' }

git -c core.longpaths=true -C $Repo switch --no-track -c $Branch upstream/main
if ($LASTEXITCODE -ne 0) { throw 'Cannot create fix branch; inspect existing branches' }

git -c core.longpaths=true -C $Repo sparse-checkout set --cone catalog docs paper-skill schemas scripts "html_output/$($Info.paper_name)"
if ($LASTEXITCODE -ne 0) { throw 'Sparse checkout failed' }

foreach ($File in $Files) {
  $Source = Join-Path $Info.source $File
  $Target = Join-Path $Repo "$Relative/$File"
  if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) { throw "Missing source: $Source" }
  if (-not (Test-Path -LiteralPath $Target -PathType Leaf)) { throw "Existing version file not found: $Target" }
  Copy-Item -LiteralPath $Source -Destination $Target -Force
}

Push-Location $Repo
try {
  $Changed = @(git diff --name-only)
  if ($LASTEXITCODE -ne 0 -or $Changed.Count -eq 0 -or
      $Changed.Count -ne $Expected.Count -or
      @($Changed | Where-Object { $_ -notin $Expected }).Count -ne 0) {
    throw "Unexpected or empty diff: $($Changed -join ', ')"
  }
  git diff --check
  if ($LASTEXITCODE -ne 0) { throw 'Whitespace check failed; fix the source and copy again' }

  foreach ($Path in $Expected) {
    git add -- $Path
    if ($LASTEXITCODE -ne 0) { throw "git add failed: $Path" }
  }
  git diff --cached --check
  if ($LASTEXITCODE -ne 0) { throw 'Staged whitespace check failed' }
  git commit -m "fix($PaperId): patch existing tutorial version"
  if ($LASTEXITCODE -ne 0) { throw 'Commit failed' }

  if (-not (Test-Path 'node_modules/pinyin-pro')) {
    npm ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
  }
  npm run preflight -- --base upstream/main --no-fetch
  if ($LASTEXITCODE -ne 0) { throw 'Official preflight failed; do not push' }

  $PrFiles = @(git diff --name-only upstream/main...HEAD)
  if ($LASTEXITCODE -ne 0 -or $PrFiles.Count -ne $Expected.Count -or
      @($PrFiles | Where-Object { $_ -notin $Expected }).Count -ne 0) {
    throw "PR includes unexpected files: $($PrFiles -join ', ')"
  }
  if (@(git status --porcelain).Count -ne 0) {
    throw 'PaperSkill worktree is not clean; inspect before push'
  }

  Write-Host "Preflight PASS; patch branch: $Branch"
  # 确认本次修复正确后，由使用者执行：
  # git push -u origin $Branch
}
finally { Pop-Location }
```
成功标准： 仅预期文件发生变化；`git diff --check` 无输出；官方 `preflight` 全部通过；提交后的工作区干净。若中途报错，停止并修正当前分支，不要重复运行整段分支创建脚本，也不要 `reset --hard`。

### 3. CSS 补丁的额外验收（有样式问题时）

官方 Preflight 会构建被修改的教程。对样式问题还应检查构建后 `index.html` 实际引用的 CSS，而不是扫描整个 `assets/`：后者可能残留旧的带哈希文件，造成假失败。
```powershell
$Output = Join-Path $Repo "site/papers/$($Info.paper_name)/$Version"
$Html = Get-Content (Join-Path $Output 'index.html') -Raw
$CssRef = [regex]::Match($Html, '(?:\./)?assets/[^"''\s>]+\.css').Value
if (-not $CssRef) { throw 'No CSS referenced by built index.html' }
$CssPath = Join-Path $Output ($CssRef -replace '^\./', '')
$CssText = Get-Content $CssPath -Raw
if ($CssText.Contains('rn:root')) { throw "Broken CSS root selector: $CssPath" }
if ($PaperId -eq 'ewc' -and $CssText -notmatch '--nav\s*:\s*#183236') {
  throw 'EWC root color variable missing'
}
Write-Host "Production CSS OK: $CssPath"
```
以上 `rn:root` 和 `--nav` 检查是 EWC 本次故障的针对性示例；其他论文按其实际问题指定相应的产物断言，不要求每次执行。


### 4. Push、PR、线上核验

```powershell
git -C $Repo push -u origin $Branch
if ($LASTEXITCODE -ne 0) { throw 'Push failed' }
```
在 GitHub 创建 PR：个人 Fork 的 `$Branch` → `ReductTech/PaperSkill:main`。标题使用 `fix(<paper-id>): <具体问题>`，正文简述根因、修改文件与 Preflight 结果。PR 合并后等待一次包含修复提交的 Pages 部署成功，再检查原 URL 的实际页面和交互。
URL 与版本目录对应：`https://reducttech.github.io/PaperSkill/papers/<paper-name>/<version>/`。只要是修补原目录而非新增版本，链接保持不变；无需为这次补丁重新提交一个教程地址。
