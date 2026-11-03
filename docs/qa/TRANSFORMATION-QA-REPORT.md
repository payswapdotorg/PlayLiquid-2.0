# Transformation QA Report — main 42b23514

**Date:** 2026-11-03 · Captured from the packaged `PlayLiquid-GameOS-Preview-3.17.2-linux-x86_64_TEST.AppImage`
(test-backend flavor, built from the transformation merge) running under Xvfb with a clean
profile, driven via CDP (port 9333) using the ported `qa/desktop-release` harness primitives.

## 1. Session facts

- Window title: **PlayLiquid** (CDP `document.title`).
- Data root created under the clean profile: `<home>/.playliquid-gameos/.zcode/workspace/default`
  — PlayLiquid data separation confirmed.
- Launch mode: `appimage-extract-and-run` (no FUSE in sandbox).
- Renderer console: no fatal errors during the golden path (see `evidence/console-report.json`).

## 2. Golden path (all steps verified, screenshots in evidence/)

1. **First run** — "Welcome to PlayLiquid", teal droplet ProductMark, navy surfaces
   (`01-first-run-1660x900.png`).
2. **Auth** — "Use API key" → dialog with Continue/Cancel/**Skip for now**; skipped honestly
   (no fake credentials).
3. **Onboarding** — Your work → UI mode → Preferences walked to completion, PlayLiquid copy
   (`02-onboarding.png`, `02c-onboarding-preferences.png`).
4. **New Task workspace** — "Select project" above composer, "Ask PlayLiquid anything, @ to add
   context, / for commands or capabilities", teal send, Automations + Plugin Marketplace +
   Task list in sidebar, honest "No model available. Upgrade or set a custom model." state
   (`03-newtask-workspace-1660x900.png`).
5. **New Tab launcher** — side pane expanded (`side-pane-toggle`), launcher opened
   (`data-side-pane-add-tab-trigger`); DOM rows read live:
   `files, browser, terminal, review, playliquid-console` — the five options in contract order
   (`04-newtab-five-options.png`, `evidence/newtab-launcher.json`).
6. **PlayLiquid Console** — opened via `data-side-pane-open-tab-item="playliquid-console"`:
   droplet + title + live status ("registry open · 0 records · community 0 contributions · no
   project registry composed"), "services live · projects not configured" badge, World Projects
   workbench with empty states + refresh actions — real services, honest states, no fake data
   (`05-playliquid-console.png`).
7. **Browser / Terminal / Files / Review** — each opened through the same launcher; original
   behavior, rethemed (`06`–`09`).
8. **Responsive QA** — New Tab at 1280×800, 480px narrow, 390×844 (`10`–`12`); no clipping of
   the launcher grid; five options fit without overcrowding.

## 3. Gate results (local)

| Gate | Result |
|---|---|
| oxlint | 0 errors (74 pre-existing warnings) |
| architecture:check (full + --changed) | 0 violations |
| db:schema:check + architecture tool tests | 51/51 |
| verify:pre-push (all steps) | pass (affected-tests: full-suite selection → skip per policy) |
| @playliquid/gameos tests | 677/677 |
| animatedSidePanePanelModel.test.ts | 4/4 |
| identity node --test | 12/12 |
| change-policy verifier | 71 modifications · 0 violations |
| desktop production build | pass |
| CI playliquid-governance @ 42b23514 | **success** |

## 4. Defects found & fixed during QA

- **Z watermark in draft hero** — found via vision-model inspection of screenshot 03; fixed by
  TL patch `a5adc388` (droplet watermark). Re-capture of 03/04 pending that rebuild (noted in
  handoff §4).
- Verifier self-test bugs (status-letter vocabulary, drift-vs-baseline filtering) found and
  fixed during the governance negative-test matrix — the gate is stronger for it.

## 5. Honest limitations

- No model/provider credentials were configured in the clean profile — model features were
  verified only to their honest unconfigured states.
- Full wdio E2E battery not run locally (sandbox memory/disk); see handoff §4.
- Windows installers verified by the CI workflow's own assertions + smoke battery (runner
  execution), not by a local Windows machine.
