/**
 * Razorpay Offer Utilities & Management
 * Target Campaign: 20% OFF Welcome Gift (offer_TwSlqIzMq1cxqH)
 */

export const TARGET_OFFER_ID = "offer_TwSlqIzMq1cxqH";
const OFFER_STORAGE_KEY = "auditweave_active_offer";

// Format validation: starts with 'offer_' followed by alphanumeric characters, or standard promo code
const RAZORPAY_OFFER_REGEX = /^offer_[A-Za-z0-9]{10,30}$/;
const PROMO_CODE_REGEX = /^[A-Za-z0-9_-]{3,30}$/;

export const OFFER_ALIASES: Record<string, string> = {
  WELCOME20: TARGET_OFFER_ID,
  WELCOME: TARGET_OFFER_ID,
  DISCOUNT20: TARGET_OFFER_ID,
  AUDIT20: TARGET_OFFER_ID,
};

export interface OfferDetails {
  id: string;
  title: string;
  description?: string;
  percent_off?: number;
  flat_amount_off?: number;
  min_amount?: number;
  valid_till?: string;
  active: boolean;
}

/**
 * Sanitize and normalize any incoming offer ID or promo code.
 */
export function sanitizeOfferId(rawId: string | null | undefined): string | null {
  if (!rawId) return null;
  const trimmed = rawId.trim();
  const upper = trimmed.toUpperCase();

  if (OFFER_ALIASES[upper]) {
    return OFFER_ALIASES[upper];
  }

  if (RAZORPAY_OFFER_REGEX.test(trimmed)) {
    return trimmed;
  }

  if (PROMO_CODE_REGEX.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Read the active offer ID only if:
 * 1. Present in URL query parameters (?offer_id=... or ?offer=... or ?coupon=...)
 * 2. Already saved in SessionStorage by explicit user action
 * Defaults to null (no discount applied until user applies coupon or arrives from an ad link)
 */
export function resolveActiveOfferId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const queryOffer = sanitizeOfferId(
      params.get("offer_id") || params.get("offer") || params.get("coupon")
    );

    if (queryOffer) {
      sessionStorage.setItem(OFFER_STORAGE_KEY, queryOffer);
      return queryOffer;
    }

    const storedOffer = sanitizeOfferId(sessionStorage.getItem(OFFER_STORAGE_KEY));
    if (storedOffer) {
      return storedOffer;
    }

    // Do NOT auto-apply by default; wait for user to enter coupon or visit ad link
    return null;
  } catch (err) {
    console.error("Unable to resolve active offer ID:", err);
    return null;
  }
}

/**
 * Explicitly save an offer ID into session storage.
 */
export function saveActiveOfferId(offerId: string): void {
  if (typeof window === "undefined") return;
  const sanitized = sanitizeOfferId(offerId);
  if (sanitized) {
    sessionStorage.setItem(OFFER_STORAGE_KEY, sanitized);
  }
}

/**
 * Clear stored offer from session storage.
 */
export function clearActiveOffer(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(OFFER_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear active offer:", err);
  }
}

/**
 * Calculate the discounted price in INR based on offer details.
 */
export function calculateDiscountedPrice(originalPriceInr: number, offer: OfferDetails | null): {
  discountedPrice: number;
  savings: number;
} {
  if (!offer || !offer.active) {
    return { discountedPrice: originalPriceInr, savings: 0 };
  }

  if (offer.min_amount && originalPriceInr * 100 < offer.min_amount) {
    return { discountedPrice: originalPriceInr, savings: 0 };
  }

  let savings = 0;
  if (offer.percent_off && offer.percent_off > 0) {
    savings = Math.round((originalPriceInr * offer.percent_off) / 100);
  } else if (offer.flat_amount_off && offer.flat_amount_off > 0) {
    savings = Math.round(offer.flat_amount_off / 100);
  }

  const discountedPrice = Math.max(0, originalPriceInr - savings);
  return { discountedPrice, savings };
}
