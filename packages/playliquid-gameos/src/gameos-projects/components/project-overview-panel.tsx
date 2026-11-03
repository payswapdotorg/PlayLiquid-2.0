/**
 * PROJECT OVERVIEW PANEL (presentational): the OPEN project's Git shape —
 * branches with their last commits, the recent commit history (newest
 * first) and the board tasks with their states. Absence is honest: no
 * open project renders the empty state, never fabricated rows (E11).
 */

import type { ReactNode } from "react";
import type { OverviewView } from "../view/project-overview-view.js";
import { overviewSummary } from "../view/project-overview-view.js";
import { PROJECTS_EMPTY_STATE_COPY } from "../view/onboarding.js";
import { taskStatusStatus } from "../view/status.js";
import { DataTable, KeyValue, Mono, Panel } from "./primitives.js";
import { EmptySurface } from "./empty-surface.js";
import { StatusChip } from "./status-chip.js";
import { STYLE } from "./tokens.js";

export interface ProjectOverviewPanelProps {
  /** The Overview view of the open project (from the store projection). */
  readonly view: OverviewView;
  /** The REAL next step of the no-project state: one data-port pull. */
  readonly onRefresh?: () => void;
}

/** The Overview surface. */
export function ProjectOverviewPanel({ view, onRefresh }: ProjectOverviewPanelProps): ReactNode {
  if (view.projectId === null) {
    return (
      <Panel title="Overview" summary={overviewSummary(view)}>
        <EmptySurface copy={PROJECTS_EMPTY_STATE_COPY.overview} onNextStep={onRefresh} />
      </Panel>
    );
  }
  return (
    <Panel title="Overview" summary={overviewSummary(view)}>
      <KeyValue
        entries={[
          { key: "Project", value: <Mono>{view.projectId}</Mono> },
          { key: "Default branch", value: <Mono>{view.defaultBranch}</Mono> },
        ]}
      />
      <DataTable
        columns={[
          { key: "name", header: "Branch", render: (row) => <Mono>{row.name}</Mono> },
          { key: "sha", header: "Last commit", render: (row) => <Mono>{row.lastCommitSha}</Mono> },
          {
            key: "headline",
            header: "Headline",
            render: (row) => <span style={STYLE.muted}>{row.lastCommitHeadline}</span>,
          },
        ]}
        rows={view.branches}
        rowKey={(row) => row.name}
        empty="no branches recorded"
      />
      <DataTable
        columns={[
          { key: "sha", header: "Commit", render: (row) => <Mono>{row.sha}</Mono> },
          {
            key: "headline",
            header: "Headline",
            render: (row) => <span style={STYLE.muted}>{row.headline}</span>,
          },
          { key: "author", header: "Author", render: (row) => <Mono>{row.author}</Mono> },
          { key: "at", header: "At (epoch)", render: (row) => <Mono>{row.at}</Mono> },
        ]}
        rows={view.commits}
        rowKey={(row) => `${row.sha}:${row.at}`}
        empty="no recent commits recorded"
      />
      <DataTable
        columns={[
          { key: "id", header: "Task", render: (row) => <Mono>{row.id}</Mono> },
          {
            key: "title",
            header: "Title",
            render: (row) => <span style={STYLE.muted}>{row.title}</span>,
          },
          {
            key: "status",
            header: "State",
            render: (row) => <StatusChip status={taskStatusStatus(row.status)} />,
          },
        ]}
        rows={view.tasks}
        rowKey={(row) => row.id}
        empty="no tasks recorded"
      />
      <p style={{ ...STYLE.faint, margin: 0, fontSize: 11.5 }}>
        Every game is a Git repository (R1); branches and commits render from the game-contracts
        git vocabulary, newest commits first.
      </p>
    </Panel>
  );
}
