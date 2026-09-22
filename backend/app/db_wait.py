"""
Block until the database accepts connections, then exit.

Free-tier managed Postgres (Neon, Supabase, ...) scales to zero when idle. A
container that boots against a sleeping instance gets a connection error on its
very first query, which would fail `alembic upgrade head` and crash-loop the
deploy. Waking the database takes a second or two, so this retries with backoff
before the migration step rather than letting the release die.

Usage:  python -m app.db_wait
"""
import logging
import sys
import time

from sqlalchemy import text

from app.core.database import engine

logger = logging.getLogger("pixeltest.db_wait")
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

MAX_ATTEMPTS = 12
BASE_DELAY_SECONDS = 2
MAX_DELAY_SECONDS = 15


def wait_for_database(max_attempts: int = MAX_ATTEMPTS) -> bool:
    """Returns True once a trivial query succeeds, False if every attempt failed."""
    for attempt in range(1, max_attempts + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Database is reachable (attempt %d/%d).", attempt, max_attempts)
            return True
        except Exception as exc:
            if attempt == max_attempts:
                logger.error("Database unreachable after %d attempts: %s", max_attempts, exc)
                return False
            delay = min(BASE_DELAY_SECONDS * attempt, MAX_DELAY_SECONDS)
            logger.warning(
                "Database not ready (attempt %d/%d): %s — retrying in %ds",
                attempt, max_attempts, exc, delay,
            )
            time.sleep(delay)
    return False


if __name__ == "__main__":
    sys.exit(0 if wait_for_database() else 1)
