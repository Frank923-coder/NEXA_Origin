"""Acceso a datos de usuarios."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    """Repositorio de la tabla `users`."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        """Busca un usuario por id."""
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        """Busca un usuario por email (normalizado a minúsculas)."""
        return self.db.scalar(select(User).where(User.email == email.lower()))

    def create(self, email: str, nombre: str, password_hash: str) -> User:
        """Inserta un usuario nuevo."""
        user = User(email=email.lower(), nombre=nombre, password_hash=password_hash)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
