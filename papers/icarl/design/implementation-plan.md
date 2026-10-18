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
      primary_vehicle: "Continuous runtime workbench with eight reader-facing chapters and one shared timeline clock; persistent state stays anchored while temporary objects move through the central workspace"
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

P7 的运行状态与预测视图覆盖 A–F 六类；最近原型预测使用与 P9 相同的 `P_after`、prototype 和 query 数据。当时的 P9 实现（2026-10-13）为 19 个详细步骤和 13 个语义阶段：D/E/F 各自进行两轮 Herding；K=12 时六类配额均为 2；旧类截短保持原列表前缀；新类分别使用完整六样本候选集；提交后的 `P_after` 恰为六类各两张。后续预测比较全部六类原型，下一类批次只作为交接提示。这是重构前的历史记录；当前八章、17 个 clips 的总图见下文“P9 全流程重构”条目。

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

#### 阶段 C｜P7 参数更新后的记忆交接（2026-10-15）

P7 已重构为训练完成、旧类有序前缀截断、新类当前 Herding exemplar 补入、同一旧图 before/after 特征重编码与原型重算、Query 最近原型决策五段。旧类记忆由每类 4 张减为前 2 张；D/E/F 各从本轮运行时的 6 个候选中补入 Herding 前 2，身份直接读取 `NEW_CLASS_HERDING`。K=12 的空槽补齐后仍为六类各 2 张。保留的原图以同一 ID 显示在更新前/当前表示对照中，固定端点和连线明确标为教学状态对照，不表示连续训练轨迹。Query 读取与 P9 相同的运行时特征、六类原型和预测结果；训练 head 留在模型中，但不参与最终 argmax。训练/预测职责只在结尾做一次紧凑对照，删除了重复的 P8 入口按钮。

`FeatureSpaceWorkbench` 新增可选的 `motionProgress` 插值能力，只供 P7 的同 ID before/after 动画使用；P3/P4/P9 未传此属性时仍显示原有静态图形。P7 根节点和局部 CSS 统一使用 `p7` 作用域，导航文字同步调整。视觉 QA 状态现从 P7 工作台真实播放中段捕获，而非停留在逐段跳转的初始帧。

验证：`tsc --noEmit`、项目现有 `npm.cmd test` 与 Vite bundle-loader 生产构建通过（75 modules）；测试数据核对显示 P3 的 12 个特征/3 个原型/最近类结果、P4 的 8 个候选及排序、P5 的 D=30 与冻结 Q=30×3 均通过。Chromium 在 1440×900 与 1920×1080 共捕获 12 个 P7 状态，GEOMETRY_QA=PASS、BROWSER_ERRORS=PASS（0），报告位于 `web/enhanced/.visual-qa/p7-revision-final/run-2026-10-14T17-35-06-060Z/report.md`。已查看 1440×900 下旧记忆截断、新类入选、特征重编码、原型重建和 Query 结果截图，VISUAL_REVIEW=PASS；STYLE_QA=NOT_RUN，REGRESSION=NOT_RUN（没有已批准基线）；HUMAN_ACCEPTANCE=PENDING。W7/W9/W10 状态未更改。

#### 阶段 D｜P8 论文证据阅读（2026-10-15）

P8 已按四个问题组织：整体结果与实验协议、组件作用及对照限制、Exemplar 均值近似的准确率代价、记忆预算与适用边界。Figure 2 可切换 iCIFAR-100、iILSVRC-small、iILSVRC-full 与每批类别数，焦点框依据原图像素坐标定位；Figure 3 保留类别预测偏置的可展开原图。Table 1a/1b 使用论文结果数据，突出 Hybrid 2 两类批次例外，并说明 Hybrid 3 与 LwF.MC 同时改变回放和蒸馏、不能单独归因于回放。Table 1b 比较分类准确率百分点，不将其解释为原型向量距离；全数据 NCM 仅作为诊断参照。Figure 4 聚焦记忆预算趋势，并保留原图与任务范围说明，接入 P9 完整运行链。

验证：`tsc --noEmit` 与 Vite bundle-loader 生产构建通过（75 modules）；项目既有 `npm.cmd test` 通过。P8 在 1440×900、1920×1080 共捕获 20 个状态，GEOMETRY_QA=PASS、BROWSER_ERRORS=PASS（0），主报告位于 `web/enhanced/.visual-qa/p8-revision-final/run-2026-10-14T17-49-59-081Z/report.md`。已实际查看总体结果与 Figure 2 三个焦点、Figure 3 展开状态、Table 1a 的组件/两类批次例外、Table 1b 准确率差值和 Figure 4 两种焦点；Figure 3 另补一张滚回页首后的干净长截图，以避开 sticky 导航在长页截图中的重复。人工视觉复核通过；STYLE_QA=NOT_RUN，REGRESSION=NOT_RUN（没有已批准基线），HUMAN_ACCEPTANCE=PENDING；W7/W9/W10 状态未更改。

#### 阶段 E｜P3–P8 相邻页一致性与截图验收（2026-10-15）

依据根目录 `README.md` 的教学原则，复核 P3–P8 是否形成“原型判别 → Herding 与预算 → 训练样本/冻结 Q → BCE 参数更新 → 更新后记忆与预测 → 论文证据及边界”的因果链；检查样本身份与坐标、实验数据/合成教学状态区分、单舞台可读性以及交互是否解释实际算法步骤。审查发现并修复 P4 第四轮导航指向错误候选的问题：阶段入口现在从实际 Herding 轮次生成，并显式携带分组编号，第四轮定位到实际首个未选候选 `a7`，不再回退到初始片段或显示 NaN。截图配置中 P3–P5 已改用当前工作台的片段导航和真实状态选择器；P5 展开 Q 明细后定位至页首，避免长页截图起始位置造成固定导航重复。

最终 Chromium 截图覆盖 1440×900 与 1920×1080，共 112 个 P3–P8 页面状态；报告 `web/enhanced/.visual-qa/p3-p8-full-review/run-2026-10-14T18-40-38-850Z/report.md` 中截图采集、几何检查均通过，浏览器错误为 0。人工复核代表截图覆盖 P3 原型聚合与最近原型判别、P4 第四轮候选与前缀预算、P5 的 D/Q 明细、P6 损失汇总与参数交接、P7 更新后 Query/六类原型、P8 原图焦点与论文表格例外。另以 P5 页首定位动作补拍 1440×900 与 1920×1080 两种视口，确认展开 Q 明细时导航未重复且状态清晰。截图工具提示 P5 展开的 Q 数值明细中有 10 个语义文字元素低于其字号阈值；它们属于按需展开的精确数据，人工截图中仍可辨认，未因此更改字号；全局 `STYLE_QA` 仍标记为 `NOT_RUN`。跨页检查未发现样本或类别身份断裂、训练与预测混淆、论文结果与合成状态混标或关键因果转折缺失。

`tsc --noEmit` 与 Vite bundle-loader 生产构建通过（75 modules）。`VISUAL_REVIEW=PASS`；`GEOMETRY_QA=PASS`、`BROWSER_ERRORS=PASS`（0）；`STYLE_QA=NOT_RUN`，`REGRESSION=NOT_RUN`（无已批准基线），`HUMAN_ACCEPTANCE=PENDING`。W7/W9/W10 状态保持原样。本阶段仅调整 P4 导航生成逻辑、P3–P5 截图状态配置及本计划记录；截图和临时检查仍保存在被忽略的 `.visual-qa/` 下。

#### 阶段 F｜P4-06/07 有序记忆修订与 P7 Query 标签修复（2026-10-16）

本阶段依据用户指定的《iCaRL_P4_06-07再次修订.md》实施；该文档提供页面范围和验收标准，用户在本轮明确补充 P7 根因是 Query 文本与 `μ1 · exemplar 原型` 标签发生碰撞并触发自动位置修正，因此将 Query 文本初始位置下移，避免碰撞；没有修改 Query 特征坐标、原型坐标或分类结果。

P4-06 切换为有序记忆主工作台：按真实 Herding 序列 `a8 → a2 → a4 → a5` 依次回看前缀，圆图降为真实特征与 `νₖ` 的对照；人工选择前 1/2/3/4 项时列表、计数和均值同步更新。P4-07 显示 `K=12` 下 `3 类 × 4 项 → 4 类 × 3 项`，前三项及顺序固定，只让 `p₄=a5` 离开；结尾明确 `P'=[a8,a2,a4]`、`3/3`，说明这是独立预算示例，不改变原图或追加训练，也不混同 P5 的实际类别批次。贪心结果与共享计算数据未修改。

P7 Query 标签使用固定左下锚点（相对菱形 `dx=-14、dy=28`，`text-anchor=end`），只改变文字布局。Chromium DOM 取样覆盖进度 0%、5%、10%、15%、20%、30%、60%、100%：SVG `viewBox` 保持 `0 0 640 520`；菱形 x 坐标从 612 连续移至约 465.66（20% 到位后保持静止）；Query 标签始终保持同一偏移和锚点。所有取样中 Query 文字框与 Class 1/`μ₁` 文字框不相交。起始帧文字框位于 `y≈202.87–226.16`，`μ₁` 文字框位于 `y≈168.73–192.02`，两者垂直留空约 10.9 个 SVG 单位，符合用户指出的下移避碰方案。

Chromium 1440×900 与 1920×1080 共采集 46 个状态（P4-06/07 的 0/20/40/60/80/100%、人工前缀选择、P4-05→06 完成态，以及 P7 Query 的起始、10/15/20/25/30/50/75% 和最近原型结果）。报告：`web/enhanced/.visual-qa/p4-p7-final-clean/run-2026-10-15T16-47-06-557Z/report.md`；截图与机器报告保存在被忽略的 `.visual-qa/`。检查器结果 `GEOMETRY_QA=PASS`、`BROWSER_ERRORS=PASS`（0）；视觉复核实际检查了 P4 有序前缀、预算尾项离开与 3/3 终态，以及 P7 Query 入场截图，`VISUAL_REVIEW=PASS`。阶段条的显示百分比包括静止停留时间；状态取样以动画 `data-progress` 与对应教学内容为准，因此画面上的百分比徽标会略低于状态编号的目标值。

额外在 1366×768 检查 P4-06、P4-07 与 P7 Query，三者页面宽度均未超过视口。正常播放、暂停/继续、重播、阶段跳转均通过；reduced-motion 下 P4 保持可读的完整阶段状态，P7 播放控件禁用。开发服务器 Chromium 冒烟检查经过 P4-06、P4-07、P7 Query，页面错误与 console error 均为 0。

验证：`npm.cmd test`、`npx tsc --noEmit`、`npm.cmd run build` 通过；`npm.cmd run dev -- --host 127.0.0.1 --port 4175 --strictPort` 启动并完成上述浏览器检查。实际 `BUILD=PASS`；自动浏览器报告中 `GEOMETRY_QA=PASS`、`BROWSER_ERRORS=PASS`（0）；人工截图复核 `VISUAL_REVIEW=PASS`。没有专门的计算样式断言，`STYLE_QA=NOT_RUN`；没有获批基线，`REGRESSION=NOT_RUN`；`HUMAN_ACCEPTANCE=PENDING`。W7/W9/W10 状态未修改。

### P4 阶段 05 虚线连接放慢（2026-10-16）

按用户补充，将修改限定为阶段 05（第四轮）绘制前缀虚线连接的片段：`p4-scene__hull-line` 的生长由 `hullReveal` 驱动，因此只把第四轮 `hull` 片段的运动时长加倍，使连线速度降至原来的 0.5 倍。该片段的停留时间及扫描、贡献点聚合、均值、归一化和评分时长保持不变；其他轮次的连线速度也保持不变。

验证：`npm.cmd test`、`npx.cmd tsc --noEmit` 与 `npm.cmd run build` 通过。已尝试在 Chromium 两种桌面视口运行阶段 05 完成态检查，但本地预览服务器无法从 QA runner/浏览器环境连接，未生成截图；失败记录为根目录 `.visual-qa/run-2026-10-15T17-30-05-111Z/report.md`。因此本次 `BUILD=PASS`；`GEOMETRY_QA=NOT_RUN`、`STYLE_QA=NOT_RUN`、`VISUAL_REVIEW=NOT_RUN`、`BROWSER_ERRORS=NOT_RUN`、`REGRESSION=NOT_RUN`；`HUMAN_ACCEPTANCE=PENDING`。W7/W9/W10 状态未修改。

### P9 重构前 P4/P7 定向回归（2026-10-16）

按最新 P9 重构方案先复核 P4-06/07 与 P7 Query，不改已完成的 P4/P7 实现。生产预览中的 Chromium 检查覆盖 1440×900、1920×1080 共 44 个状态，包括 P4 有序前缀 0–100%、预算尾项退出 20–100%，以及 P7 Query 入场和最近原型终态。报告位于 `.visual-qa/run-2026-10-15T17-56-15-786Z/report.md`；`GEOMETRY_QA=PASS`、`BROWSER_ERRORS=PASS`（0），无截图基线，`REGRESSION=NOT_RUN`；无计算样式断言，`STYLE_QA=NOT_RUN`。人工查看的 1440×900 代表帧包括 P4 两项前缀、尾项释放中及 3/3 终态，和 P7 Query 起始、入场中段、六类比较完成态；`VISUAL_REVIEW=PASS`（Agent 代表帧复核，非人工 W9 接受）。

既有 DOM 量测脚本 `.visual-qa/measure-query-and-interactions.mjs` 检查 P7 Query 进度 0/5/10/15/20/30/60/100%：marker 从 x=612 连续移动到 x≈465.66 后静止，`viewBox` 固定为 `0 0 640 520`，文字始终固定 `dx=-14、dy=28、text-anchor=end`，与 Class 1/`μ₁` 文字框无交叠。1366×768 下 P4-06、P4-07、P7 Query 均无页面横向溢出；P4 重播、暂停/续播与 reduced-motion 完整静止状态可用，P7 reduced-motion 下播放按钮禁用。`npm.cmd test` 通过；沙箱内 Vite 首次构建因 Windows `realpath EPERM` 失败，允许本地构建访问后 `npm.cmd run build` 通过（81 modules）。W7/W9/W10 状态未修改，`HUMAN_ACCEPTANCE=PENDING`。

### P9 全流程重构｜场景合同（2026-10-16）

P9 将收敛为八章：继承状态、准备 D、冻结 Q、更新模型、管理记忆、重建原型、最近原型预测、交接下一轮。内部用 17 个页面专用 clips 展示可暂停中间态，但每个区域只读 `useAnimationTimeline` 的同一进度；`runtimeSceneAt(clip, progress)` 只派生演示可见性、对象生命周期和运动进度，不重新计算 Herding、Q、BCE、Prototype 或距离。

对象合同：`Θ` 与 `P` 始终是固定持久锚点；`X_new` 在到达后保留至 P_after 提交；`D` 从旧 P 的副本与新类图片合并后存在，在参数更新结束时释放；`Q` 从两个可识别样本的旧教师写入演示开始，补满 30×3 后冻结，并在训练结束时释放；targets/loss 只在训练 clip 有效；新记忆提交后从 `P_after` 重编码并形成六个派生 Prototype；Query/预测只在推断链中存在并于交接时退出。单元测试核验八章、clip 导航、D 合并中间态、样本 ID 与 Q 行一致、Θ 提交边界、旧前缀截短及最终 12 项预算。

### P9 切片 1｜继承状态 → D → 冻结 Q（2026-10-16）

完成前 3 章的可运行切片，后 5 章暂时禁用，等待后续竖切片接入。`PageNine` 只创建一个 `useAnimationTimeline`；继承的 `Θ_before` 与有序 `P_before` 固定在左侧，18 张真实运行时新类图片进入后，中央工作台将 12 张旧图的训练副本与 18 张新图合成 `D`。旧图副本保留原 sample ID，持久原件和顺序不移动。D 在 25/50/75/100% 对应显示 8/15/23/30 个样本。

接着以旧类与新类真实样本分别演示旧教师响应写入自己的 Q 行，再按 sample ID 补齐 30×3 矩阵。表格的 Q 数值直接读取 `teacherSnapshotFor`；Θ 持续显示 `before`，`Q` 完成时冻结，训练 targets/loss 保持 pending，直到其章节开始。修正了 D 目标卡误占连接列的问题，并将移动样本标记放在 Q 行下方的空白通道，不遮挡当前正在写入的单元格。测试覆盖四个 D 中间点、旧/新样本行身份与真实 teacher row、Q 进度和冻结边界，以及 targets 的创建时点。

验证：`npm.cmd test`、`npm.cmd run build` 通过（82 modules），`git diff --check` 通过。Chromium P9 截图在 1440×900 与 1920×1080 共 12 个状态通过，报告 `web/enhanced/.visual-qa/run-2026-10-15T18-45-32-930Z/report.md`：`GEOMETRY_QA=PASS`、`STYLE_QA=PASS`、`BROWSER_ERRORS=PASS`（0）。另外冻结 12 个场景状态，在 1440×900、1920×1080、1366×768 共检查 36 帧；页面无横向溢出，Q 移动标记不覆盖活动 Q 行，D 卡宽度约 200–252 px。常规动效下播放/暂停、前进/后退和章节重播边界均通过；减少动态效果时，手动前进一步会停在恰好一个完整 clip。该检查发现共享 timeline 的 reduced-motion 控件会多前进一个 clip，已修复 `useAnimationTimeline` 并重新构建；P4/P7 定向测量回归通过，P4 完整阶段保持暂停态、P7 reduced-motion 播放控件禁用，Query 几何与无溢出结果不变。人工查看了继承状态、D 合并 50/75%、旧/新样本 Q 写入和 Q 批量补齐状态，`VISUAL_REVIEW=PASS`；报告 runner 的 `VISUAL_REVIEW=NOT_RUN` 保持原样。无已批准截图基线，`REGRESSION=NOT_RUN`；`HUMAN_ACCEPTANCE=PENDING`。W7/W9/W10 状态未修改。

### P9 切片 2｜目标与参数交接 → 记忆管理 → 原型重建（2026-10-16）

接通第 4–6 章。训练桥以一张真实教学 fixture 展示 sample ID 对齐的冻结 Q 软目标、真实新类硬标签、共享 BCE 与六节点损失；参数改变采用符号化离散交接，不伪造优化器轨迹或 loss 曲线，`P_before` 在提交前保持原样。记忆工作台按真实有序列表将旧类前缀由每类 4 项截为 2 项；D 类逐项演示真实 `NEW_CLASS_HERDING` 前两名，E/F 按各自真实顺序摘要补齐。候选只在 `P_after` 提交片段完成后成为持久记忆。原图 ID 保持不变并以固定 before/after 表示端点重编码；六个 Prototype 直接读取共享运行时 `PROTOTYPES` 坐标。

测试覆盖目标与样本、Q/硬标签来源、六节点损失、Θ 提交边界、截断中的预算、D/E/F Herding 身份和顺序、P_after 提交边界，以及重编码身份和共享 Prototype 坐标。`npm.cmd test`、`tsc --noEmit`、Vite 生产构建和 `git diff --check` 通过。P3–P9 完整配置曾通过 210 个捕获、几何及样式检查和零浏览器错误；该轮检查发现原型图语义说明 10px 低于 11px 门槛，现已提高至 11px。修订后的 P9 定向标准 QA 在 1440×900、1920×1080 共 26 帧通过，`GEOMETRY_QA=PASS`、`STYLE_QA=PASS`、`BROWSER_ERRORS=PASS`（0），无样式诊断。专用交互捕获覆盖 15 个状态、1440×900/1920×1080/1366×768 共 48 帧及 reduced-motion 记忆到原型路径；无横向溢出或浏览器错误。代表性训练、截断、Herding 和原型截图已目视检查，`VISUAL_REVIEW=PASS`。报告位于仓库根 `.visual-qa/p9-memory-slice-acceptance/`、`.visual-qa/p9-second-slice-final/` 与 `.visual-qa/p9-memory-slice-browser-review/`。无已批准截图基线，`REGRESSION=NOT_RUN`；`HUMAN_ACCEPTANCE=PENDING`，W7/W9/W10 状态未修改。第 7、8 章继续留待最后切片。

### P9 切片 3｜真实距离预测与下一轮交接（2026-10-16）

接通第 7、8 章，八章现全部可导航，17 个内部 clips 继续共用一条 `useAnimationTimeline`。Query 使用共享 `QUERY_FEATURE`，在特征空间中沿固定方向进入后，按共享 `QUERY_DISTANCES` 的真实最近到最远次序逐条绘制并保留六条比较线；最近原型与类别由真实 argmin/`QUERY_PREDICTION` 决定。训练 head 保留在模型状态中，但作为非参与状态呈现，不用其 sigmoid argmax 分类。图表只复用现有 `FeatureSpaceWorkbench` 及共享点、Prototype、Query 和距离，没有增加第二份距离算法或新教学数据。

最终交接显示 `S_(r+1)=Θ_after + P_after`，保留训练后的模型与 12 张原始 exemplar；D、Q、targets、loss、Query 和预测等本轮临时或派生对象在交接时退出。`X_next` 仅作为下一批入口提示，不播放未定义的下一轮训练。更新 P9 测试与 `visual-qa.json`，记录 Query 入场/比较/最近原型/最终交接帧；新增预测与交接样式并按窄屏纵向排布。

验证：`npm.cmd test`、`npx.cmd tsc --noEmit`、`npm.cmd run build`（82 modules）和 `git diff --check` 通过。P9 定向标准 QA 在 1440×900、1920×1080 共 34 帧通过，`GEOMETRY_QA=PASS`、`STYLE_QA=PASS`、`BROWSER_ERRORS=PASS`（0），报告位于 `.visual-qa/p9-runtime-focused-check/run-2026-10-15T19-59-10-557Z/report.md`。专用 Chromium 交互/截图检查共 40 帧，覆盖 1440×900、1920×1080、1366×768 和 390×844；Query 播放与暂停、六距离及最近原型、下一轮交接、reduced-motion 终态均通过，40 帧无页面横向溢出且无浏览器错误。已目视查看 390×844 的三距离比较中段与交接近终态；截图与指标在仓库根 `.visual-qa/p9-final-slice-browser-review/`。P3–P9 完整配置的本次复跑在 P6 处仅生成 64 张图便停止，未产出报告，不记为整套通过；P3–P8 仍依据此前 124 帧回归记录，P9 依据上述定向标准 QA 与 40 帧专项检查。无已批准截图基线，`REGRESSION=NOT_RUN`；这是 Agent 视觉抽样复核而非人工学习验收，`HUMAN_ACCEPTANCE=PENDING`，W7/W9/W10 状态未改。

### P9 交错式图文推演重设计｜阶段 A：静态阅读主线（2026-10-16）

本记录覆盖当前实施，并取代上文“P9 全流程重构”各切片作为现行设计；旧章节仅保留为历史记录。依据使用者确认的《iCaRL_P9_交错式图文推演重设计与 Codex 执行方案》，P9 从全页自动播放改为七组自上而下阅读的交错图文推演。P1–P8 教学内容、路由和九页结构维持原状，仅同步 P8→P9 入口及 P9 导航文案。

阶段 A 已完成七组完整静态正文和图形：继承 `Θ_before + P_before`、从旧记忆读取副本并加入 `X_new` 构造 `D=30`、更新前 Teacher 生成按 ID 对齐且包含全部样本的 `Q=30×3`、软/硬目标构造与符号化 `Θ_after`、固定预算下旧前缀截断与新类 Herding、用当前 `P_after` 重建原型并按真实距离预测，以及持久状态与临时对象分流。图形读取现有 iCaRL / incremental-training fixtures，不增加独立算法或第二套演示数据。桌面交错列以文字与图形左右镜像，窄屏按文字→图→交接堆叠；结果默认完整可见。

验证：`npm.cmd run build` 通过（TypeScript 与 Vite，81 modules）；`git diff --check` 通过。阶段 A 尚未添加局部重播、替换旧 P9 场景合同测试或运行 Chromium 截图检查；这些分别在阶段 B–D 完成后记录。当前 `BUILD=PASS`，`GEOMETRY_QA=NOT_RUN`、`STYLE_QA=NOT_RUN`、`VISUAL_REVIEW=NOT_RUN`、`REGRESSION=NOT_RUN`；`HUMAN_ACCEPTANCE=PENDING`。W7/W9/W10 未变更。

### P9 交错式图文推演重设计｜阶段 B：训练前准备与参数更新（2026-10-16）

阶段 B 完成第 02–04 组的按需局部重播，默认仍直接展示终态，未添加整页时钟或 autoplay。第 02 组按旧 exemplar 12 + 新图 18 逐步填入 D 的 30 个槽位，P_before 原件与 ID 保持展示。第 03 组展示旧、新样本各自的真实 `teacherSnapshotFor` 响应，30 行矩阵按进度填充并在完成时标记冻结；样例顺序明确标注为示例顺序而非 D 的遍历顺序，完整数据可展开查看。第 04 组依同一 D sample ID 显示 Q 软目标与新类硬标签，点亮六个独立 BCE 节点后将状态标为符号化 `Θ_after`，并持续声明其非实际优化器轨迹。

每组只提供本组的暂停/继续/重看控件；减少动态效果时结果保持完整且控件不启动动画。验证：`npm.cmd run build` 通过（TypeScript 与 Vite，81 modules）。局部重播的浏览器截图、测试合同和最终几何检查留待阶段 D 一并验证；`HUMAN_ACCEPTANCE=PENDING`，W7/W9/W10 未变更。

### P9 交错式图文推演重设计｜阶段 C：记忆、预测与下一轮交接（2026-10-16）

阶段 C 完成第 05–07 组局部重播。第 05 组先从 12 张旧记忆按原有序截出每类前两张，再按真实 Herding 前缀依次把 D/E/F 各两张放入固定 `K=12` 预算；中间候选数与提交状态可见，只有完成后标记持久 `P_after`。第 06 组复用 P7 的 `FeatureSpaceWorkbench`、同一批 `P_after` IDs、当前六类原型及 Query/距离：先重编码，再让 Query 入场，按 Class 1–6 顺序完成六次比较，比较结束后才显示最近类。第 07 组保留 `Θ_after + P_after` 与仅作入口提示的 `X_next`，把 D/Q/Targets/Loss/当前 Query 和派生 Prototype 显示为本轮临时对象。

阶段 B、C 的局部重播只由各组按钮触发，默认仍为完整终态；减少动态效果时保持终态并禁用重播。验证：`npm.cmd run build` 通过（TypeScript 与 Vite，81 modules）；`git diff --check` 通过。QA 配置、DOM/共享数值不变量及浏览器检查在阶段 D 更新和运行。`HUMAN_ACCEPTANCE=PENDING`，W7/W9/W10 未变更。

### P9 交错式图文推演重设计｜阶段 D：退役旧运行时与最终检查（2026-10-16）

阶段 D 更新 P9 教学数据合同测试与 `visual-qa.json`，保留 P1–P8 的检查配置，为 P9 配置七组静态终态、各组局部重播起始/中段/终态等 19 个检查状态；删除不再使用的 `page-nine-scene.ts` 旧运行时。测试核验七组内容顺序、共享合成数据身份与数值、30×3 Teacher 响应、六节点 BCE、K=12 记忆、原型预测及旧运行时控件不再出现。窄屏复核发现共享顶栏状态区超出容器，已让操作组在移动断点保持自身宽度，页面标题按剩余空间省略显示。

验证：`npm.cmd test`、`npm.cmd run build`（81 modules）、`python tools/paper.py check icarl` 与 `git diff --check` 通过。全配置 Chromium 检查共 222 帧，覆盖 P1–P9 的 1440×900 与 1920×1080；整体及 P9 `GEOMETRY_QA=PASS`、P9 配置样式断言 `STYLE_QA=PASS`、`BROWSER_ERRORS=PASS`（0）。报告：`web/enhanced/.visual-qa/p9-interleaved-redesign/run-2026-10-16T12-14-24-598Z/report.md`。Agent 目视复核七组完整静态主线、D 合并中段、旧记忆截断中段与临时对象交接帧，`VISUAL_REVIEW=PASS`（不代表人工学习效果验收）。另在 390×844 复核 P9：页面 `scrollWidth=clientWidth=375`，七组采用单列阅读，Q 表格在局部滚动容器内保留完整列。无已批准截图基线，`REGRESSION=NOT_RUN`；`HUMAN_ACCEPTANCE=PENDING`，W7/W9/W10 状态未改。

### P3–P7 算法逻辑前置引导重设计（2026-10-18）

执行依据：用户提供的《iCaRL_P3-P7_由算法逻辑推演驱动的教学引导重设计》。本轮范围限于 P3–P7 前置推理、执行路线、通用原理与演示条件的区分，以及满足这些文字所需的共享卡片样式；P1/P2/P8/P9、图表共享计算、样本身份、时间线和播放器行为均保持不变，除必要的共享样式回归修复外不扩展范围。

按 A→D 分块推进：A 定标 P3 并建立新路线组件；B 补全 P4 有限记忆、真实 Herding 公式、逐项贪心与有序前缀推理；C 补全 P5 Replay/Q 与 P6 软硬目标/BCE/反传因果链；D 补全 P7 预算重分配、旧前缀、新类 Herding、更新后重编码和最近 Prototype，并做集成回归。每块在继续前记录测试、构建及相关浏览器检查结果；成功后单独提交。通用原理在默认展开正文与输入/处理/得到执行卡中说明，P3 的三类/每类四张、P4 的八个候选与 3→4 简化预算、P5 的 3+3 类和 D/Q 尺寸、P6 的六个节点、P7 的 K=12 及 4→2 示例只放在对应演示说明中。

不可变教学与行为约束：Prototype 是当前已学习特征空间中的近似参考；P3/P7 使用同一当前特征提取器和最近均值预测，不等同训练头 argmax。Herding 的候选先单位化，在每轮比较单位化新增前缀均值到单位化完整类目标的距离；按当前最小距离贪心选取，不声称全局最优或误称距离单调下降。持久化的是原始 Exemplar 与次序，不是完整目标。P5 的 D 和按 sample ID 对齐的更新前冻结 Q 分工不变，D 内每张旧/新图片都有 Q 行。P6 仍为旧节点教师软目标、新节点真实硬目标与逐节点 BCE；网页不执行真实 SGD。P7 旧有序列表按预算保留前缀，新类按现有 Herding 顺序补入；保存的 Θ_after 与 P_after 及其真实身份不变。不得改共享数据、分数、数值计算、阶段顺序或任何播放器控制/暂停边界。

前置路线使用默认可见的推理正文→四步输入/处理/得到→结果交接与独立演示注；正文目标 15–16px、行高至少 1.55，步骤正文至少 14px，演示注可 12px。四卡只在容器空间足够时横排，并在真实独立槽位中使用 SVG 左右箭头；空间不足时全流程改为纵排并将箭头转向下方。DOM 复核应记录卡片与箭头边界不相交、箭头位于相邻卡中心之间、末卡无箭头。现有 `visual-qa.json` 增加 P3–P7 前置阅读捕获点；Chromium 固定视口覆盖 1440×900、1920×1080，交互视口另检查 1366×768、768×1024、390×844。人工学习验收需读者不播放动画回答方案规定的五题；Agent 目视检查与之分开报告，未由读者完成前 `HUMAN_ACCEPTANCE=PENDING`。

实施记录（Block A，commit `f7fc3b5`）：P3 已采用通用标题与完整因果推理，数字仅留在演示注；路线组件现以默认可见正文→四步“输入/处理/得到”→结果交接呈现，并将三个相邻关系改为 SVG 连接槽。P4–P7 调用点已迁入同一新接口，具体推理正文由后续 B–D 补全。`npm.cmd test`、`npm.cmd run build`（86 modules）与 `git diff --check` 通过。真实 Chromium 视口测量覆盖 1440×900、1920×1080、1366×768、768×1024、390×844：前三者四卡横排，后两者单列下行；箭头与卡片无相交、中心偏差为 0、末卡无箭头；正文 15.5px/24.8px、窄屏 15px/23.7px、步骤值 14px，无横向溢出。目视检查 P3 桌面全页与窄屏流程，`VISUAL_REVIEW=PASS`。标准全配置 runner 尚未完成且不计为通过；整合后复跑。`BUILD=PASS`、`GEOMETRY_QA=PASS`（交互视口实测）、`STYLE_QA=PASS`（实测值符合）、`HUMAN_ACCEPTANCE=PENDING`。

实施记录（Block B）：P4 标题与正文从 P3 原型对有限记忆均值的依赖推导到完整类目标 μ_full，再说明固定前缀、逐候选新增均值→单位化→真实距离→当前 argmin 的 Herding 顺序；明确贪心不保证全局最优或距离单调下降，并由固定预算推出旧类有序前缀截断。八个合成候选与 K=12、3→4 类、4→3 项预算移至演示注，并明确不是 P5/P7 的 3→6 场景。测试新增因果内容、贪心边界和原理/数字隔离检查。检测发现末卡原先比其他卡宽一个箭头槽，故共享网格已改为四个等宽卡位与三个真实 28px 连接槽；1366×768 维持四卡横排，768×1024 与 390×844 全部纵排。`npm.cmd test`、`npm.cmd run build`（86 modules）与 `git diff --check` 通过。五视口真实 DOM 测量均无页面溢出；卡片宽度分别为 212.8/229.7/297.8px（1366/1440/1920），桌面箭头位于相邻卡间隙中央、纵向箭头位于步骤中心轴，中心偏差均为 0，均无交叠，末卡无箭头；正文/步骤字号符合要求。已目视检查 1366 桌面路线和 390 纵向路线，浏览器错误日志为 0，`VISUAL_REVIEW=PASS`、实测 `GEOMETRY_QA=PASS`、`STYLE_QA=PASS`。标准全配置 runner 与读者五题验收均待后续/用户完成；`HUMAN_ACCEPTANCE=PENDING`。

实施记录（Block C）：P5 说明 Replay 输入本身不能保留旧教师行为，冻结的更新前 Teacher 必须为 D 中每张旧/新图片按 sample ID 写入 Q；D 与 Q 的训练输入/软目标职责分开。P6 说明旧节点从对应 Q 行取软目标、新节点从真实标签取 0/1 硬目标，独立 Sigmoid 节点计算 BCE 并把梯度传回可训练参数；网页不执行真实 SGD。P5 的 3+3 类和 D/Q 尺寸、P6 的六节点与 3+3 划分只在演示注中出现。新增文案合同测试。`npm.cmd test`、`npm.cmd run build`（86 modules）与 `git diff --check` 通过。P5/P6 的 Chromium DOM 检查覆盖 1440×900、1920×1080、1366×768、768×1024、390×844：桌面四卡横排、两种窄容器纵排；箭头均不相交、位于卡片间距/中心轴，末卡无箭头；正文为 15.5px/24.8px（390 下 15px/23.7px），步骤值 14px，无横向溢出。已目视检查桌面及窄屏流程，浏览器错误为 0，`VISUAL_REVIEW=PASS`、实测 `GEOMETRY_QA=PASS`、`STYLE_QA=PASS`。全配置 runner 留待 D 集成后运行；读者五题验收尚未进行，`HUMAN_ACCEPTANCE=PENDING`。

实施记录（Block D）：P7 现从参数更新后类别增加与固定预算推导每类名额缩减，说明旧类保留有序前缀、新类按当前表示 Herding 补入；随后用当前特征提取器重编码持久化原图、重建 Prototype，再对当前模型编码的 Query 做最近距离预测，最终交接仅为 Θ_after + P_after。K=12、旧类 4→2、新类 D/E/F 各 2 仅留在固定状态演示注；新增 P7 文案合同测试。集成回归同时修正 P4 一个旧截图状态的动作顺序，使其等待目标可由“播放当前阶段”自然到达，未改变页面算法或播放器。`npm.cmd test`、`npm.cmd run build`（86 modules）和 `git diff --check` 通过。标准全配置 Chromium runner 260/260 状态通过，其中 P3–P7 为 166/166，覆盖 1440×900 与 1920×1080；`GEOMETRY_QA=PASS`、`STYLE_QA=PASS`、`BROWSER_ERRORS=PASS`（0 条）；已目视检查五页前置推理与执行入口代表截图，`VISUAL_REVIEW=PASS`。报告另有 P9 既有小字号语义提示（62 个状态各 1 项），本轮未改 P9；P1/P2 的 28 个记录未配置样式断言。未发现已批准基线，`REGRESSION=NOT_RUN`；五题读者验收仍待完成，`HUMAN_ACCEPTANCE=PENDING`。按用户要求，最终记录后清理本轮生成的临时 QA 截图/配置及未被计划引用的旧 iCaRL 检查缓存；方案记录保留为结果依据。
