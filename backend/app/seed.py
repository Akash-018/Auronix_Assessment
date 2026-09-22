"""
Single seeding entry point for PixelTest.

Runs automatically on application startup (see `app.main`), and can also be
invoked directly:

    python -m app.seed

Everything here is idempotent and additive — it never updates or deletes an
existing row — so it is safe to run on every boot and safe to re-run. That is what
makes a brand-new empty database (a fresh Neon instance, for example) come up fully
populated without any manual import step.

Seeded content, in dependency order:
  1. Users              — the bootstrap admin and candidate accounts, matched by email
  2. HTML/JS challenges — exported content in core/seed_challenges.json, matched by title
  3. SQL challenges     — authored content in core/sql_challenges.py, matched by title
  4. Reference images   — repairs any legacy disk-path image URLs to embedded data URIs
"""
import json
import logging
import os
import sys

from sqlalchemy.orm import Session

from app.core.bootstrap import (
    init_bootstrap_users,
    init_bootstrap_challenges,
    init_bootstrap_sql_challenges,
)
from app.core.database import SessionLocal, engine, Base
from app.models import Challenge, ChallengeCategory, ChallengeStatus, User, UserRole

logger = logging.getLogger("pixeltest.seed")

SEED_CHALLENGES_PATH = os.path.join(os.path.dirname(__file__), "core", "seed_challenges.json")


def seed_content_challenges(db: Session) -> int:
    """
    Install the exported HTML/JS challenges.

    Matched by title, so a challenge an admin has since edited is left untouched
    and a re-run adds nothing. Returns the number newly created.
    """
    if not os.path.exists(SEED_CHALLENGES_PATH):
        logger.info("No seed_challenges.json present — skipping content challenges.")
        return 0

    with open(SEED_CHALLENGES_PATH, "r", encoding="utf-8") as fh:
        specs = json.load(fh)

    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    admin_id = admin.id if admin else "system"

    existing_titles = {title for (title,) in db.query(Challenge.title).all()}
    created = 0

    for spec in specs:
        if spec["title"] in existing_titles:
            continue

        db.add(
            Challenge(
                title=spec["title"],
                description=spec.get("description"),
                category=ChallengeCategory(spec.get("category", "HTML")),
                starter_js=spec.get("starter_js") or None,
                reference_image_url=spec.get("reference_image_url") or None,
                reference_width=spec.get("reference_width"),
                reference_height=spec.get("reference_height"),
                reference_aspect_ratio=spec.get("reference_aspect_ratio"),
                status=ChallengeStatus(spec.get("status", "ACTIVE")),
                created_by=admin_id,
            )
        )
        created += 1

    if created:
        db.commit()
        logger.info("Seeded %d HTML/JS challenge(s).", created)

    return created


def run_seed(db: Session) -> dict:
    """Run every seeding step in dependency order. Safe on an already-populated DB."""
    summary = {}

    # 1. Users first: challenges need an admin to attribute `created_by` to.
    init_bootstrap_users(db)
    summary["users"] = db.query(User).count()

    # 2. Exported HTML/JS content.
    summary["content_challenges_created"] = seed_content_challenges(db)

    # 3. The authored SQL assessment track.
    init_bootstrap_sql_challenges(db)

    # 4. Image repair last — it creates a placeholder challenge only when the
    #    database is still completely empty, which the steps above have prevented.
    init_bootstrap_challenges(db)

    summary["challenges_total"] = db.query(Challenge).count()
    summary["challenges_by_category"] = {
        category.value: db.query(Challenge).filter(Challenge.category == category).count()
        for category in ChallengeCategory
    }
    return summary


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    # Only relevant when seeding a database that has not been migrated by Alembic.
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        summary = run_seed(db)
    except Exception as exc:
        db.rollback()
        print(f"Seeding failed: {exc}")
        return 1
    finally:
        db.close()

    print("Seed complete:")
    print(f"  users                : {summary['users']}")
    print(f"  challenges created   : {summary['content_challenges_created']} (HTML/JS this run)")
    print(f"  challenges total     : {summary['challenges_total']}")
    for category, count in summary["challenges_by_category"].items():
        print(f"    {category:5}: {count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
