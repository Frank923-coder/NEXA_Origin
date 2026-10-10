"""Tests de registro, login, sesión y logout."""
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.session import UserSession
from tests.conftest import USER

COOKIE = get_settings().SESSION_COOKIE_NAME


def _login(client: TestClient, password: str = USER["password"]):
    return client.post("/auth/login", json={"email": USER["email"], "password": password})


def test_health(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_register(registered: dict) -> None:
    assert registered["email"] == "ana@uni.edu"
    assert "password_hash" not in registered


def test_register_duplicate(client: TestClient, registered: dict) -> None:
    assert client.post("/auth/register", json=USER).status_code == 409


def test_register_invalid(client: TestClient) -> None:
    r = client.post("/auth/register", json={"email": "x", "nombre": "", "password": "1"})
    assert r.status_code == 422


def test_login_ok_sets_httponly_cookie(client: TestClient, registered: dict, db: Session) -> None:
    r = _login(client)
    assert r.status_code == 200
    set_cookie = r.headers["set-cookie"].lower()
    assert "httponly" in set_cookie and "samesite=lax" in set_cookie
    token = r.cookies[COOKIE]
    stored = db.scalar(select(UserSession))
    assert stored is not None and stored.token_hash != token and len(stored.token_hash) == 64


def test_login_wrong_password(client: TestClient, registered: dict) -> None:
    assert _login(client, "incorrecta").status_code == 401


def test_login_unknown_user(client: TestClient) -> None:
    r = client.post("/auth/login", json={"email": "no@uni.edu", "password": "x"})
    assert r.status_code == 401


def test_me_without_session(client: TestClient) -> None:
    assert client.get("/users/me").status_code == 401


def test_me_with_invalid_token(client: TestClient) -> None:
    client.cookies.set(COOKIE, "token-falso")
    assert client.get("/users/me").status_code == 401


def test_me_with_session(client: TestClient, registered: dict) -> None:
    _login(client)
    r = client.get("/users/me")
    assert r.status_code == 200 and r.json()["email"] == "ana@uni.edu"


def test_logout(client: TestClient, registered: dict, db: Session) -> None:
    token = _login(client).cookies[COOKIE]
    assert client.post("/auth/logout").status_code == 200
    assert db.scalar(select(UserSession)) is None
    client.cookies.set(COOKIE, token)  # reusar token viejo
    assert client.get("/users/me").status_code == 401


def test_logout_without_session(client: TestClient) -> None:
    assert client.post("/auth/logout").status_code == 200


def test_expired_session(client: TestClient, registered: dict, db: Session) -> None:
    _login(client)
    session = db.scalar(select(UserSession))
    session.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=1)
    db.commit()
    r = client.get("/users/me")
    assert r.status_code == 401 and r.json()["detail"] == "Sesión expirada"
    assert db.scalar(select(UserSession)) is None


def test_inactive_user(client: TestClient, registered: dict, db: Session) -> None:
    from app.models.user import User

    db.get(User, registered["id"]).is_active = False
    db.commit()
    assert _login(client).status_code == 403
