import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../api/api";
import { useAuth } from "../App";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      const { access, refresh, user } = response.data;
      login(access, refresh, user);
      navigate(user?.role === "admin" ? "/admin" : "/home", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.non_field_errors?.[0] || data?.email?.[0] || data?.password?.[0] ||
        data?.detail || "Login failed. Please check your credentials."
      );
    } finally { setLoading(false); }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">CR</div>
          <h2 className="logo-name">Crammer's Restaurant</h2>
          <p className="logo-sub">Kitchen Order Queue System</p>
        </div>
        <h1>Sign In</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)}
              required disabled={loading} placeholder="Username" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)}
              required disabled={loading} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-login">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="register-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
