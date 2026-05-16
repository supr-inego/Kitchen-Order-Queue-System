/**
 * Normalize pasted image URLs (Google imgres, etc.) to a direct image link.
 */
export function normalizeImageUrl(raw) {
  const url = (raw || "").trim();
  if (!url) return "";

  let full = url;
  if (!/^https?:\/\//i.test(full)) {
    full = `https://${full.replace(/^\/+/, "")}`;
  }

  try {
    const parsed = new URL(full);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("google.") && parsed.pathname.includes("/imgres")) {
      const imgurl = parsed.searchParams.get("imgurl") || parsed.searchParams.get("url");
      if (imgurl) return decodeURIComponent(imgurl).trim();
    }

    if (host.includes("google.") && (parsed.pathname === "/url" || parsed.pathname === "/imgres")) {
      const target = parsed.searchParams.get("url") || parsed.searchParams.get("imgurl");
      if (target?.startsWith("http")) return decodeURIComponent(target).trim();
    }
  } catch {
    /* keep full */
  }

  return full;
}

export function imageUrlWarning(url) {
  if (!url) return null;
  try {
    const parsed = new URL(normalizeImageUrl(url));
    if (parsed.hostname.includes("google.") && parsed.pathname.includes("/search")) {
      return "That is a Google Search link, not a direct image. Open the image in a new tab and copy that URL.";
    }
  } catch {
    return "Invalid URL.";
  }
  return null;
}

export function imageProxyUrl(directUrl) {
  const normalized = normalizeImageUrl(directUrl);
  if (!normalized) return "";
  const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
  return `${base}/image-proxy/?url=${encodeURIComponent(normalized)}`;
}
