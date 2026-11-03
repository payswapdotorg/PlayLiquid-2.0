/**
 * PlayLiquid — preload for the domain workspace WebContentsView.
 *
 * Exposes `window.playliquidDomain`: host state + "switch back" intent.
 * The domain surface has no access to the upstream bridge (`window.zcode`),
 * no node integration, and runs in its own session partition.
 */

"use strict";

const { contextBridge, ipcRenderer } = require("electron");
const { IPC } = require("../config.cjs");

contextBridge.exposeInMainWorld("playliquidDomain", {
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
