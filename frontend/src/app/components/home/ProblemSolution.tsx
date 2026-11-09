"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, DollarSign, Clock, CheckCircle2, ArrowRight } from "lucide-react";

const problems = [
  {
    icon: Clock,
    stat: "4-6 weeks",
    label: "Manual Review Time",
    description: "Legal teams spend weeks manually cross-referencing privacy policies against 40+ DPDP Act clauses."
  },
  {
    icon: DollarSign,
    stat: "₹250 Cr",
    label: "Maximum Penalty",
    description: "Non-compliance under Section 8(5) can result in penalties up to ₹250 Crore per violation."
  },
  {
    icon: AlertTriangle,
    stat: "73%",
    label: "Miss Critical Issues",
    description: "Manual audits routinely overlook structural vulnerabilities like missing age-gating mechanisms."
  }
];

const solutions = [
  {
    icon: CheckCircle2,
    label: "Automated Statutory Checks",
    description: "43 deterministic rule checks cover all 11 DPDP Act compliance pillars in under 15 seconds."
  },
  {
    icon: CheckCircle2,
    label: "Explainable AI Reasoning",
    description: "Advanced AI provides human-readable legal justifications with confidence scoring."
  },
  {
    icon: CheckCircle2,
    label: "Executive-Ready Reports",
    description: "PDF audit reports with penalty estimates, risk matrices, and remediation recommendations."
  }
];

export function ProblemSolution() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 py-24 lg:py-32">
      {/* Background Elements */}
      <div className="absolute left-0 top-1/4 h-[400px] w-[400px] rounded-full bg-red-500/5 blur-[100px]" />
      <div className="absolute right-0 bottom-1/4 h-[400px] w-[400px] rounded-full bg[#F4F1EB]0/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-[1400px] space-y-20 px-6 lg:px-12">
        {/* Problem Statement */}
        <div className="space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl space-y-5 text-center"
          >
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                Why Automation Is Mandatory
              </span>
            </div>

            <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-900 lg:text-5xl">
              Manual Compliance Reviews
              <br />
              Create <span className="text-red-600">Enterprise Risk</span>
            </h2>

            <p className="text-base leading-relaxed text-slate-600 lg:text-lg">
              Legacy workflows expose organizations to regulatory penalties, reputational damage, and operational bottlenecks.
              The DPDP Act 2023 introduced 11 statutory compliance pillars with complex cross-references across 40+ sections.
            </p>
          </motion.div>

          {/* Problem Cards */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {problems.map((problem, idx) => {
              const Icon = problem.icon;
              return (
                <motion.div
                  key={problem.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 transition-all duration-300 hover:border-red-200 hover:shadow-xl hover:shadow-red-500/10"
                >
                  {/* Accent Bar */}
                  <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-500 to-orange-500" />

                  <div className="mb-5 inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50 p-3">
                    <Icon className="h-6 w-6 text-red-600" />
                  </div>

                  <p className="mb-2 text-3xl font-black text-slate-900">{problem.stat}</p>
                  <p className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                    {problem.label}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {problem.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Divider with Arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from[#276152]/20 to[#276152]/20 blur-2xl" />
            <div className="relative rounded-full border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to[#276152]/10 p-6">
              <TrendingDown className="h-8 w-8 text[#276152]" />
            </div>
          </div>
        </motion.div>

        {/* Solution Statement */}
        <div className="space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl space-y-5 text-center"
          >
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border[#D4CAB8] bg[#F4F1EB] px-4 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 text[#276152]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text[#276152]">
                The Axoreon-Powered Solution
              </span>
            </div>

            <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-900 lg:text-5xl">
              Automated Intelligence
              <br />
              Eliminates <span className="text[#276152]">Compliance Bottlenecks</span>
            </h2>

            <p className="text-base leading-relaxed text-slate-600 lg:text-lg">
              AuditWeave combines deterministic rule engines with AI legal reasoning to deliver instant, explainable,
              and auditable compliance verdicts backed by the <span className="font-bold text-slate-900">Axoreon Intelligence Architecture</span>.
            </p>
          </motion.div>

          {/* Solution Cards */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {solutions.map((solution, idx) => {
              const Icon = solution.icon;
              return (
                <motion.div
                  key={solution.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 transition-all duration-300 hover:border[#D4CAB8] hover:shadow-xl hover:shadow[#276152]/10"
                >
                  {/* Accent Bar */}
                  <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from[#276152] to[#276152]" />

                  <div className="mb-5 inline-flex items-center justify-center rounded-xl border border[#E8E3D8] bg[#F4F1EB] p-3">
                    <Icon className="h-6 w-6 text[#276152]" />
                  </div>

                  <p className="mb-3 text-lg font-bold text-slate-900">
                    {solution.label}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {solution.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center pt-8"
          >
            <a
              href="/audit/new"
              className="group inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from[#276152] to[#276152] px-8 py-5 text-base font-bold text-white shadow-lg shadow[#276152]/25 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow[#276152]/40"
            >
              Run Your First Audit
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
