"use client";

import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function LightNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="relative z-50 border-b" style={{ borderColor: "#E5E0D5", backgroundColor: "#F4F1EB" }}>
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-16 xl:px-24">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Axoreon Logo with AuditWeave Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="flex items-center gap-3">
              {/* Axoreon Logo - SVG Badge */}
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg" style={{ backgroundColor: "#003D33" }}>
                <span className="text-lg font-bold text-white">A</span>
              </div>

              {/* Text Branding */}
              <div className="flex flex-col items-start hidden sm:flex">
                <span className="text-xl font-bold" style={{ color: "#276152", fontFamily: "Georgia, serif", letterSpacing: "-0.5px" }}>
                  AuditWeave
                </span>
                <span className="text-xs font-semibold" style={{ color: "#999" }}>
                  Powered by Axoreon
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            <Link
              href="/#how-it-works"
              className="text-sm font-semibold transition-colors hover:opacity-70"
              style={{ color: "#276152" }}
            >
              How It Works
            </Link>
            <Link
              href="/docs"
              className="text-sm font-semibold transition-colors hover:opacity-70"
              style={{ color: "#276152" }}
            >
              Documentation
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-semibold transition-colors hover:opacity-70"
              style={{ color: "#276152" }}
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              className="text-sm font-semibold transition-colors hover:opacity-70"
              style={{ color: "#276152" }}
            >
              Contact
            </Link>
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden sm:flex items-center gap-2"
          >
            <Link
              href="/audit/new"
              className="px-4 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
              style={{ backgroundColor: "#276152" }}
            >
              Start Audit
            </Link>
          </motion.div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2"
            style={{ color: "#276152" }}
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden pb-4 space-y-3 border-t"
            style={{ borderColor: "#E5E0D5" }}
          >
            <Link
              href="/#how-it-works"
              className="block px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:opacity-70"
              style={{ color: "#276152" }}
            >
              How It Works
            </Link>
            <Link
              href="/docs"
              className="block px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:opacity-70"
              style={{ color: "#276152" }}
            >
              Documentation
            </Link>
            <Link
              href="/pricing"
              className="block px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:opacity-70"
              style={{ color: "#276152" }}
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              className="block px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:opacity-70"
              style={{ color: "#276152" }}
            >
              Contact
            </Link>
            <Link
              href="/audit/new"
              className="block w-full px-4 py-2 rounded-lg text-sm font-bold text-white text-center shadow-lg"
              style={{ backgroundColor: "#276152" }}
            >
              Start Audit
            </Link>
          </motion.div>
        )}
      </div>
    </nav>
  );
}



