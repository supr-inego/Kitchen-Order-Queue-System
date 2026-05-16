import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/api";
import OrderTotalsSummary from "../../components/OrderTotalsSummary";
import { getOrderTotals, money } from "../../utils/orderTotals";

function badge(s) {
  switch (s) {
    case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "preparing": return "bg-orange-100 text-orange-800 border-orange-300";
    case "ready": return "bg-green-100 text-green-800 border-green-300";
    case "completed": return "bg-gray-100 text-gray-600 border-gray-200";
    case "cancelled": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

const STATUS_FLOW = ["pending", "preparing", "ready", "completed"];

export default function CustomerMyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await api.get("/orders/");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 20000);
    return () => clearInterval(iv);
  }, []);

  const active = orders.filter(o => ["pending", "preparing", "ready"].includes(o.status));
  const past = orders.filter(o => ["completed", "cancelled"].includes(o.status));

  function renderOrder(o) {
    const currentStep = STATUS_FLOW.indexOf(o.status);
    const isOpen = expanded === o.id;
    const { discount } = getOrderTotals(o);
    return (
      <div key={o.id} className="rounded-2xl bg-white border shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
          onClick={() => setExpanded(isOpen ? null : o.id)}>
          <div>
            <div className="font-extrabold">
              Order #{o.id}
              {o.queue_ticket?.ticket_number && (
                <span className="ml-2 text-xs text-gray-400 font-normal">· Queue #{o.queue_ticket.ticket_number}</span>
              )}
            </div>
            <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
            {o.note && <div className="text-xs text-gray-400 italic mt-0.5">{o.note}</div>}
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold capitalize ${badge(o.status)}`}>{o.status}</span>
            {discount > 0 && (
              <span className="text-xs text-green-700 font-semibold">−₱{money(discount)}</span>
            )}
            <span className="font-extrabold">₱{money(o.total_price)}</span>
            <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
          </div>
        </div>

        {/* Status bar */}
        {o.status !== "cancelled" && (
          <div className="px-4 pb-3">
            <div className="flex gap-1">
              {STATUS_FLOW.map((s, i) => (
                <div key={s} className={`flex-1 h-1.5 rounded-full ${i <= currentStep ? "bg-black" : "bg-gray-200"}`} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              {STATUS_FLOW.map(s => <span key={s} className="capitalize">{s}</span>)}
            </div>
          </div>
        )}

        {isOpen && (
          <div className="border-t p-4 bg-gray-50">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b">
                  <th className="text-left pb-2">Item</th>
                  <th className="text-left pb-2">Qty</th>
                  <th className="text-right pb-2">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(o.items || []).map(it => (
                  <tr key={it.id}>
                    <td className="py-2 font-medium">{it.product?.name}</td>
                    <td className="py-2">{it.quantity}</td>
                    <td className="py-2 text-right font-semibold">₱{money(Number(it.unit_price) * Number(it.quantity))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-3">
                    <OrderTotalsSummary order={o} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold">My Orders</h1>
          <p className="text-sm text-gray-500"></p>
        </div>
        <div className="flex gap-2">
          <Link to="/order" className="rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold">+ New Order</Link>
          <button onClick={fetchOrders} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading your orders...</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-white border p-12 text-center">
          <div className="text-5xl mb-4">🛒</div>
          <div className="font-bold text-lg">No orders yet!</div>
          <p className="text-gray-500 text-sm mt-1">Head to our menu and place your first order.</p>
          <Link to="/order" className="mt-4 inline-block rounded-xl bg-black text-white px-6 py-2.5 text-sm font-semibold">Browse Menu</Link>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-extrabold text-lg">🔥 Active Orders</h2>
              {active.map(renderOrder)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-extrabold text-lg text-gray-500">Past Orders</h2>
              {past.map(renderOrder)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
