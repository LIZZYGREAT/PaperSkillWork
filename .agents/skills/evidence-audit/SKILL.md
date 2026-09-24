---
name: evidence-audit
description: Build a structured evidence registry for paper claims, results, mappings, and teaching material at Gate G2.
---

# Evidence Audit

## Purpose

Give every important tutorial claim a clear category, source, and limit.

## Required Inputs

- The source paper or explicitly supplied source
- `research/01_paper_model.md`
- `templates/evidence-registry.yaml`

## Preconditions

- Confirm the paper version and source locations.
- Preserve source/review conflicts; do not silently choose a version.

## Claim Categories

Use only:

- `PAPER_FACT`
- `PAPER_RESULT`
- `AUTHOR_INTERPRETATION`
- `OUR_INTERPRETATION`
- `IMPLEMENTATION_MAPPING`
- `TEACHING_TOY`
- `GENERAL_BACKGROUND`
- `FUTURE_WORK`

## Procedure

1. Audit architecture, mechanisms, equations, figures, benchmarks, results, conclusions, limitations, and future work.
2. Give each claim a stable ID, exact wording, category, source kind/location, and qualification as needed.
3. Keep implementation mappings and general background separate from paper statements; these may have no paper source, but must say so.
4. Tie every numeric result to dataset, model, split, metric, protocol, value, and source.
5. Distinguish what the paper states, what authors infer, and what we infer from the evidence.
6. Record conflicts, ambiguity, and unverified capabilities without resolving them by assumption.
7. Write `research/02_evidence_registry.yaml`. Add a short `02_evidence_notes.md` only for unresolved issues or review notes.

## Validation

- YAML parses and IDs are unique.
- Every high-impact claim has a category and source or an explicit non-paper source boundary.
- Every result has its applicable protocol metadata.
- A consumer can resolve the cited registry IDs.

## Forbidden Actions

- Do not conceal contradictions or upgrade evidence strength.
- Do not treat planned work as implemented or validated.
- Do not duplicate the Paper Model as a long prose audit.
- Do not advance G2 automatically.

## Completion Criteria

Save the registry and have a person review unresolved items before marking G2 complete.
