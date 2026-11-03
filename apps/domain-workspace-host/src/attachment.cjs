/**
 * PlayLiquid host — attachment layer.
 *
 * Everything the host does to a primary window happens here, and it is all
 * additive: two WebContentsViews are added as children of the window's
 * contentView. The upstream webContents (the base view) is never destroyed,
 * reloaded, or resized — the domain view *covers* it (host mode
 * "cover-slide") and is *parked offscreen* when hidden.
 *
 * Views:
 *   domainView   — full content area; parked at x = contentWidth when hidden.
 *   switcherView — 64×32 in the structurally empty top-left titlebar band
 *                  (beside the Z logo, after the upstream task-history
 *                  arrows). Always visible, always interactive.
 */

"use strict";

const path = require("node:path");
const { WebContentsView, ipcMain } = require("electron");

const config = require("./config.cjs");
const { SlideTransition } = require("./transitions/slideTransition.cjs");
const { createWorkspaceNavigation } = require("./navigation/workspaceNavigation.cjs");
const { createDomainWorkspace } = require("./workspaces/domain/domainWorkspace.cjs");

const SWITCHER_DIR = path.join(__dirname, "navigation", "switcher");
const SWITCHER_PRELOAD = path.join(__dirname, "preload", "switcherPreload.cjs");

/** @param {Electron.BrowserWindow} win */
function attach(win) {
  if (win.__playliquidHostAttached) return;
  win.__playliquidHostAttached = true;

  const navigation = createWorkspaceNavigation();
  const reducedMotion = prefersReducedMotion();
  const slide = new SlideTransition({ reducedMotion });

  const domain = createDomainWorkspace(win);
  const switcherView = new WebContentsView({
    webPreferences: {
      preload: SWITCHER_PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  win.contentView.addChildView(domain.view);
  win.contentView.addChildView(switcherView); // added last → topmost

  /* ------------------------------------------------------- geometry */

  const layout = () => {
    const g = config.SWITCHER_GEOMETRY;
    switcherView.setBounds({ x: g.x, y: g.y, width: g.width, height: g.height });
    // Domain bounds are driven by the slide position; snap when at rest.
    if (!slide.transitioning) {
      domain.view.setBounds(domain.boundsFor(slide.position));
    }
  };

  const syncDomainBounds = (position) => {
    domain.view.setBounds(domain.boundsFor(position));
  };

  layout();

  /* -------------------------------------------------- IPC (disjoint ns) */

  const stateForViews = () => ({
    ...navigation.snapshot(),
    hostMode: config.HOST_MODE,
    baseline: config.BASELINE_COMMIT.slice(0, 7),
    transition: `${config.TRANSITION.durationMs}ms ease-out cubic \u00b7 horizontal`,
    transitioning: slide.transitioning,
  });

  const broadcast = () => {
    const state = stateForViews();
    for (const wc of [domain.view.webContents, switcherView.webContents]) {
      if (wc && !wc.isDestroyed()) wc.send(config.IPC.stateChanged, state);
    }
  };

  const handleGetState = async () => stateForViews();

  const handleSwitch = (event, direction) => {
    if (typeof direction !== "string") return;
    if (event.sender !== domain.view.webContents && event.sender !== switcherView.webContents) {
      return; // only the host's own views may navigate
    }
    navigation.request(direction === "next" ? "next" : "previous");
  };

  ipcMain.handle(config.IPC.getState, handleGetState);
  ipcMain.on(config.IPC.switchWorkspace, handleSwitch);

  /* ------------------------------------------------------ transitions */

  navigation.subscribe((event) => {
    const target = event.to === 0 ? 0 : 1;
    slide.slide(target, syncDomainBounds, () => {
      // Parked (0): make sure the upstream window re-takes keyboard focus.
      if (target === 0 && !win.isDestroyed()) {
        try {
          win.webContents.focus();
        } catch {
          /* window may be mid-teardown */
        }
      }
      broadcast();
    });
    broadcast();

    if (target === 1) {
      try {
        domain.view.webContents.focus();
      } catch {
        /* view may not be focusable yet */
      }
    }
  });

  /* --------------------------------------------------- window lifecycle */

  const relayoutEvents = [
    "resize",
    "maximize",
    "unmaximize",
    "enter-full-screen",
    "leave-full-screen",
  ];
  const onRelayout = () => layout();
  for (const name of relayoutEvents) win.on(name, onRelayout);

  const dispose = () => {
    for (const name of relayoutEvents) win.removeListener(name, onRelayout);
    ipcMain.removeHandler(config.IPC.getState);
    ipcMain.removeListener(config.IPC.switchWorkspace, handleSwitch);
    slide.cancel();
    try {
      if (!win.isDestroyed()) {
        win.contentView.removeChildView(domain.view);
        win.contentView.removeChildView(switcherView);
      }
    } catch {
      /* window already gone */
    }
    try { domain.view.webContents.close(); } catch { /* already closed */ }
    try { switcherView.webContents.close(); } catch { /* already closed */ }
  };

  win.once("closed", dispose);

  /* ------------------------------------------------------------- load */

  void switcherView.webContents
    .loadFile(path.join(SWITCHER_DIR, "index.html"))
    .then(broadcast)
    .catch((error) => {
      console.warn("[playliquid] switcher view failed to load:", error && error.message);
    });

  void domain.load()
    .then(broadcast)
    .catch((error) => {
      console.warn("[playliquid] domain view failed to load:", error && error.message);
    });

  return {
    navigation,
    domainView: domain.view,
    switcherView,
    state: stateForViews,
    broadcast,
    /** Programmatic switch (autoswitch harness). */
    request: (direction) => navigation.request(direction),
    dispose,
  };
}

/** Reduced-motion preference from the OS (main-process side). */
function prefersReducedMotion() {
  try {
    const { nativeTheme } = require("electron");
    return Boolean(nativeTheme && nativeTheme.shouldReduceMotion);
  } catch {
    return false;
  }
}

module.exports = { attach };
