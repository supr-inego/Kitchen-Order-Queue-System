import { useEffect, useState } from "react";
import { api } from "../../api/api";

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CATEGORIES = ["", "Mains", "Sides", "Beverages", "Desserts", "Snacks", "Specials"];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);

  const blank = { name: "", description: "", current_price: "", category: "", is_available: true };
  const [form, setForm] = useState(blank);
  const [editForm, setEditForm] = useState(blank);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await api.get("/products/");
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch { setMsg({ text: "Failed to load products.", ok: false }); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchProducts(); }, []);

  function setField(setter, field, val) {
    setter(prev => ({ ...prev, [field]: val }));
  }

  async function addProduct(e) {
    e.preventDefault();
    const p = Number(form.current_price);
    if (!form.name.trim()) return setMsg({ text: "Product name is required.", ok: false });
    if (!Number.isFinite(p) || p <= 0) return setMsg({ text: "Price must be > 0.", ok: false });
    try {
      const res = await api.post("/products/", { ...form, current_price: p });
      setProducts([res.data, ...products]);
      setForm(blank);
      setMsg({ text: "Product added!", ok: true });
    } catch { setMsg({ text: "Failed to add product.", ok: false }); }
  }

  function openEdit(p) {
    setEditId(p.id);
    setEditForm({ name: p.name, description: p.description || "", current_price: String(p.current_price), category: p.category || "", is_available: p.is_available });
  }

  async function saveEdit(e) {
    e.preventDefault();
    const p = Number(editForm.current_price);
    if (!editForm.name.trim()) return setMsg({ text: "Name required.", ok: false });
    if (!Number.isFinite(p) || p <= 0) return setMsg({ text: "Price must be > 0.", ok: false });
    try {
      const res = await api.put(`/products/${editId}/`, { ...editForm, current_price: p });
      setProducts(products.map(x => x.id === editId ? res.data : x));
      setEditId(null);
      setMsg({ text: "Product updated!", ok: true });
    } catch { setMsg({ text: "Failed to update.", ok: false }); }
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}/`);
      setProducts(products.filter(p => p.id !== id));
      setMsg({ text: "Product deleted.", ok: true });
    } catch { setMsg({ text: "Cannot delete — it may be used in orders.", ok: false }); }
  }

  const shown = products.filter(p => {
    const s = search.toLowerCase();
    return !s || p.name.toLowerCase().includes(s) || (p.category || "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Products / Menu</h1>
        <p className="text-sm text-gray-500">Add, edit, and remove menu items.</p>
      </div>

      {msg.text && (
        <div className={`rounded-2xl p-4 text-sm font-medium ${msg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add form */}
        <form onSubmit={addProduct} className="rounded-2xl bg-white border shadow-sm p-5 space-y-3 lg:col-span-1">
          <div className="font-extrabold text-lg">Add New Item</div>
          <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Item name *" value={form.name} onChange={e => setField(setForm, "name", e.target.value)} />
          <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Description (optional)" value={form.description} onChange={e => setField(setForm, "description", e.target.value)} />
          <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Price (e.g. 99.00) *" value={form.current_price} onChange={e => setField(setForm, "current_price", e.target.value)} />
          <select className="w-full rounded-xl border px-3 py-2 text-sm bg-white" value={form.category} onChange={e => setField(setForm, "category", e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c || "-- Category (optional) --"}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_available} onChange={e => setField(setForm, "is_available", e.target.checked)} />
            Available on menu
          </label>
          <button className="w-full rounded-xl bg-black text-white py-2.5 font-semibold hover:opacity-90 text-sm">Add Item</button>
        </form>

        {/* List */}
        <div className="lg:col-span-2 rounded-2xl bg-white border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex gap-3 items-center">
            <input className="flex-1 rounded-xl border px-3 py-2 text-sm" placeholder="Search by name or category..." value={search} onChange={e => setSearch(e.target.value)} />
            <button onClick={fetchProducts} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Refresh</button>
            <span className="text-xs text-gray-500 whitespace-nowrap">{shown.length}/{products.length}</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : shown.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No products found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-600">Item</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Category</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Price</th>
                    <th className="text-left p-3 font-semibold text-gray-600">Status</th>
                    <th className="text-right p-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shown.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-semibold">{p.name}</div>
                        {p.description && <div className="text-xs text-gray-400">{p.description}</div>}
                      </td>
                      <td className="p-3 text-gray-500">{p.category || "—"}</td>
                      <td className="p-3 font-semibold">₱{money(p.current_price)}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${p.is_available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {p.is_available ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(p)} className="rounded-xl border px-3 py-1.5 text-xs hover:bg-gray-50">Edit</button>
                          <button onClick={() => deleteProduct(p.id)} className="rounded-xl border px-3 py-1.5 text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-200">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="font-extrabold text-lg">Edit Product</div>
            <form onSubmit={saveEdit} className="space-y-3">
              <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Name *" value={editForm.name} onChange={e => setField(setEditForm, "name", e.target.value)} />
              <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Description" value={editForm.description} onChange={e => setField(setEditForm, "description", e.target.value)} />
              <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Price *" value={editForm.current_price} onChange={e => setField(setEditForm, "current_price", e.target.value)} />
              <select className="w-full rounded-xl border px-3 py-2 text-sm bg-white" value={editForm.category} onChange={e => setField(setEditForm, "category", e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c || "-- Category --"}</option>)}
              </select>
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
