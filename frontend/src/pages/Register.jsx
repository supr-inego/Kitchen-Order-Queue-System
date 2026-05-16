import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../api/api";
import "./Register.css";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "", password: "", password_confirm: "",
    first_name: "", last_name: "", phone: "", address: "", age: "", birthday: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await authAPI.register(formData);
      setSuccess(res.data.message || "Registration successful! Check your email to activate your account.");
    } catch (err) {
      const d = err.response?.data;
      setError(d?.email?.[0] || d?.password?.[0] || d?.detail || "Registration failed. Please check your information.");
    } finally { setLoading(false); }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="login-logo">
          <div className="logo-icon">CR</div>
          <h2 className="logo-name">Crammer's Restaurant</h2>
          <p className="logo-sub">Create your customer account</p>
        </div>
        <h1>Create Account</h1>

        {success ? (
          <div className="space-y-4 text-center">
            <div className="success-message">{success}</div>
            <p className="text-sm text-gray-500">Check your email then come back to sign in.</p>
            <button onClick={() => navigate("/login")} className="btn-register">Go to Login</button>
          </div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleRegister}>
              <div className="form-section">
                <h3>Account Information</h3>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required disabled={loading} placeholder="your@email.com" />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} required disabled={loading} placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input type="password" name="password_confirm" value={formData.password_confirm} onChange={handleInputChange} required disabled={loading} placeholder="••••••••" />
                </div>
              </div>
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} disabled={loading} />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} disabled={loading} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} disabled={loading} />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} disabled={loading} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Age</label>
                    <input type="number" name="age" value={formData.age} onChange={handleInputChange} disabled={loading} />
                  </div>
                  <div className="form-group">
                    <label>Birthday</label>
                    <input type="date" name="birthday" value={formData.birthday} onChange={handleInputChange} disabled={loading} />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-register">
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
            <p className="login-link">Already have an account? <Link to="/login">Sign in here</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
