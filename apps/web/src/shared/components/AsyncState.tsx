import styles from "./AsyncState.module.css";

interface AsyncStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  kind?: "loading" | "empty" | "error";
}

export function AsyncState({
  title,
  message,
  actionLabel,
  onAction,
  kind = "empty",
}: AsyncStateProps) {
  const icon = kind === "error" ? "!" : kind === "loading" ? "↻" : "○";
  return (
    <section className={styles.state} aria-live="polite">
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <h2>{title}</h2>
      <p>{message}</p>
      {actionLabel && onAction ? (
        <button className={styles.action} onClick={onAction} type="button">
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
