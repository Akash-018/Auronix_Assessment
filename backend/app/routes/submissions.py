from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas import SubmissionResponse
from app.models import User, Submission, Project

router = APIRouter(prefix="/api", tags=["submissions"])

@router.post("/projects/{project_id}/submit", response_model=SubmissionResponse)
def submit_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    submission = Submission(
        project_id=project_id,
        status="COMPLETED"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission

@router.get("/submissions/{submission_id}", response_model=SubmissionResponse)
def get_submission(
    submission_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    return submission
