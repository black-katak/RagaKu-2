"""Body estimation from a photo using the Gemini API (PRD F3).

Two estimators share one call helper:
  * `estimate_body`         -> height and weight
  * `estimate_measurements` -> waist, hip, chest, shoulder width and arm length

Follows the server-side AI convention of `ai_plan.py`: the API key is read only
on the server (never shipped in the app), the model's JSON is validated against
the Pydantic schema before it reaches the client, and failures surface as clean
HTTP errors with no stack traces or key material.

Privacy: the photo is passed to Gemini as in-memory bytes, so no temp file is
ever written to disk. The photo does leave our server (it goes to Google), and
the client-facing copy says so.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import HTTPException
from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from app.config import Settings
from app.schemas import (
    BodyEstimateResult,
    Gender,
    MeasurementEstimate,
    MeasurementResult,
)

logger = logging.getLogger(__name__)

# Gemini status codes that mean "busy / rate limited, try again later".
_BUSY_STATUS_CODES = (429, 503)

# A model that neither answers nor errors would otherwise block the request forever and
# the fallback model would never be tried. Give each model this long (seconds); a timeout
# is treated like "busy". Worst case is two models, so the client sees a clean 503 well
# before its own 60 second limit.
_MODEL_TIMEOUT_SECONDS = 20.0

# Sanity limits: anything outside these is a model failure, not a real body.
_HEIGHT_MIN_CM = 100.0
_HEIGHT_MAX_CM = 230.0
_WEIGHT_MIN_KG = 30.0
_WEIGHT_MAX_KG = 250.0

# Plausible ranges for the circumference/length estimates (cm). A value outside its
# range is dropped (set to None) with a warning instead of being passed on.
_MEASUREMENT_RANGES: dict[str, tuple[float, float, str]] = {
    "waist_cm": (40.0, 200.0, "Lingkar pinggang"),
    "hip_cm": (50.0, 220.0, "Lingkar pinggul"),
    "chest_cm": (50.0, 200.0, "Lingkar dada"),
    "shoulder_width_cm": (25.0, 70.0, "Lebar bahu"),
    "arm_length_cm": (40.0, 100.0, "Panjang lengan"),
}

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

_MEASURE_SYSTEM_PROMPT = (
    "Anda adalah estimator antropometri visual untuk aplikasi kebugaran RagaKu. "
    "Tugas Anda: memperkirakan ukuran tubuh orang pada foto dalam sentimeter: lingkar "
    "pinggang, lingkar pinggul, lingkar dada, lebar bahu, dan panjang lengan. "
    "Tinggi badan sebenarnya diberikan oleh pengguna; pakai sebagai acuan skala utama. "
    "Pakaian longgar, pose miring, atau tubuh yang terpotong membuat lingkar badan sulit "
    "ditaksir dengan benar: turunkan confidence ke \"low\" dan jelaskan di warnings. "
    "Jika sebuah ukuran tidak dapat ditaksir dari foto, isi null untuk ukuran itu. "
    "Jangan mengarang presisi: ini taksiran dari satu foto, bukan pengukuran. "
    "Balas HANYA dengan JSON sesuai skema yang diminta, tanpa teks lain."
)


def _measure_user_prompt(height_cm: float, gender: Gender) -> str:
    sex = "perempuan" if gender == Gender.female else "laki-laki"
    return (
        f"Orang pada foto adalah {sex} dengan tinggi badan {height_cm:.0f} cm. "
        "Taksir waist_cm, hip_cm, chest_cm, shoulder_width_cm, dan arm_length_cm. "
        "Isi confidence dengan \"high\" hanya bila seluruh tubuh terlihat penuh, tegak, "
        "menghadap depan, dan pakaian pas badan. Isi warnings dengan alasan singkat "
        "(Bahasa Indonesia) bila taksiran kurang dapat diandalkan; kosongkan bila tidak "
        "ada masalah."
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


def _apply_measurement_limits(estimate: MeasurementEstimate) -> MeasurementResult:
    """Drop implausible sizes and force low confidence when the result is not usable.

    Unlike height/weight, a wrong circumference is never "clamped" to a made-up number:
    the value is removed and the reason is recorded. A missing waist also forces
    low confidence, because the waist is what the app's risk indicators rely on.
    """
    warnings = list(estimate.warnings)
    confidence = estimate.confidence
    values: dict[str, float | None] = {}

    for field, (low, high, label) in _MEASUREMENT_RANGES.items():
        raw = getattr(estimate, field)
        if raw is None:
            values[field] = None
        elif low <= raw <= high:
            values[field] = round(raw, 1)
        else:
            values[field] = None
            warnings.append(
                f"{label} hasil taksiran ({raw:g} cm) di luar rentang wajar "
                f"({low:g}-{high:g} cm) dan dibuang."
            )
            confidence = "low"

    if not any(v is not None for v in values.values()):
        warnings.append(
            "Tidak ada ukuran yang dapat ditaksir. Pastikan seluruh tubuh terlihat, "
            "pencahayaan baik, dan pakaian pas badan."
        )
        confidence = "low"
    elif values["waist_cm"] is None:
        warnings.append("Lingkar pinggang tidak dapat ditaksir dari foto ini.")
        confidence = "low"

    return MeasurementResult(confidence=confidence, warnings=warnings, **values)


async def _generate(
    settings: Settings, contents: list[Any], config: types.GenerateContentConfig
) -> Any:
    """Run one prompt on the primary Gemini model, falling back to the second one.

    The fallback is tried once when the primary is busy (429/503) or does not answer
    within `_MODEL_TIMEOUT_SECONDS`. Real failure reasons are logged on the server only.

    Raises:
        HTTPException: 503 when the API key is missing or every model is busy or
        silent, 502 when a model call fails outright.
    """
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=503, detail="Gemini API key not configured"
        )

    client = genai.Client(api_key=settings.gemini_api_key)

    models = [settings.gemini_model]
    fallback = settings.gemini_fallback_model
    if fallback and fallback != settings.gemini_model:
        models.append(fallback)

    last_busy_error: Exception | None = None
    for model in models:
        try:
            return await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config,
                ),
                timeout=_MODEL_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError as exc:
            logger.warning(
                "Gemini model %s did not answer within %.0fs; treating it as busy",
                model, _MODEL_TIMEOUT_SECONDS,
            )
            last_busy_error = exc
            continue
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

    raise HTTPException(
        status_code=503,
        detail="Layanan estimasi sedang sibuk. Coba lagi dalam beberapa saat.",
    ) from last_busy_error


def _parse(response: Any, schema: type) -> Any:
    """Return the model output as `schema`, or raise a clean 502."""
    parsed = getattr(response, "parsed", None)
    if isinstance(parsed, schema):
        return parsed
    text = (getattr(response, "text", None) or "").strip()
    try:
        return schema.model_validate_json(text)
    except Exception as exc:  # noqa: BLE001 - invalid model output
        logger.warning(
            "Gemini returned output that does not match the schema: %s", exc
        )
        raise HTTPException(
            status_code=502, detail="Gemini returned an invalid response"
        ) from exc


async def estimate_body(
    settings: Settings, image_bytes: bytes, mime_type: str
) -> BodyEstimateResult:
    """Ask Gemini to estimate height/weight from a photo."""
    config = types.GenerateContentConfig(
        system_instruction=_SYSTEM_PROMPT,
        response_mime_type="application/json",
        response_schema=BodyEstimateResult,
    )
    contents = [
        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        _USER_PROMPT,
    ]
    response = await _generate(settings, contents, config)
    return _apply_limits(_parse(response, BodyEstimateResult))


async def estimate_measurements(
    settings: Settings,
    image_bytes: bytes,
    mime_type: str,
    height_cm: float,
    gender: Gender,
) -> MeasurementResult:
    """Ask Gemini to estimate body measurements from a photo (replaces the old CV model).

    `height_cm` and `gender` come from the user's profile and give the model a real
    scale reference. The result is validated server-side (see `_apply_measurement_limits`).
    """
    config = types.GenerateContentConfig(
        system_instruction=_MEASURE_SYSTEM_PROMPT,
        response_mime_type="application/json",
        response_schema=MeasurementEstimate,
    )
    contents = [
        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        _measure_user_prompt(height_cm, gender),
    ]
    response = await _generate(settings, contents, config)
    return _apply_measurement_limits(_parse(response, MeasurementEstimate))
