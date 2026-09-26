# Learning Spine: {{paper_title}}

Paper ID: `{{paper_id}}`

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

Explain why each stage follows the previous one. Keep the whole spine readable as one continuous argument.

## Human Review

- Can a new reader state the problem and central idea from this order?
- Can the reader reconstruct the architecture and one complete flow?
- Is anything required to understand the main mechanism incorrectly placed in Reference?
- What correct but unnecessary content was deleted?

Record reviewer and decision in `paper.yaml` only after the review.
