"""Endpoints de autenticación."""
from fastapi import APIRouter, Depends, Response, status

from app.api.deps import get_auth_service, get_session_token
from app.core.config import get_settings
from app.schemas.auth import LoginRequest, LoginResponse, MessageResponse
from app.schemas.user import UserCreate, UserRead
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, service: AuthService = Depends(get_auth_service)) -> UserRead:
    """Registra un nuevo usuario."""
    return UserRead.model_validate(service.register(data))


@router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest, response: Response, service: AuthService = Depends(get_auth_service)
) -> LoginResponse:
    """Inicia sesión y entrega la cookie HttpOnly."""
    settings = get_settings()
    user, token, session = service.login(data.email, data.password)
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        max_age=settings.SESSION_EXPIRE_MINUTES * 60,
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        path="/",
    )
    return LoginResponse(user=UserRead.model_validate(user), expires_at=session.expires_at)


@router.post("/logout", response_model=MessageResponse)
def logout(
    response: Response,
    token: str | None = Depends(get_session_token),
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    """Cierra la sesión actual y borra la cookie."""
    service.logout(token)
    response.delete_cookie(get_settings().SESSION_COOKIE_NAME, path="/")
    return MessageResponse(detail="Sesión cerrada")
