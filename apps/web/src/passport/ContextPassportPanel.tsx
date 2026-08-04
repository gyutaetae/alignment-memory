import { useState } from "react";

import type { Evidence } from "../shared/types/api";
import { useContextPassport } from "./api";
import styles from "./ContextPassportPanel.module.css";

const declaredContext = {
  timezone: "America/Toronto · UTC−04:00",
  role: "Product manager",
  ownership: "MVP scope and acceptance",
};

export function ContextPassportPanel({
  alignmentId,
  evidence,
}: {
  alignmentId: string;
  evidence: Evidence[];
}) {
  const [showOriginal, setShowOriginal] = useState(false);
  const passport = useContextPassport(alignmentId, "en");

  return (
    <aside className={styles.panel} aria-labelledby="passport-heading">
      <div className={styles.header}>
        <div>
          <p>Handoff context</p>
          <h2 id="passport-heading">Context Passport</h2>
        </div>
        <span className={styles.passportIcon} aria-hidden="true">▣</span>
      </div>

      {passport.isPending ? <p className={styles.state}>↻ Loading declared context…</p> : null}
      {passport.isError ? (
        <div className={styles.state} role="alert">
          <span>! Passport could not be loaded.</span>
          <button onClick={() => void passport.refetch()} type="button">Retry</button>
        </div>
      ) : null}
      {passport.data ? (
        <>
          <dl className={styles.attributes}>
            <div><dt>Preferred language</dt><dd>{passport.data.language === "en" ? "English" : passport.data.language} · self-declared</dd></div>
            <div><dt>Timezone</dt><dd>{declaredContext.timezone} · self-declared</dd></div>
            <div><dt>Role</dt><dd>{declaredContext.role}</dd></div>
            <div><dt>Ownership</dt><dd>{declaredContext.ownership}</dd></div>
          </dl>

          <div className={styles.handoff}>
            <h3>Why this matters</h3>
            <p>{passport.data.content}</p>
          </div>

          <label className={styles.toggle}>
            <input
              checked={showOriginal}
              onChange={(event) => setShowOriginal(event.target.checked)}
              type="checkbox"
            />
            <span>Show original evidence in Passport</span>
          </label>

          {showOriginal ? (
            <div className={styles.original} aria-live="polite">
              {evidence
                .filter((item) => passport.data.sourceVersionIds.includes(item.sourceVersionId))
                .map((item) => <blockquote key={item.sourceVersionId}>{item.exactQuote}</blockquote>)}
            </div>
          ) : null}

          <div className={styles.questions}>
            <h3>Unresolved questions</h3>
            {passport.data.ambiguities.length ? (
              <ul>{passport.data.ambiguities.map((item) => <li key={item}>{item}</li>)}</ul>
            ) : <p>○ No unresolved questions were recorded.</p>}
          </div>
        </>
      ) : null}
    </aside>
  );
}
