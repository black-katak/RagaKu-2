"""Application configuration, loaded from environment variables.

The OpenRouter API key is ONLY ever read on the server (PRD section 7:
"Kunci API hanya disimpan di server, tidak pernah di aplikasi").
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env regardless of the folder uvicorn is started from. Variables
# already set in the environment (shell, Docker, hosting) take precedence.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


class Settings:
    """Runtime settings sourced from environment variables."""

    def __init__(self) -> None:
        # --- OpenRouter / AI plan ---
        self.openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
        self.openrouter_base_url: str = os.getenv(
            "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
        )
        self.openrouter_model: str = os.getenv(
            "OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b"
        )
        # PRD section 8: timeout 90 seconds.
        self.openrouter_timeout_seconds: float = float(
            os.getenv("OPENROUTER_TIMEOUT_SECONDS", "90")
        )
        # Optional attribution headers recommended by OpenRouter.
        self.openrouter_referer: str = os.getenv(
            "OPENROUTER_HTTP_REFERER", "https://github.com/black-katak/RagaKu-2"
        )
        self.openrouter_title: str = os.getenv("OPENROUTER_APP_TITLE", "RagaKu")

        # --- Gemini body estimation (F3: height, weight and body measurements from a photo) ---
        self.gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
        self.gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        # Tried when the primary model is overloaded (HTTP 503/429). Leave
        # empty to disable the fallback.
        self.gemini_fallback_model: str = os.getenv(
            "GEMINI_FALLBACK_MODEL", "gemini-3.5-flash-lite"
        )

        # --- Behaviour flags ---
        self.ai_max_retries: int = int(os.getenv("AI_MAX_RETRIES", "1"))
        self.cors_allow_origins: list[str] = [
            o.strip()
            for o in os.getenv("CORS_ALLOW_ORIGINS", "*").split(",")
            if o.strip()
        ]

    @property
    def openrouter_configured(self) -> bool:
        return bool(self.openrouter_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
