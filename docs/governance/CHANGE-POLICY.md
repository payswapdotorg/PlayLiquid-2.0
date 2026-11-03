# PlayLiquid-2.0 Controlled Change Policy

**Version:** controlled-change-v1 · **Adopted:** 2026-11-03 · **Owner:** PlayLiquid TL
**Baseline:** `a9fe401eede6e6e5e01be9048679c206fe6f02d9` (ZCode v3.17.2)

## Purpose

The milestone-1 additions-only rule (no upstream file may ever be modified) is retired.
The PlayLiquid transformation — global theme, branding, native panel integration, packaging
identity — legitimately requires modifying inherited upstream files. This policy defines
**which surfaces may be modified, by whom, with what evidence**, and is enforced by
`scripts/governance/verify-change-policy.mjs` in CI on every push and pull request.

This is a preservation contract, not a rewrite license.

## Allowed write surfaces

Changes in these surfaces require a manifest entry but no dedicated TL review beyond the
normal PR review:

| Surface | Paths (examples) |
|---|---|
| Shared UI theme tokens and visual components | `packages/ui/src/styles.css`, `packages/ui/src/components/ui/**`, `packages/ui/src/useTheme.ts` |
| User-facing UI and navigation components | `packages/ui/src/app-shell/**`, `packages/ui/src/root/**`, `packages/ui/src/settings/**`, `packages/ui/src/i18n/**` |
| Branding and icon assets | `public/logo/**`, `packages/desktop/build/**`, `packages/ui/src/**/ZCode*Logo*.tsx`, splash markup |
| Desktop product metadata and installer identity | `packages/desktop/scripts/desktop-product-identity*`, `packages/desktop/electron-builder.config.js`, `packages/desktop/package.json` (identity fields), `packages/desktop/src/main/desktopRuntimeEnv.ts` |
| New Tab / tool-panel registration | `packages/ui/src/app-shell/animatedSidePanePanelModel.ts`, `AnimatedSidePanePanel.tsx`, `packages/ui/src/lib/workspaceSidePane.ts`, `packages/ui/src/hooks/useAppPanels.ts` (additive registration only) |
| PlayLiquid Console components and adapters | `packages/gameos/**`, `packages/web/gameos-*` (new, ported from the reference repo) |
| Release workflows and packaging configuration | `.github/workflows/release-desktop.yml`, `packages/desktop/scripts/bundle.mjs` (identity params only), `qa/desktop-release/**` |
| Tests and visual-regression infrastructure | `packages/desktop/test/**`, `scripts/**` (new files), `docs/qa/**` |
| Documentation | `docs/**`, `README*`, `AGENTS.md` (additive) |

## Protected write surfaces

Any change here requires **all of**: manifest entry, explicit `justification`, `tlApproval`
(the TL must have reviewed the diff), tests proving behavior preservation, and a rollback
strategy. The verifier hard-fails without them.

| Protected capability | Representative paths |
|---|---|
| Agent runtime core | `apps/zcode-cli/packages/core/src/**` (runtime, tool handlers, context, memory, compact, mcp, permission, subagent) |
| Task/session lifecycle & persistence | `packages/services/src/session/**`, `packages/services/src/zcode-session/**`, `packages/shared/src/sqlite-migrations/**` |
| Model/provider routing & credentials | `packages/provider/**`, `packages/provider-node/**`, `packages/model-option-map/**`, `packages/services/src/model-provider/**`, `packages/services/src/credential/**`, `packages/services/src/providers/**` |
| Permissions & approval logic | `apps/zcode-cli/packages/core/src/permission/**`, `packages/services/src/cua-permission-broker/**` |
| RPC / client / server contracts | `packages/rpc/**`, `packages/client/**`, `packages/server/**`, `packages/shared/src/zcode-protocol/**`, `packages/shared/src/channels.ts` |
| Browser & terminal execution engines | `packages/desktop/src/main/browserView/**`, `packages/services/src/terminal/**` |
| Filesystem & workspace services | `packages/services/src/file/**`, `packages/services/src/project/**`, `packages/services/src/project-storage/**` |
| Automation & plugin runtimes | `packages/services/src/session/automation*`, `packages/services/src/plugins/**`, `apps/zcode-cli/packages/*-plugin/**`, `packages/services/src/plugin-ui-bridge/**` |
| Security boundaries | `packages/desktop/src/main/**` (permission/policy paths), `packages/shared/src/security/**` |
| Upstream architecture governance semantics | `scripts/architecture/**` (adding `exceptions` rows is allowed; changing enforcement semantics is protected) |

## Manifest

Every intentional modification or deletion of a baseline file is recorded in
`docs/governance/authorized-modifications.json`:

```json
{
  "path": "packages/ui/src/styles.css",
  "change": "modified",
  "surface": "allowed",
  "workPackage": "worker-a-theme-branding",
  "owner": "worker-a",
  "reason": "Replace 4 theme token blocks with PlayLiquid design tokens",
  "tests": ["pnpm lint", "engineering vitest", "wdio e2e settings/panel specs"],
  "rollback": "git revert <merge sha>",
  "justification": "required-only-for-protected",
  "tlApproval": "required-only-for-protected"
}
```

Rules:
1. A Modified/Deleted baseline file absent from the manifest → **CI failure**.
2. A manifest entry matching a protected surface without `justification` + `tlApproval` → **CI failure**.
3. Stale manifest entries (file no longer differs from baseline) → warning only.
4. Re-introducing retired paths (`apps/domain-workspace-host/**`,
   `.github/workflows/playliquid-integrity.yml`) → **CI failure**.
5. Additions (new files) are allowed by default; new packages must be registered in
   `architecture-policy.yaml` per the upstream module rules.

## Interaction with upstream architecture governance

`pnpm architecture:check --changed` (module contracts, layer rules, cycles) continues to run
unchanged. Where an edit to an existing upstream file trips the `unmanaged-new-file` rule,
register an `exceptions` row in `architecture-policy.yaml` with reason — the same mechanism
upstream itself uses. The snapshot/admission machinery (`scripts/architecture/upstream-snapshot.json`)
remains a truthful record of the upstream tree; it is never hand-edited to mask modifications.

## Rollback

Each manifest entry carries its rollback strategy. Work-package branches are merged to main
via no-ff merges so any single package can be reverted with `git revert -m 1 <merge-sha>`.
