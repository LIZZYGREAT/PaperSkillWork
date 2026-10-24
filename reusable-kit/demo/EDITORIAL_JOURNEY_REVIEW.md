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

## 人工反馈修复 · 01–05 左边界（2026-10-24）

用户三张浏览器截图指出：02 对齐主容器，03/04/05 却向右漂移，左侧形成空白。此前把窄段落分别居中当作节奏手段，Agent 整页复核也未识别这个问题；这一判断被人工反馈纠正。根因是三个不同 `max-width` 配合 `margin-inline: auto`，再叠加 03 左侧栏将正文推入第二列。

本次仅修复局部构图：所有章节盒、编号、标题与主说明共用 01/02 的左基线；窄行宽仍保留，但只向右侧收窄。03 编号/标题放在正文上方，正文在左、来源旁注在右，移动端依次排列正文与旁注。保持学习顺序、全部机制说明、主图数据与状态、公式和既有页面不变。四视口测试增加实际坐标断言，防止仅 section 盒子对齐而正文仍缩进。此前关于“未发现无意义补白”的结论不再适用；以本次修复截图为准。

验证：`npm run build` 退出 0；`$env:JOURNEY_REVIEW_CAPTURE='1'; npm run test:browser` 退出 0，15/15 通过。1280、1440、1920、390 四视口的章节盒、五个标题及 03 主说明左坐标均与 article 基线相差不超过 1px，并继续通过溢出、裁切、图谱与数学检查。

使用现有统一 runner，仅筛选本次变更的 journey 页面，未改共享 QA 配置或引擎：`node tools/visual-qa/cli.mjs --config .visual-qa/editorial-journey-alignment-review/visual-qa.json` 退出 0，18/18 状态 PASS，GEOMETRY_QA / STYLE_QA / BROWSER_ERRORS 均 PASS，0 浏览器错误。原有 11px 辅助字号 warning 保留，非本次修复范围。像素基线比较仍 NOT_RUN；HUMAN_ACCEPTANCE 仍 PENDING。Agent 已实际查看四种视口长图、1440 的 03→04 连续区域及 05 收尾，确认主内容回到同一左基线。

新证据位于 `.visual-qa/editorial-journey-alignment-review/`（仓库根目录下，Git 忽略）：`journey-full-1440.png`、`journey-full-1920.png`、`journey-full-390.png`、`paths-student-1440.png`、`handoff-1440.png`，以及本次配置、原样报告 `visual-qa-report.json/md`。先前目录保留作前后对照，不覆盖历史证据。

本次终端 `Report:` 路径为 `C:\Users\lenovo\Desktop\Projects\PaperWork\PaperSkillWork\.visual-qa\run-2026-10-24T04-12-20-522Z\report.md`；已读报告并查图，清理使用其准确父目录。

清理退出 0，输出 `CLEANED: C:\Users\lenovo\Desktop\Projects\PaperWork\PaperSkillWork\.visual-qa\run-2026-10-24T04-12-20-522Z`，确认目录不存在；仅删除本轮新建的准确 `reusable-kit/demo/test-results` 并确认不存在，4173/4175 无监听。精选证据与历史目录保留。

## 人工反馈重构 · 统一左右边界与内部构图（2026-10-24）

用户明确指出上一轮只把窄区块左移，右侧仍参差，未完成整页布局。此次替代“不同宽度区块靠左”的方案：01–05 章节外框及主要构图统一使用整页左右边界；内部依据内容分列，正文不横向拉长。

实施前构图决定：03 标题与引导分列，下方将旧/新比较及各自解释组成两条并行阅读栏，目标出处与转场合为轻量页脚；04 同一个 Student 场景中，左侧是主体/参数/两路来源，右侧是联合目标与更新，两列共同完成一个计算场景；05 标题/任务内变化分列，三阶段交接横跨整页，结尾命题与继承边界并列，来源说明封底。移动端按自然 DOM 顺序逐列折叠。保持全部事实、公式、图谱与状态语义，既有实验不变。

检查同时覆盖左右坐标、主要构图边界及正文列宽；像素对齐只验证版式约束，仍需查看整页和连续局部，不能再用单侧坐标通过替代整页判断。

实际实现采用 03 并行比较栏、04 Student 内主体/计算双栏、05 三阶段交接行与命题/边界双栏。各节外框、比较区域、Student 场景、交接行和封底说明均通到相同的左右边界；主说明与机制解释分别占自己的阅读列，而不是把原先窄文字拉成全宽。桌面正文列宽实测不超过 700px；移动端按完整来源与公式重排。

验证命令：demo 目录 `npm run build` 退出 0；`$env:JOURNEY_REVIEW_CAPTURE='1'; npm run test:browser` 最终退出 0，15/15 通过；根目录 `node tools/visual-qa/cli.mjs --config .visual-qa/editorial-journey-recomposition-review/visual-qa.json` 退出 0，18/18 状态 PASS，GEOMETRY_QA / STYLE_QA / BROWSER_ERRORS 均 PASS。四视口同时检查左右边界误差 ≤1px、标题左基线、段落列宽及桌面主要构图确实分列，无全页水平溢出或登记裁切。

浏览器初跑 14/15；收尾重构变短后，旧锚点断言假定“总能滚到距顶 120px 内”，与文档末端的合法滚动上限冲突。改为核对 `min(锚点位置−scroll-margin, 文档最大滚动量)`，并额外检查收尾标题完整可见，保留锚点/重载行为保护，随后全量复跑通过。源码未因该断言修改，Visual QA 覆盖同一最终渲染源码。

Agent 实际查看了 1280/1440/1920 桌面整页、390 移动长图与 Student 局部，以及 1440 的 03→04 和 05 连续区域；整体左右边界统一，左右列分别承载已有内容，未用填充文字撑满。原有 11px 辅助字号提醒保留；像素基线比较 NOT_RUN，HUMAN_ACCEPTANCE=PENDING。

精选证据：`.visual-qa/editorial-journey-recomposition-review/` 内 `journey-full-1440.png`、`journey-full-1920.png`、`journey-full-390.png`、`paths-student-1440.png`、`handoff-1440.png`、本次局部 QA 配置与原样报告 `visual-qa-report.json/md`。上两轮截图保留供对照；当前人工评审应看本目录。

本次输出 `Report: C:\Users\lenovo\Desktop\Projects\PaperWork\PaperSkillWork\.visual-qa\run-2026-10-24T04-23-53-520Z\report.md`；已读取原报告和查图，使用其准确父目录清理。

清理退出 0，输出 `CLEANED: C:\Users\lenovo\Desktop\Projects\PaperWork\PaperSkillWork\.visual-qa\run-2026-10-24T04-23-53-520Z`，目录确已不存在；本轮 `reusable-kit/demo/test-results` 已精确删除并验证，4173/4175 无遗留监听。保留上述五张精选截图、配置与报告，不触碰历史目录。

## 人工反馈修复 · Reference Hub 与阅读清晰度（2026-10-24）

第一部分：Reference Hub 上方 flex 等宽筛选与下方 0.9/1.1 两列不一致，列表还额外留出双侧滚动槽。共享样式改为同一组列宽/间距，控件占满各自列，取消列表空闲时的左右内缩；详情滚动和移动端列表/详情切换保留。`npm run build` 退出 0；`$env:HUB_REVIEW_CAPTURE='1'; npm run test:browser -- --grep 'Reference Hub filters|Chinese hover|Component Lab exposes'` 退出 0，3/3 通过。新增测试在 1280/1440/1920 下检查搜索/列表、分类/详情左右边界及两列上下边界，覆盖 Journey/EWC、空态/选中/无结果/移动返回；实际查看空态、详情与手机截图，精选保留在 `.visual-qa/editorial-journey-clarity-review/hub-{empty,selected,mobile}.png`。

第二部分实施前决定：上一版虽然外框对齐，但分裂的二栏标题/引导、两个独立比较区和独立公式栏仍使阅读跳跃。03 改成共享列轴的两行比较表，直接核对要求/参照/预测/损失；04 将 Student 身份置于场景顶端，下面按来源→联合目标→更新顺序形成同一计算带，公式与其说明同轴；05 使用安静的纵向引导、连续时间线与紧凑边界结论。保留全页左右框、全部必要事实/公式、对象角色和既有入口；单独处理展开详情的图文配对与温度记号的不可拆行。

实际改动：取消 03–05 固定二栏标题与强制标题断行，统一先标题再引导；03 以同一组四列贯穿两次比较，来源和预测在每行就近解释，减少分隔线；04 把来源、J、参数更新排在一条计算带，标号/表达式/注释各自共线，不再把公式放进独立的右侧隔间；05 将三条断开的短线合为连续阶段轴，并以一句较轻的命题收束，不再和主标题争夺焦点。温度详情使用说明与公式就近配对，`原文采用 T = 2。` 作为完整行内单元，正文仍能自然换行。保留 warm-up、联合训练范围、λo、R、η、参数记号差异及任务边界说明。

复核 Hub 原生控件时，进一步发现 search/select 高度不同造成上沿相差数像素。补充上沿断言后先实际失败，再统一为 44px；最终在 Journey/EWC 三种桌面宽度下搜索框/列表、分类框/详情左右边界和两个控件上下沿均相差 ≤1px，移动返回与过滤仍通过。

最终源码：`npm run build` 退出 0；`$env:HUB_REVIEW_CAPTURE='1'; $env:JOURNEY_REVIEW_CAPTURE='1'; npm run test:browser` 退出 0，16/16 通过。新增比较列轴、计算带说明/表达式轴线、T=2 不拆行断言，继续保留左右边界、正文行宽、数学、图谱和既有候选保护。中间一次截图采集在展开详情后留下滚动位置，修复采集起点并复跑四视口 4/4 后，最终全量再次 16/16 通过；精选长图从页首采集，避免固定顶栏出现在中段。

Agent 已实际查看 1280/1440/1920 整页、1440 的 03→04 连续图、05 收尾和温度展开，以及 390 Student 和 Hub 窄屏，另查看 Hub 空态/详情。主图数据与内核、C1/C2 等正文均未修改。HUMAN_ACCEPTANCE 继续 PENDING，截图复核不是人工审美通过。

统一配置新增 `temperature-detail` 和 `reference-hub` 空态/详情，沿用现有 runner，无新 QA 引擎。最终 `node tools/visual-qa/cli.mjs --config tools/visual-qa/examples/reusable-kit-demo.json` 退出 0，81/81 通过，GEOMETRY_QA / STYLE_QA / BROWSER_ERRORS 均 PASS，浏览器错误 0、warning 0。已读 Markdown/JSON、核对 Journey/Hub 的 actualUrl，并查看最终 Hub 详情、Student 场景和 Editorial 基准截图。runner 的 BUILD/VISUAL_REVIEW 标记保持原样，由本记录补充实际构建与查图；无批准像素基线，REGRESSION=NOT_RUN。

本轮精选证据在仓库根目录 `.visual-qa/editorial-journey-clarity-review/`：`hub-empty.png`、`hub-selected.png`、`hub-mobile.png`，`journey-full-1280.png`、`journey-full-1440.png`、`journey-full-1920.png`、`journey-full-390.png`，`paths-student-1440.png`、`handoff-1440.png`、`temperature-1440.png`，以及原样报告 `visual-qa-report.json/md`。这是本轮最终结果，历史目录未覆盖。

真实 `Report:` 输出：中间检查 `.visual-qa/run-2026-10-24T04-51-50-413Z/report.md`（81/81 通过，后补控件上沿修复），最终检查 `.visual-qa/run-2026-10-24T04-58-04-047Z/report.md`（同一最终源码 81/81）。中间报告已读和查图后精确清理，退出 0，确认 `CLEANED: C:\Users\lenovo\Desktop\Projects\PaperWork\PaperSkillWork\.visual-qa\run-2026-10-24T04-51-50-413Z` 且目录不存在；最终报告父目录也按同一规则清理。

最终清理退出 0，输出 `CLEANED: C:\Users\lenovo\Desktop\Projects\PaperWork\PaperSkillWork\.visual-qa\run-2026-10-24T04-58-04-047Z`，验证目录不存在；本轮原生 `reusable-kit/demo/test-results` 已按准确绝对路径删除并验证不存在。4173/4175 无遗留监听，保留上述 10 张精选截图与原报告。

## G0 双方案整页艺术指导实验（2026-10-24）

本轮按 `task/PaperSkillWork_Reading_Journey_整页艺术指导双方案实验.md` 执行至 G0。实施基准为 `docs/workflow-governance` / `e6fdae3f9a220a0a51fc4169d2fcadbc57d58802`；开始时工作区干净。候选只挂在 `?demo=journey&art=stage|reveal`，baseline 仍为 `?demo=journey`；仅改 Reusable Kit Demo 与本评审记录，不改 `papers/**`、旧 Demo、候选 C1/C2、Kit registry 或共享图形引擎。

### 02–04 固定内容核对清单

| 身份 / 事实 | 02 首次建立 | 03 延续 | 04 收束 |
| --- | --- | --- | --- |
| `x`：本任务同一批当前输入 | 唯一输入节点 | Teacher 目标与 Student 两个输出均回指当前输入 | 不重用旧训练集 |
| Teacher 冻结、旧目标 `target` | 旧模型读当前输入，不接梯度；旧响应可预先记录 | 作为 `L_old` 的参照来源 | 只保留外部参照身份，不作更新对象 |
| Student 表示与两头：`backbone`、`oldOut`、`newOut` | 一个共享表示分出旧/新预测 | 旧目标 + 旧输出 → `L_old`；真实标签 + 新输出 → `L_new` | 两项损失共同约束可训练 Student 参数 |
| 当前任务真实标签 `label` | 仅监督新头 | `label` + `newOut` → `L_new`，不可与 Teacher 目标互换 | 与旧响应损失分别成立后再合并 |
| `L_old` / `L_new` 身份 | 图上分别标成两个 objective | 语义、文字标识及数学记号一贯区分；温度只作用于旧路 | `J = λ_o L_old + L_new + R`，包含权重衰减；两路汇合一次 |
| 训练状态与参数范围 | 可训练 / 冻结角色明确 | 不把比较关系画成新的前向输出 | warm-up 先只训新头，再联合训练；`θ_s` 在 Demo 统称 Student 参数，区别论文同名共享参数；梯度下降式为教学示意，非优化器细节断言 |

权威图谱不改节点 ID / 角色：`x`、`teacher`、`target`、`backbone`、`oldOut`、`newOut`、`label`、`lOld`、`lNew`、`update`；也不改 11 条边的 ID、端点或 `lwfGraphSteps` / `lwfNavItems` 的五步 ID、次序。源为 `reusable-kit/demo/src/figures.tsx` 的 `lwfGraph`、`lwfGraphSteps`、`lwfNavItems`；焦点状态只从该图与步骤派生。

### baseline 浏览器记录与构图选择

已在 Edge 实际打开 baseline `http://127.0.0.1:4187/?demo=journey`，视口 `1440×900`。全页为 `1440×3314`；02 主图画布约 `984×480`，在其全宽场景内最清楚。02→03 截图显示主图后转成四列对照表；03→04 又转成三列计算带。段落和颜色身份一致，但主视觉不随读者跨节，`L_old` / `L_new` 结果使用相同强调色，读图焦点因此从完整因果图切换成常规表格与公式行。

新的基线证据放在 Git 忽略目录 `.visual-qa/journey-art-direction-review/`：`baseline-full-1440.png`、`baseline-map-comparisons-1440.png`、`baseline-comparisons-student-1440.png`。它们由本地 Vite 页面与系统 Edge 生成，不是历史 QA 截图。

| 方案 | 02 主句与画面 | 03 转换 | 04 收束 | 与 baseline 的结构差异 |
| --- | --- | --- | --- | --- |
| A · Shared Visual Stage | “沿着同一个输入，先看全局。”唯一完整图成为宽幅主舞台，桌面右侧配叙述，02–04 的同一张图保持 sticky | 选择图中 `loss` 步聚焦 `target→L_old` 与 `label→L_new`；相邻文字解释两路来源和预测 | 选择 `update` 步，沿图内两条损失边追到唯一 Student 更新节点；公式与参数范围紧随说明 | 视觉锚点持续存在，局部焦点由显式键盘可用的步骤选择改变；不用自动滚动/动画，进入前和离开后恢复单栏阅读 |
| B · Editorial Reveal | “先看全局。”02 使用完整权威图独立建立因果地图 | 版面尺度转成两条不等重的编辑式图文关系，各自呈现目标来源、Student 对应预测与损失，不再复制总图或使用四列模板 | 两种损失以独立源项在同一收束画面汇入 `J`，随后只有 Student 参数更新；Teacher 轻量留作固定参照 | 读者经历地图 → 局部比较 → 参数结论的有意尺度接力；无贯穿式 sticky 图，03 / 04 获得新的空间重心 |

两候选都保留 01 问题与 05 任务边界原文；相同事实、公式、语义色、基础字体及对象量。不得用换色或字号变化冒充方向差异。实施后将以 1440 全页和两段连续截图检视整页节奏，再完成文档列出的构建、浏览器与 Visual QA 门禁；Codex 只给出供评审的观察，不代替用户选型。
