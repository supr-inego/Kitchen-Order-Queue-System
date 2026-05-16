const STORAGE_KEY = "crammers_selected_coupon";

export function saveCouponForCheckout(payload: object) {
  // React Native: use a simple in-memory module + AsyncStorage would be better;
  // for Expo web parity we use global for now
  (globalThis as unknown as { __checkoutCoupon?: string }).__checkoutCoupon =
    JSON.stringify(payload);
}

export function loadCouponForCheckout(): { coupon: { code: string }; discount_preview?: number | null } | null {
  try {
    const raw = (globalThis as unknown as { __checkoutCoupon?: string }).__checkoutCoupon;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCouponForCheckout() {
  delete (globalThis as unknown as { __checkoutCoupon?: string }).__checkoutCoupon;
}

export function apiDetail(err: unknown, fallback = "Something went wrong."): string {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  return fallback;
}
