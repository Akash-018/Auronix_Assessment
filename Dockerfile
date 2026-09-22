# Build Stage for Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend-app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Final Stage for Python FastAPI Backend + Frontend Static Files
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies if any
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy built frontend assets to static directory served by FastAPI
COPY --from=frontend-builder /frontend-app/dist ./static

EXPOSE 8000

ENV PORT=8000
ENV ENVIRONMENT=production

# Wait for the database before migrating: a free-tier Postgres that has scaled to
# zero refuses the first connection, which would fail the migration and crash-loop
# the release.
# Seeding is no longer a separate step: app.main runs it on startup, so the
# database is populated by the same code path locally and in production.
CMD ["sh", "-c", "python -m app.db_wait && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
