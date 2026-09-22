from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union
import json

class Settings(BaseSettings):
    # Default targets local SQLite so `git clone && uvicorn` just works.
    # Any deployment must override this with a managed Postgres URL — a Render
    # free web service has an ephemeral filesystem, so a SQLite file there is
    # wiped on every deploy, restart and wake-from-idle.
    DATABASE_URL: str = "sqlite:///./pixeltest.db"
    JWT_SECRET: str = "super-secret-pixeltest-key-change-in-production-32bytes"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    STORAGE_PROVIDER: str = "local"
    STORAGE_BUCKET: str = "pixeltest-uploads"
    STORAGE_ACCESS_KEY: str = ""
    STORAGE_SECRET_KEY: str = ""
    STORAGE_ENDPOINT: str = ""
    
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:8005", "http://127.0.0.1:5173", "http://127.0.0.1:8005"]
    
    INITIAL_ADMIN_EMAIL: str = "akash@auronix.com"
    INITIAL_ADMIN_PASSWORD: str = "admin@2602!"

    INITIAL_USER_EMAIL: str = "bhargavi.d@auronix.com"
    INITIAL_USER_PASSWORD: str = "CEO@2003!"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        """
        Accept the connection strings managed Postgres providers actually hand out.

        Neon, Supabase, Heroku and others still emit `postgres://`, a scheme
        SQLAlchemy 2.x refuses outright. Rewriting it here means a URL can be
        pasted into the dashboard verbatim without tripping a startup crash.
        """
        value = value.strip()
        if value.startswith("postgres://"):
            value = "postgresql://" + value[len("postgres://"):]
        return value

settings = Settings()
