import { Link } from "react-router-dom";

import { useRepositories } from "../repositories/api";
import { AsyncState } from "../shared/components/AsyncState";
import { StatusBadge } from "../shared/components/StatusBadge";
import { useDashboardKnowledge, useProjectDashboard } from "./api";
import { orderAlignments } from "./priority";
import styles from "./ProjectMemoryScreen.module.css";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ProjectMemoryScreen() {
  const repositories = useRepositories();
  const repositoryId = repositories.data?.repositories[0]?.id;
  const dashboard = useProjectDashboard(repositoryId);
  const knowledge = useDashboardKnowledge(repositoryId);

  if (repositories.isPending || dashboard.isPending) {
    return <AsyncState kind="loading" title="Building Project Memory" message="Loading active decisions, conflicts, and recent accumulation." />;
  }
  if (repositories.isError || dashboard.isError) {
    return (
      <AsyncState
        actionLabel="Retry"
        kind="error"
        message="Project Memory could not be loaded from the repository API."
        onAction={() => {
          void repositories.refetch();
          void dashboard.refetch();
        }}
        title="Project Memory unavailable"
      />
    );
  }
  if (!repositoryId || !dashboard.data) {
    return (
      <AsyncState
        actionLabel="Connect repository"
        message="Install the GitHub App and select a repository before building project memory."
        onAction={() => { window.location.href = "/connect"; }}
        title="No repository connected"
      />
    );
  }

  const alignments = orderAlignments(dashboard.data.recentAlignments);
  const attention = alignments.filter((item) => item.outcome !== "aligned");
  const primaryConflict = attention[0];
  const goal = knowledge.data?.nodes.find((node) => node.nodeType === "goal");
  const decision = knowledge.data?.nodes.find((node) => node.nodeType === "decision");

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p>Repository · {dashboard.data.repository.fullName}</p>
          <h1>Project Memory</h1>
          <span>Knowledge revision {dashboard.data.repository.knowledgeRevision}</span>
        </div>
        <Link className={styles.secondaryAction} to="/connect">↻ Sync repository</Link>
      </header>

      {primaryConflict ? (
        <section className={styles.priorityCard} aria-labelledby="priority-heading">
          <div className={styles.priorityCopy}>
            <StatusBadge status={primaryConflict.outcome} />
            <p className={styles.kicker}>Needs action before merge</p>
            <h2 id="priority-heading">PR #{primaryConflict.prNumber} crosses an active project boundary</h2>
            <p>
              Review the existing agreement beside the proposed change, then record a Handshake or a reasoned Override.
            </p>
          </div>
          <div className={styles.nextAction}>
            <span>Next action</span>
            <strong>Open Alignment Diff</strong>
            <p>Confirm the evidence and choose the team response.</p>
            <Link to={`/alignments/${primaryConflict.id}`}>Review conflict <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      ) : (
        <section className={styles.clearCard}>
          <StatusBadge status="aligned" />
          <h2>No alignment issues need action</h2>
          <p>Recent work is consistent with the active recorded context.</p>
        </section>
      )}

      <section className={styles.summaryGrid} aria-label="Project memory summary">
        <article><span>Verified sources</span><strong>{dashboard.data.summary.sourceCount}</strong><small>immutable source versions</small></article>
        <article><span>Knowledge nodes</span><strong>{dashboard.data.summary.knowledgeNodeCount}</strong><small>active project context</small></article>
        <article><span>Alignment checks</span><strong>{dashboard.data.summary.alignmentCount}</strong><small>recorded analyses</small></article>
        <article><span>Jobs in progress</span><strong>{dashboard.data.summary.openJobCount}</strong><small>polling for updates</small></article>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.panel} aria-labelledby="context-heading">
          <div className={styles.panelHeader}>
            <div>
              <p>Current context</p>
              <h2 id="context-heading">Goal and decision</h2>
            </div>
            <Link to="/graph">View connections</Link>
          </div>
          {knowledge.isPending ? (
            <p className={styles.inlineState}>↻ Loading active knowledge…</p>
          ) : knowledge.isError ? (
            <button className={styles.retry} onClick={() => void knowledge.refetch()} type="button">! Retry knowledge</button>
          ) : (
            <div className={styles.contextList}>
              {[goal, decision].filter(Boolean).map((node) => (
                <article key={node!.id}>
                  <span>{node!.nodeType === "goal" ? "◎ Goal" : "◇ Decision"}</span>
                  <h3>{node!.title}</h3>
                  <p>{node!.summary}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="attention-heading">
          <div className={styles.panelHeader}>
            <div>
              <p>Review queue</p>
              <h2 id="attention-heading">Needs attention</h2>
            </div>
            <span>{attention.length} open</span>
          </div>
          {attention.length ? (
            <div className={styles.alignmentList} aria-label="Alignment priority">
              {attention.map((item) => (
                <Link key={item.id} to={`/alignments/${item.id}`}>
                  <span className={styles.prNumber}>PR #{item.prNumber}</span>
                  <StatusBadge status={item.outcome} />
                  <small>{formatTime(item.createdAt)}</small>
                  <span className={styles.chevron} aria-hidden="true">›</span>
                </Link>
              ))}
            </div>
          ) : <p className={styles.inlineState}>✓ Nothing requires review.</p>}
        </section>

        <section className={`${styles.panel} ${styles.recentPanel}`} aria-labelledby="recent-heading">
          <div className={styles.panelHeader}>
            <div>
              <p>Compound memory</p>
              <h2 id="recent-heading">Recent accumulation</h2>
            </div>
            <span>Newest first</span>
          </div>
          <div className={styles.timeline}>
            {dashboard.data.jobs.map((job) => (
              <article key={job.jobId}>
                <span className={styles.timelineMark} aria-hidden="true">{job.status === "completed" ? "✓" : "↻"}</span>
                <div>
                  <strong>{job.eventType === "initial_sync" ? "Initial Sync" : job.eventType === "pr_analysis" ? "PR analysis" : "Merge publish"}</strong>
                  <p>{job.status === "completed" ? "Knowledge and evidence were recorded." : `Worker is ${job.status.replace("_", " ")} at ${job.progress}%.`}</p>
                </div>
                <time dateTime={job.updatedAt}>{formatTime(job.updatedAt)}</time>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
