import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import ProductImage from "../../components/ProductImage";
import { apiDetail, loadCouponForCheckout, clearCouponForCheckout } from "../../utils/couponWallet";
import { Link } from "react-router-dom";

function money(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
}

const EMOJIS = { Mains: "🍽️", Sides: "🥗", Beverages: "🥤", Desserts: "🍰", Snacks: "🍟", Specials: "⭐", Other: "🍴" };

function ProductCard({ p, qty, onAdd, onRemove, onSetQty }) {
  const cat = p.category || "Other";
  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition ${qty > 0 ? "border-black shadow-md" : "hover:border-gray-300"}`}>
      {p.image_url ? (
        <ProductImage
          url={p.image_url}
          name={p.name}
          className="w-full h-36 object-cover"
          placeholderClassName="w-full h-36 bg-gray-100 flex items-center justify-center text-4xl"
        />
      ) : (
        <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-4xl">{EMOJIS[cat] || "🍴"}</div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm leading-snug">{p.name}</div>
            {p.description && <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{p.description}</div>}
            {p.category && <div className="text-xs text-gray-400">{p.category}</div>}
          </div>
          <div className="font-extrabold text-base shrink-0">₱{money(p.current_price)}</div>
        </div>
        {qty === 0 ? (
          <button onClick={() => onAdd(p.id)} className="w-full rounded-xl bg-black text-white py-2 text-sm font-semibold hover:opacity-90">Add to Cart</button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => onRemove(p.id)} className="rounded-xl border w-9 h-9 font-bold hover:bg-red-50 hover:text-red-700 flex items-center justify-center">−</button>
            <input type="number" min="1" value={qty} onChange={e => onSetQty(p.id, e.target.value)}
              className="flex-1 rounded-xl border text-center py-1.5 text-sm font-bold" />
            <button onClick={() => onAdd(p.id)} className="rounded-xl border w-9 h-9 font-bold hover:bg-green-50 hover:text-green-700 flex items-center justify-center">+</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerOrder() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);  // { coupon, discount_preview }
  const [couponMsg, setCouponMsg] = useState({ text: "", ok: false });
  const [couponBusy, setCouponBusy] = useState(false);

  useEffect(() => {
    api.get("/products/")
      .then(r => setProducts((Array.isArray(r.data) ? r.data : []).filter(p => p.is_available)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const saved = loadCouponForCheckout();
    if (saved?.coupon?.code) {
      setCouponCode(saved.coupon.code);
      setCouponMsg({ text: `Using ${saved.coupon.code} from your wallet. Click Apply to confirm.`, ok: true });
    }
  }, []);

  function addToCart(id) { setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 })); }
  function removeFromCart(id) {
    setCart(prev => {
      const n = (prev[id] || 0) - 1;
      if (n <= 0) { const c = { ...prev }; delete c[id]; return c; }
      return { ...prev, [id]: n };
    });
  }
  function setQty(id, val) {
    const n = parseInt(val);
    if (!n || n <= 0) { const c = { ...cart }; delete c[id]; setCart(c); }
    else setCart(prev => ({ ...prev, [id]: n }));
  }

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const p = products.find(x => x.id === Number(id));
    return p ? { ...p, qty, subtotal: Number(p.current_price) * qty } : null;
  }).filter(Boolean);

  const subtotal = cartItems.reduce((s, i) => s + i.subtotal, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  // Compute discount: if free_item, find cheapest in cart
  function getDiscount() {
    if (!appliedCoupon) return 0;
    const { coupon, discount_preview } = appliedCoupon;
    if (coupon.discount_type === "free_item") {
      if (cartItems.length === 0) return 0;
      return Math.min(...cartItems.map(i => Number(i.current_price)));
    }
    return Math.min(Number(discount_preview || 0), subtotal);
  }
  const discount = getDiscount();
  const total = Math.max(0, subtotal - discount);

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponBusy(true); setCouponMsg({ text: "", ok: false }); setAppliedCoupon(null);
    try {
      const r = await api.post("/coupons/validate/", { code: couponCode.trim(), order_total: subtotal });
      setAppliedCoupon(r.data);
      const { coupon, discount_preview } = r.data;
      const label =
        coupon.discount_type === "free_item" ? "Cheapest item will be free!" :
        coupon.discount_type === "percentage" ? `${coupon.discount_value}% off applied!` :
        `₱${money(discount_preview)} discount applied!`;
      setCouponMsg({ text: `✅ ${label} ${coupon.description ? `— ${coupon.description}` : ""}`, ok: true });
    } catch (err) {
      const detail = apiDetail(err, "Invalid or expired coupon.");
      const needsClaim = err.response?.data?.needs_claim;
      setCouponMsg({
        text: needsClaim ? `${detail} ` : detail,
        ok: false,
        needsClaim,
      });
    } finally { setCouponBusy(false); }
  }

  function removeCoupon() {
    setAppliedCoupon(null); setCouponCode(""); setCouponMsg({ text: "", ok: false });
    clearCouponForCheckout();
  }

  async function placeOrder() {
    if (cartItems.length === 0) return setMsg({ text: "Add at least one item to your cart.", ok: false });
    setBusy(true); setMsg({ text: "", ok: false });
    try {
      const r = await api.post("/orders/", {
        note,
        coupon_code: appliedCoupon ? appliedCoupon.coupon.code : "",
        items_payload: cartItems.map(i => ({ product: i.id, quantity: i.qty })),
      });
      setCart({}); setNote(""); setAppliedCoupon(null); setCouponCode(""); clearCouponForCheckout();
      setMsg({ text: `🎉 Order #${r.data.id} placed! Queue ticket #${r.data.queue_ticket?.ticket_number}. Redirecting...`, ok: true });
      setTimeout(() => navigate("/my-orders"), 2500);
    } catch (err) {
      setMsg({ text: err.response?.data?.detail || "Failed to place order.", ok: false });
    } finally { setBusy(false); }
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
        <p className="text-sm text-gray-500">Browse the menu, add items, apply a coupon, and order.</p>
      </div>

      {msg.text && (
        <div className={`rounded-2xl p-4 text-sm font-medium ${msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <input className="flex-1 rounded-xl border px-3 py-2 text-sm min-w-36" placeholder="Search menu..." value={search} onChange={e => setSearch(e.target.value)} />
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`rounded-xl px-3 py-2 text-xs font-medium border transition ${catFilter === c ? "bg-black text-white border-black" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loading ? <div className="text-center text-gray-400 py-12">Loading menu...</div>
            : shown.length === 0 ? <div className="text-center text-gray-400 py-12">No items found.</div>
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shown.map(p => (
                  <ProductCard key={p.id} p={p} qty={cart[p.id] || 0}
                    onAdd={addToCart} onRemove={removeFromCart} onSetQty={setQty} />
                ))}
              </div>
            )}
        </div>

        {/* Cart panel */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white border shadow-sm p-5 space-y-5 sticky top-24">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-lg">🛒 Your Cart</h2>
              {cartCount > 0 && <span className="text-xs bg-black text-white rounded-full px-2 py-0.5 font-bold">{cartCount}</span>}
            </div>

            {cartItems.length === 0 ? (
              <div className="text-sm text-gray-400 py-6 text-center">Your cart is empty.</div>
            ) : (
              <div className="space-y-2">
                {cartItems.map(i => (
                  <div key={i.id} className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{i.name}</div>
                      <div className="text-xs text-gray-400">₱{money(i.current_price)} × {i.qty}</div>
                    </div>
                    <div className="text-sm font-bold whitespace-nowrap">₱{money(i.subtotal)}</div>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">₱{money(subtotal)}</span>
                </div>
              </div>
            )}

            {/* Coupon input */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">🏷️ Coupon Code</span>
                <Link to="/coupons" className="text-xs text-blue-600 underline font-medium">Claim coupons</Link>
              </div>
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input className="flex-1 rounded-xl border px-3 py-2 text-sm font-mono uppercase"
                    placeholder="Enter code..." value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === "Enter" && applyCoupon()}
                    disabled={couponBusy || cartItems.length === 0} />
                  <button onClick={applyCoupon} disabled={couponBusy || !couponCode.trim() || cartItems.length === 0}
                    className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-40">
                    {couponBusy ? "..." : "Apply"}
                  </button>
                </div>
              ) : (
                <div className="rounded-xl bg-green-50 border border-green-200 p-2 flex justify-between items-center">
                  <span className="text-xs font-semibold text-green-700 font-mono">{appliedCoupon.coupon.code}</span>
                  <button onClick={removeCoupon} className="text-xs text-green-600 hover:text-red-500">Remove</button>
                </div>
              )}
              {couponMsg.text && (
                <div className={`text-xs rounded-xl p-2 ${couponMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {couponMsg.text}
                  {couponMsg.needsClaim && (
                    <Link to="/coupons" className="block mt-1 font-semibold underline">Go to My Coupons →</Link>
                  )}
                </div>
              )}
              {cartItems.length === 0 && <p className="text-xs text-gray-400">Add items to apply a coupon.</p>}
            </div>

            {/* Totals */}
            {cartItems.length > 0 && (
              <div className="border-t pt-3 space-y-1">
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Discount</span><span>−₱{money(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-extrabold">₱{money(total)}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-600">Special Instructions</label>
              <textarea className="mt-1 w-full rounded-xl border px-3 py-2 text-sm resize-none" rows={2}
                placeholder="e.g. No onions, extra rice..." value={note} onChange={e => setNote(e.target.value)} />
            </div>

            <button onClick={placeOrder} disabled={cartItems.length === 0 || busy}
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
