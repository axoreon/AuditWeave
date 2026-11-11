"use client";

import { motion } from "framer-motion";
import { Clock, DollarSign, AlertTriangle } from "lucide-react";

const problems = [
  {
    icon: Clock,
    stat: "4-6 Weeks",
    label: "Manual Review Time",
    description: "Legal teams spend months manually cross-referencing privacy policies against 40+ DPDP Act sections.",
  },
  {
    icon: DollarSign,
    stat: "₹250 Cr",
    label: "Maximum Penalty",
    description: "Non-compliance under Section 8(5) & 8(6) can result in penalties up to ₹250 Crore per violation.",
  },
  {
    icon: AlertTriangle,
    stat: "73%",
    label: "Critical Gaps Missed",
    description: "Manual audits routinely overlook structural vulnerabilities like missing consent mechanisms.",
  }
];

export function TheProblem() {
  return (
    <section className="relative overflow-hidden py-16 lg:py-20" style={{ backgroundColor: "#F4F1EB" }}>
      {/* Subtle Red Fade at Edges */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at top, rgba(239, 68, 68, 0.08) 0%, transparent 70%), radial-gradient(ellipse at bottom, rgba(239, 68, 68, 0.08) 0%, transparent 70%)"
      }} />

      {/* Decorative Danger Illustrations */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-red-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />

        {/* Cartoon Warning Icons */}
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-32 right-32 opacity-20"
        >
          <AlertTriangle className="w-24 h-24 text-red-500" strokeWidth={1.5} />
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute bottom-40 left-20 opacity-20"
        >
          <Clock className="w-20 h-20 text-orange-500" strokeWidth={1.5} />
        </motion.div>
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
          <h2 className="mb-4 text-3xl font-extrabold leading-tight lg:text-4xl" style={{ color: "#276152" }}>
            The Hidden Cost of <span style={{ color: "#276152" }}>Manual Compliance</span>
          </h2>

          <p className="text-base leading-relaxed lg:text-lg" style={{ color: "#666" }}>
            The DPDP Act 2023 introduced 11 statutory pillars with complex cross-references—traditional manual reviews can't keep up with the pace of regulation.
          </p>
        </motion.div>

        {/* Problem Cards */}
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {problems.map((problem, idx) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={problem.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                whileHover={{ y: -5 }}
                className="group relative"
              >
                <div className="relative overflow-hidden rounded-2xl border-2 border-red-200 p-8 shadow-xl transition-all hover:shadow-2xl hover:border-red-300" style={{ backgroundColor: "white" }}>
                  {/* Icon */}
                  <div className="mb-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-red-100 to-orange-100 p-4">
                    <Icon className="h-8 w-8 text-red-600" strokeWidth={2} />
                  </div>

                  {/* Stat */}
                  <p className="mb-2 text-5xl font-extrabold" style={{ color: "#276152" }}>{problem.stat}</p>

                  {/* Label */}
                  <p className="mb-4 text-sm font-bold uppercase tracking-wide text-red-600">
                    {problem.label}
                  </p>

                  {/* Description */}
                  <p className="leading-relaxed text-slate-600">
                    {problem.description}
                  </p>

                  {/* Decorative Glow */}
                  <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-red-200/40 blur-2xl" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
