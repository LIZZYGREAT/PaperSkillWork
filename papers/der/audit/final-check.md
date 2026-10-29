# Final Learning, Evidence, and Release Check: DER / DER++

## W7 Vertical Slice Human Review

PASS。2026-10-29 用户在本聊天直接确认“W7我认为是通过的”。CLI 已登记（efc08b9）；没有将新 Reservoir/后续全篇默认为已获人工验收。

## W8 Final-Source Compatibility Summary

Final source path (paths.publish_source):
C:/Users/lenovo/Desktop/Projects/PaperWork/PaperSkillWork/papers/der/web/enhanced

与 implementation-plan.md、实际 React/Vite 生产构建一致。页面为 7 个阅读单元 / 10 个注册模块，I01–I11 全部实现；支持项和 Reference 按原计划覆盖。

Node24.18.0 / Vite6.4.3 / Edge156.0.4314.50。相邻 PaperSkill HEAD=c6d30defb90480afb2b4fa6ee8083a27d8dafb5c，缓存 upstream/main=c096ab528186f754ca3f8680ace8b12f6d1cf341。syntax/output 脚本 Git blobs 分别为 2bcfa6f815054ee498574c51cef05f0c315b4298、1a58ca06bd9fa47b6730904f1622189011cc32fe。

| W8 check | Status | Command / outcome |
| --- | --- | --- |
| UPSTREAM_SYNTAX | NOT_RUN | 无法核实当前官方脚本。git fetch upstream main 的 SSH 失败；临时 HTTPS URL 重写的 fetch 亦因连接重置失败（两次终端退出1，未独立采集原生 git 码）。未把缓存 SHA 当当前。 |
| UPSTREAM_OUTPUT | NOT_RUN | 同上。相邻旧版本仅作本地诊断。 |
| SOURCE_BUILD | PASS | npm.cmd --prefix papers/der/web/enhanced run build，退出0；tsc 与 Vite，71 modules，index-D99Hv4HX.js / index-C5JYbR8T.css（2026-10-29截图反馈修订后）。 |
| SUBPATH_ASSETS | PASS | 真 dist 由测试服务加载于 /der-review/，两档桌面全部机制、公式、Reference 和实验切换均无 page/resource errors；最终工作台布局另经生产预览复核。此 QA 子路径不是尚未登记的正式 W10 目录。 |

本地旧脚本诊断：node ../PaperSkill/paper-skill/scripts/syntax-check.js <上述绝对源码> --require-parser 与 validate-output.js <同源码> 均 PASS/退出0。41源文件解析，7章节、10模块，无占位内容。它们不代表“当前官方兼容”或 W10 Import/Preflight 已通过。

## W9 Learning Audit

状态：PENDING，待用户最终审查。下列为人审问题，Agent 不代填 PASS。

- [ ] 能从有限回放不足推导出历史响应、表示选择、在线选留、增强和标签监督的需要。
- [ ] 能区分原图、训练视图、当前输出和冻结 z；能解释 KL 与 logits 匹配约束的不同。
- [ ] 能复述先读旧 M → 合并损失 → 一次 θ 更新 → 更新后选留，拒收不撤销训练。
- [ ] 能从独立工作台重建空池、第2轮回放、第3轮先用后换、第4轮训练后拒收及跨轮继承。
- [ ] 能区分普通只读预测与训练、Task-IL 的测试任务身份例外。
- [ ] 正文/公式/动画共同支持理解，Reference 没有承担主线必须首先说明的内容。
- [ ] 新场景的视觉主次、运动、停留、控制与阅读节奏符合预期。

## W9 Evidence Audit

Agent 核对：主要数值由 evidence-data.ts 单一数据表供图和 Reference 使用，evidence.test.mjs 与 W2 已核对 Results 表逐值比对通过。当前主线精选 S-CIFAR-10 Class-IL、MNIST-360 K=500 和 K=200 三组结果；完整表格、Task-IL 与额外反例放在 Reference。Class-IL、Task-IL、MNIST-360 的容量、训练和评测时机分开；± 原样保留，不声称显著性；合成动画不是论文实验。平坦性/校准/ghost class 明确经验与推测边界。上述测试通过结果适用于当时记录的源码版本，不自动覆盖本次返修。

M03 的 source_locator 移除原先误写的“Algorithm 3 and proof”：附录只有算法，等概率陈述见 §3，归纳证明是教学推导。未改论文原文、W2/W4 接受状态或笔记。

原图17项仍 REFERENCE_ONLY，未发布 PDF/原表/权利不明素材。ModelPixel/SVG 图元为原创教学绘制；Kit 源码副本保持 candidate，不冒称已批准公共组件。

- [ ] 用户确认条件、来源、解释层级与结论边界清楚。
- [ ] 用户确认最终教学效果与证据表述。

## W9 Visual QA Record

下表中的 PASS 是先前 W8/箭头返修版本的历史记录，不代表 `f96be8f` 之后的当前源码已重验。当前重组版本的检查状态见文末“W9 全篇内容重组进度”。

| Status | Result | Evidence / scope |
| --- | --- | --- |
| BUILD | PASS | 上述最终生产构建，退出0。 |
| GEOMETRY_QA | PASS | 公共 runner 40状态、1440×900 / 1920×1080，页宽、公式、资源与配置样式通过。工作台后续局部修正再跑24项运动避让断言。 |
| STYLE_QA | PASS (限定范围) | 公共 runner 对正文 --rk-canvas 的显式断言通过；其余场景没有计算样式基线，不宣称逐属性校验。 |
| FULLSCREEN_LAYOUT | PASS | 1920×1080、DPR1、100%缩放的布局模拟。 |
| FULLSCREEN_REAL | NOT_RUN | Windows UI 工具因无法可靠识别当前浏览器 URL 安全终止；不以 headless 尺寸或专注模式冒充 F11。 |
| VISUAL_REVIEW | PASS (Agent范围) | 已实看两档代表状态：正式首屏、KL/Logits、生命周期、Reservoir替换/拒收、单步更新/写入、增强、DER++不同来源、四轮写入/拒收/预测、证据协议与反例。已修复端点缺口、线穿文字、候选擦过网络和占用槽透出“空槽”等缺陷。 |
| REGRESSION | PASS (原W8记录) | 原W8时核心源码/两个关键帧无差异的结论仅适用于b78cb55。2026-10-29用户追加截图反馈明确授权正文侧栏与版式修订；本轮不再宣称布局源码未改，计算模型与九阶段时序保持不变，结果见下方追加记录。 |
| HUMAN_ACCEPTANCE | PENDING | W9 留给用户，不由机器/Agent代签。 |

实际浏览器：
- npm run test:browser（无过滤）2364断言通过；覆盖正式页与全部场景、旧生命周期回归、暂停/续播/回退、键盘、reduced motion、模式切换、公式、子路径。
- 工作台修正后 test:browser -- --w8-only：764断言通过。最后旁注移位后 test:workbench-layout：24断言通过（两档各12个写入/拒收/预测中间态），候选与旁注/网络不相交。
- npm test：21/21；含固定数值表、梯度有限差分、冻结值、完整状态交接、预测只读、Reservoir留存概率穷举和论文数值溯源。
- 真实连续播放 test:playback：无模拟时钟，DER++ 四轮至预测127532ms，21阶段、508采样，与同一计算源逐值一致，无浏览器/资源错误；最终录像保留。最后仅移开静态旁注，已另跑对应布局复核，没有改变计算或时间线。

公共 runner 原 run：.visual-qa/run-2026-10-28T17-33-55-233Z（UTC目录时间，对应本地10月29日）。原报告已核读，actualUrl均在 /der-review/；必要最终证据归档到下方目录，已按精确路径清理：CLEANED输出与Test-Path=False均确认。三处本轮自建测试目录亦已精确清理。归档机器JSON保留原run相对路径，实际保留画面以最终目录中的命名PNG为准。内部开发录像/截图不进入网页发布资产。

最终审阅证据：
C:/Users/lenovo/.codex/visualizations/2026/10/28/01a1836d-f85f-7e31-b7b3-3847b946b36b/der-w8-final

## Engineering, Accessibility, and Triggered Checks

源码不依赖评审服务或跨论文运行时。保留同一时间轴、键盘可见焦点、手动控制、触屏非拖拽操作和 reduced motion；没有移动端专项触发，因此未声称手机视觉验收。证据图片与临时日志未放入 docs/ 或发布源码。

## W10 Official PaperSkill Release

NOT_RUN。W9 用户通过后再按 docs/UPSTREAM_RELEASE.md，由用户在既有 PaperSkill 检出执行官方流程。本轮没有 Import、repository Validate、Preflight、推送或 PR。尚未登记正式上游 paper/version，不能据本地构建声称官方可发布。

## Open Issues

1. W9 用户最终学习/视觉/证据审查待进行。
2. 真实浏览器 F11 未执行；当前官方检查器版本无法通过网络核实，发布前需补验。
3. 未发现其余阻塞性的本地构建、数学、状态、资源或已检桌面布局缺陷。

Overall: PENDING

## W9 截图反馈复核（2026-10-29）

用户指定的四处修订及追加标题对齐已落实于a45fae9：KL公式前置、修复MathML内部滚动；图注等宽/mark及删除指定句；误差区间为柔和圆角带与均值点；正文直接采用既有侧栏，标题对齐正文。定向42断言、两档14状态公共视觉检查、21项数学测试和生产构建均通过。已实看代表截图，证据在der-feedback-20261029目录。计算/生命周期纯模型未改，原专注版1440两关键帧逐字节一致。完整浏览器回归2490断言通过（两档各1245），含九阶段中间态、冻结/读写、暂停恢复、reduced motion、键盘/菜单、普通侧栏与原专注版切换；W9最终人工验收仍PENDING。

本轮公共runner已按确切路径清理，CLEANED与Test-Path=False均确认；两个本轮原生测试截图目录在归档必要画面后精确清理。

## W9 公式先行反馈复核（2026-10-29）

用户追加要求已落实：D1 保持原布局；KL、Logit Matching、Reservoir、DER 单步、增强、DER++、四轮工作台共七模块采用公式→独立讲解→机制动画。补充变量/职责、非负性/方向性、交叉熵分解、受约束二类导数与 logits 梯度、平方函数/参数链式求导、归纳留存概率及增强均值—方差分解。新增曲线可手动操作、暂停，标明数学探索与实际网络训练的区别；原训练与生命周期计算引擎未修改。

自检：24 单元测试通过；两档完整浏览器回归 2602 断言通过（各1301），最后仅修正选中端点的裁切，最终构建再经公式专项 122 断言通过（各61）。公共视觉 14 状态与三个修正区复测6状态通过，已实看两档关键区域及中间态；原章节计数断言发现的旧类名冲突已根治，未降低断言。生产构建与非根子路径资源通过；相邻现有检查器对44文件的语法和输出结构本地诊断通过。

必要画面和报告位于 `der-formulas-20261029` 归档（完整路径见 implementation-plan）；已完成公共 run 和本轮原生临时截图在归档后精确清理。D1 源码/CSS/model无差异，九阶段及侧栏/专注模式回归通过，主图已对照审看。当前官方检查器版本未能联网核实、真实F11未执行，继续分别记 NOT_RUN；未代签 W9，Overall 仍 PENDING，等待用户最终审查。

## W9 人工复审结论与返修启动（2026-10-29）

`HUMAN_ACCEPTANCE=REVISE`。用户提供的 W9 返修审查说明已将 W8 新增公式讲义及 S4–S8 场景评为需要结构性返工；本项是当前 W9 人工意见，不是 Agent 自动判断。W7 首切片通过保留，W8 的结构完成历史保留；`paper.yaml` 中 `W9_final_audit.status` 仍为 `pending`，返修完成前等待用户复审，不代签 PASS。当前工作依附件先执行 P0 和 Reservoir、增强、DER++ 的 P1 关键帧/短原型；P1 交用户审阅后才进入完整 P2–P3，P4 工作流规范最后修订，W10 不启动。

本轮从 Git 记录确认的范围：`07db1fd` 首次加入完整 S4–S8 场景、四轮工作台与实验页；`7d94b55` 新增七个公式讲义及独立数学曲线；`33f3dbb` 将统一公式/讲解/动画顺序固化进测试。返修不撤销 `efc08b9` 的 W7 审批，也不推翻 D1 专注版与后来的用户侧栏修订。当前仅 P0：阅读组件与测试已经取消统一顺序契约；还未重写线上机制场景，不将此项写成视觉验收通过。

P0 结果：`npm --prefix papers/der/web/enhanced test` 24/24 PASS；`npm --prefix papers/der/web/enhanced run build` PASS；使用共享 Playwright/Chromium 153.0.8010.12 的 `test:browser -- --formula-only` 两档共 122 项 PASS，`test:browser -- --review-feedback` 两档共 42 项 PASS。实际截图位于工作区可视化归档 `.../der-p0` 和 `.../der-p0-formulas`，已抽查七个公式片段、KL 与 D1 代表图。`FULLSCREEN_REAL=NOT_RUN`（headless Chromium 不能代替真实 F11）。截图路径按任务 Visualizations 根目录保存，源码仓库中不加入截图。

Windows Codex 的公共 Visual QA 回退流程已实跑：Playwright Chromium 下载因 `getaddrinfo ENOTFOUND cdn.playwright.dev` 失败，故 Chromium 默认 runner 本次 `NOT_RUN`；Edge 在沙箱启动也遇到权限限制后，按文档以提升权限启动 Edge 156.0.4314.50。两档 40 个状态全部实际截图，`GEOMETRY_QA / STYLE_QA / BROWSER_ERRORS=PASS`，40/40 结果 PASS、浏览器错误为 0，每项 `actualUrl` 均在 `/der-review/` 下。首跑发现 Reservoir 的 `[data-scene=reservoir] svg` 同时命中概率图和场景画布，导致四个状态动作失败；配置已改为唯一的 `.rv-canvas`，完整复跑通过。已实看文章、工作台预测、Reservoir 替换/拒收、增强和 DER++ 的代表截图；公共报告自身仍将 `VISUAL_REVIEW=NOT_RUN`，没有由此代签设计审查或 W9，`HUMAN_ACCEPTANCE=PENDING`。首跑与复跑报告路径分别为 `.visual-qa/run-2026-10-29T02-25-11-819Z`、`.visual-qa/run-2026-10-29T02-30-36-142Z`，完成诊断、复测、截图查看和记录后均按精确目录清理，并验证路径不存在。

当前仍 `Overall=PENDING`：P1 的 Reservoir、增强和 DER++ 关键帧/连续动态原型及真实浏览器预览尚未完成；P1 人工方向审阅、P2–P4、最终 W9 用户复审均待后续完成。算法内核、W2/W4、证据数据与 `paper.yaml` 阶段值本轮未改。

## W9 P1 方向预览复核（2026-10-29）

本节更新上段所述的 P1 待办：P1 的三种隔离方向稿已完成并可交用户审阅；前述“P1 预览尚未完成”是实施前记录。Reservoir、增强视图、DER++ 的实现边界和用户需决定的方向见 `design/implementation-plan.md` 的“P1 方向稿与短动态预览”。新入口只在 Vite 开发预览提供，生产构建 dist 不包含 `p1-review.html`；未改正式文章路由、受保护 D1/算法模型、训练计算或 `paper.yaml`。

- `npm.cmd --prefix papers/der/web/enhanced run build`：PASS；tsc 与 Vite 75 modules，且检查生产 `dist/p1-review.html` 不存在。
- 公共 Visual QA runner `p1-visual-qa.json`：Edge 156.0.4314.50，两个尺寸共 20 状态全部 PASS，actualUrl 均在独立 `/p1-review.html?scene=...` 入口；几何和浏览器错误 PASS，零浏览器错误，零横向溢出、裁切与小于 12px 的语义文本。运行器原生 `BUILD/STYLE_QA/VISUAL_REVIEW/REGRESSION` 仍按其定义保留 `NOT_RUN`，构建与人工图像复核另有上述记录，不能将运行器状态扩大解释。
- 第一轮实看发现两条眉题为 11px，已调至 12px；并确认稳定阶段数组后播放不会中断，Reservoir 替换/拒收可到达已提交停留帧。最终公共报告为 `.visual-qa/run-2026-10-29T03-01-45-514Z/report.md`。最终截图、JSON 和报告归档至 `C:/Users/lenovo/.codex/visualizations/2026/10/29/01a18566-4e3d-7401-968f-252bee2a2d93/der-p1`。
- Chromium CDN 本轮 DNS 解析失败，Playwright Chromium 默认浏览器不可用；`docs/VISUAL_QA.md` 的 Windows Edge 回退流程已实际执行并成功运行同一公共 runner。真实 F11 仍 `NOT_RUN`。

P1 Agent 范围的截图复核已完成，方向选择等待用户；`HUMAN_ACCEPTANCE=PENDING`、W9 `Overall=PENDING`。未启动 P2–P4、W10，也未代填 `paper.yaml` 或用户验收结果。

## Reservoir 方向截图反馈返修（2026-10-29）

用户认为 Reservoir 原图的箭头、虚线、动画与抽签组件不协调。本次只修改隔离的 Reservoir 原型：抽签卡移至流程中央；绿色实线表示候选写入，琥珀虚线表示旧记录/拒收候选离池；两条路径各自连接到独立池外区域。替换动画依次移出旧记录、写入新记录，并在到站处淡出交接。Reservoir 模型与预设数据、正式页面及其他方向均未改。

- 生产构建 PASS（TypeScript 与 Vite，75 modules）。
- 公共 Visual QA：Edge 156.0.4314.50；两个桌面视口、10 个状态 × 2 尺寸共 20/20 PASS；几何和浏览器错误 PASS、浏览器错误 0。
- 已实际审看 1440×900 的 replacement-mid-motion、replacement-settled、reject-and-count，并复核 1920×1080 布局。最终图中离池箭头停在收纳框边缘，中段动画不再出现旧卡遮住池外标记的重叠。
- 截图与报告：`C:/Users/lenovo/.codex/visualizations/2026/10/29/01a18566-4e3d-7401-968f-252bee2a2d93/der-p1/reservoir-revision-20261029/run-2026-10-29T03-41-46-385Z`。运行器的 `VISUAL_REVIEW` 和 `HUMAN_ACCEPTANCE` 按定义不由机器置为通过；用户方向反馈与 W9 最终复审仍待完成。

## 增强视图鹈鹕样本插画（2026-10-29）

用户提供插画参考并要求第二幅中的鸟替换为示例鹈鹕。将隔离 P1 增强场景的源 SVG 改为白色长喙鹈鹕骑青绿色自行车的日落图；原图、写入时视图和回放中心裁剪/水平翻转仍对应同一个 x₁。未修改训练步骤、增强变换定义、冻结目标与 logits，也未改 Reservoir、DER++ 或正式页面。

- 生产构建 PASS（TypeScript 与 Vite，75 modules）。
- 公共 Visual QA：Edge 156.0.4314.50；两种桌面视口共 20/20 PASS，几何与浏览器错误 PASS、0 浏览器错误。
- 已查看 1440×900 的原图/写入视图、中心裁剪、水平翻转，以及 1920×1080 的中心裁剪画面；鹈鹕的长喙、喉囊和骑行主体在视图变换后仍辨识清楚。
- 截图与报告：`C:/Users/lenovo/.codex/visualizations/2026/10/29/01a18566-4e3d-7401-968f-252bee2a2d93/der-p1/pelican-revision-20261029/run-2026-10-29T05-37-14-832Z`。这属于 Agent 图像复核，不代表用户已通过该方向；`HUMAN_ACCEPTANCE` 与 W9 最终状态仍 PENDING。

## P1 用户通过与 P2 启动授权（2026-10-29）

用户明确回复“我通过了，你继续按方案执行P2”。按紧接此前的 P1 方向稿及两项返修语境，记录为 P1 阶段人工通过并授权启动 P2。该结论不代表 S4–S8/W9 全篇人工验收通过；P2 完成后按附文停止复评，W9 总状态保持 PENDING，W10 不启动，`paper.yaml` 不改。

## P2 进行中：Reservoir 生产主线（2026-10-29）

S4 Reservoir 已接入通过的 P1 方向。规则贴近主图显示；保留输入训练已完成、冻结 `z`、固定槽位、满池抽签、同槽替换，以及拒收仍递增 `N` 的既有模型事实。移出旧记录与拒收候选分别进入池外框，避免动画期间重复显示同一记录。未改 `reservoir-model.ts`、训练/论文数据、U1–U3、D1 生命周期或 P1 审批范围。

构建 PASS（75 modules）；`npm test` 24/24 PASS；`node tests/browser.test.mjs --reservoir-only` 两档各 57 项，合计 114 项 PASS。测试检查连续播放、各阶段回退、状态与冻结值、暂停位置、reduced motion 和实际画布边界。因为本机 Playwright Chromium 文件缺失，经已记录的 Windows 回退以 Playwright/Edge 156.0.4314.50 运行；实际查看了替换中段、替换落定、拒收中段和两档落定截图。无头检查不等于真实 F11。证据：`C:/Users/lenovo/.codex/visualizations/2026/10/29/01a18566-4e3d-7401-968f-252bee2a2d93/der-p2/reservoir`。

这只是 P2 的第一部分。其余 S4–S6 生产场景待重建；P2 全部完成后停止等待用户复审。`HUMAN_ACCEPTANCE=PENDING`、W9 `Overall=PENDING`，W10 未启动，`paper.yaml` 未改。

### P2 / DER 单步生产主线

U4 单步画面现呈现当前与历史两路共享更新前 θ、各自的标签 CE/冻结 logits 匹配、一次联合更新、之后才选留当前候选。空池模式没有伪造回放；数值和顺序仍使用 `training-model.ts`。

生产构建 PASS（75 modules）；24/24 单测 PASS。`--w8-only` 两视口各 382 项、共 764 项 PASS；`--formula-only` 两视口各 60 项、共 120 项 PASS。已查看两档当前前向、历史回放和更新后选留截图。运行 Playwright 时本机 Chromium 文件缺失，按仓库回退用无头 Edge 156.0.4314.50；真实 F11 `NOT_RUN`。截图归档在 `C:/Users/lenovo/.codex/visualizations/2026/10/29/01a18566-4e3d-7401-968f-252bee2a2d93/der-p2/der-step`。Reservoir 和 DER 单步已完成，增强、DER++ 尚待；P2 完成前不进 P3/P4，W9 保持 PENDING。

### P2 / 增强视图生产主线（2026-10-29）

正式增强场景用同一鹈鹕原图身份展示保存时 `A₀(x₁)` 与未来回放 `A₁(x₁)`；中心裁剪和水平翻转是可操作选择。保存输出复制成不变历史目标 `z`，当前视图输出 `a` 与其匹配；视图变换会更新当前 logits/损失，不重写目标。独立增强公式讲义已退出主线，仅保留贴近图像/输出的 `L_match`。图内注明鹈鹕为合成 SVG，数值来自 W5 二维模型。通过共享插图组件复用 P1 鹈鹕资产，未更改 P1 视觉、训练模型或增强计算。

生产构建 PASS（TypeScript、Vite 76 modules），单元测试 24/24 PASS。Playwright/Edge 156.0.4314.50：`--w8-only` 两档各 384、合计 768 项 PASS；`--formula-only` 两档各 60、合计 120 项 PASS。断言涵盖阶段播放/暂停/回退、图形边界、reduced motion、手动选图、目标固定与损失随视图更新。已查看 1440×900 和 1920×1080 代表画面。真实 F11 未运行（`NOT_RUN`）。截图在 `C:/Users/lenovo/.codex/visualizations/2026/10/29/01a18566-4e3d-7401-968f-252bee2a2d93/der-p2/augmentation`。D1、训练模型/论文数值、`paper.yaml`、W9 验收值均未改；DER++ 是 P2 剩余项，P2 完成后停下复审。
### P2 / DER++ 生产主线与阶段暂停（2026-10-29）

正式 S6 主图将 E04 错例置于首幕：真实 `y=Claude`、冻结 `z=(0.5,2,0)` 的最高项为 GPT。当前分类、逐类旧 logits 匹配与独立历史标签 CE 以不同视觉方向汇入同一个 θ 枢纽，最后只显示一次更新；不模拟也不保证更新后纠错。`Rᴅ`/`Rʏ` 可选恰好重合或分别读取 `x₁/x₂`，并明确都从更新前 M 读取。DER 模式不显示 `Rʏ` 与第三项损失。为保持 P1 原型与生产同源，E04 两条合成记忆已提取到共享常量；P1 的 x₂ logits 最高类别文字改为读取其向量，避免沿用原来的错误描述。P1 增强入口另以开发预览回归：Edge 在两档均确认三张鹈鹕视图保有同一 `x₁` 身份、无浏览器错误；1440×900 画面已实看，截图包括 `C:/Users/lenovo/.codex/visualizations/2026/10/29/01a18566-4e3d-7401-968f-252bee2a2d93/der-p2/p1-augmentation-1440.png` 和 `.../p1-augmentation-1920.png`。除显示层与该文字修正外，无算法/训练模型改动。

生产构建 PASS（TypeScript、Vite 77 modules）；`npm test` 24/24 PASS。Playwright/Edge 156.0.4314.50：`--w8-only` 两档各 390、合计 780 项 PASS；`--formula-only` 两档各 60、合计 120 项 PASS。覆盖冲突、两次独立采样/是否重合、两种训练模式的监督分支、一个合并目标/单次更新、阶段播放/回退、reduced motion 和实际画布范围。已实看两档冲突首幕、不同记录读取及三监督合流状态。检查为无头 Edge，真实 F11 `NOT_RUN`。截图归档：`C:/Users/lenovo/.codex/visualizations/2026/10/29/01a18566-4e3d-7401-968f-252bee2a2d93/der-p2/der-plus`。

**P2 阶段结果：四项（Reservoir、DER 单步、增强、DER++）已完成，现依返修方案停止等待用户人工复审。** W9 总验收仍为 `PENDING`；未启动 P3/P4/W10，未修改 `paper.yaml`。无头布局检查不冒充真实 F11 或用户视觉验收。
## P3 工程完成记录（2026-10-29）

S7/S8 的 W8 工程实现和 Agent 视觉复核已完成：双视口生产浏览器回归 872/872 通过，24/24 单测和 TypeScript/Vite 生产构建（76 modules）通过。最终生产构建完整播放 21 阶段，真实播放时钟运行 127,576 ms、500 个状态采样，四次训练更新和记忆/计数终态均符合模型，浏览器错误为 0。S7 替换、拒收、DER/DER++ 与只读预测的关键状态，以及 S8 全部结果卡、来源和反例均已实看。视频、JSON 及关键帧见 `C:/Users/lenovo/.codex/visualizations/2026/10/29/01a18566-4e3d-7401-968f-252bee2a2d93/der-p3/production-playback-final`；两档截图见 `.../der-p3/workbench-v7`。

此记录是 Agent 工程与画面检查，不是 W9 人工验收。真实浏览器 F11 `NOT_RUN`；用户的整体学习/证据审查仍待完成，`Overall: PENDING`，W10 未启动，`paper.yaml` 未改。

## P4 工作流修订记录（2026-10-29）

已将 P3/P4 实际采用的顺序精炼进现有工作流与教学规范，以及 W5–W7 `implementation-plan`、W6–W8 `enhanced-implementation` 两份 Skill：先定视觉表达再选 Kit；关键动画主场景先审高保真动态；必要时先完成模型驱动的核心动作，再独立精修视觉；W7/W9 由人分别审阅运动、语义/证据、教学质量；最终在生产构建上完整播放。没有新增动画评分框架或动画要求。

仓库 Python 测试 123/124 在工作区沙箱运行通过；唯一失败为 Kit CLI 用例的临时目录原子改名被沙箱拒绝，该单项在本机权限复跑通过。`git diff --check` 通过；W9/W10 仍待人工复核，未运行 W10。P3 生产产物已经完整播放，真实 F11 仍 `NOT_RUN`。

## 三幅机制图箭头返修记录（2026-10-29）

用户指出 DER++、Reservoir 与增强图中的大实心箭头遮挡内容，轨迹线过粗/转折不协调，Reservoir 对齐和增强图间距也需修正。三个组件已改为细线小空心箭头；动态对象后使用 D1 样式点状拖尾。Reservoir 的入槽、离槽渐进路线与实际 token 路径同源，离槽与入槽线分左右镜像绕开居中的记忆标题；四个流样本、两槽和两侧出口围绕同一中心对齐。增强视图的分叉改为曲线，说明文字移出连线区域，并在时间控制和画布间留下清楚间隔。未修改训练/Reservoir 模型、时序、D1 源场景或论文数据。

最终生产构建通过（TypeScript、Vite 78 modules）。Edge 156.0.4314.50 headless 浏览器检查：`--reservoir-only` 1440×900 与 1920×1080 共 114 项 PASS；`--w8-only` 两视口共 872 项 PASS。实看入槽与替换运动、拒收落定、DER++ 监督汇合、增强未来视图；截图在 `C:/Users/lenovo/.codex/visualizations/2026/10/29/01a18566-4e3d-7401-968f-252bee2a2d93/der-arrow-revision`。`git diff --check` PASS。F11 真实浏览器检查 `NOT_RUN`；该工程 QA 不构成 W9 用户验收，W9 `PENDING`、W10 未启动、`paper.yaml` 未改。
## W9 全篇内容重组进度（2026-10-29）

本轮按用户附带的最终重组方案完成源码内容整理，并按单元及时提交：35572a9（U1–U3）、150f0c2（U4）、a720adc（U5）、d3632e2（U6）、6d7901f（U7）、f96be8f（旧讲义与样式清理）。

- U1–U3：KL 定义、固定 p 与交叉熵分解、平方 logits 匹配及共同平移要点留在主线场景；曲线、证明、梯度与复算表由现有 Reference 提供。
- U4–U5：Reservoir/DER 单步、原图跨视图固定 z、DER++ 历史标签监督使用短场景说明与章节交接；K/n 概率说明、增强均值—方差推导及类别梯度进入按需内容。
- U6：保留同一个 θ/M/N 状态贯穿四轮及训练后的只读预测；更新按需矩阵梯度关系，结尾交接到实验问题。
- U7：主线选择 S-CIFAR-10 Class-IL、MNIST-360 K=500 与 MNIST-360 K=200 三组条件化结果；完整表格、Task-IL 与额外反例留在 Reference。同步调整既有证据测试断言以匹配主线/Reference 分层。
- T4：全仓调用检查确认旧 FormulaLessons.tsx、TrainingFormulaLessons.tsx 与其专属 CSS 没有生产入口；硬标签 CE 梯度迁入 CE Reference，线性模型矩阵梯度留在工作台按需详情。formula-model.ts 仍供 Reference 探索器与数值测试使用，未删除。视觉 QA 选择器已改指向现有 KL/平方主线公式。

当前源码检查：git diff --check PASS。BUILD、单元测试、浏览器回归、真实播放、Visual QA 与人工截图复核均为 NOT_RUN；既有 W8/W9 记录中的 PASS 不覆盖本轮新源码。W9 人工意见仍记录为 REVISE，最终用户验收 PENDING；W10 未启动，未改 paper.yaml，未推送或创建 PR。此状态只记录源码返修，不代表教学或视觉验收通过。
