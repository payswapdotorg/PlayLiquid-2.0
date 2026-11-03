# Feature Preservation Matrix

The preservation contract for the PlayLiquid transformation. **ZCode remains the authority**
for every capability below; the transformation changed identity and design, not function.
Baseline: `a9fe401e` (ZCode v3.17.2).

Status legend: ✅ verified preserved this milestone · 🧪 covered by inherited tests (suite-level,
not re-run locally this milestone — see handoff §4) · ➕ extended additively.

| # | Feature | Entry point | Service/module | Inherited tests | Status |
|---|---|---|---|---|---|
| 1 | Agent runtime & execution | `apps/zcode-cli/packages/core/src/runtime/` | turn machine, command queue, admission | ~40 core tests + 238 bootstrap | ✅ untouched (protected surface, 0 diffs) |
| 2 | Tasks/sessions/history | `services/src/zcode-session/`, `session/` | session service, draft registry, task index (SQLite) | 375+ wdio conversation-session specs | ✅ untouched · 🧪 |
| 3 | Context & memory | `core/src/context/`, `memory/`, `compact/` | builder, memory agent, compaction | ~60 core tests + e2e | ✅ untouched |
| 4 | Model/provider routing + credentials | `packages/provider/`, `provider-node/`, `services/src/{model-provider,credential,providers}/` | registry, selection, custom OpenAI-compatible providers | 11 settings e2e + engineering tests | ✅ untouched · settings reachable in rethemed UI |
| 5 | Model metadata | `packages/model-option-map/` | option DSL parse/compile/merge | bootstrap tests | ✅ untouched |
| 6 | Attachments & file context | `v4/composer/`, `mentions/` | transfer services, host bridge | e2e attachment suite | ✅ untouched (composer controls verified in screenshots) |
| 7 | Browser panel + automation | `browser-use/*`, `desktop/src/main/browserView/` | webview guest manager, CDP executor | 7 browser e2e + smoke scripts | ✅ untouched · opened+rethemed in session (screenshot 06) |
| 8 | Terminal & shell | `Terminal.tsx`, `SidePaneTerminalPane.tsx`, `services/src/terminal/` | node-pty in Host utility process | r3-terminal + terminal e2e | ✅ untouched · opened+rethemed (screenshot 07) |
| 9 | Bash tool (agent) | `core/src/tool/handlers/bash.ts` | readonly policy, background tasks | ~12 core tests | ✅ untouched |
| 10 | Search | `core/src/embedded-search/`, `workspace-file-search/` | glob/grep/ripgrep + UI worker | ~15 core tests | ✅ untouched |
| 11 | Automations & workflows | `settings/AutomationsSection*`, `dynamic-workflow*` | automation repo/cron + scheduler utility process | automations e2e (4) | ✅ untouched · reachable from sidebar (screenshot 03) |
| 12 | Off-peak tasks | `OffPeak*` | offPeak services + scheduler | off-peak e2e | ✅ untouched |
| 13 | Bots (Feishu/Telegram) | `BotsDialog*`, `services/src/bots/` | channel runtimes, cron delivery | ~20 bots e2e | ✅ untouched |
| 14 | Plugin Marketplace + runtime | `settings/PluginStore*`, `plugin-sandbox.html` | plugin management, sandboxed webview runtime | 15 plugins e2e | ✅ untouched · reachable from sidebar (screenshot 03) |
| 15 | MCP client + settings | `core/src/mcp/`, `settings/McpSettingsSection*` | MCP SDK wiring, sync, official MCP | mcp e2e + core tests | ✅ untouched |
| 16 | Permissions & approvals | `core/src/permission/`, `PermissionDialog.tsx` | broker, rule matching, plan-mode policy | ~12 permission core tests + e2e | ✅ untouched (protected surface) |
| 17 | Local & remote workspaces (SSH/WSL/Docker) | `SSHDialog`, `remote-connection-flow/`, `zcode-server-cli/` | remote projects/sync, source server | ~55 r3/ssh e2e | ✅ untouched |
| 18 | RPC/client/server infra | `packages/rpc/`, `client/`, `server/` | VS Code-style IPC, messageport/websocket clients | infrastructure e2e | ✅ untouched (protected surface) |
| 19 | Desktop app | `packages/desktop/` | main/host/scheduler processes | wdio shell specs | ✅ identity-only changes (worker-c, authorized); boots + golden path verified |
| 20 | Web app + share | `packages/web/` | web remote control, share landing | web e2e | ✅ title rebranded; body copy follow-up queued |
| 21 | CLI/TUI | `apps/zcode-cli/packages/cli`, `tui/` | bin `zcode`, SEA packaging | ~60 cli/tui tests | ✅ untouched |
| 22 | Settings/account/config | `SettingsPage.tsx`, `settings/*` | setting services, sync, broadcast | 20 settings e2e | ✅ untouched · reachable (Settings button in session) |
| 23 | New Task composer | `v4/ConversationComposer.tsx`, `composer/` | draft registry, prewarm | ~15 composer e2e | ✅ untouched · verified visually (Select project, attachments, mode, model, send) |
| 24 | Review/diff views | `GitPane*`, `diff-viewer.tsx`, `previewPane*` | git services, diffs worker | git e2e + core tests | ✅ untouched · opened+rethemed (screenshot 09) |
| 25 | Keyboard shortcuts & commands | `shortcuts/`, `command-center/` | bindings, command store | 5 shortcut e2e | ✅ untouched (no keyboard changes made) |
| 26 | Update mechanism | `desktop/src/main/autoUpdater.ts` | electron-updater + guards | auto-update smoke scripts | ✅ feed disabled by design (PlayLiquid never replaced by ZCode) |
| 27 | Onboarding & first-run | `onboarding/`, `WelcomeScreen.tsx` | onboarding service | feedback/onboarding e2e | ✅ walked end-to-end in session (screenshots 02*) |
| 28 | Task-history navigation arrows | `DesktopTopOverlay.tsx` | — | shell specs | ✅ zero diffs in file |
| 29 | New Tab launcher | `animatedSidePanePanelModel.ts`, `AnimatedSidePanePanel.tsx` | side-pane state machine | ➕ new resolver test (4/4) | ➕ five options; original four preserved exactly |
| 30 | PlayLiquid Console | `packages/playliquid-gameos/` | ported GameOS domain modules | ➕ 677 tests | ➕ additive; no infrastructure duplicated |

## Protected-surface diff audit (this milestone)

`git diff --name-status a9fe401e..42b23514` filtered against the protected-surface list in
`docs/governance/authorized-modifications.json`: **zero matches**. All 71 modified baseline
files live in allowed surfaces (UI/theme/branding/panel registration/packaging identity/docs).
The full audited list: `docs/qa/change-policy-report.json` (regenerated by CI on every push).
