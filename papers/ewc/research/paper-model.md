# Paper Model: Overcoming catastrophic forgetting in neural networks

Paper ID: `ewc`<br>
Source: `papers/ewc/source/EWC.pdf` (arXiv:1612.00796v2, 2017-01-25)

## Core Explanation

The paper addresses catastrophic forgetting when one neural network is trained on tasks in sequence: updates that improve a new task can damage performance on an earlier one. Elastic Weight Consolidation (EWC) uses a Bayesian view of the earlier task to construct a soft, parameter-wise quadratic constraint around its learned solution. A diagonal Fisher-based precision assigns stronger constraints to parameters the authors treat as more important for the previous task, leaving less-important parameters freer to adapt. The paper evaluates this approach on permuted-MNIST classification and sequential Atari learning; the Atari system also contains task recognition and per-task replay, so its results are not attributable to EWC alone. (PDF pp. 1–6, §§1–2.2, Figures 1–3.)

## Problem

In ordinary sequential training, the network is optimized for the current task. Weights important to an earlier task may move to serve the new objective, causing abrupt loss of old-task performance. Joint multi-task training avoids this conflict by keeping all task data available, while a replay-based alternative must retain and replay old data; the authors identify memory growing with the number of tasks as a scaling concern. (PDF pp. 1–2, §1.)

The paper asks whether one network with fixed capacity can retain earlier skills while learning later tasks. It studies both supervised tasks constructed by permuting MNIST pixels and reinforcement-learning tasks built from Atari games. (PDF pp. 3–6, §§2.1–2.2.)

## Core Insight

The authors argue that over-parameterization makes it plausible for a solution to a new task to lie near a solution to an earlier task. They therefore constrain parameters around the earlier solution, but use different constraint strengths rather than treating every weight equally. (PDF p. 2, §2; Figure 1 on p. 3.)

Their derivation views learning the next task as updating the previous task's posterior with a new likelihood. Because the true posterior is intractable, they use a Laplace approximation centered at the earlier task's learned parameters and use the diagonal Fisher information as the diagonal precision. This gives the EWC loss in Equation (3). The paper calls Fisher locally related to loss curvature and emphasizes its positive semi-definiteness and first-order computability; this is the paper's stated rationale for the approximation, not a claim that a diagonal Fisher is an exact Hessian in every setting. (PDF pp. 2–3, Equations (1)–(3).)

## Prerequisites

| Concept | Required / Helpful / Optional | Depth needed |
| --- | --- | --- |
| Sequential neural-network training and task loss | Required | Understand how optimizing a new task can alter parameters used by an earlier task. |
| Bayes rule, likelihood, and posterior | Helpful | Follow Equations (1)–(2), especially how the earlier posterior becomes the next task's prior; the paper identifies log likelihood with negative task loss. |
| Laplace approximation and Fisher information | Helpful | Understand the stated Gaussian approximation and diagonal precision used in Equation (3); do not treat the diagonal Fisher as an exact full Hessian. |
| SGD and quadratic penalties | Required | Read how the new-task loss and the old-task constraint jointly affect the objective. |
| DQN, replay, and task context | Required for the Atari experiment | Distinguish EWC's consolidation role from task recognition and short-term replay. |
| Softmax classification and cross-entropy | Optional general background | The supplied prerequisite note expands the paper's likelihood/loss relation into a conditional classification model; the PDF does not specify this as its EWC derivation. |
| Per-example empirical-Fisher derivation | Optional general background | The supplied prerequisite note gives a gradient-squared estimator; this PDF refers to Fisher and its diagonal but does not provide that estimator. Do not attribute it to the paper. |

## Objects and Variables

| Object / variable | Meaning in this paper | Owner / creator | Evidence locator |
| --- | --- | --- | --- |
| \(\theta\) | Network weights and biases optimized for the current task. | The neural network and its optimizer. | PDF p. 2, §2; p. 3, Equation (3). |
| \(D_A, D_B\) | Data for earlier task A and current task B in the sequential Bayesian derivation. | The task datasets. | PDF p. 2, Equation (2). |
| \(\theta_A^*\) | Learned parameter point for task A; center of the stated Laplace approximation and the anchor in Equation (3). | Optimization on task A. | PDF p. 3, §2, Equation (3), Figure 1. |
| \(F\), \(F_i\) | Fisher information matrix and its diagonal entries used as the approximate diagonal precision / parameter-wise constraint weights. | Estimated at task switches in the Atari experiment; exact general estimator is not specified in this PDF. | PDF p. 3, §2; p. 5, §2.2; p. 12, Table 2. |
| \(L_B(\theta)\) | Loss for the current task B alone. | Current supervised task or DQN learner. | PDF p. 3, Equation (3). |
| \(\lambda\) | Scalar balancing the old-task constraint against the current-task loss. | Selected by hyperparameter search in Atari; values are experiment-specific. | PDF p. 3, Equation (3); p. 5, §2.2; p. 12, Table 2. |
| \(c\), \(p(c\mid o_1,\ldots,o_t)\) | Latent Atari task context and its inferred probability from observations. | Separate task-recognition model. | PDF p. 5, §2.2; p. 11, Appendix §4.2. |
| Per-task replay buffer | Short-term experience memory used for off-policy DQN learning. | Atari agent, separated by inferred task. | PDF p. 5, §2.2; pp. 10–12, Appendix §4.2. |
| \(b^c, g^c\) | Task-specific biases and element-wise gains for each network layer in the Atari model. | Atari network, indexed by task context. | PDF p. 5, §2.2; p. 10, Equation (4). |

## Architecture and Ownership

### Permuted MNIST

The supervised experiments use a fully connected multilayer network with rectified linear units. Each task applies a fixed random permutation to the input pixels while retaining the handwritten-digit classification objective. The network is trained task by task; within each task, the data are shuffled and processed in mini-batches. EWC modifies the optimization objective while the network capacity remains fixed. (PDF pp. 2–4, §2.1, Figures 1–2.)

### Atari

The reinforcement-learning system uses one DQN with fixed network capacity, alongside task-specific layer biases and gains. A separate task-recognition module models context as a latent variable in an HMM and can create a new context model when existing models explain observations less well. The agent also keeps a short-term replay buffer for each inferred task. EWC supplies the longer-timescale parameter constraint at task switches; it does not perform task recognition or replace replay. (PDF pp. 5–6, §2.2, Figure 3; Appendix §4.2, pp. 10–12.)

## Data Flow

```text
Permuted MNIST:
image → fixed task-specific pixel permutation → shared fully connected ReLU network
      → digit prediction → task loss + EWC constraint → parameter update

Atari:
recent frames → preprocessing / four-frame state → task-context inference
             → shared DQN with context-specific gains and biases → action
             → environment reward and next observation → context-specific replay buffer
             → Double-Q update; at task switches, Fisher-based EWC constraint is applied
```

## State and Time

For a new task, the derivation treats the posterior over parameters after earlier data as the prior for the new task. Around the learned point for task A, the Laplace approximation is represented by a center \(\theta_A^*\) and diagonal Fisher precision. Training on task B then minimizes B's loss plus a quadratic constraint around that center. For a third task, the paper says the network can be constrained toward both earlier solutions using separate penalties or their summed quadratic form. (PDF pp. 2–3, Equations (1)–(3).)

In the Atari experiment, Fisher information is computed at each task switch and the penalty is activated for a game after the agent has experienced at least 20 million frames in that game. The system separately retains per-task replay buffers for short-timescale DQN learning. The paper does not state that EWC eliminates all access to old-task data: its Atari method explicitly uses replay, and Table 2 says Fisher is recomputed from 100 mini-batches drawn from the replay buffer. (PDF p. 5, §2.2; p. 12, Table 2.)

The conceptual EWC state is the earlier solution and its importance information, but this paper does not prescribe a software checkpoint schema or show an optimizer implementation. The supplied runtime note's exact buffer-copy and optimizer-step sequence is therefore an implementation explanation, not a directly reported paper detail.

## Training

For task B, the stated objective is:

\[
L(\theta)=L_B(\theta)+\sum_i \frac{\lambda}{2}F_i(\theta_i-\theta^*_{A,i})^2. \tag{3}
\]

Here \(L_B\) is the current task's loss; \(\theta^*_{A,i}\) is the task-A anchor for parameter \(i\); \(F_i\) is the corresponding diagonal Fisher entry; and \(\lambda\) controls the balance. Differentiating this displayed objective gives a current-task gradient plus a restoring term \(\lambda F_i(\theta_i-\theta^*_{A,i})\). That derivative is an algebraic consequence of Equation (3), not a separately printed equation in the paper.

The PDF refers to the diagonal Fisher and, for Atari, says it is recomputed at task switches; Appendix Table 2 specifies 100 replay-buffer mini-batches for each recomputation and a Fisher multiplier of 400 for the reported settings. The PDF does not give the per-sample gradient-squared estimator described in the supplied prerequisite note. For MNIST, its appendix gives network, dropout, early-stopping, and hyperparameter-search details but does not specify an equally detailed Fisher estimator. (PDF pp. 3, 5, 10–12.)

In Atari, the DQN is trained with Double Q-learning and replay; task context is inferred separately, and task-specific gains/biases are used. Consequently, a description of the Atari training loop must include those components rather than attributing the whole system to EWC. (PDF pp. 5, 10–12.)

## Inference / Runtime

The paper's supervised test path is digit input through the network to a predicted label, evaluated on each task's test set; the main result is the retention of earlier-task performance during sequential training. (PDF pp. 3–4, §2.1 and Figure 2.)

In Atari, four recent grayscale observations are concatenated into a state, the context model estimates the current task from observations, and the DQN selects an action. Rewards and transitions feed the corresponding replay buffer, from which Double-Q mini-batches train the network. EWC contributes a Fisher-weighted constraint when tasks switch; task recognition determines context and replay supplies short-timescale learning data. (PDF pp. 5, 10–12, §2.2 and Appendix §4.2.)

## Core Equations

The paper gives the following relationships:

1. **Bayesian parameter view, Equation (1), PDF p. 2:**

   \[
   \log p(\theta\mid D)=\log p(D\mid\theta)+\log p(\theta)-\log p(D).
   \]

   The terms are the posterior, data likelihood, parameter prior, and data evidence. The paper identifies \(\log p(D\mid\theta)\) with the negative task loss. (PDF p. 2.)

2. **Sequential update, Equation (2), PDF p. 2:**

   \[
   \log p(\theta\mid D)=\log p(D_B\mid\theta)+\log p(\theta\mid D_A)-\log p(D_B),
   \]

   where the dataset is split into task-A and task-B data. This expresses the previous posterior as the prior contribution when learning task B.

3. **EWC objective, Equation (3), PDF p. 3:**

   \[
   L(\theta)=L_B(\theta)+\sum_i\frac{\lambda}{2}F_i(\theta_i-\theta^*_{A,i})^2.
   \]

4. **Task-specific Atari layer transform, Equation (4), PDF p. 10:**

   \[
   y_i=\left(\sum_j W_{ij}x_j+b_i^c\right)g_i^c,
   \]

   with context-indexed bias \(b^c\) and gain \(g^c\).

The PDF does not print a per-sample Fisher estimator or an explicit Fisher gradient-square equation. The supplied prerequisite note's derivation of that estimator is useful background but must not be presented as an equation stated in this paper.

## Results

| Question and setting | Protocol / comparison | Reported result and supported conclusion | Evidence |
| --- | --- | --- | --- |
| Can a fixed-capacity network learn sequential supervised tasks without catastrophic forgetting? | Permuted-MNIST tasks; compare EWC, L2 regularization, plain SGD, and (for the broader multi-task comparison) dropout regularization. | The authors report that EWC retains high performance on old tasks while learning new ones; uniform L2 protects old performance more but impedes learning the new task; dropout does not scale to many permutations in this experiment. No exact numeric claim is taken from the extracted prose. | PDF pp. 3–4, §2.1, Figure 2A–B. |
| Do tasks reuse the same parameters? | Compare overlap of Fisher information for low (8×8) and high (26×26) pixel permutations as a function of network depth. | More similar tasks have greater Fisher overlap throughout; more dissimilar inputs use more distinct early-layer parameters, while later layers remain more shared. | PDF p. 4, Figure 2C; Appendix §4.3, p. 13. |
| Can EWC support sequential learning across Atari games? | Repeated sequences of ten games sampled from a pool of nineteen; compare EWC with no EWC and with task labels inferred or provided. Scores are human-normalized and clipped per game. | EWC agents learn multiple games in the reported setup; plain gradient-descent agents remain below a total score of one. Providing true task labels gives only a modest improvement over inferred labels. This is a result for the full system, which also uses task recognition and replay. | PDF pp. 5–6, §2.2, Figure 3A–B; Appendix §4.2, p. 11. |
| Does Fisher importance predict parameter sensitivity? | Single-game Breakout DQN; compare uniform, inverse-Fisher-shaped, and Fisher-nullspace weight perturbations. | Inverse-Fisher perturbations are more robust than uniform perturbations. Nullspace perturbations also harm performance, contrary to the approximation's prediction; the authors infer that the method is overconfident about some parameters being unimportant. | PDF p. 6, Figure 3C and adjacent text. |
| How do per-game scores compare? | Atari per-game trajectories against EWC, SGD, and a single-game baseline. | Figure 4 supplies per-game curves; it is supporting detail rather than a single aggregate claim. | PDF p. 13, Figure 4. |

## Limitations

### Author-stated limits

- EWC does not reach the score obtained by training ten separate DQNs in the Atari comparison. The authors suggest the tractable approximation of parameter uncertainty may be one reason. (PDF p. 6, §2.2.)
- The method's low computational cost relies on a factorized Gaussian approximation and a point estimate of parameter uncertainty based on diagonal Fisher information; the authors call this a significant weakness and suggest Bayesian neural networks as a possible direction. They characterize the runtime as linear in the number of parameters and training examples. (PDF p. 7, §3.)
- The Figure 3C perturbation experiment suggests the implementation underestimates uncertainty: parameters estimated to lie in the Fisher nullspace still affect performance. (PDF p. 6, Figure 3C and adjacent text.)

### Evidence boundary and interpretation

The Atari demonstration is a system containing EWC, a task-recognition model, task-specific gains and biases, and per-task replay buffers. Its success should not be described as EWC alone solving task discovery or removing replay. The paper computes Fisher at task switches, but it does not provide a general per-sample estimator formula in this PDF. The supplied notes' likelihood/softmax derivation, empirical-Fisher formula, and code-level optimizer sequence are supplemental background or implementation interpretations; use them only with those labels, not as paper quotations or claims.
