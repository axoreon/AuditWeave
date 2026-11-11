"use client";

import { Shield, Lock, Eye, KeyRound, Key, RefreshCw, Terminal } from "lucide-react";
import Link from "next/link";
import { PublicNavbar } from "@/app/components/PublicNavbar";
import { LightFooter } from "@/app/components/home-light/LightFooter";
import { motion } from "framer-motion";

export default function SecurityDocsPage() {
  const securitySections = [
    {
      title: "Data Encryption & Transport Security",
      icon: Lock,
      desc: "All client data is encrypted in transit using TLS 1.3 and at rest inside databases using AES-256 block ciphers. Backup volumes are secured with separate key hierarchies."
    },
    {
      title: "Sandboxed Text Processing",
      icon: Shield,
      desc: "Policy text extractions are processed inside transient memory sandboxes. Scraping routines utilize isolated network sockets and remove headers, scripts, and trackers."
    },
    {
      title: "GRC Audit Logging",
      icon: Terminal,
      desc: "Every administrative operation, user authentication session, and audit calculation is registered in GRC-compliant audit logs, capturing timestamp offsets and execution logs."
    },
    {
      title: "Role-Based Access Control",
      icon: KeyRound,
      desc: "Platform endpoints enforce JWT-based authorization tokens. Read/write operations are isolated dynamically based on roles (User vs. Compliance Officer/Admin)."
    }
  ];

  return (
    <div style={{ backgroundColor: "#F4F1EB", minHeight: "100vh" }}>
      <PublicNavbar />

      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#276152" }}>
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: "#276152" }}>
                Security Policy
              </h1>
            </div>
          </div>
          <p className="text-lg" style={{ color: "#666" }}>
            Enterprise security protocols, encryption benchmarks, and access control policies of AuditWeave
          </p>
        </motion.div>

        {/* Security Architecture Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12 p-6 rounded-lg border-2"
          style={{ borderColor: "#D4CAB8", backgroundColor: "white" }}
        >
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
            Security Architecture & Standards
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: "#666" }}>
            AuditWeave is designed to protect sensitive organizational compliance records. Our platform adheres to cyber-security frameworks mapping to standard GRC expectations (ISO 27001 / SOC 2 Type II baseline controls).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securitySections.map((sec, i) => {
              const Icon = sec.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-6 rounded-xl border-2 hover:shadow-lg transition-all"
                  style={{ borderColor: "#D4CAB8", backgroundColor: "#FAFBF9" }}
                >
                  <div className="h-12 w-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "#276152" }}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-3" style={{ color: "#276152" }}>
                    {sec.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
                    {sec.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Additional Security Measures */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#276152" }}>
            Additional Security Measures
          </h2>

          <div className="space-y-4">
            <div className="p-5 rounded-lg border-l-4" style={{ borderLeftColor: "#276152", backgroundColor: "white" }}>
              <h3 className="font-bold mb-2" style={{ color: "#276152" }}>
                🔒 Infrastructure Security
              </h3>
              <p className="text-sm" style={{ color: "#666" }}>
                Hosted on enterprise-grade cloud infrastructure with automatic security patches, DDoS protection, and 24/7 monitoring.
              </p>
            </div>

            <div className="p-5 rounded-lg border-l-4" style={{ borderLeftColor: "#276152", backgroundColor: "white" }}>
              <h3 className="font-bold mb-2" style={{ color: "#276152" }}>
                🛡️ Application Security
              </h3>
              <p className="text-sm" style={{ color: "#666" }}>
                Regular penetration testing, vulnerability scanning, and security audits by third-party experts ensure platform integrity.
              </p>
            </div>

            <div className="p-5 rounded-lg border-l-4" style={{ borderLeftColor: "#276152", backgroundColor: "white" }}>
              <h3 className="font-bold mb-2" style={{ color: "#276152" }}>
                👥 Access Control
              </h3>
              <p className="text-sm" style={{ color: "#666" }}>
                Multi-factor authentication (MFA), session management, and principle of least privilege access for all team members.
              </p>
            </div>

            <div className="p-5 rounded-lg border-l-4" style={{ borderLeftColor: "#276152", backgroundColor: "white" }}>
              <h3 className="font-bold mb-2" style={{ color: "#276152" }}>
                📊 Compliance & Auditing
              </h3>
              <p className="text-sm" style={{ color: "#666" }}>
                Comprehensive audit logs, compliance with DPDP Act 2023, and adherence to international security standards.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Vulnerability Disclosure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="p-6 rounded-lg border-2"
          style={{ borderColor: "#276152", backgroundColor: "#F0FDF4" }}
        >
          <div className="flex items-start gap-4">
            <Shield className="h-6 w-6 flex-shrink-0" style={{ color: "#276152" }} />
            <div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#276152" }}>
                Vulnerability Disclosure Program
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
                If you discover a security vulnerability in our platform or auditing routines, please file an immediate report via the support form on our{" "}
                <Link href="/contact" className="font-bold hover:underline" style={{ color: "#276152" }}>
                  Contact page
                </Link>{" "}
                under the 'Security Vulnerability Report' category. We prioritize response coordination and will acknowledge all reports within 48 hours.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Security Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 pt-8"
          style={{ borderTop: "2px solid #D4CAB8" }}
        >
          <h3 className="text-center text-sm font-bold uppercase tracking-wider mb-6" style={{ color: "#999" }}>
            Security Certifications & Compliance
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-6">
            {['ISO 27001', 'SOC 2 Type II', 'DPDP Act 2023', 'GDPR Compliant'].map((cert) => (
              <div
                key={cert}
                className="px-6 py-3 rounded-lg"
                style={{ backgroundColor: "white", border: "2px solid #D4CAB8" }}
              >
                <p className="text-sm font-bold" style={{ color: "#276152" }}>{cert}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      <LightFooter />
    </div>
  );
}
