import { test } from "vitest";
import assert from "node:assert/strict";

import { resolveOpenTabLauncherItemIds } from "@/app-shell/animatedSidePanePanelModel.js";

test("默认旗标下内置入口以 files、browser、terminal、review、playliquid-console 开头", () => {
  assert.deepEqual(
    resolveOpenTabLauncherItemIds({
      developerToolsEnabled: false,
      hasReviewTab: false,
    }),
    ["files", "browser", "terminal", "review", "playliquid-console"],
  );
});

test("review tab 已打开时 review 不再出现在启动器，其余四个内置入口保持可用", () => {
  assert.deepEqual(
    resolveOpenTabLauncherItemIds({
      developerToolsEnabled: false,
      hasReviewTab: true,
    }),
    ["files", "browser", "terminal", "playliquid-console"],
  );
});

test("所有可选入口开启时，原有四个内置选项仍然全部解析", () => {
  const itemIds = resolveOpenTabLauncherItemIds({
    developerToolsEnabled: true,
    hasReviewTab: false,
    canOpenSelectionSideConversation: true,
    canOpenSites: true,
    supportsEmbeddedBrowser: true,
  });
  // 原有四个内置入口（files/browser/terminal/review）一个不少。
  for (const itemId of ["files", "browser", "terminal", "review"] as const) {
    assert.ok(itemIds.includes(itemId), `${itemId} 仍应出现在启动器列表`);
  }
  // 条件入口在尾部按既有顺序追加，playliquid-console 仍紧跟 review。
  assert.deepEqual(itemIds, [
    "files",
    "browser",
    "terminal",
    "review",
    "playliquid-console",
    "sites",
    "selection-side-conversation",
    "developer-tools",
  ]);
});

test("不支持内嵌浏览器时 browser 被移除，playliquid-console 保持 review 之后的位置", () => {
  assert.deepEqual(
    resolveOpenTabLauncherItemIds({
      developerToolsEnabled: false,
      hasReviewTab: false,
      supportsEmbeddedBrowser: false,
    }),
    ["files", "terminal", "review", "playliquid-console"],
  );
});
