from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas import ProjectCreate, ProjectSaveRequest, ProjectResponse
from app.models import User
from app.services.project_service import ProjectService

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.post("", response_model=ProjectResponse)
def create_or_get_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ProjectService.get_or_create_project(db, project_in.challenge_id, current_user)

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ProjectService.get_project(db, project_id)

@router.put("/{project_id}", response_model=ProjectResponse)
@router.post("/{project_id}/save", response_model=ProjectResponse)
def save_project(
    project_id: str,
    save_data: ProjectSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ProjectService.save_project(db, project_id, save_data, current_user)
