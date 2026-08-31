import os
import base64
import mimetypes
from app.core.database import SessionLocal
from app.models import Challenge, Submission

def convert_file_to_base64_data_uri(filepath: str) -> str:
    if not os.path.exists(filepath):
        return None
    mime, _ = mimetypes.guess_type(filepath)
    if not mime:
        ext = os.path.splitext(filepath)[1].lower()
        if ext in ['.jpg', '.jpeg']:
            mime = 'image/jpeg'
        elif ext == '.webp':
            mime = 'image/webp'
        else:
            mime = 'image/png'
            
    with open(filepath, 'rb') as f:
        data = f.read()
    encoded = base64.b64encode(data).decode('utf-8')
    return f"data:{mime};base64,{encoded}"

def migrate_images_to_db():
    db = SessionLocal()
    migrated_challenges = 0
    migrated_submissions = 0
    try:
        # Migrate Challenges
        challenges = db.query(Challenge).all()
        for ch in challenges:
            if ch.reference_image_url and not ch.reference_image_url.startswith('data:'):
                # Try finding local file in backend/uploads or uploads/
                filename = os.path.basename(ch.reference_image_url)
                possible_paths = [
                    os.path.join("uploads", filename),
                    os.path.join("backend", "uploads", filename),
                    ch.reference_image_url.lstrip("/")
                ]
                for p in possible_paths:
                    if os.path.exists(p):
                        data_uri = convert_file_to_base64_data_uri(p)
                        if data_uri:
                            ch.reference_image_url = data_uri
                            migrated_challenges += 1
                            print(f"Migrated challenge {ch.id} ({ch.title}) image to DB Base64 Data URI.")
                            break

        # Migrate Submissions
        submissions = db.query(Submission).all()
        for sub in submissions:
            if sub.rendered_image_url and not sub.rendered_image_url.startswith('data:'):
                filename = os.path.basename(sub.rendered_image_url)
                possible_paths = [
                    os.path.join("uploads", filename),
                    os.path.join("backend", "uploads", filename),
                    sub.rendered_image_url.lstrip("/")
                ]
                for p in possible_paths:
                    if os.path.exists(p):
                        data_uri = convert_file_to_base64_data_uri(p)
                        if data_uri:
                            sub.rendered_image_url = data_uri
                            migrated_submissions += 1
                            print(f"Migrated submission {sub.id} image to DB Base64 Data URI.")
                            break

        db.commit()
        print(f"Migration finished. Updated {migrated_challenges} challenges and {migrated_submissions} submissions.")
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_images_to_db()
