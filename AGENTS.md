# PaperSkillWork Repository Rules

## Primary Product Principle

The primary deliverable is not an animated paper summary. It is an executable mental model of the paper.

For every core mechanism, the tutorial should help a first-time learner reconstruct, when applicable:

1. what the object is;
2. where it lives;
3. when it exists;
4. who creates it;
5. what it consumes and produces;
6. how state changes;
7. how tensors, shapes, or messages change;
8. where gradients or control signals flow;
9. what actually updates;
10. which evidence supports the claim;
11. where the mechanism fails.

Do not optimize for interaction count, animation coverage, metaphor consistency, chapter symmetry, or Canvas usage. Optimize for conceptual reconstruction, implementation traceability, causal clarity, and evidence boundaries.

## Repository and Release Rules

1. Every paper lives under `papers/<paper-id>/`.
2. Paper facts come from the source paper and its evidence registry or legacy evidence audit.
3. Canonical and Enhanced remain separate artifacts. Canonical is a compatibility and build baseline; it does not dictate Enhanced teaching structure.
4. Do not modify a frozen `web/canonical/` artifact.
5. PaperSkill is a separate release repository; use its official import flow.
6. `tools/paper.py` checks files, schema, and workflow state. Skills guide semantic reasoning.
7. Never advance a workflow gate without explicit human verification.
8. Keep accessibility, reduced-motion, mobile, build validation, interaction deletion checks, human acceptance, and release boundaries.
9. Do not require an animation, a fixed number or pattern of interactions, a single analogy, or a particular rendering technology.
10. Build success does not override a learning or evidence failure.
11. Every G1 paper model classifies the paper's topic, problem type/setting, and research direction with source evidence. G6 displays these as compact tags below the first-page title with explanations available on hover, keyboard focus, and touch; essential content must not live only in a tooltip.
12. G1/G2 inventory the figures, tables, and other source visuals in the paper. Preserve clear, valuable paper-provided visuals in `assets/figures/` and plan to explain selected items in the relevant web scene; record source, page/figure ID, processing, evidence links, and reuse rights. Do not impose a blanket ban on original paper figures or publish assets whose reuse rights are unclear.
