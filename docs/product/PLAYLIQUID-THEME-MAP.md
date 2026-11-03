# PlayLiquid Theme Map

**Source of truth for the visual identity of PlayLiquid-2.0.**
Reference: `payswapdotorg/PlayLiquid` @ `f620426` (GameOS console palette + ProductMark).
Applied by: worker-a/theme-branding (`fa04010e`) + TL patch (`a5adc388`).

## 1. Design tokens

### PlayLiquid Dark (canonical — `.dark` + `.theme-zai-dark` blocks in `packages/ui/src/styles.css`)

| Token | Value | Role |
|---|---|---|
| background / page | `#0b1220` | app background |
| header / bar / sidebar | `#0d1524` | top bar, panel headers, sidebar |
| panel / card / popover | `#111a2c` | cards, panels, popovers |
| hover | `#17233a` | hover surface |
| selected | `#16233b` | selected/active surface |
| border | `#22304a` | default border |
| border-strong | `#31415f` | emphasized border |
| foreground / text | `#e2e8f0` | primary text |
| muted foreground | `#8fa3bf` | secondary text |
| faint | `#8296b3` | weakest text (WCAG AA override) |
| brand / accent | `#2dd4bf` | teal — links, focus rings, toggles, active marks |
| primary button | `#2dd4bf` fill + `#0b1220` text | PlayLiquid action style |
| danger | `#f87171` | destructive |
| success / ok | `#4ade80` | positive status |
| warning | `#fbbf24` | caution status |

### PlayLiquid Light (derived — light `@theme` + `.theme-zai-light` blocks)

| Token | Value |
|---|---|
| background | `#f4f7fb` |
| header / sidebar | `#eef2f8` |
| card / popover | `#ffffff` |
| hover / selected | `#e3eaf3` / `#d9e4f0` |
| border / border-strong | `#cbd6e6` / `#aab9d0` |
| foreground | `#16233b` |
| muted foreground | `#5a6b85` |
| brand (text-safe) | `#0d9488` |
| primary button | `#0d9488` fill + `#ffffff` text |
| danger | `#dc2626` |

### Typography & shape

- Sans: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` (+ inherited CJK
  fallbacks: Microsoft YaHei UI, PingFang SC, Noto Sans CJK SC). Mono stack unchanged.
- Type scale, spacing base (4px), radii ladder and control heights follow the inherited
  `DESIGN.md` law unchanged — only color identity changed.
- `--color-foreground-inverse` (dark) is navy `#0b1220` — correct for text on bright teal fills.

## 2. The ProductMark (logo)

24×24 liquid droplet, teal `#2dd4bf`:

```svg
<path d="M12 2.4c3.5 3.9 6.4 7.2 6.4 10.6a6.4 6.4 0 1 1-12.8 0C5.6 9.6 8.5 6.3 12 2.4Z"
      fill="#2dd4bf" fillOpacity="0.16" stroke="#2dd4bf" strokeWidth="1.4" strokeLinejoin="round"/>
<path d="M9.2 13.4c.2 2 1.6 3.3 3.5 3.5" fill="none" stroke="#2dd4bf" strokeWidth="1.2" strokeLinecap="round"/>
```

Light-theme contexts use `#0d9488` (wordmark droplet reads `var(--color-brand)`).
Large watermark variant (draft empty-state hero): same droplet outline at 400×320, currentColor.

## 3. Re-branded surfaces (worker-a + TL patch)

| Surface | File(s) |
|---|---|
| 4 theme token blocks | `packages/ui/src/styles.css` |
| Secondary theme CSS | `highspeed-share.css`, `highspeed-activation.css` |
| Startup/loading badge + logo | `packages/ui/src/root/RootStartupLoading.tsx` |
| About + wordmark SVGs | `packages/ui/src/components/ui/ZCodeAboutLogo.tsx` |
| Settings-page logo | `packages/ui/src/WindowsTopLeftLogo.tsx` |
| Mobile app logo | `packages/ui/src/components/mobile-ui/ZCodeAppLogo.tsx` |
| Onboarding visual | `packages/ui/src/onboarding/OccupationOnboardingVisual.tsx` |
| Login screen | `packages/ui/src/WelcomeScreen.tsx` |
| Highspeed share chip | `HighspeedShareNoticeCard.tsx` |
| Release-notes dialog | `PostUpdateReleaseNotesDialog.tsx` |
| Sidebar fallback name | `WorkspaceSidebarFooter.tsx` |
| Draft hero watermark | `packages/ui/src/v4/ConversationDraftEmptyState.tsx` (TL patch `a5adc388`) |
| Desktop splash + title | `packages/desktop/src/renderer/index.html` |
| Web title | `packages/web/index.html` |
| CUA permission panel + plugin sandbox titles | `cua-permission-panel.html`, `plugin-sandbox.html` |
| i18n product strings | `en-US.ts` (136 occurrences), `zh-CN.ts` (135) — values only |
| App menu / tray / about strings | `packages/shared/src/desktopMenu.ts`, `packages/desktop/src/main/about.ts` |
| READMEs + DESIGN.md color refs | `README.md`, `README.en.md`, `DESIGN.md` |
| Installer/packaging identity | `desktop-product-identity.mjs` (see install contract) |

## 4. Deliberate retentions (NOT branding)

Internal identifiers kept for compatibility — changing them risks breaking IPC, storage,
protocol and update paths without any visual benefit:

`@zcode/*` package names · `window.zcode` preload global · `PlatformChannels`/`InternalChannels`
(`channels.ts`) · `ZCODE_*` env vars · `zcode-theme`/`zcode-locale` localStorage keys ·
`.zcode-loading-pixel` + `.theme-zai-*` CSS class names · `ZCode*` TS type names ·
testids · `~/.zcode`-style path literals in technical strings · provider icon `logo-zai.svg`
(Z.ai account identity, not the product mark) · `process-names.ts` plumbing ·
`.zcode-install-manifest` filename · Apache-2.0 / third-party notices (legal, not branding).

## 5. Console surface

`packages/playliquid-gameos` uses the reference repo's inline token modules (navy `#0b1220`/
`#111a2c`/panel tokens + teal `#2dd4bf` chips/actions) — self-contained, host-agnostic, no
dependency on ZCode theme classes. The Console therefore renders the PlayLiquid look in every
app theme.
