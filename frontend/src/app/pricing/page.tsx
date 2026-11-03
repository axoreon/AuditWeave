"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  IndianRupee,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { getCreditPlans, getErrorMessage, isAuthenticated } from "@/lib/api";
import type { CreditPlan } from "@/lib/api";
import { PublicNavbar } from "../components/PublicNavbar";

const BILLING_PATH = "/account/billing";
const LOGIN_FOR_BILLING = "/login?returnTo=" + encodeURIComponent(BILLING_PATH);

export default function PublicPricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void getCreditPlans()
      .then((catalog) => {
        if (!cancelled) setPlans(catalog);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(getErrorMessage(reason, "Unable to load credit plans."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestVersion]);

  const continueWithPlan = () => {
    router.push(isAuthenticated() ? BILLING_PATH : LOGIN_FOR_BILLING);
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-deep">
      <PublicNavbar activePage="pricing" />

      <main>
        <section className="relative overflow-hidden px-5 pb-12 pt-12 sm:px-6 sm:pb-14 sm:pt-14">
          <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-green/10 blur-[100px]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-brand-green">
              <Sparkles className="h-4 w-4" />
              One-time credit packs
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-brand-deep sm:text-5xl">
              Simple pricing for every compliance workload
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-6 text-brand-deep/65 sm:text-base">
              Purchase AuditWeave credits whenever you need them. Every pack is a
              one-time purchase with no subscription and no automatic renewal.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-bold text-brand-deep/70 sm:text-sm">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand-green" />
                Server-authoritative pricing
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand-green" />
                Secure account checkout
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand-green" />
                Credits do not auto-renew
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-6 lg:pb-20">
          {error && (
            <div className="mx-auto mb-8 flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm font-semibold text-red-700 sm:flex-row sm:text-left">
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError("");
                  setRequestVersion((version) => version + 1);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm font-bold text-brand-deep/60">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading credit packs...
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-3xl border border-brand-deep/10 bg-white px-6 py-16 text-center text-sm font-bold text-brand-deep/60">
              No credit packs are currently available.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.id}
                  className={
                    "relative flex flex-col rounded-[24px] bg-white p-6 transition " +
                    (plan.popular
                      ? "border-2 border-brand-green shadow-xl shadow-brand-green/10"
                      : "border border-brand-deep/10 shadow-sm hover:-translate-y-1 hover:shadow-xl")
                  }
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-green px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                      <Sparkles className="mr-1 inline h-3 w-3" />
                      Most Popular
                    </div>
                  )}
                  <h2 className="text-lg font-extrabold">{plan.title}</h2>
                  <p className="mt-2 min-h-10 text-xs font-medium leading-[1.15rem] text-brand-deep/60">
                    {plan.description}
                  </p>
                  <div className="my-4 flex items-end gap-1">
                    <IndianRupee className="mb-1 h-6 w-6" />
                    <span className="text-3xl font-black">{plan.price_inr}</span>
                    <span className="mb-1 text-xs font-bold text-brand-deep/45">
                      one-time
                    </span>
                  </div>
                  <ul className="mb-5 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-2 text-xs font-semibold leading-5 text-brand-deep/75 sm:text-sm"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={continueWithPlan}
                    className={
                      "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition sm:text-sm " +
                      (plan.popular
                        ? "bg-brand-green text-white hover:bg-brand-deep"
                        : "bg-brand-cream text-brand-deep hover:bg-brand-deep/10")
                    }
                  >
                    Purchase Credits
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </article>
              ))}
            </div>
          )}

        </section>
      </main>

      <footer className="border-t border-brand-deep/10 bg-white px-5 py-7 text-center text-xs font-semibold text-brand-deep/50">
        AuditWeave credit packs are one-time purchases. No subscription or
        automatic renewal applies.
      </footer>
    </div>
  );
}
