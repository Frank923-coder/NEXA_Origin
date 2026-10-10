"""DTOs de usuario."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    """Datos de registro."""

    email: EmailStr
    nombre: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=72)


class UserRead(BaseModel):
    """Datos públicos del usuario."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    nombre: str
    is_active: bool
    created_at: datetime
