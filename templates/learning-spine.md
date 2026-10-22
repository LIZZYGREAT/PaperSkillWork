# Learning Spine: {{paper_title}}

Paper ID: `{{paper_id}}`

## Overall Reading Goal

State the important questions the reader should be able to explain after the tutorial and the complete paper algorithm they should be able to reconstruct, from initialization through persistent-state handoff to prediction/output.

## Primary Learning Spine

State one causal/runtime path through the paper in 5–8 logical stages where practical. This is not a chapter outline.

```text
Problem → ... → mechanism → ... → evidence and limits
```

## Priority Matrix

Use the fenced YAML as the machine-readable source of item IDs, stage assignments, and placements. Keep each content item ID unique and assign each item once. `CORE` belongs to one spine stage; `SUPPORTING` must have a compact placement; `REFERENCE` has no mainline stage; `DELETE` is omitted.

```yaml
stages: []
items: []
```

An item example: `{id: C01, title: "Core mechanism", priority: CORE, stage: S1, placement: mainline, evidence_refs: [C01]}`.

## Reader's Causal Path

Write enough connected prose to support page authoring: begin from the reader's existing knowledge and the paper's real constraint, then move through the insufficiency, a natural line of exploration, the paper's mechanism, its observed effect, and the next unresolved question. This is a reasoning framework, not five required headings or cards. An opening orientation may introduce the research task, motivation, and problem, but neither a P0 label nor a fixed opening format is required.

For each major segment, explain what facts or state the reader already has, what new problem appears, why a mechanism or mathematical tool is needed now, what new understanding results, and which question or state is handed to the next segment. Do not submit only terse field labels such as `question: ...`; W4 is not a page script, but its prose must make the reasoning auditable.

## Cognitive Dependencies

Name the primary teaching location for each core concept or term, the prior conclusion later stages must briefly recover, knowledge that must not be introduced early, and the boundary that prevents later pages from repeating the full first explanation. Restore essential context with a light reference rather than assuming every number, symbol, or term remains in memory.

## Mathematical Expression Strategy

For each important complex expression, state the intuitive meaning that must exist first, where formal notation becomes necessary, and whether a small concrete case, explicit sum, substitution, geometric interpretation, or derivation should precede the general form. Specify the teaching purpose and cognitive timing, not a visual layout, animation, or technical component.

## Complete Algorithm Integration

Identify at least one dedicated integration stage, wherever it naturally belongs. Map it to the real ordering, persistent state, cross-round handoffs, branches, and prediction/output in W2's Algorithm Execution Model. Explain what the reader already learned before this stage and how the stage reorganizes those mechanisms into one system-level execution scene without teaching every concept again or merely concatenating earlier components.

## Human Review

- Can a new reader state the problem and central idea from this order?
- Can the reader reconstruct the architecture and the real algorithm from initialization, through a concrete update and cross-round state, to prediction/output?
- Is anything required to understand the main mechanism incorrectly placed in Reference?
- Does each CORE stage follow from a clear gap, without unexplained terms or repeated full explanations?
- Are terms and mathematical tools introduced at the point of need, with complex expressions explained at appropriate depth rather than front-loaded or hidden?
- Does the integration stage have its own system-level teaching purpose and cover W2's execution model instead of mechanically joining earlier pages?
- What correct but unnecessary content was deleted?

Record reviewer and decision in `paper.yaml` only after the review.
