import { useState } from "react";
import { api } from "../../api/api";
import OrderTotalsSummary from "../../components/OrderTotalsSummary";
import { money } from "../../utils/orderTotals";

const STEPS = ["pending", "preparing", "ready", "completed"];
const STEP_LABELS = { pending: "Order Received", preparing: "Being Prepared", ready: "Ready for Pickup", completed: "Completed" };
const STEP_ICONS = { pending: "📝", preparing: "🔥", ready: "🛎️", completed: "✅" };

function badge(s) {
  switch (s) {
    case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "preparing": return "bg-orange-100 text-orange-800 border-orange-300";
    case "ready": return "bg-green-100 text-green-800 border-green-300";
    case "completed": return "bg-gray-100 text-gray-600 border-gray-200";
    case "cancelled": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-gray-100 text-gray-600";
  }
}

export default function CustomerTrack() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function track(e) {
    e.preventDefault();
    setErr("");
    setOrder(null);
    const id = Number(orderId);
    if (!id || id <= 0) return setErr("Please enter a valid order number.");
    setLoading(true);
    try {
      const res = await api.get(`/orders/${id}/`);
      setOrder(res.data);
    } catch {
      setErr("Order not found. Make sure it's your own order.");
    } finally {
      setLoading(false);
    }
  }

  const currentStep = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Track Your Order</h1>
        <p className="text-sm text-gray-500">Enter your order number to see its current status.</p>
      </div>

      <form onSubmit={track} className="rounded-2xl bg-white border shadow-sm p-6 space-y-4">
        <div className="flex gap-3">
          <input
            type="number"
            min="1"
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            className="flex-1 rounded-xl border px-4 py-3 text-lg font-bold text-center"
            placeholder="Order #"
          />
          <button disabled={loading}
            className="rounded-xl bg-black text-white px-6 py-3 font-semibold hover:opacity-90 disabled:opacity-50">
            {loading ? "..." : "Track"}
          </button>
        </div>
        {err && <div className="text-sm text-red-600 text-center">{err}</div>}
      </form>

      {order && (
        <div className="rounded-2xl bg-white border shadow-sm overflow-hidden">
          <div className="p-5 border-b flex justify-between items-start">
            <div>
              <div className="text-2xl font-extrabold">Order #{order.id}</div>
              {order.queue_ticket?.ticket_number && (
                <div className="text-sm text-gray-500">Queue Ticket #{order.queue_ticket.ticket_number}</div>
              )}
              <div className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleString()}</div>
            </div>
            <span className={`text-sm px-3 py-1.5 rounded-full border font-semibold capitalize ${badge(order.status)}`}>
              {order.status}
            </span>
          </div>

          {/* Progress */}
          {order.status !== "cancelled" ? (
            <div className="p-5 border-b">
              <div className="grid grid-cols-4 gap-2">
                {STEPS.map((s, i) => {
                  const done = i < currentStep;
                  const current = i === currentStep;
                  return (
                    <div key={s} className="flex flex-col items-center text-center gap-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 transition ${
                        current ? "border-black bg-black text-white scale-110" :
                        done ? "border-black bg-white text-black" :
                        "border-gray-200 bg-gray-50 text-gray-300"
                      }`}>
                        {STEP_ICONS[s]}
                      </div>
                      <div className={`text-xs font-semibold ${current ? "text-black" : done ? "text-gray-600" : "text-gray-300"}`}>
                        {STEP_LABELS[s]}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="hidden" />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Connector line */}
              <div className="relative mt-2 h-1 bg-gray-200 rounded-full -mx-5 px-5">
                <div className="absolute inset-y-0 left-0 bg-black rounded-full transition-all"
                  style={{ width: currentStep < 0 ? "0%" : `${Math.min(100, (currentStep / (STEPS.length - 1)) * 100)}%` }} />
              </div>
            </div>
          ) : (
            <div className="p-5 border-b bg-red-50 text-red-700 text-sm font-semibold text-center">
              ❌ This order has been cancelled.
            </div>
          )}

          {/* Ready message */}
          {order.status === "ready" && (
            <div className="p-4 bg-green-50 border-b text-green-700 font-semibold text-center text-sm">
              🛎️ Your order is ready! Please proceed to the counter.
            </div>
          )}

          {/* Items */}
          <div className="p-5">
            <div className="font-bold mb-3">Order Items</div>
            <div className="space-y-2">
              {(order.items || []).map(it => (
                <div key={it.id} className="flex justify-between text-sm">
                  <span>{it.product?.name} × {it.quantity}</span>
                  <span className="font-semibold">₱{money(Number(it.unit_price) * Number(it.quantity))}</span>
                </div>
              ))}
              <OrderTotalsSummary order={order} className="border-t pt-3 mt-2" />
            </div>
            {order.note && (
              <div className="mt-3 text-xs text-gray-500 italic">Note: {order.note}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
