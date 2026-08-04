import { type FormEvent, useState } from "react";

import type { Handshake, Override } from "../shared/types/api";
import { useHandshake, useOverride } from "./api";
import styles from "./AlignmentFeedback.module.css";

const handshakeOptions: Array<{ value: Handshake["response"]; label: string; help: string }> = [
  { value: "agree", label: "Agree", help: "I understand and support the recorded direction." },
  { value: "needs_clarification", label: "Needs clarification", help: "I need more context before aligning." },
  { value: "disagree", label: "Disagree", help: "My recorded position differs from this change." },
];

export function AlignmentFeedback({ alignmentId }: { alignmentId: string }) {
  const [response, setResponse] = useState<Handshake["response"]>("agree");
  const [message, setMessage] = useState("");
  const [overrideType, setOverrideType] = useState<Override["overrideType"]>("false_positive");
  const [reason, setReason] = useState("");
  const [handshakeSaved, setHandshakeSaved] = useState(false);
  const [overrideSaved, setOverrideSaved] = useState(false);
  const handshake = useHandshake(alignmentId);
  const override = useOverride(alignmentId);

  const submitHandshake = async (event: FormEvent) => {
    event.preventDefault();
    setHandshakeSaved(false);
    await handshake.mutateAsync({ response, message: message || undefined, sourceLanguage: "en" });
    setHandshakeSaved(true);
  };

  const submitOverride = async (event: FormEvent) => {
    event.preventDefault();
    setOverrideSaved(false);
    await override.mutateAsync({ overrideType, reason, targetType: "alignment" });
    setOverrideSaved(true);
  };

  return (
    <section className={styles.feedback} aria-label="Alignment responses">
      <form className={styles.form} onSubmit={(event) => void submitHandshake(event)}>
        <div className={styles.formHeader}>
          <span className={styles.formIcon} aria-hidden="true">↔</span>
          <div>
            <p>Team response</p>
            <h2>Handshake</h2>
          </div>
        </div>
        <p className={styles.description}>Record whether you align with the shared context. This does not alter the AI finding.</p>
        <fieldset>
          <legend>Handshake response</legend>
          {handshakeOptions.map((option) => (
            <label key={option.value}>
              <input
                checked={response === option.value}
                name="handshake"
                onChange={() => setResponse(option.value)}
                type="radio"
                value={option.value}
              />
              <span><strong>{option.label}</strong><small>{option.help}</small></span>
            </label>
          ))}
        </fieldset>
        <label className={styles.field}>
          <span>Optional note</span>
          <textarea onChange={(event) => setMessage(event.target.value)} rows={3} value={message} />
        </label>
        {handshake.isError ? <p className={styles.error} role="alert">! {handshake.error.message}</p> : null}
        {handshakeSaved ? <p className={styles.success} role="status">✓ Handshake recorded as append-only evidence.</p> : null}
        <button className={styles.primary} disabled={handshake.isPending} type="submit">
          {handshake.isPending ? "Recording…" : "Record Handshake"}
        </button>
      </form>

      <form className={`${styles.form} ${styles.overrideForm}`} onSubmit={(event) => void submitOverride(event)}>
        <div className={styles.formHeader}>
          <span className={styles.formIcon} aria-hidden="true">!</span>
          <div>
            <p>Human correction</p>
            <h2>Override</h2>
          </div>
        </div>
        <p className={styles.description}>Correct or supersede the finding. The prior finding remains in history and a reason is required.</p>
        <label className={styles.field}>
          <span>Override type</span>
          <select onChange={(event) => setOverrideType(event.target.value as Override["overrideType"])} value={overrideType}>
            <option value="false_positive">False positive</option>
            <option value="supersede_decision">Supersede decision</option>
            <option value="insufficient_evidence">Insufficient evidence</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Override reason <strong>Required</strong></span>
          <textarea onChange={(event) => setReason(event.target.value)} required rows={5} value={reason} />
        </label>
        {override.isError ? <p className={styles.error} role="alert">! {override.error.message}</p> : null}
        {overrideSaved ? <p className={styles.success} role="status">✓ Override recorded without deleting prior evidence.</p> : null}
        <button className={styles.secondary} disabled={override.isPending || !reason.trim()} type="submit">
          {override.isPending ? "Recording…" : "Submit Override"}
        </button>
      </form>
    </section>
  );
}
