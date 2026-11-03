# PlayLiquid Transformation Handoff

**Date:** 2026-11-03 · **TL:** PlayLiquid transformation TL
**Repository:** `github.com/payswapdotorg/PlayLiquid-2.0`

---

## 1. SHAs and lineage

| Ref | SHA | What |
|---|---|---|
| ZCode upstream baseline | `a9fe401eede6e6e5e01be9048679c206fe6f02d9` | ZCode v3.17.2 — the preservation baseline (never rebased away) |
| Transformation base | `643630a12d8f107a8d12039da26a711cfbbbd6ed` | additions-only milestone-1 (domain-workspace host + integrity gate) |
| TL retirement | `4734443a` | milestone-1 host removed from the active application |
| TL governance | `05406185` | controlled-change policy replaces additions-only rule |
| worker-a | `fa04010e` | PlayLiquid theme + branding (8 commits) |
| worker-b | `eb2988c8` | @playliquid/gameos + PlayLiquid Console as 5th New Tab option (3 commits) |
| worker-c | `83eff130` | packaging identity, icons, release workflow + smoke harness (7 commits) |
| **main (transformation)** | **`42b23514`** | TL integration merge of all work packages |

Branches pushed: `tl/remove-domain-workspace-host`, `worker-a/theme-branding`,
`worker-b/newtab-console`, `worker-c/packaging-release`. Worker branches were merged as a
stacked sequence with no-ff merge commits; each work package is revertable via
`git revert -m 1 <merge-sha>`. (PRs were not opened retroactively — main already contained the
stack; the merge commits + branch refs + this document are the audit record.)

## 2. What changed (summary)

1. **Milestone-1 retired** (`docs/history/milestone-1-retirement.md`): the second-workspace
   switcher beside the Z logo, the full-screen domain `WebContentsView`, the slide-transition
   navigation state machine and the `NODE_OPTIONS --require` dev launcher were removed from the
   active tree. ZCode's original task-history arrows (`desktop-top-nav-back/forward`) were never
   touched.
2. **Controlled-change governance** (`docs/governance/CHANGE-POLICY.md` +
   `docs/governance/authorized-modifications.json` +
   `scripts/governance/verify-change-policy.mjs` + `.github/workflows/playliquid-governance.yml`):
   71 authorized baseline-file modifications across allowed surfaces, 0 policy violations,
   enforced in CI on every push/PR. Protected-surface changes require justification + TL approval.
3. **PlayLiquid theme** (`docs/product/PLAYLIQUID-THEME-MAP.md`): all four theme blocks
   (light/dark/zai-light/zai-dark) recolored to the PlayLiquid palette; secondary CSS; Inter
   font stack; ProductMark droplet replaces every Z-logo mount.
4. **PlayLiquid branding**: window title, splash, welcome/login, onboarding, app menu, tray,
   about dialog, i18n product strings (136 en + 135 zh values), READMEs, wordmark.
   Internal identifiers (`@zcode/*`, `window.zcode`, channels, env vars, storage keys) are
   deliberately retained for compatibility — see the theme map's retention table.
5. **PlayLiquid Console** (`docs/product/NEW-TAB-CONSOLE-CONTRACT.md`): fifth New Tab option;
   `@playliquid/gameos` package ports the reference repo's GameOS domain modules (677 tests);
   real in-process services (package registry, CommunityService, release gates) with honest
   not-configured states; zero duplicate infrastructure.
6. **Packaging identity + release pipeline** (`docs/product/INSTALL-AND-RELEASE-CONTRACT.md`):
   `org.playliquid.gameos` / PlayLiquid GameOS / `playliquid://` / `~/.playliquid-gameos` /
   update-feed disabled; full PlayLiquid icon family; `release-desktop.yml` builds Linux
   (.deb + AppImage) and Windows (NSIS .exe + portable .zip) from exact SHAs with SHA256SUMS +
   BUILD-INFO.txt into immutable `preview/<sha>` prereleases.

## 3. Verification performed (TL, locally)

| Gate | Result |
|---|---|
| `pnpm lint` (oxlint) | 0 errors (74 pre-existing warnings) |
| `pnpm architecture:check` (full + `--changed` vs origin/main) | 0 violations |
| `pnpm db:schema:check` + architecture tool tests | 51 pass / 0 fail |
| `pnpm verify:pre-push` | all steps pass (affected-tests selected full suite → skipped per upstream policy) |
| `@playliquid/gameos` domain tests | 677/677 |
| `packages/ui` resolver test | 4/4 (five-option order asserted) |
| Desktop production build (`ZCODE_BUILD_SOURCEMAPS=0`) | ✓ |
| `node --test` identity suite | 12/12 |
| Change-policy verifier | 71 modifications, 0 violations (tested matrix incl. unauthorized/protected/retired-path cases) |
| Packaged AppImage boot under Xvfb + CDP | ✓ title "PlayLiquid", data root `~/.playliquid-gameos` |
| Golden path: auth skip → onboarding → workspace → New Tab (5 options) → Console/Browser/Terminal/Files/Review | ✓ all, with screenshots |
| Visual QA viewports | 1660×900, 1280×800, 480px, 390×844 captured |

Full evidence: `docs/qa/` (screenshots, launcher DOM JSON, console report, capture log) and the
review dashboard (sandbox Next.js app) which renders the same evidence live.

## 4. Known follow-ups (honest frontier)

1. **Full wdio E2E battery** (650 specs) has not been run locally — the sandbox cannot sustain
   the full suite (memory/disk). The regression surface for this milestone was covered by the
   gates above + the golden-path session; the E2E battery belongs to the CI milestone on
   permanent runners.
2. **Windows build** executes on `windows-latest` in `release-desktop.yml` — verified by the
   workflow's own assertions + smoke battery, not by a local Windows machine.
3. **Model settings with a live provider** were exercised only as far as the honest
   "No model available → Upgrade/Set" state (no credentials were configured in the sandbox
   profile). Provider settings UI remains reachable and is covered by inherited tests.
4. Second-pass branding surfaces reported by Worker A but outside its write surface
   (web-auth copy, share-landing copy, share-card SVG watermark, office suggested prompts)
   are queued for the next branding pass.
5. The draft empty-state hero watermark was re-branded post-merge (TL patch `a5adc388`);
   screenshots taken before that patch show the old Z watermark — re-capture queued.

## 5. Where everything lives

- Governance: `docs/governance/` · verifier: `scripts/governance/verify-change-policy.mjs`
- Product contracts: `docs/product/` (theme map, preservation matrix, new-tab contract, install/release contract)
- QA evidence: `docs/qa/` · history: `docs/history/milestone-1-retirement.md`
- Identity source of truth: `packages/desktop/scripts/desktop-product-identity.mjs`
- Console package: `packages/playliquid-gameos/` (see its `CONTRACT.md`)
- Release pipeline: `.github/workflows/release-desktop.yml` + `qa/desktop-release/`
- Review dashboard (sandbox): Next.js app serving the screenshots, live CI/release status and
  installer downloads.
