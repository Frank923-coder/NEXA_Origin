"""Fixtures: SQLite en memoria con override de get_db."""
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.db.base import Base
from app.db.session import get_db
from app.main import app

engine = create_engine(
    "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
)
TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db: Session) -> Generator[TestClient, None, None]:
    def _override() -> Generator[Session, None, None]:
        yield db

    app.dependency_overrides[get_db] = _override
    # Sin context manager: no se ejecuta el lifespan (evita conectar a MySQL).
    yield TestClient(app)
    app.dependency_overrides.clear()


USER = {"email": "Ana@uni.edu", "nombre": "Ana", "password": "secreta123"}


@pytest.fixture()
def registered(client: TestClient) -> dict:
    r = client.post("/auth/register", json=USER)
    assert r.status_code == 201
    return r.json()
