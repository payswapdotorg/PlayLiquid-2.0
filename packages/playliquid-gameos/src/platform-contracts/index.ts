/**
 * Public barrel of `@playliquid/platform-contracts` (PL-004).
 *
 * The typed capability surface of every GameOS platform service (R7,
 * lock rule 17): per-capability request/response contracts, the
 * game-declared semantic event vocabulary (lock 18), entitlement/economy
 * idempotency (R10), probabilistic integrity evidence (R11/E11), tenant
 * isolation and least privilege (R20), and pure cross-capability policy
 * validators. Pure types and pure functions only — no IO, no storage, no
 * service implementations (those are PL-015..PL-018).
 *
 * Imports `@playliquid/game-contracts` only, per
 * spec/module-dependency-matrix.md (platform-contracts | game-contracts).
 */

// Primitives
export { asTenantId, asSubjectId, asContentDigest, asTimestampMs, isValidContentDigest, PLATFORM_AUTHORITY, isPlatformAuthorityMarker } from "./primitives.js";
export type { TenantId, SubjectId, ContentDigest, TimestampMs, PlatformAuthorityMarker } from "./primitives.js";

// Semantic event vocabulary (lock 18)
export { PLATFORM_EVENT_KIND_PREFIX, EVENT_KIND_PATTERN, isValidEventKindText, isReservedPlatformEventKind, asGameEventKind, PLATFORM_AUTHORITY_EVENT_KINDS, isPlatformAuthorityEventKind, isGameDeclaredEvent, isPlatformAuthorityEvent, isGameSemanticEventDeclaration } from "./events.js";
export type { GameEventKind, PlatformAuthorityEventKind, UntrustedClientInput, GameDeclaredEvent, PlatformAuthorityEvent, GameSemanticEventDeclaration } from "./events.js";

// Tenant isolation + least privilege (R20)
export { asNamedTenantId, isTenantScopeDeclaration, isIsolationBoundaryDescriptor, checkTenantIsolation, isCapabilityPermission, isScopedCapabilityGrant, checkLeastPrivilege, CAPABILITY_PERMISSIONS } from "./tenancy.js";
export type { NamedTenantId, TenantScoped, TenantScopedFor, TenantScopeDeclaration, IsolationBoundaryDescriptor, TenantIsolationCheck, CapabilityPermission, ScopedCapabilityGrant, CapabilityUseRequest, PrivilegeCheck } from "./tenancy.js";

// Leaderboard (R7)
export { asLeaderboardId, isLeaderboardServicePolicy, isLeaderboardEventBinding, validateScoreRecord, isLeaderboardQueryRequest, rankLeaderboardEntries } from "./leaderboard.js";
export type { LeaderboardId, LeaderboardServicePolicy, LeaderboardEventBinding, AuthoritativeScoreRecord, ClientScoreClaim, ScoreRecordValidation, LeaderboardQueryRequest, LeaderboardEntry, LeaderboardPage, LeaderboardOrdering } from "./leaderboard.js";

// Multiplayer (R7, R9 / lock 19)
export { asMatchSessionId, asMatchmakingTicketId, isMultiplayerServicePolicy, isMultiplayerEventBinding, isMatchmakingRequest, decideAdmission, validatePlatformOutcome } from "./multiplayer.js";
export type { MatchSessionId, MatchmakingTicketId, MultiplayerServicePolicy, ProtectedOutcomeKind, MultiplayerEventBinding, MatchmakingRequest, MatchmakingTicketStatus, MatchmakingTicket, SessionAdmissionRequest, SessionAdmissionFacts, SessionAdmissionDecision, MatchStanding, PlatformOutcomeRecord, ClientPlayResultClaim, OutcomeRecordValidation } from "./multiplayer.js";

// Replay (R7, R8 / lock 15)
export { asReplayId, isReplayServicePolicy, isReplayEventBinding, isReplayArtifactDescriptor, isReplayQueryRequest, authorizeReplayAccess } from "./replay.js";
export type { ReplayId, ReplayServicePolicy, ReplayEventBinding, ReplayArtifactDescriptor, ReplayQueryRequest, ReplayCatalogPage, ReplayAccessDecision } from "./replay.js";

// Entitlements / economy (R10, lock 41)
export { asEntitlementGrantId, asLedgerEntryId, grantIdempotencyKeyEquals, isEntitlementGrant, settleGrant, settleLedgerEntry, isRewardRuleBinding, issueRewards } from "./entitlements.js";
export type { EntitlementGrantId, LedgerEntryId, GrantIdempotencyKey, GrantCausation, EntitlementGrant, GrantDisposition, GrantRefusalCode, LedgerReason, LedgerEntry, LedgerSettlement, RewardRuleBinding, RewardIssuanceRequest, RewardIssuanceResult } from "./entitlements.js";

// Achievements (R7)
export { asAchievementId, isAchievementDefinition, isAchievementEventBinding, isAchievementProgress, evaluateUnlock, isAchievementQueryRequest } from "./achievements.js";
export type { AchievementId, AchievementDefinition, AchievementEventBinding, AchievementProgress, UnlockEvaluation, AchievementQueryRequest, AchievementProgressPage } from "./achievements.js";

// Social (R7)
export { SOCIAL_GRAPH_KINDS, isSocialGraphKind, isSocialServicePolicy, isSocialEventBinding, SOCIAL_ACTIONS, isSocialAction, isSocialActionRequest, adjudicateSocialAction } from "./social.js";
export type { SocialGraphKind, SocialServicePolicy, SocialEventBinding, SocialAction, SocialActionRequest, SocialGraphFacts, SocialActionDecision, SocialRelation } from "./social.js";

// Analytics (R7)
export { ANALYTICS_PRIVACY_CLASSES, ANALYTICS_FORBIDDEN_PAYLOAD_KEYS, isForbiddenAnalyticsPayloadKey, isAnalyticsServicePolicy, isAnalyticsEventBinding, ingestAnalyticsBatch } from "./analytics.js";
export type { AnalyticsPrivacyClass, AnalyticsServicePolicy, AnalyticsEventBinding, AnalyticsEventRecord, AnalyticsSubmissionRequest, AnalyticsRejection, AnalyticsIngestReceipt } from "./analytics.js";

// Moderation (R7, E8)
export { asModerationReportId, asModerationCaseId, MODERATION_SURFACES, isModerationSurface, MODERATION_SEVERITY_ORDER, isModerationSeverity, severityRank, isModerationServicePolicy, isModerationEventBinding, isModerationReport, requiredEvidenceCount, assessModerationReport, isModerationCaseDecision, adjudicateAppeal } from "./moderation.js";
export type { ModerationReportId, ModerationCaseId, ModerationSurface, ModerationSeverity, ModerationServicePolicy, ModerationEventBinding, ModerationReport, ModerationReportDisposition, ModerationCaseDecision, ModerationAppeal, AppealDecision } from "./moderation.js";

// Competitive integrity (R7, R11 / E11)
export { asIntegrityReportId, isValidConfidenceInterval, isIntegrityEvidenceRef, INTEGRITY_SIGNAL_KINDS, isIntegritySignalKind, AI_PLAY_MODES, isAiPlayMode, FORBIDDEN_INTEGRITY_FIELDS, isForbiddenIntegrityField, isIntegrityReport, aggregateIntegritySignals, validateIntegrityReport, isIntegrityEventBinding } from "./integrity.js";
export type { IntegrityReportId, ConfidenceInterval, IntegrityEvidenceRef, IntegritySignalKind, AiPlayMode, IntegritySignal, IntegrityEnforcement, IntegrityAggregate, IntegrityReport, IntegrityReportValidation, IntegrityEventBinding } from "./integrity.js";

// Cross-capability composition rules (lock 18 enforcement)
export { isCapabilityEventBinding, isPlatformPolicyDeclaration, validateCapabilityPolicy } from "./policy.js";
export type { CapabilityEventBinding, PlatformPolicyDeclaration, PolicyRejectionReason, CapabilityPolicyValidation } from "./policy.js";

// PL-009 refinement surface (integrity evidence/verdicts/participation/
// enforcement, entitlement lifecycle/economy values/settlement, replay
// lanes/provenance/QA assertions) — explicit re-export barrel.
export * from "./refinements.js";

// Behavioral evidence records (PL-009: R11/E11 refinement)
export { asEvidenceRecordId, BEHAVIORAL_EVIDENCE_KINDS, isBehavioralEvidenceKind, isBehavioralEvidenceRecord, isEvidenceCitation, citationMatchesRecord, resolveEvidenceCitation } from "./integrity-evidence.js";
export type { EvidenceRecordId, BehavioralEvidenceKind, EvidenceRecordMarker, BehavioralEvidenceRecord, EvidenceCitation } from "./integrity-evidence.js";

// Integrity risk verdicts (PL-009: R11 refinement)
export { asIntegrityVerdictId, INTEGRITY_VERDICT_KINDS, isIntegrityVerdictKind, verdictSeverityRank, VERDICT_CONFIDENCE_BANDS, isVerdictConfidenceBand, verdictBandRank, classifyVerdictConfidenceBand, FORBIDDEN_VERDICT_FIELDS, isForbiddenVerdictField, isIntegrityRiskVerdict, validateIntegrityRiskVerdict } from "./integrity-verdicts.js";
export type { IntegrityVerdictId, IntegrityVerdictKind, VerdictConfidenceBand, IntegrityRiskVerdict, IntegrityVerdictValidation } from "./integrity-verdicts.js";

// Participation-mode declarations (PL-009: explicit AI-player modes)
export { PARTICIPATION_DECLARATION_KINDS, isParticipationDeclarationKind, isParticipationModeDeclaration, isDeclaredAiParticipation, isAssistParticipation, isHumanParticipation, participationModeOf, declarationsAreCoherent } from "./participation.js";
export type { ParticipationDeclarationKind, HumanParticipationDeclaration, AssistParticipationDeclaration, DeclaredAiParticipationDeclaration, ParticipationModeDeclaration } from "./participation.js";

// Policy-driven enforcement (PL-009: evidence-before-enforcement)
export { asIntegrityEnforcementPolicyId, asEnforcementDecisionId, ENFORCEMENT_ACTION_KINDS, isEnforcementActionKind, isEnforcementRule, isIntegrityEnforcementPolicy, isIntegrityEnforcementDecision, decideEnforcement, validateEnforcementDecision } from "./integrity-enforcement.js";
export type { IntegrityEnforcementPolicyId, EnforcementDecisionId, EnforcementActionKind, EnforcementRule, IntegrityEnforcementPolicy, IntegrityEnforcementDecision, EnforcementDecisionOutcome, EnforcementDecisionValidation } from "./integrity-enforcement.js";

// Entitlement lifecycle (PL-009: R10 refinement)
export { ENTITLEMENT_LIFECYCLE_STATES, ENTITLEMENT_LIFECYCLE_TRANSITIONS, ENTITLEMENT_REVOCATION_REASONS, isEntitlementLifecycleState, canTransitionEntitlement, isEntitlementRevocationReason, lifecycleCommandKeyEquals, isEntitlementLifecycleCommand, isEntitlementLifecycleRecord, openEntitlementLifecycle, admitLifecycleCommand } from "./entitlement-lifecycle.js";
export type { EntitlementLifecycleState, EntitlementLifecycleOperation, LifecycleCommandKey, EntitlementRevocationReason, EntitlementLifecycleCommand, LifecycleTransitionRecord, EntitlementLifecycleRecord, LifecycleCommandDisposition } from "./entitlement-lifecycle.js";

// Economy value carriers (PL-009: zero numeric authority)
export { KERNEL_VALUE_KINDS, isKernelValueKind, isEconomyValueRef, asOpaqueEconomyValue, asTypedKernelValueReading, isQuantityReading, readingPinnedToShape } from "./economy-values.js";
export type { KernelValueKind, OpaqueEconomyValue, TypedKernelValueReading, EconomyValueRef } from "./economy-values.js";

// Entitlement settlement (PL-009: R10 refinement)
export { asSettlementId, isSettlementEligibilityDeclaration, validateSettlement, isEntitlementSettlementRecord, admitSettlement } from "./settlement.js";
export type { SettlementId, SettlementEligibilityDeclaration, SettlementValidationRequest, SettlementValidationVerdict, EntitlementSettlementRecord, SettlementAdmission } from "./settlement.js";

// Replay reuse lanes (PL-009: R8 refinement)
export { REPLAY_LANES, isReplayLane, isReplayLaneRequest, authorizeReplayLaneRequest } from "./replay-lanes.js";
export type { ReplayLane, PlayerReplayRequest, QaReplayRequest, IntegrityReplayRequest, SimulationReplayRequest, LabReplayRequest, ReplayLaneRequest, PlayerReplayView, QaReplayView, IntegrityReplayView, SimulationReplayView, LabReplayView, ReplayLaneView, ReplayLaneDecision } from "./replay-lanes.js";

// Replay provenance linkage (PL-009: R8 refinement)
export { isReplayProvenanceLink, provenanceMatchesDescriptor, authoritativeRecordRefs } from "./replay-provenance.js";
export type { ReplayProvenanceLink } from "./replay-provenance.js";

// QA assertion harness over replays (PL-009: R8 refinement)
export { asQaExpectationId, asQaExpectationResultId, REPLAY_EXPECTATION_KINDS, isReplayExpectationKind, isReplayExpectation, EXPECTATION_OUTCOMES, isExpectationOutcome, isReplayExpectationResult, validateExpectationResult } from "./qa-assertions.js";
export type { QaExpectationId, QaExpectationResultId, ReplayExpectationKind, ReplayExpectation, ExpectationOutcome, ReplayExpectationResult, ExpectationResultValidation } from "./qa-assertions.js";
