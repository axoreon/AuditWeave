export const BENCHMARK_DISCLOSURE =
  "Demonstration data: marked sectors include seeded sample values and are not verified industry statistics.";

export function splitPillarNames(value: string): string[] {
  return value
    .split(",")
    .map((pillar) => pillar.trim())
    .filter(Boolean);
}

export function getPillarTone(severity: string | null): string {
  switch (severity) {
    case "Critical":
      return "border-red-200 bg-red-50 text-red-700";
    case "High":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Low":
      return "border-brand-green/20 bg-brand-green/5 text-brand-green";
    case "Informational":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-brand-deep/10 bg-brand-deep/[0.03] text-brand-deep/60";
  }
}
