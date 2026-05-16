import { getOrderTotals, money, discountLabel } from "../utils/orderTotals";

export default function OrderTotalsSummary({ order, className = "" }) {
  const { subtotal, discount, total, couponCode } = getOrderTotals(order);

  return (
    <div className={`space-y-1 text-sm ${className}`}>
      <div className="flex justify-between text-gray-600">
        <span>Subtotal</span>
        <span className="font-semibold">₱{money(subtotal)}</span>
      </div>
      {couponCode && (
        <div className="flex justify-between text-blue-700">
          <span>
            Coupon <span className="font-mono font-bold">{couponCode}</span>
            {order.coupon_info && (
              <span className="text-blue-500 font-normal">
                {" "}
                · {discountLabel(order.coupon_info)}
              </span>
            )}
          </span>
        </div>
      )}
      {discount > 0 && (
        <div className="flex justify-between text-green-700 font-semibold">
          <span>Discount</span>
          <span>−₱{money(discount)}</span>
        </div>
      )}
      <div className="flex justify-between font-extrabold text-base border-t pt-2 mt-1">
        <span>Total</span>
        <span>₱{money(total)}</span>
      </div>
    </div>
  );
}
