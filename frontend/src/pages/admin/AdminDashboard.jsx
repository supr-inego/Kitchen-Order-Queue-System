import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/api";
import { useAuth } from "../../App";

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/orders/"),
      api.get("/products/"),
      api.get("/queue/"),
    ]).then(([o, p, q]) => {
      setOrders(Array.isArray(o.data) ? o.data : []);
      setProducts(Array.isArray(p.data) ? p.data : []);
      setQueue(Array.isArray(q.data) ? q.data : []);
    }).finally(() => setLoading(false));
  }, []);

  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const preparingOrders = orders.filter(o => o.status === "preparing").length;
  const readyOrders = orders.filter(o => o.status === "ready").length;
  const todayRevenue = orders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  const cookingNow = queue.filter(q => q.status === "cooking").length;
  const waitingQueue = queue.filter(q => q.status === "waiting").length;

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-black text-white p-6">
        <h1 className="text-2xl font-extrabold">Good day, {user?.first_name || "Admin"}! 👋</h1>
        <p className="text-gray-400 mt-1">Here's your restaurant overview.</p>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-12">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Pending", value: pendingOrders, icon: "⏳", color: "text-yellow-600" },
              { label: "Preparing", value: preparingOrders, icon: "🔥", color: "text-orange-600" },
              { label: "Ready", value: readyOrders, icon: "🛎️", color: "text-green-600" },
              { label: "Cooking Now", value: cookingNow, icon: "👨‍🍳", color: "text-blue-600" },
              { label: "In Queue", value: waitingQueue, icon: "🕐", color: "text-purple-600" },
              { label: "Total Revenue", value: `₱${money(todayRevenue)}`, icon: "💰", color: "text-emerald-600" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl bg-white border shadow-sm p-4">
                <div className="text-2xl">{s.icon}</div>
                <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin/products" className="rounded-2xl bg-white border shadow-sm p-6 hover:shadow-md transition group">
              <div className="text-3xl mb-2">🍔</div>
              <div className="font-extrabold text-lg group-hover:text-black">Products</div>
              <div className="text-sm text-gray-500">{products.length} menu items </div>
            </Link>
            <Link to="/admin/orders" className="rounded-2xl bg-white border shadow-sm p-6 hover:shadow-md transition group">
              <div className="text-3xl mb-2">📋</div>
              <div className="font-extrabold text-lg group-hover:text-black">Orders</div>
              <div className="text-sm text-gray-500">{orders.length} total </div>
            </Link>
            <Link to="/admin/queue" className="rounded-2xl bg-white border shadow-sm p-6 hover:shadow-md transition group">
              <div className="text-3xl mb-2">🍳</div>
              <div className="font-extrabold text-lg group-hover:text-black">Kitchen Queue</div>
              <div className="text-sm text-gray-500">{queue.length} tickets </div>
            </Link>
          </div>

          <div className="rounded-2xl bg-white border shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="font-extrabold">Recent Orders</div>
              <Link to="/admin/orders" className="text-sm text-blue-600 hover:underline">View all →</Link>
            </div>
            <div className="divide-y">
              {recentOrders.length === 0 ? (
                <div className="p-6 text-gray-500 text-sm">No orders yet.</div>
              ) : recentOrders.map(o => (
                <div key={o.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">Order #{o.id} — {o.customer_name}</div>
                    <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      o.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      o.status === "preparing" ? "bg-orange-100 text-orange-700" :
                      o.status === "ready" ? "bg-green-100 text-green-700" :
                      o.status === "completed" ? "bg-gray-100 text-gray-600" :
                      "bg-red-100 text-red-600"
                    }`}>{o.status}</span>
                    <span className="font-bold">₱{money(o.total_price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
