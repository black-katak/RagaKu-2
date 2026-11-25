"""RagaKu FastAPI application.

Endpoints:
  GET  /health                 -> liveness
  POST /api/v1/health-summary   -> BMI + ideal weight + calorie targets (F2/F5 calc)
  POST /api/v1/indicators       -> WHtR / WHR / US Navy body fat (F4)
  POST /api/v1/plan             -> AI daily plan (F5) with screening gate (section 7)
  POST /api/v1/measure          -> body measurements from a photo, estimated by Gemini (F3)
  POST /api/v1/estimate-body    -> height and weight from a photo, estimated by Gemini (F3)
  DELETE /api/v1/data           -> clear server-side cached data (section 7)
"""
from __future__ import annotations

from fastapi import Depends, FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.config import Settings, get_settings
from app.schemas import (
    BmiStandard,
    BodyEstimateResult,
    Gender,
    HealthSummary,
    IndicatorRequest,
    IndicatorResult,
    MeasurementResult,
    PlanRequest,
    PlanResponse,
)
from app.services import ai_plan, gemini_estimator, health

app = FastAPI(title="RagaKu API", version=__version__)


def _configure_cors(application: FastAPI, settings: Settings) -> None:
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins or ["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )


_configure_cors(app, get_settings())


@app.get("/health")
def liveness() -> dict[str, str]:
    settings = get_settings()
    return {
        "status": "ok",
        "version": __version__,
        "ai_configured": str(settings.openrouter_configured).lower(),
        "gemini_configured": str(bool(settings.gemini_api_key)).lower(),
    }


@app.post("/api/v1/health-summary", response_model=HealthSummary)
def health_summary(
    request: PlanRequest,
    standard: BmiStandard = BmiStandard.asia_pacific,
) -> HealthSummary:
    """BMI (with selectable standard), ideal weight range, and calorie targets."""
    return health.build_health_summary(request.profile, standard)


@app.post("/api/v1/indicators", response_model=IndicatorResult)
def indicators(req: IndicatorRequest) -> IndicatorResult:
    return health.build_indicators(req)


@app.post("/api/v1/plan", response_model=PlanResponse)
async def daily_plan(
    request: PlanRequest, settings: Settings = Depends(get_settings)
) -> JSONResponse | PlanResponse:
    # PRD section 7: screening gate blocks plan generation.
    if request.screening.blocked:
        return JSONResponse(
            status_code=409,
            content={
                "error": "screening_blocked",
                "detail": (
                    "Berdasarkan jawaban penyaringan kesehatan, rencana otomatis "
                    "tidak dibuat. Silakan konsultasi dengan tenaga kesehatan."
                ),
            },
        )

    targets = health.calculate_calories(request.profile)
    try:
        plan, cached = await ai_plan.generate_plan(settings, request, targets)
    except ai_plan.AIPlanError as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": "ai_plan_failed", "detail": exc.message},
        )

    import datetime as _dt

    return PlanResponse(
        date=_dt.date.today().isoformat(),
        target_calories=targets.target_calories,
        protein_g=targets.protein_g,
        plan=plan,
        cached=cached,
    )


# Photo upload limits (F3). No max-size setting exists yet.
_ALLOWED_IMAGE_TYPES = ("image/jpeg", "image/png", "image/webp")
_MAX_IMAGE_BYTES = 10 * 1024 * 1024


async def _read_photo(photo: UploadFile) -> tuple[bytes, str] | JSONResponse:
    """Validate an uploaded photo and return `(bytes, mime_type)`, or an error response.

    The image is handled purely in memory: no temp file is created, so there is
    nothing to clean up afterwards (PRD section 7).
    """
    mime_type = (photo.content_type or "").split(";", 1)[0].strip().lower()
    if mime_type not in _ALLOWED_IMAGE_TYPES:
        return JSONResponse(
            status_code=415,
            content={
                "error": "unsupported_media_type",
                "detail": "Format foto harus JPEG, PNG, atau WebP.",
            },
        )

    image_bytes = await photo.read()
    if not image_bytes:
        return JSONResponse(
            status_code=400,
            content={"error": "empty_photo", "detail": "File foto kosong."},
        )
    if len(image_bytes) > _MAX_IMAGE_BYTES:
        return JSONResponse(
            status_code=413,
            content={
                "error": "payload_too_large",
                "detail": "Ukuran foto maksimal 10 MB.",
            },
        )
    return image_bytes, mime_type


@app.post("/api/v1/measure", response_model=MeasurementResult)
async def measure(
    photo: UploadFile = File(...),
    height_cm: float = Form(170.0),
    gender: str = Form("male"),
    settings: Settings = Depends(get_settings),
) -> MeasurementResult | JSONResponse:
    """Estimate body measurements from a photo using Gemini.

    `height_cm` and `gender` give the model a real scale reference. Out-of-range
    values are replaced by sane defaults instead of failing the request.
    """
    photo_data = await _read_photo(photo)
    if isinstance(photo_data, JSONResponse):
        return photo_data
    image_bytes, mime_type = photo_data

    height = height_cm if 100.0 <= height_cm <= 240.0 else 170.0
    gender_enum = (
        Gender.female if gender.strip().lower() in ("female", "wanita") else Gender.male
    )
    return await gemini_estimator.estimate_measurements(
        settings, image_bytes, mime_type, height, gender_enum
    )


@app.post("/api/v1/estimate-body", response_model=BodyEstimateResult)
async def estimate_body(
    photo: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> BodyEstimateResult | JSONResponse:
    """Estimate height and weight from a photo using Gemini."""
    photo_data = await _read_photo(photo)
    if isinstance(photo_data, JSONResponse):
        return photo_data
    image_bytes, mime_type = photo_data

    return await gemini_estimator.estimate_body(settings, image_bytes, mime_type)


@app.delete("/api/v1/data")
def delete_data() -> dict[str, str]:
    """Clear server-side cached data (PRD section 7: user's right to delete).

    The backend is otherwise stateless; the only server-side state is the
    in-memory daily plan cache.
    """
    ai_plan.clear_cache()
    return {"status": "cleared"}
