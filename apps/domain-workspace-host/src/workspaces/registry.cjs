/**
 * PlayLiquid host — workspace registry.
 *
 * Milestone 1 registers exactly two workspaces, by design and by the
 * engagement's scope rule ("registry: general | domain — don't over-engineer"):
 *
 *   general — the unmodified upstream ZCode workbench. No factory: the
 *             upstream webContents IS the workspace; the host never creates,
 *             destroys, reloads, or resizes it.
 *   domain  — the PlayLiquid domain workspace, rendered by the host's own
 *             WebContentsView from apps/domain-workspace-host renderer files.
 */

"use strict";

const { WORKSPACES } = require("../config.cjs");

/**
 * @typedef {Object} WorkspaceEntry
 * @property {string} id
 * @property {string} title
 * @property {() => unknown} [createView] absence marks the upstream workspace
 */

function createWorkspaceRegistry() {
  const entries = WORKSPACES.map((entry) => ({ ...entry }));

  return {
    /** @returns {WorkspaceEntry} */
    get(index) {
      return entries[index];
    },

    size() {
      return entries.length;
    },

    byId(id) {
      return entries.find((entry) => entry.id === id) ?? null;
    },

    /** Serializable description for renderer views. */
    describe() {
      return entries.map((entry, index) => ({
        id: entry.id,
        title: entry.title,
        index,
        origin: entry.id === "general" ? "upstream-zcode" : "playliquid-host",
      }));
    },
  };
}

module.exports = { createWorkspaceRegistry };
