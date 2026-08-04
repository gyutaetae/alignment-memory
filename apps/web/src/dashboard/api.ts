import { useQuery } from "@tanstack/react-query";

import { getDashboard, getGraph } from "../shared/api/client";

export function useProjectDashboard(repositoryId: string | undefined) {
  return useQuery({
    queryKey: ["repositories", repositoryId, "dashboard"],
    queryFn: ({ signal }) => getDashboard(repositoryId!, signal),
    enabled: Boolean(repositoryId),
  });
}

export function useDashboardKnowledge(repositoryId: string | undefined) {
  return useQuery({
    queryKey: ["repositories", repositoryId, "graph"],
    queryFn: ({ signal }) => getGraph(repositoryId!, signal),
    enabled: Boolean(repositoryId),
  });
}
