from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to inject OWASP-recommended security headers into all responses.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # Prevent MIME-sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent Clickjacking (iframe embedding)
        response.headers["X-Frame-Options"] = "DENY"
        
        # Enable browser XSS filtering
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Control referrer information sent in requests
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Restrict browser feature access
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Remove server identification header if present
        if "server" in response.headers:
            del response.headers["server"]
            
        return response
