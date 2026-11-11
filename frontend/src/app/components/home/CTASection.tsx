"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0A0F1C] via-slate-900 to-[#0A0F1C] py-24 lg:py-32">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(39, 97, 82, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(39, 97, 82, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute left-1/3 top-0 h-[600px] w-[600px] rounded-full bg-brand-green/20 blur-[140px]" />
      <div className="absolute right-1/3 bottom-0 h-[600px] w-[600px] rounded-full bg-purple-500/15 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Badge */}
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-5 py-2.5 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-brand-green" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green">
              Start Auditing in Under 60 Seconds
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl font-black leading-tight text-white lg:text-6xl">
            Ready to Eliminate
            <br />
            <span className="text-brand-green">Compliance Bottlenecks?</span>
          </h2>

          {/* Description */}
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-300">
            Join enterprise compliance teams using AuditWeave to audit privacy policies, identify structural gaps,
            and generate executive-ready reports in seconds—not weeks.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Link
              href="/audit/new"
              className="group relative overflow-hidden rounded-xl bg-brand-green px-10 py-5 text-base font-bold text-white shadow-[0_0_40px_rgba(39,97,82,0.4)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_60px_rgba(39,97,82,0.6)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Initialize First Audit
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 -z-0 bg-gradient-to-r from[#276152] to[#276152] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </Link>

            <Link
              href="/contact"
              className="rounded-xl border border-slate-600 bg-slate-800/50 px-10 py-5 text-base font-bold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-500 hover:bg-slate-800"
            >
              Schedule Demo
            </Link>
          </div>

          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-3 pt-8 text-sm text-slate-400"
          >
            <svg className="h-5 w-5 text[#276152]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>No credit card required • 7-day free trial • Cancel anytime</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
