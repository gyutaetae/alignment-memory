import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AlignmentFeedback } from "../feedback/AlignmentFeedback";
import { ContextPassportPanel } from "../passport/ContextPassportPanel";
import { AsyncState } from "../shared/components/AsyncState";
import { StatusBadge } from "../shared/components/StatusBadge";
import { useAlignment } from "./api";
import styles from "./AlignmentDetailScreen.module.css";

export function AlignmentDetailScreen() {
  const { alignmentId } = useParams();
  const alignment = useAlignment(alignmentId);
  const [revealedEvidence, setRevealedEvidence] = useState<Set<string>>(() => new Set());

  if (alignment.isPending) {
    return <AsyncState kind="loading" title="Loading Alignment Diff" message="Retrieving the existing agreement, proposed change, and verified evidence." />;
  }
  if (alignment.isError || !alignment.data) {
    return (
      <AsyncState
        actionLabel="Retry"
        kind="error"
        message="The alignment detail could not be loaded."
        onAction={() => void alignment.refetch()}
        title="Alignment unavailable"
      />
    );
  }

  const finding = alignment.data.findings[0];
  const allEvidence = alignment.data.findings.flatMap((item) => item.evidence);
  const existingAgreement = finding?.evidence[0]?.exactQuote ?? "No conflicting active agreement was identified.";
  const proposedChange = finding?.explanation ?? "The proposed change is consistent with the current recorded context.";

  const toggleEvidence = (findingId: string) => {
    setRevealedEvidence((current) => {
      const next = new Set(current);
      if (next.has(findingId)) next.delete(findingId);
      else next.add(findingId);
      return next;
    });
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <Link to="/memory">← Project Memory</Link>
          <p>Pull request #{alignment.data.prNumber} · revision {alignment.data.knowledgeRevision}</p>
          <h1>Alignment Diff</h1>
        </div>
        <StatusBadge status={alignment.data.outcome} />
      </header>

      <section className={styles.diffHero} aria-label="Alignment Diff comparison">
        <article>
          <div className={styles.diffLabel}><span aria-hidden="true">◀</span> Existing agreement</div>
          <h2>{finding?.targetNodeType === "decision" ? "Active decision" : "Recorded project context"}</h2>
          <blockquote>{existingAgreement}</blockquote>
          <small>Knowledge revision {alignment.data.knowledgeRevision} · {finding?.targetNodeStatus ?? "active"}</small>
        </article>
        <div className={styles.divider} aria-hidden="true">≠</div>
        <article>
          <div className={styles.diffLabel}><span aria-hidden="true">▶</span> Proposed change</div>
          <h2>PR #{alignment.data.prNumber}</h2>
          <p>{proposedChange}</p>
          <small>Head {alignment.data.headSha.slice(0, 8)}</small>
        </article>
      </section>

      <div className={styles.detailGrid}>
        <div className={styles.mainColumn}>
          <section className={styles.explanationCard}>
            <div>
              <span className={styles.sectionIcon} aria-hidden="true">!</span>
              <div>
                <p>Impact</p>
                <h2>Why this change needs alignment</h2>
              </div>
            </div>
            <p>{finding?.explanation ?? "No supported conflict was found."}</p>
          </section>

          <section className={styles.explanationCard}>
            <div>
              <span className={styles.sectionIcon} aria-hidden="true">→</span>
              <div>
                <p>Next action</p>
                <h2>Resolve before merge</h2>
              </div>
            </div>
            <p>{finding?.recommendedAction ?? "Continue normal review and merge when project checks pass."}</p>
          </section>

          <section className={styles.evidenceCard} aria-labelledby="evidence-heading">
            <div className={styles.evidenceHeader}>
              <div>
                <p>Source record</p>
                <h2 id="evidence-heading">Verified evidence</h2>
              </div>
              <span><span aria-hidden="true">✓</span> Exact quote verified</span>
            </div>
            {alignment.data.findings.length ? alignment.data.findings.map((item) => (
              <article key={item.id}>
                <div className={styles.evidenceSummary}>
                  <div>
                    <strong>{item.targetNodeType ?? "context"} evidence</strong>
                    <p>{item.evidence.length} immutable source {item.evidence.length === 1 ? "version" : "versions"}</p>
                  </div>
                  <button onClick={() => toggleEvidence(item.id)} type="button">
                    {revealedEvidence.has(item.id) ? "Hide source evidence" : "Reveal source evidence"}
                  </button>
                </div>
                {revealedEvidence.has(item.id) ? (
                  <div className={styles.evidenceReveal} aria-live="polite">
                    {item.evidence.map((source) => (
                      <div key={`${source.sourceVersionId}-${source.exactQuote}`}>
                        <blockquote>{source.exactQuote}</blockquote>
                        <a href={source.url} rel="noreferrer" target="_blank">Open original source URL <span aria-hidden="true">↗</span></a>
                        <small>Source version {source.sourceVersionId.slice(0, 8)} · {source.role} · {source.verified ? "verified" : "unverified"}</small>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            )) : <p className={styles.emptyEvidence}>○ This aligned result did not require contradictory evidence.</p>}
          </section>

          {finding?.targetNodeId ? (
            <Link className={styles.graphLink} to={`/graph?focus=${finding.targetNodeId}`}>
              <span aria-hidden="true">⌘</span>
              <span><strong>See this decision in context</strong><small>Open the relevant one/two-hop Knowledge Graph.</small></span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </div>

        <ContextPassportPanel alignmentId={alignment.data.id} evidence={allEvidence} />
      </div>

      <AlignmentFeedback alignmentId={alignment.data.id} />
    </div>
  );
}
