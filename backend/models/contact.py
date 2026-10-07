import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict, EmailStr

class ContactForm(BaseModel):
    name: str = Field(min_length=2, max_length=100, description="Sender name")
    email: EmailStr = Field(description="Valid sender email address")
    message: str = Field(min_length=5, max_length=5000, description="Message content")

class ContactSubmission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
