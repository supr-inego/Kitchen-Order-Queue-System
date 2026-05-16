const STORAGE_KEY = "crammers_selected_coupon";

export function saveCouponForCheckout(couponPayload) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(couponPayload));
}

export function loadCouponForCheckout() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCouponForCheckout() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function apiDetail(err, fallback = "Something went wrong.") {
  const data = err?.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.non_field_errors)) return data.non_field_errors[0];
  const key = data && Object.keys(data)[0];
  if (key) {
    const val = data[key];
    if (Array.isArray(val)) return String(val[0]);
    if (typeof val === "string") return val;
  }
  return fallback;
}
