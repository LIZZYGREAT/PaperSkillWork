# Asset Plan: Overcoming catastrophic forgetting in neural networks

Paper ID: `ewc`

## W3 Decision

The source inventory is linked below by the stable IDs in `source-cache/manifest.json`. Figure 1 is the clearest mechanism overview; Figure 2 gives the permuted-MNIST evidence; Figure 3 combines the Atari schedule/results with the Fisher perturbation diagnostic. These three are selected as whole figures, cropped only to remove the surrounding PDF page. No panel, label, data mark, or color is altered. Figure 4 and Tables 1–2 remain internal evidence references; their detail does not justify public display in the primary tutorial path.

The [PNAS article page](https://www.pnas.org/doi/10.1073/pnas.1611835114) records receipt on July 19, 2016 and says the article is freely available through the PNAS open-access option. PNAS's [author rights and permissions policy](https://www.pnas.org/author-center/publication-charges) allows original figures and tables from articles under its standard License to Publish to be used for noncommercial educational purposes when the full journal reference is cited; the publisher's [copyright-policy editorial](https://pmc.ncbi.nlm.nih.gov/articles/PMC2629225/) describes that policy. The selected figures are therefore planned for unchanged, noncommercial educational display with full attribution. This is not a CC license and does not authorize commercial reuse. If the tutorial's distribution or purpose becomes commercial, replace these assets with new diagrams or obtain permission before release.

## Inventory, Selection, and Provenance

The fenced YAML is machine-checked. It makes exactly one decision for every source visual in `source-cache/manifest.json`. The selected figure crops live under `source-cache/figures/`; the source PDF remains internal and must not be submitted. W5 will assign selected figures to the approved Learning Spine stages and confirm final rendering. The derivative and exported web copies are created during implementation, not in W3.

```yaml
assets:
  - id: EWC-F1
    paper_figure_id: F1
    page: "3"
    caption: "Elastic weight consolidation (EWC) ensures task A is remembered whilst training on task B. Training trajectories are illustrated in a schematic parameter space, with parameter regions leading to good performance on task A (gray) and on task B (cream). After learning the first task, the parameters are at θ*_A. If we take gradient steps according to task B alone (blue arrow), we will minimize the loss of task B but destroy what we have learnt for task A. On the other hand, if we constrain each weight with the same coefficient (green arrow) the restriction imposed is too severe and we can only remember task A at the expense of not learning task B. EWC, conversely, finds a solution for task B without incurring a significant loss on task A (red arrow) by explicitly computing how important weights are for task A."
    source_path: source-cache/figures/figure-1.png
    source_locator: "PDF p. 3, Figure 1"
    type: MECHANISM
    teaching_role: "Show how unregularized updates, uniform L2, and the EWC penalty produce different parameter-space paths."
    decision: CROP_AND_USE
    processing: "Whole Figure 1 rendered from the source PDF at 4x and cropped to the figure bounds; no content inside the figure was changed."
    derivative_path: assets/figures/web/figure-1.png
    web_path: public/images/figure-1.png
    evidence_refs: [C01, C02, C06, I01]
    source_paper_version: "arXiv:1612.00796v2, 2017-01-25"
    source_location: "User-provided papers/ewc/source/EWC.pdf; published article DOI 10.1073/pnas.1611835114"
    attribution: "Kirkpatrick J, et al. Overcoming catastrophic forgetting in neural networks. Proceedings of the National Academy of Sciences. 2017;114(13):3521-3526. doi:10.1073/pnas.1611835114. Original Figure 1, cropped to the figure bounds and reproduced unchanged for noncommercial educational use."
    reuse_rights: "PNAS standard License to Publish reuse policy permits original figures for noncommercial educational use with full journal reference; the article was received 2016-07-19. Commercial reuse is not covered."
    explanation: "Shown on Page 6 after Equation (3), where learners have enough context to read its comparison among Task-B-only movement, a uniform constraint, and EWC's importance-weighted constraint. It does not introduce the method on Page 1."

  - id: EWC-F2
    paper_figure_id: F2
    page: "4"
    caption: "Results on the permuted MNIST task. A: Training curves for three random permutations A, B and C using EWC (red), L2 regularization (green) and plain SGD (blue). Note that only EWC is capable of mantaining a high performance on old tasks, while retaining the ability to learn new tasks. B: Average performance across all tasks using EWC (red) or SGD with dropout regularization (blue). The dashed line shows the performance on a single task only. C: Similarity between the Fisher information matrices as a function of network depth for two different amounts of permutation. Either a small square of 8x8 pixels in the middle of the image is permuted (grey) or a large square of 26x26 pixels is permuted (black). Note how the more different the tasks are, the smaller the overlap in Fisher information matrices in early layers."
    source_path: source-cache/figures/figure-2.png
    source_locator: "PDF p. 4, Figure 2A-C"
    type: RESULT
    teaching_role: "Ground the permuted-MNIST retention and Fisher-overlap explanations in the paper's plotted evidence."
    decision: CROP_AND_USE
    processing: "Whole Figure 2, all three panels and labels, rendered from the source PDF at 4x and cropped to the figure bounds; no content inside the figure was changed."
    derivative_path: assets/figures/web/figure-2.png
    web_path: public/images/figure-2.png
    evidence_refs: [C10, R01, R02, I02]
    source_paper_version: "arXiv:1612.00796v2, 2017-01-25"
    source_location: "User-provided papers/ewc/source/EWC.pdf; published article DOI 10.1073/pnas.1611835114"
    attribution: "Kirkpatrick J, et al. Overcoming catastrophic forgetting in neural networks. Proceedings of the National Academy of Sciences. 2017;114(13):3521-3526. doi:10.1073/pnas.1611835114. Original Figure 2, cropped to the figure bounds and reproduced unchanged for noncommercial educational use."
    reuse_rights: "PNAS standard License to Publish reuse policy permits original figures for noncommercial educational use with full journal reference; the article was received 2016-07-19. Commercial reuse is not covered."
    explanation: "Useful evidence display for Page 8; preserve all three panels so the comparison and Fisher-overlap context remain visible."

  - id: EWC-F3
    paper_figure_id: F3
    page: "6"
    caption: "Results on Atari task. A: Schedule of games. Black bars indicate the sequential training periods (segments) for each game. After each training segment, performance on all games is measured. The EWC constraint is only activated to protect an agent's performance on each game once the agent has experienced 20 million frames in that game. B: Total scores for each method across all games. Red curve denotes the network which infers the task labels using the Forget Me Not algorithm; brown curve is the network provided with the task labels. The EWC and SGD curves start diverging when games start being played again that have been protected by EWC. C: Sensitivity of a single-game DQN, trained on Breakout, to noise added to its weights. The performance on Breakout is shown as a function of the magnitude (standard deviation) of the weight perturbation. The weight perturbation is drawn from a zero mean Gaussian with covariance that is either uniform (black; i.e. targets all weights equally), the inverse Fisher ((F + λI)^-1; blue; i.e. mimicking weight changes allowed by EWC), or uniform within the nullspace of the Fisher (orange; i.e. targets weights that the Fisher estimates that the network output is entirely invariant to). To evaluate the score, we ran the agent for ten full game episodes, drawing a new random weight perturbation for every timestep."
    source_path: source-cache/figures/figure-3.png
    source_locator: "PDF p. 6, Figure 3A-C"
    type: RESULT
    teaching_role: "Show the Atari sequence and system-level results together with the separate Fisher-perturbation diagnostic."
    decision: CROP_AND_USE
    processing: "Whole Figure 3, all three panels and labels, rendered from the source PDF at 4x and cropped to the figure bounds; no content inside the figure was changed."
    derivative_path: assets/figures/web/figure-3.png
    web_path: public/images/figure-3.png
    evidence_refs: [C08, C09, R03, R04, R05, A01]
    source_paper_version: "arXiv:1612.00796v2, 2017-01-25"
    source_location: "User-provided papers/ewc/source/EWC.pdf; published article DOI 10.1073/pnas.1611835114"
    attribution: "Kirkpatrick J, et al. Overcoming catastrophic forgetting in neural networks. Proceedings of the National Academy of Sciences. 2017;114(13):3521-3526. doi:10.1073/pnas.1611835114. Original Figure 3, cropped to the figure bounds and reproduced unchanged for noncommercial educational use."
    reuse_rights: "PNAS standard License to Publish reuse policy permits original figures for noncommercial educational use with full journal reference; the article was received 2016-07-19. Commercial reuse is not covered."
    explanation: "Useful evidence display for Page 9; labels and panel composition help distinguish the complete Atari system from the single-game perturbation experiment."

  - id: EWC-F4
    paper_figure_id: F4
    page: "13"
    caption: "Score in the individual games as a function of steps played in that game. The black baseline curves show learning on individual games alone."
    source_locator: "PDF p. 13, Figure 4, Appendix Section 4.2"
    type: RESULT
    teaching_role: "Detailed per-game supporting evidence."
    decision: REFERENCE_ONLY
    evidence_refs: [R06]
    reason: "Retain as an internal evidence locator; Figure 3 already gives the main Atari story, and these detailed curves are not needed on the primary learning path."

  - id: EWC-T1
    paper_figure_id: T1
    page: "10"
    caption: "Hyperparameters for each of the MNIST figures"
    source_locator: "PDF p. 10, Table 1, Appendix Section 4.1"
    type: LOW_VALUE
    teaching_role: "Reproducibility details for the MNIST experiments."
    decision: REFERENCE_ONLY
    evidence_refs: [C10, R01]
    reason: "Keep the values available in the source paper for reference, but the table is too dense for the core tutorial and does not improve the conceptual explanation."

  - id: EWC-T2
    paper_figure_id: T2
    page: "12"
    caption: "Hyperparameters for each of the MNIST figures"
    source_locator: "PDF p. 12, Table 2, Appendix Section 4.2"
    type: LOW_VALUE
    teaching_role: "Reproducibility details for Atari, task recognition, and Fisher estimation."
    decision: REFERENCE_ONLY
    evidence_refs: [C08, C09]
    reason: "Keep as an internal reference only. Its printed caption says MNIST even though the table sits in the Atari appendix; do not reproduce that caption as an accurate description."
```

## Scene Placement

W5 should place Figure 1 with the forgetting/parameter-conflict explanation, Figure 2 with Permuted MNIST, and Figure 3 with Atari and its limits. Keep each figure intact and include accessible alt text and a full paper reference. Any tutorial annotation must be separate from the original image and clearly identified as a teaching annotation; do not paint annotations over the source figures.
