"""
storage.py — Abstraction layer for MinIO / S3 object storage.

All file upload and delete operations in the application go through this module.
This decouples business logic from the storage backend, making it trivial to
swap MinIO for AWS S3 or GCS in the future — only this file needs changing.
"""
import os
import re
import io
import json
import uuid
import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException

from core.config import (
    MINIO_ENDPOINT,
    MINIO_PUBLIC_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET,
    MINIO_USE_SSL,
    logger,
)

# ─── S3 Client (boto3 is compatible with MinIO's S3-compatible API) ───────────

_s3_client = boto3.client(
    "s3",
    endpoint_url=f"{'https' if MINIO_USE_SSL else 'http'}://{MINIO_ENDPOINT}",
    aws_access_key_id=MINIO_ACCESS_KEY,
    aws_secret_access_key=MINIO_SECRET_KEY,
    region_name="us-east-1",  # Required by boto3, value has no effect in MinIO
    config=boto3.session.Config(signature_version="s3v4"),
)


def apply_bucket_policy() -> None:
    """Apply public read policy ONLY to photos/* prefix. Failure is logged, does not crash startup."""
    policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"AWS": ["*"]},
            "Action": ["s3:GetObject"],
            "Resource": [f"arn:aws:s3:::{MINIO_BUCKET}/photos/*"]
        }]
    }
    try:
        _s3_client.put_bucket_policy(Bucket=MINIO_BUCKET, Policy=json.dumps(policy))
        logger.info(f"[Storage] Applied photos-only public policy on bucket '{MINIO_BUCKET}'.")
    except Exception as e:
        logger.warning(f"[Storage] Failed to apply bucket policy on '{MINIO_BUCKET}': {e}")


def ensure_bucket_exists() -> None:
    """
    Ensure the configured bucket exists in MinIO.

    Called once at application startup (see server.py @app.on_event('startup')).
    Applies a public-read policy scoped strictly to photos/*, keeping cv/* private.
    """
    try:
        _s3_client.head_bucket(Bucket=MINIO_BUCKET)
        logger.info(f"[Storage] Bucket '{MINIO_BUCKET}' already exists.")
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code in ("404", "NoSuchBucket"):
            _s3_client.create_bucket(Bucket=MINIO_BUCKET)
            logger.info(f"[Storage] Bucket '{MINIO_BUCKET}' created.")
        else:
            logger.error(f"[Storage] Unexpected error checking bucket: {e}")
            raise
    apply_bucket_policy()


def upload_file(file_bytes: bytes, object_key: str, content_type: str) -> str:
    """
    Upload a file to the MinIO bucket.

    Args:
        file_bytes  : Raw bytes of the file content.
        object_key  : Destination path inside the bucket, e.g. "photos/uuid.jpeg".
        content_type: MIME type of the file, e.g. "image/jpeg".

    Returns:
        str: Public URL of the uploaded file that can be used directly in
             <img src="..."> or <a href="...">.
             Format: "http://localhost:9000/csrg-media/photos/uuid.jpeg"

    Raises:
        HTTPException 500: If the upload to MinIO fails.
    """
    try:
        _s3_client.upload_fileobj(
            io.BytesIO(file_bytes),
            MINIO_BUCKET,
            object_key,
            ExtraArgs={"ContentType": content_type},
        )
        scheme = "https" if MINIO_USE_SSL else "http"
        endpoint = MINIO_PUBLIC_ENDPOINT or MINIO_ENDPOINT
        public_url = f"{scheme}://{endpoint}/{MINIO_BUCKET}/{object_key}"
        logger.info(f"[Storage] Uploaded '{object_key}' → {public_url}")
        return public_url
    except Exception as e:
        logger.error(f"[Storage] Failed to upload '{object_key}': {e}")
        raise HTTPException(
            status_code=500,
            detail="Gagal mengupload file ke storage."
        )


def get_file_stream(object_key: str):
    """Stream an object directly from MinIO without public exposure."""
    try:
        response = _s3_client.get_object(Bucket=MINIO_BUCKET, Key=object_key)
        return response['Body'], response.get('ContentLength')
    except ClientError as e:
        if e.response['Error']['Code'] in ('404', 'NoSuchKey'):
            return None, None
        raise


def get_object_bytes(object_key: str) -> bytes:
    """Fetch full object bytes from MinIO for in-memory processing (e.g. PDF preview)."""
    try:
        response = _s3_client.get_object(Bucket=MINIO_BUCKET, Key=object_key)
        return response['Body'].read()
    except ClientError as e:
        if e.response['Error']['Code'] in ('404', 'NoSuchKey'):
            return None
        raise


def delete_file(file_ref: str) -> None:
    """
    Delete a file from the MinIO bucket.

    Args:
        file_ref: Either a full public URL
                  ("http://localhost:9000/csrg-media/photos/uuid.jpeg")
                  or a raw object key ("photos/uuid.jpeg").
                  Both formats are handled automatically.

    Note:
        This function is idempotent — it does NOT raise an exception if the
        file does not exist, to keep delete operations safe.
        Legacy local path strings ("/uploads/photos/...") are skipped silently.
    """
    if not file_ref:
        return

    # Skip legacy local paths that predate MinIO migration
    if file_ref.startswith("/uploads/"):
        logger.debug(f"[Storage] Skipping legacy local path (not in MinIO): {file_ref}")
        return

    object_key = file_ref
    if file_ref.startswith("http"):
        # Parse: "http://host:port/bucket/prefix/filename"
        # → object_key = "prefix/filename"
        try:
            # Split on "/" and skip scheme ("http:"), empty string, host, bucket
            parts = file_ref.split("/")
            object_key = "/".join(parts[4:])
        except Exception:
            logger.warning(
                f"[Storage] Could not parse object key from URL: {file_ref}"
            )
            return

    if not object_key:
        logger.warning(f"[Storage] Empty object key derived from: {file_ref}")
        return

    try:
        _s3_client.delete_object(Bucket=MINIO_BUCKET, Key=object_key)
        logger.info(f"[Storage] Deleted '{object_key}' from '{MINIO_BUCKET}'")
    except ClientError as e:
        logger.warning(f"[Storage] Could not delete '{object_key}': {e}")


def sanitize_filename(name: str) -> str:
    """Sanitize original filename to prevent path traversal and unsafe characters."""
    name = os.path.basename(name)
    name = re.sub(r'[\x00-\x1f\x7f]', '', name)
    clean = re.sub(r'[^a-zA-Z0-9._-]', '_', name)
    return clean[:100] or f"file_{uuid.uuid4().hex[:8]}"


def generate_object_key(prefix: str, original_filename: str) -> str:
    """
    Generate a unique, safe object key for an uploaded file.

    For 'cv':
        Enforces strict extension whitelist (pdf, doc, docx) and omits user
        filename completely to prevent information disclosure and unsafe naming:
        returns 'cv/<uuid.hex>.<ext>'.

    For other prefixes:
        Preserves original naming pattern: f"{prefix}/{uuid.uuid4()}_{safe_name}".
    """
    if prefix == "cv":
        clean_name = sanitize_filename(original_filename)
        ext = clean_name.split(".")[-1].lower() if "." in clean_name else ""
        ALLOWED_CV_EXTS = {"pdf", "doc", "docx"}
        if ext not in ALLOWED_CV_EXTS:
            raise ValueError(
                f"Ekstensi file '{ext}' tidak diizinkan untuk CV. Hanya {', '.join(sorted(ALLOWED_CV_EXTS))} yang diizinkan."
            )
        return f"cv/{uuid.uuid4().hex}.{ext}"

    safe_name = original_filename.replace(" ", "_")
    return f"{prefix}/{uuid.uuid4()}_{safe_name}"

