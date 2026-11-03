# Milestone 1 — Foundation (Domain Workspace Host)

**Scope delivered:** infrastructure + minimal placeholder landing page only.
No domain product features, no redesign of any upstream surface.

## Delivered

1. **Preserved upstream** — the fork's `main` history is byte-identical to
   `zai-org/ZCode` @ `a9fe401e` (verified by commit/tree hash equality and by
   the machine-checked integrity gate). LICENSE, NOTICE.md and
   THIRD-PARTY-NOTICES.md travel with the baseline.
2. **Additive host layer** — `apps/domain-workspace-host/` (~23 files,
   zero dependencies, invisible to pnpm's workspace globs):
   - injection via `NODE_OPTIONS --require` (bootstrap with one-shot
     `Module._load` capture of the `electron` module);
   - primary-window identification by URL shape;
   - two `WebContentsView`s — the domain workspace (full area, sandboxed,
     own session partition, background-throttling disabled) and the
     switcher cluster (64×32 at x=117, y=6 in the top-left titlebar band);
   - single-flight, retargetable 250 ms ease-out-cubic horizontal slide
     (host mode: cover-slide), reduced-motion aware;
   - disjoint `zcode-domain-workspace:*` IPC namespace;
   - gated `app.getVersion` shim for raw-electron dev launches;
   - automated switch + evidence harness (`ZCODE_DOMAIN_WORKSPACE_AUTOSWITCH`).
3. **Domain workspace placeholder** — warm-paper landing page with its own
   isolated hash router (`#/`, `#/about`) and a live host-state status bar.
4. **Integrity tooling + reports** —
   `apps/domain-workspace-host/scripts/verify-upstream-integrity.mjs`,
   `docs/qa/integrity-report.json`, `docs/qa/added-files.txt`.
5. **QA evidence** — six captures from the original milestone run (splash,
   domain active, ZCode covered, domain parked, ZCode restored, switcher
   cluster) under `docs/qa/evidence/`, produced under Xvfb with the
   autoswitch harness; see `docs/qa/verification.md`.
6. **Docs** — architecture (this set), handoff guides, safe-extension guide.

## Acceptance mapping

| Criterion | Evidence |
|---|---|
| **A** upstream integrity | verifier PASS (additions-only), tree-hash equality, committed report |
| **B** navigation behavior | cover-slide enter-from-right / exit-right, 250 ms ease-out, reversible mid-flight, rapid-switch safe |
| **C** ZCode compatibility | base webContents never destroyed/reloaded/resized; upstream state untouched by construction |
| **D** new workspace properties | same window; isolated route state; host-owned sandboxed view; independently developable package |
| **E** evidence pack | `docs/qa/evidence/*.png` + `docs/qa/verification.md` + `docs/qa/integrity-report.json` + `docs/qa/added-files.txt` |

## Known limitations (carried, not hidden)

- Dev/unpackaged launches only — NODE_OPTIONS does not reach packaged apps;
  the installable-build path is milestone-2 work (additive wrapper or an
  upstream-sanctioned hook).
- Cover-slide rather than dual-slide (Electron 44 hides the base view);
  a dual-slide path auto-activates once Electron exposes it.
- Long-lived interactive QA (login, terminal/browser panel state, rapid-click
  stress) still needs a real machine — the 4 GB sandbox OOM-killer ends
  sessions after the switch sequences complete (the structural guarantees
  are machine-checked and do not depend on it).
- The "ZCode — Interface Replica (All Screens).html" reference file was
  never delivered to the working environment; geometry came from upstream
  source with exact line references (architecture doc §5).

## Milestone tag

`playliquid-m1` — points at the milestone-1 tip commit on `main`.
