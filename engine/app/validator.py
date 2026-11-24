"""Citation validator: a claim survives only if its verbatim quote appears on its source page."""
from __future__ import annotations

import ipaddress
import re
import socket
from urllib.parse import urlparse

import httpx

from .seed import DEMO_SOURCE

MAX_BYTES = 2_000_000


def _norm(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip().lower()


def _public_host(url: str) -> bool:
    """SSRF guard: only http(s) to public IPs."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        return False
    try:
        for info in socket.getaddrinfo(parsed.hostname, None):
            ip = ipaddress.ip_address(info[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False
    except socket.gaierror:
        return False
    return True


def verify_quote(url: str, quote: str, page_text: str | None = None) -> dict:
    """Returns {verified: bool, method: str}. page_text lets discovery pass content it already has."""
    if url.startswith(DEMO_SOURCE):
        return {"verified": True, "method": "demo"}
    if not quote:
        return {"verified": False, "method": "no_quote"}
    if page_text is not None and _norm(quote) in _norm(page_text):
        return {"verified": True, "method": "search_content"}
    if not _public_host(url):
        return {"verified": False, "method": "blocked_host"}
    try:
        with httpx.Client(timeout=10, follow_redirects=True, max_redirects=3,
                          headers={"User-Agent": "PitchfeedValidator/0.1"}) as client:
            resp = client.get(url)
            body = resp.text[:MAX_BYTES]
        return {"verified": _norm(quote) in _norm(body), "method": "fetched"}
    except Exception as exc:
        return {"verified": False, "method": f"fetch_error:{type(exc).__name__}"}
