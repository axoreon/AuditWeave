"use client";

import { motion } from "framer-motion";
import {
  FileCheck,
  Sparkles,
  BarChart3,
  Shield,
  Zap,
  FileText,
} from "lucide-react";

const features = [
  {
    icon: FileCheck,
    title: "Multi-Format Policy Ingestion",
    description: "Paste URLs, upload PDFs, or submit DOCX files. Our fail-safe extraction pipeline handles complex SPAs, bot-protected sites, and nested policy structures.",
    stat: "3 Input Formats",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Shield,
    title: "11-Pillar Compliance Engine",
    description: "Hybrid rule engine covers Notice & Transparency, Consent, Purpose Limitation, Data Retention, Minors Protection, and 6 more statutory mandates.",
    stat: "43+ Rule Checks",
    gradient: "from[#276152] to-teal-500"
  },
  {
    icon: Sparkles,
    title: "AI Copilot & Clause Rewriter",
    description: "Interactive assistant grounded in the DPDP Act 2023. One-click clause rewriting transforms non-compliant sections into legally sound language.",
    stat: "96% Accuracy",
    gradient: "from-violet-500 to-purple-500"
  },
  {
    icon: BarChart3,
    title: "Batch Multi-Company Audits",
    description: "Audit 10+ policies simultaneously. Generate side-by-side comparative matrices, identify industry benchmarks, and export GRC scorecards.",
    stat: "Unlimited Batch",
    gradient: "from-orange-500 to-red-500"
  },
  {
    icon: FileText,
    title: "Executive PDF Reports",
    description: "Board-ready reports with penalty estimates (₹250 Cr caps), risk matrices, compliance scores, and actionable technical recommendations.",
    stat: "Instant Export",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    icon: Zap,
    title: "Real-Time Audit History",
    description: "Complete historical registry with company domain badges, industry filters, risk status indicators, and advanced search capabilities.",
    stat: "Full Tracking",
    gradient: "from-amber-500 to-yellow-500"
  }
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white py-16 lg:py-20" id="how-it-works">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-16 xl:px-24">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 max-w-4xl text-center"
        >
          <h2 className="mb-3 text-3xl font-extrabold leading-tight lg:text-4xl" style={{ color: "#276152" }}>
            Complete Compliance Platform
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
            Six enterprise features working together to automate DPDP Act auditing from policy ingestion to executive reporting.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -3 }}
                className="group relative"
              >
                <div className="relative h-full overflow-hidden rounded-2xl p-5 shadow-lg transition-all hover:shadow-xl" style={{ backgroundColor: "white", border: "1px solid #D4CAB8" }}>
                  {/* Icon Container */}
                  <div className={`mb-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} p-3`}>
                    <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>

                  {/* Stat Badge */}
                  <div className="mb-2 inline-block rounded-full bg-slate-100 px-2.5 py-1">
                    <span className="text-xs font-bold" style={{ color: "#666" }}>{feature.stat}</span>
                  </div>

                  {/* Title */}
                  <h3 className="mb-2 text-base font-extrabold" style={{ color: "#276152" }}>
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs leading-relaxed text-slate-600">
                    {feature.description}
                  </p>

                  {/* Decorative Glow */}
                  <div className={`absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br ${feature.gradient} opacity-0 blur-2xl transition-opacity group-hover:opacity-20`} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Stats Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg"
          style={{ border: "1px solid #D4CAB8" }}
        >
          <div className="grid grid-cols-1 divide-y divide-emerald-200 md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="p-6 text-center">
              <p className="mb-1.5 text-4xl font-extrabold" style={{ color: "#276152" }}>43+</p>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Statutory Rule Checks
              </p>
            </div>
            <div className="p-6 text-center">
              <p className="mb-1.5 text-4xl font-extrabold" style={{ color: "#276152" }}>
                100%
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                DPDP Act Coverage
              </p>
            </div>
            <div className="p-6 text-center">
              <p className="mb-1.5 text-4xl font-extrabold" style={{ color: "#276152" }}>&lt;15s</p>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Average Audit Time
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
