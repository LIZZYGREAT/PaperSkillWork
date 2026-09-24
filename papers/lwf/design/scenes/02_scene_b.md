# Scene B — What can each training route use and change?

## Learning Goal

Compare the data source and trainable parameter groups for feature extraction, fine-tuning, joint training, and LwF.

## Knowledge Dependencies

- Required: Scene A; `shared_parameters`; `task_head`.

## Persistent Objects

Reuse the shared CNN, old and new task heads, old-data availability, new input/label, and old-model response path.

## System State

Each method is a distinct data/parameter policy. For LwF, old-task images and labels are unavailable, while an old model can still run on the visible new input.

## Core User Actions

Select a training route and inspect its available inputs, frozen/trainable parameter groups, and objective. A static comparison table is acceptable if it supports the same reconstruction.

## State Transitions

Method selection changes the active data and parameter policy, not the underlying paper data.

## Architecture / Data Flow

| Route | Old examples/labels used? | Shared parameters updated? | Distinguishing constraint |
| --- | --- | --- | --- |
| Feature extraction | No | No | New head learns from fixed representation |
| Fine-tuning | No | Yes | Adapts shared model from new-task supervision; old task may decline |
| Joint training | Yes | Yes | Requires old-task data and labels |
| LwF | No | Yes in joint-optimize | Old model outputs on new input supply an old-task target |

## Mathematical Model

This scene specifies data and parameter policy; loss details are introduced after the teacher signal is identified.

## Implementation Mapping

For each route, parameter freezing and optimizer membership determine which values can change. LwF's new input is passed through an old model to form a target; do not map that response to a replay buffer.

## Paper Evidence

`C01` `C02` `A01` `A02` `A04` `A07`

## Teaching Toy Boundary

The comparison is a paper-grounded method map, not a benchmark of time, memory, or universal performance.

## Prerequisite Terms

`shared_parameters` `task_head` `replay` `joint_training`

## Reconstruction Test

Without the page, the learner can sketch four routes and annotate each with old data availability and which parameter groups can change.

## Implementation Trace Test

The learner can state which data feed each method, which parameters are frozen or trainable, and why LwF's response target is neither a label nor a stored example.

## Global Dependency Test

- **Consumes:** Scene A's problem and method-independent model parts.
- **Produces:** an explicit route comparison and the old-model-on-new-input path.
- **Used later by:** Scene C traces the LwF signal; Scene D traces the training phases.

## Deletion Test

Removing this comparison would make the LwF data assumption and the difference from replay/joint training hard to infer.

## Acceptance Questions

1. Which route requires old-task training data?
2. Which route freezes shared features, and what is LwF's source of old-task supervision?

## Accessibility

Use a semantic table or labeled controls. Every selected state has visible text.

## Mobile

Allow each method to become a stacked card with the same data and parameter labels.

## Non-goals

Do not claim one route wins for every task or show unsupported speed and memory figures.
