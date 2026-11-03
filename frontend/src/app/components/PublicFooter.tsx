import Link from "next/link";
import { BookOpen, KeyRound, Shield } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

export function PublicFooter() {
  const footerLinkClass =
    "rounded-sm underline-offset-4 transition-[color,text-decoration-color] duration-200 hover:text-brand-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream";

  return (
    <footer className="relative z-10 w-full border-t border-brand-deep/10 bg-brand-cream py-10 sm:py-12">
      <div className="mx-auto mb-9 grid max-w-7xl grid-cols-1 gap-9 px-4 text-[13px] text-brand-deep/70 sm:px-6 md:grid-cols-12 md:gap-8 md:text-xs">
        <div className="space-y-4 md:col-span-5">
          <div className="flex items-center space-x-3">
            <BrandLogo
              size={32}
              alt="AuditWeave logo"
              className="h-8 w-8 drop-shadow-md md:h-9 md:w-9"
            />
            <div className="flex flex-col justify-center">
              <span className="font-serif text-xl font-extrabold leading-none tracking-tighter text-brand-deep">
                AuditWeave
              </span>
              <span className="mt-1 text-[9px] font-bold uppercase leading-none tracking-widest text-brand-deep/55">
                Powered by Axoreon
              </span>
            </div>
          </div>
          <p className="max-w-sm text-xs font-medium leading-relaxed text-brand-deep/65">
            India&apos;s Digital Personal Data Protection (DPDP) Act 2023 compliance intelligence platform.
            Built for compliance officers, legal practitioners, and auditing teams.
          </p>
        </div>

        <div className="space-y-4 md:col-span-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep">Compliance Docs</p>
          <ul className="space-y-3 font-medium">
            <li>
              <Link href="/docs/security" className={`flex items-center gap-1.5 ${footerLinkClass}`}>
                <KeyRound className="h-3.5 w-3.5" /> Security Policy
              </Link>
            </li>
            <li>
              <Link href="/docs/privacy" className={`flex items-center gap-1.5 ${footerLinkClass}`}>
                <Shield className="h-3.5 w-3.5" /> Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-4 md:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep">Integration</p>
          <ul className="space-y-3 font-medium">
            <li>
              <Link href="/docs/api" className={`flex items-center gap-1.5 ${footerLinkClass}`}>
                <BookOpen className="h-3.5 w-3.5" /> API Documentation
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-4 md:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-deep">Company</p>
          <ul className="space-y-3 font-medium">
            <li><Link href="/contact" className={footerLinkClass}>Contact &amp; Support</Link></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 border-t border-brand-deep/10 px-4 pt-6 sm:flex-row sm:items-center sm:px-6">
        <p className="text-xs font-medium text-brand-deep/60">
          © 2026 Axoreon. Statutory auditing mapping under DPDP Act 2023.
        </p>
        <div className="flex items-center space-x-2 rounded-full bg-brand-deep/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-deep/55">
          <span>Powered by</span>
          <span className="text-brand-deep">AXOREON</span>
        </div>
      </div>
    </footer>
  );
}
