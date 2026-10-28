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
| SOURCE_BUILD | PASS | npm.cmd --prefix papers/der/web/enhanced run build，退出0；tsc 与 Vite，71 modules，index-phdlzviR.js / index-DpXOBddT.css。 |
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

Agent 核对：主要数值由 evidence-data.ts 单一数据表供图和 Reference 使用，evidence.test.mjs 与 W2 已核对 Results 表逐值比对通过。Class-IL、Task-IL、MNIST-360 的容量、训练和评测时机分开；三项不占优反例默认可见。± 原样保留，不声称显著性；合成动画不是论文实验。平坦性/校准/ghost class 明确经验与推测边界。

M03 的 source_locator 移除原先误写的“Algorithm 3 and proof”：附录只有算法，等概率陈述见 §3，归纳证明是教学推导。未改论文原文、W2/W4 接受状态或笔记。

原图17项仍 REFERENCE_ONLY，未发布 PDF/原表/权利不明素材。ModelPixel/SVG 图元为原创教学绘制；Kit 源码副本保持 candidate，不冒称已批准公共组件。

- [ ] 用户确认条件、来源、解释层级与结论边界清楚。
- [ ] 用户确认最终教学效果与证据表述。

## W9 Visual QA Record

| Status | Result | Evidence / scope |
| --- | --- | --- |
| BUILD | PASS | 上述最终生产构建，退出0。 |
| GEOMETRY_QA | PASS | 公共 runner 40状态、1440×900 / 1920×1080，页宽、公式、资源与配置样式通过。工作台后续局部修正再跑24项运动避让断言。 |
| STYLE_QA | PASS (限定范围) | 公共 runner 对正文 --rk-canvas 的显式断言通过；其余场景没有计算样式基线，不宣称逐属性校验。 |
| FULLSCREEN_LAYOUT | PASS | 1920×1080、DPR1、100%缩放的布局模拟。 |
| FULLSCREEN_REAL | NOT_RUN | Windows UI 工具因无法可靠识别当前浏览器 URL 安全终止；不以 headless 尺寸或专注模式冒充 F11。 |
| VISUAL_REVIEW | PASS (Agent范围) | 已实看两档代表状态：正式首屏、KL/Logits、生命周期、Reservoir替换/拒收、单步更新/写入、增强、DER++不同来源、四轮写入/拒收/预测、证据协议与反例。已修复端点缺口、线穿文字、候选擦过网络和占用槽透出“空槽”等缺陷。 |
| REGRESSION | PASS (限定范围) | 生命周期三个核心源码文件相对 fa3257b 无差异；1440下阶段0/8整屏截图前后SHA256逐字节相同。两档保护场景功能回归通过；未配置全站批准像素基线。 |
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
