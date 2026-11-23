# Paper Model: Learning to Prompt for Continual Learning

Paper ID: `l2p`  
Source version: `arXiv:2112.08654v2` (13-page user-provided PDF)  
Paper URL: <https://arxiv.org/abs/2112.08654>

## Core Explanation

L2P addresses continual image classification in which data arrives in sequence, earlier samples may no longer be available, and evaluation may not reveal the task identity. It keeps a pretrained Vision Transformer (ViT) fixed and learns a shared pool of small prompt parameters paired with learnable retrieval keys; each input retrieves and prepends a subset of prompts, allowing the frozen model to adapt its output while the prompt pool accumulates experience. The paper reports strong results on its tested class-incremental, domain-incremental, and task-agnostic benchmarks, including a no-rehearsal configuration, but those findings remain tied to the stated pretrained model and experimental protocols (paper §§1, 3.1, 4; PDF pp. 1–5, 6–8, 12).

## Problem

The paper studies a single model trained on a sequence of tasks or changing data distributions. During training on task `t`, the learner may see only `D_t`; at test time, an input can come from any previously encountered task. In class-incremental learning, the test task ID is unknown; in domain-incremental learning the label set remains the same while the input distribution changes; in the task-agnostic setting the distribution shifts smoothly without explicit task boundaries. Updating shared model weights on new data can damage old-task performance, while rehearsal requires retaining earlier examples and many task-specific methods rely on a known task ID (paper §3.1, PDF p. 3).

L2P asks whether a pretrained sequence model can be adapted through a small, input-conditioned parameter memory, rather than by continually changing the pretrained backbone or selecting a task-specific module from a supplied task ID. Its baseline method does not require a rehearsal buffer; the paper also reports an `L2P-R` variant with a rehearsal buffer for comparisons (paper §§1, 5.1, PDF pp. 1, 6).

## Core Insight

Pair every learnable prompt value `P_j` with a learnable key `k_j`. For an input image `x`, a deterministic query feature from the frozen pretrained ViT is matched to the keys; the `N` closest keys select `N` associated prompts. Those prompt tokens are prepended to the embedded image tokens, and the extended sequence passes through the frozen Transformer. L2P averages the output vectors at the prepended prompt positions and sends that feature to a learned classifier. Training combines supervised classification loss with a key-to-query matching loss. The retrieval makes prompt use instance-wise, so similar inputs can share prompts while the model does not need a test-time task ID (paper §§4.1–4.3, Eqs. 1–5, Fig. 2; PDF pp. 4–5).

## Prerequisites

| Concept | Required / Helpful / Optional | Depth needed |
| --- | --- | --- |
| Sequential continual-learning protocols | Required | Distinguish class-, domain-, task-incremental, and task-agnostic settings, especially when task IDs or boundaries are available. |
| ViT input and frozen backbone | Required | Know that image patches become embedded tokens and that `f = f_r ∘ f_e` is the frozen embedding-plus-Transformer feature extractor used by L2P. Detailed attention arithmetic is background for this paper model. |
| Continuous prompt tuning | Required | Understand that a prompt is a trainable vector sequence prepended to model inputs, not a natural-language phrase or image patch. |
| Key/query retrieval and cosine distance | Required | Understand a fixed-size top-`N` subset selected by minimizing query-to-key distance. |
| Cross-entropy, gradients, and parameter updates | Helpful | Enough to follow the classification objective and the separately learned keys, prompts, and classifier. |
| Rehearsal buffers and regularization baselines | Helpful | Enough to interpret the comparison protocol and avoid treating all reported L2P settings as buffer-free. |

## Objects and Variables

| Object / variable | Meaning in this paper | Owner / creator | Evidence locator |
| --- | --- | --- | --- |
| `D_t={(x_i^t,y_i^t)}`; `T` | Data for sequential task `t`; total task count. Task-agnostic experiments instead use a smoothly changing stream without explicit boundaries. | Benchmark / training protocol | §3.1, PDF p. 3; Appendix C, PDF p. 12 |
| `f=f_r∘f_e` | Pretrained ViT feature extractor excluding the final classification layer. `f_e` embeds image patches; `f_r` is the stack of self-attention layers. Both are frozen during L2P training. | Pretrained model | §3.2, §4, PDF pp. 3–4 |
| `P={P_1,...,P_M}` | Shared prompt pool; `P_j ∈ R^(L_p×D)` is a trainable token sequence. | L2P | Eq. 1, PDF p. 4 |
| `K={k_1,...,k_M}` | Learnable keys paired one-to-one with prompt values; each key has query dimension `D_k`. | L2P | §4.2, Eqs. 3–4, PDF pp. 4–5 |
| `q(x)=f(x)[0,:]` | Deterministic query from the frozen ViT's `[class]` output; it has no learnable query parameters. The classifier head is excluded from `f`. | Derived from frozen model | §4.2, PDF p. 5 |
| `γ(q,k)` | Query-key match score; the paper reports that cosine distance works well. The top-`N` subset minimizes the sum of these scores. | Defined retrieval score | Eqs. 3–5, PDF p. 5 |
| `S_x`, `K_x`, `P_x` | Indices, keys, and paired prompt values selected for one sample `x`; `K_x` and `P_x` are also used to accumulate the batch's selected parameter sets. | Derived by retrieval | Algorithm 1, PDF p. 13 |
| `x_e=f_e(x)`; `x_p` | Image-token embedding and augmented input `[P_s1;...;P_sN;x_e]`. Concatenation is along the token dimension. | Derived from input and selected prompts | Eq. 2, PDF p. 4; Algorithm 1, PDF p. 13 |
| `f_r^avg(x_p)` | Mean of the frozen Transformer's output vectors at the first `N·L_p` positions, which correspond to prepended prompts. It is not the `[class]` output. | Derived representation | Eq. 5, PDF p. 5 |
| `g_φ`, `φ` | Final classification layer and its trainable parameters. Shared across tasks. | L2P | Algorithm 1, PDF p. 13; §5.2, PDF p. 7 |
| `λ`, `η`, `E_t`, `M`, `N`, `L_p` | Loss weight, learning rate, epochs for task `t`, pool size, selected prompt count, and prompt token length. | Experiment / model configuration | Algorithm 1, PDF p. 13; §5.2, PDF p. 7 |
| `K_B`, `P_B`, `L_B` | Temporary per-minibatch sets of selected keys/prompts and the accumulated sample loss used to update selected pool entries and the classifier. | Training loop | Algorithm 1, PDF p. 13 |
| `H_t={h_j}` | Optional training-time prompt selection-frequency history through task `t−1`; multiplying `γ(q,k_j)` by `h_j` discourages frequent choices when task-boundary prior is available. | Derived from earlier selections | §4.2, Eq. 4, PDF p. 5 |

## Architecture and Ownership

1. **Frozen query path.** Given `x`, the pretrained feature extractor `f=f_r∘f_e` produces `q(x)=f(x)[0,:]`, the `[class]` feature. This path has no learned query parameters and does not use the final L2P classifier (paper §4.2, PDF p. 5).
2. **Prompt memory.** The query is compared with every key in `K`; the minimizing top-`N` set selects its paired values from `P`. The pool is shared across tasks and inputs. The optional frequency-weighted rule is a training-time extension when task boundaries are known; it is not the default test-time lookup (paper §4.2, Eqs. 3–4, PDF p. 5).
3. **Prompt-conditioned classification path.** The image embedding `x_e=f_e(x)` is concatenated after the selected prompt tokens. The frozen Transformer processes the extended sequence. L2P averages only the prompt-position outputs and passes that vector to the trainable classifier `g_φ` (paper §§3.2, 4.1, 4.3, Eqs. 1–2, 5; PDF pp. 4–5).
4. **Learning signal.** A labeled sample contributes cross-entropy on the predicted class and a weighted query-key distance. Across the minibatch, only selected prompt/key entries and `φ` are listed as update targets; the pretrained embedding and Transformer remain fixed (paper §4.3, Eq. 5; Algorithm 1; PDF pp. 5, 13).

## Data Flow

```text
image x ── frozen f=f_r∘f_e ── [class] feature q(x) ── compare with K ── selected indices S_x
   │                                                                       │
   └── frozen f_e ── x_e ── prepend P[S_x] ── frozen f_r ── prompt-position mean ── g_φ ── logits
                                                                                         │
label y ─────────────────────────────────────────────────────────────────── cross-entropy ─┤
q(x), selected keys K_x ─────────────────────────────────────────────── λ·key-distance ────┘
                                      minibatch accumulation → update selected P/K and φ
```

The query requires a frozen ViT feature before the prompt-conditioned classification pass. Do not collapse the two roles: the `[class]` output selects keys, while the mean of the prepended prompt-position outputs is the representation classified by `g_φ` (paper §§4.2–4.3, PDF p. 5; Fig. 2, PDF p. 4).

## State and Time

- **Before task training:** `f_e` and `f_r` are pretrained and frozen; `P`, `K`, and `g_φ` are initialized. Algorithm 1 does not specify their initialization distributions (Algorithm 1, PDF p. 13).
- **Within each sample:** `q(x)`, retrieved indices, `x_e`, augmented tokens, prompt-position feature, logits, and sample loss are computed values. They are not added to persistent memory.
- **Within each minibatch:** the selected-key and selected-prompt sets collect pool entries used by its samples. The accumulated `L_B` updates those selected entries and `φ`; the exact paper pseudocode writes a gradient-step form, while experiments report Adam (Algorithm 1, PDF p. 13; §5.2, PDF p. 7).
- **Across tasks:** the shared `P`, `K`, and classifier parameters persist and continue to update. In the no-rehearsal L2P configuration, old examples are not the persistent memory. `L2P-R` is a distinct comparison variant with a rehearsal buffer (paper §§5.1–5.2, PDF pp. 6–7).
- **Optional boundary-aware training:** `H_t` summarizes selection frequency through task `t−1` and modifies training-time lookup via Eq. 4. The article does not specify a full initialization/smoothing recipe for the frequency table; do not invent one. At test time, use the unweighted Eq. 3 lookup. In task-agnostic learning, neither this boundary prior nor a task ID is available (paper §4.2, PDF p. 5; Appendix C, PDF p. 12).

## Algorithm Execution Model

### Source Algorithm and Reconstruction Basis

The source gives formal **Algorithm 1** in Appendix D (PDF pp. 12–13), supported by the prompt-pool definition and input-concatenation Eq. 2, retrieval Eqs. 3–4, and objective Eq. 5 (PDF pp. 4–5). The pseudocode below normalizes notation (`S_x` for the selected indices and `P_x` for their prompt values) while retaining the source order. It separates the optional frequency-weighted training lookup described in §4.2 from the base Algorithm 1. Algorithm 1 writes parameter updates as gradient steps; the experiments use Adam with `β₁=0.9`, `β₂=0.999`, batch size 128, and learning rate 0.03 (§5.2, PDF p. 7).

### Inputs and Initialization

- Pretrained `f_e` and `f_r`, kept frozen; task data `D_1,...,D_T`; prompt pool `P`; paired keys `K`; final classifier `g_φ`; `M`, `N`, `L_p`, task epoch counts `E_t`, learning rate `η`, and matching-loss weight `λ`.
- Initialize `P`, `K`, and `g_φ` (Algorithm 1, PDF p. 13). The paper does not state a general initialization distribution in Algorithm 1.
- For the optional diversity variant only, task boundaries must be available during training so a frequency history through `t−1` can be used in Eq. 4. The base method and inference do not require task identity.

### Executable Pseudocode

```text
freeze pretrained f_e and f_r
initialize prompt values P, paired keys K, and classifier parameters φ

for task t = 1,...,T, in arrival order:
    if optional diversified selection is enabled and this task boundary is known:
        prepare H_t from prompt-selection frequencies through task t−1
    for epoch e = 1,...,E_t:
        for minibatch B of labeled examples (x,y) from D_t:
            K_B = ∅; P_B = ∅; L_B = 0
            for each (x,y) in B:
                q = (f_r(f_e(x)))[class position]
                if optional diversified training lookup is enabled:
                    S_x = argmin over |S|=N of Σ_{j∈S} γ(q,k_j)·h_j
                else:
                    S_x = argmin over |S|=N of Σ_{j∈S} γ(q,k_j)
                retrieve prompt values P_x paired with keys indexed by S_x
                x_e = f_e(x)
                x_p = concatenate(P_x, x_e) along token length
                h = mean of f_r(x_p) outputs at the first N·L_p prompt positions
                z = g_φ(h)
                L_x = cross_entropy(z,y) + λ·Σ_{j∈S_x} γ(q,k_j)
                L_B = L_B + L_x
                K_B = K_B ∪ keys indexed by S_x
                P_B = P_B ∪ P_x
            for each selected paired (k_j,P_j) in (K_B,P_B):
                update k_j and P_j using accumulated minibatch loss L_B
            update φ using L_B
```

The optional frequency-weighted lookup is Eq. 4 and is used only when training-time task-boundary prior is available; Algorithm 1's base lookup is Eq. 3. The index selection is an argmin over a subset; the formal loss adds a separate matching term for the selected keys. In the experiments, the selection-diversity strategy is used on 5-datasets, and the paper reports it as optional (§§4.2, 5.2, 5.4; PDF pp. 5, 7–8).

### Prediction / Inference Entry

For an unlabeled test image `x`, compute `q(x)=f(x)[class position]` with the frozen pretrained feature extractor; use Eq. 3, not the optional Eq. 4, to retrieve the top-`N` key/prompt pairs. Compute `x_e=f_e(x)`, prepend the retrieved prompts, pass the extended sequence through frozen `f_r`, average the first `N·L_p` prompt-position outputs, and apply the trained `g_φ` to obtain class logits/prediction. Do not compute a label loss or update parameters. The article states prediction replaces loss calculation with label prediction (Appendix D, PDF p. 12; Eqs. 2–5, PDF pp. 4–5).

### State Classification

| State / value | Created or read when | Temporary / derived / persistent | Frozen / updatable | Consumed or retained by |
| --- | --- | --- | --- | --- |
| Pretrained weights of `f_e`, `f_r` | Before training; used in query and augmented-input passes | Persistent model state | Frozen | Query extraction and prompt-conditioned feature computation |
| Prompt pool `P` | Initialized before training; selected per example | Persistent parameter memory | Updatable, selected entries per minibatch | Prepended to inputs; retained across tasks |
| Key pool `K` | Initialized before training; searched per example | Persistent parameter memory | Updatable, selected entries per minibatch | Query retrieval; retained across tasks |
| Classifier `φ` | Initialized before training; used after prompt pooling | Persistent model parameters | Updatable each minibatch | Produces logits across tasks |
| Query `q(x)` and selected set `S_x` | Each train/test example | Derived, per-example temporary values | Query has no learnable parameters; selection is computed | Chooses paired keys/prompts and enters key loss during training |
| `x_e`, `x_p`, prompt-position mean, logits | Each forward pass | Derived, per-example temporary values | Not stored as persistent task memory | Classification and loss/prediction |
| `K_B`, `P_B`, `L_B` | Each minibatch | Temporary batch accumulator | Discarded after update | Determines selected parameter updates |
| Optional `H_t` | Boundary-aware training for task `t` | Derived from earlier prompt-selection history; task-level temporary/history | Not a learned model parameter | Weights Eq. 4 lookup; not used at test time |
| Old task examples | During later training/evaluation | Not retained by baseline L2P | Not applicable | Not read by no-rehearsal L2P; retained only by separate replay configurations such as L2P-R |

## Training

The training inputs are labeled images from the currently available task or stream. For each minibatch, Algorithm 1 computes a sample-level classification term and a key-matching term, accumulates them as `L_B`, then updates selected keys, selected prompt values, and classifier parameters. The paper's experiment section reports Adam (`β₁=0.9`, `β₂=0.999`), batch size 128, constant learning rate 0.03, five epochs per task for class/domain-incremental settings, and one pass per batch for task-agnostic settings (§5.2, PDF p. 7). Input images are resized to `224×224` and normalized to `[0,1]` to match pretraining. The reported `λ` is 0.5.

The pretrained backbone stays fixed while the prepended values and classifier are learned. The match term uses the query and selected keys; the classification term uses the prompt-conditioned pooled feature. A selected prompt/key is collected into the batch's update set if used by any sample in that minibatch. Do not describe the baseline as training the query encoder or updating all prompt entries each step (Eq. 5; Algorithm 1, PDF pp. 5, 13).

## Inference / Runtime

Inference does not receive the task ID or label. It derives the query from the pretrained `[class]` feature, performs unweighted top-`N` retrieval over the shared key pool, prepends the paired prompt values to the image embeddings, and reads the average output at prompt positions through `g_φ`. This produces the class prediction. The optional diversified selection is specifically described for training with known task-boundary prior, while test-time lookup remains Eq. 3 (§4.2; Appendix D, PDF pp. 5, 12).

## Core Equations

1. **Prompt pool:** `P={P_1,...,P_M}`, with `P_j ∈ R^(L_p×D)` (Eq. 1, PDF p. 4). `M` is the pool capacity; `L_p` is tokens per prompt; `D` is the embedding width.
2. **Augmented token sequence:** `x_p=[P_{s_1};...;P_{s_N};x_e]`, where `x_e=f_e(x)` and semicolon concatenates along token length (Eq. 2, PDF p. 4).
3. **Base retrieval:** `K_x = argmin_{S⊆[1,M], |S|=N} Σ_{j∈S} γ(q(x),k_j)` (Eq. 3, PDF p. 5). `γ` is the match score (the paper reports cosine distance); minimizing selects the closest keys.
4. **Optional diversified training retrieval:** replace each term with `γ(q(x),k_j)·h_j`, where `h_j` is normalized frequency through the prior task history (Eq. 4, PDF p. 5). The intended effect is to discourage repeatedly selected prompts; the exact frequency-table recipe is not fully specified in the paper.
5. **Objective:** `L_x = CE(g_φ(f_r^avg(x_p)),y) + λ Σ_{j∈S_x}γ(q(x),k_j)`, with `f_r^avg(x_p)=AvgPool(f_r(x_p)[0:N·L_p,:])` (Eq. 5, PDF p. 5). `λ` balances classification and selected-key matching.

## Results

| Question / setting | Dataset and protocol | Metric and reported result | Supported conclusion | Locator |
| --- | --- | --- | --- | --- |
| Can the method retain class-incremental classification without a rehearsal buffer? | Split CIFAR-100, 10 disjoint classes per task, and 5-datasets; unknown test task ID; the table's zero-buffer group reports the base L2P. | Average accuracy / forgetting: Split CIFAR-100 `83.83±0.04 / 7.63±0.30`; 5-datasets `81.14±0.93 / 4.64±0.52`. Results are averaged over three runs with standard deviations. | L2P performed strongly under these two reported no-buffer protocols; this does not show that forgetting is eliminated or establish performance on arbitrary streams. | Table 1, §§5.2–5.3, PDF pp. 6–7; Appendix C, PDF p. 12 |
| Does it work in domain-incremental and task-agnostic settings? | CORe50 domain-incremental; Gaussian scheduled CIFAR-100 task-agnostic with gradual distribution shift and no explicit task boundaries. | CORe50 base L2P (buffer 0): test accuracy `78.33±0.06`; Gaussian scheduled CIFAR-100 base L2P (buffer 0): `88.34±0.14`. L2P-R with replay is reported separately. | The paper demonstrates these results on the specified benchmarks. The task-agnostic benchmark is synthetic and is explicitly described as far from realistic. | Table 3, PDF p. 6; Table 4, §§5.2–5.3, PDF pp. 7–8; Appendix C, PDF p. 12 |
| Which components matter on the reported 5-datasets ablation? | Class-incremental 5-datasets; Table 5 compares the full system with removed components. | Full: `81.14` average accuracy / `4.64` forgetting. Without prompt pool: `51.96 / 26.60`; without key-value pair: `58.33 / 20.45`; without diversified selection: `62.26 / 17.84`. | These ablations support the tested roles of pool, learnable key-value pairing, and optional diversification on this setup; they do not establish each mechanism's independent effect on every benchmark. | Table 5, §5.4, PDF pp. 7–8 |
| How does prompt capacity affect measured accuracy? | Split CIFAR-100 and 5-datasets; Figure 4 varies prompt length, selection size, and pool size under the captioned settings. | Accuracy varies with `M`, `N`, and `L_p`; the authors report that a too-small prompt length hurts and a larger pool helps more on diverse 5-datasets than on Split CIFAR-100. | Capacity trade-offs depend on the dataset and plotted hyperparameter range. | Figure 4, §5.4, PDF p. 8 |

For settings with per-task test sets the paper reports average accuracy and forgetting; for settings without task boundaries or with one test set it reports final test accuracy (§5.2, PDF p. 7). In the class-incremental table, `L2P` is the no-buffer method and `L2P-R` is the replay-equipped variant; their results must not be conflated (Table 1, §5.1, PDF p. 6).

## Limitations

**Author-stated:** L2P is demonstrated on vision models and assumes a pretrained sequence-based model; extending it to other modalities and to other vision architectures such as ConvNets is left for future work. The task-agnostic results use a synthetic Gaussian-scheduled CIFAR-100 stream, which the authors say remains far from realistic; stronger, more realistic benchmarks are needed. The paper also warns that biases/fairness issues in the pretrained model can carry over and that adversarial robustness in safety-critical uses needs further study (Appendix A–B, PDF p. 12).

**Evidence boundary:** the strongest conclusions are benchmark-specific and rely on pretrained features. The paper's own task-agnostic discussion notes that rehearsal-based methods can have clear advantages, despite L2P's reported result on its synthetic setting (PDF p. 8). The optional diversity mechanism depends on task-boundary information during training; the method's task-agnostic claim must refer to its base retrieval path, not imply every optional branch is boundary-free (§4.2, PDF p. 5).

**Notes consulted:** `source/notes/L2P论文笔记.md`, `source/notes/L2P前置知识笔记.md`, and the three user-identified settled P1–P9 mainline plans. The notes inform terminology, prerequisites, and candidate explanations; formulas, ordering, state timing, and results above were checked against the original PDF. No note was modified or merged into the source cache.
