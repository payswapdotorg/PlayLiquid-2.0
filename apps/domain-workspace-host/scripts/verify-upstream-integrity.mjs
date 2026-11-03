#!/usr/bin/env node
/**
 * PlayLiquid — upstream integrity verifier.
 *
 * Machine-checks the fork against the verified upstream baseline and FAILS
 * on any non-additive change, in history AND in the working tree:
 *
 *   pass  ⇔  zero upstream files modified, deleted, or renamed
 *             (new files are unrestricted — the fork is additions-only)
 *
 * Usage:
 *   node apps/domain-workspace-host/scripts/verify-upstream-integrity.mjs \
 *        [baselineSha] [--json <outPath>] [--quiet]
 *
 *   baselineSha   defaults to config.BASELINE_COMMIT
 *   --json        also write a machine-readable report (the review console
 *                 reads this shape: verdict / violations / committed.* /
 *                 workingTree.* / head)
 *
 * Exit code: 0 = pass, 1 = fail (or usage error).
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..");
const CONFIG_PATH = resolve(here, "..", "src", "config.cjs");

const { createRequire } = await import("node:module");
const require = createRequire(import.meta.url);
const { BASELINE_COMMIT } = require(CONFIG_PATH);

const args = process.argv.slice(2);
const jsonFlagIndex = args.indexOf("--json");
const jsonOut = jsonFlagIndex !== -1 ? args.splice(jsonFlagIndex, 2)[1] : null;
const quiet = args.includes("--quiet");
const positional = args.filter((a) => !a.startsWith("--"));
const baseline = positional[0] || BASELINE_COMMIT;

async function git(...gitArgs) {
  const { stdout } = await exec("git", gitArgs, {
    cwd: repoRoot,
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout;
}

function categorize(nameStatus) {
  const buckets = {
    added: [],
    modified: [],
    deleted: [],
    renamed: [],
    other: [],
  };
  for (const line of nameStatus.split("\n")) {
    if (!line.trim()) continue;
    const [status, ...rest] = line.split("\t");
    const file = rest[rest.length - 1];
    if (!file) continue;
    if (status.startsWith("A") || status === "??") buckets.added.push(file);
    else if (status.startsWith("M")) buckets.modified.push(file);
    else if (status.startsWith("D")) buckets.deleted.push(file);
    else if (status.startsWith("R")) buckets.renamed.push(file);
    else buckets.other.push(file);
  }
  for (const key of Object.keys(buckets)) buckets[key].sort();
  return buckets;
}

async function main() {
  const violations = [];

  let head = null;
  try {
    head = (await git("rev-parse", "HEAD")).trim();
  } catch {
    violations.push("repository has no HEAD commit");
  }

  try {
    await git("cat-file", "-e", `${baseline}^{commit}`);
  } catch {
    violations.push(`baseline commit ${baseline} not present in the repository`);
  }

  let committed = { added: [], modified: [], deleted: [], renamed: [], other: [] };
  if (head && !violations.length) {
    const nameStatus = await git(
      "diff",
      "--name-status",
      "--no-renames",
      "--diff-filter=ADMRT",
      `${baseline}..HEAD`,
    );
    committed = categorize(nameStatus);
    // With --no-renames, renames surface as A+D pairs; treat pure additions as
    // allowed, but any D (upstream content removed) is a violation.
    if (committed.modified.length) {
      violations.push(
        `upstream files modified: ${committed.modified.join(", ")}`,
      );
    }
    if (committed.deleted.length) {
      violations.push(`upstream files deleted: ${committed.deleted.join(", ")}`);
    }
    if (committed.renamed.length) {
      violations.push(`upstream files renamed: ${committed.renamed.join(", ")}`);
    }
    if (committed.other.length) {
      violations.push(`upstream files type-changed: ${committed.other.join(", ")}`);
    }
  }

  // Working tree: same rules. Untracked additions are fine (they are new
  // files); any tracked-file modification or deletion is a violation.
  const workingTree = { modified: [], deleted: [], addedUntracked: [] };
  try {
    const porcelain = await git("status", "--porcelain", "--no-renames", "--untracked-files=all");
    for (const line of porcelain.split("\n")) {
      if (!line.trim()) continue;
      const xy = line.slice(0, 2);
      const file = line.slice(3).trim();
      if (xy[1] === "D" || xy[0] === "D") workingTree.deleted.push(file);
      else if (xy[1] === "M" || xy[0] === "M") workingTree.modified.push(file);
      else if (xy.trim() === "??") workingTree.addedUntracked.push(file);
    }
    if (workingTree.modified.length) {
      violations.push(
        `working tree modifies upstream files: ${workingTree.modified.join(", ")}`,
      );
    }
    if (workingTree.deleted.length) {
      violations.push(
        `working tree deletes upstream files: ${workingTree.deleted.join(", ")}`,
      );
    }
  } catch (error) {
    violations.push(`working tree check failed: ${error.message}`);
  }

  const verdict = violations.length === 0 ? "pass" : "fail";

  const report = {
    generatedAt: new Date().toISOString(),
    baseline,
    head,
    verdict,
    violations,
    committed,
    workingTree,
    rule: "pass ⇔ zero upstream files modified/deleted/renamed vs baseline (additions are unrestricted)",
  };

  if (jsonOut) {
    writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
  }

  if (!quiet) {
    const label = verdict === "pass" ? "PASS" : "FAIL";
    console.log(`[playliquid] upstream integrity: ${label} (baseline ${baseline.slice(0, 7)}, head ${head ? head.slice(0, 7) : "?"})`);
    console.log(
      `[playliquid] committed: ${committed.added.length} added / ${committed.modified.length} modified / ${committed.deleted.length} deleted / ${committed.renamed.length} renamed`,
    );
    console.log(
      `[playliquid] working tree: ${workingTree.addedUntracked.length} untracked additions / ${workingTree.modified.length} modified / ${workingTree.deleted.length} deleted`,
    );
    for (const violation of violations) console.error(`[playliquid] VIOLATION: ${violation}`);
  }

  process.exitCode = verdict === "pass" ? 0 : 1;
}

main().catch((error) => {
  console.error("[playliquid] verifier crashed:", error && error.message);
  process.exitCode = 1;
});
