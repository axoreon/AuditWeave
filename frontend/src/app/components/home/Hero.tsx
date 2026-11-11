"use client";

import { motion } from "framer-motion";
import { ArrowRight, Terminal, Shield, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const auditSimulation = [
  { time: 0, text: "$ auditweave scan --policy https://company.com/privacy", type: "command" },
  { time: 800, text: "Initializing DPDP Act 2023 compliance engine...", type: "system" },
  { time: 1400, text: "✓ Policy extracted: 12,847 tokens", type: "success" },
  { time: 1900, text: "✓ Running 43 statutory rule checks", type: "success" },
  { time: 2400, text: "✓ AI legal reasoning: 96% confidence", type: "success" },
  { time: 3000, text: "⚠ Critical: Missing age-gating mechanism (Section 9)", type: "warning" },
  { time: 3500, text: "✓ Compliance score: 79/100", type: "success" },
  { time: 4000, text: "✓ Report generated: audit_2026_11_05.pdf", type: "success" },
];

export function Hero() {
  const [terminalLines, setTerminalLines] = useState<typeof auditSimulation>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= auditSimulation.length) {
      const resetTimer = setTimeout(() => {
        setTerminalLines([]);
        setCurrentIndex(0);
      }, 3000);
      return () => clearTimeout(resetTimer);
    }

    const timer = setTimeout(() => {
      setTerminalLines((prev) => [...prev, auditSimulation[currentIndex]]);
      setCurrentIndex((i) => i + 1);
    }, auditSimulation[currentIndex].time);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-[#0A0F1C]">
      {/* Ambient Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(39, 97, 82, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(39, 97, 82, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }} />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-brand-green/40"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%"
            }}
            animate={{
              y: [null, Math.random() * -200 + "px"],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Radial Gradient Spotlights */}
      <div className="absolute left-[10%] top-[20%] h-[600px] w-[600px] rounded-full bg-brand-green/8 blur-[120px]" />
      <div className="absolute right-[15%] bottom-[10%] h-[500px] w-[500px] rounded-full bg-purple-500/6 blur-[100px]" />

      <div className="relative z-10 mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:gap-20 lg:px-12 lg:py-24">
        {/* Left Column: Content */}
        <div className="space-y-8">
          {/* Kicker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 rounded-full border border-brand-green/20 bg-brand-green/5 px-4 py-2 backdrop-blur-sm"
          >
            <Shield className="h-3.5 w-3.5 text-brand-green" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-green/90">
              Statutory GRC Intelligence Platform
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl font-black leading-[1.05] tracking-tight text-white lg:text-6xl xl:text-7xl"
          >
            Automated Privacy
            <br />
            <span className="text-brand-green">Compliance Auditing</span>
            <br />
            for DPDP Act 2023
          </motion.h1>

          {/* Sub-headline: The Necessity */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-xl text-[15px] leading-relaxed text-slate-300 lg:text-base"
          >
            Manual privacy policy reviews miss critical vulnerabilities, expose enterprises to{" "}
            <span className="font-bold text-white">₹250 Crore penalties</span>, and create compliance bottlenecks.
            AuditWeave runs 43 statutory rule checks in seconds, delivers explainable AI legal reasoning, and generates
            executive-ready audit reports.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <Link
              href="/audit/new"
              className="group relative overflow-hidden rounded-lg bg-brand-green px-8 py-4 text-[15px] font-bold text-white shadow-[0_0_30px_rgba(39,97,82,0.3)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(39,97,82,0.5)]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Start Compliance Audit
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 -z-0 bg-gradient-to-r from[#276152] to[#276152] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </Link>

            <Link
              href="/docs"
              className="group rounded-lg border border-slate-700 bg-slate-800/50 px-8 py-4 text-[15px] font-bold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-600 hover:bg-slate-800/80"
            >
              <span className="flex items-center justify-center gap-2">
                View Documentation
                <Terminal className="h-4 w-4" />
              </span>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center gap-8 border-t border-slate-700/50 pt-8"
          >
            <div>
              <p className="text-3xl font-black text-white">43+</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Rule Checks
              </p>
            </div>
            <div className="h-8 w-px bg-slate-700/50" />
            <div>
              <p className="text-3xl font-black text[#276152]">100%</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                DPDP Coverage
              </p>
            </div>
            <div className="h-8 w-px bg-slate-700/50" />
            <div>
              <p className="text-3xl font-black text-white">&lt;15s</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Avg. Audit Time
              </p>
            </div>
          </motion.div>

          {/* Powered by Axoreon */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center gap-3 pt-4"
          >
            <Lock className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-500">
              Powered by <span className="font-bold text-slate-400">Axoreon</span> Intelligence Architecture
            </span>
          </motion.div>
        </div>

        {/* Right Column: Interactive Terminal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          {/* Glow Effect */}
          <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from[#276152]/20 to-purple-500/10 blur-2xl" />

          {/* Terminal Window */}
          <div className="relative overflow-hidden rounded-xl border border-slate-700/80 bg-[#0D1117] shadow-2xl">
            {/* Window Chrome */}
            <div className="flex items-center justify-between border-b border-slate-700/60 bg-slate-800/40 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg[#F4F1EB]0/80" />
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                terminal@auditweave
              </span>
              <div className="w-12" />
            </div>

            {/* Terminal Content */}
            <div className="min-h-[420px] space-y-2 p-5 font-mono text-[13px]">
              {terminalLines.map((line, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`
                    ${line.type === "command" ? "text-blue-400" : ""}
                    ${line.type === "system" ? "text-slate-400" : ""}
                    ${line.type === "success" ? "text[#276152]" : ""}
                    ${line.type === "warning" ? "text-amber-400" : ""}
                  `}
                >
                  {line.text}
                  {idx === terminalLines.length - 1 && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="ml-1 inline-block h-4 w-2 bg-emerald-400"
                    />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Scan Line Animation */}
            <motion.div
              className="absolute left-0 right-0 top-12 h-px bg-gradient-to-r from-transparent via-brand-green/50 to-transparent"
              animate={{
                y: [0, 400],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          {/* Technical Detail Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-6 rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 backdrop-blur-sm"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-brand-green/10 p-2">
                <Shield className="h-4 w-4 text-brand-green" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">Hybrid Intelligence Engine</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
                  Deterministic rule checks + advanced AI reasoning for explainable, auditable compliance verdicts.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
