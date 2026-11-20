"""Height/weight estimation from a photo using the Gemini API (PRD F3).

Follows the server-side AI convention of `ai_plan.py`: the API key is read only
on the server (never shipped in the app), the model's JSON is validated against
the Pydantic schema before it reaches the client, and failures surface as clean
HTTP errors with no stack traces or key material.

Privacy: the photo is passed to Gemini as in-memory bytes, so no temp file is
ever written to disk.
"""
from __future__ import annotations

import logging

from fastapi import HTTPException
from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from app.config import Settings
from app.schemas import BodyEstimateResult

logger = logging.getLogger(__name__)

# Gemini status codes that mean "busy / rate limited, try again later".
_BUSY_STATUS_CODES = (429, 503)

# Sanity limits: anything outside these is a model failure, not a real body.
_HEIGHT_MIN_CM = 100.0
_HEIGHT_MAX_CM = 230.0
_WEIGHT_MIN_KG = 30.0
_WEIGHT_MAX_KG = 250.0

_SYSTEM_PROMPT = (
    "Anda adalah estimator antropometri visual untuk aplikasi kebugaran RagaKu. "
    "Tugas Anda: memperkirakan tinggi badan (cm) dan berat badan (kg) orang pada foto. "
    "Gunakan proporsi tubuh penuh (rasio tinggi kepala terhadap tinggi tubuh, panjang "
    "tungkai, lebar bahu, lingkar pinggang relatif) dan acuan skala lingkungan bila "
    "terlihat (kosen pintu, ubin lantai, furnitur, tinggi meja/kursi). "
    "Turunkan confidence ke \"low\" dan tambahkan peringatan pada field warnings bila "
    "seluruh tubuh tidak terlihat jelas, sudut pengambilan miring, atau tidak ada acuan "
    "skala sama sekali. Jangan mengarang presisi: ini estimasi, bukan pengukuran. "
    "Balas HANYA dengan JSON sesuai skema yang diminta, tanpa teks lain."
)

_USER_PROMPT = (
    "Perkirakan tinggi dan berat orang pada foto ini. "
    "height_cm dan weight_kg harus angka realistis untuk manusia dewasa. "
    "Isi confidence dengan \"high\" hanya bila tubuh terlihat penuh, tegak, dan ada "
    "acuan skala. Isi warnings dengan alasan singkat (Bahasa Indonesia) bila estimasi "
    "kurang dapat diandalkan; kosongkan bila tidak ada masalah."
)


def _apply_limits(result: BodyEstimateResult) -> BodyEstimateResult:
    """Clamp implausible values and record why, so the client can show it."""
    warnings = list(result.warnings)

    height = result.height_cm
    if height < _HEIGHT_MIN_CM:
        height = _HEIGHT_MIN_CM
        warnings.append(
            "Tinggi hasil estimasi terlalu kecil dan telah dibatasi ke 100 cm."
        )
    elif height > _HEIGHT_MAX_CM:
        height = _HEIGHT_MAX_CM
        warnings.append(
            "Tinggi hasil estimasi terlalu besar dan telah dibatasi ke 230 cm."
        )

    weight = result.weight_kg
    if weight < _WEIGHT_MIN_KG:
        weight = _WEIGHT_MIN_KG
        warnings.append(
            "Berat hasil estimasi terlalu kecil dan telah dibatasi ke 30 kg."
        )
    elif weight > _WEIGHT_MAX_KG:
        weight = _WEIGHT_MAX_KG
        warnings.append(
            "Berat hasil estimasi terlalu besar dan telah dibatasi ke 250 kg."
        )

    return BodyEstimateResult(
        height_cm=round(height, 1),
        weight_kg=round(weight, 1),
        confidence=result.confidence,
        warnings=warnings,
    )


async def estimate_body(
    settings: Settings, image_bytes: bytes, mime_type: str
) -> BodyEstimateResult:
    """Ask Gemini to estimate height/weight from a photo.

    When the primary model is overloaded (503/429), the configured fallback
    model is tried once. Real failure reasons are logged on the server only.

    Raises:
        HTTPException: 503 when the API key is missing or every model is
        overloaded, 502 when the model call fails or returns data that does
        not satisfy `BodyEstimateResult`.
    """
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=503, detail="Gemini API key not configured"
        )

    client = genai.Client(api_key=settings.gemini_api_key)

    config = types.GenerateContentConfig(
        system_instruction=_SYSTEM_PROMPT,
        response_mime_type="application/json",
        response_schema=BodyEstimateResult,
    )
    contents = [
        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        _USER_PROMPT,
    ]

    models = [settings.gemini_model]
    fallback = settings.gemini_fallback_model
    if fallback and fallback != settings.gemini_model:
        models.append(fallback)

    response = None
    last_busy_error: Exception | None = None
    for model in models:
        try:
            response = await client.aio.models.generate_content(
                model=model,
                contents=contents,
                config=config,
            )
            break
        except genai_errors.APIError as exc:
            if exc.code in _BUSY_STATUS_CODES:
                logger.warning(
                    "Gemini model %s is busy (%s %s): %s",
                    model, exc.code, exc.status, exc.message,
                )
                last_busy_error = exc
                continue
            logger.warning(
                "Gemini model %s failed (%s %s): %s",
                model, exc.code, exc.status, exc.message,
            )
            raise HTTPException(
                status_code=502, detail="Gemini request failed"
            ) from exc
        except Exception as exc:  # noqa: BLE001 - never leak SDK internals to client
            logger.warning(
                "Gemini model %s failed: %s: %s", model, type(exc).__name__, exc
            )
            raise HTTPException(
                status_code=502, detail="Gemini request failed"
            ) from exc

    if response is None:
        raise HTTPException(
            status_code=503,
            detail="Layanan estimasi sedang sibuk. Coba lagi dalam beberapa saat.",
        ) from last_busy_error

    parsed = getattr(response, "parsed", None)
    if isinstance(parsed, BodyEstimateResult):
        result = parsed
    else:
        text = (getattr(response, "text", None) or "").strip()
        try:
            result = BodyEstimateResult.model_validate_json(text)
        except Exception as exc:  # noqa: BLE001 - invalid model output
            logger.warning(
                "Gemini returned output that does not match the schema: %s", exc
            )
            raise HTTPException(
                status_code=502, detail="Gemini returned an invalid response"
            ) from exc

    return _apply_limits(result)
