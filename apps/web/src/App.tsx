import { Navigate, Route, Routes } from "react-router-dom";

import styles from "./App.module.css";

function ProductShell() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.mark} aria-hidden="true" />
        <span>Alignment Memory</span>
      </header>
      <main className={styles.main}>
        <p className={styles.eyebrow}>Project memory</p>
        <h1>Keep decisions and delivery aligned.</h1>
        <p className={styles.description}>
          Repository context will appear here after a project is connected.
        </p>
      </main>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<ProductShell />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
