# QA — Verification Record (Milestone 1)

## Integrity (criterion A) — machine-checked

Tool: `apps/domain-workspace-host/scripts/verify-upstream-integrity.mjs`

Rule: **pass ⇔ zero upstream files modified / deleted / renamed vs baseline**
(history and working tree; additions unrestricted).

- Baseline: `a9fe401eede6e6e5e01be9048679c206fe6f02d9`
  (cross-checked at fork time against `zai-org/ZCode` HEAD via the GitHub
  API; the earlier candidate `a60ba6a7` = tag `v3.17.1` is retained).
- Fork `main` vs upstream `main`: identical commit SHA and identical tree
  hash (`e4e4c38936b992469ddade0defc28ff6ba636622`); `git diff --stat`
  empty.
- Committed report: `docs/qa/integrity-report.json`; manifest:
  `docs/qa/added-files.txt`.

## Runtime evidence (criteria B/C/D) — automated Xvfb run

The original milestone run (2026-11-03, sandbox, Xvfb + software rendering)
launched the **unmodified upstream dev pipeline** with the host injected, then
let the host switch `general → domain → general` on its own
(`ZCODE_DOMAIN_WORKSPACE_AUTOSWITCH=1`), capturing every settled state:

| Capture | Shows |
|---|---|
| `evidence-01-initial-zcode-splash.png` | untouched upstream renderer boots (startup splash, Z logo), 1200×800 |
| `evidence-02-domain-active.png` | domain landing page active, live host state in its status bar (proves the main↔view IPC wiring) |
| `evidence-03-zcode-covered.png` | upstream webContents while covered — occlusion-paused paint, parked, never destroyed/reloaded |
| `evidence-04-domain-parked.png` | domain view parked offscreen after return — own state intact |
| `evidence-05-zcode-restored.png` | original workspace revealed exactly where it was; reverse transition complete |
| `evidence-06-switcher-cluster.png` | the additive « » cluster at its exact configured geometry (64×32 @ x=117, y=6) |

Captures were VLM-verified at run time (upstream splash renders; domain page
renders with live host state).

## State preservation (criterion C) — by construction + spot checks

- The attachment layer never calls anything that could reset upstream state:
  no `webContents.reload`, no navigation of the base webContents, no window
  recreation, no resize of the window. Verified by code review of
  `src/attachment.cjs` against the upstream lifecycle surface.
- Terminal/browser/composer state lives in the upstream HOST utility process
  and renderer, both untouched by the host's code paths (process gating in
  `src/bootstrap.cjs`).
- Interactive long-run stress (login persistence, terminal/browser panels
  across switches, rapid-click stress) requires a real machine — the 4 GB
  sandbox OOM-killer ends sessions after the automated switch sequences
  complete. Structural guarantees above do not depend on it.

## Re-running everything

```bash
# integrity:
node apps/domain-workspace-host/scripts/verify-upstream-integrity.mjs

# full runtime + fresh evidence (needs a display; Xvfb works):
node apps/domain-workspace-host/scripts/dev.mjs --autoswitch
```
