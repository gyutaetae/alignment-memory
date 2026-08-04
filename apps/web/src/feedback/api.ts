import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postHandshake, postOverride } from "../shared/api/client";

export function useHandshake(alignmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof postHandshake>[1]) => postHandshake(alignmentId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["alignments", alignmentId] });
    },
  });
}

export function useOverride(alignmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof postOverride>[1]) => postOverride(alignmentId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["alignments", alignmentId] }),
        queryClient.invalidateQueries({ queryKey: ["repositories"] }),
      ]);
    },
  });
}
