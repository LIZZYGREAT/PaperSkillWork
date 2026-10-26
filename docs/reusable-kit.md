# Reusable Kit

Kit 是可发现、可复制、可自由组合的论文教学工具箱。视觉基础、小部件、Recipe 和真实参考场景各有职责；布局与计算属于当前论文。副本由论文工程独立拥有，不依赖跨论文运行时包。

## 从教学问题开始

根据 W2/W4 确认对象、数据流、状态与比较关系，在 Gallery 按需求或能力查找。按能力索引资产名、类别、路径和绘制职责；按教学需求索引用途、输入输出、关系、机制及有限的验证关键词。精选交互目录和其余 Registry 条目都直接读取唯一 registry.yaml；未进入精选目录不表示资产不存在。检查用途、适用/避免条件、就近预览和真实代码。W5 记录直接复用、组合小件或局部实现的决定；局部实现是正常结果。不要因 Kit 改变已确认的教学主线。

连接真实数据和计算，在当前页面检验默认外观。共同缺陷修 Kit 并回归展厅；论文特化只改局部构图。新场景先在真实论文验证，再通过两个语境判断是部件、Recipe 还是参考。

## 精确复制与安全追加

从仓库根目录执行，paper-id 是已有工作区的实际 ID：

```sh
python tools/paper.py paths <paper-id> --json
python tools/paper.py scaffold-kit <paper-id> --select MiniNetworkGlyph --allow-unapproved --dry-run
python tools/paper.py scaffold-kit <paper-id> --select MiniNetworkGlyph --allow-unapproved
python tools/paper.py scaffold-kit <paper-id> --select ResponseMeter --allow-unapproved
```

`scaffold-kit` 与 `paths <paper-id> --json` 使用同一个 Final-first / Enhanced-fallback 源码解析器。dry-run 的 `publish_source` 和 `destination` 是绝对路径；复制操作会写入同一目标。若配置了 Final 但 Final 目录缺失，命令会报错，不会回退到 Enhanced；解析到的工程没有 `src/` 时也会停止，不创建半成品源码目录。新建论文默认使用 Enhanced，切换到 Final 后使用 `paths` 可核对目标。

第一次只复制 Glyph TSX、其 CSS、kit.css 与来源元数据，第二次仅补齐响应条依赖。入口导入 `./shared/foundation/styles/kit.css`；从实际复制的具体模块导入组件，不导入未选的总 index。

`--preset continual-learning` 是显式的宽选择（P0），可和 `--select` 合用。没有隐式 preset 或强制覆盖。P0/P1 不限制精确选择，也不表示批准。

复制器沿真实 TS/TSX/CSS 本地 import/export 和 Registry 非导入依赖求闭包；缺 CSS/Hook/类型会在写入前失败。路径限制在 Kit 与论文工程内。新文件以独占方式创建，冲突先汇总并拒绝本轮写入。相同来源版本的用户修改保留并输出 KEEP；若 Kit 同一依赖已演化且与副本不同，停止并手工合并，或在隔离工程比较。已有源码从不静默覆盖。

`KIT_VERSION` 记录首次复制版本；`KIT_SELECTION.json` 记录累计组件、完整场景包 ID 与来源 SHA-256，供增量对比，不是工作流状态机。旧副本只有 KIT_VERSION 无 manifest 时，先在隔离工程比较和处理来源，不猜测所有权。

## 完整场景交付单元

单个 `--select` 复制部件及其依赖闭包；它不复制场景 CSS，也不替调用方解释数据。若要直接试用已组合的教学场景，使用 `--example`。它按包内 `example.yaml` 选择 Registry 资产，并把 Gallery 实际运行的 TSX、独立 CSS、入口文件和 README 放入 `src/shared/examples/<example>/`，同时复制所需组件闭包。dry-run 会同时列出目标路径、资产和全部交付文件。`--example` 与 `--select` / `--preset` 分开使用；增量复制信息记录在同一个 `KIT_SELECTION.json`。

| 场景 | 命令 | 入口 / 主要替换位置 |
| --- | --- | --- |
| 共享输入 → 两个独立模型 | `scaffold-kit <paper-id> --example shared-input-models --allow-unapproved` | `./shared/examples/shared-input-models`；README 说明输入、模型身份、拓扑和输出标签 |
| 向量内积检索 | `scaffold-kit <paper-id> --example vector-retrieval --allow-unapproved` | `./shared/examples/vector-retrieval`；README 说明查询、候选向量与分数定义 |

两个包都导入 `./shared/foundation/styles/kit.css`，其场景 CSS 由真实 TSX 自动引入。Gallery 中的“复制结构片段”只复制当前代码文件；完整场景应使用对应的 `--example` 命令。

当前所有资产为 candidate；`--allow-unapproved` 仅明确接受未批准复制。deprecated（包括实际导入的已登记依赖）均不可选。approved 必须有真实 approved_by、approved_at、evidence；自动检查不生成批准记录。

## 部件、组合与参考

| 表达任务 | 入口 | 边界 |
| --- | --- | --- |
| 聚焦网络连接 | MiniNetworkGlyph；[Recipe](../reusable-kit/recipes/mini-network-glyph.md) | 一张小网络；模型身份在外层，可用 compact/standard/inspect |
| 输入、特征块、向量与响应 | [Visual Parts](../reusable-kit/recipes/visual-parts.md) | 调用方给 ID、数据和尺度；组件不计算算法 |
| 五阶段训练响应 | useAnimationTimeline；[Recipe](../reusable-kit/recipes/animation-timeline.md) | 一个时钟；训练响应不等于预测 |
| 信号类型与方向 | FlowConnector / DiagramFlow | 局部连接或复杂多对象图；方向必须明确 |
| 标题、公式与图文 | EditorialTypography / MathTypography / FormulaBlock | [Kit 视觉语言](../reusable-kit/VISUAL_LANGUAGE.md)，统一语言，不固定页面 |
| 滚动解释同一系统 | StickySystemView | 不增加第二个计算引擎 |
| LwF / EWC / iCaRL | papers 只读参考与 Demo 参考路由 | 不搬整篇事实，不为 Kit 改动已批准论文 |

网络、提取流程与独立内积检索使用同一批部件和不同构图。Recipe 单独交付布局 CSS，资产自身拥有必需外观；Gallery CSS 不参与复制。

## 验证与签收

依赖缺失时先执行 `npm --prefix reusable-kit/demo ci`。本地发现与预览可运行 `npm --prefix reusable-kit/demo run dev -- --host 127.0.0.1`，打开终端显示的地址（默认 `http://127.0.0.1:5173/?demo=gallery`）。按本次改动范围选择检查；一般 Kit 交付回归使用：

```sh
npm --prefix reusable-kit/demo run build
npm --prefix reusable-kit/demo run test:browser
python -m pytest -q tests/test_document_governance.py tests/test_kit_copy.py tests/test_paper_cli.py tests/test_workflow_implementation.py tests/test_workflow_schema.py
python reusable-kit/demo/scripts/test-advanced-scaffold.py
node tools/visual-qa/cli.mjs --config reusable-kit/demo/visual-qa-gallery.json
```

Windows 可使用 `npm.cmd`；既有 pytest 临时目录不可写时，为本次运行指定独占 `--basetemp` 和 `-o cache_dir=...`。可设置 PAPERWORK_PLAYWRIGHT_EXECUTABLE 指向 Chromium/Edge。按 [Visual QA](VISUAL_QA.md) 选择受影响的桌面状态、检查报告与真实截图并清理本轮产物。聚焦网络/时间线或共享路由时选用对应已有 QA 配置；修改 runner 核心才补其 self-check，不每次重复全部配置。移动专项使用 `npm --prefix reusable-kit/demo run test:browser:mobile`，仅按 Visual QA 的条件触发。

数据/几何/交互测试不能代替视觉判断。Kit 特有画风见 [视觉语言](../reusable-kit/VISUAL_LANGUAGE.md)，独立场景的当前验收见 [R4 报告](../reusable-kit/validation/r4/REPORT.md)。

## V1 当前能力与限制

Registry 检索、精确源码/CSS 闭包、安全追加、Final-first 目标解析及两个完整示例包已有源码与测试覆盖，并可独立构建和交互。R4 网络与向量裁剪已完成独立构建、1440×900 / 1920×1080 浏览器交互和截图复核，真实 F11 仍为 NOT_RUN；具体范围以唯一 [R4 报告](../reusable-kit/validation/r4/REPORT.md) 为准。48 个 Registry 条目仍为 candidate，需显式 `--allow-unapproved`；只有逐项明确的人类认可及完整 `approved_by`、`approved_at`、`evidence` 才可批准，整体画风评价不构成批量批准。

V1 收口后，下一阶段是在一篇真实新论文完成 W0–W5 后检索、复制、组合或拒绝 Kit，形成 W6 教学切片并观察复用成本与教学质量；首次真实新论文复用尚待该阶段验证。
