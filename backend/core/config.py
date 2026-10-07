import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Set base directories
ROOT_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = ROOT_DIR / "static"
UPLOADS_DIR = STATIC_DIR / "uploads"
PHOTOS_DIR = UPLOADS_DIR / "photos"
CV_DIR = UPLOADS_DIR / "cv"
CV_TEMPLATE_PATH = ROOT_DIR / "cv_viewer_template.html"

# Load environment variables
load_dotenv(ROOT_DIR / ".env")

# Ensure upload directories exist
PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
CV_DIR.mkdir(parents=True, exist_ok=True)

# Database settings
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "csrg_database")

# Security settings
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "")
ALGORITHM = "HS256"
# Token expiry — default 60 minutes. Override via ACCESS_TOKEN_EXPIRE_MINUTES env var.
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Raise at startup if no secret key is configured (prevents running with empty secret)
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY environment variable is not set. "
        "Generate one with: python3 -c \"import secrets; print(secrets.token_hex(32))\""
    )

# CORS settings — explicitly disallow bare wildcard '*'
CORS_ORIGINS_RAW = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS_RAW.split(",") if origin.strip()]

# Feature flags
ENABLE_API_DOCS = os.environ.get("ENABLE_API_DOCS", "false").lower() == "true"

# MinIO / S3 Object Storage settings
MINIO_ENDPOINT        = os.environ.get("MINIO_ENDPOINT", "minio:9000")
MINIO_PUBLIC_ENDPOINT = os.environ.get("MINIO_PUBLIC_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY      = os.environ.get("MINIO_ACCESS_KEY", "")
MINIO_SECRET_KEY      = os.environ.get("MINIO_SECRET_KEY", "")
MINIO_BUCKET          = os.environ.get("MINIO_BUCKET", "csrg-media")
MINIO_USE_SSL         = os.environ.get("MINIO_USE_SSL", "false").lower() == "true"

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("csrg_backend")
