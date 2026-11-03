/**
 * PlayLiquid host — workspace navigation state machine.
 *
 * Owns the ordered workspace list (registry order) and the active index.
 * The attachment layer subscribes to navigation events and performs the
 * cover-slide. Navigation state is deliberately tiny: the *interesting*
 * state (tasks, terminal, browser, composer) lives where it always lived —
 * inside each workspace — and is never touched by switching.
 */

"use strict";

const { WORKSPACES } = require("../config.cjs");
const { createWorkspaceRegistry } = require("../workspaces/registry.cjs");

/**
 * @typedef {import("../workspaces/registry.cjs").WorkspaceEntry} WorkspaceEntry
 */

function createWorkspaceNavigation() {
  const registry = createWorkspaceRegistry();

  let activeIndex = 0; // general (ZCode) is the resting workspace
  const listeners = new Set();

  const state = () => ({
    workspaces: registry.describe(),
    activeIndex,
    activeId: registry.get(activeIndex).id,
    canGoBack: activeIndex > 0,
    canGoForward: activeIndex < registry.size() - 1,
  });

  const emit = (event) => {
    for (const listener of listeners) {
      try {
        listener(event, state());
      } catch (error) {
        console.warn("[playliquid] navigation listener failed:", error && error.message);
      }
    }
  };

  return {
    registry,

    /** Snapshot for IPC consumers (renderer views, review console). */
    snapshot: state,

    /**
     * Request a relative move. Returns the navigation event or null when the
     * move is a no-op (already at the requested end).
     * @param {"previous" | "next"} direction
     */
    request(direction) {
      const delta = direction === "next" ? 1 : -1;
      const to = activeIndex + delta;
      if (to < 0 || to >= registry.size()) return null;
      return this.requestIndex(to);
    },

    /**
     * Request an absolute move.
     * @param {number} index
     */
    requestIndex(index) {
      if (index === activeIndex) return null;
      if (index < 0 || index >= registry.size()) return null;
      const from = activeIndex;
      activeIndex = index;
      const event = {
        type: "switch",
        from,
        to: index,
        fromId: registry.get(from).id,
        toId: registry.get(index).id,
        direction: index > from ? "next" : "previous",
      };
      emit(event);
      return event;
    },

    /** @param {(event: object, state: object) => void} listener */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

module.exports = { createWorkspaceNavigation };
