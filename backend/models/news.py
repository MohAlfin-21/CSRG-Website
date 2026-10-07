import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict

class NewsArticle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    excerpt: str
    thumbnail_url: str
    published_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NewsCreate(BaseModel):
    title: str
    content: str
    excerpt: str
    thumbnail_url: str
