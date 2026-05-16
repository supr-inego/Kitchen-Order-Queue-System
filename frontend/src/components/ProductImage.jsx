import { useState } from "react";
import { imageProxyUrl, normalizeImageUrl } from "../utils/imageUrl";

/**
 * Renders a product image: direct URL first, then backend proxy on failure.
 */
export default function ProductImage({
  url,
  name,
  className = "w-full h-36 object-cover rounded-xl",
  placeholderClassName = "w-full h-36 rounded-xl bg-gray-100 flex items-center justify-center text-3xl",
}) {
  const [mode, setMode] = useState("direct");
  const normalized = normalizeImageUrl(url);

  if (!normalized || mode === "failed") {
    return <div className={placeholderClassName}>🍴</div>;
  }

  const src = mode === "proxy" ? imageProxyUrl(normalized) : normalized;

  return (
    <img
      src={src}
      alt={name || "Product"}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => {
        if (mode === "direct") setMode("proxy");
        else setMode("failed");
      }}
    />
  );
}
