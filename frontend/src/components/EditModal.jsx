export default function EditModal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-bold">{title}</div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl border hover:bg-gray-50"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}