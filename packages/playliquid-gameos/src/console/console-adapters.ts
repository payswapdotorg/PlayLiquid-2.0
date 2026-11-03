/**
 * CONSOLE HOST PORT ADAPTERS (worker-b): the in-process app-side
 * implementations of the seams the PlayLiquid domain packages
 * deliberately leave to the host — "real persistence, clock and
 * identity/tenancy composition are app concerns" (each package's own
 * ports docs). This file is that app side for the ZCode side-pane
 * console host, mirroring the reference desktop host's adapters
 * (packages/desktop/src/renderer/src/gameos/host/adapters.ts in the
 * PlayLiquid repo) line for line in discipline.
 *
 * Honest scope (stated for the record): every adapter here is
 * session-scoped in-memory. Durable persistence (files, SQLite, the
 * platform services) lives in protected surfaces outside this module's
 * write surface; the host records this as an explicit environment
 * limitation, never as a faked durable integration (lock rule 44).
 *
 * No domain logic lives here: the adapters carry time, memory and lookup
 * facts across the typed seams; every decision stays with the
 * authoritative services behind them (E1/E5 verbatim).
 */

import type { RegistryStore } from "../package-registry/index.js";
import type { ContentDigest, PackageRecord } from "../package-system/index.js";
import type {
  CommunityStore,
  ServiceClock,
  StoredCommunitySnapshot,
  SubjectDirectory,
} from "../community/index.js";
import type { SubjectId, TenantId, TimestampMs } from "../platform-contracts/index.js";
import { asTimestampMs } from "../platform-contracts/index.js";

// ---------------------------------------------------------------------------
// Time (the host IS the time authority; the domains never read a clock)
// ---------------------------------------------------------------------------

/** The wall clock of the console host: real time, supplied BY THE HOST. */
export interface ConsoleHostClock {
  now(): number;
}

/** Creates the console host wall clock (Date-backed, millisecond precision). */
export function createConsoleHostClock(): ConsoleHostClock {
  return { now: () => Date.now() };
}

// ---------------------------------------------------------------------------
// Package registry persistence (the registry's RegistryStore port)
// ---------------------------------------------------------------------------

/** An in-memory package-record store (idempotent per coordinate+digest). */
export function createConsoleRegistryStore(): RegistryStore & {
  readonly count: () => number;
} {
  const byKey = new Map<string, PackageRecord>();
  const keyOf = (record: PackageRecord) =>
    `${record.identity.kind}:${record.identity.id}@${String(record.identity.version)}:${record.identity.contentDigest}`;
  return {
    listRecords: async () => [...byKey.values()],
    putRecord: async (record) => {
      byKey.set(keyOf(record), record);
    },
    count: () => byKey.size,
  };
}

// ---------------------------------------------------------------------------
// Community ports (store, clock, subject directory)
// ---------------------------------------------------------------------------

/**
 * The community snapshot persistence adapter: a Map keyed by the
 * content-addressed snapshot id, preserving the port's integrity contract
 * (same id + different bytes is an error; identical re-saves are no-ops).
 */
export function createConsoleCommunityStore(): CommunityStore {
  const byId = new Map<string, StoredCommunitySnapshot>();
  const order: StoredCommunitySnapshot[] = [];
  return {
    save: (snapshot) => {
      const key = String(snapshot.snapshotId);
      const existing = byId.get(key);
      if (existing !== undefined) {
        if (existing.document !== snapshot.document) {
          throw new RangeError(`console community store: refusing rewrite of snapshot ${key}`);
        }
        return;
      }
      byId.set(key, snapshot);
      order.push(snapshot);
    },
    list: () => [...order],
    load: (snapshotId: ContentDigest) => byId.get(String(snapshotId)),
  };
}

/** The community service clock adapter (host wall time). */
export function createConsoleCommunityClock(host: ConsoleHostClock): ServiceClock {
  return { now: () => asTimestampMs(host.now())! };
}

/**
 * The local identity directory: the console's single local operator is
 * both the registered subject AND the maintainer of the local tenant (a
 * single-operator local workspace; community moderation rights belong to
 * that operator by host composition, honestly declared here — the
 * reference desktop host declares the same fact).
 */
export interface ConsoleSubjectDirectory extends SubjectDirectory {
  /** Registers a subject of a tenant (contributor standing). */
  register(tenant: TenantId, subject: SubjectId): void;
  /** Grants the maintainer role to a subject within a tenant. */
  registerMaintainer(tenant: TenantId, subject: SubjectId): void;
}

/** Creates the local identity directory (the community SubjectDirectory seam). */
export function createConsoleSubjectDirectory(): ConsoleSubjectDirectory {
  const members = new Set<string>();
  const owners = new Map<string, TenantId>();
  const maintainers = new Set<string>();
  return {
    exists: (tenant, subject) => members.has(`${String(tenant)}|${String(subject)}`),
    tenantOf: (subject) => owners.get(String(subject)),
    isMaintainer: (tenant, subject) => maintainers.has(`${String(tenant)}|${String(subject)}`),
    register: (tenant, subject) => {
      members.add(`${String(tenant)}|${String(subject)}`);
      owners.set(String(subject), tenant);
    },
    registerMaintainer: (tenant, subject) => {
      members.add(`${String(tenant)}|${String(subject)}`);
      owners.set(String(subject), tenant);
      maintainers.add(`${String(tenant)}|${String(subject)}`);
    },
  };
}

// ---------------------------------------------------------------------------
// Timestamps (host wall time onto the platform-contracts branded type)
// ---------------------------------------------------------------------------

/** Casts host wall time onto the platform TimestampMs type (finite, non-negative). */
export function consoleTimestampOf(host: ConsoleHostClock): TimestampMs {
  return asTimestampMs(host.now())!;
}
