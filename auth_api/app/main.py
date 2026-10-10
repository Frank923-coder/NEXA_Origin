"""Punto de entrada de la API."""
from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

app = FastAPI(title="Universidad Auth API", version="1.0.0")


@app.get("/health", tags=["health"])
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    """Comprueba la conexión a la base de datos."""
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Base de datos no disponible") from exc
    return {"status": "ok"}
