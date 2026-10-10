"""DTOs de autenticación."""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserRead


class LoginRequest(BaseModel):
    """Credenciales de inicio de sesión."""

    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class LoginResponse(BaseModel):
    """Respuesta tras iniciar sesión."""

    user: UserRead
    expires_at: datetime


class MessageResponse(BaseModel):
    """Mensaje simple."""

    detail: str
