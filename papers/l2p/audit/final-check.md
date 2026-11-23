# Final Learning, Evidence, and Release Check: Learning to Prompt for Continual Learning

## W7 Vertical Slice Human Review

See `design/implementation-plan.md` for the first-slice review and any revision loop.

## W8 Final-Source Compatibility Summary

Record the exact final source path from the absolute `publish_source` field in `python tools/paper.py paths <paper-id> --json`; it must match the W8 record in `design/implementation-plan.md` and the source intended for W10. If the source changed after W8, rerun affected checks and inspect the updated page before accepting W9. Include the verified `upstream/main` SHA, whether the executed checker files match it, commands, exit codes, tool versions, and evidence; warning interpretation belongs in the notes. Do not summarize required FAIL or NOT_RUN checks as “all QA passed.”

Final source path (`paths.publish_source`, absolute):

PaperSkill checker revision / tool version:

| W8 check | Status (PASS / FAIL / NOT_RUN) | Command and exit code, checker SHA/tool version, evidence/log, notes |
| --- | --- | --- |
| `UPSTREAM_SYNTAX` (`--require-parser`) |  |  |
| `UPSTREAM_OUTPUT` (warnings interpreted) |  |  |
| `SOURCE_BUILD` (actual project production build) |  |  |
| `SUBPATH_ASSETS` (production output and browser network at intended subpath) |  |  |

## W9 Learning Audit

- [ ] A first-time reader can explain why the paper needs each key mechanism, not merely repeat its definition.
- [ ] A reader can reconstruct the core architecture and ownership.
- [ ] Terms and mathematical tools appear in a valid cognitive dependency order, without unnecessary preview or repeated first teaching.
- [ ] Cross-page transitions restore necessary context lightly without reteaching prior pages.
- [ ] Important formulas receive explanation proportionate to their role and complexity, including concrete expansion, geometric intuition, or rigorous relationships where useful; they are neither hidden entirely in Reference nor presented as a formula wall.
- [ ] The dedicated complete-algorithm integration scene has its own system-level teaching design rather than a sequence of earlier components.
- [ ] From that integration scene, a reader can reconstruct W2's real execution: inputs and initialization, core objects and identities, one concrete operation, state changes, relevant branches, cross-round handoff, and prediction/output.
- [ ] In representative initial, intermediate, commit/handoff, and final states, prose, graphics, formulas, animation, and data describe the same computation and preserve object identity.
- [ ] A reader can explain training/inference and the main design reason, experimental conclusions, and major limits.
- [ ] Main-line explanation is not hidden in hover or Reference.
- [ ] No redundant core explanations, unnecessary formulas, toys, or interactions remain.
- [ ] Previously accepted teaching effects and protected W4/W5 semantics remain present after implementation and local fixes.
- [ ] Human reviewer and findings are recorded.

## W9 Evidence Audit

- [ ] Important facts, equations, architecture, numbers, datasets, and protocols resolve to the evidence registry and source cache.
- [ ] Paper facts/results, interpretations, implementation mappings, background, and teaching examples are distinguished.
- [ ] Conditions and limitations are stated without broadening the evidence.
- [ ] All source figures/tables are inventoried; selected images have correct provenance and reuse rights.
- [ ] Asset paths are relative; exported README includes image provenance; no PDF is included.

## W9 Visual QA Record

Follow docs/VISUAL_QA.md. Record actual commands, pages, affected states, Desktop Window 1440×900 / Fullscreen Layout 1920×1080, observed inner dimensions, screenshot/report locations, and findings. The latter is simulation only. For actual browser F11, record inner dimensions, zoom, screen and operating mode; unavailable real F11 is NOT_RUN and human confirmation stays PENDING. Record mobile/tablet checks only with their explicit trigger and separate outcome.

| Status | Result | Evidence / notes |
| --- | --- | --- |
| BUILD | PASS / FAIL / NOT_RUN |  |
| GEOMETRY_QA | PASS / FAIL / NOT_RUN |  |
| FULLSCREEN_LAYOUT | PASS / FAIL / NOT_RUN |  |
| FULLSCREEN_REAL | PASS / FAIL / NOT_RUN |  |
| VISUAL_REVIEW | PASS / FAIL / NOT_RUN |  |
| REGRESSION | PASS / FAIL / NOT_RUN |  |
| HUMAN_ACCEPTANCE | PENDING / PASS / REVISE |  |

BUILD, geometry, screenshot review, regression, and human acceptance are separate decisions. An agent must not record human W7/W9 acceptance on a person's behalf.

For a complex integration scene, record algorithm/state assertions and actual initial, representative intermediate, handoff, and final-state checks alongside the visual evidence. A keyword assertion, final screenshot, or build result does not establish semantic alignment. Machine checks, Agent screenshot review, and the person's learning acceptance remain separate results.

Record the exact build command and exit result. Geometry evidence names the pages, states, and viewports checked. Visual review requires screenshot paths and findings from screenshots actually inspected. Regression requires an approved baseline or before/after evidence and its interpretation. If evidence is missing, record BUILD, GEOMETRY_QA, VISUAL_REVIEW, or REGRESSION as NOT_RUN; keep HUMAN_ACCEPTANCE as PENDING until the user reviews the rendered result. A machine report cannot set visual review or human acceptance to PASS.

## Engineering, Accessibility, and Triggered Checks

- [ ] Build and project checks were run; actual outcomes are recorded.
- [ ] Implementation coverage, project tests, production build, W8 official source compatibility checks, and Visual QA outcomes are recorded for the actual source. These early source checks are not the official W10 Import, repository Validate, or Preflight.
- [ ] Final-page navigation and key interactions were actually operated in a normal desktop browser and actual browser fullscreen F11; unperformed F11 remains NOT_RUN/PENDING. Subpath production resource loading was checked separately from a root-path preview.
- [ ] Keyboard/focus, touch/non-drag alternatives, reduced-motion and responsive capabilities were preserved; mobile/tablet visual review ran only on the triggers in docs/VISUAL_QA.md, with its reason and outcome recorded when applicable.
- [ ] Export is self-contained and has no external shared runtime dependency or local machine path.

### P4–P5 专项复核（2026-11-12）

- SOURCE_BUILD=PASS。用 Node v24.18.0 执行 `npm.cmd run build`，TypeScript 与 Vite 6.4.3 退出 0。现有 Vite 进程锁住工作目录中的两个二进制，因此在独立目录用原锁文件执行 `npm.cmd ci`。两个正在使用的二进制与锁文件安装的副本 SHA-256 一致，其余依赖按该次安装恢复。
- SUBPATH_ASSETS=PASS。以 `/papers/l2p/qa-preview/` 提供生产产物，`npm.cmd run check:reading` 退出 0。两档桌面覆盖 P1–P9 的正文、MathML 和页面宽度，P1–P3 既有交互，以及 P3→P4→P5→P6 的实际导航。P4/P5 的节点、线端、关键文字、数值、部分帧与首帧、暂停、重播、拖动、A/B 重置和减少动态效果断言通过。
- GEOMETRY_QA=PASS，STYLE_QA=PASS，BROWSER_ERRORS=PASS。仓库 `node tools/visual-qa/cli.mjs --config papers/l2p/web/enhanced/visual-qa.json` 全站 114 个状态通过；最终构建另用相同配置的 P4/P5 条目复查 32 个状态。Edge Chromium 157.0.4341.46 视口为 1440×900 与 1920×1080，DPR 1。VISUAL_REVIEW=PASS，REGRESSION=PASS（P4/P5 当前分支修改前后对照）。截图与浏览器报告见 `C:/Users/lenovo/.codex/visualizations/2026/11/11/01a1cb72-320b-7d10-a686-fcad4d0d7be6/l2p-evidence`。
- 连续播放用 1440×900 实际运行。P4 依次进入六个阶段，冻结运算保留权重，P 和 φ 写回一次，同一图像和标签的教学交叉熵由 0.860 降至 0.773。P5 比较次数从 0 到 10，排序、取用和源池身份一致。`node scripts/check-p5-retrieval.mjs` 退出 0，确认 A 为 [1,2,10,3,9]，B 为 [4,5,3,6,2]，交集为 [2,3]。实播发现共用播放器的第一帧时间戳可能早于启动基准，已把负的帧间隔归零并复测从零启动。
- 响应式专项 PASS。390×844 截图复查了本次涉及的单列节点、配对图、比较图、读取结果与展开 MathML。DESKTOP_WINDOW=PASS，FULLSCREEN_LAYOUT=PASS。FULLSCREEN_REAL=NOT_RUN，本机工具无法确认 Edge 当前地址，因而结束了真实 F11 检查。HUMAN_ACCEPTANCE=PENDING。
- UPSTREAM_SYNTAX=PASS，UPSTREAM_OUTPUT=PASS。PaperSkill 官方 main 为 `1b6e0998e23965dca126665c32669e9a130321b5`，相邻检出为 `4da910afe9054d3a6ff54003023d53ec3de44ac9`。两个检查脚本的内容在统一换行后与官方 main 一致。`node ../PaperSkill/paper-skill/scripts/syntax-check.js <publish_source> --require-parser` 和 `node ../PaperSkill/paper-skill/scripts/validate-output.js <publish_source>` 均退出 0，43 个源码文件使用 TypeScript 解析。W10 官方发布预检仍为 NOT_RUN。

#### P4 排版与文字修整（2026-11-12）

- `SOURCE_BUILD=PASS`：`npm.cmd run build` 退出 0，TypeScript 与 Vite 6.4.3。
- `GEOMETRY_QA=PASS`、`STYLE_QA=PASS`、`BROWSER_ERRORS=PASS`：仅 P4，1440×900 与 1920×1080 两档，初始、前向、损失、反传、写回中和同图复算各检查一次，共 12 个状态。Visual QA 使用安装的 Edge Chromium 157.0.4341.46；Playwright 默认 Chromium 可执行文件未安装。Agent 实看两档截图，公式与损失对照居中，训练卡铺满正文，Trace 明细已删除；节点文字、箭头和参数行未出现挤压或裁切。与用户提供的修改前截图对照，`VISUAL_REVIEW=PASS`、`REGRESSION=PASS`、`FULLSCREEN_LAYOUT=PASS`，`FULLSCREEN_REAL=NOT_RUN`，`HUMAN_ACCEPTANCE=PENDING`。
- 截图与报告：`C:/Users/lenovo/.codex/visualizations/2026/11/11/01a1cb72-320b-7d10-a686-fcad4d0d7be6/l2p-evidence/followup-screenshot-review/p4-report.md`。

#### P5 排版与字形修整（2026-11-12）

- `SOURCE_BUILD=PASS`：P5 修改后执行 `npm.cmd run build`，TypeScript 与 Vite 6.4.3 退出 0。
- `GEOMETRY_QA=PASS`、`STYLE_QA=PASS`、`BROWSER_ERRORS=PASS`：Edge Chromium 157.0.4341.46 在 1440×900 与 1920×1080 检查 P5 配对、A/B 比较、扫描、排序、排名、Prompt 读取和交集，共 20 个状态。Agent 实看两档比较、排名、读取与交集截图，动画卡和交集组已与正文同宽；数学下标字体一致，重点字重已降低，页面无横向溢出或浏览器错误。与用户提供的修改前截图对照，`VISUAL_REVIEW=PASS`、`REGRESSION=PASS`、`FULLSCREEN_LAYOUT=PASS`，`FULLSCREEN_REAL=NOT_RUN`，`HUMAN_ACCEPTANCE=PENDING`。
- 移除重复的“查看排名”“查看读出”按钮和错位的十项距离详情；Visual QA 通过进度条定位排名/读出状态，A/B 读取与选集交集保持原数据和算法。报告及 20 张截图：`C:/Users/lenovo/.codex/visualizations/2026/11/11/01a1cb72-320b-7d10-a686-fcad4d0d7be6/l2p-evidence/followup-screenshot-review/p5-report.md` 和同目录 `p5-screenshots`。

#### P4/P5 本地视口截图复核（2026-11-12）

- 按 P4/P5 两页配置重新截图，Edge Chromium 157.0.4341.46，1440×900 与 1920×1080，DPR 1，共 32 个页面状态。`GEOMETRY_QA=PASS`、`STYLE_QA=PASS`、`BROWSER_ERRORS=PASS`。本轮截图命令没有重跑构建；`SOURCE_BUILD` 结果见上方 P4、P5 记录。
- Agent 逐张检查了 14 张实际视口截图，并复核代表性全页状态。P4 训练卡、同图复算卡与公式/指标按正文网格居中；P5 查询比较、排名读取、A/B Prompt 读取和交集组与正文左右边界对齐；MathML 下标清楚，卡内无横向溢出或文字裁切。`VISUAL_REVIEW=PASS`、`FULLSCREEN_LAYOUT=PASS`。先前记录的修改前后对照仍为 `REGRESSION=PASS`；本轮不重复基线比较。`FULLSCREEN_REAL=NOT_RUN`（headless 视口截图不能验证真实 F11），`HUMAN_ACCEPTANCE=PENDING`。
- 本轮报告：`C:/Users/lenovo/.codex/visualizations/2026/11/11/01a1cb72-320b-7d10-a686-fcad4d0d7be6/l2p-evidence/followup-screenshot-review/self-check/run-2026-11-12T02-57-59-227Z/report.md`。实际视口截图：同目录 `viewport-screenshots`；两档各包含 P4 训练/复算与 P5 比较、排名、A/B 读取、交集截图。


## W10 Official PaperSkill Release

After accepting W9, the user follows the official release steps in `docs/UPSTREAM_RELEASE.md` using the existing PaperSkill checkout. The official Import writes the version there; validate and preflight run in that repository. Codex does not run PaperSkill release commands or perform push/PR actions.

If recording the result, add only the actual command, outcome, and PaperSkill target path:

Official preflight command:

User-reported result: NOT_RUN / PASS / FAIL

PaperSkill target: `html_output/<paper-name>/<version>/`

After the user confirms preflight passed, `python tools/paper.py stage <paper-id> W10 complete` records progress. It does not verify or generate a machine report. The user's push and PR decision happens separately.

## Open Issues

Record unresolved learning, evidence, rights, engineering, accessibility, or release issues.

Overall: PENDING

Overall must be FAIL if any core learning outcome, evidence boundary, or required reuse right fails. Build success cannot override a learning or evidence failure.
