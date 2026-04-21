import { useEffect, useState } from "react";
import { api } from "../api/api";
import EditModal from "../components/EditModal";

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // edit modal
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  async function fetchProducts() {
    try {
      setMsg("");
      setLoading(true);
      const res = await api.get("/products/");
      setProducts(res.data);
    } catch (err) {
      console.log(err);
      setMsg("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function addProduct(e) {
    e.preventDefault();
    setMsg("");

    const p = Number(price);
    if (!productName.trim()) return setMsg("Product name is required.");
    if (!Number.isFinite(p) || p <= 0) return setMsg("Price must be greater than 0.");

    try {
      const res = await api.post("/products/", {
        name: productName,
        current_price: p,
      });
      setProducts([res.data, ...products]);
      setProductName("");
      setPrice("");
    } catch (err) {
      console.log(err);
      setMsg("Failed to add product.");
    }
  }

  function openEdit(product) {
    setEditId(product.id);
    setEditName(product.name);
    setEditPrice(String(product.current_price));
    setOpen(true);
    setMsg("");
  }

  async function updateProduct(e) {
    e.preventDefault();
    setMsg("");

    const p = Number(editPrice);
    if (!editName.trim()) return setMsg("Product name is required.");
    if (!Number.isFinite(p) || p <= 0) return setMsg("Price must be greater than 0.");

    try {
      const res = await api.put(`/products/${editId}/`, {
        name: editName,
        current_price: p,
      });

      const updated = products.map((x) => (x.id === editId ? res.data : x));
      setProducts(updated);
      setOpen(false);
    } catch (err) {
      console.log(err);
      setMsg("Failed to update product.");
    }
  }

  async function deleteProduct(id) {
    setMsg("");
    try {
      await api.delete(`/products/${id}/`);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      console.log(err);
      setMsg("Failed to delete product.");
    }
  }

  const shown = products.filter((p) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return String(p.id).includes(s) || (p.name || "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Products</h1>
          <p className="text-sm text-gray-500">Manage menu items and pricing.</p>
        </div>

        <div className="flex gap-2">
          <input
            className="w-full md:w-72 rounded-xl border px-3 py-2 bg-white"
            placeholder="Search name/id"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={fetchProducts}
            className="rounded-xl border px-4 py-2 bg-white hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-2xl border bg-white p-4 text-sm text-red-700">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* add form */}
        <form
          onSubmit={addProduct}
          className="lg:col-span-1 rounded-2xl bg-white border shadow-sm p-4 space-y-3"
        >
          <div className="font-bold">Add Product</div>

          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Product name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />

          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Price (e.g. 99.99)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <button className="w-full rounded-xl bg-black text-white py-2 font-medium hover:opacity-90">
            Add
          </button>

          <div className="text-xs text-gray-500">
            Orders store unit price snapshot.
          </div>
        </form>

        {/* list */}
        <div className="lg:col-span-2 rounded-2xl bg-white border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-bold">Product List</div>
            <div className="text-xs text-gray-500">
              {shown.length} shown • {products.length} total
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-gray-500">Loading…</div>
          ) : shown.length === 0 ? (
            <div className="p-6 text-gray-500">No products found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left p-3">ID</th>
                    <th className="text-left p-3">Product</th>
                    <th className="text-left p-3">Price</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shown.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-500">{p.id}</td>
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-gray-600">₱ {money(p.current_price)}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded-xl border px-3 py-1.5 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="rounded-xl border px-3 py-1.5 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                          >
                            Delete
                          </button>
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

      {/* edit modal */}
      <EditModal
        open={open}
        title={`Edit Product #${editId || ""}`}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={updateProduct} className="space-y-3">
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Product name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Price"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
          />

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border px-4 py-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button className="rounded-xl bg-black text-white px-4 py-2 hover:opacity-90">
              Save
            </button>
          </div>
        </form>
      </EditModal>
    </div>
  );
}