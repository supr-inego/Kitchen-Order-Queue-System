import { useEffect, useState } from "react";
import { api } from "../api/api";

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Orders() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ product: "", quantity: 1 }]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function fetchAll() {
    try {
      setMsg("");
      setLoading(true);

      const c = await api.get("/customers/");
      const p = await api.get("/products/");
      const o = await api.get("/orders/");

      setCustomers(Array.isArray(c.data) ? c.data : []);
      setProducts(Array.isArray(p.data) ? p.data : []);
      setOrders(Array.isArray(o.data) ? o.data : []);
    } catch (err) {
      console.log(err);
      setMsg("Failed to load order data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  function addItemRow() {
    setItems([...items, { product: "", quantity: 1 }]);
  }

  function removeItemRow(index) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function changeItem(index, field, value) {
    const copy = [...items];
    copy[index] = { ...copy[index], [field]: value };
    setItems(copy);
  }

  const cart = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const pid = Number(it.product);
    const qty = Number(it.quantity);

    if (!pid || !qty || qty <= 0) continue;

    const prod = products.find((p) => p.id === pid);
    const unit = Number(prod?.current_price || 0);

    cart.push({
      productId: pid,
      name: prod?.name || "Product",
      qty,
      unit,
      amount: unit * qty,
    });
  }

  let cartTotal = 0;
  for (let i = 0; i < cart.length; i++) {
    cartTotal += cart[i].amount;
  }

  const canCreate = customerId && cart.length > 0;

  async function createOrder(e) {
    e.preventDefault();
    setMsg("");

    if (!canCreate) {
      setMsg("Select a customer and add at least one item.");
      return;
    }

    try {
      setBusy(true);

      const payload = {
        customer: Number(customerId),
        items_payload: cart.map((c) => ({
          product: c.productId,
          quantity: c.qty,
        })),
      };

      const res = await api.post("/orders/", payload);
      setOrders([res.data, ...orders]);

      setCustomerId("");
      setItems([{ product: "", quantity: 1 }]);
      setMsg("Order created successfully.");
    } catch (err) {
      console.log(err);
      setMsg("Failed to create order.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteOrder(id) {
    try {
      await api.delete(`/orders/${id}/`);
      setOrders(orders.filter((o) => o.id !== id));
    } catch (err) {
      console.log(err);
      setMsg("Failed to delete order.");
    }
  }

  async function updateOrderStatus(id, status) {
    const aliases = {
      prepared: "preparing",
      complete: "completed",
      done: "completed",
    };
    const normalized = aliases[status] || status;

    try {
      const res = await api.patch(`/orders/${id}/`, { status: normalized });
      setOrders(orders.map((o) => (o.id === id ? res.data : o)));
    } catch (err) {
      console.log(err);
      setMsg("Failed to update order status.");
    }
  }

  function badgeClass(status) {
    if (status === "cancelled") return "bg-red-100 text-red-800";
    if (status === "completed") return "bg-green-100 text-green-800";
    if (status === "ready") return "bg-blue-100 text-blue-800";
    if (status === "preparing") return "bg-amber-100 text-amber-800";
    return "bg-gray-100 text-gray-800";
  }

  function getCustomerName(id) {
    const c = customers.find((x) => x.id === Number(id));
    return c ? c.name : `Customer #${id}`;
  }

  function getOrderTotal(order) {
    let total = 0;
    const list = order.items || [];

    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      total += Number(it.unit_price || 0) * Number(it.quantity || 0);
    }

    return total;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500">
            Create orders and view previous orders.
          </p>
        </div>

        <button
          onClick={fetchAll}
          className="rounded-xl border px-4 py-2 bg-white hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {msg && (
        <div className="rounded-2xl border bg-white p-4 text-sm text-red-700">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-start justify-between">
            <div>
              <div className="font-bold">Create Order</div>
              <div className="text-sm text-gray-500">
                Choose customer and products.
              </div>
            </div>

            <button
              type="button"
              onClick={addItemRow}
              className="rounded-xl border px-3 py-2 bg-white hover:bg-gray-50 text-sm"
            >
              + Add Item
            </button>
          </div>

          <div className="p-4">
            <form onSubmit={createOrder} className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Customer</label>

                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2 bg-white"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">-- select customer --</option>

                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
                  >
                    <div className="md:col-span-8">
                      <label className="text-sm font-semibold">Product</label>

                      <select
                        className="mt-1 w-full rounded-xl border px-3 py-2 bg-white"
                        value={it.product}
                        onChange={(e) =>
                          changeItem(idx, "product", e.target.value)
                        }
                      >
                        <option value="">-- select product --</option>

                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₱ {money(p.current_price)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-sm font-semibold">Qty</label>

                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) =>
                          changeItem(idx, "quantity", e.target.value)
                        }
                      />
                    </div>

                    <div className="md:col-span-1 flex md:justify-end">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length === 1}
                        className="h-10 w-10 rounded-xl border hover:bg-red-50 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                disabled={!canCreate || busy}
                className="w-full rounded-xl bg-black text-white py-3 font-semibold disabled:opacity-50"
              >
                {busy ? "Creating..." : "Create Order"}
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-2xl bg-white border shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <div className="font-bold">Cart Summary</div>
            <div className="text-sm text-gray-500">
              Total updates automatically.
            </div>
          </div>

          <div className="p-4">
            {cart.length === 0 ? (
              <div className="text-sm text-gray-500">No items yet.</div>
            ) : (
              <div className="space-y-3">
                {cart.map((c, index) => (
                  <div
                    key={`${c.productId}-${index}`}
                    className="flex justify-between items-start"
                  >
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-gray-500">
                        ₱ {money(c.unit)} × {c.qty}
                      </div>
                    </div>

                    <div className="font-semibold">
                      ₱ {money(c.amount)}
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t flex justify-between">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-xl font-extrabold">
                    ₱ {money(cartTotal)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between">
          <div>
            <div className="font-bold">Order History</div>
            <div className="text-sm text-gray-500">Latest orders first.</div>
          </div>

          <div className="text-xs text-gray-500">{orders.length} orders</div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="text-gray-500">No orders yet.</div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => {
                const orderTotal = getOrderTotal(o);
                const customerName = getCustomerName(o.customer);

                return (
                  <div key={o.id} className="rounded-2xl border bg-white">
                    <div className="p-4 border-b flex justify-between items-start">
                      <div>
                        <div className="font-bold">
                          Order #{o.id}
                          {o.queue_ticket?.ticket_number ? (
                            <span className="ml-2 text-xs text-gray-500">
                              • Ticket #{o.queue_ticket.ticket_number}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-sm text-gray-500">
                          Customer: {customerName} •{" "}
                          {o.created_at
                            ? new Date(o.created_at).toLocaleString()
                            : "-"}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${badgeClass(
                            o.status
                          )}`}
                        >
                          {o.status || "pending"}
                        </span>

                        <select
                          className="rounded-xl border px-2 py-1 text-sm bg-white"
                          value={o.status || "pending"}
                          onChange={(e) =>
                            updateOrderStatus(o.id, e.target.value)
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Complete</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        <div className="text-lg font-extrabold">
                          ₱ {money(orderTotal)}
                        </div>

                        <button
                          onClick={() => deleteOrder(o.id)}
                          className="rounded-xl border px-3 py-2 text-sm hover:bg-red-50 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="p-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-gray-600">
                          <tr className="border-b">
                            <th className="text-left py-2">Product</th>
                            <th className="text-left py-2">Qty</th>
                            <th className="text-left py-2">Unit</th>
                            <th className="text-left py-2">Amount</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y">
                          {(o.items || []).map((it) => {
                            const unit = Number(it.unit_price || 0);
                            const qty = Number(it.quantity || 0);
                            const amount = unit * qty;

                            return (
                              <tr key={it.id}>
                                <td className="py-2 font-medium">
                                  {it.product?.name || "Product"}
                                </td>

                                <td className="py-2">{qty}</td>

                                <td className="py-2">
                                  ₱ {money(unit)}
                                </td>

                                <td className="py-2 font-semibold">
                                  ₱ {money(amount)}
                                </td>
                              </tr>
                            );
                          })}

                          {(o.items || []).length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-3 text-gray-500">
                                No items
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}