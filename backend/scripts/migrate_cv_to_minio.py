"""
migrate_cv_to_minio.py — Migrasi file CV lokal ke bucket MinIO csrg-media.

Prosedur backup sebelum menjalankan migrasi:
  1. Backup MongoDB ke host (langsung stream via gzip archive, tanpa menyentuh data volume):
     docker compose -f docker-compose.prod.yml exec -T mongo mongodump \
       --uri="mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@localhost:27017/${DB_NAME}?authSource=admin" \
       --archive --gzip > ./backup_mongodb_$(date +%Y%m%d_%H%M%S).archive.gz

  2. Salin seluruh dokumen CV legacy keluar dari container ke host:
     docker compose -f docker-compose.prod.yml cp backend:/app/static/uploads/cv ./backup_cv_legacy_$(date +%Y%m%d_%H%M%S)

Cara menjalankan migrasi di dalam container (karena MongoDB & MinIO tidak dipublish ke host):
  # Simulasi (Dry-Run, default):
  docker compose -f docker-compose.prod.yml exec backend python -m scripts.migrate_cv_to_minio

  # Eksekusi migrasi nyata (Apply):
  docker compose -f docker-compose.prod.yml exec backend python -m scripts.migrate_cv_to_minio --apply
"""
import sys
import hashlib
import asyncio
import argparse
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
import boto3
from botocore.exceptions import ClientError
from core.config import (
    MONGO_URL,
    DB_NAME,
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET,
    MINIO_USE_SSL,
    CV_DIR,
)

MIME_WHITELIST = {
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "odt": "application/vnd.oasis.opendocument.text",
    "rtf": "application/rtf",
    "txt": "text/plain",
}


def calculate_member_cv_hash(member_id: str, file_path: Path) -> str:
    """
    Hitung sha256 deterministik dari kombinasi member_id + isi file:
    key = cv/<sha256(member_id + isi_file)[:32]>.<ext>
    Unik per anggota, deterministik, dan idempotent antara dry-run & apply.
    """
    h = hashlib.sha256()
    h.update(member_id.encode("utf-8"))
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()[:32]


async def run_migration(apply: bool = False):
    mode = "APPLY" if apply else "DRY-RUN"
    print(f"=== Memulai Migrasi CV ke MinIO [Mode: {mode}] ===\n")

    mongo_client = AsyncIOMotorClient(MONGO_URL)
    db = mongo_client[DB_NAME]

    s3 = boto3.client(
        "s3",
        endpoint_url=f"{'https' if MINIO_USE_SSL else 'http'}://{MINIO_ENDPOINT}",
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
        region_name="us-east-1",
    )

    members = await db.members.find({"cv_url": {"$regex": "^/uploads/cv/"}}).to_list(1000)
    print(f"Ditemukan {len(members)} anggota dengan CV lokal.\n")

    for m in members:
        member_id = m.get("id")
        name = m.get("name", "Unknown")
        old_url = m.get("cv_url")
        filename = Path(old_url).name
        local_path = (CV_DIR / filename).resolve()

        if not local_path.is_file():
            print(f"[SKIP] Member '{name}' ({member_id}): File lokal '{filename}' tidak ditemukan di {CV_DIR}.")
            continue

        ext = filename.split(".")[-1].lower() if "." in filename else "pdf"
        content_type = MIME_WHITELIST.get(ext, "application/octet-stream")

        # Key deterministik dari sha256(member_id + isi_file)
        file_hash = calculate_member_cv_hash(member_id, local_path)
        target_key = f"cv/{file_hash}.{ext}"

        print(f"[{mode}] Member: '{name}' ({member_id})")
        print(f"  File Lokal : {filename}")
        print(f"  Target Key : {target_key}")
        print(f"  ContentType: {content_type}")

        if apply:
            already_exists = False
            try:
                s3.head_object(Bucket=MINIO_BUCKET, Key=target_key)
                already_exists = True
                print("  Status     : Objek sudah ada di MinIO (skip upload)")
            except ClientError:
                pass

            if not already_exists:
                with open(local_path, "rb") as f:
                    s3.upload_fileobj(f, MINIO_BUCKET, target_key, ExtraArgs={"ContentType": content_type})
                # Verifikasi head_object pasca-upload
                s3.head_object(Bucket=MINIO_BUCKET, Key=target_key)
                print("  Status     : Sukses diunggah ke MinIO dan diverifikasi")

            # Update MongoDB
            await db.members.update_one({"id": member_id}, {"$set": {"cv_url": target_key}})
            print(f"  MongoDB    : cv_url diperbarui ke '{target_key}'\n")
        else:
            print(f"  Rencana    : Akan mengunggah ke '{target_key}' dan update MongoDB cv_url\n")

    print(f"=== Selesai [{mode}] ===")


def main():
    parser = argparse.ArgumentParser(description="Migrate local CVs to MinIO")
    parser.add_argument("--apply", action="store_true", help="Apply the migration (default is dry-run)")
    args = parser.parse_args()
    asyncio.run(run_migration(apply=args.apply))


if __name__ == "__main__":
    main()
