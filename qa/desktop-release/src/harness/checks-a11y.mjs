/**
 * RW-003 harness — ACCESSIBILITY checks on the UNIFIED PlayLiquid shell
 * (the real ZCode workbench surface, post-journey: workspace + side pane).
 *
 * All keyboard interaction is driven the way a keyboard user does it: CDP
 * Input.dispatchKeyEvent (Tab / Enter) — synthetic el.click() is never used
 * for the paths under test (el.focus() is used ONLY to position focus on a
 * real element when Tab could not reach it, and that fact is recorded).
 *
 * - a11y-keyboard-navigation: Tab reaches the REAL chrome controls — the
 *   three window controls ([data-testid=window-control-minimize|
 *   maximize|close]), the Settings control ([data-testid=
 *   task-settings-button]) and the side-pane toggle ([data-testid=
 *   side-pane-toggle]) — within a BOUNDED walk (max 40 tabs, never looping
 *   on nonexistent selectors; the reference harness's gameos-nav loop died
 *   with `page: already closed` and is gone). The observed focus order is
 *   recorded as evidence, not asserted against an invented expectation.
 *   Keyboard ACTIVATION is then proven twice: Enter on the side-pane toggle
 *   expands the pane (the add-tab trigger becomes present), and Enter on a
 *   New Tab launcher row ([data-side-pane-open-tab-item=files]) opens a real
 *   pane tab ([data-side-pane-tab-id] appears).
 * - a11y-visible-focus: the keyboard-focused chrome controls show a visible
 *   focus indicator (computed outline, box-shadow, or a focused-vs-blurred
 *   style change — however the shell draws it).
 * - a11y-accessible-names: every visible interactive element on the active
 *   surface has an accessible name (aria-label / aria-labelledby / text /
 *   title).
 *
 * DOM presence alone is NOT a pass; every outcome records what was observed.
 */
import { DEFAULTS, SHELL_MARKERS } from "./config.mjs";
import { sleep } from "./memwatch.mjs";

/** Hard bound for every tab walk — the fatal CI lesson (checks-a11y.mjs
 * tabUntil'ing through nonexistent gameos-nav testids until the page died). */
const MAX_TABS = 40;

/** The REAL chrome controls the tab-order phase must reach. */
const FOCUS_TARGETS = [
  { testid: "window-control-minimize", label: "Minimize window control" },
  { testid: "window-control-maximize", label: "Maximize/restore window control" },
  { testid: "window-control-close", label: "Close window control" },
  { testid: SHELL_MARKERS.taskSettingsButton, label: "Settings control (sidebar footer)" },
  { testid: SHELL_MARKERS.sidePaneToggle, label: "Side pane toggle" },
];

/** One keyboard key press through the real CDP input pipeline.
 * Activation requires a NON-raw keyDown: CDP treats a `keyDown` without
 * `text` as a rawKeyDown, and Chromium's default button activation for
 * Enter only fires on a non-raw keydown (Space activates on keyUp, which
 * is never raw). Enter therefore carries text "\r" — exactly what a real
 * Enter press generates (live-caught on the 3.14.3 baseline). */
async function pressKey(page, { key, code, keyCode, text }) {
  const base = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
  await page.send("Input.dispatchKeyEvent", { type: "keyDown", text: text ?? undefined, ...base }).catch(() => undefined);
  await page.send("Input.dispatchKeyEvent", { type: "keyUp", ...base }).catch(() => undefined);
}

function pressTab(page) {
  return pressKey(page, { key: "Tab", code: "Tab", keyCode: 9 });
}

function pressEnter(page) {
  return pressKey(page, { key: "Enter", code: "Enter", keyCode: 13, text: "\r" });
}

/** A compact description of the currently focused element. */
const ACTIVE_PROBE = `(() => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) {
    return { body: true, hasFocus: document.hasFocus() };
  }
  return {
    body: false,
    hasFocus: document.hasFocus(),
    testid: el.getAttribute("data-testid"),
    tag: el.tagName,
    label: (el.getAttribute("aria-label") ?? (el.textContent ?? "").trim()).slice(0, 50),
  };
})()`;

async function activeElement(page) {
  return page.evaluateValue(ACTIVE_PROBE);
}

/** Tab forward until the element with `testid` is focused — STRICTLY bounded
 * (maxTabs); never loops on a selector that does not exist. */
async function tabUntil(page, testid, maxTabs = MAX_TABS) {
  for (let i = 0; i < maxTabs; i += 1) {
    const active = await activeElement(page);
    if (active?.testid === testid) return { reached: true, tabs: i, active };
    await pressTab(page);
    await sleep(120);
  }
  return { reached: false, tabs: maxTabs, active: await activeElement(page) };
}

/** Focus the element with `testid` via Tab when possible, else a direct
 * programmatic focus — the method used is always returned for the evidence. */
async function focusByTestid(page, testid, maxTabs = MAX_TABS) {
  const existing = await page
    .evaluateValue(`(() => {
      const el = document.querySelector('[data-testid="${testid}"]');
      if (!el) return { present: false };
      return { present: true, ariaLabel: el.getAttribute("aria-label") };
    })()`)
    .catch(() => ({ present: false }));
  if (!existing?.present) {
    return { present: false, method: "not-found", ariaLabel: null };
  }
  const walked = await tabUntil(page, testid, maxTabs);
  if (walked.reached) {
    return { present: true, method: `tab (${walked.tabs} tabs)`, ariaLabel: existing.ariaLabel };
  }
  const focused = await page
    .evaluateValue(`(() => {
      const el = document.querySelector('[data-testid="${testid}"]');
      if (!el) return { ok: false };
      el.focus();
      return { ok: document.activeElement === el };
    })()`)
    .catch(() => ({ ok: false }));
  return {
    present: true,
    method: focused?.ok ? "programmatic el.focus() (Tab did not reach it within the bound)" : "focus failed",
    ariaLabel: existing.ariaLabel,
  };
}

/** Is an element matching `selector` present (and visible when asked)? */
async function selectorState(page, selector, { visible = true } = {}) {
  return page.evaluateValue(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return { present: false };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const isVisible = cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0;
    return { present: true, visible: isVisible };
  })()`).catch(() => ({ present: false, __error: true }));
}

/** Click an element (positioning action only — the keyboard paths under
 * test are asserted through Input.dispatchKeyEvent, never el.click()). */
async function clickSelector(page, selector) {
  return page
    .evaluateValue(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return { found: false };
      el.click();
      return { found: true, ariaLabel: el.getAttribute("aria-label") };
    })()`)
    .catch(() => ({ found: false }));
}

/** The keyboard-navigation + activation check. */
export async function keyboardNavigationCheck(report, page) {
  const evidence = [];
  const problems = [];
  await page.evaluate(`window.focus()`).catch(() => undefined);
  const initial = await activeElement(page);
  evidence.push(`start: document.hasFocus=${initial.hasFocus}, activeElement=${initial.body ? "body" : `${initial.tag}[${initial.testid ?? initial.label}]`}`);

  // 1. Bounded tab walk: record the focus order and which REAL chrome
  //    controls receive focus. The order is recorded as observed — no
  //    invented expectation; pass requires each target to be reachable.
  const sequence = [];
  const firstSeen = new Map();
  for (let i = 0; i < MAX_TABS; i += 1) {
    await pressTab(page);
    await sleep(120);
    const active = await activeElement(page);
    const entry = active?.body ? "body" : active?.testid ?? active?.label ?? active?.tag ?? "?";
    sequence.push(entry);
    for (const target of FOCUS_TARGETS) {
      if (active?.testid === target.testid && !firstSeen.has(target.testid)) {
        firstSeen.set(target.testid, i);
      }
    }
    if (firstSeen.size === FOCUS_TARGETS.length) break; // every target seen
  }
  evidence.push(`tab order observed (first ${sequence.length} stops): ${sequence.join(" -> ")}`);
  // Second bounded attempt for any target the walk missed (focus may start
  // deep inside the document; tabUntil walks on from wherever focus is).
  for (const target of FOCUS_TARGETS) {
    if (firstSeen.has(target.testid)) continue;
    const retried = await tabUntil(page, target.testid, 25);
    if (retried.reached) {
      firstSeen.set(target.testid, MAX_TABS + retried.tabs);
      evidence.push(`${target.label} [${target.testid}]: reached by extended tabbing (${retried.tabs} further tabs) after the primary walk`);
    }
  }
  for (const target of FOCUS_TARGETS) {
    const at = firstSeen.get(target.testid);
    if (at === undefined) {
      problems.push(`${target.label} [${target.testid}] is never reached by Tab within the bounded walk (${MAX_TABS} + 25 tabs)`);
    } else {
      evidence.push(`${target.label} [${target.testid}]: first focused at tab stop ${at + 1}`);
    }
  }
  evidence.push(
    `focus order among the chrome controls (observed, not asserted): ${FOCUS_TARGETS.filter((target) => firstSeen.has(target.testid))
      .sort((a, b) => firstSeen.get(a.testid) - firstSeen.get(b.testid))
      .map((target) => target.testid)
      .join(" -> ")}`,
  );

  // 2. Keyboard ACTIVATION: Enter on the side-pane toggle expands the pane.
  //    Position the pane COLLAPSED first (the journey leaves it open with
  //    the Console tab): one positioning click on the toggle, then the
  //    expansion itself is proven with the keyboard.
  const triggerNow = await selectorState(page, SHELL_MARKERS.addTabTrigger, { visible: false });
  if (triggerNow?.present) {
    const collapsed = await clickSelector(page, `[data-testid="${SHELL_MARKERS.sidePaneToggle}"]`);
    await sleep(900);
    evidence.push(`positioning: pane was open after the journey — clicked the toggle to collapse it (${JSON.stringify(collapsed)}) so the keyboard path can prove EXPANSION`);
  }
  const toggleFocused = await focusByTestid(page, SHELL_MARKERS.sidePaneToggle);
  evidence.push(`side pane toggle focus: ${JSON.stringify(toggleFocused)}`);
  await pressEnter(page);
  let expanded = false;
  {
    const deadline = Date.now() + DEFAULTS.uiStateTimeoutMs;
    while (Date.now() < deadline) {
      const state = await selectorState(page, SHELL_MARKERS.addTabTrigger);
      if (state?.present && state?.visible) {
        expanded = true;
        break;
      }
      await sleep(DEFAULTS.uiStatePollMs);
    }
  }
  evidence.push(`Enter on [${SHELL_MARKERS.sidePaneToggle}]: pane expanded (add-tab trigger present) = ${expanded}`);
  if (!expanded) {
    problems.push(`Enter on the side pane toggle does not expand the pane (add-tab trigger ${SHELL_MARKERS.addTabTrigger} never became present within ${DEFAULTS.uiStateTimeoutMs / 1000}s)`);
  }

  // 3. Keyboard ACTIVATION: Enter on the FILES launcher row opens a tab.
  //    The launcher is opened with a positioning click on the add-tab
  //    trigger (its keyboard path was proven in step 2); the launcher row
  //    itself is then activated with Enter.
  const launcherOpened = await clickSelector(page, SHELL_MARKERS.addTabTrigger);
  let rowFocused = { present: false, method: "not-attempted" };
  let tabAppeared = false;
  let tabEvidence = null;
  {
    const deadline = Date.now() + DEFAULTS.uiStateTimeoutMs;
    while (Date.now() < deadline) {
      const state = await selectorState(page, `[${SHELL_MARKERS.launcherItemAttr}="files"]`);
      if (state?.present && state?.visible) break;
      await sleep(DEFAULTS.uiStatePollMs);
    }
  }
  rowFocused = await page
    .evaluateValue(`(() => {
      const el = document.querySelector('[${SHELL_MARKERS.launcherItemAttr}="files"]');
      if (!el) return { present: false, method: "not-found" };
      el.focus();
      return { present: true, method: "programmatic el.focus() on the real launcher row", focused: document.activeElement === el, label: (el.textContent ?? "").replace(/\\s+/g, " ").trim().slice(0, 60) };
    })()`)
    .catch(() => ({ present: false, method: "probe-failed" }));
  evidence.push(`launcher opened via add-tab trigger: ${JSON.stringify(launcherOpened)}; files row focus: ${JSON.stringify(rowFocused)}`);
  if (rowFocused?.present) {
    await pressEnter(page);
    const deadline = Date.now() + DEFAULTS.uiStateTimeoutMs;
    while (Date.now() < deadline) {
      tabEvidence = await page
        .evaluateValue(`(() => {
          const tabs = [...document.querySelectorAll("[${SHELL_MARKERS.tabIdAttr}]")];
          return { count: tabs.length, labels: tabs.map((el) => (el.textContent ?? "").replace(/\\s+/g, " ").trim().slice(0, 40)).filter(Boolean) };
        })()`)
        .catch(() => null);
      if (tabEvidence && tabEvidence.count > 0) {
        tabAppeared = true;
        break;
      }
      await sleep(DEFAULTS.uiStatePollMs);
    }
  }
  evidence.push(
    `Enter on the files launcher row: a side-pane tab appeared ([${SHELL_MARKERS.tabIdAttr}]) = ${tabAppeared} ${JSON.stringify(tabEvidence)}`,
  );
  if (!tabAppeared) {
    problems.push(`Enter on the New Tab launcher row does not open a pane tab (no [${SHELL_MARKERS.tabIdAttr}] element appeared within ${DEFAULTS.uiStateTimeoutMs / 1000}s)`);
  }

  report.check(
    "a11y-keyboard-navigation",
    "keyboard navigation: Tab reaches the real chrome controls (window controls, settings, side-pane toggle — order recorded as observed) and Enter activates the side pane toggle and a New Tab launcher row",
    problems.length === 0 ? "pass" : "fail",
    problems.length === 0
      ? "all chrome controls are keyboard-reachable within the bounded walk, Enter expands the side pane and Enter opens a real pane tab from the launcher"
      : problems.join("; "),
    evidence,
  );
}

/** The visible-focus check: the focused chrome controls must render a focus
 * indicator (outline, box-shadow, or any focused-vs-blurred style change). */
export async function visibleFocusCheck(report, page) {
  const probes = [];
  for (const testid of [SHELL_MARKERS.sidePaneToggle, "window-control-close"]) {
    const focused = await focusByTestid(page, testid);
    const styles = await page
      .evaluateValue(`(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        return {
          testid: el.getAttribute("data-testid"),
          matchesFocusVisible: el.matches(":focus-visible"),
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
          outlineColor: cs.outlineColor,
          boxShadow: cs.boxShadow,
          borderColor: cs.borderColor,
          backgroundColor: cs.backgroundColor,
        };
      })()`)
      .catch(() => null);
    await page.evaluate(`document.activeElement && document.activeElement.blur()`).catch(() => undefined);
    await sleep(150);
    const blurred = await page
      .evaluateValue(`(() => {
        const el = document.querySelector('[data-testid="${testid}"]');
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { boxShadow: cs.boxShadow, borderColor: cs.borderColor, backgroundColor: cs.backgroundColor, borderWidth: cs.borderWidth };
      })()`)
      .catch(() => null);
    probes.push({ testid, focused, styles, blurred });
    await sleep(150);
  }
  const problems = [];
  const evidence = probes.map((probe) => {
    if (!probe.focused?.present || !probe.styles) {
      problems.push(`${probe.testid} could not be focused for the visible-focus probe`);
      return `${probe.testid}: not focusable (${probe.focused?.method ?? "unavailable"})`;
    }
    const outlineVisible =
      probe.styles.outlineStyle !== "none" && parseFloat(probe.styles.outlineWidth) > 0;
    const shadowVisible = probe.styles.boxShadow !== "none";
    const styleChanged =
      probe.blurred != null &&
      (probe.styles.boxShadow !== probe.blurred.boxShadow ||
        probe.styles.borderColor !== probe.blurred.borderColor ||
        probe.styles.backgroundColor !== probe.blurred.backgroundColor);
    const visible = outlineVisible || shadowVisible || styleChanged;
    if (!visible) {
      problems.push(
        `${probe.testid} shows NO visible focus indicator when focused (:focus-visible=${probe.styles.matchesFocusVisible}, outline=${probe.styles.outlineStyle} ${probe.styles.outlineWidth}, boxShadow=${probe.styles.boxShadow}, no focused-vs-blurred style change)`,
      );
    }
    return (
      `${probe.testid} (focused via ${probe.focused.method}): :focus-visible=${probe.styles.matchesFocusVisible}, outline=${probe.styles.outlineStyle} ${probe.styles.outlineWidth} ${probe.styles.outlineColor}, ` +
      `boxShadow=${probe.styles.boxShadow}, focused-vs-blurred change=${styleChanged}`
    );
  });
  report.check(
    "a11y-visible-focus",
    "visible focus: focused chrome controls (side pane toggle, window control) render a focus indicator",
    problems.length === 0 ? "pass" : "fail",
    problems.length === 0
      ? "every probed chrome control shows a visible focus indicator under focus"
      : problems.join("; "),
    evidence,
  );
}

/** Every visible interactive element must have an accessible name. */
export async function accessibleNamesCheck(report, page) {
  const named = await page.evaluateValue(`(() => {
    const interactive = [...document.querySelectorAll("button, a, input, select, textarea, [role='button'], [role='tab']")];
    const visible = interactive.filter((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0.5 && r.height > 0.5;
    });
    const nameSource = (el) => {
      if ((el.getAttribute("aria-label") ?? "").trim()) return "aria-label";
      const labelledby = el.getAttribute("aria-labelledby");
      if (labelledby) {
        const refs = labelledby.split(/\\s+/).map((id) => document.getElementById(id)).filter(Boolean);
        if (refs.some((node) => (node.textContent ?? "").trim())) return "aria-labelledby";
      }
      if ((el.textContent ?? "").trim()) return "text";
      if ((el.getAttribute("title") ?? "").trim()) return "title";
      if (el instanceof HTMLInputElement && String(el.value ?? "").trim()) return "value";
      return null;
    };
    return visible.map((el) => ({
      testid: el.getAttribute("data-testid"),
      tag: el.tagName,
      label: (el.getAttribute("aria-label") ?? (el.textContent ?? "").trim()).slice(0, 40),
      source: nameSource(el),
    }));
  })()`);
  if (!Array.isArray(named)) {
    report.check(
      "a11y-accessible-names",
      "accessible names: every visible interactive element is named (aria-label / aria-labelledby / text / title)",
      "fail",
      `the accessible-name probe failed: ${JSON.stringify(named)}`,
    );
    return;
  }
  const unnamed = named.filter((entry) => entry.source == null);
  const problems = [];
  if (unnamed.length > 0) {
    problems.push(`${unnamed.length} visible interactive element(s) have NO accessible name: ${unnamed.map((entry) => `${entry.tag}[${entry.testid ?? entry.label ?? "?"}]`).join(", ")}`);
  }
  report.check(
    "a11y-accessible-names",
    "accessible names: every visible interactive element is named (aria-label / aria-labelledby / text / title)",
    problems.length === 0 ? "pass" : "fail",
    problems.length === 0
      ? `${named.length} visible interactive elements checked — all named`
      : problems.join("; "),
    named.slice(0, 30).map((entry) => `${entry.tag}[${entry.testid ?? "?"}] "${entry.label}" — name via ${entry.source ?? "NONE"}`),
  );
}
