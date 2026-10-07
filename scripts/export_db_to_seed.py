#!/usr/bin/env python3
"""
export_db_to_seed.py — Sync current MongoDB members & news directly into backend/seed_data.py.
Usage: python3 scripts/export_db_to_seed.py
"""
import os
import sys
import json
import httpx
from pathlib import Path

API_URL = os.environ.get("API_URL", "http://localhost:8000/api")
SEED_FILE = Path(__file__).resolve().parent.parent / "backend" / "seed_data.py"

def main():
    print(f"Mengambil data dari API: {API_URL} ...")
    try:
        with httpx.Client(timeout=10.0) as client:
            resp_members = client.get(f"{API_URL}/members")
            resp_members.raise_for_status()
            members_data = resp_members.json()

            resp_news = client.get(f"{API_URL}/news")
            resp_news.raise_for_status()
            news_data = resp_news.json()
    except Exception as e:
        print(f"❌ Gagal mengambil data dari API: {e}")
        print("Pastikan container backend berjalan (http://localhost:8000)")
        sys.exit(1)

    print(f"✓ Berhasil mengambil {len(members_data)} anggota dan {len(news_data)} artikel berita.")

    # Format into Python syntax for seed_data.py
    members_code = "    members = " + json.dumps(members_data, indent=8, ensure_ascii=False).replace("null", "None")
    news_code = "    news = " + json.dumps(news_data, indent=8, ensure_ascii=False).replace("null", "None")

    content = f'''import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'csrg_database')]
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed_database():
    print("Seeding database...")

    # ─── Admin User ───────────────────────────────────────────────────────────
    await db.users.delete_many({{}})
    admin_email = os.environ.get("ADMIN_DEFAULT_EMAIL", "jarkom@pens.ac.id")
    raw_password = os.environ.get("ADMIN_DEFAULT_PASSWORD", "jarkom@123")
    admin_password = pwd_context.hash(raw_password)
    await db.users.insert_one({{
        "id": str(uuid.uuid4()),
        "username": "admin",
        "email": admin_email,
        "hashed_password": admin_password,
        "created_at": datetime.now(timezone.utc).isoformat()
    }})
    print(f"✓ Admin user created (email: {{admin_email}}, password: {{raw_password}})")
    if raw_password == "jarkom@123":
        print("  ⚠️  PERINGATAN: Menggunakan default password. Segera ubah password admin di lingkungan produksi!")

    # ─── Members (Tersinkronisasi dari Database) ──────────────────────────────
    await db.members.delete_many({{}})
{members_code}
    if members:
        await db.members.insert_many(members)
        print(f"✓ {{len(members)}} members seeded successfully.")
    else:
        print("✓ No members to seed.")

    # ─── News (Tersinkronisasi dari Database) ─────────────────────────────────
    await db.news.delete_many({{}})
{news_code}
    if news:
        await db.news.insert_many(news)
        print(f"✓ {{len(news)}} news articles seeded successfully.")
    else:
        print("✓ No news to seed.")

    print("Database seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_database())
'''

    with open(SEED_FILE, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ Berhasil menyinkronkan data ke {SEED_FILE}!")

if __name__ == "__main__":
    main()
