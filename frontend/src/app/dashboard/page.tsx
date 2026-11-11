"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, AlertTriangle, CheckCircle, ShieldCheck, Calendar, ChevronRight, Activity, TrendingUp } from "lucide-react";
import { getDashboard, getBenchmarks, isAuthenticated } from "@/lib/api";
import {
  BENCHMARK_DISCLOSURE,
  getPillarTone,
  splitPillarNames,
} from "@/lib/dashboard";

interface RecentAudit {
  id: number;
  company_name: string;
  industry: string;
  score: number;
  status: string;
}

interface RiskDistribution {
  Critical: number;
  High: number;
  Medium: number;
  Low: number;
  Informational: number;
}

interface ExecutiveRisk {
  overall_risk: string;
  highest_risk_area: string;
  best_performing_area: string;
  compliance_pct: number;
  critical_findings: number;
  immediate_priority: string;
}

interface PillarMetric {
  pillar: string;
  finding_count: number;
  highest_severity: keyof RiskDistribution | null;
  severity_counts: RiskDistribution;
}

interface DashboardData {
  total_audits: number;
  average_compliance_score: number;
  risk_distribution: RiskDistribution;
  average_ai_confidence: number | null;
  ai_confidence_note: string;
  pillar_metrics: PillarMetric[];
  recent_audits: RecentAudit[];
  executive_risk: ExecutiveRisk;
}

interface Benchmark {
  id: number;
  industry: string;
  companies_count: number;
  average_compliance_score: number;
  contains_seeded_demonstration_data: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const dData = await getDashboard();
        const bData = await getBenchmarks();
        setDashboardData(dData as DashboardData);
        setBenchmarks(bData as Benchmark[]);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-brand-cream text-brand-deep/60 font-mono text-sm">
        <Activity className="h-6 w-6 text-brand-green animate-spin mr-3" />
        <span>Loading GRC Telemetry...</span>
      </div>
    );
  }

  const stats = dashboardData || {
    total_audits: 0,
    average_compliance_score: 0,
    risk_distribution: { Critical: 0, High: 0, Medium: 0, Low: 0, Informational: 0 },
    average_ai_confidence: null,
    ai_confidence_note: "Verified AI confidence is unavailable.",
    pillar_metrics: [],
    recent_audits: [],
    executive_risk: {
      overall_risk: "None",
      highest_risk_area: "None",
      best_performing_area: "None",
      compliance_pct: 0,
      critical_findings: 0,
      immediate_priority: "N/A"
    }
  };

  const riskColors: Record<string, string> = {
    Critical: "bg-red-500",
    High: "bg-orange-500",
    Medium: "bg-amber-500",
    Low: "bg-brand-green",
    Informational: "bg-brand-deep/50"
  };
  const lowestRiskPillars = splitPillarNames(
    stats.executive_risk.best_performing_area,
  );

  return (
    <div className="p-6 space-y-8 bg-brand-cream min-h-screen">
      {/* Page Title & Scans count - PSYCHOLOGY: Loss Aversion + Clear Value Proposition */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-deep tracking-tight">Your Compliance Protection Dashboard</h1>
          <p className="text-sm text-brand-deep/70 mt-1.5 font-medium">
            Active protection: <span className="text-brand-green font-semibold">DPDP Act 2023</span> • Avoid ₹250 Cr penalties with continuous monitoring
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white/60 border border-brand-deep/10 px-4 py-2.5 rounded-xl shadow-sm">
          <Calendar className="h-4 w-4 text-brand-deep/60" />
          <span className="text-xs text-brand-deep/80 font-medium">Updated {new Date().toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</span>
        </div>
      </div>

      {/* Top statistics summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card relative overflow-hidden rounded-xl p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-[150px] text-xs font-semibold uppercase leading-[1.45] tracking-wider text-brand-deep/60">
              Total Scans Completed
            </p>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-green/10 bg-brand-green/[0.07] text-brand-green/45">
              <LayoutDashboard className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 font-mono text-3xl font-bold text-brand-deep">{stats.total_audits}</p>
        </div>

        <div className="glass-card relative overflow-hidden rounded-xl p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-[150px] text-xs font-semibold uppercase leading-[1.45] tracking-wider text-brand-deep/60">
              Average Compliance Score
            </p>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-green/10 bg-brand-green/[0.07] text-brand-green/45">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 font-mono text-3xl font-bold text-brand-green">{stats.average_compliance_score}%</p>
        </div>

        <div className="glass-card rounded-xl p-5 md:col-span-2 relative overflow-hidden">
          <p className="text-xs text-brand-deep/60 font-semibold uppercase tracking-wider">Immediate GRC Action</p>
          <p className="text-xs text-brand-deep/80 mt-2 leading-relaxed font-medium">
            {stats.executive_risk.immediate_priority}
          </p>
        </div>
      </div>

      {/* Row 2: Executive Risk Summary Card & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Executive Risk Card (L: 7 cols) */}
        <div className="glass-card relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6 lg:col-span-7">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-500/5 rounded-full filter blur-[80px] pointer-events-none" />
          
          <div className="relative">
            <div className="flex items-start justify-between gap-3 border-b border-brand-deep/10 pb-4">
              <h2 className="min-w-0 text-lg font-bold text-brand-deep">Executive Risk Summary</h2>
              <span className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 animate-pulse">
                {stats.executive_risk.overall_risk.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-4 py-5 sm:grid-cols-2">
              <div className="min-w-0 rounded-xl border border-red-200/70 bg-red-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/60">Highest Risk Exposure</p>
                <div className="mt-2 flex min-w-0 items-start gap-2 text-sm font-bold leading-snug text-red-600">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 break-words">{stats.executive_risk.highest_risk_area}</span>
                </div>
              </div>

              <div className="min-w-0 rounded-xl border border-brand-deep/10 bg-brand-deep/[0.025] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/60">Active Vulnerabilities</p>
                <p className="mt-2 font-mono text-sm font-bold text-brand-deep">
                  <span className="text-lg font-extrabold text-red-600">{stats.executive_risk.critical_findings}</span> Critical &amp; High Gaps
                </p>
              </div>
            </div>

            <div className="border-t border-brand-deep/10 pb-1 pt-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/60">Lowest Recorded Risk Pillars</p>
              <div className="mt-3 flex min-w-0 flex-wrap gap-2">
                {lowestRiskPillars.map((pillar, index) => (
                  <span
                    key={`${pillar}-${index}`}
                    className="inline-flex max-w-full items-start gap-1.5 rounded-full border border-brand-green/20 bg-brand-green/[0.07] px-3 py-1.5 text-xs font-bold leading-snug text-brand-green"
                  >
                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0 break-words">{pillar}</span>
                  </span>
                ))}
              </div>
              <p className="mt-3 max-w-2xl text-[10px] leading-relaxed text-brand-deep/55">
                Based on the highest severity of stored findings; this is not a pillar compliance percentage.
              </p>
            </div>
          </div>

          <div className="relative mt-5 flex flex-col gap-3 rounded-xl border border-brand-deep/10 bg-brand-deep/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-medium text-brand-deep/70">Ready to run a new privacy policy audit?</span>
            <Link
              href="/audit/new"
              className="flex w-full items-center justify-center space-x-1.5 rounded-lg bg-brand-green px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1f4f42] sm:w-auto"
            >
              <span>Scan Policy</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Risk Distribution (R: 5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-brand-deep pb-4 border-b border-brand-deep/10 mb-6">Gap Severity Distribution</h2>
          
          <div className="space-y-4">
            {Object.entries(stats.risk_distribution).map(([sev, count]) => {
              const maxVal = Math.max(...Object.values(stats.risk_distribution) as number[]) || 1;
              const pct = ((count as number) / maxVal) * 100;
              return (
                <div key={sev} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-brand-deep/70">
                    <span className="flex items-center">
                      <span className={`h-2.5 w-2.5 rounded-full ${riskColors[sev]} mr-2`} />
                      {sev}
                    </span>
                    <span className="font-mono text-brand-deep/80">{count as number} Gaps</span>
                  </div>
                  <div className="h-2 w-full bg-brand-deep/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${riskColors[sev]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Heatmap Panel */}
      <div className="glass-card rounded-2xl p-6">
        <div className="mb-6 flex flex-col gap-3 border-b border-brand-deep/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-deep">DPDP Compliance Heatmap</h2>
            <p className="text-xs text-brand-deep/60 mt-0.5">Stored findings grouped by canonical DPDP pillar</p>
          </div>
          <div className="flex shrink-0 items-center space-x-1 text-xs text-brand-deep/60">
            <TrendingUp className="h-3.5 w-3.5 text-brand-green" />
            <span>User audit data only</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.pillar_metrics.map((p) => {
            const status = p.highest_severity || "N/A";
            return (
              <div key={p.pillar} className={`flex min-h-36 min-w-0 flex-col justify-between rounded-xl border p-4 ${getPillarTone(p.highest_severity)}`}>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="shrink-0 rounded bg-brand-deep/5 px-2 py-0.5 font-mono text-[10px] font-bold text-brand-deep/70">DPDP</span>
                    <span className="shrink-0 whitespace-nowrap text-[10px] font-bold tracking-wide">{status.toUpperCase()}</span>
                  </div>
                  <h3 className="mt-3 break-words text-sm font-bold leading-snug text-brand-deep">{p.pillar}</h3>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-brand-deep/10 pt-2 text-[11px] text-brand-deep/60">
                  <span className="min-w-0">{p.finding_count > 0 ? "Stored findings:" : "Assessment:"}</span>
                  <span className="shrink-0 font-bold text-brand-deep/80">{p.finding_count > 0 ? p.finding_count : "N/A"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 4: Recent Audits & Benchmark Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Audits Table (L: 8 cols) */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-brand-deep pb-4 border-b border-brand-deep/10 mb-6">Recent Privacy Audits</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-deep/10 text-brand-deep/60 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Audited Organization</th>
                  <th className="pb-3">Industry</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-deep/5">
                {stats.recent_audits.map((a) => (
                  <tr key={a.id} className="text-brand-deep/80 hover:bg-brand-deep/5 transition-colors">
                    <td className="py-3 font-semibold text-brand-deep">{a.company_name}</td>
                    <td className="py-3 text-brand-deep/70">{a.industry}</td>
                    <td className="py-3 font-mono font-bold text-brand-green">{a.score}%</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-brand-deep/10 bg-brand-deep/5 text-brand-deep/70">
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/audit/${a.id}`}
                        className="text-[11px] font-bold text-brand-green hover:text-[#1f4f42] underline-offset-2 hover:underline transition-all"
                      >
                        Inspect Audit
                      </Link>
                    </td>
                  </tr>
                ))}
                {stats.recent_audits.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-brand-deep/50">
                      No audits found. Submit a privacy policy to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Benchmark Averages (R: 4 cols) */}
        <div className="lg:col-span-4 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-brand-deep pb-4 border-b border-brand-deep/10 mb-6">Sector Benchmarks</h2>
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-800">
            {BENCHMARK_DISCLOSURE}
          </p>
          
          <div className="space-y-4">
            {benchmarks.map((b) => (
              <div key={b.id} className="flex items-center justify-between border-b border-brand-deep/5 pb-3">
                <div>
                  <p className="text-sm font-semibold text-brand-deep/90">{b.industry}</p>
                  <p className="text-[10px] text-brand-deep/60 mt-0.5">
                    {b.companies_count} recorded benchmark entries
                    {b.contains_seeded_demonstration_data ? " · Demo-influenced" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-green font-mono">{b.average_compliance_score}%</p>
                  <p className="text-[10px] text-brand-deep/60 mt-0.5">Average Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
