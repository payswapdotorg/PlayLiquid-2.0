#!/usr/bin/env node
/**
 * PlayLiquid — dev launcher.
 *
 * Starts the UNMODIFIED upstream desktop dev pipeline with the host injected
 * via NODE_OPTIONS. Nothing is patched, copied, or rebuilt: the upstream
 * `pnpm run dev:desktop` flow runs exactly as shipped, and our bootstrap
 * rides along through the environment.
 *
 * Usage:
 *   node apps/domain-workspace-host/scripts/dev.mjs
 *     [--autoswitch]          run the automated switch + evidence harness
 *     [--disable]             launch plain upstream (host inert)
 *     [-- <extra args>]       forwarded to the upstream dev script
 *
 * Environment:
 *   ZCODE_DOMAIN_WORKSPACE_DISABLE     hard kill-switch (same as --disable)
 *   ZCODE_DOMAIN_WORKSPACE_AUTOSWITCH  same as --autoswitch
 */

import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..");
const bootstrapPath = join(repoRoot, "apps", "domain-workspace-host", "src", "bootstrap.cjs");

if (!existsSync(bootstrapPath)) {
  console.error("[playliquid] bootstrap not found at", bootstrapPath);
  process.exit(1);
}

const args = process.argv.slice(2);
const wantsAutoswitch = args.includes("--autoswitch") || Boolean(process.env.ZCODE_DOMAIN_WORKSPACE_AUTOSWITCH);
const wantsDisable = args.includes("--disable") || Boolean(process.env.ZCODE_DOMAIN_WORKSPACE_DISABLE);
const passthrough = args.filter((a) => a !== "--autoswitch" && a !== "--disable");

const env = { ...process.env };
const requireFlag = `--require ${JSON.stringify(bootstrapPath)}`;
env.NODE_OPTIONS = env.NODE_OPTIONS ? `${env.NODE_OPTIONS} ${requireFlag}` : requireFlag;
if (wantsAutoswitch) env.ZCODE_DOMAIN_WORKSPACE_AUTOSWITCH = "1";
if (wantsDisable) env.ZCODE_DOMAIN_WORKSPACE_DISABLE = "1";

const runner = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const upstreamArgs = ["run", "dev:desktop", ...passthrough];

console.log(`[playliquid] launching upstream dev pipeline: ${runner} ${upstreamArgs.join(" ")}`);
console.log(`[playliquid] NODE_OPTIONS += ${requireFlag}`);
console.log("[playliquid] upstream source is never modified — the host is additive only.");

const child = spawn(runner, upstreamArgs, {
  cwd: repoRoot,
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});

for (const forward of ["SIGINT", "SIGTERM"]) {
  process.on(forward, () => {
    child.kill(forward);
  });
}
