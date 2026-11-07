"use client";

import { useState } from "react";
import { Gift, Sparkles, X } from "lucide-react";
import type { OfferDetailsResponse } from "@/lib/api";

interface OfferBannerProps {
  offer: OfferDetailsResponse | null;
  onDismiss?: () => void;
}

export function OfferBanner({ offer, onDismiss }: OfferBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!offer || !offer.active || dismissed) {
    return null;
  }

  const handleClose = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl border border-brand-green/30 bg-gradient-to-r from-[#173a32] via-[#204e43] to-[#276152] p-5 text-white shadow-xl shadow-brand-green/10">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-green/30 blur-2xl" />
      <div className="pointer-events-none absolute left-1/3 -bottom-8 h-28 w-28 rounded-full bg-emerald-400/20 blur-xl" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4 sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-green/30 border border-brand-green/40 text-emerald-300 shadow-inner">
            <Gift className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                <Sparkles className="h-3 w-3" />
                Promotion Applied
              </span>
            </div>

            <h4 className="text-base font-extrabold tracking-tight text-white sm:text-lg">
              {offer.title || "20% OFF Discount Applied"}
            </h4>

            {offer.description && (
              <p className="text-xs font-medium text-white/75 sm:text-sm">
                {offer.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-center backdrop-blur-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Discount
            </span>
            <span className="text-sm font-black text-white">
              {offer.percent_off ? `${offer.percent_off}% OFF` : "Instant Discount"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Dismiss offer banner"
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/15 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
