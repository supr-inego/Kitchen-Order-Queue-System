import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/api";
import { useAuth } from "../../App";

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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

const EMOJIS = { Mains: "🍽️", Sides: "🥗", Beverages: "🥤", Desserts: "🍰", Snacks: "🍟", Specials: "⭐" };

export default function CustomerHome() {
  const { user } = useAuth();
  const [myOrders, setMyOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/orders/"), api.get("/products/")])
      .then(([o, p]) => {
        setMyOrders(Array.isArray(o.data) ? o.data : []);
        setProducts(Array.isArray(p.data) ? p.data.filter(x => x.is_available) : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const active = myOrders.filter(o => ["pending", "preparing", "ready"].includes(o.status));
  const firstName = user?.first_name || user?.email?.split("@")[0] || "there";

  const grouped = products.reduce((acc, p) => {
    const cat = p.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-black text-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Welcome, {firstName}! 👋</h1>
          <p className="text-gray-400 mt-1">Ready to order? Check out our menu below.</p>
        </div>
        <Link to="/order" className="rounded-xl bg-white text-black px-6 py-2.5 font-semibold text-sm hover:bg-gray-100 transition">
          Order Now →
        </Link>
      </div>

      {loading ? <div className="text-center text-gray-400 py-12">Loading...</div> : (
        <>
          {/* Active orders */}
          {active.length > 0 && (
            <div className="rounded-2xl bg-white border shadow-sm p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="font-extrabold text-lg">🔥 Your Active Orders</h2>
                <Link to="/my-orders" className="text-sm text-blue-600 hover:underline">View all →</Link>
              </div>
              <div className="space-y-3">
                {active.map(o => (
                  <div key={o.id} className="rounded-xl border p-4 flex justify-between items-center">
                    <div>
                      <div className="font-bold">Order #{o.id}</div>
                      <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
                      {o.note && <div className="text-xs text-gray-400 italic">{o.note}</div>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold capitalize ${badge(o.status)}`}>{o.status}</span>
                      <span className="font-bold">₱{money(o.total_price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "My Orders", value: myOrders.length, icon: "🧾" },
              { label: "Active", value: active.length, icon: "🔥" },
              { label: "Completed", value: myOrders.filter(o => o.status === "completed").length, icon: "✅" },
              { label: "Menu Items", value: products.length, icon: "🍔" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl bg-white border shadow-sm p-4">
                <div className="text-2xl">{s.icon}</div>
                <div className="text-2xl font-extrabold">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Menu */}
          <div className="rounded-2xl bg-white border shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-lg">🍽️ Our Menu</h2>
              <Link to="/order" className="rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold">Order Now</Link>
            </div>
            {Object.keys(grouped).length === 0 ? (
              <p className="text-gray-400 text-sm">No menu items available.</p>
            ) : (
              Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{EMOJIS[cat] || "🍴"}</span>
                    <h3 className="font-bold text-gray-700">{cat}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.map(p => (
                      <div key={p.id} className="rounded-xl border p-3 hover:border-black transition cursor-pointer" onClick={() => window.location.href = "/order"}>
                        <div className="text-2xl mb-1">{EMOJIS[cat] || "🍴"}</div>
                        <div className="font-semibold text-sm">{p.name}</div>
                        {p.description && <div className="text-xs text-gray-400">{p.description}</div>}
                        <div className="text-sm font-bold mt-1">₱{money(p.current_price)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
