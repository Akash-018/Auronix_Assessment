from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import User
from app.schemas import LoginRequest, UserResponse, Token
from app.core.security import verify_password, create_access_token

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, login_data: LoginRequest) -> Token:
        user = db.query(User).filter(User.email == login_data.email).first()
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user account"
            )
        access_token = create_access_token(subject=user.id, role=user.role.value)
        return Token(access_token=access_token, token_type="bearer")
