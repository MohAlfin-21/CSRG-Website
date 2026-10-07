from fastapi import APIRouter, HTTPException, Depends, Response, Request
from fastapi.security import HTTPAuthorizationCredentials
import jwt

from core.database import db
from core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    token_blacklist,
    security,
)
from core.rate_limiter import login_rate_limiter
from models.user import UserLogin, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Cookie name for the admin JWT
COOKIE_NAME = "admin_token"
# Secure flag: set True in production (requires HTTPS)
# Read from env to allow dev mode with HTTP
import os
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"


@router.post("/login", dependencies=[Depends(login_rate_limiter)])
async def login(user_login: UserLogin, response: Response):
    """
    Authenticate with email + password.
    Sets a httpOnly secure cookie containing the JWT access token.
    Also returns the token in the JSON body for API clients that can't use cookies.
    Rate-limited to 5 requests per minute per IP.
    """
    user = await db.users.find_one({"email": user_login.email})
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not verify_password(user_login.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token(data={"sub": user_login.email})

    # Set httpOnly cookie — not accessible from JavaScript (mitigates XSS token theft)
    response.set_cookie(
        key=COOKIE_NAME,
        value=access_token,
        httponly=True,          # Not accessible via document.cookie / JavaScript
        secure=COOKIE_SECURE,   # Send only over HTTPS (set True in production)
        samesite="lax",         # CSRF protection for same-site navigations
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    # Also return token in body for API clients / Postman / non-browser consumers
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
async def get_me(current_user: str = Depends(get_current_user)):
    """
    Validate session and return authenticated user details.
    Used by frontend to check if current cookie/token is valid.
    """
    user = await db.users.find_one({"email": current_user}, {"_id": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/logout")
async def logout(request: Request, response: Response):
    """
    Invalidate the current session:
    1. Revokes the JWT by JTI (adds to blacklist)
    2. Clears the httpOnly cookie

    Accepts token from either the Authorization header or the cookie.
    """
    token = None

    # Try Authorization header first (API clients)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]

    # Fall back to cookie (browser clients)
    if not token:
        token = request.cookies.get(COOKIE_NAME)

    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            jti = payload.get("jti")
            exp = payload.get("exp", 0)
            if jti:
                token_blacklist.revoke(jti, exp)
        except jwt.PyJWTError:
            pass  # Token already invalid — still clear cookie

    # Clear the cookie
    response.delete_cookie(key=COOKIE_NAME, path="/", samesite="lax")
    return {"message": "Logged out successfully"}


@router.post("/register")
async def register_disabled():
    """
    [DISABLED] Public registration is disabled for security.
    Admin account creation is handled via the seed script or direct DB access.
    """
    raise HTTPException(
        status_code=405,
        detail=(
            "Pendaftaran akun baru dinonaktifkan. "
            "Hubungi administrator CSRG untuk pembuatan akun."
        )
    )
