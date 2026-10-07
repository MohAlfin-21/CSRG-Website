from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from core.database import db
from core.security import get_current_user
from core.rate_limiter import contact_rate_limiter
from models.contact import ContactForm, ContactSubmission

router = APIRouter(prefix="/contact", tags=["Contact"])

@router.post("", dependencies=[Depends(contact_rate_limiter)])
async def submit_contact(contact: ContactForm):
    contact_obj = ContactSubmission(**contact.model_dump())
    doc = contact_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.contacts.insert_one(doc)
    return {"message": "Message sent successfully"}

@router.get("", response_model=List[ContactSubmission])
async def get_contacts(current_user: str = Depends(get_current_user)):
    contacts = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for contact in contacts:
        if isinstance(contact.get("created_at"), str):
            contact["created_at"] = datetime.fromisoformat(contact["created_at"])
    return contacts

@router.delete("/{contact_id}")
async def delete_contact(contact_id: str, current_user: str = Depends(get_current_user)):
    result = await db.contacts.delete_one({"id": contact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact message not found")
    return {"message": "Contact message deleted successfully"}

