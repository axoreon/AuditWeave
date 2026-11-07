"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Tag, X } from "lucide-react";
import { getOfferDetails, type OfferDetailsResponse } from "@/lib/api";
import { clearActiveOffer, saveActiveOfferId } from "@/lib/offer";

interface CouponInputProps {
  activeOffer: OfferDetailsResponse | null;
  onOfferApplied: (offer: OfferDetailsResponse) => void;
  onOfferRemoved: () => void;
}

export function CouponInput({
  activeOffer,
  onOfferApplied,
  onOfferRemoved,
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleApply = async () => {
    const trimmed = couponCode.trim();

    if (!trimmed) {
      setErrorMessage("Please enter a coupon code.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const details = await getOfferDetails(trimmed);
      if (details && details.active) {
        saveActiveOfferId(details.id);
        onOfferApplied(details);
        setCouponCode("");
        setSuccessMessage("Coupon applied successfully! 20% discount activated.");
        window.setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setErrorMessage("Invalid or expired coupon code.");
      }
    } catch {
      setErrorMessage("Invalid or expired coupon code.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    clearActiveOffer();
    onOfferRemoved();
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="mb-8 rounded-3xl border border-brand-deep/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-brand-green" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-deep">
              Have a Coupon Code?
            </h3>
          </div>
          <p className="mt-1 text-xs font-medium text-brand-deep/60">
            Enter your promotion code below to apply your discount.
          </p>
        </div>

        {activeOffer && activeOffer.active ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border[#D4CAB8] bg[#F4F1EB] px-3.5 py-2 text-xs font-bold text[#276152]">
              <CheckCircle2 className="h-4 w-4 text[#276152]" />
              <span>
                {activeOffer.percent_off ? `${activeOffer.percent_off}% OFF` : "Discount"} Applied
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1 rounded-xl border border-brand-deep/10 bg-brand-cream/60 px-3 py-2 text-xs font-bold text-brand-deep hover:bg-brand-cream transition"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        ) : (
          <div className="flex w-full sm:w-auto items-center gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                setErrorMessage("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleApply();
                }
              }}
              placeholder="Enter coupon code"
              className="h-10 w-full sm:w-64 rounded-xl border border-brand-deep/10 bg-brand-cream/50 px-3 text-xs font-semibold uppercase text-brand-deep outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
            />
            <button
              type="button"
              onClick={() => void handleApply()}
              disabled={loading || !couponCode.trim()}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-green px-4 text-xs font-bold text-white transition hover:bg-[#2a6d57] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
            </button>
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="mt-3 text-xs font-semibold text-red-600">{errorMessage}</p>
      )}

      {successMessage && (
        <p className="mt-3 text-xs font-semibold text[#276152]">{successMessage}</p>
      )}
    </div>
  );
}
