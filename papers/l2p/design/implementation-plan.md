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

### P4–P6 scoped design handoff

P1–P3 are approved by the user. This extension covers only P4–P6; P7–P9 remain outside the current request, so whole-spine W5 coverage stays open. Preserve the existing Editorial Kit shell, reading measure, warm paper canvas, green/amber semantics and MathML. Add a restrained plum token color for Prompt values, muted blue for frozen modules, and teal for retrieval Keys; labels and shape also carry meaning. Draw all new figures locally in DOM/SVG.

| Page | Primary reading path | Lower detail | Reading exit |
| --- | --- | --- | --- |
| P4 | Reuse the P2 image-token language. Insert one five-token Prompt before `xₑ`; show sequence length changing while width remains `D`. | Controlled five-state loop: insert → frozen forward → classification loss → gradients pass back through the frozen computation → update `P` and `φ`, while `fₑ` and `fᵣ` values stay fixed. A compact continuation shows task B can update the same Prompt, creating possible parameter conflict. | Ask how multiple prompts can be selected for an input. |
| P5 | A real-shape `M=10` Key–Prompt pool: ten indexed pair units, each with a distinct Key vector and a visibly longer `Lₚ=5` token sequence. An input with no task ID produces `q(x)` through the frozen no-Prompt ViT. | One shared computed retrieval model animates distance comparisons, ranking, selection and a read-view copied from the pool. Toggle two queries to compare overlap while the ten source units remain present. | Pass query A's selection to P6. |
| P6 | One image and one frozen backbone identity support two calls: no-Prompt `[CLS]` retrieval, then selected-Prompt classification. Show pool lookup and image embedding as sibling inputs to one expanded sequence. | Animate the selected prompts joining `xₑ`, passage of every position through `fᵣ`, and a bracket that reads only the first `N Lₚ` output positions into `AvgPool → gφ → logits`. A dimension strip tracks `M`, `N`, `Lₚ`, `L` and `D` independently. | Ask how the selected Prompts and Keys learn, for P7. |

#### Protected P4–P6 semantics and example values

- P4's single Prompt is an explicitly simplified teaching bridge, not the full L2P method or a guaranteed forgetting result. Use an abstract `h(P,x)` readout here; reserve the official prompt-position mean for P6. Classification gradients pass through the frozen Transformer computation to trainable inputs, but the backbone parameters do not update.
- P5's Query/Key matching is external to Transformer attention. A Key only identifies its paired Prompt; it is not concatenated into the Transformer. Top-N is per input, the pool persists after a read, and no task ID is used.
- P5 uses a deterministic two-dimensional unit-circle example solely to make ten cosine distances re-computable: `kⱼ=(cos(36° · (j−1)), sin(36° · (j−1)))`; `q_A=(1,0)`; `q_B=k₄`. The distance labels are generated as `1−q·k/(‖q‖‖k‖)`, rounded to three decimals. With `M=10,N=5`, `S(x_A)={1,2,3,9,10}` and `S(x_B)={2,3,4,5,6}`, sharing `{2,3}`. Label these values as a two-dimensional teaching example, not paper measurements or actual learned embeddings. The ten slots, `N=5` and `Lₚ=5` match the paper's CIFAR-100/CORe50 configuration; other dataset settings differ.
- P6 follows the same `x_A` and `S(x_A)` from P5. For the Split CIFAR-100/CORe50 ViT-B/16 dimension check, use `L=197`, `D=768`, `M=10`, `N=5`, `Lₚ=5`; therefore `N Lₚ=25` and `xₚ,H∈ℝ^(222×768)`. Pool only `H[0:25,:]`, yielding one `768`-wide feature for `gφ`. Do not classify the no-Prompt `[CLS]` query or average all 222 outputs.
- P6 stops at forward logits. Do not animate losses, Key learning, gradient updates, or P7's minibatch update here.

#### Motion thesis and review states

The motion purpose is explanation and spatial continuity: the learner starts, pauses, seeks, or resets the visible computation; each score, selected slot and read Prompt derives from the same state. Retain the existing explicit playback controls and reduced-motion behavior. P4 animates gradient flow separately from parameter updates. P5 compares candidates in pool order, then outlines Top-N and makes a temporary read-copy while leaving the pool in place. P6 reuses P5's exact selected indices and animates both shared-weight calls without depicting two independently trained backbones. Keep positions, identities, labels and formulas readable while moving; no section-entry decoration or autoplay.

Review P4 before/after update and task-B states, P5 query A/B comparison and Top-N/read states, and P6 initial, merge, encoded, pooled and logits states. Check the same selected indices and computed distances across P5–P6, native MathML structure, token-count arithmetic, endpoints and overlap at 1440×900 and 1920×1080. The three new page components and their figures are within scope; previously approved P1–P3 scene code and W4 order are protected. Page work may be committed separately; no W5 whole-spine or W7 acceptance is implied by those commits.

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

### Follow-up on layout, projection and multi-head motion

- P1–P3 text uses the full editorial width and aligns left. Diagrams, their internal compositions and playback controls can center independently.
- P1 now uses a 3→5→3 schematic with 30 connections. Green denotes the first snapshot and warm brown the second, including the matching propagation pulses.
- P2 first finishes flattening and moves the vector into the left input region. The matrix fades in after that region settles. Three color-matched trails connect x[0], x[1] and x[3] to their coefficients, then converge at a visible sum before the output is revealed.
- P3 animates a worked example of three two-coordinate Head outputs for the same position. The six values keep their order and color during concatenation. The illustrated 6×6 output projection is computed from the shown coefficients. Typical ViT-B/16 width remains 12×64 = 768.
- Revision checks used production Chromium at 1440×900, 1920×1080 and 390×844. Checked copy width and alignment, graph layers and edges, visible travel at intermediate positions, sample arithmetic, playback and reduced motion. Reviewed screenshots of the projection trails and multi-head result. Human approval remains pending.

### Formula rendering and motion finishing pass

Native MathML now renders the Q/K/V projections, scaled score, Softmax, weighted Value sum, positional indices and projection arithmetic. The Patch diagram uses HTML MathML labels above the canvas and a larger summation node. The contribution pass takes 2.2 seconds and the output pass 1.64 seconds, twice their prior durations. Three guide lanes pass above the input grid and turn only in the gap before the matrix.

In the multi-head animation, all three traveling points reach the first cell edge at x = 182 before fading in place. The block diagram reserves more height for the larger multi-head glyph. Production Chromium verified the Head contact and fade frames, MathML structures, the first projection calculation, pause and seek, and layout at 1440×900, 1920×1080 and 390×844. Screenshot review confirmed the clear projection lanes and the larger summation and multi-head objects.

### Patch path refinement

The three projection guides now use tangent-aligned curves. Traveling trails follow sampled arc length, keeping spacing through the bend and arriving at the same matrix coefficients. RGB plane sizes, flattened index bounds, multiplication labels, vector dimensions and the sum are native MathML overlays in their respective timeline states. Production screenshots cover the channel planes, flat vector, moving trails and output, with the numerical projection and playback checks repeated.

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

### P4 implementation and visual check

P4 is registered as the frozen-backbone Prompt-tuning chapter. Production `npm.cmd run build` passed (exit 0). Chromium screenshots at 1440×900, 1920×1080, and 390×844 were inspected, including the gradient-return midpoint and next-task reuse state. The 197-position input, unchanged width, trainable `P` and `φ`, frozen `fₑ`/`fᵣ`, and simplified readout remain aligned with the approved bridge. No horizontal overflow or browser errors; MathML rendered with 8 expressions and no unresolved `mspace` width. Evidence: `C:/Users/lenovo/.codex/visualizations/2026/11/06/01a1b173-46d3-7612-a26d-751babb3eea0/P4-1440.png`, `P4-1920.png`, `P4-390.png`, `P4-gradient-1440.png`, and `P4-task-b-1440.png`. Human learning review remains pending.
