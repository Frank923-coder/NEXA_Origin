"""Hash de contraseñas y generación de tokens de sesión."""
import hashlib
import hmac
import secrets

from passlib.context import CryptContext

from app.core.config import get_settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hashea una contraseña con bcrypt."""
    return _pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verifica una contraseña contra su hash bcrypt."""
    return _pwd_context.verify(password, password_hash)


def generate_session_token() -> str:
    """Genera un token de sesión aleatorio y seguro."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """SHA-256 del token (con SECRET_KEY como pepper vía HMAC)."""
    key = get_settings().SECRET_KEY.encode()
    return hmac.new(key, token.encode(), hashlib.sha256).hexdigest()
