import time
from datetime import datetime, timezone, timedelta
from typing import Optional, Set
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
import jwt
from core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)  # auto_error=False allows cookie fallback

COOKIE_NAME = "admin_token"

# ─── In-Memory Token Blacklist ────────────────────────────────────────────────
# Stores JTI (token IDs) of revoked tokens until their expiry.
# On restart the blacklist is cleared — acceptable since restarting the server
# effectively invalidates all old tokens anyway (secret key rotation recommended
# before restart in production). Replace with Redis for multi-instance setups.

class TokenBlacklist:
    def __init__(self):
        self._revoked: Set[str] = set()
        self._revoked_exp: dict = {}  # jti → expiry timestamp

    def revoke(self, jti: str, exp: int) -> None:
        """Add a token's JTI to the blacklist until it expires."""
        self._revoked.add(jti)
        self._revoked_exp[jti] = exp
        self._cleanup()

    def is_revoked(self, jti: str) -> bool:
        return jti in self._revoked

    def _cleanup(self) -> None:
        """Remove expired entries to prevent memory growth."""
        now = int(time.time())
        expired = [jti for jti, exp in self._revoked_exp.items() if exp < now]
        for jti in expired:
            self._revoked.discard(jti)
            self._revoked_exp.pop(jti, None)


token_blacklist = TokenBlacklist()

# ─── Password Utilities ───────────────────────────────────────────────────────

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ─── JWT Utilities ────────────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    import uuid
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    jti = str(uuid.uuid4())  # Unique token ID — used for revocation
    to_encode.update({"exp": expire, "iat": now, "jti": jti})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    """
    Validate JWT and return the authenticated user email.

    Token lookup order:
    1. Authorization: Bearer <token> header (API clients, Postman, etc.)
    2. httpOnly 'admin_token' cookie (browser clients after login)

    Raises HTTP 401 for invalid, expired, or revoked tokens.
    """
    token: Optional[str] = None

    # 1. Try Authorization header
    if credentials:
        token = credentials.credentials

    # 2. Fall back to httpOnly cookie
    if not token:
        token = request.cookies.get(COOKIE_NAME)

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Provide a Bearer token or login via the admin panel.",
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Check blacklist (revoked tokens from logout)
        jti = payload.get("jti")
        if jti and token_blacklist.is_revoked(jti):
            raise HTTPException(status_code=401, detail="Token has been revoked")

        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return email

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
