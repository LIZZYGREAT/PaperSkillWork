# Paper Model: Learning without Forgetting

Paper ID: `lwf`  
Source: `source/paper.pdf` (arXiv:1606.09282v3; ECCV 2016; PDF pp. 1–13)

## Core Explanation

Learning without Forgetting (LwF) adds a new prediction task to an already trained convolutional network when the old task's training data are unavailable. For each new-task image, the old network supplies its old-task output as a soft target; an expanded network learns the new label while matching that target. This can reduce changes to old-task behavior on the new inputs, while allowing shared parameters to adapt. It does not guarantee preservation on the full old-task input distribution. (Abstract, Figure 2(e), method, PDF pp. 1–5; `C01`, `C02`, `A04`, `C07`.)

## Problem

Given a trained CNN for an existing task, the authors ask how to add another task without retaining or replaying old-task training examples. Fine-tuning can adapt the shared representation but harm earlier tasks; feature extraction preserves the old representation but restricts adaptation; joint training can use both datasets but violates the assumed data constraint. LwF uses the old model's response on currently available new-task inputs as the old-task signal. Its principal setting is sequential visual classification, with a tracking experiment in the appendix. (`C01`, `C06`, `C09`; Abstract and Introduction, PDF pp. 1–3.)

## Core Insight

The old model and the expanded model both process `X_n`, the current new-task images. The old model produces `Y_o`; the expanded model produces current old-task outputs `Ŷ_o` and new-task outputs `Ŷ_n`. Training combines a distillation loss from `Y_o` to `Ŷ_o` with supervised learning from the true new labels `Y_n` to `Ŷ_n`. The old response is generated on a new input. It is neither an old image nor an old ground-truth label or replay memory. (`C02`, `A04`, `F01`–`F04`; Figure 2(e), equations, PDF pp. 3–5.)

## Prerequisites

| Concept | Need | Depth |
| --- | --- | --- |
| CNN, shared backbone, task head | Required | Shared features feed old and new task outputs; identify which weights belong to each. |
| Classification logits, softmax, cross-entropy | Required | Distinguish logits, normalized probabilities, one-hot labels, and soft targets. |
| Knowledge distillation and temperature | Helpful | Understand how a softened teacher distribution supervises current outputs. |
| Backpropagation and optimizer update | Required | A gradient calculation does not itself mutate parameters. |
| Continual learning / catastrophic forgetting | Helpful | New tasks arrive in sequence; older task performance may decline. |
| Replay and joint training | Helpful contrast | Both use old-task examples during training; LwF's stated setup does not. |

Evidence: general background entries `B01`–`B03`; paper equations (1)–(4), PDF p. 4; implementation boundaries `I01`–`I03`.

## Objects and Variables

| Symbol / object | Meaning | Created or produced by | Evidence locator |
| --- | --- | --- | --- |
| `θ_s` | Shared network parameters | Existing model; updated during joint optimization | Method, PDF pp. 3–5 (`A01`) |
| `θ_o` | Existing task-specific output parameters | Existing model; frozen in warm-up, then jointly trainable | Method, PDF pp. 3–5 (`A02`, `A05`) |
| `θ_n` | Parameters for new task output nodes | Added and randomly initialized for the new task | Method, PDF pp. 4–5 (`A03`) |
| `X_n`, `Y_n` | New-task images and their true labels | Current task dataset | Abstract and method, PDF pp. 1, 4 (`C01`, `F01`) |
| `Y_o` | Old-model responses on `X_n` | Old model forward pass | Figure 3 and method, PDF pp. 4–5 (`C02`, `A04`) |
| `Ŷ_o`, `Ŷ_n` | Expanded-model old-task and new-task outputs | Expanded model forward pass | Equations (1)–(4), PDF p. 4 (`F01`–`F04`) |
| `T` | Temperature for response distributions | Set as an experiment hyperparameter; paper uses `T=2` | Equations and method, PDF p. 4 (`F02`, `F06`) |
| `λ_o` | Coefficient on old-response loss | Set as an experiment hyperparameter; usually 1 | Method and Figure 7, PDF pp. 5, 10 (`F05`) |
| `R` | Weight-decay regularization in the paper's experiments | Added to the joint objective | Figure 3 and method, PDF p. 5 (`C03`, `F04`) |

## Architecture and Ownership

Before a new task arrives, the old model contains shared parameters `θ_s` and old task head parameters `θ_o`. The expanded model reuses the shared representation and old task output path, then adds new output parameters `θ_n`. The paper's principal experiments make the final output layer task-specific. The old model remains available to compute response targets on new-task images. Figure 2(e) shows the method's two paths; it does not show old examples being replayed. (`A01`–`A04`, `A07`; PDF pp. 3–5.)

The paper's parameter groups describe the model conceptually. Mapping them to a particular framework's modules, tensors, or optimizer parameter groups is an implementation interpretation, not an exact API prescribed by the paper. (`I01`–`I03`.)

## Data Flow

```text
new images X_n ──→ old model (θ_s, θ_o) ──→ old responses Y_o
       │
       └────────→ expanded model (θ_s, θ̂_o, θ_n)
                       ├── current old output Ŷ_o ──→ L_old(Y_o, Ŷ_o)
                       └── current new output Ŷ_n ──→ L_new(Y_n, Ŷ_n)
                                                       │
                                    λ_o L_old + L_new + R
                                                       ↓
                                  gradients → optimizer updates
```

The old response and current outputs are distributions over task labels. The paper specifies the probability and loss relationships, not a fixed batch size or framework tensor layout. (`F01`–`F04`; equations, PDF pp. 4–5.)

## State and Time

1. **Before expansion:** the old model has learned `θ_s` and `θ_o`.
2. **For a new task:** current images `X_n` are run through the old model to obtain `Y_o`.
3. **Expansion:** add and initialize `θ_n` for the new outputs.
4. **Warm-up:** freeze `θ_s` and `θ_o`, train only `θ_n`. The authors say warm-up is not essential to LwF, though they retain it in experiments.
5. **Joint optimization:** train `θ_s`, `θ_o`, and `θ_n` together under the combined objective. The old head is not frozen permanently.
6. **Next task:** the current expanded model becomes the old model for the next addition; its responses are computed on that next task's inputs.

The paper's sequence and training procedure are described in Figure 3 and the method, PDF pp. 4–5; sequential experiments appear in Figure 4, p. 8 (`A04`, `A05`, `C09`).

## Human Review

- Decision: PASS for W2.
- Reviewer: the user, who explicitly confirmed in this conversation on 2026-09-28 that W2 was reviewed and approved.
- Review findings: no item-level correction was supplied.

## Training

For each current batch, compute old-model responses on `X_n`, then compute `Ŷ_o` and `Ŷ_n` from the expanded model. `L_old` matches the old model's response distribution; `L_new` compares the new-task prediction with `Y_n`; `R` is weight decay. The losses backpropagate through the paths permitted by the current training phase. Warm-up updates only `θ_n`; joint optimization updates the parameter groups together. Backpropagation computes gradients, while the optimizer step applies parameter updates. (`A05`, `F01`–`F06`, `I03`; PDF pp. 4–5.)

## Inference / Runtime

After training, the expanded network can use its shared representation and task-specific output paths to predict for the old or new task. The paper's central preservation mechanism operates during training: it matches old outputs on the new-task inputs. It is not a runtime memory lookup and does not require retaining old-task training images. The paper does not claim that matching on `X_n` alone guarantees unchanged predictions on every old-domain input. (`C01`, `C02`, `A07`; PDF pp. 1, 4–5.)

## Core Equations

For new-task labels, the cross-entropy is:

```text
L_new = −Y_n · log(Ŷ_n)
```

For the old-task response, temperature transforms a probability distribution `y` as:

```text
y'_i = y_i^(1/T) / Σ_j y_j^(1/T)
L_old = −Σ_i y'_o(i) log ŷ'_o(i)
```

The combined objective is:

```text
L_total = λ_o L_old + L_new + R(θ_s, θ_o, θ_n)
```

The paper uses `T=2` and usually `λ_o=1`; these are reported experimental settings, not universal optima. `R` is weight decay in the experiments. The main method matches outputs on new inputs; a parameter-L2 soft constraint is a comparison baseline. (`F01`–`F06`; equations (1)–(4), Figure 3, PDF pp. 4–5; Figure 7, pp. 9–10.)

## Results

The experiments compare new and old task performance across task pairs, sequential addition, smaller new-task training sets, and alternative design choices. AlexNet is used in the main experiments, with some VGG-16 comparisons. VOC uses mean average precision; other reported classification tasks use accuracy. The protocol uses dataset-specific splits and three training runs; consult each paper table and caption for its specific setup. (`E01`–`E06`; PDF pp. 6–10.)

One reconstructable example is AlexNet ImageNet → CUB-200-2011 in Table 1(a), PDF p. 7. LwF reports 54.7% ImageNet validation accuracy and 57.7% CUB test accuracy. Several comparator absolute values are derived from the printed signed differences relative to LwF; they must be labeled as derived. Joint training uses old-task training data, unlike the other methods under the stated constraint. These results support a conclusion about the named model, tasks, splits, metric, and protocol; they do not establish universal superiority. (`E01`–`E04`.)

For sequential task additions, the paper reports that performance depends on task pairs and can decline over time; its Figure 4 compares the methods across task sequences. The appendix reports MD-Net tracking expected average overlap values of 0.373 and 0.383 for the compared setup, while the authors describe the difference as not statistically significant. (`E05`, `E06`; PDF pp. 8, 12–13.)

## Limitations

- Old outputs are matched on current new-task inputs; if those inputs do not cover the old-task distribution, preservation elsewhere is not guaranteed (`C07`).
- Sequential task addition can still lead to changes in earlier-task performance; results vary by task pair (`E05`).
- The systematic experiments focus on visual classification, plus one tracking appendix experiment. They do not validate LLMs, foundation models, or general online learning (`C09`).
- Segmentation, detection, representative old-domain samples, theoretical analysis, and online learning are stated as future directions, not results demonstrated by this paper (`C10`).
- The claim that output regularization can be more directly interpretable than parameter constraints is an author interpretation, with the same input-coverage boundary (`C11`).
