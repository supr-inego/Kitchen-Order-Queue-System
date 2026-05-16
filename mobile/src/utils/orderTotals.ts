import { money } from "./money";
import type { Coupon, Order } from "@/types";

export function discountLabel(coupon: Coupon) {
  if (coupon.discount_type === "percentage") return `${coupon.discount_value}% off`;
  if (coupon.discount_type === "fixed") return `₱${money(coupon.discount_value)} off`;
  return "Free cheapest item";
}

export function getOrderTotals(order: Order) {
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
  const couponCode = order.coupon_info?.code ?? order.coupon_code_display ?? null;
  return { subtotal, discount, total, couponCode };
}
