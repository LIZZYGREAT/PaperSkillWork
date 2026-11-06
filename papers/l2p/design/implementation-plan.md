# Implementation Plan: Learning to Prompt for Continual Learning

Paper ID: `l2p`

## Learning Goal and Scope

P1–P3 is the review slice. The reader observes why sequential training can hurt older predictions, traces a patch into the pretrained ViT, then explains why fixed Transformer parameters can still produce different features when the input changes. The slice ends at that question about adding input tokens. W5 remains open for whole-spine coverage.

## Design Handoff, Invariants, and Change Scope

- Design direction follows the user's references. Use the horizontal overview and lower magnification panel from image 2, with the object grouping and labels from image 1. Adapt the figures to the local Kit palette. The two supplied PNGs are composition references. The tutorial drawings are authored locally.
- Approval of the rendered P1–P3 pages is pending with lizzy. W4 fixes the order and meaning of these three pages.
- Keep the same specimen from P1 into P2. In P2 the selected grid cell, enlarged pixels, patch index and embedded token carry one identity. Keep [CLS] visually distinct. P3 opens the encoder stack and retains the names [CLS] and Patch token.
- Keep the warm paper canvas, typography, Editorial header, MathML, semantic green and amber, and Reference drawer. Reserve amber for [CLS], selected positions, and caution with explicit labels. Paper-specific figure layouts live in paper.css.
- Publish source: `C:/Users/lenovo/Desktop/Projects/PaperWork/PaperSkillWork/papers/l2p/web/enhanced`. Use the scaffold React/Vite entry and real tutorial data and component registration for P1–P3. Vite uses relative base. Figures are DOM/SVG and require no external runtime requests or assets.

### Page compositions

| Page | First reading view | Lower detail | Reading exit |
| --- | --- | --- | --- |
| P1 | Sequential task rail above a shared classifier. Two snapshots retain the same specimen and classifier position. | Old prediction before/after, explicit synthetic scores and one unified candidate space. Compact protocol notes. | Freeze the pretrained feature model and ask what it computes. |
| P2 | Image → patches → linear embedding → token sequence → 12 blocks → output and ordinary readout. Name the scopes of fₑ and fᵣ. | Select a patch in the 14×14 grid. The magnification and matching sequence index follow. Show flattening and 197×768 separately. | Open one Encoder Block to explain context. |
| P3 | A Pre-LN block at full width with two visible bypasses and Z, U, Z′. | One head follows fixed projections, scaled scores, Softmax and Value aggregation. Show head concatenation. Compare the same target with and without an extra input token. | Fixed parameters still respond to input changes. |

### Critical Teaching Scenes

| Scene | Initial state | Trigger and intermediate state | Observable result | Protected meaning |
| --- | --- | --- | --- | --- |
| P1 task transition | Same old test image after task 1 with θ₁ | Select task 2. A distinct class batch updates the same network to θ₂. | New predictions in the cumulative class space. Both snapshots stay visible. | Synthetic probabilities are illustrative. Testing has no task ID. |
| P2 patch trace | 224×224 specimen with one active cell | Pick a cell or move the patch slider. The image grid and crop use the same row and column. | Matching 1-based patch token position, with [CLS] at position zero. | 196 patch positions and 197 total positions. Shape width is 768. |
| P3 attention | Fixed 2D toy tokens, one selected target, one head | Select a target or add an extra token. Compute scaled scores from Q and K, normalize across present sources, and aggregate V. | Show computed weights and output, alongside the same target's output without the extra token. | Keep all original toy tokens and projection weights fixed. This is a forward pass through one toy head. The Pre-LN overview separately describes the full block. |

## Visual QA State Plan

Review each page at 1440×900 and 1920×1080. Observe P1 both snapshots, P2 patch selection and overflow, and P3 default and extra-token states. Check keyboard access and how the wide figures wrap at narrow widths.

## Primary Spine Mapping

\`\`\`yaml
implementation:
  stages:
    - id: P1
      page: "连续学习的约束"
      core_items: [I01, I02, I03]
      evidence_refs: [C01, C02, C10, C11]
      primary_vehicle: "共享分类器与任务时间线"
      reason: "同一旧图贯穿参数变化与统一预测"
    - id: P2
      page: "ViT 从图像到特征"
      core_items: [I04, I05]
      evidence_refs: [C02, C04, C12, B01, B02]
      primary_vehicle: "整体架构图与同步 Patch 放大"
      reason: "同时呈现模块边界与位置对应"
    - id: P3
      page: "打开 Transformer Encoder"
      core_items: [I06, I07]
      evidence_refs: [B03, C02, O01]
      primary_vehicle: "Block 走线与可复算的注意力场景"
      reason: "用同一计算模型显示输入改变造成的变化"
  assets: []
  supporting:
    - item: I29
      placement: "P1 Split CIFAR-100 说明"
    - item: I30
      placement: "P1 协议边注"
  reference:
    - item: I38
      placement: "Reference Hub / 缩放点积注意力"
  vertical_slice:
    stages: [P1, P2, P3]
    required_core_items: [I01, I02, I03, I04, I05, I06, I07]
\`\`\`

## Vertical Slice (W6)

The three-page review slice uses authored diagrams and a synthetic specimen. Its observable conclusion is the difference between fixed weights and fixed output. Whole-spine W5 and formal W6 completion are separate workflow checkpoints.

### Review build and checks

The development-only Kit preview was rendered from its local source in headless Chromium. The warm canvas, heading treatment, MathML and Reference are present. The paper stylesheet adjusts title spacing, the opening ornament margin, and diagram layouts. The approval package is a single offline HTML file assembled from the production JavaScript and CSS.

| Check | Status | Evidence |
| --- | --- | --- |
| SOURCE_BUILD | PASS | `npm.cmd run build` exited 0. The local dependencies came from the DER workspace with an identical package lock because npm registry access was unavailable. |
| SUBPATH_ASSETS | PASS | Headless Chromium loaded the production output under a simulated `/review/l2p/` path. Both relative JS and CSS requests resolved, and P3 rendered. |
| UPSTREAM_SYNTAX | NOT_RUN | Current upstream could not be fetched due to the SSH process restriction. The local `syntax-check.js <publish_source> --require-parser` exited 0 using TypeScript. |
| UPSTREAM_OUTPUT | NOT_RUN | Same freshness limitation. The local `validate-output.js <publish_source>` exited 0 and found three registered chapters and modules. Both local script blobs match cached `upstream/main` at `910adc1f0d056841303710892ba668af00396728`. |

Chromium covered 1440×900 desktop, 1920×1080 fullscreen layout simulation and a 390×844 layout because the diagrams are wide. The checks exercised the P1 snapshot switch, P2 grid and keyboard slider, P3 target and extra token, the Reference close action, and horizontal overflow. Actual F11 fullscreen: NOT_RUN in the headless review. Human acceptance: PENDING.

### P1–P3 revision for approval

The user requested stronger visual detail, more complete diagrams and deeper explanation while keeping the Kit theme. The P1–P3 source plan supplied with this feedback matches the project copy.

| Page | Revision and semantic alignment |
| --- | --- |
| P1 | Separate the arrival of training tasks, shared parameter inheritance, fixed old test image and joint prediction space. The classifier glyph preserves its structure across snapshots. Example scores are synthetic. One failed prediction illustrates interference; aggregate old-task degradation defines forgetting. |
| P2 | Recreate the reference composition with a horizontal image-to-output overview and a lower Pre-LN Block cutaway. The same authored bird artwork feeds all 196 separated tiles. Selected patch index, crop bounds and sequence position share one state. Explain raw pixel count, embedding width, position vectors, the extra [CLS] position, the frozen fₑ/fᵣ boundary and the ordinary ViT readout separately. |
| P3 | Make the Query-to-Key and weighted Value routes visible, show dot product, normalization and weighted sum from the same state, then diagram head concatenation and two inputs with fixed weights. Separate the typical complete block from the numeric toy head. The extra token does not change the earlier scores for the retained target in this example, but adds a term to the denominator and weighted sum. |

Production build and cached upstream syntax/output checks passed. Browser screenshots and interaction checks used 1440×900, 1920×1080 and 390×844 in Chromium. Verified the 196 tiles and gutters, first and last crop bounds, selected index agreement, unchanged input image in P1, and independent recomputation of P3 weights and output. This pass remains pending human approval. Latest upstream and real F11 status carry the limitations above.

### Motion and layout revision for approval

The three pages now use a centered reading column and wider stages for diagrams. Lesson controls allow playback, pause, seeking and restart. With reduced motion enabled, Play reveals the result immediately and individual steps remain inspectable.

| Scene | Initial, intermediate and final states | Protected meaning |
| --- | --- | --- |
| P1 classifier | A tall 3→5→5 diagram holds its geometry as pulses traverse 15 first-layer and 25 second-layer edges. Selecting the other training snapshot resets the playback and switches the edge treatment. | This network shows the shared structure schematically. The scores are separate illustrative snapshots and do not come from these pulses. |
| P2 flattening | Sample all 16×16 RGB pixels from the selected image crop. Separate the three channel planes, then move each of the 768 items from its channel plane into index 3(16r+c)+k. Wrap the single vector in groups of 48 for display. | Each source value keeps its identity and value through flattening. Changing the Patch recomputes values and resets playback. |
| P2 projection | The flat vector compresses into the input view. The three nonzero contributions to output coordinate zero travel along their own paths into the matrix. The output reveals the 768 projected values. | The displayed matrix excerpt and dot product use the same illustrative coefficients. A real ViT uses learned projection weights. The illustration uses zero bias and circular indexing. |
| P3 attention | Pulses follow Q-to-Key paths. During normalization, each aggregation line grows to the width associated with its weight. Weighted Value pulses then converge on the fixed target output. | The same scores, weights and sum drive the visual and table. Changing the target or adding a token resets the timeline. |

The production build and workflow structure check passed. Chromium checks covered 1440×900, 1920×1080 and 390×844. Screenshots include the network during propagation, Patch unfolding and final projection, and Value aggregation. Verified intermediate coordinate movement, playback pause and seek, source index agreement, the rounded projection arithmetic, centered prose and the reduced-motion path. Human review remains pending.

### Vertical Slice Review (W7)

Vertical Slice Review: PENDING

- Reviewer (latest round):
- Latest decision: PASS / REVISE
- Can the reviewer explain why the mechanism is introduced at this point?
- Can the reviewer accurately explain the slice's key operation and one complete information/state flow?
- Do prose and graphics work together to establish the conclusion?
- Does the slice hand off naturally to the next part?
- Was any key explanation hidden in hover or omitted?
- Were any formulas, toys, or interactions unnecessary?
- Required information-architecture changes:

| Review round | Human decision and feedback | Affected slice and approved content to preserve | Changes made and any explicit design reconfirmation | W6-scope commands/results and NOT_RUN checks | Follow-up human review |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

If a review is REVISE, retain that decision in this history. Record the affected scope and protected approvals, repair the slice, rerun W6-scope build/interaction/visual checks, then ask a person to review again. “Repeat W6” means repeat the checks; do not call `stage ... W6 complete` again or reset W4/W5 in `paper.yaml`. If the repair changes W4's core order or reasoning, first record the user's explicit reconfirmation and affected stages. W7 may be marked complete only after a human PASS, with that reviewer's details. W7 does not require the later complete-algorithm integration scene to be finished; its full teaching effect is checked during W8 and formally accepted at W9.

## Full Implementation (W8)

List the remaining CORE stages to complete. List compact placements for SUPPORTING material and the Reference Hub/advanced locations for REFERENCE. Confirm DELETE items stay out. Identify the complete-algorithm integration scene and the semantic moments, state assertions, representative initial/intermediate/final views, and handoff checks needed to verify it against W2 and W4.

Resolve the final source path from the absolute `publish_source` field in `python tools/paper.py paths <paper-id> --json`; it must be the same source intended for W10. Install that source's dependencies from its existing lockfile before checks (`npm ci` when it has a package lock); the official syntax checker discovers TypeScript/esbuild under the target source. Record the actual PaperSkill `upstream/main` SHA, whether both executed checker files match it, commands, exit codes, tool versions, and log/evidence locations. Rerun affected checks after any later source change. W8 `stage ... complete` means structural coverage only; it is not an engineering-quality PASS.

| W8 check | Status (PASS / FAIL / NOT_RUN) | Actual command and exit code, checker SHA/tool version, evidence/log, and notes |
| --- | --- | --- |
| `UPSTREAM_SYNTAX` (`--require-parser`) |  |  |
| `UPSTREAM_OUTPUT` (include warnings and interpretation) |  |  |
| `SOURCE_BUILD` (actual project production build) |  |  |
| `SUBPATH_ASSETS` (built output and browser network at deployed subpath) |  |  |

## Human Acceptance Record

Keep the original approved decisions, later user reconfirmations, affected stages, changed invariants, and required W7/W9 re-reviews here; do not create duplicate review documents or manually reset completed workflow states. If a W8/W9 finding requires changing an approved W4/W5 decision, first state the impact and review scope, obtain the relevant human reconfirmation, and revisit affected learning acceptance before claiming PASS.
