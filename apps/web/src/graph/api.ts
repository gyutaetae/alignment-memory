import { useQuery } from "@tanstack/react-query";

import { getGraph } from "../shared/api/client";

export function useKnowledgeGraph(repositoryId: string | undefined) {
  return useQuery({
    queryKey: ["repositories", repositoryId, "graph"],
    queryFn: ({ signal }) => getGraph(repositoryId!, signal),
    enabled: Boolean(repositoryId),
  });
}
