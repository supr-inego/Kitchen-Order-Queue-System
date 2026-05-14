import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api/api";
import { useAuth } from "../App";
import "./Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    address: "",
    age: "",
    birthday: "",
    phone: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      setUser(response.data);
      setFormData({
        first_name: response.data.first_name || "",
        last_name: response.data.last_name || "",
        address: response.data.address || "",
        age: response.data.age || "",
        birthday: response.data.birthday || "",
        phone: response.data.phone || "",
      });
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setError("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await authAPI.updateProfile(formData);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    }
  };

  if (loading) {
    return <div className="profile-container"><p>Loading...</p></div>;
  }

  if (!user) {
    return <div className="profile-container"><p>User data not found</p></div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div>
            <h1>My Profile</h1>
            <span className={`role-badge ${isAdmin ? "role-admin" : "role-customer"}`}>
              {isAdmin ? "👨‍🍳 Admin / Staff" : "🛒 Customer"}
            </span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-info">
              <h2>Account Information</h2>

              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{user.email}</span>
              </div>

              <div className="info-row">
                <span className="label">First Name:</span>
                <span className="value">{user.first_name || "-"}</span>
              </div>

              <div className="info-row">
                <span className="label">Last Name:</span>
                <span className="value">{user.last_name || "-"}</span>
              </div>

              <div className="info-row">
                <span className="label">Phone:</span>
                <span className="value">{user.phone || "-"}</span>
              </div>

              <div className="info-row">
                <span className="label">Address:</span>
                <span className="value">{user.address || "-"}</span>
              </div>

              <div className="info-row">
                <span className="label">Age:</span>
                <span className="value">{user.age || "-"}</span>
              </div>

              <div className="info-row">
                <span className="label">Birthday:</span>
                <span className="value">
                  {user.birthday ? new Date(user.birthday).toLocaleDateString() : "-"}
                </span>
              </div>

              <div className="info-row">
                <span className="label">Member Since:</span>
                <span className="value">
                  {new Date(user.date_joined).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button onClick={() => setIsEditing(true)} className="btn-edit">
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <h2>Edit Profile</h2>

            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
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
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
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
              />
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
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
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save">
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
