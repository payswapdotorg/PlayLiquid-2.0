/**
 * @playliquid/gameos-projects PUBLIC ENTRYPOINT (PLX-UX-003 step 1).
 *
 * Everything the host needs to mount the World Projects workbench:
 * - ports (the two seams: read-model data + typed command intents);
 * - the one UI-state owner, its typed action set and the append-only
 *   command log;
 * - the pure read-model projections (the projects list, the project
 *   overview, the package composition, the semantic pull requests with
 *   the community-frozen review-action legality + the status
 *   vocabulary);
 * - the presentational component set (shell, panels, chips, primitives,
 *   style tokens) — zero data fetching;
 * - the app composition (ProjectsApp + the useSyncExternalStore
 *   binding);
 * - the labeled TEST-SUPPORT doubles and the demo fixture (lock rule 44:
 *   clearly marked, never presented as production integrations).
 *
 * Cross-module access goes through here or src/contract.ts only;
 * implementation details stay inside the module.
 */

// The two seams.
export type {
  ProjectsCommandIntent,
  ProjectsCommandLogEntry,
  ProjectsCommandPort,
  ProjectsCommandReceipt,
  ProjectsCommandReceiptOk,
  ProjectsCommandReceiptRefused,
  ProjectsDataPort,
  ProjectsIntentRefusalCode,
  ProjectsLoadResult,
  ProjectsTransitionRefusalCode,
} from "./ports.js";
export { projectsIntentProblem } from "./ports.js";

// The one UI-state owner + its vocabulary.
export type { ProjectsStore, ProjectsWorkbenchPorts, Unsubscribe } from "./projects-store.js";
export { createProjectsStore } from "./projects-store.js";
export type { ProjectsAction, ProjectsState } from "./projects-actions.js";
export { initialProjectsState, projectState, reduce } from "./projects-actions.js";

// Read-model projections (pure).
export type {
  BranchSummary,
  ChangeKindCount,
  CommitSummary,
  CompositionPin,
  ProjectsDataSnapshot,
  ProjectRowView,
  ProjectsView,
  ProjectsWorkbenchViewModel,
  SemanticPullRequestSummary,
  TaskSummary,
  WorldProjectDetail,
  WorldProjectSummary,
} from "./view/projects-view.js";
export { projectProjects, projectWorkbench, projectsSummary } from "./view/projects-view.js";
export { INITIAL_PROJECTS_SELECTION } from "./view/projects-selection.js";
export type {
  ProjectsSelection,
  ProjectsSelectionRefusal,
  ProjectsTab,
  ProjectsViewer,
} from "./view/projects-selection.js";
export type {
  BranchRowView,
  CommitRowView,
  OverviewView,
  TaskRowView,
} from "./view/project-overview-view.js";
export { overviewSummary, projectOverview } from "./view/project-overview-view.js";
export type {
  CompositionPinRowView,
  CompositionView,
} from "./view/composition-view.js";
export { compositionSummary, projectComposition } from "./view/composition-view.js";
export type {
  PullRequestDetailView,
  PullRequestRowView,
  PullRequestsView,
} from "./view/semantic-pr-view.js";
export {
  changeKindSummaryLine,
  legalTransitionsFor,
  projectPullRequests,
  pullRequestsSummary,
} from "./view/semantic-pr-view.js";
export type { UiStatus, UiTone } from "./view/status.js";
export {
  commandReceiptStatus,
  gateStatusStatus,
  pullRequestStatusStatus,
  refusalStatus,
  taskStatusStatus,
  transitionCommandStatus,
  worldKindStatus,
} from "./view/status.js";

// Onboarding copy + contextual next-step hints (pure; UX-002).
export type { EmptySurfaceCopy, ProjectsEmptySurfaceId } from "./view/onboarding.js";
export {
  PROJECTS_EMPTY_STATE_COPY,
  commandLogNextHint,
  refreshFailureNextStep,
} from "./view/onboarding.js";

// Presentational components (zero data fetching).
export { ProjectsShell } from "./components/projects-shell.js";
export type { ProjectsShellProps } from "./components/projects-shell.js";
export { ProjectListPanel } from "./components/project-list-panel.js";
export type { ProjectListPanelProps } from "./components/project-list-panel.js";
export { ProjectOverviewPanel } from "./components/project-overview-panel.js";
export type { ProjectOverviewPanelProps } from "./components/project-overview-panel.js";
export { CompositionPanel } from "./components/composition-panel.js";
export type { CompositionPanelProps } from "./components/composition-panel.js";
export { SemanticPullRequestsPanel } from "./components/semantic-pr-panel.js";
export type { SemanticPullRequestsPanelProps } from "./components/semantic-pr-panel.js";
export { EmptySurface } from "./components/empty-surface.js";
export type { EmptySurfaceProps } from "./components/empty-surface.js";
export { CountPill, StatusChip } from "./components/status-chip.js";
export type { StatusChipProps } from "./components/status-chip.js";
export { Banner, ChipList, DataTable, EmptyState, KeyValue, Mono, Panel } from "./components/primitives.js";
export type { DataTableColumn, DataTableProps } from "./components/primitives.js";
export { FONT, STYLE, SURFACE, TONE_STYLE } from "./components/tokens.js";
export type { ToneStyle } from "./components/tokens.js";

// The app composition.
export { ProjectsApp } from "./app/projects-app.js";
export type { ProjectsAppProps } from "./app/projects-app.js";
export { projectStateCached, useProjectsStore } from "./app/use-projects-store.js";
export type { UseProjectsStore } from "./app/use-projects-store.js";

// TEST-SUPPORT doubles (lock rule 44) + demo fixture.
export {
  ScriptedProjectsCommandPort,
  ScriptedProjectsDataPort,
  StaticProjectsDataPort,
} from "./fakes.js";
export {
  DEMO_PROJECTS_FOREIGN_TENANT,
  DEMO_PROJECTS_TENANT,
  DEMO_PROJECTS_VIEWER,
  demoProjectsSnapshot,
} from "./fixtures/demo.js";
