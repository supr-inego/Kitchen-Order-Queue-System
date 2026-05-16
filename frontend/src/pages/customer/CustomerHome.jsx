import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/api";
import { useAuth } from "../../App";
import ProductImage from "../../components/ProductImage";

function money(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
}
function badgeCls(s) {
  const m = { pending: "bg-yellow-100 text-yellow-800 border-yellow-300", preparing: "bg-orange-100 text-orange-800 border-orange-300", ready: "bg-green-100 text-green-800 border-green-300", completed: "bg-gray-100 text-gray-600 border-gray-200", cancelled: "bg-red-100 text-red-700 border-red-200" };
  return m[s] || "bg-gray-100 text-gray-600 border-gray-200";
}
const EMOJIS = { Mains: "🍽️", Sides: "🥗", Beverages: "🥤", Desserts: "🍰", Snacks: "🍟", Specials: "⭐", Other: "🍴" };

function ProductCardSmall({ p }) {
  const cat = p.category || "Other";
  return (
    <Link to="/order" className="rounded-xl border overflow-hidden hover:border-black transition group bg-white">
      {p.image_url ? (
        <ProductImage
          url={p.image_url}
          name={p.name}
          className="w-full h-28 object-cover group-hover:scale-105 transition"
          placeholderClassName="w-full h-28 bg-gray-100 flex items-center justify-center text-3xl"
        />
      ) : (
        <div className="w-full h-28 bg-gray-100 flex items-center justify-center text-3xl">{EMOJIS[cat] || "🍴"}</div>
      )}
      <div className="p-3">
        <div className="font-semibold text-sm truncate">{p.name}</div>
        {p.description && <div className="text-xs text-gray-400 line-clamp-1">{p.description}</div>}
        <div className="text-sm font-bold mt-1">₱{money(p.current_price)}</div>
      </div>
    </Link>
  );
}

export default function CustomerHome() {
  const { user } = useAuth();
  const [myOrders, setMyOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/orders/"), api.get("/products/")])
      .then(([o, p]) => {
        setMyOrders(Array.isArray(o.data) ? o.data : []);
        setProducts((Array.isArray(p.data) ? p.data : []).filter(x => x.is_available));
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
        <Link to="/order" className="rounded-xl bg-white text-black px-6 py-2.5 font-semibold text-sm hover:bg-gray-100 transition">Order Now →</Link>
      </div>

      {loading ? <div className="text-center text-gray-400 py-12">Loading...</div> : (
        <>
          {active.length > 0 && (
            <div className="rounded-2xl bg-white border shadow-sm p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="font-extrabold text-lg">🔥 Active Orders</h2>
                <Link to="/my-orders" className="text-sm text-blue-600 hover:underline">View all →</Link>
              </div>
              {active.map(o => (
                <div key={o.id} className="rounded-xl border p-4 flex justify-between items-center">
                  <div>
                    <div className="font-bold">Order #{o.id}</div>
                    <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold capitalize ${badgeCls(o.status)}`}>{o.status}</span>
                    <span className="font-bold">₱{money(o.total_price)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{ label: "My Orders", value: myOrders.length, icon: "🧾" }, { label: "Active", value: active.length, icon: "🔥" }, { label: "Completed", value: myOrders.filter(o => o.status === "completed").length, icon: "✅" }, { label: "Menu Items", value: products.length, icon: "🍔" }].map(s => (
              <div key={s.label} className="rounded-2xl bg-white border shadow-sm p-4">
                <div className="text-2xl">{s.icon}</div>
                <div className="text-2xl font-extrabold">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-white border shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-lg">🍽️ Our Menu</h2>
              <Link to="/order" className="rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold">Order Now</Link>
            </div>
            {Object.keys(grouped).length === 0 ? (
              <p className="text-gray-400 text-sm">No menu items available.</p>
            ) : Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{EMOJIS[cat] || "🍴"}</span>
                  <h3 className="font-bold text-gray-700">{cat}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map(p => <ProductCardSmall key={p.id} p={p} />)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
