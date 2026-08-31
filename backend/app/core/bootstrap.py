import os
import logging
from sqlalchemy.orm import Session
from app.models import User, UserRole, Challenge, ChallengeStatus
from app.core.security import get_password_hash
from app.core.config import settings

logger = logging.getLogger("pixeltest.bootstrap")

DEFAULT_SAMPLE_IMAGE_B64 = (
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNjAwIiB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiMxMzE5MUQiLz48cmVjdCB4PSIxMDAiIHk9IjgwIiB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQ0MCIgcng9IjE2IiBmaWxsPSIjMUIyMzI4IiBzdHJva2U9IiMzNDQxNEEiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjE0MCIgeT0iMTQwIiBmaWxsPSIjRjdGNUYyIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI4IiBmb250LXdlaWdodD0iYm9sZCI+TG9naW4gQ2FyZCBDaGFsbGVuZ2U8L3RleHQ+PHRleHQgeD0iMTQwIiB5PSIxODAiIGZpbGw9IiNDOUM3QzMiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiPlJlY3JlYXRlIHRoaXMgdWkgY29tcG9uZW50IHdpdGggY2xlYW4gSE1MIGFuZCBDU1MuPC90ZXh0PjxyZWN0IHg9IjE0MCIgeT0iMjIwIiB3aWR0aD0iNTIwIiBoZWlnaHQ9IjUwIiByeD0iOCIgZmlsbD0iIzIzMkQzMyIgc3Ryb2tlPSIjMzQ0MTRBIi8+PHRleHQgeD0iMTYwIiB5PSIyNTEiIGZpbGw9IiM4RDk0OTgiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPmVtYWlsQGV4YW1wbGUuY29tPC90ZXh0PjxyZWN0IHg9IjE0MCIgeT0iMjkwIiB3aWR0aD0iNTIwIiBoZWlnaHQ9IjUwIiByeD0iOCIgZmlsbD0iIzIzMkQzMyIgc3Ryb2tlPSIjMzQ0MTRBIi8+PHRleHQgeD0iMTYwIiB5PSIzMjEiIGZpbGw9IiM4RDk0OTgiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPuKAouKAouKAouKAouKAouKAouKAouKAoTwvdGV4dD48cmVjdCB4PSIxNDAiIHk9IjM2MCIgd2lkdGg9IjUyMCIgaGVpZ2h0PSI1MCIgcng9IjgiIGZpbGw9IiNEOUM4QTMiLz48dGV4dCB4PSI0MDAiIHk9IjM5MSIgZmlsbD0iIzEzMTkxRCIgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNpZ24gSW48L3RleHQ+PC9zdmc+"
)

def init_bootstrap_users(db: Session) -> None:
    """
    Idempotent bootstrap procedure for initial production Admin and User accounts.
    Only runs if corresponding environment variables are provided.
    Never overwrites existing users or passwords.
    """
    admin_email = os.getenv("BOOTSTRAP_ADMIN_EMAIL", settings.INITIAL_ADMIN_EMAIL)
    admin_password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", settings.INITIAL_ADMIN_PASSWORD)
    user_email = os.getenv("BOOTSTRAP_USER_EMAIL", settings.INITIAL_USER_EMAIL)
    user_password = os.getenv("BOOTSTRAP_USER_PASSWORD", settings.INITIAL_USER_PASSWORD)

    # 1. Admin Bootstrap
    if admin_email and admin_password:
        existing_admin = db.query(User).filter(User.email == admin_email.strip()).first()
        if not existing_admin:
            logger.info(f"Creating bootstrap Admin user: {admin_email.strip()}")
            admin_user = User(
                email=admin_email.strip(),
                password_hash=get_password_hash(admin_password),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
        else:
            logger.info(f"Bootstrap Admin user already exists: {admin_email.strip()}")

    # 2. User Bootstrap
    if user_email and user_password:
        existing_user = db.query(User).filter(User.email == user_email.strip()).first()
        if not existing_user:
            logger.info(f"Creating bootstrap User account: {user_email.strip()}")
            standard_user = User(
                email=user_email.strip(),
                password_hash=get_password_hash(user_password),
                role=UserRole.USER,
                is_active=True
            )
            db.add(standard_user)
            db.commit()
        else:
            logger.info(f"Bootstrap User account already exists: {user_email.strip()}")

def init_bootstrap_challenges(db: Session) -> None:
    """
    Ensures all challenges in the DB have valid embedded Data URIs for their reference images.
    If a challenge has a legacy relative disk URL (/uploads/...) or missing image data,
    it is auto-repaired to an embedded Base64 Data URI so it displays properly across all devices.
    """
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    admin_id = admin.id if admin else "system"

    challenges = db.query(Challenge).all()
    repaired = 0

    for ch in challenges:
        if not ch.reference_image_url or ch.reference_image_url.startswith("/uploads/"):
            # Auto-repair legacy or missing image links to embedded Data URI
            ch.reference_image_url = DEFAULT_SAMPLE_IMAGE_B64
            ch.reference_width = 800
            ch.reference_height = 600
            ch.reference_aspect_ratio = 1.3333
            if ch.status != ChallengeStatus.ACTIVE:
                ch.status = ChallengeStatus.ACTIVE
            repaired += 1

    if len(challenges) == 0:
        # Create default active challenge if database is brand new
        default_challenge = Challenge(
            title="Login Card Challenge",
            description="Recreate the target login card component using clean HTML and CSS.",
            reference_image_url=DEFAULT_SAMPLE_IMAGE_B64,
            reference_width=800,
            reference_height=600,
            reference_aspect_ratio=1.3333,
            status=ChallengeStatus.ACTIVE,
            created_by=admin_id
        )
        db.add(default_challenge)
        repaired += 1

    if repaired > 0:
        db.commit()
        logger.info(f"Bootstrapped/repaired {repaired} challenges with Base64 reference image Data URIs.")

