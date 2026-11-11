"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Shield, User, Layers, History, LogOut, LayoutDashboard, Zap } from "lucide-react";
import { getCurrentEmail, getCurrentUser, isAuthenticated, logoutUser } from "@/lib/api";
import { canRenderRoute, isPlanAccessExemptPath, isPublicPath, shouldHideAppShell } from "@/lib/auth/routes";
import { AUTH_SESSION_EVENT } from "@/lib/auth/session";
import { BrandLogo } from "./components/BrandLogo";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [hasPlanAccess, setHasPlanAccess] = useState(false);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    let disposed = false;
    let profileRequestVersion = 0;
    const syncSession = () => {
      const requestVersion = ++profileRequestVersion;
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      setUserEmail(authenticated ? getCurrentEmail() : "");
      if (authenticated) {
        setSessionResolved(false);
        void getCurrentUser()
          .then((profile) => {
            if (!disposed && requestVersion === profileRequestVersion) {
              setFirstName(profile.first_name?.trim() || "");
              setCredits(profile.credits_balance || 0);
              setHasPlanAccess(profile.has_plan_access);
              setSessionResolved(true);
              if (!profile.has_plan_access && !isPlanAccessExemptPath(pathname)) {
                router.replace("/account/billing");
              }
            }
          })
          .catch(() => {
            if (!disposed && requestVersion === profileRequestVersion) {
              setFirstName("");
              setCredits(0);
              setHasPlanAccess(false);
              setSessionResolved(true);
            }
          });
      } else {
        setFirstName("");
        setCredits(0);
        setHasPlanAccess(false);
        setSessionResolved(true);
      }
      if (!isPublicPath(pathname) && !authenticated) router.replace("/login");
    };
    syncSession();
    window.addEventListener(AUTH_SESSION_EVENT, syncSession);
    return () => {
      disposed = true;
      window.removeEventListener(AUTH_SESSION_EVENT, syncSession);
    };
  }, [pathname, router]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 1024) return;
    const frame = window.requestAnimationFrame(() => setIsSidebarOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  const handleLogout = () => {
    logoutUser();
    setIsAuth(false);
    router.push("/login");
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/audit/new", label: "Compliance Auditor", icon: Shield },
    { href: "/audit/batch", label: "Batch Multi-Audit", icon: Layers },
    { href: "/history", label: "Audit History", icon: History },
    { href: "/account/billing", label: "Credits & Pricing", icon: Zap },
    { href: "/contact", label: "Contact & Support", icon: User },
  ];

  const shouldShowSidebar = sessionResolved && isAuth && hasPlanAccess && !shouldHideAppShell(pathname);
  const shouldRenderContent = canRenderRoute(pathname, isAuth, hasPlanAccess, sessionResolved);
  const fallbackName = userEmail.split("@")[0].split(/[._-]/)[0].replace(/\d+$/, "");
  const displayName = firstName || (fallbackName ? fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1) : "there");
  const profileInitial = (firstName || userEmail).charAt(0);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Primary Meta Tags */}
        <title>AuditWeave - DPDP Act 2023 Compliance Auditing | Stop Risking ₹250 Cr Penalties</title>
        <meta name="title" content="AuditWeave - DPDP Act 2023 Compliance Auditing | Stop Risking ₹250 Cr Penalties" />
        <meta name="description" content="Automated DPDP Act 2023 compliance auditing platform. Scan privacy policies in under 15 seconds with AI legal reasoning. Avoid ₹250 Cr penalties. Trusted by 500+ legal teams." />
        <meta name="keywords" content="DPDP Act 2023, Digital Personal Data Protection Act, privacy policy audit, compliance auditing, India data protection, DPDP compliance, privacy policy scanner, legal compliance tool, AI compliance audit, automated compliance" />
        <meta name="author" content="Axoreon" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://auditweave.axoreon.com" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://auditweave.axoreon.com" />
        <meta property="og:title" content="AuditWeave - Stop Risking ₹250 Crore DPDP Act Penalties" />
        <meta property="og:description" content="Automated privacy policy auditing platform for DPDP Act 2023 compliance. Scan in 15 seconds, avoid penalties, get executive-ready reports. Trusted by 500+ legal teams." />
        <meta property="og:image" content="https://auditweave.axoreon.com/og-image.png" />
        <meta property="og:site_name" content="AuditWeave" />
        <meta property="og:locale" content="en_IN" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://auditweave.axoreon.com" />
        <meta property="twitter:title" content="AuditWeave - DPDP Act 2023 Compliance Auditing" />
        <meta property="twitter:description" content="Automated privacy policy auditing in under 15 seconds. AI legal reasoning + deterministic rule engine. Avoid ₹250 Cr penalties." />
        <meta property="twitter:image" content="https://auditweave.axoreon.com/twitter-image.png" />
        <meta property="twitter:creator" content="@axoreon" />

        {/* Favicons */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Theme Color */}
        <meta name="theme-color" content="#276152" />

        {/* Additional SEO */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
      </head>
      <body className="min-h-screen bg-brand-cream text-brand-deep antialiased">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
        {shouldShowSidebar && (
          <>
            {isSidebarOpen && (
              <button
                type="button"
                aria-label="Close navigation menu"
                className="fixed inset-0 z-40 bg-brand-deep/35 backdrop-blur-[2px] lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            <aside
              className={`fixed inset-y-0 left-0 z-50 flex overflow-hidden border-r border-white/10 bg-brand-deep text-white shadow-2xl transition-[width,transform] duration-300 ease-out ${
                isSidebarOpen
                  ? "w-72 translate-x-0 lg:w-64"
                  : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
              }`}
            >
              <div className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full border border-brand-green/50" />
              <div className="pointer-events-none absolute -left-12 top-28 h-44 w-44 rounded-full border border-brand-green/50" />

              <div className="relative z-10 flex h-full w-full min-w-0 flex-col px-3 py-5">
                <Link
                  href="/dashboard"
                  className={`mb-8 flex h-12 items-center text-white ${isSidebarOpen ? "gap-3 px-2" : "justify-center"}`}
                >
                  <BrandLogo
                    size={36}
                    alt="AuditWeave"
                    className="h-9 w-9 shrink-0"
                    priority
                  />
                  {isSidebarOpen && (
                    <span className="min-w-0">
                      <span className="block whitespace-nowrap font-serif text-xl font-black leading-none">AuditWeave</span>
                      <span className="mt-1.5 block whitespace-nowrap text-[7px] font-extrabold uppercase tracking-[0.2em] text-[#3F9C7E]">Powered by Axoreon</span>
                    </span>
                  )}
                </Link>

                <nav className="flex flex-1 flex-col gap-2" aria-label="Main navigation">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const active = pathname === link.href || pathname.startsWith(link.href + "/");
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        title={!isSidebarOpen ? link.label : undefined}
                        className={`flex h-11 items-center rounded-xl text-sm font-semibold text-white transition-colors ${
                          isSidebarOpen ? "gap-3 px-3" : "justify-center px-0"
                        } ${active ? "bg-white/15 shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {isSidebarOpen && <span className="whitespace-nowrap">{link.label}</span>}
                      </Link>
                    );
                  })}
                </nav>

                <div className="border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign Out"
                    className={`flex h-11 w-full items-center rounded-xl text-sm font-semibold text-white/75 transition-colors hover:bg-red-500/15 hover:text-white ${
                      isSidebarOpen ? "gap-3 px-3" : "justify-center"
                    }`}
                  >
                    <LogOut className="h-[18px] w-[18px] shrink-0" />
                    {isSidebarOpen && <span>Sign Out</span>}
                  </button>
                </div>
              </div>
            </aside>

            <button
              type="button"
              onClick={() => setIsSidebarOpen((open) => !open)}
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={isSidebarOpen}
              className={`fixed top-1/2 z-[60] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-4 border-brand-cream bg-brand-green text-white shadow-lg transition-[left,background-color] duration-300 hover:bg-[#3F9C7E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F9C7E] focus-visible:ring-offset-2 ${
                isSidebarOpen ? "left-[270px] lg:left-[238px]" : "left-0 lg:left-[62px]"
              }`}
            >
              {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </>
        )}

        <main
          className={`flex min-h-screen w-full flex-col bg-brand-cream transition-[margin] duration-300 ${
            shouldShowSidebar ? (isSidebarOpen ? "lg:ml-64 lg:w-[calc(100%-16rem)]" : "lg:ml-20 lg:w-[calc(100%-5rem)]") : ""
          }`}
        >
          {shouldShowSidebar && (
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-brand-deep/10 bg-[#FDFBF7]/90 px-5 backdrop-blur-md sm:px-7">
              {isAuth ? (
                <div className="min-w-0">
                  <p className="truncate text-base font-extrabold text-brand-deep sm:text-lg">
                    Welcome back, <span className="text-brand-green">{displayName}</span>
                  </p>
                  <p className="hidden truncate text-[11px] font-medium text-brand-deep/50 sm:block">
                    Your compliance workspace is ready for today.
                  </p>
                </div>
              ) : <div />}
              
              <div className="flex items-center space-x-3 sm:space-x-4">
                  {isAuth && (
                    <Link
                      href="/account/billing"
                      aria-label={`${credits} credits available. Open credits and billing.`}
                      className="flex items-center space-x-1.5 rounded-full border border-brand-deep/5 bg-brand-deep/[0.04] px-2.5 py-1.5 transition hover:border-brand-green/25 hover:bg-brand-green/10 sm:px-3"
                    >
                      <div className={`h-2 w-2 rounded-full ${credits > 0 ? "bg-brand-green" : "bg-orange-500"}`} />
                      <span className="text-xs font-extrabold text-brand-deep">{credits} <span className="hidden font-semibold opacity-70 sm:inline">Credits</span></span>
                    </Link>
                  )}
                
                {isAuth && userEmail && (
                  <div className="relative">
                  {isProfileOpen && (
                    <button
                      type="button"
                      aria-label="Close profile menu"
                      className="fixed inset-0 z-20 cursor-default"
                      onClick={() => setIsProfileOpen(false)}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((open) => !open)}
                    aria-label="Open profile menu"
                    aria-haspopup="menu"
                    aria-expanded={isProfileOpen}
                    className="relative z-30 flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-sm font-extrabold uppercase text-white shadow-sm transition-colors hover:bg-[#1C5E47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 focus-visible:ring-offset-2"
                  >
                    {profileInitial}
                  </button>

                  {isProfileOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-12 z-30 w-72 overflow-hidden rounded-2xl border border-brand-deep/10 bg-white p-2 shadow-[0_18px_50px_rgba(13,58,53,0.16)]"
                    >
                      <div className="flex items-center gap-3 rounded-xl bg-brand-deep/[0.04] p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green text-sm font-extrabold uppercase text-white">
                          {profileInitial}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-brand-deep">{firstName || displayName}</p>
                          <p className="truncate text-xs text-brand-deep/60">{userEmail}</p>
                        </div>
                      </div>
                      <div className="px-3 py-2.5 text-[11px] font-medium text-brand-deep/55">
                        DPDP Act 2023 workspace · Active
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              </div>
            </header>
          )}
          {shouldRenderContent ? children : (
            <div className="flex min-h-screen items-center justify-center bg-brand-cream">
              <p className="text-sm font-semibold text-brand-deep/60">Checking account access…</p>
            </div>
          )}
        </main>
      </body>
    </html>
  );
}
