from app.core.database import SessionLocal, engine, Base
from app.models import User, UserRole
from app.core.security import get_password_hash
from app.core.config import settings

def seed_initial_users():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed Admin User
        admin_email = settings.INITIAL_ADMIN_EMAIL
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if not existing_admin:
            admin = User(
                email=admin_email,
                password_hash=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin)
            db.commit()
            print(f"Successfully seeded admin user: {admin_email}")
        else:
            print(f"Admin user {admin_email} already exists.")

        # Seed Standard Candidate User
        user_email = settings.INITIAL_USER_EMAIL
        existing_user = db.query(User).filter(User.email == user_email).first()
        if not existing_user:
            user = User(
                email=user_email,
                password_hash=get_password_hash(settings.INITIAL_USER_PASSWORD),
                role=UserRole.USER,
                is_active=True
            )
            db.add(user)
            db.commit()
            print(f"Successfully seeded standard candidate user: {user_email}")
        else:
            print(f"User {user_email} already exists.")
    except Exception as e:
        print(f"Error seeding users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_initial_users()
