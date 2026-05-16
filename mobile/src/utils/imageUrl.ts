import { API_BASE_URL } from "@/constants/config";

export function normalizeImageUrl(raw: string): string {
  const url = (raw || "").trim();
  if (!url) return "";
  let full = url;
  if (!/^https?:\/\//i.test(full)) {
    full = `https://${full.replace(/^\/+/, "")}`;
  }
  try {
    const parsed = new URL(full);
    if (parsed.hostname.includes("google.") && parsed.pathname.includes("/imgres")) {
      const imgurl = parsed.searchParams.get("imgurl") || parsed.searchParams.get("url");
      if (imgurl) return decodeURIComponent(imgurl).trim();
    }
  } catch {
    /* keep */
  }
  return full;
}

export function imageProxyUrl(directUrl: string): string {
  const normalized = normalizeImageUrl(directUrl);
  if (!normalized) return "";
  return `${API_BASE_URL}/image-proxy/?url=${encodeURIComponent(normalized)}`;
}
