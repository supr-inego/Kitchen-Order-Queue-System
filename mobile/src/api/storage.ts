import * as SecureStore from "expo-secure-store";

const KEYS = {
  access: "access_token",
  refresh: "refresh_token",
  user: "user",
} as const;

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.access);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.refresh);
}

export async function getStoredUser(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.user);
}

export async function saveSession(
  access: string,
  refresh: string,
  userJson: string
): Promise<void> {
  await SecureStore.setItemAsync(KEYS.access, access);
  await SecureStore.setItemAsync(KEYS.refresh, refresh);
  await SecureStore.setItemAsync(KEYS.user, userJson);
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.access);
  await SecureStore.deleteItemAsync(KEYS.refresh);
  await SecureStore.deleteItemAsync(KEYS.user);
}
