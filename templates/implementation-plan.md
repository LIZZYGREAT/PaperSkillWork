# Implementation Plan: {{paper_title}}

Paper ID: `{{paper_id}}`

## Learning Goal and Non-goals

State the learner outcome this page must enable. List details deliberately kept in Reference or omitted. Do not start with a fixed chapter count, animation plan, or interaction quota.

## Design Handoff, Invariants, and Change Scope

Record the latest confirmed W4/W5 decisions here. Keep this as the single project-level decision source.

- Design confirmation: DRAFT / CONFIRMED (the user approved the target and constraints).
- Rendered-page acceptance: PENDING / PASS / REVISE (the user reviewed the actual browser rendering; this is separate from design confirmation).
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

Name the first 2–3 spine stages included, the smallest end-to-end learner task, included source figures, and what can be reviewed without implementing the rest.

### Vertical Slice Review (W7)

Vertical Slice Review: PENDING

- Reviewer:
- Decision: PASS / REVISE
- Can the reviewer explain the problem and core idea after using the slice?
- Can the reviewer reconstruct the architecture and one complete information/state flow?
- Was any key explanation hidden in hover or omitted?
- Were any formulas, toys, or interactions unnecessary?
- Required information-architecture changes:

If the review is REVISE, update the spine/plan and repeat the slice review before W8.

## Full Implementation (W8)

List the remaining CORE stages to complete. List compact placements for SUPPORTING material and the Reference Hub/advanced locations for REFERENCE. Confirm DELETE items stay out.

## Human Acceptance Record

Keep concise decisions, approved design changes, protected invariants, and follow-up changes here; do not create duplicate review documents.
