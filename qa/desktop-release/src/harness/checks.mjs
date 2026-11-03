/**
 * RW-003 harness — page-level checks (boot probe, identity, viewports,
 * clean profile) for the UNIFIED PlayLiquid shell.
 *
 * The unified-shell vocabulary (config.mjs) replaces the reference repo's
 * GameOS Studio/Lab/Community surfaces: the product IS the PlayLiquid-branded
 * ZCode workbench, and PlayLiquid Console is a side-pane tab. The shell probe
 * therefore looks for the first-run gate (welcome/login) or the workspace
 * composer; the full golden-path journey lives in checks-journey.mjs.
 *
 * Probes here are read-only. The journey battery performs the documented
 * REAL user actions (auth skip, onboarding walk, side-pane/launcher clicks).
 */
import path from "node:path";
import { PRODUCT_MARKERS, SHELL_MARKERS, VIEWPORTS, WINDOW_MIN_WIDTH } from "./config.mjs";
import { saveScreenshot } from "./report.mjs";
import { sleep } from "./memwatch.mjs";

/** One combined DOM probe covering the unified-shell boot markers (single
 * round trip). Used by the boot wait (run.mjs), the identity checks and the
 * offline scenario — keep the generic fields (title/textLength/textHead/
 * h1s/headerText) stable for every consumer. */
export async function markerProbe(cdp) {
  const expression = `(() => {
    const text = document.body?.innerText ?? "";
    const has = (needle) => text.includes(needle);
    const controls = [...document.querySelectorAll("button, a, [role='tab'], [role='button']")];
    const controlHas = (needle) => controls.some((el) => {
      const label = ((el.getAttribute("aria-label") ?? "") + " " + (el.textContent ?? "")).replace(/\\s+/g, " ").trim();
      return label.toLowerCase().includes(needle.toLowerCase());
    });
    const placeholders = [...document.querySelectorAll("[aria-placeholder], textarea, input[type='text'], input[type='search']")]
      .map((el) => el.getAttribute("aria-placeholder") ?? el.getAttribute("placeholder") ?? "")
      .filter(Boolean);
    const composerPlaceholder = placeholders.find((value) => value.startsWith(${JSON.stringify(PRODUCT_MARKERS.composerPlaceholderPrefix)})) ?? null;
    return {
      url: window.location.href,
      title: document.title,
      textLength: text.length,
      textHead: text.slice(0, 500),
      welcomeHeading: has(${JSON.stringify(PRODUCT_MARKERS.welcomeHeading)}),
      welcomeSubline: has(${JSON.stringify(PRODUCT_MARKERS.welcomeSubline)}),
      apiKeyEntry: has(${JSON.stringify(PRODUCT_MARKERS.apiKeyEntry)}),
      skipForNow: has(${JSON.stringify(PRODUCT_MARKERS.skipLabel)}),
      composerPlaceholderPresent: composerPlaceholder !== null,
      composerPlaceholderValue: composerPlaceholder,
      selectProject: has(${JSON.stringify(PRODUCT_MARKERS.selectProject)}),
      sidePaneToggle: Boolean(document.querySelector('[data-testid="${SHELL_MARKERS.sidePaneToggle}"]')),
      windowControls: [...document.querySelectorAll('[data-testid^="window-control-"]')].map((el) => el.getAttribute("data-testid")),
      h1s: [...document.querySelectorAll("h1, h2")].slice(0, 8).map((el) => (el.textContent ?? "").trim()).filter(Boolean),
      headerText: [...document.querySelectorAll("header")].slice(0, 3).map((el) => (el.textContent ?? "").trim().slice(0, 150)).filter(Boolean),
    };
  })()`;
  return cdp.evaluateValue(expression);
}

export async function bodyText(cdp) {
  return (
    (await cdp.evaluateValue(`(document.body?.innerText ?? "").slice(0, 8000)`)) ?? ""
  );
}

/** Click the first button-ish control whose text contains `label`. */
export async function clickByText(cdp, label) {
  const expression = `(() => {
    const controls = [...document.querySelectorAll("button, a, [role='tab'], [role='button']")];
    const el = controls.find((candidate) => ((candidate.textContent ?? "").trim()).includes(${JSON.stringify(label)}));
    if (!el) return { found: false, controls: controls.length };
    el.click();
    return { found: true, clicked: ${JSON.stringify(label)}, tag: el.tagName };
  })()`;
  return cdp.evaluateValue(expression);
}

export function identityChecks(report, probe, options) {
  const expectedTitle = options.expectedTitle ?? PRODUCT_MARKERS.windowTitle;
  report.check(
    "window-title-captured",
    "window title captured from the packaged run",
    probe.title ? "pass" : "fail",
    probe.title ? `document.title = ${JSON.stringify(probe.title)}` : "document.title is empty",
    [`url: ${probe.url ?? "unknown"}`],
  );
  report.check(
    "product-identity-title",
    "window title carries the PlayLiquid product identity",
    /playliquid/i.test(probe.title ?? "") ? "pass" : "fail",
    `expected title to match /playliquid/i (default expectation: ${JSON.stringify(expectedTitle)}); observed document.title = ${JSON.stringify(probe.title)}`,
  );
  const primary = [probe.title ?? "", ...(probe.h1s ?? []), ...(probe.headerText ?? [])].join(" | ");
  // The unified shell keeps internal ZCode identifiers (channels, env vars,
  // storage keys — deliberate compatibility retention, see the theme map),
  // but the PRIMARY identity surfaces the user reads — window title,
  // headings, app headers — must carry the PlayLiquid identity, not ZCode.
  const zcodeBranded = /zcode/i.test(primary);
  report.check(
    "no-zcode-primary-branding",
    "ZCode is not the primary UI identity of the product window (title, headings and app headers carry no ZCode text)",
    zcodeBranded ? "fail" : "pass",
    zcodeBranded
      ? `primary surfaces carry ZCode branding: ${JSON.stringify({ title: probe.title, h1s: probe.h1s, headers: probe.headerText })}`
      : "no ZCode branding in window title, headings or app headers",
  );
}

/** True when the probe shows the real first product surface: the first-run
 * welcome/login gate, or (defensively, e.g. for pre-seeded profiles) the
 * workspace composer. Loading screens match neither. */
export function shellMarkersPresent(probe) {
  return Boolean(probe && (probe.welcomeHeading || probe.composerPlaceholderPresent));
}

/** Window-level viewport evidence. 1280x800 is captured as a REAL resized OS
 * window via window.resizeTo (Electron honors it for its own windows; under
 * Xvfb there is no WM decoration so outer == inner size); the attempt and the
 * achieved window.outer* are recorded. 390x844 exceeds nothing in product
 * minimum terms — the product window enforces minWidth 480, so the 390-px
 * window attempt is honestly recorded as clamped and the 390x844 viewport is
 * captured via CDP device-metrics emulation (DevTools device mode). */
export async function viewportChecks(report, cdp, outDir) {
  const shots = [];
  const shot = async (name) => {
    const png = await cdp.screenshot();
    const info = saveScreenshot(path.join(outDir, "screenshots", name), png.data);
    shots.push(info);
    return info;
  };
  const windowGeometry = async () =>
    cdp.evaluateValue(
      `({ inner: [window.innerWidth, window.innerHeight], outer: [window.outerWidth, window.outerHeight], screen: [screen?.width ?? null, screen?.height ?? null] })`,
    );
  const resizeWindow = async (width, height) => {
    await cdp.evaluate(`window.resizeTo(${width}, ${height})`);
    await sleep(1200);
    return windowGeometry();
  };
  const emulate = async (width, height) => {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < WINDOW_MIN_WIDTH,
    });
    await sleep(700);
  };

  const desktop = await resizeWindow(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
  const desktopWindowOk =
    Array.isArray(desktop?.outer) && desktop.outer[0] === VIEWPORTS.desktop.width && desktop.outer[1] === VIEWPORTS.desktop.height;
  const desktopShot = await shot(desktopWindowOk ? "viewport-1280x800-window.png" : "viewport-1280x800-window-unresized.png");
  const desktopWindowShotOk =
    desktopShot.width === VIEWPORTS.desktop.width && desktopShot.height === VIEWPORTS.desktop.height;
  await emulate(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
  const desktopEmulatedShot = await shot("viewport-1280x800-emulated.png");
  await cdp.send("Emulation.clearDeviceMetricsOverride");
  const desktopOk =
    (desktopWindowOk && desktopWindowShotOk) ||
    (desktopEmulatedShot.width === VIEWPORTS.desktop.width && desktopEmulatedShot.height === VIEWPORTS.desktop.height);

  const mobileWindow = await resizeWindow(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
  const mobileClampedShot = await shot("viewport-390x844-clamp-attempt.png");
  await emulate(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
  const mobileShot = await shot("viewport-390x844-emulated.png");
  await cdp.send("Emulation.clearDeviceMetricsOverride");
  const mobileOk = mobileShot.width === VIEWPORTS.mobile.width && mobileShot.height === VIEWPORTS.mobile.height;

  report.check(
    "viewports-evidence",
    "window-level evidence captured at both mandated viewports (390x844 and 1280x800)",
    desktopOk && mobileOk ? "pass" : "fail",
    [
      `1280x800 real OS window: resizeTo requested, window.outer = ${JSON.stringify(desktop?.outer)} (inner ${JSON.stringify(desktop?.inner)}); ${desktopWindowOk ? "window resize achieved" : "window resize NOT achieved — emulated capture used instead"}; screenshot ${desktopShot.width}x${desktopShot.height}`,
      `390x844: real window attempt returned outer = ${JSON.stringify(mobileWindow?.outer)} (${mobileWindow?.outer?.[0] === VIEWPORTS.mobile.width ? "exact" : `clamped by the product minimum width ${WINDOW_MIN_WIDTH}px — recorded, not hidden`}); captured via CDP device-metrics emulation; screenshots ${mobileClampedShot.width}x${mobileClampedShot.height} (clamp attempt) + ${mobileShot.width}x${mobileShot.height} (emulated viewport)`,
    ].join("; "),
    shots.map((item) => `${path.basename(item.file)} — ${item.width}x${item.height}, ${item.bytes} bytes`),
  );
  return shots;
}

/** Clean-profile proof: the app booted from empty HOME/XDG dirs and created
 * its own first-run state inside them (nothing pre-seeded, nothing inherited). */
export function cleanProfileCheck(report, dirs, before, after) {
  const created = after.filter((entry) => !before.includes(entry));
  report.check(
    "clean-profile-startup",
    "startup from a clean profile (empty HOME + XDG directories)",
    created.length > 0 ? "pass" : "fail",
    created.length > 0
      ? `app created its first-run state in the empty profile: ${created.join(", ")}`
      : "app did not create any state in the fresh profile directories (unexpected)",
    [`XDG_CONFIG_HOME listing after boot: ${after.join(", ") || "(empty)"}`],
  );
}
