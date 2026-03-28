import { useState } from "react";
import { api } from "../api/api";

const STATUS_FLOW = ["pending", "preparing", "ready", "completed"];

function normalizeStatus(status) {
  const normalized = (status || "").toLowerCase().trim();
  const aliases = {
    prepared: "preparing",
    complete: "completed",
    done: "completed",
  };
  return aliases[normalized] || normalized;
}

function labelStatus(status) {
  const normalized = normalizeStatus(status);
  if (!normalized) return "Unknown";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onTrack(e) {
    e.preventDefault();
    setMsg("");
    setOrder(null);

    const id = Number(orderId);
    if (!Number.isInteger(id) || id <= 0) {
      setMsg("Enter a valid order number.");
      return;
    }

    try {
      setBusy(true);
      const res = await api.get(`/orders/${id}/`);
      setOrder(res.data);
    } catch (err) {
      console.log(err);
      setMsg("Order not found.");
    } finally {
      setBusy(false);
    }
  }

  const normalizedStatus = normalizeStatus(order?.status);
  const currentIndex = STATUS_FLOW.indexOf(normalizedStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Track Order</h1>
        <p className="text-sm text-gray-500">
          Search by order number to view real-time progress.
        </p>
      </div>

      <form
        onSubmit={onTrack}
        className="rounded-2xl bg-white border shadow-sm p-4 flex flex-col md:flex-row gap-3"
      >
        <input
          type="number"
          min="1"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Enter order number (e.g. 12)"
        />
        <button
          disabled={busy}
          className="rounded-xl bg-black text-white px-5 py-2 disabled:opacity-50"
        >
          {busy ? "Tracking..." : "Track"}
        </button>
      </form>

      {msg && (
        <div className="rounded-2xl border bg-white p-4 text-sm text-red-700">
          {msg}
        </div>
      )}

      {order && (
        <div className="rounded-2xl bg-white border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex flex-wrap justify-between gap-3">
            <div>
              <div className="font-bold text-lg">Order #{order.id}</div>
              <div className="text-sm text-gray-500">
                Created{" "}
                {order.created_at
                  ? new Date(order.created_at).toLocaleString()
                  : "-"}
              </div>
            </div>
            <div className="text-sm">
              Status:{" "}
              <span className="font-bold text-black">
                {labelStatus(order.status)}
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {STATUS_FLOW.map((status, idx) => {
                const isCurrent = idx === currentIndex;
                const isDone = currentIndex > idx;

                return (
                  <div
                    key={status}
                    className={`rounded-xl border px-3 py-3 text-center text-sm font-medium ${
                      isCurrent
                        ? "bg-black text-white border-black"
                        : isDone
                        ? "bg-gray-100 border-gray-300"
                        : "bg-white"
                    }`}
                  >
                    {labelStatus(status)}
                  </div>
                );
              })}
            </div>

            {normalizedStatus === "cancelled" && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-medium text-red-700">
                Cancelled
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}