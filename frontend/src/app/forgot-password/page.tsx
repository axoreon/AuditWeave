"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Mail, Shield } from "lucide-react";
import { getErrorMessage, requestPasswordReset } from "@/lib/api";
import { normalizeEmail, validateEmailField } from "@/lib/auth/validation";
import { AuthSidebar } from "../components/AuthSidebar";
import { BrandLogo } from "../components/BrandLogo";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const emailInlineError = emailTouched ? validateEmailField(email) : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    const validationError = validateEmailField(email);
    if (validationError) {
      setEmailTouched(true);
      setError(validationError);
      return;
    }
    const normalizedEmail = normalizeEmail(email);
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(normalizedEmail);
      router.push(`/reset-password?email=${encodeURIComponent(normalizedEmail)}&requested=1`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Password recovery is unavailable. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-brand-cream lg:h-[100dvh] lg:flex-row lg:overflow-y-hidden">
      <Link href="/" aria-label="Back to AuditWeave home" className="absolute left-5 top-5 z-50 flex items-center gap-2 rounded-xl border border-brand-deep/10 bg-white/90 px-3 py-2 text-sm font-bold text-brand-deep/70 shadow-sm backdrop-blur-sm lg:hidden">
        <ArrowLeft className="h-4 w-4" />
        <BrandLogo size={24} alt="" className="h-6 w-6" priority />
        <span className="font-serif text-base font-black">AuditWeave</span>
      </Link>
      <AuthSidebar />
      <section className="auth-surface relative flex min-h-[100dvh] flex-1 justify-center px-5 py-20 sm:px-8 lg:h-[100dvh] lg:min-h-0 lg:w-1/2 lg:overflow-y-auto lg:px-10 lg:py-16">
        <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-brand-green/5 blur-[100px]" />
        <div className="z-10 mx-auto my-auto w-full max-w-[460px]">
          <div className="auth-card rounded-[28px] p-6 sm:p-8">
            <div className="mb-6">
              <div className="auth-kicker mb-4 inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/10 px-3.5 py-1.5">
                <Shield className="h-3.5 w-3.5 text-brand-green" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-green">Account Recovery</span>
              </div>
              <h1 className="mb-2 text-[2rem] font-extrabold tracking-tight text-brand-deep">Forgot your password?</h1>
              <p className="text-[13px] font-medium leading-5 text-brand-deep/60">
                Enter your account email. If it is eligible, we will send a secure 6-digit reset code.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div role="alert" aria-live="assertive" className="auth-alert flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-600">
                  <Shield className="h-4 w-4 shrink-0" /><span>{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="recovery-email" className="block text-[13px] font-bold text-brand-deep">Email address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-deep/30" />
                  <input id="recovery-email" type="email" autoComplete="email" required value={email} aria-invalid={!!emailInlineError} aria-describedby={emailInlineError ? "recovery-email-error" : undefined} onBlur={() => setEmailTouched(true)} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="you@company.com" className={`auth-input h-14 w-full rounded-xl border ${emailInlineError ? "border-red-400 bg-red-50/50" : "border-brand-deep/10 bg-brand-cream/50"} pl-11 pr-4 text-[14.5px] font-medium text-brand-deep outline-none transition-all placeholder:text-brand-deep/30 focus:border-brand-green focus:bg-white`} />
                </div>
                {emailInlineError && (
                  <p id="recovery-email-error" className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500"><Shield className="h-3 w-3" aria-hidden="true" /> {emailInlineError}</p>
                )}
              </div>
              <button type="submit" disabled={loading} aria-busy={loading} className="auth-primary-button flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-brand-green text-[15px] font-bold text-white transition-all hover:-translate-y-px hover:bg-[#1C5E47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Sending code...</> : <>Continue<ArrowRight className="h-[18px] w-[18px]" /></>}
              </button>
            </form>
            <div className="mt-6 border-t border-brand-deep/5 pt-5 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-deep/60 transition-colors hover:text-brand-green">
                <ArrowLeft className="h-4 w-4" />Back to login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
