"use client";

import { motion } from "framer-motion";
import { Zap, CheckCircle2 } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Under 15 Seconds",
    description: "Complete DPDP Act audit with 43+ rule checks and AI legal analysis in real-time"
  },
  {
    icon: CheckCircle2,
    title: "100% Coverage",
    description: "All 11 statutory pillars audited with comprehensive cross-reference mapping"
  },
  {
    icon: CheckCircle2,
    title: "96% Accuracy",
    description: "Advanced AI analysis with explainable legal reasoning and DPDP Act citations"
  }
];

export function TheSolution() {
  return (
    <section className="relative overflow-hidden py-16 lg:py-20" style={{ backgroundColor: "#F4F1EB" }}>
      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-16 xl:px-24">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 max-w-4xl text-center"
        >
          <h2 className="mb-4 text-3xl font-extrabold leading-tight lg:text-4xl" style={{ color: "#276152" }}>
            Compliance Automation in <span style={{ color: "#276152" }}>Under 15 Seconds</span>
          </h2>

          <p className="text-base leading-relaxed lg:text-lg" style={{ color: "#666" }}>
            Enterprise-grade compliance auditing powered by AI legal reasoning and statutory rule engines. From policy ingestion to executive reports.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mb-12">
          {benefits.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative"
              >
                <div className="relative overflow-hidden rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl" style={{ backgroundColor: "white", border: "1px solid #D4CAB8" }}>
                  {/* Icon Container */}
                  <div className="mb-4 inline-flex items-center justify-center rounded-xl p-3" style={{ backgroundColor: "rgba(39, 97, 82, 0.1)" }}>
                    <Icon className="h-6 w-6" style={{ color: "#276152" }} strokeWidth={2.5} />
                  </div>

                  {/* Title */}
                  <h3 className="mb-2 text-lg font-extrabold" style={{ color: "#276152" }}>
                    {benefit.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs leading-relaxed text-slate-600">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <a
            href="/audit/new"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-base font-bold text-white shadow-lg hover:shadow-xl transition-all"
            style={{ background: "linear-gradient(to right, #276152, #2a8a7e)" }}
          >
            Start Your Free Audit
            <Zap className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
