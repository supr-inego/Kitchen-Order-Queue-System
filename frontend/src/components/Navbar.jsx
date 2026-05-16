import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { authAPI } from "../api/api";
import { useAuth } from "../App";

export default function Navbar() {
  const base = "px-3 py-2 rounded-xl text-sm font-medium border transition";
  const active = "bg-black text-white border-black";
  const idle = "bg-white border-gray-200 hover:bg-gray-50";
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await authAPI.logout(localStorage.getItem("refresh_token")); } catch {}
    finally { logout(); navigate("/login", { replace: true }); }
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 rounded-2xl bg-black text-white grid place-items-center font-bold text-xs">CR</div>
          <div className="leading-tight hidden sm:block">
            <div className="font-extrabold text-sm">Crammer's Restaurant</div>
            <div className="text-xs text-gray-400">{isAdmin ? "🍳 Staff Portal" : "🛒 Customer"}</div>
          </div>
        </div>

        <nav className="flex gap-1.5 items-center flex-wrap justify-end">
          {isAdmin ? (
            <>
              <NavLink to="/admin" end className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Dashboard</NavLink>
              <NavLink to="/admin/products" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Products</NavLink>
              <NavLink to="/admin/orders" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Orders</NavLink>
              <NavLink to="/admin/queue" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Queue</NavLink>
              <NavLink to="/admin/coupons" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Coupons</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/home" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Home</NavLink>
              <NavLink to="/coupons" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Coupons</NavLink>
              <NavLink to="/order" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Order</NavLink>
              <NavLink to="/my-orders" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>My Orders</NavLink>
              <NavLink to="/track" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Track</NavLink>
            </>
          )}
          <NavLink to="/profile" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Profile</NavLink>
          <button onClick={handleLogout} disabled={loggingOut}
            className={`${base} bg-red-50 border-red-200 text-red-600 hover:bg-red-100 disabled:opacity-50`}>
            {loggingOut ? "..." : "Logout"}
          </button>
        </nav>
      </div>
    </header>
  );
}
