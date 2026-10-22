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
- `templates/paper-model.md`

## Preconditions

Read bibliographic and source metadata from `paper.yaml` before asking the user for any such detail. Do not repeat questions for recorded values. If a value is missing or incorrect, update `paper.yaml` and synchronize the relevant source-cache metadata rather than creating another intake form.

- Confirm paper identity, source version, and reader context if supplied.
- Confirm the source cache covers the entire paper. If incomplete or incorrect, repair the extraction as a whole before modeling; do not accumulate unsystematic fragments.
- If the source is unavailable, report what is missing instead of filling gaps from memory.

## Procedure

1. Write the short Core Explanation: original problem, key author change, and why it may help.
2. Define the problem and necessary prerequisites.
3. Identify core objects/variables, their owners, architecture, branches, inputs, outputs, and shared/task-specific parts.
4. Trace data flow and state/time from input to output.
5. Build the **Algorithm Execution Model** from the source before designing a teaching order:
   - prefer and locate the paper's own algorithm or pseudocode;
   - when no formal algorithm exists, label the procedure as a reconstruction and cite the prose, equations, figures, or appendices that establish its ordering;
   - state inputs and initialization, then write executable pseudocode with the real processing order, important branches, updates, and applicable multi-round loops;
   - separate the prediction/inference entry from training, including the trained or persistent state it reads and any inter-round evaluation timing;
   - classify important values as temporary, derived, cross-round persistent, model parameters, frozen values, or updatable values.
6. Use Data Flow, State and Time, Training, and Inference / Runtime to explain architecture and local mechanisms; do not restate a second full algorithm in each section. The Algorithm Execution Model is the coherent integration point.
7. Explain training and inference/runtime as applicable, including supervision, loss, control/gradient flow, and actual updates.
8. Select only equations essential to understanding the main mechanism; define every important term and relationship.
9. Summarize evidence-bearing experiments, conditions, results, and limitations.
10. Save `research/paper-model.md`. Figure inventory remains in the source-cache manifest; do not duplicate it here.

## Validation

- A reader can state the problem, core insight, architecture, and a complete flow.
- From the model alone, a reader can identify the initial state, one concrete operation, the resulting state, what survives into the next round, and the inference entry; teaching convenience has not changed the paper's real execution order.
- Objects and variables are defined before use; system ownership/state is traceable.
- Core pseudocode, equations, and state transitions have source locators, and reconstructed procedures are not misrepresented as the paper's own Algorithm.
- The source cache and paper model agree on version and locators.
- No UI, animation, interaction, analogy, or chapter design appears in the model.
- No result is broader than its protocol supports.

The W2 `stage ... complete` command checks only the new execution-model structure: required section/subsections, non-template inputs/inference/state content, and a non-empty, non-template pseudocode block. It does not infer whether the algorithm is executable or faithful to the paper; that remains a human W2 and evidence-audit judgment. Routine `check` does not apply this new requirement retroactively to already accepted W2 artifacts.

## Forbidden Actions

- Do not design web pages or interactions.
- Do not conflate paper claims with implementation mappings or teaching examples.
- Do not advance W2 automatically.

## Completion Criteria

Save the model and have a person verify that its core explanation matches the complete source. W2 is a human review gate; after acceptance, record it with `python tools/paper.py stage <paper-id> W2 complete --reviewed-by "Name" --note "Paper model matches the source"`.
