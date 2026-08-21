from typing import List
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.schemas import ChallengeCreate, ChallengeUpdate, ChallengeResponse
from app.models import User
from app.services.challenge_service import ChallengeService
from app.services.storage_service import get_storage_service, StorageService

router = APIRouter(prefix="/api/challenges", tags=["challenges"])

@router.get("", response_model=List[ChallengeResponse])
def list_challenges(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ChallengeService.get_challenges(db)

@router.post("", response_model=ChallengeResponse)
def create_challenge(
    challenge_in: ChallengeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return ChallengeService.create_challenge(db, challenge_in, current_user)

@router.get("/{challenge_id}", response_model=ChallengeResponse)
def get_challenge(challenge_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ChallengeService.get_challenge(db, challenge_id)

@router.put("/{challenge_id}", response_model=ChallengeResponse)
def update_challenge(
    challenge_id: str,
    challenge_in: ChallengeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return ChallengeService.update_challenge(db, challenge_id, challenge_in)

@router.delete("/{challenge_id}")
def delete_challenge(
    challenge_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    ChallengeService.delete_challenge(db, challenge_id)
    return {"message": "Challenge deleted successfully"}

@router.post("/{challenge_id}/reference-image", response_model=ChallengeResponse)
async def upload_reference_image(
    challenge_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    storage: StorageService = Depends(get_storage_service)
):
    return await ChallengeService.upload_reference_image(db, challenge_id, file, storage)
