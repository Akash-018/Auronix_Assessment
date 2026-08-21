import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, Enum, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class UserRole(str, PyEnum):
    SUPERADMIN = "SUPERADMIN"
    ADMIN = "ADMIN"
    CANDIDATE = "CANDIDATE"

class ChallengeStatus(str, PyEnum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"

class SubmissionStatus(str, PyEnum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.ADMIN, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    challenges = relationship("Challenge", back_populates="creator", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")

class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    reference_image_url = Column(String(500), nullable=True)
    reference_width = Column(Integer, nullable=True)
    reference_height = Column(Integer, nullable=True)
    reference_aspect_ratio = Column(Float, nullable=True)
    status = Column(Enum(ChallengeStatus), default=ChallengeStatus.DRAFT, nullable=False)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    creator = relationship("User", back_populates="challenges")
    projects = relationship("Project", back_populates="challenge", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    challenge_id = Column(String(36), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    html_code = Column(Text, default='<div class="page">\n  <h1>Hello PixelTest</h1>\n</div>', nullable=False)
    css_code = Column(Text, default='body {\n  margin: 0;\n  padding: 1rem;\n  font-family: system-ui, sans-serif;\n}', nullable=False)
    js_code = Column(Text, default='// Optional JavaScript code', nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    last_saved_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    challenge = relationship("Challenge", back_populates="projects")
    owner = relationship("User", back_populates="projects")
    submissions = relationship("Submission", back_populates="project", cascade="all, delete-orphan")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    submitted_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    rendered_image_url = Column(String(500), nullable=True)
    visual_score = Column(Float, nullable=True)
    code_score = Column(Float, nullable=True)
    final_score = Column(Float, nullable=True)
    evaluation_details = Column(JSON, nullable=True)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.PENDING, nullable=False)

    project = relationship("Project", back_populates="submissions")
