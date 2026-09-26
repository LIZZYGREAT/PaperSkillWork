---
name: implementation-plan
description: Plan visual and interaction choices after the learning spine, then define the first vertical slice and human learning review.
---

# Implementation Plan — W5 to W7

## Purpose

Translate the reviewed spine into the smallest useful visual plan, then expose the teaching direction to a human before full implementation.

## Required Inputs

- `research/paper-model.md`
- `research/evidence-registry.yaml`
- `design/learning-spine.md`
- `design/asset-plan.md`
- `templates/implementation-plan.md`

## Procedure

1. For each spine stage, ask whether prose, a table, or a selected paper figure already explains it.
2. Visualize only relationships that are hard to understand in text: architecture, branching, data/state flow, lifecycle, training steps, ownership, dependencies, comparisons, or evidence.
3. Check the reusable pattern library first; record what is copied or adapted. Copy helpful source into the paper's own project. Do not add cross-paper runtime imports.
4. Give each concept at most one main explanatory vehicle. Put secondary explanation in compact/supporting form or Reference.
5. Define a first vertical slice of the opening/problem, core architecture, and primary runtime/algorithm flow (usually 2–3 spine stages). Record what a reviewer can learn from it without the remaining pages.
6. Build and present only this slice. Ask a human to judge learning, emphasis, spatial architecture, prose load, unnecessary detail, and whether interactivity adds value.
7. If the slice fails, revise the information architecture and repeat W6/W7. Do not proceed to the full tutorial until a human records PASS.

## Forbidden Actions

- Do not implement all pages before the slice review.
- Do not use interaction, chapter, analogy, animation, or Canvas quotas.
- Do not hide mainline reasoning in hover.
- Do not turn a scalar setting into a large interaction without a learning reason.
- Do not advance W5, W6, or W7 automatically.

## Completion Criteria

The plan identifies the purpose of every planned visual, the source/evidence it relies on, the vertical-slice boundary, and the human review decision before W8 begins.
