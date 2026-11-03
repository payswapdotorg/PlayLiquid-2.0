/**
 * CONSOLE STATUS PROJECTION (pure): the ONE owner of the PlayLiquid
 * Console header chip — the honest, real service facts of the composed
 * host (registry size, community contributions, the not-configured
 * world-project registry marker) mapped onto the workbench's own
 * `UiStatus` vocabulary (view/status.ts; E1 applied to presentation).
 *
 * Pure module: no IO, no React, no clock.
 */

import type { UiStatus } from "../gameos-projects/index.js";

/** The real service facts the console header chip renders. */
export interface ConsoleStatusFacts {
  /** True once the package registry finished its (awaited) open. */
  readonly registryOpen: boolean;
  /** Records currently indexed by the real package registry. */
  readonly registryRecords: number;
  /** Contributions the real community service records for the local tenant. */
  readonly communityContributions: number;
  /**
   * False until a world-project registry service is composed into the
   * host — the honest not-configured marker (never a fabricated project).
   */
  readonly projectRegistryComposed: boolean;
}

/** The console chip tone: ok when composed, warn while a seam is not configured. */
export type ConsoleStatusTone = "ok" | "warn" | "error";

/** The projected console header status (label + tone + note). */
export interface ConsoleStatus {
  readonly label: string;
  readonly tone: ConsoleStatusTone;
  readonly note: string;
}

/**
 * Project the host's real service facts into the console header status.
 * Deterministic (E9): same facts → same status.
 */
export function projectConsoleStatus(facts: ConsoleStatusFacts): ConsoleStatus {
  if (!facts.registryOpen) {
    return {
      label: "registry closed",
      tone: "error",
      note: "the package registry did not finish opening — retry the console",
    };
  }
  const notConfigured = !facts.projectRegistryComposed;
  return {
    label: notConfigured ? "services live · projects not configured" : "services live",
    tone: notConfigured ? "warn" : "ok",
    note: notConfigured
      ? "package registry and community service are live in-process; no world-project registry service is composed yet, so the projects read model is its real empty state"
      : "package registry, community service and world-project registry are live in-process",
  };
}

/** One-line summary of the facts (the pane header's secondary line). */
export function consoleStatusLine(facts: ConsoleStatusFacts): string {
  return `registry ${facts.registryOpen ? "open" : "closed"} · ${facts.registryRecords} record${
    facts.registryRecords === 1 ? "" : "s"
  } · community ${facts.communityContributions} contribution${
    facts.communityContributions === 1 ? "" : "s"
  } · ${facts.projectRegistryComposed ? "project registry live" : "no project registry composed"}`;
}

/** The console status mapped onto the workbench's own UiStatus chip vocabulary. */
export function consoleStatusChip(facts: ConsoleStatusFacts): UiStatus {
  const status = projectConsoleStatus(facts);
  return { label: status.label, tone: status.tone, note: status.note };
}
