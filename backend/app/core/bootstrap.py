import os
import logging
from sqlalchemy.orm import Session
from app.models import User, UserRole
from app.core.security import get_password_hash
from app.core.config import settings

logger = logging.getLogger("pixeltest.bootstrap")

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
