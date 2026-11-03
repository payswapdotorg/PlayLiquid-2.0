/**
 * RW-003 packaged-app smoke harness — configuration and check constants.
 *
 * Zero npm dependencies: Node >= 22 (built-in fetch + WebSocket). The harness
 * drives the PACKAGED Linux application (AppImage / installed .deb binary)
 * under Xvfb via the Chrome DevTools Protocol — it never touches a dev
 * server, repo-relative renderer files or dev-only env vars.
 *
 * Everything product-specific lives here so the same harness can be re-run
 * by the TL on the re-branded artifact without code changes (see README).
 */

import { resolve } from "node:path";

/**
 * UNIFIED-SHELL DECISION (TL handoff §2, docs/handoff/
 * PLAYLIQUID-TRANSFORMATION-HANDOFF.md): this product deliberately has NO
 * separate "GameOS product shell". Milestone-1's second-workspace host was
 * retired (`tl/remove-domain-workspace-host`), so the shipped application is
 * the UNIFIED PlayLiquid-branded ZCode workbench — boot → welcome/login →
 * auth (or skip) → 3-step onboarding → workspace composer — and PlayLiquid
 * Console is a SIDE-PANE TAB opened through the New Tab launcher's fifth
 * entry (worker-b, docs/product/NEW-TAB-CONSOLE-CONTRACT.md).
 *
 * The marker vocabulary below therefore describes THAT journey (verified live
 * against the packaged artifact via CDP; selectors confirmed in source):
 * - boot: document.title "PlayLiquid", body "Welcome to PlayLiquid",
 *   "Connect your account to start using PlayLiquid", buttons "Connect to
 *   Z.ai" / "Connect to BigModel" / "Use API key";
 * - auth skip: "Use API key" → dialog ("Continue" / "Cancel" / "Skip for
 *   now") → "Skip for now";
 * - onboarding: "What do you do?" → "Software / Data / AI" → "Next" →
 *   "Choose your UI mode" → "Coding mode" → "Next" → "Personalize your work
 *   assistant" → "Skip" (fallback "Next"/"Get started");
 * - workspace: composer placeholder "Ask PlayLiquid anything, @ to add
 *   context, / for commands or capabilities" (aria-placeholder on the
 *   contenteditable), "Select project", sidebar "New task" / "Automations" /
 *   "Plugin Marketplace" (+ "Tasks" / "Projects");
 * - side pane + New Tab launcher: [data-testid=side-pane-toggle] (aria-label
 *   "Expand side pane") → [data-side-pane-add-tab-trigger] (aria-label
 *   "Add tab") → rows [data-side-pane-open-tab-item] = files, browser,
 *   terminal, review, playliquid-console (optional sites /
 *   selection-side-conversation / developer-tools rows are NOT required);
 * - PlayLiquid Console tab: [data-playliquid-console-pane] with header
 *   "PlayLiquid Console", status line containing "registry open", badge
 *   "services live", workbench text "World projects";
 * - window chrome: [data-testid=window-control-minimize|maximize|close] with
 *   aria-labels "Minimize window" / "Maximize or restore window" /
 *   "Close window", plus [data-testid=task-settings-button].
 *
 * The reference repository's GameOS shell testids (gameos-nav-studio etc.)
 * and Studio/Lab/Community surface markers are NOT part of this product and
 * were removed from the harness together with their checks.
 */
export const PRODUCT_MARKERS = Object.freeze({
  productName: "PlayLiquid GameOS",
  /** The packaged main window's document.title (verified live at boot). */
  windowTitle: "PlayLiquid",
  welcomeHeading: "Welcome to PlayLiquid",
  welcomeSubline: "Connect your account to start using PlayLiquid",
  /** The API-key entry button on the welcome/login surface. */
  apiKeyEntry: "Use API key",
  /** The auth dialog's skip control (skips account connection). */
  skipLabel: "Skip for now",
  /** The 3-step first-run onboarding wizard (verified live). */
  onboarding: Object.freeze({
    stepTitles: Object.freeze([
      "What do you do?",
      "Choose your UI mode",
      "Personalize your work assistant",
    ]),
    occupationOption: "Software / Data / AI",
    uiModeOption: "Coding mode",
    nextLabel: "Next",
    /** The wizard's general skip control (present on every step). */
    skipLabel: "Skip",
    /** The preferences step's continue control (fallback after Skip/Next). */
    startLabel: "Get started",
  }),
  /** The workspace composer placeholder prefix (aria-placeholder). */
  composerPlaceholderPrefix: "Ask PlayLiquid",
  /** The composer's workspace trigger label on a fresh New Task. */
  selectProject: "Select project",
  /** Sidebar labels required on the workspace surface (primary three). */
  sidebarLabels: Object.freeze(["New task", "Automations", "Plugin Marketplace"]),
  /** Additional sidebar labels recorded as evidence, never required. */
  extraSidebarLabels: Object.freeze(["Tasks", "Projects"]),
});

/** The unified-shell marker vocabulary (side pane, New Tab launcher,
 * PlayLiquid Console tab, window chrome). Selectors verified live against
 * the packaged artifact and in packages/ui + @playliquid/gameos source. */
export const SHELL_MARKERS = Object.freeze({
  /** [data-testid] of the side pane expand/collapse toggle. */
  sidePaneToggle: "side-pane-toggle",
  sidePaneToggleExpandLabel: "Expand side pane",
  sidePaneToggleCollapseLabel: "Collapse side pane",
  /** Selector of the New Tab launcher trigger inside the pane header. */
  addTabTrigger: "[data-side-pane-add-tab-trigger]",
  addTabLabel: "Add tab",
  /** Attribute carrying the launcher row id on each New Tab option. */
  launcherItemAttr: "data-side-pane-open-tab-item",
  /** The five BUILT-IN launcher entries, in the product's canonical order
   * (packages/ui/src/app-shell/animatedSidePanePanelModel.ts: files,
   * browser, terminal, review, playliquid-console). */
  expectedLauncherIds: Object.freeze(["files", "browser", "terminal", "review", "playliquid-console"]),
  /** Conditional launcher entries that MAY appear after the built-ins —
   * recorded when present, never required. */
  optionalLauncherIds: Object.freeze(["sites", "selection-side-conversation", "developer-tools"]),
  /** Attribute carrying the tab id on each rendered side-pane tab. */
  tabIdAttr: "data-side-pane-tab-id",
  /** The PlayLiquid Console pane root selector (worker-b contract). */
  consolePaneSelector: "[data-playliquid-console-pane]",
  /** Text markers the rendered Console surface must carry. */
  consoleMarkers: Object.freeze(["PlayLiquid Console", "World projects"]),
  /** Console status facts recorded as evidence (registryOpen is required). */
  consoleStatusMarkers: Object.freeze(["registry open", "services live"]),
  /** [data-testid] of the workspace Settings control (sidebar footer). */
  taskSettingsButton: "task-settings-button",
  /** The window-controls container [data-testid]. */
  windowControlsContainer: "desktop-window-controls",
  /** Stable [data-testid]s of the three platform window controls. */
  windowControlTestids: Object.freeze([
    "window-control-minimize",
    "window-control-maximize",
    "window-control-close",
  ]),
  /** The window-control accessible names as historically listed in this
   * config (kept unchanged for workflow compatibility). NOTE: the real
   * product renders ONE combined maximize/restore control whose aria-label
   * is "Maximize or restore window" (packages/ui/src/DesktopWindowControls
   * .tsx, i18n titleBar.window.*); the checks therefore locate the controls
   * by their stable testids (windowControlTestids) and record the observed
   * aria-labels per run instead of matching against this legacy list. */
  windowControlLabels: Object.freeze(["Minimize window", "Maximize window", "Restore window", "Close window"]),
});

/** Viewports mandated by AGENTS.md (UI evidence standard). */
export const VIEWPORTS = Object.freeze({
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
});

/** The desktop main window enforces minWidth 480 / minHeight 640
 * (packages/desktop/src/main/desktopWindowSize.ts). A 390-px OS window is
 * therefore impossible without changing the product; the 390x844 viewport is
 * captured with CDP device-metrics emulation instead (documented honestly). */
export const WINDOW_MIN_WIDTH = 480;

export const DEFAULTS = Object.freeze({
  cdpPort: 9333,
  /** The offline scenario gets its own CDP port (main port + 1): a second
   * Chromium cannot bind a port the previous instance may still hold, and it
   * then silently starts WITHOUT remote debugging — observed on the station. */
  offlineCdpPortOffset: 1,
  portFreeTimeoutMs: 30_000,
  display: ":89",
  displayCandidates: [":89", ":88", ":87", ":86", ":85", ":84", ":83", ":82", ":81", ":80"],
  xvfbScreen: "1920x1080x24",
  cdpReadyTimeoutMs: 180_000,
  renderSettleTimeoutMs: 90_000,
  shutdownTimeoutMs: 30_000,
  offlineObserveMs: 30_000,
  memRequiredMb: 600,
  memWaitMs: 120_000,
  memWaitMaxMs: 20 * 60_000,
  /** PLX-REL-001: how long to wait for the first product surface (the
   * welcome/login gate — or, defensively, the workspace composer) after the
   * DOM settles. The packaged app's first-run preparation ("Finishing
   * startup": agent-runtime + search-tool staging) legitimately takes
   * 60–120 s on cold CI runners, and the loading screen's DOM is stable, so
   * the render-settle heuristic alone returns early. Generous on purpose:
   * this is a WAIT for real product behavior, not a benchmark. */
  shellReadyTimeoutMs: 180_000,
  shellReadyPollMs: 3_000,
  /** Unified-shell journey: per-step wait. Fresh onboarding can take ~20 s
   * on slow runners (the previous harness allowed 180 s for shell markers);
   * every journey step polls at journeyStepPollMs until its state predicate
   * holds or this budget expires — generous waits, never fixed sleeps. */
  journeyStepTimeoutMs: 60_000,
  journeyStepPollMs: 1_500,
  /** Fast UI-state waits (pane expansion, launcher render, tab appearance). */
  uiStateTimeoutMs: 20_000,
  uiStatePollMs: 500,
});

/**
 * Checks whose failure is EXPECTED on a pre-integration baseline artifact.
 *
 * The unified-shell vocabulary above describes the REAL shipped product
 * (transformation main, `42b23514`): every check in this battery asserts
 * behavior that already exists in the packaged artifact, so there are no
 * expected baseline failures any more. The list is therefore EMPTY. The
 * `--baseline-expectations` flag remains functional (it annotates exactly
 * the ids listed here and excludes only those from the exit-code
 * calculation), so existing workflow invocations keep working — with an
 * empty list it is a documented no-op that never rewrites an observed
 * status. The old list covered the reference repo's GameOS shell contract
 * checks (gameos-empty-state, workbench-escape-hatch, Studio/Lab/Community
 * surfaces), which no longer exist in this product and were deleted.
 */
export const BASELINE_EXPECTED_FAILURES = Object.freeze([]);

export function usage() {
  return [
    "usage: node qa/desktop-release/scripts/run-smoke.mjs --artifact <AppImage|executable>",
    "  [--deb <file.deb>] [--sums <SHA256SUMS>] [--out <dir>] [--cdp-port <n>]",
    "  [--display <:89>] [--expected-title <string>] [--baseline-expectations]",
    "  [--skip-offline] [--help]",
    "",
    "Environment alternatives: QA_RELEASE_ARTIFACT, QA_RELEASE_DEB, QA_RELEASE_SUMS.",
    "--baseline-expectations annotates (does not hide) expected baseline failures and",
    "excludes ONLY those from the exit-code calculation; the unified-shell battery has",
    "no expected failures (BASELINE_EXPECTED_FAILURES is empty), so the flag is a",
    "documented compatibility no-op.",
  ].join("\n");
}

export function parseArgs(argv) {
  const out = {
    artifact: process.env.QA_RELEASE_ARTIFACT ?? null,
    deb: process.env.QA_RELEASE_DEB ?? null,
    sums: process.env.QA_RELEASE_SUMS ?? null,
    out: null,
    cdpPort: DEFAULTS.cdpPort,
    display: DEFAULTS.display,
    expectedTitle: null,
    baselineExpectations: false,
    skipOffline: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`missing value for ${arg}`);
      return argv[i];
    };
    switch (arg) {
      case "--artifact":
        out.artifact = next();
        break;
      case "--deb":
        out.deb = next();
        break;
      case "--sums":
        out.sums = next();
        break;
      case "--out":
        out.out = next();
        break;
      case "--cdp-port":
        out.cdpPort = Number.parseInt(next(), 10);
        break;
      case "--display":
        out.display = next();
        break;
      case "--expected-title":
        out.expectedTitle = next();
        break;
      case "--baseline-expectations":
        out.baselineExpectations = true;
        break;
      case "--skip-offline":
        out.skipOffline = true;
        break;
      case "--help":
      case "-h":
        out.help = true;
        break;
      default:
        throw new Error(`unknown argument: ${arg}`);
    }
  }
  if (!out.help && !out.artifact) {
    throw new Error("no artifact given: pass --artifact <path> or set QA_RELEASE_ARTIFACT");
  }
  if (!out.help && out.artifact) {
    // The launcher spawns the app from a NEUTRAL cwd (the clean-profile
    // home, like a real desktop user), so relative --artifact/--deb/--sums/
    // --out paths would not resolve at spawn time (observed live: release
    // run 38673153333, spawn ENOENT on a relative release-out/... path).
    // Resolve every path ONCE, here, before any consumer sees it.
    out.artifact = resolve(out.artifact);
    if (!out.sums) {
      // Auto-detect a sibling SHA256SUMS next to the artifact (convention of
      // the release workflow); absence is recorded, never fatal.
      out.sums = `${out.artifact.replace(/\/[^/]*$/, "")}/SHA256SUMS`;
    }
    out.deb = out.deb === null ? null : resolve(out.deb);
    out.sums = resolve(out.sums);
    out.out = out.out === null ? null : resolve(out.out);
  }
  return out;
}
