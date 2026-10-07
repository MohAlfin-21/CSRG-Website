# 🤖 CSRG Web — AI Collaboration & Context Guide

> **Catatan untuk AI Assistant / IDE Agent:**
> File ini adalah sumber kebenaran konteks tunggal (*single source of truth*) yang komprehensif mengenai **CSRG Web Application**. Baca file ini sebelum melakukan perubahan, penambahan fitur, perbaikan bug, atau refactoring.
> **PENTING:** Jangan pernah melakukan `git push` tanpa izin eksplisit dari pengguna.

---

## 1. Ikhtisar Proyek (Project Overview)

- **Nama Proyek:** CSRG Web (Cyber Security Research Group - Politeknik Elektronika Negeri Surabaya / PENS)
- **Tujuan:** Portal resmi publik dan panel manajemen riset/lab untuk menampilkan profil lab, anggota riset, publikasi berita, portofolio produk/inovasi open source (seperti *Mata Elang* NIDS), serta formulir kontak riset.
- **Tipe Arsitektur:** Microservices berbasis kontainer (Docker Compose) yang memisahkan Frontend SPA, Reverse Proxy Nginx, Backend REST API (FastAPI), Object Storage (MinIO), dan Database (MongoDB).

---

## 2. Arsitektur & Topologi Sistem

```
                         [ Klien / Browser ]
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │   Port 3000 (Host)      │
                     │   Nginx Alpine (Proxy)  │
                     └────────────┬────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │ (SPA Static Files)     │ (/api/*)               │ (/csrg-media/*)
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐     ┌──────────────────┐
│  React 19 + Vite │    │  FastAPI (8000)  │     │   MinIO (9000)   │
│  Tailwind CSS    │    │  Python 3.11     │     │   S3 Storage     │
└──────────────────┘    └─────────┬────────┘     └──────────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │  MongoDB 4.4/6.0 │
                        │  (Port 27017)    │
                        └──────────────────┘
```

### Port Mapping & Jaringan Docker

| Layanan | Container Port | Host Port | Aksesibilitas | Peran |
|---------|---------------|-----------|---------------|-------|
| `frontend` | 8080 | `3000` | Publik / Host | Melayani static bundle SPA, menangani SPA routing, proxy `/api/` dan `/csrg-media/` |
| `backend` | 8000 | `8000` | Host / Internal | REST API FastAPI, autentikasi JWT, CRUD, rate limiter |
| `minio` | 9000, 9001 | `9000` (API) | Host / Internal | Object storage S3-compatible (port 9001 console internal) |
| `mongo` | 27017 | Tidak diekspos di prod | Docker internal | Database NoSQL MongoDB |

---

## 3. Struktur Direktori Proyek

```text
csrg_web/
├── docker-compose.yml           # Compose utama (standar produksi lokal)
├── docker-compose.dev.yml       # Override dev (hot-reload & expose port debug)
├── docker-compose.prod.yml      # Konfigurasi penguncian produksi
├── .env.example                 # Template root env (Mongo & MinIO credentials)
├── AI_CONTEXT.md                # [File Ini] Master context panduan AI IDE
├── DOCUMENTATION.md             # Dokumentasi teknis sistem
├── README.md                    # Panduan ringkas setup
│
├── backend/
│   ├── Dockerfile               # Multi-stage build Python 3.11-slim (non-root appuser)
│   ├── requirements.txt         # FastAPI, Motor, Pydantic, Passlib, PyJWT, Pillow, Boto3
│   ├── server.py                # Inisialisasi FastAPI, CORS, middleware, router mount
│   ├── seed_data.py             # Script seeder admin user, anggota, berita, & produk bawaan
│   ├── scholar_scraper.py       # Scraper async Google Scholar publikasi profil
│   ├── cv_viewer_template.html  # Template preview dokumen CV
│   │
│   ├── core/
│   │   ├── config.py            # Konfigurasi ENV, JWT secret, CORS, path static
│   │   ├── database.py          # Koneksi Motor AsyncIOMotorClient ke MongoDB
│   │   ├── rate_limiter.py      # Sliding window in-memory rate limiter per IP
│   │   ├── security.py          # Bcrypt hashing, validasi JWT token, blacklist token
│   │   ├── security_headers.py  # Middleware OWASP security headers di level FastAPI
│   │   └── storage.py           # Abstraksi klien MinIO S3 (upload, delete, URL generator)
│   │
│   ├── models/
│   │   ├── __init__.py          # Export semua Pydantic models
│   │   ├── user.py              # User, UserCreate, UserLogin, Token
│   │   ├── member.py            # Member, MemberCreate (Peneliti & Pengurus Lab)
│   │   ├── news.py              # NewsArticle, NewsCreate (Agenda & Publikasi)
│   │   ├── product.py           # Product, ProductCreate (Inovasi & Software CSRG)
│   │   └── contact.py           # ContactForm, ContactSubmission (Pesan publik)
│   │
│   └── routers/
│       ├── __init__.py          # Export router FastAPI
│       ├── auth.py              # /api/auth (login, logout, me)
│       ├── members.py           # /api/members (CRUD anggota)
│       ├── news.py              # /api/news (CRUD artikel berita)
│       ├── products.py          # /api/products (CRUD produk & inovasi lab)
│       ├── contact.py           # /api/contact (submit form & inbox admin)
│       ├── files.py             # /api/upload (upload image & CV, sanitasi Pillow)
│       └── scholar.py           # /api/scholar (sinkronisasi profil Google Scholar)
│
└── frontend/
    ├── Dockerfile               # Multi-stage build Node 20 → Nginx Alpine non-root
    ├── nginx.conf               # Konfigurasi reverse proxy, CSP, gzip, SPA routing no-cache
    ├── package.json             # React 19, Vite 6, Tailwind CSS, Lucide Icons, Radix UI
    ├── vite.config.js           # Konfigurasi Vite & path alias `@/` -> `src/`
    │
    ├── public/                  # Asset publik statis (favicon, MataElang logo & previews)
    │   ├── MataElang.png
    │   ├── mataelang_preview.png
    │   └── mataelang_dark_preview.png
    │
    └── src/
        ├── config.js            # BACKEND_URL & API_URL fallback
        ├── App.jsx              # Routing React Router DOM
        ├── main.jsx / index.jsx # Entry point React
        ├── components/
        │   ├── Navbar.jsx       # Header navigasi responsif & mode gelap
        │   ├── Footer.jsx       # Footer informasi lab & tautan
        │   └── ui/              # Komponen Radix/Shadcn (Button, Dialog, Tabs, Input, dll)
        └── pages/
            ├── Home.jsx         # Beranda portal CSRG
            ├── Profile.jsx      # Sejarah, visi-misi, & bidang riset lab
            ├── Team.jsx         # Daftar peneliti, dosen, & asisten riset
            ├── MemberDetail.jsx # Profil lengkap anggota + publikasi Scholar + CV
            ├── News.jsx         # Publikasi & kegiatan lab
            ├── NewsDetail.jsx   # Detail artikel berita
            ├── Products.jsx     # Showcase dinamis produk lab + Live Preview Web modal
            ├── Contact.jsx      # Formulir hubungi lab & Google Maps PENS
            ├── AdminLogin.jsx   # Halaman autentikasi pengelola lab
            ├── AdminDashboard.jsx # Panel admin (Tab Anggota, Berita, Produk, Pesan)
            └── MataElang.jsx    # Halaman dedicated informasi produk Mata Elang
```

---

## 4. Skema Database & Model Data (MongoDB + Pydantic)

### 4.1. Produk Lab (`models/product.py`)
Mendukung produk dinamis dengan integrasi browser preview mockup ala Mata Elang:
- `id`: UUID (String)
- `name`: String (max 120 char) — Nama produk (contoh: "Mata Elang")
- `tagline`: String (max 200 char) — Subtitle singkat (contoh: "Network Intrusion Detection System")
- `description`: String (max 2000 char) — Deskripsi lengkap
- `tags`: List[String] (max 20 item, max 60 char/item) — Tags badge (#NIDS, #Suricata)
- `features`: List[String] (max 30 item, max 200 char/item) — Poin fitur produk
- `icon_name`: String (whitelist: `Shield`, `Globe`, `Zap`, `Monitor`, dll)
- `image_url` / `image_filename`: String URL & path MinIO untuk logo produk
- `preview_light_url` / `preview_light_filename`: Screenshot tampilan antarmuka (mode terang)
- `preview_dark_url` / `preview_dark_filename`: Screenshot tampilan antarmuka (mode gelap)
- `website`: String URL — Link website resmi produk
- `github`: String URL — Link repository source code
- `live_preview_url`: String URL — Tautan website interaktif yang di-embed ke dalam iframe modal
- `status`: Enum (`Active Stable`, `Beta`, `In Development`, `Deprecated`)
- `category`: String (contoh: "Security Monitoring", "Cryptography", dsb.)
- `color`: String Tailwind gradient (contoh: `from-blue-500 to-cyan-500`)
- `created_at`: Datetime UTC ISO format

### 4.2. Anggota Riset (`models/member.py`)
- `id`: UUID
- `name`: Nama lengkap beserta gelar
- `position`: Jabatan (Dosen Ketua, Peneliti, Anggota Magang)
- `research_area`: Bidang minat riset (Network Security, AI Forensics, dll)
- `photo_url`: URL foto profil (tersanitasi format WebP di MinIO)
- `linkedin_url`, `scholar_url`, `cv_url`: Tautan profil eksternal & dokumen CV terunggah

### 4.3. Berita & Agenda (`models/news.py`)
- `id`: UUID
- `title`, `excerpt`, `content`: Konten artikel berita
- `thumbnail_url`: URL gambar banner artikel
- `published_date`, `created_at`: Datetime UTC

### 4.4. Pesan Masuk / Kontak (`models/contact.py`)
- `id`: UUID
- `name`, `email`, `message`: Inquiry dari pengunjung publik
- `created_at`: Datetime UTC

### 4.5. Admin User (`models/user.py`)
- `id`: UUID
- `username`: "admin"
- `email`: `jarkom@pens.ac.id` (default development)
- `hashed_password`: Bcrypt hash (default password seeder dev: `jarkom@123`)

---

## 5. Spesifikasi REST API (`/api`)

### Autentikasi (`/api/auth`)
- `POST /api/auth/login` (Publik, Rate Limited 5 req/min):
  - Menerima JSON `{ "email": "...", "password": "..." }`
  - Mengembalikan cookie HttpOnly `admin_token` (JWT) + JSON body `access_token`
- `GET /api/auth/me` (Protected):
  - Validasi token aktif dari cookie/header Bearer, mengembalikan data admin
- `POST /api/auth/logout` (Protected):
  - Menghapus cookie `admin_token` dan memasukkan JTI token ke blacklist in-memory

### Manajemen Produk (`/api/products`)
- `GET /api/products` (Publik): Mengambil semua daftar produk diurutkan berdasarkan `created_at`
- `GET /api/products/{id}` (Publik): Detail satu produk
- `POST /api/products` (Admin Only): Membuat produk baru
- `PUT /api/products/{id}` (Admin Only): Update data produk + otomatis menghapus file gambar lama di MinIO jika diganti
- `DELETE /api/products/{id}` (Admin Only): Menghapus produk dan seluruh file gambar terkait dari storage MinIO

### Manajemen Anggota & Berita
- `GET|POST|PUT|DELETE /api/members`
- `GET|POST|PUT|DELETE /api/news`

### Upload Berkas & Media (`/api/upload`)
- `POST /api/upload/image` (Admin Only):
  - Validasi MIME & sanitasi kompresi ulang via Pillow menjadi **WebP** kualitas 85% untuk keamanan (mencegah serangan polyglot / malware tersembunyi di EXIF). Disimpan di bucket MinIO `csrg-media/photos`.
- `POST /api/upload/cv` (Admin Only):
  - Validasi berkas dokumen/PDF dengan verifikasi magic bytes `%PDF-`. Disimpan di `csrg-media/cv`.

---

## 6. Frontend: Fitur Khusus & UI Pattern

### Dynamic Products Page (`frontend/src/pages/Products.jsx`)
1. Data tidak lagi di-hardcode; memanggil `GET /api/products` secara asinkron.
2. Setiap kartu produk memiliki tampilan split 2-kolom:
   - **Kiri:** Info produk, status ping badge, logo/icon, tags, feature checklist, dan tombol aksi (*Kunjungi Website*, *Live Preview Web*, *GitHub*).
   - **Kanan:** **Browser Mockup Card** interaktif dengan header bar (tombol traffic light macOS, address bar dengan ikon gembok SSL, dan gambar screenshot preview yang responsif terhadap dark/light theme).
3. **Live Preview Web Dialog:**
   - Membuka modal berukuran 95vw/90vh bergaya browser asli.
   - Jika `live_preview_url` ada, merender `<iframe>` interaktif dengan parameter tema docusaurus dinamis (`?docusaurus-theme=dark|light`) dan fitur switch theme, reload iframe, serta link tab baru.
   - Jika hanya ada screenshot, menampilkan gambar preview resolusi penuh.

### Admin Dashboard (`frontend/src/pages/AdminDashboard.jsx`)
1. **Stat Cards:** 4 kartu ringkasan (Anggota Riset, Artikel Berita, **Produk**, Pesan Masuk).
2. **Tabs Navigasi:** `Anggota`, `Berita`, **`Produk`**, `Pesan`.
3. **Tab Produk:**
   - Daftar grid produk yang terdaftar beserta status badge, kategori, dan tombol Edit/Hapus.
   - Tombol **`+ Tambah Produk`** yang memicu modal formulir 2-kolom:
     - **Kolom Kiri:** Input nama, tagline, deskripsi, tags (koma), fitur (per baris), upload logo, upload screenshot light/dark, website, github, dan URL live preview iframe.
     - **Kolom Kanan:** **Real-time Live Preview Mockup** yang langsung ter-render saat admin mengetik (nama, tagline, preview screenshot, dan list fitur ter-update seketika).

---

## 7. Aturan DevSecOps & Keamanan (Crucial Rules)

1. **Content-Security-Policy (CSP) di Nginx (`frontend/nginx.conf`):**
   - `frame-src 'self' https:;` -> Wajib mengizinkan `https:` agar iframe live preview untuk produk dengan domain eksternal manapun dapat dimuat di browser tanpa terblokir.
   - `connect-src 'self' https: http://localhost:8000 http://localhost:9000;` -> Mengizinkan koneksi API dan S3 MinIO saat pengembangan lokal.
   - `img-src 'self' data: blob: https: http://localhost:8000 http://localhost:9000;`
2. **Cache-Control pada Routing SPA:**
   - File `index.html` **DILARANG DI-CACHE** oleh browser agar pembaruan kode bundle Vite langsung terdeteksi pengguna tanpa perlu clear cache:
     ```nginx
     location / {
       try_files $uri /index.html;
       add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
     }
     ```
   - Direktori `/assets/` (yang memiliki content hash pada nama file) di-cache jangka panjang: `max-age=31536000, immutable`.
3. **Validasi Model Input Pydantic (`models/product.py`):**
   - Semua input teks dibatasi dengan `Field(..., max_length=...)` untuk mencegah Denial of Service (DoS) melalui payload raksasa.
   - `icon_name` divalidasi dengan whitelist ketat untuk mencegah injeksi XSS.
   - `status` divalidasi terhadap set status yang sah (`Active Stable`, `Beta`, `In Development`, `Deprecated`).
4. **JWT & Session Security:**
   - Token disimpan dalam cookie `admin_token` dengan flag `HttpOnly: true` dan `SameSite: lax`.
   - Di lingkungan HTTPS produksi, aktifkan `COOKIE_SECURE=true`.

---

## 8. Panduan Operasional & Perintah Penting

### Menjalankan dengan Docker Compose
> **PENTING:** Saat memperbarui kode sumber, Docker Compose tidak otomatis mengompilasi ulang image jika image lama sudah ada di cache. Gunakan flag `--build`:

```bash
# Build ulang dan jalankan seluruh service
docker compose up -d --build

# Melihat status kontainer
docker compose ps

# Memeriksa log backend
docker compose logs backend -f

# Memeriksa log proxy frontend
docker compose logs frontend -f
```

### Seeding Data Awal (User Admin, Anggota, Berita, & Produk Mata Elang)
```bash
# Eksekusi seeder di dalam container backend
docker exec csrg_web-backend-1 python3 seed_data.py
```

### Akun Kredensial Default (Development)
- **URL Admin Login:** `http://localhost:3000/admin/login`
- **Email:** `jarkom@pens.ac.id`
- **Password:** `jarkom@123`

---

## 9. Petunjuk Khusus untuk AI Collaboration

1. **JANGAN COMMIT / PUSH KE GIT:** Sesuai instruksi pengembang saat ini, jangan mengeksekusi perintah `git push` ke remote repository tanpa izin.
2. **Path Alias Frontend:** Import komponen di frontend menggunakan alias `@/` yang mengarah ke `frontend/src/` (didefinisikan di `vite.config.js`).
3. **Penyimpanan Gambar:** Gambar produk atau anggota diunggah melalui endpoint `/api/upload/image` yang mengembalikan URL MinIO dan nama file object key. Selalu simpan kedua nilai ini (`image_url` dan `image_filename`) untuk kemudahan cleanup saat data dihapus.
4. **Pembersihan Berkas Otomatis:** Saat menghapus entitas dari database, selalu panggil `storage_delete_file(url)` dari `core.storage` agar MinIO tidak menumpuk *orphaned files*.
