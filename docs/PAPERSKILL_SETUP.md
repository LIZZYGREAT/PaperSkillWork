# 新论文工作区与 PaperSkill 准备

本指南说明 Windows PowerShell 下开始新论文、建立工作分支和首次准备相邻 PaperSkill 检出的步骤。阶段责任以 [WORKFLOW.md](WORKFLOW.md) 为准；正式投稿统一见 [W10 投稿手册](UPSTREAM_RELEASE.md)。

## 一、开始新论文

`PaperSkillWork` 保存来源、研究、证据、教学设计和教程源码；相邻的 `PaperSkill` 运行官方 Import 并保存上游贡献分支。两者是独立仓库，不互相合并或 cherry-pick 历史。

在 PaperSkillWork 根目录核对仓库、分支与未提交工作：

```powershell
Set-Location 'C:\path\to\PaperWork\PaperSkillWork'
git status --short
git remote -v
git branch -vv
git branch --show-current
```

确认没有待保留的其他工作后，从实际开发基线创建论文分支。需要同步基线时，先核实真实分支与 remote，再使用 `git pull --ff-only`，不要假定默认分支名。

```powershell
$PaperId = 'short-paper-id'
git switch -c "work/$PaperId"
```

已有同名分支时先核对并继续既有工作。PaperSkill 的 `paper/<id>` 贡献分支在 W9 接受后的 W10 流程中建立。

## 二、创建论文工作区

填写真实元数据；`--author` 可重复：

```powershell
python tools/paper.py new $PaperId `
  --title 'Full Paper Title' `
  --url 'https://arxiv.org/abs/0000.00000' --arxiv-id '0000.00000' `
  --author 'First Author' --author 'Second Author' `
  --venue 'Venue' --year 2026 --source-type arXiv
```

用户提供本地 PDF 时可省略 URL，用来源位置识别：

```powershell
python tools/paper.py new $PaperId `
  --title 'Full Paper Title' --author 'First Author' `
  --source-type 'User-provided PDF' --source-location 'user-provided PDF'
```

查看阶段与实际源码路径：

```powershell
python tools/paper.py status $PaperId
python tools/paper.py paths $PaperId --json
python tools/paper.py check $PaperId
```

`new` 只生成脚手架，初始检查提示未填写内容是待完成工作。新建工程默认使用 `web/enhanced/`，后续以 `paths.publish_source` 的 Final-first / Enhanced-fallback 结果为准。配置了 Final 却缺失时须修正目录或配置，不静默回退。内部 paper-id、上游 paper-name 与官方 Import 选择的版本各有用途，不当作同一目录名。

先完成 W0–W5 的来源、完整阅读、论文模型、证据、学习主线和实现规划，再进入 W6 首个真实切片；W7 人审通过后完成 W8，W9 接受后进入 W10。W2/W4/W7/W9 需要真实人工评审。阶段命令见 [工作流](WORKFLOW.md)，生成目录与六份研究/设计/审计文档见 [模板约定](TEMPLATE_CONTRACT.md)。

原文和图表清单留在 `source-cache/`；W3 核对原图用途、来源与使用权，W6/W8 再制作网页衍生素材。Kit 选择和复制见 [使用入口](REUSABLE-KIT.md)，不另建重复的设计文档。

## 三、按成果提交与本地查看

每完成可独立审阅的成果，检查差异并只提交相关文件：

```powershell
git status --short
git diff --check
git diff -- <本阶段文件>
git add -- <本阶段明确文件或目录>
git diff --cached --check
git diff --cached --name-only
git commit -m "docs($PaperId): describe the completed work"
```

人工评审记录随对应成果提交，不虚构评审人或手动改状态绕过评审门。结构 `check` 不代表构建、交互、视觉或学习验收通过；各阶段按现行 Skill 和 [Visual QA](VISUAL_QA.md) 检查并记录真实结果。

已有教程可用 `python tools/paper.py open $PaperId` 安装依赖并启动本地预览；具体参数见 `python tools/paper.py open --help`。普通窗口及真实 F11 检查需实际操作，停止服务按终端提示执行。

## 四、首次准备相邻 PaperSkill 检出

在 PaperWork 父目录设置路径并检查已有检出：

```powershell
$PaperWork = 'C:\path\to\PaperWork'
$PaperSkillRepo = Join-Path $PaperWork 'PaperSkill'
Test-Path (Join-Path $PaperSkillRepo '.git')
```

已有 Git 检出就复用；目标目录存在但不是 Git 检出时先核对内容。仅当目标目录不存在时克隆：

```powershell
Set-Location $PaperWork
git clone --filter=blob:none --sparse --depth=1 --branch main --single-branch git@github.com:ReductTech/PaperSkill.git PaperSkill
if ($LASTEXITCODE -ne 0) { throw 'Clone failed; stop and inspect errors' }
git -C $PaperSkillRepo remote -v
```

SSH 22 不通而 443 可用时，将地址替换为 `ssh://git@ssh.github.com:443/ReductTech/PaperSkill.git`，无需更改全局 SSH/代理。`--sparse` 初次只显示根文件是正常现象。

期望 `upstream` 指向官方 ReductTech/PaperSkill，`origin` 指向自己的 Fork。仅在首次克隆后确认 origin 是官方且尚无 upstream 时执行，将 OWNER 替换为自己的账户：

```powershell
git -C $PaperSkillRepo remote rename origin upstream
if ($LASTEXITCODE -ne 0) { throw 'Could not name the official remote' }
git -C $PaperSkillRepo remote add origin git@github.com:OWNER/PaperSkill.git
if ($LASTEXITCODE -ne 0) { throw 'Could not add the personal Fork' }
git -C $PaperSkillRepo remote -v
```

已有正确配置就跳过；需要 443 时仅调整本仓库 remote URL，不盲目改名或覆盖。

## 五、安全展开或收敛稀疏范围

先核对当前分支、稀疏配置和所有待保留文件：

```powershell
git -C $PaperSkillRepo branch --show-current
git -C $PaperSkillRepo status --short
git -C $PaperSkillRepo diff --cached --name-only
git -C $PaperSkillRepo diff --name-only
git -C $PaperSkillRepo config --bool core.sparseCheckout
git -C $PaperSkillRepo sparse-checkout list
```

首次克隆或确认既有检出无待保留修改、暂存内容和未完成贡献分支后，设置基础目录：

```powershell
git -c core.longpaths=true -C $PaperSkillRepo sparse-checkout set --cone catalog docs paper-skill schemas scripts
if ($LASTEXITCODE -ne 0) { throw 'Sparse Checkout failed; stop and inspect errors' }
git -C $PaperSkillRepo sparse-checkout list
```

`set` 会替换旧规则。未跟踪文件尤其是 html_output 中的内容须逐项核对保留，不因此获得删除权限。遇到长路径、网络错误或未完成的 `paper/*` 分支时停止核对，不执行 reset、覆盖或强制清理。基础范围无需展开整个 `html_output/`；W10 再加入单篇目录。

## 六、确认准备并衔接 W10

```powershell
git -C $PaperSkillRepo rev-parse --is-shallow-repository
git -C $PaperSkillRepo config --get remote.upstream.partialclonefilter
git -C $PaperSkillRepo status --short
Test-Path (Join-Path $PaperSkillRepo 'paper-skill')
Test-Path (Join-Path $PaperSkillRepo 'catalog')
```

首次克隆预期 shallow 为 true、filter 为 blob:none；复用旧检出的属性可能不同，无需因此重建。仅在首次或依赖缺失时安装根依赖：

```powershell
Set-Location $PaperSkillRepo
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'PaperSkill dependency installation failed' }
```

准备到此即可。W9 接受后，由用户按唯一 [W10 投稿手册](UPSTREAM_RELEASE.md) 在既有 PaperSkill 检出运行官方 Import、validate、catalog 检查和 preflight，成功后才记录 W10。当前 PaperSkillWork 没有 `upstream-check` 命令，也不生成独立导出/哈希预检报告；贡献者信息、版本选择、提交范围和 Push/PR 以该手册为准。
