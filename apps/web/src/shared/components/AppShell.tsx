import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { isFixtureMode } from "../api/client";
import styles from "./AppShell.module.css";

const navigation = [
  { to: "/connect", icon: "↗", label: "Connect" },
  { to: "/memory", icon: "▤", label: "Project Memory" },
  { to: "/graph", icon: "⌘", label: "Knowledge Graph" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <NavLink className={styles.brand} to="/memory">
          <span className={styles.mark} aria-hidden="true">AM</span>
          <span>
            <strong>Alignment Memory</strong>
            <small>Evidence-backed project context</small>
          </span>
        </NavLink>
        <div className={styles.topbarMeta}>
          {isFixtureMode ? <span className={styles.fixture}>◆ Fixture data</span> : null}
          <span className={styles.identity} aria-label="Signed in profile">
            KG
          </span>
        </div>
      </header>
      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <p className={styles.navLabel}>Workspace</p>
          <nav aria-label="Primary navigation">
            {navigation.map((item) => (
              <NavLink
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}
                key={item.to}
                to={item.to}
              >
                <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className={styles.repositoryCard}>
            <span className={styles.repositoryIcon} aria-hidden="true">⌂</span>
            <span>
              <small>Active repository</small>
              <strong>alignment-memory-demo</strong>
            </span>
          </div>
        </aside>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
