import { Platform } from "react-native";
import Constants from "expo-constants";

/** Metro / Expo dev server host (from QR code connection), not the Django API. */
export function devMetroHost(): string | null {
  const raw =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | null)?.debuggerHost ??
    (Constants.manifest2 as { extra?: { expoClient?: { hostUri?: string } } } | null)
      ?.extra?.expoClient?.hostUri ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (!raw) return null;
  const host = raw.split(":")[0]?.trim();
  if (!host || host === "localhost" || host === "127.0.0.1") return null;
  return host;
}

function defaultApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  }
  const lanHost = devMetroHost();
  if (lanHost) return `http://${lanHost}:8000/api`;
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000/api";
  }
  return "http://localhost:8000/api";
}

export const API_BASE_URL = defaultApiUrl();

/** True when the API URL points at this machine only (won't work on a physical phone). */
export function isApiUnreachableOnPhone(): boolean {
  if (!Constants.isDevice) return false;
  return /localhost|127\.0\.0\.1/.test(API_BASE_URL);
}

export const POLL_ORDERS_MS = 5000;
export const POLL_PRODUCTS_MS = 15000;
