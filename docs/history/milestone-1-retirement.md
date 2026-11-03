# Milestone 1 Retirement — Domain Workspace Host

**Date:** 2026-11-03 · **Retiring TL:** PlayLiquid transformation TL
**Retired commits:** `801c28f2` (host), `396a0c2d` (integrity report), `643630a1` (additions-only CI gate)
**Baseline preserved:** `a9fe401eede6e6e5e01be9048679c206fe6f02d9` (ZCode v3.17.2) — untouched by this removal.

## What was removed from the active tree

| Path | What it was |
|---|---|
| `apps/domain-workspace-host/` | Experimental second-workspace host: `NODE_OPTIONS --require` bootstrap, `WebContentsView` domain workspace + 64×32 "« »" switcher beside the Z logo, slide transitions, window URL filtering, disjoint IPC channels |
| `apps/domain-workspace-host/scripts/dev.mjs` | Dev-only launcher that injected the host via `NODE_OPTIONS` — never part of the packaged app, and never a packaging strategy |
| `.github/workflows/playliquid-integrity.yml` | Additions-only integrity gate (superseded by controlled-change governance — see `docs/governance/CHANGE-POLICY.md`) |
| `docs/architecture/domain-workspace-host.md`, `docs/handoff/{fork-setup,how-to-add-workspaces-safely,milestone-1}.md` | Milestone-1 design/handoff documents |
| `docs/qa/` | Milestone-1 integrity reports + autoswitch PNG evidence |
| `references/` | Placeholder slot for a design reference (`ZCode — Interface Replica (All Screens).html`) that never arrived |

## Why

The product contract changed direction (see `docs/handoff/PLAYLIQUID-TRANSFORMATION-HANDOFF.md`):

1. **One unified product interface.** The separate workspace switcher beside the Z logo and the
   second full-screen `WebContentsView` are no longer the product architecture. PlayLiquid
   features must live inside the single ZCode application interface — starting with the
   PlayLiquid Console in the New Tab options (Files, Browser, Terminal, Review, PlayLiquid Console).
2. **No dev-only launch techniques.** `NODE_OPTIONS` injection is ignored by packaged Electron
   builds; the product must ship through the normal application and packaging path.
3. **No dead code.** Invisible views, navigation state machines and competing workspace
   implementations must not remain in the active application.

## Historical evidence

Milestone-1 remains fully recoverable from Git history:

```
git show 801c28f2            # host implementation (35 files, +2,520 lines)
git show 396a0c2d            # integrity report (zero upstream modifications)
git show 643630a1            # additions-only CI gate
git tag -l 'playliquid-m1'   # milestone tag (396a0c2d)
```

## What was deliberately NOT removed

- ZCode's task-history back/forward arrows (`packages/ui/src/DesktopTopOverlay.tsx`, testids
  `desktop-top-nav-back` / `desktop-top-nav-forward`) — original navigation, preserved exactly.
- All upstream ZCode files — milestone-1 modified zero of them; nothing to revert.
- `scripts/architecture/` governance machinery — repurposed by the controlled-change policy
  instead of the additions-only rule.
