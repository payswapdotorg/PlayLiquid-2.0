/**
 * PlayLiquid host — gated runtime shims.
 *
 * Raw-electron (unpackaged) dev launches crash inside upstream's
 * electron-updater import chain because `app.getVersion()` does not answer a
 * usable semver there. macOS dev wraps a real .app bundle (with a real
 * version) and is unaffected; packaged builds always have a real version.
 *
 * The shim is strictly gated:
 *   - raw launch (process.defaultApp) AND
 *   - current version fails a minimal semver check
 *   → patch app.getVersion to answer the version recorded in the repo's
 *     root package.json (falling back to a pinned constant).
 *
 * It logs exactly one line when it activates, and never throws.
 */

"use strict";

const { readFileSync } = require("node:fs");
const { dirname, join } = require("node:path");

const FALLBACK_VERSION = "3.17.2";
const SEMVER_RE = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

/** @param {string} v */
function isValidSemver(v) {
  return typeof v === "string" && SEMVER_RE.test(v.trim());
}

/** Repo root = four levels above this file (src/shims → host → apps → root). */
function repoRoot() {
  return dirname(dirname(dirname(dirname(__filename))));
}

function readRepoVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(repoRoot(), "package.json"), "utf8"));
    if (isValidSemver(pkg.version)) return pkg.version;
  } catch {
    /* fall through to pinned fallback */
  }
  return FALLBACK_VERSION;
}

/**
 * Install the gated app.getVersion shim.
 * @param {Electron.App} app
 * @returns {boolean} true when the shim activated
 */
function installAppVersionShim(app) {
  try {
    if (!process.defaultApp) return false;
    const current = app.getVersion();
    if (isValidSemver(current)) return false;
    const replacement = readRepoVersion();
    const original = app.getVersion.bind(app);
    app.getVersion = () => replacement;
    process.nextTick(() => {
      // One auditable line — never spam the upstream dev console.
      console.log(
        `[playliquid] appVersion shim active (raw-electron dev launch): ` +
          `${JSON.stringify(original())} -> ${replacement}`,
      );
    });
    return true;
  } catch (error) {
    console.warn("[playliquid] appVersion shim skipped:", error && error.message);
    return false;
  }
}

module.exports = { installAppVersionShim, isValidSemver };
