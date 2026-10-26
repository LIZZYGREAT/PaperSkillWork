# MiniNetworkGlyph · P1 candidate

Use one Glyph for one small layer/node topology. `layers` supplies stable IDs, labels and counts; `connections` supplies explicit displayed-node endpoints, or `connectAdjacent` opts into adjacent full connectivity. `focus` is caller-controlled and never changes geometry. `progress` is a rendering input in [0,1], not a clock. There is no Fisher, training, CNN or probability computation.

`showDetails` controls optional count/identity metadata, layer detail and the visible caption. Layer labels, the accessible SVG description and representative-node disclosure remain available. The caller owns model identity and explanation text.

## Copy one component

Use the exact dependency closure when only the drawing primitive is needed:

```sh
python tools/paper.py scaffold-kit <paper-id> --select MiniNetworkGlyph --allow-unapproved --dry-run
python tools/paper.py scaffold-kit <paper-id> --select MiniNetworkGlyph --allow-unapproved
```

This copies the Glyph, its own CSS and `kit.css`. It does not copy a scene layout or other visual parts.

## Copy the shared-input teaching example

The Gallery renders the same source files delivered by the complete `shared-input-models` example. It includes the local-connection focus and the shared-input, independent-model composition, with its separate layout CSS and the exact MiniNetworkGlyph, SampleToken, FlowConnector and SemanticMark dependency closure.

```sh
python tools/paper.py scaffold-kit <paper-id> --example shared-input-models --allow-unapproved --dry-run
python tools/paper.py scaffold-kit <paper-id> --example shared-input-models --allow-unapproved
```

Import `ParallelModelsExample` from `./shared/examples/shared-input-models` and import `./shared/foundation/styles/kit.css` once at the app entry. The package README marks where to replace the input, layer labels/counts, model roles and output labels. Its Teacher/Student names and small topologies are teaching assumptions; the example does not contain an algorithm, loss or parameter update. Verify every role and relation against the target paper before reusing the scene.

The `--example` command is separate from `--select`: it copies a complete teaching composition and records its example ID in `KIT_SELECTION.json`. Use `--select` for component primitives and `--example` for packaged scenarios.
