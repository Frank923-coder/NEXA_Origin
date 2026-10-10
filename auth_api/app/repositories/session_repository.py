"""Acceso a datos de sesiones."""
from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.session import UserSession


class SessionRepository:
    """Repositorio de la tabla `sessions`."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, user_id: int, token_hash: str, expires_at: datetime) -> UserSession:
        """Crea una sesión."""
        session = UserSession(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_by_token_hash(self, token_hash: str) -> UserSession | None:
        """Busca una sesión por hash de token."""
        return self.db.scalar(select(UserSession).where(UserSession.token_hash == token_hash))

    def delete(self, session: UserSession) -> None:
        """Elimina una sesión."""
        self.db.delete(session)
        self.db.commit()

    def delete_expired(self, now: datetime) -> int:
        """Elimina sesiones expiradas; devuelve cuántas borró."""
        result = self.db.execute(delete(UserSession).where(UserSession.expires_at <= now))
        self.db.commit()
        return result.rowcount or 0
