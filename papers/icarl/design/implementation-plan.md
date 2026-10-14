# Implementation Plan: iCaRL: Incremental Classifier and Representation Learning

Paper ID: `icarl`

## Learning Goal and Non-goals

The tutorial should let a first-time reader explain the class-incremental constraint, distinguish iCaRL's trainable feature extractor from its per-class training head, and trace one update from the persistent state through prototype-based prediction. The complete learning spine has eight stages across the current nine-page tutorial. The initial W6 vertical slice covered S01, S02, and S08 under the then-current ten-page numbering (Pages 1, 2, and 10); W9 later merged the former Pages 4–5 and renumbered the remaining pages.

Page 1 defines the problem without revealing the solution. Page 2 opens the model only far enough to explain image-to-representation flow and why the training head is not the final predictor. Page 3 completes one prototype prediction from twelve existing exemplars. Page 4 then teaches representative selection and budget management with a separate eight-point example; Page 5 returns to shared runtime data to prepare D and Q. Pages 6–8 cover training signals, prediction roles, and paper evidence. Page 9 integrates previously taught objects without reteaching their derivations. Figures 2–4 are assigned to Page 8/S07 and remain attributed source crops.

Every computational visual reads from deterministic data and calculations. Page 2 and the independent Page 4 fixture use illustrative feature geometry, not paper measurements or a trained iCaRL checkpoint. Page 4's eight candidates are local to its 8→4 Herding lesson and do not change P3 or the runtime samples. Page 9 shows the shared runtime update as the symbolic `Θ_before → Θ_after` transition, snapshots Q before that transition, preserves P until the memory phase, and computes quota, prefix truncation, new-class Herding, normalized prototypes, distances, and nearest-prototype prediction from the shared fixed data. The UI renders these results rather than maintaining a second algorithm copy.

Do not add a second feature-space implementation, fabricated training metrics, or invented Figure 2/4 curve values. Keep detailed equations and reference-only numeric details in compact or expandable placements.

## Primary Spine Mapping

The YAML below is the sole structured source for implementation coverage.

```yaml
implementation:
  stages:
    - id: S01
      page: "Page 1 · Class-Incremental Learning"
      core_items: [L01, L02, L03]
      evidence_refs: [C01, C02, C15]
      primary_vehicle: "Guided class-batch timeline with a fixed memory rail, expanding shared prediction space, and two naive-option comparisons"
      reusable_pattern: FlowStepper
      reason: "The sequence makes class arrival and all-seen-class prediction visible while holding the learner and memory limit constant; failure cards clarify the constraints without teaching the solution."
    - id: S02
      page: "Page 2 · From Image to Representation"
      core_items: [L04]
      evidence_refs: [C03]
      primary_vehicle: "Openable network architecture diagram plus a stable sample token and linked 2D teaching projection"
      reusable_pattern: ArchitectureExplorer
      reason: "Selecting network components reveals ownership and data flow; the same sample identity stays fixed while its illustrative representation moves between symbolic parameter states."
    - id: S03
      page: "Page 3 · Prototype Prediction"
      core_items: [L05]
      evidence_refs: [C04, C05]
      primary_vehicle: "Four-stage prototype-prediction workbench over the twelve shared P_BEFORE exemplars"
      reusable_pattern: ArchitectureExplorer
      reason: "Page 3 holds Θ and P fixed while twelve saved images become normalized features, inside-circle means, normalized prototypes, and a nearest-prototype query decision."
    - id: S04
      page: "Page 4 · Representative Selection and Management"
      core_items: [L06, L07, L08, L09]
      evidence_refs: [C07, C08, T01]
      primary_vehicle: "Independent eight-point teaching fixture, four calculated Herding rounds, prefix review, and fixed-budget tail truncation"
      reusable_pattern: null
      reason: "A complete-class target and every candidate score share the existing Herding calculation; the same ordered result supports both prefix inspection and budget reduction."
    - id: S05
      page: "Page 5 · Prepare the Update"
      core_items: [L10, L11]
      evidence_refs: [C09, C10]
      primary_vehicle: "Object-flow stepper that combines incoming full data and old exemplars, then snapshots old-node responses before training"
      reusable_pattern: FlowStepper
      reason: "A short ordered flow makes D's two sources and Q's pre-update lifetime explicit."
    - id: S06
      page: "Pages 6–7 · Training Update and Post-Update State Handoff"
      core_items: [L12, L13, L14, L15, L24]
      evidence_refs: [C03, C05, C06, C08, C10, C11, C12, C13, OI01]
      primary_vehicle: "Page 6 traces one sample on a persistent six-node training graph; Page 7 continues from Θ_after through ordered exemplar maintenance, current-feature prototype reconstruction, and a nearest-prototype query."
      reusable_pattern: FlowStepper
      reason: "Stable node identities expose Q/label targets, six independent BCE terms, batch aggregation, and the update path; the next page explains why saved raw images must be re-encoded after the update, then distinguishes memory maintenance from final prototype inference."
    - id: S07
      page: "Page 8 · Evidence and Boundaries"
      core_items: [L16, L17, L18, L19, L20, L21, L22]
      evidence_refs: [R01, R02, R03, R04, R05, R06, R07, R08, A01, A02, A03, C14, OI02, OI03]
      primary_vehicle: "Protocol-first evidence workbench with original PaperFigure panels for Figures 2–4 and source-linked result boundaries"
      reusable_pattern: PaperFigure
      reason: "The original plots and confusion matrices are the evidence being interpreted; captions, dataset protocols, exceptions, and memory boundaries stay adjacent."
    - id: S08
      page: "Page 9 · iCaRL Runtime"
      core_items: [L23]
      evidence_refs: [OI01, C09, C10, C13, C05]
      primary_vehicle: "Fixed runtime workbench driven by one 19-step state trace and 13 semantic timeline phases, with persistent, temporary, and derived objects separated"
      reusable_pattern: FlowStepper
      reason: "A controlled six-class update integrates the established objects: Θ/P persist, D/Q are created and released, old memory is prefix-truncated, each incoming class is herded independently, and six derived prototypes feed nearest-mean prediction."
  assets:
    - {asset: A-FIG02, stage: S07, rendering: crop}
    - {asset: A-FIG03, stage: S07, rendering: crop}
    - {asset: A-FIG04, stage: S07, rendering: crop}
  supporting:
    - {item: SUP01, placement: expandable}
    - {item: SUP02, placement: compact-inline}
    - {item: SUP03, placement: expandable}
    - {item: SUP04, placement: expandable}
    - {item: SUP05, placement: hover}
    - {item: SUP06, placement: expandable}
  reference:
    - {item: REF01, placement: Evidence details}
    - {item: REF02, placement: Evidence details}
    - {item: REF03, placement: Reference Hub}
    - {item: REF04, placement: Advanced details}
  vertical_slice:
    stages: [S01, S02, S08]
    required_core_items: [L01, L02, L03, L04, L23]
```

## Reusable Pattern Library

The continual-learning kit is copied into `web/enhanced/src/shared/` for stages that use registered reusable patterns. The initial W6 slice adapted `FlowStepper` for Page 1 and the then Page 10 runtime, and `ArchitectureExplorer` for Page 2. The runtime also reuses the paper-owned `FeatureSpaceWorkbench` and `SampleToken`; its state stays in the calculation layer. `PaperFigure` displays the three selected source crops on the current Page 8. Page 4 combines its page-specific `GuidedStepControls` and `FeatureChart` with the Herding calculation instead of claiming a registered reusable-kit component. No optional P1 component is selected.

The original Page 10 reference image was used only to understand the relationships and fixed workbench regions (incoming data, current model, memory, active workspace, feature space, object lifetime, and state transition). Its visual style is not a target; the corresponding implementation is now Page 9.

## Vertical Slice (W6)

The initial W6 slice implemented exactly three Learning Spine stages: S01/Page 1, S02/Page 2, and S08/Page 10 (now Page 9). The review task was to move through the problem constraints, open the model and inspect one stable sample's representation, then trace a new batch through D/Q, the symbolic model update, memory reallocation, computed Herding, prototype construction, nearest-prototype prediction, and the next-stage boundary.

Page 10 uses a fixed deterministic `Synthetic teaching example`: K=12, three old classes with four ordered exemplars each, and one incoming class with its full six-sample batch. The new class count sets t=4 and m=⌊K/t⌋=3; the old buckets keep their first three items, and the new bucket is generated from the full incoming data by the same Herding calculation shown in the feature-space component. `Θ_before → Θ_after` is a symbolic state change, not a fabricated training trace. Q contains symbolic old-node responses, is generated before the model update, and is released after training. The sample `x_7` keeps its Class A identity from Page 2 into Page 10.

Figures 2–4 are not rendered inside these three pages because their approved home is S07/Page 9, outside the requested W6 slice. Their original crops and attributed web copies are prepared now so Page 9 can embed them directly in the later full implementation.

### Vertical Slice Review (W7)

Vertical Slice Review: PASS

- Reviewer: 用户（本次对话）
- Decision: PASS
- Review note: 用户确认当前 iCaRL 实现可以接受，并明确要求将 W6 与 W7 标记为通过；本记录依据本次人工验收。
- Can a first-time reader explain the class-incremental constraints, the feature-extractor/training-head split, and the purpose of the full runtime trace?
- Can the reader state when Θ changes, when P changes, how long Q and X_new remain available, and which path makes the final prediction?
- Were any key explanations hidden in hover or omitted?
- Were any formulas, toys, or interactions unnecessary?
- Required information-architecture changes: none requested in this review.

## Full Implementation (W8 · Historical Plan)

At the time of the W8 plan, the remaining CORE items L05–L22 were assigned to S03–S07, with original Figure 2–4 `PaperFigure` panels planned for the then-numbered Page 9. That implementation is complete; W9 subsequently moved the evidence page to Page 8 and merged the exemplar-selection teaching flow into Page 4. SUPPORTING items remain in compact or expandable placements, REFERENCE items remain outside the mainline, and DELETE items remain omitted.

## Human Acceptance Record

W7 passed based on the user's explicit acceptance of the current iCaRL implementation. W4 approval and the request to display original Figures 2–4 are recorded in `paper.yaml` and the W3 asset plan.

## 页面修订（W8 历史记录）· 2026-10-13

依据用户指定的《Icarl页面优化方案》，本轮只修订 `web/enhanced` 的页面。CORE 的任务背景、两种直接做法、约束与四项要求默认可读；步骤只切换焦点。非 P10 特征图复用 P3 的 SOURCE / FEATURE SPACE / CURRENT RULE 视觉语言，保留各页必要的裁剪布局。P2 使用同一 backbone，以 5→10 输出节点说明训练输出层的扩展。

保护不变量：论文公式、共享 runtime 的样本身份与坐标、Herding 计算和排序、类别色、训练与预测边界、P10 的现有画布和图元、原有键盘及 reduced-motion 行为。允许调整图框尺度、标签偏移、图元样式及 P1 的已授权叙事顺序；不改 CI、发布流程或人工验收状态。

检查范围：Chromium 1440×900 与 1920×1080；P1 初态与阅读焦点，P2 更新前/后及输出扩展/重置，P3 四阶段与直接跳转/前进/回退，P4 重编码的两种映射，P5 目标与 prefix 各阶段，P8 共享图状态，P10 修改前后对照。截图与临时检查保存在 `.visual-qa/`。每块完成后只提交本轮修改的 iCaRL 文件；HUMAN_ACCEPTANCE 保持 PENDING。

P3 的 W8 修订固定使用 `P_BEFORE[A/B/C]`，每类四张，共十二张；默认选中项从该集合派生。四阶段依次为：图片与单位化 Exemplar Feature、圆内均值与单位化 Prototype、同一固定 Feature Extractor 下的独立 Query、最近 Prototype 距离/夹角与预测。P3 不包含参数更新、完整旧类数据不可用、内存重分配或 Herding；这些职责留给后续相应页面。二维坐标、距离和角度来自固定合成计算，并明确不代表论文实验轨迹。

阶段检查：P1 构建通过，两个宽屏视口无整体横向溢出和浏览器错误；Agent 已查看默认叙事截图。特征图统一后检查 48 个页面/状态/视口组合，未发现整体横向溢出、SVG 标签出框或浏览器错误；Agent 已查看 P2 更新后、P3 最近原型、P4 旧映射、P5 目标与二步 prefix、P8 当前原型与预测的代表性截图。P10 通过显式 legacy 外观保留旧画布与图元，其初态在两个视口与本轮调整前截图逐像素相同；未以此声称所有 P10 动态阶段均经过回归。专门计算样式断言尚未配置，STYLE_QA=NOT_RUN；HUMAN_ACCEPTANCE=PENDING。

最终检查：`npm run build` 通过；Chromium 在 1440×900 与 1920×1080 共采集 50 个状态截图（`.visual-qa/icarl-revision/final/`），GEOMETRY_QA=PASS：无整体横向溢出、SVG 标签出框或浏览器错误。VISUAL_REVIEW=PASS：已实际查看各类图代表性截图及 P2 的 5 节点、10 节点画面。P2 使用键盘 Enter 扩展，正常动画和 reduced-motion 下均验证 5→10→5、计数同步、共享 backbone 与原有节点 DOM 保持、backbone 的文档坐标和大小保持，新增节点结束后全部可见；reduced-motion 下动画为 none。P1 四个阅读焦点下方法卡片 opacity 均为 1，四项要求常显。针对交互的计算样式检查通过，但未建立全页 STYLE_QA 契约；HUMAN_ACCEPTANCE 仍为 PENDING。P10 两个宽屏初态与修订前对照仍逐像素一致。

### P1/P2 文案与图示字号修订（2026-10-13）

P1 末尾增加从图片输入到模型输出的过渡引导。P2 的结尾使用用户指定原文：“现在我们知道，模型能把图片映射为可比较的特征向量，训练输出层也会随新类别扩展。也就是具备了可以让根据输入的图片，直接在所有类型任务中判断属于哪个类别的能力呢。但我们回到一开始的问题，我们需要在这个学习过程中，保留过去模型学到的知识，就需要留存一些代表图片。那我们先假设，每类已经保留了少量代表图片，那么它究竟怎样利用这些图片判断一张新输入属于哪一类？”P2 `SHARED FEATURE EXTRACTOR` 中“image x / 卷积特征块 / 深层表示 / 聚合为向量”标签调整为 16px。

复查范围：P1 末尾阅读焦点、P2 模型展开状态，Chromium 1440×900 与 1920×1080。`tsc --noEmit` 通过；Vite 生产构建通过（72 个模块）。标准 `npm run build` 的 TypeScript 阶段通过，但本环境的默认 Vite runner 配置加载失败，随后使用 bundle loader 的临时配置完成构建。视觉 QA 报告位于 `web/enhanced/.visual-qa/p1-p2-copy-font-exact/run-2026-10-13T12-22-06-043Z/`：GEOMETRY_QA=PASS、STYLE_QA=PASS（16px 断言）、BROWSER_ERRORS=PASS（0 条）；实际查看四张截图，VISUAL_REVIEW=PASS，P1 引导与 P2 结尾均完整显示。REGRESSION=NOT_RUN；HUMAN_ACCEPTANCE=PENDING。

### P3–P5 教学重构与 Herding 动画（2026-10-13）

本节记录实施与工程验证结果，不代表 W9 学习/证据审查完成，也不构成新的人工验收。最终教程为九页：P3 保持共享运行时 12 张 `P_BEFORE` 的预测流程；新 P4 将代表样本筛选、Herding、前缀回看和预算截断合并为一个连续页面，使用独立单类 8→4 教学集；新 P5 由原 D/Q 页面迁移而来，承接 Exemplars 从预测到训练的第二项职责。后续页面及原完整运行页仅按新编号迁移。共享运行时中的 `P_BEFORE`、`D/Q`、`P_AFTER` 和实验数据未因新 P4 示例而更改。

P4 的 k=2 首个候选现可分阶段呈现输入、组合、原始中点、单位化均值和距离评分，并提供播放/暂停/重播和键盘可达的阶段按钮。动画图元与数值来自同一 Herding 候选结果；减少动态效果时自动播放被禁用，手动阶段仍可使用。前缀与预算阶段沿用已算出的同一有序列表。

验证记录：`npm.cmd run build` 通过（TypeScript + Vite，71 modules）；`python tools/paper.py status icarl` 显示 W9/W10 均待处理；`python tools/paper.py check icarl` 返回 `CHECK PASS`，唯一警告是 W9 `Overall: PENDING` 尚未变成 `PASS`，这是人工审查未完成时的预期状态。Chromium 视觉 QA 在 1440×900、1920×1080 共通过 54 个捕获，GEOMETRY_QA、配置范围内的 STYLE_QA 和 BROWSER_ERRORS 均通过；报告指出 P9 每种桌面视口各有一处语义小字低于 11 px。代表性截图已由 agent 检视，但 runner 自身将 VISUAL_REVIEW 保持为 NOT_RUN。另在 390×844、减少动态效果偏好下逐页访问九页，页面宽度均未超过视口，P4 手动阶段与 P5/P9 页面可访问；这项是 DOM/溢出检查，不替代窄屏视觉审查。没有已批准截图基线，REGRESSION 未运行；HUMAN_ACCEPTANCE 保持 PENDING。

### P3/P4 同屏操作与连续动画修订（2026-10-14）

按用户指定的《iCaRL P3/P4 交互与布局重构修订方案》调整 P3/P4 的阅读引入与动态工作台。当前步骤的图形、关键说明和操作键在工作台内相邻；顶部步骤索引作为快速定位，不能成为唯一操作路径。P4 使用同一特征图呈现目标建立、四轮 Herding、前缀回看和预算截断；k=2 的首个候选按“组合—原始中点—归一化—比较”逐微步展示。公式与完整候选分数仅按需展开。P3 保持四阶段算法、十二张共享 `P_BEFORE`、三个 Prototype 和 Query 数据不变。

P4 独立教学集采用固定非对称方向 `[-12.3, -73.2, -173.7, -143.7, 70, 120.2, -47.3, -116.1]` 度。a8 在第一轮胜出；a1 是 k=2 首个演示候选，与 p₁ 构成真实原始中点，其长度为单位特征半径的 0.617，归一化后可清楚看到径向移动。扫描后由 a2 作为 k=2 最优候选，其前缀均值与 μ_full 的真实距离约为 0.181，避免目标与前缀重叠；后续 k=3、k=4 的真实选择分别为 a4、a5。所有特征、候选分数、有序选择和均值继续由共享 `herd()` 及其计算结果生成。此次布局授权来自用户提供的修订方案；保护 P5 的 Replay、D/Q 流程、P9 完整运行数据、其他页面和发布边界。视觉检查范围为 P3 四阶段与直接跳转、P4 各幕/微动作/前缀/预算收缩，目标视口 1366×768、1440×900、1920×1080；Reduced Motion 与窄屏另行按可用能力检查。

验证记录：`npm.cmd run build` 通过（TypeScript + Vite，71 modules）。Chromium 在 1440×900 与 1920×1080 检查 54 个状态，在 1366×768 检查 27 个状态；三组均 `GEOMETRY_QA=PASS`、配置范围内 `STYLE_QA=PASS`、`BROWSER_ERRORS=PASS`（0 条）。报告分别位于 `papers/icarl/web/enhanced/.visual-qa/p3-p4-workbench-final-2026-10-14/run-2026-10-13T17-38-03-793Z/report.md` 和 `papers/icarl/web/enhanced/.visual-qa/p3-p4-workbench-final-2026-10-14/viewport-1366/run-2026-10-13T17-42-39-361Z/report.md`。

代表性截图已检查，包括 P3 最近原型预测、P4 k=2 中点/单位化/评分、k=2 前缀回看；浏览器 runner 的 `VISUAL_REVIEW` 字段仍为 `NOT_RUN`，因为 runner 不做视觉判断。键盘阶段切换、前进/回退、自动播放/暂停/续播/重播、减少动态效果下关闭自动播放均通过；P3/P4 在 390×844 下无横向溢出。P5 D 与 P9 runtime 页面冒烟检查通过；P9 宽屏捕获各有一个低于 11px 的语义文字警告。

`python tools/paper.py check icarl` 返回 `CHECK PASS`；唯一 warning 是 W9 审计仍待人工通过，这是当前待审状态的预期提示。没有已批准截图基线，`REGRESSION=NOT_RUN`；`HUMAN_ACCEPTANCE=PENDING`，W9/W10 状态未更改。

### P5/P6 增量训练与连续动画修订（2026-10-14）

P5 现在把旧记忆中的 12 张 exemplar 与新到达三类的 18 张完整样本合入同一 `D`，并在参数更新前为全部 30 个 ID 记录对三个旧输出节点的冻结响应 `Q`。六节点 Student 在快照后出现。合成 Q 来自固定演示权重，只用于可核对的教学计算，不是论文 checkpoint、真实训练记录或实验结果。

P6 改为一张持续存在的六节点图：同一条样本路径依次显示共享表示、六个独立 sigmoid 输出、旧类 Q 与新类 one-hot 标签、逐节点 BCE、六项损失聚合及回到共享参数的反向信号。可切换 C2、C4、C5、C6 样本；局部 BCE 输出滑杆只改变曲线算例，不改变模型输出或总损失。播放、暂停、逐段选择、重播和 reduced-motion 行为均保留。动画中的模型输出和梯度是明确标注的合成教学演示，不表示实际优化器运行轨迹。

P7 的运行状态与预测视图覆盖 A–F 六类；最近原型预测使用与 P9 相同的 `P_after`、prototype 和 query 数据。P9 的当前增量更新扩为 19 个详细步骤和 13 个语义阶段：D/E/F 各自进行两轮 Herding；K=12 时六类配额均为 2；旧类截短保持原列表前缀；新类分别使用完整六样本候选集；提交后的 `P_after` 恰为六类各两张。后续预测比较全部六类原型；下一类批次只作为交接提示。

保护不变量：P4 的八样本独立 Herding 教学集、`P_BEFORE` 的身份/顺序/坐标、Page 3 已有预测结果、共享类别色与六节点身份、Q 在模型更新前生成、P 仅在记忆管理阶段变化、最终预测按归一化 exemplar 均值而非 sigmoid argmax；所有合成示例均不表述为论文训练或实验数据。检查范围：P5 各流程阶段和展开的 30×3 Q 明细；P6 旧类软目标、C4/C5/C6 hard target、BCE、损失聚合与反传；P7 六类原型及 query 最近均值；P9 初态、D/Q 构造、旧类截短、D/E/F 各类第二个 Herding 样本、记忆提交、预测与交接；Chromium 视口为 1440×900 和 1920×1080。HUMAN_ACCEPTANCE 仍由 W9 人工审查决定，W10 不属于本次实施。

验证记录：`npm.cmd run build` 通过（TypeScript + Vite，72 modules）。Chromium 在 1440×900 与 1920×1080 共采集 90 个状态截图；GEOMETRY_QA=PASS、配置范围内 STYLE_QA=PASS、BROWSER_ERRORS=PASS（0 条），报告为 `web/enhanced/.visual-qa/p5-p6-p9-incremental/final/run-2026-10-13T18-46-59-378Z/report.md`。Agent 已实际查看 P5 的 D/Q 全明细与六节点 Student、P6 的 C2 Q 软目标与 C4/C6 标签/BCE/反传、P7 六类原型和最近原型对照、P9 六类记忆提交与预测状态；`VISUAL_REVIEW=PASS` 是本次截图人工检查结论，runner 报告中的 `VISUAL_REVIEW=NOT_RUN` 保持原样。另在 390×844 触屏视口、减少动态效果偏好下访问 P5/P6/P7/P9 的代表状态；四页 document width 均为 390px，未发现页面整体横向溢出或 pageerror。没有已批准截图基线，`REGRESSION=NOT_RUN`；`HUMAN_ACCEPTANCE=PENDING`，W9/W10 阶段状态未更改。

### P6–P8 教学逻辑与交互修订（2026-10-15）

本轮基线为指定审查提交 `c9922ef12ce6b37ff1a03b5bbbd47f648d10e573`；执行前 HEAD 为 `b2612aca05d42dbaf48871ae2dd314a1a4737184`，位于 `dev` 且工作区干净。基线之后的十个提交主要调整 P3–P5 与共享动画工具，没有改动 P6–P8；实施以当前 `dev` 为准，不覆盖这些已有改动。本轮仅限 P6、P7、P8 及其局部样式、必要的导航文字与本计划/主线记录；P1–P5 算法、P9 完整运行图、共享计算数据、CI、发布和 PR 均在范围之外。

主线按“单样本训练计算 → 参数更新后的记忆交接 → 原论文证据阅读”组织：

- **P6｜入口 `D + Q`；出口 `Θ_after`。** 保留 CORE：一张图的旧节点目标来自匹配 `sample.id` 的冻结 Q 行，新节点目标来自标签；六个独立 sigmoid 使用同一 BCE；节点损失汇成样本/mini-batch 损失，更新路径返回训练头和共享特征提取器。工作台固定六节点的身份与位置，Q 和目标在本轮更新期间不刷新。动画说明确定性教学网络的计算路径，不呈现虚构的优化器轨迹。独立 BCE 探索与真实示例值分开命名、分开取值，切换目标情形不隐式替换样本。
- **P7｜入口 `Θ_after + P_before + 新类完整数据`；出口 `Θ_after + P_after + 当前原型/Query 结果`。** 保留 CORE：先截断旧类有序列表前缀，再从本轮仍可用的新类完整数据按当前表示选择 exemplars；预算 `K=12` 时六类各 2 张；保存原图以便当前特征提取器重新编码，并在当前表示下重算原型；最终 Query 按最近原型判定，训练 head 留在模型中但不读其 argmax。参数表示前后对照与记忆成员变化分别呈现，避免混为一次跳变。
- **P8｜入口为已理解的训练与预测链；出口为受实验协议限定的结论。** 保留 CORE：Figure 2 的任务与指标、Figure 3 的类别位置偏置、Table 1a 的组件比较及 Hybrid 2 两类批次例外、Table 1b 的准确率差值与全数据 NCM 参照限制、Figure 4 的预算趋势、原图表来源及论文结论边界。Table 1 精确值仍从现有数据模块读取，曲线不从像素反推。

受保护状态与证据来源：P5 的 `D` 是 12 张旧类 exemplar 加 18 张新类完整图片，共 30 张；更新前快照 `Q` 为按 `sample.id` 索引的 30×3 旧节点响应。六节点 target、BCE 与输出沿用 `incremental-training.ts`；P7 的 before/after 特征、Herding 顺序、`P_AFTER`、prototype、Query 和预测只读现有 `icarl-runtime.ts`；Table 1 值只读 `table1-results.ts`。P4 独立 8→4 示例、P9 运行语义、九页导航数量、W7/W9 人工验收状态均保持不变。论文机制与实验配置按 `source-cache/content.md`、`source-cache/evidence.json`、`research/evidence-registry.yaml` 和当前 Learning Spine 核对；W1 的 source-cache inventory 不单独充当复用许可。

分段交付与提交边界：A 语义对齐/本计划；B P6 单样本纵向切片；C P7 参数更新后状态交接；D P8 四个证据问题；E 相邻页一致性、构建、项目已有检查及浏览器 QA。每段完成、检查变更范围后独立提交，仅包含该段 iCaRL 文件；不 amend 既有提交、不 push、不创建 PR。

本轮浏览器审查目标为 Chromium 1440×900 与 1920×1080、100% 缩放；覆盖 P6 五段动画中间态及旧/新样本和 BCE 情形，P7 训练后但未提交记忆、旧列表截断、新类选择、同 ID 前后特征、六类原型和 Query，P8 四个证据问题、Figure 2 子图聚焦、Table 1a/1b 与 Figure 4。必要时复查窄屏、键盘/触控和 reduced-motion。临时产物写入忽略的 `.visual-qa/`。基线差异审查：完成；本阶段 UI 尚未实施，`BUILD=NOT_RUN`、`GEOMETRY_QA=NOT_RUN`、`STYLE_QA=NOT_RUN`、`VISUAL_REVIEW=NOT_RUN`、`REGRESSION=NOT_RUN`；`HUMAN_ACCEPTANCE=PENDING`。W7/W9/W10 状态保持原样。

#### 阶段 B｜P6 单样本纵向切片（2026-10-15）

P6 保留单张持续存在的六节点计算图，并将输入、目标到达、逐节点 BCE、样本/mini-batch 损失汇总、梯度回传拆成独立时长的五段。旧类样本继续使用同一 `sample.id` 对应的冻结 Q；新类 Hard1 需要新类样本，选择旧类样本时会给出提示而不暗中换图。独立 BCE 曲线使用 `exploreOutput` 状态，与当前网络的 `g_model` 和固定示例损失分开。终段以符号状态显示 `Θ_before → Θ_after` 并交给 P7；图中数值仍是确定性教学计算，不是实际训练轨迹。

验证：`tsc --noEmit`、项目现有 `npm.cmd test` 通过；Vite bundle-loader 生产构建通过（75 modules）。Chromium 在 1440×900 与 1920×1080 共捕获 34 个 P6 状态，GEOMETRY_QA=PASS、BROWSER_ERRORS=PASS（0）；报告位于 `web/enhanced/.visual-qa/p6-revision/run-2026-10-14T17-10-34-560Z/report.md`。已查看两个视口的 mini-batch 汇总和参数更新交接，以及 1440×900 下的目标动画中间态和旧类 Hard1 提示，VISUAL_REVIEW=PASS。STYLE_QA=NOT_RUN，REGRESSION=NOT_RUN（没有已批准基线）；HUMAN_ACCEPTANCE=PENDING。W7/W9/W10 状态未更改。
