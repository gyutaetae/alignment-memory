import { useQuery } from "@tanstack/react-query";

import { getContextPassport } from "../shared/api/client";

export function useContextPassport(alignmentId: string, language: string) {
  return useQuery({
    queryKey: ["alignments", alignmentId, "context-passport", language],
    queryFn: ({ signal }) => getContextPassport(alignmentId, language, signal),
  });
}
