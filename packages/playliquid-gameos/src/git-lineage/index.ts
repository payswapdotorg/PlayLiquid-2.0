/**
 * @playliquid/git-lineage — public API.
 *
 * The typed contract layer for the PlayLiquid Git lifecycle
 * (spec/architecture.md "Git lifecycle"): lineage graph vocabulary with
 * content-addressed nodes, whole-package fork records, narrow overlay
 * operation records, semantic-diff classification and pure lineage
 * validation with R19 provenance/license gate shapes, plus the
 * {@link LineageStore} port.
 *
 * Pure contracts only: no IO, no git CLI, no filesystem, no network, no
 * diff engine, no merge algorithm — those are later work orders.
 * Test fixtures and in-memory fakes live in `fixtures.ts` and are
 * deliberately NOT exported from this barrel (house pattern).
 */

export {
  LINEAGE_EDGE_KINDS,
  LINEAGE_EDGE_RULES,
  computeLineageNodeId,
  edgesFrom,
  edgesTo,
  findNode,
  isLineageEdge,
  isLineageEdgeKind,
  isLineageNode,
  isLineageNodeId,
  makeLineageNode,
  checkEdgeRule,
} from './lineage.js'
export type {
  EdgeKindRule,
  EdgeRuleCode,
  EdgeRuleViolation,
  LineageEdge,
  LineageEdgeKind,
  LineageGraph,
  LineageNode,
  LineageNodeId,
} from './lineage.js'

export {
  FORK_REASONS,
  MAX_FORK_NOTE_LENGTH,
  forkEdgeOf,
  isForkRecord,
  isForkReason,
  validateForkRecord,
} from './fork.js'
export type {
  ForkBase,
  ForkReason,
  ForkRecord,
  ForkValidationCode,
  ForkViolation,
} from './fork.js'

export {
  COMPATIBILITY_FIELD_KEYS,
  FORBIDDEN_OVERLAY_SURFACES,
  OVERLAY_LEGAL_BASE_KINDS,
  OVERLAY_OP_KINDS,
  OVERLAY_SURFACE_RULES,
  OVERLAY_SURFACES,
  RESOURCE_FIELD_KEYS,
  isOverlayRecord,
  isOverlaySurface,
  overlayEdgeOf,
  semanticPathRoot,
  validateOverlayRecord,
} from './overlay.js'
export type {
  OverlayOpKind,
  OverlayOperation,
  OverlayRecord,
  OverlaySurface,
  OverlaySurfaceRule,
  OverlayValidationCode,
  OverlayViolation,
} from './overlay.js'

export { checkOverlayApplicability } from './overlay-applicability.js'
export type {
  OverlayApplicabilityCode,
  OverlayApplicabilityResult,
  OverlayApplicabilityViolation,
} from './overlay-applicability.js'

export {
  SEMANTIC_CHANGE_KINDS,
  SEMANTIC_KIND_IR_NODE_RULES,
  SEMANTIC_KIND_SUBJECT_RULES,
  classifyChangeKinds,
  isSemanticChangeKind,
  isSemanticDiff,
  semanticDiffId,
  validateSemanticDiff,
} from './semantic-diff.js'
export type {
  SemanticChange,
  SemanticChangeKind,
  SemanticChangeSubject,
  SemanticDiff,
  SemanticDiffValidationCode,
  SemanticDiffViolation,
} from './semantic-diff.js'

export {
  checkLicenseCompatibility,
  checkLineageProvenance,
  validateLineageGraph,
} from './validate-lineage.js'
export type {
  LicenseCompatibilityVerdict,
  LineageProvenanceReason,
  LineageProvenanceReasonCode,
  LineageProvenanceVerdict,
  LineageValidationCode,
  LineageViolation,
} from './validate-lineage.js'

export { loadLineageGraph } from './ports.js'
export type {
  LineageStore,
  LoadLineageGraphOptions,
} from './ports.js'
