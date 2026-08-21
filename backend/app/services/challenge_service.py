import io
from PIL import Image
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from app.models import Challenge, ChallengeStatus, User
from app.schemas import ChallengeCreate, ChallengeUpdate
from app.services.storage_service import StorageService

ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

class ChallengeService:
    @staticmethod
    def get_challenges(db: Session):
        return db.query(Challenge).order_by(Challenge.created_at.desc()).all()

    @staticmethod
    def get_challenge(db: Session, challenge_id: str):
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        if not challenge:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
        return challenge

    @staticmethod
    def create_challenge(db: Session, challenge_in: ChallengeCreate, current_user: User):
        # Auto-generate title if omitted
        title = challenge_in.title.strip() if challenge_in.title and challenge_in.title.strip() else None
        if not title:
            count = db.query(Challenge).count() + 1
            title = f"Challenge #{count:03d}"

        challenge = Challenge(
            title=title,
            description=challenge_in.description,
            status=ChallengeStatus.DRAFT,
            created_by=current_user.id
        )
        db.add(challenge)
        db.commit()
        db.refresh(challenge)
        return challenge

    @staticmethod
    def update_challenge(db: Session, challenge_id: str, challenge_in: ChallengeUpdate):
        challenge = ChallengeService.get_challenge(db, challenge_id)
        if challenge_in.title is not None:
            challenge.title = challenge_in.title
        if challenge_in.description is not None:
            challenge.description = challenge_in.description
        if challenge_in.status is not None:
            challenge.status = challenge_in.status
        db.commit()
        db.refresh(challenge)
        return challenge

    @staticmethod
    def delete_challenge(db: Session, challenge_id: str):
        challenge = ChallengeService.get_challenge(db, challenge_id)
        db.delete(challenge)
        db.commit()
        return True

    @staticmethod
    async def upload_reference_image(db: Session, challenge_id: str, file: UploadFile, storage: StorageService):
        challenge = ChallengeService.get_challenge(db, challenge_id)
        
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported image format {file.content_type}. Allowed formats: PNG, JPG, JPEG, WEBP."
            )

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image size exceeds 10MB limit."
            )

        # Detect dimensions using Pillow
        try:
            image = Image.open(io.BytesIO(content))
            width, height = image.size
            aspect_ratio = round(width / height, 4) if height > 0 else 1.0
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image file structure."
            )

        file_url = storage.upload_file(content, file.filename or "reference.png", file.content_type)
        
        challenge.reference_image_url = file_url
        challenge.reference_width = width
        challenge.reference_height = height
        challenge.reference_aspect_ratio = aspect_ratio
        
        db.commit()
        db.refresh(challenge)
        return challenge
