"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, ArrowLeft, Mail, Lock, Eye, EyeOff, User, Shield } from "lucide-react";
import { getErrorMessage, register } from "@/lib/api";
import { normalizeEmail, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, validateSignup, validateEmailField, validatePasswordConfirmation, validatePasswordField } from "@/lib/auth/validation";
import { getAuthPathWithSafeReturn, getVerifyEmailPath } from "@/lib/auth/return-path";
import { completeSuccessfulRegistration, isRecoverableRegistrationError } from "@/lib/auth/registration-recovery";
import { AuthSidebar } from "../components/AuthSidebar";
import { BrandLogo } from "../components/BrandLogo";
import { PasswordRequirements } from "../components/PasswordRequirements";

const authSwitchLinkClass = "rounded-sm font-bold text-brand-deep transition-colors hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30";

function LoginPortalLink() {
  const searchParams = useSearchParams();
  const destination = getAuthPathWithSafeReturn("/login", `?${searchParams.toString()}`);

  return <Link href={destination} className={authSwitchLinkClass}>Log in to portal</Link>;
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [verificationRecoveryPath, setVerificationRecoveryPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const firstNameInlineError = firstNameTouched && !firstName.trim() ? "First name is required." : null;
  const emailInlineError = emailTouched ? validateEmailField(email) : null;
  const passwordInlineError = passwordTouched ? validatePasswordField(password) : null;
  const confirmPasswordInlineError = confirmPasswordTouched ? validatePasswordConfirmation(password, confirmPassword) : null;
  const isFormValid = !validateSignup(email, password, confirmPassword) && !!firstName.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateSignup(email, password, confirmPassword);
    if (validationError) {
      setPasswordTouched(true);
      setConfirmPasswordTouched(true);
      setError(validationError);
      return;
    }
    setError("");
    setVerificationRecoveryPath(null);
    setLoading(true);

    try {
      const normalizedEmail = normalizeEmail(email);
      const response = await register(firstName.trim(), normalizedEmail, password);
      const verificationPath = getVerifyEmailPath(normalizedEmail, window.location.search);
      completeSuccessfulRegistration(response, verificationPath, window.location);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create account. Please try again."));
      if (isRecoverableRegistrationError(err)) {
        setVerificationRecoveryPath(
          getVerifyEmailPath(normalizeEmail(email), window.location.search),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-brand-cream lg:h-[100dvh] lg:flex-row lg:overflow-y-hidden">
      <Link href="/" aria-label="Back to AuditWeave home" className="absolute left-5 top-5 z-50 flex items-center gap-2 rounded-xl border border-brand-deep/10 bg-white/90 px-3 py-2 text-sm font-bold text-brand-deep/70 shadow-sm backdrop-blur-sm transition-colors hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 lg:hidden">
        <ArrowLeft className="h-4 w-4" />
        <BrandLogo size={24} alt="" className="h-6 w-6" priority />
        <span className="font-serif text-base font-black">AuditWeave</span>
      </Link>
      
      {/* Left Sidebar (Hidden on mobile) */}
      <AuthSidebar />

      {/* Right Form Content */}
      <section className="auth-surface relative flex min-h-[100dvh] flex-1 justify-center px-5 py-20 sm:px-8 lg:h-[100dvh] lg:min-h-0 lg:w-1/2 lg:overflow-y-auto lg:px-10 lg:py-16 [@media(max-height:800px)]:lg:py-8">
        {/* Subtle Background Effects */}
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

          <div className="auth-card flex flex-col justify-center rounded-[28px] p-6 sm:p-8 [@media(max-height:800px)]:p-6">
            
            {/* Header - PSYCHOLOGY: Loss Aversion + Social Proof + 5-Second Clarity */}
            <div className="mb-6">
              <div className="auth-kicker mb-4 inline-flex items-center space-x-2 rounded-full border border-brand-green/20 bg-brand-green/10 px-3.5 py-1.5">
                <Shield className="h-3 w-3 text-brand-green" />
                <span className="text-[10px] font-extrabold text-brand-green uppercase tracking-widest">Trusted by 500+ Legal Teams</span>
              </div>
              <h2 className="text-[2.25rem] font-extrabold text-brand-deep tracking-tight leading-tight mb-2">
                Stop Risking Compliance Penalties
              </h2>
              <p className="text-[14px] text-brand-deep/70 font-medium leading-relaxed">
                Start your free 2-audit trial and protect your business from ₹250 Cr DPDP Act violations in under 15 seconds.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 [@media(max-height:800px)]:space-y-4">
              {error && (
                <div role="alert" aria-live="assertive" className="auth-alert rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-600">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                  {verificationRecoveryPath && (
                    <Link
                      href={verificationRecoveryPath}
                      className="mt-2 inline-flex rounded-sm font-bold text-brand-deep underline decoration-brand-green/50 underline-offset-4 transition-colors hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
                    >
                      Continue email verification
                    </Link>
                  )}
                </div>
              )}

              <div className="relative space-y-1.5">
                <label htmlFor="register-first-name" className="block text-[13px] font-bold text-brand-deep">
                  First name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <User className="h-[18px] w-[18px] text-brand-deep/30" />
                  </div>
                  <input
                    id="register-first-name"
                    type="text"
                    name="firstName"
                    autoComplete="given-name"
                    required
                    maxLength={80}
                    value={firstName}
                    onBlur={() => setFirstNameTouched(true)}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setError("");
                    }}
                    aria-invalid={!!firstNameInlineError}
                    aria-describedby={firstNameInlineError ? "register-first-name-error" : undefined}
                    className={`auth-input h-[52px] w-full rounded-xl border ${firstNameInlineError ? 'border-red-400 bg-red-50/50' : 'border-brand-deep/10 bg-brand-cream/50'} pl-11 pr-4 text-[14.5px] font-medium text-brand-deep outline-none transition-all placeholder:text-brand-deep/30 focus:border-brand-green focus:bg-white`}
                    placeholder="Your first name"
                  />
                </div>
                {firstNameInlineError && (
                  <p id="register-first-name-error" className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500"><Shield className="h-3 w-3" aria-hidden="true" /> {firstNameInlineError}</p>
                )}
              </div>

              <div className="space-y-1.5 relative">
                <label htmlFor="register-email" className="text-[13px] font-bold text-brand-deep block">
                  Work email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-[18px] w-[18px] text-brand-deep/30" />
                  </div>
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    aria-invalid={!!emailInlineError}
                    aria-describedby={emailInlineError ? "register-email-error" : undefined}
                    onBlur={() => setEmailTouched(true)}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                      setVerificationRecoveryPath(null);
                    }}
                    className={`auth-input h-[52px] w-full rounded-xl border pl-11 pr-4 ${emailInlineError ? 'border-red-400 bg-red-50/50' : 'border-brand-deep/10 bg-brand-cream/50'} text-[14.5px] font-medium text-brand-deep transition-all placeholder:text-brand-deep/30 focus:border-brand-green focus:bg-white focus:outline-none`}
                    placeholder="you@company.com"
                  />
                </div>
                {emailInlineError && (
                  <p id="register-email-error" className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1"><Shield className="h-3 w-3" aria-hidden="true" /> {emailInlineError}</p>
                )}
              </div>

              <div className="space-y-1.5 relative">
                  <label htmlFor="register-password" className="text-[13px] font-bold text-brand-deep block">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-[18px] w-[18px] text-brand-deep/30" />
                    </div>
                    <input
                      id="register-password"
                      type={passwordVisible ? "text" : "password"}
                      name="password"
                      autoComplete="new-password"
                      required
                      minLength={PASSWORD_MIN_LENGTH}
                      maxLength={PASSWORD_MAX_LENGTH}
                      value={password}
                      aria-invalid={!!passwordInlineError}
                      aria-describedby={passwordInlineError ? "register-password-requirements register-password-error" : "register-password-requirements"}
                      onBlur={() => setPasswordTouched(true)}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      className={`auth-input h-[52px] w-full rounded-xl border pl-11 pr-12 ${passwordInlineError ? 'border-red-400 bg-red-50/50' : 'border-brand-deep/10 bg-brand-cream/50'} text-[14.5px] font-medium text-brand-deep transition-all placeholder:text-brand-deep/30 focus:border-brand-green focus:bg-white focus:outline-none`}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible((visible) => !visible)}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-brand-deep/40 hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green/40"
                      aria-label={passwordVisible ? "Hide passwords" : "Show passwords"}
                    >
                      {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {passwordInlineError && (
                    <p id="register-password-error" className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500"><Shield className="h-3 w-3" aria-hidden="true" /> {passwordInlineError}</p>
                  )}
                  <PasswordRequirements id="register-password-requirements" password={password} />
                </div>

              <div className="space-y-1.5 relative">
                <label htmlFor="register-confirm-password" className="text-[13px] font-bold text-brand-deep block">Confirm password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-[18px] w-[18px] text-brand-deep/30" />
                  </div>
                  <input
                    id="register-confirm-password"
                    type={passwordVisible ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    value={confirmPassword}
                    aria-invalid={!!confirmPasswordInlineError}
                    aria-describedby={confirmPasswordInlineError ? "register-confirm-password-error" : undefined}
                    onBlur={() => setConfirmPasswordTouched(true)}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    className={`auth-input h-[52px] w-full rounded-xl border pl-11 pr-4 ${confirmPasswordInlineError ? 'border-red-400 bg-red-50/50' : 'border-brand-deep/10 bg-brand-cream/50'} text-[14.5px] font-medium text-brand-deep transition-all placeholder:text-brand-deep/30 focus:border-brand-green focus:bg-white focus:outline-none`}
                    placeholder="Re-enter your password"
                  />
                </div>
                {confirmPasswordInlineError && (
                  <p id="register-confirm-password-error" className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1"><Shield className="h-3 w-3" aria-hidden="true" /> {confirmPasswordInlineError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                aria-busy={loading}
                className="auth-primary-button mt-4 flex h-[54px] w-full items-center justify-center space-x-2.5 rounded-xl bg-brand-green text-[15px] font-bold text-white transition-all duration-300 hover:-translate-y-[1px] hover:bg-[#1C5E47] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Start Free Trial — 2 Audits Included</span>
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Text */}
            <div className="mt-8 pt-6 border-t border-brand-deep/5 text-center">
              <p className="text-[12px] text-brand-deep/60 leading-relaxed font-medium">
                By creating an account you agree to our{" "}
                <Link href="/docs/terms" className="rounded-sm font-bold text-brand-deep transition-colors hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/docs/privacy" className="rounded-sm font-bold text-brand-deep transition-colors hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30">
                  Privacy Policy
                </Link>.
              </p>
            </div>

            {/* Links */}
            <div className="mt-6 text-center">
              <p className="text-[13px] font-medium text-brand-deep/60">
                Already have an account?{" "}
                <Suspense fallback={<Link href="/login" className={authSwitchLinkClass}>Log in to portal</Link>}>
                  <LoginPortalLink />
                </Suspense>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
