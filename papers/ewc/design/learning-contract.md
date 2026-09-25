# Learning Contract: Overcoming catastrophic forgetting in neural networks

Paper ID: `ewc`\
Source: https://arxiv.org/abs/1612.00796 (v2, 25 Jan 2017; published in PNAS 2017)

## Target Reader

Chinese-speaking readers who know how a neural network is trained and have encountered sequential task learning, but have not yet connected EWC's Bayesian argument, Fisher-based parameter importance, and the actual parameter update. The main route targets continual-learning students and practitioners; reinforcement-learning details are reference depth.

## Reader Prerequisites

| Concept | Required / Helpful / Optional | Depth needed |
| --- | --- | --- |
| Neural-network parameters and supervised loss | Required | Identify the trainable parameter vector and the loss minimized for one task. |
| Gradient descent / backpropagation | Required | Understand that gradients are computed from the total loss and an optimizer applies the update. |
| Sequential / continual learning | Required | Understand that tasks arrive in order and old-task data may no longer be available. |
| Probability and log-likelihood | Helpful | Read the posterior-to-loss argument; no measure theory. |
| Bayes rule, prior, posterior, MAP | Helpful | Explain why the old-task posterior becomes the new-task prior. |
| Vectors, diagonal matrices, quadratic forms | Helpful | Read the diagonal Fisher penalty and its storage trade-off. |
| Reinforcement learning / DQN | Optional | Follow the Atari system context and separate EWC from its surrounding components. |

## Reader Unknowns

- Why sequentially updating one shared parameter vector can overwrite an earlier task.
- Why equal protection of every parameter is too restrictive, and why absolute weight magnitude is not the paper's importance score.
- How the old-task posterior is compressed into an anchor point and diagonal precision estimate.
- What Fisher Information measures in this method, and what the diagonal approximation discards.
- Which saved state is consumed during a new-task step, which values receive gradients, and what operation changes parameters.
- Which reported results belong to EWC and which depend on the larger Atari system.

## Final Learning Outcomes

After the tutorial, the reader should be able to:

1. Draw the sequential lifecycle `train A → save θ*A and F_A → train B with L_B + penalty → update θ` and identify where old-task data is no longer consumed.
2. Explain the paper's chain `p(θ|D_A) as prior → local Gaussian/Laplace approximation → diagonal Fisher precision → weighted quadratic penalty`, including the approximations.
3. Derive the per-parameter penalty gradient `λ F_i (θ_i − θ*A,i)` and trace how it combines with the new-task gradient before the optimizer step.
4. Describe the Permuted MNIST and Atari evidence with their task construction, model/system context, metric, comparison, and limits without inventing numeric values from plotted curves.
5. Explain why EWC mitigates interference rather than guaranteeing zero forgetting or unlimited capacity, and distinguish it from output/function-space methods such as LwF.

## Expected Depth

Deep: the object lifecycle, posterior update, diagonal Fisher approximation, objective and gradient, sequential task state, and evidence boundaries. Reference depth: derivation of Fisher/Hessian equivalence, implementation-specific estimator details, full DQN training mechanics, and exact plotted values that are not printed as table values in the cited source.

## Implementation Depth

Map paper symbols to a conceptual runtime: `θ` is the trainable parameter collection; `θ*A` is a detached anchor snapshot; `F_A` is a nonnegative per-parameter importance buffer; `L_B` is the current-task objective; `λ` is a scalar coefficient. Trace `g_B`, the penalty gradient, summed gradient, and the optimizer mutation separately. These are implementation mappings, not names or code asserted by the paper. A small browser calculation is a labeled teaching toy, not a trained neural network or reproduction of a paper experiment.

## Evidence Depth

Trace equations (1)–(3), the Figure 1 schematic, supervised Permuted MNIST and its Figure 2 panels, Atari setup/results in Figure 3, and the discussion of the factorized Gaussian / diagonal Fisher approximation. Numeric claims require dataset, model, split/protocol, metric, and source location. Do not estimate exact plot values by eye.

## What This Tutorial Is Not

- Not a claim that EWC eliminates forgetting, replays old examples, or supports unlimited tasks.
- Not a demonstration of EWC training a language model or a modern foundation model.
- Not a reproduction of the paper's MNIST or Atari experiments.
- Not an animated metaphor or interaction collection; each action must reveal a relationship, calculation, state transition, or evidence boundary.
- Not a replacement for the source paper.

## Page Structure Contract

The tutorial contains exactly **10 total pages including the opening page**. Page 01 introduces the basic contradiction, research problem, and paper contribution. Pages 02–06 build the method and its state lifecycle; pages 07–09 analyze Permuted MNIST and Atari; page 10 compares evidence, states the bounded conclusion, and reconstructs the full state flow. Canonical and Enhanced share the same page map and left chapter navigation.
