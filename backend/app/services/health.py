"""Deterministic health calculations.

All numbers that matter for safety (calorie targets, floors) are computed here
on the backend. The AI model never produces calorie numbers itself
(PRD F5 / section 7).
"""
from __future__ import annotations

import math

from app.schemas import (
    ACTIVITY_FACTORS,
    BmiResult,
    BmiStandard,
    CalorieTargets,
    Gender,
    Goal,
    HealthSummary,
    IdealWeightRange,
    IndicatorRequest,
    IndicatorResult,
    Profile,
)

# Normal-BMI band endpoints per standard (PRD F2).
NORMAL_BMI_BANDS: dict[BmiStandard, tuple[float, float]] = {
    BmiStandard.who: (18.5, 24.9),
    BmiStandard.asia_pacific: (18.5, 22.9),
}

# Safe minimum calories the model can never override (PRD section 7).
SAFE_CALORIE_FLOOR: dict[Gender, int] = {
    Gender.male: 1500,
    Gender.female: 1200,
}

# Goal -> daily calorie delta from TDEE.
GOAL_DELTA: dict[Goal, int] = {
    Goal.lose: -500,
    Goal.maintain: 0,
    Goal.gain: 300,
}


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    height_m = height_cm / 100.0
    return weight_kg / (height_m * height_m)


def bmi_category(bmi: float, standard: BmiStandard) -> str:
    """Category label using the selected standard's cut-offs."""
    if standard is BmiStandard.asia_pacific:
        if bmi < 18.5:
            return "Berat badan kurang"
        if bmi < 23.0:
            return "Normal"
        if bmi < 25.0:
            return "Berisiko (pra-obesitas)"
        if bmi < 30.0:
            return "Obesitas I"
        return "Obesitas II"
    # WHO
    if bmi < 18.5:
        return "Berat badan kurang"
    if bmi < 25.0:
        return "Normal"
    if bmi < 30.0:
        return "Berat badan berlebih"
    return "Obesitas"


def ideal_weight_range(height_cm: float, standard: BmiStandard) -> IdealWeightRange:
    low, high = NORMAL_BMI_BANDS[standard]
    height_m = height_cm / 100.0
    return IdealWeightRange(
        min_kg=round(low * height_m * height_m, 1),
        max_kg=round(high * height_m * height_m, 1),
    )


def build_bmi_result(profile: Profile, standard: BmiStandard) -> BmiResult:
    bmi = calculate_bmi(profile.weight_kg, profile.height_cm)
    return BmiResult(
        bmi=round(bmi, 1),
        standard=standard,
        category=bmi_category(bmi, standard),
        ideal_weight_range=ideal_weight_range(profile.height_cm, standard),
    )


def mifflin_st_jeor_bmr(profile: Profile) -> float:
    """BMR per Mifflin-St Jeor (PRD appendix 13)."""
    base = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age
    return base + (5 if profile.gender is Gender.male else -161)


def calculate_calories(profile: Profile) -> CalorieTargets:
    bmr = mifflin_st_jeor_bmr(profile)
    tdee = bmr * ACTIVITY_FACTORS[profile.activity_level]
    raw_target = tdee + GOAL_DELTA[profile.goal]

    floor = SAFE_CALORIE_FLOOR[profile.gender]
    floor_applied = raw_target < floor
    target = max(raw_target, floor)

    # Protein target: 1.6 g/kg for muscle gain, else 1.4 g/kg (within safe range).
    protein_per_kg = 1.6 if profile.goal is Goal.gain else 1.4
    protein_g = round(protein_per_kg * profile.weight_kg)

    return CalorieTargets(
        bmr=round(bmr),
        tdee=round(tdee),
        target_calories=round(target),
        protein_g=protein_g,
        floor_applied=floor_applied,
        safe_floor=floor,
    )


def build_health_summary(profile: Profile, standard: BmiStandard) -> HealthSummary:
    return HealthSummary(
        bmi=build_bmi_result(profile, standard),
        calories=calculate_calories(profile),
    )


# --------------------------------------------------------------------------- #
# Advanced indicators (PRD F4)
# --------------------------------------------------------------------------- #
def whtr_risk_label(whtr: float) -> str:
    if whtr < 0.4:
        return "Perhatian (terlalu kurus)"
    if whtr < 0.5:
        return "Sehat"
    if whtr < 0.6:
        return "Risiko meningkat"
    return "Risiko tinggi"


def us_navy_body_fat(req: IndicatorRequest) -> float | None:
    """US Navy body-fat estimate (PRD appendix 13). Units: cm."""
    try:
        if req.gender is Gender.male:
            value = (
                86.010 * math.log10(req.waist_cm - req.neck_cm)
                - 70.041 * math.log10(req.height_cm)
                + 36.76
            )
        else:
            if req.hip_cm is None:
                return None
            value = (
                163.205 * math.log10(req.waist_cm + req.hip_cm - req.neck_cm)
                - 97.684 * math.log10(req.height_cm)
                - 78.387
            )
    except ValueError:
        # log10 of non-positive number -> inputs inconsistent.
        return None
    if not math.isfinite(value):
        return None
    return round(max(0.0, min(value, 75.0)), 1)


def build_indicators(req: IndicatorRequest) -> IndicatorResult:
    whtr = req.waist_cm / req.height_cm
    whr = round(req.waist_cm / req.hip_cm, 2) if req.hip_cm else None
    return IndicatorResult(
        whtr=round(whtr, 3),
        whtr_risk=whtr_risk_label(whtr),
        whr=whr,
        body_fat_percent=us_navy_body_fat(req),
    )
