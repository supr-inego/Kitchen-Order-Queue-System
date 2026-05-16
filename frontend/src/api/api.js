import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

// Add token to request headers if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401 response
const PUBLIC_PATHS = ["/user/login/", "/user/register/", "/user/activate/", "/user/resend-activation/"];

function isPublicAuthRequest(config) {
  const url = config?.url || "";
  return PUBLIC_PATHS.some((p) => url.includes(p));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (isPublicAuthRequest(originalRequest)) {
      return Promise.reject(error);
    }
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        const response = await api.post("/user/token/refresh/", {
          refresh: refreshToken,
        });
        localStorage.setItem("access_token", response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post("/user/register/", userData),
  login: (email, password) => api.post("/user/login/", { email, password }),
  logout: (refresh) => api.post("/user/logout/", { refresh }),
  resendActivation: (email) => api.post("/user/resend-activation/", { email }),
  getProfile: () => api.get("/user/profile/"),
  updateProfile: (userData) => api.put("/user/profile/", userData),
};
