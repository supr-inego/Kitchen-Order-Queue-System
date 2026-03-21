import { NavLink } from "react-router-dom";

export default function Navbar() {
  const base =
    "px-4 py-2 rounded-xl text-sm font-medium border transition";
  const active = "bg-black text-white border-black";
  const idle = "bg-white border-gray-200 hover:bg-gray-50";

  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-black text-white grid place-items-center font-bold">
            IK
          </div>

          <div className="leading-tight">
            <div className="font-extrabold">Isang Kagat</div>
            <div className="text-xs text-gray-500">bakit mo ko iniwan?</div>
          </div>
        </div>

        <nav className="flex gap-2">
          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `${base} ${isActive ? active : idle}`
            }
          >
            Customers
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) =>
              `${base} ${isActive ? active : idle}`
            }
          >
            Products
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `${base} ${isActive ? active : idle}`
            }
          >
            Orders
          </NavLink>
        </nav>
      </div>
    </header>
  );
}