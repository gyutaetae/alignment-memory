import { useQuery } from "@tanstack/react-query";

import { getAlignment } from "../shared/api/client";

export function useAlignment(alignmentId: string | undefined) {
  return useQuery({
    queryKey: ["alignments", alignmentId],
    queryFn: ({ signal }) => getAlignment(alignmentId!, signal),
    enabled: Boolean(alignmentId),
  });
}
