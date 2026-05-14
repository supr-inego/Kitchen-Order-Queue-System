import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../api/api";
import "./Register.css";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    age: "",
    birthday: "",
    role: "customer",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.register(formData);
      const { message } = response.data;
      setSuccess(message || "Registration successful. Check your email to activate your account.");
      setError("");
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData) {
        if (errorData.email) {
          setError(errorData.email[0]);
        } else if (errorData.password) {
          setError(errorData.password[0]);
        } else if (typeof errorData === "string") {
          setError(errorData);
        } else {
          setError("Registration failed. Please check your information.");
        }
      } else {
        setError("Registration failed. Please try again.");
      }
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="login-logo">
          <div className="logo-icon">CR</div>
          <h2 className="logo-name">Crammer's Restaurant</h2>
        </div>
        <h1>Create Account</h1>
        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleRegister}>
          {/* Account Type */}
          <div className="form-section">
            <h3>Account Type</h3>
            <div className="role-selector">
              <label className={`role-option ${formData.role === "customer" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value="customer"
                  checked={formData.role === "customer"}
                  onChange={handleInputChange}
                />
                <span className="role-icon">🛒</span>
                <span className="role-label">Customer</span>
                <span className="role-desc">Place and track orders</span>
              </label>
              <label className={`role-option ${formData.role === "admin" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === "admin"}
                  onChange={handleInputChange}
                />
                <span className="role-icon">👨‍🍳</span>
                <span className="role-label">Admin / Staff</span>
                <span className="role-desc">Manage orders & kitchen</span>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Account Information</h3>
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password_confirm">Confirm Password *</label>
              <input
                type="password"
                id="password_confirm"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="birthday">Birthday</label>
                <input
                  type="date"
                  id="birthday"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-register">
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
