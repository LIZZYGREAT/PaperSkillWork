# Trial C · vector norm clipping

This is a new synthetic mechanism, separate from the Gallery scenes. It reuses `RepresentationVector` for the before/after gradient, `ResponseMeter` for the scale factor, and `FlowConnector` for the calculation sequence. The scene owns the inputs, norm and clipping calculations, interaction, equations, and CSS.

The arrows use `kind="data"`: they show arithmetic over an already-computed gradient value. They do not describe gradient backpropagation through a model. Initial values are `g = (3, 4)` and `c = 2`, giving `‖g‖₂ = 5`, `α = 0.4`, `g′ = (1.2, 1.6)`, and `‖g′‖₂ = 2`.

Run `python reusable-kit/validation/r4/preview.py --scene vector-clipping` from the repository root. Change either gradient component or the maximum length; the formula, meter and both vectors derive from one input state. The calculation keeps full numeric precision, while displayed values are rounded to at most two decimal places. The scale formula and its numeric substitution share one equation style and line spacing, with a line break separating them. The clipped-vector equation and norm bound use that same equation style.
