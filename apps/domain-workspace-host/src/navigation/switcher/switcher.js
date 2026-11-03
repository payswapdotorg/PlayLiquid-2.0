/**
 * PlayLiquid — switcher cluster logic.
 *
 * Prev/next workspace navigation, mirroring the review console's cluster
 * one-to-one: disabled at the end-stops, pip thumb tracking the active
 * workspace, state arriving live from the host over the disjoint
 * zcode-domain-workspace:* IPC namespace.
 */

"use strict";

(function () {
  var bridge = window.playliquidSwitcher || null;

  var prev = document.getElementById("btn-prev");
  var next = document.getElementById("btn-next");
  var thumb = document.getElementById("pip-thumb");

  function render(state) {
    if (!state) return;
    var atStart = !state.canGoBack;
    var atEnd = !state.canGoForward;
    if (prev) prev.disabled = atStart;
    if (next) next.disabled = atEnd;
    if (thumb) {
      thumb.style.transform = "translateX(" + (state.activeIndex * 100) + "%)";
    }
  }

  function send(direction) {
    if (bridge && typeof bridge.switchWorkspace === "function") {
      bridge.switchWorkspace(direction);
    }
  }

  if (prev) prev.addEventListener("click", function () { send("previous"); });
  if (next) next.addEventListener("click", function () { send("next"); });

  document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") { send("previous"); }
    if (event.key === "ArrowRight") { send("next"); }
  });

  if (bridge) {
    if (typeof bridge.getState === "function") {
      bridge.getState().then(render).catch(function () {});
    }
    if (typeof bridge.onStateChanged === "function") {
      bridge.onStateChanged(render);
    }
  }
})();
