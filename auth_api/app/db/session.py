"""Engine, fábrica de sesiones y dependencia `get_db`."""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

engine = create_engine(get_settings().database_url, pool_pre_ping=True, pool_recycle=3600)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """Entrega una sesión de BD y garantiza su cierre."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
