import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Queue from "./pages/Queue";
import TrackOrder from "./pages/TrackOrder.jsx";

export default function App() {
  // We check for the token here to decide what the user can see
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-6">
          <Routes>
            {/* Redirect root to customers if logged in, otherwise to tracking */}
            <Route 
              path="/" 
              element={<Navigate to={isAuthenticated ? "/customers" : "/track-order"} replace />} 
            />

            {/* Public Routes: Anyone can see these */}
            <Route path="/products" element={<Products />} />
            <Route path="/track-order" element={<TrackOrder />} />

            {/* Private Staff Routes: Only accessible if isAuthenticated is true */}
            <Route 
              path="/customers" 
              element={isAuthenticated ? <Customers /> : <Navigate to="/track-order" />} 
            />
            <Route 
              path="/orders" 
              element={isAuthenticated ? <Orders /> : <Navigate to="/track-order" />} 
            />
            <Route 
              path="/queues" 
              element={isAuthenticated ? <Queue /> : <Navigate to="/track-order" />} 
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/track-order" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}