import { useEffect, useState } from "react";
import { api } from "../../api/api";

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_OPTIONS = ["pending", "preparing", "ready", "completed", "cancelled"];

function badge(s) {
  switch (s) {
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "preparing": return "bg-orange-100 text-orange-800";
    case "ready": return "bg-green-100 text-green-800";
    case "completed": return "bg-gray-100 text-gray-600";
    case "cancelled": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await api.get("/orders/");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch { setMsg("Failed to load orders."); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchOrders(); }, []);

  async function updateStatus(id, status) {
    try {
      const res = await api.patch(`/orders/${id}/`, { status });
      setOrders(orders.map(o => o.id === id ? res.data : o));
    } catch { setMsg("Failed to update status."); }
  }

  async function deleteOrder(id) {
    if (!confirm("Delete this order permanently?")) return;
    try {
      await api.delete(`/orders/${id}/`);
      setOrders(orders.filter(o => o.id !== id));
    } catch { setMsg("Failed to delete order."); }
  }

  const shown = orders.filter(o => {
    if (filter !== "all" && o.status !== filter) return false;
    const s = search.toLowerCase();
    if (!s) return true;
    return String(o.id).includes(s) ||
      (o.customer_name || "").toLowerCase().includes(s) ||
      (o.customer_email || "").toLowerCase().includes(s);
  });

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, { all: orders.length });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Order History</h1>
          <p className="text-sm text-gray-500">View all customer orders and update their status.</p>
        </div>
        <div className="flex gap-2">
          <input className="rounded-xl border px-3 py-2 text-sm w-56" placeholder="Search by ID, name, email..." value={search} onChange={e => setSearch(e.target.value)} />
          <button onClick={fetchOrders} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Refresh</button>
        </div>
      </div>

      {msg && <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{msg}</div>}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium border capitalize transition ${filter === s ? "bg-black text-white border-black" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
            {s} {counts[s] !== undefined ? `(${counts[s]})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading orders...</div>
      ) : shown.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No orders found.</div>
      ) : (
        <div className="space-y-4">
          {shown.map(o => (
            <div key={o.id} className="rounded-2xl bg-white border shadow-sm overflow-hidden">
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="cursor-pointer" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                  <div className="font-extrabold text-base">
                    Order #{o.id}
                    {o.queue_ticket?.ticket_number && (
                      <span className="ml-2 text-xs text-gray-400 font-normal">· Queue #{o.queue_ticket.ticket_number}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{o.customer_name} · {o.customer_email}</div>
                  <div className="text-xs text-gray-400">{new Date(o.created_at).toLocaleString()}</div>
                  {o.note && <div className="text-xs text-gray-500 mt-1 italic">Note: {o.note}</div>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${badge(o.status)}`}>{o.status}</span>
                  <select
                    className="rounded-xl border px-2 py-1 text-sm bg-white"
                    value={o.status}
                    onChange={e => updateStatus(o.id, e.target.value)}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                  <span className="font-extrabold text-lg">₱{money(o.total_price)}</span>
                  <button onClick={() => deleteOrder(o.id)} className="rounded-xl border px-3 py-1.5 text-xs hover:bg-red-50 hover:text-red-700">Delete</button>
                </div>
              </div>

              {expanded === o.id && (
                <div className="border-t p-4 bg-gray-50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs border-b">
                        <th className="text-left pb-2">Item</th>
                        <th className="text-left pb-2">Qty</th>
                        <th className="text-left pb-2">Unit Price</th>
                        <th className="text-left pb-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(o.items || []).map(it => (
                        <tr key={it.id}>
                          <td className="py-2 font-medium">{it.product?.name}</td>
                          <td className="py-2">{it.quantity}</td>
                          <td className="py-2">₱{money(it.unit_price)}</td>
                          <td className="py-2 font-semibold">₱{money(Number(it.unit_price) * Number(it.quantity))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td colSpan={3} className="pt-2 text-right font-bold">Total</td>
                        <td className="pt-2 font-extrabold text-lg">₱{money(o.total_price)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
