import { useEffect, useState } from "react";
import { api } from "../../api/api";

const QUEUE_STATUSES = ["waiting", "cooking", "serving", "done"];

function queueBadge(s) {
  switch (s) {
    case "waiting": return "bg-yellow-50 text-yellow-700 border-yellow-300";
    case "cooking": return "bg-orange-100 text-orange-800 border-orange-300";
    case "serving": return "bg-green-100 text-green-800 border-green-300";
    case "done": return "bg-gray-100 text-gray-500 border-gray-200";
    default: return "bg-gray-50 text-gray-500 border-gray-200";
  }
}

export default function AdminQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("all");

  async function fetchQueue() {
    setLoading(true);
    try {
      const res = await api.get("/queue/");
      setQueue(Array.isArray(res.data) ? res.data : []);
    } catch { setMsg("Failed to load queue."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  async function updateQueueStatus(id, status) {
    try {
      const res = await api.patch(`/queue/${id}/`, { status });
      setQueue(queue.map(q => q.id === id ? res.data : q));
    } catch { setMsg("Failed to update queue status."); }
  }

  async function callNext() {
    try {
      await api.post("/queue/next/");
      fetchQueue();
    } catch (err) {
      setMsg(err.response?.data?.detail || "No waiting tickets.");
    }
  }

  const shown = filter === "all" ? queue : queue.filter(q => q.status === filter);
  const counts = QUEUE_STATUSES.reduce((acc, s) => {
    acc[s] = queue.filter(q => q.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Kitchen Queue</h1>
          <p className="text-sm text-gray-500">Live ticket view </p>
        </div>
        <div className="flex gap-2">
          <button onClick={callNext} className="rounded-xl bg-black text-white px-5 py-2 text-sm font-semibold hover:opacity-90">
            📣 Call Next
          </button>
          <button onClick={fetchQueue} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Refresh</button>
        </div>
      </div>

      {msg && <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">{msg} <button onClick={() => setMsg("")} className="ml-2 text-yellow-500">✕</button></div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Waiting", count: counts.waiting || 0, icon: "⏳", color: "text-yellow-600" },
          { label: "Cooking", count: counts.cooking || 0, icon: "🔥", color: "text-orange-600" },
          { label: "Serving", count: counts.serving || 0, icon: "🛎️", color: "text-green-600" },
          { label: "Done", count: counts.done || 0, icon: "✅", color: "text-gray-500" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white border shadow-sm p-4">
            <div className="text-xl">{s.icon}</div>
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...QUEUE_STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium border capitalize transition ${filter === s ? "bg-black text-white border-black" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
            {s} {s !== "all" ? `(${counts[s] || 0})` : `(${queue.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading queue...</div>
      ) : shown.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No tickets.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map(q => (
            <div key={q.id} className={`rounded-2xl border-2 p-5 ${
              q.status === "cooking" ? "border-orange-300 bg-orange-50" :
              q.status === "serving" ? "border-green-300 bg-green-50" :
              q.status === "done" ? "border-gray-200 bg-gray-50 opacity-60" :
              "border-gray-200 bg-white"
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-3xl font-extrabold text-gray-800">#{q.ticket_number}</div>
                  <div className="font-semibold text-gray-700">{q.customer_name || q.name}</div>
                  {q.order_id && <div className="text-xs text-gray-400">Order #{q.order_id}</div>}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border uppercase ${queueBadge(q.status)}`}>
                  {q.status}
                </span>
              </div>
              <div className="text-xs text-gray-400 mb-3">{new Date(q.created_at).toLocaleTimeString()}</div>
              <div className="flex gap-2 flex-wrap">
                {QUEUE_STATUSES.map(s => (
                  <button key={s} onClick={() => updateQueueStatus(q.id, s)}
                    disabled={q.status === s}
                    className={`rounded-lg px-3 py-1 text-xs font-medium border capitalize transition ${q.status === s ? "bg-black text-white border-black" : "bg-white border-gray-200 hover:bg-gray-50 disabled:opacity-40"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
