# 📚 CSRG Web — Technical Documentation

Dokumentasi arsitektur teknis, model data, spesifikasi API, dan panduan pemeliharaan sistem untuk **Cyber Security Research Group (CSRG) Web Application**.

---

## 1. Ringkasan Arsitektur Sistem

Aplikasi ini menggunakan pendekatan microservices terisolasi dengan kontainerisasi Docker:

| Komponen | Teknologi | Peran & Tanggung Jawab |
|----------|-----------|------------------------|
| **Frontend** | React 19, Vite, Tailwind CSS, Radix UI | Antarmuka pengguna SPA modern untuk portal publik dan dashboard admin. |
| **Reverse Proxy** | Nginx Alpine | Gateway pintu masuk: melayani asset statis, menangani routing `/api/` dan `/csrg-media/`, serta menyuntikkan security headers OWASP. |
| **Backend API** | FastAPI (Python 3.11) | Menyediakan API RESTful asinkron, validasi skema Pydantic, autentikasi JWT, rate limiting, dan proteksi SSRF. |
| **Object Storage** | MinIO (S3-compatible) | Menyimpan file foto anggota (WebP) dan dokumen CV (PDF) dengan sistem bucket terisolasi di jaringan internal. |
| **Database** | MongoDB 4.4 / 6.0 | Menyimpan data terstruktur (User, Member, News, Contact messages) dengan otentikasi database aktif. |

---

## 2. Struktur Modul Backend

Backend diorganisasikan secara modular untuk memisahkan tanggung jawab (Separation of Concerns):

```text
backend/
├── core/
│   ├── config.py             # Konfigurasi env, path direktori, konstanta sistem
│   ├── database.py           # Inisialisasi client Motor (AsyncIOMotorClient)
│   ├── rate_limiter.py       # Sliding window in-memory rate limiter per IP
│   ├── security.py           # Bcrypt hashing, pembuatan/validasi JWT, token blacklist
│   ├── security_headers.py   # Starlette middleware untuk OWASP headers
│   └── storage.py            # Boto3 client abstraction untuk upload/delete di MinIO
├── models/
│   ├── contact.py            # Model ContactForm & ContactSubmission
│   ├── member.py             # Model Member & MemberCreate
│   ├── news.py               # Model NewsArticle & NewsCreate
│   └── user.py               # Model User, UserCreate, UserLogin, Token
├── routers/
│   ├── auth.py               # /api/auth (login, logout, me)
│   ├── contact.py            # /api/contact (submit, list, delete)
│   ├── files.py              # /api/upload (cv, image, delete file)
│   ├── members.py            # /api/members (CRUD)
│   ├── news.py               # /api/news (CRUD)
│   └── scholar.py            # /api/scholar (sinkronisasi publikasi)
├── scholar_scraper.py        # Async scraper Google Scholar dengan proteksi SSRF
├── seed_data.py              # Seeder data awal
└── server.py                 # Lifespan context & inisialisasi FastAPI
```

---

## 3. Model Data & Skema (Pydantic)

### 3.1 User & Auth (`models/user.py`)
- `id`: UUID (String)
- `username`: String (min 3, max 50)
- `email`: EmailStr
- `hashed_password`: String (Bcrypt hash)
- `created_at`: Datetime UTC

### 3.2 Member (`models/member.py`)
- `id`: UUID (String)
- `name`: String (min 2, max 100)
- `position`: String (Jabatan: Dosen, Peneliti, Magang)
- `research_area`: Optional[String] (Fokus riset)
- `photo_url`: Optional[String] (URL MinIO publik)
- `linkedin_url`: Optional[String]
- `scholar_url`: Optional[String]
- `cv_url`: Optional[String]
- `created_at`: Datetime UTC

### 3.3 News (`models/news.py`)
- `id`: UUID (String)
- `title`: String (min 3, max 200)
- `content`: String
- `excerpt`: Optional[String]
- `thumbnail_url`: Optional[String]
- `thumbnail_filename`: Optional[String]
- `published_date`: Datetime UTC
- `created_at`: Datetime UTC

### 3.4 Contact (`models/contact.py`)
- `id`: UUID (String)
- `name`: String (min 2, max 100)
- `email`: EmailStr
- `message`: String (min 5, max 5000)
- `created_at`: Datetime UTC

---

## 4. Alur Autentikasi & Keamanan Sesi

1. **Login (`POST /api/auth/login`):**
   - Klien mengirim email dan password.
   - Diproteksi rate limiter (maksimal 5 kali percobaan per menit per IP).
   - Password diverifikasi menggunakan `passlib` (Bcrypt).
   - Jika valid, server membuat JWT dengan UUID unik (`jti`).
   - Server menyetel cookie `admin_token` dengan atribut:
     - `HttpOnly: true` (tidak bisa diakses JavaScript, mitigasi XSS token theft).
     - `SameSite: Lax` (mitigasi serangan CSRF).
     - `Secure: true` (hanya dikirim via HTTPS di production).
   - Token juga dikembalikan di respons JSON untuk klien non-browser.

2. **Verifikasi Token (`get_current_user`):**
   - Mendukung dua metode: Header `Authorization: Bearer <token>` atau Cookie `admin_token`.
   - Memverifikasi apakah `jti` token terdaftar dalam `token_blacklist` (token yang sudah di-logout).

3. **Logout (`POST /api/auth/logout`):**
   - Menambahkan `jti` ke dalam blacklist in-memory hingga masa berlaku token habis.
   - Menghapus cookie `admin_token` dari browser.

---

## 5. MinIO Object Storage & Sanitasi Media

Semua operasi file diproses melalui modul terpusat [`core/storage.py`](backend/core/storage.py):
- **Isolasi Bucket:** Bucket `csrg-media` diinisialisasi secara otomatis saat aplikasi dinyalakan (`lifespan`).
- **Sanitasi Gambar:**
  - File diperiksa MIME-type-nya (`image/jpeg`, `image/png`, `image/webp`).
  - Gambar diproses ulang menggunakan library Pillow: divalidasi integritas pixel-nya, diubah warnanya ke RGB, dan di-re-encode ulang menjadi format **WebP** berkualitas tinggi.
  - Ini memastikan payload berbahaya yang diselipkan pada file gambar (polyglot scripts, EXIF exploitation) hangus/dibersihkan sebelum disimpan.
- **Upload CV:**
  - Memvalidasi magic bytes PDF (`%PDF-`) dan batas ukuran maksimal 10 MB.
- **Reverse Proxy:**
  - Di lingkungan produksi, browser mengakses gambar melalui endpoint `https://<domain>/csrg-media/photos/<uuid>.webp` yang diteruskan oleh Nginx ke service MinIO internal.

---

## 6. Ringkasan Endpoint API

| Method | Endpoint | Auth | Rate Limit | Deskripsi |
|---|---|:---:|:---:|---|
| `GET` | `/api/health` | Publik | - | Health check backend |
| `POST` | `/api/auth/login` | Publik | 5 req/min | Login admin & set cookie |
| `GET` | `/api/auth/me` | Admin | - | Cek status sesi admin aktif |
| `POST` | `/api/auth/logout` | Admin | - | Logout & blacklist JWT |
| `GET` | `/api/members` | Publik | - | Mengambil semua daftar anggota |
| `GET` | `/api/members/{id}` | Publik | - | Detail profil anggota tertentu |
| `POST` | `/api/members` | Admin | - | Menambah anggota baru |
| `PUT` | `/api/members/{id}` | Admin | - | Mengupdate data anggota |
| `DELETE` | `/api/members/{id}` | Admin | - | Menghapus anggota & filenya |
| `GET` | `/api/news` | Publik | - | Mengambil daftar artikel berita |
| `GET` | `/api/news/{id}` | Publik | - | Detail artikel berita |
| `POST` | `/api/news` | Admin | - | Membuat artikel berita baru |
| `PUT` | `/api/news/{id}` | Admin | - | Mengedit artikel berita |
| `DELETE` | `/api/news/{id}` | Admin | - | Menghapus artikel berita |
| `POST` | `/api/contact` | Publik | 5 req/min | Mengirim pesan kontak |
| `GET` | `/api/contact` | Admin | - | Melihat seluruh inbox pesan |
| `DELETE` | `/api/contact/{id}` | Admin | - | Menghapus pesan kontak |
| `POST` | `/api/upload/image` | Admin | - | Upload foto anggota (sanitasi WebP) |
| `POST` | `/api/upload/cv` | Admin | - | Upload dokumen CV (PDF/DOCX) |
| `DELETE` | `/api/upload/file/{path}` | Admin | - | Menghapus file dari MinIO |
| `GET` | `/api/scholar/publications` | Publik | 10 req/min | Scrape publikasi Google Scholar aman |

---

## 7. Pemeliharaan & Operasional (Maintenance)

### 7.1 Backup Database MongoDB
```bash
# Melakukan backup database ke direktori lokal
docker compose exec mongo mongodump \
  -u csrg_admin \
  -p "<MONGO_ROOT_PASSWORD>" \
  --authenticationDatabase admin \
  --db csrg_database \
  --out /data/db/backup_$(date +%F)
```

### 7.2 Restore Database MongoDB
```bash
docker compose exec mongo mongorestore \
  -u csrg_admin \
  -p "<MONGO_ROOT_PASSWORD>" \
  --authenticationDatabase admin \
  --db csrg_database \
  /data/db/backup_<date>/csrg_database
```

### 7.3 Pemantauan Log Container
```bash
# Memantau log seluruh service secara realtime
docker compose logs -f

# Memantau hanya backend atau nginx
docker compose logs -f backend
docker compose logs -f frontend
```
