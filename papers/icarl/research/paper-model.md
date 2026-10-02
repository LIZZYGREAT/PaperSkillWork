# Paper Model: iCaRL: Incremental Classifier and Representation Learning

Paper ID: `icarl`  
Source: `source/paper.pdf`, arXiv:1611.07725v2 (14 April 2017)  
Source cache: `source-cache/content.md` (15 physical PDF pages)

## Core Explanation

iCaRL addresses class-incremental image classification: new classes arrive over time, old classes must remain recognizable, and the system cannot keep all earlier training images. It combines a shared, trainable feature extractor with a small, ordered memory of exemplar images per class. During each update, the new class data and stored old exemplars train the representation; targets from the pre-update network help preserve its responses on old classes. After the update, iCaRL reduces old exemplar lists by keeping their highest-priority prefixes and selects exemplars for new classes by herding. At prediction time, it encodes the saved images with the current feature extractor, forms a prototype for each seen class, and assigns the query to the nearest prototype. The training head supplies the representation-learning loss; its outputs are not the final prediction rule. (PDF pp. 1-4; Algorithms 1-5.)

## Problem

The paper defines class-incremental learning by three requirements (PDF p. 1):

1. Training data arrive as a stream, with examples of different classes appearing at different times.
2. At any point, the classifier must cover every class seen so far.
3. Compute and memory must remain bounded, or grow slowly with the number of seen classes; storing every image and retraining from all data is not an acceptable solution.

Ordinary batch classification assumes all classes and their training data are available together. Sequentially fine-tuning only on new classes can overwrite earlier discriminative information, which the paper calls catastrophic forgetting/interference. Earlier methods that fixed the feature representation could not jointly adapt a deep representation and classifier to incoming classes. (PDF pp. 1-2, Sections 1 and 2.1.)

At inference, the learner is not told which class batch produced a query. It must choose from the single set of all classes observed so far. The old classes therefore remain in the prediction space even after their full training sets are no longer available. (PDF pp. 1-2.)

## Core Insight

iCaRL combines three mechanisms (PDF pp. 2-5):

- **Nearest-mean-of-exemplars classification:** represent each seen class by the mean feature of its saved exemplar images, re-encoded with the current feature extractor. This keeps the classifier aligned with representation changes.
- **Herding-based exemplar management:** when a class first arrives, greedily select an ordered list whose prefixes approximate that class's full-data mean in the current feature space. Later memory reductions can then discard the tail without revisiting the old full dataset.
- **Representation learning with rehearsal and distillation:** train on current class images together with stored old exemplar images; use current labels for new output nodes and pre-update network responses for old nodes.

The persistent old-class rehearsal data are exemplar **images**, not stale feature vectors. The network's class-output layer is used to train the representation, while the final prediction uses the exemplar prototypes. (PDF pp. 2-4.)

## Prerequisites

| Concept | Depth needed | Source locator |
| --- | --- | --- |
| Class-incremental learning | New classes arrive in batches; all seen classes remain eligible at test time. | PDF p. 1, Section 1; Figure 1 |
| Feature representation | A shared map sends an image to a vector that changes as the network is updated. | PDF pp. 2-3, Section 2.1 |
| Prototype classification | Compare a query feature with one representative vector per class. | PDF p. 3, Section 2.2 |
| Exemplar and herding | A small set of retained images approximates the class mean; order supports later truncation. | PDF pp. 4-5, Section 2.4 |
| Sigmoid and binary cross-entropy | Each output node has its own sigmoid response and binary target. | PDF pp. 2-3, Sections 2.1 and 2.3 |
| Distillation / catastrophic forgetting | Preserve old network responses while the shared representation learns new classes. | PDF pp. 1, 3-4, Sections 1 and 2.3 |
| CNN / ResNet details | Helpful for reading the experiments; not needed to understand the algorithm. | PDF pp. 2, 6 |

## Objects and Variables

| Object / variable | Meaning in this paper | Owner / creator | Source locator |
| --- | --- | --- | --- |
| `X^y` | Full training image set for class `y`; available when that class arrives. | Data stream / dataset | PDF p. 2, Section 2.1; Algorithm 2 |
| `s`, `t` | `s` is the first class in the current incoming batch; `t` is the number of classes seen after it arrives. | Update routine | PDF pp. 2-3; Algorithms 2-3 |
| `Θ` | Current network parameters: feature-extractor parameters plus one output weight vector `w_y` for each seen class. | Learner | PDF pp. 2-3, Section 2.1 |
| `ϕ_Θ(x)` | Learned feature vector for image `x`; feature vectors and results of feature-vector operations are L2-normalized by convention. | Shared CNN feature extractor | PDF pp. 2-3, Section 2.1 |
| `g_y(x)` | Independent sigmoid output for class node `y`, computed from `a_y(x)=w_yᵀϕ_Θ(x)`. It is used for representation learning. | Current network head | PDF p. 3, Equation (1) |
| `P_y=(p_1,…,p_m)` | Ordered list of raw exemplar images retained for class `y`; earlier entries have higher prefix priority. | Exemplar manager | PDF pp. 2, 4-5; Algorithms 2, 4-5 |
| `K`, `m` | `K` is the total exemplar-image budget; each of `t` seen classes receives about `m=K/t` exemplars, up to rounding. | Memory policy | PDF p. 4, Section 2.4; Algorithm 2 |
| `D` | Update training set: all current new-class images plus all retained old-class exemplars, with labels. | Representation-update routine | PDF p. 3, Algorithm 3 |
| `q_i^y` | Pre-update network response for sample `x_i` at old-class node `y`; stored before training starts and used as a soft target. | Snapshot made by update routine | PDF p. 3, Algorithm 3 |
| `μ_y` | Class prototype computed from the current features of the images in `P_y`; it is derived state, not an independently learned output weight. | Recomputed from `P_y` and current `ϕ_Θ` | PDF p. 3, Equation (2) |
| `y*` | Predicted class: the seen class with the nearest current exemplar prototype. | Inference rule | PDF p. 3, Equation (2); Algorithm 1 |

## Architecture and Ownership

The paper presents one CNN with a shared trainable feature extractor and a single classification layer. The feature extractor maps an image to `ϕ_Θ(x) ∈ R^d`; the classification layer has one sigmoid output node per seen class. Its parameters therefore grow by a class-specific weight vector as classes are added. There is no separate prediction model for each class batch. (PDF pp. 2-3, Section 2.1.)

The system has two downstream uses of the shared representation:

```text
Training path
image → shared feature extractor ϕ_Θ → class weight vectors → independent sigmoid outputs
      → hard targets for new nodes + stored soft targets for old nodes → loss → update Θ

Prediction path
query image → current ϕ_Θ ───────────────────────────────────────────────┐
retained images P_y → current ϕ_Θ → mean/renormalize → prototype μ_y ────┴→ nearest μ_y
```

The output head is part of `Θ` and supplies a differentiable training objective. Its sigmoid outputs are not passed through an `argmax` for iCaRL's final decision. The prediction prototypes are rebuilt from retained images after representation changes, so they stay in the current feature space. (PDF pp. 3, 6; Algorithm 1.)

Persistent state is the current network parameters `Θ` and exemplar-image lists `P_1,…,P_t`. The update-local set `D` and old-response targets `q_i^y` are temporary training state. The prototypes `μ_y` are derived from persistent state under the current feature extractor. (PDF pp. 2-4.)

## Data Flow

For an update that introduces classes `s,…,t`:

1. **Receive new data:** the full training sets `X^s,…,X^t` are available; full datasets for classes `1,…,s-1` are not. The current memory contains only old lists `P_1,…,P_{s-1}`.
2. **Build the rehearsal set:** form `D` from the labeled new images and labeled old exemplar images. An old exemplar is stored as an image so it can be passed through the changed feature extractor.
3. **Freeze the old-response targets:** before changing `Θ`, evaluate every sample in `D` at every old output node and store `q_i^y=g_y^{old}(x_i)` for `y=1,…,s-1`. These targets describe the pre-update network response on both new images and old exemplars.
4. **Update representation and head:** train the current network on `D`. Old output nodes reproduce the stored soft responses; new output nodes use the current ground-truth labels as binary targets. Backpropagation updates the network parameters.
5. **Rebalance memory:** set the per-class target to about `m=K/t`. Shorten each old ordered list by retaining only its first `m` images. For each new class, use its now-available full training set and the updated feature map to construct a herding list of length `m`.
6. **Predict:** for each seen class, run its retained images through the current feature extractor, average and renormalize their features to obtain `μ_y`. Encode a query the same way and return the class with minimum Euclidean distance to its prototype.

This order follows Algorithm 2: representation update first, then old-list reduction, then new-list construction. Exemplar selection for a class happens when its full data first arrives; later reductions need only the saved ordered list. (PDF pp. 2-5, Algorithms 2-5.)

## State and Time

| Moment | Available / created | Retained or changed | Discarded / unavailable |
| --- | --- | --- | --- |
| Before a new batch | Current `Θ`; old ordered lists `P_1,…,P_{s-1}`; full current `X^s,…,X^t` | Old model state and old image exemplars remain available. | Full old class datasets are no longer assumed available. |
| Before gradient updates | Combined `D`; old-node outputs `q_i^y` for every `x_i∈D` | `q_i^y` is fixed from the pre-update network for the duration of this update. | No old-node target is generated for new classes that have no old output node. |
| After representation training | Updated feature extractor and class output weights in `Θ` | New-class learning and old-response preservation have both contributed gradients. | Temporary `D` and `q` are no longer needed for prediction. |
| After memory management | New budget-sized `P_1,…,P_t` | Old lists are truncated by prefix; new lists are constructed using the current representation. | Excess old exemplars and full new training data need not remain in memory. |
| Prediction | Current `Θ`, all current `P_y`, and query `x` | `μ_y` is derived in the current representation from `P_y`. | Training targets, loss, and optimizer state are not inputs to the final class decision. |

Herding creates a priority order at the representation used when that class is selected. A later representation update changes the features of saved images, and the prototype is recomputed from those images. Because the old full class data are gone, the paper's update routine does not re-run herding for old classes; it can only truncate their stored lists. (PDF pp. 3-5.)

The fixed `K` applies to exemplar images, not to every part of model memory. The feature extractor has a fixed parameter count in the paper's setup, but the output layer adds one weight vector per seen class. The paper notes that at least one exemplar and one output weight are needed per class; with a fixed total resource budget, only finitely many classes can therefore be supported unless resources are added. (PDF p. 3, “Resource usage.”)

## Training

The update set is the union of complete data for the incoming classes and retained images for earlier classes:

```text
D = {(x,y) : x ∈ X^y, y=s,…,t}
    ∪ {(x,y) : x ∈ P_y, y=1,…,s−1}
```

For each `x_i ∈ D`, the update routine first stores `q_i^y` from the pre-update model for every old node `y<s`. The loss then applies independent binary cross-entropy at each output node:

- For a new node `y=s,…,t`, use the hard target `1[y=y_i]` from the sample label.
- For an old node `y=1,…,s−1`, use the soft target `q_i^y` from the pre-update model.

Thus a new-class image also has old-node soft targets; it is preserving how the old model responded to that input, not assigning the image to an old class. An old exemplar uses the same old-node soft targets, while its hard targets at all new nodes are zero. The targets are selected by output-node age, not by whether the input image itself is new or old. (PDF p. 3, Algorithm 3.)

The output nodes use independent sigmoids, not a softmax distribution. The paper describes the loss as a sum of classification and distillation terms; it does not introduce a tunable balance coefficient between these two terms in Algorithm 3. Standard backpropagation updates the network from this objective. (PDF pp. 2-3, 6.)

## Inference / Runtime

For a query image `x`, Algorithm 1 computes `ϕ_Θ(x)`. For each seen class `y`, it encodes all images in `P_y` with the **current** feature extractor and computes the normalized mean `μ_y`. It returns the class minimizing `||ϕ_Θ(x)−μ_y||₂` over `y=1,…,t`. Because the features and prototypes are normalized, the same rule is `argmax_y μ_yᵀϕ_Θ(x)`. (PDF p. 3, Section 2.2 and Equation (2); Algorithm 1.)

The inference rule does not take the sigmoid outputs `g_y(x)`, soft targets `q_i^y`, or the current class-batch identity as inputs. The prototypes adapt to representation updates by re-encoding the retained image exemplars. (PDF pp. 2-3.)

## Core Equations

1. **Training outputs** (PDF p. 3, Equation (1)):

   $$
   a_y(x)=w_y^{\top}\phi_\Theta(x), \qquad
   g_y(x)=\frac{1}{1+\exp(-a_y(x))}.
   $$

   `a_y` is the class-node logit; `g_y` is that node's independent sigmoid response. The head produces a trainable signal, not the final iCaRL prediction.

2. **Current exemplar prototype and final rule** (PDF p. 3, Equation (2)):

   $$
   \mu_y=\operatorname{normalize}\!\left(\frac{1}{|P_y|}
   \sum_{p\in P_y}\phi_\Theta(p)\right), \qquad
   y^*=\arg\min_{y=1,\ldots,t}
   \|\phi_\Theta(x)-\mu_y\|_2.
   $$

   The paper suppresses normalization in its equations: feature vectors and the results of feature-vector operations, including averages, are L2-normalized. For normalized vectors, the nearest-distance rule is equivalent to maximizing `μ_yᵀϕ_Θ(x)`.

3. **Representation update objective** (PDF p. 3, Algorithm 3):

   $$
   \begin{aligned}
   \ell(\Theta)=-\sum_{(x_i,y_i)\in\mathcal D}\Bigg[&
   \sum_{y=s}^{t}\big\{\mathbf 1[y=y_i]\log g_y(x_i)
   +\mathbf 1[y\ne y_i]\log(1-g_y(x_i))\big\}\\
   &+\sum_{y=1}^{s-1}\big\{q_i^y\log g_y(x_i)
   +(1-q_i^y)\log(1-g_y(x_i))\big\}\Bigg].
   \end{aligned}
   $$

   Here `q_i^y=g_y^{old}(x_i)` is computed before the update. The first sum learns the incoming classes; the second distills old-node responses on the same combined set `D`.

4. **Herding and memory allocation** (PDF p. 4, Section 2.4 and Algorithms 2, 4):

   $$
   p_k=\arg\min_{x\in X^y}
   \left\|\mu_y-\frac{1}{k}\left(\phi_\Theta(x)
   +\sum_{j=1}^{k-1}\phi_\Theta(p_j)\right)\right\|_2,
   \qquad m=K/t\;\text{(up to rounding)}.
   $$

   The candidate is chosen by how it changes the mean of the selected prefix, not by ranking each image's individual distance to `μ_y`. Old classes keep the first `m` entries when the budget shrinks.

## Results

The paper evaluates after each incoming class batch. Its proposed protocol fixes a random class order, tests only classes already observed at that step, and reports the average over steps as **average incremental accuracy** when one summary number is needed. The test results are not revealed to the algorithms. (PDF p. 6, “Benchmark protocol.”)

| Benchmark | Protocol and model | Metric / evidence |
| --- | --- | --- |
| iCIFAR-100 | 100 classes in batches of 2, 5, 10, 20, or 50; 32-layer ResNet; at most `K=2,000` exemplars; ten runs with different class orders. | Standard multi-class test accuracy; Figure 2(a) reports averages and standard deviations. Each class batch is trained for 70 epochs. (PDF pp. 6-7.) |
| iILSVRC-2012 | 100-class subset in batches of 10 (`iILSVRC-small`) or all 1,000 classes in batches of 100 (`iILSVRC-full`); 18-layer ResNet; at most `K=20,000` exemplars. | Top-5 accuracy on the validation set; Figure 2(b). Each class batch is trained for 60 epochs. (PDF pp. 6-7.) |

All methods use standard backpropagation with minibatches of 128 and weight decay `0.00001`. Both schedules start at learning rate `2.0`; iCIFAR-100 divides it by 5 after epochs 49 and 63, while iILSVRC divides it by 5 after epochs 20, 30, 40, and 50. (PDF p. 6.)

For iCIFAR-100, the paper reports average accuracy over all incremental steps in Table 1. The table values below are percentages and retain their class-batch condition. `LwF.MC` uses distillation but no exemplars; `hybrid1` uses network outputs rather than the exemplar-mean classifier; `hybrid2` omits distillation; `hybrid3` omits distillation and the exemplar-mean inference rule but uses exemplars during representation learning. (PDF pp. 9-10, Table 1a.)

| Classes per batch | iCaRL | hybrid1 | hybrid2 | hybrid3 | LwF.MC |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 2 | 57.0 | 36.6 | 57.6 | 57.0 | 11.7 |
| 5 | 61.2 | 50.9 | 57.9 | 56.7 | 32.6 |
| 10 | 64.1 | 59.3 | 59.9 | 58.1 | 44.4 |
| 20 | 67.2 | 65.6 | 63.2 | 60.5 | 54.4 |
| 50 | 68.6 | 68.2 | 65.3 | 61.5 | 64.5 |

Across these settings, iCaRL exceeds LwF.MC, with a larger gap in more incremental settings. Among the ablations, hybrid2 is slightly higher than iCaRL for the two-class batch setting; this is consistent with the authors' observation that distillation can hurt for very small batches. At larger batch sizes, the distillation loss is advantageous. The ablations therefore support contributions from the combined mechanisms, not a claim that each component improves every setting. (PDF pp. 7, 9-10.)

Table 1b compares iCaRL with a nearest-class-mean (NCM) classifier whose class means are recomputed after each representation update. NCM is slightly higher in these iCIFAR-100 results, but it requires storing all training data and therefore does not satisfy the paper's class-incremental memory constraint. (PDF pp. 9-10.)

| Classes per batch | iCaRL | NCM |
| ---: | ---: | ---: |
| 2 | 57.0 | 59.3 |
| 5 | 61.2 | 62.1 |
| 10 | 64.1 | 64.5 |
| 20 | 67.2 | 67.5 |
| 50 | 68.6 | 68.7 |

Figure 2 reports iCaRL ahead of the other tested methods on the listed iCIFAR-100 and iILSVRC settings. LwF.MC is generally second best; on iILSVRC-full the fixed-representation method is better than LwF.MC. Fine-tuning without forgetting controls performs worst. Figure 3's iCIFAR-100 confusion matrices (10 classes per batch) show different class-position biases among methods. Figure 4 shows accuracy increasing with larger `K`; with at least 1,000 exemplars, iCaRL's mean-of-exemplars result is similar to NCM, while classification by network outputs is not competitive. (PDF pp. 7-9, Figures 2-4.)

The all-data reference reaches 68.6% multi-class accuracy in the Figure 2 caption. This is a batch-training comparison, not a class-incremental method under the stated memory constraint. (PDF p. 7, Figure 2 caption.)

## Limitations

**Authors' stated limitations and future work**

- Class-incremental classification remains unsolved; iCaRL still performs below systems trained in a batch setting with all class data available together. The authors propose investigating this gap. (PDF p. 10, Section 5.)
- iCaRL retains raw exemplar images. The authors identify privacy-sensitive settings in which raw training images cannot be stored as a related open problem and mention implicit feature storage, such as an autoencoder, as a possible direction. (PDF p. 10, Section 5.)
- The model adds an output weight vector for every class. With a fixed total resource budget and at least one exemplar and one weight per class, only finitely many classes can be supported; adding resources changes that bound. (PDF p. 3, “Resource usage.”)

**Evidence boundaries**

- The reported evidence is image classification on CIFAR-100 and ImageNet ILSVRC 2012 under the paper's specified class orders, batch sizes, networks, budgets, and metrics. It does not establish the same performance for arbitrary datasets, class orders, or modalities. (PDF pp. 6-10.)
- The NCM comparison is informative about prototype quality but is not a valid memory-bounded class-incremental baseline because it keeps all training data. (PDF p. 9.)
- The paper's architecture-agnostic statement is a possibility in principle; the reported experiments use CNN/ResNet image classifiers. (PDF p. 2, footnote 1; p. 6.)
