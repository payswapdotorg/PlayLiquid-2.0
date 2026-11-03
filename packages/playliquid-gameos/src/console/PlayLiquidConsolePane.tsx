/**
 * THE PLAYLIQUID CONSOLE PANE (worker-b): the full-height side-pane
 * surface behind the New Tab launcher's fifth entry — the real GameOS
 * "World Projects" workbench, mounted through `createConsoleHost()`.
 *
 * Composition discipline (mirrors the sibling panes' chrome contract):
 * the pane fills the side-pane content area (`height: 100%`,
 * `min-height: 0`, scrollable body) and stays SELF-CONTAINED — every
 * PlayLiquid style comes from the module's own inline token objects
 * (components/tokens.ts: the navy `#0b1220` / `#111a2c` / teal
 * `#2dd4bf` studio palette); there is NO dependency on host theme
 * classes.
 *
 * States are honest by contract:
 * - loading → a spinner row (the registry open is the one async step);
 * - load-failed → the real failure detail plus a retry control that
 *   recomposes the host (no silent retries, E8/E11);
 * - loaded → the workbench (`ProjectsApp`) over the one store created
 *   from the FIRST authoritative snapshot.
 *
 * The header row carries the PlayLiquid droplet mark (inline SVG, teal
 * `#2dd4bf`), the "PlayLiquid Console" label and a status chip
 * projecting the REAL service facts of the composed host.
 */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ProjectsApp,
  StatusChip,
  createProjectsStore,
  FONT,
  STYLE,
  SURFACE,
} from "../gameos-projects/index.js";
import type { ProjectsStore } from "../gameos-projects/index.js";
import { obtainConsoleHost, resetConsoleHost } from "./console-host.js";
import type { ConsoleHost } from "./console-host.js";
import { consoleStatusChip, consoleStatusLine } from "./console-status.js";

/** The pane accepts no host theming; it fills whatever container mounts it. */
export interface PlayLiquidConsolePaneProps {
  /** Optional extra inline style for the root (host layout escapes only). */
  readonly style?: Record<string, string | number>;
}

type ConsolePaneState =
  | { readonly phase: "loading" }
  | { readonly phase: "failed"; readonly detail: string }
  | { readonly phase: "ready"; readonly host: ConsoleHost; readonly store: ProjectsStore };

/** The PlayLiquid droplet mark (inline SVG; teal on navy — the product mark). */
function DropletMark({ size = 18 }: { readonly size?: number }): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label="PlayLiquid"
      style={{ flexShrink: 0, display: "block" }}
    >
      <title>PlayLiquid</title>
      <path
        d="M12 2.4c3.5 4.1 7.2 8.3 7.2 12.4A7.2 7.2 0 0 1 12 22a7.2 7.2 0 0 1-7.2-7.2c0-4.1 3.7-8.3 7.2-12.4Z"
        fill="#2dd4bf"
        fillOpacity="0.92"
      />
      <path
        d="M9.1 14.6c0 1.6 1.3 2.9 2.9 2.9"
        stroke="#0b1220"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** The loading row: an honest spinner over the droplet mark. */
function LoadingRow(): ReactNode {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0" }}>
      <span
        aria-hidden="true"
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "2px solid rgba(45, 212, 191, 0.25)",
          borderTopColor: "#2dd4bf",
          animation: "playliquid-console-spin 0.9s linear infinite",
          display: "inline-block",
        }}
      />
      <span style={{ ...STYLE.muted, fontSize: 12.5 }}>composing the GameOS services…</span>
    </div>
  );
}

/** The pane root: header + scrollable body over the studio palette. */
export function PlayLiquidConsolePane({ style }: PlayLiquidConsolePaneProps): ReactNode {
  const [state, setState] = useState<ConsolePaneState>({ phase: "loading" });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: "loading" });
    obtainConsoleHost().then(
      (host) => {
        if (cancelled) return;
        const result = host.ports.data.load();
        if (!result.ok) {
          setState({ phase: "failed", detail: result.detail });
          return;
        }
        setState({ phase: "ready", host, store: createProjectsStore(result.data, host.ports) });
      },
      (error: unknown) => {
        if (cancelled) return;
        setState({
          phase: "failed",
          detail: error instanceof Error ? error.message : String(error),
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const onRetry = useCallback(() => {
    resetConsoleHost();
    setReloadToken((token) => token + 1);
  }, []);

  const statusFacts = state.phase === "ready" ? state.host.status() : null;

  return (
    <div
      data-playliquid-console-pane=""
      role="region"
      aria-label="PlayLiquid Console"
      style={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: SURFACE.page,
        color: SURFACE.text,
        fontFamily: FONT.sans,
        ...style,
      }}
    >
      <style>{`@keyframes playliquid-console-spin { to { transform: rotate(360deg); } }`}</style>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderBottom: `1px solid ${SURFACE.border}`,
          background: SURFACE.panelHeader,
        }}
      >
        <DropletMark />
        <h2 style={{ margin: 0, fontSize: 13.5, fontWeight: 600, letterSpacing: "0.01em" }}>
          PlayLiquid Console
        </h2>
        {statusFacts !== null ? (
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ ...STYLE.faint, fontSize: 11, fontFamily: FONT.mono }}>
              {consoleStatusLine(statusFacts)}
            </span>
            <StatusChip status={consoleStatusChip(statusFacts)} />
          </span>
        ) : (
          <span style={{ marginLeft: "auto" }}>
            <StatusChip
              status={
                state.phase === "failed"
                  ? { label: "load failed", tone: "error", note: state.detail }
                  : { label: "loading", tone: "info", note: "composing the GameOS services" }
              }
            />
          </span>
        )}
      </header>
      <div style={{ minHeight: 0, flex: 1, overflow: "auto" }}>
        {state.phase === "loading" ? (
          <div style={{ padding: "8px 16px" }}>
            <LoadingRow />
          </div>
        ) : state.phase === "failed" ? (
          <div style={{ padding: "16px 16px", display: "grid", gap: 10 }}>
            <p
              role="alert"
              style={{
                margin: 0,
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 12.5,
                fontFamily: FONT.mono,
                color: "#f87171",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(248, 113, 113, 0.4)",
              }}
            >
              Console host composition failed (E11): {state.detail}
            </p>
            <p style={{ ...STYLE.muted, margin: 0, fontSize: 12.5 }}>
              The GameOS domain services did not compose in-process. Nothing is faked — retry
              recomposes the package registry and the community service from scratch.
            </p>
            <button type="button" onClick={onRetry} style={{ ...STYLE.actionButton, justifySelf: "start" }}>
              Retry composition
            </button>
          </div>
        ) : (
          <ProjectsApp store={state.store} />
        )}
      </div>
    </div>
  );
}
