import type { AlignmentOutcome, JobStatus } from "../types/api";
import styles from "./StatusBadge.module.css";

const labels: Record<AlignmentOutcome | JobStatus, { icon: string; label: string }> = {
  aligned: { icon: "✓", label: "Aligned" },
  direct_conflict: { icon: "!", label: "Direct Conflict" },
  missing_alignment: { icon: "?", label: "Missing Alignment" },
  queued: { icon: "·", label: "Queued" },
  fetching: { icon: "↓", label: "Fetching" },
  analyzing: { icon: "⌕", label: "Analyzing" },
  validating: { icon: "✓", label: "Validating" },
  persisting: { icon: "↧", label: "Persisting" },
  writing_github: { icon: "↗", label: "Writing to GitHub" },
  completed: { icon: "✓", label: "Completed" },
  failed: { icon: "!", label: "Failed" },
};

export function StatusBadge({ status }: { status: AlignmentOutcome | JobStatus }) {
  const item = labels[status];
  return (
    <span className={`${styles.badge} ${styles[status] ?? ""}`}>
      <span aria-hidden="true">{item.icon}</span>
      {item.label}
    </span>
  );
}
