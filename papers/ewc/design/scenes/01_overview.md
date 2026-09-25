# Page: 01 — Research question and paper overview

## Learning Goal

Introduce the sequential-learning contradiction, state the research problem, and preview what EWC contributes.

## Knowledge Dependencies

No paper-specific prerequisite. Helpful: `continual_learning`, `catastrophic_forgetting`, `parameter_vector`. Evidence C01–C03.

## Persistent Objects

Task sequence `A → B`; shared parameter vector `θ`; old and new objectives; a compact learning-route map for the ten pages.

## System State

`overviewFocus ∈ {problem, research_question, contribution}`. The selected card emphasizes one part of the overview without changing paper facts.

## Core User Actions

Switch among the problem, research question, and proposed contribution. Follow a ten-page route from contradiction through mechanism, state lifecycle, experiments, comparison, and conclusion.

## State Transitions

The three overview cards reveal the sequential-task conflict, the question of how to retain old-task information, and EWC's Bayesian/Fisher/penalty chain. Reset returns to the problem card.

## Architecture / Data Flow

Task A updates shared `θ` → training on task B changes the same `θ` → old-task performance can decline. EWC's proposed route carries a parameter anchor and importance estimate into B's objective.

## Mathematical Model

No numeric model. Introduce only the conceptual tension between `L_A(θ)` and `L_B(θ)`; defer the Bayesian derivation and full objective to later pages.

## Implementation Mapping

This is an orientation page and does not instantiate a model or measure performance. The page navigator must count it as page 01 of exactly 10.

## Paper Evidence

Registry C01–C03; arXiv v2 Sections 1–2, including Equations (2)–(3).

## Teaching Toy Boundary

No toy values or experimental claims are needed on this page.

## Prerequisite Terms

`continual_learning`, `catastrophic_forgetting`, `parameter_vector`.

## Reconstruction Test

Can the learner state the conflict, the question addressed by the paper, and the method's high-level answer in one causal chain?

## Implementation Trace Test

The route map changes only selected explanatory focus. No data, parameter, gradient, or optimizer state changes.

## Global Dependency Test

- **Consumes:** C01–C03 and basic knowledge of neural-network training.
- **Produces:** A problem representation and a question to resolve on page 02.
- **Used later by:** Pages 02–10.

## Deletion Test

Without the overview, readers would encounter mechanisms before understanding the contradiction or the paper's central question.

## Acceptance Questions

1. Does the first page explain that one shared parameter set must serve sequential tasks?
2. Does it introduce both forgetting and the cost of overly strong protection?
3. Does it describe EWC as a soft importance-weighted constraint rather than a zero-forgetting guarantee?

## Accessibility

Use native buttons and links, a visible active state, descriptive page labels, and a focusable page heading after navigation.

## Mobile

Stack overview cards and keep the research question and contribution readable without horizontal scrolling.

## Non-goals

Do not derive Fisher, present experimental numbers, or show the full end-to-end flow here.
