"use client";

import Link from "next/link";
import { FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PublicNavbar } from "@/app/components/PublicNavbar";
import { LightFooter } from "@/app/components/home-light/LightFooter";
import { motion } from "framer-motion";

export default function TermsOfServicePage() {
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
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: "#276152" }}>
                Terms of Service
              </h1>
            </div>
          </div>
          <p className="text-lg" style={{ color: "#666" }}>
            Master Terms and Conditions for AuditWeave Platform
          </p>
          <p className="text-sm mt-2" style={{ color: "#999" }}>
            Effective Date: November 13, 2025 | Version 1.0
          </p>
        </motion.div>

        {/* Key Sections */}
        <div className="space-y-12">
          {/* 1. Agreement to Terms */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              1. Agreement to Terms and Eligibility
            </h2>
            <div className="space-y-4">
              <p style={{ color: "#666" }}>
                These Master Terms and Conditions ("Terms") constitute a legally binding contract between Axoreon ("Company", "we", "us", "our") and any individual or entity accessing console.axoreon.com/auditweave ("User", "you").
              </p>
              <p style={{ color: "#666" }}>
                By registering an account or accessing AuditWeave, you confirm that you are <span className="font-bold">at least 18 years of age</span> and possess the legal capacity to enter into binding agreements under Indian law.
              </p>
              <div className="p-4 rounded-lg border-2" style={{ borderColor: "#D4CAB8", backgroundColor: "white" }}>
                <p className="font-bold mb-2" style={{ color: "#276152" }}>⚠️ Important Notice</p>
                <p className="text-sm" style={{ color: "#666" }}>
                  Minors under 18 years of age are strictly prohibited from creating accounts or using AuditWeave.
                </p>
              </div>
            </div>
          </motion.section>

          {/* 2. Account Credentials */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              2. Account Credentials and Security
            </h2>
            <div className="space-y-3">
              <p style={{ color: "#666" }}>
                Users are responsible for maintaining the strict confidentiality of their account login credentials.
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#276152" }} />
                  <p className="text-sm" style={{ color: "#666" }}>
                    You agree to notify Axoreon immediately at <a href="mailto:legal@axoreon.com" className="font-bold hover:underline" style={{ color: "#276152" }}>legal@axoreon.com</a> upon discovering any unauthorized account access.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#276152" }} />
                  <p className="text-sm" style={{ color: "#666" }}>
                    Axoreon shall not be liable for losses arising from unauthorized credential usage resulting from user negligence.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#276152" }} />
                  <p className="text-sm" style={{ color: "#666" }}>
                    You are solely responsible for all activities that occur under your account.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 3. Service Usage */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              3. SaaS Service Usage and Intellectual Property Rights
            </h2>
            <div className="space-y-4">
              <p style={{ color: "#666" }}>
                AuditWeave grants users a <span className="font-bold">non-exclusive, non-transferable, revocable license</span> to access the SaaS platform, conduct policy audits, and download generated audit reports and rewritten privacy policies.
              </p>
              <div className="p-5 rounded-lg border-l-4" style={{ borderLeftColor: "#276152", backgroundColor: "#FAFBF9" }}>
                <p className="font-bold mb-2" style={{ color: "#276152" }}>Intellectual Property</p>
                <p className="text-sm" style={{ color: "#666" }}>
                  All software code, multi-stage extraction algorithms, 11-pillar evaluation logic, UI/UX designs, trademarks, and branding associated with AuditWeave remain the <span className="font-bold">exclusive intellectual property of Axoreon</span>.
                </p>
              </div>
            </div>
          </motion.section>

          {/* 4. Legal Disclaimer */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              4. Mandatory Statutory Disclaimer — Not Professional Legal Advice
            </h2>
            <div className="p-6 rounded-lg border-2" style={{ borderColor: "#DC2626", backgroundColor: "#FEF2F2" }}>
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 flex-shrink-0" style={{ color: "#DC2626" }} />
                <div>
                  <p className="font-bold mb-3" style={{ color: "#DC2626" }}>
                    AUTOMATED COMPLIANCE DISCLAIMER
                  </p>
                  <p className="text-sm mb-3" style={{ color: "#666" }}>
                    AuditWeave provides automated privacy policy audits, compliance scores, gap analysis, and AI-generated policy text based on algorithmically mapped provisions of the DPDP Act, 2023 and DPDP Rules, 2025.
                  </p>
                  <p className="text-sm font-bold" style={{ color: "#DC2626" }}>
                    AuditWeave IS AN AUTOMATED COMPLIANCE ASSISTANCE TOOL AND DOES NOT CONSTITUTE FORMAL LEGAL ADVICE, LEGAL OPINION, OR SOLICITOR-CLIENT REPRESENTATION.
                  </p>
                  <p className="text-sm mt-3" style={{ color: "#666" }}>
                    Generated policies and audit findings <span className="font-bold">MUST be reviewed and validated by qualified Indian legal counsel</span> prior to formal publication or regulatory submission.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 5. Prohibited Activities */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              5. Prohibited Activities & Fair Use
            </h2>
            <p className="mb-4" style={{ color: "#666" }}>Users shall not:</p>
            <div className="space-y-3">
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#FAFBF9", border: "1px solid #D4CAB8" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "#276152" }}>❌ Reverse Engineering</p>
                <p className="text-sm" style={{ color: "#666" }}>
                  Attempt to reverse engineer, decompile, or extract source code from AuditWeave
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#FAFBF9", border: "1px solid #D4CAB8" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "#276152" }}>❌ Automated Abuse</p>
                <p className="text-sm" style={{ color: "#666" }}>
                  Use automated web scrapers or bots to overload the platform
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#FAFBF9", border: "1px solid #D4CAB8" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "#276152" }}>❌ Malicious Content</p>
                <p className="text-sm" style={{ color: "#666" }}>
                  Submit malicious code or malware via policy upload fields
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#FAFBF9", border: "1px solid #D4CAB8" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "#276152" }}>❌ Unauthorized Resale</p>
                <p className="text-sm" style={{ color: "#666" }}>
                  Resell SaaS account access to unauthorized third parties without an enterprise agency license
                </p>
              </div>
            </div>
          </motion.section>

          {/* 6. Subscription & Payment */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              6. Subscription and Payment Terms
            </h2>
            <div className="space-y-4">
              <p style={{ color: "#666" }}>
                AuditWeave offers both free trial credits and paid subscription plans. Payment processing is handled by Razorpay Software Private Limited, an independent payment aggregator.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border-l-4" style={{ borderLeftColor: "#276152", backgroundColor: "white" }}>
                  <p className="font-bold mb-2" style={{ color: "#276152" }}>Free Trial</p>
                  <p className="text-sm" style={{ color: "#666" }}>
                    New users receive 2 free audit credits. No credit card required.
                  </p>
                </div>
                <div className="p-4 rounded-lg border-l-4" style={{ borderLeftColor: "#276152", backgroundColor: "white" }}>
                  <p className="font-bold mb-2" style={{ color: "#276152" }}>Paid Plans</p>
                  <p className="text-sm" style={{ color: "#666" }}>
                    Subscription fees are charged according to the selected plan. All prices are in Indian Rupees (₹).
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 7. Cancellation & Refunds */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              7. Cancellation and Refund Policy
            </h2>
            <div className="space-y-3">
              <p style={{ color: "#666" }}>
                You may cancel your subscription at any time through your account dashboard. Upon cancellation:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span style={{ color: "#276152" }}>•</span>
                  <p className="text-sm" style={{ color: "#666" }}>
                    Access to paid features will continue until the end of your current billing period
                  </p>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: "#276152" }}>•</span>
                  <p className="text-sm" style={{ color: "#666" }}>
                    No refunds are provided for partial billing periods
                  </p>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: "#276152" }}>•</span>
                  <p className="text-sm" style={{ color: "#666" }}>
                    Unused credits do not carry over after cancellation
                  </p>
                </li>
              </ul>
            </div>
          </motion.section>

          {/* 8. Limitation of Liability */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              8. Limitation of Liability
            </h2>
            <div className="p-6 rounded-lg border-2" style={{ borderColor: "#D4CAB8", backgroundColor: "white" }}>
              <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AXOREON SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
              </p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-2 text-sm" style={{ color: "#666" }}>
                  <span>(a)</span> Your access to or use of or inability to access or use the service
                </li>
                <li className="flex items-start gap-2 text-sm" style={{ color: "#666" }}>
                  <span>(b)</span> Any conduct or content of any third party on the service
                </li>
                <li className="flex items-start gap-2 text-sm" style={{ color: "#666" }}>
                  <span>(c)</span> Any content obtained from the service
                </li>
                <li className="flex items-start gap-2 text-sm" style={{ color: "#666" }}>
                  <span>(d)</span> Unauthorized access, use, or alteration of your transmissions or content
                </li>
              </ul>
            </div>
          </motion.section>

          {/* 9. Governing Law */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              9. Governing Law, Jurisdiction & Dispute Resolution
            </h2>
            <div className="space-y-4">
              <p style={{ color: "#666" }}>
                These Terms shall be governed by and construed in accordance with the <span className="font-bold">laws of the Republic of India</span>.
              </p>
              <div className="p-5 rounded-lg border-l-4" style={{ borderLeftColor: "#276152", backgroundColor: "#FAFBF9" }}>
                <p className="font-bold mb-2" style={{ color: "#276152" }}>Jurisdiction</p>
                <p className="text-sm" style={{ color: "#666" }}>
                  Any disputes arising out of or in connection with AuditWeave shall be subject to the <span className="font-bold">exclusive jurisdiction of the competent courts located in Bengaluru, Karnataka, India</span>.
                </p>
              </div>
            </div>
          </motion.section>

          {/* 10. Changes to Terms */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              10. Changes to Terms of Service
            </h2>
            <p className="mb-4" style={{ color: "#666" }}>
              We reserve the right to modify or replace these Terms at any time. Material changes will be notified via:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" style={{ color: "#276152" }} />
                <p className="text-sm" style={{ color: "#666" }}>Email notification to your registered email address</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" style={{ color: "#276152" }} />
                <p className="text-sm" style={{ color: "#666" }}>Prominent notice on the AuditWeave platform</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" style={{ color: "#276152" }} />
                <p className="text-sm" style={{ color: "#666" }}>Updates posted on this Terms page with revised effective date</p>
              </div>
            </div>
            <p className="mt-4 text-sm" style={{ color: "#666" }}>
              Continued use of the service after changes constitute acceptance of the new Terms.
            </p>
          </motion.section>

          {/* Contact Information */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border-t-2 pt-8"
            style={{ borderTopColor: "#D4CAB8" }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#276152" }}>
              Contact Us
            </h2>
            <p className="mb-4" style={{ color: "#666" }}>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="p-6 rounded-lg border-2" style={{ borderColor: "#276152", backgroundColor: "#FAFBF9" }}>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-bold" style={{ color: "#276152" }}>Email:</span>{" "}
                  <a href="mailto:legal@axoreon.com" className="hover:underline" style={{ color: "#276152" }}>legal@axoreon.com</a>
                </p>
                <p className="text-sm">
                  <span className="font-bold" style={{ color: "#276152" }}>Support:</span>{" "}
                  <Link href="/contact" className="hover:underline" style={{ color: "#276152" }}>Contact Form</Link>
                </p>
                <p className="text-sm">
                  <span className="font-bold" style={{ color: "#276152" }}>Response Time:</span>{" "}
                  <span style={{ color: "#666" }}>Within 48 hours (business days)</span>
                </p>
              </div>
            </div>
          </motion.section>

          {/* Version Info */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p style={{ color: "#999" }}>
              <span className="font-semibold">Terms of Service Version:</span> 1.0 (Master Production Version)
            </p>
            <p className="mt-2" style={{ color: "#999" }}>
              <span className="font-semibold">Last Updated:</span> November 2025
            </p>
            <p className="mt-2" style={{ color: "#999" }}>
              <span className="font-semibold">Effective Date:</span> November 13, 2025
            </p>
          </motion.section>
        </div>
      </main>

      <LightFooter />
    </div>
  );
}
