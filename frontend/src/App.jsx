import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Activate from "./pages/Activate";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminQueue from "./pages/admin/AdminQueue";

// Customer pages
import CustomerHome from "./pages/customer/CustomerHome";
import CustomerOrder from "./pages/customer/CustomerOrder";
import CustomerMyOrders from "./pages/customer/CustomerMyOrders";
import CustomerTrack from "./pages/customer/CustomerTrack";

export const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

function ProtectedRoute({ children, requiredRole }) {
  const { isLoggedIn, loading, user } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/home"} replace />;
  }
  return children;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (access, refresh, userData) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("user", JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
  };

  const isAdmin = user?.role === "admin";
  const defaultHome = isAdmin ? "/admin" : "/home";

  return (
    <AuthContext.Provider value={{ isLoggedIn, loading, login, logout, user, isAdmin }}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          {isLoggedIn && <Navbar />}
          <main className={isLoggedIn ? "max-w-6xl mx-auto px-4 py-6" : ""}>
            <Routes>
              <Route path="/login" element={isLoggedIn ? <Navigate to={defaultHome} replace /> : <Login />} />
              <Route path="/register" element={isLoggedIn ? <Navigate to={defaultHome} replace /> : <Register />} />
              <Route path="/activate/:uid/:token" element={<Activate />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/" element={<Navigate to={isLoggedIn ? defaultHome : "/login"} replace />} />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute requiredRole="admin"><AdminProducts /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute requiredRole="admin"><AdminOrders /></ProtectedRoute>} />
              <Route path="/admin/queue" element={<ProtectedRoute requiredRole="admin"><AdminQueue /></ProtectedRoute>} />

              {/* Customer routes */}
              <Route path="/home" element={<ProtectedRoute requiredRole="customer"><CustomerHome /></ProtectedRoute>} />
              <Route path="/order" element={<ProtectedRoute requiredRole="customer"><CustomerOrder /></ProtectedRoute>} />
              <Route path="/my-orders" element={<ProtectedRoute requiredRole="customer"><CustomerMyOrders /></ProtectedRoute>} />
              <Route path="/track" element={<ProtectedRoute requiredRole="customer"><CustomerTrack /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to={isLoggedIn ? defaultHome : "/login"} replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
