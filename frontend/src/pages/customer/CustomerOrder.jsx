import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const EMOJIS = { Mains: "🍽️", Sides: "🥗", Beverages: "🥤", Desserts: "🍰", Snacks: "🍟", Specials: "⭐", Other: "🍴" };

export default function CustomerOrder() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});   // { productId: quantity }
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  useEffect(() => {
    api.get("/products/")
      .then(res => setProducts((Array.isArray(res.data) ? res.data : []).filter(p => p.is_available)))
      .finally(() => setLoading(false));
  }, []);

  function addToCart(id) {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }

  function removeFromCart(id) {
    setCart(prev => {
      const n = (prev[id] || 0) - 1;
      if (n <= 0) { const copy = { ...prev }; delete copy[id]; return copy; }
      return { ...prev, [id]: n };
    });
  }

  function setQty(id, val) {
    const n = parseInt(val);
    if (!n || n <= 0) {
      const copy = { ...cart }; delete copy[id]; setCart(copy);
    } else {
      setCart(prev => ({ ...prev, [id]: n }));
    }
  }

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const p = products.find(x => x.id === Number(id));
    return p ? { ...p, qty, subtotal: Number(p.current_price) * qty } : null;
  }).filter(Boolean);

  const total = cartItems.reduce((sum, i) => sum + i.subtotal, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  async function placeOrder() {
    if (cartItems.length === 0) return setMsg({ text: "Add at least one item to your cart.", ok: false });
    setBusy(true);
    setMsg({ text: "", ok: false });
    try {
      const res = await api.post("/orders/", {
        note,
        items_payload: cartItems.map(i => ({ product: i.id, quantity: i.qty })),
      });
      setCart({});
      setNote("");
      setMsg({ text: `Order #${res.data.id} placed! Your ticket number is #${res.data.queue_ticket?.ticket_number}. We'll start preparing it shortly!`, ok: true });
      setTimeout(() => navigate("/my-orders"), 3000);
    } catch (err) {
      setMsg({ text: err.response?.data?.detail || "Failed to place order. Please try again.", ok: false });
    } finally {
      setBusy(false);
    }
  }

  const categories = ["All", ...new Set(products.map(p => p.category || "Other"))];
  const shown = products.filter(p => {
    const s = search.toLowerCase();
    const catOk = catFilter === "All" || (p.category || "Other") === catFilter;
    const searchOk = !s || p.name.toLowerCase().includes(s) || (p.description || "").toLowerCase().includes(s);
    return catOk && searchOk;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Place Your Order</h1>
        <p className="text-sm text-gray-500">Browse the menu and add items to your cart.</p>
      </div>

      {msg.text && (
        <div className={`rounded-2xl p-4 text-sm font-medium ${msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filter */}
          <div className="flex gap-3 flex-wrap">
            <input className="flex-1 rounded-xl border px-3 py-2 text-sm min-w-40" placeholder="Search menu..." value={search} onChange={e => setSearch(e.target.value)} />
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`rounded-xl px-3 py-2 text-xs font-medium border transition ${catFilter === c ? "bg-black text-white border-black" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading menu...</div>
          ) : shown.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No items found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shown.map(p => {
                const qty = cart[p.id] || 0;
                const cat = p.category || "Other";
                return (
                  <div key={p.id} className={`rounded-2xl border p-4 bg-white shadow-sm transition ${qty > 0 ? "border-black shadow-md" : "hover:border-gray-300"}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-2xl">{EMOJIS[cat] || "🍴"}</div>
                        <div className="font-bold text-base mt-1">{p.name}</div>
                        {p.description && <div className="text-xs text-gray-400 mt-0.5">{p.description}</div>}
                        {p.category && <div className="text-xs text-gray-400 mt-0.5">{p.category}</div>}
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-base">₱{money(p.current_price)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {qty === 0 ? (
                        <button onClick={() => addToCart(p.id)}
                          className="w-full rounded-xl bg-black text-white py-2 text-sm font-semibold hover:opacity-90">
                          Add to Cart
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <button onClick={() => removeFromCart(p.id)}
                            className="rounded-xl border w-9 h-9 font-bold hover:bg-red-50 hover:text-red-700">−</button>
                          <input type="number" min="1" value={qty}
                            onChange={e => setQty(p.id, e.target.value)}
                            className="flex-1 rounded-xl border text-center py-1.5 text-sm font-bold" />
                          <button onClick={() => addToCart(p.id)}
                            className="rounded-xl border w-9 h-9 font-bold hover:bg-green-50 hover:text-green-700">+</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white border shadow-sm p-5 space-y-4 sticky top-24">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-lg">🛒 Your Cart</h2>
              {cartCount > 0 && (
                <span className="text-xs bg-black text-white rounded-full px-2 py-0.5 font-bold">{cartCount}</span>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="text-sm text-gray-400 py-4 text-center">Your cart is empty.</div>
            ) : (
              <div className="space-y-3">
                {cartItems.map(i => (
                  <div key={i.id} className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{i.name}</div>
                      <div className="text-xs text-gray-400">₱{money(i.current_price)} × {i.qty}</div>
                    </div>
                    <div className="text-sm font-bold whitespace-nowrap">₱{money(i.subtotal)}</div>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-extrabold">₱{money(total)}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-600">Special Instructions (optional)</label>
              <textarea
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm resize-none"
                rows={2}
                placeholder="e.g. No onions, extra spicy..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            <button
              onClick={placeOrder}
              disabled={cartItems.length === 0 || busy}
              className="w-full rounded-xl bg-black text-white py-3 font-extrabold text-sm hover:opacity-90 disabled:opacity-40 transition">
              {busy ? "Placing Order..." : `Place Order · ₱${money(total)}`}
            </button>
            {cartItems.length > 0 && (
              <button onClick={() => setCart({})} className="w-full text-xs text-gray-400 hover:text-red-500">Clear cart</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
