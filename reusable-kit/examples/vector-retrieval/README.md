# Raw inner-product retrieval

This delivery unit contains the same interactive `RetrievalExample` source and its CSS rendered in the Kit Gallery, plus its complete Kit dependency list. The query and two candidate vectors are synthetic; the example recomputes raw inner products and selects their maximum. It has no classifier head or probability conversion.

From the PaperSkillWork repository root, preview and copy the complete unit:

```sh
python tools/paper.py scaffold-kit <paper-id> --example vector-retrieval --allow-unapproved --dry-run
python tools/paper.py scaffold-kit <paper-id> --example vector-retrieval --allow-unapproved
```

The command copies the source, stylesheet and this README into `<resolved-publish-source>/src/shared/examples/vector-retrieval/`, and copies the Kit assets into `<resolved-publish-source>/src/shared/foundation/`. Render it from `src/App.tsx`:

```tsx
import './shared/foundation/styles/kit.css';
import { RetrievalExample } from './shared/examples/vector-retrieval';

export function App() {
  return <main><RetrievalExample /></main>;
}
```

Replace `queries` with the paper's justified query representations, `candidates` with its compared objects and vector values, and the labels/description with verified source terminology. Keep the calculation tied to the paper's actual score definition. These toy vectors are not paper data; the ranking is retrieval, not classification.
