/**
 * PlayLiquid host — the domain workspace WebContentsView.
 *
 * The view is created once per primary window and parked offscreen to the
 * right (x = content width). It is NEVER destroyed while the window lives:
 * "hidden" means "parked", exactly mirroring the upstream browser panel's
 * hide-don't-unmount semantics (packages/ui/src/browser-use — see the W1
 * architecture map).
 */

"use strict";

const path = require("node:path");
const { WebContentsView } = require("electron");

const RENDERER_DIR = path.join(__dirname, "renderer");
const DOMAIN_PRELOAD = path.join(__dirname, "..", "..", "preload", "domainPreload.cjs");

/** Dedicated, non-persistent partition: no cookies/storage shared with the app UI. */
const SESSION_PARTITION = "playliquid-domain";

/**
 * @param {Electron.BrowserWindow} win — the primary upstream window.
 * @returns {{ view: Electron.WebContentsView, load: () => Promise<void>, boundsFor: (position: number) => Electron.Rectangle }}
 */
function createDomainWorkspace(win) {
  const view = new WebContentsView({
    webPreferences: {
      preload: DOMAIN_PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      sandbox: true,
      backgroundThrottling: false,
      session: require("electron").session.fromPartition(SESSION_PARTITION),
    },
  });

  const contentSize = () => {
    const [w, h] = win.getContentSize();
    return { width: Math.max(1, w), height: Math.max(1, h) };
  };

  /**
   * Bounds for a slide position:
   *   position 0 → parked fully offscreen to the right (x = width)
   *   position 1 → covering the whole content area (x = 0)
   * @param {number} position ∈ [0,1]
   */
  const boundsFor = (position) => {
    const { width, height } = contentSize();
    const x = Math.round(width * (1 - position));
    return { x, y: 0, width, height };
  };

  const load = async () => {
    await view.webContents.loadFile(path.join(RENDERER_DIR, "index.html"));
  };

  return { view, load, boundsFor, contentSize };
}

module.exports = { createDomainWorkspace, SESSION_PARTITION };
