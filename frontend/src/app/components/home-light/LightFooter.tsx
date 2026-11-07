"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, Mail, ExternalLink } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Features", href: "#how-it-works" },
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

export function LightFooter() {
  return (
    <footer className="relative overflow-hidden border-t py-12 lg:py-16" style={{ borderColor: "#D4CAB8", backgroundColor: "white" }}>
      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-16 xl:px-24">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-4 lg:col-span-4">
            <div>
              <h3 className="text-2xl font-bold" style={{ color: "#276152" }}>AuditWeave</h3>
              <p className="mt-1 text-xs font-semibold" style={{ color: "#276152" }}>
                by Axoreon
              </p>
            </div>

            <p className="text-sm leading-relaxed text-slate-600">
              DPDP Act 2023 compliance platform. Automated privacy policy auditing with AI legal reasoning for enterprise teams.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:opacity-70"
                style={{ backgroundColor: "rgba(39, 97, 82, 0.1)" }}
              >
                <Mail className="h-5 w-5" style={{ color: "#276152" }} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:opacity-70"
                style={{ backgroundColor: "rgba(39, 97, 82, 0.1)" }}
              >
                <ExternalLink className="h-5 w-5" style={{ color: "#276152" }} />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {/* Product */}
              <div>
                <h4 className="mb-4 text-sm font-bold" style={{ color: "#276152" }}>Product</h4>
                <ul className="space-y-2">
                  {footerLinks.product.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-xs text-slate-600 transition-colors hover:opacity-70"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="mb-4 text-sm font-bold" style={{ color: "#276152" }}>Company</h4>
                <ul className="space-y-2">
                  {footerLinks.company.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-xs text-slate-600 transition-colors hover:opacity-70"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="mb-4 text-sm font-bold" style={{ color: "#276152" }}>Legal</h4>
                <ul className="space-y-2">
                  {footerLinks.legal.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-xs text-slate-600 transition-colors hover:opacity-70"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="mb-4 text-sm font-bold" style={{ color: "#276152" }}>Resources</h4>
                <ul className="space-y-2">
                  {footerLinks.resources.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-xs text-slate-600 transition-colors hover:opacity-70"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 border-t pt-8"
          style={{ borderColor: "#E5E0D5" }}
        >
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-slate-600">
              © 2024 Axoreon. All rights reserved. | Built by <a href="https://axoreon.com" className="font-semibold hover:opacity-70">Axoreon</a>
            </p>
            <div className="flex items-center gap-3">
              <Lock className="h-4 w-4" style={{ color: "#666" }} />
              <span className="text-xs text-slate-600">Enterprise-grade security</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
