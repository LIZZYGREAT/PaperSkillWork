---
name: learning-architecture
description: Produce a causal primary learning spine and information priority matrix for Workflow v3 stage W4.
---

# Learning Spine — W4

## Purpose

Choose the one continuous path that lets a first-time reader understand the paper. This is not a chapter list.

## Required Inputs

- `research/paper-model.md`
- `research/evidence-registry.yaml`
- Reader assumptions supplied for the paper
- `templates/learning-spine.md`

## Procedure

1. Start from the paper's problem and causal/runtime logic, not its section order.
2. Compress that logic into about 5–8 stages where practical; adapt when the paper calls for another shape.
3. For every content item, assign one unique ID and exactly one priority: `CORE`, `SUPPORTING`, `REFERENCE`, or `DELETE`.
4. Assign every CORE item to one mainline stage. Supporting items get compact placement. Reference items stay outside the mainline in hover/Reference Hub/advanced details. Delete irrelevant, repeated, or over-costly items even when factually correct.
5. Resolve spine content to evidence IDs and state why each stage follows the prior one.
6. Save `design/learning-spine.md` and request a human review before W4 is accepted.

## Validation

- One continuous, explainable causal/runtime path exists.
- All CORE items are assigned to the path, without duplicate item IDs.
- Supporting content remains compact; reference content does not take a mainline scene.
- The spine lets a reviewer reconstruct problem, idea, architecture, flow, evidence, and limits.

## Forbidden Actions

- Do not set chapter count, analogy, animation, or interaction quotas.
- Do not design a control because a concept is adjustable.
- Do not use the spine to restate every detail in the paper.
- Do not advance W4 automatically.

## Completion Criteria

A person confirms the learning order and priorities before W4 is marked complete. Record acceptance with `python tools/paper.py stage <paper-id> W4 complete --reviewed-by "Name" --note "Learning spine and priorities accepted"`.
