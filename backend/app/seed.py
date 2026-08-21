from app.core.database import SessionLocal, engine, Base
from app.models import User, UserRole
from app.core.security import get_password_hash
from app.core.config import settings

def seed_admin():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
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
    except Exception as e:
        print(f"Error seeding admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
