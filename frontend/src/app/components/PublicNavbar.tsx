"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { BrandLogo } from "./BrandLogo";

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
  const desktopLinkClass =
    "relative rounded-sm py-1 text-sm font-bold uppercase tracking-wider transition-colors duration-200 after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-brand-green after:transition-transform after:duration-200 hover:text-brand-green hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-4 focus-visible:ring-offset-brand-cream";
  const mobileLinkClass =
    "flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm font-bold uppercase tracking-wider text-brand-deep transition-colors duration-200 hover:bg-brand-green/10 hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40";

  return (
    <nav
      className="relative z-30 mx-auto flex h-20 w-full max-w-7xl items-center justify-between border-b border-brand-deep/10 px-4 sm:px-6"
      aria-label="Public navigation"
    >
      <div className="flex min-w-0 items-center space-x-8">
        <Link
          href="/"
          className="flex min-w-0 items-center space-x-2.5 rounded-md transition-opacity duration-200 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-4 focus-visible:ring-offset-brand-cream sm:space-x-3"
          aria-label="AuditWeave home"
        >
          <BrandLogo
            size={40}
            alt=""
            className="h-10 w-10 drop-shadow-md md:h-11 md:w-11"
            priority
          />
          <span className="flex min-w-0 flex-col justify-center">
            <span className="font-serif text-xl font-extrabold leading-none tracking-tighter text-brand-deep sm:text-2xl">
              AuditWeave
            </span>
            <span className="mt-1 text-[9px] font-bold uppercase leading-none tracking-widest text-brand-deep/55 sm:text-[10px]">
              Powered by Axoreon
            </span>
          </span>
        </Link>

        <div className="hidden items-center space-x-6 border-l border-brand-deep/10 pl-6 md:flex">
          <Link
            href="/pricing"
            aria-current={activePage === "pricing" ? "page" : undefined}
            className={`${desktopLinkClass} ${
              activePage === "pricing" ? "text-brand-green after:scale-x-100" : "text-brand-deep/70"
            }`}
          >
            Pricing
          </Link>
          <Link
            href="/contact"
            className={`${desktopLinkClass} text-brand-deep/70`}
          >
            Contact
          </Link>
        </div>
      </div>

      <div className="hidden items-center space-x-4 md:flex">
        <Link
          href="/login"
          className={`${desktopLinkClass} px-2 text-brand-deep`}
        >
          Log In
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-brand-green px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-sm shadow-brand-green/20 transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#2e745e] hover:shadow-md hover:shadow-brand-green/25 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream active:translate-y-0 active:shadow-sm"
        >
          Sign Up
        </Link>
      </div>

      <button
        ref={menuButtonRef}
        type="button"
        aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isMenuOpen}
        aria-controls={menuId}
        onClick={() => setIsMenuOpen((open) => !open)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-deep/10 bg-white text-brand-deep shadow-sm transition-[color,background-color,border-color,box-shadow] duration-200 hover:border-brand-green/25 hover:bg-brand-green/5 hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream md:hidden"
      >
        {isMenuOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
      </button>

      {isMenuOpen && (
        <div
          id={menuId}
          className="absolute inset-x-4 top-[calc(100%+0.5rem)] rounded-xl border border-brand-deep/10 bg-brand-cream p-2 shadow-[0_18px_45px_-24px_rgba(13,58,53,0.4)] sm:inset-x-6 md:hidden"
        >
          <Link
            ref={firstMenuLinkRef}
            href="/pricing"
            aria-current={activePage === "pricing" ? "page" : undefined}
            onClick={closeMenu}
            className={`${mobileLinkClass} ${activePage === "pricing" ? "bg-brand-green/10 text-brand-green" : ""}`}
          >
            Pricing
          </Link>
          <Link href="/contact" onClick={closeMenu} className={mobileLinkClass}>
            Contact
          </Link>
          <Link href="/login" onClick={closeMenu} className={mobileLinkClass}>
            Log In
          </Link>
          <Link
            href="/register"
            onClick={closeMenu}
            className="mt-1 flex min-h-11 items-center justify-center rounded-lg bg-brand-green px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-sm shadow-brand-green/20 transition-colors duration-200 hover:bg-[#2e745e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream"
          >
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
}
