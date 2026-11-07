"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-14 lg:py-18" style={{ background: "linear-gradient(to bottom right, #276152, #2a8a7e, #1a6b5e)" }}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full blur-3xl" style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 text-center sm:px-6 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Headline */}
          <h2 className="text-3xl font-extrabold leading-tight text-white lg:text-4xl">
            Start Your Compliance Audit Today
          </h2>

          {/* Description */}
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-white/90">
            Join enterprise teams using AuditWeave to audit privacy policies, identify structural gaps, and generate executive reports in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/audit/new"
              className="group inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3 text-base font-extrabold shadow-xl transition-all hover:shadow-2xl hover:scale-105"
              style={{ backgroundColor: "white", color: "#276152" }}
            >
              Start Audit — 2 Free Credits
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3 text-base font-bold text-white backdrop-blur-sm transition-all hover:border-white/60"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.4)" }}
            >
              Schedule Demo
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/90">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
              <span className="font-semibold">2 Free Credits</span>
            </div>
            <div className="h-3 w-px" style={{ backgroundColor: "rgba(255, 255, 255, 0.3)" }} />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
              <span className="font-semibold">No Setup Required</span>
            </div>
            <div className="h-3 w-px" style={{ backgroundColor: "rgba(255, 255, 255, 0.3)" }} />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
              <span className="font-semibold">Instant Reports</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
