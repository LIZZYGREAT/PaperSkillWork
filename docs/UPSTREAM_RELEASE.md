# PaperSkill 上游同步、轻量本地仓库与论文贡献流程

> 本文用于说明 `PaperSkillWork` 与官方 `PaperSkill` 两个本地仓库长期协作时的固定流程。
>
> 目标：
>
> - `PaperSkillWork` 负责论文研读、交互页面开发、人工验收与 release source；
> - 本地 `PaperSkill` 只负责同步官方仓库、官方 Import、上游验证、Git 提交、推送 fork 与创建 PR；
> - 本地 `PaperSkill` 始终使用 **partial clone + shallow history + sparse checkout**，避免拉取庞大的全部 `html_output/`；
> - 每次只展开当前正在提交的论文目录；
> - 正式进入上游的内容始终由 PaperSkill 官方 `npm run import` 生成，而不是手工复制。

---

## 一、固定目录关系

推荐长期保持：

```text
PaperWork/
├─ PaperSkillWork/
│  ├─ papers/
│  │  └─ <paper-id>/
│  │     └─ <release-source>/
│  └─ ...
│
└─ PaperSkill/
   ├─ paper-skill/
   ├─ scripts/
   ├─ docs/
   ├─ schemas/
   └─ html_output/<only-the-paper-currently-needed>/
```

两个仓库职责固定为：

```text
PaperSkillWork
= 研究 / 设计 / 开发 / 人工验收 / 正式 release source

PaperSkill
= 官方同步 / official import / repository validation / Git / PR
```

不要：

```text
merge PaperSkillWork branch into PaperSkill
```

也不要：

```text
cherry-pick PaperSkillWork commits into PaperSkill
```

正式成果进入公共仓库始终经过：

```text
PaperSkillWork/<release-source>
                ↓
        PaperSkill npm run import
                ↓
html_output/<paper-name>/<version>
                ↓
             PR
```

---

## 二、Git Remote 约定

本地 `PaperSkill` 固定使用：

```text
upstream = ReductTech/PaperSkill
origin   = 自己的 PaperSkill fork
```

其中：

```text
upstream
= 只用于同步官方仓库

origin
= 推送自己的贡献分支
```

本地：

```text
main
= 官方 main 的镜像，不开发

paper/<paper-name>
= 单篇论文贡献分支
```

不要直接在 `main` 开发。

---

# 三、第一次建立轻量 PaperSkill 本地仓库

下面只需要执行一次。

先进入同时存放两个仓库的父目录：

```powershell
Set-Location C:\path\to\PaperWork
```

从官方仓库建立：

```powershell
git clone `
  --filter=blob:none `
  --sparse `
  --depth=1 `
  --branch main `
  --single-branch `
  git@github.com:ReductTech/PaperSkill.git `
  PaperSkill
```

进入仓库：

```powershell
Set-Location PaperSkill
```

此处三个参数分别承担不同职责：

```text
--depth=1
→ shallow clone，只保留很浅的 Git 历史

--filter=blob:none
→ partial clone，不主动下载暂时不需要的文件内容

--sparse
→ 工作区只展开指定目录
```

三者缺一不可。

不要把：

```text
shallow clone
partial clone
sparse checkout
```

混成同一个概念。

---

# 四、配置 Remote

Clone 后默认：

```text
origin = ReductTech/PaperSkill
```

先改名：

```powershell
git remote rename origin upstream
```

然后加入自己的 fork：

```powershell
git remote add origin git@github.com:<fork-owner>/PaperSkill.git
```

检查：

```powershell
git remote -v
```

预期：

```text
origin    git@github.com:<fork-owner>/PaperSkill.git (fetch)
origin    git@github.com:<fork-owner>/PaperSkill.git (push)

upstream  git@github.com:ReductTech/PaperSkill.git (fetch)
upstream  git@github.com:ReductTech/PaperSkill.git (push)
```

---

# 五、设置基础 Sparse Checkout

平时只展开 PaperSkill 脚本、规范和必要元数据：

```powershell
git sparse-checkout set `
  catalog `
  docs `
  paper-skill `
  schemas `
  scripts
```

默认不要展开：

```text
.github/
portal/
html_output/
```

原因：

```text
.github
→ 只有排查官方 workflow 时才需要

portal
→ 只有开发 / 检查 Portal 时才需要

html_output
→ 体积最大，只在提交某一篇论文时展开该论文
```

根目录文件，例如：

```text
package.json
package-lock.json
README.md
AGENTS.md
```

会正常保留。

检查：

```powershell
git sparse-checkout list
```

预期：

```text
catalog
docs
paper-skill
schemas
scripts
```

再检查：

```powershell
Test-Path ".\html_output"
```

正常应为：

```text
False
```

---

## 临时查看其他目录

需要检查官方 CI：

```powershell
git sparse-checkout add .github
```

需要检查 Portal：

```powershell
git sparse-checkout add portal
```

完成后重新执行基础：

```powershell
git sparse-checkout set `
  catalog `
  docs `
  paper-skill `
  schemas `
  scripts
```

即可收回。

---

# 六、确认轻量 Clone 生效

执行：

```powershell
git rev-parse --is-shallow-repository
git config --get remote.upstream.partialclonefilter
git sparse-checkout list
```

预期至少看到：

```text
true
blob:none
```

并且 sparse list 只有基础目录。

不要运行：

```powershell
git fetch --unshallow
```

发布预检只需要浅层、按需获取的上游基线；不要为此扩展完整历史。

也不要运行：

```powershell
git sparse-checkout add html_output
```

否则会把全部教程展开。

正确方式永远是：

```powershell
git sparse-checkout add "html_output/<paper-name>"
```

---

# 七、网络不稳定时的配置

使用 partial clone 后，Git 在第一次展开新的 sparse 路径时可能按需 lazy-fetch blob。

如果出现：

```text
fetch-pack: unexpected disconnect while reading sideband packet
fatal: early EOF
fatal: index-pack failed
fatal: could not fetch ... from promisor remote
```

优先把 GitHub SSH 改为 443：

```powershell
git remote set-url upstream `
  ssh://git@ssh.github.com:443/ReductTech/PaperSkill.git

git remote set-url origin `
  ssh://git@ssh.github.com:443/<fork-owner>/PaperSkill.git
```

测试：

```powershell
ssh -T -p 443 git@ssh.github.com
```

再给当前仓库增加 keepalive，并降低并行度：

```powershell
git config --local core.sshCommand `
  "ssh -o ServerAliveInterval=20 -o ServerAliveCountMax=10 -o TCPKeepAlive=yes"

git config --local fetch.parallel 1
git config --local pack.threads 1
```

如果一次增加多个 sparse 目录不稳定，可以分批：

```powershell
git sparse-checkout set scripts
git sparse-checkout add schemas
git sparse-checkout add paper-skill
git sparse-checkout add catalog
git sparse-checkout add docs
```

不要因为 lazy fetch 失败就改成全量 clone。

---

# 八、第一次安装 PaperSkill 依赖

在 `PaperSkill` 根目录：

```powershell
npm ci
```

要求：

```text
Node.js >= 20
```

`node_modules/` 只用于本地运行，不提交 Git。

---

# 九、让 Fork main 跟随官方 main

长期约定：

> fork 的 `main` 不做开发，只作为官方 `ReductTech/PaperSkill:main` 的镜像。

第一次 clone 后，本地 `main` 已来自官方。

可以尝试：

```powershell
git push origin main:main
```

然后刷新本地 `origin/main`：

```powershell
git fetch `
  --depth=1 `
  --filter=blob:none `
  origin `
  +main:refs/remotes/origin/main
```

检查：

```powershell
git rev-parse --short main
git rev-parse --short upstream/main
git rev-parse --short origin/main
```

理想状态：

```text
三个 SHA 一致
```

如果：

```powershell
git push origin main:main
```

被拒绝，不要直接：

```powershell
git push --force origin main
```

先检查：

```powershell
git log --oneline --decorate --graph --all -15
```

确认 fork `main` 上是否存在需要保留的独立提交。

---

# 十、每次准备发布一篇论文前：同步官方 main

每次发布都从这里开始。

进入：

```powershell
Set-Location C:\path\to\PaperWork\PaperSkill
```

切回：

```powershell
git switch main
```

拉取官方最新 main，但仍保持 shallow / partial：

```powershell
git fetch `
  --depth=50 `
  --filter=blob:none `
  upstream `
  +main:refs/remotes/upstream/main
```

因为本地 `main` 不开发，直接严格对齐：

```powershell
git reset --hard upstream/main
```

同步 fork main：

```powershell
git push origin main:main
```

刷新：

```powershell
git fetch `
  --depth=1 `
  --filter=blob:none `
  origin `
  +main:refs/remotes/origin/main
```

检查：

```powershell
git status --short
git rev-parse --short main
git rev-parse --short upstream/main
git rev-parse --short origin/main
```

预期：

```text
git status --short
→ 无输出
```

并且三个 SHA 一致。

---

# 十一、定义本次贡献变量

以下变量只是一份模板：

```powershell
$WORK_ID = "<paper-id>"

$PAPER_NAME = "<full_english_title_lowercase_with_underscores>"

$TITLE = "<Full English Paper Title>"

$PAPER_URL = "<https paper URL>"

$PARTICIPANT = "<public display name>"

$PINYIN = "<romanized-name>"

$GITHUB = "<github-username>"
```

约定：

```text
WORK_ID
→ PaperSkillWork 内部 paper id

PAPER_NAME
→ 上游 html_output 使用的完整英文标题 lowercase_with_underscores
```

二者不要求相同。

---

# 十二、创建单篇论文贡献分支

从已同步的 `main`：

```powershell
git switch -c "paper/$PAPER_NAME"
```

检查：

```powershell
git branch --show-current
```

应为：

```text
paper/<paper-name>
```

---

# 十三、只展开当前论文的 html_output

这是轻量工作流的关键步骤。

只执行：

```powershell
git sparse-checkout add "html_output/$PAPER_NAME"
```

这样本地最多展开：

```text
html_output/
└─ <paper-name>/
   ├─ existing-version-1/
   ├─ existing-version-2/
   └─ ...
```

其他论文不会展开。

这样做还有一个重要原因：

> Import 前应看到当前论文已有的版本，避免提交版本名与已有版本冲突。

检查：

```powershell
Get-ChildItem "html_output\$PAPER_NAME" -Directory -ErrorAction SilentlyContinue |
    Select-Object Name
```

如果这篇论文从未进入上游，目录不存在或为空是正常现象。

---

# 十四、确定 PaperSkillWork 正式源

两个仓库是同级目录：

```text
PaperWork/
├─ PaperSkill/
└─ PaperSkillWork/
```

正式提交默认只允许使用配置的 release source：

```text
..\PaperSkillWork\<release-source>
```

设置：

```powershell
$SOURCE = "..\PaperSkillWork\<release-source>"
```

检查：

```powershell
Test-Path "$SOURCE\package.json"
Test-Path "$SOURCE\src\App.tsx"
Test-Path "$SOURCE\src\data\tutorial.ts"
Test-Path "$SOURCE\src\modules\registry.tsx"
```

正式发布前这些都必须为：

```text
True
```

如果配置的 release source 不存在或尚未冻结，则停止正式发布；不要临时换用其他目录。

---

# 十五、先检查 Final 本身

进入 Final：

```powershell
Push-Location $SOURCE
```

至少执行：

```powershell
npm ci
npm run build
```

如果项目定义：

```text
npm test
npm run test:browser
npm run check
```

则一并运行。

例如：

```powershell
npm test
npm run test:browser
```

完成：

```powershell
Pop-Location
```

Final 自身失败时，不进入 PaperSkill Import。

---

# 十六、Official Import

在 `PaperSkill` 根目录执行：

```powershell
npm run import -- `
  "$SOURCE" `
  "$PAPER_NAME" `
  --title "$TITLE" `
  --paper-url "$PAPER_URL" `
  --participant "$PARTICIPANT" `
  --pinyin "$PINYIN" `
  --github "$GITHUB"
```

Import 负责：

```text
复制完整网页项目
跳过 node_modules
跳过 dist
跳过旧 paper.json
创建新的 paper.json
创建本次 version 目录
```

成功后终端会打印：

```text
html_output/<paper-name>/<version>
```

把实际版本记录下来：

```powershell
$VERSION = "<import 输出的 version>"
```

然后：

```powershell
$TARGET = "html_output\$PAPER_NAME\$VERSION"
```

同一人同一天重复导入时，Importer 可能生成：

```text
<name><MMDD>
<name><MMDD>_2
<name><MMDD>_3
```

以官方 Import 实际输出为准。

---

# 十七、Import 后检查目录

执行：

```powershell
Test-Path "$TARGET\paper.json"
Test-Path "$TARGET\package.json"
Test-Path "$TARGET\README.md"
Test-Path "$TARGET\src"
```

应全部为：

```text
True
```

如果该项目应有 `public/`，再检查：

```powershell
Test-Path "$TARGET\public"
```

查看元数据：

```powershell
Get-Content "$TARGET\paper.json"
```

重点确认：

```text
paperName
title
paperUrl
participants
version
versionDate
status
```

---

# 十八、单篇导出先独立构建

进入目标导出：

```powershell
Push-Location $TARGET
```

执行：

```powershell
npm ci
```

如果项目定义：

```text
npm run check
```

优先：

```powershell
npm run check
```

至少：

```powershell
npm run build
```

然后：

```powershell
Pop-Location
```

不要提交：

```text
node_modules/
dist/
```

---

# 十九、在 Commit 前先做工作区级基础检查

回到 PaperSkill 根目录。

运行：

```powershell
npm run validate
```

如需更新 / 检查 catalog：

```powershell
npm run catalog
```

普通教程 PR 不提交生成的：

```text
catalog/papers.json
```

因此立即恢复：

```powershell
git restore catalog/papers.json
```

构建本次版本：

```powershell
npm run build:paper -- "$PAPER_NAME/$VERSION"
```

检查工作区：

```powershell
git status --short
git diff --check
```

此时只允许看到：

```text
html_output/<paper-name>/<version>/
```

相关变化。

---

# 二十、严格检查 PR Scope

设置：

```powershell
$PREFIX = "html_output/$PAPER_NAME/$VERSION/"
```

查看：

```powershell
git status --short
```

也可以对工作区文件做检查：

```powershell
$PREFIX = "html_output/$PAPER_NAME/$VERSION/"

$CHANGED = git status --porcelain --untracked-files=all |
    ForEach-Object { $_.Substring(3).Replace('\','/') }

$BAD = $CHANGED |
    Where-Object { $_ -and $_ -notlike "$PREFIX*" }

if ($BAD) {
    Write-Host "发现异常文件："
    $BAD
} else {
    Write-Host "SCOPE_OK"
}
```

预期：

```text
SCOPE_OK
```

不能包含：

```text
catalog/papers.json
paper-skill/
scripts/
docs/
schemas/
其他论文目录
node_modules/
dist/
论文 PDF
.env
secrets
本机绝对路径
```

---

# 二十一、Commit

只暂存本次教程：

```powershell
git add -- "html_output/$PAPER_NAME/$VERSION"
```

检查：

```powershell
git diff --cached --name-only
git diff --cached --check
```

然后：

```powershell
git commit -m "feat: add $PAPER_NAME tutorial"
```

---

# 二十二、为什么 Preflight 放在 Commit 后

上游 PR 的实际范围是：

```text
base...HEAD
```

因此最可信的 Preflight 应针对已经形成的 tutorial commit。

不要把：

```text
只有未提交工作区变化时的 preflight
```

当作最终 PR 模拟。

Commit 完成后执行：

```powershell
npm run preflight -- --base upstream/main
```

如果当前 PaperSkill 版本的 CLI 不接受：

```text
--base upstream/main
```

则按仓库当时 README / `npm run preflight -- --help` 的实际参数执行。

Preflight 应覆盖或间接覆盖：

```text
repository validate
PR scope validate
changed tutorial build
merge rehearsal
```

失败时先修复，不继续 push。

---

# 二十三、Commit 后再检查最终 PR Scope

执行：

```powershell
git diff --name-only upstream/main...HEAD
```

自动检查：

```powershell
$PREFIX = "html_output/$PAPER_NAME/$VERSION/"

$BAD = git diff --name-only upstream/main...HEAD |
    Where-Object { $_ -notlike "$PREFIX*" }

if ($BAD) {
    Write-Host "发现异常 PR 文件："
    $BAD
} else {
    Write-Host "SCOPE_OK"
}
```

必须得到：

```text
SCOPE_OK
```

再执行：

```powershell
git diff --check upstream/main...HEAD
git status --short
```

正常：

```text
git status --short
→ 无输出
```

---

# 二十四、PaperSkillWork 的 W10 自动预检

如果该论文使用 PaperSkillWork Workflow v3，可在 `PaperSkillWork` 根目录额外执行：

```powershell
python tools/paper.py status $WORK_ID
python tools/paper.py check $WORK_ID
```

W0–W9 全部完成后，可运行：

```powershell
python tools/paper.py upstream-check $WORK_ID `
  --paperskill-repo "..\PaperSkill" `
  --participant "<public display name>" `
  --pinyin "<romanized-name>" `
  --github "<github-username>"
```

预检只读取 sibling 的 clean status、HEAD、canonical remote 和 sparse/shallow 状态。隔离环境从 canonical remote 用 `--filter=blob:none --no-checkout --reference-if-able <sibling>` 建立 shallow clone，再 sparse-checkout `paper-skill`、`scripts`、`.github`、`docs` 和 `html_output/<paper-name>`，最后 checkout 与 sibling HEAD 相同的 commit。它不要求 sibling 的 object database 完整，也不使用 `--shared`。若 sibling HEAD 与远端最新 `main` 不一致，预检会失败并提示执行 `git fetch <canonical-remote> main --depth=1 --filter=tree:0`。预检不会执行 full fetch、`--unshallow` 或关闭 sparse checkout。

这一命令的定位是：

```text
机器化 W10 rehearsal
```

它不是：

```text
正式贡献分支
正式 push
正式 PR
```

正式 PR 仍按本文的 PaperSkill 分支流程完成。

如果 `upstream-check` 的实现方式发生变化，以：

```powershell
python tools/paper.py upstream-check --help
```

和仓库当前源码为准。

---

# 二十五、PR 前如果 upstream 又更新了

如果从创建分支到准备推送已经过了一段时间：

```powershell
git fetch `
  --depth=50 `
  --filter=blob:none `
  upstream `
  +main:refs/remotes/upstream/main
```

如果：

```text
upstream/main
```

已更新：

```powershell
git rebase upstream/main
```

然后重新运行：

```powershell
npm run preflight -- --base upstream/main
git diff --name-only upstream/main...HEAD
git diff --check upstream/main...HEAD
git status --short
```

---

# 二十六、推送自己的 Fork

第一次：

```powershell
git push -u origin HEAD
```

如果此前已 push，之后又执行了 rebase：

```powershell
git push --force-with-lease
```

不要使用：

```powershell
git push --force
```

如果 `--force-with-lease` 报 stale info：

```powershell
$BRANCH = git branch --show-current

git fetch `
  --depth=10 `
  --filter=blob:none `
  origin `
  "+$BRANCH`:refs/remotes/origin/$BRANCH"

git push --force-with-lease origin $BRANCH
```

仍失败时先检查：

```powershell
git log --oneline --decorate --graph -10 HEAD "origin/$BRANCH"
```

---

# 二十七、创建 Pull Request

GitHub 上创建：

```text
Base repository:
ReductTech/PaperSkill

Base:
main

Head repository:
<fork-owner>/PaperSkill

Compare:
paper/<paper-name>
```

PR 原则上只包含：

```text
html_output/<paper-name>/<version>/
```

PR 描述建议包含：

```text
论文名称
version
贡献分支
教程目标
主要交互
本地 build / validate / preflight 结果
人工预览结果
关键截图
外部素材来源
需要 reviewer 特别检查的内容
```

---

# 二十八、CI 失败处理

如果失败属于：

```text
validate
validate:pr
build:changed
tutorial build
```

则：

```text
定位真实报错
→ 修改
→ commit
→ push
→ 等 CI 重新运行
```

如果属于：

```text
GitHub runner unavailable
Service Unavailable
checkout 下载失败
GitHub API 临时错误
```

不要制造无意义提交。

直接：

```text
Re-run jobs
```

---

# 二十九、PR Merge 后清理

先记录当前分支：

```powershell
$BRANCH = git branch --show-current
```

切回：

```powershell
git switch main
```

同步官方：

```powershell
git fetch `
  --depth=50 `
  --filter=blob:none `
  upstream `
  +main:refs/remotes/upstream/main

git reset --hard upstream/main
```

同步 fork：

```powershell
git push origin main:main
```

刷新：

```powershell
git fetch `
  --depth=1 `
  --filter=blob:none `
  origin `
  +main:refs/remotes/origin/main
```

删除本地贡献分支：

```powershell
git branch -d $BRANCH
```

删除 fork 分支：

```powershell
git push origin --delete $BRANCH
```

---

# 三十、收回 Sparse Checkout

论文提交结束后，不继续保留：

```text
html_output/<paper-name>
```

重新执行：

```powershell
git sparse-checkout set `
  catalog `
  docs `
  paper-skill `
  schemas `
  scripts
```

检查：

```powershell
Test-Path ".\html_output"
```

正常重新回到：

```text
False
```

这样本地 `PaperSkill` 始终保持轻量。

---

# 三十一、日常最短流程

以后真正需要记住的是：

## 1. 同步官方

```powershell
Set-Location ..\PaperSkill

git switch main

git fetch --depth=50 --filter=blob:none upstream `
  +main:refs/remotes/upstream/main

git reset --hard upstream/main

git push origin main:main
```

## 2. 创建贡献分支

```powershell
$PAPER_NAME = "<paper-name>"

git switch -c "paper/$PAPER_NAME"

git sparse-checkout add "html_output/$PAPER_NAME"
```

## 3. 指向正式源

```powershell
$RELEASE_SOURCE = "<release-source>"

$SOURCE = "..\PaperSkillWork\$RELEASE_SOURCE"
```

## 4. Import

```powershell
npm run import -- `
  "$SOURCE" `
  "$PAPER_NAME" `
  --title "<Full English Title>" `
  --paper-url "<https URL>" `
  --participant "<public name>" `
  --pinyin "<pinyin>" `
  --github "<github username>"
```

记录：

```powershell
$VERSION = "<import 输出 version>"
$TARGET = "html_output\$PAPER_NAME\$VERSION"
```

## 5. 本地验收

```powershell
npm run validate
npm run build:paper -- "$PAPER_NAME/$VERSION"

git add -- "html_output/$PAPER_NAME/$VERSION"
git diff --cached --check
git commit -m "feat: add $PAPER_NAME tutorial"

npm run preflight -- --base upstream/main

git diff --name-only upstream/main...HEAD
git diff --check upstream/main...HEAD
git status --short
```

## 6. Push

```powershell
git push -u origin HEAD
```

然后创建：

```text
<fork-owner>/PaperSkill:paper/<paper-name>
→
ReductTech/PaperSkill:main
```

PR。

## 7. Merge 后收回

```powershell
$BRANCH = git branch --show-current

git switch main

git fetch --depth=50 --filter=blob:none upstream `
  +main:refs/remotes/upstream/main

git reset --hard upstream/main
git push origin main:main

git branch -d $BRANCH
git push origin --delete $BRANCH

git sparse-checkout set `
  catalog `
  docs `
  paper-skill `
  schemas `
  scripts
```

---

# 三十二、固定原则

以后始终保持：

```text
PaperSkillWork
开发 / 审核 / freeze final

        ↓ official import

PaperSkill contribution branch
官方校验 / commit / preflight

        ↓ push

自己的 PaperSkill fork

        ↓ PR

ReductTech/PaperSkill
```

Git 层：

```text
main
= 官方 main 镜像，不开发

paper/<paper-name>
= 单篇论文贡献分支
```

Sparse 层：

```text
平时
= 不展开 html_output

准备某篇论文 PR
= 只展开 html_output/<paper-name>

PR merge 后
= 再次收回
```

正式源：

```text
PaperSkillWork/<release-source>
```

真正的上游产物：

```text
PaperSkill/html_output/<paper-name>/<version>
```

两者不要混淆。

---

# 三十三、仓库健康检查

任何时候怀疑本地 PaperSkill 状态异常，可执行：

```powershell
git remote -v
git branch --show-current
git rev-parse --is-shallow-repository
git config --get remote.upstream.partialclonefilter
git sparse-checkout list
git status --short
```

正常长期状态应接近：

```text
origin
→ 自己 fork

upstream
→ ReductTech/PaperSkill

branch
→ main 或 paper/<paper-name>

shallow
→ true

partial clone filter
→ blob:none

基础 sparse
→ catalog / docs / paper-skill / schemas / scripts

status
→ clean
```

平时：

```powershell
Test-Path ".\html_output"
```

应为：

```text
False
```

只有正在准备某篇论文贡献时，才临时出现：

```text
html_output/<paper-name>
```
