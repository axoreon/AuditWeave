"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Coins,
  Download,
  IndianRupee,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  createPaymentOrder,
  downloadPaymentReceipt,
  getCreditActivity,
  getCreditPlans,
  getCreditSummary,
  getCurrentUser,
  getErrorMessage,
  getPaymentHistory,
  isAuthenticated,
  verifyPaymentSignature,
} from "@/lib/api";
import type {
  CreditActivityFilter,
  CreditActivityItem,
  CreditPlan,
  CreditSummary,
  PaginatedResponse,
  PaymentHistoryItem,
  PaymentStatusFilter,
} from "@/lib/api";
import { notifyAuthSessionChanged } from "@/lib/auth/session";

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error: { description: string };
}

const EMPTY_ACTIVITY: PaginatedResponse<CreditActivityItem> = {
  items: [], page: 1, page_size: 10, total: 0, total_pages: 0,
};
const EMPTY_PAYMENTS: PaginatedResponse<PaymentHistoryItem> = {
  items: [], page: 1, page_size: 10, total: 0, total_pages: 0,
};

const ACTIVITY_FILTER_OPTIONS: { value: CreditActivityFilter; label: string }[] = [
  { value: "all", label: "All activity" },
  { value: "purchases", label: "Purchases" },
  { value: "usage", label: "Usage" },
  { value: "bonuses", label: "Bonuses" },
];

const PAYMENT_FILTER_OPTIONS: { value: PaymentStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "verified", label: "Paid" },
  { value: "created", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
];

function FilterDropdown<T extends string>({ value, options, onChange, ariaLabel }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full sm:w-44">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-brand-deep/10 bg-white px-4 text-sm font-semibold text-brand-deep outline-none transition hover:border-brand-green/50 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
      >
        <span>{selected.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="listbox" aria-label={ariaLabel} className="absolute right-0 z-30 mt-2 max-h-64 w-full min-w-44 overflow-y-auto rounded-xl border border-brand-deep/10 bg-white p-1.5 shadow-xl shadow-brand-deep/10">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`flex w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${option.value === value ? "bg-brand-green text-white" : "text-brand-deep hover:bg-brand-cream"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "â€”";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(value));
}

function formatMoney(amountPaise: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(amountPaise / 100);
}

function activityLabel(item: CreditActivityItem): string {
  if (item.transaction_type === "welcome_bonus") return "Welcome Credits";
  if (item.transaction_type === "purchase") return item.description || "Credit Purchase";
  if (item.transaction_type === "audit_usage") return "Policy Audit";
  return item.description || "Credit Adjustment";
}

function activityReference(item: CreditActivityItem): string {
  if (item.reference_type === "signup") return "Signup";
  if (item.reference_type === "audit" && item.reference_id) return `Audit #${item.reference_id}`;
  return item.reference_id || "â€”";
}

function paymentStatus(status: string): { label: string; className: string } {
  const statuses: Record<string, { label: string; className: string }> = {
    verified: { label: "Paid", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    created: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
    processing: { label: "Processing", className: "bg-blue-50 text-blue-700 border-blue-200" },
    failed: { label: "Failed", className: "bg-red-50 text-red-700 border-red-200" },
  };
  return statuses[status] || { label: "Unknown", className: "bg-gray-50 text-gray-600 border-gray-200" };
}

function Pagination({ page, totalPages, onPageChange }: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const displayedTotal = Math.max(totalPages, 1);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-deep/10 px-5 py-4">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-lg border border-brand-deep/10 bg-white px-3 py-2 text-xs font-bold text-brand-deep transition hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" /> Previous
      </button>
      <span className="text-xs font-semibold text-brand-deep/60">Page {page} of {displayedTotal}</span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={totalPages === 0 || page >= totalPages}
        className="inline-flex items-center gap-1 rounded-lg border border-brand-deep/10 bg-white px-3 py-2 text-xs font-bold text-brand-deep transition hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function BillingPage() {
  const [hasPlanAccess, setHasPlanAccess] = useState<boolean | null>(null);
  const [firstName, setFirstName] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [receiptLoadingId, setReceiptLoadingId] = useState<number | null>(null);
  const [pricingTiers, setPricingTiers] = useState<CreditPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [summary, setSummary] = useState<CreditSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [activity, setActivity] = useState(EMPTY_ACTIVITY);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityQuery, setActivityQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState<CreditActivityFilter>("all");
  const [payments, setPayments] = useState(EMPTY_PAYMENTS);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentQuery, setPaymentQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatusFilter>("all");
  const [refreshVersion, setRefreshVersion] = useState(0);

  const refreshBilling = useCallback(() => {
    setError("");
    setSuccessMessage("");
    setPlansLoading(true);
    setSummaryLoading(true);
    setActivityLoading(true);
    setPaymentsLoading(true);
    setRefreshVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getCurrentUser()
      .then((profile) => {
        if (!cancelled) {
          setFirstName(profile.first_name?.trim() || "");
          setHasPlanAccess(profile.has_plan_access);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setHasPlanAccess(false);
          setError(getErrorMessage(err, "Unable to confirm account access."));
        }
      });
    return () => { cancelled = true; };
  }, [refreshVersion]);

  useEffect(() => {
    let cancelled = false;
    void getCreditPlans()
      .then((plans) => { if (!cancelled) setPricingTiers(plans); })
      .catch((err: unknown) => { if (!cancelled) setError(getErrorMessage(err, "Unable to load credit plans.")); })
      .finally(() => { if (!cancelled) setPlansLoading(false); });
    return () => { cancelled = true; };
  }, [refreshVersion]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActivityPage(1);
      setActivityLoading(true);
      setActivityQuery(activitySearch.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [activitySearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPaymentPage(1);
      setPaymentsLoading(true);
      setPaymentQuery(paymentSearch.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [paymentSearch]);

  useEffect(() => {
    let cancelled = false;
    void getCreditSummary()
      .then((value) => { if (!cancelled) setSummary(value); })
      .catch((err: unknown) => { if (!cancelled) setError(getErrorMessage(err, "Unable to load billing summary.")); })
      .finally(() => { if (!cancelled) setSummaryLoading(false); });
    return () => { cancelled = true; };
  }, [refreshVersion]);

  useEffect(() => {
    let cancelled = false;
    void getCreditActivity({ page: activityPage, search: activityQuery, typeFilter: activityFilter })
      .then((value) => {
        if (!cancelled) setActivity(value ?? EMPTY_ACTIVITY);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setActivity(EMPTY_ACTIVITY);
          setError(getErrorMessage(err, "Unable to load credit activity."));
        }
      })
      .finally(() => { if (!cancelled) setActivityLoading(false); });
    return () => { cancelled = true; };
  }, [activityFilter, activityPage, activityQuery, refreshVersion]);

  useEffect(() => {
    let cancelled = false;
    void getPaymentHistory({ page: paymentPage, search: paymentQuery, statusFilter: paymentFilter })
      .then((value) => {
        if (!cancelled) setPayments(value ?? EMPTY_PAYMENTS);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setPayments(EMPTY_PAYMENTS);
          setError(getErrorMessage(err, "Unable to load payment history."));
        }
      })
      .finally(() => { if (!cancelled) setPaymentsLoading(false); });
    return () => { cancelled = true; };
  }, [paymentFilter, paymentPage, paymentQuery, refreshVersion]);

  const handlePurchase = async (tier: CreditPlan) => {
    if (!isAuthenticated()) return;
    setLoadingId(tier.id);
    setError("");
    setSuccessMessage("");

    try {
      const orderData = await createPaymentOrder(tier.id);
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AuditWeave",
        description: `${tier.credits} one-time credits`,
        order_id: orderData.id,
        handler: async function (response: RazorpaySuccessResponse) {
          try {
            const verification = await verifyPaymentSignature(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
            );
            setActivitySearch("");
            setActivityQuery("");
            setActivityFilter("all");
            setActivityPage(1);
            setPaymentSearch("");
            setPaymentQuery("");
            setPaymentFilter("all");
            setPaymentPage(1);
            notifyAuthSessionChanged();
            refreshBilling();
            if (verification.receipt_email_status === "sent") {
              setSuccessMessage(`Payment successful. ${tier.credits} credits added. Receipt emailed to your registered email.`);
            } else if (verification.receipt_email_status === "failed") {
              setSuccessMessage(`Payment successful. ${tier.credits} credits added. Your receipt is available below. Email delivery failed; your payment was not affected.`);
            } else if (verification.receipt_available) {
              setSuccessMessage(`Payment successful. ${tier.credits} credits added. Your receipt is available below; email delivery is pending.`);
            } else {
              setSuccessMessage(`Payment successful. ${tier.credits} credits added.`);
            }
            setSuccessId(tier.id);
            setLoadingId(null);
            window.setTimeout(() => setSuccessId(null), 2500);
          } catch (err: unknown) {
            setError(getErrorMessage(err, "Payment verification failed."));
            setLoadingId(null);
          }
        },
        prefill: { name: "User" },
        theme: { color: "#276152" },
        modal: { ondismiss: () => setLoadingId(null) },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response: RazorpayFailureResponse) => {
        setError(`Payment failed: ${response.error.description}`);
        setLoadingId(null);
      });
      razorpay.open();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Something went wrong during checkout."));
      setLoadingId(null);
    }
  };

  const changeActivityPage = (page: number) => {
    setActivityLoading(true);
    setActivityPage(page);
  };
  const changePaymentPage = (page: number) => {
    setPaymentsLoading(true);
    setPaymentPage(page);
  };

  const handleReceiptDownload = async (item: PaymentHistoryItem) => {
    if (!item.receipt_available || !item.receipt_number) return;
    setReceiptLoadingId(item.id);
    setError("");
    try {
      await downloadPaymentReceipt(item.receipt_number);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to download this receipt."));
    } finally {
      setReceiptLoadingId(null);
    }
  };

  if (hasPlanAccess === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-deep/60">
          <Loader2 className="h-5 w-5 animate-spin" /> Preparing your account...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1400px] space-y-12 p-5 sm:p-7 lg:p-12">
      {hasPlanAccess ? (
        <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-green">One-time credit packs</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-brand-deep md:text-5xl">Credits &amp; Billing</h1>
            <p className="text-sm font-medium leading-6 text-brand-deep/65 sm:text-base">
              Track recorded credit activity and top up whenever you need another policy audit. No subscription or automatic renewal.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshBilling}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-brand-deep/10 bg-white px-4 py-2.5 text-xs font-bold text-brand-deep shadow-sm transition hover:bg-brand-cream"
          >
            <RefreshCw className="h-4 w-4" /> Refresh billing
          </button>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-[32px] border border-brand-green/20 bg-brand-deep px-6 py-8 text-white shadow-2xl shadow-brand-deep/10 sm:px-9 sm:py-10 lg:px-12">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-brand-green/30" />
          <div className="pointer-events-none absolute -right-4 top-12 h-44 w-44 rounded-full border border-brand-green/20" />
          <div className="relative z-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/15 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#74D2B1]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Account verified
                </div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  Hello{firstName ? `, ${firstName}` : ""}. Welcome to AuditWeave.
                </h1>
                <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-white/70 sm:text-base">
                  Your account is ready. Choose any one-time credit pack below to unlock your dashboard and start your first compliance audit.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Home
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["1", "Choose a pack", "Select the credit pack that fits your audit needs."],
                ["2", "Complete payment", "Pay once through Razorpay. There is no automatic renewal."],
                ["3", "Unlock your workspace", "Your dashboard opens immediately after payment verification."],
              ].map(([number, title, description]) => (
                <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green text-xs font-black text-white">{number}</div>
                  <p className="mt-3 text-sm font-extrabold">{title}</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-white/60">{description}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#74D2B1]/25 bg-[#74D2B1]/10 px-4 py-3 text-xs font-semibold leading-5 text-white/75">
              <Coins className="mt-0.5 h-4 w-4 shrink-0 text-[#74D2B1]" />
              <p>Your 2 welcome credits are already saved. Your first verified pack purchase activates the workspace, and those welcome credits remain in your balance.</p>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => { setError(""); refreshBilling(); }} className="text-xs font-black uppercase tracking-wide hover:underline">Retry</button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {hasPlanAccess && <section aria-label="Credit summary" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {summaryLoading || !summary ? (
            ["Available Credits", "Recorded Purchased", "Recorded Used"].map((label) => (
              <div key={label} className="h-36 animate-pulse rounded-3xl border border-brand-deep/10 bg-white p-6">
                <span className="text-xs font-black uppercase tracking-wider text-brand-deep/40">{label}</span>
              </div>
            ))
          ) : (
            <>
              <div className="rounded-3xl bg-brand-deep p-6 text-white shadow-xl shadow-brand-deep/10">
                <div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wider text-white/60">Available Credits</span><Coins className="h-6 w-6 text-brand-green" /></div>
                <p className="mt-5 text-4xl font-black">{summary.available_credits} <span className="text-base font-bold text-white/55">Credits</span></p>
              </div>
              <div className="rounded-3xl border border-brand-deep/10 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wider text-brand-deep/55">Recorded Purchased</span><ArrowUpCircle className="h-6 w-6 text-brand-green" /></div>
                <p className="mt-5 text-4xl font-black text-brand-deep">{summary.recorded_purchased_credits} <span className="text-base font-bold text-brand-deep/45">Credits</span></p>
              </div>
              <div className="rounded-3xl border border-brand-deep/10 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wider text-brand-deep/55">Recorded Used</span><ArrowDownCircle className="h-6 w-6 text-orange-500" /></div>
                <p className="mt-5 text-4xl font-black text-brand-deep">{summary.recorded_used_credits} <span className="text-base font-bold text-brand-deep/45">Credits</span></p>
              </div>
            </>
          )}
        </div>
        {summary && !summaryLoading && (
          <>
            <p className="text-xs font-medium text-brand-deep/55">
              Recorded totals reflect available ledger activity only{summary.has_incomplete_history ? "; legacy balance history may be incomplete." : "."}
            </p>
            {summary.available_credits <= 2 && (
              <div className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${summary.available_credits === 0 ? "border-orange-200 bg-orange-50" : "border-brand-green/20 bg-brand-green/5"}`}>
                <div>
                  <p className="text-sm font-extrabold text-brand-deep">{summary.available_credits === 0 ? "You're out of credits." : "Running low on credits?"}</p>
                  <p className="mt-1 text-xs font-medium text-brand-deep/60">Top up to run another policy audit.</p>
                </div>
                <a href="#credit-packs" className="inline-flex w-fit items-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-white hover:bg-[#2a6d57]">{summary.available_credits === 0 ? "Buy Credits" : "Top Up"}<ChevronRight className="h-4 w-4" /></a>
              </div>
            )}
          </>
        )}
      </section>}

      <section id="credit-packs" className="scroll-mt-24 space-y-7">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-green">{hasPlanAccess ? "Top up" : "Get started"}</p>
          <h2 className="mt-2 text-2xl font-extrabold text-brand-deep">{hasPlanAccess ? "Choose a Credit Pack" : "Choose your first credit pack"}</h2>
          {!hasPlanAccess && <p className="mt-2 text-sm font-medium text-brand-deep/60">One verified purchase unlocks your AuditWeave workspace. Your credits never renew automatically.</p>}
        </div>
        {plansLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-brand-deep/60"><Loader2 className="h-5 w-5 animate-spin" /> Loading credit packs...</div>
        ) : pricingTiers.length === 0 ? (
          <div className="rounded-3xl border border-brand-deep/10 bg-white px-6 py-12 text-center text-sm font-bold text-brand-deep/60">
            No credit packs are currently available.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <article key={tier.id} className={`relative flex flex-col rounded-3xl bg-white p-7 transition ${tier.popular ? "border-2 border-brand-green shadow-xl shadow-brand-green/10" : "border border-brand-deep/10 shadow-sm hover:shadow-lg"}`}>
                {tier.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-green px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white"><Sparkles className="mr-1 inline h-3 w-3" /> Most Popular</div>}
                <h3 className="text-xl font-extrabold text-brand-deep">{tier.title}</h3>
                <p className="mt-2 min-h-10 text-xs font-medium leading-5 text-brand-deep/60">{tier.description}</p>
                <div className="my-6 flex items-end gap-1 text-brand-deep"><IndianRupee className="mb-1 h-7 w-7" /><span className="text-4xl font-black">{tier.price_inr}</span><span className="mb-1 text-xs font-bold text-brand-deep/45">one-time</span></div>
                <ul className="mb-7 flex-1 space-y-3">{tier.features.map((feature) => <li key={feature} className="flex gap-2 text-sm font-semibold text-brand-deep/75"><CheckCircle2 className="h-5 w-5 shrink-0 text-brand-green" />{feature}</li>)}</ul>
                <button
                  type="button"
                  onClick={() => handlePurchase(tier)}
                  disabled={loadingId !== null}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${tier.popular ? "bg-brand-green text-white hover:bg-[#2a6d57]" : "bg-brand-cream text-brand-deep hover:bg-brand-deep/10"}`}
                >
                  {successId === tier.id ? <><CheckCircle2 className="h-5 w-5" /> Payment Successful</> : loadingId === tier.id ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</> : <><Zap className="h-4 w-4" />{hasPlanAccess ? "Top Up" : "Buy & Unlock"}</>}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {hasPlanAccess && <><section className="space-y-5">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-brand-green">Ledger</p><h2 className="mt-2 text-2xl font-extrabold text-brand-deep">Credit Activity</h2></div>
        <div className="rounded-3xl border border-brand-deep/10 bg-white shadow-sm">
          <div className="relative z-20 flex flex-col gap-3 rounded-t-3xl border-b border-brand-deep/10 bg-white p-5 sm:flex-row">
            <label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-deep/40" /><span className="sr-only">Search credit activity</span><input value={activitySearch} onChange={(event) => setActivitySearch(event.target.value)} placeholder="Search activity or reference" className="h-11 w-full rounded-xl border border-brand-deep/10 bg-brand-cream/50 pl-10 pr-3 text-sm outline-none focus:border-brand-green" /></label>
            <FilterDropdown
              value={activityFilter}
              options={ACTIVITY_FILTER_OPTIONS}
              ariaLabel="Filter credit activity"
              onChange={(value) => { setActivityFilter(value); setActivityPage(1); setActivityLoading(true); }}
            />
          </div>
          {activityLoading ? <div className="flex items-center justify-center gap-2 py-14 text-sm font-semibold text-brand-deep/50"><Loader2 className="h-5 w-5 animate-spin" /> Loading activity...</div> : activity.items.length === 0 ? <div className="px-5 py-14 text-center"><CircleDollarSign className="mx-auto h-8 w-8 text-brand-deep/25" /><p className="mt-3 text-sm font-bold text-brand-deep">{activityQuery || activityFilter !== "all" ? "No matching records found." : "No recorded credit activity yet."}</p></div> : (
            <div className="overflow-x-auto"><table className="min-w-[720px] w-full text-left"><thead className="bg-brand-cream/60 text-[10px] font-black uppercase tracking-wider text-brand-deep/45"><tr><th className="px-5 py-3">#</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Activity</th><th className="px-5 py-3">Reference</th><th className="px-5 py-3 text-right">Credits</th><th className="px-5 py-3 text-right">Balance</th></tr></thead><tbody className="divide-y divide-brand-deep/5">{activity.items.map((item, index) => <tr key={item.id} className="text-sm"><td className="px-5 py-4 font-bold text-brand-deep/45">{(activity.page - 1) * activity.page_size + index + 1}</td><td className="whitespace-nowrap px-5 py-4 font-medium text-brand-deep/60">{formatDate(item.created_at)}</td><td className="px-5 py-4 font-bold text-brand-deep">{activityLabel(item)}</td><td className="px-5 py-4 font-mono text-xs text-brand-deep/55">{activityReference(item)}</td><td className={`px-5 py-4 text-right font-black ${item.amount > 0 ? "text-brand-green" : "text-orange-600"}`}>{item.amount > 0 ? "+" : ""}{item.amount}</td><td className="px-5 py-4 text-right font-bold text-brand-deep">{item.balance_after ?? "â€”"}</td></tr>)}</tbody></table></div>
          )}
          <Pagination page={activity.page} totalPages={activity.total_pages} onPageChange={changeActivityPage} />
        </div>
      </section>

      <section className="space-y-5">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-brand-green">Payments</p><h2 className="mt-2 text-2xl font-extrabold text-brand-deep">Payment History</h2></div>
        <div className="rounded-3xl border border-brand-deep/10 bg-white shadow-sm">
          <div className="relative z-20 flex flex-col gap-3 rounded-t-3xl border-b border-brand-deep/10 bg-white p-5 sm:flex-row">
            <label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-deep/40" /><span className="sr-only">Search payments</span><input value={paymentSearch} onChange={(event) => setPaymentSearch(event.target.value)} placeholder="Search pack, status, or reference" className="h-11 w-full rounded-xl border border-brand-deep/10 bg-brand-cream/50 pl-10 pr-3 text-sm outline-none focus:border-brand-green" /></label>
            <FilterDropdown
              value={paymentFilter}
              options={PAYMENT_FILTER_OPTIONS}
              ariaLabel="Filter payment status"
              onChange={(value) => { setPaymentFilter(value); setPaymentPage(1); setPaymentsLoading(true); }}
            />
          </div>
          {paymentsLoading ? <div className="flex items-center justify-center gap-2 py-14 text-sm font-semibold text-brand-deep/50"><Loader2 className="h-5 w-5 animate-spin" /> Loading payments...</div> : payments.items.length === 0 ? <div className="px-5 py-14 text-center"><CircleDollarSign className="mx-auto h-8 w-8 text-brand-deep/25" /><p className="mt-3 text-sm font-bold text-brand-deep">{paymentQuery || paymentFilter !== "all" ? "No matching records found." : "No payments recorded yet."}</p></div> : (
            <div className="overflow-x-auto"><table className="min-w-[1000px] w-full text-left"><thead className="bg-brand-cream/60 text-[10px] font-black uppercase tracking-wider text-brand-deep/45"><tr><th className="px-5 py-3">#</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Pack</th><th className="px-5 py-3">Payment Reference</th><th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3 text-right">Credits</th><th className="px-5 py-3">Receipt</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-brand-deep/5">{payments.items.map((item, index) => { const status = paymentStatus(item.status); const isVerified = item.status === "verified"; return <tr key={item.id} className="text-sm"><td className="px-5 py-4 font-bold text-brand-deep/45">{(payments.page - 1) * payments.page_size + index + 1}</td><td className="whitespace-nowrap px-5 py-4 font-medium text-brand-deep/60">{formatDate(item.created_at)}</td><td className="px-5 py-4"><span className="font-bold text-brand-deep">{item.plan_name}</span>{item.plan_id === null && <span className="mt-0.5 block text-[11px] font-medium text-brand-deep/45">Historical pricing</span>}</td><td className="px-5 py-4 font-mono text-xs text-brand-deep/55">{item.payment_reference}</td><td className="px-5 py-4 text-right font-bold text-brand-deep">{formatMoney(item.amount_paise, item.currency)}</td><td className={`px-5 py-4 text-right font-black ${isVerified ? "text-brand-green" : "text-brand-deep/60"}`}>{isVerified ? "+" : ""}{item.credits_purchased}</td><td className="px-5 py-4">{item.receipt_available && item.receipt_number ? <button type="button" onClick={() => void handleReceiptDownload(item)} disabled={receiptLoadingId === item.id} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-brand-green/20 bg-brand-green/5 px-2.5 py-1.5 text-xs font-bold text-brand-green transition hover:bg-brand-green/10 disabled:cursor-wait disabled:opacity-60">{receiptLoadingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}Download Receipt</button> : isVerified ? <span className="text-xs font-semibold text-brand-deep/45">Unavailable</span> : <span className="text-brand-deep/35">â€”</span>}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${status.className}`}>{status.label}</span></td></tr>; })}</tbody></table></div>
          )}
          <Pagination page={payments.page} totalPages={payments.total_pages} onPageChange={changePaymentPage} />
        </div>
      </section>

      <div className="flex flex-col items-center justify-center gap-3 pb-4 text-center"><Shield className="h-8 w-8 text-brand-deep/25" /><p className="text-xs font-bold uppercase tracking-wider text-brand-deep/55">Enterprise Grade Security Â· Razorpay Secured Payments</p></div></>}

      {!hasPlanAccess && (
        <div className="flex flex-col items-center justify-center gap-2 pb-4 text-center">
          <Shield className="h-7 w-7 text-brand-green" />
          <p className="text-xs font-bold uppercase tracking-wider text-brand-deep/55">One-time payment · Razorpay secured · No automatic renewal</p>
        </div>
      )}
    </div>
  );
}
