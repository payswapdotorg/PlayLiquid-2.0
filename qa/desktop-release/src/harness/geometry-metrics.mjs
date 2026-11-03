/**
 * UX-003 harness — pure geometry METRICS for the UNIFIED workbench chrome
 * (extracted pattern from the reference shell battery; max-file-lines gate):
 * the single-round-trip measurement expression and the violation analysis
 * (overlap / clipping / overflow / truncation math).
 *
 * Unified-shell adaptation: the required set is the REAL always-present
 * chrome of the PlayLiquid workbench — the three platform window controls
 * (by their stable testids), the Settings control and the side-pane toggle —
 * instead of the reference repo's gameos-shell bar (brand / Studio / Lab /
 * Community / AI & Agents), which does not exist in this product. When the
 * side pane is open the window controls + toggle render inside the pane
 * header ([data-workspace-side-frame]); when closed, in the workspace header
 * — both states are measured as-is, and duplicate render counts are
 * recorded honestly (only the first instance is measured).
 */

import { SHELL_MARKERS } from "./config.mjs";

/** Tolerances (CSS px) for sub-pixel rounding in box math. */
const PX = 0.5;
/** Minimum overlap area (px^2) that counts as a real overlap. */
const OVERLAP_AREA = 1.0;

/** The chrome elements whose geometry the check asserts (required set). */
const REQUIRED = [
  { key: "windowControlMinimize", label: `Minimize window control [window-control-minimize]` },
  { key: "windowControlMaximize", label: `Maximize/restore window control [window-control-maximize]` },
  { key: "windowControlClose", label: `Close window control [window-control-close]` },
  { key: "taskSettings", label: `Settings control [${SHELL_MARKERS.taskSettingsButton}]` },
  { key: "sidePaneToggle", label: `Side pane toggle [${SHELL_MARKERS.sidePaneToggle}]` },
];

export function chromeGeometryExpression() {
  const measure = `((el) => {
      if (!el) return { found: false };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        found: true,
        label: (el.getAttribute("aria-label") ?? (el.textContent ?? "").trim()).slice(0, 60),
        rect: {
          left: r.left, top: r.top, right: r.right, bottom: r.bottom,
          width: r.width, height: r.height,
        },
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      };
    })`;
  const selectors = {
    windowControlsContainer: `[data-testid="${SHELL_MARKERS.windowControlsContainer}"]`,
    windowControlMinimize: `[data-testid="window-control-minimize"]`,
    windowControlMaximize: `[data-testid="window-control-maximize"]`,
    windowControlClose: `[data-testid="window-control-close"]`,
    taskSettings: `[data-testid="${SHELL_MARKERS.taskSettingsButton}"]`,
    sidePaneToggle: `[data-testid="${SHELL_MARKERS.sidePaneToggle}"]`,
  };
  return `(() => {
    const measure = ${measure};
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const counts = {};
    for (const [key, selector] of ${JSON.stringify(Object.entries(selectors))}) {
      counts[key] = document.querySelectorAll(selector).length;
    }
    return {
      viewport: [vw, vh],
      documentScrollWidth: document.documentElement.scrollWidth,
      counts,
      ${Object.entries(selectors)
        .map(([key, selector]) => `${key}: measure(document.querySelector(${JSON.stringify(selector)})),`)
        .join("\n      ")}
    };
  })()`;
}

export function elementVisible(entry) {
  if (!entry?.found) return false;
  if (entry.display === "none" || entry.visibility === "hidden" || Number(entry.opacity) === 0) return false;
  return entry.rect.width > PX && entry.rect.height > PX;
}

export function elementClipped(entry, vw, vh) {
  const r = entry.rect;
  return r.left < -PX || r.right > vw + PX || r.top < -PX || r.bottom > vh + PX;
}

export function overlapArea(a, b) {
  const width = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
  const height = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
  return width > 0 && height > 0 ? width * height : 0;
}

export function rectSummary(entry) {
  if (!entry?.found) return "(absent)";
  const r = entry.rect;
  return `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}` +
    (entry.scrollWidth > entry.clientWidth + 1 ? ` [internal clip: scrollWidth ${entry.scrollWidth} > ${entry.clientWidth}]` : "");
}

/** Analyze one measurement pass against the chrome geometry contract. */
export function analyzeGeometry(measured) {
  const [vw, vh] = measured.viewport ?? [0, 0];
  const problems = [];
  const evidence = [];

  // 1. Required chrome controls: present, visible, non-zero.
  for (const item of REQUIRED) {
    const entry = measured[item.key];
    const count = measured.counts?.[item.key];
    if (!entry?.found) {
      problems.push(`missing required chrome control: ${item.label}`);
      continue;
    }
    if (!elementVisible(entry)) {
      problems.push(`${item.label} is not visible / has a zero box (${rectSummary(entry)})`);
    }
    if (count > 1) {
      // Honest observation: e.g. the settings control has more than one
      // conditional render site; only the first instance is measured.
      evidence.push(`${item.label}: ${count} instances rendered — the first is measured`);
    }
  }

  // The window-controls container: recorded (presence + own overflow), but
  // excluded from pairwise overlap — it CONTAINS the three window controls,
  // so parent/child boxes legitimately intersect.
  const container = measured.windowControlsContainer;
  if (!container?.found) {
    problems.push(`the window-controls container [${SHELL_MARKERS.windowControlsContainer}] is not rendered`);
  } else if (!elementVisible(container)) {
    problems.push(`the window-controls container is not visible (${rectSummary(container)})`);
  }

  // 2. Clipping: required controls fully inside the viewport.
  for (const item of REQUIRED) {
    const entry = measured[item.key];
    if (entry?.found && elementVisible(entry) && elementClipped(entry, vw, vh)) {
      problems.push(`${item.label} is clipped by the viewport edges (${rectSummary(entry)} vs viewport ${vw}x${vh})`);
    }
  }

  // 3. Pairwise overlap among the required controls (siblings across the
  //    header, pane header and sidebar — none may cover another).
  const overlapSet = REQUIRED.filter((item) => elementVisible(measured[item.key]));
  for (let i = 0; i < overlapSet.length; i += 1) {
    for (let j = i + 1; j < overlapSet.length; j += 1) {
      const area = overlapArea(measured[overlapSet[i].key], measured[overlapSet[j].key]);
      if (area > OVERLAP_AREA) {
        problems.push(
          `${overlapSet[i].label} overlaps ${overlapSet[j].label} by ${Math.round(area)}px^2 ` +
            `(${rectSummary(measured[overlapSet[i].key])} vs ${rectSummary(measured[overlapSet[j].key])})`,
        );
      }
    }
  }

  // 4. Horizontal overflow: document level AND container level.
  const documentOverflow = (measured.documentScrollWidth ?? 0) > vw + 1;
  if (documentOverflow) {
    problems.push(`document horizontal overflow: scrollWidth ${measured.documentScrollWidth} > viewport ${vw}`);
  }
  if (container?.found && container.scrollWidth > container.clientWidth + 1) {
    problems.push(`window-controls container horizontal overflow: scrollWidth ${container.scrollWidth} > clientWidth ${container.clientWidth}`);
  }

  // 5. Control labels must not be internally truncated.
  for (const item of REQUIRED) {
    const entry = measured[item.key];
    if (entry?.found && entry.scrollWidth > entry.clientWidth + 1) {
      problems.push(`${item.label} label is truncated inside its box (scrollWidth ${entry.scrollWidth} > ${entry.clientWidth})`);
    }
  }

  evidence.push(`viewport: ${vw}x${vh}; document scrollWidth ${measured.documentScrollWidth}`);
  for (const item of REQUIRED) {
    evidence.push(`${item.label} (aria-label ${JSON.stringify(measured[item.key]?.label ?? null)}): ${rectSummary(measured[item.key])}`);
  }
  evidence.push(
    `window-controls container [${SHELL_MARKERS.windowControlsContainer}]: ${container?.found ? rectSummary(container) : "(absent)"}`,
  );
  return { problems, evidence };
}
