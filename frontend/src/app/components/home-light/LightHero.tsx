"use client";

import { motion } from "framer-motion";
import { Shield, CheckCircle2, Link as LinkIcon, FileText, Upload, ArrowRight } from "lucide-react";
import Link from "next/link";

export function LightHero() {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: "#F4F1EB" }}>
      {/* Professional Background Elements */}
      <div className="absolute inset-0">
        {/* Grid Pattern - Very subtle */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#d1d5db08_1px,transparent_1px),linear-gradient(to_bottom,#d1d5db08_1px,transparent_1px)] bg-[size:100px_100px]" />

        {/* Gradient Accents - Professional */}
        <div className="absolute top-0 right-0 w-[800px] h-[500px] bg-gradient-to-bl from-emerald-100/15 via-teal-100/10 to-transparent rounded-bl-full" />
        <div className="absolute bottom-20 left-0 w-[700px] h-[400px] bg-gradient-to-tr from-green-100/12 via-emerald-100/8 to-transparent rounded-tr-full" />

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 pt-28 pb-20 sm:px-6 lg:px-16 xl:px-24 lg:pt-32 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Content - 7 columns */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7"
          >
            {/* Main Headline */}
            <h1 className="mb-4 text-4xl font-extrabold leading-[1.1] tracking-tight lg:text-5xl xl:text-6xl" style={{ color: "#276152" }}>
              Identify Compliance Gaps
              <br />
              <span style={{ color: "#276152" }}>Before Regulators Do</span>
            </h1>

            {/* Subheadline */}
            <p className="mb-8 text-base leading-relaxed max-w-2xl lg:text-lg" style={{ color: "#276152" }}>
              Scan your website in 15 seconds. Get instant compliance reports with AI-powered legal analysis. Avoid <span className="font-bold text-red-600">₹250 Crore penalties</span>.
            </p>

            {/* Stats Row */}
            <div className="mb-8 flex flex-wrap items-center gap-6 lg:gap-8">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center border-2 text-sm font-extrabold" style={{ borderColor: "#276152", color: "#276152" }}>
                  15s
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase" style={{ color: "#999" }}>Audit</p>
                  <p className="text-sm font-bold" style={{ color: "#276152" }}>15 Seconds</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center border-2 text-sm font-extrabold" style={{ borderColor: "#999", color: "#666" }}>
                  43+
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase" style={{ color: "#999" }}>Rules</p>
                  <p className="text-sm font-bold" style={{ color: "#276152" }}>Automated</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center border-2 text-sm font-extrabold" style={{ borderColor: "#276152", color: "#276152" }}>
                  96%
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase" style={{ color: "#999" }}>AI</p>
                  <p className="text-sm font-bold" style={{ color: "#276152" }}>Accurate</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/audit/new"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90"
                style={{ backgroundColor: "#276152" }}
              >
                <span>Start Audit — 2 Free Credits</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </Link>

              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold transition-all hover:opacity-80"
                style={{ backgroundColor: "white", borderColor: "#D4CAB8", border: "1px solid", color: "#276152" }}
              >
                See How It Works
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" style={{ color: "#276152" }} strokeWidth={2.5} />
                <span className="text-xs font-semibold" style={{ color: "#666" }}>2 Free Credits</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" style={{ color: "#276152" }} strokeWidth={2.5} />
                <span className="text-xs font-semibold" style={{ color: "#666" }}>No Setup Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" style={{ color: "#276152" }} strokeWidth={2.5} />
                <span className="text-xs font-semibold" style={{ color: "#666" }}>Instant</span>
              </div>
            </div>
          </motion.div>

          {/* Right - Input Methods Card - 5 columns */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5"
          >
            <div className="relative">
              {/* Main Card */}
              <div className="relative overflow-hidden p-6 shadow-2xl" style={{ backgroundColor: "white", border: "1px solid #D4CAB8" }}>
                {/* Header */}
                <div className="mb-6">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "#999" }}>How It Works</p>
                  <h3 className="text-lg font-extrabold" style={{ color: "#276152" }}>Three Input Methods</h3>
                </div>

                <div className="space-y-3">
                  {/* Method 1: URL */}
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                    className="group p-4 cursor-pointer transition-all hover:bg-emerald-100/50"
                    style={{ borderLeftColor: "#276152", backgroundColor: "rgba(244, 241, 235, 0.4)", borderLeft: "4px solid #276152" }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mb-0.5 flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center text-xs font-bold" style={{ color: "#276152" }}>①</span>
                        <h4 className="text-sm font-bold" style={{ color: "#276152" }}>Paste URL</h4>
                      </div>
                      <p className="text-xs text-slate-600">
                        Enter privacy policy link
                      </p>
                    </div>
                  </motion.div>

                  {/* Method 2: Text */}
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                    className="group border-l-4 border-blue-600 bg-blue-50/40 p-4 cursor-pointer transition-all hover:bg-blue-100/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mb-0.5 flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center text-xs font-bold text-blue-700">②</span>
                        <h4 className="text-sm font-bold" style={{ color: "#276152" }}>Paste Text</h4>
                      </div>
                      <p className="text-xs text-slate-600">
                        Copy & paste policy text
                      </p>
                    </div>
                  </motion.div>

                  {/* Method 3: Upload */}
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                    className="group border-l-4 border-purple-600 bg-purple-50/40 p-4 cursor-pointer transition-all hover:bg-purple-100/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mb-0.5 flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center text-xs font-bold text-purple-700">③</span>
                        <h4 className="text-sm font-bold" style={{ color: "#276152" }}>Upload File</h4>
                      </div>
                      <p className="text-xs text-slate-600">
                        PDF or DOCX files
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid #D4CAB8" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#666" }}>
                    ⚡ Results under 15 seconds
                  </p>
                </div>
              </div>

              {/* Corner Badge */}
              <motion.div
                animate={{
                  y: [0, -6, 0],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-2 -right-2 z-10"
              >
                <div className="flex h-14 w-14 items-center justify-center shadow-xl" style={{ backgroundColor: "#276152" }}>
                  <CheckCircle2 className="h-7 w-7 text-white" strokeWidth={3} />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
