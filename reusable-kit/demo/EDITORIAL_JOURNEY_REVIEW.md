# Reading Journey · 整页阅读实验

2026-10-24 · P0 → P1 → P2；候选，HUMAN_ACCEPTANCE=PENDING。
基准：`cff99a579852469ac40961d2d3c7f7a78650488f`，分支 `docs/workflow-governance`，执行前工作区干净。

## P0 · 内容与构图蓝图

| 节拍 | 先验认识 → 新问题 | 当前主体 | 信息输出 / 向后交付 | 强度 | 布局理由 |
| --- | --- | --- | --- | --- | --- |
| 01 冲突 | 只拿到新任务数据 → 旧响应如何留下？ | 当前输入与两种要求 | 同一输入、新标签、旧响应要求 → 两条路径 | 2/5 | 短标题与一条旧/新要求对照，尽早让出画面给系统 |
| 02 地图 | 已有冲突 → 对象在哪里、谁连接谁？ | 同一个 lwfGraph | Teacher/Student、目标、预测、损失、更新落点 → 两组比较 | 5/5 | 唯一宽幅系统地图；概览及五步由现有 step ID 派生 |
| 03 比较 | 已识别两条路径 → 每个损失到底比较什么？ | 固定旧目标与 Student 的两类预测 | 输入来源、预测来源、损失结果 → 联合目标 | 2/5 | 窄边注搭配连续比较行；不复制 Teacher/Student 系统 |
| 04 优化 | 已知两个损失 → 一起更新谁？ | Student | J、参数范围、冻结与训练阶段 → 任务边界 | 4/5 | 两损失与目标、更新同处一个 Student 场景；外部参照只轻量回指 |
| 05 交接 | 已知当前更新 → 下一任务继承什么？ | 训练后模型 | 边界才形成新参考；重新在下个输入集生成目标 | 1/5 | 轻量时间关系与结论，回收而不重画地图 |

连贯低成本线框：`.visual-qa/editorial-journey-review/wireframe.html`（本地忽略证据）。宽度依次为中宽开场 → 全宽地图 → 收窄解释 → 中宽 Student 场景 → 窄收尾。无五块等高模板；第三段完整解释比较，第四段只首次完整解释联合目标。

事实核对使用既有完整缓存 `papers/lwf/source-cache/content.md`，不修改论文工作区；来源为 [Li & Hoiem, arXiv v3](https://arxiv.org/abs/1606.09282v3)。§3 PDF pp.4–5，Eq.(1)–(4)、Fig.3 支持：先在新数据记录旧响应；warm-up 只训练新增头；联合训练共享/旧头/新头；旧损失使用温度变换后的归一化分布（论文 T=2）；目标为 λo Lold + Lnew + R。任务边界的 Teacher 是这一流程的教学映射，非逐步同步模型。

保护 C1/C2、Editorial A/B/C、Lab/LwF/EWC 和 DiagramFlow 内核。保留图谱 ID/端点，图例需在本实验明确区分前向、比较与更新关系，不能把原图全部实线都叫前向计算。θs 在本页统称 Student 参数，明确区别原文的共享参数记号。只局部状态，无全局仓库/新状态机。无需正式论文 W 阶段迁移或上游发布检查。

P0 自查：无无关填充；概念首讲与回收边界清晰；对象均有来源和去向。P1/P2 实际验证与精选证据将在此记录。

## P1 · 独立候选实现

入口为侧栏 `Reading Journey / 完整阅读实验` 和 `?demo=journey`；五个章节支持 hash 定位及重新加载。图谱、端点、五步 ID 直接来自 `figures.tsx`；本地派生边的线型区分前向、比较与更新归属，图谱内核未变。概览与聚焦共用一个 `stepId`，无计时器。

C1 仅吸收窄边注/宽解释的编辑关系；C2 仅吸收可训练对象中心的组织方法，移除独立候选的重复开场；P2 系统图保留节点、边与五步语义，增加全局概览及本实验作用域的非焦点可读性处理。未改既有候选内容、共享 Kit 样式、注册成熟度或 `papers/**`。

`npm run build`（demo 目录）退出 0。依赖和锁文件未变，`npm ls --depth=0` 退出 0，已有锁定依赖可用，跳过 `npm ci`。首次沙箱内浏览器启动探测受 localhost `EACCES` 阻止，改用获准的沙箱外执行；不是页面断言失败。新增用例初跑纠正了测试预期中遗漏的 backbone 和两个无入边源节点，随后 5/5 通过。

实际查看了 1280×900、1440×900、1920×1080 全页及 390×844 重排，1440 开场→总图、局部→Student、聚焦状态；发现并修复深色更新节点内 θs 的对比度以及聚焦截图受 sticky 顶栏遮挡。移动端沿用 DiagramFlow 输入可追溯的分组列表，不缩小主图；已选阅读入口自动在横向导航中露出。主图最强、Student 次强、第三段与收尾收窄；未发现等形卡片串联或无意义补白。最终全量回归和证据清理见 P2。

## P2 · 验证与人工交付

运行环境：Node `v24.18.0`，Playwright `1.63.0`，Vite `6.4.3`。安装目录锁与仓库锁的依赖版本差异为 0。以下 build / browser 在 `reusable-kit/demo`，QA 在仓库根目录执行。

| 命令 / 检查 | 实际结果 |
| --- | --- |
| `npm ls --depth=0` | 退出 0；复用已有一致依赖，未运行 npm ci |
| `npm run build` | 退出 0；TS 与 Vite 生产构建成功 |
| `$env:JOURNEY_REVIEW_CAPTURE='1'; npm run test:browser` | 退出 0；15/15 通过，原有 10 项完整保留，新增 5 项 |
| `node tools/visual-qa/cli.mjs --config tools/visual-qa/examples/reusable-kit-demo.json` | 退出 0；72/72 状态 PASS，含 journey 六状态 × 三桌面视口；actualUrl 全为预期入口，0 browser errors |
| GEOMETRY_QA / STYLE_QA | PASS；无非预期页面横向溢出、登记元素裁切；主图标题实际 15px |
| VISUAL_REVIEW | Agent 已实际查看四种视口的整页、1440 连续局部/聚焦/收尾及移动局部；另查看 1440 的 Lab、LwF、EWC、Editorial A/B/C 和 C1/C2 代表截图 |
| REGRESSION | 浏览器回归通过，保护区域源码未改；像素基线比较 NOT_RUN（未配置获人工认可的基线），不声称像素完全一致 |
| HUMAN_ACCEPTANCE | PENDING；不代填 PASS，不晋级 registry |

新增断言核对主图与既有 LwF 页面拥有相同节点/边 ID、角色和端点；各步当前对象、损失与更新边、反复切换和键盘恢复；两组比较来源/预测/结果、参数定义与冻结状态、warm-up、温度分式；hash/重载与候选链接；四视口的溢出/裁切/数学/字体、图形边界、移动输入关系及恢复宽屏。Reduced Motion 下执行，主图无自动播放。上游发布/正式论文子路径、浏览器全屏、其他浏览器和人工学习验收均未执行，属于本轮范围之外。

机器报告中的 VISUAL_REVIEW=NOT_RUN、BUILD=NOT_RUN 是 runner 不执行这些检查的独立标记；真实构建与 Agent 查图结果在本记录补充，未篡改原报告。18 条 warning 是 journey 每个状态重复报告的 8 处 11px 辅助文字（章节标记、公式说明、来源）；没有 error。保留为人工可读性风险，不以自动 PASS 掩盖。

### 精选证据

根目录：`C:\Users\lenovo\Desktop\Projects\PaperWork\PaperSkillWork\.visual-qa\editorial-journey-review\`（Git 忽略，本地人工评审证据，不是批准基线）。

| 文件 | 用途 |
| --- | --- |
| `journey-full-1440.png` | 1440×900 视口下的完整长图（1440×3336） |
| `opening-map-1440.png` | 开场与主图连续构图 |
| `map-loss-1440.png` | 两组比较聚焦，保留非焦点上下文 |
| `paths-student-1440.png` | 局部解释 → Student 优化的连续画面 |
| `handoff-1440.png` | 收束与任务边界 |
| `journey-full-1280.png` / `journey-full-1920.png` | 另外两种桌面尺度 |
| `journey-full-390.png` / `mobile-opening-390.png` | 移动重排完整长图与原始尺寸首屏 |
| `visual-qa-report.json` / `visual-qa-report.md` | 本轮统一报告原样留存；报告内全量截图相对路径随 raw run 清理，人工查看上列精选文件 |
| `wireframe.html` | P0 连续低成本线框 |

QA 命令的真实输出为 `Visual QA PASS. Report: C:\Users\lenovo\Desktop\Projects\PaperWork\PaperSkillWork\.visual-qa\run-2026-10-24T03-56-14-093Z\report.md`。已读 Markdown/JSON、核对 72 项与截图，再将本次输出的父目录用于精确清理；清理执行结果见下方。

清理结果：`node tools/visual-qa/cli.mjs --cleanup-run <上述准确父目录>` 退出 0，输出 `CLEANED: C:\Users\lenovo\Desktop\Projects\PaperWork\PaperSkillWork\.visual-qa\run-2026-10-24T03-56-14-093Z`，`Test-Path` 为 false。审查后只删除本任务新建的准确 `reusable-kit/demo/test-results` 目录并验证不存在；未创建 playwright-report。4173/4175 无监听，本次脚本所启服务已停止。保留上列 9 张截图、原报告与线框，未删除历史 QA 或基线。

### 保留、放弃与人工停点

保留宽幅唯一系统地图、收窄的两次比较、Student 内一体化目标与更新以及轻量边界关系。放弃完整复制 C1/C2、重画第二张系统图、独立大公式板/Update card、五节统一卡片和滚动驱动状态机。数据来源、比较与更新用线型和文字共同解释；主图局部定义与原场景隔离。

人工优先评估三点：开场是否足以引导继续阅读；总图到两次比较再到 Student 的节奏是否自然且无重复讲授；移动端长列表与 11px 辅助说明是否仍舒适。当前无待修复的机器失败；整页审美与教学结论待人审，不宣称 9/10 或通用模板。

复现：在仓库根目录运行 `npm --prefix reusable-kit/demo run dev -- --host 127.0.0.1 --port 4187 --strictPort`，访问 `http://127.0.0.1:4187/?demo=journey`，也可直接从侧栏进入。QA 使用的 4173/4175 是临时生产预览端口。
