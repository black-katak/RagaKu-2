"""RagaKu FastAPI application.

Endpoints:
  GET  /health                 -> liveness
  POST /api/v1/health-summary   -> BMI + ideal weight + calorie targets (F2/F5 calc)
  POST /api/v1/indicators       -> WHtR / WHR / US Navy body fat (F4)
  POST /api/v1/plan             -> AI daily plan (F5) with screening gate (section 7)
  POST /api/v1/measure          -> body measurement from photo (F3)
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
    Gender,
    HealthSummary,
    IndicatorRequest,
    IndicatorResult,
    PlanRequest,
    PlanResponse,
)
from app.services import ai_plan, health, measurement

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
        "measurement_configured": str(bool(settings.measurement_command)).lower(),
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


@app.post("/api/v1/measure")
async def measure(
    height_cm: float = Form(...),
    gender: Gender = Form(Gender.male),
    photo: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> JSONResponse:
    image_bytes = await photo.read()
    suffix = ""
    if photo.filename and "." in photo.filename:
        suffix = "." + photo.filename.rsplit(".", 1)[-1]
    try:
        result = await measurement.run_measurement(
            settings, image_bytes, height_cm, suffix or ".jpg"
        )
    except measurement.MeasurementError as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": "measurement_failed", "detail": exc.message},
        )
    return JSONResponse(status_code=200, content=result.model_dump())


@app.delete("/api/v1/data")
def delete_data() -> dict[str, str]:
    """Clear server-side cached data (PRD section 7: user's right to delete).

    The backend is otherwise stateless; the only server-side state is the
    in-memory daily plan cache.
    """
    ai_plan.clear_cache()
    return {"status": "cleared"}
