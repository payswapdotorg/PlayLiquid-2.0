# Architecture — Domain Workspace Host

> Status: milestone 1 (foundation). Baseline: `zai-org/ZCode` @
> `a9fe401eede6e6e5e01be9048679c206fe6f02d9` (v3.17.2 source sync).
> Rule: the fork differs from baseline by **additions only** — enforced by
> `apps/domain-workspace-host/scripts/verify-upstream-integrity.mjs`.

## 1. Goal

One application window, two coexisting workspaces:

| Workspace | Owner | Surface | Lifetime |
|---|---|---|---|
| `general` | upstream ZCode | the window's base webContents | created/owned by upstream; the host never touches its lifecycle |
| `domain` | PlayLiquid host | a `WebContentsView` added to `win.contentView` | created once on attach; parked offscreen when "hidden" |

The host's whole surface area is two views and one disjoint IPC namespace.
Upstream state (tasks, sessions, terminal, browser, composer, auth) is never
read, written, or reset by the host.

## 2. Process placement

```
Electron main ("browser")
├─ upstream out/main/index.js        ← untouched
└─ playliquid bootstrap (injected)   ← NODE_OPTIONS="--require …"
      hooks Module._load once ── captures `electron` module
      install.cjs: shim + watch primary window
      attachment.cjs: 2 × WebContentsView + zcode-domain-workspace:* IPC
            ├─ domainView   (full area, sandboxed, own session partition)
            └─ switcherView (64×32 titlebar band, sandboxed)

HOST utilityProcess (upstream)  ← untouched, unaware of the host
scheduler (upstream)            ← untouched
renderer (upstream)             ← untouched; covered/revealed only
```

The bootstrap rides `NODE_OPTIONS`, which the upstream dev pipeline forwards
to every child process (`...process.env` passthrough — verified upstream
fact). Process gating makes it inert everywhere except the Electron main
process: plain node children lack `process.versions.electron`; the HOST
utility process and renderers report `process.type` ≠ `"browser"`.

## 3. Attachment sequence

1. `bootstrap.cjs` arms a **one-shot** `Module._load` hook. `require("electron")`
   throws during the `--require` phase, so the hook waits for upstream's own
   CJS require chain (electron-updater is first) to pull the module in —
   before any window exists. The hook restores `Module._load` immediately
   after capture.
2. `install.cjs` applies the gated `app.getVersion` shim (raw-electron dev
   launches only) and starts watching for the primary workbench window.
3. `windowFilter.cjs` recognizes the primary window **purely by URL shape**:
   dev-server root or `out/renderer/index.html`, no `windowKind` query param,
   top-level, resizable. No upstream internals are consulted.
4. `attachment.cjs` adds both views to `win.contentView` (switcher last →
   topmost), lays them out, registers the IPC handlers, and wires window
   resize/full-screen events.

## 4. Views

### 4.1 Domain view

- `WebContentsView` with `contextIsolation: true`, `nodeIntegration: false`,
  `sandbox: true`, `backgroundThrottling: false` (it must animate and stay
  responsive while parked), and its own **non-persistent session partition**
  (`playliquid-domain`) — no cookies/storage shared with the app UI.
- Bounds: `{ x = W·(1−p), y = 0, width = W, height = H }` where `p` is the
  slide position (0 = parked offscreen right, 1 = covering). Parked ⇒ fully
  offscreen ⇒ zero input interception; the upstream window keeps all input.
- Loads `src/workspaces/domain/renderer/index.html` (vanilla HTML/CSS/JS, CSP
  `default-src 'self'`). The landing page owns its own hash router (`#/`,
  `#/about`) — the domain workspace's isolated navigation state.

### 4.2 Switcher view

- 64×32 `WebContentsView` at the top-left titlebar band — see §5.
- Content: « » double-chevron buttons + a two-position pip. Deliberately
  distinct from the upstream task-history arrows (single chevrons) whose
  handlers are never touched.

## 5. Top-left geometry (verified against upstream source)

Upstream renders the top overlay strip in
`packages/ui/src/DesktopTopOverlay.tsx` — `pointer-events-none absolute h-14
flex left-0 top-0 z-20 w-fit`, mounted by
`packages/ui/src/app-shell/WorkspaceShellLayout.tsx:2986-3020` — with, in
order: the sidebar-toggle/Z-logo button, the task-history back/forward arrows,
the new-task button, and the update status button. The sidebar reserves a
48 px drag strip under it (`packages/ui/src/project-sidebar/index.tsx:225-227`).

The band after the arrows and before the new-task control is structurally
empty. The switcher cluster therefore parks at **x = 117, y = 6, 64×32 (DIP)**
— beside the Z logo, after the arrows, inside the reserved band, additive and
visually distinct. (A second valid slot at x ≈ 196 exists after the new-task
button; the earlier position was chosen to sit immediately next to the
navigation cluster it mirrors.)

## 6. Transition engine

`src/transitions/slideTransition.cjs` — single-flight, retargetable:

- one active animation at a time; a new request mid-flight **retargets from
  the current interpolated position** (never snaps back to an end-stop);
- 250 ms, `easeOutCubic`, horizontal only;
- fully reversible (rapid « » clicking is safe by construction);
- reduced-motion (`nativeTheme.shouldReduceMotion`) collapses to instant
  swaps;
- the engine drives only the domain view's bounds (host mode `cover-slide`).

**Why cover-slide:** Electron 44 does not expose the primary window's base
webContents as a view (`contentView.children` is empty), so the original
surface physically cannot be translated left. Covering preserves every state
guarantee (nothing unmounts, nothing reloads, nothing resets). If a future
Electron exposes the base view, a dual-slide mode can be enabled without
changing any other layer — the engine's output is already a symmetric
position value.

## 7. IPC contract (namespace `zcode-domain-workspace:*`)

| Channel | Direction | Payload |
|---|---|---|
| `zcode-domain-workspace:get-state` | view → main (invoke) | `{ workspaces, activeIndex, activeId, canGoBack, canGoForward, hostMode, baseline, transition, transitioning }` |
| `zcode-domain-workspace:switch` | view → main (send) | `"previous" \| "next"` |
| `zcode-domain-workspace:state-changed` | main → views (send) | the state object above |

The `switch` handler validates the sender is one of the host's two views.
The namespace is disjoint from every upstream `PlatformChannels` /
`InternalChannels` constant (`packages/shared/src/channels.ts`).

## 8. Integrity model

`scripts/verify-upstream-integrity.mjs` compares the fork (history **and**
working tree) against the baseline commit:

- **pass ⇔ zero upstream files modified, deleted, or renamed** — new files
  are unrestricted (additions-only fork);
- reports are written to `docs/qa/integrity-report.json` and consumed by the
  review console's `/api/integrity` endpoint;
- `docs/qa/added-files.txt` records the complete additions manifest.

Additionally, `apps/domain-workspace-host` matches none of pnpm's workspace
globs (`pnpm-workspace.yaml`), so the dependency graph and lockfile cannot
change because of the host.

## 9. Failure modes

| Failure | Effect on upstream app |
|---|---|
| bootstrap throws | caught; app starts without the host |
| capture hook misses | host inert; app normal |
| domain view fails to load | one console warning; app + switcher normal |
| integrity violation | verifier exits non-zero; CI/push gate fails |
| kill-switch (`ZCODE_DOMAIN_WORKSPACE_DISABLE=1`) | bootstrap becomes a no-op |

## 10. Open items (milestone 2+)

- Packaging: NODE_OPTIONS does not survive into packaged apps — an additive
  wrapper or upstream-sanctioned hook is required before an installer can
  carry the host.
- Dual-slide when Electron exposes the base view.
- The referenced "ZCode — Interface Replica (All Screens).html" was not
  available in the handoff environment; top-left geometry was derived from
  upstream source with exact line references (§5).
