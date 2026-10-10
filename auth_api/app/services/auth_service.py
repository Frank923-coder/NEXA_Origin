"""Lógica de negocio de autenticación y sesiones."""
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import generate_session_token, hash_password, hash_token, verify_password
from app.models.session import UserSession
from app.models.user import User
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate

# Hash fijo para igualar el tiempo de respuesta cuando el email no existe.
_DUMMY_HASH = hash_password("dummy-password-for-timing")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class AuthService:
    """Registro, login, logout y validación de sesiones."""

    def __init__(self, db: Session) -> None:
        self.users = UserRepository(db)
        self.sessions = SessionRepository(db)

    def register(self, data: UserCreate) -> User:
        """Registra un usuario; 409 si el email ya existe."""
        if self.users.get_by_email(data.email):
            raise HTTPException(status.HTTP_409_CONFLICT, "El email ya está registrado")
        return self.users.create(data.email, data.nombre, hash_password(data.password))

    def login(self, email: str, password: str) -> tuple[User, str, UserSession]:
        """Valida credenciales y crea una sesión. Devuelve (usuario, token plano, sesión)."""
        user = self.users.get_by_email(email)
        if user is None:
            verify_password(password, _DUMMY_HASH)
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales inválidas")
        if not verify_password(password, user.password_hash):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales inválidas")
        if not user.is_active:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Usuario inactivo")

        token = generate_session_token()
        expires_at = _utcnow() + timedelta(minutes=get_settings().SESSION_EXPIRE_MINUTES)
        session = self.sessions.create(user.id, hash_token(token), expires_at)
        return user, token, session

    def logout(self, token: str | None) -> None:
        """Elimina la sesión asociada al token (idempotente)."""
        if not token:
            return
        session = self.sessions.get_by_token_hash(hash_token(token))
        if session is not None:
            self.sessions.delete(session)

    def get_user_from_token(self, token: str | None) -> User:
        """Devuelve el usuario de una sesión válida; 401 si no existe o expiró."""
        if not token:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No autenticado")
        session = self.sessions.get_by_token_hash(hash_token(token))
        if session is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sesión inválida")
        if session.expires_at <= _utcnow():
            self.sessions.delete(session)
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sesión expirada")
        user = self.users.get_by_id(session.user_id)
        if user is None or not user.is_active:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario no válido")
        return user
