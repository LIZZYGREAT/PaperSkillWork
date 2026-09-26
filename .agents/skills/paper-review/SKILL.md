---
name: paper-review
description: Build a source-grounded model of what a paper does for Workflow v3 stage W2.
---

# Paper Review — W2

## Purpose

Establish what the paper does before planning pages or interactions. Do not summarize it chapter by chapter.

## Required Inputs

- `paper.yaml` and the declared paper source
- `source-cache/content.md` and `source-cache/manifest.json`
- `templates/paper-model-v3.md`

## Preconditions

- Confirm paper identity, source version, and reader context if supplied.
- Confirm the source cache covers the entire paper. If incomplete or incorrect, repair the extraction as a whole before modeling; do not accumulate unsystematic fragments.
- If the source is unavailable, report what is missing instead of filling gaps from memory.

## Procedure

1. Write the short Core Explanation: original problem, key author change, and why it may help.
2. Define the problem and necessary prerequisites.
3. Identify core objects/variables, their owners, architecture, branches, inputs, outputs, and shared/task-specific parts.
4. Trace data flow and state/time from input to output.
5. Explain training and inference/runtime as applicable, including supervision, loss, control/gradient flow, and actual updates.
6. Select only equations essential to understanding the main mechanism; define every important term and relationship.
7. Summarize evidence-bearing experiments, conditions, results, and limitations.
8. Save `research/paper-model.md`. Figure inventory remains in the source-cache manifest; do not duplicate it here.

## Validation

- A reader can state the problem, core insight, architecture, and a complete flow.
- Objects and variables are defined before use; system ownership/state is traceable.
- The source cache and paper model agree on version and locators.
- No UI, animation, interaction, analogy, or chapter design appears in the model.
- No result is broader than its protocol supports.

## Forbidden Actions

- Do not design web pages or interactions.
- Do not conflate paper claims with implementation mappings or teaching examples.
- Do not advance W2 automatically.

## Completion Criteria

Save the model and have a person verify that its core explanation matches the complete source. W2 is a human review gate; after acceptance, record it with `python tools/paper.py stage <paper-id> W2 complete --reviewed-by "Name" --note "Paper model matches the source"`.
