# PaperSkill 首次轻量克隆与 Sparse Checkout 初始化

适用于 Windows PowerShell，以及同级存放的 PaperSkillWork 和 PaperSkill 仓库。本指南只负责 PaperSkill 的首次克隆、远端核对和轻量检出初始化；论文导入、贡献分支、提交、Push 和 PR 均按[W10 投稿手册](UPSTREAM_RELEASE.md)操作。

git clone --sparse 后只看到 .gitignore、package.json、package-lock.json、README.md 等根目录文件是正常现象。后续的 git sparse-checkout set 才会展开需要的子目录。

## 一、检查 PaperSkill 是否已存在

在 PowerShell 中设置 PaperWork 父目录，并判断 PaperSkill 是否为 Git 检出：

~~~powershell
$PaperWork = 'C:\path\to\PaperWork'
$PaperSkillRepo = Join-Path $PaperWork 'PaperSkill'
Test-Path (Join-Path $PaperSkillRepo '.git')
~~~

- 返回 True：复用现有检出，继续第三节核对远端和稀疏范围。不要再次克隆或删除。
- 返回 False 且目录不存在：按第二节首次克隆。
- 目录存在但没有 .git：先人工核对目录内容，不要覆盖式克隆或强制删除。

## 二、首次轻量克隆（仅首次执行）

在 PaperWork 父目录运行：

~~~powershell
Set-Location $PaperWork
git clone --filter=blob:none --sparse --depth=1 --branch main --single-branch git@github.com:ReductTech/PaperSkill.git PaperSkill

if ($LASTEXITCODE -ne 0) { throw 'Clone failed; do not continue' }
$PaperSkillRepo = Join-Path $PaperWork 'PaperSkill'
Set-Location $PaperSkillRepo
~~~

若当前网络无法连接 SSH 22、但 SSH 443 可用，只替换 Clone 命令的 GitHub 地址：

~~~text
ssh://git@ssh.github.com:443/ReductTech/PaperSkill.git
~~~

不要因此修改全局 SSH、代理或其他仓库配置。不要改用完整克隆来代替轻量克隆。

## 三、核对远端

先只读检查：

~~~powershell
Set-Location $PaperSkillRepo
git remote -v
~~~

期望 origin 指向个人 Fork、upstream 指向 ReductTech/PaperSkill。首次克隆时 origin 默认指向官方仓库；确认远端确实如此且尚无 upstream 后，只执行一次：

~~~powershell
git remote rename origin upstream
if ($LASTEXITCODE -ne 0) { throw 'Failed to rename the official remote' }

git remote add origin git@github.com:OWNER/PaperSkill.git
if ($LASTEXITCODE -ne 0) { throw 'Failed to add the personal Fork remote' }
~~~

若当前需要 SSH 443，可只为这个仓库设置远端地址：

~~~powershell
git remote set-url upstream ssh://git@ssh.github.com:443/ReductTech/PaperSkill.git
git remote set-url origin ssh://git@ssh.github.com:443/OWNER/PaperSkill.git
~~~

如果已经有正确的 origin 和 upstream，跳过添加步骤。远端不符合预期时先查明指向，不要盲目改名或覆盖。最后再次运行 git remote -v 确认。

## 四、首次展开基础目录

在首次稀疏克隆中确认没有待保留改动：

~~~powershell
git status --short
git diff --cached --name-only
git diff --name-only
~~~

逐项确认输出为空后，展开日常投稿所需的五类基础目录：

~~~powershell
git -c core.longpaths=true sparse-checkout set --cone catalog docs paper-skill schemas scripts

if ($LASTEXITCODE -ne 0) { throw 'Sparse Checkout failed; stop and inspect errors' }
~~~

这一步不会展开整套 html_output/。出现下载进度表示 Partial Clone 正在按需取得新增范围的文件。遇到网络或长路径错误时停止排查，不要反复删除或重新克隆。

## 五、安全收敛已有稀疏检出

只在确认当前没有需要保留的已跟踪改动、暂存内容或尚未完成的 paper/* 分支后，才收敛已有范围。先检查：

~~~powershell
git -C $PaperSkillRepo branch --show-current
git -C $PaperSkillRepo remote -v
git -C $PaperSkillRepo config --bool core.sparseCheckout
git -C $PaperSkillRepo sparse-checkout list
git -C $PaperSkillRepo status --short
git -C $PaperSkillRepo status --short --untracked-files=no
git -C $PaperSkillRepo diff --cached --name-only
git -C $PaperSkillRepo diff --name-only
~~~

如果有已跟踪修改或暂存内容，先检查并保留所需工作。若发现未跟踪文件（尤其 html_output/ 下的内容），逐项核对；稀疏设置不会授权删除它们。处于未完成的贡献分支时，不要切换或重置分支。

确认可继续后，明确将范围设置为基础目录；set 会覆盖旧规则，core.longpaths=true 只作用于这条命令：

~~~powershell
git -c core.longpaths=true -C $PaperSkillRepo sparse-checkout set --cone catalog docs paper-skill schemas scripts
if ($LASTEXITCODE -ne 0) { throw 'Sparse reset failed; stop and inspect current state' }

git -C $PaperSkillRepo sparse-checkout list
~~~

预期只列出 catalog、docs、paper-skill、schemas、scripts。如果仍报告长路径，停止；不要继续 switch、reset --hard 或强制清理。PaperSkillWork 内历史生成的 /html_output/ 也不要自动删除。

## 六、确认初始化并安装依赖

~~~powershell
git -C $PaperSkillRepo sparse-checkout list
git -C $PaperSkillRepo rev-parse --is-shallow-repository
git -C $PaperSkillRepo config --get remote.upstream.partialclonefilter
git -C $PaperSkillRepo branch --show-current
git -C $PaperSkillRepo status --short

Test-Path (Join-Path $PaperSkillRepo 'paper-skill')
Test-Path (Join-Path $PaperSkillRepo 'scripts')
Test-Path (Join-Path $PaperSkillRepo 'schemas')
Test-Path (Join-Path $PaperSkillRepo 'docs')
Test-Path (Join-Path $PaperSkillRepo 'catalog')
Test-Path (Join-Path $PaperSkillRepo 'html_output')
~~~

首次浅克隆预期 --is-shallow-repository 为 true，partialclonefilter 为 blob:none，基础目录均存在，未遗留本地改动。若复用旧检出，这两个 Git 属性可能不同；无需仅因此重建仓库。html_output 不应作为整目录稀疏展开；若它存在，先查看稀疏列表和内容，不要直接删除。

安装根目录依赖仅在首次或 node_modules 缺失时执行：

~~~powershell
Set-Location $PaperSkillRepo
node --version
npm --version
npm ci
if ($LASTEXITCODE -ne 0) { throw 'PaperSkill npm ci failed' }
~~~

node_modules/ 只用于本地安装，不应提交。

初始化后即可停止。不必拉取全部论文目录，也不要在 main 开始投稿。W10 中同步官方、创建贡献分支、展开单篇目录并运行正式投稿命令，统一见[W10 投稿手册](UPSTREAM_RELEASE.md)。
