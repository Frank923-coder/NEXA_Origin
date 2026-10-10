"""Punto de entrada de la API."""
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

import app.models  # noqa: F401  (registra modelos)
from app.api.routers import auth, users
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine, get_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Crea las tablas al arrancar (si la BD está disponible)."""
    try:
        Base.metadata.create_all(bind=engine)
    except SQLAlchemyError as exc:
        logger.error("No se pudieron crear las tablas: %s", exc)
    yield


def create_app() -> FastAPI:
    """Fábrica de la aplicación."""
    settings = get_settings()
    application = FastAPI(title="Universidad Auth API", version="1.0.0", lifespan=lifespan)
    if settings.cors_origins_list:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins_list,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    application.include_router(auth.router)
    application.include_router(users.router)

    @application.get("/health", tags=["health"])
    def health(db: Session = Depends(get_db)) -> dict[str, str]:
        """Comprueba la conexión a la base de datos."""
        try:
            db.execute(text("SELECT 1"))
        except SQLAlchemyError as exc:
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE, "Base de datos no disponible"
            ) from exc
        return {"status": "ok"}

    return application


app = create_app()
