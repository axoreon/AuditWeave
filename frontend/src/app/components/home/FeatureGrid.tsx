"use client";

import { motion } from "framer-motion";
import { FileCheck, Sparkles, BarChart3, FileText, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: FileCheck,
    title: "Multi-Format Policy Ingestion",
    description: "Extracts privacy policies from web URLs, PDFs, or DOCX files using a fail-safe pipeline with SPA state parsing and Jina AI Web Reader fallback."
  },
  {
    icon: Shield,
    title: "11-Pillar Compliance Engine",
    description: "Hybrid rule engine covers Notice & Transparency, Consent, Purpose Limitation, Data Retention, Minors Protection, Grievance Officer, and 5 more statutory mandates."
  },
  {
    icon: Sparkles,
    title: "AI Copilot & Clause Rewriter",
    description: "Interactive assistant grounded in the DPDP Act 2023 PDF. One-click legally compliant clause rewriting for non-compliant sections."
  },
  {
    icon: BarChart3,
    title: "Batch Multi-Company Audits",
    description: "Audit multiple enterprise policies simultaneously. Generate side-by-side comparative matrices, identify benchmark winners, and export GRC scorecards."
  },
  {
    icon: FileText,
    title: "Executive PDF Reports",
    description: "Statutory audit reports with penalty caps (₹250 Cr under Sec 8(5)), risk matrices, compliance scores, and actionable technical/legal recommendations."
  },
  {
    icon: Zap,
    title: "Real-Time Audit History",
    description: "Full historical registry with company domain badges, industry filters, risk status, and single-click audit deletion. Search by company or sector."
  }
];

export function FeatureGrid() {
  return (
    <section className="relative overflow-hidden bg-[#0A0F1C] py-24 lg:py-32">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-brand-green/10 blur-[120px]" />
      <div className="absolute right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-purple-500/8 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-[1400px] space-y-16 px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl space-y-5 text-center"
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/5 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-brand-green" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-green">
              Enterprise-Grade Capabilities
            </span>
          </div>

          <h2 className="text-4xl font-black leading-tight tracking-tight text-white lg:text-5xl">
            Built for Scale, Precision,
            <br />
            and <span className="text-brand-green">Regulatory Certainty</span>
          </h2>

          <p className="text-base leading-relaxed text-slate-400 lg:text-lg">
            Every feature is designed to eliminate manual GRC bottlenecks and deliver auditable,
            explainable compliance intelligence across your entire policy portfolio.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/40 p-8 backdrop-blur-sm transition-all duration-300 hover:border-brand-green/40 hover:bg-slate-900/60"
              >
                {/* Hover Glow */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from[#276152]/0 via-brand-green/0 to[#276152]/0 opacity-0 transition-opacity duration-300 group-hover:from[#276152]/5 group-hover:via-transparent group-hover:to-purple-500/5 group-hover:opacity-100" />

                {/* Icon */}
                <div className="mb-5 inline-flex items-center justify-center rounded-xl border border-brand-green/20 bg-brand-green/10 p-3 transition-all duration-300 group-hover:border-brand-green/40 group-hover:bg-brand-green/20">
                  <Icon className="h-6 w-6 text-brand-green" />
                </div>

                {/* Content */}
                <h3 className="mb-3 text-lg font-bold text-white">
                  {feature.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-slate-400">
                  {feature.description}
                </p>

                {/* Bottom Accent Line */}
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from[#276152] to-emerald-400 transition-all duration-300 group-hover:w-full" />
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto grid max-w-4xl grid-cols-1 gap-8 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-8 backdrop-blur-sm md:grid-cols-3"
        >
          <div className="text-center">
            <p className="mb-2 text-4xl font-black text-white">43+</p>
            <p className="text-sm font-medium text-slate-400">Statutory Rule Checks</p>
          </div>
          <div className="border-t border-slate-700/60 md:border-l md:border-t-0">
            <div className="text-center">
              <p className="mb-2 text-4xl font-black text[#276152]">11</p>
              <p className="text-sm font-medium text-slate-400">DPDP Compliance Pillars</p>
            </div>
          </div>
          <div className="border-t border-slate-700/60 md:border-l md:border-t-0">
            <div className="text-center">
              <p className="mb-2 text-4xl font-black text-white">&lt;15s</p>
              <p className="text-sm font-medium text-slate-400">Average Audit Runtime</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
