# iCaRL Interactive Paper Tutorial

This local Vite/React prototype implements the W6 vertical slice: Page 1 (class-incremental constraints), Page 2 (image-to-representation path), and Page 10 (one deterministic runtime update). Run `npm install`, then `npm run dev` from this directory.

## Figure sources

The original Figures 2, 3, and 4 are prepared as cropped, high-resolution source panels under `assets/figures/` for their planned evidence placement on Page 9. They are not shown on Pages 1, 2, or 10, which are the only pages in this W6 slice. The crops preserve the source plots/matrices and captions without redrawing or digitizing the plotted values.

Source: Sylvestre-Alvise Rebuffi, Alexander Kolesnikov, Georg Sperl, and Christoph H. Lampert, “iCaRL: Incremental Classifier and Representation Learning,” CVPR 2017, Figures 2–4, pp. 7–9; arXiv:1611.07725v2, https://arxiv.org/abs/1611.07725. Each crop corresponds to the source PDF page and figure identified in `papers/icarl/design/asset-plan.md`.

The user requested these figures for display in a private local educational prototype. This attribution does not assert a third-party redistribution license. Keep the source files and derivatives within this workspace unless reuse rights for a broader release are separately confirmed.

## Teaching-data boundary

Pages 2 and 10 use deterministic synthetic 2D teaching coordinates. Their geometry is a calculation carrier, not an iCaRL experiment, learned checkpoint, or reported paper result. The runtime derives quota, ordered exemplar selection, normalized means, prototypes, distances, and prediction from one shared calculation module.
