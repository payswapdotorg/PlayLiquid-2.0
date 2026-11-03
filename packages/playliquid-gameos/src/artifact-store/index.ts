/**
 * @playliquid/artifact-store — public API.
 *
 * The content-addressed artifact store of the PlayLiquid Package Graph
 * (Work Order PL-011): deterministic SHA-256 blob digests, dedupe by digest,
 * fail-closed integrity verification on fetch (E10), stream-chunked
 * write/read ports with in-memory fakes (E7), byte-range reads and
 * content-derived manifest records.
 *
 * Pure domain: no fs, no network. Persistence is an adapter concern wired
 * through the {@link ChunkedBlobStore} port.
 */

export * from './digest.js'
export * from './manifest.js'
export * from './ports.js'
export * from './store.js'
