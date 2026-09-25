# Learning Architecture: Overcoming catastrophic forgetting in neural networks

Paper ID: `ewc`

## Ten-page contract

The tutorial has **exactly 10 pages total, including the opening page**. The opening page frames the contradiction, summarizes the problem, and introduces the paper's contribution. Pages 07–10 analyze experiments, compare evidence, and reconstruct the method. There is no additional cover, video page, or appendix page in this count.

| Page | Title | Learning role | Main interaction |
| --- | --- | --- | --- |
| 01 | 研究问题与论文导读 | Introduce sequential-task conflict, question, contribution, and route | Reveal the old/new objective conflict and paper question |
| 02 | 为什么任务 B 会覆盖任务 A？ | Establish interference and stability/plasticity tension | Compare B-only, uniform penalty, and EWC signals |
| 03 | 任务 A 的信息怎样传给 B？ | Derive the sequential Bayesian handoff | Step through A posterior → B likelihood |
| 04 | Fisher 怎样决定参数偏移代价？ | Explain local precision, diagonal Fisher, and lost coupling | Adjust a labeled toy parameter and switch matrix view |
| 05 | 一次 EWC 更新到底改变什么？ | Combine objective, gradient, and optimizer semantics | Recompute penalty and one plain-SGD teaching step |
| 06 | 任务边界上的状态如何流转？ | Trace data, anchor, Fisher, current parameters, and multi-task memory | Select lifecycle stages and inspect read/write ownership |
| 07 | Permuted MNIST 如何构造？ | Present model, task protocol, and controlled comparisons | Inspect protocol facts and baseline conditions |
| 08 | MNIST 结果支持哪些结论？ | Analyze qualitative curves and Fisher overlap separately | Switch performance/overlap evidence and inspect claim limits |
| 09 | Atari 结果属于整个系统 | Analyze DQN components, score protocol, result, and limits | Select system component and classify claims |
| 10 | 综合结论与 EWC 全流程 | Compare both experiments and reconstruct the causal chain | Play, pause, step, and reset an annotated state-flow animation |

The left sidebar, previous/next controls, keyboard navigation, progress count, and Reference Hub use this same ten-page map. Page count must be identical in Canonical and Enhanced.

## Concept Dependency Graph

```text
page 01: sequential-task contradiction + paper question
  → page 02: shared mutable θ can serve conflicting task objectives
  → page 03: p(θ|D_A) becomes a prior factor for task B
  → page 04: local Gaussian/Laplace view + diagonal Fisher precision
  → page 05: quadratic penalty contributes a restoring gradient
  → page 06: task-boundary state and per-task reference lifecycle
  → page 07: Permuted MNIST protocol
  → page 08: MNIST performance comparison ≠ Fisher-overlap analysis
  → page 09: Atari evidence belongs to a larger DQN system
  → page 10: compare evidence, bound conclusion, replay the full state flow
```

## Persistent Workspace and State Ownership

Keep the current task, current parameters `θ`, saved old-task anchors `θ*`, per-task diagonal importance estimates `F`, current loss/gradient, `λ`, and next optimizer result visible in the shared workspace. Distinguish three classes: mutable training state, saved reference state, and configuration. Example vectors are Teaching Toy state only. Evidence cards never inherit toy values.

At a task boundary, the conceptual paper state retains each previous task's `θ*_k` and `F_k` term for the EWC objective. During task B, the current `θ` and `L_B` change; old anchors and Fisher estimates are read as references. After task B, its solution and importance estimate are added for later tasks. Do not silently replace the paper's per-task terms with the later online-EWC consolidation variant.

## Page Specifications

### Page 01 — Research question and paper overview

- **Entry point:** A shared parameter vector is optimized as tasks arrive in sequence; retaining old data is not assumed.
- **Core contradiction:** Updating for B can damage A, while protecting all parameters equally can impede B.
- **Paper question:** Can old-task information be compressed into parameter-wise constraints so new tasks can still learn?
- **Contribution preview:** Sequential Bayesian motivation, local Gaussian approximation, diagonal Fisher importance, and a soft quadratic penalty.
- **Exit capability:** State the problem, the paper's proposed mechanism, and the tutorial route without claiming zero forgetting.
- **Consumes / produces:** C01–C03; produces the need for pages 02–06's mechanism chain.

### Page 02 — Why does task B overwrite task A?

- **Entry knowledge:** Training reduces a task loss by changing shared parameters.
- **New mental model:** B-only updates ignore A; a uniform anchor constrains useful and unimportant parameters alike; EWC weights displacement by old-task importance.
- **Exit capability:** Explain the distinct risks of unconstrained learning and equal-strength protection.
- **Evidence:** C01–C02 and the Figure 1 schematic, not a measured accuracy curve.

### Page 03 — What is transferred from A to B?

- **New mental model:** `p(θ|D_A)` becomes a prior factor when task B arrives; the exact posterior is too complex to keep and will be approximated next.
- **Exit capability:** Reconstruct `p(θ|D_A,D_B) ∝ p(D_B|θ)p(θ|D_A)` and distinguish a posterior from raw replay data.
- **Evidence:** C03, F01.

### Page 04 — How does Fisher weight parameter changes?

- **New mental model:** Around an old solution, diagonal Fisher acts as a local precision/importance estimate; larger `F_i` makes equal displacement cost more, while the parameter can still move.
- **Exit capability:** Explain the Laplace/local-Gaussian motivation and the off-diagonal coupling discarded by the approximation.
- **Evidence:** C03, C10, F02, T02. Toy vectors/matrices remain labeled as invented examples.

### Page 05 — What changes in one EWC update?

- **New mental model:** `L_B` plus a quadratic term produces a combined gradient; the optimizer changes current `θ`, while `θ*` and `F` remain references for that step.
- **Exit capability:** Derive `λF_i(θ_i−θ*_i)` and trace loss → backward gradient → optimizer update.
- **Evidence:** F02–F03, I01–I02, T01.

### Page 06 — What state moves at a task boundary?

- **New mental model:** End A by saving its solution and Fisher estimate; train B using B data and all prior EWC reference terms; after B, add B's own reference pair for later tasks. Old examples are not part of the B penalty path.
- **Exit capability:** Identify which objects are produced, read, mutated, or retained at every boundary; distinguish original per-task EWC from online compression variants.
- **Evidence:** C02–C03, I01–I02. The interactive lifecycle is a conceptual implementation mapping, not the original code or a running neural network.

### Page 07 — How is Permuted MNIST constructed?

- **New mental model:** Each task uses a fixed random pixel permutation across its examples; Figure 2A's network and training protocol can be named before interpreting results.
- **Exit capability:** Reconstruct dataset/task/model/training/baseline facts without inventing plotted values.
- **Evidence:** C04, R01–R02.

### Page 08 — What do MNIST results establish?

- **New mental model:** The reported curves support a qualitative retention/learning comparison for the tested sequence; Fisher overlap separately analyzes parameter-use similarity and is not accuracy.
- **Exit capability:** Compare SGD, uniform quadratic protection, EWC, and the dropout comparison at the level shown by each panel; name the protocol boundary.
- **Evidence:** C05–C06, R01–R02.

### Page 09 — What does the Atari result belong to?

- **New mental model:** The EWC penalty is one component in a larger task-aware DQN with task recognition, per-task replay, and task-specific gains/biases. The metric is clipped human-normalized score; EWC's system improves on plain training but remains below ten separate DQNs.
- **Exit capability:** Explain the system boundary, protocol, result, and uncertainty/capacity limits.
- **Evidence:** C07–C12, R03–R04, B03.

### Page 10 — Compare, conclude, and replay the whole flow

- **Synthesis:** Contrast supervised Permuted MNIST's controlled parameter-interference evidence with Atari's system-level evidence. Conclude that EWC mitigates interference in the reported settings, not that it guarantees zero forgetting, unlimited capacity, or LLM performance.
- **Animation path:** task-A data → optimize `θ_A` → estimate `F_A` → save immutable reference pair `(θ*_A,F_A)` → task-B batch arrives → compute `L_B + penalty` and combined gradient → optimizer mutates current `θ` → evaluate old/new tasks → append B's reference state and continue.
- **Interaction:** Play/pause, previous/next step, jump-to-stage, reset, and a live explanation of current inputs, reads, writes, and retained state. Reduced-motion preference must disable automatic motion while leaving manual step controls available.
- **Boundary:** This generic parameter-state flow does not animate Atari's independent task-recognition/replay/gain-bias subsystems as if they were EWC.

## Full Causal Chain

Task A examples update current `θ` → the learned solution becomes `θ*_A` → Fisher estimates local old-task importance `F_A` → task B arrives without using A examples in its supervised penalty → `L_B` and EWC's quadratic term form a combined gradient → the optimizer mutates current `θ` → task-boundary state is retained per task → MNIST and Atari tests measure outcomes under distinct protocols → experiment evidence bounds the conclusion.

## Architecture Acceptance

- [x] The route contains exactly ten pages including the opening page.
- [x] The opening page states the basic contradiction, problem, and paper contribution.
- [x] Pages 07–10 analyze experiments, compare claims, and synthesize the method.
- [x] The final page specifies a stepwise state-flow animation with manual controls and reduced-motion behavior.
- [x] Canonical and Enhanced must share the ten-page map and sidebar/page controls.

Architecture content is prepared for review; these planning checks are not human gate acceptance.
