"use client";

import { PublicNavbar } from "@/app/components/PublicNavbar";
import { LightFooter } from "@/app/components/home-light/LightFooter";
import { motion } from "framer-motion";

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#276152" }}>
            Privacy Policy
          </h1>
          <p className="text-lg" style={{ color: "#666" }}>
            AuditWeave Privacy & Compliance Policy Suite
          </p>
          <p className="text-sm mt-2" style={{ color: "#999" }}>
            Comprehensive DPDP Act 2023 & DPDP Rules 2025 Website Governance Suite
          </p>
        </motion.div>

        {/* Document Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12 p-6 rounded-lg border-2"
          style={{ borderColor: "#D4CAB8", backgroundColor: "white" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-semibold mb-2" style={{ color: "#276152" }}>
                Product & Platform
              </p>
              <p style={{ color: "#666" }}>
                AuditWeave (SaaS Product by Axoreon) | Web Console: console.axoreon.com/auditweave
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2" style={{ color: "#276152" }}>
                Operating Entity
              </p>
              <p style={{ color: "#666" }}>
                Axoreon (Private Limited / Recognized Startup)
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2" style={{ color: "#276152" }}>
                Applicable Framework
              </p>
              <p style={{ color: "#666" }}>
                Digital Personal Data Protection Act, 2023 & DPDP Rules, 2025
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2" style={{ color: "#276152" }}>
                Document Version
              </p>
              <p style={{ color: "#666" }}>
                Version 1.0 (Master Website Production Suite)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 p-6 rounded-lg border-2"
          style={{ borderColor: "#E5E0D5", backgroundColor: "#FAFBF9" }}
        >
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
            Data Protection Officer & Grievance Contact
          </h2>
          <div className="space-y-2" style={{ color: "#666" }}>
            <p>
              <span className="font-semibold">Email:</span> dpo@axoreon.com
            </p>
            <p>
              <span className="font-semibold">Legal:</span> legal@axoreon.com
            </p>
            <p>
              <span className="font-semibold">Grievance Resolution:</span> Within 14 business days (max 90 days)
            </p>
          </div>
        </motion.div>

        {/* Key Sections */}
        <div className="space-y-12">
          {/* 1. Scope and Applicability */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              1. Scope and Applicability
            </h2>
            <p className="mb-4" style={{ color: "#666" }}>
              This Master Privacy Policy governs the collection, storage, processing, disclosure, retention, and erasure of digital personal data by Axoreon, operating the AuditWeave platform. This Policy is issued in strict compliance with Section 5 of India's Digital Personal Data Protection (DPDP) Act, 2023 and Rule 3 of the DPDP Rules, 2025.
            </p>
            <p style={{ color: "#666" }}>
              This Policy applies to all individuals who register an account, access our compliance tools, submit privacy policies for auditing, subscribe to paid plans, or interact with our web surface.
            </p>
          </motion.section>

          {/* 2. Categories of Personal Data */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              2. Categories of Personal Data Collected
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border-l-4" style={{ borderLeftColor: "#276152", backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-2" style={{ color: "#276152" }}>Account Information</p>
                <p style={{ color: "#666" }}>
                  Full Name, Email Address, and Login Credentials collected during user account registration and authentication.
                </p>
              </div>
              <div className="p-4 rounded-lg border-l-4" style={{ borderLeftColor: "#276152", backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-2" style={{ color: "#276152" }}>Payment Information</p>
                <p style={{ color: "#666" }}>
                  Mobile Number, Billing Name, Billing Address, GSTIN (optional), and Transaction Reference ID collected via Razorpay. We DO NOT store full payment card details, banking credentials, or payment instrument codes.
                </p>
              </div>
              <div className="p-4 rounded-lg border-l-4" style={{ borderLeftColor: "#276152", backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-2" style={{ color: "#276152" }}>Audit Content</p>
                <p style={{ color: "#666" }}>
                  Website URLs, pasted privacy policy texts, and uploaded document files (PDF or DOCX format) submitted for compliance auditing.
                </p>
              </div>
              <div className="p-4 rounded-lg border-l-4" style={{ borderLeftColor: "#276152", backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-2" style={{ color: "#276152" }}>System Information</p>
                <p style={{ color: "#666" }}>
                  IP Address (hashed), Browser User-Agent, Session Timestamps, Feature Usage Metrics, and Audit History Logs collected for system security and operational integrity.
                </p>
              </div>
            </div>
          </motion.section>

          {/* 3. Specified Purposes */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              3. Specified Purposes and Lawful Grounds for Processing
            </h2>
            <p className="mb-6" style={{ color: "#666" }}>
              Personal data is processed strictly for specified, lawful purposes backed by appropriate legal grounds under Section 4 and Section 7 of the DPDP Act.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#F4F1EB" }}>
                    <th className="border p-3 text-left font-semibold text-sm" style={{ color: "#276152", borderColor: "#D4CAB8" }}>
                      Data Category
                    </th>
                    <th className="border p-3 text-left font-semibold text-sm" style={{ color: "#276152", borderColor: "#D4CAB8" }}>
                      Purpose
                    </th>
                    <th className="border p-3 text-left font-semibold text-sm" style={{ color: "#276152", borderColor: "#D4CAB8" }}>
                      Legal Ground
                    </th>
                    <th className="border p-3 text-left font-semibold text-sm" style={{ color: "#276152", borderColor: "#D4CAB8" }}>
                      Retention
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: "white" }}>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>Account Registration</td>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>User authentication, account setup, password reset</td>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>Consent (Section 6)</td>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>Duration of active account</td>
                  </tr>
                  <tr style={{ backgroundColor: "#FAFBF9" }}>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>Payment Metadata</td>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>Processing transactions, issuing invoices, GST compliance</td>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>Legal Obligation</td>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>7 years (tax law)</td>
                  </tr>
                  <tr style={{ backgroundColor: "white" }}>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>Audit Files</td>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>Text extraction, DPDP analysis, compliance scoring</td>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>Consent / Contract</td>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>Until deleted by user</td>
                  </tr>
                  <tr style={{ backgroundColor: "#FAFBF9" }}>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>System Logs</td>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>Security monitoring, threat detection, rate-limiting</td>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>Statutory Safeguard</td>
                    <td className="border p-3 text-sm" style={{ color: "#666", borderColor: "#D4CAB8" }}>Minimum 1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* 4. Customer Content Protection */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              4. Special Protections for Customer Submitted Audit Content
            </h2>
            <div className="space-y-3">
              <p style={{ color: "#666" }}>
                ✓ <span className="font-semibold">No Model Training:</span> We DO NOT use customer privacy policies or uploaded files to train public AI or LLM models.
              </p>
              <p style={{ color: "#666" }}>
                ✓ <span className="font-semibold">Temporary Processing:</span> Files are stored in secure, temporary storage during extraction and automatically purged upon report completion.
              </p>
              <p style={{ color: "#666" }}>
                ✓ <span className="font-semibold">Encrypted Storage:</span> Saved audit reports are encrypted at rest using AES-256 and accessible exclusively by the authenticated account holder.
              </p>
              <p style={{ color: "#666" }}>
                ✓ <span className="font-semibold">Confidentiality:</span> Your submitted content is treated with strict confidentiality and never shared with third parties.
              </p>
            </div>
          </motion.section>

          {/* 5. Data Principal Rights */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              5. Your Data Rights
            </h2>
            <p className="mb-6" style={{ color: "#666" }}>
              Under Chapter III of the DPDP Act (Sections 11–14), you possess the following enforceable statutory rights:
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-1" style={{ color: "#276152" }}>Right to Access (Section 11)</p>
                <p style={{ color: "#666" }}>
                  Obtain a summary of personal data being processed, processing activities, and identities of third parties with whom data has been shared.
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-1" style={{ color: "#276152" }}>Right to Correction (Section 12(1))</p>
                <p style={{ color: "#666" }}>
                  Request correction of inaccurate data, completion of incomplete records, and updating of personal details.
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-1" style={{ color: "#276152" }}>Right to Erasure (Section 12(3))</p>
                <p style={{ color: "#666" }}>
                  Request permanent erasure of personal data, executed automatically unless retention is required by law.
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-1" style={{ color: "#276152" }}>Right to Nominate (Section 14)</p>
                <p style={{ color: "#666" }}>
                  Nominate an individual to exercise rights in the event of death or legal incapacity.
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-1" style={{ color: "#276152" }}>Right to Grievance Redressal (Section 13)</p>
                <p style={{ color: "#666" }}>
                  File complaints regarding data processing practices, resolved within 14 business days (maximum 90 days).
                </p>
              </div>
            </div>
          </motion.section>

          {/* 6. Consent Withdrawal */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              6. Consent Withdrawal Parity Mechanism
            </h2>
            <p className="mb-4" style={{ color: "#666" }}>
              Under Section 6(4) of the DPDP Act, you have the right to withdraw consent at any time with the same ease as giving it.
            </p>
            <div className="p-4 rounded-lg border-2" style={{ borderColor: "#D4CAB8", backgroundColor: "white" }}>
              <p style={{ color: "#666" }}>
                AuditWeave provides a <span className="font-semibold">1-click 'Revoke Consent' button</span> in your account dashboard. Upon withdrawal, we will cease processing your personal data within a reasonable time, except where retention is mandated by law.
              </p>
            </div>
          </motion.section>

          {/* 7. Data Retention */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              7. Data Retention and Auto-Erasure Framework
            </h2>
            <div className="space-y-4">
              <p style={{ color: "#666" }}>
                In compliance with Section 8(7) and Rule 8 of the DPDP Rules, 2025:
              </p>
              <div className="p-4 rounded-lg border-l-4" style={{ borderLeftColor: "#276152", backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-2" style={{ color: "#276152" }}>Account Data</p>
                <p style={{ color: "#666" }}>
                  Retained for the duration of active account usage. If your account remains inactive for 3 years, you'll receive a 48-hour pre-erasure notification before permanent deletion.
                </p>
              </div>
              <div className="p-4 rounded-lg border-l-4" style={{ borderLeftColor: "#276152", backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-2" style={{ color: "#276152" }}>System Logs</p>
                <p style={{ color: "#666" }}>
                  Technical logs are immutably retained for a minimum of 1 year (365 days) as mandated by Rule 6(1)(e).
                </p>
              </div>
              <div className="p-4 rounded-lg border-l-4" style={{ borderLeftColor: "#276152", backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-2" style={{ color: "#276152" }}>Financial Records</p>
                <p style={{ color: "#666" }}>
                  Subscription and transaction records are retained for 7 years per Indian tax and Companies Act requirements.
                </p>
              </div>
            </div>
          </motion.section>

          {/* 8. Security Safeguards */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              8. Information Security & Technical Safeguards
            </h2>
            <p className="mb-6" style={{ color: "#666" }}>
              We implement comprehensive technical and organizational safeguards to protect your personal data:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="font-bold" style={{ color: "#276152" }}>🔒</span>
                <div>
                  <p className="font-semibold mb-1" style={{ color: "#276152" }}>Encryption in Transit</p>
                  <p style={{ color: "#666" }}>
                    All web traffic uses TLS 1.3 with HTTP Strict Transport Security (HSTS) enforced.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold" style={{ color: "#276152" }}>🔐</span>
                <div>
                  <p className="font-semibold mb-1" style={{ color: "#276152" }}>Encryption at Rest</p>
                  <p style={{ color: "#666" }}>
                    All databases and backups use AES-256 encryption. Sensitive fields use tokenization.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold" style={{ color: "#276152" }}>👤</span>
                <div>
                  <p className="font-semibold mb-1" style={{ color: "#276152" }}>Access Controls</p>
                  <p style={{ color: "#666" }}>
                    Role-based access control (RBAC) and multi-factor authentication (MFA) enforced for all administrative access.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold" style={{ color: "#276152" }}>🛡️</span>
                <div>
                  <p className="font-semibold mb-1" style={{ color: "#276152" }}>API Security</p>
                  <p style={{ color: "#666" }}>
                    API endpoints protected against OWASP Top 10 vulnerabilities with token validation and authorization checks.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold" style={{ color: "#276152" }}>📦</span>
                <div>
                  <p className="font-semibold mb-1" style={{ color: "#276152" }}>Backups</p>
                  <p style={{ color: "#666" }}>
                    Daily encrypted backups in geographically isolated cloud regions within India, tested quarterly.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 9. Cookies Policy */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              9. Cookies & Tracking Technologies
            </h2>
            <p className="mb-6" style={{ color: "#666" }}>
              AuditWeave enforces client-side pre-consent hard blocking. Non-essential tracking scripts are disabled until you provide explicit opt-in consent.
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-1" style={{ color: "#276152" }}>Strictly Necessary Cookies</p>
                <p style={{ color: "#666" }}>
                  Essential for navigation, authentication, and security. Always active and cannot be disabled.
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-1" style={{ color: "#276152" }}>Functional Cookies</p>
                <p style={{ color: "#666" }}>
                  Remember user preferences like language and dark mode. Disabled by default, requires opt-in.
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-1" style={{ color: "#276152" }}>Analytics Cookies</p>
                <p style={{ color: "#666" }}>
                  Measure website traffic and performance. Disabled by default, requires explicit opt-in.
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#FAFBF9" }}>
                <p className="font-semibold mb-1" style={{ color: "#276152" }}>Marketing Cookies</p>
                <p style={{ color: "#666" }}>
                  Track campaign effectiveness. Disabled by default, requires opt-in. Prohibited for minors.
                </p>
              </div>
            </div>
            <p className="mt-6" style={{ color: "#666" }}>
              You can modify or revoke cookie preferences at any time using the persistent floating 'Cookie Preferences' icon at the bottom-left of every page.
            </p>
          </motion.section>

          {/* 10. Terms of Service */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              10. Terms of Service
            </h2>
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2" style={{ color: "#276152" }}>Eligibility</p>
                <p style={{ color: "#666" }}>
                  You must be at least 18 years of age to create an account and use AuditWeave. Minors are strictly prohibited.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-2" style={{ color: "#276152" }}>Account Security</p>
                <p style={{ color: "#666" }}>
                  You are responsible for maintaining the confidentiality of your login credentials. Notify us immediately at legal@axoreon.com of any unauthorized access.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-2" style={{ color: "#276152" }}>Intellectual Property</p>
                <p style={{ color: "#666" }}>
                  AuditWeave grants you a non-exclusive, non-transferable license to use the platform. All software, algorithms, designs, and trademarks remain Axoreon's exclusive property.
                </p>
              </div>
              <div className="p-4 rounded-lg border-2" style={{ borderColor: "#D4CAB8", backgroundColor: "white" }}>
                <p className="font-semibold mb-2" style={{ color: "#276152" }}>⚠️ Legal Disclaimer</p>
                <p style={{ color: "#666" }}>
                  AuditWeave provides <span className="font-semibold">automated compliance assistance</span> and does NOT constitute formal legal advice. Generated policies and findings MUST be reviewed by qualified Indian legal counsel before publication.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-2" style={{ color: "#276152" }}>Prohibited Activities</p>
                <p style={{ color: "#666" }}>
                  You shall not: reverse engineer the platform, use automated scrapers, submit malicious code, or resell account access without authorization.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-2" style={{ color: "#276152" }}>Governing Law</p>
                <p style={{ color: "#666" }}>
                  These Terms are governed by the laws of India. Any disputes are subject to the exclusive jurisdiction of competent courts in Bengaluru, Karnataka, India.
                </p>
              </div>
            </div>
          </motion.section>

          {/* 11. Grievance Redressal */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              11. Grievance Redressal Process
            </h2>
            <p className="mb-6" style={{ color: "#666" }}>
              In compliance with Section 8(9), Section 13, and Rule 9 of the DPDP Rules, 2025, Axoreon has appointed a designated Grievance Officer and Data Protection Officer based in India.
            </p>
            <div className="p-6 rounded-lg border-2" style={{ borderColor: "#276152", backgroundColor: "#FAFBF9" }}>
              <p className="font-semibold mb-4" style={{ color: "#276152" }}>Data Protection Officer & Grievance Officer</p>
              <div className="space-y-3" style={{ color: "#666" }}>
                <p>
                  <span className="font-semibold">Email:</span> dpo@axoreon.com
                </p>
                <p>
                  <span className="font-semibold">Legal:</span> legal@axoreon.com
                </p>
                <p>
                  <span className="font-semibold">Hours:</span> Mon–Fri, 09:00 to 18:00 IST
                </p>
                <p>
                  <span className="font-semibold">Acknowledgment:</span> Within 48 hours
                </p>
                <p>
                  <span className="font-semibold">Resolution:</span> Within 14 business days (maximum 90 days per statute)
                </p>
              </div>
            </div>
            <p className="mt-6" style={{ color: "#666" }}>
              You must exhaust this internal grievance mechanism before filing a complaint with the Data Protection Board of India (dpb.gov.in).
            </p>
          </motion.section>

          {/* 12. Critical Distinctions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              12. DPDP vs. GDPR: Critical Distinction
            </h2>
            <div className="p-6 rounded-lg border-2" style={{ borderColor: "#D4CAB8", backgroundColor: "white" }}>
              <p className="font-semibold mb-4" style={{ color: "#276152" }}>⚠️ Important Notice</p>
              <p style={{ color: "#666" }}>
                Unlike the EU General Data Protection Regulation (GDPR), India's DPDP Act <span className="font-semibold">DOES NOT recognize a generic 'legitimate interests' ground</span> for processing personal data.
              </p>
              <p className="mt-4" style={{ color: "#666" }}>
                Axoreon cannot bypass user consent for analytics, profiling, or commercial communications. All commercial processing on AuditWeave must be grounded in <span className="font-semibold">explicit, unbundled user consent</span> under Section 6 of the DPDP Act.
              </p>
            </div>
          </motion.section>

          {/* Policy Version */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border-t-2 pt-8"
            style={{ borderTopColor: "#D4CAB8" }}
          >
            <p className="text-center" style={{ color: "#999" }}>
              <span className="font-semibold">Privacy Policy Version:</span> 1.0 (Master Website Production Suite)
            </p>
            <p className="text-center mt-2" style={{ color: "#999" }}>
              <span className="font-semibold">Last Updated:</span> November 2025
            </p>
            <p className="text-center mt-2" style={{ color: "#999" }}>
              <span className="font-semibold">Effective Date:</span> November 13, 2025 (DPDP Act & Rules Implementation Date)
            </p>
          </motion.section>
        </div>
      </main>

      <LightFooter />
    </div>
  );
}
