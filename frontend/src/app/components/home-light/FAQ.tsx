"use client";

import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "How do the 2 free credits work?",
    answer: "Each new user receives 2 free credits to audit privacy policies. One credit allows you to analyze one complete privacy policy. You can use these credits via URL input, text paste, or document upload (PDF/DOCX)."
  },
  {
    question: "What are the three ways to submit my privacy policy?",
    answer: "You can audit your privacy policy in three ways: (1) Paste the URL of your live privacy policy page, (2) Copy and paste the privacy policy text directly into the platform, or (3) Upload your privacy policy document as a PDF or DOCX file."
  },
  {
    question: "How accurate is the AI legal reasoning?",
    answer: "AuditWeave uses advanced AI analysis with 96% confidence scoring for legal justifications. Every finding includes explainable reasoning mapped to specific DPDP Act 2023 sections with citation references for legal review."
  },
  {
    question: "What compliance pillars does AuditWeave check?",
    answer: "We audit against all 11 DPDP Act 2023 statutory pillars: Notice & Transparency, Consent Mechanisms, Purpose Limitation, Data Retention, Minors Protection, Data Principal Rights, Cross-Border Transfer, Data Security, Breach Notification, Grievance Redressal, and Data Protection Officer requirements."
  },
  {
    question: "How long does an audit take?",
    answer: "Most audits complete in under 15 seconds. Our system performs 43+ automated rule checks, AI legal analysis, and generates executive-ready PDF reports with penalty estimates and remediation roadmaps—all in real-time."
  },
  {
    question: "Can I audit multiple companies at once?",
    answer: "Yes! Our batch audit feature allows you to analyze multiple privacy policies simultaneously. Generate comparative compliance matrices, identify industry benchmarks, and export consolidated GRC scorecards across your portfolio."
  },
  {
    question: "What's included in the audit report?",
    answer: "Each report includes: compliance score (0-100%), detailed findings by pillar, penalty risk estimates (up to ₹250 Cr), AI-explained legal gaps, technical remediation recommendations, executive summary, and full DPDP Act section mappings."
  },
  {
    question: "Do I need technical knowledge to use AuditWeave?",
    answer: "No technical expertise required. Our platform is designed for compliance teams, legal advisors, and business owners. The interface is intuitive, reports are written in clear language, and our AI Copilot can rewrite non-compliant clauses for you."
  },
  {
    question: "Is my privacy policy data secure?",
    answer: "Absolutely. All policy submissions are encrypted in transit and at rest. We don't store your raw policy text after analysis—only anonymized compliance metadata. AuditWeave is built with enterprise-grade security standards."
  },
  {
    question: "What happens after I use my 2 free credits?",
    answer: "After using your free credits, you'll see our flexible pricing plans. Choose from pay-as-you-go credits, monthly subscriptions for regular audits, or enterprise plans with unlimited audits, batch processing, and dedicated support."
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 py-14 lg:py-18">
      {/* Decorative Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-16 xl:px-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 shadow-sm" style={{ backgroundColor: "white", border: "1px solid #D4CAB8" }}>
            <span className="text-xs font-semibold" style={{ color: "#276152" }}>💡 Got Questions?</span>
          </div>

          <h2 className="mb-3 text-3xl font-extrabold leading-tight lg:text-4xl" style={{ color: "#276152" }}>
            Frequently Asked Questions
          </h2>

          <p className="text-sm" style={{ color: "#666" }}>
            Everything you need to know about AuditWeave's compliance auditing platform
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="mx-auto max-w-4xl space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left"
              >
                <div
                  className={`rounded-lg p-4 transition-all duration-300 ${
                    openIndex === index
                      ? "shadow-md"
                      : "hover:shadow-sm"
                  }`}
                  style={{
                    backgroundColor: "white",
                    border: openIndex === index ? "1px solid #276152" : "1px solid #D4CAB8"
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="flex-1 text-base font-bold pr-3" style={{ color: "#276152" }}>
                      {faq.question}
                    </h3>
                    <div
                      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all`}
                      style={{
                        backgroundColor: openIndex === index ? "#276152" : "#f0f0f0",
                        color: openIndex === index ? "white" : "#666",
                        transform: openIndex === index ? "rotate(180deg)" : "rotate(0deg)"
                      }}
                    >
                      {openIndex === index ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  <motion.div
                    initial={false}
                    animate={{
                      height: openIndex === index ? "auto" : 0,
                      opacity: openIndex === index ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-3 pt-3 leading-relaxed text-xs" style={{ borderTop: "1px solid #D4CAB8", color: "#666" }}>
                      {faq.answer}
                    </p>
                  </motion.div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-slate-600 mb-3 text-xs">Still have questions?</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all"
            style={{ background: "linear-gradient(to right, #276152, #2a8a7e)" }}
          >
            Contact Our Team
          </a>
        </motion.div>
      </div>
    </section>
  );
}
