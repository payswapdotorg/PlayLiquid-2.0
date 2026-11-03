/**
 * PlayLiquid — domain workspace renderer logic.
 *
 * Vanilla JS, no framework. Two jobs:
 *   1. an isolated hash router (#/ and #/about) — this workspace's own
 *      navigation state, which survives every switch and restart;
 *   2. render live host state (from the domainPreload bridge) into the
 *      status bar, and forward "back to ZCode" intents to the host.
 */

"use strict";

(function () {
  var bridge = window.playliquidDomain || null;

  /* ------------------------------------------------------------ router */
  var ROUTES = ["#/", "#/about"];

  function applyRoute() {
    var hash = window.location.hash || "#/";
    if (ROUTES.indexOf(hash) === -1) hash = "#/";
    document.body.dataset.route = hash;

    var panels = document.querySelectorAll("[data-route-panel]");
    for (var i = 0; i < panels.length; i += 1) {
      panels[i].hidden = panels[i].dataset.routePanel !== hash;
    }

    var overview = document.getElementById("btn-overview");
    var about = document.getElementById("btn-about");
    if (overview) overview.classList.toggle("is-active", hash === "#/");
    if (about) about.classList.remove("is-active");

    var readout = document.getElementById("route-readout");
    if (readout) readout.textContent = "current route: " + hash;
    var statRoute = document.getElementById("stat-route");
    if (statRoute) statRoute.textContent = hash;
  }

  window.addEventListener("hashchange", applyRoute);

  var routeButtons = document.querySelectorAll("[data-route-btn]");
  for (var r = 0; r < routeButtons.length; r += 1) {
    routeButtons[r].addEventListener("click", function (event) {
      window.location.hash = event.currentTarget.dataset.routeBtn.replace(/^#/, "");
    });
  }

  /* -------------------------------------------------- back to upstream */
  function goBack() {
    if (bridge && typeof bridge.switchWorkspace === "function") {
      bridge.switchWorkspace("previous");
    }
  }

  var backControls = document.querySelectorAll("[data-nav='back']");
  for (var b = 0; b < backControls.length; b += 1) {
    backControls[b].addEventListener("click", goBack);
  }

  /* --------------------------------------------------------- host state */
  function renderState(state) {
    if (!state) return;

    var workspaces = document.getElementById("stat-workspaces");
    if (workspaces && state.workspaces) {
      var active =
        state.workspaces[state.activeIndex] || { title: "\u2014" };
      workspaces.textContent =
        state.workspaces.length + " registered \u00b7 active: " + active.title;
    }

    var hostMode = document.getElementById("stat-hostmode");
    if (hostMode && state.hostMode) hostMode.textContent = state.hostMode;

    var transition = document.getElementById("stat-transition");
    if (transition && state.transition) {
      transition.textContent = state.transition;
    }

    var baseline = document.getElementById("stat-baseline");
    if (baseline && state.baseline) {
      baseline.textContent = state.baseline + " (upstream main, fork baseline)";
    }
  }

  if (bridge) {
    if (typeof bridge.getState === "function") {
      bridge.getState().then(renderState).catch(function () {});
    }
    if (typeof bridge.onStateChanged === "function") {
      bridge.onStateChanged(renderState);
    }
  }

  applyRoute();
})();
