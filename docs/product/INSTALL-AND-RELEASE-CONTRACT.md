# Install & Release Contract

Adapted from the reference repo's proven contract (`payswapdotorg/PlayLiquid`,
`docs/product/INSTALL-AND-RELEASE-CONTRACT.md` @ `f620426`) and implemented for this repository
by worker-c/packaging-release (`83eff130`), merged in `42b23514`.

## 1. Product identity (single source of truth)

`packages/desktop/scripts/desktop-product-identity.mjs` — verified by `node --test` (12/12):

| Field | Production | Preview flavor |
|---|---|---|
| appId / AUMID | `org.playliquid.gameos` | `org.playliquid.gameos.preview` |
| productName | `PlayLiquid GameOS` | `PlayLiquid GameOS Preview` |
| Linux executable / package / hicolor icon | `playliquid-gameos` | `playliquid-gameos-preview` |
| artifact base | `PlayLiquid-GameOS` | `PlayLiquid-GameOS-Preview` |
| deep link | `playliquid://` (parse-only `zcode://` fork-compat, never registered) | `playliquid-preview://` |
| data root | `~/.playliquid-gameos/.zcode` (services) + `~/.config/PlayLiquid GameOS` (Electron userData) | same |
| update feed | **disabled** (`remoteUpdateFeedEnabled: false`, layered on the OSS build-time `ZCODE_AUTO_UPDATE_ENABLED` gate) | same |

**Separation guarantees:** PlayLiquid's Electron profile and services data live under their own
roots — a separately installed ZCode is never touched, and PlayLiquid is never replaced by a
ZCode package (no feed is configured; the generic provider URL is a disabled placeholder and
`detectUpdateChannel` is false).

## 2. Distribution targets (release-desktop.yml)

Both build from the **exact pinned SHA** (PR-head SHA for labeled PRs; otherwise the pushed SHA):

- **linux-desktop** (ubuntu-latest): `pnpm --filter @zcode/desktop run build` →
  `pnpm run bundle -- --os linux --arch x64` → asserts `.deb` + `.AppImage` present → GNU
  sha256sums → Ubuntu smoke battery (install flow + AppImage flow, executable identity) →
  evidence + artifacts uploaded.
- **windows-desktop** (windows-latest): `git config --global core.autocrlf false` **before**
  checkout (byte-exact tree) → `bundle -- --os win --arch x64 --targets nsis,zip` → asserts
  exactly one `.exe` + one `.zip` → GNU-format SHA256SUMS (lowercase, two spaces, LF, no BOM) →
  Windows smoke harness.
- **publish** (gated on BOTH): version-match refusal between OS builds → merged SHA256SUMS +
  `sha256sum -c` → `BUILD-INFO.txt` (product, full/short SHA, version, UTC timestamp, event,
  ref, run URL, per-artifact os/arch/sha256 table) → immutable prerelease
  `preview/<short-sha>` via `gh release create --prerelease --target $BUILD_SHA`
  (never `--clobber`; same-SHA re-runs only fill missing assets) → honest notes (unsigned
  Windows/SmartScreen disclosure; auto-update disabled; smoke scope) → post-publication verify
  (re-download + checksum + published-.deb smoke).
- **publish-status**: always-on honesty recorder.

Stable releases: `workflow_dispatch` + `publish_release=true`, tag `playliquid-gameos-v<version>`,
`--clobber` refresh allowed for stable only.

## 3. Signing honesty

No code-signing certificate exists. **All Windows installers are unsigned** — SmartScreen /
unknown-publisher warnings are disclosed on every release. No signing is claimed anywhere.

## 4. Local (sandbox) build notes

- `ZCODE_BUILD_SOURCEMAPS=0` (env-gated, default off) allows the renderer build to complete in
  low-memory environments; CI runners build with the default hidden source maps.
- The local Linux bundle also produces `.rpm`/`.pacman` when `rpm` tooling exists; the sandbox
  lacks it (rpm target failure does not invalidate the .deb/AppImage).
- Local sandbox artifacts (test-backend `_TEST` flavor) are served from the review dashboard for
  download; canonical production-flavor artifacts come from CI.

## 5. Installed-app QA

- Linux battery: clean .deb install/upgrade/uninstall, AppImage launch, desktop entry + icon +
  executable identity, product shell rendering + navigation, first-run states, dual viewports,
  offline resilience, clean shutdown; published .deb re-verified post-publication.
- Windows battery: artifact checksums, portable ZIP payload + launch, silent NSIS install
  (`/S`, per-user) with install-dir/exe presence + `.zcode-install-manifest` + Start Menu
  shortcut + HKCU uninstall identity, installed-app launch (window-title identity, userData
  creation), data retention across reinstall + relaunch, silent uninstall.
- Honest scope (as in the reference): no synthetic GUI interactions; launched with
  `--disable-gpu` from neutral cwd; "upgrade" = same-version reinstall unless noted.

## 6. First release from the transformation

- Trigger: push of main `42b23514` (this transformation) — run "PlayLiquid Desktop Release".
- Expected assets: `PlayLiquid-GameOS-3.17.2-linux-amd64.deb`, `PlayLiquid-GameOS-3.17.2-linux-x86_64.AppImage`,
  `PlayLiquid-GameOS-3.17.2-windows-amd64.exe`, `PlayLiquid-GameOS-3.17.2-windows-amd64.zip`,
  `SHA256SUMS`, `BUILD-INFO.txt` under prerelease `preview/42b23514`.
- The dashboard surfaces the live workflow + release status and the download links as soon as
  they publish.

## 7. First published preview release (2026-11-04)

**`preview/6502e2e320` — "PlayLiquid GameOS preview 6502e2e320 (3.17.2)"** (immutable prerelease,
tagged at the built commit; both OS jobs + smoke batteries green):

- https://github.com/payswapdotorg/PlayLiquid-2.0/releases/download/preview/6502e2e320/PlayLiquid.GameOS-3.17.2-win-x64.exe (NSIS installer, 190.0 MB)
- https://github.com/payswapdotorg/PlayLiquid-2.0/releases/download/preview/6502e2e320/PlayLiquid.GameOS-3.17.2-win-x64.zip (portable, 246.6 MB)
- https://github.com/payswapdotorg/PlayLiquid-2.0/releases/download/preview/6502e2e320/PlayLiquid-GameOS-3.17.2-linux-amd64.deb (171.6 MB)
- https://github.com/payswapdotorg/PlayLiquid-2.0/releases/download/preview/6502e2e320/PlayLiquid-GameOS-3.17.2-linux-x86_64.AppImage (231.3 MB)
- https://github.com/payswapdotorg/PlayLiquid-2.0/releases/download/preview/6502e2e320/SHA256SUMS
- https://github.com/payswapdotorg/PlayLiquid-2.0/releases/download/preview/6502e2e320/BUILD-INFO.txt

Linux smoke battery: 26/26 checks pass on the packaged .deb/AppImage builds, including the
unified-shell golden-path journey. Windows smoke battery passed on the NSIS/portable builds.
Windows installers are unsigned (disclosed in the release notes).
