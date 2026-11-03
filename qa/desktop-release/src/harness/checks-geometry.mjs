/**
 * UX-003 harness — GEOMETRY enforcement at the three mandated widths for
 * the UNIFIED PlayLiquid workbench.
 *
 * For every geometry (the real 1280x800 OS window, the ACTUAL 480px minimum
 * OS window — MIN_DESKTOP_WINDOW_WIDTH — and the 390x844 emulated viewport)
 * the workbench chrome is measured through computed bounding boxes (CDP
 * Runtime.evaluate on getBoundingClientRect):
 *
 * - every required chrome control exists, is visible and has a non-zero box:
 *   the three platform window controls, the Settings control and the
 *   side-pane toggle (the reference battery's gameos-shell bar — brand /
 *   Studio / Lab / Community / AI & Agents + the optional overflow control —
 *   does not exist in this product and was removed with this adaptation);
 * - no pairwise overlap between any two required controls (the
 *   window-controls CONTAINER is excluded — it contains its controls);
 * - no control is clipped by the viewport edges (fully inside the window);
 * - no horizontal overflow: documentElement.scrollWidth <= innerWidth AND
 *   the window-controls container's own scrollWidth <= clientWidth;
 * - control labels are not internally truncated (scrollWidth <= clientWidth).
 *
 * The measurement runs on whatever state the journey left (workspace with
 * the side pane open + Console tab): when the pane is open the window
 * controls and the toggle render inside the pane header, when closed in the
 * workspace header — both are the real product chrome and are measured
 * as-is. DOM presence alone is NOT a pass: every geometry whose assertions
 * fail fails the run.
 */
import path from "node:path";
import { VIEWPORTS, WINDOW_MIN_WIDTH } from "./config.mjs";
import { saveScreenshot } from "./report.mjs";
import { sleep } from "./memwatch.mjs";
import { analyzeGeometry, chromeGeometryExpression } from "./geometry-metrics.mjs";

/** Resize the REAL OS window (Browser.setWindowBounds, window.resizeTo fallback). */
async function resizeOsWindow(browser, page, targetId, width, height) {
  const attempts = [];
  let outer = null;
  const readOuter = async () => {
    const value = await page.evaluateValue(`[window.outerWidth, window.outerHeight]`).catch(() => null);
    return Array.isArray(value) ? value : null;
  };
  try {
    const { windowId } = await browser.send("Browser.getWindowForTarget", targetId ? { targetId } : {});
    await browser.send("Browser.setWindowBounds", {
      windowId,
      bounds: { windowState: "normal", left: 40, top: 40, width, height },
    });
    await sleep(900);
    outer = await readOuter();
    attempts.push(`Browser.setWindowBounds(${width}x${height}) -> outer ${JSON.stringify(outer)}`);
  } catch (error) {
    attempts.push(`Browser.setWindowBounds failed: ${String(error?.message ?? error).slice(0, 120)}`);
  }
  if (!Array.isArray(outer) || outer[0] !== width || outer[1] !== height) {
    await page.evaluate(`window.resizeTo(${width}, ${height})`).catch(() => undefined);
    await sleep(1000);
    outer = await readOuter();
    attempts.push(`window.resizeTo(${width}, ${height}) -> outer ${JSON.stringify(outer)}`);
  }
  return { outer, attempts };
}

/** Measure, analyze and report ONE geometry. `mode` describes how the width
 * was reached (real OS window vs CDP device-metrics emulation). */
async function checkGeometry(report, context, spec) {
  const { browser, page, targetId, outDir } = context;
  const shot = async (name) => {
    const png = await page.screenshot();
    return saveScreenshot(path.join(outDir, "screenshots", name), png.data);
  };
  let windowEvidence = [];
  if (spec.mode === "window") {
    const resized = await resizeOsWindow(browser, page, targetId, spec.width, spec.height);
    windowEvidence = resized.attempts;
    const [outerWidth] = resized.outer ?? [];
    if (outerWidth !== spec.width) {
      report.check(
        spec.id,
        spec.title,
        "fail",
        `the OS window could not be set to ${spec.width}px (outerWidth = ${outerWidth}) — geometry at this width cannot be asserted`,
        [...windowEvidence, "this is an environment/launcher failure, not a product pass"],
      );
      await shot(spec.screenshot).catch(() => undefined);
      return;
    }
  } else {
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: spec.width,
      height: spec.height,
      deviceScaleFactor: 1,
      mobile: spec.width < WINDOW_MIN_WIDTH,
    });
    await sleep(800);
  }

  const measured = await page.evaluateValue(chromeGeometryExpression());
  if (measured?.__error || !Array.isArray(measured?.viewport)) {
    report.check(
      spec.id,
      spec.title,
      "fail",
      `the geometry probe failed in the renderer: ${JSON.stringify(measured).slice(0, 500)}`,
      [`mode: ${spec.mode}`, `requested: ${spec.width}x${spec.height}`],
    );
    if (spec.mode === "emulated") {
      await page.send("Emulation.clearDeviceMetricsOverride").catch(() => undefined);
    }
    return;
  }
  const analysis = analyzeGeometry(measured);

  let shotError = null;
  const shotInfo = await shot(spec.screenshot).catch((error) => {
    shotError = String(error?.message ?? error).slice(0, 300);
    return null;
  });
  if (spec.mode === "emulated") {
    await page.send("Emulation.clearDeviceMetricsOverride").catch(() => undefined);
    await sleep(400);
  }

  const evidence = [
    `mode: ${spec.mode === "window" ? "real OS window" : "CDP device-metrics emulation (the DevTools device-mode equivalent)"}`,
    ...windowEvidence,
    ...analysis.evidence,
  ];
  if (shotInfo) {
    evidence.push(`screenshot: ${path.basename(shotInfo.file)} (${shotInfo.width}x${shotInfo.height}, ${shotInfo.bytes} bytes)`);
  } else {
    evidence.push(`screenshot FAILED: ${shotError}`);
  }
  report.check(
    spec.id,
    spec.title,
    analysis.problems.length === 0 ? "pass" : "fail",
    analysis.problems.length === 0
      ? `all required chrome controls present, visible, non-overlapping and unclipped at ${spec.width}x${spec.height}`
      : `${analysis.problems.length} geometry violation(s) at ${spec.width}x${spec.height}: ${analysis.problems.join("; ")}`,
    evidence,
  );
}

/**
 * The geometry battery: 1280x800 (real window), the actual 480px minimum OS
 * window, and the 390x844 emulated viewport. Leaves the window restored at
 * 1280x800 so later checks run at a sane size.
 */
export async function geometryChecks(report, context) {
  const specs = [
    {
      id: "geometry-1280x800",
      title: "workbench chrome geometry at 1280x800 (real OS window): window controls, settings and side-pane toggle present, visible, non-overlapping, unclipped, no horizontal overflow",
      mode: "window",
      width: VIEWPORTS.desktop.width,
      height: VIEWPORTS.desktop.height,
      screenshot: "geometry-1280x800.png",
    },
    {
      id: "geometry-480-window",
      title: `workbench chrome geometry at the actual ${WINDOW_MIN_WIDTH}px minimum OS window: window controls, settings and side-pane toggle present, visible, non-overlapping, unclipped, no horizontal overflow`,
      mode: "window",
      width: WINDOW_MIN_WIDTH,
      height: 720,
      screenshot: "geometry-480px-window.png",
    },
    {
      id: "geometry-390x844-emulated",
      title: "workbench chrome geometry at the 390x844 emulated viewport: window controls, settings and side-pane toggle present, visible, non-overlapping, unclipped, no horizontal overflow",
      mode: "emulated",
      width: VIEWPORTS.mobile.width,
      height: VIEWPORTS.mobile.height,
      screenshot: "geometry-390x844-emulated.png",
    },
  ];
  for (const spec of specs) {
    try {
      await checkGeometry(report, context, spec);
    } catch (error) {
      report.check(
        spec.id,
        spec.title,
        "fail",
        `geometry check could not run: ${String(error?.message ?? error)}`,
      );
    }
  }
  // Restore a sane window for the checks that follow.
  await resizeOsWindow(context.browser, context.page, context.targetId, VIEWPORTS.desktop.width, VIEWPORTS.desktop.height).catch(
    () => undefined,
  );
}
