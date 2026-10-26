# Trial B · grayscale patch calculation

This preserves the earlier independent calculation toy for traceability. It derives row means `[2, 6]`, whole-patch mean `4`, centered row means `[-2, 2]`, and their mean square `4` from `[[1, 3], [5, 7]]`.

The prior Agent correctly chose a local implementation: existing Kit parts could draw pixels or signed coordinates but could not express row-wise reduction and a shared global-mean reference. This trial demonstrates sound exclusion, not positive reuse. Its earlier 1440px browser state is retained at `../../evidence/matrix-reference-1440.png`; do not treat it as a Kit approval.
