# Paper Model: {{paper_title}}

Paper ID: `{{paper_id}}`\
Source: {{paper_url}}

## Problem

## Research Positioning

| Field | Source-grounded classification | Evidence / source location |
| --- | --- | --- |
| Topic | Broad research area and central phenomenon |  |
| Problem type / setting | Concrete task, constraints, and data or system conditions |  |
| Research direction | Technical approach contributed by this paper |  |

Keep the three fields distinct. Avoid unsupported taxonomy labels and claims broader than the paper's evidence. These reviewed labels and explanations are used for the first-page topic tags.

## Prerequisite Map

| Concept | Required / Helpful / Optional | Depth needed | Source |
| --- | --- | --- | --- |
|  |  |  |  |

## Core Objects and Variables

| Object / symbol | Definition | Role in this paper | Evidence |
| --- | --- | --- | --- |
|  |  |  |  |

## Architecture and Ownership

Describe the components, boundaries, and who owns or creates each object.

## State and Time

Explain when objects are created, frozen, updated, replaced, or destroyed.

## Data / Tensor Flow

Trace inputs through transformations to outputs. Include shape/type where applicable.

## Transformations and Formulas

For each central formula, define its inputs/outputs, motivation, affected objects, and evidence.

## Optimization / Update

Trace gradient or control-signal sources, optimizer membership, and the operation that changes state.

## End-to-End Runtime

```text
Input → ... → Output
```

Include relevant feedback and failure paths.

## Experiments

For each experiment, state the question, dataset/environment, model, split, metric, baseline, protocol, result, supported claim, and unsupported inference.

## Source Visual Inventory

Inspect the full source paper. Include figures, tables, diagrams, and visual evidence, even when an item will not be shown on the web. Link each item to its claim/evidence IDs and record a reason for every `SOURCE_ONLY` or `OMIT` decision.

| Source/version, ID / PDF page | Paper caption / content | What it communicates and teaching value | Evidence IDs | Decision (`WEB` / `SOURCE_ONLY` / `OMIT`) and rationale | Reuse rights / attribution | Preserved source path | Web asset path / processing | Scene and planned explanation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |

For a selected visual, preserve a faithful high-resolution source under `assets/figures/original/` and a separate web-ready copy under `assets/figures/web/`. Record whether the source is an extracted figure or a faithful crop from the PDF. Never overwrite the preserved source. A valuable paper image should normally be shown and explained in its scene when reuse is permitted; do not omit one solely because a custom diagram already exists. Do not publish an image if its reuse rights are unclear.

## Limitations

Separate author-stated limits, future work, and our evidence-based interpretation.

## Reconstruction Matrix

| Object | What | Where | When | Source / producer | Input | Output | Shape | State | Gradient | Update | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |  |  |  |

Mark non-applicable columns `N/A` with a short reason. Do not leave applicable details implicit.
