# 🛡️ CSRG Web — Cyber Security Research Group PENS

Official web application and administrative portal for the **Cyber Security Research Group (CSRG)**, Politeknik Elektronika Negeri Surabaya (EEPIS / PENS).

Built with modern high-performance microservices: **FastAPI (Python)**, **React 19 + Vite**, **MinIO S3-compatible Object Storage**, **MongoDB**, and **Nginx**.

---

## 🌟 Fitur Utama

### 🌐 Portal Publik
- **Beranda (Home):** Hero banner, overview riset, statistik lab, produk unggulan, dan CTA kolaborasi.
- **Profil Lab:** Sejarah pendirian, visi, misi, fokus riset keamanan siber, dan fasilitas.
- **Tim & Peneliti (Members):** Profil dosen pembimbing, ketua lab, peneliti, dan mahasiswa magang lengkap dengan integrasi publikasi Google Scholar dan CV preview.
- **Produk & Riset:** Showcase riset terapan seperti Mata Elang (NIDS/SIEM) dan inovasi siber lainnya.
- **Berita & Artikel:** Publikasi berita, pengumuman workshop, dan dokumentasi kegiatan lab.
- **Kontak:** Formulir pesan terproteksi rate-limiting terhubung langsung ke dashboard admin.
- **Responsive & Dark Mode:** Tampilan adaptif untuk mobile, tablet, dan desktop dengan transisi tema yang halus.

### 🔐 Panel Administrasi (Admin Portal)
- **Dashboard Statistik:** Quick stats anggota, publikasi, artikel berita, dan inbox pesan masuk.
- **Manajemen Anggota:** Tambah, edit, dan hapus data anggota tim serta sinkronisasi publikasi otomatis dari Google Scholar.
- **Secure File & Media Upload:** Upload foto profil (otomatis disanitasi dan di-convert ke WebP) dan upload CV (PDF/DOCX) menggunakan MinIO Object Storage.
- **Inbox Pesan Kontak:** Tinjau dan kelola pesan masuk dari formulir kontak.
- **Manajemen Berita:** Editor publikasi berita lengkap dengan thumbnail dan tanggal rilis.

---

## 🏗️ Arsitektur Sistem

```text
                               ┌────────────────────────────────────────┐
                               │             Pengguna / Klien           │
                               └──────────────────┬─────────────────────┘
                                                  │ HTTPS (:443 / :80)
                                                  ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Nginx Reverse Proxy & Static                           │
│  - HSTS, CSP (no unsafe-eval), X-Frame-Options, nosniff, Referrer-Policy               │
│  - Melayani bundle SPA Frontend (React 19 + Vite)                                      │
├──────────────────────────────────────┬─────────────────────────────────────────────────┤
│    /api/*                            │    /csrg-media/*                                │
│    (Proxy ke FastAPI)                │    (Proxy ke MinIO S3)                          │
│    ▼                                 ▼                                                 │
│  ┌──────────────────────────────┐  ┌────────────────────────────────────────────────┐  │
│  │   Backend Service (FastAPI)  │  │        MinIO Object Storage Engine             │  │
│  │   - Non-root appuser         │  │   - Port 9000 & 9001 internal only             │  │
│  │   - Rate Limiter per-IP      │  │   - Menyimpan foto WebP & CV PDF               │  │
│  │   - SSRF Protection          │  │   - Zero direct public exposure                │  │
│  │   - httpOnly JWT Session     │  └────────────────────────────────────────────────┘  │
│  └──────────────┬───────────────┘                                                      │
│                 │                                                                      │
│                 ▼                                                                      │
│  ┌──────────────────────────────┐                                                      │
│  │    MongoDB Database Engine   │                                                      │
│  │    - Internal Docker network │                                                      │
│  │    - Auth enabled            │                                                      │
│  └──────────────────────────────┘                                                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Standar Keamanan & DevSecOps

Website ini telah melalui audit keamanan berkala dengan standar **OWASP ASVS**:
- ✅ **Zero Known Vulnerabilities:** Bebas CVE dependensi (`pip-audit` & `npm audit` bersih 0 vulnerability).
- ✅ **JWT Authentication Aman:** Token disimpan dalam `httpOnly` secure cookie dengan flag `SameSite=lax` untuk mencegah serangan XSS token-theft dan CSRF. Dilengkapi mekanisme **token revocation blacklist** saat logout.
- ✅ **SSRF & Input Defense:** Validasi ketat terhadap URL eksternal (Google Scholar) dengan domain whitelisting, regex sanitasi ID, dan non-blocking async HTTP client.
- ✅ **Sanitasi File Upload:**
  - MIME-type validation & PDF magic-byte header verification.
  - Gambar otomatis di-decode dan di-re-encode ulang ke format WebP menggunakan Pillow untuk mengeliminasi polyglot script/EXIF payload injection.
  - OWASP path traversal protection pada semua operasi file.
- ✅ **Isolasi Port Produksi:** Port MongoDB (27017) dan MinIO S3/Console (9000/9001) **tidak diekspos** ke internet, melainkan dilayani aman lewat Nginx internal proxy.
- ✅ **Security Headers Komprehensif:** HSTS (`max-age=31536000`), CSP tanpa `unsafe-eval`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
- ✅ **Container Non-Root:** Backend berjalan menggunakan unprivileged user `appuser` dalam container Linux minimalis.

---

## 📁 Struktur Direktori

```text
csrg_web/
├── backend/                       # Layanan Backend FastAPI
│   ├── core/                      # Modul inti (config, database, security, storage)
│   ├── models/                    # Pydantic schemas (User, Member, News, Contact)
│   ├── routers/                   # API router modular (auth, members, news, contact, files, scholar)
│   ├── static/                    # Template HTML dan aset lokal fallback
│   ├── Dockerfile                 # Multi-stage Dockerfile (non-root appuser)
│   ├── requirements.txt           # Dependensi Python teruji (zero-CVE)
│   ├── scholar_scraper.py         # Google Scholar async scraper (SSRF-protected)
│   ├── seed_data.py               # Database seeder awal
│   └── server.py                  # Entry point FastAPI dengan lifespan context
├── frontend/                      # Aplikasi Frontend SPA
│   ├── src/                       # Komponen React, Halaman, Hooks, & Libs
│   │   ├── components/            # UI components (Navbar, Footer, Shadcn/Radix)
│   │   ├── pages/                 # Halaman portal publik & admin
│   │   └── config.js              # Konfigurasi API terpusat
│   ├── Dockerfile                 # Multi-stage build (Node 20 -> Nginx Alpine)
│   ├── nginx.conf                 # Konfigurasi Nginx produksi (headers, reverse proxy)
│   ├── package.json               # Dependensi frontend React 19
│   └── vite.config.js             # Konfigurasi Vite (auto console.* strip di prod)
├── scripts/                       # Skrip automasi DevOps
│   └── rotate_secrets.sh          # Helper generator kredensial aman
├── docker-compose.yml             # Compose default untuk development
├── docker-compose.dev.yml         # Override hot-reload development
├── docker-compose.prod.yml        # Compose standar produksi (isolated network)
├── .env.example                   # Template variabel lingkungan root
├── DOCUMENTATION.md               # Dokumentasi teknis arsitektur lengkap
└── README.md                      # Dokumentasi utama proyek
```

---

## 🚀 Memulai (Quick Start)

### Prasyarat
- **Docker & Docker Compose** (versi 2.20+)
- *Atau untuk dev lokal tanpa Docker:* Python 3.11+, Node.js 20+, MongoDB 6+, MinIO

---

### Cara 1: Menggunakan Docker (Direkomendasikan)

1. **Clone repositori:**
   ```bash
   git clone <url-repository>
   cd csrg_web
   ```

2. **Siapkan file environment:**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   chmod 600 .env backend/.env frontend/.env
   ```
   *(Opsional) Jalankan `./scripts/rotate_secrets.sh` untuk menghasilkan password baru yang kuat.*

3. **Jalankan container development:**
   ```bash
   docker compose up -d --build
   ```

4. **Jalankan database seeder (pertama kali):**
   ```bash
   docker compose exec backend python seed_data.py
   ```

Akses layanan:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api`
- MinIO S3: `http://localhost:9000`

---

### Cara 2: Menjalankan Secara Manual (Lokal)

#### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Di Windows: venv\Scripts\activate
pip install -r requirements.txt

# Pastikan MongoDB dan MinIO aktif, lalu seed database:
python seed_data.py

# Jalankan server:
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 🚢 Panduan Deployment Produksi

Saat mendeploy ke server publik / VPS (misal `csrg.pens.ac.id`):

1. **Sesuaikan domain di `backend/.env`:**
   ```env
   CORS_ORIGINS=https://csrg.pens.ac.id,https://www.csrg.pens.ac.id
   MINIO_PUBLIC_ENDPOINT=csrg.pens.ac.id
   COOKIE_SECURE=true
   ENABLE_API_DOCS=false
   ```

2. **Jalankan Docker Compose Production:**
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env up -d --build
   ```

Pada konfigurasi produksi:
- MinIO berjalan tanpa port host yang terbuka (semua akses media melalui reverse proxy `/csrg-media/`).
- Dokumentasi API Swagger/ReDoc dinonaktifkan (`ENABLE_API_DOCS=false`).
- Bundle frontend otomatis membersihkan semua debug log (`console.log`, `console.error`).
- Cookie autentikasi hanya dikirim melalui koneksi HTTPS (`COOKIE_SECURE=true`).

---

## 🔑 Kredensial Default (Development)

Setelah menjalankan `python seed_data.py`:
- **URL Admin Login:** `http://localhost:3000/admin-login`
- **Email:** `jarkom@pens.ac.id`
- **Password:** `jarkom@123` *(Segera ubah password setelah deployment produksi)*

---

## 👥 Kontributor & Tim Pengembang

Proyek ini dibangun dan dikembangkan bersama oleh tim riset **Cyber Security Research Group (CSRG) PENS**:

- **Caesarico Bayu Sejati** — *Original Creator & Initial Developer*  
  Merancang dan membangun fondasi awal aplikasi website serta fitur-fitur dasar CSRG Web.

- **Mohammad Alfin D.P.** ([mohammad.allfinnn@gmail.com](mailto:mohammad.allfinnn@gmail.com)) — *Maintainer, Modernization*  

  Pengembangan lanjutan, migrasi frontend ke Vite, integrasi MinIO Object Storage, modularisasi arsitektur FastAPI, perbaikan sistem admin, serta audit dan penguatan keamanan (DevSecOps).

---

## 📄 Lisensi & Kontak

Hak Cipta © 2026 **Cyber Security Research Group (CSRG) - Politeknik Elektronika Negeri Surabaya (PENS)**.  
Untuk pertanyaan teknis, kerja sama riset, atau laporan kerentanan keamanan, silakan hubungi: `jarkom@pens.ac.id`.
