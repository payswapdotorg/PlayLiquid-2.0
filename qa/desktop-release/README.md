# qa/desktop-release — packaged-app smoke tests, enforceable UX acceptance, launch evidence

Ported from the proven PlayLiquid reference implementation (work orders RW-003
packaged-app smoke, UX-003 enforceable UX acceptance, PLX-REL-001 cross-platform
installable delivery — the work-item specs live in the reference repository),
then **adapted to the unified shell** (TL handoff §2): this product deliberately
ships NO separate GameOS product shell — the application is the unified
PlayLiquid-branded ZCode workbench, and PlayLiquid Console is a **side-pane New
Tab entry**, not a Studio/Lab/Community workspace. The smoke battery therefore
drives the REAL golden path (welcome → auth skip → 3-step onboarding → workspace
composer → five-option New Tab launcher → PlayLiquid Console). Module manifest:
`src/module.ts` (`qa-desktop-release`). The **Windows harness** (below) verifies
the NSIS installer + portable zip at the process/file/registry level. Everything
product-specific (identity values, journey markers, viewports, timeouts) lives
in `src/harness/config.mjs` so the TL can re-run the same harness on the
re-branded artifact without code changes.

This harness tests the **PACKAGED Linux application** — the AppImage (and the
.deb, metadata-level) produced by the release workflow — never a dev server,
never repo-relative renderer files, never dev-only env vars. Evidence is
window-level: the real Electron app runs under **Xvfb**, is driven via the
**Chrome DevTools Protocol (CDP)**, and produces screenshots, console logs and
process transcripts at the mandated viewports plus **computed-geometry
assertions at three widths** (1280×800, the 480px minimum OS window, 390×844
emulated).

## Prerequisites

- **Node ≥ 22** (uses built-in `fetch` + `WebSocket`; zero npm dependencies —
  deliberately portable to a stock `ubuntu-latest` GitHub runner).
- **Xvfb** (`apt-get install -y xvfb`).
- Enough free RAM: the harness enforces a **≥ 600 MB MemAvailable gate** before
  every Electron launch (waits up to 20 min on constrained boxes).
- Enough free disk in `TMPDIR` when the AppImage must run via
  `--appimage-extract-and-run` (no FUSE host — e.g. containers; ~1 GB).

## Run on any Ubuntu machine

```bash
# 1. prerequisites (stock ubuntu-latest runner)
sudo apt-get update && sudo apt-get install -y xvfb
node --version   # >= 22

# 2. run against the packaged artifact (from the repo root)
node qa/desktop-release/scripts/run-smoke.mjs \
  --artifact /path/to/PlayLiquid-GameOS-1.0.0-linux-x86_64.AppImage \
  --deb /path/to/PlayLiquid-GameOS-1.0.0-linux-amd64.deb \
  --sums /path/to/SHA256SUMS \
  --out qa/desktop-release/evidence/release-<label>

# convenience wrapper doing exactly the above:
bash qa/desktop-release/scripts/run-ubuntu.sh /path/to/*.AppImage [/path/to/*.deb]
```

Optional `.deb` install-path verification (needs `sudo`, outside the harness):

```bash
sudo apt-get install -y ./PlayLiquid-GameOS-*.deb
node qa/desktop-release/scripts/run-smoke.mjs --artifact "$(command -v playliquid-gameos)" --deb ./PlayLiquid-GameOS-*.deb
```

Key options (all also settable via `QA_RELEASE_ARTIFACT` / `QA_RELEASE_DEB` /
`QA_RELEASE_SUMS`):

| option | meaning |
| --- | --- |
| `--artifact` | packaged executable: AppImage, or an installed binary path |
| `--deb` | `.deb` to inspect for packaging identity (no root needed) |
| `--sums` | `SHA256SUMS` file (auto-detected next to the artifact) |
| `--out` | evidence directory (default `evidence/run-<id>`) |
| `--cdp-port` | main-run CDP port, default **9333** (never 9222 — collides with resident stacks); the offline scenario uses `cdp-port + 1` |
| `--display` | Xvfb display, default `:89` (auto-falls back through `:80`-`:89`) |
| `--expected-title` | override the expected window title (default `PlayLiquid`) |
| `--baseline-expectations` | annotate expected baseline failures — a documented compatibility no-op in the unified-shell battery (the list is empty; see below) |
| `--skip-offline` | skip the dead-proxy offline scenario |

Exit code: `0` all checks pass (or only *annotated expected* failures with
`--baseline-expectations`); `1` any unexpected failure; `2` nothing ran; `3`
harness error. The JSON report always records the **raw observed status** of
every check — `--baseline-expectations` only adds an `expectedFailure` label
and excludes exactly those IDs from the exit-code calculation.

## What is checked

The **unified-shell journey** (TL handoff §2 — no separate GameOS workspace;
Console is a side-pane tab) drives the packaged app through the same controls a
first-run user touches. Every journey step polls generously (~60 s per stage;
fresh onboarding legitimately takes ~20 s) and records honest evidence.

| id | check |
| --- | --- |
| `artifact-checksum` | artifact sha256 vs `SHA256SUMS` |
| `startup` | packaged app starts under Xvfb (CDP endpoint + main window target + settled DOM) |
| `packaged-independence` | main window loads `file://` (packaged renderer); no dev env vars in the child environment; launched from a neutral cwd |
| `window-title-captured` | the actual window/document title, recorded |
| `product-identity-title` | title carries the PlayLiquid identity (`document.title` is `PlayLiquid`) |
| `no-zcode-primary-branding` | ZCode is not the primary UI identity — title, headings and app headers carry NO ZCode text |
| `journey-welcome-branding` | boot reaches the PlayLiquid welcome/login gate: `document.title` `PlayLiquid`, "Welcome to PlayLiquid", "Connect your account to start using PlayLiquid" and the "Use API key" entry visible |
| `journey-auth-skip` | "Use API key" opens the credential dialog (Continue / Cancel / Skip for now); "Skip for now" advances past the welcome gate — no credentials invented, the welcome surface is honestly gone |
| `journey-onboarding-walk` | the 3-step first-run wizard advances ("What do you do?" → "Software / Data / AI" → Next; "Choose your UI mode" → "Coding mode" → Next; "Personalize your work assistant" → Skip) — completion proven by REACHING the workspace composer |
| `journey-workspace-composer` | the New Task workspace renders the composer placeholder ("Ask PlayLiquid anything, @ to add context, / for commands or capabilities"), the "Select project" trigger and the primary sidebar labels (New task / Automations / Plugin Marketplace; Tasks / Projects recorded, not required) |
| `journey-newtab-five-options` | `[data-testid=side-pane-toggle]` (aria-label "Expand side pane") expands the side pane; `[data-side-pane-add-tab-trigger]` opens the New Tab launcher; the five BUILT-IN entries are present in canonical order: `files`, `browser`, `terminal`, `review`, `playliquid-console` (optional `sites` / `developer-tools` rows recorded, never required) |
| `journey-console-opens` | clicking the `playliquid-console` launcher row opens the Console tab: header "PlayLiquid Console" (with the droplet), workbench text "World projects", live status "registry open" (badge "services live" recorded as evidence) |
| `clean-profile-startup` | app boots from empty HOME/XDG dirs and creates its own first-run state there |
| `viewports-evidence` | screenshots at 390×844 and 1280×800 (see honest note below) |
| `geometry-1280x800` | computed bounding boxes at the real 1280×800 OS window — every required workbench chrome control (the three window controls `[data-testid=window-control-*]`, the Settings control `[data-testid=task-settings-button]`, the side-pane toggle) present, visible, non-zero, pairwise NON-overlapping (the window-controls container excluded — it contains its controls), unclipped by the viewport, no horizontal overflow (document + container scrollWidth), labels not internally truncated |
| `geometry-480-window` | the same geometry contract at the ACTUAL 480px minimum OS window (`MIN_DESKTOP_WINDOW_WIDTH`, reached via `Browser.setWindowBounds` when available, `window.resizeTo` fallback) |
| `geometry-390x844-emulated` | the same geometry contract at the 390×844 emulated viewport (CDP `Emulation.setDeviceMetricsOverride`) |
| `a11y-keyboard-navigation` | Tab reaches the REAL chrome controls (window controls, Settings, side-pane toggle) within a bounded walk (max 40 tabs — never loops on nonexistent selectors); the observed focus order is recorded, not asserted against an invented expectation; **Enter activates**: Enter on the side-pane toggle expands the pane (the add-tab trigger becomes present), Enter on the `files` launcher row opens a real pane tab — driven via CDP `Input.dispatchKeyEvent` |
| `a11y-visible-focus` | keyboard-focused chrome controls (side-pane toggle, window control) render a visible focus indicator (computed outline/box-shadow, or any focused-vs-blurred style change) |
| `a11y-accessible-names` | every visible interactive element on the active surface has an accessible name (aria-label / aria-labelledby / text / title) |
| `packaging-identity` | desktop entry / .deb package metadata serves the PlayLiquid identity |
| `error-handling-offline-render` / `error-handling-offline-stability` | with all renderer network egress dead (`--proxy-server` to a closed port), the app still renders, stays alive and responsive — visible degradation, not breakage |
| `clean-shutdown` / `clean-shutdown-offline` | CDP `Browser.close` → exit code 0 within bounds, no orphan processes (both scenarios) |
| `console-evidence-recorded` | renderer console entries captured as evidence |

Every battery also runs under a **crash guard** (`journey-battery` /
`geometry-battery` / `a11y-battery`): a battery that crashes — e.g. the page
dying mid-run, the fatal `page: already closed` lesson from the pre-adaptation
CI run — is recorded as an honest failure and the run continues so the report
and evidence are still written.

### Checks deleted with the unified-shell adaptation

The reference repository's battery asserted a standalone "GameOS product shell"
(Studio/Lab/Community nav, `gameos-nav-*` testids) that this product
**deliberately does not have**. Those checks were deleted — never faked:

| deleted check | why |
| --- | --- |
| `workbench-escape-hatch-label` | asserted `[data-testid=gameos-nav-workbench]` ("AI & Agents" escape hatch) — no GameOS nav exists in the unified shell |
| `product-shell-renders`, `studio-surface` / `lab-surface` / `community-surface` | asserted the Studio/Lab/Community product shell as the default surface — the unified workbench replaces it |
| `product-navigation`, `studio-real-operation`, `lab-real-operation`, `community-real-operation`, `lab-command-outcome-visible`, `community-lifecycle-honest-gate` | drove Studio/Lab/Community surface operations that no longer exist; the journey battery now drives the REAL golden path instead |
| `first-run-empty-state`, `gameos-empty-state-contract` | asserted the GameOS first-run empty-state container — the real first-run state is the welcome gate + onboarding, which `journey-welcome-branding` / `journey-auth-skip` / `journey-onboarding-walk` now cover |
| `a11y-heading-hierarchy` | walked the Studio/Lab/Community surface headings (`studioHeading` / `labHeading` / `communityHeading` markers) that no longer exist |

## Windows smoke harness (PLX-REL-001)

The Windows side is a **separate, honest-scope harness** — it does NOT reuse the
Linux CDP battery (that battery is Xvfb- and Linux-specific); it verifies what
can genuinely be proven headlessly on a real Windows machine, at the
process/file/registry level:

```powershell
# from the repo root, on Windows (Node >= 22 + Windows PowerShell 5.1 present):
node qa/desktop-release/scripts/run-windows.mjs `
  --installer "release-out\PlayLiquid GameOS-<version>-win-x64.exe" `
  --portable-zip "release-out\PlayLiquid GameOS-<version>-win-x64.zip" `
  --sums "release-out\SHA256SUMS"
```

`scripts/run-windows.mjs` is the thin driver (mirrors `run-ubuntu.sh`'s shape);
`scripts/run-windows.ps1` is the harness (a UTF-8 BOM is deliberately stamped
on it so the Windows PowerShell 5.1 fallback parses it too — pwsh 7 is
preferred on GitHub runners). Environment alternatives:
`QA_RELEASE_INSTALLER`, `QA_RELEASE_PORTABLE_ZIP`, `QA_RELEASE_SUMS`. Evidence
lands in `evidence/windows-<stamp>/` (`report.json` + `transcript.txt`) with the
same exit-code semantics (0 pass / 1 unexpected failure / 2 nothing ran / 3
harness error) and the same always-raw-status discipline.

| id | check |
| --- | --- |
| `artifact-checksum-installer` / `artifact-checksum-portable-zip` | sha256 vs `SHA256SUMS` (skipped+recorded if no sums file) |
| `portable-zip-structure` | portable zip payload: `PlayLiquid GameOS.exe` + packaged `.zcode-install-manifest` present |
| `portable-zip-launch` | the PORTABLE app launches and stays alive 20+ s (flags `--disable-gpu`, neutral cwd) |
| `clean-install` | NSIS silent install (`/S`, per-user) exits 0 |
| `install-dir-exe` | installed exe exists (install location resolved from the HKCU uninstall entry) |
| `install-manifest-present` | the packaged `.zcode-install-manifest` was installed (full-payload evidence) |
| `uninstall-registry-identity` | HKCU uninstall entry: DisplayName/Publisher/DisplayVersion/InstallLocation recorded |
| `start-menu-shortcut` | Start Menu shortcut present |
| `desktop-shortcut` | desktop shortcut — recorded observation (silent-install default checkbox state cannot be confirmed headlessly) |
| `launch-installed-alive` / `launch-installed-exe-path` | the INSTALLED app launches and the running process IS the installed product exe |
| `product-identity-window-title` | the main window title carries the PlayLiquid identity |
| `user-data-dir-created` | `%APPDATA%\PlayLiquid GameOS` created on launch (product data root observed alongside) |
| `data-retention-marker` | a retention marker is written into the app data dir |
| `reinstall-over-existing` / `reinstall-app-present` | installer re-run over the existing install (the honest same-version approximation of an upgrade) keeps the app present |
| `data-retention-across-reinstall` | user data (marker) retained across the reinstall |
| `relaunch-after-reinstall` | the app relaunches after the reinstall |
| `uninstall-silent` / `uninstall-shortcut-removed` / `uninstall-registry-removed` | silent uninstall removes app files, Start Menu shortcut and the registry entry |
| `user-data-retained-after-uninstall` | user data RETAINED after uninstall (electron-builder NSIS default) |

**Honest scope (recorded in every report's `scope` block):** no synthetic GUI
interactions are driven (process/file/registry evidence only); the
"upgrade" check is a same-version reinstall — a true cross-version upgrade
needs two different builds and is NOT claimed; no code-signing/SmartScreen
verification (the installer is unsigned; a silent `/S` install never exercises
the SmartScreen UI); no auto-update verification (auto-update is disabled by
product policy — `packages/desktop/scripts/desktop-product-identity.mjs`,
`remoteUpdateFeedEnabled: false`). The app is always launched with
`--disable-gpu` from a NEUTRAL working directory (never the repository
checkout — see the neutral-cwd discipline note below; the packaged app's
agent-runtime resolution is cwd-sensitive).

## Evidence layout

```
evidence/<run>/
  report.json         machine-readable results (raw statuses + counts + env + evidence file index)
  transcript.txt      human-readable run transcript
  screenshots/       viewport-1280x800-window.png (real resized OS window),
                      viewport-1280x800-emulated.png, viewport-390x844-clamp-attempt.png,
                      viewport-390x844-emulated.png, geometry-1280x800.png,
                      geometry-480px-window.png (the real 480px minimum OS window),
                      geometry-390x844-emulated.png, offline-dead-proxy-window.png
  logs/               app-main-stdout.log, app-offline-stdout.log, console-*.json,
                      cdp-targets-main.json, xvfb.log, harness.log
```

Evidence directories are run outputs (git-ignored here); the reference
repository's committed baseline evidence was produced on its own station and
is deliberately NOT ported — every claim in this repository must come from a
run against OUR artifacts.

## Honest scope & limitations

- **AppImage launch mode**: without FUSE the harness launches with
  `--appimage-extract-and-run` (recorded per-run in `report.json`). On Ubuntu
  with FUSE the AppImage runs directly — the harness auto-detects `/dev/fuse`.
- **CDP switch**: the only non-user launch flag is Chromium's standard
  `--remote-debugging-port` (evidence channel). The offline scenario adds
  `--proxy-server` (standard Chromium switch) — recorded in the report notes.
- **Neutral-cwd discipline (observed artifact behavior)**: the current
  packaged app resolves its agent runtime with a `findUpward(...)` chain
  anchored at the process cwd — launched from inside a ZCode/PlayLiquid repo
  checkout it binds the repo's dev agent (tsx + `src/main.ts`) instead of the
  bundled `resources/glm/zcode.cjs` runtime, and its first-run storage
  preparation then fails ("Startup preparation failed" screen). The harness
  therefore always launches the packaged app with cwd = the clean-profile
  HOME, exactly like a real desktop user (whose cwd is never a repo). The
  observation is recorded per-run in the report notes; whether the upstream
  cwd-sensitivity itself should be fixed is a TL decision, not a harness one.
- **390×844 viewport**: the desktop main window enforces `minWidth: 480`
  (`packages/desktop/src/main/desktopWindowSize.ts`), so a 390-px OS window is
  clamped by product design; the 390×844 viewport is captured via CDP device
  metrics emulation (the DevTools device-mode equivalent) and the clamped
  real-window attempt is recorded alongside. 1280×800 is captured as a REAL
  resized OS window (`window.resizeTo`, honored by Electron for its own
  windows; under Xvfb there is no WM decoration so outer == inner). If a host
  ever refuses the real window resize, the check falls back to the emulated
  capture and says so.
- **Offline scope**: the dead proxy makes *renderer-side* network egress fail
  (the app's in-process host services are unaffected). This is the honest
  window-level simulation of an unavailable external service without app
  cooperation.
- **Geometry scope (what a virtual display can and cannot assert)**:
  the geometry checks measure COMPUTED boxes (`getBoundingClientRect`) at a
  real resized OS window (1280×800 and the 480px minimum) and the 390×844
  CDP device-metrics emulation — they assert the layout contract (no overlap,
  no clipping, no overflow, reachable navigation), which is exactly what a
  headless run can prove. What it cannot prove: real compositor/WM behavior
  (decorations, resize animations, HiDPI mixing), real GPU rasterization and
  the exact font metrics of other hosts. The 480px window is reached via
  `Browser.setWindowBounds` where the runtime implements it, with
  `window.resizeTo` as the recorded fallback (under Xvfb there is no WM, so
  outer == inner size).
- **Keyboard scope**: keys are dispatched through CDP
  (`Input.dispatchKeyEvent` — full `keyDown`/`keyUp`; Enter carries `text
  "\r"` because CDP treats a textless keyDown as rawKeyDown and Chromium's
  button activation for Enter only fires on a non-raw keydown). `:focus-visible`
  is matched under keyboard focus per the browser's own heuristic; the pass
  criterion is the COMPUTED indicator, not the pseudo-class alone.
- **Baseline honesty (unified-shell adaptation)**: the marker vocabulary now
  describes the REAL shipped product (transformation main), so the smoke
  battery asserts behavior that already exists in the packaged artifact and
  `BASELINE_EXPECTED_FAILURES` in `src/harness/config.mjs` is **EMPTY** — the
  `--baseline-expectations` flag remains functional (it annotates exactly the
  ids listed there and excludes only those from the exit-code calculation) but
  is a documented compatibility no-op. The historical pre-A/B baseline
  expectations (`no-zcode-primary-branding`, the GameOS shell contract checks,
  the 480px/390px overflow defect) were resolved by the transformation or
  deleted with the checks themselves (see "Checks deleted with the
  unified-shell adaptation" above).

Memory discipline: the harness never uses broad `pkill` — it kills only the
process groups it started (tracked PIDs + a per-run unique token), runs one
Electron instance at a time, and gates each launch on ≥ 600 MB available.
