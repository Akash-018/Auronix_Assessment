from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
import json

class Settings(BaseSettings):
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
    
    INITIAL_ADMIN_EMAIL: str = "akash@auxonix.com"
    INITIAL_ADMIN_PASSWORD: str = "admin@2602!"

    INITIAL_USER_EMAIL: str = "bhargavi.d@auronix.com"
    INITIAL_USER_PASSWORD: str = "CEO@2003!"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
