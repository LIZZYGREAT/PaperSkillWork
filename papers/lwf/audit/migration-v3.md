# LwF Workflow v3 Migration

## Scope

The active LwF workspace now uses Workflow v3 and points to the standalone `web/final/` tutorial. Existing v1/v2 research, design, Canonical, Enhanced, and audit artifacts remain available at their original paths. Before replacing the active v2 configuration and final audit, their exact bytes were copied to:

- `migration/legacy-paper-v2.yaml` — SHA-256 `1882bd87c488ef0e55e30ecc3ae5dd9688d06e21fdf051c6d851faf1010b3737`.
- `migration/legacy-final-check-v2.md` — SHA-256 `5bb388dcd33b5d56784a813503c0b84f5e4ce590012297e071b04bac993476da`.

Each archived file was hash-compared with the v2 file before replacement; the hashes matched byte-for-byte.

## Artifact mapping

| Existing v1/v2 artifact | Active v3 artifact | Migration treatment |
| --- | --- | --- |
| `paper.yaml` | `paper.yaml` | Replaced with schema v3 source metadata and W0–W10 workflow. Prior bytes are archived above. |
| `source/paper.pdf`, `source/paper.url` | `source-cache/content.md`, `manifest.json`, `evidence.json` | Original source stays in place; a page-separated searchable extraction, visual inventory, and extraction notes were added. |
| `research/01_paper_model.md` and old review notes | `research/paper-model.md` | New v3 model uses the required sections and preserves the old documents as history. |
| `research/02_evidence_registry.yaml` | `research/evidence-registry.yaml` | Existing evidence IDs and boundaries are carried into v3 categories; the v2 registry remains untouched. |
| `design/learning-architecture.md`, `design/learning-contract.md` | `design/learning-spine.md` | New causal learning path and explicit content priority assignments. |
| Existing storyboard/interaction notes | `design/asset-plan.md`, `design/implementation-plan.md` | All source visuals are inventoried; public use remains unselected while reuse rights are unverified. The plan maps the implemented 00–07 tutorial. |
| `audit/final-check.md` | `audit/final-check.md` | Replaced by a v3 audit for the 00–07 standalone source. The former checklist is archived above. |
| `web/enhanced/` | `web/final/` | Enhanced remains intact as the working history; Final is the frozen, standalone release source. |

The earlier G0–G7 records were pending. They do not establish completion of any W-stage and were not carried forward as passes. The current source intake and cache are checked under W0 and W1; later stages retain their v3 meanings.

## Review state

- W0/W1 may be completed only by their source/cache checks.
- W2 (paper model), W4 (learning spine), W7 (vertical-slice learning review), and W9 (final human learning/evidence audit) require a human reviewer. They remain pending until an actual reviewer records a decision.
- W3/W5/W6/W8/W10 are not claimed complete by this migration. W10 also requires W9 and a real PaperSkill checkout for its preflight.
- No author, participant, pinyin release identifier, review decision, PR, or publication has been inferred or fabricated.

## Result

The v3 artifacts are a reviewable release candidate for the 00–07 tutorial. This migration preserves history and does not imply learning acceptance, an upstream preflight, or release readiness.
