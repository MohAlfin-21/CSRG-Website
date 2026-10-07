import asyncio
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
    await db.users.delete_many({})
    admin_email = os.environ.get("ADMIN_DEFAULT_EMAIL", "jarkom@pens.ac.id")
    raw_password = os.environ.get("ADMIN_DEFAULT_PASSWORD", "jarkom@123")
    admin_password = pwd_context.hash(raw_password)
    await db.users.insert_one({
        "id": str(uuid.uuid4()),
        "username": "admin",
        "email": admin_email,
        "hashed_password": admin_password,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    print(f"✓ Admin user created (email: {admin_email}, password: {raw_password})")
    if raw_password == "jarkom@123":
        print("  ⚠️  PERINGATAN: Menggunakan default password. Segera ubah password admin di lingkungan produksi!")

    # ─── Members (Tersinkronisasi dari Database) ──────────────────────────────
    await db.members.delete_many({})
    members = [
        {
                "id": "9bc39576-574d-49f3-8fdc-b42c40d648a5",
                "name": "Ferry Astika",
                "position": " Dosen Ketua CSRG",
                "photo_url": "/uploads/photos/0bee247f-76cf-4bb6-94b2-81331e20ea37.jpeg",
                "linkedin_url": "https://id.linkedin.com/in/ferryastika",
                "scholar_url": "https://scholar.google.com/citations?user=HaiwzpAAAAAJ&hl=en",
                "cv_url": "/uploads/cv/f0c2de5d-ec1b-4930-81a3-33bfac608cf6_CV_Ferry_Astika.pdf",
                "cv_public_id": None,
                "research_area": None,
                "created_at": "2025-11-14T02:17:21.109076Z"
        },
        {
                "id": "23430f76-fe30-4962-beed-dd70ed49b4c6",
                "name": "Yesta Medya",
                "position": "Dosen Pembimbing CSRG",
                "photo_url": "/uploads/photos/d4a56657-4eff-446f-8d88-9277c536aee1.png",
                "linkedin_url": "https://id.linkedin.com/in/yesta-medya-3a8122276",
                "scholar_url": "https://scholar.google.com/citations?user=sP4bZJ8AAAAJ&hl=en",
                "cv_url": "",
                "cv_public_id": None,
                "research_area": None,
                "created_at": "2025-11-17T01:34:57.713454Z"
        },
        {
                "id": "1bb8f22c-f5f5-4550-9ec0-8f85d07c192a",
                "name": "A'idah Inas Zhafi'ah",
                "position": "Anggota Magang CSRG",
                "photo_url": "/uploads/photos/df875430-7d3f-4c1d-b812-8f033918d0be.jpg",
                "linkedin_url": "",
                "scholar_url": "",
                "cv_url": "",
                "cv_public_id": None,
                "research_area": None,
                "created_at": "2025-11-17T01:35:10.677535Z"
        },
        {
                "id": "cf263702-c082-4652-8608-7b398a399b2e",
                "name": "M Alfiyan Syamsuddin",
                "position": "Mahasiswa Anggota CSRG",
                "photo_url": "/uploads/photos/c3dd5248-eb7c-445f-aaff-250125e3ce61.jpg",
                "linkedin_url": "https://www.linkedin.com/in/muhammad-alfiyan-syamsuddin-051998b5",
                "scholar_url": "",
                "cv_url": "",
                "cv_public_id": None,
                "research_area": None,
                "created_at": "2025-11-17T02:33:09.684271Z"
        },
        {
                "id": "887cf6d6-b494-4692-8e48-0ffa32d3abd8",
                "name": "Jordan Frisay Himawan",
                "position": "Mahasiswa Anggota CSRG",
                "photo_url": "/uploads/photos/87a702ab-f415-4836-a845-7498a1b1d37c.jpg",
                "linkedin_url": "https://linkedin.com/in/jordan-himawan",
                "scholar_url": "",
                "cv_url": "",
                "cv_public_id": None,
                "research_area": None,
                "created_at": "2025-11-17T02:33:15.646549Z"
        },
        {
                "id": "8e198f27-983e-4178-9c2b-c7c27a9b4e3e",
                "name": "Sultan Argya Safa Firdaus",
                "position": "Mahasiswa Anggota CSRG",
                "photo_url": "/uploads/photos/Sultan_55ce783f-f76e-4ad9-9e72-d23fceb67216.webp",
                "linkedin_url": "https://www.linkedin.com/in/sultanfirdaus",
                "scholar_url": "",
                "cv_url": "",
                "cv_public_id": None,
                "research_area": None,
                "created_at": "2025-11-17T02:33:15.867027Z"
        },
        {
                "id": "341c0597-4b5e-449a-aadf-c0f5b7e92897",
                "name": "Saiq Syahru Qadri",
                "position": "Mahasiswa Anggota CSRG",
                "photo_url": "/uploads/photos/f67fb467-baff-42cc-aa1d-f95487d8eb13.png",
                "linkedin_url": "https://www.linkedin.com/in/saiq-syahru-qadri-74414824b",
                "scholar_url": "",
                "cv_url": "",
                "cv_public_id": None,
                "research_area": None,
                "created_at": "2025-11-17T03:27:10.857821Z"
        },
        {
                "id": "4b07b3e0-71b0-456a-9c5a-52bdd7753524",
                "name": "Qois Dzulfikar Nugroho",
                "position": "Mahasiswa Anggota CSRG",
                "photo_url": "/uploads/photos/e53f30b0-9e5a-4929-b8a1-342b6f94e032.jpg",
                "linkedin_url": "https://www.linkedin.com/in/izidizzi/",
                "scholar_url": "",
                "cv_url": "",
                "cv_public_id": None,
                "research_area": None,
                "created_at": "2025-11-17T09:12:44.410053Z"
        },
        {
                "id": "c6388787-4524-442b-a7d4-a3c6e71f7ad3",
                "name": "Mahendra Khibrah Rabbani Sayyid",
                "position": "Mahasiswa Anggota CSRG",
                "photo_url": "/uploads/photos/f9ff367c-91ce-4e59-bf4a-33839c8e342f.png",
                "linkedin_url": "https://www.linkedin.com/in/mahendrakhibrah",
                "scholar_url": "",
                "cv_url": "/uploads/cv/79ae292d-10cc-468a-ad6d-d449b9911a07_Mahendra Khibrah - Software Engineer Resume (1) (1) - Mahendra Khibrah.pdf",
                "cv_public_id": None,
                "research_area": None,
                "created_at": "2025-11-18T03:07:14.176801Z"
        },
        {
                "id": "2597a3a0-1f1c-4262-b9cd-403c1bb75edc",
                "name": "Muhammad Fattachul Aziz",
                "position": "Mahasiswa Anggota CSRG",
                "photo_url": "/uploads/photos/04f2cd3d-5162-40e1-a6c8-65384387e6c6.png",
                "linkedin_url": "https://www.linkedin.com/in/muhammad-fattachul-aziz-210304262",
                "scholar_url": "",
                "cv_url": "",
                "cv_public_id": None,
                "research_area": None,
                "created_at": "2025-11-18T03:10:54.231794Z"
        },
        {
                "id": "d7477b28-ebcc-4cc1-a7c5-ebaedbbde849",
                "name": "Muhammad Nandha Chrismawan",
                "position": "Mahasiswa Anggota CSRG",
                "photo_url": "/uploads/photos/40774827-6c38-4ef1-b27a-29a2135dcdc5.jpeg",
                "linkedin_url": "https://www.linkedin.com/in/nandhachrismawan",
                "scholar_url": "",
                "cv_url": "",
                "cv_public_id": None,
                "research_area": None,
                "created_at": "2025-11-18T03:12:27.710054Z"
        },
        {
                "id": "b142c520-1c19-4305-ae06-6bda48d60ab1",
                "name": "Fadhil Yori Hibatullah",
                "position": "Anggota CSRG",
                "photo_url": "/uploads/photos/87032cfb-3353-49f5-a808-a43a7e073448.jpg",
                "linkedin_url": "https://www.linkedin.com/in/fadhil-yori-hibatullah",
                "scholar_url": "",
                "cv_url": "",
                "cv_public_id": None,
                "research_area": None,
                "created_at": "2025-11-18T03:13:39.893739Z"
        },
        {
                "id": "0a6392f1-959b-4fd7-95db-89ab0231749f",
                "name": "Reza Athallah Rasendriya",
                "position": "Anggota CSRG",
                "photo_url": "/uploads/photos/8b99988f-e1f6-44b2-8f90-75fd3311c22b.jpeg",
                "linkedin_url": "https://www.linkedin.com/in/rezaaar",
                "scholar_url": "",
                "cv_url": "/uploads/cv/1f27b131-bb17-48cc-ad3f-30958b861b65_CV_Reza Rasendriya Resume - Reza Athallah Rasendriya.pdf",
                "cv_public_id": None,
                "research_area": None,
                "created_at": "2025-11-18T03:59:15.736531Z"
        },
        {
                "id": "a9f5d898-929b-4373-af19-2690998e41af",
                "name": "Caesarico Bayu Sejati",
                "position": "Anggota Magang CSRG",
                "photo_url": "/uploads/photos/6e67c008-7d6f-4ba3-9ff3-cce6d5aa2a75.jpeg",
                "linkedin_url": "",
                "scholar_url": "",
                "cv_url": "",
                "cv_public_id": None,
                "research_area": None,
                "created_at": "2025-11-18T13:04:07.982801Z"
        }
]
    if members:
        await db.members.insert_many(members)
        print(f"✓ {len(members)} members seeded successfully.")
    else:
        print("✓ No members to seed.")

    # ─── News (Tersinkronisasi dari Database) ─────────────────────────────────
    await db.news.delete_many({})
    news = [
        {
                "id": "2e3b35ab-3204-44c8-a21d-528000824200",
                "title": "Day 1, Pensasi Berdampak",
                "content": "Menampilkan produk yang bernama \"Mata Elang\", Mata Elang adalah perangkat lunak IDS/IPS (Intrusion Detection & Prevention System) yang dikembangkan oleh CSRG (Cyber Security Research Group) PENS. Sistem ini dirancang untuk mendeteksi, menganalisis, dan mencegah ancaman keamanan jaringan secara real-time, dengan fokus pada kecepatan, akurasi, dan kemudahan integrasi. Mengusung nama “Mata Elang,” software ini menekankan kemampuan pengawasan tajam, pemantauan mendalam, serta respons otomatis terhadap aktivitas mencurigakan dalam infrastruktur jaringan modern.\n\nJuga FMS (Fleet Management System), yaitu modul monolith untuk bus tracking.",
                "excerpt": "Pameran Inovasi dan Teknologi Vokasi. Hari pertama CSRG menampilkan hasil riset di Pensasi",
                "thumbnail_url": "/uploads/photos/03db424e-99ea-41aa-998d-0026a237d32b.jpeg",
                "published_date": "2025-11-19T08:14:24.406843Z",
                "created_at": "2025-11-19T08:14:24.406845Z"
        }
]
    if news:
        await db.news.insert_many(news)
        print(f"✓ {len(news)} news articles seeded successfully.")
    else:
        print("✓ No news to seed.")

    # ─── Products (Inovasi & Open Source) ────────────────────────────────────
    await db.products.delete_many({})
    products = [
        {
            "id": "8ba71321-b9aa-48eb-b14c-50e21fb96649",
            "name": "Mata Elang",
            "tagline": "Network Intrusion Detection System",
            "description": "Mata Elang adalah produk open source pertama dari CSRG, berupa software untuk monitoring keamanan jaringan secara real-time. Dengan Mata Elang, Anda dapat mendeteksi anomali, serangan, dan aktivitas mencurigakan di jaringan Anda secara efisien dan mudah.",
            "tags": ["#NIDS", "#Suricata", "#Machine Learning", "#Open Source"],
            "features": [
                "Real-time network monitoring",
                "Anomaly detection via ML",
                "Alert system yang responsive",
                "Open source & customizable",
                "Suricata-based engine",
                "Dashboard visualisasi",
            ],
            "icon_name": "Shield",
            "image_url": "/MataElang.png",
            "image_filename": None,
            "preview_light_url": "/mataelang_preview.png",
            "preview_light_filename": None,
            "preview_dark_url": "/mataelang_dark_preview.png",
            "preview_dark_filename": None,
            "website": "https://mataelang.net",
            "github": "https://github.com/mata-elang-stable",
            "live_preview_url": "https://mataelang.net",
            "status": "Active Stable",
            "category": "Security Monitoring",
            "color": "from-blue-500 to-cyan-500",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    ]
    if products:
        await db.products.insert_many(products)
        print(f"✓ {len(products)} products seeded successfully.")
    else:
        print("✓ No products to seed.")

    print("Database seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_database())
