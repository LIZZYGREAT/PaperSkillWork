---
name: enhanced-implementation
description: Build an accepted first vertical slice, pause for a human learning review, then finish the tutorial under Workflow v3 stages W6–W8.
---

# Tutorial Implementation — W6 to W8

## Purpose

Implement the reviewed learning spine as an inspectable mental model. Optimize for understanding and traceable evidence, not interaction count.

## Required Inputs

- `research/paper-model.md`
- `research/evidence-registry.yaml`
- `design/learning-spine.md`
- `design/asset-plan.md`
- `design/implementation-plan.md`
- `web/enhanced/implementation-manifest.json`
- The existing paper project, when iterating

## W6: First Vertical Slice

For rendered UI, follow `docs/VISUAL_QA.md`. Capture and inspect actual Chromium screenshots at the planned states and viewports; check geometry, visual balance, and any protected design baseline. For multi-step animation, inspect meaningful intermediate states as well as the final state. Do not mark a check PASS if its screenshot or browser state was not inspected; record NOT_RUN with the reason. After reading the report, inspecting screenshots, and recording the concise command/status/findings in the existing implementation plan, clean only that run with `node tools/visual-qa/cli.mjs --cleanup-run <exact-run-directory>`. Keep failure evidence until diagnosis and any required retest are complete; if evidence must be handed off, retain only the necessary files and state their exact path. Remove only this task's own Playwright `test-results/` or `playwright-report/` after review, and stop only a preview service started by this task. Search `docs/ui-teaching-lessons.md` by matching symptom only when a historical case may help; do not read the entire case file by default.

Before W6 edits, use the accepted W5 plan to identify the slice, approved design invariants, allowed local changes, and shared areas that may be affected. Do not treat the first-slice implementation as permission to redesign unreviewed stages.

1. Confirm W0–W5 are complete. W2 and W4 must have human review records; W0, W1, W3, and W5 are automatic after their checks pass.
2. Resolve the source with `python tools/paper.py paths <paper-id> --json` and use its absolute `publish_source` field. The shared resolver selects configured Final, otherwise Enhanced; if configured Final is missing, stop with the reported error rather than falling back. Do not hardcode `web/enhanced` or `web/final`, and do not use `release-info` for a source path because it also reads contributor metadata. The initial project scaffold already contains the required React/Vite entrypoints, styles, tutorial data module, registry, and lockfile. Preserve the custom React runtime; do not create a second runtime or empty compatibility stubs.
3. Implement only the slice named in the plan: a learner must be able to experience the planned problem → needed mechanism → key operation → conclusion → next-question loop (normally 2–3 spine stages, but use the reviewed scope). Put real metadata for implemented content in `src/data/tutorial.ts`; unimplemented chapters may be planned but are not completed content. Register a `componentId` only when it maps to the actual component.
4. Update `implementation-manifest.json` for each implemented slice CORE item with its planned stage, component, and `status: complete`.
5. Distinguish paper facts, real experimental data, synthetic teaching data, and implementation mappings. Where a reader could mistake an example for paper data, or a simplification changes their understanding of the paper's computation or applicability, add a concise note beside that material. Obvious demonstrations that cannot reasonably be confused need no repeated disclaimer; never invent results or weaken evidence boundaries.
6. Install dependencies, build the slice, and perform the minimal browser check on the actual configured source. Do not run or save a separate structure report; the scaffold supplies the standard source paths, and the slice contains only real implemented teaching content.
7. Once the slice starts and builds, resolve the absolute `publish_source` from `paths --json`, install that source project's dependencies using its lockfile, and directly run the adjacent PaperSkill checkout's official `paper-skill/scripts/syntax-check.js <source> --require-parser` and `paper-skill/scripts/validate-output.js <source>`. `--require-parser` must fail if a real TypeScript/esbuild parser is unavailable; do not accept an auto-skip. Do not copy the checker or add a runner. Verify the checkout and exact script contents against current official `upstream/main` as described below, and record both SHAs, Node/tool versions, commands, exit codes, and evidence. A stale/mismatched/unverifiable checker means the current-upstream `UPSTREAM_SYNTAX` and `UPSTREAM_OUTPUT` results are NOT_RUN (a local diagnostic execution may be described separately, but is not an official-current pass). Interpret warnings without inventing future chapters, placeholder content, or fake registrations. A real partial slice may warn about unimplemented pages; explain that warning and keep the real slice sparse. If a source, dependency, parser, or current official checker is unavailable, set the affected individual status to NOT_RUN with the reason; do not add a combined source-check status. Do not run Import, repository Validate, or Preflight.
8. Stop when the slice is usable. Do not implement or count the remaining spine yet.

The W6 CLI gate checks the configured release source's required entrypoints and that every `vertical_slice.required_core_items` entry is complete in the manifest. It does not install dependencies, build, run a browser, or run upstream source checks. Separately run the applicable install/build and slice interaction/browser checks plus the two official source checkers. In the existing implementation-plan W6 history, record only the four statuses `UPSTREAM_SYNTAX`, `UPSTREAM_OUTPUT`, `SOURCE_BUILD`, and `SUBPATH_ASSETS` (as applicable) using PASS / FAIL / NOT_RUN, plus actual commands, exit codes, current checker SHA/tool versions, validator warnings, browser states/viewports, evidence, and NOT_RUN reasons. A real partial slice may produce warnings for pages not yet implemented; explain them and never manufacture content to silence them. Do not describe W6 quality QA as passed if a required check was skipped. No reviewer fields are used for W6, and no separate report is created.

### Confirm the current official checker revision

Use the adjacent PaperSkill checkout only; do not clone, switch branches, reset, or overwrite it. A fetch updates Git references but not files, and is attempted only after confirming the checkout is clean and its `upstream` fetch URL is the official ReductTech repository. For a PowerShell session from PaperSkillWork root:

```powershell
$PaperSkill = (Resolve-Path ..\PaperSkill).Path
git -C $PaperSkill remote -v
git -C $PaperSkill status --short --branch
$UpstreamUrlOutput = git -C $PaperSkill remote get-url upstream 2>$null
$RemoteExit = $LASTEXITCODE
$UpstreamUrl = if ($RemoteExit -eq 0) { ($UpstreamUrlOutput -join '').Trim() } else { '' }
$OfficialUrls = @('git@github.com:ReductTech/PaperSkill.git', 'https://github.com/ReductTech/PaperSkill.git')
$HeadBefore = (git -C $PaperSkill rev-parse HEAD).Trim()
$HeadExit = $LASTEXITCODE
$Dirty = git -C $PaperSkill status --porcelain
$StatusExit = $LASTEXITCODE
$Scripts = @('paper-skill/scripts/syntax-check.js', 'paper-skill/scripts/validate-output.js')
$LocalScriptsPresent = $true
foreach ($Script in $Scripts) {
    if (!(Test-Path (Join-Path $PaperSkill $Script))) { $LocalScriptsPresent = $false }
}
if ($UpstreamUrl -notin $OfficialUrls -or $RemoteExit -ne 0 -or $HeadExit -ne 0 -or $StatusExit -ne 0 -or $Dirty -or !$LocalScriptsPresent) {
    Write-Warning 'Current official checker revision NOT_RUN: verify the remote and clean working tree first.'
} else {
    git -C $PaperSkill fetch upstream main
    if ($LASTEXITCODE -ne 0) {
        Write-Warning 'Current official checker revision NOT_RUN: record the fetch/network error; do not reuse a cached SHA as current.'
    } else {
        $HeadSha = (git -C $PaperSkill rev-parse HEAD).Trim()
        $HeadExit = $LASTEXITCODE
        $MainSha = (git -C $PaperSkill rev-parse upstream/main).Trim()
        $MainExit = $LASTEXITCODE
        $Present = $LocalScriptsPresent -and $HeadExit -eq 0 -and $MainExit -eq 0 -and $HeadSha -eq $HeadBefore
        foreach ($Script in $Scripts) {
            git -C $PaperSkill cat-file -e "upstream/main:$Script" 2>$null
            if ($LASTEXITCODE -ne 0) { $Present = $false }
        }
        git -C $PaperSkill diff --quiet upstream/main -- $Scripts
        $ScriptsMatch = $LASTEXITCODE -eq 0
        if (!$Present -or !$ScriptsMatch) {
            Write-Warning 'Current official compatibility NOT_RUN: local checker files are missing or differ from upstream/main.'
        } else {
            "HEAD=$HeadSha upstream/main=$MainSha; both checker files match upstream/main"
        }
    }
}
```

If the checkout is on a personal branch, the exact files that will be executed still must match the successfully fetched `upstream/main` scripts. A mismatch, dirty checker file, absent script, or failed/unavailable fetch means the current-upstream `UPSTREAM_SYNTAX` and `UPSTREAM_OUTPUT` statuses are NOT_RUN; an older SHA may be noted only as the local diagnostic revision. Record the actual fetch error, HEAD/SHA (if known), `node --version`, file comparison, commands, exit codes, and evidence in the existing implementation plan/final-check. Never checkout/reset to force a match.

## W7: Human Learning Review

Present the slice for a person to judge why the mechanism is introduced, whether the key operation can be explained accurately, whether prose and graphics jointly support the conclusion, whether the next step follows naturally, and also the emphasis, prose load, necessary math, and value of each interaction. Record the decision and required edits in `design/implementation-plan.md`. Complete W7 with `--reviewed-by` and `--note` only after a person records PASS. On REVISE, retain the decision and record feedback, scope, and approved content to preserve; repair the slice, rerun the W6-scope build/interaction/visual checks, and ask a person to review it again. This does not repeat `stage ... W6 complete` and does not reset W4/W5 in `paper.yaml`. If W4's core order or reasoning must change, first obtain the user's explicit reconfirmation and record the original decision, revision, and affected stages in the existing plan. Only a subsequent human PASS may complete W7. If W8/W9 work later reveals an upstream design change, record the impact and review scope, obtain the applicable human reconfirmation, and revisit affected W7/W9 learning acceptance; do not manually rewrite accepted workflow states. Do not require the unimplemented final integration scene to pass W7; inspect it during W8 and reserve formal learning acceptance for W9.

## W8: Full Implementation

After each page or complete interaction, inspect its relevant states. When a shared style or component changes, expand regression to affected pages and overlays. Preserve confirmed design invariants; pause for the user's decision if implementation would change an approved semantic or structural choice.

Before editing, follow the task route in `AGENTS.md` and read the project's `design/implementation-plan.md`. Read the applicable teaching, evidence, and browser QA rules for the change; do not reload the full workflow or unrelated standards when their route points to a focused section. Record the protected invariants, allowed local changes, and shared/adjacent areas at risk in the existing plan. Fix ordinary defects within that scope; ask for a decision before changing approved diagram meaning, state order, primary workspace layout, or main animation. After editing, inspect the actual diff and affected browser states; do not rely on a self-report that the approved design was preserved.

For a complex mechanism or complete-algorithm integration scene, complexity is not itself a defect. Use the amount of state, motion, spatial precision, explanation, and viewpoint change required by the W4 learning task and W5 semantic contract. Reject complexity that communicates no algorithm fact, but do not remove required objects or actions merely to make implementation simpler.

1. Implement all remaining CORE content on the accepted spine.
2. Keep SUPPORTING content compact; put REFERENCE material in the Reference Hub/advanced area; omit DELETE.
3. Copy any reusable source into this paper's project. Do not import a cross-paper runtime package.
4. Keep paper data separate from teaching demonstrations and distinguish paper state, computed/derived state, and teaching-only visible state. Derive key outputs, transitions, sample identities, and formula results from one project-level data/calculation model; text, graphics, formulas, and animation must read that same result rather than implementing an incompatible "animation algorithm." Where a simplification changes understanding of the algorithm or its applicability, explain it briefly near the affected material; where it creates no reasonable risk of confusion, avoid repetitive disclaimers.
5. Implement complex paths as independently verifiable state segments. Make the initial state and one real transition correct, assert their handoff, then add later segments through the final prediction/output. Important states must be reproducible, pausable, and inspectable. When continuous computation is part of the meaning, do not simulate it solely by replacing an entire static image.
6. Before any repair, compare the current code with confirmed W4/W5 content. A style fix must not delete causal prose, formula correspondence, key animation states, or approved visual relationships. Ask the user before changing established teaching logic or an accepted visual baseline.
7. Support keyboard/focus, reduced motion, mobile, touch, and non-drag operation where applicable.
8. Resolve the final publish source again with `python tools/paper.py paths <paper-id> --json` and its absolute `publish_source`; confirm it is the same source planned for W10. Ensure that source's dependencies are installed from its existing lockfile (`npm ci` when it has a package lock); the official syntax checker discovers TypeScript/esbuild under the target source, not in the PaperSkill repository. Directly run the adjacent PaperSkill checkout's official `paper-skill/scripts/syntax-check.js <source> --require-parser` and `paper-skill/scripts/validate-output.js <source>`. Do not copy or wrap these tools. Confirm the checkout is the intended current official main revision and record its commit/tool version; if the checker is stale/unverifiable, parser or source unavailable after setup, record NOT_RUN and the reason, and do not claim compatibility. Preserve and interpret validator warnings; never add fake content to satisfy a gate.
9. Run project tests, the actual production build (`npm run build` or the source project's declared equivalent), declared project audits, implementation coverage checks, and Visual QA against this source. Verify DOM/data invariants plus representative initial, intermediate, handoff, and final states and motion where applicable. Verify the configured Vite `base`, the `dist/index.html` referenced CSS/JS, images, fonts and dynamic assets, and browser network requests when served at the intended non-root deployment path; do not infer subpath compatibility from a root-path preview or scan stale, unreferenced hash files as if they were shipped. Record this independently as `SUBPATH_ASSETS`. After actual screenshot inspection and recording the result in the existing implementation plan, use the explicit single-run cleanup entry; retain needed failure evidence until diagnosis/retest is complete. For an intermediate fix, run the existing checks that cover the changed behavior when available.

After a W6/W8 feedback fix is verified, decide whether to add, merge, supersede, add regression coverage for, or leave out a public history case. Search existing active cases first. Project-specific decisions stay in that paper's implementation plan. Add a general case only when the root cause and correction have evidence; if not verified, report the observation for the current task without promoting it to policy. Do not create a separate experience report.

Update the implementation manifest for every CORE item and for each SUPPORTING/REFERENCE placement. The W8 CLI gate checks planned CORE coverage, lower-priority placements, and asset materialization/provenance. It does not run project tests, production builds, DOM assertions, browser Visual QA, or upstream checks. In the existing implementation plan, fill `UPSTREAM_SYNTAX`, `UPSTREAM_OUTPUT`, `SOURCE_BUILD`, and `SUBPATH_ASSETS` with PASS / FAIL / NOT_RUN, actual commands, checker revision/tool versions, evidence/log locations, and notes. Do not call the final source compatible or production-ready when a required check failed or remains NOT_RUN. Run all checks against the actual final publish source; after any later source change, rerun affected checks and review the changed browser states. If required QA was skipped, do not claim W8 quality acceptance passed. Use the existing implementation plan and Visual QA outputs; do not create another report. The user alone runs the sole official Import, repository Validate, and Preflight flow as W10 after accepting W9.

## Forbidden Actions

- Do not generate the complete site before the human learning review.
- Do not add controls, animation, or formula labs to satisfy a quota.
- Do not create a second calculation layer for animation or let teaching-visible state change paper/computed state semantics.
- Do not replace a required continuous computation with unrelated static swaps, nor reduce a verified complex scene solely because it is complex.
- Do not continue after a failed W7 review.
- Do not mark W7 complete without human approval. W6/W8 are automatic stages and complete only after their structural coverage checks pass.
- Do not satisfy structural coverage with empty files, placeholder chapters, unrelated modules, or fake registrations.
- Do not describe a build or Visual QA result as an official upstream validation result.
- Do not equate a W6/W8 CLI structural completion record with project quality QA.

## Completion Criteria

The tutorial follows the accepted spine, its learning and evidence boundaries are preserved, and human W7 acceptance is recorded before W8 completion.
