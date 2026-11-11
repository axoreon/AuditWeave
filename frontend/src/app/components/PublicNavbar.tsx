"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";

type PublicNavbarProps = {
  activePage?: "pricing";
};

export function PublicNavbar({ activePage }: PublicNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const focusFrame = window.requestAnimationFrame(() => firstMenuLinkRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

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
              className={`text-sm font-semibold transition-colors hover:opacity-70 ${activePage === "pricing" ? "font-bold" : ""}`}
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

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden sm:flex items-center gap-3"
          >
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-bold transition-colors hover:opacity-70"
              style={{ color: "#276152" }}
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
              style={{ backgroundColor: "#276152" }}
            >
              Sign Up
            </Link>
          </motion.div>

          {/* Mobile Menu Button */}
          <button
            ref={menuButtonRef}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="lg:hidden p-2"
            style={{ color: "#276152" }}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden pb-4 space-y-3 border-t"
            style={{ borderColor: "#E5E0D5" }}
          >
            <Link
              href="/#how-it-works"
              onClick={closeMenu}
              className="block px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:opacity-70"
              style={{ color: "#276152" }}
            >
              How It Works
            </Link>
            <Link
              href="/docs"
              onClick={closeMenu}
              className="block px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:opacity-70"
              style={{ color: "#276152" }}
            >
              Documentation
            </Link>
            <Link
              ref={firstMenuLinkRef}
              href="/pricing"
              onClick={closeMenu}
              className={`block px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:opacity-70 ${activePage === "pricing" ? "font-bold" : ""}`}
              style={{ color: "#276152" }}
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              onClick={closeMenu}
              className="block px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:opacity-70"
              style={{ color: "#276152" }}
            >
              Contact
            </Link>
            <Link
              href="/login"
              onClick={closeMenu}
              className="block px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:opacity-70"
              style={{ color: "#276152" }}
            >
              Log In
            </Link>
            <Link
              href="/register"
              onClick={closeMenu}
              className="block w-full px-4 py-2 rounded-lg text-sm font-bold text-white text-center shadow-lg"
              style={{ backgroundColor: "#276152" }}
            >
              Sign Up
            </Link>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
