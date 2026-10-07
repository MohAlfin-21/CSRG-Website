import re
import uuid
import base64
from io import BytesIO
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse
from PIL import Image

from starlette.concurrency import run_in_threadpool

from core.security import get_current_user
from core.config import PHOTOS_DIR, CV_DIR, CV_TEMPLATE_PATH, logger
from core.storage import (
    upload_file,
    delete_file as storage_delete_file,
    generate_object_key,
    sanitize_filename,
    get_object_bytes,
)

router = APIRouter(tags=["Files & Uploads"])

def get_safe_file_path(base_dir: Path, filename: str) -> Path:
    """
    Resolve and verify that the target path is strictly contained within base_dir.
    Guarantees OWASP path traversal protection.
    """
    if "\x00" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename format")
    
    resolved_base = base_dir.resolve()
    resolved_target = (base_dir / filename).resolve()
    
    try:
        resolved_target.relative_to(resolved_base)
    except ValueError:
        logger.warning(f"Path traversal attempt blocked: {filename}")
        raise HTTPException(status_code=400, detail="Invalid path: directory traversal detected")
    
    if resolved_target == resolved_base:
        raise HTTPException(status_code=400, detail="Invalid path: filename required")
    
    return resolved_target


@router.post("/upload/cv")
async def upload_cv(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    """
    Upload a CV file to MinIO storage (PDF or document format).
    Maximum file size: 10 MB.
    """
    MAX_CV_SIZE = 10 * 1024 * 1024  # 10 MB

    try:
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        contents = await file.read()

        # Enforce upload size limit (DoS protection)
        if len(contents) > MAX_CV_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Ukuran file melebihi batas maksimum {MAX_CV_SIZE // (1024*1024)} MB."
            )

        allowed_types = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.oasis.opendocument.text",
            "application/rtf",
            "text/plain"
        ]
        
        clean_name = sanitize_filename(file.filename)
        file_ext = clean_name.split('.')[-1].lower() if '.' in clean_name else ''
        allowed_extensions = ['pdf', 'doc', 'docx', 'odt', 'rtf', 'txt']
        
        if file.content_type not in allowed_types and file_ext not in allowed_extensions:
            logger.warning(f"Invalid file type rejected: {file.content_type}, ext: {file_ext}")
            raise HTTPException(
                status_code=400,
                detail="Format file tidak didukung. Format yang diizinkan: PDF, DOC, DOCX, ODT, RTF, TXT."
            )
        
        # Verify PDF magic bytes if PDF extension is claimed
        if file_ext == 'pdf' and not contents.startswith(b'%PDF-'):
            raise HTTPException(status_code=400, detail="File PDF tidak valid atau rusak.")
        
        # Upload to MinIO object storage
        try:
            object_key = generate_object_key("cv", clean_name)
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))

        await run_in_threadpool(
            upload_file,
            file_bytes=contents,
            object_key=object_key,
            content_type=file.content_type or "application/pdf",
        )
        return {
            "success": True,
            "key": object_key,
            "filename": clean_name,
            "url": object_key,
        }
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error uploading CV: {str(e)}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan internal saat mengunggah CV.")



@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    """
    Upload an image to MinIO storage. Maximum file size: 5 MB.
    Re-encodes image to clean WebP format to eliminate hidden malicious payloads/polyglots.
    """
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

    try:
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Format gambar tidak diizinkan. Tipe yang didukung: {', '.join(allowed_types)}"
            )

        contents = await file.read()

        # Enforce upload size limit (DoS protection)
        if len(contents) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Ukuran gambar melebihi batas maksimum {MAX_IMAGE_SIZE // (1024*1024)} MB."
            )
        
        # Verify and re-encode image via Pillow (sanitizes polyglot scripts / EXIF attacks)
        try:
            image = Image.open(BytesIO(contents))
            image.verify()  # Validate image integrity
            
            # Reopen since verify closes or alters image state
            image = Image.open(BytesIO(contents))
            
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'RGBA':
                    background.paste(image, mask=image.split()[3])
                else:
                    background.paste(image)
                image = background
            elif image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to WebP for modern web performance
            webp_buffer = BytesIO()
            image.save(webp_buffer, format='WEBP', quality=85, method=6)
            webp_contents = webp_buffer.getvalue()
        except Exception as e:
            logger.warning(f"Pillow image validation/conversion warning: {str(e)}")
            # If verification failed, reject the file as invalid image
            raise HTTPException(status_code=400, detail="File yang diunggah bukan gambar yang valid.")
        
        clean_name = sanitize_filename(file.filename)
        original_name = clean_name.rsplit('.', 1)[0] if '.' in clean_name else clean_name
        webp_filename = f"{original_name}_{uuid.uuid4().hex}.webp"
        
        # Upload sanitized WebP to MinIO object storage
        object_key = generate_object_key("photos", webp_filename)
        public_url = upload_file(
            file_bytes=webp_contents,
            object_key=object_key,
            content_type="image/webp",
        )
        return {
            "success": True,
            "url": public_url,       # Full MinIO URL: http://localhost:9000/csrg-media/photos/uuid.webp
            "filename": object_key,  # Object key:    photos/uuid.webp
            "original_name": original_name
        }
    
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan internal saat mengunggah gambar.")



@router.delete("/upload/file/{filename:path}")
async def delete_file_endpoint(
    filename: str,
    current_user: str = Depends(get_current_user)
):
    """
    Delete an uploaded file from MinIO storage.
    Accepts either a raw object key ("photos/uuid.webp" or "cv/uuid.pdf")
    or a full MinIO URL ("http://localhost:9000/csrg-media/photos/uuid.webp").
    """
    try:
        if not filename:
            raise HTTPException(status_code=400, detail="Nama file tidak boleh kosong.")

        # Validate prefix for object key format
        if not filename.startswith("http") and not (
            filename.startswith("photos/") or filename.startswith("cv/")
        ):
            raise HTTPException(status_code=400, detail="Direktori file tidak valid.")

        storage_delete_file(filename)
        return {"success": True, "message": "File berhasil dihapus dari storage."}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error deleting file: {str(e)}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan internal saat menghapus file.")


@router.get("/files/{file_type}/{filename:path}")
async def serve_file(
    file_type: str, 
    filename: str,
    w: int = None,
    q: int = None,
    fmt: str = None
):
    """
    Serve uploaded files with path traversal security and optional image optimization.
    """
    try:
        if file_type not in ["photos", "cv"]:
            raise HTTPException(status_code=400, detail="Tipe file tidak valid.")
        
        base_dir = PHOTOS_DIR if file_type == "photos" else CV_DIR
        file_path = get_safe_file_path(base_dir, filename)
        
        if not file_path.is_file():
            raise HTTPException(status_code=404, detail="File tidak ditemukan.")
        
        # Apply on-the-fly optimization if requested for photos
        if file_type == "photos" and (w or q or fmt):
            try:
                with open(file_path, "rb") as f:
                    img_data = f.read()
                
                image = Image.open(BytesIO(img_data))
                
                if w and 10 <= w <= 4000:
                    ratio = w / image.width
                    new_height = int(image.height * ratio)
                    image = image.resize((w, new_height), Image.Resampling.LANCZOS)
                
                if image.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', image.size, (255, 255, 255))
                    if image.mode == 'RGBA':
                        background.paste(image, mask=image.split()[3])
                    else:
                        background.paste(image)
                    image = background
                elif image.mode != 'RGB':
                    image = image.convert('RGB')
                
                output_format = (fmt or 'webp').lower()
                output_quality = max(1, min(100, q or 80))
                
                output_buffer = BytesIO()
                if output_format == 'webp':
                    image.save(output_buffer, format='WEBP', quality=output_quality, method=6)
                    media_type = 'image/webp'
                elif output_format in ['jpg', 'jpeg']:
                    image.save(output_buffer, format='JPEG', quality=output_quality)
                    media_type = 'image/jpeg'
                elif output_format == 'png':
                    image.save(output_buffer, format='PNG')
                    media_type = 'image/png'
                else:
                    media_type = 'image/webp'
                    image.save(output_buffer, format='WEBP', quality=output_quality, method=6)
                
                output_buffer.seek(0)
                
                return StreamingResponse(
                    iter([output_buffer.getvalue()]),
                    media_type=media_type,
                    headers={
                        "Cache-Control": "public, max-age=86400",
                        "X-Content-Type-Options": "nosniff",
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to optimize image on-the-fly: {str(e)}")
        
        return FileResponse(
            path=file_path,
            media_type="application/octet-stream",
            headers={
                "Cache-Control": "public, max-age=86400",
                "X-Content-Type-Options": "nosniff",
            }
        )
    
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error serving file: {str(e)}")
        raise HTTPException(status_code=500, detail="Gagal mengambil file.")


@router.get("/preview/cv/{filename:path}")
async def preview_cv(filename: str):
    """
    Serve CV file safely for preview.
    Supports both MinIO object storage and legacy local disk fallback.
    """
    try:
        clean_key = filename.strip().replace("\\", "/")
        if ".." in clean_key or clean_key.startswith("/"):
            raise HTTPException(status_code=400, detail="Invalid path: directory traversal detected")

        object_key = clean_key if clean_key.startswith("cv/") else f"cv/{clean_key}"
        pdf_data = None

        # 1. Try MinIO object storage first
        try:
            pdf_data = await run_in_threadpool(get_object_bytes, object_key)
        except Exception as e:
            logger.warning(f"Could not fetch CV from MinIO ({object_key}): {e}")

        # 2. Fallback to legacy local disk
        # TODO: Hapus fallback lokal setelah migrasi MinIO selesai
        if pdf_data is None:
            local_filename = clean_key.split("/")[-1]
            try:
                file_path = get_safe_file_path(CV_DIR, local_filename)
                if file_path.is_file():
                    with open(file_path, "rb") as f:
                        pdf_data = f.read()
            except HTTPException:
                pass

        if pdf_data is None:
            raise HTTPException(status_code=404, detail="File CV tidak ditemukan.")

        file_ext = clean_key.split('.')[-1].lower() if '.' in clean_key else ''
        clean_filename = sanitize_filename(clean_key.split("/")[-1])

        if file_ext == 'pdf':
            pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')

            if CV_TEMPLATE_PATH.exists():
                with open(CV_TEMPLATE_PATH, "r") as f:
                    html_content = f.read()
                html_content = html_content.replace('{PDF_BASE64}', pdf_base64)
                html_content = html_content.replace('{FILENAME}', clean_filename)
            else:
                html_content = f"<html><body><iframe src='data:application/pdf;base64,{pdf_base64}' width='100%' height='100%'></iframe></body></html>"

            return HTMLResponse(
                content=html_content,
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "X-Content-Type-Options": "nosniff",
                }
            )

        return StreamingResponse(
            iter([pdf_data]),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{clean_filename}"',
                "X-Content-Type-Options": "nosniff",
            }
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error previewing CV: {str(e)}")
        raise HTTPException(status_code=500, detail="Gagal menampilkan pratinjau CV.")
