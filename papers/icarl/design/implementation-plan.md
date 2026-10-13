# Implementation Plan: iCaRL: Incremental Classifier and Representation Learning

Paper ID: `icarl`

## Learning Goal and Non-goals

The tutorial should let a first-time reader explain the class-incremental constraint, distinguish iCaRL's trainable feature extractor from its per-class training head, and trace one update from the persistent state through prototype-based prediction. The complete spine has eight stages; W6 is deliberately limited to S01, S02, and S08 (Pages 1, 2, and 10) as requested.

Page 1 defines the problem without revealing the solution. Page 2 opens the model only far enough to explain image-to-representation flow and why the training head is not the final predictor. Page 10 integrates previously taught objects without reteaching their derivations. Figure 2–4 are assigned to Page 9/S07 and prepared as attributed source crops, but Page 9 is outside this W6 slice.

Every computational visual reads from one deterministic data/calculation layer. Page 2 and Page 10 synthetic geometry is labeled `Synthetic teaching example`; the feature projection is an illustrative carrier, not a paper measurement or a trained iCaRL checkpoint. Page 10 shows the update as the symbolic `Θ_before → Θ_after` transition, snapshots Q before that transition, leaves P unchanged until the later memory phase, and computes quota, prefix truncation, new-class Herding, normalized prototypes, distances, and nearest-prototype prediction from the visible fixed data. The UI renders these results and does not maintain a second copy of the algorithm.

Do not add a new loss lesson, a second feature-space implementation, fabricated training metrics, invented Figure 2/4 curve values, or paper-page content outside the approved vertical slice. Keep equations and exact numeric details in expandable/reference placements.

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
      page: "Pages 3–4 · Prototype and Exemplar Memory"
      core_items: [L05, L06, L07]
      evidence_refs: [C04, C05, C09, C13]
      primary_vehicle: "Four-stage prototype-prediction workbench over P_BEFORE, followed by the shared SampleToken memory view for raw-image persistence, dual roles, and budget"
      reusable_pattern: ArchitectureExplorer
      reason: "Page 3 holds Θ and P fixed while twelve saved images become normalized features, inside-circle means, normalized prototypes, and a nearest-prototype query decision; Page 4 then explains why those same raw images persist and can be re-encoded for learning and prediction."
    - id: S04
      page: "Page 5 · Ordered Exemplar Selection"
      core_items: [L08, L09]
      evidence_refs: [C07, C08, T01]
      primary_vehicle: "Algorithm-computed Herding sequence and ordered exemplar buckets with prefix truncation"
      reusable_pattern: ProcessLoopExplorer
      reason: "Herding is sequential: every selected prefix is compared with the computed full-class mean, and later reduction retains that order's prefix."
    - id: S05
      page: "Page 6 · Prepare the Update"
      core_items: [L10, L11]
      evidence_refs: [C09, C10]
      primary_vehicle: "Object-flow stepper that combines incoming full data and old exemplars, then snapshots old-node responses before training"
      reusable_pattern: FlowStepper
      reason: "A short ordered flow makes D's two sources and Q's pre-update lifetime explicit."
    - id: S06
      page: "Pages 7–8 · Training Signals and Prediction"
      core_items: [L12, L13, L14, L15]
      evidence_refs: [C03, C05, C06, C10, C11, C12, OI01]
      primary_vehicle: "Paired old/new target lanes followed by a distinct prototype-inference path"
      reusable_pattern: FlowStepper
      reason: "The two output-node ages get different targets, while the final prediction visibly bypasses the sigmoid-head argmax and uses current exemplar means."
    - id: S07
      page: "Page 9 · Evidence and Boundaries"
      core_items: [L16, L17, L18, L19, L20, L21, L22]
      evidence_refs: [R01, R02, R03, R04, R05, R06, R07, R08, A01, A02, A03, C14, OI02, OI03]
      primary_vehicle: "Protocol-first evidence workbench with original PaperFigure panels for Figures 2–4 and source-linked result boundaries"
      reusable_pattern: PaperFigure
      reason: "The original plots and confusion matrices are the evidence being interpreted; captions, dataset protocols, exceptions, and memory boundaries stay adjacent."
    - id: S08
      page: "Page 10 · iCaRL Runtime"
      core_items: [L23]
      evidence_refs: [OI01, C09, C10, C13, C05]
      primary_vehicle: "Fixed runtime workbench driven by one ten-step state trace, with persistent, temporary, and derived objects separated"
      reusable_pattern: FlowStepper
      reason: "A controlled step sequence integrates the established objects while the workbench keeps Θ/P, X_new, D/Q, and derived prototypes visible in their own lifetimes."
  assets:
    - {asset: A-FIG02, stage: S07, rendering: crop}
    - {asset: A-FIG03, stage: S07, rendering: crop}
    - {asset: A-FIG04, stage: S07, rendering: crop}
  supporting:
    - {item: SUP01, placement: expandable}
    - {item: SUP02, placement: hover}
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

The registered P0 patterns fit the planned teaching tasks, so the continual-learning kit will be copied into `web/enhanced/src/shared/` before page implementation. W6 adapts `FlowStepper` for Page 1 and Page 10 guided states, and `ArchitectureExplorer` for Page 2's openable network path. Page 10 also reuses the same paper-owned `FeatureSpaceWorkbench` and `SampleToken` as the earlier feature-space pages; its runtime state stays in the calculation layer. `PaperFigure` is copied for S07 and will display the three selected source crops when Page 9 is implemented. No optional P1 component is selected: it would add controls without helping the requested slice.

The Page 10 reference image is used only to understand the relationships and fixed workbench regions (incoming data, current model, memory, active workspace, feature space, object lifetime, and state transition). Its visual style is not a target.

## Vertical Slice (W6)

Implement exactly three Learning Spine stages: S01/Page 1, S02/Page 2, and S08/Page 10. The review task is to move through the problem constraints, open the model and inspect one stable sample's representation, then trace a new batch through D/Q, the symbolic model update, memory reallocation, computed Herding, prototype construction, nearest-prototype prediction, and the next-stage boundary.

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

## Full Implementation (W8)

After W7 PASS, implement remaining CORE items L05–L22 in S03–S07, including Page 9's original Figure 2–4 `PaperFigure` panels. Keep SUPPORTING items in their planned compact or expandable placements, REFERENCE items outside the mainline, and all DELETE items omitted. Do not mark W7 PASS or begin W8 before the user reviews the slice.

## Human Acceptance Record

W7 passed based on the user's explicit acceptance of the current iCaRL implementation. W4 approval and the request to display original Figures 2–4 are recorded in `paper.yaml` and the W3 asset plan.

## 页面修订 · 2026-10-13

依据用户指定的《Icarl页面优化方案》，本轮只修订 `web/enhanced` 的页面。CORE 的任务背景、两种直接做法、约束与四项要求默认可读；步骤只切换焦点。非 P10 特征图复用 P3 的 SOURCE / FEATURE SPACE / CURRENT RULE 视觉语言，保留各页必要的裁剪布局。P2 使用同一 backbone，以 5→10 输出节点说明训练输出层的扩展。

保护不变量：论文公式、共享 runtime 的样本身份与坐标、Herding 计算和排序、类别色、训练与预测边界、P10 的现有画布和图元、原有键盘及 reduced-motion 行为。允许调整图框尺度、标签偏移、图元样式及 P1 的已授权叙事顺序；不改 CI、发布流程或人工验收状态。

检查范围：Chromium 1440×900 与 1920×1080；P1 初态与阅读焦点，P2 更新前/后及输出扩展/重置，P3 四阶段与直接跳转/前进/回退，P4 重编码的两种映射，P5 目标与 prefix 各阶段，P8 共享图状态，P10 修改前后对照。截图与临时检查保存在 `.visual-qa/`。每块完成后只提交本轮修改的 iCaRL 文件；HUMAN_ACCEPTANCE 保持 PENDING。

P3 的 W9 修订固定使用 P4 同一批 `P_BEFORE[A/B/C]`，每类四张，共十二张；默认选中项从该集合派生。四阶段依次为：图片与单位化 Exemplar Feature、圆内均值与单位化 Prototype、同一固定 Feature Extractor 下的独立 Query、最近 Prototype 距离/夹角与预测。P3 不再包含参数更新、完整旧类数据不可用、内存重分配或 Herding；这些职责分别留在 P4–P8。二维坐标、距离和角度来自同一套固定合成计算，并明确不代表论文实验轨迹。

阶段检查：P1 构建通过，两个宽屏视口无整体横向溢出和浏览器错误；Agent 已查看默认叙事截图。特征图统一后检查 48 个页面/状态/视口组合，未发现整体横向溢出、SVG 标签出框或浏览器错误；Agent 已查看 P2 更新后、P3 最近原型、P4 旧映射、P5 目标与二步 prefix、P8 当前原型与预测的代表性截图。P10 通过显式 legacy 外观保留旧画布与图元，其初态在两个视口与本轮调整前截图逐像素相同；未以此声称所有 P10 动态阶段均经过回归。专门计算样式断言尚未配置，STYLE_QA=NOT_RUN；HUMAN_ACCEPTANCE=PENDING。

最终检查：`npm run build` 通过；Chromium 在 1440×900 与 1920×1080 共采集 50 个状态截图（`.visual-qa/icarl-revision/final/`），GEOMETRY_QA=PASS：无整体横向溢出、SVG 标签出框或浏览器错误。VISUAL_REVIEW=PASS：已实际查看各类图代表性截图及 P2 的 5 节点、10 节点画面。P2 使用键盘 Enter 扩展，正常动画和 reduced-motion 下均验证 5→10→5、计数同步、共享 backbone 与原有节点 DOM 保持、backbone 的文档坐标和大小保持，新增节点结束后全部可见；reduced-motion 下动画为 none。P1 四个阅读焦点下方法卡片 opacity 均为 1，四项要求常显。针对交互的计算样式检查通过，但未建立全页 STYLE_QA 契约；HUMAN_ACCEPTANCE 仍为 PENDING。P10 两个宽屏初态与修订前对照仍逐像素一致。

### P1/P2 文案与图示字号修订（2026-10-13）

P1 末尾增加从图片输入到模型输出的过渡引导。P2 的结尾使用用户指定原文：“现在我们知道，模型能把图片映射为可比较的特征向量，训练输出层也会随新类别扩展。也就是具备了可以让根据输入的图片，直接在所有类型任务中判断属于哪个类别的能力呢。但我们回到一开始的问题，我们需要在这个学习过程中，保留过去模型学到的知识，就需要留存一些代表图片。那我们先假设，每类已经保留了少量代表图片，那么它究竟怎样利用这些图片判断一张新输入属于哪一类？”P2 `SHARED FEATURE EXTRACTOR` 中“image x / 卷积特征块 / 深层表示 / 聚合为向量”标签调整为 16px。

复查范围：P1 末尾阅读焦点、P2 模型展开状态，Chromium 1440×900 与 1920×1080。`tsc --noEmit` 通过；Vite 生产构建通过（72 个模块）。标准 `npm run build` 的 TypeScript 阶段通过，但本环境的默认 Vite runner 配置加载失败，随后使用 bundle loader 的临时配置完成构建。视觉 QA 报告位于 `web/enhanced/.visual-qa/p1-p2-copy-font-exact/run-2026-10-13T12-22-06-043Z/`：GEOMETRY_QA=PASS、STYLE_QA=PASS（16px 断言）、BROWSER_ERRORS=PASS（0 条）；实际查看四张截图，VISUAL_REVIEW=PASS，P1 引导与 P2 结尾均完整显示。REGRESSION=NOT_RUN；HUMAN_ACCEPTANCE=PENDING。
