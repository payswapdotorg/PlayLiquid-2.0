/**
 * qa-desktop-release public entrypoint (RW-003 — work order from the
 * PlayLiquid reference implementation). Exports the module manifest; the packaged-app
 * release QA harness itself lives in src/harness/ and is executed through
 * scripts/run-smoke.mjs (zero-dependency Node >= 22, Xvfb + CDP window-level
 * evidence — see README.md for run instructions and honest scope).
 */
export { qa_desktopReleaseModule } from "./module.ts";
