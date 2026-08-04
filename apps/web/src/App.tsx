import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AlignmentDetailScreen } from "./alignment/AlignmentDetailScreen";
import { ProjectMemoryScreen } from "./dashboard/ProjectMemoryScreen";
import { KnowledgeGraphScreen } from "./graph/KnowledgeGraphScreen";
import { ConnectScreen } from "./repositories/ConnectScreen";
import { AppShell } from "./shared/components/AppShell";

function ProductLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<ProductLayout />}>
        <Route path="/" element={<Navigate to="/memory" replace />} />
        <Route path="/connect" element={<ConnectScreen />} />
        <Route path="/memory" element={<ProjectMemoryScreen />} />
        <Route path="/alignments/:alignmentId" element={<AlignmentDetailScreen />} />
        <Route path="/graph" element={<KnowledgeGraphScreen />} />
        <Route path="*" element={<Navigate to="/memory" replace />} />
      </Route>
    </Routes>
  );
}
