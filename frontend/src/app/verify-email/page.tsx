"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2, Mail, RefreshCw, Shield } from "lucide-react";
import { getErrorMessage, resendSignupOtp, verifySignupOtp } from "@/lib/api";
import { AuthSidebar } from "../components/AuthSidebar";
import { BrandLogo } from "../components/BrandLogo";
import { getAuthPathWithSafeReturn } from "@/lib/auth/return-path";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

function maskEmail(email: string): string {
  try {
    const [local, domain] = email.split("@");
    const visible = local.slice(0, 1);
    return `${visible}***@${domain}`;
  } catch {
    return "***";
  }
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read email from query param — never trust it to skip verification, just use it for display/submission.
  const rawEmail = searchParams.get("email") || "";
  // Guard: only accept safe emails (no external redirect smuggling via email)
  const email = rawEmail.includes("@") ? rawEmail.trim().toLowerCase() : "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  // Resend cooldown
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Start cooldown on mount (OTP was just sent on register)
  useEffect(() => {
    startCooldown();
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Redirect to /not-found if no valid email
  useEffect(() => {
    if (!email) {
      router.replace("/register");
    }
  }, [email, router]);

  const otpString = otp.join("");
  const isOtpComplete = otpString.length === OTP_LENGTH && otp.every((d) => /^\d$/.test(d));

  const handleDigitChange = (index: number, value: string) => {
    setError("");
    setResendMessage("");

    // Allow paste of full OTP
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isOtpComplete || loading || !email) return;

    setError("");
    setLoading(true);
    try {
      await verifySignupOtp(email, otpString);
      setVerified(true);
      // Auto-redirect after brief success flash
      setTimeout(() => {
        router.push(getAuthPathWithSafeReturn("/login", window.location.search));
      }, 1400);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Verification failed. Please try again."));
      // Clear the OTP boxes on failure so user can re-enter
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 0);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading || !email) return;
    setResendMessage("");
    setError("");
    setResendLoading(true);
    try {
      await resendSignupOtp(email);
      setResendMessage("If verification is pending for this email, a new code has been sent.");
      setOtp(["", "", "", "", "", ""]);
      startCooldown();
      setTimeout(() => inputRefs.current[0]?.focus(), 0);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not resend. Please try again."));
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-brand-cream lg:h-[100dvh] lg:flex-row lg:overflow-y-hidden">
      <Link
        href="/"
        aria-label="Back to AuditWeave home"
        className="absolute left-5 top-5 z-50 flex items-center gap-2 rounded-xl border border-brand-deep/10 bg-white/90 px-3 py-2 text-sm font-bold text-brand-deep/70 shadow-sm backdrop-blur-sm transition-colors hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        <BrandLogo size={24} alt="" className="h-6 w-6" priority />
        <span className="font-serif text-base font-black">AuditWeave</span>
      </Link>

      {/* Left Sidebar */}
      <AuthSidebar />

      {/* Right Form Content */}
      <section className="auth-surface relative flex min-h-[100dvh] flex-1 justify-center px-5 py-20 sm:px-8 lg:h-[100dvh] lg:min-h-0 lg:w-1/2 lg:overflow-y-auto lg:px-10 lg:py-16">
        {/* Background blurs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-green/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-deep/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="z-10 mx-auto my-auto flex w-full max-w-[460px] flex-col">
          <Link
            href="/"
            className="mb-3 hidden items-center self-end rounded-lg px-1 py-1 text-[13px] font-bold text-brand-deep/50 transition-colors hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 lg:flex"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            <span>Back to Home</span>
          </Link>

          <div className="auth-card flex flex-col justify-center rounded-[28px] p-6 sm:p-8">

            {verified ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10">
                  <CheckCircle className="h-8 w-8 text-brand-green" />
                </div>
                <h1 className="mb-2 text-2xl font-extrabold text-brand-deep">Email verified!</h1>
                <p className="text-[14px] text-brand-deep/60">
                  Your account is now active. Redirecting you to log in…
                </p>
                <Loader2 className="mt-6 h-5 w-5 animate-spin text-brand-green" />
              </div>
            ) : (
              /* ── Verification form ── */
              <>
                {/* Header */}
                <div className="mb-6">
                  <div className="auth-kicker mb-4 inline-flex items-center space-x-2 rounded-full border border-brand-green/20 bg-brand-green/10 px-3.5 py-1.5">
                    <Mail className="h-3.5 w-3.5 text-brand-green" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-green">
                      Email Verification
                    </span>
                  </div>
                  <h1 className="mb-1 text-[2rem] font-extrabold leading-tight tracking-tight text-brand-deep">
                    Check your inbox
                  </h1>
                  <p className="text-[13px] font-medium text-brand-deep/60">
                    We sent a 6-digit code to{" "}
                    <span className="font-bold text-brand-deep">{maskEmail(email)}</span>.
                    {" "}Enter it below to verify your account.
                  </p>
                </div>

                <form id="verify-otp-form" onSubmit={handleSubmit} noValidate>
                  {/* Error banner */}
                  {error && (
                    <div
                      role="alert"
                      aria-live="assertive"
                      className="auth-alert mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-600"
                    >
                      <Shield className="h-4 w-4 shrink-0 text-red-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Resend success */}
                  {resendMessage && !error && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="auth-alert mb-4 flex items-center gap-2 rounded-xl border border-brand-green/20 bg-brand-green/8 p-3.5 text-sm font-semibold text-brand-green"
                    >
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>{resendMessage}</span>
                    </div>
                  )}

                  {/* 6-digit OTP input */}
                  <div className="mb-6">
                    <label className="mb-3 block text-[13px] font-bold text-brand-deep">
                      Verification code
                    </label>
                    <div
                      className="flex justify-between gap-2"
                      role="group"
                      aria-label="6-digit verification code"
                    >
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-digit-${index + 1}`}
                          ref={(el) => { inputRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={digit}
                          autoFocus={index === 0}
                          autoComplete={index === 0 ? "one-time-code" : "off"}
                          aria-label={`Digit ${index + 1} of 6`}
                          aria-invalid={!!error}
                          onChange={(e) => handleDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={(e) => {
                            e.preventDefault();
                            handleDigitChange(index, e.clipboardData.getData("text"));
                          }}
                          disabled={loading || verified}
                          className={`auth-input h-14 w-full rounded-xl border-2 text-center text-[22px] font-black tracking-widest text-brand-deep outline-none transition-all
                            ${error
                              ? "border-red-400 bg-red-50/60"
                              : digit
                                ? "border-brand-green bg-brand-green/5"
                                : "border-brand-deep/10 bg-brand-cream/40"
                            }
                            focus:border-brand-green focus:bg-white
                            disabled:cursor-not-allowed disabled:opacity-60`}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] font-medium text-brand-deep/50">
                      Code expires in 10 minutes. Enter all 6 digits, then select Verify Email.
                    </p>
                  </div>

                  {/* Verify button */}
                  <button
                    id="verify-otp-submit"
                    type="submit"
                    disabled={loading || !isOtpComplete}
                    aria-busy={loading}
                    className="auth-primary-button flex h-[54px] w-full items-center justify-center space-x-2.5 rounded-xl bg-brand-green text-[15px] font-bold text-white transition-all duration-300 hover:-translate-y-[1px] hover:bg-[#1C5E47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying…</span>
                      </>
                    ) : (
                      <span>Verify Email</span>
                    )}
                  </button>
                </form>

                {/* Resend section */}
                <div className="mt-6 border-t border-brand-deep/5 pt-5 text-center">
                  <p className="text-[13px] font-medium text-brand-deep/60">
                    Didn&apos;t receive a code?
                  </p>
                  <button
                    id="resend-otp-btn"
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || resendLoading}
                    aria-disabled={cooldown > 0 || resendLoading}
                    className="mt-1.5 inline-flex items-center gap-1.5 rounded-sm text-[13px] font-bold text-brand-deep transition-colors hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resendLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    {cooldown > 0
                      ? `Resend code in ${cooldown}s`
                      : "Resend code"}
                  </button>
                </div>

                {/* Link back to signup */}
                <div className="mt-4 text-center">
                  <Link
                    href="/register"
                    className="text-[12px] font-medium text-brand-deep/50 transition-colors hover:text-brand-deep"
                  >
                    ← Use a different email address
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[100dvh] items-center justify-center bg-brand-cream">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
