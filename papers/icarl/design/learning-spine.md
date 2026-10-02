# Learning Spine: iCaRL: Incremental Classifier and Representation Learning

Paper ID: `icarl`

## Primary Learning Spine

```text
Classes arrive in batches, but every seen class must remain in one prediction space under a limited image-memory budget
→ a shared feature extractor learns the representation while a per-class sigmoid head supplies training signals
→ nearest-mean-of-exemplars classification needs class representatives that can be recomputed in the current feature space
→ retain a bounded set of raw exemplar images and order them so a prefix remains representative when memory shrinks
→ when new classes arrive, train on their full data plus old exemplars and snapshot the old model responses before changing it
→ assign soft targets to old output nodes and hard labels to new nodes, update the shared representation, then use prototypes rather than head argmax for prediction
→ read the benchmark and ablation evidence with its protocol, exceptions, and memory boundaries
→ trace one full update from the saved state through the next prediction without confusing persistent and temporary objects
```

## Priority Matrix

The eight stages follow the Page 1–10 design plans, grouping Page 3–4 around the prototype-to-memory transition and Page 7–8 around the training-to-prediction distinction. The final runtime stage integrates earlier mechanisms; it should not reteach them.

```yaml
stages:
  - id: S01
    question: "What makes class-incremental learning difficult when new classes arrive?"
    pages: "Page 1"
    purpose: "Establish the joint requirements: learn new classes, retain old-class capability, predict over all seen classes, and limit stored history."
  - id: S02
    question: "Which part of the network learns a representation, and what does the training head do?"
    pages: "Page 2"
    purpose: "Open the network only far enough to distinguish the shared feature extractor from the class-output training head."
  - id: S03
    question: "How can a prototype classifier cover old classes when their full datasets are gone?"
    pages: "Pages 3–4"
    purpose: "Introduce the current-feature class mean, then motivate retained raw exemplars as the data that can be re-encoded and used for both rehearsal and prototypes."
  - id: S04
    question: "Which retained examples should survive when the per-class memory quota shrinks?"
    pages: "Page 5"
    purpose: "Explain herding as ordered prefix-mean approximation, then connect that order to later truncation."
  - id: S05
    question: "What must be prepared before the representation changes?"
    pages: "Page 6"
    purpose: "Form the update set from incoming full data and old exemplars, then snapshot old-node responses using the pre-update model."
  - id: S06
    question: "How do old and new output nodes learn, and how does that differ from final prediction?"
    pages: "Pages 7–8"
    purpose: "Assign soft and hard targets by output-node age, train through the shared representation, and close the loop with prototype inference."
  - id: S07
    question: "What do the experiments support, and where do their conclusions stop?"
    pages: "Page 9"
    purpose: "Interpret benchmark, confusion, ablation, and memory evidence only within each stated dataset and protocol; preserve exceptions and resource caveats."
  - id: S08
    question: "Can one complete an update and the next prediction from the current saved state?"
    pages: "Page 10"
    purpose: "Run the already learned objects through one ordered state transition; keep the trace compact and distinguish persistent state from update-local objects."

items:
  - {id: L01, title: "State the simultaneous class-incremental constraints", priority: CORE, stage: S01, placement: mainline, evidence_refs: [C01]}
  - {id: L02, title: "Keep all seen classes in one prediction space without a batch ID", priority: CORE, stage: S01, placement: mainline, evidence_refs: [C02]}
  - {id: L03, title: "Show why storing all history or training only on new classes fails the setting", priority: CORE, stage: S01, placement: mainline, evidence_refs: [C01, C15]}
  - {id: L04, title: "Separate the shared feature extractor from the per-class sigmoid training head", priority: CORE, stage: S02, placement: mainline, evidence_refs: [C03]}
  - {id: L05, title: "Classify by current-feature exemplar means across all seen classes", priority: CORE, stage: S03, placement: mainline, evidence_refs: [C04, C05]}
  - {id: L06, title: "Retain raw exemplar images because the same memory supports rehearsal and prototype inference", priority: CORE, stage: S03, placement: mainline, evidence_refs: [C04, C09]}
  - {id: L07, title: "Use the fixed exemplar-image budget K across the seen classes", priority: CORE, stage: S03, placement: mainline, evidence_refs: [C13]}
  - {id: L08, title: "Use herding to order examples by how each prefix approaches the full-class mean", priority: CORE, stage: S04, placement: mainline, evidence_refs: [C07, T01]}
  - {id: L09, title: "Reduce old exemplar lists by retaining their ordered prefixes", priority: CORE, stage: S04, placement: mainline, evidence_refs: [C08, C13]}
  - {id: L10, title: "Build the update set from all incoming images and retained old exemplars", priority: CORE, stage: S05, placement: mainline, evidence_refs: [C09]}
  - {id: L11, title: "Snapshot old-node responses on the whole update set before changing the model", priority: CORE, stage: S05, placement: mainline, evidence_refs: [C10]}
  - {id: L12, title: "Assign old soft targets and new hard targets according to output-node age", priority: CORE, stage: S06, placement: mainline, evidence_refs: [C10, C11]}
  - {id: L13, title: "Train independent sigmoid nodes with the same binary cross-entropy mechanism", priority: CORE, stage: S06, placement: mainline, evidence_refs: [C03, C12]}
  - {id: L14, title: "Keep the training head in the network but use current prototypes for final decisions", priority: CORE, stage: S06, placement: mainline, evidence_refs: [C05, C06]}
  - {id: L15, title: "Separate persistent network and exemplar state from update-local targets and losses", priority: CORE, stage: S06, placement: mainline, evidence_refs: [OI01, C09, C10]}
  - {id: L16, title: "Read iCIFAR-100 and iILSVRC results with their distinct protocols and metrics", priority: CORE, stage: S07, placement: mainline, evidence_refs: [R01, R02]}
  - {id: L17, title: "State the Figure 2 comparison within those tested settings and mark the all-data reference", priority: CORE, stage: S07, placement: mainline, evidence_refs: [R03, R08]}
  - {id: L18, title: "Explain component contributions with the two-class-batch hybrid2 exception", priority: CORE, stage: S07, placement: mainline, evidence_refs: [R04, A01]}
  - {id: L19, title: "Interpret the confusion matrices as class-position bias patterns", priority: CORE, stage: S07, placement: mainline, evidence_refs: [R06]}
  - {id: L20, title: "Describe the memory-budget trend without inventing unreported curve points", priority: CORE, stage: S07, placement: mainline, evidence_refs: [R07]}
  - {id: L21, title: "Use NCM as a full-data diagnostic for exemplar approximation", priority: CORE, stage: S07, placement: mainline, evidence_refs: [R05, A02, OI02]}
  - {id: L22, title: "Keep the batch-training gap, raw-image privacy, and growing output weights visible", priority: CORE, stage: S07, placement: mainline, evidence_refs: [A03, C14, R08]}
  - {id: L23, title: "Trace one update from the saved state to the next prototype prediction", priority: CORE, stage: S08, placement: mainline, evidence_refs: [OI01, C09, C10, C13, C05]}

  - {id: SUP01, title: "Explain why normalized nearest-distance and maximum inner product agree", priority: SUPPORTING, stage: S03, placement: expandable, evidence_refs: [B02]}
  - {id: SUP02, title: "Show the integer quota formula and small class-count calculations", priority: SUPPORTING, stage: S03, placement: hover, evidence_refs: [C13]}
  - {id: SUP03, title: "Expose exact class-batch, backbone, exemplar-budget, and training-schedule details", priority: SUPPORTING, stage: S07, placement: expandable, evidence_refs: [R01, R02]}
  - {id: SUP04, title: "Reveal exact Table 1 values behind any newly authored comparison plot", priority: SUPPORTING, stage: S07, placement: expandable, evidence_refs: [R04, R05]}
  - {id: SUP05, title: "Explain the log(1+x) display transformation in Figure 3", priority: SUPPORTING, stage: S07, placement: hover, evidence_refs: [R06]}
  - {id: SUP06, title: "Expand the full equations for herding and the node-wise training loss", priority: SUPPORTING, stage: S06, placement: expandable, evidence_refs: [C07, C12]}

  - {id: REF01, title: "Full source equations, algorithms, and detailed derivations", priority: REFERENCE, stage: null, placement: Evidence details, evidence_refs: [C05, C07, C08, C09, C10, C11, C12, C13]}
  - {id: REF02, title: "Complete experiment schedules and all reported Table 1 values", priority: REFERENCE, stage: null, placement: Evidence details, evidence_refs: [R01, R02, R04, R05]}
  - {id: REF03, title: "Source figure locators, captions, and rights decision for Figures 2–8", priority: REFERENCE, stage: null, placement: Reference Hub, evidence_refs: [R03, R06, R07, OI03]}
  - {id: REF04, title: "Task-incremental terminology and normalized-vector background", priority: REFERENCE, stage: null, placement: Advanced details, evidence_refs: [B01, B02]}

  - {id: D01, title: "Claim that the sigmoid training head argmax is iCaRL's final prediction", priority: DELETE, stage: null, placement: none, evidence_refs: [C05, C06]}
  - {id: D02, title: "Claim that the exemplar memory stores stale feature vectors instead of images", priority: DELETE, stage: null, placement: none, evidence_refs: [C04]}
  - {id: D03, title: "Claim that herding independently sorts examples by distance to the class mean", priority: DELETE, stage: null, placement: none, evidence_refs: [C07]}
  - {id: D04, title: "Claim that old classes can be re-herded from their unavailable full datasets", priority: DELETE, stage: null, placement: none, evidence_refs: [C08]}
  - {id: D05, title: "Claim that new images receive no old-node targets or that q is an old ground-truth label", priority: DELETE, stage: null, placement: none, evidence_refs: [C10, C11]}
  - {id: D06, title: "Claim that independent sigmoid responses form a softmax distribution summing to one", priority: DELETE, stage: null, placement: none, evidence_refs: [C03, C12]}
  - {id: D07, title: "Claim that each component improves accuracy in every class-batch setting", priority: DELETE, stage: null, placement: none, evidence_refs: [R04, A01]}
  - {id: D08, title: "Present NCM as a memory-matched incremental baseline", priority: DELETE, stage: null, placement: none, evidence_refs: [R05, OI02]}
  - {id: D09, title: "Claim that total model memory is strictly constant because K is fixed", priority: DELETE, stage: null, placement: none, evidence_refs: [C14]}
  - {id: D10, title: "Generalize these image-classification results to untested datasets or modalities", priority: DELETE, stage: null, placement: none, evidence_refs: [R01, R02]}
  - {id: D11, title: "Invent exact Figure 2 or Figure 4 curve values from visual inspection", priority: DELETE, stage: null, placement: none, evidence_refs: [R03, R07]}
  - {id: D12, title: "Embed or crop source figures before reuse rights are documented", priority: DELETE, stage: null, placement: none, evidence_refs: [OI03]}
  - {id: D13, title: "Describe training and prediction as two separate models", priority: DELETE, stage: null, placement: none, evidence_refs: [C03, C06]}
```

## Reader's Causal Path

Start with the setting, not with iCaRL's solution: new classes arrive over time, old classes remain in the decision space, and full history cannot stay in memory. That makes both naive choices understandable and shows why the problem has several simultaneous constraints. Page 2 then opens the model just enough to establish the shared feature extractor and training head without prematurely teaching the final classifier.

Pages 3–4 turn the all-class prediction requirement into a concrete rule: compare a query feature with class means. The need to recompute those means after representation changes exposes the missing-data problem, which motivates keeping raw exemplars. Their two jobs—rehearsal and prototype construction—explain why the memory is persistent state. Page 5 answers the next question: how to order examples so later budget reductions preserve a representative prefix.

Page 6 prepares the update before any parameters change: combine incoming full data with old exemplars, then obtain old-node responses from the pre-update model on that whole set. Page 7 assigns targets by output-node age and updates the shared representation. Page 8 closes the structure: the head remains part of the training network, but final prediction recomputes exemplar prototypes and does not read the head argmax or temporary Q.

Page 9 tests the mechanism against the paper's actual protocols, including the hybrid2 exception, the qualitative confusion patterns, memory trends, and the full-data NCM boundary. It displays original Figures 2–4 as `PaperFigure` evidence, as directed by the user and the global visual specification; the tutorial must not imply that exact curve values were reconstructed from the images. Page 10 then runs one compact end-to-end trace using the already established objects and their lifetimes. It is an integration check, not another full explanation of herding, loss, or prototype geometry.

## Ordering and Content Boundaries

- Page 1 establishes the constraints and failure modes but does not reveal the complete iCaRL mechanism.
- Page 2 introduces the network roles; prototype inference is established on Page 3.
- Page 3 motivates retained examples; Page 4 defines their storage and dual roles; Page 5 alone explains herding order and reduction.
- Page 6 creates the combined update set and snapshots old responses before training. Page 7 then explains target assignment and loss.
- Page 8 distinguishes the current network's training and prediction paths without deleting the head or treating them as two models.
- Page 9 uses reported evidence and protocol-qualified claims. The exact Table 1 values may support newly authored plots; no unreported Figure 2/4 curve values may be inferred.
- Page 10 follows the source update order: build D, snapshot Q, update Θ, compute the per-class quota, reduce old lists, construct new lists, then recompute prototypes for inference. Teaching-state motion must be identified as illustrative unless it is calculated from the tutorial's explicit toy model.
- Detailed CNN blocks, optimizer schedules, full equations, supplementary 1,000-class confusion matrices, and source figure locators stay in compact details or the Reference Hub.

## Human Review

The human review questions below are retained for the approval record in `paper.yaml`.

- Can a new reader state the problem and central idea from this order?
- Can the reader reconstruct the architecture and one full information/state flow?
- Is anything required to understand the main mechanism incorrectly placed in Reference?
- What correct but unnecessary content should be deleted?
