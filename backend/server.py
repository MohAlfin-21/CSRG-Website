from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, Request, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

from core.config import (
    STATIC_DIR,
    CORS_ORIGINS,
    ENABLE_API_DOCS,
    logger,
)
from core.database import close_mongo_connection
from core.security_headers import SecurityHeadersMiddleware
from core.storage import ensure_bucket_exists
from routers import (
    auth_router,
    members_router,
    news_router,
    contact_router,
    scholar_router,
    files_router,
    products_router,
)

# ─── Application Lifespan ──────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup and gracefully close them on shutdown."""
    try:
        ensure_bucket_exists()
        logger.info("✅ MinIO storage initialized successfully.")
    except Exception as e:
        logger.error(f"❌ MinIO storage initialization failed: {e}")
    yield
    await close_mongo_connection()

# ─── Initialize FastAPI App ───────────────────────────────────────────────────
# Swagger/ReDoc are disabled in production (ENABLE_API_DOCS=false).
# Set ENABLE_API_DOCS=true in development .env to enable interactive docs.

_docs_url   = "/docs"   if ENABLE_API_DOCS else None
_redoc_url  = "/redoc"  if ENABLE_API_DOCS else None
_openapi_url = "/openapi.json" if ENABLE_API_DOCS else None

app = FastAPI(
    title="CSRG Web API",
    description="Backend API for Cyber Security Research Group (CSRG) PENS",
    version="1.0.0",
    docs_url=_docs_url,
    redoc_url=_redoc_url,
    openapi_url=_openapi_url,
    lifespan=lifespan,
)

# ─── Middleware Registration ──────────────────────────────────────────────────
# NOTE: Starlette processes middleware in REVERSE order of registration.
# CORSMiddleware must be registered AFTER SecurityHeadersMiddleware so that
# CORS headers are added first (innermost layer), then security headers wrap them.

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ─── API Router ───────────────────────────────────────────────────────────────
api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(members_router)
api_router.include_router(news_router)
api_router.include_router(contact_router)
api_router.include_router(scholar_router)
api_router.include_router(files_router)
api_router.include_router(products_router)

@api_router.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "csrg-backend"}

app.include_router(api_router)

# ─── Static File Serving ──────────────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory=STATIC_DIR / "uploads"), name="uploads")

# ─── Global Exception Handler ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Terjadi kesalahan internal pada server. Silakan hubungi administrator."},
    )

logger.info(
    f"CSRG FastAPI initialized | API docs: {'enabled' if ENABLE_API_DOCS else 'DISABLED'} | "
    f"CORS origins: {CORS_ORIGINS}"
)


