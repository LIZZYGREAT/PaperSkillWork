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
```

若状态有改动、当前处于尚未完成的 paper/* 分支，或稀疏范围包含整个 html_output/，先停下核对。不要 reset、删除文件或覆盖分支。检查后按[初始化指南的安全收敛步骤](PAPERSKILL_SETUP.md#五安全收敛已有稀疏检出)恢复基础稀疏范围。PaperSkillWork 中可能遗留的 /html_output/ 不在本次流程中清理。

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
}
finally { Pop-Location }
```

npm run import 从 PaperSkillWork 的现有网页源码直接生成版本。官方 Import 过滤 node_modules、dist、.git 等工作文件并生成 paper.json。正式版本只存在于 PaperSkill/$Relative；不要复制到 PaperSkillWork，也不要额外运行单篇 build，完整预检会构建受影响版本。

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
