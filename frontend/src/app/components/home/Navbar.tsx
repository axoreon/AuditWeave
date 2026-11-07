"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Lock } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Documentation", href: "/docs" },
  { label: "Contact", href: "/contact" }
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ["rgba(10, 15, 28, 0)", "rgba(10, 15, 28, 0.95)"]
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      style={{ backgroundColor }}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isScrolled ? "border-b border-slate-700/50 backdrop-blur-xl" : ""
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from[#276152] to[#276152]">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black text-white">AuditWeave</span>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                by Axoreon
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-slate-300 transition-colors duration-200 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-4 lg:flex">
            <Link
              href="/login"
              className="text-sm font-bold text-slate-300 transition-colors duration-200 hover:text-white"
            >
              Log In
            </Link>
            <Link
              href="/audit/new"
              className="rounded-lg bg-brand-green px-6 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg[#276152] hover:shadow-lg hover:shadow-brand-green/30"
            >
              Start Audit
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg border border-slate-700 bg-slate-800/50 p-2 text-slate-300 transition-all duration-200 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="border-t border-slate-700/50 py-6 lg:hidden"
          >
            <div className="space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-base font-medium text-slate-300 transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <div className="space-y-3 border-t border-slate-700/50 pt-4">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-base font-bold text-slate-300 transition-colors duration-200 hover:text-white"
                >
                  Log In
                </Link>
                <Link
                  href="/audit/new"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-lg bg-brand-green px-6 py-3 text-center text-base font-bold text-white transition-all duration-200 hover:bg[#276152]"
                >
                  Start Audit
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
