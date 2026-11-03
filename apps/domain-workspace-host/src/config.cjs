/**
 * PlayLiquid — domain workspace host configuration.
 *
 * Single source of truth for every tunable of the additive host layer.
 * Nothing in this file is imported by upstream ZCode code; the host is
 * injected at dev-launch time via `NODE_OPTIONS="--require <bootstrap>"`.
 */

"use strict";

/** Verified upstream baseline this fork is built on (zai-org/ZCode main). */
const BASELINE_COMMIT = "a9fe401eede6e6e5e01be9048679c206fe6f02d9";

/** Disjoint IPC namespace — cannot collide with upstream PlatformChannels. */
const IPC_NAMESPACE = "zcode-domain-workspace";

/** ipcMain channel names (main → attached views + views → main). */
const IPC = {
  getState: `${IPC_NAMESPACE}:get-state`,
  switchWorkspace: `${IPC_NAMESPACE}:switch`,
  stateChanged: `${IPC_NAMESPACE}:state-changed`,
};

/**
 * Switcher cluster geometry (DIP), parked in the structurally empty top-left
 * titlebar band of the upstream shell — beside the Z logo, after the
 * upstream task-history arrows.
 *
 * Derived from upstream source (see docs/architecture/domain-workspace-host.md §5):
 *   packages/ui/src/DesktopTopOverlay.tsx  (h-14 strip, absolute left-0 top-0)
 *   packages/ui/src/app-shell/WorkspaceShellLayout.tsx:2986-3020 (mount)
 *   packages/ui/src/project-sidebar/index.tsx:225-227 (h-12 drag strip)
 */
const SWITCHER_GEOMETRY = { x: 117, y: 6, width: 64, height: 32 };

/** Transition contract: ~250 ms, ease-out, horizontal only, reversible. */
const TRANSITION = {
  durationMs: 250,
  easing: "easeOutCubic",
  axis: "horizontal",
};

/**
 * Host mode:
 *  - "cover-slide"   — the domain view slides in from the right over the
 *                      stationary upstream webContents (Electron 44 does not
 *                      expose the base view, so the original cannot be
 *                      translated; covering preserves every state guarantee).
 *  - "dual-slide"    — auto-activates if a future Electron exposes the base
 *                      contentView children (both surfaces translate).
 */
const HOST_MODE = "cover-slide";

/** Environment switches (all opt-in; the host is inert without them). */
const ENV = {
  /** Hard kill-switch — bootstrap becomes a no-op. */
  disable: "ZCODE_DOMAIN_WORKSPACE_DISABLE",
  /** Automated general → domain → general run with evidence captures. */
  autoswitch: "ZCODE_DOMAIN_WORKSPACE_AUTOSWITCH",
  /** Directory for autoswitch captures (default: docs/qa/evidence). */
  evidenceDir: "ZCODE_DOMAIN_WORKSPACE_EVIDENCE_DIR",
};

/** Settling delays used by the autoswitch harness (ms). */
const AUTOSWITCH_TIMINGS = {
  initialSettleMs: 14_000,
  domainSettleMs: 4_000,
  restoredSettleMs: 3_000,
};

/** Workspace registry identities (order = navigation order). */
const WORKSPACES = [
  { id: "general", title: "ZCode (general)" },
  { id: "domain", title: "Domain Workspace" },
];

module.exports = {
  BASELINE_COMMIT,
  IPC_NAMESPACE,
  IPC,
  SWITCHER_GEOMETRY,
  TRANSITION,
  HOST_MODE,
  ENV,
  AUTOSWITCH_TIMINGS,
  WORKSPACES,
};
