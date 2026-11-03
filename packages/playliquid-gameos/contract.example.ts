/**
 * playliquid-gameos contract example: the two supported integrations of
 * the PlayLiquid GameOS console — mounting the turnkey pane (what the
 * ZCode side pane does) and composing the host directly (what a test or
 * an alternative shell does). Copy whichever shape fits; nothing else is
 * public.
 */

import { createElement, type ReactElement } from "react";
import { PlayLiquidConsolePane, createConsoleHost } from "./src/index.js";

// 1) The turnkey mount: the pane composes the host itself and renders
//    the World Projects workbench with its own inline token styling.
export function mountConsolePaneExample(): ReactElement {
  return createElement(PlayLiquidConsolePane);
}

// 2) The direct host composition: the registry open is the one async
//    step; the two port seams carry every read and every review intent.
export async function composeConsoleHostExample(): Promise<void> {
  const host = await createConsoleHost();
  const read = host.ports.data.load();
  if (read.ok) {
    // The honest first-run read model: zero world projects (no project
    // registry service is composed) — never fabricated rows.
    console.log("projects:", read.data.projects.length);
  }
  const receipt = await host.ports.command.dispatch({
    kind: "transition-pull-request",
    // Content-addressed contribution ids are branded; hosts construct them
    // from validated sha256 text (asContributionId in the community module).
    prId: "sha256:0000000000000000000000000000000000000000000000000000000000000000" as never,
    command: "triage",
  });
  // Refusals are typed and visible (E8) — here the real community door
  // refuses the unknown contribution verbatim.
  console.log(receipt.ok ? "accepted" : `refused: ${receipt.code}`);
}
