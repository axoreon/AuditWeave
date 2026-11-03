import Link from "next/link";
import { ArrowLeft, FileWarning } from "lucide-react";

export default function TermsPlaceholderPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-5 py-12 text-brand-deep sm:px-8">
      <main className="w-full max-w-2xl rounded-[28px] border border-brand-deep/10 bg-white p-7 shadow-[0_18px_60px_rgba(13,58,53,0.08)] sm:p-10">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <FileWarning className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-green">
          AuditWeave legal
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Terms of Service</h1>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm font-medium leading-7 text-brand-deep/75">
          <p>
            Approved Terms of Service content has not yet been supplied for this application.
            The project owner must provide and approve the legal text before production use.
          </p>
          <p className="mt-3 font-bold text-brand-deep">
            This is an informational placeholder, not an approved legal agreement.
          </p>
        </div>
        <Link
          href="/register"
          className="mt-7 inline-flex items-center gap-2 rounded-xl border border-brand-deep/10 px-4 py-2.5 text-sm font-bold transition hover:border-brand-green/30 hover:bg-brand-green/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Return to registration
        </Link>
      </main>
    </div>
  );
}
