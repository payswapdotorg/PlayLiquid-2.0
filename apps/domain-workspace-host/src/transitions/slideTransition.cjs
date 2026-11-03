/**
 * PlayLiquid host — the single-flight slide engine (main process).
 *
 * Drives the domain WebContentsView bounds through exactly one rAF loop.
 * Contract (identical to the review console's mirror):
 *   - ~250 ms, ease-out cubic, horizontal only;
 *   - single-flight: a new request during a flight retargets instantly from
 *     the current interpolated position (never restarts from an end-stop);
 *   - fully reversible mid-flight (rapid « » clicking is safe);
 *   - reduced-motion collapses the slide to an instant swap.
 */

"use strict";

const { easeOutCubic } = require("./easing.cjs");
const { TRANSITION } = require("../config.cjs");

class SlideTransition {
  /**
   * @param {{ durationMs?: number, reducedMotion?: boolean }} [options]
   */
  constructor(options = {}) {
    this.durationMs = options.durationMs ?? TRANSITION.durationMs;
    this.reducedMotion = Boolean(options.reducedMotion);
    this._frame = null;
    this._flight = null;
    this._position = 0; // 0 = general (parked), 1 = domain (covering)
  }

  /** Current interpolated position in [0,1]. */
  get position() {
    return this._position;
  }

  /** True while a flight is running. */
  get transitioning() {
    return this._frame != null;
  }

  /**
   * Request a slide to `target` (0 or 1).
   *
   * @param {0|1} target
   * @param {(position: number) => void} onFrame
   * @param {(position: number) => void} [onDone]
   */
  slide(target, onFrame, onDone) {
    const to = target === 1 ? 1 : 0;
    this._cancelFrame();

    if (this.reducedMotion || this.durationMs <= 0) {
      this._position = to;
      this._flight = null;
      if (typeof onFrame === "function") onFrame(to);
      if (typeof onDone === "function") onDone(to);
      return;
    }

    const from = this._position;
    if (from === to) {
      this._flight = null;
      if (typeof onFrame === "function") onFrame(to);
      if (typeof onDone === "function") onDone(to);
      return;
    }

    const startedAt = now();
    this._flight = { from, to, startedAt, onFrame, onDone };

    const tick = () => {
      const flight = this._flight;
      if (!flight) return;
      let t = (now() - flight.startedAt) / this.durationMs;
      if (t >= 1) t = 1;
      const next = flight.from + (flight.to - flight.from) * easeOutCubic(t);
      this._position = next;
      if (typeof flight.onFrame === "function") flight.onFrame(next);
      if (t >= 1) {
        const done = flight.onDone;
        this._position = flight.to;
        this._flight = null;
        this._cancelFrame();
        if (typeof done === "function") done(flight.to);
        return;
      }
      this._frame = setImmediate(tick);
    };
    this._frame = setImmediate(tick);
  }

  /** Stop any in-flight animation (position stays where it is). */
  cancel() {
    this._cancelFrame();
    this._flight = null;
  }

  _cancelFrame() {
    if (this._frame != null) {
      clearImmediate(this._frame);
      this._frame = null;
    }
  }
}

/** rAF-equivalent clock (main process has no requestAnimationFrame). */
function now() {
  const h = process.hrtime ? process.hrtime() : [0, 0];
  return h[0] * 1e3 + h[1] / 1e6;
}

module.exports = { SlideTransition };
