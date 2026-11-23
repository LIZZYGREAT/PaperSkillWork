# Asset Plan: Learning to Prompt for Continual Learning

Paper ID: `l2p`

## Evaluation

The method overview (Figures 1–2) and formal Algorithm 1 are high-value internal references for understanding the system and its execution order. Tables 1–5 and Figures 3–4 provide evidence about performance, prompt use, ablations, and sensitivity. The supplied 13-page arXiv v2 PDF does not establish a reuse license for the paper's figures or tables. Therefore, no source visual is selected for publication at W3: all ten are retained as `REFERENCE_ONLY` with their original page captures for research use. W3 does not select or design the tutorial's own visual objects; W5 may plan paper-specific explanations only after the W4 learning spine is accepted.

## Inventory, Selection, and Provenance

The complete source inventory and full captions are in `source-cache/manifest.json`. Page captures are rendered from the preserved `source/paper.pdf` at 180 dpi and are for internal review; they are not approved web assets. No derivative or web destination has been created.

```yaml
assets:
  - id: AS_FIG1
    paper_figure_id: FIGURE_1
    page: "PDF p. 1"
    caption: "Overview of the L2P framework. Compared with typical methods that adapt entire or partial model weights to tasks sequentially with a rehearsal buffer to avoid forgetting, L2P uses a single backbone model and learns a prompt pool to instruct the model conditionally. Task-specific knowledge is stored inside a prompt pool, thus a rehearsal buffer is no longer mandatory to mitigate forgetting. L2P automatically selects and updates prompts from the pool in an instance-wise fashion, thus task identity is not required at test time. Notably, our largest prompt space is smaller than the size of one 224 × 224 image."
    source_path: source-cache/figures/source-pdf-page-01.png
    source_locator: "Figure 1, PDF p. 1"
    type: PIPELINE
    teaching_role: "High-level comparison and overview of the prompt-pool method."
    decision: REFERENCE_ONLY
    processing: none
    derivative_path: ""
    web_path: ""
    evidence_refs: [C01, C02, C03]
    source_paper_version: "arXiv:2112.08654v2"
    source_location: "source/paper.pdf"
    attribution: "Wang et al., Learning to Prompt for Continual Learning, arXiv:2112.08654v2."
    reuse_rights: "Not verified from the supplied PDF; no publication reuse basis recorded."
    reason: "Keep as an internal reference only; do not reproduce or publish the paper figure without a verified reuse basis."
    explanation: "Useful orientation source, but it is not selected as tutorial art. Any later teaching visual is a separate W5 design decision after W4 acceptance."
  - id: AS_FIG2
    paper_figure_id: FIGURE_2
    page: "PDF p. 4"
    caption: "Illustration of L2P at test time. We follow the same procedure at training time: First, L2P selects a subset of prompts from a key-value paired prompt pool based on our proposed instance-wise query mechanism. Then, L2P prepends the selected prompts to the input tokens. Finally, L2P feeds the extended tokens to the model, and optimize the prompt pool through the loss defined in equation 5. The objective is learning to select and update prompts to instruct the prediction of the pre-trained backbone model."
    source_path: source-cache/figures/source-pdf-page-04.png
    source_locator: "Figure 2, PDF p. 4; §4.2; Eq. 5"
    type: PIPELINE
    teaching_role: "Overview of prompt retrieval, input augmentation, frozen-model processing, and training objective."
    decision: REFERENCE_ONLY
    processing: none
    derivative_path: ""
    web_path: ""
    evidence_refs: [C03, C04, C05, C06, C07]
    source_paper_version: "arXiv:2112.08654v2"
    source_location: "source/paper.pdf"
    attribution: "Wang et al., Learning to Prompt for Continual Learning, arXiv:2112.08654v2."
    reuse_rights: "Not verified from the supplied PDF; no publication reuse basis recorded."
    reason: "Keep as an internal reference only; do not reproduce or publish the paper figure without a verified reuse basis."
    explanation: "High-value source reference for the method; W5 should independently determine what tutorial explanation is needed after W4, without copying this figure by default."
  - id: AS_TABLE1
    paper_figure_id: TABLE_1
    page: "PDF p. 6"
    caption: "Results on class-incremental learning (i.e., task identity is unknown at test time). Compared methods are grouped based on different rehearsal buffer sizes. 0 means no rehearsal is required, where most SOTA methods are not applicable anymore. Importantly, L2P can attain competitive results without it and greatly outperform them with a small buffer size."
    source_path: source-cache/figures/source-pdf-page-06.png
    source_locator: "Table 1, §§5.2–5.3, PDF pp. 6–7"
    type: RESULT
    teaching_role: "Class-incremental benchmark evidence across buffer sizes."
    decision: REFERENCE_ONLY
    processing: none
    derivative_path: ""
    web_path: ""
    evidence_refs: [R01, C10, C11]
    source_paper_version: "arXiv:2112.08654v2"
    source_location: "source/paper.pdf"
    attribution: "Wang et al., Learning to Prompt for Continual Learning, arXiv:2112.08654v2."
    reuse_rights: "Not verified from the supplied PDF; no publication reuse basis recorded."
    reason: "Keep as an internal evidence reference; report verified values in tutorial-authored text or a separately designed table if W5 needs them."
    explanation: "The table is evidence rather than a required teaching graphic; direct reuse is not approved."
  - id: AS_TABLE2
    paper_figure_id: TABLE_2
    page: "PDF p. 6"
    caption: "Class-incremental results on Split CIFAR-100 against architecture-based methods. Diff = Upper-Bound Acc - Method Acc (lower is better) measures how close the performance to the upper-bound of the used backbone."
    source_path: source-cache/figures/source-pdf-page-06.png
    source_locator: "Table 2, §5.3, PDF p. 6"
    type: RESULT
    teaching_role: "Architecture-based comparison normalized to each backbone's upper bound."
    decision: REFERENCE_ONLY
    processing: none
    derivative_path: ""
    web_path: ""
    evidence_refs: [R01, C11]
    source_paper_version: "arXiv:2112.08654v2"
    source_location: "source/paper.pdf"
    attribution: "Wang et al., Learning to Prompt for Continual Learning, arXiv:2112.08654v2."
    reuse_rights: "Not verified from the supplied PDF; no publication reuse basis recorded."
    reason: "Keep as internal evidence only; its backbone-specific Diff comparison needs careful context and is not selected as tutorial art."
    explanation: "If used later, preserve the distinction between the ResNet18 baselines and the ViT-B/16 L2P result."
  - id: AS_TABLE3
    paper_figure_id: TABLE_3
    page: "PDF p. 6"
    caption: "Results on domain-incremental learning using CORe50 dataset, in terms of test accuracy."
    source_path: source-cache/figures/source-pdf-page-06.png
    source_locator: "Table 3, §§5.2–5.3, PDF p. 6"
    type: RESULT
    teaching_role: "Domain-incremental CORe50 evidence."
    decision: REFERENCE_ONLY
    processing: none
    derivative_path: ""
    web_path: ""
    evidence_refs: [R02, C10, C11]
    source_paper_version: "arXiv:2112.08654v2"
    source_location: "source/paper.pdf"
    attribution: "Wang et al., Learning to Prompt for Continual Learning, arXiv:2112.08654v2."
    reuse_rights: "Not verified from the supplied PDF; no publication reuse basis recorded."
    reason: "Keep as an internal evidence reference; a concise, correctly labeled result is sufficient if later selected for teaching."
    explanation: "No direct reuse or derivative is planned."
  - id: AS_TABLE4
    paper_figure_id: TABLE_4
    page: "PDF p. 7"
    caption: "Results on task-agnostic continual learning using the Gaussian scheduled CIFAR-100 dataset, in terms of test accuracy."
    source_path: source-cache/figures/source-pdf-page-07.png
    source_locator: "Table 4, §§5.2–5.3, PDF pp. 7–8; Appendix C, PDF p. 12"
    type: RESULT
    teaching_role: "Task-agnostic benchmark result with explicit no-boundary context."
    decision: REFERENCE_ONLY
    processing: none
    derivative_path: ""
    web_path: ""
    evidence_refs: [R03, C11, C13]
    source_paper_version: "arXiv:2112.08654v2"
    source_location: "source/paper.pdf"
    attribution: "Wang et al., Learning to Prompt for Continual Learning, arXiv:2112.08654v2."
    reuse_rights: "Not verified from the supplied PDF; no publication reuse basis recorded."
    reason: "Keep as an internal evidence reference; any later presentation must state that the Gaussian-scheduled benchmark is synthetic."
    explanation: "Not selected for publication because rights are unverified and the result can be cited in tutorial-authored text."
  - id: AS_FIG3
    paper_figure_id: FIGURE_3
    page: "PDF p. 7"
    caption: "Prompt selection histograms for (left) Split CIFAR-100 and (right) 5-datasets. CIFAR-100 has higher intra-task similarity compared to 5-datasets, thus largely sharing prompts between tasks results in good performance, while 5-datasets favors more task-specific prompts. We only show the first 5 tasks for Split CIFAR-100 for better readability."
    source_path: source-cache/figures/source-pdf-page-07.png
    source_locator: "Figure 3, §5.4, PDF pp. 7–8"
    type: RESULT
    teaching_role: "Observed prompt selection frequencies and author interpretation of sharing patterns."
    decision: REFERENCE_ONLY
    processing: none
    derivative_path: ""
    web_path: ""
    evidence_refs: [A02, C03]
    source_paper_version: "arXiv:2112.08654v2"
    source_location: "source/paper.pdf"
    attribution: "Wang et al., Learning to Prompt for Continual Learning, arXiv:2112.08654v2."
    reuse_rights: "Not verified from the supplied PDF; no publication reuse basis recorded."
    reason: "Keep as an internal reference; do not reuse the histogram artwork without a verified reuse basis."
    explanation: "The histogram may inform a later evidence explanation, but its interpretation remains bounded to the plotted settings."
  - id: AS_TABLE5
    paper_figure_id: TABLE_5
    page: "PDF p. 7"
    caption: "Ablation studies. See text for detailed explanations."
    source_path: source-cache/figures/source-pdf-page-07.png
    source_locator: "Table 5, §5.4, PDF pp. 7–8"
    type: ABLATION
    teaching_role: "Ablation evidence for pool, key-value pairing, and diversified selection."
    decision: REFERENCE_ONLY
    processing: none
    derivative_path: ""
    web_path: ""
    evidence_refs: [R04, A03]
    source_paper_version: "arXiv:2112.08654v2"
    source_location: "source/paper.pdf"
    attribution: "Wang et al., Learning to Prompt for Continual Learning, arXiv:2112.08654v2."
    reuse_rights: "Not verified from the supplied PDF; no publication reuse basis recorded."
    reason: "Keep as internal evidence only; if later teaching requires it, report values with the 5-datasets protocol and avoid generalizing."
    explanation: "No direct table reuse or derivative is approved."
  - id: AS_FIG4
    paper_figure_id: FIGURE_4
    page: "PDF p. 8"
    caption: "Left-Middle: Average accuracy w.r.t prompt length Lp and prompt selection size N for Split CIFAR-100 and 5-datasets, respectively, given M = 20. Right: Average accuracy (%) w.r.t. prompt pool size M, given Lp = 5, N = 5 for Split CIFAR-100 and Lp = 5, N = 4 for 5-datasets."
    source_path: source-cache/figures/source-pdf-page-08.png
    source_locator: "Figure 4, §5.4, PDF p. 8"
    type: RESULT
    teaching_role: "Hyperparameter sensitivity evidence with dataset-specific settings."
    decision: REFERENCE_ONLY
    processing: none
    derivative_path: ""
    web_path: ""
    evidence_refs: [R05, C12]
    source_paper_version: "arXiv:2112.08654v2"
    source_location: "source/paper.pdf"
    attribution: "Wang et al., Learning to Prompt for Continual Learning, arXiv:2112.08654v2."
    reuse_rights: "Not verified from the supplied PDF; no publication reuse basis recorded."
    reason: "Keep as an internal evidence reference; do not publish the plot without a verified reuse basis."
    explanation: "The captioned fixed parameters matter to any later interpretation; no derivative is planned at W3."
  - id: AS_ALG1
    paper_figure_id: ALGORITHM_1
    page: "PDF p. 13"
    caption: "Learning to Prompt for Continual Learning (L2P)."
    source_path: source-cache/figures/source-pdf-page-13.png
    source_locator: "Algorithm 1, Appendix D, PDF pp. 12–13"
    type: ALGORITHM
    teaching_role: "Formal source for task, epoch, minibatch, sample, selected-set, and update order."
    decision: REFERENCE_ONLY
    processing: none
    derivative_path: ""
    web_path: ""
    evidence_refs: [C07, C08, M01]
    source_paper_version: "arXiv:2112.08654v2"
    source_location: "source/paper.pdf"
    attribution: "Wang et al., Learning to Prompt for Continual Learning, arXiv:2112.08654v2."
    reuse_rights: "Not verified from the supplied PDF; no publication reuse basis recorded."
    reason: "Use only as an internal source reference; explain the algorithm in original tutorial prose rather than copying the formatted algorithm block."
    explanation: "This source block grounds the W2 execution model; it is not selected as a public asset."
```

## Scene Placement

No paper visual is assigned to a tutorial stage in W3. The PDF-page captures remain internal source references. W4 will determine the learner's causal path and priorities without choosing diagrams, visual objects, or animation. Once W4 is reviewed, W5 can decide what explanatory visuals are needed and separately check whether any paper asset has an approved reuse basis.

## User-Provided Context References

Two ViT explainer images supplied with the L2P source materials are preserved under source/notes/images/ and listed in source-cache/evidence.json. They are background references only, not figures from the L2P paper and not selected as tutorial visuals. W4 remains limited to the learning sequence; visual-object choices are deferred to W5 after W4 review.

