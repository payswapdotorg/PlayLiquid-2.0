/**
 * playliquid-gameos module manifest (worker-b consolidation).
 *
 * The upstream GameOS packages (game-contracts, package-system,
 * artifact-store, package-registry, git-lineage, game-ir,
 * platform-contracts, community, gameos-projects) are consolidated into
 * ONE workspace module: their cross-package imports became relative
 * imports inside this root, so the module requires nothing outside
 * itself except the host-provided React peer. `requires` therefore stays
 * empty and mirrors architecture-policy.yaml exactly.
 */
export const playliquidGameosModule = {
  id: "playliquid-gameos",
  requires: [],
  provides: ["playliquid-gameos"],
  publicEntrypoints: ["src/index.ts"],
} as const;
