# Paper Model: {{paper_title}}

Paper ID: `{{paper_id}}`<br>
Source: {{paper_url}}

## Core Explanation

In one short paragraph: what problem did the paper address, what key change did the authors make, and why could that change work?

## Problem

## Core Insight

## Prerequisites

| Concept | Required / Helpful / Optional | Depth needed |
| --- | --- | --- |
|  |  |  |

## Objects and Variables

| Object / variable | Meaning in this paper | Owner / creator | Evidence locator |
| --- | --- | --- | --- |
|  |  |  |  |

## Architecture and Ownership

Describe components, connections and branches, inputs and outputs, shared parts, and task-specific parts.

## Data Flow

```text
Input → ... → intermediate state → ... → output
```

## State and Time

Describe what is created, retained, changed, frozen, or discarded, and when.

## Algorithm Execution Model

Integrate the paper's real execution order here instead of repeating the local mechanism descriptions in Data Flow, State and Time, Training, or Inference / Runtime.

### Source Algorithm and Reconstruction Basis

Prefer the paper's own algorithm or pseudocode. Identify its locator and explain any normalization, omitted presentation detail, or mapping into the version below. If the paper has no formal algorithm, label this as a reconstruction and cite the equations, prose, figures, or appendices that support the ordering; do not present a reconstructed procedure as the paper's named Algorithm.

### Inputs and Initialization

List the model, data, parameters, persistent state, available history, and assumptions that exist before execution starts.

### Executable Pseudocode

```text
initialize model, data, parameters, and persistent state
for each applicable task / round / step in the paper's real order:
    read the state and inputs required by this step
    execute training, update, selection, storage, or other key branches
    commit the values and persistent objects needed by the next step
return the paper-defined trained state or output
```

Include the actual training/update order, important branches, update results, and multi-round loops. Point key operations to paper pages, equations, algorithms, or sections without attaching a redundant citation to every line.

### Prediction / Inference Entry

Describe inference separately: its entry point, inputs, required trained or persistent state, processing order, and outputs. If evaluation occurs between rounds, place it at the paper's actual timing rather than treating it as the final inference path.

### State Classification

| State / value | Created or read when | Temporary / derived / persistent | Frozen / updatable | Consumed or retained by |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Training

For papers with training, record inputs, targets/supervision, outputs, losses, backward/control signals, optimizer/update behavior, and evidence. Otherwise explain the relevant system operation.

## Inference / Runtime

Trace a complete runtime path, including feedback or failure paths when they matter.

## Core Equations

Include only relationships required to understand the main mechanism. Define terms, inputs, outputs, purpose, and source locator.

## Results

For each key result, record the question, dataset/environment, model, split, metric, baseline, protocol, result, and supported conclusion.

## Limitations

Separate author-stated limits and future work from evidence-based analysis.
