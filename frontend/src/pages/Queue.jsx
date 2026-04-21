import { useEffect, useState } from "react";
import { api, getAuthHeaders } from "../api/api";

export default function Queue() {
  const [queue, setQueue] = useState([]);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // 1. Fetch queue (Added Headers)
  async function fetchQueue() {
    try {
      setLoading(true);
      const res = await api.get("/queue/", { headers: getAuthHeaders() });
      setQueue(res.data);
    } catch (err) {
      console.log(err);
      setMsg("Failed to load queue. Please check if you are logged in.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQueue();
  }, []);

  // 2. Add to queue (Added Headers)
  async function addToQueue(e) {
    e.preventDefault();
    setMsg("");

    if (!name.trim()) {
      setMsg("Name is required.");
      return;
    }

    try {
      const res = await api.post("/queue/", { name }, { headers: getAuthHeaders() });
      setQueue([res.data, ...queue]);
      setName("");
    } catch (err) {
      console.log(err);
      setMsg("Failed to add to queue.");
    }
  }

  // 3. Call next (Added Headers)
  async function callNext() {
    try {
      const res = await api.post("/queue/next/", {}, { headers: getAuthHeaders() });
      setMsg(`Now cooking ticket #${res.data.ticket}`);
      fetchQueue();
    } catch (err) {
      console.log(err);
      setMsg("Failed to call next.");
    }
  }

  // 4. NEW: Complete Ticket (Final step in the workflow)
  async function completeTicket(id) {
    try {
      const res = await api.post(`/queue/${id}/complete/`, {}, { headers: getAuthHeaders() });
      setMsg(res.data.message);
      fetchQueue();
    } catch (err) {
      console.log(err);
      setMsg("Failed to complete ticket.");
    }
  }

  // 5. Update status manually (Added Headers)
  async function updateStatus(id, status) {
    try {
      const res = await api.patch(`/queue/${id}/`, { status }, { headers: getAuthHeaders() });
      const updated = queue.map((q) => (q.id === id ? res.data : q));
      setQueue(updated);
    } catch (err) {
      console.log(err);
    }
  }

  // 6. Delete (Added Headers)
  async function deleteQueue(id) {
    try {
      await api.delete(`/queue/${id}/`, { headers: getAuthHeaders() });
      setQueue(queue.filter((q) => q.id !== id));
    } catch (err) {
      console.log(err);
    }
  }

  const shown = queue.filter((q) => {
    const s = search.toLowerCase();
    if (!s) return true;
    return (
      String(q.ticket_number).includes(s) ||
      (q.name || "").toLowerCase().includes(s) ||
      (q.status || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Queue System</h1>
          <p className="text-sm text-gray-500">Manage kitchen tickets and status.</p>
        </div>

        <div className="flex gap-2">
          <input
            className="rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-black outline-none"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={fetchQueue}
            className="rounded-xl border border-gray-200 px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700 animate-pulse">
          {msg}
        </div>
      )}

      {/* Main Controls */}
      <div className="flex gap-2">
        <button
          onClick={callNext}
          className="rounded-xl bg-black text-white px-6 py-2 font-medium hover:bg-gray-800 transition-colors"
        >
          Call Next Ticket
        </button>
      </div>

      {/* Join Queue Form */}
      <form
        onSubmit={addToQueue}
        className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm space-y-3"
      >
        <div className="font-bold text-gray-700">Add Manual Entry</div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-black"
            placeholder="Customer Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="rounded-xl bg-gray-900 text-white px-6 py-2 hover:bg-black transition-colors">
            Get Ticket
          </button>
        </div>
      </form>

      {/* Queue List Table */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b font-bold text-gray-700">Active Queue</div>

        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading live queue...</div>
        ) : shown.length === 0 ? (
          <div className="p-10 text-center text-gray-400">The queue is currently empty.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left font-semibold text-gray-600">Ticket</th>
                  <th className="p-4 text-left font-semibold text-gray-600">Customer</th>
                  <th className="p-4 text-left font-semibold text-gray-600">Status</th>
                  <th className="p-4 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((q) => (
                  <tr key={q.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono font-bold">#{q.ticket_number}</td>
                    <td className="p-4 text-gray-700">{q.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                        q.status === 'serving' ? 'bg-orange-100 text-orange-700' : 
                        q.status === 'waiting' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {/* Only show "Complete" if the ticket is currently being served */}
                        {q.status === "serving" ? (
                          <button
                            onClick={() => completeTicket(q.id)}
                            className="bg-green-600 text-white px-4 py-1 rounded-xl hover:bg-green-700 transition-colors font-medium"
                          >
                            Complete
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => updateStatus(q.id, "cooking")}
                              className="border border-gray-200 px-3 py-1 rounded-xl hover:bg-white text-gray-600"
                            >
                              Cook
                            </button>
                            <button
                              onClick={() => updateStatus(q.id, "serving")}
                              className="border border-gray-200 px-3 py-1 rounded-xl hover:bg-white text-gray-600"
                            >
                              Serve
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteQueue(q.id)}
                          className="px-3 py-1 text-red-500 hover:text-red-700 transition-colors"
                        >
                          Cancel
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
  );
}