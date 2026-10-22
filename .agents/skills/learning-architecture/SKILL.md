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

1. State the overall reading outcome: the questions the reader should explain and the real algorithm they should reconstruct after the tutorial.
2. Start from the reader's existing knowledge, the paper's problem, and its causal/runtime logic, not its section order. An opening orientation may establish the task and motivation without requiring a P0 label or fixed format.
3. Build a continuous reasoning path in the project's own natural shape. About 5–8 stages is often workable, but neither the count nor a first-round/second-round/third-round sequence is a requirement.
4. For every major segment, write the known facts/state, the newly exposed problem, the reason a mechanism or mathematical tool is needed now, the resulting understanding, and the handoff to the next segment. Treat these as reasoning prompts, not page fields.
5. Assign each core concept one primary teaching location. Record which earlier conclusions later stages must recover lightly, which later knowledge must not be introduced early, and where a brief reference replaces repeated full explanation.
6. For important complex mathematics, plan the cognitive progression: required intuition, point of formal introduction, useful small cases or explicit expansion, and required rigor. Do not select layouts, animations, or technical components in W4.
7. Include at least one dedicated algorithm-integration stage grounded in W2's Algorithm Execution Model. It must cover the real ordering, persistent state, cross-round handoffs, relevant branches, and prediction/output while reorganizing already learned mechanisms into a whole rather than reteaching or concatenating them.
8. For every content item, assign one unique ID and exactly one priority: `CORE`, `SUPPORTING`, `REFERENCE`, or `DELETE`.
9. Assign every CORE item to one mainline stage. Supporting items get compact placement. Reference items stay outside the mainline in hover/Reference Hub/advanced details. Delete irrelevant, repeated, or over-costly items even when factually correct.
10. Resolve spine content to evidence IDs, save `design/learning-spine.md`, and request a human review before W4 is accepted. Keep the existing `stages` / `items` YAML as the only machine-readable priority and coverage source; do not add a page-by-page schema.

## Validation

Use docs/TEACHING_DESIGN_STANDARD.md as the review contract. Read the spine from a learner's perspective and verify that each mechanism or mathematical tool answers a problem the reader can already perceive. Field names without explanatory prose are not sufficient, but W4 need not be a verbatim page script.

- One continuous, explainable causal/runtime path exists.
- All CORE items are assigned to the path, without duplicate item IDs.
- Supporting content remains compact; reference content does not take a mainline scene.
- Terms have one primary teaching location; later stages recover needed context without either assuming perfect memory or repeating the full explanation.
- Important mathematics has an explicit cognitive entry and an explanation strategy proportionate to its role and complexity.
- The spine lets a reviewer reconstruct problem, idea, architecture, evidence, limits, and the complete W2 execution path through its dedicated integration stage.

## Forbidden Actions

- Do not set chapter count, analogy, animation, or interaction quotas.
- Do not turn the reasoning prompts into a required card sequence or introduce a second page-level YAML/JSON schema.
- Do not design a control because a concept is adjustable.
- Do not use the spine to restate every detail in the paper.
- Do not advance W4 automatically.

## Completion Criteria

A person confirms the learning order and priorities before W4 is marked complete. Record acceptance with `python tools/paper.py stage <paper-id> W4 complete --reviewed-by "Name" --note "Learning spine and priorities accepted"`.
