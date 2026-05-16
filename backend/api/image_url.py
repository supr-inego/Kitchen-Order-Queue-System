"""Normalize pasted image URLs (e.g. Google Images search/imgres links)."""
from urllib.parse import parse_qs, unquote, urlparse


def normalize_image_url(raw: str) -> str:
    """
    Turn pasted browser/Google links into a direct image URL when possible.
    Returns stripped URL or empty string.
    """
    url = (raw or "").strip()
    if not url:
        return ""

    if not url.startswith(("http://", "https://")):
        url = f"https://{url.lstrip('/')}"

    try:
        parsed = urlparse(url)
    except Exception:
        return url

    host = (parsed.netloc or "").lower()
    path = (parsed.path or "").lower()

    # Google Images result page — extract embedded image
    if "google." in host and "/imgres" in path:
        qs = parse_qs(parsed.query)
        for key in ("imgurl", "url"):
            if key in qs and qs[key]:
                return unquote(qs[key][0]).strip()

    # Google redirect wrapper
    if "google." in host and path in ("/url", "/imgres"):
        qs = parse_qs(parsed.query)
        for key in ("url", "imgurl"):
            if key in qs and qs[key]:
                candidate = unquote(qs[key][0]).strip()
                if candidate.startswith(("http://", "https://")):
                    return candidate

    return url


def image_url_help_error(url: str) -> str | None:
    """Return user-facing error if URL is unlikely to work as a hotlinked image."""
    if not url:
        return None

    parsed = urlparse(url)
    host = (parsed.netloc or "").lower()
    path = (parsed.path or "").lower()

    if "google." in host and "/search" in path:
        return (
            "That is a Google Search page link, not a direct image. "
            "Open the image in a new tab, then copy the address bar URL "
            "(should end in .jpg, .png, or contain googleusercontent.com)."
        )

    if "bing." in host and "/search" in path:
        return "Use a direct image link, not a Bing search results page."

    return None
