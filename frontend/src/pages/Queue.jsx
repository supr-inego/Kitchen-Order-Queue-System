import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function Queue() {
  const [queue, setQueue] = useState([]);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // HELPER: Monochrome Status Styles (High Visibility & Standard Font)
  const getStatusStyles = (status) => {
    const s = status?.toLowerCase() || 'waiting';
    switch (s) {
      case 'waiting':
        return 'bg-white text-gray-500 border-gray-300 italic';
      case 'cooking':
        return 'bg-gray-100 text-gray-900 border-gray-400 font-semibold';
      case 'serving':
        return 'bg-black text-white border-black shadow-sm';
      case 'done':
        return 'bg-white text-gray-400 border-gray-200 line-through opacity-60';
      default:
        return 'bg-white text-gray-600 border-gray-300';
    }
  };

  async function fetchQueue() {
    try {
      setLoading(true);
      const res = await api.get("/queue/");
      setQueue(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMsg("Failed to load queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQueue();
  }, []);

  async function addToQueue(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await api.post("/queue/", { name });
      setQueue([res.data, ...queue]);
      setName("");
    } catch (err) {
      setMsg("Failed to add.");
    }
  }

  async function callNext() {
    try {
      const res = await api.post("/queue/next/");
      setMsg(`Cooking ticket #${res.data.ticket_number}`);
      fetchQueue();
    } catch (err) {
      setMsg("Error calling next.");
    }
  }

  async function updateStatus(id, status) {
    try {
      const res = await api.patch(`/queue/${id}/`, { status });
      const updated = queue.map((q) => (q.id === id ? res.data : q));
      setQueue(updated);
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteQueue(id) {
    try {
      await api.delete(`/queue/${id}/`);
      setQueue(queue.filter((q) => q.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  const shown = queue.filter((q) => {
    const s = search.toLowerCase();
    return !s || 
      String(q.ticket_number || "").includes(s) ||
      (q.name || "").toLowerCase().includes(s) ||
      (q.status || "").toLowerCase().includes(s);
  });

  const cookingCount = queue.filter(q => q.status?.toLowerCase() === 'cooking').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header - Matched to Orders Tab */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Queue System</h1>
          <p className="text-sm text-gray-500 font-medium">Manage live kitchen tickets.</p>
        </div>

        <div className="flex gap-2">
          <input
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:ring-1 focus:ring-black outline-none"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={fetchQueue} className="rounded-xl border border-gray-400 px-4 py-2 text-sm font-semibold hover:bg-gray-100 transition-colors">
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl">
          <p className="text-xs text-gray-500 font-semibold uppercase mb-1">In Progress</p>
          <p className="text-2xl font-bold text-black">{cookingCount}</p>
        </div>
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Total Active</p>
          <p className="text-2xl font-bold text-black">{shown.length}</p>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl bg-black text-white p-4 text-sm font-semibold text-center">
          {msg}
        </div>
      )}

      {/* Primary Action */}
      <button onClick={callNext} className="w-full rounded-2xl bg-black text-white py-4 font-bold hover:bg-gray-800 transition-all active:scale-[0.98]">
        Call Next Ticket
      </button>

      {/* Add Form */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-4 uppercase text-xs tracking-wider">Add Customer</h2>
        <form onSubmit={addToQueue} className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none"
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="rounded-xl bg-black text-white px-8 py-3 font-bold hover:bg-gray-900 transition-all">
            Add
          </button>
        </form>
      </div>

      {/* List Container */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <span className="font-bold text-xs text-gray-600 uppercase">Queue List</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Syncing...</div>
        ) : shown.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500 font-medium">No active tickets</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 font-semibold border-b border-gray-200 uppercase">
                  <th className="p-4 text-left">No.</th>
                  <th className="p-4 text-left">Customer</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shown.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-semibold text-gray-500">#{q.ticket_number}</td>
                    <td className="p-4 font-bold text-gray-900">{q.name}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase ${getStatusStyles(q.status)}`}>
                        {q.status || 'waiting'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {/* Full Text Buttons */}
                        <button 
                          onClick={() => updateStatus(q.id, "cooking")} 
                          className="border border-gray-400 px-3 py-1.5 rounded-xl hover:bg-black hover:text-white transition-all text-[10px] font-bold uppercase text-gray-700"
                        >
                          Cooking
                        </button>
                        <button 
                          onClick={() => updateStatus(q.id, "serving")} 
                          className="border border-gray-400 px-3 py-1.5 rounded-xl hover:bg-black hover:text-white transition-all text-[10px] font-bold uppercase text-gray-700"
                        >
                          Serving
                        </button>
                        <button 
                          onClick={() => updateStatus(q.id, "done")} 
                          className="border border-gray-400 px-3 py-1.5 rounded-xl hover:bg-black hover:text-white transition-all text-gray-700 font-bold"
                        >
                          ✓
                        </button>
                        <button 
                          onClick={() => deleteQueue(q.id)} 
                          className="border border-gray-400 px-3 py-1.5 rounded-xl hover:bg-red-600 hover:text-white transition-all text-red-700"
                        >
                          ✕
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