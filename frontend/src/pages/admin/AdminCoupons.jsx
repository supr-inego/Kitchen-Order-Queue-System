import { useEffect, useState } from "react";
import { api } from "../../api/api";

function money(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v;
}

const TYPE_HINT = {
  percentage: "Enter percentage 0–100 (e.g. 20 = 20% off)",
  fixed: "Enter peso amount to deduct (e.g. 50 = ₱50 off)",
  free_item: "Cheapest item in the cart will be free (value ignored)",
};

const BLANK = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  min_order_total: "0",
  max_uses: "0",
  max_claims_per_user: "1",
  is_active: true,
  valid_from: "",
  valid_until: "",
};

function CouponBadge({ c }) {
  if (!c.is_valid) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">
        Expired/Off
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
      Active
    </span>
  );
}

function setField(setter, field, val) {
  setter((prev) => ({ ...prev, [field]: val }));
}

/** Defined at module scope so inputs keep focus while typing. */
function CouponForm({ f, setter, onSubmit, submitLabel, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        className="w-full rounded-xl border px-3 py-2 text-sm font-mono uppercase"
        placeholder="CODE (e.g. SAVE20) *"
        value={f.code}
        onChange={(e) => setField(setter, "code", e.target.value.toUpperCase())}
      />
      <input
        className="w-full rounded-xl border px-3 py-2 text-sm"
        placeholder="Description (shown to customer)"
        value={f.description}
        onChange={(e) => setField(setter, "description", e.target.value)}
      />
      <select
        className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
        value={f.discount_type}
        onChange={(e) => setField(setter, "discount_type", e.target.value)}
      >
        <option value="percentage">Percentage Off (%)</option>
        <option value="fixed">Fixed Amount Off (₱)</option>
        <option value="free_item">Free Item (cheapest item)</option>
      </select>
      <p className="text-xs text-gray-400">{TYPE_HINT[f.discount_type]}</p>
      {f.discount_type !== "free_item" && (
        <input
          className="w-full rounded-xl border px-3 py-2 text-sm"
          type="number"
          min="0"
          step="any"
          placeholder={f.discount_type === "percentage" ? "Percentage (e.g. 20)" : "Amount (e.g. 50)"}
          value={f.discount_value}
          onChange={(e) => setField(setter, "discount_value", e.target.value)}
        />
      )}
      <input
        className="w-full rounded-xl border px-3 py-2 text-sm"
        type="number"
        min="0"
        step="any"
        placeholder="Min order total (₱0 = no minimum)"
        value={f.min_order_total}
        onChange={(e) => setField(setter, "min_order_total", e.target.value)}
      />
      <input
        className="w-full rounded-xl border px-3 py-2 text-sm"
        type="number"
        min="0"
        placeholder="Max uses (0 = unlimited)"
        value={f.max_uses}
        onChange={(e) => setField(setter, "max_uses", e.target.value)}
      />
      <input
        className="w-full rounded-xl border px-3 py-2 text-sm"
        type="number"
        min="0"
        placeholder="Max claims per customer (0 = unlimited, default 1)"
        value={f.max_claims_per_user}
        onChange={(e) => setField(setter, "max_claims_per_user", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500">Valid From</label>
          <input
            type="datetime-local"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={f.valid_from}
            onChange={(e) => setField(setter, "valid_from", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Valid Until</label>
          <input
            type="datetime-local"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={f.valid_until}
            onChange={(e) => setField(setter, "valid_until", e.target.value)}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={f.is_active}
          onChange={(e) => setField(setter, "is_active", e.target.checked)}
        />
        Active (customers can use this)
      </label>
      <div className="flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border py-2 text-sm hover:bg-gray-50">
            Cancel
          </button>
        )}
        <button type="submit" className="flex-1 rounded-xl bg-black text-white py-2 text-sm font-semibold">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function discountLabel(c) {
  if (c.discount_type === "percentage") return `${c.discount_value}% off`;
  if (c.discount_type === "fixed") return `₱${money(c.discount_value)} off`;
  return "Free cheapest item";
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(BLANK);

  async function fetchCoupons() {
    setLoading(true);
    try {
      const r = await api.get("/coupons/");
      setCoupons(Array.isArray(r.data) ? r.data : []);
    } catch {
      setMsg({ text: "Failed to load coupons.", ok: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function createCoupon(e) {
    e.preventDefault();
    if (!form.code.trim()) return setMsg({ text: "Code is required.", ok: false });
    if (
      form.discount_type !== "free_item" &&
      (isNaN(Number(form.discount_value)) || Number(form.discount_value) <= 0)
    ) {
      return setMsg({ text: "Discount value must be > 0.", ok: false });
    }
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        discount_value: form.discount_type === "free_item" ? 0 : Number(form.discount_value),
        min_order_total: Number(form.min_order_total) || 0,
        max_uses: Number(form.max_uses) || 0,
        max_claims_per_user: Number(form.max_claims_per_user) ?? 1,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
      };
      const r = await api.post("/coupons/", payload);
      setCoupons([r.data, ...coupons]);
      setForm(BLANK);
      setMsg({ text: "Coupon created!", ok: true });
    } catch (err) {
      const d = err.response?.data;
      setMsg({ text: d?.code?.[0] || d?.detail || "Failed to create coupon.", ok: false });
    }
  }

  function openEdit(c) {
    setEditId(c.id);
    setEditForm({
      code: c.code,
      description: c.description,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_total: String(c.min_order_total),
      max_uses: String(c.max_uses),
      max_claims_per_user: String(c.max_claims_per_user ?? 1),
      is_active: c.is_active,
      valid_from: c.valid_from ? c.valid_from.slice(0, 16) : "",
      valid_until: c.valid_until ? c.valid_until.slice(0, 16) : "",
    });
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      const payload = {
        ...editForm,
        code: editForm.code.toUpperCase(),
        discount_value: editForm.discount_type === "free_item" ? 0 : Number(editForm.discount_value),
        min_order_total: Number(editForm.min_order_total) || 0,
        max_uses: Number(editForm.max_uses) || 0,
        max_claims_per_user: Number(editForm.max_claims_per_user) ?? 1,
        valid_from: editForm.valid_from || null,
        valid_until: editForm.valid_until || null,
      };
      const r = await api.put(`/coupons/${editId}/`, payload);
      setCoupons(coupons.map((x) => (x.id === editId ? r.data : x)));
      setEditId(null);
      setMsg({ text: "Coupon updated!", ok: true });
    } catch {
      setMsg({ text: "Failed to update.", ok: false });
    }
  }

  async function toggleActive(c) {
    try {
      const r = await api.patch(`/coupons/${c.id}/`, { is_active: !c.is_active });
      setCoupons(coupons.map((x) => (x.id === c.id ? r.data : x)));
    } catch {
      setMsg({ text: "Failed to update.", ok: false });
    }
  }

  async function deleteCoupon(id) {
    if (!confirm("Delete this coupon?")) return;
    try {
      await api.delete(`/coupons/${id}/`);
      setCoupons(coupons.filter((c) => c.id !== id));
    } catch {
      setMsg({ text: "Failed to delete.", ok: false });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Discount Coupons</h1>
        <p className="text-sm text-gray-500">
          Customers must <strong>claim</strong> a code on My Coupons, then use it at checkout. Track claims and redemptions below.
        </p>
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        <strong>Usage rules:</strong> Global max uses = total redemptions across all customers.
        Per-user limit = how many times one account can claim the same code (usually 1).
      </div>

      {msg.text && (
        <div
          className={`rounded-2xl p-4 text-sm font-medium ${msg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-white border shadow-sm p-5 h-fit">
          <div className="font-extrabold text-lg mb-3">🏷️ Create Coupon</div>
          <CouponForm f={form} setter={setForm} onSubmit={createCoupon} submitLabel="Create Coupon" />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {coupons.length} coupon{coupons.length !== 1 ? "s" : ""}
            </div>
            <button onClick={fetchCoupons} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white border p-8 text-center text-gray-400">Loading...</div>
          ) : coupons.length === 0 ? (
            <div className="rounded-2xl bg-white border p-8 text-center text-gray-400">No coupons yet.</div>
          ) : (
            coupons.map((c) => (
              <div key={c.id} className="rounded-2xl bg-white border shadow-sm p-5 space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-lg font-mono">{c.code}</span>
                      <CouponBadge c={c} />
                    </div>
                    {c.description && <div className="text-sm text-gray-500">{c.description}</div>}
                    <div className="text-sm font-semibold text-blue-700 mt-1">{discountLabel(c)}</div>
                    <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {Number(c.min_order_total) > 0 && <span>Min. ₱{money(c.min_order_total)}</span>}
                      <span>
                        Redeemed {c.times_used}
                        {c.max_uses > 0 ? `/${c.max_uses}` : ""}
                      </span>
                      <span>
                        Claimed {c.claims_count ?? 0} · In wallet {c.unused_claims_count ?? 0}
                      </span>
                      {c.valid_until && <span>Until {new Date(c.valid_until).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${c.is_active ? "hover:bg-red-50 hover:text-red-700" : "hover:bg-green-50 hover:text-green-700"}`}
                    >
                      {c.is_active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => openEdit(c)} className="rounded-xl border px-3 py-1.5 text-xs hover:bg-gray-50">
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCoupon(c.id)}
                      className="rounded-xl border px-3 py-1.5 text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4 my-4">
            <div className="font-extrabold text-lg">Edit Coupon</div>
            <CouponForm
              f={editForm}
              setter={setEditForm}
              onSubmit={saveEdit}
              submitLabel="Save Changes"
              onCancel={() => setEditId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
