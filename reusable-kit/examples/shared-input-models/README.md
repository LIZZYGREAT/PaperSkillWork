# Shared input, independent models

This delivery unit contains the same `LocalNetworkExample` and `ParallelModelsExample` source rendered in the Kit Gallery, its Recipe layout CSS, and the complete Kit dependency list. The examples use synthetic 3–5–3, 3–4–3 and 3–5–4–3 network shapes.

From the PaperSkillWork repository root, preview the exact source closure and target first:

```sh
python tools/paper.py scaffold-kit <paper-id> --example shared-input-models --allow-unapproved --dry-run
python tools/paper.py scaffold-kit <paper-id> --example shared-input-models --allow-unapproved
```

The command copies the package into `<resolved-publish-source>/src/shared/examples/shared-input-models/` and its Kit assets into `<resolved-publish-source>/src/shared/foundation/`. Import the complete composition from the paper's `src/App.tsx`:

```tsx
import './shared/foundation/styles/kit.css';
import { ParallelModelsExample } from './shared/examples/shared-input-models';

export function App() {
  return <main><ParallelModelsExample /></main>;
}
```

Replace `SampleMark` and the sample ID for the paper's input. Replace each model's labels, layer counts and output labels only after checking the paper's actual model roles and topology. The two branches must keep a shared input and independent model ownership. `density="compact"` is available for a tighter local composition; the default is `standard`. Do not carry over the names Teacher/Student, the toy node counts, a frozen/trainable interpretation, or any claim about losses and parameter updates unless the target paper supports it. The example does not encode a training algorithm.
