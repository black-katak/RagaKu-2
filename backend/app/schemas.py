"""Pydantic schemas for the RagaKu API.

These schemas are the contract between the Expo frontend and the backend.
They also serve as the validation layer for AI output (PRD F5): the model's
JSON is validated against `DailyPlan`; if validation fails the backend retries
once, then returns a friendly error.
"""
from __future__ import annotations

from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


# --------------------------------------------------------------------------- #
# Shared enums
# --------------------------------------------------------------------------- #
class Gender(str, Enum):
    male = "male"
    female = "female"


class ActivityLevel(str, Enum):
    sedentary = "sedentary"
    light = "light"
    moderate = "active"
    very_active = "very_active"


class Goal(str, Enum):
    lose = "lose"
    maintain = "maintain"
    gain = "gain"


class BmiStandard(str, Enum):
    who = "who"
    asia_pacific = "asia_pacific"


# Mifflin-St Jeor activity multipliers.
ACTIVITY_FACTORS: dict[ActivityLevel, float] = {
    ActivityLevel.sedentary: 1.2,
    ActivityLevel.light: 1.375,
    ActivityLevel.moderate: 1.55,
    ActivityLevel.very_active: 1.725,
}


# --------------------------------------------------------------------------- #
# Profile / health input
# --------------------------------------------------------------------------- #
class Profile(BaseModel):
    age: int = Field(..., ge=18, le=80, description="Age in years (PRD F1: 18-80).")
    gender: Gender
    height_cm: float = Field(..., ge=120, le=220)
    weight_kg: float = Field(..., ge=30, le=250)
    activity_level: ActivityLevel = ActivityLevel.light
    goal: Goal = Goal.maintain
    diet_notes: Optional[str] = Field(default=None, max_length=200)

    @field_validator("diet_notes")
    @classmethod
    def _strip_notes(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v else v


class HealthScreening(BaseModel):
    """PRD section 7 screening gate. If any flag is true, no plan is generated."""

    is_pregnant: bool = False
    has_chronic_illness: bool = False
    has_eating_disorder_history: bool = False

    @property
    def blocked(self) -> bool:
        return (
            self.is_pregnant
            or self.has_chronic_illness
            or self.has_eating_disorder_history
        )


# --------------------------------------------------------------------------- #
# BMI / health computation output
# --------------------------------------------------------------------------- #
class IdealWeightRange(BaseModel):
    min_kg: float
    max_kg: float


class BmiResult(BaseModel):
    bmi: float
    standard: BmiStandard
    category: str
    ideal_weight_range: IdealWeightRange


class CalorieTargets(BaseModel):
    bmr: int = Field(..., description="Basal metabolic rate (Mifflin-St Jeor), kcal.")
    tdee: int = Field(..., description="Total daily energy expenditure, kcal.")
    target_calories: int = Field(
        ..., description="Goal-adjusted calories, clamped to the safe floor."
    )
    protein_g: int
    floor_applied: bool = Field(
        ..., description="True if the safe calorie floor overrode the goal target."
    )
    safe_floor: int


class HealthSummary(BaseModel):
    bmi: BmiResult
    calories: CalorieTargets


# --------------------------------------------------------------------------- #
# Advanced indicators (PRD F4)
# --------------------------------------------------------------------------- #
class IndicatorRequest(BaseModel):
    height_cm: float = Field(..., ge=120, le=220)
    gender: Gender
    waist_cm: float = Field(..., gt=0, le=250)
    neck_cm: float = Field(..., gt=0, le=120)
    hip_cm: Optional[float] = Field(default=None, gt=0, le=250)


class IndicatorResult(BaseModel):
    whtr: float = Field(..., description="Waist-to-height ratio.")
    whtr_risk: str
    whr: Optional[float] = Field(default=None, description="Waist-to-hip ratio.")
    body_fat_percent: Optional[float] = Field(
        default=None, description="US Navy body-fat estimate (%)."
    )
    note: str = "Estimasi; bukan diagnosis medis."


# --------------------------------------------------------------------------- #
# AI daily plan (PRD F5)
# --------------------------------------------------------------------------- #
class PlanRequest(BaseModel):
    profile: Profile
    screening: HealthScreening = HealthScreening()
    # Optional free-text; treated strictly as data, never as instructions
    # (PRD section 7: prompt-injection mitigation).
    preferences: Optional[str] = Field(default=None, max_length=300)


class ExerciseItem(BaseModel):
    name: str = Field(..., max_length=120)
    type: str = Field(..., max_length=60)
    duration_min: int = Field(..., ge=1, le=240)
    intensity: Literal["ringan", "sedang", "tinggi"]


class MealItem(BaseModel):
    name: str = Field(..., max_length=120)
    calories: int = Field(..., ge=0, le=3000)
    protein_g: int = Field(..., ge=0, le=300)


class MealSlot(BaseModel):
    slot: str = Field(..., max_length=40)  # e.g. Sarapan, Makan Siang
    items: list[MealItem] = Field(..., min_length=1)


class DailyPlan(BaseModel):
    """The schema the AI output must satisfy (PRD F5 validation target)."""

    summary: str = Field(..., max_length=400)
    exercises: list[ExerciseItem] = Field(..., min_length=1, max_length=10)
    meals: list[MealSlot] = Field(..., min_length=1, max_length=6)
    tips: list[str] = Field(default_factory=list, max_length=6)


class PlanResponse(BaseModel):
    date: str
    target_calories: int
    protein_g: int
    plan: DailyPlan
    cached: bool = False


# --------------------------------------------------------------------------- #
# Measurement (PRD F3)
# --------------------------------------------------------------------------- #
class MeasurementResult(BaseModel):
    waist_cm: Optional[float] = None
    hip_cm: Optional[float] = None
    arm_length_cm: Optional[float] = None
    shoulder_width_cm: Optional[float] = None
    chest_cm: Optional[float] = None
    confidence: Literal["low", "medium", "high"] = "low"
    warnings: list[str] = Field(default_factory=list)
    note: str = "Hasil adalah estimasi dari foto. Foto asli dihapus setelah diproses."


# --------------------------------------------------------------------------- #
# Generic error envelope
# --------------------------------------------------------------------------- #
class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
