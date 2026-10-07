import os
import time
import asyncio
from collections import defaultdict
from typing import Dict, List, Set
from fastapi import Request, HTTPException

# Trusted proxy IPs — only trust X-Forwarded-For from these sources.
# In docker-compose, nginx would be at a known IP; for now we trust only
# Docker internal gateway (172.x.x.x range). In production, set this to
# your actual reverse proxy IP via TRUSTED_PROXY_IPS env var.
_TRUSTED_PROXIES_RAW = os.environ.get("TRUSTED_PROXY_IPS", "")
TRUSTED_PROXY_IPS: Set[str] = (
    set(ip.strip() for ip in _TRUSTED_PROXIES_RAW.split(",") if ip.strip())
    if _TRUSTED_PROXIES_RAW
    else set()
)


class SlidingWindowRateLimiter:
    """
    Thread-safe in-memory sliding window rate limiter per client IP.

    X-Forwarded-For is only trusted when the direct client IP is in
    TRUSTED_PROXY_IPS. This prevents IP spoofing attacks where an attacker
    sends arbitrary X-Forwarded-For headers to bypass rate limiting.
    """

    def __init__(self, requests_limit: int, window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.client_requests: Dict[str, List[float]] = defaultdict(list)
        self._lock = asyncio.Lock()
        self._last_cleanup = time.time()

    def _get_client_ip(self, request: Request) -> str:
        direct_ip = (request.client.host if request.client else None) or "127.0.0.1"

        # Only honor X-Forwarded-For if the direct connection comes from a trusted proxy
        if direct_ip in TRUSTED_PROXY_IPS:
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                client_ip = forwarded.split(",")[0].strip()
                if client_ip:
                    return client_ip

        return direct_ip

    async def _cleanup(self, current_time: float):
        """Evict inactive IPs every 5 minutes to prevent unbounded memory growth."""
        if current_time - self._last_cleanup > 300:
            threshold = current_time - self.window_seconds
            keys_to_remove = []
            for ip, timestamps in list(self.client_requests.items()):
                active = [t for t in timestamps if t > threshold]
                if active:
                    self.client_requests[ip] = active
                else:
                    keys_to_remove.append(ip)
            for k in keys_to_remove:
                self.client_requests.pop(k, None)
            self._last_cleanup = current_time

    async def __call__(self, request: Request):
        client_ip = self._get_client_ip(request)
        current_time = time.time()
        threshold = current_time - self.window_seconds

        async with self._lock:
            await self._cleanup(current_time)

            timestamps = [t for t in self.client_requests[client_ip] if t > threshold]

            if len(timestamps) >= self.requests_limit:
                oldest_in_window = timestamps[0]
                retry_after = max(1, int(oldest_in_window + self.window_seconds - current_time))
                raise HTTPException(
                    status_code=429,
                    detail=f"Terlalu banyak permintaan. Silakan coba lagi dalam {retry_after} detik.",
                    headers={"Retry-After": str(retry_after)},
                )

            timestamps.append(current_time)
            self.client_requests[client_ip] = timestamps


# Preconfigured rate limiters for sensitive endpoints
login_rate_limiter   = SlidingWindowRateLimiter(requests_limit=5,  window_seconds=60)
contact_rate_limiter = SlidingWindowRateLimiter(requests_limit=5,  window_seconds=60)
scholar_rate_limiter = SlidingWindowRateLimiter(requests_limit=10, window_seconds=60)

