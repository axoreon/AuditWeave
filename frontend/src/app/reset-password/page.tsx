"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Eye, EyeOff, Loader2, Lock, Mail, RefreshCw, Shield } from "lucide-react";
import { completePasswordReset, getErrorMessage, requestPasswordReset, verifyPasswordResetOtp } from "@/lib/api";
import { normalizeEmail, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, validateEmailField, validatePasswordConfirmation, validatePasswordField } from "@/lib/auth/validation";
import { AuthSidebar } from "../components/AuthSidebar";
import { BrandLogo } from "../components/BrandLogo";
import { PasswordRequirements } from "../components/PasswordRequirements";

const RESEND_SECONDS = 60;
const GENERIC_RESET_REQUEST_MESSAGE = "If an account exists for this email, we've sent a 6-digit reset code.";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return local && domain ? `${local[0]}***@${domain}` : "***";
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawEmail = searchParams.get("email") || "";
  const email = validateEmailField(rawEmail) ? "" : normalizeEmail(rawEmail);
  const requestJustSubmitted = searchParams.get("requested") === "1";
  const [step, setStep] = useState<"otp" | "password" | "success">("otp");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmationTouched, setConfirmationTouched] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(requestJustSubmitted ? GENERIC_RESET_REQUEST_MESSAGE : "");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  const passwordInlineError = passwordTouched ? validatePasswordField(password) : null;
  const confirmationInlineError = confirmationTouched ? validatePasswordConfirmation(password, confirmation) : null;
  const isPasswordFormValid = !validatePasswordField(password) && !validatePasswordConfirmation(password, confirmation);

  useEffect(() => {
    if (!email) router.replace("/forgot-password");
  }, [email, router]);

  useEffect(() => {
    if (step !== "otp" || cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown, step]);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the complete 6-digit reset code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await verifyPasswordResetOtp(email, otp);
      setResetToken(response.reset_token);
      setStep("password");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not verify the reset code."));
      setOtp("");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || loading) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setMessage(GENERIC_RESET_REQUEST_MESSAGE);
      setOtp("");
      setCooldown(RESEND_SECONDS);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not request a new code."));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    const passwordError = validatePasswordField(password);
    if (passwordError) {
      setPasswordTouched(true);
      setError(passwordError);
      return;
    }
    const confirmationError = validatePasswordConfirmation(password, confirmation);
    if (confirmationError) {
      setConfirmationTouched(true);
      setError(confirmationError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await completePasswordReset(email, resetToken, password);
      setResetToken("");
      setPassword("");
      setConfirmation("");
      setStep("success");
      window.setTimeout(() => router.replace("/login"), 1600);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not update your password."));
    } finally {
      setLoading(false);
    }
  }

  if (!email) return null;

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
            {step === "success" ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10">
                  <CheckCircle className="h-8 w-8 text-brand-green" />
                </div>
                <h1 className="mb-2 text-2xl font-extrabold text-brand-deep">Password updated</h1>
                <p className="text-[14px] text-brand-deep/60">Redirecting you to the normal login page...</p>
                <Loader2 className="mt-6 h-5 w-5 animate-spin text-brand-green" />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="auth-kicker mb-4 inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/10 px-3.5 py-1.5">
                    {step === "otp" ? <Mail className="h-3.5 w-3.5 text-brand-green" /> : <Lock className="h-3.5 w-3.5 text-brand-green" />}
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-green">Secure Password Reset</span>
                  </div>
                  <h1 className="mb-2 text-[2rem] font-extrabold tracking-tight text-brand-deep">
                    {step === "otp" ? "Check your inbox" : "Choose a new password"}
                  </h1>
                  <p className="text-[13px] font-medium leading-5 text-brand-deep/60">
                    {step === "otp"
                      ? <>If an account exists, enter the 6-digit code for <strong className="text-brand-deep">{maskEmail(email)}</strong>.</>
                      : "Create a strong password you do not use elsewhere. Your new password is never sent by email."}
                  </p>
                </div>
                {error && (
                  <div role="alert" aria-live="assertive" className="auth-alert mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-600">
                    <Shield className="h-4 w-4 shrink-0" /><span>{error}</span>
                  </div>
                )}
                {message && !error && (
                  <div role="status" aria-live="polite" className="auth-alert mb-4 flex items-center gap-2 rounded-xl border border-brand-green/20 bg-brand-green/5 p-3.5 text-sm font-semibold text-brand-green">
                    <CheckCircle className="h-4 w-4 shrink-0" /><span>{message}</span>
                  </div>
                )}
                {step === "otp" ? (
                  <form onSubmit={handleVerify} className="space-y-5">
                    <div className="space-y-1.5">
                      <label htmlFor="reset-otp" className="block text-[13px] font-bold text-brand-deep">Password reset code</label>
                      <input id="reset-otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} placeholder="000000" className="auth-input h-16 w-full rounded-xl border-2 border-brand-deep/10 bg-brand-cream/50 text-center text-2xl font-black tracking-[0.45em] text-brand-deep outline-none transition-all focus:border-brand-green focus:bg-white" />
                    </div>
                    <button type="submit" disabled={loading || otp.length !== 6} className="auth-primary-button flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-green text-[15px] font-bold text-white transition-all hover:-translate-y-px hover:bg-[#1C5E47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying...</> : "Verify code"}
                    </button>
                    <div className="border-t border-brand-deep/5 pt-5 text-center">
                      <button type="button" onClick={handleResend} disabled={loading || cooldown > 0} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-deep transition-colors hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-50">
                        <RefreshCw className="h-3.5 w-3.5" />{cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleReset} className="space-y-5">
                    <div className="space-y-1.5">
                      <label htmlFor="new-password" className="block text-[13px] font-bold text-brand-deep">New password</label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-deep/30" />
                        <input id="new-password" type={passwordVisible ? "text" : "password"} autoComplete="new-password" required minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} value={password} aria-invalid={!!passwordInlineError} aria-describedby={passwordInlineError ? "reset-password-requirements reset-password-error" : "reset-password-requirements"} onBlur={() => setPasswordTouched(true)} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="Create a strong password" className={`auth-input h-14 w-full rounded-xl border ${passwordInlineError ? "border-red-400 bg-red-50/50" : "border-brand-deep/10 bg-brand-cream/50"} pl-11 pr-12 text-[14.5px] font-medium text-brand-deep outline-none transition-all placeholder:text-brand-deep/30 focus:border-brand-green focus:bg-white`} />
                        <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-brand-deep/40 hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green/40">
                          {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordInlineError && (
                        <p id="reset-password-error" className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500"><Shield className="h-3 w-3" aria-hidden="true" /> {passwordInlineError}</p>
                      )}
                      <PasswordRequirements id="reset-password-requirements" password={password} />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="confirm-password" className="block text-[13px] font-bold text-brand-deep">Confirm new password</label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-deep/30" />
                        <input id="confirm-password" type={passwordVisible ? "text" : "password"} autoComplete="new-password" required minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} value={confirmation} aria-invalid={!!confirmationInlineError} aria-describedby={confirmationInlineError ? "reset-confirmation-error" : undefined} onBlur={() => setConfirmationTouched(true)} onChange={(event) => { setConfirmation(event.target.value); setError(""); }} placeholder="Re-enter your new password" className={`auth-input h-14 w-full rounded-xl border ${confirmationInlineError ? "border-red-400 bg-red-50/50" : "border-brand-deep/10 bg-brand-cream/50"} pl-11 pr-4 text-[14.5px] font-medium text-brand-deep outline-none transition-all placeholder:text-brand-deep/30 focus:border-brand-green focus:bg-white`} />
                      </div>
                      {confirmationInlineError && (
                        <p id="reset-confirmation-error" className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500"><Shield className="h-3 w-3" aria-hidden="true" /> {confirmationInlineError}</p>
                      )}
                    </div>
                    <button type="submit" disabled={loading || !isPasswordFormValid} aria-busy={loading} className="auth-primary-button flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-green text-[15px] font-bold text-white transition-all hover:-translate-y-px hover:bg-[#1C5E47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Updating password...</> : "Update password"}
                    </button>
                  </form>
                )}
                <div className="mt-5 text-center">
                  <Link href="/login" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-deep/50 hover:text-brand-deep">
                    <ArrowLeft className="h-3.5 w-3.5" />Back to login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[100dvh] items-center justify-center bg-brand-cream">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
