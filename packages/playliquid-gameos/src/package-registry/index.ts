/**
 * @playliquid/package-registry — public API.
 *
 * The package registry of the PlayLiquid Package Graph (Work Order
 * PL-011): a pure, in-memory-first index over package records from
 * `@playliquid/package-system` (PL-002), a `RegistryStore` persistence port,
 * and the registry ↔ artifact-store wiring that makes lockfile pins
 * verifiable against both authorities (lock rule 10).
 *
 * No IO, no network in the domain — adapters are wired by the application.
 */

export * from './registry-index.js'
export * from './registry-store.js'
export * from './registry.js'
export * from './cas-binding.js'
