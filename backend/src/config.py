from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")
    database_url: str = Field(alias="POSTGRES_URL")


@lru_cache
def get_config() -> Config:
    return Config()


def _without_driver(url: str) -> str:
    for prefix in ("postgresql+asyncpg://", "postgresql+psycopg2://", "postgresql+psycopg://", "postgresql://"):
        if url.startswith(prefix):
            return url.removeprefix(prefix)
    return url


def sync_database_url(url: str) -> str:
    return f"postgresql+psycopg2://{_without_driver(url)}"


def async_database_url(url: str) -> str:
    return f"postgresql+asyncpg://{_without_driver(url)}"
