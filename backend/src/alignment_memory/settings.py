from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Process settings with credential-free local defaults."""

    app_name: str = "Alignment Memory"
    app_mode: Literal["fixture", "live"] = "fixture"
    environment: Literal["development", "test", "production"] = "development"
    database_url: str | None = None

    supabase_jwt_issuer: str = "https://fixture.supabase.co/auth/v1"
    supabase_jwt_audience: str = "authenticated"
    supabase_jwks_url: str | None = None
    supabase_jwt_secret: str | None = None
    fixture_jwt_secret: str = "alignment-memory-fixture-jwt-signing-secret"
    fixture_test_auth_enabled: bool = False

    internal_hmac_secret: str | None = None
    fixture_hmac_secret: str = "alignment-memory-fixture-hmac-secret"
    internal_hmac_replay_window_seconds: int = 300

    github_app_id: str | None = None
    github_app_private_key: str | None = None
    github_sync_workflow: str = "alignment-analyze.yml"
    github_api_base_url: str = "https://api.github.com"
    github_api_timeout_seconds: float = 15.0
    github_api_max_retries: int = 2

    openrouter_api_key: str | None = None
    openrouter_primary_model: str = "openai/gpt-4.1-mini"
    openrouter_fallback_model: str = "google/gemini-2.5-flash"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_timeout_seconds: float = 30.0
    openrouter_max_retries: int = 2

    model_config = SettingsConfigDict(
        env_file=_BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
