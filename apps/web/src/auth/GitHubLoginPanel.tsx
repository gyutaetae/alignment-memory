import { getGitHubLoginUrl, isFixtureMode } from "../shared/api/client";
import styles from "./GitHubLoginPanel.module.css";

interface GitHubLoginPanelProps {
  connected: boolean;
  onFixtureConnect: () => void;
}

export function GitHubLoginPanel({ connected, onFixtureConnect }: GitHubLoginPanelProps) {
  return (
    <div className={styles.panel}>
      <div>
        <span className={styles.stepIcon} aria-hidden="true">1</span>
        <h2>Sign in with GitHub</h2>
        <p>Authenticate your member account before selecting repository access.</p>
      </div>
      {connected ? (
        <span className={styles.connected}><span aria-hidden="true">✓</span> GitHub connected</span>
      ) : isFixtureMode ? (
        <button className={styles.primary} onClick={onFixtureConnect} type="button">
          Continue with GitHub
        </button>
      ) : (
        <a className={styles.primary} href={getGitHubLoginUrl()}>
          Continue with GitHub
        </a>
      )}
    </div>
  );
}
