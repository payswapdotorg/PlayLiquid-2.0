# PRODUCT-NORTH-STAR

The authoritative PlayLiquid product contract lives in the design/product reference repository:

**https://github.com/payswapdotorg/PlayLiquid/blob/main/PRODUCT-NORTH-STAR.md** (`f620426`)

This file records how that contract applies to **PlayLiquid-2.0** (the ZCode-foundation desktop
application) and defers to the reference on any conflict.

## What this repository is

**One PlayLiquid desktop application powered by the complete ZCode foundation.**

- ZCode (upstream `zai-org/ZCode`, baseline `a9fe401e`, v3.17.2, Apache-2.0) remains the
  authority for: agent runtime and execution, task/session lifecycle, context and memory,
  model/provider routing and credentials, attachments, browser and terminal engines, search,
  automations, Plugin Marketplace, MCP, permissions, local/remote workspaces, RPC, settings.
- PlayLiquid supplies the product identity (theme, branding, packaging) and the domain surface
  for PlayLiquid GameOS — surfaced as the **PlayLiquid Console**, the fifth option in the New
  Tab panel alongside Files, Browser, Terminal and Review.
- There is **no second workspace**, no separate Game Studio shell, no duplicate model router,
  provider settings, task system, agent runtime, browser or terminal.

## Non-negotiables inherited from the reference contract

1. Never fake branch/PR/GitHub state, model availability, engine availability, live/multiplayer
   or deployment capability. Unsupported operations show honest unavailable/not-configured states.
2. ZCode's inherited feature set remains reachable and functionally equivalent. Model/provider
   settings in particular must stay complete and working.
3. The application is genuinely installable (Windows NSIS + portable, Linux .deb + AppImage)
   with immutable per-SHA preview releases, checksums and build metadata.
4. PlayLiquid never overwrites a separately installed ZCode application, and its updater never
   replaces PlayLiquid with a ZCode package (update feed disabled by design).
5. No WebFlix code may be copied (unlicensed upstream) — interaction grammar is a design
   reference only.

## Transformation record

See `docs/handoff/PLAYLIQUID-TRANSFORMATION-HANDOFF.md` for the complete record: base SHAs,
work packages, integration merges, governance policy, evidence and release URLs.
