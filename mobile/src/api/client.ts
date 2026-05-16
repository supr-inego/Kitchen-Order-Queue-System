import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/constants/config";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession,
  getStoredUser,
} from "./storage";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await getRefreshToken();
  if (!refresh) return null;

  const { data } = await axios.post(`${API_BASE_URL}/user/token/refresh/`, {
    refresh,
  });

  const access = data.access as string;
  const user = await getStoredUser();
  if (user) {
    await saveSession(access, data.refresh ?? refresh, user);
  } else {
    await saveSession(access, data.refresh ?? refresh, "{}");
  }
  return access;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      if (!newToken) {
        await clearSession();
        return Promise.reject(error);
      }
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      await clearSession();
      return Promise.reject(error);
    }
  }
);

export function apiErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Record<string, unknown> | undefined;
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.non_field_errors)) return String(data.non_field_errors[0]);
    const firstKey = data && Object.keys(data)[0];
    if (firstKey) {
      const val = data[firstKey];
      if (Array.isArray(val)) return String(val[0]);
      if (typeof val === "string") return val;
    }
  }
  return fallback;
}
