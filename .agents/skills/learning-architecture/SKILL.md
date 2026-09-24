---
name: learning-architecture
description: Design a dependency-driven learning path from the reviewed paper model and evidence registry for Gate G4.
---

# Learning Architecture

## Purpose

Design a sequence that lets a first-time reader reconstruct the paper. The structure is driven by conceptual dependencies, not paper order, chapter symmetry, or interaction count.

## Required Inputs

- `design/learning-contract.md`
- `research/01_paper_model.md`
- `research/02_evidence_registry.yaml`
- `templates/learning-architecture.md`

## Procedure

1. Read the reader, prerequisites, outcomes, depth, and evidence needs in the Learning Contract.
2. Build the Concept Dependency Graph: what must be understood first, what depends on it, and why.
3. Identify prerequisite gaps and decide where the main path must explain them.
4. Define persistent objects or a shared workspace when reusing the same system improves reconstruction.
5. Define scenes around unresolved questions. For every core scene, state entry knowledge, question, new mental model, persistent objects, exit capability, and next question.
6. Record each scene's `Consumes`, `Produces`, and `Used later by` links.
7. Check the complete causal chain from problem through architecture, mechanism, update/runtime, evidence, and limits.
8. Only then consider an optional analogy or visual form. State its mapping, boundary, and removal condition.
9. Save `design/learning-architecture.md` and resolve all teaching claims to evidence IDs.

## Validation

- The order follows prerequisite dependencies and explains why each transition is natural.
- Every core scene has a clear entry and exit capability.
- The whole path forms a connected model rather than unrelated demonstrations.
- No analogy or presentation form is required by default.

## Forbidden Actions

- Do not begin by selecting chapter count, a site-wide metaphor, or animations.
- Do not specify canvas dimensions, animation timing, slider ranges, or SVG coordinates.
- Do not make Enhanced copy Canonical's teaching structure by default.
- Do not advance G4 automatically.

## Completion Criteria

Save an architecture that can be reviewed without application code and verify all claims against the registry.
