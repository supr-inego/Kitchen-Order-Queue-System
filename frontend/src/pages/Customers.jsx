import { useEffect, useState } from "react";
import { api } from "../api/api";
import EditModal from "../components/EditModal";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // edit modal states
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  async function fetchCustomers() {
    try {
      setMsg("");
      setLoading(true);
      const res = await api.get("/customers/");
      setCustomers(res.data);
    } catch (err) {
      console.log(err);
      setMsg("Failed to load customers. Make sure Django is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function addCustomer(e) {
    e.preventDefault();
    setMsg("");

    if (!name.trim() || !email.trim()) {
      setMsg("Name and email are required.");
      return;
    }

    try {
      const res = await api.post("/customers/", { name, email });
      setCustomers([res.data, ...customers]);
      setName("");
      setEmail("");
    } catch (err) {
      console.log(err);
      const errorEmail = err?.response?.data?.email?.[0];
      setMsg(errorEmail ? String(errorEmail) : "Failed to add customer.");
    }
  }

  function openEdit(customer) {
    setEditId(customer.id);
    setEditName(customer.name);
    setEditEmail(customer.email);
    setOpen(true);
    setMsg("");
  }

  async function updateCustomer(e) {
    e.preventDefault();
    setMsg("");

    if (!editName.trim() || !editEmail.trim()) {
      setMsg("Name and email are required.");
      return;
    }

    try {
      const res = await api.put(`/customers/${editId}/`, {
        name: editName,
        email: editEmail,
      });

      const updated = customers.map((c) => (c.id === editId ? res.data : c));
      setCustomers(updated);
      setOpen(false);
    } catch (err) {
      console.log(err);
      const errorEmail = err?.response?.data?.email?.[0];
      setMsg(errorEmail ? String(errorEmail) : "Failed to update customer.");
    }
  }

  async function deleteCustomer(id) {
    setMsg("");
    try {
      await api.delete(`/customers/${id}/`);
      setCustomers(customers.filter((c) => c.id !== id));
    } catch (err) {
      console.log(err);
      setMsg("Failed to delete customer.");
    }
  }

  const shown = customers.filter((c) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (
      String(c.id).includes(s) ||
      (c.name || "").toLowerCase().includes(s) ||
      (c.email || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Customers</h1>
          <p className="text-sm text-gray-500">Manage customers for ordering.</p>
        </div>

        <div className="flex gap-2">
          <input
            className="w-full md:w-72 rounded-xl border px-3 py-2 bg-white"
            placeholder="Search name/email/id"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={fetchCustomers}
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
          onSubmit={addCustomer}
          className="lg:col-span-1 rounded-2xl bg-white border shadow-sm p-4 space-y-3"
        >
          <div className="font-bold">Add Customer</div>

          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="w-full rounded-xl bg-black text-white py-2 font-medium hover:opacity-90">
            Add
          </button>

          <div className="text-xs text-gray-500">Email must be unique.</div>
        </form>

        {/* list */}
        <div className="lg:col-span-2 rounded-2xl bg-white border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-bold">Customer List</div>
            <div className="text-xs text-gray-500">
              {shown.length} shown • {customers.length} total
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-gray-500">Loading…</div>
          ) : shown.length === 0 ? (
            <div className="p-6 text-gray-500">No customers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left p-3">ID</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shown.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-500">{c.id}</td>
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3 text-gray-600">{c.email}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(c)}
                            className="rounded-xl border px-3 py-1.5 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteCustomer(c.id)}
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
        title={`Edit Customer #${editId || ""}`}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={updateCustomer} className="space-y-3">
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
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