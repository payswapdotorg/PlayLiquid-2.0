# New Tab & PlayLiquid Console Contract

## 1. The five options

The side-pane New Tab launcher offers exactly (resolver order, verified by
`packages/ui/src/app-shell/animatedSidePanePanelModel.test.ts` and by the live DOM attribute
`data-side-pane-open-tab-item` during the sandbox session):

| # | id | Label | Description | Icon | Origin |
|---|---|---|---|---|---|
| 1 | `files` | Files | Select a file from the navigation | FolderOpenIcon | inherited — preserved |
| 2 | `browser` | Browser | Browse websites and preview apps. | GlobeIcon | inherited — preserved |
| 3 | `terminal` | Terminal | Run commands and view output. | SquareTerminalIcon | inherited — preserved |
| 4 | `review` | Review | Review code changes and diffs. | FileDiffIcon | inherited — preserved |
| 5 | `playliquid-console` | PlayLiquid Console | World projects, runtime and GameOS operations. | Gamepad2Icon | **added** |

Conditional items (sites / selection-side-conversation / developer-tools) continue to resolve
after the five, exactly as before. Office mode continues to filter terminal+review as before.

## 2. What PlayLiquid Console is — and is not

**Is:** the domain-specific working interface for PlayLiquid GameOS — world/game project status,
world projects workbench, package composition with release-gate verdicts, semantic pull
requests, and real service status.

**Is not:** another general-purpose terminal, a second agent runtime, a second workspace, or a
mock dashboard. It creates no duplicate model routing, provider config, task system, browser or
terminal — it is a side-pane tab exactly like Browser or Terminal, coexisting with other panels
without interrupting active sessions.

## 3. Implementation

- New tab type `playliquid-console` in the `WorkspaceSidePaneTab` union with the same lifecycle
  (activate/visibility/persistence) as developer-tools; opened via the standard launcher row.
- `packages/playliquid-gameos` (`@playliquid/gameos`, workspace package) hosts the ported
  reference-repo domain modules: `game-contracts`, `game-ir`, `package-system`,
  `package-registry`, `git-lineage`, `community`, `platform-contracts`, `artifact-store`,
  `gameos-projects` — with their 677 tests.
- `createConsoleHost()` instantiates the real in-process services behind the module's typed
  ports (`ProjectsDataPort.load()`, `ProjectsCommandPort.dispatch()`): package registry
  (`openRegistry` over an in-memory `RegistryStore`, fail-closed publish), `CommunityService`
  (single-operator subject directory), and the E8 package-qualification seam reading the real
  registry + `checkReleaseGate` verdicts. Test-support doubles exist only in test files.
- The pane renders the Projects workbench (list / overview / composition / semantic PRs) with
  the module's own PlayLiquid tokens, wrapped in the shared side-pane chrome and
  `ScopedErrorBoundary`, exactly like sibling panes.

## 4. Honest states (no fake anything)

- With no world-project read models composed, the pane shows the real empty state:
  "No world projects yet" + guidance + refresh action, and the header badge
  "services live · projects not configured". This is the true state of the in-process services,
  not a mock.
- The capability-gap seam reports `exists:false` for every external link (no Lab service
  composed) — surfaced as unavailable, never as fake buttons.
- Persistence is session-scoped in-memory; recorded as an environment limitation (the
  world-project registry composition is the next GameOS milestone).

## 5. Registration points (files)

`animatedSidePanePanelModel.ts` (union + resolver) · `AnimatedSidePanePanel.tsx` (launcher row +
content switch) · `lib/workspaceSidePane.ts` (tab type + activate + visibility) ·
`hooks/useAppPanels.ts` (handler) · `app-shell/types.ts` · `App.tsx` ·
`WorkspaceShellLayout.tsx` (prop threading) · `sidePaneTabPresentation.ts` ·
`SidePaneTabTrigger.tsx` · `SidePaneTabOverview.tsx` · i18n (3 new keys × en/zh) ·
`packages/ui/package.json` (`@playliquid/gameos` dep) · `packages/ui/tsconfig.json` (project ref) ·
`architecture-policy.yaml` (module row) · `scripts/engineering-test-files.json` (tests).
All are authorized in `docs/governance/authorized-modifications.json` under
`worker-b-newtab-console`.
