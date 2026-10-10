"""Configuración de la aplicación (Settings singleton)."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Variables de entorno leídas desde `.env`."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "universidad_auth"
    SECRET_KEY: str = "dev-only-change-me"
    SESSION_EXPIRE_MINUTES: int = 60
    SESSION_COOKIE_NAME: str = "session_token"
    COOKIE_SECURE: bool = False
    CORS_ORIGINS: str = ""

    @property
    def database_url(self) -> str:
        """URL de conexión SQLAlchemy para MySQL vía PyMySQL."""
        from urllib.parse import quote_plus

        return (
            f"mysql+pymysql://{quote_plus(self.DB_USER)}:{quote_plus(self.DB_PASSWORD)}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        """Orígenes CORS separados por coma."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Devuelve la instancia única de Settings."""
    return Settings()
