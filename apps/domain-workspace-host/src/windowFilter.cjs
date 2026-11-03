/**
 * PlayLiquid host — primary window identification.
 *
 * The upstream app creates many BrowserWindows (update status, about dialog,
 * resource manager, CUA panels …). The ONE window the host may attach to is
 * the primary workbench window. It is identifiable purely by URL shape —
 * no upstream code, state, or private API is consulted.
 *
 * Verified facts (see docs/handoff/how-to-add-workspaces-safely.md):
 *   - the primary window loads the "index" page (dev: the vite dev-server
 *     root; prod: out/renderer/index.html),
 *   - it carries no `windowKind` query param (upstream marks auxiliary
 *     windows with such params),
 *   - it is top-level (no parent), and resizable.
 */

"use strict";

/** @param {string} url */
function stripQuery(url) {
  const q = url.indexOf("?");
  return q === -1 ? url : url.slice(0, q);
}

/** @param {string} url */
function hasWindowKindParam(url) {
  return /[?&]windowKind=/.test(url);
}

/**
 * @param {Electron.BrowserWindow} win
 * @returns {boolean}
 */
function isPrimaryWorkbenchWindow(win) {
  if (!win || win.isDestroyed()) return false;
  if (typeof win.getParentWindow === "function" && win.getParentWindow()) return false;
  try {
    if (!win.isResizable()) return false;
  } catch {
    return false;
  }
  const wc = win.webContents;
  if (!wc || wc.isDestroyed()) return false;

  const raw = wc.getURL() || "";
  if (!raw) return false;
  if (hasWindowKindParam(raw)) return false;

  const url = stripQuery(raw);
  const isDevRoot = /^https?:\/\/[^/]+\/?$/.test(url);
  const isFileIndex = /\/out\/renderer\/index\.html$/.test(url);
  return isDevRoot || isFileIndex;
}

/**
 * Watch for the primary window appearing (or having appeared).
 *
 * @param {Electron.App} app
 * @param {(win: Electron.BrowserWindow) => void} onPrimary
 * @returns {() => void} disposer
 */
function watchForPrimaryWindow(app, onPrimary) {
  const { BrowserWindow } = require("electron");
  const seen = new Set();

  const consider = (win) => {
    if (!win || seen.has(win.id)) return;
    // URL may still be blank right at creation; re-check on each navigation
    // settle and once the window finishes loading.
    if (isPrimaryWorkbenchWindow(win)) {
      seen.add(win.id);
      onPrimary(win);
    }
  };

  const scanExisting = () => {
    for (const win of BrowserWindow.getAllWindows()) consider(win);
  };

  const onWindowCreated = (_event, win) => {
    if (!win) return;
    const wc = win.webContents;
    if (!wc) return;
    consider(win);
    const retry = () => {
      if (!wc.isDestroyed()) consider(win);
    };
    wc.once("did-finish-load", retry);
    wc.once("dom-ready", retry);
    wc.on("did-navigate", retry);
  };

  const onReady = () => {
    scanExisting();
    app.on("browser-window-created", onWindowCreated);
  };
  if (app.isReady()) onReady();
  else app.once("ready", onReady);

  return () => {
    app.removeListener("browser-window-created", onWindowCreated);
  };
}

module.exports = { isPrimaryWorkbenchWindow, watchForPrimaryWindow };
