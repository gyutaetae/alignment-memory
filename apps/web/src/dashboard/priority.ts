import type { AlignmentSummary } from "../shared/types/api";

const priority = { direct_conflict: 0, missing_alignment: 1, aligned: 2 } as const;

export function orderAlignments(items: AlignmentSummary[]) {
  return [...items].sort((left, right) => {
    const outcomeDifference = priority[left.outcome] - priority[right.outcome];
    if (outcomeDifference !== 0) return outcomeDifference;
    return Date.parse(right.createdAt) - Date.parse(left.createdAt);
  });
}
