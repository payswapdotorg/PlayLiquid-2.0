/**
 * PlayLiquid host — bootstrap (the `--require` entry point).
 *
 * Loaded into the Electron main process through:
 *
 *   NODE_OPTIONS="--require <repo>/apps/domain-workspace-host/src/bootstrap.cjs"
 *
 * …which the upstream dev pipeline forwards untouched to the Electron
 * binary (`...process.env` passthrough — verified upstream fact). Zero
 * upstream source files change to get us here.
 *
 * The hard part: `require("electron")` THROWS during the --require phase
 * (the module is only available once the app entry starts). So instead of
 * requiring it, we hook `Module._load` exactly once and capture the module
 * from upstream's own CJS require chain (its electron-updater import is the
 * first to pull it in) — before any window exists. Then we hand off to
 * install.cjs and vanish.
 *
 * Guards:
 *   - no-op unless this is the Electron MAIN process (node children, the
 *     HOST utilityProcess and the scheduler all inherit NODE_OPTIONS too);
 *   - no-op when ZCODE_DOMAIN_WORKSPACE_DISABLE is set;
 *   - restores Module._load immediately after capture (one-shot hook);
 *   - never throws: a broken host must never break the upstream app.
 */

"use strict";

(function bootstrapPlayLiquidHost() {
  try {
    // ---- process gating -------------------------------------------------
    if (!process.versions || !process.versions.electron) return; // plain node child
    if (process.type === "renderer" || process.type === "utility") return;

    const config = require("./config.cjs");
    if (process.env[config.ENV.disable]) {
      console.log("[playliquid] host disabled via", config.ENV.disable);
      return;
    }

    if (process.__playliquidHostBootstrap) return; // idempotent
    process.__playliquidHostBootstrap = true;

    // ---- one-shot require-hook capture ----------------------------------
    const Module = require("node:module");
    const originalLoad = Module._load;
    let installed = false;

    const patchedLoad = function (request, parent, isMain) {
      const exports = originalLoad.apply(this, [request, parent, isMain]);
      if (request === "electron" && !installed && exports && exports.app) {
        installed = true;
        Module._load = originalLoad; // one-shot: restore immediately
        try {
          const { installHost } = require("./install.cjs");
          installHost(exports.app);
        } catch (error) {
          console.warn(
            "[playliquid] host install failed (upstream app continues):",
            error && error.stack ? error.stack.split("\n").slice(0, 4).join("\n") : error,
          );
        }
      }
      return exports;
    };

    Module._load = patchedLoad;
    console.log(
      `[playliquid] host bootstrap armed (baseline ${config.BASELINE_COMMIT.slice(0, 7)}, ` +
        `mode ${config.HOST_MODE})`,
    );
  } catch (error) {
    // Absolute last resort: never take the upstream app down with us.
    console.warn("[playliquid] bootstrap error (ignored):", error && error.message);
  }
})();
