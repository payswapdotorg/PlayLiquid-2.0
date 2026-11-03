/**
 * @playliquid/gameos PUBLIC ENTRYPOINT (worker-b: the New Tab Console).
 *
 * Everything the ZCode side-pane host needs to mount the PlayLiquid
 * GameOS World Projects console:
 * - the console host (`createConsoleHost`): the composition root that
 *   instantiates the REAL domain services in-process (the package
 *   registry over an in-memory store port, the community contribution
 *   service over host adapters) and exposes them through the workbench's
 *   two typed seams (`ProjectsDataPort` / `ProjectsCommandPort`);
 * - the console pane (`PlayLiquidConsolePane`): the full-height React
 *   surface that loads through the host and renders the workbench;
 * - the whole World Projects workbench public surface (ports, store,
 *   projections, presentational components — the gameos-projects module
 *   entry re-exported verbatim, including its labeled TEST-SUPPORT
 *   doubles which are for tests only, never production wiring).
 *
 * The consolidated domain packages (game-contracts, package-system,
 * artifact-store, package-registry, git-lineage, game-ir,
 * platform-contracts, community) stay behind their own submodule
 * entrypoints; cross-module access goes through this entry or the
 * submodule entrypoints only.
 */

export {
  createConsoleHost,
  obtainConsoleHost,
  resetConsoleHost,
  CONSOLE_SUBJECT,
  CONSOLE_TENANT,
} from "./console/console-host.js";
export type { ConsoleHost, ConsoleViewer } from "./console/console-host.js";
export { PlayLiquidConsolePane } from "./console/PlayLiquidConsolePane.js";
export type { PlayLiquidConsolePaneProps } from "./console/PlayLiquidConsolePane.js";
export {
  consoleStatusChip,
  consoleStatusLine,
  projectConsoleStatus,
} from "./console/console-status.js";
export type { ConsoleStatus, ConsoleStatusFacts, ConsoleStatusTone } from "./console/console-status.js";

export * from "./gameos-projects/index.js";
