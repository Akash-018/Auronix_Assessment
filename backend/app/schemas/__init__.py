from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional
from app.models import UserRole, ChallengeStatus, SubmissionStatus, ChallengeCategory

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Challenge Schemas
class ChallengeCreate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ChallengeCategory] = ChallengeCategory.HTML
    starter_js: Optional[str] = None
    test_cases: Optional[dict] = None

class ChallengeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ChallengeCategory] = None
    starter_js: Optional[str] = None
    test_cases: Optional[dict] = None
    status: Optional[ChallengeStatus] = None

class ChallengeResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: ChallengeCategory = ChallengeCategory.HTML
    starter_js: Optional[str] = None
    test_cases: Optional[dict] = None
    reference_image_url: Optional[str] = None
    reference_width: Optional[int] = None
    reference_height: Optional[int] = None
    reference_aspect_ratio: Optional[float] = None
    status: ChallengeStatus
    created_by: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Project Schemas
class ProjectCreate(BaseModel):
    challenge_id: str

class ProjectSaveRequest(BaseModel):
    html_code: str
    css_code: str
    js_code: str

class ProjectResponse(BaseModel):
    id: str
    challenge_id: str
    owner_id: str
    html_code: str
    css_code: str
    js_code: str
    created_at: datetime
    updated_at: datetime
    last_saved_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Submission Schemas
class SubmissionResponse(BaseModel):
    id: str
    project_id: str
    submitted_at: datetime
    rendered_image_url: Optional[str] = None
    visual_score: Optional[float] = None
    code_score: Optional[float] = None
    final_score: Optional[float] = None
    evaluation_details: Optional[dict] = None
    status: SubmissionStatus

    model_config = ConfigDict(from_attributes=True)

class SubmissionDetailResponse(BaseModel):
    id: str
    project_id: str
    challenge_id: Optional[str] = None
    challenge_title: str
    candidate_email: str
    submitted_at: datetime
    status: SubmissionStatus
    html_code: Optional[str] = None
    css_code: Optional[str] = None
    js_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
