# playliquid-gameos — module contract

The PlayLiquid GameOS domain modules and the World Projects console pane,
consolidated as ONE workspace module (`packages/playliquid-gameos`, module
id `playliquid-gameos`, worker-b port of the PlayLiquid product repo).

## Public surface

One public entrypoint: `src/index.ts` (package export `@playliquid/gameos`).
It exposes:

- `PlayLiquidConsolePane` — the full-height side-pane React surface (the
  New Tab launcher's fifth entry). Self-contained styling through the
  workbench's inline token objects (navy `#0b1220` / `#111a2c` studio
  palette, teal `#2dd4bf` accents); NO host theme classes.
- `createConsoleHost` / `obtainConsoleHost` / `resetConsoleHost` — the
  in-process composition root that instantiates the REAL domain services
  behind the workbench's two typed seams:
  - `ProjectsDataPort.load()` — read models assembled from the services'
    own public read doors;
  - `ProjectsCommandPort.dispatch(intent)` — review intents expanded into
    the community package's full authoritative transition commands.
- The World Projects workbench surface (`src/gameos-projects/index.ts`
  re-exported verbatim: ports, store, projections, components, and its
  labeled TEST-SUPPORT doubles — tests only, never production wiring).

The consolidated domain packages keep their own submodule entrypoints
(`src/game-contracts/index.ts`, `src/package-system/index.ts`,
`src/artifact-store/index.ts`, `src/package-registry/index.ts`,
`src/git-lineage/index.ts`, `src/game-ir/index.ts`,
`src/platform-contracts/index.ts`, `src/community/index.ts`). Internal
cross-submodule imports are relative; nothing outside the module is
imported except the host-provided React peer.

## Honest composition facts (never faked)

- The package registry is REAL and opened in-process over an in-memory
  store port; it starts empty and grows only through its own publish door.
- The community contribution service is REAL over host adapters (wall
  clock, content-addressed in-memory snapshot store, local single-operator
  subject directory: the local operator is subject AND maintainer).
- The R18 capability-gap seam reports `exists: false` for every link (no
  Lab service is composed in this host).
- No world-project registry service exists in the composed domain set, so
  the projects read model is its REAL empty state and the workbench
  renders its own frozen "No world projects yet" empty state. Never a
  fabricated project.
- Persistence is session-scoped in-memory — an explicitly recorded
  environment limitation, never presented as durable.

## Consumers

- `packages/ui` mounts `PlayLiquidConsolePane` in the side-pane content
  switch (`AnimatedSidePanePanel.tsx`, tab type `playliquid-console`) and
  opens it through the New Tab launcher entry
  (`animatedSidePanePanelModel.ts`, item id `playliquid-console`).

## Tests

- `src/gameos-projects/*.test.ts` — the ported workbench suite (vitest,
  wired into the root `engineering` vitest project).
- `src/console/console-host.test.ts` — the console host composition facts.
- The remaining submodule tests are the upstream `node:test` suites,
  preserved verbatim; the repo's vitest allowlist carries the workbench
  and console-host suites.
