# Reusable Kit 视觉语言与重建记录

目标：可独立取用的小件、可以自由重组的场景。统一文字与绘图语言，不统一论文页面。

## S0 · 基准与审计（2026-10-25）

分支 `docs/workflow-governance`，起点 `3633d31`，工作区干净。只修改 Kit、复制 CLI、相关测试和使用指引；`papers/**` 与上游只读。

已阅读交接方案、背景需求、五张参考图以及 EWCNetworkDiagram、iCaRL SharedTrainingHead、LwF 入口。原 Gallery 实际运行后查看了首屏、网络局部和窄屏双模型截图：首屏主要是工具控件与说明；网络被父布局拉得过宽；移动端层标签变成列表，与图中层位置脱离。输入和特征图形在 Demo 内重复实现。Gallery 的 token 和组件 overrides 导致复制后的外观不可靠。

| 处理 | 资产与原因 |
| --- | --- |
| 保留内核 | MiniNetworkGlyph 的 ID/拓扑/focus；DiagramFlow 几何与窄屏语义列表；useAnimationTimeline 单一时钟 |
| 重建外观 | 小网络比例与标签、排版、默认材质、Gallery 首屏与阅读顺序 |
| 拆成小件 | 输入对象、特征块、聚合、带符号向量、指定尺度的响应条、轻量语义连接 |
| 仅作参考 | iCaRL 训练头、EWC 完整教学图、LwF 论文场景；不搬入算法事实 |
| 删除重复职责 | Gallery 公共组件 overrides、复制整个 foundation 的隐式规则、Demo 内重复图元 |

基准命令：`npm.cmd ci --no-audit --no-fund --cache ../../../../.npm-cache`（实际使用绝对缓存路径）退出 0；`npm.cmd run build` 退出 0；`node scripts/capture-redesign.mjs baseline` 退出 0，1440×900 / 1920×1080 / 390×900 无页面横向溢出、无浏览器资源错误。沙箱内浏览器启动失败后，在允许的提升环境启动本地 Edge Chromium。依赖最初安装遇 DNS 失败，重试成功。Python requirements 已满足。

实际截图保留在工作区父目录 `.qa/kit-redesign-20261025/baseline/`，供前后复核，未作为人工批准基线提交。`capture-redesign.mjs` 可重现截图。

## 验收边界

S1、S4、S6 画面供人判断；开发可以在 candidate 状态继续。自动检查与 Agent 视觉复核不代填人工签收。A/B/D/F 的最终人工判断仍待用户完成。

## 可执行视觉规则（S1）

- `kit.css` 是颜色、文字、间距、状态与既有组件的基础；canvas 为中性暖白，surface 为白，figure 为淡绿；ink/secondary text、weak/strong line、accent、warning 各司其职。数据与状态不靠颜色独自表达。
- 正文字体使用系统无衬线中文回退；数学使用 Cambria Math 等数学字体；数字用 tabular/mono。Hero 34–64px、章节 22–28px、局部 19–22px、正文 16px、引导 18px、注释 13–14px、图标注 12–15px、公式 20px。不用缩放或省略号塞文字。
- `editorial.css` 提供可选 headline/mark、lead、caption、equation、aside、figure-explanation 和 state 类。不是强制的整页模板；大标题不用每节重复。默认靠空白、轴线和文字建立层级，只有真实分组才有表面。
- focus 使用独立描边；冻结有虚线形状及文字，可训练有实线及文字。关系线必须由调用方声明类型和方向。聚焦不删除拓扑。
- 图形遵循内容尺寸，场景控制最大宽度；正常、紧凑、放大分别校准，放大不改拓扑。窄屏重排解释，保持字号。交互支持键盘，reduced motion 不自动播放装饰。
- 资产所需 CSS 属于资产；Gallery 只能安排展厅。已删除 `gallery-theme.css` 对公共组件的整层覆盖，以及 Gallery 私有基础 token。图文组合可直接用 `.rk-figure-explanation`，也可以局部编排。

S1 实现：`VisualSpecimen.tsx` 使用真实 MiniNetworkGlyph、状态标识和 MathML。`npm.cmd --prefix reusable-kit/demo run build` PASS（0）；`node scripts/capture-redesign.mjs s1` PASS（0），三个视口无横向溢出和浏览器错误。已实看 1440/1920 首屏与 390 样张：标题、图、公式有明确主次，窄屏重排；网络标签窄屏列表问题留给 S2。画面位于 `.qa/kit-redesign-20261025/s1/`，供人工校准，尚未签收。

## S2 · 独立视觉小件

新增 SampleToken（调用方内容/像素及 ID）、FeatureBlocks、FeatureAggregation、RepresentationVector（带符号及显式 extent）、ResponseMeter（调用方尺度）、FlowConnector（数据/控制/梯度/参照线型）、SemanticMark。每个组件导入自带 CSS，不需要 Gallery；没有计算 sigmoid 或预设论文事实。非法数值/尺度提供可访问的错误提示。

MiniNetworkGlyph 增加 compact / standard / inspect 三种使用密度（232/360/560px 上限），缩短层间距、调整节点半径，窄屏标签仍对齐原层；斜线端点按节点半径裁出。保留完整拓扑、稳定 ID、压缩披露和 focus。删除场景对 Glyph 内部宽度的补丁。

`npm.cmd run build` PASS（0）；浏览器 `--grep 'signed values|network focus'` 2 tests PASS（0），覆盖 30 边/11 节点、聚焦不改位置、独立双模型、向量正负值、动态得分与尺度、三个视口层标签对齐。首次测试发现 range 默认 margin 导致局部 2px 溢出，已修复并复测。实看 `.qa/kit-redesign-20261025/s2[-debug]/` 样张与小件、网络；外观脱离 Gallery overrides。原网络父布局仍疏散，S3 重排场景。

## S3 · 自由组合与独立场景

三个主要构图为紧凑学习器/局部网络、共享输入上方分流到并排独立模型、输入与提取在首行而表示/得分/响应在下一行的阶段教学。局部网络将输入、图、说明收拢；双模型身份在外层，前向没有 Teacher → Student。提取流程直接组合公共特征块、聚合和连接；向量和响应直接使用小件。单次 useAnimationTimeline 拥有阶段，计算留在场景。

新增独立的 RetrievalExample，用相同小件组成非对称的原始内积检索。切换 q 后派生得分和最大值，不假定分类或概率。候选数据、查询和排序属于场景，不抽成通用算法组件。Editorial 样段使用 S1 真实样张。

场景 CSS 从 Gallery 拆到 examples 配套文件。主要 Recipe 的 TSX/CSS 与运行源码同步。`npm.cmd run build` PASS（0）；五项浏览器测试 PASS（0），覆盖播放/暂停/重播、阶段交接、Wz 与 sigmoid、reduced motion、两个查询内积、390/1440/1920 几何。构建发现 ES2020 无 replaceAll，改用 split/join 后重新构建测试。s3-final 截图已实看局部网络、双模型、提取流程及窄屏；无溢出。长局部截图中悬浮 topbar 属于展厅，非场景依赖。

## S4 · 展厅与发现

Gallery 首屏改为编辑式标题及真实网络/输入/特征块/向量混合样张，随后是发现工具、部件、网络、时间线、独立检索、进阶构图。原首屏的密集分支图移到后面，原有图表/滚动/公式交互保留。candidate 状态保留在顶栏和发现说明中。

新增 AssetCatalog，Vite 在构建时直接读取唯一 registry.yaml（yaml 为构建依赖，无第二份目录数据）。按教学需求或能力搜索同一数据；详情包括适用/避免条件、真实源码、源示例、独立布局 CSS、尺度边界和选择命令。最小用法来自 Registry，S5 将逐一复制到隔离项目编译；复杂示例明确需要全部导入的小件。其余旧能力保留对应 Recipe 入口。

`npm.cmd run build` PASS（0）；发现任务与原 Gallery 交互 2 tests PASS（0）。验证“神经网络某条连接”和“输入图像到分类响应”均能唯一找到相关资产；键盘选择、空搜索和三个视口无溢出。实看 s4 的 1440/1920/390 首屏：主图完整、文字层次明确、首屏不再由操作控件占据。截图保留供用户判断，未记录人工批准。复制命令将在 S5 接通。

## S5 · 精确交付与 Agent 接入

`scaffold-kit --select` 支持全部 tier 的显式资产选择；仅显式 preset 才包含 P0。Registry 新增 source/dependencies，校验路径、文件、元数据及 Recipe；沿真实 import/export 计算文件闭包。`--dry-run` 输出文件清单，首次在 staging 组装，追加独占创建新文件；先汇总全部冲突再写入，不覆盖用户源码。KIT_SELECTION.json 只保存累计选择及来源哈希，KIT_VERSION 记首次版本。相同来源的本地修改保留，新来源冲突要求手动处理。候选显式 opt-in，过时资产及被实际导入的过时依赖均拒绝。

同步 W5 与 W6/W8 Skill、模板约定、使用文档与真实调用者。仍由既有 W0–W10 管理论文，不新增阶段或人工审批；局部实现是合法选择。

独立 `test-advanced-scaffold.py` PASS（0）：新建隔离工程、Glyph 精确三文件闭包、编辑 kit.css、追加十种资产、保留编辑、从实际 Recipe 复制 TSX/CSS、编译所有 Registry 最小用法、生产构建；Chromium 操作 focus、五阶段、sigmoid 与检索，并测 390/1440/1920。未带 Gallery CSS。成功临时目录 `C:/Windows/Temp/kit-advanced-scaffold-1bbofjk4` 已输出 SCAFFOLD_CLEANED 且验证不存在。首次脚本误将无扩展名 KIT_VERSION 排除在计数外，修正后重跑。

CLI/工作流/文档 54 项通过，另一个复制用例在沙箱中遇 WinError 5 原子重命名失败；正常本地环境复测相关 3 项全通过。路径安全补测 5 项通过。旧 easing 目录级复制断言改为“未被导入就不复制”，错误文案断言同步。最终全套结果归 S6 记录。

## S6 · 综合回归与交付

补全 inspect 实例；修正 Gallery 真实源码 glob 的目录层级并直接提供组件必需 CSS 面板，浏览器断言实际读取了 Glyph 源码及 CSS。仅打包此批展厅用到的源码族，避免把所有旧场景实现都塞进源码面板。删除已失效的样张步骤样式。

压力回归发现旧时钟的一个真实竞争：RAF 可先更新 elapsedRef，再执行上一渲染的 effect；旧 effect 将该差异误判为 clip 配置替换，意外暂停播放。现在只有 clip 列表身份真正变化时才重整，单一时钟和既有 API 保持不变。补充批量帧断言，完整回归和实际持续播放均通过。隐藏的 inspect 实例只在展开后量几何；原移动端单列 DOM 假设改为对应层/节点中心对齐及完整文字检查。测试复制夹具排除同时被 Playwright 重建的临时 test-results，消除源文件枚举竞争，不改变源码验证范围。

### 实际命令与独立结果

以下均退出 0；所有 QA 都是工程与 Agent 复核，不是人的签收：

| 检查 | 命令与范围 | 结果 |
| --- | --- | --- |
| 生产构建 | `npm.cmd --prefix reusable-kit/demo run build`；最终 TS/Vite 源码 | PASS |
| CLI / 闭包 / 工作流 / 文档 | `python -m pytest -q tests/test_paper_cli.py tests/test_kit_copy.py tests/test_workflow_implementation.py tests/test_document_governance.py --basetemp ../.qa/kit-redesign-20261025/pytest-s6-final -o cache_dir=../.qa/kit-redesign-20261025/pytest-cache` | 56 PASS |
| 完整 Chromium 回归 | Demo 中 `npm.cmd run test:browser`；控件、Reference Hub、LwF/EWC、Editorial、Reading Journey、时间线、三密度与窄屏 | 34 PASS |
| 源码/CSS 面板最终修复后 | `npm.cmd run test:browser -- --grep 'one catalogue\|one forward\|component interaction assertions'` | 3 PASS |
| 真实独立交付 | `python reusable-kit/demo/scripts/test-advanced-scaffold.py`；最小闭包、增量保留、Registry 用法、真实示例及独立构建/浏览器 | PASS；最终隔离目录 `kit-advanced-scaffold-5cnc3ozm` 已自清理并验证不存在 |
| 核心场景共享 QA | `node tools/visual-qa/cli.mjs --config reusable-kit/demo/visual-qa-advanced.json` | 27 captures PASS，1440/1920/390 |
| Gallery 共享 QA | `node tools/visual-qa/cli.mjs --config reusable-kit/demo/visual-qa-gallery.json` | 90 captures PASS，1440/1920/390 |
| 共享路由回归 QA | `node tools/visual-qa/cli.mjs --config tools/visual-qa/examples/reusable-kit-demo.json` | 156 captures PASS，1280/1440/1920 |
| QA 工具自检 | `node tools/visual-qa/self-check.mjs` | PASS，自己的临时产物已清理 |
| 局部与首屏截图 | Demo 中 `node scripts/capture-redesign.mjs final` | 三视口 PASS，无页面/部件溢出和浏览器资源错误 |

浏览器使用本机 Edge Chromium，100% / DPR 1；实际设置 `PAPERWORK_PLAYWRIGHT_EXECUTABLE`。Python 初次默认配置指向沙箱无权清理的历史 D:/Temp，改用本轮新建目录；一次夹具误复制正被重建的 test-results，修正夹具后全套通过。旧 Gallery 配置仍期望旧调色板及 600 字重，已依 S1 规则更新为 body canvas 与 700；没有更新图片基线、隐藏内容或降低可读性门槛。失败报告仅为旧样式断言，诊断后以新配置完整重跑。

对应本轮终端实际返回的 run ID：advanced `13-07-49-998Z`；shared routes `13-16-55-834Z`；Gallery `13-30-25-309Z`（均为 `run-2026-10-25T` 前缀）。Gallery 旧断言失败记录为 `13-15-14-926Z`、`13-22-57-275Z`。报告中的 BUILD / VISUAL_REVIEW / REGRESSION 不由 runner 执行，仍显示 NOT_RUN；本表单独记录实际构建、Agent 实看与回归。HUMAN_ACCEPTANCE 保持 PENDING。

### 实看与范围复核

已实看 1440/1920 首屏、390 样张、紧凑/正常/放大网络、完整/聚焦连接、双模型、特征提取默认/阶段/暂停/响应、带符号检索两种输入、目录搜索与源码/CSS 详情，以及共享路由的 LwF/EWC 首屏、Editorial 和 Reference Hub。视觉上不再有网络占满横向画布、远离主图的说明或窄屏层标签列表脱离原层的问题。图元在不同构图共享外观；窄屏通过重排保持文字与数据。全页截图中的固定顶栏可能出现在长图中部，这是展厅 chrome，不是部件依赖。

另用已有 Vite 运行真实 `papers/icarl`、`papers/ewc`、`papers/lwf` 的 enhanced 源码，仅浏览操作。iCaRL 第 2 页先“打开模型”再查看 SharedTrainingHead；三个页面均无 pageerror / 页面溢出，已实看特征提取局部及原页面。`git diff --exit-code HEAD -- papers` 为 0；没有修改原论文副本或任何教学/审核状态。上游 Import/Preflight/发布 NOT_RUN（本轮范围外）。本任务启动的临时预览均由脚本关闭。

### 最终 A–F 核对与人工待签收

| 项目 | 可复核证据 | 人工状态 |
| --- | --- | --- |
| A 默认完成度 | compact 正文、standard 局部/双模型、inspect 放大，未加 Glyph 内部 override；三视口标签/拓扑断言 | 待视觉签收 |
| B 同语言不同构图 | 紧凑学习器、上下共享输入/并行模型、分段提取，以及新的非对称检索 | 待视觉签收 |
| C 语义与数值 | 共享输入两路独立、冻结/训练文字+形状、30 边不变、单时钟、Wz/sigmoid/原始内积同源 | 工程 PASS，论文事实仍由当前场景负责 |
| D 真实复制 | 精确三文件 Glyph；追加保留编辑；缺依赖/冲突先失败；真实源码独立编译运行 | 工程 PASS，待使用体验判断 |
| E 可发现 | 两项指定教学查询、边界、真实源码、必需 CSS、最小用法和实际示例均可见并已测试 | 工程 PASS |
| F 首屏设计 | baseline 与 S1/S4/final 三视口截图；从工具实验台改为标题与真实部件样张 | 待视觉签收 |

全部 48 个 Registry 条目仍为 candidate，未生成 approved_by / approved_at / evidence。不能把本轮工程完成写成人已接受 A/B/D/F。

最终与阶段签收所需截图保留在工作区父目录 `.qa/kit-redesign-20261025/review/` 和 `final/`。其余本轮临时图、pytest 工程、失败夹具、共享 runner 原始产物在查看/记录后按确切路径清理。保留这些图片是为了人工复核，不是批准基线。

清理结果：上述五个确切 runner 目录均返回 `CLEANED: <same-path>`，逐一 Test-Path 为 False。自己创建的 pytest 工程、Playwright test-results、失败隔离目录均已核对绝对路径后清理并确认不存在；保留 review/final 中的必要截图，未触碰任何历史 QA 目录。最终文档治理补测 4 PASS（0），`git diff --check` 和 `git diff --exit-code HEAD -- papers` 均为 0。

## 截图反馈修订 · 2026-10-25

第一部分：FeatureAggregation 将细路径改为 10px 实心圆角柱，调整容器高度、柱间距和底部对齐；active 只强调外框与填充。RepresentationVector 去除坐标间的空隙，形成连续零线。修在公共组件/CSS，覆盖首屏、小件样张、特征提取、检索中的全部实例。构建 PASS（0）；数值、提取时间线、reduced motion 与检索 4 项浏览器测试 PASS（0），覆盖 1440/1920/390；已实看独立小件和提取场景截图。临时证据位于 `.qa/kit-feedback-20261025/parts/`，最终收敛时只保留必要画面。

第二部分：σ 与 ResponseMeter 的类别标签按第一行对齐，不再居中到含尺度说明的两行整体；双模型输出去除 `<em>` 与 italic，t(x₁)/s(x₁) 使用正体，并统一桌面输出行。同步两份可复制 Recipe。生产构建 PASS（0），实际浏览器几何、网络语义与前向时间线 3 项 PASS（0）；1440/1920/390 无页面溢出。已实看双模型与响应截图，证据暂存 `.qa/kit-feedback-20261025/alignment/`。这仍是 Agent 复核，不代表人工签收。

第三部分：用户确认第二图缺少的是每类得分的水平数值条。前向输出头改用公共 ResponseMeter，三个原始得分仍由同一个 Wz 推出 [2, 0, -1]，共用 [-2, 2] 尺度。公共部件在跨零尺度上以零线为起点，正值向右、负值向左、零值无填充；负值沿用 clay 色，数值及尺度保留，原生 meter 继续提供标签与值的无障碍语义。此修复也覆盖小件样张与检索中的全部实例；sigmoid [0, 1] 仍从左侧零起点绘制。同步 Recipe 和独立复制断言，未改数据、计算与预测边界。

最终验证：`npm.cmd --prefix reusable-kit/demo run build` PASS（0）；Demo 中带 Edge 路径执行 `npm.cmd run test:browser -- --grep 'response labels|raw score bars|signed values|independent retrieval|one forward|reduced motion keeps|network focus'`，7 PASS（0），验证零值/符号/长度比例、无障碍标签、σ/C 几何、正体输出与时间线；`python reusable-kit/demo/scripts/test-advanced-scaffold.py` PASS（0），真实源码及 Recipe 在隔离工程构建和浏览器运行，隔离目录 `C:/Windows/Temp/kit-advanced-scaffold-325xznn4` 自清理并核实不存在。

Demo 中 `node scripts/capture-redesign.mjs final ../../../.qa/kit-feedback-20261025` PASS（0），1440/1920/390 无页面或部件溢出、无页面/资源错误。已实看桌面得分/响应、小件、手机完整前向路径及双模型、1920 改变查询后的检索。最终必要截图保留在工作区父目录 `.qa/kit-feedback-20261025/final/`；中间 parts/alignment、其余截图及自己生成的 test-results 已核对确切路径后清理。所有修改限于 Kit 及本记录，论文副本与上游未修改；人工验收状态保持待签收。
