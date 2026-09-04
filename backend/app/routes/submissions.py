from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.schemas import SubmissionResponse, SubmissionDetailResponse
from app.models import User, UserRole, Submission, Project, Challenge

router = APIRouter(prefix="/api", tags=["submissions"])

@router.get("/submissions", response_model=List[SubmissionDetailResponse])
def list_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        submissions = db.query(Submission).order_by(Submission.submitted_at.desc()).all()
    else:
        # Filter submissions where project owner is current user
        submissions = (
            db.query(Submission)
            .join(Project, Submission.project_id == Project.id)
            .filter(Project.owner_id == current_user.id)
            .order_by(Submission.submitted_at.desc())
            .all()
        )
        
    results = []
    
    for sub in submissions:
        project = db.query(Project).filter(Project.id == sub.project_id).first()
        challenge = db.query(Challenge).filter(Challenge.id == project.challenge_id).first() if project else None
        owner = db.query(User).filter(User.id == project.owner_id).first() if project else None
        
        results.append(
            SubmissionDetailResponse(
                id=sub.id,
                project_id=sub.project_id,
                challenge_id=project.challenge_id if project else None,
                challenge_title=challenge.title if challenge else "Assessment Test",
                candidate_email=owner.email if owner else current_user.email,
                submitted_at=sub.submitted_at,
                status=sub.status,
                html_code=project.html_code if project else "",
                css_code=project.css_code if project else "",
                js_code=project.js_code if project else ""
            )
        )
        
    return results

@router.post("/projects/{project_id}/submit", response_model=SubmissionResponse)
def submit_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    submission = db.query(Submission).filter(Submission.project_id == project_id).first()
    if submission:
        from datetime import datetime, timezone
        submission.submitted_at = datetime.now(timezone.utc)
        submission.status = "COMPLETED"
    else:
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
