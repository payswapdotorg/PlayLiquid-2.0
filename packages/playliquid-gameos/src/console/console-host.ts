/**
 * THE CONSOLE HOST (worker-b): the composition root of the PlayLiquid
 * GameOS console inside the ZCode side pane — the host side of the
 * gameos-projects mount recipe, executed in-process for the New Tab
 * "PlayLiquid Console" entry.
 *
 * It composes the REAL authoritative domain implementations behind the
 * workbench's two typed port seams and NOTHING else:
 * - `ProjectsDataPort` (read models): assembled from the authoritative
 *   services' own public read doors — the package registry
 *   (package-registry over the host's in-memory store port) for
 *   composition/gate facts, and the community service (PL-032) for the
 *   pull-request lifecycle doors.
 * - `ProjectsCommandPort` (typed intents): translates review intents
 *   into the community package's full authoritative transition commands
 *   (tenant, actor, reason) — exactly the expansion the workbench's
 *   ports contract describes ("the host expands the small intent into
 *   the full authoritative transition command").
 *
 * Honesty rules (lock rule 44 discipline, mirrored from the reference
 * desktop host): no demo fixtures, no StaticProjectsDataPort, no fakes.
 * The first-run state of every surface is the REAL empty state of the
 * composed services. One seam is honestly NOT CONFIGURED:
 * - No world-project registry service exists in the composed domain set
 *   (the upstream product composes projects in its Studio/Lab services,
 *   which are outside this module's write surface), so the projects list
 *   read model is empty and the workbench renders its own frozen
 *   "No world projects yet" empty state (view/onboarding.ts) — never a
 *   fabricated project.
 * - The community R18 capability-gap seam reports `exists: false` for
 *   every link (no Lab service is composed here; the reference desktop
 *   host starts its Lab-ledger seams equally empty).
 *
 * Session scope: persistence is session-scoped in-memory (recorded as an
 * environment limitation, never faked); the host wall clock is the only
 * time authority (E9).
 */

import { CommunityService, asContributionId } from "../community/index.js";
import type { SubjectId, TenantId } from "../platform-contracts/index.js";
import { asSubjectId, asTenantId } from "../platform-contracts/index.js";
import { openRegistry } from "../package-registry/index.js";
import type { PackageRegistry } from "../package-registry/index.js";
import { checkReleaseGate } from "../package-system/index.js";
import type { PackageRecord } from "../package-system/index.js";
import type {
  ProjectsCommandIntent,
  ProjectsCommandPort,
  ProjectsCommandReceipt,
  ProjectsDataPort,
  ProjectsLoadResult,
} from "../gameos-projects/index.js";
import { projectsIntentProblem } from "../gameos-projects/index.js";
import type { ProjectsDataSnapshot } from "../gameos-projects/index.js";
import {
  createConsoleCommunityClock,
  createConsoleCommunityStore,
  createConsoleHostClock,
  createConsoleRegistryStore,
  createConsoleSubjectDirectory,
  type ConsoleHostClock,
} from "./console-adapters.js";
import type { ConsoleStatusFacts } from "./console-status.js";

/** The local operator tenancy the console composes (R20 viewer scope). */
export interface ConsoleViewer {
  readonly tenant: TenantId;
  readonly subject: SubjectId;
  readonly displayName: string;
}

/**
 * The local operator identity: the same single-operator local workspace
 * facts the reference desktop host pins (identity.ts) — host composition
 * facts, not domain data.
 */
export const CONSOLE_TENANT = asTenantId("tenant-playliquid-local")!;
export const CONSOLE_SUBJECT = asSubjectId("subject-local-operator")!;
const CONSOLE_VIEWER_DISPLAY_NAME = "Local operator";

/**
 * The composed console host: real services + the workbench port
 * adapters. The registry open is the one async composition step
 * (`createConsoleHost` awaits it before returning, so a host value never
 * carries a closed registry — the reference desktop host discipline).
 */
export interface ConsoleHost {
  readonly viewer: ConsoleViewer;
  readonly clock: ConsoleHostClock;
  /** The real package registry backing the composition/gate read doors. */
  readonly registry: PackageRegistry;
  /** The real community contribution service (the review-lifecycle authority). */
  readonly community: CommunityService;
  /** The two workbench seams (read models + typed command intents). */
  readonly ports: {
    readonly data: ProjectsDataPort;
    readonly command: ProjectsCommandPort;
  };
  /**
   * Real service facts for the console status chip: registry size,
   * community contribution count, and the honest not-configured marker
   * for the world-project registry.
   */
  status(): ConsoleStatusFacts;
}

// ---------------------------------------------------------------------------
// The data seam (read models from the services' own read doors)
// ---------------------------------------------------------------------------

/**
 * The console `ProjectsDataPort`: assembles the World Projects read
 * model from the composed services' read doors. Deterministic per host
 * state: two loads over an unchanged host return the same data (E9).
 * The projects list is the REAL empty state until a world-project
 * registry service is composed into the host (honest not-configured,
 * never a fabricated project row); the community pull-request doors stay
 * wired and surface through the host status facts.
 */
export class ConsoleProjectsDataPort implements ProjectsDataPort {
  readonly #host: () => ConsoleHost;

  constructor(host: () => ConsoleHost) {
    this.#host = host;
  }

  load(): ProjectsLoadResult {
    const host = this.#host();
    const snapshot: ProjectsDataSnapshot = {
      viewer: {
        tenantId: host.viewer.tenant,
        subjectId: host.viewer.subject,
        displayName: host.viewer.displayName,
      },
      projects: [],
      details: new Map(),
    };
    return { ok: true, data: snapshot };
  }
}

// ---------------------------------------------------------------------------
// The command seam (typed intents → authoritative community doors)
// ---------------------------------------------------------------------------

/**
 * The console `ProjectsCommandPort`: expands one typed review intent
 * into the full authoritative community transition command (tenant,
 * actor, reason — the host-owned facts) and forwards it to the real
 * community service door. Refusals return the community package's own
 * refusal vocabulary VERBATIM (E8); the generic `transition-refused`
 * code is reserved for host-side failures that cannot map onto it.
 */
export class ConsoleProjectsCommandPort implements ProjectsCommandPort {
  readonly #host: () => ConsoleHost;

  constructor(host: () => ConsoleHost) {
    this.#host = host;
  }

  async dispatch(intent: ProjectsCommandIntent): Promise<ProjectsCommandReceipt> {
    const problem = projectsIntentProblem(intent);
    if (problem !== null) {
      return { ok: false, code: "invalid-intent", detail: problem };
    }
    const prId = asContributionId(intent.prId);
    if (prId === undefined) {
      return {
        ok: false,
        code: "invalid-intent",
        detail: "prId is not a content-addressed contribution id (sha256:…)",
      };
    }
    const host = this.#host();
    const result = host.community.transition({
      tenant: host.viewer.tenant,
      contributionId: prId,
      kind: intent.command,
      actor: host.viewer.subject,
      reason: "review intent dispatched from the PlayLiquid Console workbench",
    });
    if (result.accepted) {
      return { ok: true, prId, command: intent.command, at: result.record.recordedAt };
    }
    return { ok: false, code: result.code, detail: result.detail };
  }
}

// ---------------------------------------------------------------------------
// The composition root
// ---------------------------------------------------------------------------

/**
 * Creates the console host with its package registry OPENED (the one
 * async composition step; the mount recipe awaits it before the first
 * authoritative snapshot is loaded — the reference desktop host's
 * createDesktopProductHost discipline).
 */
export async function createConsoleHost(): Promise<ConsoleHost> {
  const clock = createConsoleHostClock();

  // --- Registry: the real open over the host's in-memory store port.
  // Starts empty; it grows only through the registry's own publish door.
  const registryStore = createConsoleRegistryStore();

  // --- Community: the real service over host adapters. The local
  // operator is both the registered subject and the tenant maintainer
  // (single-operator local workspace — the reference host's fact).
  const communityStore = createConsoleCommunityStore();
  const directory = createConsoleSubjectDirectory();
  directory.register(CONSOLE_TENANT, CONSOLE_SUBJECT);
  directory.registerMaintainer(CONSOLE_TENANT, CONSOLE_SUBJECT);

  // --- The R18 gap seam: honestly not configured (no Lab service is
  // composed in this host — every link reports `exists: false`; the
  // reference desktop host starts its Lab-ledger seams equally empty).
  const gaps = {
    factsOf: () => ({ exists: false, resolved: false, blocked: false, communityRungReached: false }),
  };

  // --- The E8 registry seam: the community service reads qualification
  // facts from the REAL package registry (one registry for the whole
  // host) — the same wiring the reference desktop host uses.
  let registryRef: PackageRegistry | null = null;
  const packages = {
    qualificationOf: (coordinate: unknown): { published: boolean; provenancePasses: boolean } => {
      const current = registryRef;
      if (current === null) return { published: false, provenancePasses: false };
      const candidate = coordinate as
        | {
            readonly kind?: unknown;
            readonly id?: unknown;
            readonly version?: unknown;
            readonly contentDigest?: unknown;
          }
        | undefined;
      if (
        candidate?.kind === undefined ||
        candidate.id === undefined ||
        candidate.version === undefined
      ) {
        return { published: false, provenancePasses: false };
      }
      const found = current.get({
        kind: candidate.kind,
        id: candidate.id,
        version: candidate.version,
      } as Parameters<PackageRegistry["get"]>[0]);
      if (
        found === null ||
        String(found.identity.contentDigest) !== String(candidate.contentDigest)
      ) {
        return { published: false, provenancePasses: false };
      }
      const record: PackageRecord = found;
      return { published: true, provenancePasses: checkReleaseGate(record).pass };
    },
  };

  const community = new CommunityService({
    store: communityStore,
    clock: createConsoleCommunityClock(clock),
    directory,
    gaps,
    packages,
    policy: { maxOpenContributionsPerContributor: 100 },
  });

  const opened = await openRegistry({ store: registryStore });
  if (!opened.ok) {
    throw new Error(`console host: the package registry refused to open: ${opened.message}`);
  }
  registryRef = opened.registry;

  const host: ConsoleHost = {
    viewer: {
      tenant: CONSOLE_TENANT,
      subject: CONSOLE_SUBJECT,
      displayName: CONSOLE_VIEWER_DISPLAY_NAME,
    },
    clock,
    registry: registryRef,
    community,
    ports: {
      data: new ConsoleProjectsDataPort(() => host),
      command: new ConsoleProjectsCommandPort(() => host),
    },
    status(): ConsoleStatusFacts {
      return {
        registryOpen: true,
        registryRecords: registryRef?.size() ?? 0,
        communityContributions: community.contributionsOf(host.viewer.tenant).length,
        projectRegistryComposed: false,
      };
    },
  };
  return host;
}

// ---------------------------------------------------------------------------
// The session host singleton (one in-process console per renderer)
// ---------------------------------------------------------------------------

let consoleHostPromise: Promise<ConsoleHost> | null = null;

/**
 * Obtains the session's console host, creating it once (the product
 * shell composes ONE host — the reference desktop precedent). Mount
 * churn (React StrictMode, tab re-mounts) must never compose a second
 * registry/community pair.
 */
export function obtainConsoleHost(): Promise<ConsoleHost> {
  if (consoleHostPromise === null) {
    consoleHostPromise = createConsoleHost();
  }
  return consoleHostPromise;
}

/**
 * Drops the session host so the next `obtainConsoleHost` composes a
 * fresh one (the pane's retry control after a failed composition; tests
 * also use it to pin deterministic facts).
 */
export function resetConsoleHost(): void {
  consoleHostPromise = null;
}
