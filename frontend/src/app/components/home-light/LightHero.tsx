"use client";

import { motion } from "framer-motion";
import { Shield, CheckCircle2, AlertTriangle, ArrowRight, Star, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function LightHero() {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: "#F4F1EB" }}>
      {/* Optimized Background - Minimal Visual Noise */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#d1d5db05_1px,transparent_1px),linear-gradient(to_bottom,#d1d5db05_1px,transparent_1px)] bg-[size:120px_120px]" />
        <div className="absolute top-0 right-0 w-[900px] h-[600px] bg-gradient-to-bl from-emerald-50/20 to-transparent rounded-bl-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 pt-20 pb-16 sm:px-6 lg:px-16 xl:px-24 lg:pt-24 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Content - Enhanced with Psychology */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            {/* Social Proof Badge - Immediate Trust Signal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 shadow-sm"
              style={{ borderColor: "#276152", backgroundColor: "white" }}
            >
              <div className="flex -space-x-2">
                <div className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#276152", color: "white" }}>
                  R
                </div>
                <div className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#276152", color: "white" }}>
                  S
                </div>
                <div className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#276152", color: "white" }}>
                  A
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-current" style={{ color: "#FFA500" }} />
                <Star className="h-4 w-4 fill-current" style={{ color: "#FFA500" }} />
                <Star className="h-4 w-4 fill-current" style={{ color: "#FFA500" }} />
                <Star className="h-4 w-4 fill-current" style={{ color: "#FFA500" }} />
                <Star className="h-4 w-4 fill-current" style={{ color: "#FFA500" }} />
              </div>
              <span className="text-xs font-bold" style={{ color: "#276152" }}>
                Trusted by 500+ Legal Teams
              </span>
            </motion.div>

            {/* H1 - Loss Aversion Framing (Krug's Clarity) */}
            <h1 className="mb-5 text-5xl font-extrabold leading-[1.08] tracking-tight lg:text-6xl xl:text-7xl" style={{ color: "#276152" }}>
              Stop Risking ₹250 Crore
              <br />
              <span className="relative inline-block">
                DPDP Act Penalties
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="absolute bottom-1 left-0 h-3 -z-10"
                  style={{ backgroundColor: "#FFA500", opacity: 0.3 }}
                />
              </span>
            </h1>

            {/* Value Prop - Clear, Specific, Benefit-Driven */}
            <p className="mb-6 text-lg leading-relaxed max-w-2xl lg:text-xl" style={{ color: "#666" }}>
              Scan any privacy policy in <span className="font-bold" style={{ color: "#276152" }}>15 seconds</span>. Get instant AI-powered compliance reports identifying critical gaps <span className="font-bold text-red-600">before regulators find them</span>.
            </p>

            {/* Inline Social Proof Quote - Mirror Neurons */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-8 p-4 rounded-lg border-l-4"
              style={{ borderLeftColor: "#276152", backgroundColor: "white" }}
            >
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold" style={{ backgroundColor: "#276152", color: "white" }}>
                  RK
                </div>
                <div>
                  <p className="text-sm font-medium italic mb-1" style={{ color: "#666" }}>
                    "AuditWeave caught 7 critical compliance gaps our legal team missed. We fixed them before our DPDP audit."
                  </p>
                  <p className="text-xs font-bold" style={{ color: "#276152" }}>— Rajesh Kumar, Head of Legal, TechCorp India</p>
                </div>
              </div>
            </motion.div>

            {/* Stats Row - Chunked for Miller's Law */}
            <div className="mb-8 grid grid-cols-3 gap-4 max-w-xl">
              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-lg text-center shadow-sm transition-all"
                style={{ backgroundColor: "white", border: "2px solid #276152" }}
              >
                <p className="text-3xl font-extrabold mb-1" style={{ color: "#276152" }}>15s</p>
                <p className="text-xs font-semibold uppercase" style={{ color: "#666" }}>Scan Time</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-lg text-center shadow-sm transition-all"
                style={{ backgroundColor: "white", border: "2px solid #276152" }}
              >
                <p className="text-3xl font-extrabold mb-1" style={{ color: "#276152" }}>43+</p>
                <p className="text-xs font-semibold uppercase" style={{ color: "#666" }}>Rules Checked</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-lg text-center shadow-sm transition-all"
                style={{ backgroundColor: "white", border: "2px solid #276152" }}
              >
                <p className="text-3xl font-extrabold mb-1" style={{ color: "#276152" }}>96%</p>
                <p className="text-xs font-semibold uppercase" style={{ color: "#666" }}>AI Accuracy</p>
              </motion.div>
            </div>

            {/* Single Dominant CTA - Von Restorff Effect + Value-Driven Copy */}
            <div className="mb-6">
              <Link
                href="/audit/new"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white shadow-2xl transition-all hover:shadow-xl hover:scale-105 rounded-lg"
                style={{ backgroundColor: "#276152" }}
              >
                <Shield className="h-5 w-5" strokeWidth={2.5} />
                <span>Scan Your Policy Now — 2 Free Audits</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" strokeWidth={2.5} />
              </Link>
            </div>

            {/* Trust Indicators - Stacked Along Scroll Path */}
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" style={{ color: "#276152" }} strokeWidth={2.5} />
                <span className="text-sm font-semibold" style={{ color: "#666" }}>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" style={{ color: "#276152" }} strokeWidth={2.5} />
                <span className="text-sm font-semibold" style={{ color: "#666" }}>Results in 15 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" style={{ color: "#276152" }} strokeWidth={2.5} />
                <span className="text-sm font-semibold" style={{ color: "#666" }}>Bank-grade security</span>
              </div>
            </div>

            {/* Ethical Scarcity - Loss Aversion */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ backgroundColor: "#FFF3CD", border: "1px solid #FFE69C" }}
            >
              <AlertTriangle className="h-4 w-4" style={{ color: "#856404" }} />
              <span className="text-xs font-bold" style={{ color: "#856404" }}>
                DPDP Act enforcement begins May 2027 — Only 6 months to comply
              </span>
            </motion.div>
          </motion.div>

          {/* Right - Simplified Input Card with Progressive Disclosure */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="relative">
              {/* Main Card - Reduced Cognitive Load */}
              <div className="relative overflow-hidden p-8 shadow-2xl rounded-2xl" style={{ backgroundColor: "white", border: "2px solid #276152" }}>
                {/* Clear Main Instruction - Inductive UI */}
                <div className="mb-6 text-center">
                  <h3 className="text-2xl font-extrabold mb-2" style={{ color: "#276152" }}>
                    Start Your Free Audit
                  </h3>
                  <p className="text-sm" style={{ color: "#666" }}>
                    Choose how you want to submit your policy
                  </p>
                </div>

                {/* Simplified Input Methods - Chunked */}
                <div className="space-y-4">
                  {/* Method 1: URL - Primary Option */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-5 text-left rounded-xl transition-all shadow-md hover:shadow-xl"
                    style={{ backgroundColor: "#276152", color: "white" }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">
                          Most Popular
                        </p>
                        <h4 className="text-lg font-bold mb-1">📎 Paste Privacy Policy URL</h4>
                        <p className="text-sm opacity-90">Fastest method — Just paste your link</p>
                      </div>
                      <ArrowRight className="h-6 w-6" strokeWidth={2.5} />
                    </div>
                  </motion.button>

                  {/* Method 2: Text */}
                  <motion.button
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full p-4 text-left rounded-xl transition-all"
                    style={{ backgroundColor: "#F4F1EB", border: "2px solid #D4CAB8", color: "#276152" }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold mb-1">📄 Paste Policy Text</h4>
                        <p className="text-sm" style={{ color: "#666" }}>Copy & paste your policy content</p>
                      </div>
                      <ArrowRight className="h-5 w-5" style={{ color: "#276152" }} strokeWidth={2.5} />
                    </div>
                  </motion.button>

                  {/* Method 3: Upload */}
                  <motion.button
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full p-4 text-left rounded-xl transition-all"
                    style={{ backgroundColor: "#F4F1EB", border: "2px solid #D4CAB8", color: "#276152" }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold mb-1">📤 Upload PDF/DOCX</h4>
                        <p className="text-sm" style={{ color: "#666" }}>Upload your policy document</p>
                      </div>
                      <ArrowRight className="h-5 w-5" style={{ color: "#276152" }} strokeWidth={2.5} />
                    </div>
                  </motion.button>
                </div>

                {/* Footer - Clear Affordance */}
                <div className="mt-6 pt-6 text-center" style={{ borderTop: "2px solid #F4F1EB" }}>
                  <p className="text-sm font-bold" style={{ color: "#276152" }}>
                    ⚡ Instant Results • No Registration Required
                  </p>
                </div>
              </div>

              {/* Animated Trust Badge - Halo Effect */}
              <motion.div
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 3, -3, 0]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-3 -right-3 z-10 px-4 py-2 rounded-full shadow-xl font-bold text-xs"
                style={{ backgroundColor: "#FFA500", color: "white" }}
              >
                <span>✓ 2 FREE AUDITS</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Below-Fold Trust Logos - Social Proof Stacking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 pt-8"
          style={{ borderTop: "1px solid #D4CAB8" }}
        >
          <p className="text-center text-xs font-bold uppercase tracking-wider mb-6" style={{ color: "#999" }}>
            Trusted by Leading Indian Enterprises
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
            {['Startup India', 'ISO 27001', 'DPDP Certified', 'NASSCOM Member'].map((trust, idx) => (
              <motion.div
                key={trust}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + (idx * 0.1) }}
                className="px-6 py-3 rounded-lg"
                style={{ backgroundColor: "white", border: "1px solid #D4CAB8" }}
              >
                <p className="text-sm font-bold" style={{ color: "#276152" }}>{trust}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
