import re
import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator

HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")
HTTP_URL = re.compile(r"^https?://", re.IGNORECASE)


def _clean_url(v: Optional[str]) -> Optional[str]:
    """Allow empty values, auto-prefix https:// for domain inputs, block javascript/data URLs."""
    if not v:
        return None
    v = v.strip()
    if not v:
        return None
    if not HTTP_URL.match(v):
        lower = v.lower()
        if lower.startswith(("javascript:", "data:", "vbscript:")):
            raise ValueError("URL tidak aman atau tidak valid")
        if "." in v and not v.startswith(("/", "\\")):
            v = f"https://{v}"
        else:
            raise ValueError("URL harus diawali http:// atau https://")
    return v


class CVEducation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    institution: str = Field("", max_length=150)
    degree: str = Field("", max_length=150)
    start: str = Field("", max_length=20)
    end: str = Field("", max_length=20)
    description: str = Field("", max_length=1500)


class CVExperience(BaseModel):
    model_config = ConfigDict(extra="ignore")
    role: str = Field("", max_length=150)
    organization: str = Field("", max_length=150)
    start: str = Field("", max_length=20)
    end: str = Field("", max_length=20)
    description: str = Field("", max_length=2000)


class CVSkill(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str = Field("", max_length=60)
    level: Optional[int] = Field(None, ge=0, le=100)


class CVCertification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str = Field("", max_length=150)
    issuer: str = Field("", max_length=150)
    year: str = Field("", max_length=20)


class CVProject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str = Field("", max_length=150)
    description: str = Field("", max_length=1500)
    link: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = Field(None, max_length=500)

    _v_link = field_validator("link")(_clean_url)


class CVData(BaseModel):
    """Structured, editable CV content rendered as a web page."""
    model_config = ConfigDict(extra="ignore")
    template: Literal["modern", "classic", "minimal"] = "modern"
    accent: str = "#004C97"
    show_photo: bool = True
    headline: str = Field("", max_length=150)
    summary: str = Field("", max_length=2500)
    email: str = Field("", max_length=120)
    phone: str = Field("", max_length=40)
    location: str = Field("", max_length=120)
    website: Optional[str] = Field(None, max_length=300)
    education: List[CVEducation] = Field(default_factory=list, max_length=15)
    experience: List[CVExperience] = Field(default_factory=list, max_length=20)
    skills: List[CVSkill] = Field(default_factory=list, max_length=40)
    certifications: List[CVCertification] = Field(default_factory=list, max_length=30)
    projects: List[CVProject] = Field(default_factory=list, max_length=15)

    _v_website = field_validator("website")(_clean_url)

    @field_validator("accent")
    @classmethod
    def _valid_accent(cls, v: str) -> str:
        if not HEX_COLOR.match(v or ""):
            raise ValueError("Warna aksen harus berformat hex, contoh #004C97")
        return v


class Member(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    position: str
    photo_url: str
    linkedin_url: Optional[str] = None
    scholar_url: Optional[str] = None
    cv_url: Optional[str] = None
    cv_public_id: Optional[str] = None
    cv_data: Optional[CVData] = None
    research_area: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MemberCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    position: str
    photo_url: str
    linkedin_url: Optional[str] = None
    scholar_url: Optional[str] = None
    cv_url: Optional[str] = None
    cv_public_id: Optional[str] = None
    cv_data: Optional[CVData] = None
    research_area: Optional[str] = None
