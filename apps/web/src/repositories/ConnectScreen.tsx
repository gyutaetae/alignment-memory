import { useState } from "react";

import { GitHubLoginPanel } from "../auth/GitHubLoginPanel";
import { isFixtureMode } from "../shared/api/client";
import { AsyncState } from "../shared/components/AsyncState";
import { StatusBadge } from "../shared/components/StatusBadge";
import { useInitialSync, useJob, useRepositories } from "./api";
import styles from "./ConnectScreen.module.css";

export function ConnectScreen() {
  const [connected, setConnected] = useState(() =>
    isFixtureMode ? false : Boolean(window.sessionStorage.getItem("alignment-memory-access-token")),
  );
  const [installed, setInstalled] = useState(false);
  const [repositoryId, setRepositoryId] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const repositories = useRepositories();
  const sync = useInitialSync();
  const job = useJob(jobId);

  if (repositories.isPending) {
    return <AsyncState kind="loading" title="Loading connection state" message="Checking GitHub repositories and installation access." />;
  }
  if (repositories.isError) {
    return (
      <AsyncState
        actionLabel="Retry"
        kind="error"
        message="Repository access could not be loaded. Reconnect or retry the request."
        onAction={() => void repositories.refetch()}
        title="Connection check failed"
      />
    );
  }

  const available = repositories.data.repositories;
  const selectedRepositoryId = repositoryId || available[0]?.id || "";

  const handleSync = async () => {
    if (!selectedRepositoryId) return;
    const created = await sync.mutateAsync(selectedRepositoryId);
    setJobId(created.jobId);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p>Repository setup</p>
        <h1>Connect project memory</h1>
        <span>Authorize one repository, then build its first evidence-backed knowledge revision.</span>
      </header>

      <div className={styles.steps}>
        <GitHubLoginPanel connected={connected} onFixtureConnect={() => setConnected(true)} />

        <section className={`${styles.stepCard} ${!connected ? styles.disabled : ""}`}>
          <div className={styles.stepCopy}>
            <span className={styles.stepIcon} aria-hidden="true">2</span>
            <div>
              <h2>Install the GitHub App</h2>
              <p>Grant read and workflow dispatch access to one selected repository.</p>
            </div>
          </div>
          {installed ? (
            <span className={styles.complete}><span aria-hidden="true">✓</span> App installed</span>
          ) : (
            <button disabled={!connected} onClick={() => setInstalled(true)} type="button">
              Install GitHub App
            </button>
          )}
        </section>

        <section className={`${styles.stepCard} ${!installed ? styles.disabled : ""}`}>
          <div className={styles.stepCopy}>
            <span className={styles.stepIcon} aria-hidden="true">3</span>
            <div>
              <h2>Select repository</h2>
              <p>The MVP keeps one public repository as the explicit product boundary.</p>
            </div>
          </div>
          {available.length ? (
            <label className={styles.selectLabel}>
              <span>Repository</span>
              <select
                disabled={!installed}
                onChange={(event) => setRepositoryId(event.target.value)}
                value={selectedRepositoryId}
              >
                {available.map((repository) => (
                  <option key={repository.id} value={repository.id}>{repository.fullName}</option>
                ))}
              </select>
            </label>
          ) : (
            <p className={styles.empty}>○ No installed repositories were found.</p>
          )}
        </section>

        <section className={`${styles.syncCard} ${!installed ? styles.disabled : ""}`}>
          <div className={styles.syncHeader}>
            <div className={styles.stepCopy}>
              <span className={styles.stepIcon} aria-hidden="true">4</span>
              <div>
                <h2>Initial Sync</h2>
                <p>Collect allowed GitHub records and poll until the generated memory is written.</p>
              </div>
            </div>
            <button
              disabled={!installed || !selectedRepositoryId || sync.isPending || Boolean(jobId)}
              onClick={() => void handleSync()}
              type="button"
            >
              {sync.isPending ? "Starting…" : "Start Initial Sync"}
            </button>
          </div>

          {sync.isError ? (
            <div className={styles.inlineError} role="alert">
              <span aria-hidden="true">!</span>
              <span>Sync could not start. {sync.error.message}</span>
              <button onClick={() => sync.reset()} type="button">Retry setup</button>
            </div>
          ) : null}

          {job.data ? (
            <div className={styles.progressPanel} aria-live="polite">
              <div className={styles.progressMeta}>
                <StatusBadge status={job.data.status} />
                <strong>{job.data.progress}%</strong>
              </div>
              <progress max="100" value={job.data.progress}>{job.data.progress}%</progress>
              <p>Polling job {job.data.jobId.slice(0, 8)}… until a terminal state is recorded.</p>
            </div>
          ) : null}

          {job.isError ? (
            <div className={styles.inlineError} role="alert">
              <span aria-hidden="true">!</span>
              <span>Progress could not be loaded.</span>
              <button onClick={() => void job.refetch()} type="button">Retry polling</button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
