# Asset Plan: Dark Experience for General Continual Learning: a Strong, Simple Baseline

Paper ID: der

## Evaluation

The source manifest contains 4 figures, 10 tables, and 3 algorithms. All 17 entries are inventoried below. The cached PNGs are contextual page captures. No public image reuse permission was independently verified, so each source visual is REFERENCE_ONLY. A01/A02/A03, T02/T03, and F02 are especially useful for checking the method, reservoir, and evidence, but usefulness does not grant reuse rights. A later tutorial may commission an independently composed explanation after separate provenance and rights review; this plan does not authorize publishing source screenshots or derivatives.

## Inventory, Selection, and Provenance

Source version: arXiv:2004.07211v2 (2020-10-22), NeurIPS 2020. Source location: https://arxiv.org/pdf/2004.07211v2. The source_path is the internal contextual page capture listed in source-cache/manifest.json; multipart originals retain their additional pages in that cache. No derivative or release web path is planned for a reference-only item.

```yaml
assets:
  - id: AS_T01
    paper_figure_id: T01
    page: '2'
    caption: 'Continual learning approaches and their compatibility with the General Continual Learning major requirements [11]. For an exhaustive discussion, please refer to supplementary materials.'
    source_path: source-cache/figures/P02.png
    source_locator: 'Table 1, p. 2'
    type: LOW_VALUE
    teaching_role: 'Reference for the paper authors’ GCL compatibility framing and Appendix A discussion.'
    decision: REFERENCE_ONLY
    reason: 'Retained for internal source verification; it is a comparison table rather than a necessary explanation of the DER update, and public image reuse rights are unverified.'
    processing: 'No public derivative; retain the contextual page capture as local source evidence.'
    evidence_refs: [C01]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'The underlying GCL constraints can be explained in authored text with citations; the page screenshot is not a planned tutorial asset.'
  - id: AS_A01
    paper_figure_id: A01
    page: '4'
    caption: 'Dark Experience Replay'
    source_path: source-cache/figures/P04.png
    source_locator: 'Algorithm 1, p. 4, left column'
    type: ALGORITHM
    teaching_role: 'Audit DER sample, loss, update, and write order; the source page also contains Algorithm 2.'
    decision: REFERENCE_ONLY
    reason: 'Essential for source checking but the printed algorithm has notation and sign issues already disclosed in W2; public reuse rights are unverified.'
    processing: 'No public derivative; cite the algorithm and author a fresh explanation only after later-stage review.'
    evidence_refs: [C02, C04, M02, M04]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'A newly composed execution walkthrough may teach the same verified order without republishing the page capture.'
  - id: AS_A02
    paper_figure_id: A02
    page: '4'
    caption: 'Dark Experience Replay ++'
    source_path: source-cache/figures/P04.png
    source_locator: 'Algorithm 2, p. 4, right column'
    type: ALGORITHM
    teaching_role: 'Audit DER++ additional label replay and two calls to sample from memory.'
    decision: REFERENCE_ONLY
    reason: 'Useful for a source-grounded comparison with DER, but direct image reuse rights are unverified.'
    processing: 'No public derivative; explain the added loss using a separately authored diagram if approved later.'
    evidence_refs: [C03, C05, C04]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'The additional term and possible sample overlap are captured in evidence IDs C03 and C05.'
  - id: AS_T02
    paper_figure_id: T02
    page: '6'
    caption: 'Classification results for standard CL benchmarks, averaged across 10 runs. “-” indicates experiments we were unable to run, because of compatibility issues (e.g. between PNN, iCaRL and LwF in Domain-IL) or intractable training time (e.g. GEM, HAL or GSS on Tiny ImageNet).'
    source_path: source-cache/figures/P06.png
    source_locator: 'Table 2, p. 6'
    type: RESULT
    teaching_role: 'Primary evidence for standard Class-IL, Task-IL, and Domain-IL comparisons with different capacities.'
    decision: REFERENCE_ONLY
    reason: 'The table is important evidence, but this is an unprocessed source-page capture and its public reuse rights are unverified.'
    processing: 'Keep local for verification; cite exact rows in text instead of embedding the capture.'
    evidence_refs: [R01, R02, R03, R05]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'Any future chart would be newly authored from verified values and reviewed for provenance before publication.'
  - id: AS_F01
    paper_figure_id: F01
    page: '7'
    caption: 'Example batches of the MNIST-360 stream.'
    source_path: source-cache/figures/P07.png
    source_locator: 'Figure 1, p. 7'
    type: DATASET_EXAMPLE
    teaching_role: 'Show how digit identity and rotation vary over the MNIST-360 stream.'
    decision: REFERENCE_ONLY
    reason: 'Retained as a source example; public reuse rights for the source images are unverified.'
    processing: 'No public derivative; any future data-stream example should be recreated from appropriately licensed data.'
    evidence_refs: [C08]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'A text description is sufficient at W3; future visual treatment belongs to a reviewed later stage.'
  - id: AS_T03
    paper_figure_id: T03
    page: '7'
    caption: 'Accuracy on the test set for MNIST-360.'
    source_path: source-cache/figures/P07.png
    source_locator: 'Table 3, p. 7'
    type: RESULT
    teaching_role: 'Evidence for the MNIST-360 final evaluation and the study’s GCL result.'
    decision: REFERENCE_ONLY
    reason: 'This source-page screenshot is for verification only; no public image reuse rights are established.'
    processing: 'Cite the bounded results in prose or create a separately reviewed chart later.'
    evidence_refs: [R04, C08]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'Keep protocol details and reported ± values attached to any later use of these results.'
  - id: AS_F02
    paper_figure_id: F02
    page: '8'
    caption: 'Results for the model analysis. [↑] higher is better, [↓] lower is better (best seen in color).'
    source_path: source-cache/figures/P08.png
    source_locator: 'Figure 2(a–f), p. 8; discussion pp. 7–9'
    type: RESULT
    teaching_role: 'Reference the six author analyses: perturbation, Fisher trace, calibration, reliability, memory fitting, and time.'
    decision: REFERENCE_ONLY
    reason: 'The multi-panel figure is useful for locating author analyses but its source image reuse rights are unverified.'
    processing: 'No public derivative; summarize only the panel and experimental condition needed for a later claim.'
    evidence_refs: [AI01, AI02]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'Avoid presenting the contextual page capture as a web-ready graphic or a general guarantee.'
  - id: AS_F03
    paper_figure_id: F03
    page: '14–15'
    caption: 'Performance vs. memory allocation for the experiments of Section 4 and F.1. Successive points of the same method indicate increasing buffer size. Methods with lower accuracy or excessive memory consumption may be omitted (best viewed in color).'
    source_path: source-cache/figures/P14.png
    source_locator: 'Figure 3, pp. 14–15, Appendix C'
    type: RESULT
    teaching_role: 'Compare reported accuracy and memory allocation while retaining the figure’s omitted-method caveat.'
    decision: REFERENCE_ONLY
    reason: 'It is a multipart source graphic, and neither direct reuse nor a derivative right has been verified.'
    processing: 'P14.png is the first page; the complete source spans P14.png and P15.png. No public derivative.'
    evidence_refs: [R06]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'The complete multipart original remains available in the internal source cache for checking.'
  - id: AS_A03
    paper_figure_id: A03
    page: '15'
    caption: 'Reservoir Sampling'
    source_path: source-cache/figures/P15.png
    source_locator: 'Algorithm 3, p. 15, Appendix D'
    type: ALGORITHM
    teaching_role: 'Check the reservoir insertion rule, notation, and inclusion-probability proof.'
    decision: REFERENCE_ONLY
    reason: 'The source algorithm’s capacity notation needs the disclosed W2 normalization, and public reuse rights are unverified.'
    processing: 'No public derivative; later teaching can use separately authored pseudocode with the source locator.'
    evidence_refs: [C06, M03, I01]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'Do not copy the printed algorithm as an unqualified implementation contract.'
  - id: AS_T04
    paper_figure_id: T04
    page: '16'
    caption: 'Results for the Sequential-MNIST dataset.'
    source_path: source-cache/figures/P16.png
    source_locator: 'Table 4, p. 16, Appendix F.1'
    type: RESULT
    teaching_role: 'Supplementary Sequential-MNIST Class-IL and Task-IL evidence.'
    decision: REFERENCE_ONLY
    reason: 'Supplementary results are preserved for citation checks; public reuse rights are unverified.'
    processing: 'No public derivative; cite rows as needed.'
    evidence_refs: [R09]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'Keep appendix metrics supplemental to the main causal explanation.'
  - id: AS_F04
    paper_figure_id: F04
    page: '16'
    caption: 'A comparison between our proposal (DER++) and the variants of Experience Replay presented in [10].'
    source_path: source-cache/figures/P16.png
    source_locator: 'Figure 4, p. 16, Appendix F.2; discussion p. 17'
    type: ABLATION
    teaching_role: 'Supplementary low-memory comparison and the authors’ ghost-class conjecture context.'
    decision: REFERENCE_ONLY
    reason: 'Useful for limitation context, but source image reuse rights have not been verified.'
    processing: 'No public derivative; keep the conjecture attached to author attribution.'
    evidence_refs: [AI03]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'Do not turn the proposed ghost-class explanation into an established guarantee.'
  - id: AS_T05
    paper_figure_id: T05
    page: '17'
    caption: 'Single-epoch evaluation setting (Class-IL).'
    source_path: source-cache/figures/P17.png
    source_locator: 'Table 5, p. 17, Appendix F.3'
    type: RESULT
    teaching_role: 'Supporting evidence on short training and the underfitting caveat.'
    decision: REFERENCE_ONLY
    reason: 'Retained to qualify the one-epoch comparisons; no public reuse rights verified.'
    processing: 'No public derivative; cite the measured setting and discuss its limits.'
    evidence_refs: [R08]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'Do not generalize the one-epoch result to every online setting.'
  - id: AS_T06
    paper_figure_id: T06
    page: '18'
    caption: 'Forward Transfer results for the Experiments of Sec. 4.2 and F.1.'
    source_path: source-cache/figures/P18.png
    source_locator: 'Table 6, p. 18, Appendix F.4'
    type: RESULT
    teaching_role: 'Supplementary forward-transfer metric.'
    decision: REFERENCE_ONLY
    reason: 'A secondary evaluation table, retained for source completeness; public image reuse rights are unverified.'
    processing: 'No public derivative; include only if a later narrative needs this metric.'
    evidence_refs: [R08]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'This metric remains outside the central DER mechanism.'
  - id: AS_T07
    paper_figure_id: T07
    page: '19'
    caption: 'Backward Transfer results for the Experiments of Sec. 4.2 and F.1.'
    source_path: source-cache/figures/P19.png
    source_locator: 'Table 7, p. 19, Appendix F.4'
    type: RESULT
    teaching_role: 'Supplementary backward-transfer metric.'
    decision: REFERENCE_ONLY
    reason: 'A secondary evaluation table, retained for source completeness; public image reuse rights are unverified.'
    processing: 'No public derivative; include only if a later narrative needs this metric.'
    evidence_refs: [R08]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'This metric remains outside the central DER mechanism.'
  - id: AS_T08
    paper_figure_id: T08
    page: '20'
    caption: 'Forgetting results for the Experiments of Sec. 4.2 and F.1.'
    source_path: source-cache/figures/P20.png
    source_locator: 'Table 8, p. 20, Appendix F.4'
    type: RESULT
    teaching_role: 'Supplementary forgetting metric.'
    decision: REFERENCE_ONLY
    reason: 'A secondary evaluation table, retained for source completeness; public image reuse rights are unverified.'
    processing: 'No public derivative; include only if a later narrative needs this metric.'
    evidence_refs: [R07]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'This metric remains outside the central DER mechanism.'
  - id: AS_T09
    paper_figure_id: T09
    page: '21–23'
    caption: 'Hyperparameters selected for our experiments.'
    source_path: source-cache/figures/P21.png
    source_locator: 'Table 9, pp. 21–23, Appendix G.1'
    type: LOW_VALUE
    teaching_role: 'Full supplementary parameter settings; MNIST-360 batch sizes were searched.'
    decision: REFERENCE_ONLY
    reason: 'Low-value for the causal mainline but useful for protocol checking; public image reuse rights are unverified.'
    processing: 'The multipart original spans P21.png, P22.png, and P23.png; no public derivative.'
    evidence_refs: [C09, C08]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'Keep complete parameters in the source cache and cite only values needed to bound an experiment.'
  - id: AS_T10
    paper_figure_id: T10
    page: '23–24'
    caption: 'Hyperparameter space for Grid-Search'
    source_path: source-cache/figures/P23.png
    source_locator: 'Table 10, pp. 23–24, Appendix G.2'
    type: LOW_VALUE
    teaching_role: 'Complete supplementary grid-search ranges.'
    decision: REFERENCE_ONLY
    reason: 'Useful only for reproducibility details, and the source image reuse rights are unverified.'
    processing: 'The multipart original spans P23.png and P24.png; no public derivative.'
    evidence_refs: [C09]
    source_paper_version: 'arXiv:2004.07211v2 (2020-10-22)'
    source_location: 'https://arxiv.org/pdf/2004.07211v2'
    attribution: 'Pietro Buzzega et al., NeurIPS 2020, arXiv:2004.07211v2'
    reuse_rights: 'Not independently verified; no public reuse approved.'
    explanation: 'The full search space is supplementary rather than a core teaching asset.'
```

## Scene Placement

No public source visual is assigned to a spine scene at W3. The source captures remain local evidence. The later learning spine should teach the update and reservoir with newly composed material if approved, and should use text citations or newly authored plots for results. Any selection for publication requires a separate provenance and rights decision at the later implementation-planning stage.
