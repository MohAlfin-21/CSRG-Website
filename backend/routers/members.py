import re
from typing import List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse, FileResponse
from starlette.concurrency import run_in_threadpool
from core.database import db
from core.security import get_current_user
from core.config import PHOTOS_DIR, CV_DIR, logger
from core.storage import delete_file as storage_delete_file, get_file_stream, sanitize_filename
from models.member import Member, MemberCreate

router = APIRouter(prefix="/members", tags=["Members"])

MANAGED_KEY_REGEX = re.compile(
    r"^cv/([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_.*)\.(pdf|doc|docx)$",
    re.IGNORECASE,
)

MIME_WHITELIST = {
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "odt": "application/vnd.oasis.opendocument.text",
    "rtf": "application/rtf",
    "txt": "text/plain",
}


def _cv_image_urls(cv_data) -> set:
    """Collect uploaded image URLs referenced by a CV (project screenshots)."""
    urls = set()
    if not cv_data:
        return urls
    for project in cv_data.get("projects", []) or []:
        if project.get("image_url"):
            urls.add(project["image_url"])
    return urls

@router.get("", response_model=List[Member])
async def get_members():
    members = await db.members.find({}, {"_id": 0}).to_list(1000)
    for member in members:
        if isinstance(member.get("created_at"), str):
            member["created_at"] = datetime.fromisoformat(member["created_at"])
    return members

@router.get("/{member_id}", response_model=Member)
async def get_member(member_id: str):
    member = await db.members.find_one({"id": member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if isinstance(member.get("created_at"), str):
        member["created_at"] = datetime.fromisoformat(member["created_at"])
    return member


@router.get("/{member_id}/cv")
async def download_member_cv(member_id: str):
    """Download or view a member's CV securely via backend streaming."""
    member = await db.members.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    cv_url = member.get("cv_url")
    if not cv_url or not cv_url.strip():
        raise HTTPException(status_code=404, detail="CV not found for this member")

    cv_url = cv_url.strip()
    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', member.get("name", "Member"))
    ext = "pdf"
    if "." in cv_url:
        ext_candidate = cv_url.split(".")[-1].split("?")[0].lower()
        if ext_candidate in MIME_WHITELIST:
            ext = ext_candidate
    download_filename = f"CV_{safe_name}.{ext}"

    content_type = MIME_WHITELIST.get(ext, "application/octet-stream")
    disposition = "inline" if ext == "pdf" else "attachment"

    # Case 1: MinIO object (strict key regex or MinIO proxy path)
    object_key = None
    if MANAGED_KEY_REGEX.match(cv_url):
        object_key = cv_url
    elif "/csrg-media/cv/" in cv_url:
        object_key = "cv/" + cv_url.split("/csrg-media/cv/")[-1].split("?")[0]

    if object_key:
        body, length = await run_in_threadpool(get_file_stream, object_key)
        if body:
            def stream_chunks():
                try:
                    if hasattr(body, "iter_chunks"):
                        for chunk in body.iter_chunks(chunk_size=65536):
                            yield chunk
                    else:
                        while True:
                            chunk = body.read(65536)
                            if not chunk:
                                break
                            yield chunk
                finally:
                    body.close()

            headers = {
                "Content-Disposition": f'{disposition}; filename="{download_filename}"',
                "X-Content-Type-Options": "nosniff",
                "Cache-Control": "private, no-cache, no-store, must-revalidate",
            }
            if length:
                headers["Content-Length"] = str(length)
            return StreamingResponse(stream_chunks(), media_type=content_type, headers=headers)

    # Case 2: Legacy local fallback
    # TODO: Hapus fallback lokal setelah migrasi MinIO selesai
    if cv_url.startswith("/uploads/cv/"):
        local_filename = cv_url.split("/")[-1].split("?")[0]
        local_path = (CV_DIR / local_filename).resolve()
        if local_path.is_file() and local_path.is_relative_to(CV_DIR.resolve()):
            return FileResponse(
                path=local_path,
                media_type=content_type,
                headers={
                    "Content-Disposition": f'{disposition}; filename="{download_filename}"',
                    "X-Content-Type-Options": "nosniff",
                    "Cache-Control": "private, no-cache, no-store, must-revalidate",
                }
            )

    raise HTTPException(status_code=404, detail="CV file not found")


@router.post("", response_model=Member)
async def create_member(member: MemberCreate, current_user: str = Depends(get_current_user)):
    member_obj = Member(**member.model_dump())
    doc = member_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.members.insert_one(doc)
    return member_obj


@router.put("/{member_id}", response_model=Member)
async def update_member(member_id: str, member: MemberCreate, current_user: str = Depends(get_current_user)):
    existing_member = await db.members.find_one({"id": member_id})
    if not existing_member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Delete old photo from MinIO if a new photo is being set
    if member.photo_url != existing_member.get("photo_url") and existing_member.get("photo_url"):
        storage_delete_file(existing_member["photo_url"])

    # Delete previous uploaded CV only if no other member shares the same cv_url
    if "cv_url" in member.model_fields_set and existing_member.get("cv_url") \
            and member.cv_url != existing_member.get("cv_url"):
        old_cv = existing_member["cv_url"]
        shared_count = await db.members.count_documents({
            "id": {"$ne": member_id},
            "cv_url": old_cv
        })
        if shared_count == 0:
            storage_delete_file(old_cv)
        else:
            logger.info(f"Skipping deletion of {old_cv} as it is shared by {shared_count} other member(s).")

    # Only touch fields that were actually sent (old clients won't wipe cv_data)
    update_data = member.model_dump(exclude_unset=True)

    # Remove CV images that are no longer referenced
    if "cv_data" in update_data:
        old_images = _cv_image_urls(existing_member.get("cv_data"))
        new_images = _cv_image_urls(update_data.get("cv_data"))
        for url in old_images - new_images:
            try:
                storage_delete_file(url)
            except Exception as e:
                logger.warning(f"Could not delete unused CV image: {e}")

    await db.members.update_one({"id": member_id}, {"$set": update_data})

    updated_member = await db.members.find_one({"id": member_id}, {"_id": 0})
    if isinstance(updated_member.get("created_at"), str):
        updated_member["created_at"] = datetime.fromisoformat(updated_member["created_at"])
    return updated_member


@router.delete("/{member_id}")
async def delete_member(member_id: str, current_user: str = Depends(get_current_user)):
    member = await db.members.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Delete associated files from MinIO storage
    if member.get("photo_url"):
        storage_delete_file(member["photo_url"])

    # Delete CV only if no other member shares it
    if member.get("cv_url"):
        cv_to_delete = member["cv_url"]
        shared_count = await db.members.count_documents({
            "id": {"$ne": member_id},
            "cv_url": cv_to_delete
        })
        if shared_count == 0:
            storage_delete_file(cv_to_delete)
        else:
            logger.info(f"Skipping deletion of {cv_to_delete} as it is shared by {shared_count} other member(s).")

    for url in _cv_image_urls(member.get("cv_data")):
        try:
            storage_delete_file(url)
        except Exception as e:
            logger.warning(f"Could not delete CV image: {e}")

    await db.members.delete_one({"id": member_id})
    return {"message": "Member and associated files deleted successfully"}

