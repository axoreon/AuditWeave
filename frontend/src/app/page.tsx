"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, CheckCircle2, AlertTriangle, FileLock2, Award } from "lucide-react";
import { PublicNavbar } from "./components/PublicNavbar";
import { PublicFooter } from "./components/PublicFooter";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-brand-cream text-brand-deep">
      {/* Background Gradients */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-brand-green/5 blur-[100px]" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-1/4 h-[600px] w-[600px] rounded-full bg-brand-laurel/20 blur-[120px]" />

      <PublicNavbar />

      {/* Hero Section */}
      <main className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:grid-cols-12 lg:gap-14 lg:py-24">
        {/* Left text column */}
        <div className="space-y-7 lg:col-span-7 lg:space-y-8">
          <div className="home-reveal home-reveal-1 inline-flex max-w-full items-start gap-2 rounded-full border border-brand-green/20 bg-brand-green/10 px-3.5 py-2 text-xs font-semibold leading-relaxed text-brand-green sm:items-center sm:px-4">
            <Sparkles aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />
            <span className="min-w-0">AI-GRC Compliance Engine for DPDP Act 2023</span>
          </div>
          
          <h1 className="home-reveal home-reveal-2 max-w-4xl text-[2.5rem] font-extrabold leading-[1.08] tracking-tight text-brand-deep sm:text-5xl md:text-6xl">
            India&apos;s AI-Powered <span className="text-brand-green">DPDP Compliance</span>{" "}
            Intelligence Platform.
          </h1>
          
          <p className="home-reveal home-reveal-3 max-w-xl text-[15px] font-medium leading-relaxed text-brand-deep/70 sm:text-base">
            Audit privacy policies, identify structural compliance gaps, evaluate regulatory liabilities, and generate executive-ready GRC reports. Built on a hybrid deterministic rule engine and Gemini AI.
          </p>

          {/* Differentiated CTAs */}
          <div className="home-reveal home-reveal-4 flex flex-col items-stretch gap-4 pt-2 sm:flex-row sm:items-center sm:pt-4">
            <Link
              href="/audit/new"
              className="group flex items-center justify-center gap-2 rounded-xl bg-brand-green px-8 py-4 text-sm font-bold text-white shadow-lg shadow-brand-green/20 transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#1f4f42] hover:shadow-xl hover:shadow-brand-green/25 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream active:translate-y-0 active:shadow-md"
            >
              <span>Initialize GRC Audit</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5" />
            </Link>
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 rounded-xl border border-brand-deep/10 bg-white px-8 py-4 text-sm font-bold text-brand-deep shadow-sm transition-[transform,color,background-color,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-green/30 hover:bg-brand-cream hover:text-brand-green hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream active:translate-y-0 active:shadow-sm"
            >
              <span>View Pricing</span>
            </Link>
            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 rounded-xl border border-brand-deep/10 bg-white px-8 py-4 text-sm font-bold text-brand-deep shadow-sm transition-[transform,color,background-color,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-green/30 hover:bg-brand-cream hover:text-brand-green hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream active:translate-y-0 active:shadow-sm"
            >
              <span>Contact & Support</span>
            </Link>
          </div>

          {/* Trust statistics row */}
          <div className="home-reveal home-reveal-5 grid max-w-lg grid-cols-2 border-t border-brand-deep/10 pt-7 sm:pt-8">
            <div className="pr-6">
              <p className="text-3xl font-bold text-brand-deep">40+</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-brand-deep/60">Rule Checks</p>
            </div>
            <div className="border-l border-brand-deep/10 pl-6">
              <p className="text-3xl font-bold text-[#3F9C7E]">100%</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-brand-deep/60">DPDP Mapped</p>
            </div>
          </div>
        </div>

        {/* Right audit preview */}
        <div className="home-reveal home-reveal-6 relative lg:col-span-5">
          <div aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-2xl bg-brand-green/10 blur-3xl" />
          
          <div className="audit-preview relative rounded-2xl border border-brand-deep/10 bg-white p-[1px]">
            <div className="overflow-hidden rounded-[15px] bg-white p-4 sm:p-6">
              {/* Top window bar */}
              <div className="mb-5 flex min-w-0 items-center justify-between gap-4 border-b border-brand-deep/5 pb-4 sm:mb-6">
                <div aria-hidden="true" className="flex shrink-0 items-center space-x-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <span className="min-w-0 truncate font-mono text-[10px] text-brand-deep/55">console.axoreon.com/auditweave</span>
              </div>

              {/* Simulated Live Score Card */}
              <div className="space-y-5 sm:space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-bold text-brand-deep/55">AUDITED ENTITY</p>
                    <p className="truncate text-base font-bold text-brand-deep">Paytm Core Services</p>
                  </div>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] border-brand-green bg-brand-green/5 text-lg font-bold text-brand-green">
                    79
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-brand-deep/8 bg-brand-cream/50 p-3.5 sm:p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-xs">
                    <span className="font-medium leading-5 text-brand-deep/70">DPDP Notice Compliance</span>
                    <span className="whitespace-nowrap font-bold text-brand-green">PASS (92%)</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-xs">
                    <span className="font-medium leading-5 text-brand-deep/70">Children&apos;s Data Restrictions</span>
                    <span className="whitespace-nowrap font-bold text-red-500">FAIL (20%)</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-xs">
                    <span className="font-medium leading-5 text-brand-deep/70">Grievance Redressal</span>
                    <span className="whitespace-nowrap font-bold text-amber-500">WARNING (50%)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between gap-3 font-mono text-[11px] font-bold text-brand-deep/60">
                    <span>AI Legal Reasoning</span>
                    <span className="whitespace-nowrap">96% Certainty</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-cream">
                    <div className="h-full w-[96%] bg-brand-green" />
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs bg-red-50 p-3 rounded-lg border border-red-100">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-900 text-[11px] leading-relaxed">
                    <span className="font-bold">Critical Vulnerability:</span> Missing age-gating mechanisms for users under 18. Penalties cap at ₹200 Crore.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Core Pillars Feature Grid */}
      <section className="relative z-10 w-full border-t border-brand-deep/8 bg-white py-16 shadow-[inset_0_16px_32px_-32px_rgba(13,58,53,0.24)] sm:py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:space-y-12 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-deep">Full DPDP Alignment Modules</h2>
            <p className="text-xs sm:text-sm text-brand-deep/70 leading-relaxed font-medium">
              AuditWeave evaluates policies against the seven structural pillars mandated by the Indian Parliament in the DPDP Act 2023.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Consent Compliance", icon: CheckCircle2, text: "Granular opt-ins, withdrawal mechanisms, and affirmative action checks under Section 6." },
              { title: "Notice Disclosures", icon: FileLock2, text: "Verification of clear descriptions of data collected, purpose mapping, and rights (Section 5)." },
              { title: "Children's Protections", icon: AlertTriangle, text: "Age verification checks, parent consent details, and bans on minor tracking (Section 9)." },
              { title: "Grievance Redressal", icon: Award, text: "Nodal Grievance Redressal Officer contact disclosure and escalation SLA verification (Section 13)." }
            ].map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="glass-card group rounded-xl bg-white p-6 hover:bg-brand-cream/30">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-brand-green/10 bg-brand-green/10 text-brand-green transition-[background-color,border-color] duration-200 ease-out group-hover:border-brand-green/20 group-hover:bg-brand-green/15">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-brand-deep mb-2">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-brand-deep/70 leading-relaxed">{pillar.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
