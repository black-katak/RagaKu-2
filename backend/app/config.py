"""Application configuration, loaded from environment variables.

The OpenRouter API key is ONLY ever read on the server (PRD section 7:
"Kunci API hanya disimpan di server, tidak pernah di aplikasi").
"""
from __future__ import annotations

import os
from functools import lru_cache


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

        # --- Measurement service (CV model) ---
        # When set, the measurement endpoint shells out to this command,
        # typically a Docker container wrapping TensorFlow 1.13.1.
        self.measurement_command: str = os.getenv("MEASUREMENT_COMMAND", "")
        self.measurement_timeout_seconds: float = float(
            os.getenv("MEASUREMENT_TIMEOUT_SECONDS", "120")
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
