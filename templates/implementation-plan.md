# Implementation Plan: {{paper_title}}

Paper ID: `{{paper_id}}`

## Learning Goal and Non-goals

State the learner outcome this page must enable. List details deliberately kept in Reference or omitted. Do not start with a fixed chapter count, animation plan, or interaction quota.

## Design Handoff, Invariants, and Change Scope

Record the latest confirmed W4/W5 decisions here. Keep this as the single project-level decision source.

- Design confirmation: DRAFT / CONFIRMED (the user approved the target and constraints).
- Rendered-page acceptance: PENDING / PASS / REVISE (the user reviewed the actual browser rendering; this is separate from design confirmation).
- W5 CLI structural completion is recorded separately in `paper.yaml`; it does not establish user design confirmation or rendered-page acceptance.
- Confirmed learning and visual goals:
- Protected structures, semantics, data, scales, colors, object identities, and interactions:
- Changes allowed without a new design decision:
- Open choices that require user input:
- Pages, shared components, and states affected by this change:

For each confirmed page/state, record the approved effect or screenshot reference and its change boundary:

| Page / state | Confirmed effect or screenshot reference | Protected objects, scales, colors, connections, and animation | Layout changes allowed | Open trade-offs |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

For substantial motion, record the initial, key intermediate, and final states and the required object connections. Do not duplicate the same page contract in a new document.

### Critical Teaching and Integration Scenes

Use this section only for scenes whose algorithmic meaning depends on coordinated text, graphics, formulas, data, or motion. Ordinary prose pages do not need a frame contract.

For each critical scene, record:

- teaching purpose, what the reader already knows, the algorithmic relationship to explain, and the expected conclusion;
- fixed inputs/data, persistent state, temporary or derived state, outputs, real lifecycle, stable object identities, and data provenance;
- expression details that may change freely and the semantics, calculations, ordering, and approved visual relationships that must remain protected;
- how the scene receives context from the prior page and hands state or a question to the next page without premature terminology, repeated first teaching, or unnecessary disclaimers.

For a complete-algorithm integration scene, first derive one global execution model from W2 before storyboarding motion:

```text
initial objects and persistent state S0
  → paper operation / computation A1 → state S1 + temporary values T1
  → paper operation / computation A2 → state S2 + temporary values T2
  → update, task boundary, or save → cross-round state S3
  → prediction / output Y
```

Distinguish paper state, computed/derived values, and teaching-only visible state. The visible state may reveal the first two categories but must not alter their meaning. Reuse verified calculations or atomic assets when useful, but redesign the integration scene's overall composition, hierarchy, transitions, narrative focus, and state visibility for whole-system understanding; do not qualify a scene by concatenating earlier components.

Record only the semantic moments that create understanding or carry risk; there is no required frame count, duration, or stage layout.

| Moment / W2 operation | Entering state | Computation / trigger | Leaving state | Graphic action | Text and formula alignment | Protected invariants | Reproducible verification |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |

## Specific Upstream Contract Conflict (only if needed)

Most projects need no entry here. Record only a concrete conflict that prevents the approved design from fitting the current upstream contract, and the decision needed to resolve it. Do not duplicate chapter, module, or component mappings; the user's W10 preflight checks the actual release source against the current official contract after W9 acceptance.

- Conflict and affected approved design:
- Evidence from the current official contract/validator:
- Decision needed:

## Visual QA State Plan

List only the pages, states, and viewports relevant to this project or revision. Follow docs/VISUAL_QA.md.

| Page / area | State | Viewport | Observable expectation |
| --- | --- | --- | --- |
|  |  | 1440x900 / 1920x1080 |  |

## Primary Spine Mapping

The YAML below is the sole structured source for implementation coverage. Give each CORE item one stage and one `primary_vehicle`. Use only stage IDs already defined by the Learning Spine. `supporting` and `reference` map lower-priority items to their placements; DELETE items do not appear here.

```yaml
implementation:
  stages: []
  assets: []
  supporting: []
  reference: []
  vertical_slice:
    stages: []
    required_core_items: []
```

Each `stages` entry requires `id`, `page`, `core_items`, `evidence_refs`, `primary_vehicle`, `reusable_pattern`, and `reason`. `reusable_pattern` may be null; a non-null name must exist in `reusable-kit/registry.yaml` or W5 fails. For a continual-learning paper, use `python tools/paper.py scaffold-kit <paper-id> --preset continual-learning --add ComponentA,ComponentB` to copy the default P0 sources and any P1 components selected in this plan in one operation. Each `supporting` / `reference` entry has an `item` ID and a `placement`. The vertical slice lists the implementation stages and CORE IDs that W6 must finish.

Each selected public asset also appears once in `assets` with its asset-plan ID, a Learning Spine stage (or `Reference Hub`), and a `rendering` choice: `original`, `crop`, `redraw`, or `overlay`.

## Reusable Pattern Library

Check applicable patterns before inventing a new interaction: Architecture Explorer, Flow Stepper, Branch Highlighter, Before/After Comparator, Timeline, Evidence Viewer, Term Hover, Reference Hub, Expandable Detail, Result Protocol Card. Record the pattern selected, copied/adapted source location, and paper-specific changes. Check the exact reusable pattern identifier in `reusable-kit/registry.yaml`. Copy source into this paper's `web/enhanced/src/`; do not import another paper's runtime.

## Vertical Slice (W6)

Name the first 2–3 spine stages included where that range fits the content, the smallest end-to-end cognitive progression a learner can genuinely experience, included source figures, and what can be reviewed without implementing the rest. The slice should carry the reader from a perceived problem through an introduced mechanism to an observable conclusion and a natural next question, not merely collect clickable components.

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

## Human Acceptance Record

Keep the original approved decisions, later user reconfirmations, affected stages, changed invariants, and required W7/W9 re-reviews here; do not create duplicate review documents or manually reset completed workflow states. If a W8/W9 finding requires changing an approved W4/W5 decision, first state the impact and review scope, obtain the relevant human reconfirmation, and revisit affected learning acceptance before claiming PASS.
