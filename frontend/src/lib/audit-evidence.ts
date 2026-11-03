export type FindingEvidenceState =
  | "none"
  | "matched"
  | "missing"
  | "unmatched"
  | "search";

export function hasExactPolicyEvidence(policyText: string, evidence?: string): boolean {
  const candidate = evidence?.trim();
  if (!candidate) return false;
  return policyText.toLocaleLowerCase().includes(candidate.toLocaleLowerCase());
}

export function getFindingEvidenceState({
  policyText,
  evidence,
  findingSelected,
  searchText,
}: {
  policyText: string;
  evidence?: string;
  findingSelected: boolean;
  searchText: string;
}): FindingEvidenceState {
  if (searchText.trim().length > 1) return "search";
  if (!findingSelected) return "none";
  if (!evidence?.trim()) return "missing";
  return hasExactPolicyEvidence(policyText, evidence) ? "matched" : "unmatched";
}

export function getFindingEvidenceStatusLabel(state: FindingEvidenceState): string {
  const labels: Record<FindingEvidenceState, string> = {
    none: "No active target",
    matched: "Evidence selected",
    missing: "Required clause missing",
    unmatched: "Evidence could not be matched",
    search: "Search active",
  };
  return labels[state];
}
