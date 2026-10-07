# Backend Dockerfile (FastAPI + Python)
# Multi-stage: install deps as root, then run as non-root appuser
FROM python:3.11-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Production stage ──────────────────────────────────────────────────────────
FROM python:3.11-slim

# Create a non-root user for runtime security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup --no-create-home appuser

WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source (respects .dockerignore)
COPY . .

# Ensure static upload directories exist and transfer ownership to non-root user
RUN mkdir -p /app/static/uploads/photos /app/static/uploads/cv \
    && chown -R appuser:appgroup /app \
    && chmod -R 755 /app/static/uploads

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request, sys; sys.exit(0 if getattr(urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3), 'status', 0) == 200 else 1)"

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--no-server-header"]
