"""Dependencias compartidas de la API."""
from fastapi import Cookie, Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User
from app.services.auth_service import AuthService

_COOKIE = get_settings().SESSION_COOKIE_NAME


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Construye el servicio de autenticación con la sesión de BD."""
    return AuthService(db)


def get_session_token(token: str | None = Cookie(default=None, alias=_COOKIE)) -> str | None:
    """Lee el token de sesión desde la cookie."""
    return token


def get_current_user(
    token: str | None = Depends(get_session_token),
    service: AuthService = Depends(get_auth_service),
) -> User:
    """Usuario autenticado de la sesión actual (401 si no hay)."""
    return service.get_user_from_token(token)
