#!/usr/bin/env node
/**
 * PlayLiquid-2.0 controlled-change governance verifier.
 *
 * Replaces the milestone-1 additions-only gate. Enforces docs/governance/CHANGE-POLICY.md:
 *   1. Every baseline file that is Modified or Deleted vs the pinned baseline must be
 *      listed in docs/governance/authorized-modifications.json.
 *   2. Entries whose path matches a protected surface must carry `justification`
 *      and `tlApproval`.
 *   3. Retired paths (milestone-1 host, additions-only CI) must not be re-introduced.
 *   4. Stale manifest entries (no longer differing from baseline) produce warnings only.
 *
 * Zero runtime dependencies: plain node + git. Exit code 0 = policy satisfied.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";

const exec = promisify(execFile);
const ROOT = resolve(import.meta.dirname, "..", "..");
const MANIFEST_PATH = resolve(ROOT, "docs/governance/authorized-modifications.json");

function fail(message) {
  console.error(`\x1b[31m✗ change-policy: ${message}\x1b[0m`);
  process.exitCode = 1;
}

async function git(args) {
  const { stdout } = await exec("git", args, { cwd: ROOT, maxBuffer: 1 << 24 });
  return stdout;
}

function parseManifest(raw) {
  const manifest = JSON.parse(raw);
  if (manifest.version !== 1) throw new Error("manifest version must be 1");
  if (typeof manifest.baseline !== "string" || !/^[0-9a-f]{40}$/.test(manifest.baseline)) {
    throw new Error("manifest.baseline must be a 40-hex commit");
  }
  if (!Array.isArray(manifest.modifications)) throw new Error("manifest.modifications must be an array");
  if (!Array.isArray(manifest.protectedSurfaces)) throw new Error("manifest.protectedSurfaces must be an array");
  if (!Array.isArray(manifest.retiredPaths)) throw new Error("manifest.retiredPaths must be an array");
  const entries = new Map();
  for (const entry of manifest.modifications) {
    if (!entry.path || !entry.owner || !entry.reason) {
      throw new Error(`manifest entry missing path/owner/reason: ${JSON.stringify(entry)}`);
    }
    if (!["modified", "deleted"].includes(entry.change)) {
      throw new Error(`manifest entry change must be modified|deleted: ${entry.path}`);
    }
    entries.set(entry.path, entry);
  }
  return { manifest, entries };
}

function matchesProtected(path, protectedSurfaces) {
  return protectedSurfaces.some((prefix) => path === prefix || path.startsWith(prefix));
}

async function diffVsBaseline(baseline, includeWorkingTree) {
  // Committed changes vs baseline (A/M/D status, no renames, byte-exact).
  const out = await git([
    "diff", "--no-ext-diff", "--no-textconv", "--no-renames", "--name-status", "-z", baseline, "HEAD", "--",
  ]);
  // With -z and --name-status, git emits NUL-separated pairs: STATUS\0PATH\0STATUS\0PATH...
  const tokens = out.split("\0").filter(Boolean);
  const committed = [];
  for (let i = 0; i + 1 < tokens.length; i += 2) {
    committed.push({ status: tokens[i][0], path: tokens[i + 1] });
  }
  if (!includeWorkingTree) return committed;
  // Working-tree + staged drift on top of HEAD.
  const drift = await git([
    "diff", "--no-ext-diff", "--no-textconv", "--no-renames", "--name-status", "-z", "HEAD", "--",
  ]);
  const driftTokens = drift.split("\0").filter(Boolean);
  const working = [];
  for (let i = 0; i + 1 < driftTokens.length; i += 2) {
    working.push({ status: driftTokens[i][0], path: driftTokens[i + 1] });
  }
  const untrackedOut = await git(["ls-files", "--others", "--exclude-standard", "-z"]);
  const untracked = untrackedOut.split("\0").filter(Boolean).map((path) => ({ status: "A", path }));
  // Drift vs HEAD only counts for files that exist in the baseline tree: a file that is
  // new vs baseline (fork addition) being edited locally is an edit to an *added* file,
  // not a modification of a baseline file.
  const baselineFiles = new Set(
    (await git(["ls-tree", "-r", "--name-only", "-z", baseline, "--"])).split("\0").filter(Boolean),
  );
  const driftInBaseline = working.filter((change) => baselineFiles.has(change.path));
  return [...committed, ...driftInBaseline, ...untracked];
}

async function main() {
  const raw = await readFile(MANIFEST_PATH, "utf8");
  const { manifest, entries } = parseManifest(raw);
  const baseline = manifest.baseline;

  // Baseline must exist in this repository's history.
  try {
    await exec("git", ["rev-parse", "--verify", "--quiet", `${baseline}^{commit}`], { cwd: ROOT });
  } catch {
    return fail(`baseline commit ${baseline} not found in repository history`);
  }

  const inCI = process.env.CI === "true";
  const changes = await diffVsBaseline(baseline, !inCI);

  const modifiedOrDeleted = new Map();
  const added = [];
  for (const change of changes) {
    if (change.status === "A") added.push(change.path);
    else if (change.status === "M" || change.status === "D") {
      modifiedOrDeleted.set(change.path, change.status);
    }
  }

  const trackedNow = new Set((await git(["ls-files", "-z"])).split("\0").filter(Boolean));

  let violations = 0;
  const warnings = [];

  // Rule 3: retired paths must not come back.
  for (const retired of manifest.retiredPaths) {
    const offenders = [...added, ...modifiedOrDeleted.keys()].filter(
      (path) => path === retired || path.startsWith(retired),
    );
    for (const offender of offenders) {
      fail(`retired path re-introduced: ${offender}`);
      violations += 1;
    }
  }

  // Rules 1 & 2: every M/D baseline file must be manifest-authorized.
  for (const [path, status] of modifiedOrDeleted) {
    const kind = status === "M" ? "modified" : "deleted";
    const entry = entries.get(path);
    if (!entry) {
      fail(
        `${kind === "D" ? "deleted" : "modified"} baseline file not in authorized-modifications.json: ${path}`,
      );
      violations += 1;
      continue;
    }
    if (entry.change !== kind) {
      fail(`manifest change kind mismatch for ${path}: declared ${entry.change}, actual ${kind}`);
      violations += 1;
      continue;
    }
    const protectedHit = matchesProtected(path, manifest.protectedSurfaces);
    if (protectedHit) {
      if (!entry.justification || !entry.tlApproval) {
        fail(`protected-surface change without justification/tlApproval: ${path}`);
        violations += 1;
      } else {
        console.log(`  protected ✓ ${path} — ${entry.workPackage ?? "?"}`);
      }
    } else {
      console.log(`  allowed   ✓ ${path} — ${entry.workPackage ?? "?"}`);
    }
  }

  // Rule 4: stale entries warn only.
  for (const [path, entry] of entries) {
    if (!modifiedOrDeleted.has(path)) {
      if (trackedNow.has(path)) {
        warnings.push(`stale manifest entry (file matches baseline again): ${path}`);
      } else if (entry.change === "modified") {
        warnings.push(`stale manifest entry (file no longer tracked): ${path}`);
      }
    }
  }

  // Summary report for CI artifacts.
  const report = {
    policy: manifest.policy,
    baseline,
    head: (await git(["rev-parse", "HEAD"])).trim(),
    generatedAt: new Date().toISOString(),
    counts: {
      added: added.length,
      modifiedOrDeleted: modifiedOrDeleted.size,
      manifestEntries: entries.size,
      violations,
      staleWarnings: warnings.length,
    },
    addedSample: added.slice(0, 25),
    modifiedOrDeleted: [...modifiedOrDeleted.keys()].sort(),
    warnings,
  };
  const reportPath = resolve(ROOT, "docs/qa/change-policy-report.json");
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  for (const warning of warnings) console.warn(`\x1b[33m! change-policy: ${warning}\x1b[0m`);
  console.log(
    `\nchange-policy: ${modifiedOrDeleted.size} baseline files modified/deleted, ` +
      `${added.length} files added, ${violations} violation(s), ${warnings.length} stale warning(s).`,
  );
  console.log(`report: docs/qa/change-policy-report.json`);
  if (violations > 0) {
    console.error("\x1b[31m✗ PlayLiquid controlled-change policy FAILED\x1b[0m");
    process.exitCode = 1;
  } else {
    console.log("\x1b[32m✓ PlayLiquid controlled-change policy satisfied\x1b[0m");
  }
}

main().catch((error) => {
  fail(error.message);
  process.exit(1);
});
