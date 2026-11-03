/**
 * PlayLiquid host — easing curves for the workspace slide.
 *
 * Mirrored bit-for-bit by the review console's browser demo
 * (src/app/page.tsx :: easeOutCubic) so both engines are provably the same
 * contract: pure functions, no state.
 */

"use strict";

/** t ∈ [0,1] → eased ∈ [0,1], decelerating to the target. */
function easeOutCubic(t) {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  return 1 - Math.pow(1 - clamped, 3);
}

const EASINGS = { easeOutCubic };

module.exports = { easeOutCubic, EASINGS };
