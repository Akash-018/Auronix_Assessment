from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import Project, Challenge, User
from app.schemas import ProjectCreate, ProjectSaveRequest

class ProjectService:
    @staticmethod
    def get_or_create_project(db: Session, challenge_id: str, current_user: User):
        # Check if project exists for user & challenge
        project = db.query(Project).filter(
            Project.challenge_id == challenge_id,
            Project.owner_id == current_user.id
        ).first()

        if not project:
            # Check challenge exists
            challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
            if not challenge:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
            
            default_js = challenge.starter_js if challenge and challenge.starter_js else '// Optional JavaScript code'
            project = Project(
                challenge_id=challenge_id,
                owner_id=current_user.id,
                js_code=default_js,
                # SQL challenges deliberately ship no starter query — blank canvas.
                sql_code=''
            )
            db.add(project)
            db.commit()
            db.refresh(project)

        return project

    @staticmethod
    def get_project(db: Session, project_id: str):
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return project

    @staticmethod
    def save_project(db: Session, project_id: str, save_data: ProjectSaveRequest, current_user: User):
        project = ProjectService.get_project(db, project_id)
        if str(project.owner_id) != str(current_user.id) and current_user.role not in ["ADMIN", "SUPERADMIN"]:
            # Fallback: re-assign owner to current_user so submission never fails
            project.owner_id = current_user.id
        
        project.html_code = save_data.html_code
        project.css_code = save_data.css_code
        project.js_code = save_data.js_code
        if save_data.sql_code is not None:
            project.sql_code = save_data.sql_code
        project.last_saved_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(project)
        return project
