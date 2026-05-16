import { useEffect, useState } from "react";
import { api } from "../../api/api";
import ProductImage from "../../components/ProductImage";
import { normalizeImageUrl, imageUrlWarning } from "../../utils/imageUrl";

function money(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v;
}

const CATEGORIES = ["", "Mains", "Sides", "Beverages", "Desserts", "Snacks", "Specials"];
const BLANK = { name: "", description: "", current_price: "", category: "", is_available: true, image_url: "" };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [editForm, setEditForm] = useState(BLANK);
  const [previewUrl, setPreviewUrl] = useState("");
  const [editPreviewUrl, setEditPreviewUrl] = useState("");

  async function fetchProducts() {
    setLoading(true);
    try { const r = await api.get("/products/"); setProducts(Array.isArray(r.data) ? r.data : []); }
    catch { setMsg({ text: "Failed to load products.", ok: false }); }
    finally { setLoading(false); }
  }
  useEffect(() => { fetchProducts(); }, []);

  function setField(setter, field, val) { setter(prev => ({ ...prev, [field]: val })); }

  async function addProduct(e) {
    e.preventDefault();
    const p = Number(form.current_price);
    if (!form.name.trim()) return setMsg({ text: "Product name is required.", ok: false });
    if (!Number.isFinite(p) || p <= 0) return setMsg({ text: "Price must be > 0.", ok: false });
    const image_url = normalizeImageUrl(form.image_url);
    const warn = imageUrlWarning(image_url);
    if (warn) return setMsg({ text: warn, ok: false });
    try {
      const r = await api.post("/products/", { ...form, image_url, current_price: p });
      setProducts([r.data, ...products]); setForm(BLANK); setPreviewUrl("");
      setMsg({ text: "Product added!", ok: true });
    } catch { setMsg({ text: "Failed to add product.", ok: false }); }
  }

  function openEdit(p) {
    setEditId(p.id);
    setEditForm({ name: p.name, description: p.description || "", current_price: String(p.current_price), category: p.category || "", is_available: p.is_available, image_url: p.image_url || "" });
    setEditPreviewUrl(p.image_url || "");
  }

  async function saveEdit(e) {
    e.preventDefault();
    const p = Number(editForm.current_price);
    if (!editForm.name.trim()) return setMsg({ text: "Name required.", ok: false });
    if (!Number.isFinite(p) || p <= 0) return setMsg({ text: "Price > 0 required.", ok: false });
    const image_url = normalizeImageUrl(editForm.image_url);
    const warn = imageUrlWarning(image_url);
    if (warn) return setMsg({ text: warn, ok: false });
    try {
      const r = await api.put(`/products/${editId}/`, { ...editForm, image_url, current_price: p });
      setProducts(products.map(x => x.id === editId ? r.data : x)); setEditId(null);
      setMsg({ text: "Product updated!", ok: true });
    } catch { setMsg({ text: "Failed to update.", ok: false }); }
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    try { await api.delete(`/products/${id}/`); setProducts(products.filter(p => p.id !== id)); setMsg({ text: "Deleted.", ok: true }); }
    catch { setMsg({ text: "Cannot delete — used in existing orders.", ok: false }); }
  }

  const shown = products.filter(p => {
    const s = search.toLowerCase();
    return !s || p.name.toLowerCase().includes(s) || (p.category || "").toLowerCase().includes(s);
  });

  function ImageInput({ label, value, onChange, preview, setPreview }) {
    const normalized = normalizeImageUrl(preview || value);
    const warn = imageUrlWarning(normalized);

    function applyUrl(raw) {
      const next = normalizeImageUrl(raw);
      onChange(next);
      setPreview(next);
    }

    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-600">{label}</label>
        <input
          className="w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="Paste image link (Open image in new tab → copy URL)"
          value={value}
          onChange={(e) => applyUrl(e.target.value)}
          onBlur={(e) => applyUrl(e.target.value)}
        />
        {warn && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2">{warn}</p>}
        {normalized && (
          <div className="relative rounded-xl overflow-hidden border h-32">
            <ProductImage
              url={normalized}
              name="preview"
              className="w-full h-full object-cover"
              placeholderClassName="w-full h-full bg-gray-100 flex items-center justify-center"
            />
            <button
              type="button"
              onClick={() => {
                onChange("");
                setPreview("");
              }}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        )}
        <p className="text-xs text-gray-400">
          Right-click the image → <strong>Open image in new tab</strong> → copy the address bar
          (googleusercontent.com or .jpg/.png). Search-page links will not work.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Products / Menu</h1>
        <p className="text-sm text-gray-500">Add, edit, and remove menu items with photos.</p>
      </div>

      {msg.text && (
        <div className={`rounded-2xl p-4 text-sm font-medium ${msg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add form */}
        <form onSubmit={addProduct} className="rounded-2xl bg-white border shadow-sm p-5 space-y-3 lg:col-span-1 h-fit">
          <div className="font-extrabold text-lg">➕ Add New Item</div>
          <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Item name *" value={form.name} onChange={e => setField(setForm, "name", e.target.value)} />
          <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Description (optional)" value={form.description} onChange={e => setField(setForm, "description", e.target.value)} />
          <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Price (e.g. 99.00) *" value={form.current_price} onChange={e => setField(setForm, "current_price", e.target.value)} />
          <select className="w-full rounded-xl border px-3 py-2 text-sm bg-white" value={form.category} onChange={e => setField(setForm, "category", e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c || "-- Category (optional) --"}</option>)}
          </select>
          <ImageInput label="Product Image URL" value={form.image_url}
            onChange={v => setField(setForm, "image_url", v)} preview={previewUrl} setPreview={setPreviewUrl} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_available} onChange={e => setField(setForm, "is_available", e.target.checked)} />
            Available on menu
          </label>
          <button className="w-full rounded-xl bg-black text-white py-2.5 font-semibold hover:opacity-90 text-sm">Add Item</button>
        </form>

        {/* Product grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-white border shadow-sm p-4 flex gap-3 items-center">
            <input className="flex-1 rounded-xl border px-3 py-2 text-sm" placeholder="Search by name or category..." value={search} onChange={e => setSearch(e.target.value)} />
            <button onClick={fetchProducts} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Refresh</button>
            <span className="text-xs text-gray-500 whitespace-nowrap">{shown.length}/{products.length}</span>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white border p-8 text-center text-gray-400">Loading...</div>
          ) : shown.length === 0 ? (
            <div className="rounded-2xl bg-white border p-8 text-center text-gray-400">No products found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {shown.map(p => (
                <div key={p.id} className="rounded-2xl bg-white border shadow-sm overflow-hidden">
                  <ProductImage url={p.image_url} name={p.name} />
                  <div className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{p.name}</div>
                        {p.description && <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{p.description}</div>}
                        <div className="text-xs text-gray-400 mt-1">{p.category || "No category"}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-extrabold">₱{money(p.current_price)}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.is_available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {p.is_available ? "Available" : "Off"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openEdit(p)} className="flex-1 rounded-xl border py-1.5 text-xs hover:bg-gray-50">Edit</button>
                      <button onClick={() => deleteProduct(p.id)} className="flex-1 rounded-xl border py-1.5 text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-200">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4 my-4">
            <div className="font-extrabold text-lg">Edit Product</div>
            <form onSubmit={saveEdit} className="space-y-3">
              <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Name *" value={editForm.name} onChange={e => setField(setEditForm, "name", e.target.value)} />
              <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Description" value={editForm.description} onChange={e => setField(setEditForm, "description", e.target.value)} />
              <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Price *" value={editForm.current_price} onChange={e => setField(setEditForm, "current_price", e.target.value)} />
              <select className="w-full rounded-xl border px-3 py-2 text-sm bg-white" value={editForm.category} onChange={e => setField(setEditForm, "category", e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c || "-- Category --"}</option>)}
              </select>
              <ImageInput label="Product Image URL" value={editForm.image_url}
                onChange={v => setField(setEditForm, "image_url", v)} preview={editPreviewUrl} setPreview={setEditPreviewUrl} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editForm.is_available} onChange={e => setField(setEditForm, "is_available", e.target.checked)} />
                Available on menu
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditId(null)} className="flex-1 rounded-xl border py-2 hover:bg-gray-50 text-sm">Cancel</button>
                <button className="flex-1 rounded-xl bg-black text-white py-2 text-sm font-semibold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
