/**
 * PlayLiquid host — installation.
 *
 * Runs once per Electron main process, after the `electron` module has been
 * captured (see bootstrap.cjs). Responsibilities:
 *
 *   1. install the gated appVersion shim (raw-electron dev launches only);
 *   2. watch for the primary workbench window (URL-shape filter — no
 *      upstream state is consulted);
 *   3. attach the host layer to it (two additive WebContentsViews);
 *   4. optionally run the automated switch + evidence-capture harness
 *      (ZCODE_DOMAIN_WORKSPACE_AUTOSWITCH=1) used for QA runs under Xvfb.
 */

"use strict";

const path = require("node:path");
const { mkdirSync, writeFileSync } = require("node:fs");

const config = require("./config.cjs");
const { installAppVersionShim } = require("./shims/appVersion.cjs");
const { watchForPrimaryWindow } = require("./windowFilter.cjs");
const { attach } = require("./attachment.cjs");

/** Repo root = three levels above this file (src → host → apps → root). */
function repoRoot() {
  return path.dirname(path.dirname(path.dirname(__filename)));
}

/**
 * @param {Electron.App} app
 * @returns {() => void} disposer (never needed in practice — the host lives
 *                       as long as the process)
 */
function installHost(app) {
  installAppVersionShim(app);

  let attachment = null;

  const stopWatching = watchForPrimaryWindow(app, (win) => {
    if (attachment) return; // exactly one primary window per process
    attachment = attach(win);
    console.log(
      `[playliquid] host attached to primary window #${win.id} ` +
        `(mode=${config.HOST_MODE}, switcher at ` +
        `${config.SWITCHER_GEOMETRY.x},${config.SWITCHER_GEOMETRY.y})`,
    );
    if (process.env[config.ENV.autoswitch]) {
      void runAutoswitchHarness(win, attachment);
    }
  });

  return () => {
    stopWatching();
    if (attachment) attachment.dispose();
  };
}

/* ----------------------------------------------------------------autoswitch */

/**
 * Automated QA run: settle → switch to domain → settle → switch back →
 * settle, capturing every settled state. Used for evidence generation under
 * Xvfb (software rendering); completely inert without the env switch.
 *
 * @param {Electron.BrowserWindow} win
 * @param {ReturnType<typeof attach>} hostAttachment
 */
async function runAutoswitchHarness(win, hostAttachment) {
  const timings = config.AUTOSWITCH_TIMINGS;
  const outDir =
    process.env[config.ENV.evidenceDir] ||
    path.join(repoRoot(), "docs", "qa", "evidence");
  mkdirSync(outDir, { recursive: true });

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const captureWindow = () => win.webContents.capturePage();
  const captureDomain = () =>
    hostAttachment.domainView.webContents.capturePage();

  console.log(`[playliquid] autoswitch harness running; evidence -> ${outDir}`);

  try {
    await sleep(timings.initialSettleMs);

    // 01 — initial state: the untouched upstream workbench (startup splash).
    await savePng(outDir, "evidence-01-initial-zcode-splash.png", await captureWindow());

    // Switch general → domain.
    hostAttachment.request("next");
    await sleep(timings.domainSettleMs);

    // 02 — the domain workspace active (its own view).
    await savePng(outDir, "evidence-02-domain-active.png", await captureDomain());

    // 03 — the upstream webContents while covered (occlusion-paused paint).
    await savePng(outDir, "evidence-03-zcode-covered.png", await captureWindow());

    // Switch domain → general.
    hostAttachment.request("previous");
    await sleep(timings.restoredSettleMs);

    // 04 — the domain view parked offscreen: still alive, state intact.
    await savePng(outDir, "evidence-04-domain-parked.png", await captureDomain());

    // 05 — the original workspace restored exactly where it was.
    await savePng(outDir, "evidence-05-zcode-restored.png", await captureWindow());

    // 06 — the switcher cluster at its exact configured geometry.
    const g = config.SWITCHER_GEOMETRY;
    const full = await captureWindow();
    await savePng(
      outDir,
      "evidence-06-switcher-cluster.png",
      full.crop({
        x: g.x - 24,
        y: Math.max(0, g.y - 10),
        width: Math.min(g.width + 48, full.getSize().width),
        height: Math.min(g.height + 26, full.getSize().height),
      }),
    );

    console.log("[playliquid] autoswitch harness complete.");
  } catch (error) {
    console.warn(
      "[playliquid] autoswitch harness failed:",
      error && error.message,
    );
  }
}

/** @param {string} dir @param {string} name @param {Electron.NativeImage} image */
async function savePng(dir, name, image) {
  writeFileSync(path.join(dir, name), image.toPNG());
}

module.exports = { installHost };
