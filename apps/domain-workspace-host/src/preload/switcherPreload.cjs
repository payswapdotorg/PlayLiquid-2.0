/**
 * PlayLiquid — preload for the switcher WebContentsView.
 *
 * Exposes exactly one tiny, namespaced bridge (`window.playliquidSwitcher`)
 * over the disjoint `zcode-domain-workspace:*` IPC channels. Nothing of the
 * upstream `window.zcode` surface is reachable from here.
 */

"use strict";

const { contextBridge, ipcRenderer } = require("electron");
const { IPC } = require("../config.cjs");

contextBridge.exposeInMainWorld("playliquidSwitcher", {
  /** @returns {Promise<object>} navigation + host snapshot */
  getState: () => ipcRenderer.invoke(IPC.getState),

  /** @param {"previous" | "next"} direction */
  switchWorkspace: (direction) => {
    ipcRenderer.send(IPC.switchWorkspace, direction);
  },

  /**
   * Subscribe to host state changes.
   * @param {(state: object) => void} callback
   * @returns {() => void} disposer
   */
  onStateChanged: (callback) => {
    const listener = (_event, state) => {
      try {
        callback(state);
      } catch {
        /* renderer-side rendering errors must never propagate to main */
      }
    };
    ipcRenderer.on(IPC.stateChanged, listener);
    return () => ipcRenderer.removeListener(IPC.stateChanged, listener);
  },
});
