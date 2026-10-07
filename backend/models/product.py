import uuid
from datetime import datetime, timezone
from typing import List, Optional
from urllib.parse import urlparse
from pydantic import BaseModel, Field, ConfigDict, field_validator


# Skema URL yang diizinkan untuk live_preview_url (hanya https).
# Skema berbahaya yang secara eksplisit diblokir:
#   javascript: — eksekusi kode via iframe src
#   data:       — data URI yang bisa memuat HTML/JS arbitrary
#   vbscript:   — VBScript execution (legacy IE)
#   file:       — akses filesystem lokal
_BLOCKED_SCHEMES = {"javascript", "data", "vbscript", "file"}
_ALLOWED_SCHEME = "https"
_MAX_PREVIEW_URL_LEN = 2048


def _validate_safe_preview_url(v: Optional[str]) -> Optional[str]:
    """Validasi live_preview_url: wajib https, tolak skema berbahaya."""
    if v is None or v == "":
        return None
    if not isinstance(v, str):
        raise ValueError("live_preview_url harus berupa string")
    if len(v) > _MAX_PREVIEW_URL_LEN:
        raise ValueError(
            f"live_preview_url melebihi panjang maksimum {_MAX_PREVIEW_URL_LEN} karakter"
        )
    try:
        parsed = urlparse(v)
    except Exception:
        raise ValueError("live_preview_url bukan URL yang valid")
    scheme = parsed.scheme.lower()
    if scheme in _BLOCKED_SCHEMES:
        raise ValueError(
            f"live_preview_url menggunakan skema yang dilarang: '{scheme}:'"
        )
    if scheme != _ALLOWED_SCHEME:
        raise ValueError(
            f"live_preview_url harus menggunakan skema 'https', bukan '{scheme}:'"
        )
    if not parsed.netloc:
        raise ValueError("live_preview_url tidak memiliki hostname yang valid")
    return v


def _sanitize_read_preview_url(v: Optional[str]) -> Optional[str]:
    """Fallback aman untuk sisi baca: jika data lama tidak valid, kembalikan None alih-alih crash 500."""
    try:
        return _validate_safe_preview_url(v)
    except (ValueError, TypeError):
        return None


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., max_length=120)
    tagline: str = Field(..., max_length=200)
    description: str = Field(..., max_length=2000)
    tags: List[str] = Field(default=[], max_length=20)
    features: List[str] = Field(default=[], max_length=30)
    icon_name: Optional[str] = Field(default="Shield", max_length=50)
    image_url: Optional[str] = Field(default=None, max_length=2048)
    image_filename: Optional[str] = Field(default=None, max_length=512)
    preview_light_url: Optional[str] = Field(default=None, max_length=2048)
    preview_light_filename: Optional[str] = Field(default=None, max_length=512)
    preview_dark_url: Optional[str] = Field(default=None, max_length=2048)
    preview_dark_filename: Optional[str] = Field(default=None, max_length=512)
    website: Optional[str] = Field(default=None, max_length=2048)
    github: Optional[str] = Field(default=None, max_length=2048)
    live_preview_url: Optional[str] = Field(default=None, max_length=2048)
    status: str = Field(default="Active Stable", max_length=50)
    category: str = Field(default="Security Monitoring", max_length=100)
    color: str = Field(default="from-blue-500 to-cyan-500", max_length=100)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("tags", mode="before")
    @classmethod
    def validate_tags(cls, v):
        if isinstance(v, list):
            if len(v) > 20:
                raise ValueError("Maximum 20 tags allowed")
            for tag in v:
                if len(str(tag)) > 60:
                    raise ValueError("Each tag must be at most 60 characters")
        return v

    @field_validator("features", mode="before")
    @classmethod
    def validate_features(cls, v):
        if isinstance(v, list):
            if len(v) > 30:
                raise ValueError("Maximum 30 features allowed")
            for feat in v:
                if len(str(feat)) > 200:
                    raise ValueError("Each feature must be at most 200 characters")
        return v

    @field_validator("icon_name", mode="before")
    @classmethod
    def validate_icon_name(cls, v):
        allowed = {"Shield", "Globe", "Zap", "Monitor", "Lock", "Server", "Database", "Code"}
        if v and v not in allowed:
            return "Shield"  # safe fallback
        return v

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v):
        allowed = {"Active Stable", "Beta", "In Development", "Deprecated"}
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v

    @field_validator("live_preview_url", mode="before")
    @classmethod
    def validate_live_preview_url(cls, v):
        return _sanitize_read_preview_url(v)


class ProductCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str = Field(..., max_length=120)
    tagline: str = Field(..., max_length=200)
    description: str = Field(..., max_length=2000)
    tags: List[str] = Field(default=[], max_length=20)
    features: List[str] = Field(default=[], max_length=30)
    icon_name: Optional[str] = Field(default="Shield", max_length=50)
    image_url: Optional[str] = Field(default=None, max_length=2048)
    image_filename: Optional[str] = Field(default=None, max_length=512)
    preview_light_url: Optional[str] = Field(default=None, max_length=2048)
    preview_light_filename: Optional[str] = Field(default=None, max_length=512)
    preview_dark_url: Optional[str] = Field(default=None, max_length=2048)
    preview_dark_filename: Optional[str] = Field(default=None, max_length=512)
    website: Optional[str] = Field(default=None, max_length=2048)
    github: Optional[str] = Field(default=None, max_length=2048)
    live_preview_url: Optional[str] = Field(default=None, max_length=2048)
    status: str = Field(default="Active Stable", max_length=50)
    category: str = Field(default="Security Monitoring", max_length=100)
    color: str = Field(default="from-blue-500 to-cyan-500", max_length=100)

    @field_validator("tags", mode="before")
    @classmethod
    def validate_tags(cls, v):
        if isinstance(v, list):
            if len(v) > 20:
                raise ValueError("Maximum 20 tags allowed")
            for tag in v:
                if len(str(tag)) > 60:
                    raise ValueError("Each tag must be at most 60 characters")
        return v

    @field_validator("features", mode="before")
    @classmethod
    def validate_features(cls, v):
        if isinstance(v, list):
            if len(v) > 30:
                raise ValueError("Maximum 30 features allowed")
            for feat in v:
                if len(str(feat)) > 200:
                    raise ValueError("Each feature must be at most 200 characters")
        return v

    @field_validator("icon_name", mode="before")
    @classmethod
    def validate_icon_name(cls, v):
        allowed = {"Shield", "Globe", "Zap", "Monitor", "Lock", "Server", "Database", "Code"}
        if v and v not in allowed:
            return "Shield"
        return v

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v):
        allowed = {"Active Stable", "Beta", "In Development", "Deprecated"}
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v

    @field_validator("live_preview_url", mode="before")
    @classmethod
    def validate_live_preview_url(cls, v):
        return _validate_safe_preview_url(v)
