import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.core.config import settings
from app.routes import auth, challenges, projects, submissions
from app.core.database import SessionLocal
from app.db_wait import wait_for_database
from app.core.bootstrap import (
    init_bootstrap_users,
    init_bootstrap_challenges,
    init_bootstrap_sql_challenges,
)


app = FastAPI(
    title="PixelTest API",
    description="Backend API for PixelTest - Live Screenshot-Based Frontend Assessment Platform",
    version="1.0.0"
)

# CORS configuration
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"--> {request.method} {request.url.path}")
    response = await call_next(request)
    print(f"<-- {request.method} {request.url.path} Status: {response.status_code}")
    return response

# Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log exception in server logs
    print(f"Global exception caught: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )



@app.on_event("startup")
def on_startup():
    # A sleeping free-tier database refuses the first connection. Wake it before
    # seeding, and never let a seeding failure take the whole service down: the
    # health check must stay green so the platform does not crash-loop the deploy.
    if not wait_for_database():
        print("Startup bootstrap skipped: database unreachable. Service starting anyway.")
        return

    db = SessionLocal()
    try:
        init_bootstrap_users(db)
        init_bootstrap_challenges(db)
        init_bootstrap_sql_challenges(db)
    except Exception as exc:
        print(f"Startup bootstrap failed (service still starting): {exc}")
    finally:
        db.close()

# Include API Routers
app.include_router(auth.router)
app.include_router(challenges.router)
app.include_router(projects.router)
app.include_router(submissions.router)

# Mount local uploads directory if it exists
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Serve Frontend static assets if dist exists (Production Docker bundle)
if os.path.exists("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="static_assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("uploads/"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        file_path = os.path.join("static", full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse("static/index.html")

@app.get("/api/health")
def health_check():
    # Always 200: this is the platform's health probe, and reporting the database
    # as unhealthy would trigger a restart loop while a scale-to-zero instance is
    # merely waking up. The database state is reported in the body instead.
    from sqlalchemy import text
    from app.core.database import engine, IS_SQLITE

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        database = "connected"
    except Exception as exc:
        database = f"unavailable: {type(exc).__name__}"

    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "database": database,
        "database_engine": "sqlite" if IS_SQLITE else "postgresql",
    }
