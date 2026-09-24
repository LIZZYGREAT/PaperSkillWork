# Workflow v2 Migration Report

Migration created v2 artifacts without deleting legacy research, design, Canonical, or Enhanced files.
The v1 paper configuration and release checklist are archived byte-for-byte. Canonical and Enhanced paths were left untouched. All v2 gates start as pending.

## Legacy gate states

- G0: pending
- G1: pending
- G2: pending
- G3: pending
- G4: pending
- G5: pending
- G6: pending
- G7: pending

## Detected legacy artifacts

- `paper.yaml` → `migration/legacy-paper-v1.yaml`
- `research/01_review.md` → `research/01_review.md`
- `research/02_evidence_audit.md` → `research/02_evidence_audit.md`
- `research/03_terms.md` → `research/03_terms.md`
- `web/canonical` → `web/canonical`
- `design/storyboard.md` → `design/storyboard.md`
- `design/interaction-plan.md` → `design/interaction-plan.md`
- `web/enhanced/package.json` → `web/enhanced/package.json`
- `audit/content-check.md` → `audit/content-check.md`
- `audit/release-check.md` → `audit/legacy/release-check-v1.md`

## Created v2 artifacts

- `design/learning-contract.md`
- `research/01_paper_model.md`
- `research/02_evidence_registry.yaml`
- `knowledge/terms.yaml`
- `design/learning-architecture.md`
- `audit/final-check.md`
- `audit/release-check.md`
- `audit/migration-v2.md`
- `migration/legacy-paper-v1.yaml`
- `audit/legacy/release-check-v1.md`

## Preserved existing paths

- `source/paper.url`

## Human review

No v2 gate was marked complete. The legacy release checklist and original paper.yaml remain archived for reference; semantic acceptance of the new artifacts is still required.
