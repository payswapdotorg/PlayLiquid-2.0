# How to Add Workspaces to This Fork — Safely

The golden rule: **upstream files are never edited.** The fork differs from
baseline by additions only, enforced by the integrity verifier. Everything
below follows from four verified facts.

## The four verified facts

1. **Electron built-ins are not requirable during the `--require` phase.**
   `require("electron")` throws there. Capture the module with a one-shot
   `Module._load` hook instead — upstream's own CJS require chain
   (electron-updater imports it first) hands it to you before any window
   exists. (`src/bootstrap.cjs`)

2. **The primary window is identifiable purely by URL shape** — index page
   (dev-server root or `out/renderer/index.html`), no `windowKind` query
   param, top-level, resizable. No upstream internals are consulted.
   (`src/windowFilter.cjs`)

3. **The top-left titlebar band is structurally empty upstream** — the
   sidebar reserves an h-12 drag strip (`packages/ui/src/project-sidebar/index.tsx:225-227`)
   under the `DesktopTopOverlay` strip (`packages/ui/src/DesktopTopOverlay.tsx`,
   absolute `h-14 left-0 top-0 z-20`). Additive controls fit beside the Z
   logo at x≈117 (before the new-task control) or x≈196 (after it).
   (`src/config.cjs::SWITCHER_GEOMETRY`)

4. **pnpm's workspace globs do not match `apps/domain-workspace-host`**
   (`pnpm-workspace.yaml` lists explicit packages), so the host is invisible
   to the dependency graph — the lockfile cannot change because of it.

## Recipe: adding a third workspace

1. Register it in `src/config.cjs::WORKSPACES` (id + title only — order is
   the navigation order).
2. Create `src/workspaces/<id>/<id>Workspace.cjs` with a factory shaped like
   `src/workspaces/domain/domainWorkspace.cjs` — a `WebContentsView`, parked
   offscreen, own preload, own session partition, `backgroundThrottling:
   false`.
3. Add renderer files under `src/workspaces/<id>/renderer/` (vanilla
   HTML/CSS/JS with a CSP; the domain landing page is the reference).
4. Expose a preload bridge if the surface needs host state
   (`src/preload/<id>Preload.cjs`, mirror of the domain preload).
5. Extend `src/attachment.cjs`: create the view on attach, lay it out,
   and drive its bounds from the slide position alongside the domain view.
6. **Do not** touch anything outside `apps/domain-workspace-host/` and
   `docs/`. Run the integrity verifier before committing:
   `node apps/domain-workspace-host/scripts/verify-upstream-integrity.mjs`

## Escalation rules (when a change seems impossible additively)

If a desired capability appears to require editing an upstream file:

1. **Stop.** Do not "just this once" an upstream edit — the integrity gate
   will fail the push and the review console will show it.
2. Write down the precise obstacle (file, line, what the additive path
   cannot reach).
3. Check whether an Electron-level mechanism covers it (a new
   `WebContentsView`, a window-level hook, an environment passthrough).
4. Only if no additive mechanism exists: propose a minimal, registered
   upstream edit to the owner — with file:line, exact diff, and a
   rollback plan — and wait for an explicit decision.

Current examples handled additively (no upstream edits needed): second
workspace, top-left switcher control, horizontal transitions, live host-state
IPC. Current examples *parked* behind the escalation rule: shipping the host
inside a packaged/installable build (NODE_OPTIONS does not survive
packaging).
