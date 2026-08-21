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

CMD ["sh", "-c", "alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
