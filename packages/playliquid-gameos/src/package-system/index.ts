/**
 * @playliquid/package-system — public API.
 *
 * The package model + resolution contract layer for the PlayLiquid Package
 * Graph (spec/package-contract.md): package identity types, metadata types,
 * the lockfile contract, deterministic pure resolution, content-addressing
 * contracts and the provenance/licensing release gate types (R19).
 *
 * Pure only: no IO, no git client, no network. The registry/CAS IO layer
 * is Work Order PL-011.
 */

export * from './semver.js'
export * from './package-id.js'
export * from './canonical-json.js'
export * from './digest.js'
export * from './cas.js'
export * from './capability.js'
export * from './game-ir-seam.js'
export * from './provenance.js'
export * from './license.js'
export * from './package-record.js'
export * from './package-digest.js'
export * from './validate-record.js'
export * from './lockfile.js'
export * from './resolve.js'
export * from './release-gate.js'
