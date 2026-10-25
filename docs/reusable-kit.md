# Reusable Kit

Kit 是可发现、可复制、可自由组合的论文教学工具箱。视觉基础、小部件、Recipe 和真实参考场景各有职责；布局与计算属于当前论文。副本由论文工程独立拥有，不依赖跨论文运行时包。

## 从教学问题开始

根据 W2/W4 确认对象、数据流、状态与比较关系，在 Gallery 按需求或能力查找。资料直接读取唯一 registry.yaml；检查用途、适用/避免条件、效果和真实代码。W5 记录直接复用、组合小件或局部实现的决定；局部实现是正常结果。不要因 Kit 改变已确认的教学主线。

连接真实数据和计算，在当前页面检验默认外观。共同缺陷修 Kit 并回归展厅；论文特化只改局部构图。新场景先在真实论文验证，再通过两个语境判断是部件、Recipe 还是参考。

## 精确复制与安全追加

从仓库根目录执行，paper-id 是已有工作区的实际 ID：

```sh
python tools/paper.py scaffold-kit <paper-id> --select MiniNetworkGlyph --allow-unapproved --dry-run
python tools/paper.py scaffold-kit <paper-id> --select MiniNetworkGlyph --allow-unapproved
python tools/paper.py scaffold-kit <paper-id> --select ResponseMeter --allow-unapproved
```

第一次只复制 Glyph TSX、其 CSS、kit.css 与来源元数据，第二次仅补齐响应条依赖。入口导入 `./shared/foundation/styles/kit.css`；从实际复制的具体模块导入组件，不导入未选的总 index。

`--preset continual-learning` 是显式的宽选择（P0），可和 `--select` 合用。没有隐式 preset 或强制覆盖。P0/P1 不限制精确选择，也不表示批准。

复制器沿真实 TS/TSX/CSS 本地 import/export 和 Registry 非导入依赖求闭包；缺 CSS/Hook/类型会在写入前失败。路径限制在 Kit 与论文工程内。新文件以独占方式创建，冲突先汇总并拒绝本轮写入。相同来源版本的用户修改保留并输出 KEEP；若 Kit 同一依赖已演化且与副本不同，停止并手工合并，或在隔离工程比较。已有源码从不静默覆盖。

`KIT_VERSION` 记录首次复制版本；`KIT_SELECTION.json` 记录累计选择与来源 SHA-256，供增量对比，不是工作流状态机。旧副本只有 KIT_VERSION 无 manifest 时，先在隔离工程比较和处理来源，不猜测所有权。

当前所有资产为 candidate；`--allow-unapproved` 仅明确接受未批准复制。deprecated（包括实际导入的已登记依赖）均不可选。approved 必须有真实 approved_by、approved_at、evidence；自动检查不生成批准记录。

## 部件、组合与参考

| 表达任务 | 入口 | 边界 |
| --- | --- | --- |
| 聚焦网络连接 | MiniNetworkGlyph；[Recipe](../reusable-kit/recipes/mini-network-glyph.md) | 一张小网络；模型身份在外层，可用 compact/standard/inspect |
| 输入、特征块、向量与响应 | [Visual Parts](../reusable-kit/recipes/visual-parts.md) | 调用方给 ID、数据和尺度；组件不计算算法 |
| 五阶段训练响应 | useAnimationTimeline；[Recipe](../reusable-kit/recipes/animation-timeline.md) | 一个时钟；训练响应不等于预测 |
| 信号类型与方向 | FlowConnector / DiagramFlow | 局部连接或复杂多对象图；方向必须明确 |
| 标题、公式与图文 | EditorialTypography / MathTypography / FormulaBlock | [视觉规范](VISUAL_LANGUAGE_SYSTEM.md)，统一语言，不固定页面 |
| 滚动解释同一系统 | StickySystemView | 不增加第二个计算引擎 |
| LwF / EWC / iCaRL | papers 只读参考与 Demo 参考路由 | 不搬整篇事实，不为 Kit 改动已批准论文 |

网络、提取流程与独立内积检索使用同一批部件和不同构图。Recipe 单独交付布局 CSS，资产自身拥有必需外观；Gallery CSS 不参与复制。

## 验证与签收

```sh
npm --prefix reusable-kit/demo ci
npm --prefix reusable-kit/demo run build
npm --prefix reusable-kit/demo run test:browser
python -m pytest -q tests/test_paper_cli.py tests/test_kit_copy.py tests/test_workflow_implementation.py tests/test_document_governance.py
python reusable-kit/demo/scripts/test-advanced-scaffold.py
node tools/visual-qa/cli.mjs --config reusable-kit/demo/visual-qa-advanced.json
node tools/visual-qa/cli.mjs --config reusable-kit/demo/visual-qa-gallery.json
node tools/visual-qa/cli.mjs --config tools/visual-qa/examples/reusable-kit-demo.json
node tools/visual-qa/self-check.mjs
```

Windows 可设置 PAPERWORK_PLAYWRIGHT_EXECUTABLE 指向 Chromium/Edge。按 [Visual QA](VISUAL_QA.md) 检查报告和真实截图，清理本轮临时产物。数据/几何/交互测试不能代替视觉判断。S1/S4/S6 及最终 A/B/D/F 画面供人签收，未获同意保持 candidate。实际记录见 [视觉语言与执行记录](VISUAL_LANGUAGE_SYSTEM.md)。
