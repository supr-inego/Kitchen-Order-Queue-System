import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { authAPI } from "../api/api";
import { useAuth } from "../App";

export default function Navbar() {
  const base = "px-4 py-2 rounded-xl text-sm font-medium border transition";
  const active = "bg-black text-white border-black";
  const idle = "bg-white border-gray-200 hover:bg-gray-50";
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { logout, isAdmin, user } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const refresh = localStorage.getItem("refresh_token");
      await authAPI.logout(refresh);
    } catch {}
    finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-black text-white grid place-items-center font-bold text-sm">CR</div>
          <div className="leading-tight">
            <div className="font-extrabold text-sm">Crammer's Restaurant</div>
            <div className="text-xs text-gray-500">
              {isAdmin ? "🍳 Staff Portal" : "🛒 Customer Portal"}
            </div>
          </div>
        </div>

        <nav className="flex gap-2 items-center flex-wrap">
          {isAdmin ? (
            <>
              <NavLink to="/admin" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Dashboard</NavLink>
              <NavLink to="/admin/products" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Products</NavLink>
              <NavLink to="/admin/orders" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Orders</NavLink>
              <NavLink to="/admin/queue" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Kitchen Queue</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/home" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Home</NavLink>
              <NavLink to="/order" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Order Now</NavLink>
              <NavLink to="/my-orders" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>My Orders</NavLink>
              <NavLink to="/track" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Track Order</NavLink>
            </>
          )}
          <NavLink to="/profile" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>Profile</NavLink>
          <button onClick={handleLogout} disabled={isLoggingOut}
            className={`${base} bg-red-50 border-red-200 text-red-600 hover:bg-red-100 disabled:opacity-50`}>
            {isLoggingOut ? "..." : "Logout"}
          </button>
        </nav>
      </div>
    </header>
  );
}
