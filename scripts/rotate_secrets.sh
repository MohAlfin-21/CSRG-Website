#!/usr/bin/env bash
# ==============================================================================
# CSRG — Production Secrets Generator & Rotation Helper
# ==============================================================================
set -euo pipefail

echo "================================================================="
echo "   CSRG Web — Production Secrets Generator"
echo "================================================================="
echo "Gunakan nilai acak di bawah ini untuk mengisi file .env di server produksi."
echo "JANGAN PERNAH menyimpan kredensial produksi di repositori Git!"
echo "================================================================="
echo ""

# Generate strong secrets
MONGO_PASS=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
MINIO_USER=$(python3 -c "import secrets; print('csrg_' + secrets.token_hex(4))")
MINIO_PASS=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")

echo "1. MongoDB Credentials:"
echo "   MONGO_ROOT_USERNAME: csrg_admin"
echo "   MONGO_ROOT_PASSWORD: ${MONGO_PASS}"
echo ""
echo "2. MinIO Credentials:"
echo "   MINIO_ROOT_USER:     ${MINIO_USER}"
echo "   MINIO_ROOT_PASSWORD: ${MINIO_PASS}"
echo ""
echo "3. Backend JWT Secret:"
echo "   JWT_SECRET_KEY:      ${JWT_SECRET}"
echo ""
echo "4. MongoDB Connection URL for backend/.env:"
echo "   MONGO_URL=mongodb://csrg_admin:${MONGO_PASS}@mongo:27017/csrg_database?authSource=admin"
echo ""
echo "================================================================="
echo "Instruksi Pengamanan Server:"
echo "1. Terapkan nilai di atas pada .env dan backend/.env di server produksi."
echo "2. Jalankan: chmod 600 .env backend/.env frontend/.env"
echo "3. Deploy:   docker compose -f docker-compose.prod.yml --env-file .env up -d --build"
echo "================================================================="
