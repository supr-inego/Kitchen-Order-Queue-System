export function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function discountLabel(coupon) {
  if (!coupon) return "";
  if (coupon.discount_type === "percentage") return `${coupon.discount_value}% off`;
  if (coupon.discount_type === "fixed") return `₱${money(coupon.discount_value)} off`;
  return "Free cheapest item";
}

/** Normalize subtotal, discount, total, and coupon code from an order API object. */
export function getOrderTotals(order) {
  const subtotal =
    order.subtotal != null
      ? Number(order.subtotal)
      : (order.items || []).reduce(
          (sum, it) => sum + Number(it.unit_price) * Number(it.quantity),
          0
        );
  const discount = Number(order.discount_amount || 0);
  const total =
    order.total_price != null ? Number(order.total_price) : Math.max(0, subtotal - discount);
  const couponCode =
    order.coupon_code_display ||
    order.coupon_info?.code ||
    order.coupon?.code ||
    null;
  return { subtotal, discount, total, couponCode };
}
