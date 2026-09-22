from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

IS_SQLITE = settings.DATABASE_URL.startswith("sqlite")

if IS_SQLITE:
    # Local development / tests: a single file, shared across FastAPI's threadpool.
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
        echo=False,
    )
else:
    # Managed Postgres (Neon, Supabase, Aiven, ...). These free tiers scale to zero
    # and drop idle connections server-side, so a pooled connection is often already
    # dead by the time it is handed out:
    #   * pool_pre_ping  discards dead connections instead of raising on first query
    #   * pool_recycle   retires connections before the provider's idle timeout
    #   * small pool     free tiers cap concurrent connections aggressively
    #   * keepalives     stops NAT/idle timeouts silently killing long-lived sockets
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=280,
        pool_size=5,
        max_overflow=5,
        pool_timeout=30,
        connect_args={
            # Generous enough to cover a cold start on a scale-to-zero instance.
            "connect_timeout": 15,
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
            "application_name": "pixeltest",
        },
        echo=False,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
