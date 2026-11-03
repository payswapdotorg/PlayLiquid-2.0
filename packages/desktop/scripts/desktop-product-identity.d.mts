/**
 * Colocated declaration for desktop-product-identity.mjs.
 *
 * 手写声明的原因：`desktop-product-identity.mjs` 是构建脚本与 main 进程共用的 ESM 模块，
 * 仓库未开启 allowJs，缺少本文件时 TS 会把它整体当成隐式 any，main 侧调用点就失去类型校验。
 * 改 .mjs 导出时必须同步本文件（RW-002 身份唯一事实来源的字段也在这里保持同构）。
 */
export type DesktopProductFlavor = "production" | "preview";

export interface DesktopProductIdentity {
  flavor: DesktopProductFlavor;
  appId: string;
  productName: string;
  linuxExecutableName: string;
  linuxPackageName: string;
  linuxArtifactBaseName: string;
  deepLinkScheme: string;
  linuxDataRootDirName: string;
  updaterCacheDirName: string;
  remoteUpdateFeedEnabled: boolean;
  cuaHelperInstallVariant: string | null;
}

export const ZCODE_PREVIEW_IDENTITY_ENV: string;

export const desktopProductIdentities: Readonly<{
  production: DesktopProductIdentity;
  preview: DesktopProductIdentity;
}>;

export const desktopApplicationNames: Readonly<{
  development: string;
  preview: string;
  production: string;
}>;

export const desktopDeepLinkSchemes: readonly string[];

export function isPreviewIdentityRequested(env?: NodeJS.ProcessEnv): boolean;
export function resolveDesktopProductFlavor(env?: NodeJS.ProcessEnv): DesktopProductFlavor;
export function resolveDesktopProductIdentity(env?: NodeJS.ProcessEnv): DesktopProductIdentity;
export function resolveDesktopArtifactSuffix(env?: NodeJS.ProcessEnv): string;
export function resolveDesktopLinuxArtifactBaseName(env?: NodeJS.ProcessEnv): string;
export function resolveWindowsAppUserModelIdForFlavor(
  flavor: string,
  runtime?: { isPackaged?: boolean },
): string;
export function resolveWindowsAppUserModelId(
  env?: NodeJS.ProcessEnv,
  runtime?: { isPackaged?: boolean },
): string;
