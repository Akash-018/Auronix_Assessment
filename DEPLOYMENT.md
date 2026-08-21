# Deployment Guide

PixelTest is packaged for single web service deployment (FastAPI backend serving the React Vite build) alongside PostgreSQL.

## Render Blueprint Deployment
1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Blueprint** service pointing to `render.yaml`.
3. Render automatically provisions:
   - 1 PostgreSQL database instance.
   - 1 Docker Web Service built using root `Dockerfile`.
4. Deploy and log in with your configured admin credentials.

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: Secret key for JWT signing.
- `STORAGE_PROVIDER`: `local` or `s3`.
- `INITIAL_ADMIN_EMAIL`: Initial admin email.
- `INITIAL_ADMIN_PASSWORD`: Initial admin password.
