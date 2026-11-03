/**
 * CONSOLE HOST tests: the in-process composition facts of the PlayLiquid
 * GameOS console — the real services behind the workbench's two typed
 * seams, the honest first-run read model (no fabricated projects), the
 * typed refusals of the command path, and a REAL community round trip
 * through the command port (submit → triage) proving the service is
 * live in-process, not mocked.
 *
 * Honesty scope (E11): no DOM, no rendering, no network, no timers —
 * every fact is read through the services' own public doors. The one
 * test-support double in use is community's `fakePayload` (a kernel
 * value builder, labeled TEST SUPPORT in its own module).
 */

import { test } from "vitest";
import assert from "node:assert/strict";
import { CONSOLE_SUBJECT, CONSOLE_TENANT, createConsoleHost } from "./console-host.js";
import type { ConsoleHost } from "./console-host.js";
import { fakePayload } from "../community/index.js";
import type { PackageRegistry } from "../package-registry/index.js";
import { consoleStatusChip, consoleStatusLine } from "./console-status.js";

async function freshHost(): Promise<ConsoleHost> {
  return await createConsoleHost();
}

test("the console host composes the real services and opens the registry", async () => {
  const host = await freshHost();
  assert.equal(host.registry.size(), 0, "the real registry starts empty (nothing published)");
  const status = host.status();
  assert.equal(status.registryOpen, true);
  assert.equal(status.registryRecords, 0);
  assert.equal(status.communityContributions, 0);
  assert.equal(status.projectRegistryComposed, false, "honest not-configured marker");
});

test("the data port serves the honest first-run read model (viewer + zero projects)", async () => {
  const host = await freshHost();
  const result = host.ports.data.load();
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(String(result.data.viewer.tenantId), String(CONSOLE_TENANT));
  assert.equal(String(result.data.viewer.subjectId), String(CONSOLE_SUBJECT));
  assert.deepEqual(result.data.projects, [], "no fabricated project rows (no project registry composed)");
  assert.equal(result.data.details.size, 0);
  // E9: two loads over an unchanged host return the same facts.
  const again = host.ports.data.load();
  assert.equal(again.ok, true);
  if (!again.ok) return;
  assert.deepEqual(again.data.projects, result.data.projects);
  assert.deepEqual(again.data.viewer, result.data.viewer);
});

test("a malformed review intent is refused typed, before any domain call", async () => {
  const host = await freshHost();
  const receipt = await host.ports.command.dispatch({
    kind: "transition-pull-request",
    prId: ("sha256:" + "1".repeat(64)) as never,
    command: "not-a-command" as never,
  });
  assert.equal(receipt.ok, false);
  if (receipt.ok) return;
  assert.equal(receipt.code, "invalid-intent");
  assert.match(receipt.detail, /frozen transition-command vocabulary/);
});

test("an unknown pull request is refused with the community door's own vocabulary (E8)", async () => {
  const host = await freshHost();
  const receipt = await host.ports.command.dispatch({
    kind: "transition-pull-request",
    prId: ("sha256:" + "9".repeat(64)) as never,
    command: "triage",
  });
  assert.equal(receipt.ok, false);
  if (receipt.ok) return;
  assert.equal(receipt.code, "unknown-contribution");
});

test("the E8 registry seam is fail-closed for unpublished coordinates", async () => {
  const host = await freshHost();
  // The seam is exercised through the community service's accept path:
  // qualificationOf reads the REAL registry, which indexes zero records.
  const status = host.status();
  assert.equal(status.registryRecords, 0);
  // The host exposes the registry read door directly; the fail-closed
  // verdict for an unpublished coordinate is the registry's own lookup.
  assert.equal(
    host.registry.get({
      kind: "world",
      id: "pkg.example",
      version: "1.0.0",
    } as unknown as Parameters<PackageRegistry["get"]>[0]),
    null,
  );
});

test("a REAL community round trip drives the command port to an accepted receipt", async () => {
  const host = await freshHost();
  // Submit one real pull-request contribution through the REAL service
  // (the local operator is the registered contributor of the tenant).
  const submitted = host.community.submit({
    tenant: CONSOLE_TENANT,
    contributor: CONSOLE_SUBJECT,
    kind: "pull-request",
    payload: fakePayload({ title: "console test: one real contribution", files: 1n }),
    provenance: { origin: { kind: "original" }, aiGenerated: false },
  });
  assert.equal(
    submitted.accepted,
    true,
    `submit refused: ${submitted.accepted ? "" : `${submitted.code} — ${submitted.detail}`}`,
  );
  if (!submitted.accepted) return;
  assert.equal(host.status().communityContributions, 1, "the read door counts the real record");
  // The command port expands the intent into the full authoritative
  // transition command and the REAL service accepts it.
  const receipt = await host.ports.command.dispatch({
    kind: "transition-pull-request",
    prId: submitted.contribution.contributionId,
    command: "triage",
  });
  assert.equal(receipt.ok, true, `triage refused: ${receipt.ok ? "" : `${receipt.code} — ${receipt.detail}`}`);
  if (!receipt.ok) return;
  assert.equal(receipt.command, "triage");
  assert.equal(receipt.prId, submitted.contribution.contributionId);
  assert.equal(typeof receipt.at, "number");
  // The authoritative state advanced: the read door reports `triaged`.
  const advanced = host.community.contribution(CONSOLE_TENANT, submitted.contribution.contributionId);
  assert.equal(advanced?.status, "triaged");
});

test("the console status projection renders the real facts, honestly", async () => {
  const host = await freshHost();
  const facts = host.status();
  const line = consoleStatusLine(facts);
  assert.match(line, /registry open · 0 records/);
  assert.match(line, /community 0 contributions/);
  assert.match(line, /no project registry composed/);
  const chip = consoleStatusChip(facts);
  assert.equal(chip.tone, "warn", "the not-configured marker is a visible warn tone");
  assert.match(chip.label, /projects not configured/);
});
