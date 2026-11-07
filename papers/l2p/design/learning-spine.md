# Learning Spine: Learning to Prompt for Continual Learning

Paper ID: `l2p`  
Source version: `arXiv:2112.08654v2`

## Overall Reading Goal

After the tutorial, a reader should be able to explain why sequential learning creates interference when old samples or test-time task IDs are unavailable; trace how a pretrained ViT turns an image into token features; explain why an added token can affect a frozen Transformer; and reconstruct L2P's actual method from initialization through per-sample retrieval, prompt-conditioned classification, minibatch updates, cross-task parameter inheritance, and task-ID-free prediction. They should also distinguish the optional boundary-aware training rule, base L2P from L2P-R, reported results from author interpretation, and the benchmark limits on those conclusions.

## Primary Learning Spine

The nine-stage P1–P9 sequence below follows the three user-provided and user-confirmed mainline plans. Their order, handoffs, and method boundaries are preserved; additions in this W4 draft clarify evidence, dependencies, and content priority. The nine stages are retained because they correspond to the already settled teaching sequence, not because W4 requires a fixed page count.

```text
P1 sequential data and unknown task identity create an adaptation problem
  → P2 establish what the pretrained ViT represents and where its features come from
  → P3 explain token interaction and show that frozen weights still respond to changed inputs
  → P4 turn that input dependence into a trainable prompt, then expose the single-prompt conflict
  → P5 use paired keys to retrieve a sample-specific subset from a shared prompt pool
  → P6 feed selected prompts through the frozen ViT and read prompt-position outputs for classification
  → P7 explain classification and matching signals, then perform one minibatch update
  → P8 reorganize the method as a complete stateful run from initialization to inference
  → P9 evaluate optional diversification, observed sharing, ablations, results, and limits
```

W4 settles cognitive order and information priority only. It does not decide tutorial visual objects, layout, animation, or component selection; those belong to a later W5 plan after W2–W4 review.

## Priority Matrix

The YAML is the only machine-readable source for item priorities, stage assignments, and placements. Each item appears exactly once. CORE stays on the P1–P9 path; supporting details remain compact; reference details stay outside the path; DELETE items do not become tutorial content.

```yaml
stages:
  - id: P1
    question: "Why does sequential learning need a different adaptation strategy?"
  - id: P2
    question: "How does the pretrained ViT turn an image into token features?"
  - id: P3
    question: "How do Transformer tokens interact, and why can a frozen model still change its output when its input changes?"
  - id: P4
    question: "Can a learnable prompt adapt a frozen model, and why can one shared prompt still interfere?"
  - id: P5
    question: "How can the current input choose a useful subset of prompts without a task ID?"
  - id: P6
    question: "How do retrieved prompts enter the full L2P classification path?"
  - id: P7
    question: "How do Prompt, Key, and classifier parameters receive training signals and update?"
  - id: P8
    question: "How does the real algorithm carry state across batches and tasks to task-ID-free prediction?"
  - id: P9
    question: "What evidence supports the design, which optional rule helps under what conditions, and where do the conclusions stop?"
items:
  - id: I01
    title: "Sequential tasks can alter shared parameters while earlier samples may be unavailable"
    priority: CORE
    stage: P1
    placement: mainline
    evidence_refs: [C01]
  - id: I02
    title: "Class-incremental evaluation requires predictions across learned classes without a test-time task ID"
    priority: CORE
    stage: P1
    placement: mainline
    evidence_refs: [C01, C11]
  - id: I03
    title: "L2P's research direction is to keep pretrained features and adapt through a small prompt memory"
    priority: CORE
    stage: P1
    placement: mainline
    evidence_refs: [C02, C10]
  - id: I04
    title: "Locate the ViT input embedding f_e and frozen Transformer f_r"
    priority: CORE
    stage: P2
    placement: mainline
    evidence_refs: [C02, B01]
  - id: I05
    title: "Understand image patches, token sequence, and the [class] token in the selected ViT-B/16 example"
    priority: CORE
    stage: P2
    placement: mainline
    evidence_refs: [B02, C04, C12]
  - id: I06
    title: "Trace Q/K/V matching, Softmax weighting, Value aggregation, multi-head output, residuals, normalization, and FFN in one standard block"
    priority: CORE
    stage: P3
    placement: mainline
    evidence_refs: [B03]
  - id: I07
    title: "Separate fixed weights from fixed outputs: changed input tokens can change frozen-model features"
    priority: CORE
    stage: P3
    placement: mainline
    evidence_refs: [C02, B03, O01]
  - id: I08
    title: "A continuous prompt is an input parameter that can condition a frozen feature model"
    priority: CORE
    stage: P4
    placement: mainline
    evidence_refs: [C02, C06, T03]
  - id: I09
    title: "A single-prompt learning loop is a teaching bridge, and shared updates can still interfere"
    priority: CORE
    stage: P4
    placement: mainline
    evidence_refs: [O03, T03, R04]
  - id: I10
    title: "L2P stores multiple prompt values with separately learnable, index-paired keys"
    priority: CORE
    stage: P5
    placement: mainline
    evidence_refs: [C03, A01]
  - id: I11
    title: "The retrieval query is the frozen, no-prompt ViT [class] feature"
    priority: CORE
    stage: P5
    placement: mainline
    evidence_refs: [C04, O01]
  - id: I12
    title: "Top-N key retrieval is input-specific; external retrieval Query/Key differ from internal attention Q/K/V"
    priority: CORE
    stage: P5
    placement: mainline
    evidence_refs: [C05, B03, O01]
  - id: I13
    title: "Prepend the selected prompt values to the image embeddings along token length"
    priority: CORE
    stage: P6
    placement: mainline
    evidence_refs: [C06]
  - id: I14
    title: "Classify the mean of prompt-position outputs, not the no-prompt retrieval [class] feature"
    priority: CORE
    stage: P6
    placement: mainline
    evidence_refs: [C06, O01]
  - id: I15
    title: "Distinguish pool capacity M, selected count N, prompt length L_p, and injected length N·L_p"
    priority: CORE
    stage: P6
    placement: mainline
    evidence_refs: [C12, B02]
  - id: I16
    title: "Classification loss trains selected Prompt values and the shared classifier while the backbone stays frozen"
    priority: CORE
    stage: P7
    placement: mainline
    evidence_refs: [C07, C08, O01]
  - id: I17
    title: "Hard top-N selection is discrete; the selected-key matching term provides a direct Key signal"
    priority: CORE
    stage: P7
    placement: mainline
    evidence_refs: [C05, C07, O01]
  - id: I18
    title: "Accumulate sample losses and selected sets, then update the batch's selected keys/prompts and classifier"
    priority: CORE
    stage: P7
    placement: mainline
    evidence_refs: [C08, M01, T01]
  - id: I19
    title: "Preserve Algorithm 1's task → epoch → minibatch → sample → selected-set update order"
    priority: CORE
    stage: P8
    placement: mainline
    evidence_refs: [C08, M01]
  - id: I20
    title: "Carry the same Prompt pool, Key pool, and classifier forward across batches and tasks"
    priority: CORE
    stage: P8
    placement: mainline
    evidence_refs: [C08, C10, M01]
  - id: I21
    title: "At inference, use ordinary Eq. 3 retrieval, prompt-conditioned classification, and no label loss or task ID"
    priority: CORE
    stage: P8
    placement: mainline
    evidence_refs: [C01, C05, C09, O02]
  - id: I22
    title: "Distinguish the base no-rehearsal method from L2P-R and keep task-agnostic execution on the base path"
    priority: CORE
    stage: P8
    placement: mainline
    evidence_refs: [C01, C10, C12, O02]
  - id: I23
    title: "Introduce frequency-weighted Eq. 4 only after the base run, with its known-boundary training condition"
    priority: CORE
    stage: P9
    placement: mainline
    evidence_refs: [C09, O02]
  - id: I24
    title: "Interpret the prompt-selection histograms as observations from the plotted settings"
    priority: CORE
    stage: P9
    placement: mainline
    evidence_refs: [A02]
  - id: I25
    title: "Use the 5-datasets ablation to check pool, key-value pairing, and diversification"
    priority: CORE
    stage: P9
    placement: mainline
    evidence_refs: [R04, A03]
  - id: I26
    title: "Answer the class-incremental question with the zero-buffer L2P results and correct metrics"
    priority: CORE
    stage: P9
    placement: mainline
    evidence_refs: [R01, C10]
  - id: I27
    title: "Compare domain-incremental and task-agnostic results within their own protocols"
    priority: CORE
    stage: P9
    placement: mainline
    evidence_refs: [R02, R03, C11, C13]
  - id: I28
    title: "Bound the answer by pretrained-model dependence and the synthetic task-agnostic benchmark"
    priority: CORE
    stage: P9
    placement: mainline
    evidence_refs: [C13, R01, R03]
  - id: I29
    title: "Use Split CIFAR-100's ten tasks of ten disjoint classes as a compact running protocol example"
    priority: SUPPORTING
    stage: P1
    placement: compact-inline
    evidence_refs: [C11]
  - id: I30
    title: "Briefly distinguish domain-incremental from task-agnostic protocols"
    priority: SUPPORTING
    stage: P1
    placement: compact-inline
    evidence_refs: [C01, C11]
  - id: I31
    title: "Clarify that a prompt is a learned vector sequence, not a natural-language instruction or image patch"
    priority: SUPPORTING
    stage: P4
    placement: compact-inline
    evidence_refs: [C03, T03]
  - id: I32
    title: "Use one small, clearly labeled top-N example to make the retrieval rule concrete"
    priority: SUPPORTING
    stage: P5
    placement: expandable
    evidence_refs: [C05, T02]
  - id: I33
    title: "Use a two-sample overlapping-selection example to explain batch aggregation"
    priority: SUPPORTING
    stage: P7
    placement: expandable
    evidence_refs: [C08, T01]
  - id: I34
    title: "Report Adam and the paper's optimizer settings without teaching Adam internals"
    priority: SUPPORTING
    stage: P7
    placement: expandable
    evidence_refs: [C12, M01]
  - id: I35
    title: "Give task-agnostic one-pass-per-batch and per-task epoch details only when interpreting protocols"
    priority: SUPPORTING
    stage: P8
    placement: expandable
    evidence_refs: [C12]
  - id: I36
    title: "Add the architecture-based comparison only with its per-backbone upper-bound context"
    priority: SUPPORTING
    stage: P9
    placement: expandable
    evidence_refs: [R06]
  - id: I37
    title: "Summarize Figure 4 as a dataset-dependent capacity trend within its tested ranges"
    priority: SUPPORTING
    stage: P9
    placement: compact-inline
    evidence_refs: [R05, C12]
  - id: I38
    title: "Full derivation of scaled dot-product attention and variant details"
    priority: REFERENCE
    placement: Advanced details
    evidence_refs: [B03]
  - id: I39
    title: "Cosine-distance Key gradients, numerical stabilization, and Adam optimizer-state details"
    priority: REFERENCE
    placement: Advanced details
    evidence_refs: [C05, C12]
  - id: I40
    title: "Full per-row baseline tables and additional metric comparisons"
    priority: REFERENCE
    placement: Evidence details
    evidence_refs: [R01, R02, R03, R06]
  - id: I41
    title: "Appendix C dataset composition and benchmark licensing details"
    priority: REFERENCE
    placement: Evidence details
    evidence_refs: [C11, C13]
  - id: I42
    title: "Unspecified frequency-table initialization and implementation edge cases"
    priority: REFERENCE
    placement: Implementation notes
    evidence_refs: [C09]
  - id: I43
    title: "All cells in the Figure 4 sensitivity grids"
    priority: REFERENCE
    placement: Evidence details
    evidence_refs: [R05]
  - id: I44
    title: "Full related-work catalog and algorithm internals for every baseline"
    priority: DELETE
    placement: none
    evidence_refs: []
  - id: I45
    title: "General introduction to gradient descent and cross-entropy for readers with a computing background"
    priority: DELETE
    placement: none
    evidence_refs: []
  - id: I46
    title: "A broad NLP prompting history unrelated to the visual L2P execution path"
    priority: DELETE
    placement: none
    evidence_refs: []
  - id: I47
    title: "Repeating the complete attention, retrieval, or loss derivation after its primary teaching stage"
    priority: DELETE
    placement: none
    evidence_refs: []
```

## Reader's Causal Path

**P1 — Research constraint.** Begin with a reader who already understands ordinary image classification and parameter updates. The new condition is that training data arrive in sequence, prior samples may no longer be available, and a class-incremental test image can belong to any learned class without carrying a task ID. This creates a real conflict between adapting to new data and retaining old predictions. The paper's entry point is a pretrained visual model whose feature weights can remain fixed while a smaller learned memory handles adaptation; the reader now needs to know what that model computes. Keep the Split CIFAR-100 task schedule as a protocol example, not as a claim that every setting has explicit task boundaries (C01, C02, C10, C11).

**P2 — Existing model.** Establish the actual pretrained ViT components before naming L2P's prompt memory: the input embedding `f_e` creates a sequence of image tokens, and the self-attention stack `f_r` transforms them. The P1 promise to reuse pretrained features now has concrete objects and a flow. A typical ViT-B/16 example can make patch count and feature width legible, with those checkpoint details labeled as architecture background rather than an L2P contribution. The remaining gap is why one token can carry information about other image locations (C02, C04, B01, B02, C12).

**P3 — Why input changes can matter.** Open one standard Transformer block only far enough to explain Q/K/V matching, normalized attention weights, value aggregation, multi-head combination, residual paths, normalization, and the FFN. This is prerequisite architecture, not L2P's proposed mechanism. Once a token's output is understood as a function of the current token sequence, a frozen set of weights no longer implies a fixed output for every input. The path now has a reason to consider adding trainable input tokens, while the later external retrieval Query/Key remains unintroduced (B03, C02, O01).

**P4 — A first prompt and its limit.** Use a single continuous prompt as a deliberately simple bridge: prepend its trainable vectors to image tokens, run the frozen model, compute a classification loss, and update the prompt and classifier. The purpose is to show that gradients can reach an input parameter through frozen computations. Then return to the continual-learning constraint: if every new task keeps changing the same prompt, that shared parameter can still interfere. Explicitly label this one-prompt loop as teaching simplification; the official L2P method is the later pool-based system, and the single-prompt row in the paper is an ablation. The next need is a flexible set of prompt values and a way to choose among them (C02, C07, C08, O03, T03, R04).

**P5 — Input-conditioned memory lookup.** Start from the need for more than one prompt, then introduce the shared pool and one learnable key paired with each prompt value. The image itself supplies the query through the frozen, no-prompt ViT `[class]` feature; its distance to the keys determines a per-instance top-N set. This resolves the unknown-task-ID requirement without assigning each prompt permanently to one task. Teach that these external retrieval Query/Key vectors are different from the Transformer block's internal Q/K/V. The selection is still only a set of prompt values; the reader has not yet seen how they influence the formal L2P classifier (C03–C05, B03, O01, A01).

**P6 — Complete classification path.** Take the exact selected set from P5, compute image embeddings, prepend the selected prompts, and pass the extended sequence through the same frozen Transformer. L2P reads the mean of the prompt-position outputs and applies a shared classifier; it does not classify the no-prompt query feature or average every token. Keep `M` (pool capacity), `N` (selected prompts), and `L_p` (tokens per prompt) distinct, so the reader can tell how many parameters are available from how many tokens enter one forward pass. The result is a real prediction path, but initialized keys, prompts, and classifier still need learning signals (C06, C12, B02, O01).

**P7 — Learn what to retrieve and what to inject.** Reuse the P6 logits and the sample label. Classification cross-entropy trains the selected prompt values and classifier. Since top-N selection returns discrete indices, the class loss does not provide an ordinary smooth ranking gradient through that choice; Eq. 5 adds a query-to-selected-key matching term. Explain the two parameter roles: Key updates influence future selection, while Prompt updates influence the classification computation after selection. Move from one sample to one minibatch: each sample computes its loss against the pre-update state, losses accumulate, selected entries are unioned, and then selected keys/prompts and the shared classifier update once for that batch. One batch now yields a changed persistent state; the next question is how that state survives many batches and tasks (C05, C07, C08, M01, T01).

**P8 — Reassemble the real algorithm.** This is a dedicated integration stage, not a recap of nine independent components. Begin with frozen `f_e` and `f_r` plus initialized `P`, `K`, and `φ`; follow the actual task/epoch/minibatch/sample order through query, selection, prompt retrieval, augmented input, prompt-position pooling, classification and matching losses, batch accumulation, and updates. Track the same `P`, `K`, and `φ` into the next batch and next task; no-prompt query features remain derived from the same frozen model. Keep the optional frequency-weighted branch out of the base path until P9. End at test-time prediction with ordinary Eq. 3 retrieval, no label loss, and no task ID. Also clarify that L2P-R is a separate replay-equipped variant, while base L2P does not require old samples (C01, C05, C08–C10, M01, O02).

**P9 — Evidence, optional branch, and scope.** Only after the complete algorithm is known should the reader see the optional frequency-weighted Eq. 4: it uses previous prompt-selection frequencies and requires known task boundaries during training; inference still uses Eq. 3. Then read prompt-use histograms as observations with the authors' bounded interpretation, check the 5-datasets ablation, and return to the initial question with the zero-buffer class-incremental results plus domain- and task-agnostic results under their own metrics and protocols. End by preserving the authors' scope limits: the tested task-agnostic benchmark is synthetic, and the demonstrated method relies on pretrained sequence-based vision models. The conclusion is evidence for the tested setups, not a guarantee of zero forgetting or universal real-world task-free performance (C09, C11, C13, A02, R01–R06).

## Cognitive Dependencies

| Concept / term | Primary teaching location | Earlier conclusion to recover later | Do not introduce early / repetition boundary |
| --- | --- | --- | --- |
| Sequential, class-incremental, domain-incremental, task-agnostic | P1 | Return to the unknown test-time task ID in P8–P9 | Do not make the task-boundary-free task-agnostic protocol stand in for every task-incremental experiment. |
| Image patch, token sequence, `[class]`, `f_e`, `f_r` | P2 | P5 needs the `[class]` feature; P6 needs image-token embeddings | Do not introduce L2P's external key pool before P5. Keep typical ViT dimensions separate from paper claims. |
| Transformer-internal Q/K/V and token interaction | P3 | P4/P6 only need the conclusion that inputs affect frozen computations | Do not call the internal Attention Key the L2P retrieval Key; do not redo the full derivation after P3. |
| Trainable continuous prompt | P4 | P5 refers back to why prompt values can condition frozen features | P4's single prompt is a simplified bridge, not the formal L2P method or full experimental configuration. |
| Pool values, external keys, query, top-N | P5 | P6 takes the selected prompt set; P7 uses selected keys in the matching loss | Introduce Eq. 3 only after the query/key roles are clear. Defer history-weighted Eq. 4 until P9. |
| Prompt-position mean and shared classifier | P6 | P7 starts from the resulting logits; P8 uses the same readout | Keep the no-prompt `[class]` query path separate from prompt-conditioned classification. Do not average all output tokens. |
| Classification and key-matching losses, selected-set update | P7 | P8 references the full batch update without repeating the gradient derivation | Do not treat the hard top-N indices as ordinary differentiable weights or update each sample immediately. |
| Persistent parameter state and prediction entry | P8 | P9 recalls the base algorithm when evaluating Eq. 4 and results | P8 must recover the entire execution order and state handoff; it is not a place to first teach all component definitions again. |
| Optional frequency-weighted retrieval and evidence boundary | P9 | Connect back to P5's base Eq. 3 and P8's inference path | Do not imply Eq. 4 is required for task-agnostic operation or used at test time. |

## Mathematical Expression Strategy

- **P2 token shapes:** start with the purpose of converting image patches into a feature sequence. The 224×224 / ViT-B/16 / 197×768 example is a typical architecture configuration from the approved teaching plan; label it as background and verify the selected checkpoint before implementation (B02, C12).
- **P3 attention:** begin with one target token and a few source tokens; show match scores, Softmax weights, and weighted Value aggregation before generalizing to all positions and heads. Any numeric demonstration must be recomputable and labeled as a teaching example. Pre-LN ordering is implementation-dependent background, not an L2P equation (B03).
- **P4 prompt tuning:** first state the shape of a trainable prompt and the concatenation idea. Explain the classification signal and input-gradient route without requiring a full chain-rule or optimizer course. Keep this single-prompt system explicitly separate from the pooled method (T03, O03).
- **P5 Eq. 3:** introduce cosine distance only after the reader knows which vectors are compared. A small explicit candidate set can show how the lowest `N` distances form a temporary index set; then state the general subset objective. The exact distance is a retrieval score, not an attention weight (C05, T02).
- **P6 Eq. 2 and Eq. 5 readout:** establish the selected sequence first, then show concatenation along token length and the `N·L_p` prompt output positions. Use the experiment configuration to distinguish pool capacity `M` from input length `N·L_p` (C06, C12).
- **P7 Eq. 5:** start from classification cross-entropy, identify why the discrete selected index set does not give the desired smooth Key-ranking signal, add the selected-key distance term, and only then present the combined objective. A two-sample batch example may use the same selected prompt in both samples; label its indices as synthetic (C07, C08, T01).
- **P8 execution notation:** use `P`, `K`, and `φ` as persistent states; use `q(x)`, selected indices, augmented tokens, pooled features, and losses as derived or temporary values. The pseudocode must retain the paper's task/epoch/batch/sample/update order. Distinguish Algorithm 1's gradient-step notation from the experiments' Adam optimizer (C08, C12, M01).
- **P9 Eq. 4:** introduce the historical frequency factor only after Eq. 3 and the complete base run are understood. Explain its known-boundary training condition and retain Eq. 3 for inference. Do not invent frequency initialization or smoothing details absent from the paper (C09, O02).

## Complete Algorithm Integration

**Dedicated integration stage: P8.** The reader has already learned the roles and local operations in P2–P7. P8's purpose is to understand one continuous L2P system with stable object identity and real execution order, not to reteach or concatenate prior explanations.

| W2 execution element | P8 integration treatment |
| --- | --- |
| Initial state | Frozen pretrained `f_e` and `f_r`; initialized prompt pool `P`, paired key pool `K`, and shared classifier `φ`. The source does not define a universal initialization distribution (Algorithm 1, PDF p. 13). |
| Task and epoch input | Process tasks in arrival order and the configured epochs where boundaries exist. In task-agnostic experiments, process the changing stream without inventing task IDs or boundaries. |
| Per-sample order | Compute `q(x)` from the no-prompt frozen ViT `[class]` feature → retrieve top-N keys → retrieve paired prompt values → compute `x_e=f_e(x)` → prepend prompt values → run frozen `f_r` → average the first `N·L_p` prompt positions → apply `g_φ`. |
| Training signal | For each labeled sample, compute classification cross-entropy plus `λ` times selected-key matching distance. Accumulate the sample losses and selected key/prompt sets over the batch. |
| Update boundary | After all samples in the current minibatch, update the selected `K`/`P` entries and shared `φ`. Keep `f_e` and `f_r` fixed. Then pass the updated state to the next minibatch. |
| Cross-task handoff | Carry the same `P`, `K`, and `φ` into the next task; do not reset pools or equate a prompt with a permanent task assignment. Base L2P does not preserve old images; L2P-R is a separate replay-equipped variant. |
| Optional branch | State that known task boundaries may enable Eq. 4 during training; defer its rationale and evidence to P9. Base task-agnostic training and all inference use Eq. 3. |
| Prediction/output | Given an unlabeled image, compute the no-prompt query, retrieve via Eq. 3, run the prompt-conditioned classification path, and return a prediction. No label loss, backpropagation, task ID, or parameter update is used. |

The integrated teaching account must let a reader trace frozen state, persistent learned parameters, temporary values, update timing, the optional branch, and the final prediction without needing the pages that first introduced the components. The system-level account may reuse verified calculations, but its question is how one method runs over time and hands state forward.

## Human Review

**W4 status: PENDING human review.** The three source plans are treated as the user's approved P1–P9 mainline and are preserved. The evidence-linked priority assignments and the consolidated prose above are new W4 work and have not yet been reviewed as a single learning spine. No reviewer or acceptance note has been entered in `paper.yaml`.

- Can a new reader state the problem and central idea from this order?
- Can the reader reconstruct the architecture and the real algorithm from initialization, through a concrete update and cross-task state, to prediction/output?
- Is anything required to understand the main mechanism incorrectly placed in Reference?
- Does each CORE stage follow from a clear gap, without unexplained terms or repeated full explanations?
- Are terms and mathematical tools introduced at the point of need, with complex expressions explained at appropriate depth rather than front-loaded or hidden?
- Does P8 have a distinct system-level purpose and cover W2's execution model rather than mechanically joining earlier components?
- What correct but unnecessary content should remain omitted?

W2's paper model is also a human-review gate. The evidence and spine drafts are prepared, but W3/W4 cannot be recorded complete until W2 is accepted and the new W4 priority matrix is confirmed. Visual-object decisions remain outside this W4 artifact.
