"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, Mail, ExternalLink } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/docs/api" }
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
    { label: "Press Kit", href: "/press" }
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Security", href: "/security" },
    { label: "Compliance", href: "/compliance" }
  ],
  resources: [
    { label: "Blog", href: "/blog" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "DPDP Act Guide", href: "/kb" },
    { label: "Support", href: "/contact" }
  ]
};

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-800 bg-[#0A0F1C] py-16 lg:py-20">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] space-y-12 px-6 lg:px-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Brand Column */}
          <div className="space-y-6 lg:col-span-4">
            <div>
              <h3 className="text-2xl font-black text-white">AuditWeave</h3>
              <p className="mt-2 text-sm text-slate-400">
                AI-Powered DPDP Act 2023 Compliance Intelligence Platform
              </p>
            </div>

            <p className="text-sm leading-relaxed text-slate-400">
              Automated privacy policy auditing, explainable AI legal reasoning, and executive-ready GRC reports
              for enterprise compliance teams.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://linkedin.com/company/axoreon"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-700 bg-slate-800/50 p-2 text-slate-400 transition-all duration-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                aria-label="LinkedIn"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
              <a
                href="mailto:support@auditweave.com"
                className="rounded-lg border border-slate-700 bg-slate-800/50 p-2 text-slate-400 transition-all duration-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>

            {/* Powered by Axoreon Badge */}
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/30 px-4 py-3 backdrop-blur-sm">
              <Lock className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Powered by
                </p>
                <p className="text-sm font-black text-white">Axoreon</p>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8 lg:gap-12">
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Product
              </h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300 transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Company
              </h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300 transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Legal
              </h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300 transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Resources
              </h4>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300 transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
          <p className="text-sm text-slate-400">
            © 2026 Axoreon. All rights reserved.
          </p>
          <p className="text-sm text-slate-500">
            Built with precision for statutory compliance intelligence.
          </p>
        </div>
      </div>
    </footer>
  );
}
