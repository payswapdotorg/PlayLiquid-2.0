/**
 * qa-desktop-release module manifest (RW-003 / UX-003 / PLX-REL-001 — work
 * orders from the PlayLiquid reference implementation).
 *
 * The packaged-app release QA surface: window-level smoke tests of the
 * BUILT Linux application (packaged AppImage / .deb), covering startup
 * and clean shutdown, PlayLiquid product identity, the UNIFIED-shell
 * golden path (welcome → auth skip → 3-step onboarding → workspace
 * composer → five-option New Tab launcher → PlayLiquid Console side-pane
 * tab — TL handoff §2: no separate GameOS workspace), clean-profile
 * startup, no-dev-server independence and both required viewports
 * (390x844, 1280x800). UX-003 adds enforceable UX acceptance: workbench
 * chrome geometry at three widths (1280x800, the 480px minimum OS
 * window, 390x844 emulated — overlap/clipping/overflow through computed
 * bounding boxes) and accessibility (keyboard navigation + Enter
 * activation on the real chrome controls, visible focus, accessible
 * names). Evidence is actual rendering/window output (Electron under
 * Xvfb + CDP screenshots/logs), with honest outcome reporting on every
 * check. Harness code may use platform-contracts vocabulary for
 * tenancy-honest fixtures; it imports no domain implementation.
 */
export const qa_desktopReleaseModule = {
  id: "qa-desktop-release",
  requires: ["platform-contracts"],
  provides: ["qa-desktop-release"],
  publicEntrypoints: ["src/index.ts"],
} as const;
