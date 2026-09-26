# Paper Model: Overcoming catastrophic forgetting in neural networks

Paper ID: `ewc`\
Source: https://arxiv.org/abs/1612.00796, v2 (2017-01-25); PNAS DOI 10.1073/pnas.1611835114. Section and figure locations below refer to arXiv v2; the journal article has the same core method.

## Problem

Continual learning presents tasks in sequence. A network trained on task A reaches parameters `θ*A`; after A's data is no longer available, ordinary training on task B changes the same shared parameters to reduce `L_B`. Changes that help B can interfere with parameters needed by A, so A's performance can collapse. Multitask training can avoid some interference by interleaving all task data, but requires retaining/replaying old examples. The paper asks whether a fixed-capacity network can protect old abilities by slowing updates selectively, without requiring all previous task examples during each new task.

The central hypothesis is that parameters differ in their importance to a learned task. Protecting all parameters equally can block B; allowing all parameters to move freely can damage A. EWC uses a task-specific, soft quadratic constraint whose stiffness varies by parameter (Section 2, Figure 1, Equation 3).

## Research Positioning

| Field | Classification | Evidence / source |
| --- | --- | --- |
| Topic | 持续学习中的灾难性遗忘与任务间干扰 | The paper studies how sequential updates can damage abilities learned on earlier tasks (`C01`, Sections 1–2). |
| Problem type / setting | 固定容量共享网络上的顺序任务学习；用紧凑旧任务状态缓和参数干扰 | Task A's solution and importance estimate constrain learning task B (`C01`–`C03`). The MNIST protocol does not reuse prior task data (`C04`); the Atari evaluation includes per-task replay as part of its larger system (`C07`), so replay-free is not a universal label for the paper. |
| Research direction | 受贝叶斯后验近似启发的参数空间正则化：以对角 Fisher 加权旧参数锚点 | The previous-task posterior is locally approximated by a Gaussian, producing a Fisher-weighted quadratic penalty around the prior solution (`C02`–`C03`, Equation 3). |

These labels distinguish EWC's parameter-space constraint from the surrounding Atari system and do not imply exact Bayesian inference or guaranteed retention (`C03`, `C07`, `C10`–`C11`).

## Prerequisite Map

| Concept | Required / Helpful / Optional | Depth needed | Source |
| --- | --- | --- | --- |
| Neural-network parameter vector and task loss | Required | Recognize `θ`, `L_A`, and `L_B`. | General background; Section 2 |
| Gradient descent and backpropagation | Required | A gradient contributes to an optimizer step; a loss term itself does not mutate a parameter. | General background |
| Sequential task setting | Required | A then B; old examples are not revisited in the MNIST protocol. | Sections 1, 2.1 |
| Bayes rule, likelihood, prior, posterior | Helpful | Read Equation 2 as sequential evidence accumulation. | Section 2, Equations 1–2 |
| Gaussian precision and quadratic forms | Helpful | Read the local approximation and diagonal penalty. | Section 2, Equation 3 |
| Fisher Information | Helpful | Interpret the diagonal as a local importance/curvature proxy used by the paper. | Section 2 |
| DQN and experience replay | Optional | Understand the additional Atari system components, not the EWC penalty itself. | Section 2.2, Appendix 4.2 |

## Core Objects and Variables

| Object / symbol | Definition | Role in this paper | Evidence |
| --- | --- | --- | --- |
| `A`, `B`, `C` | Sequential tasks | Identify which objective is current and which task information is retained. | Equations 2–3; Section 2 |
| `D_A`, `D_B` | Data for tasks A and B | Bayesian derivation separates previous and current task evidence. | Equation 2 |
| `θ` | Network weights and biases | Shared trainable parameter collection. | Section 2 |
| `θ*A` | Parameters found after training A | Center / anchor of A's local approximation and penalty. | Equations 2–3; Figure 1 |
| `F` / `F_i` | Fisher Information matrix / its diagonal entry for parameter i | Diagonal precision and parameter-specific penalty stiffness. | Section 2, Equation 3 |
| `L_B(θ)` | Current task B loss | Supplies the learning signal for the new task. | Equation 3 |
| `λ` | Scalar importance multiplier | Sets the overall strength of old-task protection against the new loss. | Equation 3 |
| `L_EWC` | `L_B + (λ/2) Σ_i F_i(θ_i−θ*A_i)^2` | Objective differentiated during new-task learning. | Equation 3 |
| `c`, `p(c|o_1…o_t)` | Atari task context and inferred context probability | Surrounding task-recognition system chooses the active task context. | Appendix 4.2 |
| Task-specific gains/biases and replay buffers | Atari system state associated with games | Additional components in the evaluated RL agent; not supplied by the EWC penalty. | Section 2.2; Appendix 4.2 |

## Architecture and Ownership

The supervised core is a single network with parameters `θ`. Training task A's data produces a solution `θ*A`. At that point, the EWC mechanism computes/associates a diagonal Fisher estimate `F_A`, and retains the anchor and importance values needed for the next task's constraint. During B, the ordinary B loss and the A penalty are evaluated against the current `θ`; their gradients are combined, then the chosen optimizer updates `θ`. EWC does not replace the network, add a separate old-task model, or itself act as an optimizer.

The posterior interpretation is conceptual state compression: `p(θ|D_A)` becomes the prior factor when considering `D_B`. The implementation approximates that distribution locally around `θ*A`; it does not retain the exact posterior. In the original RL experiment, the whole system also has a task-recognition model, game-specific layer gains/biases, and per-inferred-task replay memories. Keep those owners separate from `θ*A`, `F_A`, and the EWC term.

## State and Time

1. **Before A:** initialize network parameters `θ`; no A anchor or A Fisher exists.
2. **Train A:** batches from `D_A` update `θ` under A's task objective.
3. **Consolidate A:** record the learned solution `θ*A` and compute a diagonal Fisher estimate at the task solution. In Atari, the paper recomputes Fisher at task switches and draws 100 minibatches from the task replay buffer (Appendix Table 2); the paper does not prescribe that Atari sampling detail as a universal supervised estimator.
4. **Train B:** consume B's examples for `L_B`; consume `θ*A` and `F_A` for the penalty. `θ*A` and `F_A` are reference state, not parameters being trained by B's optimizer.
5. **After B / before C:** the paper describes retaining both task constraints or combining two quadratic penalties into one quadratic form (Section 2). Do not imply that one fixed anchor/Fisher pair automatically captures every task without a particular aggregation rule.

## Data / Tensor Flow

For one B batch `x_B, y_B`, a network forward pass with current `θ` produces B's prediction and `L_B`. In parallel, elementwise parameter differences `Δ_i = θ_i − θ*A_i` are multiplied by retained `F_A,i`; the squared, weighted differences are summed and scaled by `λ/2`. The total objective is differentiated with respect to the current trainable parameters. The resulting gradient is passed to the optimizer, which mutates parameters included in its update set. There is no `D_A` input to the B penalty calculation; the saved `θ*A` and `F_A` are the compressed state used instead.

Shapes in a general neural implementation: `θ`, `θ*A`, and diagonal `F_A` have one aligned scalar per trainable parameter (each can be represented as a structure matching the parameter tensors); `L_B` and the total objective are scalars after batch reduction. This is a conceptual mapping, not an assertion about the authors' variable names or storage API.

## Transformations and Formulas

### Sequential Bayes (Equations 1–2)

For task data split into `D_A` and `D_B`, the paper rewrites the posterior so the new-task likelihood is combined with the old-task posterior:

`log p(θ | D_A,D_B) = log p(D_B | θ) + log p(θ | D_A) − log p(D_B)`.

The final term is constant with respect to `θ` for this optimization. The old data's information is represented by the posterior factor; this is the motivation for carrying a compact approximation forward.

### Local approximation and EWC objective (Equation 3)

The paper approximates the intractable previous-task posterior with a Gaussian centered at `θ*A`, using the diagonal Fisher as precision. Its negative log contribution is a diagonal weighted quadratic, giving:

`L_EWC(θ) = L_B(θ) + (λ/2) Σ_i F_A,i (θ_i − θ*A_i)^2`.

`F_A,i` sets how costly a given displacement is; `λ` scales all old-task constraints relative to the new-task loss. For the two-task form, the per-parameter derivative is `∂L_EWC/∂θ_i = ∂L_B/∂θ_i + λ F_A,i(θ_i−θ*A_i)`. The second term points toward the anchor when `F_A,i ≥ 0` and `λ ≥ 0`.

### Approximation boundary

The full posterior's covariance/precision structure is reduced to a factorized Gaussian with a point estimate at the learned parameters and a diagonal Fisher. Cross-parameter correlations are not represented. Fisher is used as a tractable local precision / curvature proxy; do not teach it as a perfect causal measure of task importance or as a guarantee of preserved accuracy.

## Optimization / Update

`L_B` contributes the new-task gradient. The EWC quadratic contributes `λ F_A ⊙ (θ−θ*A)`. Their sum is differentiated with respect to current `θ`; the optimizer applies its normal update to those trainable parameters. The EWC penalty does not directly freeze parameters or modify the optimizer. The anchor snapshot and Fisher buffers are not optimized by the B-step.

For a transparently labeled scalar/vector teaching toy with plain SGD, `θ_next = θ − η[g_B + λ F_A ⊙ (θ−θ*A)]`. This update is pedagogical arithmetic, not a reported experimental trajectory. In an actual optimizer, the parameter update depends on its configured algorithm/state; the paper's general method claim should not be conflated with an implementation API.

## End-to-End Runtime

```text
Initialize shared θ
  → train task A on D_A
  → save anchor θ*A and estimate diagonal F_A
  → task B batch enters current model
  → compute L_B(θ) + λ/2 · Σ_i F_A,i(θ_i − θ*A_i)^2
  → backpropagate total objective
  → optimizer updates current θ
  → evaluate A and B; if another task arrives, retain/aggregate old constraints
```

Failure paths: ordinary B-only updates can damage A; equal-strength constraints can prevent B learning; too much `λ` favors stability at the cost of plasticity, while too little weakens protection. Fisher underestimation can leave parameters insufficiently protected. Finite capacity and task conflict remain.

## Experiments

### Permuted MNIST (Section 2.1; Figure 2 in arXiv v2; Appendix 4.1)

- **Question:** Can one fixed-capacity network learn sequential classification tasks while retaining prior task performance, and does parameter-specific protection help compared with uniform protection?
- **Dataset / tasks:** MNIST. Each task uses a fixed random pixel permutation shared across all examples in that task; each permutation defines a different input mapping. After a fixed training period, the prior task dataset is not used for further training.
- **Model:** Fully connected network with ReLU. Appendix settings vary by panel: Figure 2A uses 2 hidden layers of width 400, no dropout, 20 epochs/dataset; Figure 2B uses 2 layers, width range 400–2000, dropout and early stopping; Figure 2C uses 6 layers of width 100 for Fisher-overlap analysis.
- **Comparisons / protocol:** Figure 2A compares plain SGD, a fixed quadratic constraint of equal strength for every parameter, and EWC across sequential permutations; Figure 2B compares EWC with SGD plus dropout over increasing task counts. Figure 2C compares Fisher overlap for small 8×8 and large 26×26 central pixel permutation regions.
- **Metric / result:** Test performance/error curves and average performance across tasks, as plotted. The paper reports the qualitative pattern that plain SGD forgets earlier tasks, uniform L2 protects old performance at the cost of learning B, while EWC preserves prior tasks while learning new ones more effectively; dropout does not scale to many tasks as well as EWC. No exact numeric curve values are transcribed here because they are not given as a result table.
- **Supported claim:** In this controlled classification setting, a diagonal Fisher-weighted penalty improves the stability/plasticity trade-off over the illustrated baselines.
- **Unsupported inference:** This does not demonstrate zero forgetting, unlimited task capacity, performance on LLMs, or universal superiority across task distributions.

### Atari (Section 2.2; Figure 3; Appendix 4.2)

- **Question:** Can EWC help one fixed-resource deep RL agent retain abilities across multiple Atari games presented over time?
- **Environment / protocol:** Ten games selected randomly from a pool of 19 games that standalone DQN can bring to human level within 50 million frames. Game order is randomized and tasks can recur; agents are periodically evaluated on all games without training during evaluation. Average results use ten sets of ten games and four random seeds per set.
- **Model/system:** Double DQN-like agent, a single shared network, task-specific gains and biases per layer, a task-recognition model based on observations, and distinct short-term replay buffers per inferred task. EWC's diagonal Fisher is recomputed at task switches; its penalty is enabled only after a game has at least 20 million frames. It is one component of this system.
- **Metric / result:** Total human-normalized score summed across games with each game's score clipped at 1 (maximum 10). Plain gradient descent remains below a total score of 1 in the reported continual setting, while the EWC system learns multiple games. The EWC agent remains below ten separately trained DQNs. A true-task-label control improves only modestly over learned task recognition.
- **Supported claim:** EWC can contribute to sequential retention in this particular RL system; the evidence is at system level.
- **Unsupported inference:** The results do not isolate EWC as the only cause, show a replay-free Atari agent, or establish performance on modern RL or language models.

### Fisher perturbation and overlap (Figure 2C / Figure 3C; Appendices 4.2–4.3)

Fisher-overlap measures normalized similarity between tasks' Fisher matrices to study parameter reuse across layers. In Permuted MNIST, more different input permutations reduce overlap in early layers while output-adjacent layers still overlap because the digit-label space is shared. In the Atari perturbation analysis, performance was more robust to inverse-diagonal-Fisher-shaped perturbations than uniform perturbations; perturbations in the estimated Fisher nullspace had a similar effect to inverse-Fisher perturbations, suggesting the diagonal estimate overstates certainty about some parameters being unimportant. This is evidence about the quality/boundary of the estimate, not a claim that Fisher overlap itself protects the tasks.

## Limitations

- **Author-stated approximation:** EWC obtains low cost by approximating posterior uncertainty with a factorized Gaussian and a point estimate via diagonal Fisher; the authors call this a significant weakness (Discussion).
- **Author-stated evidence boundary:** In the Atari perturbation analysis, estimated Fisher-nullspace perturbations harmed performance similarly to inverse-Fisher perturbations, suggesting underestimation of parameter uncertainty (Figure 3C discussion).
- **Our interpretation:** A diagonal, task-local importance vector cannot encode coupled parameter directions; a strong aggregate penalty can consume plasticity as tasks accumulate. These are consequences of the representation and objective, not a proof that every task sequence fails.
- **Evidence boundary:** Results are from specific supervised MNIST permutation protocols and an Atari system with task inference, replay, and game-specific components. The paper does not test modern foundation models.
- **Future work:** The authors suggest Bayesian neural networks as one possible route for improving the local uncertainty estimate (Discussion); present this as a suggestion, not a demonstrated result.

## Reconstruction Matrix

| Object | What | Where | When | Source / producer | Input | Output | Shape | State | Gradient | Update | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `θ` | Current shared weights and biases | Network parameters | Exists through sequential training | Initialized/model; updated by optimizer | Current task batch and total loss | Predictions and current parameter values | Parameter-shaped tensors | Mutable trainable state | Receives `∇L_B + λF⊙(θ−θ*)` where applicable | Optimizer step mutates it | C02–C04 |
| `θ*A` | Task A solution / penalty center | Detached reference state, conceptually aligned with `θ` | Captured after A; consumed during later tasks | Task A training result | Task A data via training | Anchor for displacement | Same structure as `θ` | None in later-task step | Not updated by B optimizer | C03, I01 |
| `F_A` | Diagonal Fisher precision / importance estimate | Per-parameter reference buffer | Estimated after/at task boundary | Fisher calculation at `θ*A`; Atari sampling uses task replay minibatches | Task observations/data and model likelihood/gradient information | Per-parameter nonnegative precision values | Same structure as `θ` (diagonal only) | Fixed during a given later-task constraint | No B gradient in conceptual mapping | Recompute/retain per task; paper's aggregation is separate | C03, C08, I02 |
| `L_B` | Current-task objective | Training computation | Recomputed for each B batch | Current task's supervised or RL learning signal | Current batch/experience and current `θ` | Scalar objective and gradient | Scalar after reduction | Ephemeral per step | Produces new-task gradient | Recomputed, then backpropagated | C03, C04 |
| `λ` | Old-task constraint scale | Hyperparameter/configuration | Chosen before/during experiment | Experiment setting / hyperparameter search | Chosen coefficient | Scales the EWC term | Scalar | Fixed during a configured run | No gradient required in standard use | Controls objective strength | C03, R02 |
| EWC penalty | Weighted squared distance to old anchor | Total loss graph | Every new-task step while constraint active | Formula combines current `θ`, `θ*A`, `F_A`, `λ` | Parameter difference and importance | Scalar penalty and restoring gradient | Scalar; gradient parameter-shaped | Recomputed, then discarded with step graph | Yes, w.r.t. current `θ` | Influences optimizer update indirectly | C03, I03 |
| `D_A` | Old-task training data | Dataset / Atari replay context | Used to train A and estimate importance; not needed as B penalty input | Task environment/data source | Old task examples/experiences | `θ*A`, Fisher evidence | Samples; domain-dependent | Discarding old training access is central to MNIST setting; Atari has bounded per-task replay | Gradients during A/Fisher computation | Dataset not mutated by EWC | C01, C08 |
| Atari context `c` | Inferred active task label | Task-recognition model | Updated as observations arrive | Generative observation models / FMN-like procedure | Recent observations and context beliefs | Current task context | Categorical distribution/label | Separate from EWC gradient | Recognition model updates its beliefs/model | C06, C07 |

## Source Notes

- Primary source: arXiv v2 HTML, https://arxiv.org/html/1612.00796 (Sections 1–3, Appendix 4.1–4.3); journal record: https://doi.org/10.1073/pnas.1611835114.
- The original paper's Fisher approximation and two-task objective are in Section 2, Equations (1)–(3). The source describes the diagonal Fisher as the Gaussian precision; the tutorial's scalar calculations are separately labeled Teaching Toys.
- Figure numbering differs between the original arXiv manuscript and some journal renderings; evidence IDs name both the section and the manuscript figure label.
