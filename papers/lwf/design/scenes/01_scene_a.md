# Scene A — Why does adding a task threaten old behavior?

## Learning Goal

Explain why adding a new task creates a conflict between adapting the model and retaining old-task performance.

## Knowledge Dependencies

- Required: `shared_parameters`, `catastrophic_forgetting`.
- Helpful: `task_head`.

## Persistent Objects

Reuse the trained old model, its shared parameters, its old-task output, and a new task with currently visible inputs and labels.

## System State

The model begins trained on an old task. When a new task is introduced, fine-tuning can change shared parameters; freezing shared parameters avoids those changes but limits feature adaptation.

## Core User Actions

Compare what changes and what data each of fine-tuning, feature extraction, and joint training can use. No numerical result is needed for this problem-setting scene.

## State Transitions

```text
trained old model → new-task update → new-task adaptation plus possible old-task decline
```

## Architecture / Data Flow

The new-task input reaches the shared network. In fine-tuning, shared parameters can update under new-task supervision. In feature extraction, they remain fixed. Joint training would add old-task examples and labels, which are unavailable under this problem's constraint.

## Mathematical Model

No formula is needed here. The causal contrast is which parameter groups can change under the available data.

## Implementation Mapping

`θ_s` corresponds conceptually to shared backbone parameters. A fine-tuning update can change them; a frozen feature extractor excludes them from updates. The exact optimizer configuration is implementation-specific.

## Paper Evidence

`C01` `C06` `A01` `A07`

## Teaching Toy Boundary

Any qualitative old/new outcome comparison is explanatory only. Do not invent an accuracy or animate a made-up performance trajectory.

## Prerequisite Terms

`shared_parameters` `catastrophic_forgetting` `task_head`

## Reconstruction Test

The learner can describe the old-data constraint and explain why changing shared parameters may hurt an old task even while the new task improves.

## Implementation Trace Test

The learner can identify which parameters fine-tuning changes, which feature extraction freezes, and which old inputs/labels joint training would require.

## Global Dependency Test

- **Consumes:** shared model/head concepts and the new-task setting.
- **Produces:** the adaptation-versus-retention problem and old-data constraint.
- **Used later by:** Scene B compares routes; Scene C identifies a usable old-task signal.

## Deletion Test

Removing the comparison would leave the learner with a method name but no causal reason the method is needed.

## Acceptance Questions

1. Why can fine-tuning reduce old-task performance?
2. What does feature extraction give up, and why is joint training outside the data constraint?

## Accessibility

All method states have text labels. Do not require color interpretation or animation timing.

## Mobile

Stack data availability and parameter changes in a single-column comparison.

## Non-goals

Do not describe LwF's training algorithm before the reader understands this problem.
