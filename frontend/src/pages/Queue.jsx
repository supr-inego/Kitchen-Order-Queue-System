import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function Queue() {
  const [queue, setQueue] = useState([]);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // fetch queue
  async function fetchQueue() {
    try {
      setLoading(true);
      const res = await api.get("/queue/");
      setQueue(res.data);
    } catch (err) {
      console.log(err);
      setMsg("Failed to load queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQueue();
  }, []);

  // add to queue
  async function addToQueue(e) {
    e.preventDefault();
    setMsg("");

    if (!name.trim()) {
      setMsg("Name is required.");
      return;
    }

    try {
      const res = await api.post("/queue/", { name });
      setQueue([res.data, ...queue]);
      setName("");
    } catch (err) {
      console.log(err);
      setMsg("Failed to add to queue.");
    }
  }

  // call next (start cooking next waiting ticket)
  async function callNext() {
    try {
      const res = await api.post("/queue/next/");
      setMsg(`Now cooking ticket #${res.data.ticket_number}`);
      fetchQueue();
    } catch (err) {
      console.log(err);
      setMsg("Failed to call next.");
    }
  }

  // update status manually (optional)
  async function updateStatus(id, status) {
    try {
      const res = await api.patch(`/queue/${id}/`, { status });
      const updated = queue.map((q) => (q.id === id ? res.data : q));
      setQueue(updated);
    } catch (err) {
      console.log(err);
    }
  }

  // delete
  async function deleteQueue(id) {
    try {
      await api.delete(`/queue/${id}/`);
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

      {/* header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Queue System</h1>
          <p className="text-sm text-gray-500">Manage queue tickets.</p>
        </div>

        <div className="flex gap-2">
          <input
            className="rounded-xl border px-3 py-2"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={fetchQueue}
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl border bg-white p-3 text-sm text-blue-700">
          {msg}
        </div>
      )}

      {/* controls */}
      <div className="flex gap-2">
        <button
          onClick={callNext}
          className="rounded-xl bg-black text-white px-4 py-2"
        >
          Call Next
        </button>
      </div>

      {/* add form */}
      <form
        onSubmit={addToQueue}
        className="rounded-2xl bg-white border p-4 space-y-3"
      >
        <div className="font-bold">Join Queue</div>

        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button className="w-full rounded-xl bg-black text-white py-2">
          Get Ticket
        </button>
      </form>

      {/* list */}
      <div className="rounded-2xl bg-white border overflow-hidden">
        <div className="p-4 border-b font-bold">Queue List</div>

        {loading ? (
          <div className="p-6 text-gray-500">Loading...</div>
        ) : shown.length === 0 ? (
          <div className="p-6 text-gray-500">No queue data.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Ticket</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((q) => (
                <tr key={q.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{q.ticket_number}</td>
                  <td className="p-3">{q.name}</td>
                  <td className="p-3 capitalize">{q.status}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateStatus(q.id, "cooking")}
                        className="border px-3 py-1 rounded-xl"
                      >
                        Cooking
                      </button>
                      <button
                        onClick={() => updateStatus(q.id, "serving")}
                        className="border px-3 py-1 rounded-xl"
                      >
                        Serve
                      </button>
                      <button
                        onClick={() => updateStatus(q.id, "done")}
                        className="border px-3 py-1 rounded-xl"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => deleteQueue(q.id)}
                        className="border px-3 py-1 rounded-xl text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}