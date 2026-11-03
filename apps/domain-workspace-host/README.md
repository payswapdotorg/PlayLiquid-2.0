# PlayLiquid — Domain Workspace Host

An **additive host layer** that gives the unmodified [ZCode](https://github.com/zai-org/ZCode)
desktop application a second, independent workspace — without editing a single
upstream file.

```
fork = upstream ZCode (byte-for-byte) + apps/domain-workspace-host/ (+ docs/)
```

## What it does

Inside the same application window:

- the **general workspace** is the untouched upstream ZCode workbench — its
  webContents is never destroyed, reloaded, or resized;
- the **domain workspace** is a host-owned `WebContentsView` that slides in
  from the right (≈250 ms, ease-out cubic, reversible mid-flight) and parks
  offscreen when hidden;
- a **switcher cluster** (« » double chevrons, 64×32) sits in the structurally
  empty top-left titlebar band — beside the Z logo, after the upstream
  task-history arrows, visually distinct from them by design.

## How it attaches (zero upstream edits)

| Step | Mechanism |
|---|---|
| Inject | `NODE_OPTIONS="--require …/src/bootstrap.cjs"` — the upstream dev pipeline forwards `…process.env` to Electron untouched |
| Capture | `require("electron")` throws during the `--require` phase, so the bootstrap hooks `Module._load` **once** and captures the module from upstream's own CJS require chain (electron-updater imports it first) — before any window exists |
| Identify | the primary workbench window is recognized purely by URL shape (index page, no `windowKind` param, top-level, resizable) |
| Attach | two `WebContentsView`s are added to the window's `contentView` — the domain surface (full area) and the switcher (titlebar band) |
| Slide | a single-flight, retargetable transition engine drives the domain view's bounds; host mode is **cover-slide** (the original cannot be translated on Electron 44 because the base view is not exposed) |

Runtime shims: a gated `app.getVersion` shim fixes an upstream
electron-updater import-time crash that only affects raw-electron
(unpackaged) dev launches. macOS dev (real bundle) and packaged builds are
unaffected.

## Usage

```bash
# from the repo root — runs the UNMODIFIED upstream dev pipeline with the host:
node apps/domain-workspace-host/scripts/dev.mjs

# automated switch + evidence harness (QA runs under Xvfb):
node apps/domain-workspace-host/scripts/dev.mjs --autoswitch

# verify upstream integrity (history + working tree, additions-only rule):
node apps/domain-workspace-host/scripts/verify-upstream-integrity.mjs

# plain upstream, host inert:
node apps/domain-workspace-host/scripts/dev.mjs --disable
```

## Guarantees

- **Upstream integrity** — machine-checked against the verified baseline by
  `scripts/verify-upstream-integrity.mjs`; the fork differs from baseline by
  **additions only** (zero upstream files modified/deleted/renamed).
- **Invisible to the package graph** — `apps/domain-workspace-host` matches
  none of pnpm's workspace globs, so the lockfile cannot change from it.
- **Disjoint IPC** — every channel lives under the `zcode-domain-workspace:*`
  namespace; nothing can collide with upstream `PlatformChannels`.
- **State preservation** — switching never unmounts or reloads either
  surface; upstream tasks, sessions, terminal, browser and composer state
  survive; the domain page keeps its own route and view state.
- **Reduced motion** — the slide collapses to an instant swap when the OS
  prefers reduced motion.
- **Fail-safe** — every host path is guarded; a broken host logs one warning
  and the upstream app continues.

## Layout

```
apps/domain-workspace-host/
├─ scripts/
│  ├─ dev.mjs                        # upstream dev pipeline + injection
│  └─ verify-upstream-integrity.mjs  # additions-only integrity gate
├─ src/
│  ├─ bootstrap.cjs                  # --require entry (process gating + capture)
│  ├─ install.cjs                    # shim + window watch + autoswitch harness
│  ├─ attachment.cjs                 # the two WebContentsViews + IPC + lifecycle
│  ├─ windowFilter.cjs               # primary-window identification (URL shape)
│  ├─ config.cjs                     # geometry / timing / IPC namespace / baseline
│  ├─ shims/appVersion.cjs           # gated electron-updater dev fix
│  ├─ navigation/
│  │  ├─ workspaceNavigation.cjs     # ordered registry state machine
│  │  └─ switcher/                   # « » cluster (html/css/js)
│  ├─ transitions/
│  │  ├─ easing.cjs                  # easeOutCubic
│  │  └─ slideTransition.cjs         # single-flight, retargetable engine
│  ├─ workspaces/
│  │  ├─ registry.cjs                # general | domain
│  │  └─ domain/                     # domain view factory + landing page
│  └─ preload/                       # sandboxed contextBridge preloads
```

Docs: [`docs/architecture/domain-workspace-host.md`](../../docs/architecture/domain-workspace-host.md) ·
handoff guides and QA evidence under [`docs/`](../../docs/).

## Known limitations (milestone 1)

- **Dev / unpackaged launches only.** Electron ignores `NODE_OPTIONS` in
  packaged builds, so the bootstrap cannot ride into an installed app.
  Packaging integration (an additive wrapper, or an upstream-sanctioned hook)
  is future work.
- **Cover-slide, not push-slide.** Electron 44 does not expose the primary
  window's base webContents view, so the original cannot physically move out
  to the left; the domain workspace covers and reveals it instead. A
  dual-slide path auto-activates if a future Electron exposes the base view.
