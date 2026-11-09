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

P1–P3 are approved by the user. This handoff initially covered P4–P6. On 2026-11-08, the user expanded implementation scope to P7–P9 using the supplied teaching and visual-design plans; the page-level handoff below records those additions. Whole-spine W4/W5 and human-review workflow status remain governed by their existing records and are not changed by implementation commits. Preserve the existing Editorial Kit shell, reading measure, warm paper canvas, green/amber semantics and MathML. Add a restrained plum token color for Prompt values, muted blue for frozen modules, and teal for retrieval Keys; labels and shape also carry meaning. Draw all new figures locally in DOM/SVG.

| Page | Primary reading path | Lower detail | Reading exit |
| --- | --- | --- | --- |
| P4 | Reuse the P2 image-token language. Insert one Prompt group containing two learned Prompt Tokens (`P₀`, `P₁`) before `xₑ`; show sequence length changing while width remains `D`. | One controlled loop: input → frozen forward → classification loss → gradients pass back through the frozen computation → one update to `P` and `φ` → same-input re-forward. A compact continuation raises possible shared-Prompt interference in task B without inventing its trajectory. | Ask how multiple prompts can be selected for an input. |
| P5 | A real-shape `M=10` Key–Prompt pool: ten indexed pair units, each with a distinct Key vector and a visibly longer `Lₚ=5` token sequence. An input with no task ID produces `q(x)` through the frozen no-Prompt ViT. | One shared computed retrieval model animates distance comparisons, ranking, selection and a read-view copied from the pool. Toggle two queries to compare overlap while the ten source units remain present. | Pass query A's selection to P6. |
| P6 | One image and one frozen backbone identity support two calls: no-Prompt `[CLS]` retrieval, then selected-Prompt classification. Show pool lookup and image embedding as sibling inputs to one expanded sequence. | Animate the selected prompts joining `xₑ`, passage of every position through `fᵣ`, and a bracket that reads only the first `N Lₚ` output positions into `AvgPool → gφ → logits`. A dimension strip tracks `M`, `N`, `Lₚ`, `L` and `D` independently. | Ask how the selected Prompts and Keys learn, for P7. |
| P7 | Two P5-derived sample lanes feed distinct classification and matching losses above one persistent ten-slot Key–Prompt pool. | Gradient objects travel to their direct targets; shared selections retain A/B provenance, untouched slots remain visible, and the batch crosses one explicit update boundary. A separate, numerically recomputed SGD Key example stays labeled as a teaching calculation. | Hand the updated parameter-state idea to P8. |
| P8 | Keep one pool and one shared classifier centered as the same model moves along initialization → batches → task boundary → next task → inference. | Stage controls advance one persistent system; the current batch changes, selected indices are recomputed from the current Key state, and only batch completion advances the parameter version. Training and no-label/no-loss inference are distinct modes. | Ask whether dynamic sharing helps and when an optional selection rule is useful. |
| P9 | A compact Eq. (3)/Eq. (4) scoring comparison leads into a separate paper-evidence workbench. | One fixed Query/Key snapshot recomputes `γ`, normalized history frequency, `γh`, ranking and selection. Distinct evidence views keep Table 5 ablations, Table 1 average accuracy/forgetting, and Table 3/4 test accuracy in their reported protocols. | Answer P1 with scoped experimental evidence and limitations. |

#### Protected P4–P6 semantics and example values

- P4 is an explicitly simplified teaching bridge, not the full L2P method or a paper result: one Prompt group has two trainable positions (`P₀`, `P₁`), the input has two fixed image-token positions, the forward model is one frozen single-head self-attention, and a learned binary classifier reads the mean of the two Prompt outputs. This mean is a teaching readout; the full Prompt Pool retrieval and formal classification path remain in P5/P6. In the full-width P2 ViT-B/16 reference, two added Prompt Tokens change `197×768` to `199×768`; the visible low-dimensional Trace uses `Lₚ=L=D=2`. Classification gradients pass through the frozen computation, but only `P` and `φ` update. Show one SGD step without implying every step lowers loss, and describe task-B interference only as a possibility without simulating task B.
- P5's Query/Key matching is external to Transformer attention. A Key only identifies its paired Prompt; it is not concatenated into the Transformer. Top-N is per input, the pool persists after a read, and no task ID is used.
- P5 uses a deterministic two-dimensional unit-circle example solely to make ten cosine distances re-computable: Key angles are `[4°,36°,71°,109°,147°,184°,219°,258°,296°,333°]`, `q_A` is at `12°`, and `q_B` is at `116°`. Compute `γ(q,k)=1−cos θ` for each Key, then select the five least-distance indices. In ascending-distance display order, A yields `[1,2,10,3,9]`; B yields `[4,5,3,6,2]`; the shared set is `{2,3}`. These are pedagogical vectors, not learned embeddings or paper measurements. The ten slots, `N=5` and `Lₚ=5` match the paper's CIFAR-100/CORe50 configuration; other dataset settings differ.
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

Review each page at 1440×900 and 1920×1080. Observe P1 both snapshots, P2 patch selection and overflow, and P3 default and extra-token states. Check keyboard access and how the wide figures wrap at narrow widths. For P7–P9, capture meaningful in-flight and completed states, inspect the same object identities across transitions, verify P7's batch boundary, P8's inherited pool and inference mode, and P9's recomputed Eq. (3)/(4) rankings plus accurately labeled paper evidence.

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
| `UPSTREAM_SYNTAX` (`--require-parser`) | NOT_RUN | Current upstream freshness could not be verified: SSH fetch failed with a Windows process permission error; HTTPS fetch failed DNS resolution. Local diagnostic passed: `node ..\PaperSkill\paper-skill\scripts\syntax-check.js papers/l2p/web/enhanced --require-parser` (exit 0; TypeScript, 27 files). PaperSkill checkout HEAD `4da910afe9054d3a6ff54003023d53ec3de44ac9`; cached `upstream/main` is `910adc1f0d056841303710892ba668af00396728`. Executed checker blob matches cached `upstream/main` (`2bcfa6f…`). Node `v24.18.0`. |
| `UPSTREAM_OUTPUT` (include warnings and interpretation) | NOT_RUN | Same freshness limitation. Local diagnostic passed: `node ..\PaperSkill\paper-skill\scripts\validate-output.js papers/l2p/web/enhanced` (exit 0): 6 chapters/modules, all registered, 27 files parse; no placeholder warnings. Validator blob matches cached `upstream/main` (`9ec76b6…`). This is local evidence, not a current-upstream PASS. |
| `SOURCE_BUILD` (actual project production build) | PASS | `npm.cmd run build` (exit 0), TypeScript plus Vite `6.4.3`; 56 modules built. |
| `SUBPATH_ASSETS` (built output and browser network at deployed subpath) | NOT_RUN | Visual QA runner could not capture: attempts on `4173` exited before readiness; attempt on `4174` timed out with `fetch failed` in this sandbox. Reports: `.visual-qa/run-2026-11-07T03-03-16-367Z/report.md`, `.visual-qa/run-2026-11-07T03-04-06-859Z/report.md`, `.visual-qa/run-2026-11-07T03-04-34-282Z/report.md`. Offline production screenshots and layout checks passed, but do not prove deployed subpath asset resolution. |

## Human Acceptance Record

Keep the original approved decisions, later user reconfirmations, affected stages, changed invariants, and required W7/W9 re-reviews here; do not create duplicate review documents or manually reset completed workflow states. If a W8/W9 finding requires changing an approved W4/W5 decision, first state the impact and review scope, obtain the relevant human reconfirmation, and revisit affected learning acceptance before claiming PASS.

### P4 implementation and visual check

P4 is registered as the frozen-backbone Prompt-tuning chapter. Production `npm.cmd run build` passed (exit 0). Chromium screenshots at 1440×900, 1920×1080, and 390×844 were inspected, including the gradient-return midpoint and next-task reuse state. The 197-position input, unchanged width, trainable `P` and `φ`, frozen `fₑ`/`fᵣ`, and simplified readout remain aligned with the approved bridge. No horizontal overflow or browser errors; MathML rendered with 8 expressions and no unresolved `mspace` width. Evidence: `C:/Users/lenovo/.codex/visualizations/2026/11/06/01a1b173-46d3-7612-a26d-751babb3eea0/P4-1440.png`, `P4-1920.png`, `P4-390.png`, `P4-gradient-1440.png`, and `P4-task-b-1440.png`. Human learning review remains pending.

#### Screenshot correction: P4 formula and parameter typography

The user marked undersized formulas, pseudo-subscript text, and crowded loss labels in the P4 animation and explanation. The loss and gradient expressions now use native MathML with explicit grouping; the explanatory qualifier is separate from the equation. Gradient endpoints, encoder notation, and parameter-before/after values are typeset rather than encoded as Unicode superscripts. Increased the minimum sizes for diagram labels and formulas while keeping the Kit face and responsive stack. The production build passed, and the 1440×900, 1920×1080 and 390×844 screenshots were inspected with the loss, gradient-return and shared-parameter states. Checked formula containment and no horizontal overflow, browser errors, or unresolved `mspace` widths. Evidence: `C:/Users/lenovo/.codex/visualizations/2026/11/06/01a1b173-46d3-7612-a26d-751babb3eea0/P4-figure-detail.png`, `P4-equations-detail.png`, `P4-shared-detail.png`, and `P4-equations-390-detail.png`.

### P5 implementation and visual check

Initial implementation record (example outputs superseded by the dated retrieval-geometry revision below): P5 adds a ten-slot Key–Prompt pool, an input-generated Query, cosine-distance comparison, ascending ranking, Top‑N selection, and a temporary read view. The two unit-circle queries recompute from one data model: A ranks and selects `[1, 2, 10, 3, 9]`; B selects `[4, 3, 5, 2, 6]`; both share `{2, 3}`. These remain labeled as teaching values, not learned embeddings or paper measurements. Production `npm.cmd run build` passed (exit 0). Chromium screenshots at 1440×900, 1920×1080, and 390×844 were inspected, including the halfway comparison, ranking, and both query read states. Comparison bars change continuously with the seek position; the ordered rows reveal progressively; all ten source slots remain while five Prompt copies appear. The page has no horizontal overflow or browser errors; MathML rendered with 9 expressions and no unresolved `mspace` width. Body contrast is 14.03:1 and small figure text is at least 5.57:1. Evidence: `C:/Users/lenovo/.codex/visualizations/2026/11/06/01a1b173-46d3-7612-a26d-751babb3eea0/P5-1440.png`, `P5-1920.png`, `P5-390.png`, `P5-query-a-read-1440.png`, `P5-query-b-read-1440.png`, `P5-state-comparison-1440.png`, `P5-state-ranking-1440.png`, and `P5-state-read-1440.png`. Human review remains pending.

#### Screenshot correction: P5 selection and sequence punctuation

The user marked the two query selections and the read-copy separators as cramped or misaligned. The A/shared/B summary is now a three-group layout with proper MathML subscripts, and it stacks in reading order on narrow screens. Each semicolon now sits between Prompt groups and aligns to the token row instead of occupying a hidden third row inside a Prompt group. The production build passed; 1440×900, 1920×1080 and 390×844 views were inspected, including both query results and the read sequence. Confirmed the indices still match the computed ranking, the 5×5 token groups remain distinct, text does not collide, and there is no horizontal overflow or browser error. Evidence: `C:/Users/lenovo/.codex/visualizations/2026/11/06/01a1b173-46d3-7612-a26d-751babb3eea0/P5-overlap-detail.png`, `P5-read-detail.png`, `P5-overlap-390-detail.png`, and `P5-read-390-detail.png`.

### P6 implementation and visual check

P6 follows Query A's exact P5 result `[1, 2, 10, 3, 9]` through the classification call. It shows the no-Prompt retrieval call and Prompt-conditioned classification call sharing one frozen parameter identity, concatenates 25 Prompt positions before 197 image positions, and carries the full `222 × 768` output sequence through the encoder. Readout explicitly slices `H[0:25, :]`, pools only those 25 positions to one 768-dimensional vector, then shows the shared classifier's logits without invented scores. The Key is labeled as retrieval-only and is never inserted into the sequence.

Production `npm.cmd run build` passed (exit 0; TypeScript + Vite 6.4.3). Chromium production screenshots at 1440×900, 1920×1080, and 390×844 were inspected, along with composition, encoder, pooling, and logits states. Checks confirmed five selected Prompt groups with 25 positions, 25 readout cells, `197 + 25 = 222`, output dimensions `222 × 768`, and the exclusion of `[CLS]`/Patch outputs from pooling. There was no horizontal overflow or browser error; 10 native MathML expressions rendered with no unresolved `mspace` widths. Body contrast is 14.03:1 and small figure text is at least 9.68:1. The Impeccable detector reported no findings across the P4–P6 module components/styles. Evidence: `C:/Users/lenovo/.codex/visualizations/2026/11/06/01a1b173-46d3-7612-a26d-751babb3eea0/P6-1440.png`, `P6-1920.png`, `P6-390.png`, `P6-state-compose-1440.png`, `P6-state-encoder-1440.png`, `P6-state-readout-1440.png`, and `P6-state-logits-1440.png`. Human learning review remains pending; W5 whole-spine coverage and W7/W8 workflow acceptance are not implied by this scoped implementation.

### P1–P6 reading-hierarchy revision (2026-11-07)

The user requested a full-spine copy and hierarchy pass. Existing six-page screenshots were inspected first. The revision keeps the approved teaching order and claims while adding selective Kit-semantic emphasis and compact reading objects:

- P1 distinguishes sequential-task arrival, the missing-old-image constraint, and the aggregate evidence needed to call a result forgetting.
- P2 contrasts the 768 raw pixel-channel values in a flattened Patch with the 768 learned embedding coordinates, then emphasizes that 197 is sequence positions and 768 is feature width.
- P3 gives Q, K, and V separate one-line role descriptions before the worked attention figure.
- P4 surfaces the distinction between gradients passing through a frozen computation and backbone parameters being updated.
- P5 emphasizes that retrieval Keys stay outside Transformer input and separates the example's takeaway from its limits.
- P6 presents retrieval and classification as two calls over the same frozen weights, then emphasizes Prompt-position pooling.

The production build passed after all six pages were updated (`npm.cmd run build`, exit 0; TypeScript + Vite 6.4.3); `git diff --check` reported no whitespace errors. Screenshot recapture and post-edit visual/responsive inspection for that full-spine hierarchy edit are **NOT_RUN**: the bundled Playwright Chromium executable was unavailable, and the browser safety policy rejected opening the local `file://` preview, explicitly disallowing alternate browser paths. The pre-edit screenshots are only a baseline, not verification of that revised render. Updated-render visual review remains pending. No workflow stage, W7 decision, or human approval status was changed. The subsequent P5-specific screenshot review is recorded below.

### P5 retrieval geometry revision (2026-11-07)

After reading the paper's retrieval definition and the supplied page-revision brief, P5 now models its teaching example from one shared source: a frozen, no-Prompt ViT produces the image's final-layer `[CLS]` feature `q(x)`; that query is compared with all ten learned Key vectors using cosine distance `γ(q,k)=1−cos θ`; the five least-distance Key indices address their paired Prompt sequences. Keys stay outside Transformer input and no task ID participates. The ascending table is a legible presentation of the selected set, not a claim that the paper requires ranked Prompt concatenation. The example's fixed angles are `[4°,36°,71°,109°,147°,184°,219°,258°,296°,333°]`, with Query A at `12°` and B at `116°`. It yields A `[1,2,10,3,9]`, B `[4,5,3,6,2]`, and shared `{2,3}`. These are re-computable two-dimensional teaching values, not learned embeddings or reported paper measurements.

The authored figure follows the supplied composition as a teaching aid: input-to-query flow, a unit-circle angle comparison, the full distance ledger, the persistent Key–Prompt pool, the temporary selected read view, and a two-query overlap summary. Comparison and ranking derive from the same immutable selection snapshot; the pool slots remain in source order while score rows are ranked. P6 continues to consume Query A's existing selection `[1,2,10,3,9]`; no P6 page code changed.

Verification: the retrieval invariant script passed for both selections, shared indices and the worked `q_A`–`k₂` score (`γ≈0.086`); the production TypeScript/Vite build passed; and the Impeccable detector returned no findings. The local Edge Visual QA runner passed all 14 P5 captures at 1440×900 and 1920×1080, with no horizontal overflow, semantic-text warnings or browser errors. I visually inspected the vector/angle, in-progress comparison, ranking and read-view captures. A real interactive F11 review was **NOT_RUN**; the 1920×1080 capture is a viewport simulation. W7/human learning acceptance remains pending, and this scoped P5 check does not close W5 or change other workflow status.

### P5 control placement and continuous orbit revision (2026-11-07)

The user reported that the timeline controls were too far below the retrieval figure, the Query arrow was heavy, and candidate changes felt like discrete switches. The A/B selector, six phase stops, play/pause, seek, reset and explanation now share a sticky toolbar immediately above the Query flow and vector/ledger figure. Setting the figure to `overflow: clip` preserves its rounded clipping while allowing the toolbar to stick to the viewport; the toolbar sits below the site header.

Candidate traversal now follows the persistent pool order `k₁ → k₂ → … → k₁₀`. A single highlighted bead travels between Key points with the shared `ease-in-out` curve, arrives and holds, then the smallest-angle arc is drawn over 235 ms after a 70 ms arrival pause. The current score is revealed after that arc completes. During travel, the prior completed Key stays active and the approaching Key is marked separately. The Query vector shaft is 1.8 px with a smaller marker. The opening worked comparison is now `q_A`–`k₁`: `θ=8°`, `γ≈0.010`; all values still come from the same retrieval model and the final A/B selections remain unchanged.

Verification: production build and the P5 retrieval invariant script passed. The final Edge Visual QA run passed all 16 P5 captures at 1440×900 and 1920×1080, including the in-flight `k₁→k₂` and arrived-at-`k₃` angle-drawing states; there were no geometry errors, style failures, semantic-size warnings or browser errors. Computed checks confirmed sticky positioning, `overflow: clip` and the thinner Query arrow. I also captured a normal 1440×900 viewport after scrolling to the diagram: at `scrollY=970`, the sticky dock top was 86 px, immediately below the 87 px site-header bottom, while the vector diagram remained visible. Impeccable reported no findings. A real interactive F11 review remains **NOT_RUN**; human learning acceptance/W7 remains pending.

### P4 parameter experiment revision (2026-11-07)

P4 now uses one deterministic, low-dimensional teaching model: two learnable Prompt tokens and two fixed image tokens enter a single frozen self-attention head; the mean of the two Prompt output positions is explicitly labeled as the simplified P4 readout. The same forward graph produces the attention row, hidden readout, two-class Logits, Softmax and cross-entropy. A local reverse-mode scalar tape computes gradients for every Prompt coordinate and classifier parameter while the Attention matrices and image embeddings remain fixed. An independent central-difference check reports maximum absolute Prompt-gradient error `8.46e-11` (`ε=1e-6`). With `η=0.12`, the displayed SGD update recomputes the same input and frozen head from the updated Prompt/classifier; this particular teaching example changes loss from `0.860253` to `0.772918`, without claiming that arbitrary updates always lower loss. The task-B handoff retains the same Prompt identity and does not invent a second task's data or result.

The phase dock now sits immediately above the workbench and remains below the site header while the long figure scrolls. Gradient values appear only after loss backpropagation. The update phase interpolates the displayed parameter coordinates and recalculates the current attention, Logits and loss from those coordinates; the note distinguishes that visual path from additional optimizer steps. The gradient marker now travels from the loss side back toward Prompt input. Reduced motion shows the completed state directly.

Verification: `node --experimental-strip-types tools/l2p/verify-p4-trace.mjs` passed, including forward recomputation, every SGD coordinate, unchanged frozen matrices and the independent gradient check. `npm.cmd run build` passed (TypeScript + Vite 6.4.3). Edge Visual QA passed 40 captures across P4/P5/P6 at 1440×900 and 1920×1080; P4 includes initial, loss, gradient, update, a real-playback midpoint, same-image re-forward and task-B states. I inspected the P4 initial/gradient/update-midpoint/reforward screenshots; geometry, computed styles and browser errors passed with no diagnostics. The run directory `.visual-qa/run-2026-11-07T13-45-24-910Z` was removed after screenshot review and the exact-path cleanup was verified. The 1920×1080 view is a fullscreen-layout simulation; actual interactive F11 is **NOT_RUN**. Human learning acceptance/W7 remains pending.

### P6 token mapping and AvgPool workbench revision (2026-11-07)

P6 now obtains Query A's ordered Top-5 directly from `buildSelectionSnapshot("A")` and derives all five Prompt groups, their 25 token positions, the sequence formula, and the `H[0:25,:]` boundary from that shared result/configuration. Each token is selectable: the inspector identifies its Prompt, one-based local Token number, and zero-based `xₚ` position. Image `[CLS]` stays at index 25; Patch positions span 26–221. The concatenated input and Transformer output retain the paper's `222 × 768` shape. The two-call strip distinguishes no-Prompt Query extraction from Prompt-conditioned classification while keeping one frozen ViT parameter identity; Keys remain retrieval-only and the source Prompt pool remains intact.

The forward animation progressively reveals the ordered Prompt groups, carries the full sequence through the frozen encoder, and accumulates the first 25 output positions into a live `d=1` teaching example. Its displayed values, group sums, running fraction and mean all come from `computePromptOutputPool`; before accumulation the result is blank, the inspected midpoint shows `3.4 / 13 = 0.26`, and completion shows `6.0 / 25 = 0.24`. This is labeled as sample arithmetic, not a real ViT hidden state. The formal formula averages `H[0:25,:]` independently along the position axis for all 768 features. The classifier and `argmax` remain symbolic because no real logits are computed; P6 does not enter P7's loss or update path. At 390px, redundant per-cell absolute indices are visually hidden while the Token column and row index range remain visible; accessible button labels retain the full `H[r,1]` identity.

Verification: `node --experimental-strip-types tools/l2p/verify-p6-data.mjs` passed the shared Top-5, all 25 mappings, `[CLS]`/Patch offsets, length/width, final and 12-position partial sums, and invalid-input checks. The existing P4 trace verifier also passed. Production `npm.cmd run build` passed (TypeScript + Vite 6.4.3); `git diff --check` passed. The full regression suite passed 44 desktop captures across P4/P5/P6 at 1440×900 and 1920×1080 (`.visual-qa/run-2026-11-07T14-11-01-309Z`). After correcting the order of result disclosure and mobile table legibility, the final P6-only run passed 21 captures at 1440×900, 1920×1080 and 390×844 (`.visual-qa/run-2026-11-07T14-22-37-089Z`): geometry/styles passed, with no horizontal overflow or browser errors. I inspected final P6 composition, position mapping, the empty pool start, the `3.4/13 = 0.26` playback midpoint, and the `6.0/25 = 0.24` result at desktop and mobile sizes. Impeccable detector returned `[]`. Exact-path cleanup of the reviewed screenshot runs and temporary config was verified. The 1920×1080 view is a fullscreen-layout simulation; actual interactive F11 is **NOT_RUN**. Human learning acceptance/W7 remains pending.

### P6 continuous visual-object animation and responsive anchor revision (2026-11-08)

The P6 playback now carries the retrieval result into classification as visible objects. The 25 Prompt Token cells and compressed `xₑ · 197×768` image object travel from their source panels into the shared `xₚ` sequence in P5 Query A order `[P₁,P₂,P₁₀,P₃,P₉]`; the source Prompt pool remains in place. Three typed representatives (Prompt, `[CLS]`, Patch) then move through one frozen ViT block to matching `H[0]`, `H[25]`, and `H[221]` positions. This depicts position identity and shared contextual computation without inventing hidden-state values for the other 219 vectors. At the next stage each of the 25 sample `H[r,1]` values travels from its table cell to the matching position in a 5×5 accumulation tray. Source values, arrivals, sum, count, and completed mean derive from `computePromptOutputPool`.

The incomplete readout stays visibly incomplete: the captured midpoint has 8 of 25 values arrived (`1.90 / 8`), a temporary-mean label, and no final `h₁` value. On completion the same example yields `6.00 / 25 = 0.24`. The copy calls this `d=1` arithmetic a teaching example, while the formal rule averages all 25 Prompt output rows independently across each of 768 feature dimensions. The frozen parameter identity remains `θ₀`, the classifier and logits remain symbolic, and P6 still does not enter P7's loss or update step. The 9.45-second timeline synchronizes the staggered object flights with the phase stops, pause, replay, seek and reset; reduced motion presents the selected stage without continuous travel.

The desktop sticky-dock anchors now preserve 18 px of space under the dock; at 390 px the sequence and pool anchors preserve 18 px beneath the 122 px sticky site header. The mobile pooling header shortens its visible column labels to `T1`–`T5` while retaining accessible names such as “Prompt Token 1.” These changes prevent fixed UI from covering the target heading and keep the mobile document at exactly 390 px wide.

Verification: `node --experimental-strip-types tools/l2p/verify-p6-data.mjs`, production `npm.cmd run build` (TypeScript + Vite 6.4.3), and `git diff --check` passed. The final Visual QA run passed 48 captures across P4/P5/P6 at 1440×900 and 1920×1080; geometry, computed-style checks, and browser errors passed, with no P6 semantic-size warnings. Fourteen `small-semantic-text` warnings remain on existing P4 captures. I inspected the generated composition, pooling-midpoint, and final-output captures, then captured actual 1440×900 desktop and 390×844 mobile viewports. The midpoint visibly holds 8/25 with a blank final result; completion shows `0.24`; mobile shows `T1`–`T5`, visible headings, and no horizontal overflow. Motion review found no blocking issues with playback synchronization or reduced-motion handling. The 1920×1080 view is a fullscreen-layout simulation; actual interactive F11 remains **NOT_RUN**. Human learning acceptance/W7 remains pending.

### P7 batch-gradient workbench and visual check (2026-11-08)

P7 reads the two deterministic P5 selection snapshots directly: `x_A → [1,2,10,3,9]`, `x_B → [4,5,3,6,2]`, with shared slots `{2,3}` and the same persistent ten-slot pool. The stage controls separate classification gradients to selected Prompts/shared classifier from matching-loss gradients to selected Keys, mark the hard Top‑N boundary, preserve A/B provenance, and hold all parameter writeback until one batch-level step. A separate vector panel computes the explicitly simplified SGD example `q=(1,0)`, `k=(0,1)`, `η=0.2` continuously; its values are labeled as a teaching calculation, not a learned P5 embedding or the paper's Adam trajectory. No logits, high-dimensional gradients or trained parameter values are fabricated.

The gradient paths are measured from live loss and pool anchors. Selecting a sample, loss mode, phase or slot updates the same objects; reduced motion remains supported. The workbench clips to its rounded figure frame via a selector specific enough to override the shared Kit rule.

Verification: `npm.cmd run build` passed (TypeScript + Vite 6.4.3; 63 modules). `node tools/visual-qa/cli.mjs --config papers/l2p/web/enhanced/visual-qa.json` passed all configured P4–P7 captures at 1440×900 and 1920×1080: geometry, computed styles and browser errors passed; the existing P4 small-semantic-text warnings remain. The P7 report contains no diagnostics. I inspected the P7 loss-flow and writeback captures, then used the installed Playwright/Chromium 153.0.8010.12 against the local preview for actual 1440×900 viewport captures. The sticky control dock settled at 87 px below the header, the pool remained visible at `scrollY=1102`, computed figure overflow was `clip`, and there were no browser errors. Evidence: `C:/Users/lenovo/.codex/visualizations/2026/11/07/01a1b6d4-82cd-7781-bef1-255f5672adbc/P7-midpoint-1440.png` and `P7-writeback-1440.png`. The 1920×1080 capture is a viewport simulation; actual interactive F11 is **NOT_RUN**. W7/human learning acceptance remains pending.

### P8 continuous task-stream workbench and visual check (2026-11-08)

P8 carries one ten-slot Key–Prompt Pool through initialization, two batches in Task 1, a task boundary, Task 2, and unknown-task inference. Slot identities persist while their Key angle objects move continuously during a labeled two-dimensional SGD teaching simulation. Each training batch recomputes retrieval from the current Key state, accumulates classification and matching losses, then crosses one optimizer boundary. The frozen ViT stays shared, one classifier is reused, and the task boundary passes the current Prompt/Key/classifier state forward without replaying old samples or rebuilding the pool. The synthetic extension inputs and the toy Key trajectory are labeled; no Prompt or classifier gradients, logits, or learned parameter values are fabricated. The final test view uses Eq. (3) only and exposes no label, task ID, loss, backward pass, or update.

Verification: production `npm.cmd run build` passed (TypeScript + Vite 6.4.3; 69 modules). The final Visual QA run `.visual-qa/run-2026-11-07T18-03-16-234Z` passed configured P4–P9 states at 1440×900 and 1920×1080: geometry, computed styles, and browser errors passed. P8 has no semantic-size warnings; the 14 remaining small-text warnings are in existing P4 captures. Playwright/Chromium 153.0.8010.12 captured real local 1440×900 views with the sticky dock aligned below the site header, all ten pool slots visible, and zero browser errors. Evidence: `C:/Users/lenovo/.codex/visualizations/2026/11/07/01a1b6d4-82cd-7781-bef1-255f5672adbc/P8-writeback-1440.png` and `P8-inference-1440.png`. The 1920×1080 view is a viewport simulation; actual interactive F11 is **NOT_RUN**. W7/human learning acceptance remains pending.

### P9 retrieval-strategy evidence and experiment comparison (2026-11-08)

P9 recomputes Eq. (3) and Eq. (4) from the same P5 Query and ten Key angles. Query A yields Eq. (3) Top‑5 `[P1,P2,P10,P3,P9]` and Eq. (4) `[P1,P10,P2,P9,P8]`; Query B yields `[P4,P5,P3,P6,P2]` and `[P4,P5,P10,P6,P3]`. The synthetic normalized 100-hit history is explicitly a teaching snapshot, not a paper measurement. Eq. (4) is available only for known-boundary training; baseline training and unknown-task inference use Eq. (3). The added frequency factor changes retrieval ranking only; P7's matching loss retains the raw distance. The Figure 3 section keeps the authors' qualitative interpretation without recreating unverified artwork or inventing histogram counts. Table 5 reports the exact 5-datasets ablation point values and separate accuracy/forgetting scales; Table 1 and the CORe50 and Gaussian-scheduled results stay in their distinct protocols, with uncertainty shown only where the paper reports it.

Verification: production `npm.cmd run build` passed (TypeScript + Vite 6.4.3; 69 modules). The final Visual QA run `.visual-qa/run-2026-11-07T18-03-16-234Z` passed configured P4–P9 states at 1440×900 and 1920×1080: geometry, computed styles, and browser errors passed. P9 has no semantic-size warnings; 14 remaining warnings are in existing P4 captions. Impeccable detector returned `[]`. Playwright/Chromium 153.0.8010.12 verified ten candidate rows, both Query rankings, 1440 px document width, visible Table 5 comparison, and zero browser errors in actual 1440×900 captures. Evidence: `C:/Users/lenovo/.codex/visualizations/2026/11/07/01a1b6d4-82cd-7781-bef1-255f5672adbc/P9-eq4-selection-1440.png`, `P9-query-b-1440.png`, and `P9-table5-ablation-1440.png`. The 1920×1080 view is a viewport simulation; actual interactive F11 is **NOT_RUN**. W7/human learning acceptance remains pending.

### P7 structural redesign and motion correction (2026-11-08)

The user identified P7 as a design failure, not a typography-only defect. I replaced the former all-to-all gradient wiring with a persistent two-sample workbench: each sample keeps its P5 selection and separate classification/matching loss rows; typed gradient contributions enter a shared parameter ledger with A/B provenance; only after the two contributions have accumulated does one optimizer boundary write the next state. The hard Top‑5 index boundary remains separate from the differentiable matching-distance example. A separate, recomputed single-Key SGD demonstration is labeled as a teaching calculation. The loss equations now use grouped MathML and no oversized delimiter layout.

Playback was extended to 16 seconds across six meaningful phases. Gradient markers move continuously from each loss rail to its parameter class using measured anchors and eased transforms, while the text and source objects remain stationary. Both samples finish their forward/loss pass before their contributions enter the shared batch ledger; the final phase performs one writeback. Reduced-motion behavior and direct phase seeking remain available.

Verification: `npm.cmd run build` passed (TypeScript + Vite 6.4.3; 69 modules). Visual QA run `.visual-qa/run-2026-11-07T19-10-23-956Z` passed all 8 P7 captures at 1440×900 and 1920×1080: geometry, computed styles, and browser errors passed with zero browser errors. I inspected the opening, equations, batch ledger and Key study captures, plus actual 1440×900 Chromium viewport captures for the formulas, workbench, in-flight gradient and completed writeback. The live document width matched the viewport and the browser reported no errors. Evidence: `C:/Users/lenovo/.codex/visualizations/2026/11/07/01a1b6d4-82cd-7781-bef1-255f5672adbc/P7-redesign-formulas-1440.png`, `P7-redesign-workbench-1440.png`, `P7-redesign-classification-flight-1440.png`, and `P7-redesign-writeback-1440.png`. The 1920×1080 view is a viewport simulation; actual interactive F11 is **NOT_RUN**. W7/human learning acceptance remains pending.

### P9 Key-scan layout, formula, and typography correction (2026-11-08)

The P9 Key label and direction glyph now occupy separate slots, with a distinct scan target aligned under the Query marker. One cursor travels down this fixed comparison lane through all ten Key rows; it no longer draws individual curves across score columns and labels. The 14.5-second timeline gives the Eq. (3) distance pass 5.4 seconds (about 540 ms per Key), the optional known-boundary Eq. (4) weighting pass 3.3 seconds (about 330 ms per Key), then separates discrete ranking and Top‑N selection. The frequency pass uses an amber cursor; score values appear row by row.

I increased formula, control, ledger, score and evidence typography. Grouped MathML expressions keep the parentheses at the height of their own functions instead of stretching across the full equation. At widths up to 760 px, the tall control dock returns to document flow so it cannot cover the formulas; the wide score table scrolls inside its own region while the page stays within the viewport width.

Verification: `npm.cmd run build` passed (TypeScript + Vite 6.4.3; 69 modules). Final P9 Visual QA run `.visual-qa/run-2026-11-07T19-38-43-743Z` passed all 14 captures across 1440×900 and 1920×1080: geometry, computed styles and browser errors passed, with no P9 semantic-size warnings. I visually inspected formula, distance-sweep, frequency-sweep and final-selection screenshots. Playwright/Chromium 153.0.8010.12 captured actual 1440×900 and 390×844 viewports: zero browser errors, document width matched each viewport, Key scan lane aligned within 1 px, and scan targets did not overlap Key labels or direction glyphs. The desktop captures show the 23 px MathML and continuous scan; mobile captures show both equations unobscured and the table contained in an 838 px internal scroll area. Evidence: `C:/Users/lenovo/.codex/visualizations/2026/11/07/01a1b6d4-82cd-7781-bef1-255f5672adbc/P9-redesign-equations-1440.png`, `P9-redesign-distance-sweep-1440.png`, `P9-redesign-frequency-sweep-1440.png`, `P9-redesign-topn-selected-1440.png`, `P9-redesign-equations-390.png`, and `P9-redesign-query-table-390.png`. The 1920×1080 view is a viewport simulation; actual interactive F11 is **NOT_RUN**. W7/human learning acceptance remains pending.

### P1–P3 教学文案修订（2026-11-09）

按用户执行方案保护 P1–P3 的核心图形、时间轴、交互及计算；仅调整 lessons.tsx、tutorial.ts 与必要局部排版。P4–P9、W4 首讲顺序及工作流状态保持原状。页末以本页结论提出下一页需要解决的问题；文案采用自然教学陈述。

P1：补全顺序数据、旧数据访问限制、共享参数干扰、固定旧图对照与无任务 ID 统一测试；预测百分数标为教学分数，图注集中说明合成范围。用现有 Takeaway 承接 P2 的视觉特征形成问题。动画组件未修改。TypeScript/Vite 构建通过；修订中间版 Edge Chromium QA 的两种桌面布局几何与浏览器检查通过，已查看 P1 第二快照截图；最终简化文字与页末衔接将随三页整体验证复核。

保护基线：runner 首次受沙箱本地连接限制，第二次发现未安装 Playwright Chromium；改用系统 Edge 后成功。基线报告 run-2026-11-09T08-18-12-261Z 覆盖 P1 双快照、P2 默认 Patch、P3 基础/额外 Token（1440×900、1920×1080），已查看三页默认截图。真实 F11 与人工学习验收尚未执行。

P2：补全总览前的 fₑ→fᵣ→分类路线、Patch/投影的必要性、位置向量与 [CLS]、示例维度含义和层间传递；区分普通 ViT 与后续 L2P 的读出用途。页末用 Patch A 如何读取 Patch B 引向 P3。PatchMotion、选块与编号逻辑未改。npm.cmd run build 通过；Edge QA run-2026-11-09T08-22-47-100Z 的 4 个截图（两种桌面布局、默认/第196块投影终态）几何与浏览器检查通过；已查看 1440 终态、1920 默认整页，未见新增溢出或控件遮挡。

P3 与后续补充要求：正文先解释 Pre-LN 顺序和 Z/U/Z′，沿单目标 Q/K/V、缩放点积、Softmax、Value 加权、多头合并回到残差与 FFN，再比较固定投影与变化输入。保留同一个 attention() 计算函数；[CLS] 基础输出 [0.856,1.436] 与新增 Token 输出 [1.472,2.279] 经浏览器实际断言确认。额外 Token 的训练问题留给 P4。

按用户跟进要求，用不同形式引导：P1 的共享参数因果链与自然段结尾，P2 的局部 Patch→上下文表示缺口图，P3 的三段计算关系与实验后的训练问题。移除统一 Takeaway 包装，新增 CSS 仅作用于这三类轻量阅读图；没有重做主动画。六个受保护组件 classifier-motion、patch-motion、attention-motion、head-merge-motion、vit-visuals、lesson-playback 与基线无差异。文案避免“不是……而是……”句式。

最终验证（代码版本 index-Crva6VgK.js / index-B75N7Hn6.css）：
- SOURCE_BUILD=PASS：publish_source 为 paths l2p --json 返回的 enhanced 绝对路径；npm.cmd run build，TypeScript + Vite 6.4.3，69 modules，退出 0。
- UPSTREAM_SYNTAX=PASS / UPSTREAM_OUTPUT=PASS：Node v24.18.0；相邻 PaperSkill HEAD 4da910afe9054d3a6ff54003023d53ec3de44ac9，官方 upstream 为 git@github.com:ReductTech/PaperSkill.git。fetch upstream main 成功，最新 f73c7e50f043317181161fba5cc446424bb564e0；两个实际检查器 blob 分别为 2bcfa6f815054ee498574c51cef05f0c315b4298、9ec76b6974f262fca7b9611c4a485dd2275fe76c，与已 fetch 的 upstream/main 完全一致。直接执行 syntax-check.js <绝对源码目录> --require-parser 与 validate-output.js <绝对源码目录>，均退出 0，无占位/注册警告。
- SUBPATH_ASSETS=PASS：Vite base='./'，检查 dist/index.html 引用的本次 JS/CSS；生产产物暂存于任务独有 .visual-qa/l2p-copy-stage/papers/learning-to-prompt/qa-preview/。运行 PAPERWORK_PLAYWRIGHT_EXECUTABLE=<系统 Edge> node tools/visual-qa/cli.mjs --config .visual-qa/l2p-final-config.json；报告 run-2026-11-09T08-29-01-925Z，28 captures 的 actualUrl 均在预期非根路径，页面/同源资源错误为 0。Python 静态服务的浏览器默认 /favicon.ico 请求返回 404，不影响教程内引用资源。
- GEOMETRY_QA=PASS，FULLSCREEN_LAYOUT=PASS：Edge 157.0.4341.42，1440×900 / 1920×1080、DPR 1；P1 双快照、播放中间及返回，P2 默认/第196块终态/第1块投影中间态，P3 默认/额外 Token/目标 B/Softmax/Value 汇聚中间态/多头合并及终态。已查看三页整页、1440 的新增小图与公式、P3 对照及多头终态、1920 P1/P3 初态和 1440 投影/汇聚/合并中间态。未见新增溢出、公式裁切或控制区挤压；runner 仍报告 P2 原有六个 Block 堆叠标签 11px，随后做局部字号修复复测。
- INTERACTIONS=PASS：node .visual-qa/l2p-interactions.mjs，真实 DOM 操作断言 P1 播放/暂停/复位、快照；P2 Patch196 行列与 data-token-index=195；P3 两组输出、四行来源、目标 B、步骤跳转与复位，零 pageerror。原生截图保留在 C:/Users/lenovo/.codex/visualizations/2026/11/09/01a1bf5d-7a01-7c11-8a7b-cc961eeea522：P1-snapshot2.png、P1-parameter-cause.png、P2-patch196.png、P2-sequence.png、P2-to-P3.png、P3-attention-rule.png、P3-attention-extra.png、P3-frozen-compare.png、P3-head-output.png，供复核。
- Impeccable detect --json lessons.tsx tutorial.ts paper.css 返回 []。
- FULLSCREEN_REAL=NOT_RUN：本轮使用 headless Edge，未操作桌面 F11。STYLE_QA 自动断言与获批像素基线对比=NOT_RUN（本轮配置未声明）；Agent 已进行上述截图视觉复核。W7/W9 人工教学验收 PENDING，无工作流阶段变更或正式发布。

P2 字号修复复测：仅将 .block-stack li 从 11px 提高到 12px，不改布局结构和动画。npm.cmd run build 再次通过（最终 index-CshBsept.js / index-D0-52zPb.css）。运行 l2p-p2-final-config.json，报告 run-2026-11-09T08-33-15-041Z，六个非根路径截图（两种桌面布局、默认/第196块终态/第1块投影中间态）全部通过，small-semantic-text 警告清零；已复核 1920 默认整页，标签清楚且无挤压。

清理范围已核实为本轮输出的七个 runner 目录：run-2026-11-09T08-16-33-578Z、run-2026-11-09T08-17-31-736Z、run-2026-11-09T08-18-12-261Z、run-2026-11-09T08-20-20-968Z、run-2026-11-09T08-22-47-100Z、run-2026-11-09T08-29-01-925Z、run-2026-11-09T08-33-15-041Z。完成报告/截图审阅后按 CLI 精确清理；任务专用 staging/config/native script 一并按确切路径清理，交付截图保留在上述 visualizations 目录。任务启动的临时服务均随 runner/native script 退出关闭。

清理结果：上述七次 --cleanup-run 均返回 CLEANED，逐项 Test-Path=False；任务专用 staging 与五个临时配置/脚本均按已核实的绝对路径删除。交付截图保留；历史 QA 目录与既有 package-lock.json 改动未动。

### 截图反馈后的排版与教学视觉修订（2026-11-09）

用户确认前次新增 rk-prose 段落窄于既有正文，Unicode 下标变量也与公式不一致。根因是复用了 Kit 的窄栏 class；本次改为论文局部 lesson-prose，匹配既有正文宽度、字号与行高。新增行内变量统一使用 MathML msub/mrow，Pre-LN 函数名正体、括号分组。后续按页重新设计完整轴线、鱼骨分支、卡片与交错图文；保持六个主动画组件和 attention() 不变。先记录代码构建检查，完整浏览器复核在本次视觉设计完成后执行，不沿用上轮截图结论。

P1 视觉设计修订：将原任务条替换为贯穿三阶段的连续时间轴，快照状态复用 phase；将短箭头链替换为完整主轴与三条斜向分支的干扰鱼骨图。旧图固定条件与结果解释采用错位双栏，页末用同一鸟图、预训练主干和特征对象连接 P2。组件位于 reading-visuals.tsx/css，未改主动画。共用 App.tsx 的 lesson-copy 正文容器覆盖 P1–P9，普通段落宽度/字号/行高由容器统一约束，有意设计的嵌套图文保留局部排版。构建检查通过；本轮完整视觉检查随后统一执行。

P2 视觉设计修订：总览前将阅读路线与三种表示对象错位配对；展平/投影采用高低错位的坐标卡板，中间给出共享线性映射；末段用层间序列接力与 CLS 读出两行交叉图文解释，保留原 Patch 主动画与选块同步。构建通过，浏览器复核随后执行。

P3 视觉设计修订：输入 X 沿连线分成 Q/K/V 三张投影卡；分数→权重→汇聚使用贯穿主轴连接独立公式卡；残差与 FFN 的交接采用交叉错位图文，页末用可学习输入对象连接 P4。正文仍讲清逐位置共享投影、归一化与加权和，主 Attention/多头/冻结对照的计算和时间轴保持原样。复核发现旧五列网格覆盖新卡片三列布局，已在拥有者 .lesson-copy 下提高局部规则优先级，并加入卡片无重叠、公式不越界断言。TypeScript/Vite 构建通过。

正文长期约定（P1–P9 共用）：App.tsx 的 lesson-copy 是单一正文容器，普通正文使用 p，不单独依赖 rk-prose 的 72ch 宽度；字号 17px、行高 1.8，宽度由容器统一提供。嵌套的图表注释、卡片与有意分栏可以局部设定宽度，但必须同时有对应视觉内容。数学变量使用 MathML，禁止在新增普通正文中混写 Unicode 下标。每次正文或共享样式变更后运行 npm run check:reading（需要仓库 tools/visual-qa 的独立 Playwright 安装），不能仅以构建或首屏截图验收。

### 本轮根因修复与视觉设计最终检查

SOURCE_BUILD=PASS：npm.cmd --prefix papers/l2p/web/enhanced run build，TypeScript + Vite 6.4.3，71 modules，最终资源 index-BPpZYD1B.js / index-5f-iBcYa.css。UPSTREAM_SYNTAX=PASS、UPSTREAM_OUTPUT=PASS：继续使用本会话已核实与成功 fetch 的 upstream/main 一致的两份官方检查器（修订 SHA/blob 见上方记录），对最终源码直接执行 syntax-check.js --require-parser、validate-output.js，38 个源文件解析通过、9 个模块注册完整，退出均为 0。

ROOT_PROSE_REGRESSION=PASS：npm.cmd --prefix papers/l2p/web/enhanced run check:reading -- <本轮截图目录>，Edge 157.0.4341.42。在 1440×900 与 1920×1080、DPR 1 上逐一检查 P1–P9，共 18 页/视口组合、102 项真实正文/回归探针：普通段落宽度与所属容器一致、字体 17px、行高 30.6px；即使未来新增段落仍带 rk-prose，也会被共用容器规范覆盖。另检查前三页正文无 Unicode 下标混排、MathML msub 子节点结构、三张公式卡互不重叠且公式不越界、页面无横向溢出、P1 快照和复位、P2 Patch196 与序列身份、P3 两组数值/目标切换/多头终态。P3 的 [CLS] 输出仍为 [0.856,1.436] 与 [1.472,2.279]。测试是源码中保留的可复跑脚本 scripts/check-reading.mjs；visual-qa.json 同步补齐 P1–P3 与全部九页的容器样式断言。

SUBPATH_ASSETS=PASS：该回归脚本在临时随机端口的 /papers/l2p/qa-preview/ 上直接服务最终 dist，校验实际前向操作及同源资源响应，没有子路径资源错误；Vite 仍采用相对 base。未增加应用运行时依赖。

MOBILE_TARGETED=PASS：因新增图示直接带有窄屏排版，专项运行 check:reading -- <截图目录>/mobile --mobile，P1–P3 在 390×844 下正文、MathML、页面宽度与交互断言通过；已查看纵向鱼骨信息、坐标卡和 Q/K/V 卡片截图。移动截图取自清理遗留规则前的同等布局，最终清理只删除已被新规则替代的桌面/宽度定义。

VISUAL_REVIEW：已查看 P1–P3 两种桌面尺度的整页、时间轴、完整鱼骨图、错位坐标卡、层间传递、Q/K/V 分支卡与计算公式/交接；P4–P9 六页桌面首屏正文及主要控件；新正文不再意外只占左半栏，有意错位段落均有对应视觉对象。额外检查新图示在窄屏下的堆叠。全部六个保护动画组件与 4897f3b 基线无 diff。Impeccable detector 返回 []。

正式 runner 的九页初态/代表性交互回归覆盖 38 captures，几何/样式/浏览器错误检查通过。首轮 run-2026-11-09T08-55-17-547Z 的唯一字体警告来自 P4 既有图内 p4-object-caption（11px），它属于图内说明，未作为正文容器错误改动。最终重复检查报告目录见下方清理记录。

证据保留：C:/Users/lenovo/.codex/visualizations/2026/11/09/01a1bf5d-7a01-7c11-8a7b-cc961eeea522/reading-repair/，含 reading-report.json、九页两种桌面首屏/整页、前三页设计与交互状态、mobile/ 专项截图。FULLSCREEN_LAYOUT=PASS；FULLSCREEN_REAL=NOT_RUN（本轮为 headless Edge，未进行桌面 F11）。获批像素基线比较=NOT_RUN；W7/W9 人工教学验收仍 PENDING，未改工作流状态或发布。

最终 runner 报告 run-2026-11-09T09-02-16-057Z：38 captures 全部 GEOMETRY_QA/STYLE_QA/BROWSER_ERRORS=PASS，浏览器错误 0，P4 既有图内 11px 注释警告保持原状。报告已阅读，并查看 P6 分类终态回归截图。两个本轮确切 run 目录经 --cleanup-run 返回 CLEANED，逐项 Test-Path=False；唯一临时配置 l2p-reading-final.json 已按核实的绝对路径删除。本轮原生截图和 JSON 作为交付证据保留于 reading-repair/；临时服务全部正常关闭。最终遗留只有任务开始前已存在的 package-lock.json 改动，不纳入本轮提交。

### 重点层次与视觉精修（2026-11-09）

本轮保留已确认的结构、因果链、正文容器与计算。正文采用少量短语强调：绿色标记核心对象/机制，琥珀色标记约束与风险，砖红细下划线标记推断边界；数字含义用字重与蓝色区分。每段只选择一至两个关键词组，避免整句涂色。新增 lesson-key 属于共用正文的语义强调样式，不改变字号、行高或正文宽度。先完成 P1–P3 重点标注，TypeScript/Vite 构建通过；后续图示精修结束后统一检查真实渲染。

图示精修保留当前构图，细化同一视觉语言：时间轴用浅绿/淡金/冷灰蓝区分两个训练阶段与统一测试，大号 θ 快照符号和选中节点双环保留真实阶段身份；鱼骨图以绿/金/砖红分支、条件线性图标、轻量结论面板建立层次。根据用户补充，对线条本身加入浅色衬轨、圆角汇入、节点套环、支线端点与小型方向记号；旧图访问受限的分支使用虚线，与其图标一致，完整主轴始终连续。Q/K/V 分叉同样采用圆角连线与汇合节点；展平/投影卡片强化字体层级与暖冷表面，残差卡片细化边线。未改变六个保护动画组件、attention()、正文容器或页间顺序。

本轮最终验证：
- SOURCE_BUILD=PASS：npm.cmd --prefix papers/l2p/web/enhanced run build，TypeScript + Vite 6.4.3，71 modules；最终资源 index-DWOWqRf-.js / index-B7Aqxmje.css。
- UPSTREAM_SYNTAX=PASS / UPSTREAM_OUTPUT=PASS：直接执行同会话已核实 revision/blob 的官方 syntax-check.js <源码绝对路径> --require-parser、validate-output.js <源码绝对路径>，38 个源文件、9 个模块通过，退出 0。Impeccable detect 返回 []。
- ROOT_PROSE_REGRESSION=PASS / SUBPATH_ASSETS=PASS：npm.cmd --prefix papers/l2p/web/enhanced run check:reading -- <reading-polish证据目录>，P1–P9 在 1440×900、1920×1080、DPR 1 的正文宽度/字体/行高、MathML、公式卡片几何、前向对照与资源响应通过；P1–P3 快照/Patch/Attention/多头状态保持正常。
- MOBILE_TARGETED=PASS：同一命令增加 --mobile，P1–P3 的 390×844 窄屏布局与交互通过。此检查由本轮卡片、轴线的窄屏样式变更触发。
- 正式 runner：PAPERWORK_PLAYWRIGHT_EXECUTABLE=<系统Edge> node tools/visual-qa/cli.mjs --config .visual-qa/l2p-polish.json，报告 run-2026-11-09T09-24-42-393Z；P1–P3 的 14 个桌面截图全部几何/样式/浏览器检查通过，0 warning、0 browser error。
- 近景与文字检查：node .visual-qa/polish-details.mjs；查看时间轴、鱼骨图、正文重点、坐标卡片、Q/K/V 和 Attention 计算轴截图。被标记段落最大强调比例 P1=27.3%、P2=10.3%、P3=11.4%，没有整句高亮。绿色、琥珀色、砖红、蓝色与鱼骨图图注的实际色值对比度分别为 8.02、4.78、5.94、6.64、4.80，均高于 4.5。未见正文宽度回退、公式裁切、控件挤压或装饰遮挡内容。
- 代表证据：C:/Users/lenovo/.codex/visualizations/2026/11/09/01a1bf5d-7a01-7c11-8a7b-cc961eeea522/reading-polish/，包含 P1-timeline-detail.png、P1-fishbone-detail.png、P1-keywords-detail.png、P2-coordinates-detail.png、P3-qkv-detail.png、P3-rules-detail.png，以及九页两种桌面布局、mobile/ 和 JSON 检查记录。证据为本轮最终生产构建的真实截图，保留供复核。
- FULLSCREEN_LAYOUT=PASS；FULLSCREEN_REAL=NOT_RUN（headless Edge，没有桌面 F11）。人工 W7/W9 仍 PENDING，未改阶段状态或发布。

清理：本轮 runner 确切目录返回 CLEANED 且 Test-Path=False；任务专用临时配置及近景脚本已按核实的绝对路径删除。原生截图/JSON 作为交付证据保留于 reading-polish/。任务启动的预览服务均正常退出；任务开始前的 package-lock.json 改动不纳入提交。

### P3 公式基线与核心术语强调补正（2026-11-09）

按截图反馈修正两点：Pre-LN 两式改为各自的行内 MathML + CSS 行框，外层 flex 按 baseline 对齐；不通过 translate/top 偏移修补。Z′ 的上标高度仍保留，两个公式共用同一数学基线。正文强调改为首次出现的机制名“层归一化”“多头自注意力”“前馈神经网络”“残差相加”，并补齐 Query/Key/Value、Softmax、沿特征维度拼接、输出投影、非线性变换；移除概括性“跨位置读取”和泛化“特征”上的重复强调，保持短语而非整句着色。

SOURCE_BUILD=PASS：npm.cmd --prefix papers/l2p/web/enhanced run build，71 modules，最终 index-BsWHnglM.js / index-DWk_PJ3r.css。UPSTREAM_SYNTAX=PASS、UPSTREAM_OUTPUT=PASS：同会话已核实的官方检查器直接检查最终源码，38 个源文件、9 个模块均通过。Impeccable detect 返回 []。

回归入口新增 Pre-LN 两式等号轴线对齐断言（容差 1px）及近景截图。最初的断言误选了 Z′ 内部的撇号，诊断后改为明确选择公式顶层等号，未放宽容差。npm run check:reading 在九页两种桌面布局通过，P3 等号中心坐标分别为 1440: [875.15625,875.15625]、1920: [842.703125,842.703125]；P1–P3 的 390×844 窄屏专项通过，允许窄屏两式自然换行。原有正文几何、MathML 与交互/数值断言通过。未修改主动画组件或计算。

已查看 P3-1440-block-formulas.png、P3-1920-block-formulas.png、P3-1440-core-terms.png，公式基线一致、关键术语清楚，字号和正文宽度保持原状。证据保留于 C:/Users/lenovo/.codex/visualizations/2026/11/09/01a1bf5d-7a01-7c11-8a7b-cc961eeea522/p3-formula-terms/，包含 JSON 指标及 mobile/ 专项。没有新建临时 runner 目录；原生检查服务均正常关闭。真实 F11=NOT_RUN，人工教学验收状态未变。

### P1–P3 系统化文字重点与字体层级（2026-11-09）

按用户进一步说明，将强调方法落实到前三页整条阅读路径，使用三层手法：原色字重负责背景概念；语义色短标记负责关键条件和动作；少数首次出现的核心术语用放大的衬线字体，章节问题仅放大其中一个关键词，不整句上色。保留已有布局、完整轴线、图文对象、统一正文容器与主动画。P1 已覆盖图像分类/持续学习、同一分类器/共享网络、类别增量/任务 ID、预训练模型等关键认识，已有判断边界的红色强调保留。正文仍为 17px/1.8，局部字号变化仅作用于明确标记的短语。P1 构建通过，后续完成 P2/P3 后统一进行渲染复核。

P2：沿真实计算链标注视觉 Transformer、Patch、展平、线性投影、Patch Token、位置向量、[CLS]、Encoder/Block 与分类头；首次术语使用少量放大衬线/英文斜体，空间表征使用蓝色，运算保持绿色，[CLS] 沿用图中的琥珀色。197 与 768 在说明段中作为两个字号放大的数字锚点，分别连接序列长度与向量宽度。问题标题只强调“向量”“197”等局部；段落宽度与正文基准不改。P2 构建通过，继续完成 P3 后统一复核。

P3：首次机制名的放大衬线强调扩展到 Block、层归一化、多头自注意力、前馈神经网络、Q/K/V、Softmax、拼接、输出投影、非线性变换、冻结网络与前向计算。Query/Key/Value 用与分支卡对应的蓝/绿/紫区分，英文术语适度使用衬线斜体；Z/U/Z′ 的正文定义使用局部放大的原生 MathML，不改主公式及其基线。问题标题只强调读取/汇回/不同输入等局部动作。P3 构建通过，接下来进行三页整体验证。

本轮整体验证：SOURCE_BUILD=PASS，npm.cmd --prefix papers/l2p/web/enhanced run build（TypeScript + Vite 6.4.3，71 modules，最终 index-DWDIOETl.js / index-DNpR3W0l.css）。同会话已核实的官方 syntax-check.js --require-parser、validate-output.js 对最终源码检查通过，38 个源文件、9 个模块，UPSTREAM_SYNTAX/UPSTREAM_OUTPUT=PASS。Impeccable detect 返回 []。

ROOT_PROSE_REGRESSION=PASS、SUBPATH_ASSETS=PASS：npm.cmd --prefix papers/l2p/web/enhanced run check:reading -- <typography-p1-p3证据目录>；P1–P9 的 1440×900、1920×1080、DPR 1 正文容器宽度/基准字号/行高、MathML、P3 两式基线、公式卡片与关键交互/数值通过。新增局部字体没有改变普通正文的 17px / 1.8 约定。P1–P3 的 390×844 专项（同入口追加 --mobile）通过，数字锚点和放大术语未造成横向溢出。

近景审核：node .visual-qa/typography-details.mjs 记录三页所有带强调段落的文本比例，P1 最大 27.3%、P2 最大 21.0%、P3 最大 18.8%（包含字重、色标、放大术语、数字和符号），没有整句全部突出。普通正文首讲术语实测 19.04–19.55px，导语中的术语约 21–22px；197/768 为 28.05px，Z/U/Z′ 为 22.1px。已逐页查看桌面整页和近景、窄屏维度说明：主次层次来自少量重要对象的字体差异，避免每句都放大。近景截图改为按真实顶栏高度避让；原固定 110px 在窄屏会遮住截图顶部，属于截图定位问题，已将同样的动态避让修复应用于永久回归脚本。

证据保留于 C:/Users/lenovo/.codex/visualizations/2026/11/09/01a1bf5d-7a01-7c11-8a7b-cc961eeea522/typography-p1-p3/：P1-1440-lead-detail.png、P1-1440-reasoning-detail.png、P2-1440-mechanisms-detail.png、P2-1440-dimensions-detail.png、P3-1440-core-terms-detail.png，以及三页整页、两种桌面/窄屏 JSON 与字体指标。六个保护主动画和 attention() 无修改，既有公式对齐保持正确。FULLSCREEN_LAYOUT=PASS，FULLSCREEN_REAL=NOT_RUN（headless Edge）；人工教学验收与工作流阶段未变。

本轮未创建 runner run 目录。任务专用 typography-details.mjs 在截图/指标审阅后按确切路径清理，原生截图和 JSON 保留供交付；临时检查服务器已关闭。既有 package-lock.json 改动未纳入提交。

### P1–P3 技术词 Hover 与 ReferenceHub（P1/P2/P3 完成，2026-11-09）

按正文首见位置建立可触达的术语 Hover：一屏显示中英文术语、准确释义、本页作用和易混点；点击“查看完整解释”进入按 P1/P2/P3 编组的 ReferenceHub，在页内术语索引中浏览更完整的解释、步骤卡、跨概念关系与来源。统一入口已改名“术语与资料”。P1 已完成 10 个概念：持续学习、类别/域增量、task-agnostic、任务 ID 与任务边界、灾难性遗忘、预训练主干、冻结参数、回放缓冲区；正文在首见处连接对应 Hover。重点解释测试无任务 ID 与训练无任务边界是两项独立条件；冻结权重仍执行前向计算；基础 L2P 与回放版 L2P-R 的差别。

P2 完成 13 个概念：视觉 Transformer、输入嵌入、Patch、展平、线性投影、Patch Token、Token 序列、位置向量、[CLS]、ViT-B/16、197×768 形状、Encoder/Block、分类头。正文、架构总览、逐块路径和分类读出图均在相关首见处接入 Hover。详细说明区分图像块与 Patch Token、展平与投影、位置向量与内容向量，以及序列长度与隐藏维度；标注典型架构参数不是 L2P 的方法贡献。引用 L2P、ViT 原论文的对应章节与配置。

P3 完成 15 个概念：Pre-LN、LayerNorm、自注意力与缩放点积、Query/Key/Value、Softmax、注意力权重、Value 加权和、多头、特征拼接、输出投影、残差连接、FFN/MLP、前向计算。机制词连接到正文、Q/K/V 分支图、Attention 公式讲解和残差示意。完整说明区按计算顺序解释运算，区分注意力内部的 Key 与 P5 Prompt Pool 的检索 Key；指出 attention weight 是当前运算中的分配比例、Head 不保证可直接命名的人类语义，冻结参数仍允许输入激活变化。外部参考链接分别指向 Transformer、LayerNorm、Residual 原论文；Pre-LN 在 ViT 中的配置有明确边界。检查发现通用 `.rk-term-ref` 颜色会盖住 Q/K/V 的语义色，已改为继承上层颜色，并回归确认蓝/绿/紫角色色均保留。

SOURCE_BUILD=PASS：`npm.cmd --prefix papers/l2p/web/enhanced run build`，TypeScript + Vite 6.4.3，72 modules。P1 Hub 回归断言已加入 `scripts/check-reading.mjs`：Hover 释义/中英术语/易混点、完整词条说明、10 项页索引、相关词跳转；浏览器在 1440×900、1920×1080 的九页正文容器与 MathML 回归通过。检查命令：`PAPERWORK_PLAYWRIGHT_EXECUTABLE=<系统 Edge> npm.cmd --prefix papers/l2p/web/enhanced run check:reading -- <P1-reference证据目录>`，PASS；查看 `P1-1440-reference-hub.png`。ReferenceHub 使用按需抽屉，完整条目在面板内纵向滚动。证据保留于 `C:/Users/lenovo/.codex/visualizations/2026/11/09/01a1bf5d-7a01-7c11-8a7b-cc961eeea522/P1-reference/`。此次共享面板变更只覆盖相关入口与词条浏览；六个保护动画、attention()、正文统一容器不变。

P2 SOURCE_BUILD=PASS：npm build 编译 72 modules。`check:reading` 在 1440×900 和 1920×1080 对 P1/P2 Hub 进行浏览器交互断言：P2 的 13 项术语索引、ViT Hover、197 行/768 列展开定义及配置可变边界通过；P1 的 10 项与任务 ID/边界区分断言继续通过。P1–P9 正文容器、字号、行高、MathML 和页面溢出均通过。证据 `C:/Users/lenovo/.codex/visualizations/2026/11/09/01a1bf5d-7a01-7c11-8a7b-cc961eeea522/P1-P2-reference/`，已查看 P2-1440-reference-hub.png 和 P2-1440-full.png。六个保护动画和 attention() 不变。

P3 SOURCE_BUILD=PASS：npm build，TypeScript + Vite 6.4.3，72 modules。`check:reading` 的 P1–P9 两种桌面宽度检查和 P3 Hub 导航/公式基线/关系色检查通过；三组索引分别为 P1=10、P2=13、P3=15，共 38 项。P3 的 ReferenceHub 可打开各术语，核对 Pre-LN 顺序、前向计算边界与内部/外部 Key 的区别。窄屏以 390×844 + `isMobile/hasTouch` 运行，P1–P3 阅读、公式与溢出回归通过，P3 对 Softmax 术语执行触屏点按打开 Hover 与 ReferenceHub。结果 PASS，浏览器错误 0。证据 `C:/Users/lenovo/.codex/visualizations/2026/11/09/01a1bf5d-7a01-7c11-8a7b-cc961eeea522/P1-P3-reference/`，已查看 P3-1440-reference-hub.png、P3-1440-full.png、P3-390-reference-hub.png。六个保护动画、attention()、P1–P9 统一正文容器与 P3 公式基线不变。

术语图谱审计：P1/P2/P3 分别 10/13/15 项；38 项全部有正文或图示 Hover 使用，所有正文 Term ID 与 Related 链接均能解析，没有孤立词条或悬空关系。UPSTREAM_SYNTAX=PASS、UPSTREAM_OUTPUT=PASS：直接检查发布源码，TypeScript parser 共 39 个源文件，9 个模块/章节注册完整。Node v24.18.0；检查器在本会话已核实匹配当前 PaperSkill upstream/main（`f73c7e50f043317181161fba5cc446424bb564e0`；syntax blob `2bcfa6f815054ee498574c51cef05f0c315b4298`；output blob `9ec76b6974f262fca7b9611c4a485dd2275fe76c`）。未改人工审核记录、W7/W9 或发布阶段。

### P4 核心教学场重构（2026-11-09）

P4 改为一套可暂停、定位、回到起点的共享教学舞台：两枚 Prompt Token 接入固定图像序列，依次展示冻结前向、二分类损失、沿固定计算回传梯度、一次参数更新、同图复算，再以任务 B 引出共享参数干扰的可能性。向量、注意力、输出、损失和坐标来自原有可复算教学 Trace；明确区分 ViT-B/16 全宽序列形状与低维单头示例，并将图内辅助字号修正为项目字体 token。新增 P4 的 Prompt Token、Prompt Tuning、梯度回传术语引用；本页分类均值读出标注为机制教学简化，不冒充完整 L2P Prompt Pool 路径。

SOURCE_BUILD=PASS：`npm.cmd run build`（`papers/l2p/web/enhanced`，TypeScript + Vite 6.4.3，72 modules）。VISUAL_QA=PASS：runner 的 1440×900 与 1920×1080 桌面布局共 16 张截图，几何、样式和浏览器错误检查通过，0 browser error；代表性初始、梯度、参数更新、同图复算和任务衔接状态已人工查看，VISUAL_REVIEW=PASS。报告与完整截图副本保留于 `C:/Users/lenovo/.codex/visualizations/2026/11/09/01a1c020-e9c2-7512-920c-880c94f51cbb/p4-core-refactor-qa/`。HUMAN_ACCEPTANCE=PENDING；FULLSCREEN_REAL=NOT_RUN（使用 headless Edge 的固定视口）。
