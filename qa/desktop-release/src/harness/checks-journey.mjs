/**
 * RW-003 harness — the UNIFIED-SHELL JOURNEY smoke: the real golden path of
 * the packaged PlayLiquid product, driven end to end through the same
 * controls a first-run user touches (TL handoff §2: no separate GameOS
 * workspace — the product is the unified ZCode workbench with PlayLiquid
 * branding, and PlayLiquid Console is a side-pane New Tab entry).
 *
 * The verified path (driven live against the packaged artifact via CDP; the
 * selectors are confirmed in packages/ui + @playliquid/gameos source):
 *
 *   1. journey-welcome-branding  — boot reaches the PlayLiquid welcome/login
 *      gate: document.title "PlayLiquid", "Welcome to PlayLiquid" and the
 *      "Use API key" entry visible.
 *   2. journey-auth-skip         — "Use API key" opens the credential dialog;
 *      "Skip for now" skips account connection and the welcome surface goes
 *      away (first-run state advanced honestly, no credentials invented).
 *   3. journey-onboarding-walk   — the 3-step onboarding wizard advances:
 *      "What do you do?" → "Software / Data / AI" → Next; "Choose your UI
 *      mode" → "Coding mode" → Next; "Personalize your work assistant" →
 *      Skip. Completion is proven by REACHING the workspace composer.
 *   4. journey-workspace-composer — the workspace renders its composer
 *      placeholder ("Ask PlayLiquid …"), the "Select project" trigger and
 *      the primary sidebar labels (New task / Automations / Plugin
 *      Marketplace).
 *   5. journey-newtab-five-options — the side pane expands via
 *      [data-testid=side-pane-toggle], the New Tab launcher opens via
 *      [data-side-pane-add-tab-trigger], and the five BUILT-IN entries are
 *      present in the product's canonical order: files, browser, terminal,
 *      review, playliquid-console (optional sites / developer-tools rows are
 *      recorded, never required).
 *   6. journey-console-opens     — the playliquid-console launcher row opens
 *      the Console tab: header "PlayLiquid Console", the workbench text
 *      "World projects" and the live status line "registry open" (badge
 *      "services live" recorded as evidence).
 *
 * Every step waits generously (DEFAULTS.journeyStepTimeoutMs, polled — fresh
 * onboarding legitimately takes ~20 s; the old shell-marker wait was 180 s)
 * and records honest evidence for what was and was not found.
 */
import { DEFAULTS, PRODUCT_MARKERS, SHELL_MARKERS } from "./config.mjs";
import { bodyText, clickByText } from "./checks.mjs";
import { sleep } from "./memwatch.mjs";

/** Evaluate `expression` repeatedly until `predicate(value)` holds or the
 * budget expires. Returns the last value + elapsed time; never throws on
 * page hiccups (a dead page surfaces as { passed: false, value: {__error…} }). */
async function waitForState(page, expression, predicate, { timeoutMs, pollMs, label }) {
  const startedAt = Date.now();
  let last = null;
  while (Date.now() - startedAt <= timeoutMs) {
    last = await page.evaluateValue(expression).catch((error) => ({
      __error: String(error?.message ?? error),
    }));
    if (last && !last.__error && predicate(last)) {
      return { passed: true, value: last, elapsedMs: Date.now() - startedAt };
    }
    await sleep(pollMs);
  }
  return { passed: false, value: last, elapsedMs: Date.now() - startedAt, label };
}

/** Body-text probe for a set of needles (innerText OR any control whose
 * aria-label/text matches). Also reports the enabled button labels so the
 * evidence shows what was actually clickable at that moment. */
function bodyTextProbe(needles) {
  return `(() => {
    const text = document.body?.innerText ?? "";
    const controls = [...document.querySelectorAll("button, a, [role='tab'], [role='button']")];
    const controlHas = (needle) => controls.some((el) => {
      const label = ((el.getAttribute("aria-label") ?? "") + " " + (el.textContent ?? "")).replace(/\\s+/g, " ").trim();
      return label.toLowerCase().includes(needle.toLowerCase());
    });
    const found = {};
    for (const needle of ${JSON.stringify(needles)}) {
      found[needle] = text.includes(needle) || controlHas(needle);
    }
    return {
      title: document.title,
      textHead: text.replace(/\\s+/g, " ").slice(0, 300),
      found,
      enabledButtons: controls
        .filter((el) => !el.disabled)
        .map((el) => (el.textContent ?? "").replace(/\\s+/g, " ").trim())
        .filter(Boolean)
        .slice(0, 24),
    };
  })()`;
}

/** Click the first VISIBLE control whose combined label matches `label`
 * exactly (exact matching keeps "Skip" from hitting "Skip for now").
 * Falls back to the first match of any visibility; records both facts. */
async function clickExactText(page, label) {
  const expression = `(() => {
    const label = ${JSON.stringify(label)};
    const controls = [...document.querySelectorAll("button, a, [role='tab'], [role='button']")];
    const matches = (el) => {
      const text = ((el.getAttribute("aria-label") ?? "") + " " + (el.textContent ?? "")).replace(/\\s+/g, " ").trim();
      return text === label;
    };
    const visible = (el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0;
    };
    const el = controls.find((candidate) => matches(candidate) && visible(candidate)) ?? controls.find(matches);
    if (!el) return { found: false, scanned: controls.length };
    el.click();
    return { found: true, clicked: label, tag: el.tagName, disabled: el.disabled === true };
  })()`;
  return page.evaluateValue(expression);
}

/** Click the first element matching `selector` (a positioning user action;
 * the a11y battery separately proves the keyboard paths). */
async function clickSelector(page, selector) {
  const expression = `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return { found: false };
    el.click();
    return { found: true, clicked: ${JSON.stringify(selector)}, ariaLabel: el.getAttribute("aria-label"), testid: el.getAttribute("data-testid") };
  })()`;
  return page.evaluateValue(expression);
}

/** Wait until an element matching `selector` is present (and visible when
 * `visible` is set). Returns the last observation for honest evidence. */
function selectorPresenceProbe(selector, { visible = true } = {}) {
  return `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return { present: false };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const isVisible = cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0;
    return { present: true, visible: isVisible, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] };
  })()`;
}

/** The launcher rows currently rendered: ids in DOM order + row labels. */
const LAUNCHER_PROBE = `(() => {
  const rows = [...document.querySelectorAll("[${SHELL_MARKERS.launcherItemAttr}]")];
  const visible = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0;
  };
  return {
    count: rows.length,
    ids: rows.map((el) => el.getAttribute("${SHELL_MARKERS.launcherItemAttr}")),
    visibleIds: rows.filter(visible).map((el) => el.getAttribute("${SHELL_MARKERS.launcherItemAttr}")),
    labels: rows.filter(visible).map((el) => (el.textContent ?? "").replace(/\\s+/g, " ").trim().slice(0, 80)),
  };
})()`;

/** The side-pane tabs currently rendered (a tab appearing here is the proof
 * that opening a launcher entry actually opened a pane tab). */
const TABS_PROBE = `(() => {
  const tabs = [...document.querySelectorAll("[${SHELL_MARKERS.tabIdAttr}]")];
  return {
    count: tabs.length,
    labels: tabs.map((el) => (el.textContent ?? "").replace(/\\s+/g, " ").trim().slice(0, 60)).filter(Boolean),
  };
})()`;

/** The PlayLiquid Console surface state: pane present + its text markers. */
const CONSOLE_PROBE = `(() => {
  const pane = document.querySelector(${JSON.stringify(SHELL_MARKERS.consolePaneSelector)});
  const text = document.body?.innerText ?? "";
  const paneText = (pane?.textContent ?? "").replace(/\\s+/g, " ");
  return {
    panePresent: Boolean(pane),
    ${SHELL_MARKERS.consoleMarkers.map((marker) => `${JSON.stringify(marker)}: paneText.includes(${JSON.stringify(marker)}) || text.includes(${JSON.stringify(marker)}),`).join("\n    ")}
    ${SHELL_MARKERS.consoleStatusMarkers.map((marker) => `${JSON.stringify(marker)}: text.includes(${JSON.stringify(marker)}),`).join("\n    ")}
    paneTextHead: paneText.slice(0, 300),
  };
})()`;

// ---------------------------------------------------------------------------
// 1. journey-welcome-branding
// ---------------------------------------------------------------------------
async function welcomeBrandingCheck(report, page) {
  const expression = bodyTextProbe([
    PRODUCT_MARKERS.welcomeHeading,
    PRODUCT_MARKERS.welcomeSubline,
    PRODUCT_MARKERS.apiKeyEntry,
  ]);
  const wait = await waitForState(
    page,
    expression,
    (value) =>
      value.title === PRODUCT_MARKERS.windowTitle &&
      value.found[PRODUCT_MARKERS.welcomeHeading] &&
      value.found[PRODUCT_MARKERS.apiKeyEntry],
    { timeoutMs: DEFAULTS.journeyStepTimeoutMs, pollMs: DEFAULTS.journeyStepPollMs },
  );
  const value = wait.value ?? {};
  const titleOk = value.title === PRODUCT_MARKERS.windowTitle;
  const welcomeOk = Boolean(value.found?.[PRODUCT_MARKERS.welcomeHeading]);
  const apiKeyOk = Boolean(value.found?.[PRODUCT_MARKERS.apiKeyEntry]);
  const sublineOk = Boolean(value.found?.[PRODUCT_MARKERS.welcomeSubline]);
  const ok = wait.passed;
  report.check(
    "journey-welcome-branding",
    "journey boot: the packaged app reaches the PlayLiquid welcome gate (title + welcome heading + API-key entry)",
    ok ? "pass" : "fail",
    ok
      ? `boot reached the first-run gate in ${Math.round(wait.elapsedMs / 1000)}s: title ${JSON.stringify(value.title)}, ${JSON.stringify(PRODUCT_MARKERS.welcomeHeading)} and ${JSON.stringify(PRODUCT_MARKERS.apiKeyEntry)} visible`
      : `the welcome gate was not observed within ${DEFAULTS.journeyStepTimeoutMs / 1000}s: title=${JSON.stringify(value.title ?? null)} (expected exactly ${JSON.stringify(PRODUCT_MARKERS.windowTitle)}), welcome heading=${welcomeOk}, API-key entry=${apiKeyOk}; text head: ${JSON.stringify(value.textHead ?? null)}`,
    [
      `title observed: ${JSON.stringify(value.title ?? null)}`,
      `welcome heading ${JSON.stringify(PRODUCT_MARKERS.welcomeHeading)}: ${welcomeOk}`,
      `welcome subline ${JSON.stringify(PRODUCT_MARKERS.welcomeSubline)}: ${sublineOk}`,
      `API-key entry ${JSON.stringify(PRODUCT_MARKERS.apiKeyEntry)}: ${apiKeyOk}`,
      `enabled buttons observed: ${JSON.stringify((value.enabledButtons ?? []).slice(0, 12))}`,
      ...(value.__error ? [`probe error: ${value.__error}`] : []),
    ],
  );
  return ok;
}

// ---------------------------------------------------------------------------
// 2. journey-auth-skip
// ---------------------------------------------------------------------------
async function authSkipCheck(report, page) {
  const evidence = [];
  const entry = await clickByText(page, PRODUCT_MARKERS.apiKeyEntry);
  evidence.push(`clicked ${JSON.stringify(PRODUCT_MARKERS.apiKeyEntry)}: ${JSON.stringify(entry)}`);
  if (!entry?.found) {
    report.check(
      "journey-auth-skip",
      "journey auth skip: the API-key entry opens the credential dialog and 'Skip for now' advances past the welcome gate",
      "fail",
      `the ${JSON.stringify(PRODUCT_MARKERS.apiKeyEntry)} control was not found on the welcome surface (${entry?.controls ?? 0} controls scanned)`,
      evidence,
    );
    return false;
  }
  const dialogWait = await waitForState(
    page,
    bodyTextProbe([PRODUCT_MARKERS.skipLabel, "Continue", "Cancel"]),
    (value) => Boolean(value.found?.[PRODUCT_MARKERS.skipLabel]),
    { timeoutMs: DEFAULTS.journeyStepTimeoutMs, pollMs: DEFAULTS.journeyStepPollMs },
  );
  evidence.push(
    `credential dialog: ${JSON.stringify(PRODUCT_MARKERS.skipLabel)} observed=${Boolean(dialogWait.value?.found?.[PRODUCT_MARKERS.skipLabel])} after ${Math.round(dialogWait.elapsedMs / 1000)}s; dialog buttons ${JSON.stringify((dialogWait.value?.enabledButtons ?? []).slice(0, 10))}`,
  );
  if (!dialogWait.passed) {
    report.check(
      "journey-auth-skip",
      "journey auth skip: the API-key entry opens the credential dialog and 'Skip for now' advances past the welcome gate",
      "fail",
      `the credential dialog never showed ${JSON.stringify(PRODUCT_MARKERS.skipLabel)} within ${DEFAULTS.journeyStepTimeoutMs / 1000}s after clicking the API-key entry; text head: ${JSON.stringify(dialogWait.value?.textHead ?? null)}`,
      evidence,
    );
    return false;
  }
  const skipped = await clickExactText(page, PRODUCT_MARKERS.skipLabel);
  evidence.push(`clicked ${JSON.stringify(PRODUCT_MARKERS.skipLabel)}: ${JSON.stringify(skipped)}`);
  const goneWait = await waitForState(
    page,
    bodyTextProbe([PRODUCT_MARKERS.welcomeHeading]),
    (value) => !value.found[PRODUCT_MARKERS.welcomeHeading],
    { timeoutMs: DEFAULTS.journeyStepTimeoutMs, pollMs: DEFAULTS.journeyStepPollMs },
  );
  const welcomeGone = goneWait.passed;
  evidence.push(
    `welcome surface ${JSON.stringify(PRODUCT_MARKERS.welcomeHeading)} gone after skip: ${welcomeGone} (after ${Math.round(goneWait.elapsedMs / 1000)}s); text head now: ${JSON.stringify(goneWait.value?.textHead ?? null)}`,
  );
  report.check(
    "journey-auth-skip",
    "journey auth skip: the API-key entry opens the credential dialog and 'Skip for now' advances past the welcome gate",
    welcomeGone ? "pass" : "fail",
    welcomeGone
      ? `auth skipped without inventing credentials: the dialog rendered, ${JSON.stringify(PRODUCT_MARKERS.skipLabel)} was clicked and the welcome surface is no longer shown`
      : `the welcome surface still shows ${JSON.stringify(PRODUCT_MARKERS.welcomeHeading)} ${Math.round(goneWait.elapsedMs / 1000)}s after clicking ${JSON.stringify(PRODUCT_MARKERS.skipLabel)} — the skip did not advance the first-run state`,
    evidence,
  );
  return welcomeGone;
}

// ---------------------------------------------------------------------------
// 3. journey-onboarding-walk
// ---------------------------------------------------------------------------
async function onboardingWalkCheck(report, page) {
  const onboarding = PRODUCT_MARKERS.onboarding;
  const evidence = [];
  const steps = [];

  // Step 1 — occupation: "What do you do?" → "Software / Data / AI" → Next.
  {
    const wait = await waitForState(
      page,
      bodyTextProbe([onboarding.stepTitles[0], onboarding.occupationOption, onboarding.nextLabel]),
      (value) => Boolean(value.found?.[onboarding.stepTitles[0]] && value.found?.[onboarding.occupationOption]),
      { timeoutMs: DEFAULTS.journeyStepTimeoutMs, pollMs: DEFAULTS.journeyStepPollMs },
    );
    const occupation = wait.passed ? await clickByText(page, onboarding.occupationOption) : { found: false };
    await sleep(600);
    const next = occupation?.found ? await clickExactText(page, onboarding.nextLabel) : { found: false };
    steps.push({
      step: 1,
      title: onboarding.stepTitles[0],
      surfaceReached: wait.passed,
      optionClicked: Boolean(occupation?.found),
      nextClicked: Boolean(next?.found),
      nextDisabled: next?.disabled ?? null,
    });
    evidence.push(
      `step 1 (${JSON.stringify(onboarding.stepTitles[0])}): surface=${wait.passed}, option ${JSON.stringify(onboarding.occupationOption)} clicked=${Boolean(occupation?.found)}, Next clicked=${JSON.stringify(next)}`,
    );
  }

  // Step 2 — UI mode: "Choose your UI mode" → "Coding mode" → Next.
  {
    const wait = await waitForState(
      page,
      bodyTextProbe([onboarding.stepTitles[1], onboarding.uiModeOption, onboarding.nextLabel]),
      (value) => Boolean(value.found?.[onboarding.stepTitles[1]] && value.found?.[onboarding.uiModeOption]),
      { timeoutMs: DEFAULTS.journeyStepTimeoutMs, pollMs: DEFAULTS.journeyStepPollMs },
    );
    const mode = wait.passed ? await clickByText(page, onboarding.uiModeOption) : { found: false };
    await sleep(600);
    const next = mode?.found ? await clickExactText(page, onboarding.nextLabel) : { found: false };
    steps.push({
      step: 2,
      title: onboarding.stepTitles[1],
      surfaceReached: wait.passed,
      optionClicked: Boolean(mode?.found),
      nextClicked: Boolean(next?.found),
      nextDisabled: next?.disabled ?? null,
    });
    evidence.push(
      `step 2 (${JSON.stringify(onboarding.stepTitles[1])}): surface=${wait.passed}, option ${JSON.stringify(onboarding.uiModeOption)} clicked=${Boolean(mode?.found)}, Next clicked=${JSON.stringify(next)}`,
    );
  }

  // Step 3 — preferences: "Personalize your work assistant" → Skip
  // (fallbacks: "Next", then the real continue label "Get started").
  {
    const wait = await waitForState(
      page,
      bodyTextProbe([onboarding.stepTitles[2], onboarding.skipLabel]),
      (value) => Boolean(value.found?.[onboarding.stepTitles[2]]),
      { timeoutMs: DEFAULTS.journeyStepTimeoutMs, pollMs: DEFAULTS.journeyStepPollMs },
    );
    let exit = { found: false, clicked: null };
    if (wait.passed) {
      for (const label of [onboarding.skipLabel, onboarding.nextLabel, onboarding.startLabel]) {
        exit = await clickExactText(page, label);
        if (exit?.found) {
          exit.clicked = label;
          break;
        }
      }
    }
    steps.push({
      step: 3,
      title: onboarding.stepTitles[2],
      surfaceReached: wait.passed,
      exitLabel: exit?.found ? exit.clicked : null,
    });
    evidence.push(
      `step 3 (${JSON.stringify(onboarding.stepTitles[2])}): surface=${wait.passed}, exit control=${JSON.stringify(exit?.found ? exit.clicked : null)} (tried ${JSON.stringify([onboarding.skipLabel, onboarding.nextLabel, onboarding.startLabel])})`,
    );
  }

  // Completion proof: the workspace composer is reached.
  const composerWait = await waitForState(
    page,
    `(() => {
      const placeholders = [...document.querySelectorAll("[aria-placeholder], textarea, input[type='text'], input[type='search']")]
        .map((el) => el.getAttribute("aria-placeholder") ?? el.getAttribute("placeholder") ?? "")
        .filter(Boolean);
      const composerPlaceholder = placeholders.find((value) => value.startsWith(${JSON.stringify(PRODUCT_MARKERS.composerPlaceholderPrefix)})) ?? null;
      const text = document.body?.innerText ?? "";
      return {
        composerPlaceholderPresent: composerPlaceholder !== null,
        composerPlaceholderValue: composerPlaceholder,
        onboardingStillVisible: ${JSON.stringify(onboarding.stepTitles)}.some((title) => text.includes(title)),
        textHead: text.replace(/\\s+/g, " ").slice(0, 300),
      };
    })()`,
    (value) => Boolean(value.composerPlaceholderPresent),
    { timeoutMs: DEFAULTS.journeyStepTimeoutMs, pollMs: DEFAULTS.journeyStepPollMs },
  );
  const composerReached = composerWait.passed;
  evidence.push(
    `completion: composer placeholder ${JSON.stringify(PRODUCT_MARKERS.composerPlaceholderPrefix)}… reached=${composerReached} after ${Math.round(composerWait.elapsedMs / 1000)}s (observed: ${JSON.stringify(composerWait.value?.composerPlaceholderValue ?? null)}); onboarding titles still visible=${Boolean(composerWait.value?.onboardingStillVisible)}`,
  );
  const allStepsWalked = steps.every((step) => step.surfaceReached) && composerReached;
  report.check(
    "journey-onboarding-walk",
    "journey onboarding: the 3-step first-run wizard advances (occupation → UI mode → preferences) and completes into the workspace composer",
    allStepsWalked ? "pass" : "fail",
    allStepsWalked
      ? `all three onboarding steps advanced and the wizard completed into the workspace (composer placeholder observed: ${JSON.stringify(composerWait.value?.composerPlaceholderValue ?? null)})`
      : `the onboarding walk did not complete: ${JSON.stringify(steps)}; composer reached=${composerReached}; text head: ${JSON.stringify(composerWait.value?.textHead ?? null)}`,
    evidence,
  );
  return composerReached;
}

// ---------------------------------------------------------------------------
// 4. journey-workspace-composer
// ---------------------------------------------------------------------------
async function workspaceComposerCheck(report, page) {
  const needles = [
    PRODUCT_MARKERS.selectProject,
    ...PRODUCT_MARKERS.sidebarLabels,
    ...PRODUCT_MARKERS.extraSidebarLabels,
  ];
  const expression = `(() => {
    const text = document.body?.innerText ?? "";
    const placeholders = [...document.querySelectorAll("[aria-placeholder], textarea, input[type='text'], input[type='search']")]
      .map((el) => el.getAttribute("aria-placeholder") ?? el.getAttribute("placeholder") ?? "")
      .filter(Boolean);
    const composerPlaceholder = placeholders.find((value) => value.startsWith(${JSON.stringify(PRODUCT_MARKERS.composerPlaceholderPrefix)})) ?? null;
    const controls = [...document.querySelectorAll("button, a, [role='tab'], [role='button']")];
    const controlHas = (needle) => controls.some((el) => {
      const label = ((el.getAttribute("aria-label") ?? "") + " " + (el.textContent ?? "")).replace(/\\s+/g, " ").trim();
      return label.toLowerCase().includes(needle.toLowerCase());
    });
    const found = {};
    for (const needle of ${JSON.stringify(needles)}) {
      found[needle] = text.includes(needle) || controlHas(needle);
    }
    return {
      composerPlaceholderPresent: composerPlaceholder !== null,
      composerPlaceholderValue: composerPlaceholder,
      selectProject: found[${JSON.stringify(PRODUCT_MARKERS.selectProject)}],
      sidebarLabels: ${JSON.stringify(PRODUCT_MARKERS.sidebarLabels)}.map((label) => found[label]),
      extraSidebarLabels: ${JSON.stringify(PRODUCT_MARKERS.extraSidebarLabels)}.map((label) => found[label]),
      textHead: text.replace(/\\s+/g, " ").slice(0, 300),
    };
  })()`;
  const wait = await waitForState(
    page,
    expression,
    (value) =>
      Boolean(
        value.composerPlaceholderPresent &&
          value.selectProject &&
          value.sidebarLabels?.every(Boolean),
      ),
    { timeoutMs: DEFAULTS.journeyStepTimeoutMs, pollMs: DEFAULTS.journeyStepPollMs },
  );
  const value = wait.value ?? {};
  const ok = wait.passed;
  report.check(
    "journey-workspace-composer",
    "journey workspace: the New Task composer renders (placeholder + Select project + the primary sidebar labels)",
    ok ? "pass" : "fail",
    ok
      ? `workspace composer observed: placeholder ${JSON.stringify(value.composerPlaceholderValue)}, ${JSON.stringify(PRODUCT_MARKERS.selectProject)} present, sidebar labels ${JSON.stringify(PRODUCT_MARKERS.sidebarLabels)} all present`
      : `the workspace composer markers were not all observed within ${DEFAULTS.journeyStepTimeoutMs / 1000}s: placeholder=${JSON.stringify(value.composerPlaceholderValue ?? null)}, ${JSON.stringify(PRODUCT_MARKERS.selectProject)}=${value.selectProject ?? null}, sidebar labels ${JSON.stringify(PRODUCT_MARKERS.sidebarLabels)} = ${JSON.stringify(value.sidebarLabels ?? [])}; text head: ${JSON.stringify(value.textHead ?? null)}`,
    [
      `composer placeholder: ${JSON.stringify(value.composerPlaceholderValue ?? null)}`,
      `${JSON.stringify(PRODUCT_MARKERS.selectProject)}: ${value.selectProject ?? null}`,
      `sidebar labels (required): ${PRODUCT_MARKERS.sidebarLabels.map((label, index) => `${JSON.stringify(label)}=${value.sidebarLabels?.[index] ?? null}`).join(", ")}`,
      `sidebar labels (recorded, not required): ${PRODUCT_MARKERS.extraSidebarLabels.map((label, index) => `${JSON.stringify(label)}=${value.extraSidebarLabels?.[index] ?? null}`).join(", ")}`,
    ],
  );
  return ok;
}

// ---------------------------------------------------------------------------
// 5. journey-newtab-five-options
// ---------------------------------------------------------------------------
async function newTabFiveOptionsCheck(report, page) {
  const evidence = [];
  const toggle = await clickSelector(page, `[data-testid="${SHELL_MARKERS.sidePaneToggle}"]`);
  evidence.push(`clicked [${SHELL_MARKERS.sidePaneToggle}]: ${JSON.stringify(toggle)}`);
  if (!toggle?.found) {
    report.check(
      "journey-newtab-five-options",
      "journey New Tab: the side pane expands and the launcher offers the five built-in entries in canonical order",
      "fail",
      `the side pane toggle [data-testid=${SHELL_MARKERS.sidePaneToggle}] is not rendered on the workspace surface`,
      evidence,
    );
    return false;
  }
  const paneWait = await waitForState(
    page,
    selectorPresenceProbe(SHELL_MARKERS.addTabTrigger),
    (value) => Boolean(value.present && value.visible),
    { timeoutMs: DEFAULTS.uiStateTimeoutMs, pollMs: DEFAULTS.uiStatePollMs },
  );
  evidence.push(
    `side pane expanded (add-tab trigger ${SHELL_MARKERS.addTabTrigger} present+visible): ${paneWait.passed} after ${Math.round(paneWait.elapsedMs / 1000)}s — ${JSON.stringify(paneWait.value)}`,
  );
  if (!paneWait.passed) {
    report.check(
      "journey-newtab-five-options",
      "journey New Tab: the side pane expands and the launcher offers the five built-in entries in canonical order",
      "fail",
      `the side pane did not expand within ${DEFAULTS.uiStateTimeoutMs / 1000}s after clicking the toggle (add-tab trigger ${SHELL_MARKERS.addTabTrigger} not present/visible)`,
      evidence,
    );
    return false;
  }
  const launcherClick = await clickSelector(page, SHELL_MARKERS.addTabTrigger);
  evidence.push(`clicked ${SHELL_MARKERS.addTabTrigger}: ${JSON.stringify(launcherClick)}`);
  const launcherWait = await waitForState(
    page,
    LAUNCHER_PROBE,
    (value) => Array.isArray(value.visibleIds) && value.visibleIds.length > 0,
    { timeoutMs: DEFAULTS.uiStateTimeoutMs, pollMs: DEFAULTS.uiStatePollMs },
  );
  const ids = launcherWait.value?.visibleIds ?? [];
  evidence.push(
    `launcher rows: ${JSON.stringify(ids)} (labels: ${JSON.stringify((launcherWait.value?.labels ?? []).slice(0, 8))}) after ${Math.round(launcherWait.elapsedMs / 1000)}s`,
  );
  const expected = SHELL_MARKERS.expectedLauncherIds;
  const missing = expected.filter((id) => !ids.includes(id));
  // Canonical order as a subsequence: every expected id present and their
  // positions strictly increasing (optional rows may trail the built-ins).
  const positions = expected.map((id) => ids.indexOf(id));
  const ordered =
    positions.every((position) => position !== -1) &&
    positions.every((position, index) => index === 0 || position > positions[index - 1]);
  const extras = ids.filter((id) => !expected.includes(id));
  const ok = missing.length === 0 && ordered;
  report.check(
    "journey-newtab-five-options",
    "journey New Tab: the side pane expands and the launcher offers the five built-in entries in canonical order",
    ok ? "pass" : "fail",
    ok
      ? `launcher rendered the five built-in entries in canonical order: ${JSON.stringify(ids)} (extras recorded, not required: ${JSON.stringify(extras)})`
      : `launcher rows did not match the five built-in entries in canonical order: observed ${JSON.stringify(ids)}; missing=${JSON.stringify(missing)}; orderOk=${ordered}`,
    [
      ...evidence,
      `expected ids (canonical order): ${JSON.stringify(expected)}`,
      `optional ids allowed after the built-ins (${JSON.stringify(SHELL_MARKERS.optionalLauncherIds)}) — extras observed: ${JSON.stringify(extras)}`,
    ],
  );
  return ok;
}

// ---------------------------------------------------------------------------
// 6. journey-console-opens
// ---------------------------------------------------------------------------
async function consoleOpensCheck(report, page) {
  const evidence = [];
  const row = await clickSelector(page, `[${SHELL_MARKERS.launcherItemAttr}="playliquid-console"]`);
  evidence.push(`clicked the playliquid-console launcher row: ${JSON.stringify(row)}`);
  if (!row?.found) {
    report.check(
      "journey-console-opens",
      "journey Console: the PlayLiquid Console tab opens with its header, world-projects workbench and live registry status",
      "fail",
      `the playliquid-console launcher row [${SHELL_MARKERS.launcherItemAttr}="playliquid-console"] was not rendered in the New Tab launcher`,
      evidence,
    );
    return false;
  }
  const consoleWait = await waitForState(
    page,
    CONSOLE_PROBE,
    (value) =>
      Boolean(
        value.panePresent &&
          value["PlayLiquid Console"] &&
          value["World projects"] &&
          value["registry open"],
      ),
    { timeoutMs: DEFAULTS.journeyStepTimeoutMs, pollMs: DEFAULTS.journeyStepPollMs },
  );
  const value = consoleWait.value ?? {};
  const ok = consoleWait.passed;
  report.check(
    "journey-console-opens",
    "journey Console: the PlayLiquid Console tab opens with its header, world-projects workbench and live registry status",
    ok ? "pass" : "fail",
    ok
      ? `the Console tab opened: header ${JSON.stringify("PlayLiquid Console")}, workbench text ${JSON.stringify("World projects")} and status ${JSON.stringify("registry open")} all present (badge ${JSON.stringify("services live")}: ${value["services live"]})`
      : `the Console surface did not fully render within ${DEFAULTS.journeyStepTimeoutMs / 1000}s: pane=${value.panePresent ?? null}, ${JSON.stringify(SHELL_MARKERS.consoleMarkers)}=${JSON.stringify(SHELL_MARKERS.consoleMarkers.map((marker) => value[marker] ?? null))}, ${JSON.stringify("registry open")}=${value["registry open"] ?? null}; pane text head: ${JSON.stringify(value.paneTextHead ?? null)}`,
    [
      ...evidence,
      `console markers (${JSON.stringify(SHELL_MARKERS.consoleMarkers)} + ${JSON.stringify("registry open")}): ${JSON.stringify({
        panePresent: value.panePresent ?? null,
        "PlayLiquid Console": value["PlayLiquid Console"] ?? null,
        "World projects": value["World projects"] ?? null,
        "registry open": value["registry open"] ?? null,
        "services live": value["services live"] ?? null,
      })}`,
      `pane text head: ${JSON.stringify(value.paneTextHead ?? null)}`,
    ],
  );
  return ok;
}

/** Journey battery: drives the golden path in order; each check records its
 * own honest outcome. Steps return booleans so a failed early step still
 * lets later checks run (and fail honestly with what they observe). */
export async function journeyChecks(report, page) {
  await welcomeBrandingCheck(report, page);
  await authSkipCheck(report, page);
  await onboardingWalkCheck(report, page);
  await workspaceComposerCheck(report, page);
  await newTabFiveOptionsCheck(report, page);
  await consoleOpensCheck(report, page);
}
