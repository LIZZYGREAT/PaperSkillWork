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
- 数值图元共享浅绿填充/绿描边与浅橙填充/暖橙描边；全局主题在 `:root` 覆盖基础变量，局部数值主题可覆盖 `--rk-data-positive-fill/line` 和 `--rk-data-negative-fill/line`。聚合采用开放柱形与底部基线，不带外框或整块底色。网络默认浅绿、聚焦浅橙；目标/比较、流程图/架构状态均复用公共语义变量。
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

第四部分：按后续截图反馈，同一尺度的数值条只在组上方标一次。前向得分组显示“尺度：-2 至 2”，响应组显示“尺度：0 至 1”，检索共享“内积尺度：-3 至 3”；删除逐条重复尺度。ResponseMeter 增加可选 `showScale`（默认 true），独立使用时仍在上方标尺度，分组时由场景统一说明并传 false；所有范围连接改为“至”。同步 Recipe。生产构建 PASS（0），相关浏览器 5 项 PASS（0），独立复制构建/浏览器 PASS（0），隔离目录 `C:/Windows/Temp/kit-advanced-scaffold-qx4hjsos` 已自清理且不存在。已实看 1440 前向、1920 检索及 390 前向截图；三视口无溢出和页面/资源错误。必要截图保留在 `.qa/kit-feedback-20261025/scale-titles/`，该次其余截图和原生 test-results 清理；人工签收仍未代填。

第五部分：按用户要求统一相似柱条的颜色。聚合柱、向量正负柱、原始得分和 sigmoid 响应条均使用 `--rk-accent` 实色；取消向量浅填充、负值 clay 填充和聚合 active 时的深色柱体。正负仍由零线方向及带符号数值表达，active 由外框/场景强调表达。本条取代第三部分的负值 clay 约定，同步 visual-parts Recipe。生产构建 PASS（0），既有数值/符号/尺度、检索及前向时间线浏览器测试 4 PASS（0）。实际三视口截图无溢出和页面/资源错误，已实看 1440 前向和 1920 检索，柱条填充一致；必要证据保留 `.qa/kit-feedback-20261025/bar-colors/forward-1440.png`、`retrieval-1920.png`。本轮其余截图及原生 test-results 已核对路径后清理。未改论文副本与上游。

第六部分（替代第五部分的单色解释）：用户明确要求以最初向量图的浅绿、浅橙暖色为准。`kit.css` 增加公共 `--rk-data-positive-fill/line`、`--rk-data-negative-fill/line`，分别关联既有 accent-soft/accent 与 warn-soft/warn；good 状态复用相同绿色变量。向量、原始得分、响应、聚合柱及特征块在组件默认样式中使用浅填充和深描边，负值恢复浅橙，保留零线方向和数值；不是 Gallery 页面补丁。同步可复制 Recipe。构建 PASS（0），数值/符号/检索/前向时间线 4 项浏览器 PASS（0）；实看 `.qa/kit-feedback-20261025/warm-parts/forward-1440.png`，三视口无溢出和页面/资源错误。后续继续统一其他公共图形。

第七部分：聚合删除外框矩形和整块填充，只保留浅绿圆角柱、细描边和底部基线，active 强调基线。公共网络节点、聚焦节点/路径、目标与比较角色、排名条、流程图/架构的连线和状态标记复用绿色/暖橙/中性色变量，去掉独立蓝紫黄常量；Gallery 原有私有色值改为公共变量的别名。没有新增独立样式文件，既有组件接口及论文副本保持不变。

验证：生产构建 PASS（0），完整浏览器 36 项 PASS（0）；真实独立复制构建与浏览器 PASS（0），额外确认在根元素改变 accent-soft/warn-soft 会同时改变向量、聚合、得分和响应的填充，无需 Gallery 样式。首轮测试错误地在 main 覆盖根级别名的基础变量，修正为根元素的全局主题覆盖后复测通过；失败隔离目录 `C:/Windows/Temp/kit-advanced-scaffold-2femkf6t` 与成功自清理目录 `kit-advanced-scaffold-aazv42ok` 在诊断后清理/确认不存在。实看开放聚合、1440 小件/分支图、1920 聚焦网络、390 小件；实际三视口均无溢出或页面错误。必要截图集中保留 `.qa/kit-feedback-20261025/warm-final/`，warm-parts 中间图及本轮原生 test-results 在复核后清理。人工签收保持待确认。

第八部分：用户指出并排模型的 x₁/箭头关系与节点尺寸、图形高度不一致，并明确要求箭头不加粗。FlowConnector 的 down 方向改为直接绘制 16×48 坐标的竖向 SVG，显示高度 40px，保留 1.5px 线宽；默认标签 13px，竖向标签间距 8px。双模型调用明确传 down，删除局部旋转；共享输入的细线只连接两个入口，添加中央分支接入。MiniNetworkGlyph 统一 384×164 坐标框，给定相同密度与渲染宽度时，层数不再改变节点直径、图形高度或标签基线。修在公共组件和对应 Recipe，未加并排专用图形样式。

生产构建 PASS（0）；`npm.cmd run test:browser -- --grep 'network focus|response labels|signed values|one catalogue|Pattern Gallery exposes|component interaction assertions'` 6 PASS（0），新增实际 DOM 几何断言覆盖 1440/1920/390 两侧节点直径、图高、图形/标签相对位置，确认竖向箭头 1.5px 与至少 8px 标签间距。独立复制构建/浏览器 PASS（0），隔离目录 `kit-advanced-scaffold-bw0cdx29` 自清理并核实不存在。实际截图无溢出和页面/资源错误，已实看三视口双模型；必要截图保留 `.qa/kit-feedback-20261025/network-alignment/parallel-{1440,1920,390}.png`。本轮多余截图、失败隔离夹具及原生 test-results 已核对绝对路径后清理。论文副本、审核状态与上游保持未修改。

第九部分：用户反馈输入区文字偏小、输出公式偏大且字符横箭头与响应文字关系错误。新增公共 `--rk-type-diagram-symbol` / `.rk-diagram-symbol`，输入/输出均为 18px 正体数学字体和真正的 HTML 下标；普通图元及连接标签使用既有公共 15px diagram-label，路径说明 14px。FlowConnector 可用 children 提供可见数学标签，label 保留无障碍描述；没有新增独立样式文件。模型输出改为“模型 → 细线向下箭头 → 响应名称 → 对应公式 → 次要路径说明”，删除字符横箭头。同步真实 Recipe。生产构建 PASS（0），相关浏览器 6 PASS（0），验证输入输出字体一致、箭头/标签/公式先后关系及既有双模型几何；独立复制构建/浏览器 PASS（0），隔离目录 `kit-advanced-scaffold-qxg9jb34` 已自清理。实看 1440/390 双模型，三视口无溢出和页面/资源错误；必要截图保留 `.qa/kit-feedback-20261025/diagram-type/`。后续节点分布反馈另行修复。

第十部分：少节点层不再拉满绘图区上下两端。MiniNetworkGlyph 通用布局改为相同垂直间距、围绕中线对称分布，两节点输出层自然收拢；三至五节点按相同规则处理，因此并排网络的同节点数输入/输出也在相同高度。六至七个可见节点时扩大坐标框高度以保留间距和边距，不改节点数、连接集合、ID 或密度规则。同步 Recipe，补充两节点层与隐藏层中心一致、间距一致且范围收拢的几何断言。生产构建 PASS（0），`npm.cmd run test:browser -- --grep 'network focus|signed values|response labels|component interaction assertions'` 4 PASS（0）。实际 1440/1920/390 截图无溢出和页面/资源错误，已实看 1440 小件/双模型及 390 小件；证据保留 `.qa/kit-feedback-20261025/centered-nodes/`。节点修复未重复独立复制检查（接口及依赖未变，上一部分刚通过真实复制）；该部分以最终生产构建、真实组件几何测试与截图验证。diagram-type/centered-nodes 多余截图及本轮原生 test-results 在复核后按确切路径清理。未改论文副本、上游或人工审核状态。

第十一部分（替代第十部分的跨层等距规则）：用户明确要求以协调的整体比例为准，不必让每层节点间距相同。此前修复虽然居中正确，却把三节点/四节点层压得过扁，视觉复核未及时拦截。现将公共坐标框宽度改为 320、基本高度 184，按可见节点数采用不同纵向展开范围：两节点保持收拢，三至五节点依次展开；六至七节点保持边距并增高。公共 CSS 缩短图形与层标签间距，未改节点/连接数据、身份、焦点或箭头。移除用户已否定的跨层等间距断言，保留稀疏层居中、收拢、双模型对齐、拓扑与可读性断言；同步 Recipe，不加页面专用外观规则。

验证：生产构建 PASS（0）；`npm.cmd run test:browser -- --grep 'network focus|signed values|response labels|Pattern Gallery exposes|component interaction assertions'` 5 PASS（0）。实际采集 1440/1920/390 下 compact、standard、inspect、parallel、hero 五类画面，无页面溢出、页面或资源错误；逐张实看 compact 1440/390、standard 1440、inspect 1440、parallel 1920、hero 1920，复核完整轮廓、图文距离和大小层级。没有把测试通过当作视觉签收；人工状态保持待确认。必要画面保留 `.qa/kit-feedback-20261025/balanced-network/`；多余图和本轮原生 test-results 在复核后按确切路径清理。接口与依赖未变，本部分未重复独立复制检查。

## Reuse audit follow-up · 2026-10-26

按交接方案继续修复 Kit 复用入口与交付。`scaffold-kit` 和 `paths` 共用 Final-first / Enhanced-fallback 源码解析；dry-run 回报实际发布源码、目标目录、示例和文件闭包。精选资产与其余 Registry 条目均来自唯一 `registry.yaml`，搜索可按教学需求或能力进行，详情跟随当前命中项；源码区区分最小用法、源码/CSS 片段和完整交付命令。

新增 `shared-input-models` 与 `vector-retrieval` 两个可单独复制的完整交付包，包含 Gallery 正在运行的 TSX、独立场景 CSS、入口、README 和 manifest；`--example` 与 `--select` / `--preset` 互斥。Gallery 包装组件现在从交付包导入实际实现。W5 在实施计划模板加入复用决定的自由文本清单，实施计划 Skill 与 Enhanced Implementation Skill 同步使用该记录；`implementation.stages[].reusable_pattern` 及 YAML schema 保持不变。

Gallery 顶部准备了两种构图供并排浏览，均使用同一实际 `ParallelModelsExample` 场景：A 是左侧编辑式标题/入口、右侧机制图；B 是横向着色画布、标题说明、机制图和三步阅读顺序。两者在桌面和 390px 手机布局下保持同一输入分支、独立模型及响应事实。示例明确标注为合成教学数据，Teacher/Student、层数和冻结角色均为假设。

### 本轮工程验证

| 检查 | 结果 |
| --- | --- |
| Demo 生产构建 | PASS；TypeScript + Vite，222 modules；现有入口包仍有约 519 kB 的 Vite 提示 |
| Python CLI / Kit / workflow / governance | `python -m pytest -q -o cache_dir=.qa/pytest-cache -o addopts= --basetemp=.qa/pytest-final-20261026 tests/test_kit_copy.py tests/test_paper_cli.py tests/test_workflow_implementation.py tests/test_document_governance.py`：62 PASS |
| 完整浏览器回归 | `npm.cmd run test:browser`：38 PASS |
| 独立例包交付 | `python reusable-kit/demo/scripts/test-advanced-scaffold.py`：两个包从精确 Registry 依赖闭包复制、独立构建、真实交互与 390/1440/1920 无溢出均 PASS；成功隔离目录由脚本清理 |
| Advanced Visual QA | `node tools/visual-qa/cli.mjs --config reusable-kit/demo/visual-qa-advanced.json`：27/27 captures PASS；run `run-2026-10-26T01-36-59-558Z` |
| Gallery Visual QA | `node tools/visual-qa/cli.mjs --config reusable-kit/demo/visual-qa-gallery.json`：90/90 captures PASS；run `run-2026-10-26T01-58-40-134Z` |
| Visual QA 自检 | `node tools/visual-qa/self-check.mjs`：PASS，临时产物由脚本清理 |
| 候选截图 | `node scripts/capture-redesign.mjs candidate-a|candidate-b ../../../.qa/kit-reuse-audit-20261026`：1440/1920/390 均 PASS，无页面/部件溢出 |

用户于 2026-10-26 选择 B 作为 Gallery 首屏稳定构图。默认 `?demo=gallery` 现在显示 B：横向淡色画布，标题与说明并列，主体机制图居中，图下按共享输入、分成两路、分别输出阅读；手机端保留同一阅读顺序并让更多机制图进入首屏。A 仅保留为显式比较截图入口。该决定只确认 Gallery 首屏编排，不改变 Registry 资产的 candidate 状态。

### R4 Agent 试用与最终回归

两项试用均使用临时教学场景，没有创建或改动 `papers/**`。网络局部试用从 Registry 选择 `MiniNetworkGlyph`，用 `scaffold-kit --select MiniNetworkGlyph --allow-unapproved` 在隔离工程复制三文件闭包：组件 TSX、组件 CSS、`kit.css`。场景独立编写 2→3→1 合成网络、输入/输出文案及路径聚焦；组件源码哈希与 Registry 相符，没有修补组件内部样式。TypeScript/Vite 构建和 Node 计算 `0.6383015576 → 0.64` 通过。CUA 工具拒绝该隔离 localhost 地址，并明确禁止用其他浏览器表面重试，因此本项浏览器布局、溢出、错误、交互与截图状态为 **NOT_RUN**，不能视作完整通过。

非相同场景试用从四像素矩阵 `[[1,3],[5,7]]` 推导行均值 `[2,6]`、全图均值 `4`、中心化行均值 `[-2,2]` 和均方值 `4`。Agent 检索并评估 `SampleToken` / `RepresentationVector` 后选择独立实现：前者的像素接口限定 `[0,1]`，后者不能表达按行运算与共享均值参照；因此未复制 Kit，也没有隐藏依赖或小件内部补丁。场景级矩阵、公式、步骤与响应由新页面拥有。浏览器用 Edge 在 390/768/1440 宽度验证数值、步骤交互、零横向溢出及零页面/控制台错误。相关报告、源码和截图保留于 `../../.qa/kit-reuse-audit-20261026/r4-agent-trials/`；网络场景报告中的未执行项也一并保留。

用户接受的 B 首屏实图位于 `../../.qa/kit-reuse-audit-20261026/candidate-b/`；已实看 1440/1920/390 图，模型入口有真实分支箭头，移动端仍保留两条身份与输出归属。最终默认路由由浏览器回归断言为 B，A 仍只通过显式 `hero=a` 参数供比较。首屏构图选择不改变任何 Registry `candidate` 状态。

最终回归命令与结果（全部退出码 0）：

| 命令 | 结果 |
| --- | --- |
| `npm.cmd run build`（`reusable-kit/demo`） | TypeScript/Vite PASS；入口 chunk 519.20 kB，保留既有 Vite 提示 |
| `python -m pytest -q -o cache_dir=.qa/pytest-cache -o addopts= --basetemp=.qa/pytest-r4-final-20261026 tests/test_kit_copy.py tests/test_paper_cli.py tests/test_workflow_implementation.py tests/test_document_governance.py` | 62 passed |
| `npm.cmd run test:browser` | 38 passed；首屏定向回归 `npm.cmd run test:browser -- --grep 'Pattern Gallery exposes'` 另 1 passed |
| `python reusable-kit/demo/scripts/test-advanced-scaffold.py` | 两个完整交付包在独立项目复制、构建、交互与 390/1440/1920 溢出检查 PASS；脚本确认并清理其隔离目录 |
| `node tools/visual-qa/cli.mjs --config reusable-kit/demo/visual-qa-gallery.json` | run `run-2026-10-26T02-33-24-870Z`：90/90 captures PASS |
| `node tools/visual-qa/cli.mjs --config reusable-kit/demo/visual-qa-advanced.json` | run `run-2026-10-26T02-44-40-698Z`：27/27 captures PASS |
| `node tools/visual-qa/self-check.mjs` | PASS；runner 自建临时目录已清理 |
| `git diff --check`; `git diff --exit-code HEAD -- papers` | 均 PASS |

两份页面报告均记录零几何/样式诊断和零浏览器错误。已读取报告并实看当前 B 首屏及机制图；机器 QA 报告本身仍把 `HUMAN_ACCEPTANCE` 留在 PENDING，用户仅确认 B 的首屏编排。之后按规范清理这两个精确 Visual QA run 目录并验证不存在。

两次早期 Visual QA 运行暴露的是重复示例和代码面板造成的旧定位歧义；配置改为精确区块后完整复跑通过，最终两份报告均记录 0 浏览器错误、0 几何/样式诊断。高级 QA 还促使开场眉题从 11px 调整到 12px；移动模型输出公式调整到与输入符号一致的 18px。Gallery 首屏的 B 构图已由用户确认；其余 Registry 条目仍为 candidate，未被本次选择批准。`git diff --exit-code HEAD -- papers` 退出 0；论文副本、上游和审批状态未改动。

### R4 场景复现与公式排版补记 · 2026-10-26

R4 场景源码与一条命令式的隔离预览入口整理到 `reusable-kit/validation/`，见其 README 和 [R4 报告](../reusable-kit/validation/r4/REPORT.md)。网络场景的 TypeScript/Vite 构建及 MiniNetworkGlyph 精确闭包检查通过；矩阵场景只保留了旧记录中的 1440px 桌面截图。新向量范数裁剪场景选择并复制 `RepresentationVector`、`ResponseMeter` 和 `FlowConnector` 的五文件闭包，独立 TypeScript/Vite 构建通过。

用户截图指出向量坐标原样暴露浮点尾数、缩放公式挤成一行及连接标签过长。现在显示数字最多两位小数，计算仍用完整精度；坐标增加间距，通式与数值代入拆行，连接标签收短。修复提交为 `73b8742`。构建输出 PASS；但本次没有完成该场景的桌面浏览器和 F11 全屏复核：Edge 窗口最小化，Edge 自动化入口不可用，Codex 内浏览器连接本机地址超时。未改用其他浏览器自动化通道，也未检查手机屏。具体限制和预览命令记于 R4 报告；上述工程构建不代表视觉验收。T4 的 data-flow 分类及单条桌面浏览器回归已于 `0312420` 提交。
