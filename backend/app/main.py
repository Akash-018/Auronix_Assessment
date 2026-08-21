import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.core.config import settings
from app.routes import auth, challenges, projects, submissions
from app.core.database import SessionLocal
from app.core.bootstrap import init_bootstrap_users


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
    db = SessionLocal()
    try:
        init_bootstrap_users(db)
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
    return {"status": "ok", "environment": settings.ENVIRONMENT}
