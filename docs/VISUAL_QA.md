# 浏览器视觉验收规范

本规范规定论文页面修改后的实际浏览器检查与报告方式。它不判断论文解释是否正确，也不取代 W7/W9 人工学习验收。教学叙事和表达原则见[通用教学设计规范](TEACHING_DESIGN_STANDARD.md)。

## 1. 验收范围

- 必测浏览器为 Chromium，视口为 1440×900 和 1920×1080 CSS 像素，浏览器缩放 100%、device scale factor 1。
- 两种视口用于宽屏布局与大画布回归；不能据此声称已实测 F11、操作系统显示模式或 Fullscreen API。
- 本轮 QA 工具不新增手机、平板或窄屏视觉基线。项目仍须保留其已有移动端、触屏、键盘和无障碍行为，并在适用时如实审查。
- 截图应在字体加载完成、状态固定、动画稳定之后采集。涉及动态状态时，按明确的步骤或状态采集；需要时另行检查实际连续播放。
- 每次只覆盖受本次改动影响的页面、共享组件及代表性状态。若项目还没有可连接的浏览器检查能力，应报告 NOT_RUN，不能用构建结果推断通过。

## 2. 三类检查

| 检查 | 关注点 | 结果依据 |
| --- | --- | --- |
| 几何检查 | 页面整体意外横向溢出、关键内容裁切、语义文字过小、需固定的画框跳动、登记的连接端点越界 | DOM 尺寸/样式信息与实际状态检查 |
| 视觉复核 | 留白、图文比例、对齐、阅读重心、标签层级、内容是否拥挤或偏窄 | Agent 实际查看整页及代表性区域截图 |
| 设计回归 | 已批准的布局、状态语义、对象位置和动画是否受到无关影响 | 对照批准基准（如有）、本次前后截图和差异解释 |

自动检查仅用于发现可以客观定义的问题。不要把所有 DOM 重叠都判错；浮层、图例和图形标签可能有意覆盖。局部公式或表格的合法滚动应与页面整体溢出区分。不要用留白百分比或综合审美评分代替截图复核。

runner 的 `BROWSER_ERRORS` 会检查浏览器实际发出的 CSS/JS 请求，以及与当前页面同源的图片、字体、媒体和具有静态资源扩展名的动态本地请求；常见 `/api/`、`/graphql/`、`/analytics/`、`/telemetry/` 请求不按静态资源处理。它不代表检查了页面上所有可能的资源。复杂交互才会触发的资源必须在相应状态中实际操作/请求，并结合浏览器 Network 检查；不能仅凭 runner PASS 宣称所有图片、字体、视频或动态资源均正常。跨源可选 API/媒体失败不作为本地静态文件缺失，但其业务功能仍须按项目要求单独验证。

## 3. 按风险选取状态

页面修改应在项目现有 implementation-plan 中列出本次需要查看的视口与状态，而不是维护另一套页面清单。通常包括：

- 图文教学页：首屏、整页和主图文区域。
- 数据或参数交互：默认值、一个代表性变化及关键边界值。
- 多步骤动画：初始态、能显示实际计算进度的关键中间态、结束态和返回/重置；检查暂停、继续或回放路径。只看静态终态不能证明动画过程正确。
- 全流程工作台：稳定整体布局、代表性读取/写入/训练状态、跨阶段交接、预测/输出，以及播放/暂停。对照 implementation-plan 的语义帧契约，检查样本/对象身份、所有权、坐标含义、公式输入与结果、更新时间及连接端点在文字、画面和数据中一致；只冻结有理解风险的语义锚点，不要求每帧永久截图。
- Hover 或 Hub：长条目、切换、滚动、关闭和重新打开。
- 小型状态控件：按组件适用性检查默认、聚焦、输入/选择、成功/无结果/错误，以及清除或关闭等状态；不只查看静态默认外观。
- 论文结果图：页面内尺寸、重点标记及放大后可读性。
- 语义颜色与辅助文字：在代表性状态和真实背景下检查文字、细线及辅助标签的对比度；若颜色表示类别或状态，确认还有文字、形状、线型或标记等可见线索。

共享 CSS 或组件变更应扩展到所有可能受影响的页面、浮层和交互状态；普通页面无需维护永久基准截图。

动态场景的 DOM/数据断言应优先直接读取项目的权威计算状态，核对进入状态、触发条件、离开状态和跨段交接；截图负责检查这些状态是否被正确、可读地表达。算法断言、语义一致性、动态检查和视觉复核分别报告，不能用“出现某个词”、终态截图或构建成功相互替代。连续运算若被表达为运动或逐步更新，应实际检查运动路径、连线和对象时序；暂停、重播或跳转后也应恢复到一致状态。

## 4. 基准与产物

- 只有少量已获人工认可的关键画面适合纳入版本控制作为回归基准。基准需能追溯到认可的渲染结果。
- 脚本不得默认更新基准图。差异不能通过自动刷新快照、关闭断言、隐藏溢出或忽略失败来消除。
- 临时截图、差异图和机器报告放在被忽略的本地目录或 CI Artifact 中，按页面、视口和状态命名；仓库只保留有明确回归价值的获批基准。
- 一次 QA 完成后，先读 `report.json` / `report.md` 并实际查看关键截图，再把命令、独立状态、问题摘要和结论记入现有 implementation-plan 或 final-check。必须从**本次 runner 的终端输出** `Report: <path>` 取得 Markdown 报告路径，再取其父目录作为确切 run 目录；不得自行拼接或猜测时间戳。失败证据保留至诊断和复测完成；需要交接或复审时明确保留必要证据和路径。
- 从仓库根目录把该确切目录传给 `node tools/visual-qa/cli.mjs --cleanup-run <exact-run-dir>`。只有看到 `CLEANED: <same-path>` 且用 `Test-Path -LiteralPath <exact-run-dir>` 确认不存在，才能报告本轮产物已清理。`Already absent` 表示本次没有删除任何东西；如果它不是已知的先前清理结果，应记录为路径/产物未找到并检查，不得当作此次真实清理成功。非零退出或仍存在则报告清理失败及确切路径/原因。入口仅接受 `.visual-qa/` 下合法 runner 身份的直接 `run-*` 子目录，不清理外部 `--output`、链接、未知目录、基线或历史目录。普通 QA 运行不会自动删除截图。
- 自定义 `--output` 与原生 Playwright 目录不属于该 CLI 的安全清理入口；截图检查和记录后，只可按本任务创建且已核实所有权的确切路径清理。未知来源、历史目录或批准基线不批量删除；不使用 `git clean -fdx`。最终只报告“本轮产物已清理”或“保留/清理失败：路径及原因”。
- Playwright 原生产物（如 `test-results/`、`playwright-report/`）在截图/报告检查及结果记录后，由产生它们的任务按确切目录清理；故障调查未完成时保留必要证据。关闭本任务启动的临时 Vite/HTTP 服务，只停止本次创建的进程。
- 如浏览器或截图工具不可用，列出具体限制和未执行项目，并标记 NOT_RUN。

### W8 生产构建与子路径资源

对 `paths.publish_source` 对应的实际发布源码运行项目声明的生产构建（通常是 `npm run build`），记录命令/退出码并单独报告 `SOURCE_BUILD`。确认 `vite.config.*` 的 `base`，检查构建后的 `dist/index.html` 实际引用的 CSS/JS，并查看动态图片、字体及页面交互触发的资源。单纯在 `/` 根路径正常不能证明 `SUBPATH_ASSETS` 通过；检查真实被引用文件，不要把过期且未引用的 hash 文件误判为部署错误。

无需部署到 GitHub，可在本机把生产 `dist` 暂存到形如 `/papers/<paper-name>/<version>/` 的路径下预览。`paper-name` 使用 `paper.yaml` 中配置的 `release.upstream_paper_name`；未配置时，用项目已有 `upstream_paper_name_from_title()` 对论文标题生成同一 canonical 名称，无需读取贡献者全局 Git 配置。只有官方 Import 已确定版本时才填实际版本；更早的验证使用 `qa-preview` 等明确的测试段名，它不是正式版本。临时预览 URL 必须以斜杠结尾，确保 `./images/...` 等相对 URL 从该部署目录解析。

以下 PowerShell 范式从仓库根目录运行。若项目设置了绝对 Vite `base`，临时 URL 必须匹配该 base；早期检查可使用项目支持的 build 参数覆盖为同一 `qa-preview` 路径，并记录实际命令，不改写正式源码配置。

runner 以 `new URL(pages[].path, baseUrl)` 解析页面地址：当 `baseUrl` 是 `/papers/<paper-name>/<version>/` 时，`path: "/"` 会访问站点根目录并丢失子路径。子路径配置必须用相对 `./` 或完整的 `/papers/<paper-name>/<version>/`；报告的每项 `actualUrl` 必须核对为预期非根地址。工具的服务 readiness HTTP 200 只表示服务启动，不是 `SUBPATH_ASSETS` 通过依据。

下面的完整示例属于**人工交互预览模式**：它会打开系统浏览器并在 `Read-Host` 等待人工复核。Codex/W8 自动执行不得盲目运行该阻塞分支；请改用下节的非阻塞 Chromium runner 模式。

```powershell
$RepoRoot = (Get-Location).Path
$PaperId = 'ewc'
$PathsJson = python tools/paper.py paths $PaperId --json
if ($LASTEXITCODE -ne 0) { throw 'Could not resolve paths.publish_source' }
$Paths = $PathsJson | ConvertFrom-Json
$Source = $Paths.publish_source
$PaperName = python -c "import sys; sys.path.insert(0, 'tools'); import paper; _, c = paper.read_paper(sys.argv[1]); r = c.get('release') or {}; print((r.get('upstream_paper_name') or '').strip() or paper.upstream_paper_name_from_title(c['title']))" $PaperId
if ($LASTEXITCODE -ne 0) { throw 'Could not derive the paper-name from paper.yaml' }
$Version = 'qa-preview' # replace only after the official Import selects a version
$StageRoot = Join-Path $env:TEMP ('paperskillwork-subpath-' + [guid]::NewGuid().ToString('N'))
$StageRoute = Join-Path $StageRoot ("papers\$PaperName\$Version")
$Server = $null
$Listener = $null
$Pushed = $false
$StageCreated = $false
try {
    if (Test-Path -LiteralPath $StageRoot) { throw "Temporary staging path already exists; refusing to reuse it: $StageRoot" }
    Push-Location $Source
    $Pushed = $true
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Production build failed with exit code $LASTEXITCODE" }
    $Dist = Join-Path $Source 'dist'
    if (!(Test-Path (Join-Path $Dist 'index.html'))) { throw "Build did not create $Dist\index.html" }
    New-Item -ItemType Directory -Path $StageRoot -ErrorAction Stop | Out-Null
    $StageCreated = $true
    New-Item -ItemType Directory -Path $StageRoute -Force | Out-Null
    Copy-Item -Path (Join-Path $Dist '*') -Destination $StageRoute -Recurse -Force
    Select-String -Path (Join-Path $Dist 'index.html') -Pattern 'src=|href=' # inspect the actual emitted asset URLs

    $Listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    $Listener.Start()
    $Port = $Listener.LocalEndpoint.Port
    $Listener.Stop()
    $Listener = $null
    $Server = Start-Process -FilePath python -ArgumentList @('-m', 'http.server', "$Port", '--bind', '127.0.0.1') -WorkingDirectory $StageRoot -PassThru -WindowStyle Hidden
    $PreviewUrl = "http://127.0.0.1:$Port/papers/$PaperName/$Version/"
    $Ready = $false
    for ($Attempt = 0; $Attempt -lt 20; $Attempt++) {
        try { Invoke-WebRequest -Uri $PreviewUrl -UseBasicParsing -TimeoutSec 2 | Out-Null; $Ready = $true; break }
        catch { Start-Sleep -Milliseconds 250 }
    }
    if (!$Ready) { throw "Temporary preview did not become ready: $PreviewUrl" }
    Write-Host "Open $PreviewUrl and operate a representative page/state. Inspect DevTools Network for all referenced JS/CSS, images, fonts, dynamic requests, and any 4xx/5xx responses; verify relative ./images/... paths at this non-root route. Press Enter here after review."
    Start-Process $PreviewUrl
    Read-Host 'Stop preview and clean the temporary stage'
} finally {
    if ($Server -and !$Server.HasExited) {
        try { Stop-Process -Id $Server.Id -ErrorAction Stop }
        catch { Write-Warning "Could not stop this task's preview process $($Server.Id): $_" }
    }
    if ($Listener) { $Listener.Stop() }
    if ($Pushed) { Pop-Location }
    if ($StageCreated -and (Test-Path -LiteralPath $StageRoot)) {
        try {
            $TempPrefix = [System.IO.Path]::GetFullPath((Resolve-Path $env:TEMP).Path + [System.IO.Path]::DirectorySeparatorChar)
            $ResolvedStage = [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $StageRoot).Path)
            if ($ResolvedStage.StartsWith($TempPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
                Remove-Item -LiteralPath $ResolvedStage -Recurse -Force -ErrorAction Stop
            } else {
                Write-Warning "Refusing to remove an unexpected staging path; inspect manually: $ResolvedStage"
            }
        } catch {
            Write-Warning "Staging cleanup failed; inspect this exact path and error: $StageRoot — $_"
        }
    }
}
```

#### Codex/W8 非阻塞 Chromium 模式

以下 PowerShell 示例从仓库根目录运行，覆盖生产构建、GUID staging、runner 管理的 HTTP 服务、现有项目浏览器状态、报告与截图审阅及精确清理。它不启动系统浏览器或等待人工输入，不复用已有服务器，也不使用占位 selector；配置从项目现有 visual-qa.json 派生，只临时覆盖服务、基址和页面相对路径。

```powershell
$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path -LiteralPath '.').Path
$PaperId = 'icarl'
$Version = 'qa-preview' # temporary path segment, not an official upstream version
$TempRoot = (Resolve-Path -LiteralPath $env:TEMP).Path
$StageRoot = Join-Path $TempRoot ('paperskillwork-subpath-' + [guid]::NewGuid().ToString('N'))
$StageCreated = $false
$LocationPushed = $false
$PortListener = $null
$Port = $null
$RunnerExitCode = $null
$RunDirectory = $null
try {
    $PathsOutput = & python tools/paper.py paths $PaperId --json
    $PathsExitCode = $LASTEXITCODE
    if ($PathsExitCode -ne 0) { throw "Could not resolve paths.publish_source (exit $PathsExitCode)" }
    $Paths = ($PathsOutput -join [Environment]::NewLine) | ConvertFrom-Json
    $Source = [System.IO.Path]::GetFullPath($Paths.publish_source)
    $PaperName = (& python -c "import sys; sys.path.insert(0, 'tools'); import paper; _, c = paper.read_paper(sys.argv[1]); r = c.get('release') or {}; print((r.get('upstream_paper_name') or '').strip() or paper.upstream_paper_name_from_title(c['title']))" $PaperId | Out-String).Trim()
    $PaperNameExitCode = $LASTEXITCODE
    if ($PaperNameExitCode -ne 0 -or !$PaperName) { throw "Could not derive paper-name (exit $PaperNameExitCode)" }
    if ($PaperName -in @('.', '..') -or [System.IO.Path]::GetFileName($PaperName) -ne $PaperName) { throw "Unsafe paper-name path segment: $PaperName" }
    $ExpectedPath = "/papers/$PaperName/$Version/"
    $StageRoute = Join-Path $StageRoot ("papers\$PaperName\$Version")

    if (Test-Path -LiteralPath $StageRoot) { throw "Refusing to reuse existing staging path: $StageRoot" }
    New-Item -ItemType Directory -Path $StageRoot -ErrorAction Stop | Out-Null
    $StageCreated = $true
    Push-Location -LiteralPath $Source
    $LocationPushed = $true
    npm run build
    $BuildExitCode = $LASTEXITCODE
    if ($BuildExitCode -ne 0) { throw "Production build failed (exit $BuildExitCode)" }
    $Dist = Join-Path $Source 'dist'
    if (!(Test-Path -LiteralPath (Join-Path $Dist 'index.html'))) { throw "Build did not create $Dist\index.html" }
    New-Item -ItemType Directory -Path $StageRoute -Force | Out-Null
    Copy-Item -Path (Join-Path $Dist '*') -Destination $StageRoute -Recurse -Force
    Write-Host 'BUILD=PASS command=npm run build'
    Select-String -Path (Join-Path $Dist 'index.html') -Pattern 'src=|href=' # record emitted asset references
    Pop-Location
    $LocationPushed = $false

    $PortListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    $PortListener.Start()
    $Port = $PortListener.LocalEndpoint.Port
    $PortListener.Stop()
    $PortListener = $null
    $PreviewUrl = "http://127.0.0.1:$Port$ExpectedPath"
    $QaConfigPath = Join-Path $StageRoot 'visual-qa-subpath.json'
    $QaConfig = Get-Content -LiteralPath (Join-Path $Source 'visual-qa.json') -Raw | ConvertFrom-Json
    $QaConfig.baseUrl = $PreviewUrl
    $QaConfig.server.command = 'python'
    $QaConfig.server.args = @('-m', 'http.server', "$Port", '--bind', '127.0.0.1')
    $QaConfig.server.cwd = '.'
    $QaConfig.server.readyPath = $ExpectedPath
    $QaConfig.server | Add-Member -NotePropertyName startupTimeoutMs -NotePropertyValue 10000 -Force
    foreach ($Page in $QaConfig.pages) { $Page.path = './' }
    [System.IO.File]::WriteAllText(
        $QaConfigPath,
        ($QaConfig | ConvertTo-Json -Depth 100) + [Environment]::NewLine,
        [System.Text.UTF8Encoding]::new($false)
    )

    $Runner = Join-Path $RepoRoot 'tools/visual-qa/cli.mjs'
    $OutputRoot = Join-Path $RepoRoot '.visual-qa' # direct run-* child accepted by --cleanup-run
    $RunnerOutput = & node $Runner --config $QaConfigPath --output $OutputRoot 2>&1
    $RunnerExitCode = $LASTEXITCODE
    $RunnerOutput | ForEach-Object { Write-Host $_ }
    $ReportLine = $RunnerOutput | ForEach-Object { $_.ToString() } | Where-Object { $_ -match '^Visual QA (PASS|FAIL)\. Report: ' } | Select-Object -Last 1
    if (!$ReportLine) { throw "Runner returned no complete report path (exit $RunnerExitCode); preserve output for diagnosis." }
    $ReportMatch = [regex]::Match($ReportLine, '^Visual QA (PASS|FAIL)\. Report: (.+)$')
    $MarkdownReportPath = $ReportMatch.Groups[2].Value.Trim()
    if (![System.IO.Path]::IsPathRooted($MarkdownReportPath)) { $MarkdownReportPath = Join-Path $RepoRoot $MarkdownReportPath }
    $MarkdownReportPath = [System.IO.Path]::GetFullPath($MarkdownReportPath)
    $RunDirectory = [System.IO.Path]::GetFullPath((Split-Path -Parent $MarkdownReportPath))
    $ExpectedOutputRoot = [System.IO.Path]::GetFullPath($OutputRoot)
    if (![string]::Equals([System.IO.Path]::GetDirectoryName($RunDirectory), $ExpectedOutputRoot, [System.StringComparison]::OrdinalIgnoreCase) -or [System.IO.Path]::GetFileName($RunDirectory) -notmatch '^run-') {
        throw "Report is not in a direct .visual-qa/run-* directory: $RunDirectory"
    }
    $ReportJsonPath = Join-Path $RunDirectory 'report.json'
    if (!(Test-Path -LiteralPath $MarkdownReportPath)) { throw "Runner-reported Markdown report is missing: $MarkdownReportPath" }
    if (!(Test-Path -LiteralPath $ReportJsonPath)) { throw "Runner JSON report is missing: $ReportJsonPath" }
    $Report = Get-Content -LiteralPath $ReportJsonPath -Raw | ConvertFrom-Json
    if (@($Report.results).Count -eq 0) { throw "No browser results; preserve and inspect $RunDirectory" }
    foreach ($Result in $Report.results) {
        if (!$Result.actualUrl -or ([uri]$Result.actualUrl).AbsolutePath -ne $ExpectedPath) { throw "Wrong actualUrl '$($Result.actualUrl)'; expected $ExpectedPath" }
    }
    Write-Host "SUBPATH_BROWSER=PASS expected=$ExpectedPath results=$(@($Report.results).Count) BROWSER_ERRORS=$($Report.statuses.BROWSER_ERRORS)"
    Write-Host "REPORT_MARKDOWN=$MarkdownReportPath"
    Write-Host "REPORT_JSON=$ReportJsonPath"
    Write-Host "SCREENSHOTS_AND_EVIDENCE=$RunDirectory"
    if ($RunnerExitCode -ne 0) { throw "Visual QA failed; preserve and inspect $RunDirectory before cleanup." }
} finally {
    if ($PortListener) { try { $PortListener.Stop() } catch { Write-Warning "Port reservation cleanup failed: $_" } }
    if ($LocationPushed) { try { Pop-Location } catch { Write-Warning "Could not restore the original location: $_" } }
    # The runner stops only its spawned HTTP child; this read-only check never terminates processes.
    if ($Port) {
        $ReleaseProbe = $null
        try {
            $ReleaseProbe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
            $ReleaseProbe.Start()
            $ReleaseProbe.Stop()
            $ReleaseProbe = $null
            Write-Host "HTTP_SERVER_RELEASE=PASS port=$Port (loopback port was bindable after runner exit)"
        } catch {
            if ($ReleaseProbe) { try { $ReleaseProbe.Stop() } catch {} }
            $Owners = @()
            try { $Owners = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop) } catch {}
            if ($Owners.Count -gt 0) {
                foreach ($OwningProcessId in ($Owners.OwningProcess | Sort-Object -Unique)) {
                    $Owner = Get-Process -Id $OwningProcessId -ErrorAction SilentlyContinue
                    $OwnerName = if ($Owner) { $Owner.ProcessName } else { 'unknown' }
                    Write-Warning "HTTP_SERVER_RELEASE=CHECK_REQUIRED port=$Port ownerPid=$OwningProcessId owner=$OwnerName; no process was stopped."
                }
            } else {
                Write-Warning "HTTP_SERVER_RELEASE=CHECK_REQUIRED port=$Port; could not confirm release and no process was stopped: $_"
            }
        }
    }
    # Remove only this invocation's exact GUID directory after validating identity and direct Temp parent.
    if ($StageCreated) {
        try {
            $ResolvedTempRoot = [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $TempRoot).Path)
            $ResolvedStageRoot = [System.IO.Path]::GetFullPath($StageRoot)
            $SameParent = [string]::Equals([System.IO.Path]::GetDirectoryName($ResolvedStageRoot), $ResolvedTempRoot, [System.StringComparison]::OrdinalIgnoreCase)
            if (!$SameParent -or [System.IO.Path]::GetFileName($ResolvedStageRoot) -notmatch '^paperskillwork-subpath-[0-9a-f]{32}$') { throw "Refusing to remove unexpected staging path: $ResolvedStageRoot" }
            $StageInfo = Get-Item -LiteralPath $ResolvedStageRoot -ErrorAction Stop
            if (($StageInfo.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Refusing to remove a reparse-point directory: $ResolvedStageRoot" }
            Remove-Item -LiteralPath $ResolvedStageRoot -Recurse -Force -ErrorAction Stop
            if (Test-Path -LiteralPath $ResolvedStageRoot) { throw "Staging directory remains: $ResolvedStageRoot" }
            Write-Host "STAGING_CLEANED: $ResolvedStageRoot"
        } catch { Write-Warning "STAGING_CLEANUP=FAILED exactPath=$StageRoot error=$_" }
    }
}
```

runner 的 finally 只负责关闭本次 runner 创建的 HTTP 子进程；外层 finally 对专用端口做只读确认。若端口仍有监听，只报告 PID/进程名供诊断，不按端口或进程名终止进程。staging 仅在确认是 TEMP 下本次新建的直接 GUID 子目录后清除，并确认路径已不存在；报告和截图不在示例中自动删除。

运行后先读取 report.json / report.md、实际查看相关状态截图、核对每项 actualUrl 都是预期的 /papers/<paper-name>/<version>/，并检查报告记录的浏览器/资源错误。记录 BUILD 命令、SUBPATH_ASSETS 结论和报告/截图路径后，才从本次终端输出取得 RunDirectory 并执行精确清理：

```powershell
$CleanupOutput = & node tools/visual-qa/cli.mjs --cleanup-run $RunDirectory 2>&1
$CleanupExitCode = $LASTEXITCODE
$CleanupOutput | ForEach-Object { Write-Host $_ }
if ($CleanupExitCode -ne 0) { throw "Visual QA artifact cleanup failed: $RunDirectory" }
$CleanedLine = "CLEANED: $RunDirectory"
if ($CleanupOutput -notcontains $CleanedLine) { throw "Cleanup did not confirm deletion of this run: $RunDirectory" }
if (Test-Path -LiteralPath $RunDirectory) { throw "Run directory remains after cleanup: $RunDirectory" }
```

只有输出为 CLEANED: <same-path> 且 Test-Path 为 false，才可报告本轮产物已清理。失败或报告不完整时保留证据；未能检查动态资源/Network 时，SUBPATH_ASSETS 标记为 NOT_RUN，不能以首页 200 代替。不要复制到 PaperSkillWork/html_output/，不要创建常驻预览服务。W9 在同一最终 publish_source 上复查；若源码变化，先复核受影响渲染状态再记录验收。

## 5. 修复范围与停止条件

- 明确的裁切、意外重叠、错位、坏掉的上下标或越界连线，可在不改变语义和已确认结构的条件下修复并复测。
- 局部间距、图例位置和文字比例可在已授权范围内优化，并检查前后截图。
- 改变章节逻辑、算法含义、全局工作台、已批准动画或新增 Camera 等设计取舍，先取得用户确认。
- 同一问题最多进行两轮针对性修复。若仍未解决、开始影响相邻区域或需要改变已批准设计，停止自动迭代并报告截图、定位、文件和具体选项。

## 6. 独立报告状态

每次页面 UI 任务分别记录以下结果；不得以其中一项代替另一项：

| 状态 | 记录内容 |
| --- | --- |
| BUILD | 实际执行的构建命令及结果；未执行时写 NOT_RUN |
| GEOMETRY_QA | 检查的页面、视口、状态、客观问题及结果 |
| STYLE_QA | 已配置计算样式断言的页面与状态；未配置时写 NOT_RUN |
| VISUAL_REVIEW | Agent 是否实际查看截图，以及发现和处理的问题 |
| REGRESSION | 对照的批准基准、前后截图及保护区域的检查结论 |
| HUMAN_ACCEPTANCE | 用户尚未审阅时保持 PENDING；不得由 Agent 代填 W7/W9 PASS |

交付记录应包含修改范围、运行命令、截图/报告位置、未检查项和仍需用户决定的取舍。构建通过不代表视觉或人工学习验收通过。

## 7. 通用 Chromium 工具

仓库的公共 runner 位于 [`tools/visual-qa/`](../tools/visual-qa/README.md)。它按项目 JSON 配置启动或连接本地服务、执行声明的页面状态操作，在 1440×900 和 1920×1080 采集截图，并记录浏览器 console/pageerror、资源加载错误与配置过的几何诊断。公共引擎不包含具体论文页面选择器；页面、状态和论文样式契约由对应项目的配置声明。

从仓库根目录运行示例：

```powershell
node tools/visual-qa/cli.mjs --config tools/visual-qa/examples/reusable-kit-demo.json
```

首次运行前，按 [`tools/visual-qa/README.md`](../tools/visual-qa/README.md) 安装 Kit demo 锁定的 Playwright 依赖和 Chromium，并先执行目标项目自己的构建命令。默认产物写入忽略目录 `.visual-qa/`。工具会生成 JSON 和 Markdown 报告，但不会替代对截图的实际查看，也不会自动更新已批准基准图。

项目可在 `pages[]` 中声明 `computedStyles`，对生产预览里的真实计算样式作精确断言：

```json
"computedStyles": [
  { "selector": ":root", "property": "--nav", "equals": "#183236" },
  { "selector": ".ewc-rail", "property": "background-color", "equals": "rgb(24, 50, 54)" }
]
```

断言在状态操作、字体加载和页面稳定后执行，只接受选择器、CSS 属性名和期望字符串，不执行配置中的脚本。缺失选择器、空变量或实际值不符会使状态与 CI 失败；诊断和 `report.json` 记录 `selector`、`property`、`expected`、`actual`。受支持的本地静态资源加载失败由独立的 `BROWSER_ERRORS` 检查报告，不混入 `STYLE_QA`。报告单独显示两个状态，不会改变 `VISUAL_REVIEW=NOT_RUN` 或 `HUMAN_ACCEPTANCE=PENDING`。

页面级 `computedStyles` 会在**该页所有状态**执行，因此选择器必须在每个状态都存在；只属于某个状态的断言应放进该状态自己的配置范围内，或改用跨状态稳定的选择器。项目可在顶层声明 `viewports` 覆盖默认的 1440×900 / 1920×1080（最多 6 个，宽高为 240–4096 的整数）；未声明时行为不变。需要窄屏证据的项目应显式加入 390×844 之类的条目，而不是在默认视口下推断窄屏表现。

现有网页项目与新建项目模板都在各自目录保存 `visual-qa.json`。Push CI 使用事件 `before → sha` 的完整 Git 差异选择论文工作区和实际网页目录；首次 Push 或缺失基线用默认目标分支的 merge-base，无法确定基线时失败。网页修改会分别执行 `npm ci`、生产构建和 `vite preview` Chromium Smoke；纯论文资料变更只校验 workspace。公共 QA 或选择器改动会额外检查 EWC 与 iCaRL 代表性页面。

维护 runner 时，从仓库根目录运行 `node tools/visual-qa/self-check.mjs`。它在两个宽屏视口验证实际 URL、正常报告/截图和预期失败，包括横向溢出、浏览器 `pageerror`、同源图片/字体/动态数据 404、跨状态稳定布局与 `rn:root` 样式违例；可选同源 API 与跨源 API 的 404 都不算本地资源错误。它还检查单次清理输出及目录确已消失、幂等 `Already absent`、路径拒绝、邻近运行目录和基线保护。全部断言通过且 HTTP 服务关闭后，它默认清理本次唯一新建的自检临时根目录；失败时保留诊断并打印路径。使用 `--keep-artifacts` 可显式保留成功产物供 CI 上传。该自检验证机器行为，不会把 `VISUAL_REVIEW` 或 `HUMAN_ACCEPTANCE` 标成通过。

## 8. 教学图与步骤导航的附加检查

当页面包含教学图、步骤导航或动态焦点时，除几何与截屏复核外还必须在项目浏览器测试中断言以下客观属性。它们检查表现质量，不评价教学结论：

- **完整标签**：主线步骤、图内节点标题和关键控件不得以省略号隐藏文字。断言可见文本完整、`text-overflow` 不是 `ellipsis`、`white-space` 不是 `nowrap`，且 `scrollWidth` 不超过 `clientWidth`。
- **图形边界**：每个关键节点和连接线的包围盒都落在图形容器内；容器不得靠 `overflow: hidden` 把对象裁掉。空间不足时应换行、分段或提供合法的局部查看方式。
- **缩放可读性**：图内正文类文字不低于项目声明的最小值（示意图标题通常 ≥ 14px，辅助说明 ≥ 12px）。若自动 fit 会跌破该值，必须改为重排或放大查看，不能静默缩小。
- **公式排版**：独立公式使用真实数学排版（MathML 或等价的数学布局），断言存在上下标、求和上下限与分数结构，且字号不低于正文；不得以普通文本加衬线字代替公式。
- **标题与主图比例**：在声明的桌面视口下，页面标题块高度不得占据首屏大半，主图宽度与高度要足以成为视觉主角；窄屏视口需单独采集证据。
- **状态与视觉关联**：对象身份、冻结/可训练状态、损失与更新方向必须随当前步骤一致变化；至少检查初始态、一次切换、一次回退或滚动同步，以及关键中间态。
- **可访问焦点**：键盘 `:focus-visible` 下焦点指示必须显著可见，且不得与“当前选中”样式叠加成厚重双层边框。断言描边样式、宽度、偏移和阴影，同时断言选中态本身不含粗边框或多余阴影。
- **重排而非隐藏**：窄屏把图形折叠为有序列表或分段的实现，要断言每一段仍列出其输入来源，回到宽屏后恢复图形结构。

这些断言属于 `BROWSER_ERRORS`/`STYLE_QA` 之外的项目浏览器测试，结果单独记录；它们不替代截图复核，也不改变 `HUMAN_ACCEPTANCE=PENDING`。
